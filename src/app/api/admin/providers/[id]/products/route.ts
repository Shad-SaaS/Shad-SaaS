import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientApiV1Driver } from "@/services/provider-drivers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("ADMIN");
    const { id } = await params;

    const provider = await prisma.apiProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      return NextResponse.json({ error: "المزود غير موجود" }, { status: 404 });
    }

    if (provider.template === "client_api_v1") {
      const driver = new ClientApiV1Driver(provider.baseUrl, provider.apiToken);
      try {
        const products = await driver.getProducts();
        return NextResponse.json({ success: true, products });
      } catch (err: any) {
        // Fallback demo products from the docs if API key is in demo mode or blocked by provider IP
        const sampleProducts = [
          {
            id: 365,
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
            id: 18,
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
            id: 99,
            name: "Free Fire 100+10 Diamonds",
            price: 0.85,
            params: ["معرف اللاعب Player ID"],
            category_name: "شحن ألعاب",
            available: true,
            qty_values: null,
            product_type: "package",
            base_price: 0.79,
          },
          {
            id: 140,
            name: "Telegram Premium 3 Months Gift",
            price: 8.5,
            params: ["يوزر حساب التيليجرام"],
            category_name: "اشتراكات وتطبيقات",
            available: true,
            qty_values: null,
            product_type: "package",
            base_price: 8.0,
          },
        ];
        return NextResponse.json({
          success: true,
          products: sampleProducts,
          isSample: true,
          notice: `تم عرض نماذج الوثائق (${err.message})`,
        });
      }
    }

    return NextResponse.json({ success: true, products: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
