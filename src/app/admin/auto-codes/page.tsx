import { prisma } from "@/lib/db";
import { KeyRound, Plus, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAutoCodesPage() {
  const codes = await prisma.autoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
            <span>مخزن الأكواد التلقائية (Auto Codes)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة البطاقات والأكواد الرقمية الجاهزة للتسليم الفوري للعملاء عند الشراء
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">الخدمة / المنتج</th>
                <th className="py-3.5 px-4 font-bold">الكود الرقمي</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">ملاحظات</th>
                <th className="py-3.5 px-4 font-bold">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    لا توجد أكواد مضافة حتى الآن.
                  </td>
                </tr>
              ) : (
                codes.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {c.product.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-cyan-300 select-all">
                      {c.code}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.isUsed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">
                          تم التسليم
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          جاهز للتسليم
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{c.note || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
