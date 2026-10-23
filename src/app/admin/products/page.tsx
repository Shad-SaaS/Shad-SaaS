import { prisma } from "@/lib/db";
import Link from "next/link";
import { Package, Zap, Plus, Layers, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
      formFields: true,
      _count: { select: { orders: true } },
    },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            <span>إدارة الخدمات والباقات الرقمية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إعداد الباقات، أسعار الشحن، حقول نماذج الإدخال، وربط المزودين
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-blue-400">
                      XZ
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-blue-400 font-bold">{p.category.name}</span>
                    <span>·</span>
                    <span>{p.executionTime || "فوري"}</span>
                  </div>
                </div>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs font-bold text-cyan-300">
                  يبدأ من {p.minPrice.toLocaleString("ar-SA")} {currency}
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  الطلبات: {p._count.orders}
                </div>
              </div>
            </div>

            {/* Variants List */}
            <div className="pt-3 border-t border-white/5 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400">الباقات والأسعار المعتمدة:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {p.variants.map((v) => (
                  <div
                    key={v.id}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-200 font-medium truncate">{v.name}</span>
                    <span className="font-mono font-bold text-cyan-400 whitespace-nowrap mr-2">
                      {v.price.toLocaleString("ar-SA")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Input Fields */}
            {p.formFields.length > 0 && (
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <span className="font-bold">حقول الإدخال المطلوبة من العميل: </span>
                {p.formFields.map((f) => f.label).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
