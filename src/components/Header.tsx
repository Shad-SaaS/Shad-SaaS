"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Wallet,
  ShoppingBag,
  LogOut,
  Shield,
  Menu,
  X,
  Headphones,
  Moon,
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
  Globe,
  Gift,
  Lock,
  Star,
  Settings,
  Info,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance: number;
  } | null;
  announcement?: string;
  currency?: string;
  storeName?: string;
  storeLogo?: string;
}

export default function Header({
  user,
  announcement = "⚡ شحن فوري للألعاب والاشتراكات 24/7 عبر سيريتل كاش وشام كاش!",
  currency = "$",
  storeName = "Shad-Store",
  storeLogo = "",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("($) USD");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  const userNumericId = user ? (user.id.replace(/\D/g, "").slice(-4) || "1006") : "";

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-black/60 border-b border-white/5 py-1 px-4 text-xs text-center text-slate-300 font-medium overflow-hidden">
        <div className="animate-pulse flex items-center justify-center gap-2">
          <span>{announcement}</span>
        </div>
      </div>

      {/* 2. Main Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo on Right (RTL) */}
          <Link href="/" className="flex items-center gap-2">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="h-8 w-auto max-w-[130px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                <span className="font-black text-white text-xs tracking-wider">SS</span>
              </div>
            )}
            <span className="font-bold text-white text-sm hidden sm:inline-block">{storeName}</span>
          </Link>

          {/* Action Icons on Left */}
          <div className="flex items-center gap-2.5">
            {/* Night mode toggle */}
            <button
              onClick={() => {}}
              className="p-2 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="الوضع الليلي"
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* Notifications */}
            {user && (
              <Link
                href="/notifications"
                className="p-2 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors relative"
                title="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </Link>
            )}

            {/* Wallet Balance Badge */}
            {user ? (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 bg-[#171c21] border border-white/10 hover:border-cyan-500/40 rounded-full px-2.5 py-1 text-xs font-mono font-bold text-white transition-all shadow-inner"
              >
                <span className="w-5 h-5 rounded-full bg-white text-slate-950 flex items-center justify-center text-xs font-black">
                  +
                </span>
                <span className="text-white text-xs">
                  {currency} {user.walletBalance.toFixed(2)}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md hover:brightness-110"
              >
                تسجيل الدخول
              </Link>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-white hover:bg-slate-800 transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Mobile / Tablet Side Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Overlay click to close */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />

          <div className="w-full max-w-xs sm:max-w-sm bg-[#080b0e] border-r border-white/10 h-full overflow-y-auto flex flex-col justify-between p-5 text-right shadow-2xl relative animate-slide-left">
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              {/* ------------------------------------------- */}
              {/* STATE A: User is NOT Logged In (Screenshot 2) */}
              {/* ------------------------------------------- */}
              {!user ? (
                <div className="space-y-6 pt-6">
                  {/* Avatar Icon */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <UserIcon className="w-9 h-9" />
                    </div>
                    <h3 className="font-black text-white text-base">أهلاً بك في</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{storeName}</p>
                  </div>

                  {/* Login / Register Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-[#2c343b] hover:bg-[#37414a] text-white py-2.5 rounded-xl font-bold text-center text-sm transition-colors border border-white/5"
                    >
                      تسجيل دخول
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-[#1a2026] hover:bg-[#252c34] text-white py-2.5 rounded-xl font-bold text-center text-sm transition-colors border border-white/5"
                    >
                      حساب جديد
                    </Link>
                  </div>

                  {/* Google Login Button */}
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-white text-slate-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md hover:bg-slate-100 transition-colors"
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
                    الدخول بواسطة جوجل
                  </Link>

                  {/* Simple Guest Navigation Links */}
                  <div className="space-y-1.5 pt-4 border-t border-white/5">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 text-white font-bold text-sm border-r-2 border-cyan-400"
                    >
                      <Home className="w-4 h-4 text-cyan-400" />
                      الرئيسية
                    </Link>
                    <Link
                      href="/terms"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-slate-300 hover:text-white font-medium text-sm hover:bg-slate-900/40"
                    >
                      <FileText className="w-4 h-4 text-purple-400" />
                      الشروط والأحكام
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-slate-300 hover:text-white font-medium text-sm hover:bg-slate-900/40"
                    >
                      <Info className="w-4 h-4 text-cyan-400" />
                      من نحن
                    </Link>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------- */
                /* STATE B: User is LOGGED IN (Screenshot 4)   */
                /* ------------------------------------------- */
                <div className="space-y-5 pt-3">
                  {/* User Profile Card */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-xl border-2 border-cyan-400/40 mb-2">
                      <div className="w-full h-full rounded-full bg-[#12161a] flex items-center justify-center font-black text-cyan-300 text-lg">
                        {user.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white font-bold truncate max-w-[150px]">{user.name}</span>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-cyan-300">
                        #{userNumericId}
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="bg-[#161c22] border border-white/5 px-4 py-1.5 rounded-full mt-2 font-mono font-bold text-sm text-emerald-400">
                      $ {user.walletBalance.toFixed(2)}
                    </div>

                    {/* Action Icon Row */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="تسجيل الخروج"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors"
                        title="الملف الشخصي"
                      >
                        <UserIcon className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="المفضلة"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Currency Dropdown */}
                    <div className="mt-3 w-full max-w-[200px]">
                      <div className="flex items-center justify-between bg-black/40 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono font-bold">
                        <span>{selectedCurrency}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-amber-400/70" />
                      </div>
                    </div>
                  </div>

                  {/* All Logged-In Menu Links (Exact Order of Screenshot 4) */}
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    {/* 1. الرئيسية */}
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#171d22] text-white font-bold text-sm border-r-2 border-cyan-400"
                    >
                      <Home className="w-4 h-4 text-cyan-400" />
                      <span>الرئيسية</span>
                    </Link>

                    {/* 2. تحميل تطبيق الاندرويد */}
                    <a
                      href="#"
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>تحميل تطبيق الاندرويد</span>
                    </a>

                    {/* 3. لوحة التحكم (for Admin) */}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 text-sm font-bold"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>لوحة التحكم الإدارية</span>
                      </Link>
                    )}

                    {/* 4. طلباتي */}
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>طلباتي (مشترياتي)</span>
                    </Link>

                    {/* 5. المساعد الآلي */}
                    <Link
                      href="/support"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Bot className="w-4 h-4 text-blue-400" />
                      <span>المساعد الآلي</span>
                    </Link>

                    {/* 6. شحن الرصيد */}
                    <Link
                      href="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>شحن الرصيد (المحفظة)</span>
                    </Link>

                    {/* 7. السجلات المالية */}
                    <Link
                      href="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>السجلات المالية (دفعاتي)</span>
                    </Link>

                    {/* 8. انضم الى وكلائنا */}
                    <Link
                      href="/support"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Users className="w-4 h-4 text-teal-400" />
                      <span>انضم إلى وكلائنا</span>
                    </Link>

                    {/* 9. الدعم الفني */}
                    <Link
                      href="/support"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Headphones className="w-4 h-4 text-indigo-400" />
                      <span>الدعم الفني والتواصل</span>
                    </Link>

                    {/* 10. طلب موقع خاص بك */}
                    <a
                      href="https://t.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>طلب موقع خاص بك</span>
                    </a>

                    {/* 11. المكافأة اليومية */}
                    <button
                      onClick={() => alert("تم تفعيل مكافأتك اليومية!")}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium text-right"
                    >
                      <Gift className="w-4 h-4 text-pink-400" />
                      <span>المكافأة اليومية</span>
                    </button>

                    {/* 12. الحماية وتوثيق الهوية */}
                    <Link
                      href="/verify-identity"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>توثيق الهوية والحماية</span>
                    </Link>

                    {/* 13. المستويات (VIP) */}
                    <Link
                      href="/levels"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>المستويات والعضويات</span>
                    </Link>

                    {/* 14. إعدادات الحساب */}
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>إعدادات الحساب</span>
                    </Link>

                    {/* 15. من نحن */}
                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>من نحن</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Brand Credit */}
            <div className="pt-6 border-t border-white/5 text-center">
              <div className="font-mono text-xs font-bold text-slate-500 tracking-wider">
                ⚡ SHAD PANEL
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                برمجة وتصميم النظام © 2026
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
