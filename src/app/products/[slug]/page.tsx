import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProductOrderForm from "./ProductOrderForm";
import {
  ChevronRight,
  Heart,
  ShieldCheck,
  Clock,
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
  const currency = currencySetting?.value || "$";

  return (
    <div className="min-h-screen py-4 px-3 sm:px-6 flex flex-col items-center">
      
      {/* Top Bar with Back and Heart */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          href={`/categories/${product.category.slug}`}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="الرجوع للقسم"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>

        <button
          type="button"
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white/10 transition-colors"
          title="إضافة للمفضلة"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Main Centered Product Brand Header (as in Batch 15 screenshots) */}
      <div className="flex flex-col items-center mb-6 text-center">
        {/* App Rounded Icon */}
        <div className="w-20 h-20 rounded-2xl bg-white shadow-2xl flex items-center justify-center overflow-hidden p-2.5 mb-3 border border-white/20">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-black font-black text-xs text-center">
              {product.name}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h1 className="text-xl font-black text-white tracking-wide">
          {product.name}
        </h1>
        {product.executionTime && (
          <p className="text-[11px] text-amber-400 font-bold mt-1">
            ⚡ سرعة التنفيذ: {product.executionTime}
          </p>
        )}
      </div>

      {/* Product Order Form Container (with tech-grid-bg matching Screenshot 1 & 2) */}
      <div className="w-full max-w-md bg-[#10151f] tech-grid-bg border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <ProductOrderForm
          product={product}
          currentUser={currentUser}
          currency={currency}
        />
      </div>

      {/* Service Terms & Guarantee details below */}
      <div className="w-full max-w-md mt-6 space-y-3">
        <div className="bg-[#121824] border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
          <div className="font-bold text-white flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>تفاصيل وشروط الخدمة</span>
          </div>
          <p className="leading-relaxed">
            {product.description || "تنفيذ فوري ومباشر وآمن لحسابك عبر أحدث البوابات المعتمدة."}
          </p>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ضمان كامل وأمان 100%</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>دعم فني متواصل 24/7</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
