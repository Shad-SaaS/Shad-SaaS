import Link from "next/link";
import { prisma } from "@/lib/db";
import ServiceCard from "@/components/ServiceCard";
import {
  Gamepad2,
  Sparkles,
  CreditCard,
  Share2,
  Bot,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle,
  HelpCircle,
  Search,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const settings = await prisma.storeSetting.findMany();
  const getSetting = (id: string, fallback: string) => {
    const s = settings.find((item) => item.id === id);
    return s ? s.value : fallback;
  };

  const heroTitle = getSetting(
    "hero_title",
    "بوابتك الأولى لشحن الألعاب والاشتراكات الرقمية"
  );
  const heroSubtitle = getSetting(
    "hero_subtitle",
    "تسليم فوري، أسعار منافسة، ودفع آمن عبر وسائل الدفع المحلية السورية والعالمية."
  );
  const currency = getSetting("currency", "ل.س");

  const categoryIcons: Record<string, any> = {
    games: Gamepad2,
    subscriptions: Sparkles,
    "gift-cards": CreditCard,
    "social-media": Share2,
    "ai-tools": Bot,
  };

  return (
    <div className="space-y-16">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 lg:p-12 border border-blue-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold mb-4">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>شحن مباشر وسريع على مدار الساعة</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
            {heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-2xl">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="#products"
              className="glow-btn px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <span>تصفح جميع الخدمات</span>
              <Zap className="w-4 h-4" />
            </Link>

            <Link
              href="/wallet"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
            >
              شحن المحفظة فوراً
            </Link>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">+10,000</div>
            <div className="text-xs text-slate-400">طلب تم تنفيذه</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">5 - 15</div>
            <div className="text-xs text-slate-400">دقيقة متوسط التسليم</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-slate-400">ضمان وأمان الدفع</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">24/7</div>
            <div className="text-xs text-slate-400">دعم فني متواصل</div>
          </div>
        </div>
      </section>

      {/* 2. Categories Horizontal Bar */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">التصنيفات الرئيسية</h2>
            <p className="text-xs text-slate-400 mt-1">اختر القسم للوصول إلى الخدمات المتاحة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.slug] || Sparkles;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="glass-card p-4 rounded-2xl flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-500 mt-1">
                  {cat.description || "خدمات فورية"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section id="products">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">أشهر الخدمات والمنتجات</h2>
            <p className="text-xs text-slate-400 mt-1">
              الخدمات الأكثر طلباً مع أسعار حقيقية وتنفيذ مباشر
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ServiceCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>

      {/* 4. How to Order Section */}
      <section className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">كيف تطلب من المتجر؟</h2>
          <p className="text-xs text-slate-400">3 خطوات سهلة وسريعة لاستلام خدمتك فورياً</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-2">اشحن محفظتك</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اختر وسيلة الدفع المناسبة (سيريتل كاش، شام كاش، MTN) وأرسل إشعار التحويل لزيادة رصيدك.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-2">اختر الخدمة والباقة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              حدد فئة الخدمة (شدات، باقة اشتراك، جواهر) وأدخل معرف الحساب أو البريد المطلوب.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-2">تسليم فوري</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتم خصم القيمة من محفظتك وتصلك الخدمة أو كود التفعيل خلال دقائق مع إمكانية المتابعة.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">الأسئلة الشائعة</h2>
          <p className="text-xs text-slate-400">إجابات على أكثر الاستفسارات تكراراً</p>
        </div>

        <div className="space-y-3">
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              كم يستغرق شحن شدات ببجي أو فري فاير؟
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              يستغرق الشحن عادة من 5 إلى 15 دقيقة فقط من لحظة إتمام الطلب، ويصلك الشحن برقم الآيدي دون طلب كلمة المرور.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              كيف يتم شحن المحفظة عبر سيريتل كاش أو شام كاش؟
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              تدخل إلى صفحة المحفظة، تختار وسيلة الدفع ليظهر لك رقم الحساب المعتمد، تقوم بالتحويل من هاتفك وتدخل رقم العملية وصورة الإشعار، ويتم اعتماد الرصيد ومطابقته فورياً.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              ماذا يحدث إذا تم إلغاء الطلب؟
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              إذا تعذر تنفيذ الطلب لأي سبب (مثل إدخال آيدي خاطئ)، يتم إلغاء الطلب ويعاد كامل المبلغ تلقائياً إلى رصيد محفظتك مع تدوين السبب في سجل الطلب.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
