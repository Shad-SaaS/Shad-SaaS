import crypto from "crypto";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";
import { DriverContext, NormalizedOrderRequest, NormalizedOrderResult } from "@/providers/types";
import { WalletService } from "./wallet.service";

export interface DispatchOrderResult {
  success: boolean;
  orderUuid: string;
  providerId: string;
  status: "accepted" | "rejected" | "pending" | "needs_review";
  externalOrderId?: string;
  codes?: string[];
  error?: string;
  failoverAttempted?: boolean;
}

export class ProviderOrderDispatcher {
  /**
   * Builds the DriverContext for a given provider record
   */
  private static buildContext(provider: any): DriverContext {
    let credentials: Record<string, string> = {};
    try {
      const decrypted = decrypt(provider.credentialsEncrypted);
      credentials = JSON.parse(decrypted);
    } catch {
      // Fallback if plain string or token
      credentials = { api_token: decrypt(provider.credentialsEncrypted) };
    }

    let config: Record<string, any> = {};
    if (provider.config) {
      try {
        config = typeof provider.config === "string" ? JSON.parse(provider.config) : provider.config;
      } catch {
        config = {};
      }
    }

    return {
      providerId: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      credentials,
      config,
      timeoutMs: provider.timeoutMs || 20000,
      rateLimitPerMin: provider.rateLimitPerMin ?? undefined,
    };
  }

