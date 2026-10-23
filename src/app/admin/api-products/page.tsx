import { prisma } from "@/lib/db";
import AdminApiProductsClient from "./AdminApiProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminApiProductsPage() {
  const [providers, categories, currencySetting] = await Promise.all([
    prisma.apiProvider.findMany({ where: { isActive: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.storeSetting.findUnique({ where: { id: "currency" } }),
  ]);

  const currency = currencySetting?.value || "ل.س";

  return (
    <AdminApiProductsClient
      providers={providers}
      categories={categories}
      currency={currency}
    />
  );
}
