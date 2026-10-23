import { prisma } from "@/lib/db";
import AdminApiProductsClient from "./AdminApiProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminApiProductsPage() {
  const [providers, categories, currencySetting] = await Promise.all([
    // Only fetch supplier providers (excluding payment gateways like samapi_payments)
    prisma.provider.findMany({
      where: {
        isActive: true,
        template: { not: "samapi_payments" },
      },
      orderBy: { priority: "asc" },
      select: {
        id: true,
        name: true,
        template: true,
        baseUrl: true,
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.storeSetting.findUnique({ where: { id: "currency" } }),
  ]);

  const currency = currencySetting?.value || "ل.س";

  const mappedProviders = providers.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.id,
    baseUrl: p.baseUrl,
  }));

  return (
    <AdminApiProductsClient
      providers={mappedProviders}
      categories={categories}
      currency={currency}
    />
  );
}
