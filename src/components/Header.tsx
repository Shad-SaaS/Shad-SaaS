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
      {/* Main Top Header matching screenshots */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-white/5 px-3 py-2 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo on Right (in RTL) */}
          <Link href="/" className="flex items-center gap-2">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="h-8 w-auto max-w-[130px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
                <span className="font-black text-slate-950 text-xs tracking-tighter">VIP</span>
              </div>
            )}
            <span className="font-black text-white text-sm tracking-tight">{storeName}</span>
          </Link>

          {/* Action Icons on Left */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Back button (shown on subpages) */}
            {!isHomePage && (
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="رجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Wallet Balance Badge (coin icon / 0$ +) */}
            {user ? (
              <Link
                href="/deposit"
                className="flex items-center gap-1 bg-[#141b26] border border-white/10 hover:border-amber-400/40 rounded-full px-2 py-0.5 text-xs font-mono font-bold text-white transition-all shadow-inner"
              >
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                  +
                </span>
                <span className="text-white text-xs font-mono">{user.walletBalance.toFixed(0)} $</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 bg-[#141b26] border border-white/10 hover:border-amber-400/40 rounded-full px-2 py-0.5 text-xs font-mono font-bold text-slate-300"
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
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors relative"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </Link>

            {/* Profile Icon / Favorites */}
            <Link
              href={user ? "/favorites" : "/login"}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="المفضلة أو الحساب"
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Side Drawer (Opens from Right in RTL) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Overlay click to close */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />

          <div className="w-full max-w-[290px] sm:max-w-xs bg-[#111622] border-r border-white/10 h-full overflow-y-auto flex flex-col justify-between p-4 text-right shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              {/* ------------------------------------------- */}
              {/* STATE A: User is NOT Logged In (Screenshot 3) */}
              {/* ------------------------------------------- */}
              {!user ? (
                <div className="space-y-4 pt-4">
                  {/* Top Gray Card */}
                  <div className="bg-[#1c2432] p-4 rounded-2xl border border-white/5 space-y-3">
                    <h3 className="font-black text-white text-base">تسجيل الدخول</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      قم بتسجيل الدخول وتمتع بتجربة شراء سهلة
                    </p>
                    
                    {/* Bright Green Login Button */}
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full bg-[#00e676] hover:bg-[#00c853] text-slate-950 font-black py-2.5 rounded-xl text-center text-xs transition-colors shadow-md"
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
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c2432] text-white font-bold text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-emerald-400" />
                        <span>الرئيسية</span>
                      </div>
                    </Link>

                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span>خدمات VIP</span>
                      </div>
                      <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded-md">جديد</span>
                    </Link>

                    <Link
                      href="/agents"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>وكلاؤنا</span>
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>من نحن</span>
                    </Link>

                    <Link
                      href="/policy"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>سياسة الاستخدام</span>
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>تثبيت التطبيق</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------- */
                /* STATE B: User is LOGGED IN (Screenshot 4)   */
                /* ------------------------------------------- */
                <div className="space-y-4 pt-2">
                  
                  {/* Profile Header */}
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg mb-2">
                      <div className="w-full h-full bg-[#1c2432] flex items-center justify-center text-amber-400 font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                    </div>

                    {/* Name + ID */}
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{user.name}</span>
                      <span className="text-slate-400 font-mono">#{userNumericId}</span>
                    </div>

                    {/* VIP Tier Badge */}
                    <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-[10px] font-black mt-1 flex items-center gap-1">
                      <span>Shad-Vip 1 ★</span>
                    </div>

                    {/* Bold Green Balance */}
                    <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                      {displayBalance}
                    </div>

                    {/* Action Icon Buttons */}
                    <div className="flex items-center gap-5 mt-2 text-slate-400">
                      <Link
                        href="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="hover:text-rose-400 transition-colors"
                        title="المفضلة"
                      >
                        <Heart className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="hover:text-white transition-colors"
                        title="الملف الشخصي"
                      >
                        <UserIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="hover:text-rose-400 transition-colors"
                        title="تسجيل الخروج"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Secondary Currency Toggle */}
                    <button
                      onClick={() => setSecondaryCurrencyActive(!secondaryCurrencyActive)}
                      className="mt-3 flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 px-3 py-1 rounded-full text-[11px] font-bold hover:bg-yellow-400/20 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>العملة الثانوية</span>
                    </button>
                  </div>

                  {/* Nav links matching screenshot 4 */}
                  <div className="space-y-0.5 pt-2 border-t border-white/5">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1c2432] text-white font-bold text-xs"
                    >
                      <Home className="w-4 h-4 text-emerald-400" />
                      <span>الرئيسية</span>
                    </Link>

                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span>خدمات VIP</span>
                      </div>
                      <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded-md">جديد</span>
                    </Link>

                    {/* Admin Dashboard */}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-amber-300 hover:text-amber-200 text-xs font-bold hover:bg-amber-500/10"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>لوحة التحكم الإدارية</span>
                      </Link>
                    )}

                    <Link
                      href="/deposit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span>اضافة رصيد</span>
                    </Link>

                    <Link
                      href="/deposit/history"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <span>دفعاتي</span>
                    </Link>

                    <Link
                      href="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Wallet className="w-4 h-4 text-yellow-400" />
                      <span>محفظتي</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Receipt className="w-4 h-4 text-rose-400" />
                      <span>طلباتي</span>
                    </Link>

                    <a
                      href="https://t.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Send className="w-4 h-4 text-cyan-400" />
                      <span>ربط التلجرام</span>
                    </a>

                    <Link
                      href="/agents"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Users className="w-4 h-4 text-teal-400" />
                      <span>وكلاؤنا</span>
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>من نحن</span>
                    </Link>

                    <Link
                      href="/policy"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>سياسة الاستخدام</span>
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-[#18202c]"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>تثبيت التطبيق</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer: Social icons + Copyright */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-center gap-4 text-slate-400">
                <a href="#" className="hover:text-red-500 transition-colors" title="YouTube">
                  <span className="text-sm">▶</span>
                </a>
                <a href="#" className="hover:text-pink-500 transition-colors" title="Instagram">
                  <span className="text-sm">📸</span>
                </a>
                <a href="#" className="hover:text-blue-500 transition-colors" title="Facebook">
                  <span className="text-sm">📘</span>
                </a>
                <a href="#" className="hover:text-emerald-500 transition-colors" title="WhatsApp">
                  <span className="text-sm">💬</span>
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors" title="Telegram">
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-center text-[10px] text-slate-500 font-mono">
                برمجة وتصميم Shad-Vip © 2026
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
