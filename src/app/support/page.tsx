import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Headphones, PlusCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/support");
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Headphones className="w-6 h-6 text-pink-400" />
          <span>مركز الدعم الفني والمساعدة</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          فريق خدمة العملاء متواجد لمساعدتك في أي استفسار حول الطلبات والشحن
        </p>
      </div>

      {/* Support Direct Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="https://t.me/XZStoreSupport"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel p-5 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 flex items-center justify-between text-xs transition-colors"
        >
          <div>
            <div className="font-bold text-white text-sm mb-1">تيليجرام الدعم المباشر</div>
            <div className="text-slate-400">@XZStoreSupport (رد فوري خلال دقائق)</div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold">محادثة</span>
        </a>

        <a
          href="https://wa.me/963988776655"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-between text-xs transition-colors"
        >
          <div>
            <div className="font-bold text-white text-sm mb-1">واتساب خدمة العملاء</div>
            <div className="text-slate-400">+963 988 776 655 (24/7)</div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold">محادثة</span>
        </a>
      </div>

      {/* Existing Tickets */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white">تذاكر الدعم السابقة</h2>

        {tickets.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            ليس لديك أي تذاكر مفتوحة حالياً. يمكنك مراسلتنا مباشرة عبر قنوات الدعم أعلاه.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400">{t.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    {t.status === "OPEN" ? "مفتوحة" : t.status === "ANSWERED" ? "تم الرد" : "مغلقة"}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{t.subject}</h3>
                <div className="text-[11px] text-slate-400">
                  عدد الردود: {t.messages.length} · {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
