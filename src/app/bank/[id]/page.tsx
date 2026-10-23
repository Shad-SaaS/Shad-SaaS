"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowRight,
  Heart,
  Info,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Upload,
} from "lucide-react";

export default function BankDepositPage() {
  const router = useRouter();
  const params = useParams();
  const bankId = params?.id as string;

  // Step 1: Input amount | Step 2: Invoice & Countdown | Step 3: Result
  const [step, setStep] = useState<1 | 2>(1);
  const [showWarningModal, setShowWarningModal] = useState(true);
  const [amount, setAmount] = useState<string>("3");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  const isUsdt = bankId === "6" || bankId === "7";
  const walletAddress = isUsdt
    ? "0x930174B6F225B1FD75BEe6ab020980ca8ccf9c83"
    : "06cc35f089a2dd0b31d0144fd2627009";

  const bankTitle = isUsdt
    ? "عملة usdt(Bep20)"
    : bankId === "14"
    ? "شام كاش آلي ل.س"
    : bankId === "15"
    ? "سيريتل كاش"
    : "شام كاش آلي دولار $";

  // Countdown timer for Step 2
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string, type: "address" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleRequestInvoice = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 1) return;
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim()) return;

    setIsSubmitting(true);
    setVerificationFailed(false);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethodCode: bankId,
          referenceNumber: transactionRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerificationFailed(true);
      } else {
        router.push("/deposit/history");
      }
    } catch {
      setVerificationFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* 1. Initial Warning Modal matching Screenshot 1 in Batch 5 */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141b27] border border-white/10 rounded-3xl p-5 max-w-sm w-full text-center relative shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>تعليمات الدفع</span>
              </span>
              <button
                onClick={() => setShowWarningModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Red Warning Banner Card with Alert Triangle */}
            <div className="bg-[#b91c1c] text-white p-5 rounded-2xl space-y-2 shadow-lg border border-red-500/30">
              <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black tracking-wide">تحذير هام جداً</h2>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-bold bg-[#0f141d] p-3 rounded-2xl border border-white/5">
              يرجى التحويل من حسابك الشخصي وعدم إخفاء الاسم حتى لا يتم مصادرة الدفعة المرسلة
            </p>

            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-2.5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>فهمت</span>
            </button>

          </div>
        </div>
      )}

      {/* 2. Top Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-2">
        <button
          onClick={() => setShowWarningModal(true)}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-bold"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>عرض التعليمات</span>
        </button>

        <Link
          href="/deposit"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold"
        >
          <span>العودة لطرق الدفع</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Title + Badges */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        <div className="flex items-center gap-2">
          {!isUsdt && (
            <span className="bg-slate-800 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10">
              تلقائي
            </span>
          )}
          <h1 className="text-base sm:text-lg font-black text-white">{bankTitle}</h1>
        </div>
      </div>

      {/* ------------------------------------------- */}
      {/* STEP 1: Enter Amount (Screenshot 2 in Batch 5) */}
      {/* ------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Instructions List */}
          <div className="bg-[#121824] p-4 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span>🟢</span>
              <span>خدمة شام كاش وسيريتل كاش تعمل بشكل آلي 7/24</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>أقل عملية إيداع 3$</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>أكبر عملية إيداع 500$</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>يرجى وضع المبلغ المراد إرساله على حسابك</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>عند الانتقال للصفحة الثانية انسخ عنوان المحفظة في كل عملية تحويل</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>قم بوضع رقم عملية التحويل الموجودة على إشعار التحويل</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span>❌</span>
              <span>مهم جداً: يرجى إرسال الحوالات من حسابك الشخصي فقط</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="w-44 h-44 mx-auto rounded-3xl bg-white p-3 shadow-xl flex items-center justify-center border-4 border-[#1c2432]">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${walletAddress}`}
              alt="Wallet QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold">القيمة</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-3 pl-10 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-right shadow-inner"
              />
              <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">$</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">من 3 إلى 500 $</span>
          </div>

          {/* Value Summary Pill */}
          <div className="bg-[#0f1f1a] border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-bold font-mono">USD</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">القيمة التي سيتم إرسالها:</span>
              <span className="text-emerald-400 font-mono font-black text-sm">{parseFloat(amount || "0").toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRequestInvoice}
            className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-3 rounded-2xl text-xs transition-colors shadow-lg active:scale-98"
          >
            طلب
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: Invoice & Countdown (Screenshot 3 & 4 in Batch 5)       */}
      {/* ------------------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-4">
          
          {/* Success Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs font-bold text-center">
            تم إنشاء الطلب. أكمل إدخال رقم العملية في الخطوة التالية.
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-2xl text-xs font-bold text-center">
            يرجى عدم مغادرة الصفحة حتى إتمام العملية
          </div>

          <p className="text-xs text-slate-300 text-center">
            يرجى إرسال المبلغ بحيث يصلنا كامل المبلغ المطلوب
          </p>

          {/* QR Code */}
          <div className="w-40 h-40 mx-auto rounded-3xl bg-white p-3 shadow-xl flex items-center justify-center border-4 border-[#1c2432]">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${walletAddress}`}
              alt="Wallet QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Wallet Address Box with Copy */}
          <div className="bg-[#121824] p-3 rounded-2xl border border-white/5 space-y-2">
            <div className="text-xs font-mono text-cyan-300 break-all text-center p-2 bg-[#0d121b] rounded-xl border border-white/5 select-all">
              {walletAddress}
            </div>
            <button
              onClick={() => handleCopy(walletAddress, "address")}
              className="w-full bg-[#273142] hover:bg-[#323e53] text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedAddress ? "تم النسخ" : "نسخ"}</span>
            </button>
          </div>

          {/* Required Amount Box with Copy */}
          <div className="bg-[#121824] p-3 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <button
                onClick={() => handleCopy(amount, "amount")}
                className="bg-[#273142] hover:bg-[#323e53] text-white px-3 py-1 rounded-lg text-xs"
              >
                {copiedAmount ? "تم النسخ" : "نسخ"}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">{parseFloat(amount).toFixed(2)} USD</span>
                <span className="text-slate-400 font-sans">المبلغ المطلوب</span>
              </div>
            </div>
          </div>

          {/* Circular Countdown Timer */}
          <div className="text-center space-y-2 py-2">
            <p className="text-xs text-slate-400">يرجى إرسال رقم العملية قبل انتهاء الوقت</p>
            <div className="w-28 h-28 mx-auto rounded-full border-4 border-slate-700/80 flex items-center justify-center font-mono font-black text-2xl text-white shadow-xl bg-[#121824]">
              {formatTimer(timeLeft)}
            </div>
          </div>

          {/* Red Fallback Alert if Verification Failed matching Screenshot 1 in Batch 6 */}
          {verificationFailed && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl text-rose-300 text-xs font-bold leading-relaxed text-center space-y-2">
              <p>تعذر التحقق التلقائي من عملية الدفع. قد تكون البيانات غير متطابقة.</p>
              <p className="text-slate-300 text-[11px]">تم تحويل طلبك للمراجعة اليدوية وسيقوم المشرف باعتماده بعد التدقيق.</p>
              <Link
                href="/deposit/history"
                className="inline-block bg-[#3b4454] hover:bg-[#4a5568] text-white font-bold px-4 py-1.5 rounded-xl text-xs mt-1"
              >
                دفعاتي
              </Link>
            </div>
          )}

          {/* Transaction Ref Input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder="رقم العملية (Transaction Hash / Ref)"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-right shadow-inner"
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={isSubmitting || !transactionRef.trim()}
            className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-3 rounded-2xl text-xs transition-colors shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>تأكيد</span>}
          </button>

        </div>
      )}

    </div>
  );
}
