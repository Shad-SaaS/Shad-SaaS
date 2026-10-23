import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WalletService } from "@/services/wallet.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth("ADMIN");
    const { id } = await params;

    const result = await WalletService.approveDeposit(id, admin.id);

    return NextResponse.json({
      success: true,
      deposit: result,
      message: "تم اعتماد طلب الشحن وإضافة الرصيد إلى محفظة العميل بنجاح",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل اعتماد طلب الشحن" },
      { status: 400 }
    );
  }
}
