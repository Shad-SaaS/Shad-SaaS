"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasLower || !hasUpper || !hasNumber || !hasSymbol) {
      setError("يرجى استيفاء كافة شروط كلمة المرور المذكورة");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim() || username,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "فشل إنشاء الحساب");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xs sm:max-w-sm mx-auto my-6 text-right">
      
      {/* Top Logo */}
      <div className="flex flex-col items-center text-center mb-6 space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 p-0.5 shadow-xl flex items-center justify-center border-2 border-amber-300/40">
          <div className="w-full h-full rounded-full bg-[#111622] flex items-center justify-center">
            <span className="font-black text-amber-400 text-lg">VIP</span>
          </div>
        </div>
        <h1 className="text-xl font-black text-white">إنشاء حساب</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* First Name & Last Name Side by Side matching Screenshot 5 */}
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="text"
            required
            placeholder="الاسم الاخير"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-[#141b27] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
          />
          <input
            type="text"
            required
            placeholder="الاسم الاول"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-[#141b27] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
          />
        </div>

        {/* Username */}
        <div className="relative">
          <input
            type="text"
            required
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#141b27] border border-white/10 rounded-2xl px-4 py-3 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
          />
          <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#141b27] border border-white/10 rounded-2xl px-4 py-3 pr-10 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
          />
          <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Requirements List matching Screenshot 5 */}
        <div className="bg-[#0f141d] p-3 rounded-2xl border border-white/5 space-y-1 text-[11px] text-slate-400 text-right">
          <div className={`flex items-center justify-end gap-1.5 ${hasLower ? "text-emerald-400" : ""}`}>
            <span>يجب ان تحتوي حرف صغير</span>
            <span>•</span>
          </div>
          <div className={`flex items-center justify-end gap-1.5 ${hasUpper ? "text-emerald-400" : ""}`}>
            <span>يجب ان تحتوي حرف كبير</span>
            <span>•</span>
          </div>
          <div className={`flex items-center justify-end gap-1.5 ${hasNumber ? "text-emerald-400" : ""}`}>
            <span>يجب ان تحتوي رقم</span>
            <span>•</span>
          </div>
          <div className={`flex items-center justify-end gap-1.5 ${hasSymbol ? "text-emerald-400" : ""}`}>
            <span>يجب ان تحتوي رمز</span>
            <span>•</span>
          </div>
        </div>

        {/* Email */}
        <div className="relative">
          <input
            type="email"
            required
            placeholder="البريد الالكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#141b27] border border-white/10 rounded-2xl px-4 py-3 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-right shadow-inner"
          />
          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>تسجيل</span>}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500 font-bold">او</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Register Button */}
        <button
          type="button"
          onClick={() => {
            setFirstName("مستخدم");
            setLastName("جديد");
            setUsername("user_new");
            setEmail("user_new@example.com");
            setPassword("User1234@!");
          }}
          className="w-full bg-white text-slate-900 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md hover:bg-slate-100 transition-colors"
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
          <span>تسجيل الدخول عبر Google</span>
        </button>

        {/* Footer Link */}
        <div className="text-center pt-3 text-xs text-slate-400">
          <span>هل لديك حساب؟ </span>
          <Link href="/login" className="font-bold text-white hover:underline">
            دخول
          </Link>
        </div>

      </form>
    </div>
  );
}
