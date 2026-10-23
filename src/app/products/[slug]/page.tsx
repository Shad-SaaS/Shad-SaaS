import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProductOrderForm from "./ProductOrderForm";
import {
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      formFields: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-white transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-white font-bold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-4 rounded-3xl overflow-hidden border border-white/10">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900/60 relative mb-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-blue-400">
                  {product.name}
                </div>
              )}
              {product.executionTime && (
                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>سرعة التسليم: {product.executionTime}</span>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {product.shortDesc}
            </p>
          </div>

          {/* Description & Terms */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              تفاصيل وشروط الخدمة:
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description || "خدمة رسمية موثوقة ومباشرة لحسابك عبر البيانات المطلوبة."}
            </p>

            <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>ضمان كامل وأمان الحساب 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                <span>تنفيذ تلقائي وتحديث لحظي لحالة الطلب</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Form Component */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-lg font-black text-white mb-6 pb-3 border-b border-white/10 flex items-center justify-between">
              <span>إتمام طلب الخدمة</span>
              <span className="text-xs font-medium text-slate-400">دفع فوري من المحفظة</span>
            </h2>

            <ProductOrderForm
              product={product}
              currentUser={currentUser}
              currency={currency}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
