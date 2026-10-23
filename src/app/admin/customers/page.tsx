import { prisma } from "@/lib/db";
import { Users, Wallet, Shield, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
          depositRequests: true,
        },
      },
    },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-pink-400" />
          <span>إدارة حسابات العملاء والمحافظ</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          عرض أرصدة العملاء، سجل الطلبات، وحالات الحسابات
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">الاسم</th>
                <th className="py-3.5 px-4 font-bold">البريد الإلكتروني</th>
                <th className="py-3.5 px-4 font-bold">الهاتف</th>
                <th className="py-3.5 px-4 font-bold">رصيد المحفظة</th>
                <th className="py-3.5 px-4 font-bold">الرتبة</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">عدد الطلبات</th>
                <th className="py-3.5 px-4 font-bold">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {c.email}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {c.phone || "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-cyan-300 whitespace-nowrap">
                    {c.walletBalance.toLocaleString("ar-SA")} {currency}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.role === "ADMIN"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {c.role === "ADMIN" ? "مدير" : "عميل"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {c.status === "ACTIVE" ? "نشط" : "مجمد"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {c._count.orders}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("ar-SA")}
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
