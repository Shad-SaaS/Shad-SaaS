import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { OrderService } from "@/services/order.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth("ADMIN");
    const { id } = await params;
    const body = await req.json();

    const { status, note, partialRefundAmount, deliveryNotes, refundToWallet = true } = body;

    if (!status) {
      return NextResponse.json({ error: "الحالة الجديدة مطلوبة" }, { status: 400 });
    }

    const updated = await OrderService.updateOrderStatus(
      id,
      status,
      note,
      admin.id,
      refundToWallet
        ? (status === "PARTIAL" ? Number(partialRefundAmount) : undefined)
        : 0,
      deliveryNotes
    );

    return NextResponse.json({
      success: true,
      order: updated,
      message: `تم تحديث حالة الطلب إلى ${status} بنجاح ${refundToWallet && status === "CANCELLED" ? "وتم استرداد كامل المبلغ لمحفظة العميل" : ""}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل تحديث حالة الطلب" },
      { status: 400 }
    );
  }
}
