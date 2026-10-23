import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";
import { DriverContext } from "@/providers/types";
import { WalletService } from "@/services/wallet.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const { providerId } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive) {
      return NextResponse.json({ error: "المزود غير موجود أو غير نشط" }, { status: 404 });
    }

    const rawBody = await req.text();
    let bodyJson: any = null;
    try {
      bodyJson = JSON.parse(rawBody);
    } catch {
      bodyJson = null;
    }

    const headersRecord: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersRecord[key.toLowerCase()] = value;
    });

    const driver = DriverRegistry.getSupplier(provider.template);
    if (!driver) {
      return NextResponse.json({ error: "قالب المزود غير مسجل" }, { status: 400 });
    }

    // Build DriverContext
    let credentials: Record<string, string> = {};
    try {
      credentials = JSON.parse(decrypt(provider.credentialsEncrypted));
    } catch {
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

    const ctx: DriverContext = {
      providerId: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      credentials,
      config,
      timeoutMs: provider.timeoutMs,
      rateLimitPerMin: provider.rateLimitPerMin ?? undefined,
    };

    // Verify Webhook Signature if supported
    let signatureValid = true;
    if (typeof driver.verifyWebhook === "function") {
      signatureValid = driver.verifyWebhook(ctx, rawBody, headersRecord);
      if (!signatureValid) {
        console.warn(`[Webhook] Invalid signature for provider ${provider.name} (${provider.id})`);
        await prisma.providerWebhookEvent.create({
          data: {
            providerId: provider.id,
            payload: rawBody.slice(0, 5000),
            signatureValid: false,
            processed: false,
          },
        });
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    // Save event for Idempotency
    const webhookEvent = await prisma.providerWebhookEvent.create({
      data: {
        providerId: provider.id,
        payload: rawBody.slice(0, 5000),
        signatureValid: true,
        processed: false,
      },
    });

    // Parse payload and update matching order
    if (typeof driver.parseWebhook === "function" && bodyJson) {
      const parsed = driver.parseWebhook(ctx, bodyJson);

      if (parsed.externalOrderId) {
        const po = await prisma.providerOrder.findFirst({
          where: {
            providerId: provider.id,
            externalOrderId: parsed.externalOrderId,
          },
          include: { order: true },
        });

        if (po) {
          if (parsed.status === "accepted" && po.status !== "accepted") {
            const deliveryNotes = parsed.codes.length > 0 ? `أكواد التسليم:\n${parsed.codes.join("\n")}` : "تم الشحن بنجاح";

            await prisma.$transaction([
              prisma.providerOrder.update({
                where: { id: po.id },
                data: {
                  status: "accepted",
                  responseSnapshot: rawBody.slice(0, 5000),
                },
              }),
              prisma.order.update({
                where: { id: po.storeOrderId },
                data: {
                  status: "COMPLETED",
                  deliveryNotes,
                  statusHistory: {
                    create: {
                      fromStatus: po.order.status,
                      toStatus: "COMPLETED",
                      note: `تم تحديث حالة الطلب إلى مكتمل عبر Webhook المزود ${provider.name}`,
                    },
                  },
                },
              }),
              prisma.providerWebhookEvent.update({
                where: { id: webhookEvent.id },
                data: { processed: true },
              }),
            ]);
          } else if (parsed.status === "rejected" && po.status !== "rejected") {
            await prisma.$transaction(async (tx) => {
              const currentOrder = await tx.order.findUnique({ where: { id: po.storeOrderId } });
              if (currentOrder && currentOrder.refundAmount === 0 && currentOrder.status !== "CANCELLED") {
                await WalletService.creditWallet(
                  currentOrder.userId,
                  currentOrder.totalAmount,
                  "REFUND",
                  "ORDER",
                  currentOrder.id,
                  `استرداد تلقائي لإلغاء الطلب ${currentOrder.orderNumber} عبر إشعار المزود`,
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
                        note: `تم إلغاء الطلب واسترداد الرصيد عبر Webhook المزود ${provider.name}`,
                      },
                    },
                  },
                });

                await tx.providerOrder.update({
                  where: { id: po.id },
                  data: { status: "rejected" },
                });

                await tx.providerWebhookEvent.update({
                  where: { id: webhookEvent.id },
                  data: { processed: true },
                });
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
