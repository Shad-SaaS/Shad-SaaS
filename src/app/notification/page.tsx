"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, CheckCheck, Bell } from "lucide-react";

export default function NotificationPage() {
  const router = useRouter();
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-2">
        <button
          onClick={() => {}}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold"
        >
          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>تعليم الكل كمقروء</span>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-black text-white">الإشعارات</h1>
          <button
            onClick={() => router.back()}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث في الإشعارات"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* Filter Row 1 (Read / Unread) */}
      <div className="flex items-center justify-end gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterRead("read")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            filterRead === "read"
              ? "bg-slate-200 text-slate-900 shadow-sm"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          مقروء
        </button>
        <button
          onClick={() => setFilterRead("unread")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            filterRead === "unread"
              ? "bg-slate-200 text-slate-900 shadow-sm"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          غير مقروء
        </button>
        <button
          onClick={() => setFilterRead("all")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            filterRead === "all"
              ? "bg-slate-200 text-slate-900 shadow-sm"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          الكل
        </button>
      </div>

      {/* Filter Row 2 (Categories) */}
      <div className="flex items-center justify-end gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory("admin")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterCategory === "admin"
              ? "bg-slate-200 text-slate-900"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          📢 الإدارة
        </button>
        <button
          onClick={() => setFilterCategory("api")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterCategory === "api"
              ? "bg-slate-200 text-slate-900"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          API
        </button>
        <button
          onClick={() => setFilterCategory("deposit")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterCategory === "deposit"
              ? "bg-slate-200 text-slate-900"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          💳 الإيداع
        </button>
        <button
          onClick={() => setFilterCategory("orders")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterCategory === "orders"
              ? "bg-slate-200 text-slate-900"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          🛒 الطلبات
        </button>
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterCategory === "all"
              ? "bg-slate-200 text-slate-900"
              : "bg-[#141b26] text-slate-400 hover:text-white"
          }`}
        >
          الكل
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-[#121824] p-14 rounded-3xl text-center border border-white/5 space-y-3 mt-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-2xl">
          📋
        </div>
        <h3 className="text-sm font-bold text-white">لا توجد عناصر</h3>
      </div>

    </div>
  );
}
