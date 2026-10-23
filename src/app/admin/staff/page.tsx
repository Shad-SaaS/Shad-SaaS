import { prisma } from "@/lib/db";
import { ShieldCheck, UserCheck, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPPORT"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>المشرفون وإدارة الصلاحيات (Staff & Roles)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة حسابات طاقم العمل، تحديد الأدوار (مدير عام، مشرف طلبات، دعم فني)، ومراقبة الوصول
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((s) => (
          <div
            key={s.id}
            className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{s.name}</h3>
                  <div className="text-[11px] text-slate-400">{s.email}</div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {s.role === "ADMIN" ? "مدير عام (صلاحيات كاملة)" : "موظف دعم"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-300 space-y-1">
              <div>الحالة: <span className="text-emerald-400 font-bold">{s.status === "ACTIVE" ? "نشط" : "مجمد"}</span></div>
              <div>الهاتف: <span className="font-mono text-slate-200">{s.phone || "—"}</span></div>
              <div>تاريخ التعيين: <span className="font-mono text-slate-400">{new Date(s.createdAt).toLocaleDateString("ar-SA")}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
