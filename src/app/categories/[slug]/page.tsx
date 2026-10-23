import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CategoryProductsClient from "./CategoryProductsClient";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!category) {
    // If not found by slug, try searching or provide a default fallback
    notFound();
  }

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "$";

  return (
    <CategoryProductsClient
      category={category}
      products={category.products}
      user={user ? { id: user.id, name: user.name, walletBalance: user.walletBalance } : null}
      currency={currency}
    />
  );
}
