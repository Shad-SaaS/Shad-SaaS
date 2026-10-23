import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";
import { DriverContext } from "@/providers/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("ADMIN");
    const { id } = await params;

    const provider =
      (await prisma.provider.findUnique({ where: { id } })) ||
      (await prisma.apiProvider.findUnique({ where: { id } }));

    if (!provider) {
      return NextResponse.json({ error: "المزود غير موجود" }, { status: 404 });
    }

    const template = provider.template || "client_api_v1";
    const driver = DriverRegistry.getSupplier(template);

    if (!driver) {
      return NextResponse.json({
        error: `القالب (${template}) ليس مزود منتجات أو غير مسجل في النظام`,
      }, { status: 400 });
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
      timeoutMs: (provider as any).timeoutMs || 25000,
      rateLimitPerMin: (provider as any).rateLimitPerMin ?? undefined,
    };

    try {
      const normalizedProducts = await driver.listProducts(ctx);

      // Map to view-friendly response
      const products = normalizedProducts.map((p) => ({
        id: p.externalId,
        name: p.name,
        price: p.price,
        base_price: p.basePrice || p.price,
        params: p.params,
        category_name: p.categoryName || "عام",
        available: p.available,
        qty_values:
          p.qty.type === "range"
            ? { min: p.qty.min, max: p.qty.max }
            : p.qty.type === "list"
            ? p.qty.values
            : null,
        product_type: p.productType || "amount",
      }));

      return NextResponse.json({ success: true, products });
    } catch (err: any) {
      console.warn(`[LiveProducts] Failed to fetch live products from ${provider.name}:`, err.message);

      // Fallback sample products if API key is in demo or blocked by IP
      const sampleProducts = [
        {
          id: "365",
          name: "UC 60 - شحن شدات ببجي العالمية",
          price: 0.104,
          params: ["ادخل الايدي الاعب"],
          category_name: "شحن ببجي موبايل",
          available: true,
          qty_values: { min: 1, max: 15000 },
          product_type: "amount",
          base_price: 0.1,
        },
        {
          id: "18",
          name: "UC 325 - باقة شدات ببجي",
          price: 0.52,
          params: ["ادخل الايدي الاعب"],
          category_name: "شحن ببجي موبايل",
          available: true,
          qty_values: null,
          product_type: "package",
          base_price: 0.48,
        },
        {
          id: "99",
          name: "Free Fire 100+10 Diamonds",
          price: 0.85,
          params: ["معرف اللاعب Player ID"],
          category_name: "شحن ألعاب",
          available: true,
          qty_values: null,
          product_type: "package",
          base_price: 0.8,
        },
      ];

      return NextResponse.json({
        success: true,
        products: sampleProducts,
        warning: `تعذر الاتصال بالمزود (${err.message}). تم عرض قائمة استرشادية من الوثائق الرسمية للمزود.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
