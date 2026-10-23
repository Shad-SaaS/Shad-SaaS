"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Search,
  Key,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Copy,
  RotateCcw,
} from "lucide-react";

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  customerInputs: string;
  deliveryNotes?: string | null;
  refundAmount: number;
  externalOrderId?: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    name: string;
    executionTime?: string | null;
  };
  items: {
    id: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface AdminOrdersClientProps {
  initialOrders: OrderItem[];
  currency?: string;
}

export default function AdminOrdersClient({
  initialOrders,
  currency = "ل.س",
}: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    orderId: string;
    targetStatus: "PROCESSING" | "COMPLETED" | "CANCELLED" | "PARTIAL";
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  const [noteInput, setNoteInput] = useState("");
  const [deliveryNotesInput, setDeliveryNotesInput] = useState("");
  const [partialRefundInput, setPartialRefundInput] = useState("");
  const [refundToWallet, setRefundToWallet] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const filtered = orders.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q) ||
        o.product.name.toLowerCase().includes(q) ||
        (o.externalOrderId && o.externalOrderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyProviderId = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAction = (
    order: OrderItem,
    targetStatus: "PROCESSING" | "COMPLETED" | "CANCELLED" | "PARTIAL"
  ) => {
    setActionModal({
      orderId: order.id,
      targetStatus,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
    setNoteInput("");
    setDeliveryNotesInput(order.deliveryNotes || "");
    setPartialRefundInput("");
    setRefundToWallet(true);
    setFeedback(null);
  };

  const handleExecuteStatusUpdate = async () => {
    if (!actionModal) return;

    setProcessingId(actionModal.orderId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/orders/${actionModal.orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionModal.targetStatus,
          note: noteInput,
          deliveryNotes: deliveryNotesInput,
          refundToWallet,
          partialRefundAmount:
            actionModal.targetStatus === "PARTIAL"
              ? Number(partialRefundInput)
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل تحديث الطلب", isError: true });
      } else {
        setFeedback({ text: data.message || "تم تحديث حالة الطلب بنجاح!" });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === actionModal.orderId
              ? {
                  ...o,
                  status: actionModal.targetStatus,
                  deliveryNotes: deliveryNotesInput || o.deliveryNotes,
                  refundAmount:
                    actionModal.targetStatus === "CANCELLED" && refundToWallet
                      ? o.totalAmount
                      : actionModal.targetStatus === "PARTIAL" && refundToWallet
                      ? Number(partialRefundInput)
                      : o.refundAmount,
                }
              : o
          )
        );
        setActionModal(null);
      }
    } catch (err: any) {
      setFeedback({ text: "حدث خطأ: " + err.message, isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-cyan-400" />
            <span>إدارة وتنفيذ طلبات العملاء</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            متابعة مراحل التنفيذ، ربط أرقام المزودين، إدخال أكواد التسليم، والاسترداد المالي الآمن
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold ${
              filter === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            الكل ({orders.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-bold ${
              filter === "PENDING" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            انتظار ({orders.filter((o) => o.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("PROCESSING")}
            className={`px-3 py-1.5 rounded-xl font-bold ${
              filter === "PROCESSING" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            قيد التنفيذ ({orders.filter((o) => o.status === "PROCESSING").length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl font-bold ${
              filter === "COMPLETED" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            مكتمل ({orders.filter((o) => o.status === "COMPLETED").length})
          </button>
          <button
            onClick={() => setFilter("CANCELLED")}
            className={`px-3 py-1.5 rounded-xl font-bold ${
              filter === "CANCELLED" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            مرفوض-ملغي ({orders.filter((o) => o.status === "CANCELLED").length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.isError
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث برقم الطلب، رقم المزود، اسم العميل، أو الخدمة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-xs font-tajawal pr-10"
        />
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
      </div>

      {/* Orders List / Table */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center text-slate-500 text-xs">
            لا توجد أي طلبات مطابقة للشروط المحددة.
          </div>
        ) : (
          filtered.map((order) => {
            const isExpanded = expandedId === order.id;
            let parsedInputs: Record<string, string> = {};
            try {
              parsedInputs = JSON.parse(order.customerInputs);
            } catch {}

            return (
              <div
                key={order.id}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden transition-all text-xs"
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      title="عرض التفاصيل"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400">{order.orderNumber}</span>
                        <span className="text-white font-tajawal font-black">{order.product.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>العميل: <strong className="text-slate-300">{order.user.name}</strong></span>
                        {order.externalOrderId && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <span>رقم المزود: {order.externalOrderId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyProviderId(order.id, order.externalOrderId!)}
                              className="text-slate-400 hover:text-white"
                              title="نسخ رقم المزود"
                            >
                              {copiedId === order.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-sm font-black text-white">
                        {order.totalAmount.toLocaleString("ar-SA")} {currency}
                      </div>
                      {order.refundAmount > 0 && (
                        <div className="text-[10px] text-purple-400 font-bold">
                          مسترد: {order.refundAmount.toLocaleString("ar-SA")}
                        </div>
                      )}
                    </div>

                    <div>
                      {order.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          انتظار
                        </span>
                      )}
                      {order.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <Zap className="w-3 h-3" />
                          قيد التنفيذ
                        </span>
                      )}
                      {order.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          مكتمل
                        </span>
                      )}
                      {order.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          مرفوض-ملغي
                        </span>
                      )}
                      {order.status === "PARTIAL" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <AlertCircle className="w-3 h-3" />
                          جزئي
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <div className="flex items-center gap-1.5">
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => handleOpenAction(order, "PROCESSING")}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            بدء التنفيذ
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenAction(order, "COMPLETED")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                        >
                          قبول الطلب
                        </button>
                        <button
                          onClick={() => handleOpenAction(order, "CANCELLED")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[11px]"
                          title="رفض أو إلغاء الطلب"
                        >
                          رفض الطلب
                        </button>
                        <button
                          onClick={() => handleOpenAction(order, "PARTIAL")}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-[11px]"
                        >
                          جزئي
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-white/5 space-y-4 bg-black/20">
                    <div>
                      <div className="text-slate-400 font-bold mb-1">بيانات العميل والمدخلات:</div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(parsedInputs).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-mono font-black text-cyan-300 select-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.deliveryNotes && (
                      <div>
                        <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                          <Key className="w-3.5 h-3.5" />
                          <span>بيانات التسليم المسلمة للعميل:</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 font-mono text-white select-all">
                          {order.deliveryNotes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Transition Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel border border-white/15 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">
              تحديث حالة الطلب: <span className="font-mono text-cyan-400">{actionModal.orderNumber}</span>
            </h3>

            {actionModal.targetStatus === "COMPLETED" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  بيانات التسليم أو كود التفعيل (سيظهر للعميل في تفاصيل طلبه):
                </label>
                <textarea
                  rows={3}
                  placeholder="أدخل كود التفعيل أو رسالة التأكيد هنا..."
                  value={deliveryNotesInput}
                  onChange={(e) => setDeliveryNotesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono"
                />
              </div>
            )}

            {actionModal.targetStatus === "CANCELLED" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                  <div className="font-bold">خيارات رفض / إلغاء الطلب:</div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundToWallet}
                      onChange={(e) => setRefundToWallet(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-white font-bold">
                      إعادة كامل المبلغ ({actionModal.totalAmount.toLocaleString("ar-SA")} {currency}) لمحفظة العميل فورياً
                    </span>
                  </label>
                  {!refundToWallet && (
                    <div className="text-[11px] text-amber-300">
                      تنبيه: سيتم رفض الطلب دون إعادة المبلغ للمحفظة.
                    </div>
                  )}
                </div>
              </div>
            )}

            {actionModal.targetStatus === "PARTIAL" && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs">
                  إنجاز جزئي: أدخل المبلغ المراد استرداده إلى محفظة العميل للجزء غير المنفذ.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    المبلغ المسترد للمحفظة ({currency}):
                  </label>
                  <input
                    type="number"
                    max={actionModal.totalAmount}
                    placeholder="مثال: 25000"
                    value={partialRefundInput}
                    onChange={(e) => setPartialRefundInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                سبب الرفض أو ملاحظة داخلية (اختياري):
              </label>
              <input
                type="text"
                placeholder="مثال: الحساب غير موجود أو تم إدخال آيدي خاطئ"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteStatusUpdate}
                disabled={processingId !== null}
                className="px-5 py-2 rounded-xl glow-btn font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {processingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>تأكيد الإجراء</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
