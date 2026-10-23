import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";
import { DriverContext } from "@/providers/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("ADMIN");
    const { id } = await params;

    // Check new Provider model first, fallback to ApiProvider
    const provider =
      (await prisma.provider.findUnique({ where: { id } })) ||
      (await prisma.apiProvider.findUnique({ where: { id } }));

    if (!provider) {
      return NextResponse.json({ error: "المزود غير موجود" }, { status: 404 });
    }

    const template = provider.template || "client_api_v1";
    const driver = DriverRegistry.getSupplier(template);

    // If it's a payment provider (like Sam API)
    if (!driver && DriverRegistry.hasPayment(template)) {
      const paymentDriver = DriverRegistry.getPayment(template)!;
      let apiKey = "";
      try {
        const creds = JSON.parse(decrypt((provider as any).credentialsEncrypted || (provider as any).apiToken));
        apiKey = creds.api_key || creds.apiKey || "";
      } catch {
        apiKey = decrypt((provider as any).credentialsEncrypted || (provider as any).apiToken);
      }

      let config: Record<string, any> = {};
      const rawPayConfig = (provider as any).config || (provider as any).configJson;
      try {
        config = typeof rawPayConfig === "string" ? JSON.parse(rawPayConfig) : rawPayConfig || {};
      } catch {
        config = {};
      }

      try {
        const wallets = await paymentDriver.getWallets({
          providerId: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          siteUrl: config.site_url || "https://www.sam-api.pro",
          apiKey,
          config,
          timeoutMs: (provider as any).timeoutMs || 15000,
        });

        return NextResponse.json({
          success: true,
          balance: 0,
          message: `تم الاتصال ببوابة الدفع بنجاح. عدد المحافظ المربوطة: ${wallets.length} محفظة.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `فشل الاتصال ببوابة الدفع: ${err.message}`,
        });
      }
    }

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: `قالب المزود (${template}) غير مسجل في النظام`,
      });
    }

    // Build DriverContext
    let credentials: Record<string, string> = {};
    const rawCreds = (provider as any).credentialsEncrypted || (provider as any).apiToken;
    try {
      const decrypted = decrypt(rawCreds);
      credentials = JSON.parse(decrypted);
    } catch {
      credentials = { api_token: decrypt(rawCreds), api_key: decrypt(rawCreds) };
    }

    let config: Record<string, any> = {};
    const rawConfig = (provider as any).config || (provider as any).configJson;
    if (rawConfig) {
      try {
        config = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
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
      timeoutMs: (provider as any).timeoutMs || 20000,
      rateLimitPerMin: (provider as any).rateLimitPerMin ?? undefined,
    };

    // Test connection & get balance
    const testResult = await driver.testConnection(ctx);

    if (testResult.ok && testResult.balance) {
      // Update balance in database
      try {
        await prisma.provider.update({
          where: { id: provider.id },
          data: {
            lastBalance: testResult.balance.balance,
            lastBalanceAt: new Date(),
            lastError: null,
          },
        });
      } catch {
        // Fallback for legacy apiProvider table
        await prisma.apiProvider.update({
          where: { id: provider.id },
          data: {
            balance: testResult.balance.balance,
            lastSyncAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        balance: testResult.balance.balance,
        currency: testResult.balance.currency || "USD",
        email: testResult.balance.email,
        message: testResult.message,
      });
    }

    return NextResponse.json({
      success: false,
      error: testResult.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
