import Link from "next/link";
import { ShieldCheck, Zap, Headphones, Lock, Smartphone, Send, Wallet } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl pt-14 pb-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Features Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">شحن فوري وتلقائي</div>
              <div className="text-xs text-slate-400">تنفيذ خلال دقائق معدودة</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">ضمان وأمان 100%</div>
              <div className="text-xs text-slate-400">حسابات وبطاقات رسمية</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">وسائل دفع محلية</div>
              <div className="text-xs text-slate-400">سيريتل كاش وشام كاش</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">دعم فني متواصل</div>
              <div className="text-xs text-slate-400">خدمة عملاء 24 ساعة</div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-500/20">
                VIP
              </div>
              <span className="font-black text-white text-lg tracking-wide">Shad-Vip</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              المنصة المتكاملة الأولى لشحن الألعاب والاشتراكات الرقمية والذكاء الاصطناعي وخدمات الدفع الإلكتروني السريع بأعلى معايير الأمان.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>نظام دفع مشفر ومحمي بالكامل - shad-vip.store</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">أقسام المتجر</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/categories/games" className="hover:text-blue-400 transition-colors">
                  شحن الألعاب (ببجي، فري فاير...)
                </Link>
              </li>
              <li>
                <Link href="/categories/subscriptions" className="hover:text-blue-400 transition-colors">
                  اشتراكات التطبيقات والبرامج
                </Link>
              </li>
              <li>
                <Link href="/categories/gift-cards" className="hover:text-blue-400 transition-colors">
                  البطاقات الرقمية وبطاقات الهدايا
                </Link>
              </li>
              <li>
                <Link href="/categories/social-media" className="hover:text-blue-400 transition-colors">
                  خدمات السوشيال ميديا والتسويق
                </Link>
              </li>
              <li>
                <Link href="/categories/ai-tools" className="hover:text-blue-400 transition-colors">
                  أدوات الذكاء الاصطناعي والتصميم
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wallet" className="hover:text-blue-400 transition-colors">
                  شحن رصيد المحفظة
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-blue-400 transition-colors">
                  متابعة الطلبات
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-blue-400 transition-colors">
                  تذاكر الدعم والمساعدة
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  سياسة الخصوصية والاسترداد
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">طرق الدفع المعتمدة</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                سيريتل كاش
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                إم تي إن كاش
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                شام كاش
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                حوالات الهرم
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                USDT (TRC20)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              يتم تأكيد عمليات الشحن اليدوي ومطابقة الإشعارات آلياً وإدارياً على مدار الساعة.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} منصة Shad-Vip (shad-vip.store)</div>
          <div className="flex items-center gap-4">
            <span>منصة رقمية سريعة وآمنة</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
