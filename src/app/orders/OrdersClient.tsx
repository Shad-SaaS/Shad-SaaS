"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  totalPrice: number;
  status: string;
  customerInputs: string;
  deliveryNotes?: string | null;
  createdAt: string | Date;
  product?: {
    name: string;
    image?: string | null;
  };
}

interface OrdersClientProps {
  initialOrders: Order[];
  currency?: string;
}

export default function OrdersClient({
  initialOrders,
  currency = "$",
}: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status mapping
  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInputs.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === "completed" && order.status !== "COMPLETED") return false;
    if (filterStatus === "pending" && order.status !== "PENDING") return false;
    if (filterStatus === "processing" && order.status !== "PROCESSING") return false;
    if (filterStatus === "cancelled" && order.status !== "CANCELLED" && order.status !== "REJECTED") return false;

    return true;
  });

  const countCompleted = orders.filter((o) => o.status === "COMPLETED").length;
  const countPending = orders.filter((o) => o.status === "PENDING").length;
  const countProcessing = orders.filter((o) => o.status === "PROCESSING").length;
  const countCancelled = orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length;

  const totalSpent = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-2">
        <h1 className="text-base sm:text-lg font-black text-white">طلباتي</h1>
        <button
          onClick={() => router.back()}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Date Range Selector matching Screenshot 2 in Batch 3 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-mono font-bold text-xs">2026 / 10 / 24</span>
          <span className="text-slate-500 text-[10px]">إلى</span>
        </div>
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-mono font-bold text-xs">2025 / 10 / 24</span>
          <span className="text-slate-500 text-[10px]">من</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث برقم الطلب، UUID، بيانات الطلب، أو اسم الخدمة"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* Filter Row 1 (Status Tabs) matching Screenshot 2 */}
      <div className="flex items-center justify-end gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setFilterStatus("processing")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterStatus === "processing" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          قيد التنفيذ {countProcessing}
        </button>
        <button
          onClick={() => setFilterStatus("cancelled")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterStatus === "cancelled" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          مرفوض {countCancelled}
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterStatus === "pending" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          انتظار {countPending}
        </button>
        <button
          onClick={() => setFilterStatus("completed")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterStatus === "completed" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          مقبول {countCompleted}
        </button>
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterStatus === "all" ? "bg-slate-200 text-slate-900 shadow-sm" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          الكل {orders.length}
        </button>
      </div>

      {/* Filter Row 2 (Source Tabs) */}
      <div className="flex items-center justify-end gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setFilterSource("api")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterSource === "api" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          API 0
        </button>
        <button
          onClick={() => setFilterSource("web")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterSource === "web" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          من الموقع {orders.length}
        </button>
        <button
          onClick={() => setFilterSource("all")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterSource === "all" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          الكل {orders.length}
        </button>
      </div>

      {/* Action / Export Row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => alert("سيتم تصدير ملف الإكسل")}
          className="bg-[#3b4454] hover:bg-[#4a5568] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>تصدير اكسل</span>
        </button>

        <div className="bg-[#f59e0b] text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
          اجمالي : {totalSpent.toFixed(2)} $
        </div>
      </div>

      {/* Empty State or Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#121824] p-14 rounded-3xl text-center border border-white/5 space-y-3 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h3 className="text-sm font-bold text-white">لا توجد عناصر</h3>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {filteredOrders.map((order) => {
            const isCompleted = order.status === "COMPLETED";
            const isPending = order.status === "PENDING";
            const isProcessing = order.status === "PROCESSING";

            return (
              <div
                key={order.id}
                className="bg-[#141b26] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isPending
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : isProcessing
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isCompleted ? "مقبول" : isPending ? "انتظار" : isProcessing ? "قيد التنفيذ" : "مرفوض"}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white font-black">{order.orderNumber}</span>
                    <span className="text-slate-400">رقم الطلب:</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono font-bold text-emerald-400">{order.totalPrice.toFixed(2)} $</span>
                  <span className="text-white font-bold">{order.product?.name || "خدمة رقمية"}</span>
                </div>

                {order.deliveryNotes && (
                  <div className="bg-[#0e121a] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => handleCopyCode(order.deliveryNotes || "", order.id)}
                      className="text-cyan-400 hover:text-white p-1"
                      title="نسخ الكود"
                    >
                      {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-emerald-300 select-all font-bold">{order.deliveryNotes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
