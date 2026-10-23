"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Tag,
  Wallet,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface Variant {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
}

interface FormField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: string;
  placeholder?: string | null;
  isRequired: boolean;
  optionsJson?: string | null;
}

interface ProductOrderFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    variants: Variant[];
    formFields: FormField[];
  };
  currentUser: {
    id: string;
    name: string;
    walletBalance: number;
  } | null;
  currency?: string;
}

export default function ProductOrderForm({
  product,
  currentUser,
  currency = "ل.س",
}: ProductOrderFormProps) {
  const router = useRouter();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const rawPrice = selectedVariant?.price || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, rawPrice - discountAmount);

  const hasEnoughBalance = currentUser
    ? currentUser.walletBalance >= finalPrice
    : false;

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await fetch("/api/orders/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          couponCode: couponCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setCouponError(data.error || "كود الخصم غير صالح");
        setAppliedCoupon(null);
      } else {
        if (data.couponApplied && data.discountAmount > 0) {
          setAppliedCoupon({
            code: data.couponApplied.code,
            discountAmount: data.discountAmount,
          });
          setCouponSuccess(`تم تفعيل كود الخصم! وفرت ${data.discountAmount.toLocaleString("ar-SA")} ${currency}`);
        } else {
          setCouponError("كود الخصم غير مطابق لشروط هذا الطلب");
          setAppliedCoupon(null);
        }
      }
    } catch {
      setCouponError("تعذر التحقق من كود الخصم");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Re-calculate coupon discount if variant changes
  useEffect(() => {
    if (appliedCoupon && selectedVariantId) {
      handleApplyCoupon();
    }
  }, [selectedVariantId]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }

    // Validate required fields
    for (const field of product.formFields) {
      if (field.isRequired && (!formData[field.fieldName] || !formData[field.fieldName].trim())) {
        setOrderError(`يرجى ملء حقل (${field.label})`);
        return;
      }
    }

    if (!hasEnoughBalance) {
      setOrderError("رصيد المحفظة غير كافٍ. يرجى شحن الرصيد أولاً.");
      return;
    }

    setIsSubmitting(true);
    setOrderError("");

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          customerInputs: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setOrderError(data.error || "فشل إتمام الطلب");
      } else {
        setOrderSuccess(data.order.orderNumber);
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      }
    } catch (err: any) {
      setOrderError("حدث خطأ في الاتصال بالخادم: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center border border-emerald-500/30 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">تم تأكيد طلبك بنجاح!</h3>
        <p className="text-slate-300 text-sm mb-4">
          رقم الطلب: <span className="font-mono font-bold text-cyan-400">{orderSuccess}</span>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          تم خصم المبلغ من رصيد محفظتك، وجارٍ معالجة الطلب فورياً. يتم تحويلك إلى سجل الطلبات...
        </p>
        <Link
          href="/orders"
          className="glow-btn px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
        >
          <span>عرض طلباتي الآن</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitOrder} className="space-y-6">
      
      {/* 1. Variant Packages Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-white">
          1. اختر الباقة أو الفئة المطلوبة:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {product.variants.map((variant) => {
            const isSelected = variant.id === selectedVariantId;
            return (
              <div
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-right flex items-center justify-between ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                    {variant.name}
                  </div>
                  {variant.originalPrice && variant.originalPrice > variant.price && (
                    <div className="text-[10px] text-slate-500 line-through">
                      {variant.originalPrice.toLocaleString("ar-SA")} {currency}
                    </div>
                  )}
                </div>

                <div className="text-left font-mono">
                  <span className={`text-sm font-black ${isSelected ? "text-cyan-300" : "text-white"}`}>
                    {variant.price.toLocaleString("ar-SA")}
                  </span>{" "}
                  <span className="text-[10px] text-slate-400 font-tajawal">{currency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dynamic Custom Form Fields */}
      {product.formFields.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-white/10">
          <label className="block text-sm font-bold text-white">
            2. بيانات تنفيذ الطلب:
          </label>
          <div className="space-y-3">
            {product.formFields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {field.label} {field.isRequired && <span className="text-rose-400">*</span>}
                </label>
                <input
                  type={field.fieldType === "number" ? "number" : "text"}
                  placeholder={field.placeholder || ""}
                  required={field.isRequired}
                  value={formData[field.fieldName] || ""}
                  onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Coupon Code Input */}
      <div className="space-y-2 pt-3 border-t border-white/10">
        <label className="block text-xs font-bold text-slate-300">
          كود الخصم (اختياري):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="مثال: WELCOME10"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-xs uppercase font-mono"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={isCheckingCoupon || !couponCode.trim()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white disabled:opacity-50 transition-colors"
          >
            {isCheckingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
          </button>
        </div>
        {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
        {couponSuccess && <p className="text-[11px] text-emerald-400">{couponSuccess}</p>}
      </div>

      {/* 4. Pricing Summary & Wallet Check */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>سعر الباقة:</span>
          <span className="font-mono text-white">
            {rawPrice.toLocaleString("ar-SA")} {currency}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>الخصم المطبق ({appliedCoupon?.code}):</span>
            <span className="font-mono">
              -{discountAmount.toLocaleString("ar-SA")} {currency}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
          <span className="text-white">المجموع النهائي:</span>
          <span className="font-mono text-lg text-cyan-300 font-black">
            {finalPrice.toLocaleString("ar-SA")} {currency}
          </span>
        </div>

        {/* User Balance Status */}
        {currentUser && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              رصيدك في المحفظة:
            </span>
            <span className={`font-mono font-bold ${hasEnoughBalance ? "text-emerald-400" : "text-rose-400"}`}>
              {currentUser.walletBalance.toLocaleString("ar-SA")} {currency}
            </span>
          </div>
        )}
      </div>

      {orderError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      {/* 5. Checkout Action Button */}
      {currentUser ? (
        hasEnoughBalance ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl glow-btn font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ خصم الرصيد وإنشاء الطلب...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>تأكيد الطلب وخصم ({finalPrice.toLocaleString("ar-SA")} {currency})</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <Link
              href="/wallet"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>رصيدك غير كافٍ — اضغط هنا لشحن المحفظة</span>
            </Link>
            <p className="text-[11px] text-center text-slate-500">
              المبلغ المطلوب: {finalPrice.toLocaleString("ar-SA")} {currency} | المتاح: {currentUser.walletBalance.toLocaleString("ar-SA")} {currency}
            </p>
          </div>
        )
      ) : (
        <Link
          href={`/login?redirect=/products/${product.slug}`}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <span>تسجيل الدخول لإتمام عملية الشراء</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

    </form>
  );
}
