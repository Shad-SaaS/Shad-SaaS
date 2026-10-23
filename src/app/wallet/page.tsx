import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import WalletDepositClient from "./WalletDepositClient";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/wallet");
  }

  // Fetch updated user balance from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, walletBalance: true },
  });

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "$";

  return (
    <div className="max-w-xl mx-auto py-2">
      <WalletDepositClient
        currentUser={dbUser || user}
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceBefore: t.balanceBefore,
          balanceAfter: t.balanceAfter,
          description: t.description,
          createdAt: t.createdAt,
        }))}
        currency={currency}
      />
    </div>
  );
}
