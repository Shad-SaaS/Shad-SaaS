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
      {/* Floating 3-dots action bubble on bottom-left matching screenshots */}
      <div className="fixed bottom-20 left-4 z-40">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="w-11 h-11 rounded-full bg-[#333d4e]/90 hover:bg-[#475569] text-white flex items-center justify-center shadow-lg border border-white/10 transition-transform active:scale-95"
          title="خيارات إضافية"
        >
          <MoreHorizontal className="w-5 h-5 text-slate-200" />
        </button>
      </div>

      {/* Main Persistent Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d121c]/95 backdrop-blur-md border-t border-white/5 px-4 py-2 flex items-center justify-between text-slate-400 max-w-lg mx-auto shadow-2xl">
        
        {/* 1. Shopping Cart / Orders (Left in LTR, Right in RTL) */}
        <Link
          href={user ? "/orders" : "/login"}
          className={`flex items-center justify-center p-2 rounded-full transition-all ${
            isOrders
              ? "bg-[#1f2838] text-white shadow-inner"
              : "text-slate-400 hover:text-white"
          }`}
          title="طلباتي"
        >
          <ShoppingCart className="w-5 h-5" />
        </Link>

        {/* 2. Notifications Bell */}
        <Link
          href={user ? "/notification" : "/login"}
          className={`flex items-center justify-center p-2 rounded-full transition-all ${
            isNotifications
              ? "bg-[#1f2838] text-white shadow-inner"
              : "text-slate-400 hover:text-white"
          }`}
          title="الإشعارات"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* 3. Telegram Support */}
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-cyan-400 transition-all"
          title="قناة التلغرام والدعم"
        >
          <Send className="w-5 h-5" />
        </a>

        {/* 4. Wallet */}
        <Link
          href={user ? "/wallet" : "/login"}
          className={`flex items-center justify-center p-2 rounded-full transition-all ${
            isWallet
              ? "bg-[#1f2838] text-white shadow-inner"
              : "text-slate-400 hover:text-white"
          }`}
          title="المحفظة"
        >
          <Wallet className="w-5 h-5" />
        </Link>

        {/* 5. Home (الرئيسية) */}
        <Link
          href="/"
          className={`flex items-center justify-center p-2 rounded-full transition-all ${
            isHome
              ? "bg-[#1f2838] text-white shadow-inner"
              : "text-slate-400 hover:text-white"
          }`}
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </Link>
      </nav>
    </>
  );
}
