import { Clock, Play, CheckCircle2, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminCronPage() {
  const cronJobs = [
    {
      name: "مزامنة حالات طلبات المزودين (Sync API Orders)",
      schedule: "كل 5 دقائق",
      description: "الاستعلام عن طلبات المزودين (Mersal/Alkasr) المعلقة وتحديث حالتها إلى مكتمل أو ملغي.",
      status: "نشط تلقائياً",
    },
    {
      name: "فحص وتحديث أرصدة المزودين (Sync Providers Balance)",
      schedule: "كل ساعة",
      description: "جلب الأرصدة الحالية في حسابات المزودين وتنبيه الإدارة عند انخفاض الرصيد.",
      status: "نشط تلقائياً",
    },
    {
      name: "تنظيف الجلسات المنتهية (Session Garbage Collection)",
      schedule: "يومياً في منتصف الليل",
      description: "حذف رموز الجلسات المنتهية صلاحيتها لتحسين أداء قاعدة البيانات وسرعتها.",
      status: "نشط تلقائياً",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          <span>المهام المجدولة والأتمتة (Cron Jobs)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة ومراقبة المهام الخلفية التلقائية للمزامنة وتحديث الحالات والتنظيف الدوري
        </p>
      </div>

      <div className="space-y-4">
        {cronJobs.map((job, idx) => (
          <div
            key={idx}
            className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{job.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{job.description}</p>
              <div className="text-[11px] text-cyan-400 font-mono">الجدول الزمني: {job.schedule}</div>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-blue-400" />
              <span>تشغيل الآن يدوياً</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
