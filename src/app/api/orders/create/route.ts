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

    // If product is linked to API Provider, dispatch immediately
    if (order.product?.providerType === "API") {
      const { ProviderOrderDispatcher } = await import("@/services/provider-order.dispatcher");
      try {
        const dispatchResult = await ProviderOrderDispatcher.dispatchOrder(order.id);
        console.log(`[OrderCreate] Dispatched order ${order.orderNumber}: status = ${dispatchResult.status}`);
      } catch (dispatchErr) {
        console.error(`[OrderCreate] Dispatch failed for order ${order.orderNumber}:`, dispatchErr);
      }
    }

    // Refresh order data
    const finalOrder = await (await import("@/lib/db")).prisma.order.findUnique({
      where: { id: order.id },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: finalOrder?.id || order.id,
        orderNumber: finalOrder?.orderNumber || order.orderNumber,
        totalAmount: finalOrder?.totalAmount || order.totalAmount,
        status: finalOrder?.status || order.status,
        deliveryNotes: finalOrder?.deliveryNotes,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء معالجة الطلب" },
      { status: 400 }
    );
  }
}
