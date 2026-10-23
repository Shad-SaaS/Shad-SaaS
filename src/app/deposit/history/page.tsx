import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ArrowRight, ChevronDown, Clock, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepositHistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/deposit/history");
  }

  const deposits = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-3">
        <h1 className="text-base sm:text-lg font-black text-white">دفعاتي</h1>
        <Link
          href="/deposit"
          className="p-1.5 rounded-xl bg-[#141b26] text-slate-400 hover:text-white transition-colors"
          title="إضافة رصيد"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {deposits.length === 0 ? (
        <div className="bg-[#121824] p-12 rounded-3xl text-center border border-white/5 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h3 className="text-sm font-bold text-white">لا توجد عناصر</h3>
          <Link
            href="/deposit"
            className="inline-block bg-[#3b4454] hover:bg-[#4a5568] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            إضافة رصيد
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((dep) => {
            const isPending = dep.status === "PENDING";
            const isApproved = dep.status === "APPROVED";

            return (
              <div
                key={dep.id}
                className="rounded-2xl overflow-hidden border border-white/10 bg-[#141b26] shadow-lg transition-all"
              >
                {/* Header Banner matching Screenshot 2 in Batch 6 */}
                <div
                  className={`p-3 text-xs font-bold flex items-center justify-between ${
                    isPending
                      ? "bg-[#d97706] text-slate-950 font-black"
                      : isApproved
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-700 text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="bg-black/20 px-2 py-0.5 rounded-md text-[10px]">
                      {isPending ? "انتظار" : isApproved ? "مكتمل" : "مرفوض"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>

                  <span className="font-bold">
                    {dep.paymentMethodCode.includes("usdt") ? "عملة USDT" : "شام كاش آلي دولار $"} — {dep.amount.toFixed(2)} USD
                  </span>
                </div>

                {/* Details Body */}
                <div className="p-4 space-y-2.5 text-xs text-slate-300 font-medium">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-mono text-cyan-300 font-bold">{dep.depositNumber}</span>
                    <span className="text-slate-400">رقم طلب الإيداع</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-mono font-bold text-white">{dep.amount.toFixed(2)} USD</span>
                    <span className="text-slate-400">الإجمالي</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(dep.createdAt).toLocaleString("ar-SA")}
                    </span>
                    <span className="text-slate-400">التاريخ</span>
                  </div>

                  {dep.referenceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-300 text-[11px] break-all max-w-[200px]">
                        {dep.referenceNumber}
                      </span>
                      <span className="text-slate-400">رقم العملية البنكية</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
