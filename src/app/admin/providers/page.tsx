import { prisma } from "@/lib/db";
import { decrypt, maskSecret } from "@/lib/encryption";
import AdminProvidersClient from "./AdminProvidersClient";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { priority: "asc" },
    include: {
      _count: { select: { providerProducts: true, providerOrders: true } },
    },
  });

  const sanitized = providers.map((p) => {
    let rawToken = "";
    try {
      const decrypted = decrypt(p.credentialsEncrypted);
      const parsed = JSON.parse(decrypted);
      rawToken = parsed.api_token || parsed.api_key || "";
    } catch {
      rawToken = decrypt(p.credentialsEncrypted);
    }

    return {
      id: p.id,
      name: p.name,
      code: p.id,
      template: p.template,
      baseUrl: p.baseUrl,
      apiToken: rawToken,
      apiTokenMasked: maskSecret(rawToken),
      isActive: p.isActive,
      priority: p.priority,
      balance: p.lastBalance || 0,
      currency: "USD",
      lastSyncAt: p.lastBalanceAt,
      _count: { products: p._count.providerProducts },
    };
  });

  return <AdminProvidersClient initialProviders={sanitized} />;
}
