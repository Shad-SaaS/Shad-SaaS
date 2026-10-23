import {
  PaymentProvider,
  PaymentDriverContext,
  NormalizedWallet,
  NormalizedWalletBalance,
  NormalizedWalletTransaction,
  CreateInvoiceRequest,
  NormalizedInvoice,
  VerifyInvoiceResult,
} from "../payment-types";
import { FieldSchema } from "../types";
import { createNormalizedError } from "../errors";

export class SamApiPaymentDriver implements PaymentProvider {
  readonly template: string = "samapi_payments";

  readonly configSchema: FieldSchema[] = [
    {
      key: "api_key",
      label: "مفتاح API الخاص بسام (sk_...)",
      type: "password",
      required: true,
      description: "المفتاح السري المقدم من منصة sam-api.pro",
    },
    {
      key: "site_url",
      label: "رابط الموقع الأساسي لصفحات الدفع",
      type: "text",
      required: false,
      defaultValue: "https://www.sam-api.pro",
      description: "العنوان الأساسي لنقاط /pay بدون /api (الافتراضي: https://www.sam-api.pro)",
    },
    {
      key: "transfers_enabled",
      label: "تفعيل التحويلات المباشرة",
      type: "boolean",
      required: false,
      defaultValue: false,
      description: "مغلق افتراضياً لدواعي الأمان المالي لمنع تحويل أرصدة حقيقية آلياً",
    },
  ];

  private getAuthHeaders(ctx: PaymentDriverContext): Record<string, string> {
    const key = ctx.apiKey || ctx.config?.api_key || "";
    return {
      Authorization: `Bearer ${key.trim()}`,
      "X-Api-Key": key.trim(),
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Shad-Store-SamPaymentClient/1.0",
    };
  }

  private getSiteUrl(ctx: PaymentDriverContext): string {
    return (ctx.siteUrl || ctx.config?.site_url || "https://www.sam-api.pro").replace(/\/+$/, "");
  }

  private getApiBaseUrl(ctx: PaymentDriverContext): string {
    const base = ctx.baseUrl || "https://www.sam-api.pro/api";
    return base.replace(/\/+$/, "");
  }

