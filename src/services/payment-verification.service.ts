import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";
import { PaymentDriverContext } from "@/providers/payment-types";
import { WalletService } from "./wallet.service";

export interface VerifyDepositResult {
  success: boolean;
  verified: boolean;
  approved: boolean;
  message: string;
  transactionRef?: string;
}

export class PaymentVerificationService {
  /**
   * Builds the PaymentDriverContext for the active Sam API provider
   */
  private static async getSamApiContext(): Promise<{ driver: any; ctx: PaymentDriverContext } | null> {
    const provider = await prisma.provider.findFirst({
      where: {
        template: "samapi_payments",
        isActive: true,
      },
      orderBy: { priority: "asc" },
    });

    if (!provider) {
      return null;
    }

    const driver = DriverRegistry.getPayment("samapi_payments");
    if (!driver) {
      return null;
    }

    let apiKey = "";
    try {
      const creds = JSON.parse(decrypt(provider.credentialsEncrypted));
      apiKey = creds.api_key || creds.apiKey || "";
    } catch {
      apiKey = decrypt(provider.credentialsEncrypted);
    }

    let config: Record<string, any> = {};
    if (provider.config) {
      try {
        config = typeof provider.config === "string" ? JSON.parse(provider.config) : provider.config;
      } catch {
        config = {};
      }
    }

    const ctx: PaymentDriverContext = {
      providerId: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl || "https://www.sam-api.pro/api",
      siteUrl: config.site_url || "https://www.sam-api.pro",
      apiKey,
      config,
      timeoutMs: provider.timeoutMs || 20000,
    };

    return { driver, ctx };
  }

  /**
   * Automated verification of a deposit request using Sam API
   * Strictly enforces anti-fraud checks (Double-spending guard on transactionRef).
   */
  static async verifyDepositRequest(depositId: string, invoiceId?: string): Promise<VerifyDepositResult> {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit) {
      return { success: false, verified: false, approved: false, message: "طلب الشحن غير موجود" };
    }

    if (deposit.status !== "PENDING") {
      return {
        success: false,
        verified: false,
        approved: false,
        message: `طلب الشحن بحالة (${deposit.status}) مسبقاً`,
      };
    }

    const transactionRef = deposit.referenceNumber?.trim();
    if (!transactionRef) {
      return {
        success: false,
        verified: false,
        approved: false,
        message: "رقم المعاملة / الحوالة مفقود في هذا الطلب",
      };
    }

    // -------------------------------------------------------------
    // ANTI-FRAUD GUARD: Double-Spending / Replay Prevention
    // Check if this transactionRef has EVER been approved in any past deposit!
    // -------------------------------------------------------------
    const existingApproved = await prisma.depositRequest.findFirst({
      where: {
        referenceNumber: transactionRef,
        status: "APPROVED",
        id: { not: deposit.id },
      },
    });

    if (existingApproved) {
      console.warn(`[AntiFraud] Blocked attempt to reuse transactionRef ${transactionRef} (Already approved in deposit ${existingApproved.depositNumber})`);
      return {
        success: false,
        verified: false,
        approved: false,
        message: "تم رفض العملية: رقم الحوالة تم استخدامه واعتماده مسبقاً لمنع الشحن المزدوج.",
      };
    }

    // Resolve Sam API provider
    const samInfo = await this.getSamApiContext();
    if (!samInfo) {
      return {
        success: false,
        verified: false,
        approved: false,
        message: "بوابة التحقق الآلي (Sam API) غير مفعلة حالياً في النظام",
      };
    }

    const { driver, ctx } = samInfo;

    // Target invoice ID: either passed directly or stored in receiptImageUrl/note
    const targetInvoiceId = invoiceId || deposit.receiptImageUrl;
    if (!targetInvoiceId) {
      return {
        success: false,
        verified: false,
        approved: false,
        message: "معرف الفاتورة مفقود للتحقق عبر Sam API",
      };
    }

    try {
      console.log(`[PaymentVerification] Verifying invoice ${targetInvoiceId} with ref ${transactionRef}...`);
      const verifyResult = await driver.verifyInvoice(ctx, targetInvoiceId, transactionRef);

      if (!verifyResult.verified) {
        return {
          success: true,
          verified: false,
          approved: false,
          message: verifyResult.message || "رقم العملية غير مطابق في سجل معاملات المحفظة",
          transactionRef,
        };
      }

      // Verified! Atomically approve deposit and credit customer wallet
      await WalletService.approveDeposit(deposit.id, "system_sam_api");
      console.log(`[PaymentVerification] Deposit ${deposit.depositNumber} automatically verified & credited for user ${deposit.userId}!`);

      return {
        success: true,
        verified: true,
        approved: true,
        message: "تم التحقق من الحوالة بنجاح وشحن الرصيد آلياً للمحفظة",
        transactionRef,
      };
    } catch (err: any) {
      console.error("[PaymentVerification Error]:", err);
      return {
        success: false,
        verified: false,
        approved: false,
        message: `حدث خطأ أثناء الاتصال بمزود الدفع: ${err.message}`,
      };
    }
  }

  /**
   * Handle webhook notification (invoice.paid) from Sam API
   */
  static async handleInvoicePaidWebhook(payload: any): Promise<{ processed: boolean; message: string }> {
    const invoiceId = payload.invoiceId || payload.id;
    const transactionRef = payload.transactionRef?.trim();

    if (!invoiceId) {
      return { processed: false, message: "Missing invoiceId in webhook" };
    }

    // Find pending deposit request associated with this invoice or transactionRef
    const deposit = await prisma.depositRequest.findFirst({
      where: {
        OR: [
          { receiptImageUrl: invoiceId },
          { referenceNumber: transactionRef || "___non_matching___" },
        ],
        status: "PENDING",
      },
    });

    if (!deposit) {
      return { processed: false, message: "No matching pending deposit found" };
    }

    if (transactionRef) {
      // Check anti-fraud
      const duplicate = await prisma.depositRequest.findFirst({
        where: {
          referenceNumber: transactionRef,
          status: "APPROVED",
          id: { not: deposit.id },
        },
      });

      if (duplicate) {
        console.warn(`[AntiFraud Webhook] TransactionRef ${transactionRef} already used in deposit ${duplicate.depositNumber}`);
        return { processed: false, message: "Duplicate transactionRef blocked" };
      }
    }

    // Approve deposit
    await WalletService.approveDeposit(deposit.id, "system_sam_webhook");
    return { processed: true, message: `Deposit ${deposit.depositNumber} approved via webhook` };
  }
}
