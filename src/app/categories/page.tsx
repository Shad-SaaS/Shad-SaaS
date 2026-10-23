import Link from "next/link";
import { prisma } from "@/lib/db";
import { Layers, Gamepad2, Sparkles, CreditCard, Share2, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesIndexPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  const categoryIcons: Record<string, any> = {
    games: Gamepad2,
    subscriptions: Sparkles,
    "gift-cards": CreditCard,
    "social-media": Share2,
    "ai-tools": Bot,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Layers className="w-7 h-7 text-blue-400" />
          <span>أقسام وتصنيفات المتجر</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          تصفح أقسام الألعاب، التطبيقات، والبطاقات الرقمية المتوفرة
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.slug] || Sparkles;
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="glass-card p-6 rounded-3xl border border-white/10 group flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors mb-2">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cat.description || "خدمات فورية ومباشرة بأفضل الأسعار"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {cat._count.products} خدمات متوفرة
                </span>
                <span className="text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                  تصفح القسم &larr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
