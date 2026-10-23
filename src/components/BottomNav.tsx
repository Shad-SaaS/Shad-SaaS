"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Wallet, Home, Receipt, ShoppingCart } from "lucide-react";

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

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121619]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around text-slate-400 max-w-lg mx-auto sm:rounded-t-2xl shadow-2xl">
      {/* 1. Profile / Account */}
      <Link
        href={user ? "/settings" : "/login"}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
          isActive("/settings") || isActive("/login") ? "text-cyan-400" : "hover:text-white"
        }`}
      >
        <User className="w-5 h-5" />
      </Link>

      {/* 2. Wallet */}
      <Link
        href={user ? "/wallet" : "/login"}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
          isActive("/wallet") ? "text-cyan-400" : "hover:text-white"
        }`}
      >
        <Wallet className="w-5 h-5" />
      </Link>

      {/* 3. Center Home Floating Circle */}
      <Link
        href="/"
        className={`flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-white text-slate-900 shadow-xl border-4 border-[#0b0e11] hover:scale-105 transition-transform ${
          isActive("/") ? "bg-cyan-400 text-slate-950 font-black" : ""
        }`}
      >
        <Home className="w-6 h-6" />
      </Link>

      {/* 4. Financial Records / Transactions */}
      <Link
        href={user ? "/wallet" : "/login"}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all hover:text-white`}
      >
        <Receipt className="w-5 h-5" />
      </Link>

      {/* 5. Orders */}
      <Link
        href={user ? "/orders" : "/login"}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
          isActive("/orders") ? "text-cyan-400" : "hover:text-white"
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
      </Link>
    </nav>
  );
}
