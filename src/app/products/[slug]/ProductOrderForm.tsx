"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Variant {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  isAvailable?: boolean;
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
    image?: string | null;
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
  currency = "$",
}: ProductOrderFormProps) {
  const router = useRouter();

  // Find initial variant (first available or first)
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Submission & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const rawPrice = selectedVariant?.price || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, rawPrice - discountAmount);

  const hasEnoughBalance = currentUser ? currentUser.walletBalance >= finalPrice : false;

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponMessage(null);

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
        setCouponMessage({ type: "error", text: data.error || "كود الخصم غير صالح" });
        setAppliedCoupon(null);
      } else if (data.couponApplied && data.discountAmount > 0) {
        setAppliedCoupon({
          code: data.couponApplied.code,
          discountAmount: data.discountAmount,
        });
        setCouponMessage({
          type: "success",
          text: `تم تفعيل الخصم بنجاح! وفرت ${data.discountAmount} ${currency}`,
        });
      } else {
        setCouponMessage({ type: "error", text: "كود الخصم غير مطابق لهذا العرض" });
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMessage({ type: "error", text: "تعذر الاتصال بالخادم للتحقق من الكود" });
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }

    // Validate package selection
    if (!selectedVariantId) {
      setOrderError("يرجى اختيار الباقة المطلوبة");
      return;
    }

    // Validate dynamic inputs
    for (const field of product.formFields) {
      if (field.isRequired && (!formData[field.fieldName] || !formData[field.fieldName].trim())) {
        setOrderError(`يرجى إدخال ${field.label}`);
        return;
      }
    }

    // Check balance
    if (!hasEnoughBalance) {
      setShowInsufficientBalanceModal(true);
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

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
        if (data.error && data.error.includes("رصيد")) {
          setShowInsufficientBalanceModal(true);
        } else {
          setOrderError(data.error || "تعذر تنفيذ الطلب");
        }
      } else {
        setOrderSuccess(data.order.orderNumber);
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      }
    } catch (err: any) {
      setOrderError("حدث خطأ في الاتصال بالخادم: " + (err.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-[#121824] border border-emerald-500/30 rounded-3xl p-8 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">تم تأكيد طلبك بنجاح!</h3>
        <p className="text-sm text-slate-300 mb-4">
          رقم الطلب: <span className="font-mono font-bold text-amber-400">{orderSuccess}</span>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          جاري المعالجة الفورية... يتم تحويلك تلقائياً إلى صفحة طلباتي
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 bg-[#334155] hover:bg-[#475569] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
        >
          <span>الانتقال لطلباتي</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmitOrder} className="space-y-4">
        
        {/* 1. Package Select Dropdown (اختر_الباقة) */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs font-bold text-slate-300">
            اختر_الباقة
          </label>

          <div className="relative">
            {/* Main Select Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full bg-[#161c28] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-right flex items-center justify-between text-sm text-white focus:outline-none transition-colors"
            >
              <span className="font-medium truncate">
                {selectedVariant ? selectedVariant.name : "اختر اختر_الباقة"}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Custom Options List (as in Screenshot 2) */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#161c28] border border-white/10 rounded-xl overflow-hidden shadow-2xl divide-y divide-white/5 max-h-72 overflow-y-auto">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const isAvailable = v.isAvailable !== false;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedVariantId(v.id);
                          setIsDropdownOpen(false);
                        }
                      }}
                      className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#eab308] text-white font-bold"
                          : isAvailable
                          ? "hover:bg-white/5 text-slate-200"
                          : "text-slate-500 opacity-60 cursor-not-allowed line-through"
                      }`}
                    >
                      {/* Price on Left */}
                      <span className={`font-mono text-xs ${isSelected ? "text-white" : isAvailable ? "text-amber-400" : "text-slate-500"}`}>
                        {v.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                      </span>

                      {/* Name on Right */}
                      <span className="truncate pr-2">
                        {v.name} {!isAvailable && <span className="text-red-500 text-xs font-bold mr-1">(غير متوفر)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Dynamic Inputs based on product form fields */}
        {product.formFields.map((field) => (
          <div key={field.id} className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-300">
              {field.label}
            </label>
            <input
              type={field.fieldType === "password" ? "password" : "text"}
              value={formData[field.fieldName] || ""}
              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder || `أدخل ${field.label}`}
              required={field.isRequired}
              className="w-full bg-[#161c28] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        ))}

        {/* Coupon Code Drawer / Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCouponOpen((prev) => !prev)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>هل لديك كود خصم أو قسيمة؟</span>
          </button>

          {couponOpen && (
            <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="أدخل كود الخصم"
                  className="flex-1 bg-[#121824] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isCheckingCoupon || !couponCode.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  {isCheckingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تطبيق"}
                </button>
              </div>

              {couponMessage && (
                <div
                  className={`text-xs ${
                    couponMessage.type === "success" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {couponMessage.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {orderError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-bold">
            {orderError}
          </div>
        )}

        {/* 3. Total Price Card (Green Container matching Screenshot 2) */}
        <div className="bg-[#00c076] text-white rounded-2xl p-4 text-center shadow-lg shadow-emerald-500/10 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-50">
            <CreditCard className="w-4 h-4" />
            <span>السعر الإجمالي</span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            $ {finalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
          </div>
        </div>

        {/* 4. Submit Order Button (إرسال الطلب matching Screenshot 1 & 2) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1b2230] hover:bg-[#232c3e] border border-white/10 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-sm shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>جاري إرسال الطلب...</span>
            </>
          ) : (
            <>
              <span>إرسال الطلب</span>
              <span className="text-base leading-none">←</span>
            </>
          )}
        </button>

      </form>

      {/* 5. Insufficient Balance Popup Modal (matching Screenshot 3) */}
      {showInsufficientBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#151922] border border-white/10 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Red Circle with X */}
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-3">
              <X className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Red Title: فشل الطلب */}
            <h3 className="text-lg font-black text-red-500 mb-4">
              فشل الطلب
            </h3>

            {/* Gray box with message: رصيد غير كافي لإتمام العملية */}
            <div className="bg-[#1f2533] text-slate-200 text-xs sm:text-sm font-medium py-3 px-4 rounded-xl mb-6">
              رصيد غير كافي لإتمام العملية
            </div>

            {/* Gold Button: حسناً */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowInsufficientBalanceModal(false)}
                className="w-full bg-[#f59e0b] hover:bg-amber-500 text-black font-black py-3 rounded-xl transition-colors text-sm shadow-lg shadow-amber-500/20"
              >
                حسناً
              </button>

              <Link
                href="/deposit"
                className="block text-xs text-amber-400 hover:underline pt-1 font-bold"
              >
                + شحن المحفظة الآن
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
