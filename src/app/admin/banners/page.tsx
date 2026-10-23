import { prisma } from "@/lib/db";
import { Image as ImageIcon, Plus, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-cyan-400" />
            <span>البنرات والعروض المميزة (Banners)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة شرائح البنرات الترويجية والعروض التي تظهر في الصفحة الرئيسية لمتجر Shad-Store
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3 overflow-hidden"
          >
            <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              {b.isFeatured && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]">
                  عرض خاص
                </span>
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-sm">{b.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{b.subtitle}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {b.isActive ? "نشط بالمتجر" : "معطل"}
              </span>
            </div>

            {b.targetUrl && (
              <div className="text-[11px] text-blue-400 font-mono flex items-center gap-1">
                <span>الرابط: {b.targetUrl}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
