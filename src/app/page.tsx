import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import NoticeModal from "@/components/NoticeModal";
import {
  Search,
  MessageCircle,
  ChevronLeft,
  Sparkles,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.storeSetting.findMany(),
  ]);

  const getSetting = (id: string, fallback: string) => {
    const s = settings.find((item) => item.id === id);
    return s ? s.value : fallback;
  };

  const storeName = getSetting("store_name", "Shad-Vip");

  // Predefined visual 3D category cards matching screenshot 2
  const categoryCards = [
    {
      id: "games",
      slug: "games",
      name: "شحن الالعاب",
      badge: "قسم الالعاب",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      gradient: "from-amber-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "🎮",
    },
    {
      id: "chat-apps",
      slug: "chat-apps",
      name: "تطبيقات الدردشة",
      badge: "تطبيقات الدردشة",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      gradient: "from-purple-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "💬",
    },
    {
      id: "gift-cards",
      slug: "gift-cards",
      name: "قسم البطاقات",
      badge: "قسم البطاقات",
      image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
      gradient: "from-blue-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "💳",
    },
    {
      id: "balance",
      slug: "balance",
      name: "قسم الرصيد",
      badge: "قسم الرصيد",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80",
      gradient: "from-emerald-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "📱",
    },
    {
      id: "internet",
      slug: "internet",
      name: "مزودين خدمات الانترنت",
      badge: "مزودين الانترنت",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
      gradient: "from-cyan-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "🌐",
    },
    {
      id: "ai-services",
      slug: "ai-services",
      name: "قسم الذكاء الاصطناعي",
      badge: "الذكاء الاصطناعي",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=80",
      gradient: "from-indigo-600/20 via-slate-900 to-[#121824]",
      iconEmoji: "✨",
    },
  ];

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl pb-16">
      
      {/* 1. Announcement Modal on entrance */}
      <NoticeModal />

      {/* 2. Top Slider Promo Banner matching Screenshot 1 & 2 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#18202c] via-[#121824] to-[#0d121c] border border-white/10 shadow-xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 text-right flex-1">
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 inline-block">
              Shad-Vip Store
            </span>
            <h1 className="text-sm sm:text-base font-black text-white leading-tight">
              مع <span className="text-amber-400">Shad-Vip</span> اشحن ألعابك واشتراكاتك بكل سرعة وسهولة وأمان
            </h1>
            <p className="text-[11px] text-slate-400">
              ربط فوري للمواقع عبر API - شحن فوري 24/7 - أسعار منافسة
            </p>
          </div>

          {/* 3D Character / WhatsApp Graphic */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1c2434] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl">🎮</span>
          </div>
        </div>
      </section>

      {/* 3. Marquee Ticker matching Screenshot 1 & 2 */}
      <div className="bg-[#121824] border border-white/5 rounded-xl py-2 px-3 overflow-hidden text-xs text-slate-300 font-bold flex items-center gap-2 shadow-inner">
        <span className="text-amber-400 shrink-0">⚡</span>
        <div className="overflow-hidden w-full whitespace-nowrap">
          <div className="animate-ticker text-xs">
            A خيارك الأفضل دائماً - أمان 100% ✅ - سرعة بالتنفيذ ⚡ - خدمة عملاء على مدار الساعة 🕐 - ربط API للمواقع 🔐 - شو ناطر اشترك معنا فورااا 🔥
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Join Banner Card matching Screenshot 2 */}
      <a
        href="https://whatsapp.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#151c27] hover:bg-[#1a2332] border border-white/10 rounded-2xl p-3 sm:p-3.5 transition-all shadow-md group"
      >
        <div className="flex items-center justify-between">
          <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <div className="flex items-center gap-2 text-right">
            <span className="text-xs sm:text-sm font-black text-white">
              اضغط هنا لتنضم على الواتساب
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </a>

      {/* 5. Search Bar matching Screenshot 2 */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث في الأقسام والخدمات..."
          className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 shadow-inner text-right"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* 6. Main 3-Column Category Grid matching Screenshot 2 */}
      <section className="pt-1">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {categoryCards.map((cat) => {
            const targetUrl = user ? `/category/${cat.slug}` : `/login?redirect=/category/${cat.slug}`;

            return (
              <Link
                key={cat.id}
                href={targetUrl}
                className="group flex flex-col items-center text-center focus:outline-none"
              >
                {/* 3D Card Tile */}
                <div className="w-full aspect-square rounded-2xl bg-[#141b26] border border-white/10 hover:border-amber-400/50 p-2 relative flex flex-col items-center justify-between shadow-lg overflow-hidden transition-all group-hover:-translate-y-1 group-active:scale-95">
                  
                  {/* Subtle smoke glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/5 pointer-events-none" />

                  {/* 3D Emoji / Artwork in Center */}
                  <div className="w-full flex-1 flex items-center justify-center text-3xl sm:text-4xl transition-transform group-hover:scale-110">
                    <span>{cat.iconEmoji}</span>
                  </div>

                  {/* Pill label on card */}
                  <div className="w-full bg-[#0d121b]/90 border border-white/10 rounded-lg py-1 px-1 text-[9px] sm:text-[10px] font-bold text-slate-200 truncate relative z-10">
                    {cat.badge}
                  </div>
                </div>

                {/* Title under card */}
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-amber-400 mt-1.5 transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
