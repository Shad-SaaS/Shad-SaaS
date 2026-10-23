import { prisma } from "@/lib/db";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-amber-400" />
          <span>إدارة التصنيفات والأقسام</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          تنظيم وتصنيف الخدمات وترتيب ظهورها في الواجهة الرئيسية
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">اسم التصنيف</th>
                <th className="py-3.5 px-4 font-bold">الرابط المباشر (Slug)</th>
                <th className="py-3.5 px-4 font-bold">الوصف</th>
                <th className="py-3.5 px-4 font-bold">عدد المنتجات</th>
                <th className="py-3.5 px-4 font-bold">الترتيب</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">
                    /categories/{c.slug}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-sm truncate">
                    {c.description || "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {c._count.products}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    {c.sortOrder}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      نشط
                    </span>
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
