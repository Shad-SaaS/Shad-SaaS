import { prisma } from "@/lib/db";
import { WalletService } from "./wallet.service";

export interface CreateOrderInput {
  userId: string;
  productId: string;
  variantId: string;
  quantity?: number;
  couponCode?: string;
  customerInputs: Record<string, string>;
}

export class OrderService {
  /**
   * Generates a unique human-friendly order number e.g. ORD-10024
   */
  static generateOrderNumber(): string {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `ORD-${randomSuffix}`;
  }

  /**
   * Calculate verified price, apply coupon discounts, and validate input requirements
   */
  static async validateAndCalculatePricing(
    productId: string,
    variantId: string,
    quantity = 1,
    couponCode?: string,
    userId?: string
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        formFields: true,
      },
    });

    if (!product || !product.isActive) {
      throw new Error("الخدمة غير متوفرة حالياً");
    }

    const variant = product.variants.find((v) => v.id === variantId && v.isActive);
    if (!variant) {
      throw new Error("الباقة المحددة غير صالحة أو غير متوفرة");
    }

    const rawTotal = variant.price * quantity;
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code },
      });

      if (coupon && coupon.isActive) {
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const hasUsesLeft = coupon.usedCount < coupon.usageLimit;
        const meetsMinOrder = rawTotal >= coupon.minOrderAmount;

        if (isNotExpired && hasUsesLeft && meetsMinOrder) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (rawTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }

          if (discountAmount > rawTotal) {
            discountAmount = rawTotal;
          }
          validCoupon = coupon;
        }
      }
    }

    const finalTotal = Math.max(0, rawTotal - discountAmount);

    return {
      product,
      variant,
      rawTotal,
      discountAmount,
      finalTotal,
      validCoupon,
    };
  }

  /**
   * Create an order with atomic payment deduction, status history, and coupon tracking.
   */
  static async createOrder(input: CreateOrderInput) {
    const { userId, productId, variantId, quantity = 1, couponCode, customerInputs } = input;

    // 1. Validate pricing and availability on server
    const { product, variant, discountAmount, finalTotal, validCoupon } =
      await this.validateAndCalculatePricing(productId, variantId, quantity, couponCode, userId);

    // 2. Validate custom form fields
    for (const field of product.formFields) {
      if (field.isRequired) {
        const val = customerInputs[field.fieldName];
        if (!val || !val.trim()) {
          throw new Error(`الحقل (${field.label}) مطلوب لإتمام الطلب`);
        }
      }
    }

    const orderNumber = this.generateOrderNumber();

    // 3. Atomic transaction: Debit wallet + create order + save history + update coupon
    return prisma.$transaction(async (tx) => {
      // 3.1 Debit wallet
      const debitResult = await WalletService.debitWallet(
        userId,
        finalTotal,
        "ORDER",
        null, // Will link to order
        `دفع قيمة الطلب ${orderNumber} - ${product.name} (${variant.name})`,
        tx
      );

      // 3.2 Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          productId,
          status: "PENDING",
          totalAmount: finalTotal,
          discountAmount,
          couponCode: validCoupon ? validCoupon.code : null,
          customerInputs: JSON.stringify(customerInputs),
          items: {
            create: [
              {
                variantId: variant.id,
                variantName: variant.name,
                quantity,
                unitPrice: variant.price,
                totalPrice: finalTotal,
              },
            ],
          },
          statusHistory: {
            create: [
              {
                toStatus: "PENDING",
                note: "تم إنشاء الطلب وخصم القيمة من رصيد المحفظة بنجاح",
                changedByUserId: userId,
              },
            ],
          },
        },
        include: {
          items: true,
          product: true,
        },
      });

      // 3.3 Link transaction referenceId to created order
      await tx.walletTransaction.update({
        where: { id: debitResult.transaction.id },
        data: { referenceId: order.id },
      });

      // 3.4 Track coupon usage if applied
      if (validCoupon) {
        await tx.coupon.update({
          where: { id: validCoupon.id },
          data: {
            usedCount: { increment: 1 },
          },
        });

        await tx.couponRedemption.create({
          data: {
            couponId: validCoupon.id,
            userId,
            orderId: order.id,
            discountApplied: discountAmount,
          },
        });
      }

      return order;
    });
  }

  /**
   * Transition order status with automated refund handling on cancellation or partial completion
   */
  static async updateOrderStatus(
    orderId: string,
    nextStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "PARTIAL",
    note?: string,
    adminUserId?: string,
    partialRefundAmount?: number,
    deliveryNotes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true, product: true },
      });

      if (!order) {
        throw new Error("الطلب غير موجود");
      }

      const prevStatus = order.status;

      if (prevStatus === nextStatus) {
        return order; // No change
      }

      // Check allowed transitions
      if (prevStatus === "COMPLETED" || prevStatus === "CANCELLED") {
        throw new Error(`لا يمكن تغيير حالة الطلب بعد أن أصبح: ${prevStatus}`);
      }

      let refundAmountToCredit = 0;

      // Handle Full Cancellation Refund
      if (nextStatus === "CANCELLED") {
        refundAmountToCredit = order.totalAmount;
      } else if (nextStatus === "PARTIAL") {
        if (partialRefundAmount === undefined || partialRefundAmount <= 0) {
          throw new Error("يجب تحديد مبلغ الاسترداد الجزئي للطلب");
        }
        if (partialRefundAmount > order.totalAmount) {
          throw new Error("لا يمكن أن يتجاوز مبلغ الاسترداد القيمة الإجمالية للطلب");
        }
        refundAmountToCredit = partialRefundAmount;
      }

      // Credit wallet if refund is due
      if (refundAmountToCredit > 0) {
        const refundType = nextStatus === "CANCELLED" ? "REFUND" : "PARTIAL_REFUND";
        const refundDesc =
          nextStatus === "CANCELLED"
            ? `استرداد كامل لقيمة الطلب الملغي ${order.orderNumber} (${refundAmountToCredit.toLocaleString("ar-SA")})`
            : `استرداد جزئي للطلب ${order.orderNumber} بمبلغ (${refundAmountToCredit.toLocaleString("ar-SA")})`;

        await WalletService.creditWallet(
          order.userId,
          refundAmountToCredit,
          refundType,
          "ORDER",
          order.id,
          refundDesc,
          tx
        );
      }

      // Update Order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          refundAmount: { increment: refundAmountToCredit },
          deliveryNotes: deliveryNotes || order.deliveryNotes,
          statusHistory: {
            create: {
              fromStatus: prevStatus,
              toStatus: nextStatus,
              note: note || `تم تغيير الحالة إلى ${nextStatus}`,
              changedByUserId: adminUserId || null,
            },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: `ORDER_STATUS_${nextStatus}`,
          userId: adminUserId,
          details: `تحديث حالة الطلب ${order.orderNumber} من ${prevStatus} إلى ${nextStatus}. مسترد: ${refundAmountToCredit}`,
        },
      });

      return updatedOrder;
    });
  }
}
