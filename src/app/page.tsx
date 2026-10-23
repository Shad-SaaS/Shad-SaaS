import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
  Search,
  MessageCircle,
  Smartphone,
  ChevronLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [categories, products, settings, banners] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.storeSetting.findMany(),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const getSetting = (id: string, fallback: string) => {
    const s = settings.find((item) => item.id === id);
    return s ? s.value : fallback;
  };

  const storeName = getSetting("store_name", "ميديا بوستر");
  const currency = getSetting("currency", "$");

  const defaultBanners = [
    {
      id: "b1",
      title: "أهلاً وسهلاً بكم في",
      subtitle: `متجر ${storeName}`,
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const activeBanners = banners.length > 0 ? banners : defaultBanners;

  return (
    <div className="space-y-6">
      {/* 1. Hero / Main Banner Slider (Matching Screenshot 1) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#151a21] to-slate-900 border border-white/10 shadow-2xl">
        <div className="relative z-10 p-5 sm:p-8 flex flex-col justify-between min-h-[170px] sm:min-h-[200px]">
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-300">
              {activeBanners[0]?.title || "أهلاً وسهلاً بكم في"}
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-amber-400 mt-1">
              {activeBanners[0]?.subtitle || `متجر ${storeName}`}
            </h1>
          </div>

          {/* Marquee ticker */}
          <div className="bg-black/50 backdrop-blur-md rounded-xl p-2.5 mt-4 text-xs font-bold text-white flex items-center justify-between overflow-hidden border border-white/5">
            <div className="flex items-center gap-2 truncate">
              <span className="text-rose-500">❤</span>
              <span className="truncate">اشحن جميع ألعابك وتطبيقاتك بسرعة وأمان وبشكل فوري</span>
            </div>
            <span className="text-cyan-400 font-mono text-[11px] shrink-0 font-black">24/7 ONLINE</span>
          </div>
        </div>
      </section>

      {/* 2. Search Bar (Matching Screenshot 1) */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث..."
          className="w-full bg-[#161c22] border border-white/10 rounded-2xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* 3. Category Grid (2 Columns Mobile, Exact Match to Screenshot 1 & 3) */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {categories.map((cat) => {
            // If user is not logged in, clicking forces login request
            const targetUrl = user ? `/categories/${cat.slug}` : `/login?redirect=/categories/${cat.slug}`;

            return (
              <Link
                key={cat.id}
                href={targetUrl}
                className="group relative overflow-hidden rounded-2xl bg-[#14191f] border border-white/10 hover:border-cyan-500/40 p-4 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] transition-all shadow-lg"
              >
                {/* Background Icon / Ambient */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>

                <div className="pt-6">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {cat.slug.toUpperCase()}
                  </div>
                  <h3 className="font-black text-white text-base sm:text-lg mt-0.5 group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400 group-hover:text-white">
                  <span>تصفح القسم</span>
                  <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Products Section */}
      <section id="products" className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">الخدمات الأكثر طلباً</h2>
            <p className="text-xs text-slate-400 mt-0.5">تسليم آلي وفوري عبر محولات المزودين المعتمدة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product) => (
            <ServiceCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>
    </div>
  );
}
