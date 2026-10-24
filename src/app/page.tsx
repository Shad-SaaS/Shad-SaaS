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

  const [dbCategories, settings] = await Promise.all([
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

  // Fallback 3D categories matching the exact reference image
  const defaultVisualCategories = [
    {
      slug: "games",
      name: "شحن الالعاب",
      badge: "شحن الألعاب",
      image: "/images/category_games.jpg",
      iconEmoji: "🎮",
    },
    {
      slug: "subscriptions",
      name: "تطبيقات الدردشة",
      badge: "تطبيقات الدردشة",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      iconEmoji: "💬",
    },
    {
      slug: "gift-cards",
      name: "قسم البطاقات",
      badge: "قسم البطاقات",
      image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
      iconEmoji: "💳",
    },
    {
      slug: "social-media",
      name: "قسم الرصيد",
      badge: "قسم الرصيد",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80",
      iconEmoji: "📱",
    },
    {
      slug: "internet",
      name: "مزودين خدمات الانترنت",
      badge: "مزودين الانترنت",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
      iconEmoji: "🌐",
    },
    {
      slug: "ai-tools",
      name: "قسم الذكاء الاصطناعي",
      badge: "الذكاء الاصطناعي",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=80",
      iconEmoji: "✨",
    },
  ];

  // Map database categories or fallback
  const displayCategories = dbCategories.length > 0
    ? dbCategories.map((c) => {
        const fallback = defaultVisualCategories.find((d) => d.slug === c.slug);
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          badge: fallback?.badge || c.name,
          image: c.image || fallback?.image,
          iconEmoji: fallback?.iconEmoji || "⚡",
        };
      })
    : defaultVisualCategories.map((d, i) => ({ id: String(i), ...d }));

  return (
    <div className="space-y-3.5 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl pb-16 text-right">
      
      {/* 1. Announcement Modal on entrance */}
      <NoticeModal />

      {/* 2. Top Graphic Banner matching the exact reference image (Point 6) */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl group cursor-pointer aspect-[16/8] sm:aspect-[21/9]">
        <img
          src="/images/shad_vip_banner.jpg"
          alt="Shad-Vip Banner"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* 3. Marquee Ticker matching reference image */}
      <div className="bg-[#101622] border border-white/5 rounded-2xl py-2 px-3 overflow-hidden text-xs text-slate-300 font-bold flex items-center gap-2 shadow-inner">
        <span className="text-amber-400 shrink-0">🔥</span>
        <div className="overflow-hidden w-full whitespace-nowrap">
          <div className="animate-ticker text-xs">
            شو ناطر اشترك معنا فورااا 🔥 - 🔐 ربط API للمواقع - 🕒 خدمة عملاء على مدار الساعة - ✅ أمان كامل 100% - ⚡ سرعة فائقة بالتنفيذ مع Shad-Vip
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Join Banner Card matching reference image */}
      <a
        href="https://whatsapp.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#141b27] hover:bg-[#1a2332] border border-white/10 rounded-2xl p-3 sm:p-3.5 transition-all shadow-md group"
      >
        <div className="flex items-center justify-between">
          <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-black text-white">
              اضغط هنا لتنضم على الواتساب
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </a>

      {/* 5. Search Bar matching reference image */}
      <div className="relative">
        <input
          type="text"
          placeholder="...بحث"
          className="w-full bg-[#10151f] border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 shadow-inner text-right"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* 6. Main 3-Column Category Grid matching reference image */}
      <section className="pt-1">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center focus:outline-none select-none"
            >
              {/* 3D Card Tile */}
              <div className="w-full aspect-square rounded-2xl bg-[#141b26] border border-white/10 hover:border-amber-400/50 p-2 relative flex flex-col items-center justify-between shadow-lg overflow-hidden transition-all group-hover:-translate-y-1 group-active:scale-95">
                
                {/* Subtle smoke glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/5 pointer-events-none" />

                {/* 3D Artwork in Center */}
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl transition-transform group-hover:scale-110">
                      {cat.iconEmoji}
                    </span>
                  )}
                </div>

                {/* Pill label on card */}
                <div className="w-full bg-[#0d121b]/90 border border-white/10 rounded-lg py-1 px-1 text-[9px] sm:text-[10px] font-bold text-slate-200 truncate relative z-10 mt-1">
                  {cat.badge}
                </div>
              </div>

              {/* Title under card */}
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-amber-400 mt-1.5 transition-colors line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
