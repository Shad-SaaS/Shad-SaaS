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
  Gamepad2,
  Sparkles,
  CreditCard,
  Share2,
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
  currency = "ل.س",
  storeName = "Shad-Store | متجر شاد ستور",
  storeLogo = "",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-900/60 via-blue-600/40 to-blue-900/60 border-b border-blue-500/20 py-1.5 px-4 text-xs text-center text-blue-200 font-medium overflow-hidden">
        <div className="animate-pulse flex items-center justify-center gap-2">
          <span>{announcement}</span>
        </div>
      </div>

      {/* 2. Main Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Right: Mobile Menu + Navigation + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-9 w-auto max-w-[140px] object-contain rounded-lg"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="font-black text-white text-base tracking-wider">SS</span>
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-black text-lg text-white leading-tight">{storeName}</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">OFFICIAL STORE</div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 mr-4 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                الرئيسية
              </Link>
              <Link
                href="/categories/games"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4 text-blue-400" />
                شحن ألعاب
              </Link>
              <Link
                href="/categories/subscriptions"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                اشتراكات
              </Link>
              <Link
                href="/categories/gift-cards"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                بطاقات رقمية
              </Link>
              <Link
                href="/categories/social-media"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                سوشيال ميديا
              </Link>
            </nav>
          </div>

          {/* Left: User Actions & Wallet */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet Balance Display */}
                <Link
                  href="/wallet"
                  className="flex items-center gap-2 bg-blue-950/70 border border-blue-500/30 hover:border-blue-500/60 rounded-full px-3 py-1.5 transition-all text-xs sm:text-sm font-bold text-white shadow-inner"
                  title="المحفظة - اضغط للشحن"
                >
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-cyan-300">
                    {user.walletBalance.toLocaleString("ar-SA")}
                  </span>
                  <span className="text-[11px] text-slate-400">{currency}</span>
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-0.5 hover:bg-blue-500">
                    +
                  </span>
                </Link>

                {/* My Orders link */}
                <Link
                  href="/orders"
                  className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>طلباتي</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-white/15 shadow-2xl z-50 text-right animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 border-b border-white/10 mb-1">
                        <div className="font-bold text-white text-sm truncate">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {user.role === "ADMIN" ? "مدير النظام" : "عميل معتمد"}
                        </div>
                      </div>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          لوحة الإدارة (/admin)
                        </Link>
                      )}

                      <Link
                        href="/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-blue-400" />
                        المحفظة والشحن
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        سجل الطلبات
                      </Link>

                      <Link
                        href="/support"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        <Headphones className="w-4 h-4 text-cyan-400" />
                        مركز الدعم الفني
                      </Link>

                      <div className="border-t border-white/10 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold glow-btn transition-transform"
                >
                  حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. Mobile Offcanvas Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 bottom-0 right-0 w-[280px] bg-slate-950 border-l border-white/10 p-5 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  {storeLogo ? (
                    <img src={storeLogo} alt={storeName} className="h-8 max-w-[100px] object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white">
                      SS
                    </div>
                  )}
                  <span className="font-bold text-white text-sm truncate">{storeName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
                  <div className="text-xs text-slate-400">مرحباً بك،</div>
                  <div className="font-bold text-white text-sm mb-2">{user.name}</div>
                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 text-xs">
                    <span className="text-slate-400">الرصيد:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {user.walletBalance.toLocaleString("ar-SA")} {currency}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm font-medium">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  الرئيسية
                </Link>
                <Link
                  href="/categories/games"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                  شحن ألعاب
                </Link>
                <Link
                  href="/categories/subscriptions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  اشتراكات وتطبيقات
                </Link>
                <Link
                  href="/categories/gift-cards"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  بطاقات رقمية
                </Link>
                <Link
                  href="/categories/social-media"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4 text-purple-400" />
                  خدمات تواصل اجتماعي
                </Link>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  شحن المحفظة
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  سجل طلباتي
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-white/10"
                >
                  <Headphones className="w-4 h-4 text-pink-400" />
                  مركز الدعم
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold text-center"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-xl glow-btn text-xs font-bold text-center"
                  >
                    تسجيل
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
