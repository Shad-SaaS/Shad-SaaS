import { Database, Download, Upload, ShieldAlert, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminBackupPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          <span>النسخ الاحتياطي للبيانات (Backup & Restore)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          تصدير قاعدة بيانات المتجر كاملة وحفظ نسخة آمنة من المنتجات والطلبات والمحافظ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">تصدير نسخة احتياطية فورية</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            توليد وتنزيل ملف JSON يحتوي على كافة بيانات المستخدمين، الطلبات، المنتجات، والمعاملات المالية.
          </p>
          <a
            href="/api/admin/backup/export"
            download
            className="glow-btn px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل النسخة الاحتياطية (JSON)</span>
          </a>
        </div>

        {/* Warning & Guidelines Card */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">إرشادات أمان البيانات</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            يُنصح بأخذ نسخة احتياطية دورية أسبوعياً قبل تطبيق أي استيراد للمنتجات أو تحديثات على الأسعار.
          </p>
          <div className="text-[11px] text-amber-300 font-bold">
            ملفات النسخ الاحتياطي مشفرة ومخصصة لمدير النظام فقط.
          </div>
        </div>
      </div>
    </div>
  );
}
