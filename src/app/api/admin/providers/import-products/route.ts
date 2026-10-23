import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const admin = await requireAuth("ADMIN");
    const { providerId, categoryId, profitMarginPercent = 15, exchangeRate = 14500, products } = await req.json();

    if (!providerId || !categoryId || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "بيانات الاستيراد غير مكتملة" }, { status: 400 });
    }

    let importedCount = 0;

    for (const p of products) {
      const slug = `api-${p.id}-${Date.now().toString().slice(-4)}`;
      const costUsd = Number(p.price) || 0;
      const profitMultiplier = 1 + (Number(profitMarginPercent) || 15) / 100;
      const sellPriceSyp = Math.round(costUsd * exchangeRate * profitMultiplier);

      const fieldLabel = p.params && p.params[0] ? p.params[0] : "معرف الحساب / Player ID";

      const createdProduct = await prisma.product.create({
        data: {
          categoryId,
          name: p.name,
          slug,
          shortDesc: `خدمة فورية مستوردة عبر API المزود (معرف: ${p.id})`,
          description: `شحن فوري ومباشر بالمعرف المطلوب عبر المزود. لا نطلب كلمة المرور.`,
          minPrice: sellPriceSyp,
          costPrice: costUsd,
          executionTime: "5 - 15 دقيقة",
          providerId,
          providerProductId: String(p.id),
          providerType: "API",
          variants: {
            create: [
              {
                name: p.name,
                price: sellPriceSyp,
                costPrice: costUsd,
                originalPrice: Math.round(sellPriceSyp * 1.15),
              },
            ],
          },
          formFields: {
            create: [
              {
                fieldName: "player_id",
                label: fieldLabel,
                fieldType: "text",
                placeholder: fieldLabel,
                isRequired: true,
              },
            ],
          },
          providerProducts: {
            create: [
              {
                providerId,
                externalProductId: String(p.id),
                costOverride: costUsd,
                priority: 1,
                isActive: true,
              },
            ],
          },
        },
      });

      importedCount++;
    }

    await prisma.auditLog.create({
      data: {
        action: "IMPORT_API_PRODUCTS",
        userId: admin.id,
        details: `استيراد ${importedCount} منتج من مزود API بنجاح`,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount,
      message: `تم استيراد ${importedCount} منتج بنجاح وإضافتها للمتجر مع الباقات وحقول الإدخال!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
