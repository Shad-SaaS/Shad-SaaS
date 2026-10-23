import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ArrowRight, Ticket, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/deposit");
  }

  // Payment methods matching Screenshot 3 in Batch #3
  const paymentMethods = [
    {
      id: "shamcash-usd",
      bankId: "13",
      name: "شام كاش آلي دولار $",
      isAuto: true,
      badge: "تلقائي",
      iconEmoji: "⚡",
      gradient: "from-blue-600/30 to-slate-900",
      description: "خدمة شام كاش تعمل بشكل آلي 7/24",
    },
    {
      id: "shamcash-syp",
      bankId: "14",
      name: "شام كاش آلي ل.س",
      isAuto: true,
      badge: "تلقائي",
      iconEmoji: "💵",
      gradient: "from-cyan-600/30 to-slate-900",
      description: "شحن رصيد بالليرة السورية آلياً",
    },
    {
      id: "syriatel-cash",
      bankId: "15",
      name: "سيريتل كاش",
      isAuto: true,
      badge: "تلقائي",
      iconEmoji: "🔴",
      gradient: "from-rose-600/30 to-slate-900",
      description: "شحن سيريتل كاش الفوري 7/24",
    },
    {
      id: "usdt-bep20",
      bankId: "6",
      name: "عملة (Bep20) usdt",
      isAuto: false,
      badge: "",
      iconEmoji: "💎",
      gradient: "from-emerald-600/30 to-slate-900",
      description: "إيداع USDT عبر شبكة BEP20",
    },
    {
      id: "usdt-trc20",
      bankId: "7",
      name: "عملة (TRC20) Usdt",
      isAuto: false,
      badge: "",
      iconEmoji: "🔷",
      gradient: "from-teal-600/30 to-slate-900",
      description: "إيداع USDT عبر شبكة TRC20",
    },
    {
      id: "orbit-box",
      bankId: "8",
      name: "اعتماد صندوق اوربيت",
      isAuto: false,
      badge: "",
      iconEmoji: "🌐",
      gradient: "from-amber-600/30 to-slate-900",
      description: "التحويل عبر صندوق أوربيت المعتمد",
    },
    {
      id: "haram-transfer",
      bankId: "9",
      name: "حوالة مكتب الهرم",
      isAuto: false,
      badge: "",
      iconEmoji: "🏢",
      gradient: "from-slate-700 to-slate-900",
      description: "حوالة مالية عبر شركة الهرم",
    },
    {
      id: "fouad-transfer",
      bankId: "10",
      name: "حوالة مكتب الفؤاد",
      isAuto: false,
      badge: "",
      iconEmoji: "🏦",
      gradient: "from-yellow-600/30 to-slate-900",
      description: "حوالة مالية عبر شركة الفؤاد",
    },
    {
      id: "admin-coordination",
      bankId: "11",
      name: "تنسيق مع الادارة",
      isAuto: false,
      badge: "",
      iconEmoji: "💬",
      gradient: "from-purple-600/30 to-slate-900",
      description: "تواصل مباشر مع الدعم الفني",
    },
  ];

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl pb-16 text-right">
      
      {/* Top Bar with "شحن بكود" button matching Screenshot 3 */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href="/wallet"
          className="flex items-center gap-2 bg-[#1c2432] hover:bg-[#253042] border border-white/10 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition-all shadow-md"
        >
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>شحن بكود</span>
        </Link>

        <h1 className="text-base sm:text-lg font-black text-white">طرق الإيداع والدفع</h1>
      </div>

      {/* 3-Column Grid of Payment Method Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-2">
        {paymentMethods.map((method) => (
          <Link
            key={method.id}
            href={`/bank/${method.bankId}`}
            className="group flex flex-col items-center text-center focus:outline-none"
          >
            {/* 3D Tile Card */}
            <div className="w-full aspect-square rounded-2xl bg-[#141b26] border border-white/10 hover:border-amber-400/50 p-2 relative flex flex-col items-center justify-between shadow-lg overflow-hidden transition-all group-hover:-translate-y-1 group-active:scale-95">
              
              {/* Badge (تلقائي) on top-right */}
              {method.isAuto && (
                <div className="absolute top-2 right-2 bg-slate-800/90 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/10">
                  تلقائي
                </div>
              )}

              {/* Icon Emoji / 3D Art */}
              <div className="w-full flex-1 flex items-center justify-center text-3xl sm:text-4xl transition-transform group-hover:scale-110">
                <span>{method.iconEmoji}</span>
              </div>

              {/* Subtitle / Name inside card */}
              <div className="w-full bg-[#0d121b]/90 border border-white/10 rounded-lg py-1 px-1 text-[9px] sm:text-[10px] font-bold text-slate-200 truncate">
                {method.name}
              </div>
            </div>

            {/* Title below card */}
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-amber-400 mt-1.5 transition-colors line-clamp-1">
              {method.name}
            </span>
          </Link>
        ))}
      </div>

    </div>
  );
}
