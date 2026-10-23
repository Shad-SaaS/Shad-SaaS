import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientApiV1Driver } from "@/services/provider-drivers";

export async function POST(
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
        const profile = await driver.getProfile();

        // Update stored balance
        await prisma.apiProvider.update({
          where: { id },
          data: {
            balance: profile.balance,
            lastSyncAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          balance: profile.balance,
          email: profile.email,
          message: `تم جلب الرصيد بنجاح: ${profile.balance} ${provider.currency}`,
        });
      } catch (err: any) {
        // Return demo response if real key is not yet configured or endpoint unreachable
        return NextResponse.json({
          success: false,
          error: `تعذر الاتصال بالمزود (${err.message}). تحقق من صحة الـ API Token أو قيود الـ IP.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      balance: provider.balance,
      message: "مزود دفع / محفظة",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
