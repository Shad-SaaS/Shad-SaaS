import { prisma } from "@/lib/db";
import AdminProvidersClient from "./AdminProvidersClient";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const providers = await prisma.apiProvider.findMany({
    orderBy: { createdAt: "asc" },
  });

  return <AdminProvidersClient initialProviders={providers} />;
}
