import { prisma } from "@/lib/db";
import AdminDepositsClient from "./AdminDepositsClient";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  const deposits = await prisma.depositRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return <AdminDepositsClient initialDeposits={deposits} currency={currency} />;
}
