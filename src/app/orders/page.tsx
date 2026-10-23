import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      product: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "$";

  return (
    <OrdersClient
      initialOrders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalPrice: o.totalPrice,
        status: o.status,
        customerInputs: o.customerInputs,
        deliveryNotes: o.deliveryNotes,
        createdAt: o.createdAt,
        product: o.product,
      }))}
      currency={currency}
    />
  );
}
