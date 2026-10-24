"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  Bell,
  Heart,
  User as UserIcon,
  Home,
  FileText,
  Smartphone,
  Bot,
  CreditCard,
  Receipt,
  Users,
  Shield,
  LogOut,
  Info,
  RefreshCw,
  ArrowRight,
  Send,
  Download,
  Wallet,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance: number;
  } | null;
  currency?: string;
  storeName?: string;
  storeLogo?: string;
}

export default function Header({
  user,
  currency = "$",
  storeName = "Shad-Vip",
  storeLogo = "",
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [secondaryCurrencyActive, setSecondaryCurrencyActive] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  const userNumericId = user ? (user.id.replace(/\D/g, "").slice(-4) || "1006") : "";
  const isHomePage = pathname === "/";

  // Balance display based on currency toggle
  const displayBalance = secondaryCurrencyActive
    ? `${(user ? user.walletBalance * 14500 : 0).toLocaleString()} ل.س`
    : `${user ? user.walletBalance.toFixed(2) : "0"} $`;

  return (
    <>
      {/* Main Top Header matching reference image */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-white/5 px-4 py-2.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Left: Gold Emblem Logo + Shad-Vip Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/40 group-hover:scale-105 transition-transform">
              <span className="font-black text-slate-950 text-xs tracking-tighter">VIP</span>
            </div>
            <span className="font-black text-white text-base tracking-wide group-hover:text-amber-400 transition-colors">
              Shad-Vip
            </span>
          </Link>

          {/* Right: User action icons & Hamburger menu */}
          <div className="flex items-center gap-2">
            
            {/* Back button (shown on subpages) */}
            {!isHomePage && (
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="رجوع"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Wallet Balance Badge */}
            {user ? (
              <Link
                href="/deposit"
                className="flex items-center gap-1.5 bg-[#141b26] border border-white/10 hover:border-amber-400/40 rounded-full px-2.5 py-1 text-xs font-mono font-bold text-white transition-all shadow-inner"
              >
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                  +
                </span>
                <span className="text-white text-xs font-mono">{user.walletBalance.toFixed(0)} $</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-[#141b26] border border-white/10 hover:border-amber-400/40 rounded-full px-2.5 py-1 text-xs font-mono font-bold text-slate-300 hover:text-white"
              >
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                  +
                </span>
                <span className="text-xs">0 $</span>
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              href="/notification"
              className="p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </Link>

            {/* User Profile Icon */}
            <Link
              href={user ? "/wallet" : "/login"}
              className="p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="حسابي"
            >
              <UserIcon className="w-4 h-4" />
            </Link>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Side Drawer (Opens strictly from RIGHT in RTL - Point 4) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel - Anchored to the RIGHT */}
          <div className="absolute top-0 bottom-0 right-0 w-full max-w-[300px] bg-[#10151f] border-l border-white/10 h-full overflow-y-auto flex flex-col justify-between p-4 text-right shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            
            {/* Close Button on Top-Left */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              {/* ------------------------------------------- */}
              {/* STATE A: User is NOT Logged In */}
              {/* ------------------------------------------- */}
              {!user ? (
                <div className="space-y-4 pt-3">
                  {/* Top Slate Card */}
                  <div className="bg-[#18202d] p-4 rounded-2xl border border-white/5 space-y-3">
                    <h3 className="font-black text-white text-base">تسجيل الدخول</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      قم بتسجيل الدخول وتمتع بتجربة شراء فورية وآمنة
                    </p>
                    
                    {/* Modern Green Login Button */}
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full btn-vip-emerald py-2.5 rounded-xl text-center text-xs shadow-md"
                    >
                      تسجيل الدخول
                    </Link>

                    {/* Google Login Button */}
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full bg-white text-slate-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-md hover:bg-slate-100 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>تسجيل بواسطة غوغل</span>
                    </Link>
                  </div>

                  {/* Navigation Links for Guest */}
                  <div className="space-y-1 pt-2">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                    >
                      <Home className="w-4 h-4 text-amber-400" />
                      <span>الرئيسية</span>
                    </Link>

                    <Link
                      href="/categories/games"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>شحن الألعاب</span>
                    </Link>

                    <Link
                      href="/categories/ai-tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                    >
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span>الذكاء الاصطناعي</span>
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                    >
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span>من نحن</span>
                    </Link>

                    <Link
                      href="/policy"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                    >
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>سياسة الاستخدام</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------- */
                /* STATE B: User is LOGGED IN */
                /* ------------------------------------------- */
                <div className="space-y-4 pt-1">
                  
                  {/* User Profile Card */}
                  <div className="flex flex-col items-center text-center space-y-2 pt-2 pb-3 border-b border-white/5">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border-2 border-amber-300/40">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & ID */}
                    <div>
                      <div className="font-bold text-white text-sm">
                        {user.name} <span className="font-mono text-amber-400">#{userNumericId}</span>
                      </div>
                      
                      {/* VIP Badge */}
                      <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-400/30 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-amber-400 mt-1">
                        <span>★</span>
                        <span>Shad-Vip 1</span>
                      </div>
                    </div>

                    {/* Green Balance Display */}
                    <div className="text-xl font-black font-mono text-[#00e676] pt-1">
                      {displayBalance}
                    </div>

                    {/* Quick Profile Actions: Heart, User, Logout */}
                    <div className="flex items-center gap-3 pt-1 text-slate-400">
                      <Link
                        href="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg bg-white/5 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="المفضلة"
                      >
                        <Heart className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg bg-white/5 hover:text-white hover:bg-white/10 transition-colors"
                        title="حسابي"
                      >
                        <UserIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg bg-white/5 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="تسجيل الخروج"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Secondary Currency Toggle */}
                    <button
                      onClick={() => setSecondaryCurrencyActive((prev) => !prev)}
                      className="w-full bg-[#18202d] hover:bg-[#202b3d] border border-amber-400/30 text-amber-400 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{secondaryCurrencyActive ? "العملة الأساسية ($)" : "العملة الثانوية (ل.س)"}</span>
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5 text-xs font-bold">
                    
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        pathname === "/"
                          ? "bg-[#18202d] text-amber-400 border border-white/5"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Home className="w-4 h-4 text-amber-400" />
                      <span>الرئيسية</span>
                    </Link>

                    {/* Admin Dashboard if authorized */}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>لوحة التحكم الإدارية</span>
                      </Link>
                    )}

                    <Link
                      href="/deposit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>اضافة رصيد</span>
                    </Link>

                    <Link
                      href="/deposit/history"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-cyan-400" />
                      <span>دفعاتي</span>
                    </Link>

                    <Link
                      href="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-yellow-400" />
                      <span>محفظتي</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>طلباتي</span>
                    </Link>

                    <a
                      href="https://t.me/shad_store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Send className="w-4 h-4 text-sky-400" />
                      <span>ربط التلجرام</span>
                    </a>

                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>من نحن</span>
                    </Link>

                    <Link
                      href="/policy"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>سياسة الاستخدام</span>
                    </Link>

                  </div>
                </div>
              )}
            </div>

            {/* Bottom Drawer Footer */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-center gap-3 text-slate-500 text-xs">
                <span>برمجة وتصميم © 2026</span>
                <span className="font-bold text-amber-400">Shad-Vip</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
