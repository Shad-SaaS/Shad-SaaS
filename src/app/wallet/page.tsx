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

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
  });

  const depositRequests = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="max-w-6xl mx-auto py-2">
      <WalletDepositClient
        currentUser={dbUser || user}
        paymentMethods={paymentMethods}
        depositRequests={depositRequests}
        transactions={transactions}
        currency={currency}
      />
    </div>
  );
}
