import { prisma } from "@/lib/db";
import { FileCode, Edit, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const templates = await prisma.orderMessageTemplate.findMany({
    orderBy: { event: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileCode className="w-6 h-6 text-emerald-400" />
          <span>قوالب رسائل وإشعارات الطلبات</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة وتخصيص النصوص التلقائية لرسائل البريد الإلكتروني والتيليجرام والإشعارات الداخلية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div
            key={t.id}
            className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {t.event}
              </span>
            </div>

            <h3 className="font-bold text-white text-sm">{t.title}</h3>
            
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-300 leading-relaxed font-tajawal whitespace-pre-line">
              {t.content}
            </div>

            <div className="text-[10px] text-slate-500">
              المتغيرات المدعومة: <code className="text-amber-400 font-mono">&#123;user_name&#125;</code>, <code className="text-amber-400 font-mono">&#123;order_number&#125;</code>, <code className="text-amber-400 font-mono">&#123;delivery_notes&#125;</code>, <code className="text-amber-400 font-mono">&#123;amount&#125;</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
