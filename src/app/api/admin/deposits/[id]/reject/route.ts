import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WalletService } from "@/services/wallet.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth("ADMIN");
    const { id } = await params;
    const { reason } = await req.json();

    const result = await WalletService.rejectDeposit(id, reason, admin.id);

    return NextResponse.json({
      success: true,
      deposit: result,
      message: "تم رفض طلب الشحن وتدوين السبب بنجاح",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل رفض طلب الشحن" },
      { status: 400 }
    );
  }
}
