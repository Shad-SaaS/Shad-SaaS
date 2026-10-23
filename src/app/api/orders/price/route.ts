import { NextResponse } from "next/server";
import { OrderService } from "@/services/order.service";

export async function POST(req: Request) {
  try {
    const { productId, variantId, quantity = 1, couponCode } = await req.json();

    if (!productId || !variantId) {
      return NextResponse.json({ error: "معرف الخدمة والباقة مطلوب" }, { status: 400 });
    }

    const result = await OrderService.validateAndCalculatePricing(
      productId,
      variantId,
      Number(quantity) || 1,
      couponCode
    );

    return NextResponse.json({
      success: true,
      rawTotal: result.rawTotal,
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal,
      couponApplied: result.validCoupon
        ? {
            code: result.validCoupon.code,
            type: result.validCoupon.discountType,
            value: result.validCoupon.discountValue,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل احتساب السعر" },
      { status: 400 }
    );
  }
}
