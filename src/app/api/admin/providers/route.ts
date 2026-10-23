import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientApiV1Driver } from "@/services/provider-drivers";

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const providers = await prisma.apiProvider.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json({ success: true, providers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await req.json();
    const { name, code, template = "client_api_v1", baseUrl, apiToken, currency = "USD" } = body;

    if (!name || !code || !baseUrl || !apiToken) {
      return NextResponse.json({ error: "جميع الحقول الأساسية مطلوبة" }, { status: 400 });
    }

    const provider = await prisma.apiProvider.upsert({
      where: { code: code.trim().toLowerCase() },
      update: {
        name: name.trim(),
        template,
        baseUrl: baseUrl.trim(),
        apiToken: apiToken.trim(),
        currency: currency.trim(),
      },
      create: {
        name: name.trim(),
        code: code.trim().toLowerCase(),
        template,
        baseUrl: baseUrl.trim(),
        apiToken: apiToken.trim(),
        currency: currency.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPSERT_API_PROVIDER",
        userId: admin.id,
        details: `إضافة أو تحديث مزود API: ${provider.name} (${provider.code})`,
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
