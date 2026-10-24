"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Send, Bell, ShoppingCart, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  user?: {
    id: string;
    name: string;
  } | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isWallet = pathname?.startsWith("/wallet") || pathname?.startsWith("/deposit");
  const isNotifications = pathname?.startsWith("/notification");
  const isOrders = pathname?.startsWith("/orders");

  return (
    <>
      {/* Floating 3-dots action bubble on bottom-left matching reference image */}
      <div className="fixed bottom-[68px] left-4 z-40">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="w-12 h-12 rounded-full bg-[#3d4655] hover:bg-[#4b5668] text-white flex items-center justify-center shadow-2xl border border-white/10 transition-transform active:scale-95"
          title="للأعلى"
        >
          <MoreHorizontal className="w-6 h-6 text-white stroke-[2.5]" />
        </button>
      </div>

      {/* Main Persistent Bottom Bar matching reference image */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d111a]/98 backdrop-blur-lg border-t border-white/10 px-6 py-2.5 flex items-center justify-between text-slate-400 shadow-2xl">
        
        {/* 1. Home (Far Right in RTL) */}
        <Link
          href="/"
          className={`flex items-center justify-center transition-all ${
            isHome
              ? "bg-[#1d2535] text-white p-2.5 rounded-2xl shadow-md border border-white/10"
              : "p-2 text-slate-400 hover:text-white"
          }`}
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </Link>

        {/* 2. Wallet */}
        <Link
          href={user ? "/wallet" : "/login"}
          className={`flex items-center justify-center transition-all ${
            isWallet
              ? "bg-[#1d2535] text-white p-2.5 rounded-2xl shadow-md border border-white/10"
              : "p-2 text-slate-400 hover:text-white"
          }`}
          title="المحفظة"
        >
          <Wallet className="w-5 h-5" />
        </Link>

        {/* 3. Telegram Support (Center) */}
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-2 text-slate-400 hover:text-cyan-400 transition-colors"
          title="قناة التلغرام والدعم"
        >
          <Send className="w-5 h-5" />
        </a>

        {/* 4. Notifications Bell */}
        <Link
          href={user ? "/notification" : "/login"}
          className={`flex items-center justify-center transition-all ${
            isNotifications
              ? "bg-[#1d2535] text-white p-2.5 rounded-2xl shadow-md border border-white/10"
              : "p-2 text-slate-400 hover:text-white"
          }`}
          title="الإشعارات"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* 5. Shopping Cart / Orders (Far Left in RTL) */}
        <Link
          href={user ? "/orders" : "/login"}
          className={`flex items-center justify-center transition-all ${
            isOrders
              ? "bg-[#1d2535] text-white p-2.5 rounded-2xl shadow-md border border-white/10"
              : "p-2 text-slate-400 hover:text-white"
          }`}
          title="طلباتي"
        >
          <ShoppingCart className="w-5 h-5" />
        </Link>

      </nav>
    </>
  );
}
