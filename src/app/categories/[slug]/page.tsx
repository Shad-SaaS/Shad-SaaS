import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ServiceCard from "@/components/ServiceCard";
import { ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: {
          category: { select: { name: true, slug: true } },
          variants: { where: { isActive: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link href="/" className="hover:text-white">الرئيسية</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-white">التصنيفات</Link>
          <span>/</span>
          <span className="text-white font-bold">{category.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{category.name}</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          {category.description || "خدمات ومنتجات موثوقة ومباشرة مع تسليم فوري."}
        </p>
      </div>

      {category.products.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 text-sm">
          لا توجد خدمات مضافة في هذا القسم حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.products.map((product) => (
            <ServiceCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
