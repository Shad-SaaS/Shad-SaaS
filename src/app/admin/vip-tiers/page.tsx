import { prisma } from "@/lib/db";
import { Award, Users, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVipTiersPage() {
  const [tiers, currencySetting] = await Promise.all([
    prisma.vipTier.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { users: true } },
      },
    }),
    prisma.storeSetting.findUnique({ where: { id: "currency" } }),
  ]);

  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <span>عضويات VIP ومستويات العملاء</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة رتب العملاء وتحديد نسب الخصم التلقائية بناءً على إجمالي المشتريات
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div
            key={t.id}
            className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{t.name}</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>الحد الأدنى للإنفاق:</span>
                <span className="font-mono font-bold text-white">
                  {t.minSpent.toLocaleString("ar-SA")} {currency}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>نسبة الخصم التلقائي:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {t.discountRate}%
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>عدد العملاء الحاليين:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {t._count.users}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