  /**
   * 1. Get all connected wallets (ShamCash & Syriatel Cash)
   */
  async getWallets(ctx: PaymentDriverContext): Promise<NormalizedWallet[]> {
    const url = `${this.getApiBaseUrl(ctx)}/v1/wallets`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(ctx),
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    if (!res.ok) {
      throw createNormalizedError(res.status === 401 ? "AUTH_FAILED" : "UNKNOWN", {
        providerCode: res.status,
        message: `فشل جلب المحافظ من Sam API: HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    return items.map((w: any): NormalizedWallet => ({
      id: w.id,
      provider: w.provider || "shamcash",
      providerDisplayName: w.providerDisplayName || w.label || w.provider,
      label: w.label,
      phone: w.phone,
      walletAddress: w.walletAddress,
      accountNumber: w.accountNumber,
      region: w.region,
      cashCode: w.cashCode,
      status: w.status || "active",
    }));
  }

  /**
   * 2. Get wallet balance by wallet reference and method
   */
  async getBalance(ctx: PaymentDriverContext, walletRef: string, method = "shamcash"): Promise<NormalizedWalletBalance[]> {
    const endpoint =
      method === "syriatel"
        ? `/v1/wallets/syriatel/${encodeURIComponent(walletRef)}/balance`
        : `/v1/wallets/shamcash/${encodeURIComponent(walletRef)}/balance`;

    const url = `${this.getApiBaseUrl(ctx)}${endpoint}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(ctx),
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    if (!res.ok) {
      throw createNormalizedError(res.status === 401 ? "AUTH_FAILED" : "UNKNOWN", {
        providerCode: res.status,
        message: `فشل جلب رصيد المحفظة: HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    return items.map((b: any): NormalizedWalletBalance => ({
      currency: b.currency || "SYP",
      amount: Number(b.amount || 0),
      label: b.label || null,
    }));
  }

  /**
   * 3. Get transactions for wallet
   */
  async getTransactions(
    ctx: PaymentDriverContext,
    walletRef: string,
    direction: "in" | "out" | "all" = "all",
    method = "shamcash"
  ): Promise<NormalizedWalletTransaction[]> {
    const endpoint =
      method === "syriatel"
        ? `/v1/wallets/syriatel/${encodeURIComponent(walletRef)}/transactions?direction=${direction}`
        : `/v1/wallets/shamcash/${encodeURIComponent(walletRef)}/transactions?direction=${direction}`;

    const url = `${this.getApiBaseUrl(ctx)}${endpoint}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(ctx),
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    if (!res.ok) {
      throw createNormalizedError(res.status === 401 ? "AUTH_FAILED" : "UNKNOWN", {
        providerCode: res.status,
        message: `فشل جلب المعاملات: HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    return items.map((t: any): NormalizedWalletTransaction => ({
      id: String(t.id),
      type: t.type || "credit",
      amount: Number(t.amount || 0),
      currency: t.currency || "SYP",
      counterparty: t.counterparty || null,
      description: t.description || null,
      status: t.status || null,
      occurredAt: t.occurredAt || new Date().toISOString(),
    }));
  }

  /**
   * 4. Create Invoice (POST /v1/invoices) - valid for 15 minutes
   */
  async createInvoice(ctx: PaymentDriverContext, req: CreateInvoiceRequest): Promise<NormalizedInvoice> {
    const url = `${this.getApiBaseUrl(ctx)}/v1/invoices`;

    const body = {
      method: req.method,
      identifier: req.identifier,
      amount: String(req.amount),
      currency: req.currency,
      webhookUrl: req.webhookUrl,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(ctx),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ctx.timeoutMs || 20000),
    });

    const data = await res.json();

    if (!res.ok) {
      throw createNormalizedError("VALIDATION_ERROR", {
        providerCode: res.status,
        message: data.message || `فشل إنشاء الفاتورة: HTTP ${res.status}`,
      });
    }

    return {
      id: data.invoiceId,
      method: req.method,
      identifier: req.identifier,
      amount: String(req.amount),
      currency: req.currency,
      status: "pending",
      paymentUrl: data.paymentUrl,
      expiresAt: data.expiresAt,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 5. Get Invoice Details (GET /pay/{invoiceId} without auth!)
   */
  async getInvoice(ctx: PaymentDriverContext, invoiceId: string): Promise<NormalizedInvoice> {
    const url = `${this.getSiteUrl(ctx)}/pay/${encodeURIComponent(invoiceId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    if (!res.ok) {
      throw createNormalizedError(res.status === 404 ? "PRODUCT_NOT_FOUND" : "UNKNOWN", {
        providerCode: res.status,
        message: `فشل جلب بيانات الفاتورة: HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    return {
      id: data.id,
      method: data.method,
      identifier: data.identifier,
      amount: String(data.amount),
      currency: data.currency,
      status: data.status || "pending",
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      paidAt: data.paidAt,
    };
  }

  /**
   * 6. Verify Invoice with Customer's transactionRef (POST /pay/{invoiceId}/verify without auth!)
   * Searches for the transaction in the receiving wallet's transaction ledger.
   */
  async verifyInvoice(
    ctx: PaymentDriverContext,
    invoiceId: string,
    transactionRef: string
  ): Promise<VerifyInvoiceResult> {
    const url = `${this.getSiteUrl(ctx)}/pay/${encodeURIComponent(invoiceId)}/verify`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ transactionRef: transactionRef.trim() }),
      signal: AbortSignal.timeout(ctx.timeoutMs || 25000),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { verified: false, message: `تعذر قراءة رد الخادم: HTTP ${res.status}` };
    }

    if (res.status === 410 || data.code === "EXPIRED") {
      return {
        verified: false,
        message: "انتهت صلاحية الفاتورة (صلاحيتها 15 دقيقة)",
        code: "EXPIRED",
      };
    }

    return {
      verified: data.verified === true,
      message: data.message || (data.verified ? "تم التحقق من الدفع بنجاح" : "رقم العملية غير موجود في سجل المحفظة"),
      transactionRef: transactionRef.trim(),
      paidAmount: data.paidAmount,
      paidCurrency: data.currency,
    };
  }

  /**
   * 7. Webhook Payload Parsing for payment notifications
   */
  parseWebhook(
    ctx: PaymentDriverContext,
    body: any
  ): {
    event: "invoice.paid" | "invoice.expired" | string;
    invoiceId: string;
    method: string;
    identifier: string;
    amount: string;
    currency: string;
    transactionRef?: string;
    paidAmount?: number;
    counterparty?: string;
    paidAt?: string;
    expiredAt?: string;
  } {
    return {
      event: body.event || (body.status === "paid" ? "invoice.paid" : "invoice.expired"),
      invoiceId: body.invoiceId || body.id,
      method: body.method,
      identifier: body.identifier,
      amount: String(body.amount),
      currency: body.currency,
      transactionRef: body.transactionRef,
      paidAmount: body.paidAmount ? Number(body.paidAmount) : undefined,
      counterparty: body.counterparty,
      paidAt: body.paidAt,
      expiredAt: body.expiredAt,
    };
  }
}
