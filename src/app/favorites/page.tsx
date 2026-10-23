"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Heart } from "lucide-react";

export default function FavoritesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-2">
        <h1 className="text-base sm:text-lg font-black text-white">المفضلة</h1>
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xl bg-[#141b26] text-slate-400 hover:text-white transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث في المفضلة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* Empty State matching Screenshot 3 in Batch 4 */}
      <div className="bg-[#121824] p-14 rounded-3xl text-center border border-white/5 space-y-3 mt-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-2xl">
          📋
        </div>
        <h3 className="text-sm font-bold text-white">لا توجد عناصر</h3>
        <p className="text-xs text-slate-400">
          أضف من نافذة شراء الخدمة أو من صفحة طريقة الدفع.
        </p>
      </div>

    </div>
  );
}
