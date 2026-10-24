import { prisma } from "@/lib/db";
import CategoryManagementClient from "./CategoryManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, whatsappSetting] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
    prisma.storeSetting.findUnique({
      where: { id: "whatsapp_box_enabled" },
    }),
  ]);

  const isWhatsappEnabled = whatsappSetting ? whatsappSetting.value === "true" : true;

  return (
    <CategoryManagementClient
      initialCategories={categories}
      initialWhatsappEnabled={isWhatsappEnabled}
    />
  );
}
