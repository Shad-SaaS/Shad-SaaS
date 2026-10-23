import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OrderService } from "@/services/order.service";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لإتمام عملية الشراء" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, variantId, quantity = 1, couponCode, customerInputs } = body;

    if (!productId || !variantId || !customerInputs) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }

    const order = await OrderService.createOrder({
      userId: user.id,
      productId,
      variantId,
      quantity: Number(quantity) || 1,
      couponCode: couponCode ? String(couponCode).trim() : undefined,
      customerInputs,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء معالجة الطلب" },
      { status: 400 }
    );
  }
}
