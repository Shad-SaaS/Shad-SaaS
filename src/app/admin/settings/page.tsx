import { prisma } from "@/lib/db";
import AdminSettingsClient from "./AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, paymentMethods] = await Promise.all([
    prisma.storeSetting.findMany(),
    prisma.paymentMethod.findMany(),
  ]);

  return (
    <AdminSettingsClient
      initialSettings={settings}
      initialPaymentMethods={paymentMethods}
    />
  );
}
