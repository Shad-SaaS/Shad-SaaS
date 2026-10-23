import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const admin = await requireAuth("ADMIN");

    const [users, categories, products, orders, deposits, settings] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, walletBalance: true, createdAt: true } }),
      prisma.category.findMany(),
      prisma.product.findMany({ include: { variants: true, formFields: true } }),
      prisma.order.findMany({ take: 500 }),
      prisma.depositRequest.findMany({ take: 500 }),
      prisma.storeSetting.findMany(),
    ]);

    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      store: "Shad-Store",
      exportedBy: admin.email,
      data: {
        users,
        categories,
        products,
        orders,
        deposits,
        settings,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="shad-store-backup-${Date.now()}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
