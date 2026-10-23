"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export interface QuickBuyItem {
  id: string;
  name: string;
  price: number;
  currency?: string;
  categoryName?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputType?: "id" | "email" | "phone" | "none";
  executionHint?: string;
  isUnavailable?: boolean;
}

interface QuickBuyModalProps {
  item: QuickBuyItem | null;
  userBalance: number;
  isLoggedIn: boolean;
  onClose: () => void;
  onSuccess?: (orderNumber: string) => void;
}

export default function QuickBuyModal({
  item,
  userBalance,
  isLoggedIn,
  onClose,
  onSuccess,
}: QuickBuyModalProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  if (!item) return null;

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Balance check
    if (userBalance < item.price) {
      setInsufficientBalance(true);
      return;
    }

    if (item.inputType && item.inputType !== "none" && !inputValue.trim()) {
      setErrorMsg("يرجى إدخال البيانات المطلوبة قبل المتابعة");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          variantId: item.id,
          customerInputs: JSON.stringify({
            [item.inputLabel || "playerId"]: inputValue,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("balance") || data.error?.includes("رصيد")) {
          setInsufficientBalance(true);
        } else {
          setErrorMsg(data.error || "حدث خطأ أثناء تنفيذ الطلب");
        }
      } else {
        if (onSuccess) {
          onSuccess(data.orderNumber || data.id);
        } else {
          router.push("/orders");
        }
        onClose();
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة مجدداً");
    } finally {
      setIsSubmitting(false);
    }
  };

  // State A: Insufficient Balance Modal matching Screenshot 15
  if (insufficientBalance) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#141822] border border-white/10 rounded-3xl p-6 max-w-xs w-full text-center relative shadow-2xl space-y-4">
          
          {/* Red X Icon Circle */}
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <X className="w-7 h-7" />
          </div>

          <h3 className="text-base font-black text-rose-500">فشل الطلب</h3>

          <div className="bg-[#0e121a] p-3 rounded-2xl border border-white/5 text-xs text-slate-300 font-medium">
            رصيد غير كافي لإتمام العملية
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setInsufficientBalance(false);
                onClose();
              }}
              className="w-full bg-[#f59e0b] hover:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20"
            >
              حسناً
            </button>
            <button
              onClick={() => {
                setInsufficientBalance(false);
                router.push("/deposit");
              }}
              className="w-full text-xs text-amber-400 hover:underline font-bold py-1"
            >
              + شحن المحفظة الآن
            </button>
          </div>

        </div>
      </div>
    );
  }

  // State B: Quick Buy Modal matching Screenshots 7, 8, 9, 10, 11, 12, 13
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141b27] border border-white/10 rounded-3xl p-5 max-w-sm w-full text-right relative shadow-2xl space-y-4">
        
        {/* Top Header: Price Pill & Title with Heart */}
        <div className="flex items-center justify-between gap-3">
          {/* Price Pill */}
          <div className="bg-[#242e3f] text-white font-mono font-bold text-xs px-3 py-1 rounded-full border border-white/5">
            $ {item.price.toFixed(4).replace(/\.?0+$/, "")}
          </div>

          {/* Title + Heart */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white truncate max-w-[170px]">{item.name}</h3>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Total Price Display */}
        <div className="bg-[#0f141d] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold">الاجمالي</span>
          <span className="font-mono font-black text-white text-sm">
            {item.price.toFixed(4).replace(/\.?0+$/, "")} $
          </span>
        </div>

        {/* Dynamic Input based on item type */}
        {item.inputType && item.inputType !== "none" && (
          <div className="space-y-1">
            <input
              type={item.inputType === "email" ? "email" : "text"}
              placeholder={item.inputPlaceholder || "الآيدي"}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setErrorMsg("");
              }}
              className="w-full bg-[#0f141d] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-right shadow-inner"
            />
          </div>
        )}

        {errorMsg && (
          <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Buy Button */}
          <button
            onClick={handlePurchase}
            disabled={isSubmitting}
            className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-2.5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>شراء</span>
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full bg-transparent border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold py-2.5 rounded-2xl text-xs transition-colors"
          >
            إلغاء
          </button>
        </div>

        {/* Execution hint box if present */}
        {item.executionHint && (
          <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-relaxed space-y-1">
            <div className="flex items-center gap-1 text-slate-300">
              <span>✓</span>
              <span>{item.executionHint}</span>
            </div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <span>✅</span>
              <span>يتم تنفيذ الطلب خلال 1 ساعة</span>
            </div>
          </div>
        )}

        {/* Bottom Subtitle */}
        <div className="text-[10px] text-slate-500 font-mono text-center pt-1 border-t border-white/5">
          | {item.name}
        </div>

      </div>
    </div>
  );
}
