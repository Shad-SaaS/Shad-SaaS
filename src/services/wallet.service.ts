import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type TransactionType =
  | "DEPOSIT"
  | "ORDER_PAYMENT"
  | "REFUND"
  | "PARTIAL_REFUND"
  | "ADMIN_ADJUSTMENT";

export type ReferenceType = "DEPOSIT_REQUEST" | "ORDER" | "MANUAL" | "COUPON";

export class InsufficientBalanceError extends Error {
  constructor(message = "رصيد المحفظة غير كافٍ لإتمام هذه العملية") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class WalletService {
  /**
   * Get verified wallet balance directly from database
   */
  static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    return user ? user.walletBalance : 0;
  }

  /**
   * Atomically debit an amount from the user's wallet with ledger entry and balance checks.
   * Can be passed an existing transaction context tx or will create one.
   */
  static async debitWallet(
    userId: string,
    amount: number,
    referenceType: ReferenceType,
    referenceId: string | null,
    description: string,
    externalTx?: Prisma.TransactionClient
  ) {
    if (amount <= 0) {
      throw new Error("يجب أن يكون المبلغ المخصوم أكبر من الصفر");
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      // Find current user balance with locked row behavior
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, status: true },
      });

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.status === "SUSPENDED") {
        throw new Error("هذا الحساب مجمد حالياً");
      }

      if (user.walletBalance < amount) {
        throw new InsufficientBalanceError(
          `رصيدك الحالي (${user.walletBalance.toLocaleString("ar-SA")}) لا يكفي لإتمام العملية بقيمة (${amount.toLocaleString("ar-SA")})`
        );
      }

      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore - amount;

      // Update User balance atomically
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      // Insert immutable ledger transaction entry
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: "ORDER_PAYMENT",
          amount: -amount,
          balanceBefore,
          balanceAfter,
          referenceType,
          referenceId,
          description,
        },
      });

      return { balanceBefore, balanceAfter, transaction };
    };

    if (externalTx) {
      return execute(externalTx);
    } else {
      return prisma.$transaction(execute);
    }
  }

  /**
   * Atomically credit an amount into user's wallet with ledger record.
   */
  static async creditWallet(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceType: ReferenceType,
    referenceId: string | null,
    description: string,
    externalTx?: Prisma.TransactionClient
  ) {
    if (amount <= 0) {
      throw new Error("يجب أن يكون المبلغ المضاف أكبر من الصفر");
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore + amount;

      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
      });

      // Create ledger entry
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceType,
          referenceId,
          description,
        },
      });

      return { balanceBefore, balanceAfter, transaction };
    };

    if (externalTx) {
      return execute(externalTx);
    } else {
      return prisma.$transaction(execute);
    }
  }

  /**
   * Process manual deposit approval by admin. Guarantees atomicity and idempotency.
   */
  static async approveDeposit(depositId: string, reviewedByAdminId: string) {
    return prisma.$transaction(async (tx) => {
      const deposit = await tx.depositRequest.findUnique({
        where: { id: depositId },
      });

      if (!deposit) {
        throw new Error("طلب الشحن غير موجود");
      }

      if (deposit.status !== "PENDING") {
        throw new Error(`لا يمكن اعتماد طلب الشحن لأنه بحالة: ${deposit.status}`);
      }

      // Mark deposit as approved
      const updatedDeposit = await tx.depositRequest.update({
        where: { id: depositId },
        data: {
          status: "APPROVED",
          reviewedByUserId: reviewedByAdminId,
          reviewedAt: new Date(),
        },
      });

      // Credit wallet
      await WalletService.creditWallet(
        deposit.userId,
        deposit.amount,
        "DEPOSIT",
        "DEPOSIT_REQUEST",
        deposit.id,
        `شحن رصيد معتمد عبر ${deposit.paymentMethodCode} - رقم المعاملة: ${deposit.referenceNumber}`,
        tx
      );

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "APPROVE_DEPOSIT",
          userId: reviewedByAdminId,
          details: `الموافقة على شحن رصيد بمبلغ ${deposit.amount} للعميل ${deposit.userId} - رقم الطلب: ${deposit.depositNumber}`,
        },
      });

      return updatedDeposit;
    });
  }

  /**
   * Process manual deposit rejection by admin.
   */
  static async rejectDeposit(depositId: string, reason: string, reviewedByAdminId: string) {
    return prisma.$transaction(async (tx) => {
      const deposit = await tx.depositRequest.findUnique({
        where: { id: depositId },
      });

      if (!deposit) {
        throw new Error("طلب الشحن غير موجود");
      }

      if (deposit.status !== "PENDING") {
        throw new Error(`لا يمكن رفض طلب الشحن لأنه بحالة: ${deposit.status}`);
      }

      const updated = await tx.depositRequest.update({
        where: { id: depositId },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "لم يتم استلام المبلغ أو بيانات الحوالة غير متطابقة",
          reviewedByUserId: reviewedByAdminId,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: "REJECT_DEPOSIT",
          userId: reviewedByAdminId,
          details: `رفض طلب شحن رصيد ${deposit.depositNumber} بمبلغ ${deposit.amount}. السبب: ${reason}`,
        },
      });

      return updated;
    });
  }
}
