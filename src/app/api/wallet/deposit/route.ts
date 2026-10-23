import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لتقديم طلب شحن رصيد" },
        { status: 401 }
      );
    }

    const { paymentMethodCode, amount, referenceNumber, receiptImageUrl } = await req.json();

    if (!paymentMethodCode || !amount || !referenceNumber) {
      return NextResponse.json(
        { error: "يرجى اختيار وسيلة الدفع وتحديد المبلغ وإدخال رقم المعاملة" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "يجب أن يكون المبلغ أكبر من الصفر" },
        { status: 400 }
      );
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { code: paymentMethodCode },
    });

    if (!method || !method.isActive) {
      return NextResponse.json(
        { error: "وسيلة الدفع المختارة غير متاحة حالياً" },
        { status: 400 }
      );
    }

    if (numAmount < method.minDeposit) {
      return NextResponse.json(
        { error: `الحد الأدنى للشحن عبر ${method.name} هو ${method.minDeposit.toLocaleString("ar-SA")}` },
        { status: 400 }
      );
    }

    const depositNumber = `DEP-${Math.floor(10000 + Math.random() * 90000)}`;

    const deposit = await prisma.depositRequest.create({
      data: {
        depositNumber,
        userId: user.id,
        paymentMethodCode,
        amount: numAmount,
        referenceNumber: referenceNumber.trim(),
        receiptImageUrl: receiptImageUrl || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        depositNumber: deposit.depositNumber,
        amount: deposit.amount,
        status: deposit.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم طلب الشحن: " + err.message },
      { status: 500 }
    );
  }
}
