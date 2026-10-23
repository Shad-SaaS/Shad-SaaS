"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Check,
  XCircle,
  ShieldAlert,
  Loader2,
  FileText,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  accountNumber: string;
  accountHolderName: string;
  instructions: string;
  minDeposit: number;
}

interface DepositRequest {
  id: string;
  depositNumber: string;
  paymentMethodCode: string;
  amount: number;
  referenceNumber: string;
  receiptImageUrl?: string | null;
  status: string;
  rejectionReason?: string | null;
  createdAt: Date;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

interface WalletDepositClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    walletBalance: number;
  };
  paymentMethods: PaymentMethod[];
  depositRequests: DepositRequest[];
  transactions: WalletTransaction[];
  currency?: string;
}

export default function WalletDepositClient({
  currentUser,
  paymentMethods,
  depositRequests: initialDepositRequests,
  transactions,
  currency = "ل.س",
}: WalletDepositClientProps) {
  const [selectedMethodCode, setSelectedMethodCode] = useState<string>(
    paymentMethods[0]?.code || ""
  );
  const [amount, setAmount] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const [depositList, setDepositList] = useState(initialDepositRequests);

  const selectedMethod = paymentMethods.find((m) => m.code === selectedMethodCode);

  const handleCopyAccount = () => {
    if (selectedMethod?.accountNumber) {
      navigator.clipboard.writeText(selectedMethod.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFormError(data.error || "فشل رفع الملف");
      } else {
        setReceiptUrl(data.url);
      }
    } catch {
      setFormError("حدث خطأ أثناء رفع صورة الإشعار");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setFormError("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (selectedMethod && numAmount < selectedMethod.minDeposit) {
      setFormError(
        `الحد الأدنى للشحن عبر ${selectedMethod.name} هو ${selectedMethod.minDeposit.toLocaleString("ar-SA")} ${currency}`
      );
      return;
    }

    if (!referenceNumber.trim()) {
      setFormError("يرجى إدخال رقم إشعار المعاملة أو رقم الحوالة");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodCode: selectedMethodCode,
          amount: numAmount,
          referenceNumber: referenceNumber.trim(),
          receiptImageUrl: receiptUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFormError(data.error || "فشل تقديم طلب الشحن");
      } else {
        setFormSuccess("تم تقديم طلب الشحن بنجاح! سيتم فحص الإشعار واعتماد الرصيد فورياً من قبل الإدارة.");
        setAmount("");
        setReferenceNumber("");
        setReceiptUrl("");
        // Optimistically prepend to list
        setDepositList([
          {
            id: data.deposit.id,
            depositNumber: data.deposit.depositNumber,
            paymentMethodCode: selectedMethodCode,
            amount: numAmount,
            referenceNumber,
            status: "PENDING",
            createdAt: new Date(),
          },
          ...depositList,
        ]);
      }
    } catch (err: any) {
      setFormError("فشل الاتصال بالخادم: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* 1. Wallet Balance Hero Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-cyan-950/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span>محفظتي الإلكترونية</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {currentUser.walletBalance.toLocaleString("ar-SA")}{" "}
              <span className="text-xl font-tajawal text-cyan-400">{currency}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              حساب العميل: <span className="text-slate-300 font-bold">{currentUser.name}</span> ({currentUser.email})
            </p>
          </div>

          <a
            href="#deposit-form"
            className="glow-btn px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>طلب شحن رصيد جديد</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 2. Top-up Deposit Form (Left Column) */}
        <div id="deposit-form" className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
          <h2 className="text-lg font-black text-white mb-2">طلب شحن رصيد (دفع يدوي معتمد)</h2>
          <p className="text-xs text-slate-400 mb-6">
            اختر وسيلة الدفع المناسبة، ثم حوّل المبلغ وأدخل رقم الإشعار لزيادة رصيدك فورياً.
          </p>

          <form onSubmit={handleSubmitDeposit} className="space-y-6">
            
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                1. وسيلة الدفع:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const isSelected = method.code === selectedMethodCode;
                  return (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setSelectedMethodCode(method.code)}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {method.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        حد أدنى: {method.minDeposit.toLocaleString("ar-SA")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Method Details & Account Info */}
            {selectedMethod && (
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">الرقم أو الحساب المحول إليه:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {selectedMethod.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                      title="نسخ الحساب"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">اسم صاحب الحساب / الجهة:</span>
                  <span className="font-bold text-white">{selectedMethod.accountHolderName}</span>
                </div>

                <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-blue-400 font-bold">تعليمات التحويل: </span>
                  {selectedMethod.instructions}
                </div>
              </div>
            )}

            {/* Amount & Reference Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  2. المبلغ المحول ({currency}): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="مثال: 50000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  3. رقم الإشعار / المعاملة: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="رقم العملية من رسالة الكاش"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Receipt Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                4. صورة إشعار التحويل (اختياري ولكن يُسرّع الاعتماد):
              </label>
              
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>{uploadingReceipt ? "جارٍ الرفع..." : "اختر صورة الإشعار"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingReceipt}
                  />
                </label>

                {receiptUrl && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم رفع صورة الإشعار بنجاح</span>
                  </span>
                )}
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl glow-btn font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ إرسال طلب الشحن...</span>
                </>
              ) : (
                <span>إرسال طلب شحن الرصيد للمراجعة</span>
              )}
            </button>
          </form>
        </div>

        {/* 3. Deposit Requests History (Right Column) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>سجل طلبات الشحن الأخيرة</span>
          </h3>

          {depositList.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              لم تقدم أي طلبات شحن سابقة.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {depositList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono font-bold text-white">
                      <span>{dep.amount.toLocaleString("ar-SA")} {currency}</span>
                      <span className="text-[10px] text-slate-500 font-tajawal">
                        ({dep.paymentMethodCode})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      إشعار: <span className="font-mono text-slate-300">{dep.referenceNumber}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    {dep.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        قيد المراجعة
                      </span>
                    )}
                    {dep.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        تم الاعتماد
                      </span>
                    )}
                    {dep.status === "REJECTED" && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        title={dep.rejectionReason || "مرفوض"}
                      >
                        <XCircle className="w-3 h-3" />
                        مرفوض
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. Complete Wallet Ledger Transactions Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>سجل قيود المحفظة المالية (Audit Ledger)</span>
        </h3>
        <p className="text-xs text-slate-400">
          سجل محاسبي غير قابل للتعديل يوثق كل إضافة أو خصم من رصيد محفظتك بدقة.
        </p>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">
            لا توجد أي معاملات مالية مسجلة في محفظتك حتى الآن.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-3">التاريخ</th>
                  <th className="py-3 px-3">نوع العملية</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">الرصيد بعد العملية</th>
                  <th className="py-3 px-3">البيان والتفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        {tx.type === "DEPOSIT" && <span className="text-emerald-400">شحن رصيد</span>}
                        {tx.type === "ORDER_PAYMENT" && <span className="text-blue-400">دفع قيمة طلب</span>}
                        {tx.type === "REFUND" && <span className="text-purple-400">استرداد طلب ملغي</span>}
                        {tx.type === "PARTIAL_REFUND" && <span className="text-cyan-400">استرداد جزئي</span>}
                        {tx.type === "ADMIN_ADJUSTMENT" && <span className="text-amber-400">تعديل إداري</span>}
                      </td>
                      <td className="py-3 px-3 font-mono font-black whitespace-nowrap">
                        <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                          {isPositive ? "+" : ""}
                          {tx.amount.toLocaleString("ar-SA")} {currency}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-300 font-bold whitespace-nowrap">
                        {tx.balanceAfter.toLocaleString("ar-SA")} {currency}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {tx.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
