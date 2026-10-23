"use client";

import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Check,
  X,
  Search,
} from "lucide-react";

interface DepositItem {
  id: string;
  depositNumber: string;
  amount: number;
  paymentMethodCode: string;
  referenceNumber: string;
  receiptImageUrl?: string | null;
  status: string;
  rejectionReason?: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AdminDepositsClientProps {
  initialDeposits: DepositItem[];
  currency?: string;
}

export default function AdminDepositsClient({
  initialDeposits,
  currency = "ل.س",
}: AdminDepositsClientProps) {
  const [deposits, setDeposits] = useState(initialDeposits);
  const [filter, setFilter] = useState<string>("ALL"); // ALL, PENDING, APPROVED, REJECTED
  const [search, setSearch] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const filtered = deposits.filter((d) => {
    if (filter !== "ALL" && d.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        d.depositNumber.toLowerCase().includes(q) ||
        d.referenceNumber.toLowerCase().includes(q) ||
        d.user.name.toLowerCase().includes(q) ||
        d.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApprove = async (id: string) => {
    if (!confirm("هل أنت متأكد من اعتماد طلب الشحن؟ سيتم إضافة المبلغ مباشرة إلى محفظة العميل.")) {
      return;
    }

    setProcessingId(id);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setActionMessage({ text: data.error || "فشل اعتماد الطلب", isError: true });
      } else {
        setActionMessage({ text: data.message || "تم اعتماد الشحن وإضافة الرصيد بنجاح!" });
        setDeposits((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" } : d))
        );
      }
    } catch (err: any) {
      setActionMessage({ text: "حدث خطأ: " + err.message, isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;

    setProcessingId(rejectingId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/deposits/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "بيانات الحوالة غير صحيحة أو لم يتم الاستلام" }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setActionMessage({ text: data.error || "فشل رفض الطلب", isError: true });
      } else {
        setActionMessage({ text: "تم رفض طلب الشحن بنجاح" });
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === rejectingId
              ? { ...d, status: "REJECTED", rejectionReason: rejectReason }
              : d
          )
        );
        setRejectingId(null);
        setRejectReason("");
      }
    } catch (err: any) {
      setActionMessage({ text: "حدث خطأ: " + err.message, isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>إدارة ومراجعة طلبات شحن الرصيد</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة حوالات سيريتل كاش وشام كاش واعتماد إضافة الأرصدة ذرياً
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filter === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            الكل ({deposits.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filter === "PENDING" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            معلقة ({deposits.filter((d) => d.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filter === "APPROVED" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            معتمدة ({deposits.filter((d) => d.status === "APPROVED").length})
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filter === "REJECTED" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            مرفوضة ({deposits.filter((d) => d.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            actionMessage.isError
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {actionMessage.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث برقم الطلب، رقم الإشعار، أو اسم العميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-xs font-tajawal pr-10"
        />
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
      </div>

      {/* Deposits Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">رقم الطلب</th>
                <th className="py-3.5 px-4 font-bold">العميل</th>
                <th className="py-3.5 px-4 font-bold">المبلغ</th>
                <th className="py-3.5 px-4 font-bold">وسيلة الدفع</th>
                <th className="py-3.5 px-4 font-bold">رقم الإشعار</th>
                <th className="py-3.5 px-4 font-bold">إثبات الدفع</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">التاريخ</th>
                <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    لا توجد طلبات شحن مطابقة للشروط المحددة.
                  </td>
                </tr>
              ) : (
                filtered.map((dep) => {
                  const isProcessing = processingId === dep.id;
                  return (
                    <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {dep.depositNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{dep.user.name}</div>
                        <div className="text-[10px] text-slate-500">{dep.user.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-white whitespace-nowrap">
                        {dep.amount.toLocaleString("ar-SA")}{" "}
                        <span className="text-[10px] text-slate-400 font-tajawal">{currency}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold">
                          {dep.paymentMethodCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200 select-all">
                        {dep.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {dep.receiptImageUrl ? (
                          <button
                            onClick={() => setPreviewImage(dep.receiptImageUrl || null)}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-[11px]"
                          >
                            <span>معاينة الصورة</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">بدون صورة</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {dep.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            معلق
                          </span>
                        )}
                        {dep.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            معتمد
                          </span>
                        )}
                        {dep.status === "REJECTED" && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            title={dep.rejectionReason || "مرفوض"}
                          >
                            <XCircle className="w-3 h-3" />
                            مرفوض
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {new Date(dep.createdAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {dep.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(dep.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>موافقة</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(dep.id);
                                setRejectReason("");
                              }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-4 overflow-hidden">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white text-sm mb-3">إثبات الدفع المرفق</h3>
            <div className="max-h-[80vh] overflow-auto rounded-xl">
              <img src={previewImage} alt="Receipt" className="w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Prompt Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel border border-white/15 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">رفض طلب شحن الرصيد</h3>
            <p className="text-xs text-slate-400">
              يرجى كتابة سبب الرفض ليظهر للعميل في حسابه:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: رقم العملية غير مطابق للحساب أو لم يتم استلام الحوالة"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 focus:border-rose-500 focus:outline-none text-white text-xs font-tajawal"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId !== null}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
