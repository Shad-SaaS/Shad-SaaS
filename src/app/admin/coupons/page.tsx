import { prisma } from "@/lib/db";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-emerald-400" />
          <span>إدارة الكوبونات وأكواد الخصم</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إنشاء العروض الترويجية وتحديد نسب ومبالغ التخفيض وحدود الاستخدام
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">كود الخصم</th>
                <th className="py-3.5 px-4 font-bold">نوع الخصم</th>
                <th className="py-3.5 px-4 font-bold">القيمة</th>
                <th className="py-3.5 px-4 font-bold">الحد الأدنى للطلب</th>
                <th className="py-3.5 px-4 font-bold">مرات الاستخدام</th>
                <th className="py-3.5 px-4 font-bold">الحد الأقصى</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-cyan-300 text-sm">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    {c.discountType === "PERCENTAGE" ? "نسبة مئوية (%)" : "مبلغ ثابت"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-white">
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}%`
                      : `${c.discountValue.toLocaleString("ar-SA")} ${currency}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {c.minOrderAmount > 0
                      ? `${c.minOrderAmount.toLocaleString("ar-SA")} ${currency}`
                      : "بدون حد أدنى"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {c.usedCount}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {c.usageLimit}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      نشط
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
