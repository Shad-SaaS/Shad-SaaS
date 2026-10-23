"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowRight,
  Plus,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string | Date;
}

interface WalletDepositClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    walletBalance: number;
  };
  transactions: WalletTransaction[];
  currency?: string;
}

export default function WalletDepositClient({
  currentUser,
  transactions,
  currency = "$",
}: WalletDepositClientProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "orders" && t.type !== "ORDER_PAYMENT") return false;
    if (filterType === "refunds" && t.type !== "REFUND") return false;
    if (filterType === "manual" && t.type !== "DEPOSIT" && t.type !== "ADMIN_ADJUSTMENT") return false;
    return true;
  });

  const countOrders = transactions.filter((t) => t.type === "ORDER_PAYMENT").length;
  const countRefunds = transactions.filter((t) => t.type === "REFUND").length;
  const countManual = transactions.filter((t) => t.type === "DEPOSIT" || t.type === "ADMIN_ADJUSTMENT").length;

  const totalSpent = transactions
    .filter((t) => t.type === "ORDER_PAYMENT")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalDeposited = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-2">
        <h1 className="text-base sm:text-lg font-black text-white">محفظتي</h1>
        <button
          onClick={() => router.back()}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Three Colorful Stat Cards matching Screenshot 5 in Batch 2 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        {/* Purple Card: الوارد */}
        <div className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-3 sm:p-4 rounded-2xl text-white shadow-lg space-y-1">
          <div className="text-lg sm:text-xl font-black font-mono">
            {totalDeposited.toFixed(0)} $
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-purple-200">
            الوارد
          </div>
        </div>

        {/* Red Card: اجمالي مشتريات */}
        <div className="bg-gradient-to-br from-[#e11d48] to-[#be123c] p-3 sm:p-4 rounded-2xl text-white shadow-lg space-y-1">
          <div className="text-lg sm:text-xl font-black font-mono">
            {totalSpent.toFixed(0)} $
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-rose-200">
            اجمالي مشتريات
          </div>
        </div>

        {/* Green Card: رصيدك الحالي */}
        <div className="bg-gradient-to-br from-[#10b981] to-[#047857] p-3 sm:p-4 rounded-2xl text-white shadow-lg space-y-1">
          <div className="text-lg sm:text-xl font-black font-mono">
            {currentUser.walletBalance.toFixed(2)} $
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-emerald-100">
            رصيدك الحالي
          </div>
        </div>
      </div>

      {/* 2. Date Range Filter matching Screenshot 5 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-mono font-bold text-xs">2026 / 10 / 24</span>
          <span className="text-slate-500 text-[10px]">إلى تاريخ</span>
        </div>
        <div className="bg-[#121824] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-mono font-bold text-xs">2025 / 10 / 24</span>
          <span className="text-slate-500 text-[10px]">من تاريخ</span>
        </div>
      </div>

      {/* 3. Prominent Action Button: + إيداع matching Screenshot 5 */}
      <Link
        href="/deposit"
        className="block w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-3 rounded-2xl text-center text-xs sm:text-sm transition-colors shadow-lg active:scale-98"
      >
        + إيداع
      </Link>

      {/* 4. Section Title */}
      <h3 className="text-sm font-black text-white pt-2">سجل المعاملات</h3>

      {/* 5. Filter Pill Tabs matching Screenshot 5 */}
      <div className="flex items-center justify-end gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setFilterType("manual")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterType === "manual" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          دفعات يدوية {countManual}
        </button>
        <button
          onClick={() => setFilterType("refunds")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterType === "refunds" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          مسترجع الطلبات {countRefunds}
        </button>
        <button
          onClick={() => setFilterType("orders")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterType === "orders" ? "bg-slate-200 text-slate-900" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          طلبات {countOrders}
        </button>
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 rounded-xl shrink-0 transition-all ${
            filterType === "all" ? "bg-slate-200 text-slate-900 shadow-sm" : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          الكل {transactions.length}
        </button>
      </div>

      {/* 6. Summary Bar matching Screenshot 5 */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => alert("سيتم تصدير ملف الإكسل")}
          className="bg-[#3b4454] hover:bg-[#4a5568] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>تصدير اكسل</span>
        </button>

        <div className="bg-[#f59e0b] text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
          اجمالي : {currentUser.walletBalance.toFixed(2)} $
        </div>
      </div>

      {/* 7. Empty State or Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-[#121824] p-14 rounded-3xl text-center border border-white/5 space-y-3 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h3 className="text-sm font-bold text-white">لا توجد عناصر</h3>
        </div>
      ) : (
        <div className="space-y-2.5 pt-2">
          {filteredTransactions.map((tx) => {
            const isPositive = tx.amount > 0;

            return (
              <div
                key={tx.id}
                className="bg-[#141b26] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between text-xs"
              >
                <span className={`font-mono font-bold text-sm ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} $
                </span>

                <div className="text-right">
                  <div className="text-white font-bold">{tx.description}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(tx.createdAt).toLocaleString("ar-SA")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
