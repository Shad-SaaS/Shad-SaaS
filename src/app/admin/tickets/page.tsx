import { prisma } from "@/lib/db";
import { Headphones, MessageSquare, Clock, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Headphones className="w-6 h-6 text-pink-400" />
          <span>مركز وإدارة تذاكر الدعم الفني</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          متابعة استفسارات العملاء، الردود السريعة، ومعالجة المشاكل التقنية
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">رقم التذكرة</th>
                <th className="py-3.5 px-4 font-bold">العميل</th>
                <th className="py-3.5 px-4 font-bold">الموضوع</th>
                <th className="py-3.5 px-4 font-bold">القسم</th>
                <th className="py-3.5 px-4 font-bold">الأولوية</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">عدد الرسائل</th>
                <th className="py-3.5 px-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    لا توجد تذاكر دعم فني مفتوحة حالياً.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{t.user.name}</div>
                      <div className="text-[10px] text-slate-500">{t.user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                      {t.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{t.category}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                        {t.status === "OPEN" ? "مفتوحة" : t.status === "ANSWERED" ? "تم الرد" : "مغلقة"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{t._count.messages}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString("ar-SA")}
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
