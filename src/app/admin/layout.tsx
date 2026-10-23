import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminSidebar from "./AdminSidebar";
import { ArrowRight, Bell, Shield, SunMoon } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login?redirect=/admin");
  }

  // Get live counts for sidebar red badges
  const [pendingOrdersCount, pendingDepositsCount, openTicketsCount, storeSettings] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.storeSetting.findMany(),
  ]);

  const findSetting = (id: string, fallback: string) => {
    const s = storeSettings.find((item) => item.id === id);
    return s ? s.value : fallback;
  };

  const storeName = findSetting("store_name", "Shad-Store");
  const storeLogo = findSetting("store_logo", "");

  return (
    <div className="min-h-screen bg-[#020410] text-slate-200 flex flex-col -mx-4 lg:-mx-8 -my-6">
      
      {/* 1. Admin Top Command Bar */}
      <header className="h-14 border-b border-white/10 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="h-7 w-auto max-w-[100px] object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
              SS
            </div>
          )}
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>{storeName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Admin Panel
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">نظام إدارة العمليات والطلبات والمزودين والمحفظة</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Notifications bell badge */}
          <Link
            href="/admin/orders"
            className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="الإشعارات والعمليات المعلقة"
          >
            <Bell className="w-4 h-4" />
            {pendingOrdersCount + pendingDepositsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {pendingOrdersCount + pendingDepositsCount}
              </span>
            )}
          </Link>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">{user.name}</span>
          </div>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>واجهة المتجر</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Main Content Container with Structured Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Dynamic Client Sidebar with Search and Collapsible Groups */}
        <AdminSidebar
          pendingOrdersCount={pendingOrdersCount}
          pendingDepositsCount={pendingDepositsCount}
          openTicketsCount={openTicketsCount}
        />

        {/* Admin Pages Content View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl overflow-x-hidden">
          {children}
        </main>

      </div>

    </div>
  );
}
