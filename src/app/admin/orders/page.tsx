import { prisma } from "@/lib/db";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { name: true, executionTime: true } },
      items: true,
    },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return <AdminOrdersClient initialOrders={orders} currency={currency} />;
}
