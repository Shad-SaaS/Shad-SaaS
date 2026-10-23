import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await req.json();

    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "بيانات الإعدادات غير صالحة" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.storeSetting.upsert({
        where: { id: key },
        update: { value: String(value) },
        create: { id: key, value: String(value) },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_STORE_SETTINGS",
        userId: admin.id,
        details: `تحديث إعدادات المتجر العامة والهوية (اسم المتجر، الشعار، العملة)`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ إعدادات المتجر والشعار بنجاح دون الحاجة لأي تدخل برمجي!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل حفظ الإعدادات" },
      { status: 400 }
    );
  }
}