  /**
   * Atomically dispatches a store order to external providers with strict idempotency,
   * failover support, and automatic refund guards.
   */
  static async dispatchOrder(storeOrderId: string): Promise<DispatchOrderResult> {
    const storeOrder = await prisma.order.findUnique({
      where: { id: storeOrderId },
      include: {
        product: {
          include: {
            providerProducts: {
              where: { isActive: true },
              orderBy: { priority: "asc" },
              include: { provider: true },
            },
            provider: true, // legacy relation
          },
        },
        items: true,
        user: true,
      },
    });

    if (!storeOrder) {
      throw new Error(`الطلب ${storeOrderId} غير موجود`);
    }

    // Determine available providers in priority order
    let candidateProviders: Array<{ provider: any; externalProductId: string }> = [];

    if (storeOrder.product.providerProducts.length > 0) {
      candidateProviders = storeOrder.product.providerProducts
        .filter((pp) => pp.provider.isActive)
        .map((pp) => ({
          provider: pp.provider,
          externalProductId: pp.externalProductId,
        }));
    } else if (storeOrder.product.providerId && storeOrder.product.providerProductId) {
      // Fallback to legacy single provider relation
      const legacyP = await prisma.provider.findUnique({ where: { id: storeOrder.product.providerId } });
      if (legacyP && legacyP.isActive) {
        candidateProviders = [{ provider: legacyP, externalProductId: storeOrder.product.providerProductId }];
      }
    }

    if (candidateProviders.length === 0) {
      // No active provider available
      return {
        success: false,
        orderUuid: "",
        providerId: "",
        status: "needs_review",
        error: "لا يوجد مزود نشط مرتبط بهذا المنتج حالياً",
      };
    }

    let customerInputs: Record<string, any> = {};
    try {
      customerInputs = JSON.parse(storeOrder.customerInputs || "{}");
    } catch {
      customerInputs = {};
    }

    const quantity = storeOrder.items[0]?.quantity || 1;

    // Loop through candidates for failover if safe
    for (let i = 0; i < candidateProviders.length; i++) {
      const { provider, externalProductId } = candidateProviders[i];
      const hasNextCandidate = i < candidateProviders.length - 1;

      // 1. Check existing provider_order or create new unique order_uuid
      let existingProviderOrder = await prisma.providerOrder.findFirst({
        where: {
          storeOrderId: storeOrder.id,
          providerId: provider.id,
        },
      });

      let orderUuid: string;

      if (existingProviderOrder) {
        orderUuid = existingProviderOrder.orderUuid; // Always reuse existing UUID!
        await prisma.providerOrder.update({
          where: { id: existingProviderOrder.id },
          data: { attempts: { increment: 1 } },
        });
      } else {
        orderUuid = crypto.randomUUID();
        existingProviderOrder = await prisma.providerOrder.create({
          data: {
            storeOrderId: storeOrder.id,
            providerId: provider.id,
            orderUuid,
            status: "pending",
            attempts: 1,
            requestSnapshot: JSON.stringify({ externalProductId, quantity, customerInputs }),
          },
        });
      }

      // 2. Resolve Driver from Registry
      const driver = DriverRegistry.getSupplier(provider.template);
      if (!driver) {
        console.error(`[Dispatcher] Driver template not found: ${provider.template}`);
        continue;
      }

      const ctx = this.buildContext(provider);
      const req: NormalizedOrderRequest = {
        externalProductId,
        qty: quantity,
        params: customerInputs,
        orderUuid,
      };

      console.log(`[Dispatcher] Calling ${provider.name} (${provider.template}) for order ${storeOrder.orderNumber} with uuid ${orderUuid}...`);

      const result: NormalizedOrderResult = await driver.createOrder(ctx, req);

      // 3. Process Result
      if (result.status === "accepted") {
        const deliveryNotes = result.codes.length > 0 ? `أكواد التسليم:\n${result.codes.join("\n")}` : "تم الشحن بنجاح";

        await prisma.$transaction([
          prisma.providerOrder.update({
            where: { id: existingProviderOrder.id },
            data: {
              status: "accepted",
              externalOrderId: result.externalOrderId,
              responseSnapshot: JSON.stringify(result.raw || {}),
            },
          }),
          prisma.order.update({
            where: { id: storeOrder.id },
            data: {
              status: "COMPLETED",
              deliveryNotes,
              externalOrderId: result.externalOrderId,
              providerResponse: JSON.stringify(result.raw || {}),
              statusHistory: {
                create: {
                  fromStatus: storeOrder.status,
                  toStatus: "COMPLETED",
                  note: `تم تنفيذ الطلب بنجاح عبر ${provider.name}`,
                },
              },
            },
          }),
        ]);

        return {
          success: true,
          orderUuid,
          providerId: provider.id,
          status: "accepted",
          externalOrderId: result.externalOrderId,
          codes: result.codes,
        };
      }

      if (result.status === "pending") {
        // Pending state -> Keep for polling/webhook
        await prisma.$transaction([
          prisma.providerOrder.update({
            where: { id: existingProviderOrder.id },
            data: {
              status: "pending",
              externalOrderId: result.externalOrderId,
              responseSnapshot: JSON.stringify(result.raw || {}),
            },
          }),
          prisma.order.update({
            where: { id: storeOrder.id },
            data: {
              status: "PROCESSING",
              externalOrderId: result.externalOrderId,
              statusHistory: {
                create: {
                  fromStatus: storeOrder.status,
                  toStatus: "PROCESSING",
                  note: `الطلب قيد التنفيذ لدى المزود ${provider.name}`,
                },
              },
            },
          }),
        ]);

        return {
          success: true,
          orderUuid,
          providerId: provider.id,
          status: "pending",
          externalOrderId: result.externalOrderId,
        };
      }

      // If rejected
      if (result.status === "rejected") {
        const isSafeToFailover = result.error?.safeToFailover === true;

        await prisma.providerOrder.update({
          where: { id: existingProviderOrder.id },
          data: {
            status: "rejected",
            errorCode: result.error?.internalCode || "REJECTED",
            responseSnapshot: JSON.stringify(result.raw || {}),
          },
        });

        // Failover if safe and another provider candidate exists
        if (isSafeToFailover && hasNextCandidate) {
          console.warn(`[Dispatcher] Order ${storeOrder.orderNumber} rejected with safe error (${result.error?.internalCode}). Failing over to next provider...`);
          continue;
        }

        // Final rejection: Atomic automated refund
        await prisma.$transaction(async (tx) => {
          // Check if already refunded to prevent double refund
          const currentOrder = await tx.order.findUnique({ where: { id: storeOrder.id } });
          if (currentOrder && currentOrder.refundAmount === 0 && currentOrder.status !== "CANCELLED") {
            await WalletService.creditWallet(
              storeOrder.userId,
              storeOrder.totalAmount,
              "REFUND",
              "ORDER",
              storeOrder.id,
              `استرداد تلقائي لإلغاء الطلب ${storeOrder.orderNumber} (${result.error?.message || "فشل التنفيذ لدى المزود"})`,
              tx
            );

            await tx.order.update({
              where: { id: storeOrder.id },
              data: {
                status: "CANCELLED",
                refundAmount: storeOrder.totalAmount,
                statusHistory: {
                  create: {
                    fromStatus: storeOrder.status,
                    toStatus: "CANCELLED",
                    note: `تم إلغاء الطلب واسترداد الرصيد تلقائياً: ${result.error?.message || "رفض المزود"}`,
                  },
                },
              },
            });
          }
        });

        return {
          success: false,
          orderUuid,
          providerId: provider.id,
          status: "rejected",
          error: result.error?.message || "تم رفض الطلب واسترجاع الرصيد",
        };
      }

      // On Timeout or network drop: NEVER refund immediately!
      if (result.error?.internalCode === "TIMEOUT") {
        await prisma.$transaction([
          prisma.providerOrder.update({
            where: { id: existingProviderOrder.id },
            data: {
              status: "needs_review",
              errorCode: "TIMEOUT",
            },
          }),
          prisma.order.update({
            where: { id: storeOrder.id },
            data: {
              status: "PROCESSING",
              statusHistory: {
                create: {
                  fromStatus: storeOrder.status,
                  toStatus: "PROCESSING",
                  note: "انتهت مهلة استجابة المزود. جاري التحقق من حالة الطلب آلياً...",
                },
              },
            },
          }),
        ]);

        return {
          success: false,
          orderUuid,
          providerId: provider.id,
          status: "needs_review",
          error: "انتهت مهلة الاتصال بالمزود دون تأكيد. تم وضع الطلب قيد المراجعة الآلية.",
        };
      }
    }

    return {
      success: false,
      orderUuid: "",
      providerId: "",
      status: "needs_review",
      error: "تعذر إكمال الطلب لدى أي من المزودين المتاحين",
    };
  }

