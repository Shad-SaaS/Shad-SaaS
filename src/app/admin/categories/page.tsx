import { prisma } from "@/lib/db";
import CategoryManagementClient from "./CategoryManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return <CategoryManagementClient initialCategories={categories} />;
}
