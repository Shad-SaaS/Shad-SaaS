import { prisma } from "@/lib/db";
import { History, Shield, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <History className="w-6 h-6 text-blue-400" />
          <span>سجل نشاطات المشرفين (Audit Log)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          سجل تدقيق ومراقبة غير قابل للتعديل يوثق كافة الإجراءات الإدارية الحساسة
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-bold">الإجراء</th>
                <th className="py-3.5 px-4 font-bold">المشرف المسؤول</th>
                <th className="py-3.5 px-4 font-bold">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    لا توجد سجلات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{log.user?.name || "النظام"}</div>
                      <div className="text-[10px] text-slate-500">{log.user?.email || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      {log.details}
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