  /**
   * Synchronize all pending orders across active providers (Polling Cron)
   */
  static async syncPendingOrders(): Promise<{ checked: number; updated: number }> {
    const pendingProviderOrders = await prisma.providerOrder.findMany({
      where: {
        status: { in: ["pending", "needs_review"] },
      },
      include: {
        provider: true,
        order: true,
      },
      take: 50,
    });

    let updatedCount = 0;

    for (const po of pendingProviderOrders) {
      const driver = DriverRegistry.getSupplier(po.provider.template);
      if (!driver) continue;

      const ctx = this.buildContext(po.provider);

      try {
        // Prefer checking by UUID if available, or by external ID
        const refs = po.externalOrderId ? [po.externalOrderId] : [po.orderUuid];
        const byUuid = !po.externalOrderId;

        const results = await driver.checkOrders(ctx, refs, { byUuid });
        if (results.length === 0) continue;

        const result = results[0];

        if (result.status === "accepted") {
          const deliveryNotes = result.codes.length > 0 ? `أكواد التسليم:\n${result.codes.join("\n")}` : "تم الشحن بنجاح";

          await prisma.$transaction([
            prisma.providerOrder.update({
              where: { id: po.id },
              data: {
                status: "accepted",
                externalOrderId: result.externalOrderId || po.externalOrderId,
                responseSnapshot: JSON.stringify(result.raw || {}),
              },
            }),
            prisma.order.update({
              where: { id: po.storeOrderId },
              data: {
                status: "COMPLETED",
                deliveryNotes,
                externalOrderId: result.externalOrderId || po.externalOrderId,
                statusHistory: {
                  create: {
                    fromStatus: po.order.status,
                    toStatus: "COMPLETED",
                    note: "تم تأكيد اكتمال الطلب بنجاح عبر فحص التزامن الآلي",
                  },
                },
              },
            }),
          ]);
          updatedCount++;
        } else if (result.status === "rejected") {
          await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({ where: { id: po.storeOrderId } });
            if (currentOrder && currentOrder.refundAmount === 0 && currentOrder.status !== "CANCELLED") {
              await WalletService.creditWallet(
                currentOrder.userId,
                currentOrder.totalAmount,
                "REFUND",
                "ORDER",
                currentOrder.id,
                `استرداد تلقائي لإلغاء الطلب ${currentOrder.orderNumber} بعد التحقق من المزود`,
                tx
              );

              await tx.order.update({
                where: { id: currentOrder.id },
                data: {
                  status: "CANCELLED",
                  refundAmount: currentOrder.totalAmount,
                  statusHistory: {
                    create: {
                      fromStatus: currentOrder.status,
                      toStatus: "CANCELLED",
                      note: "تم إلغاء الطلب واسترداد الرصيد آلياً بعد تأكيد رفض المزود",
                    },
                  },
                },
              });

              await tx.providerOrder.update({
                where: { id: po.id },
                data: { status: "rejected" },
              });
            }
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(`[SyncPending] Failed to check order ${po.orderUuid}:`, err);
      }
    }

    return { checked: pendingProviderOrders.length, updated: updatedCount };
  }
}
