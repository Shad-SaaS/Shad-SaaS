"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Package,
  Layers,
  Users,
  Tag,
  Settings,
  Headphones,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Server,
  Download,
  KeyRound,
  Image,
  Award,
  FileCode,
  ShieldCheck,
  History,
  Clock,
  Database,
} from "lucide-react";

interface AdminSidebarProps {
  pendingOrdersCount: number;
  pendingDepositsCount: number;
  openTicketsCount: number;
}

export default function AdminSidebar({
  pendingOrdersCount,
  pendingDepositsCount,
  openTicketsCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    daily: true,
    catalog: true,
    finance: true,
    users: true,
    system: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuSections = [
    {
      key: "daily",
      title: "العمليات اليومية",
      items: [
        { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
        { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, badge: pendingOrdersCount },
        { href: "/admin/templates", label: "قوالب رسائل الطلبات", icon: FileCode },
        { href: "/admin/tickets", label: "تذاكر الدعم الفني", icon: Headphones, badge: openTicketsCount },
      ],
    },
    {
      key: "catalog",
      title: "المنتجات والمزودون",
      items: [
        { href: "/admin/categories", label: "الأقسام والمجموعات", icon: Layers },
        { href: "/admin/products", label: "المنتجات", icon: Package },
        { href: "/admin/api-products", label: "منتجات عبر API (الاستيراد)", icon: Download },
        { href: "/admin/providers", label: "مزودو API والاتصال", icon: Server },
        { href: "/admin/auto-codes", label: "الأكواد التلقائية", icon: KeyRound },
        { href: "/admin/banners", label: "البنرات والعروض المميزة", icon: Image },
      ],
    },
    {
      key: "finance",
      title: "الإدارة المالية والتسويق",
      items: [
        { href: "/admin/deposits", label: "طلبات شحن الرصيد", icon: Wallet, badge: pendingDepositsCount },
        { href: "/admin/coupons", label: "كوبونات الخصم", icon: Tag },
        { href: "/admin/vip-tiers", label: "عضويات VIP والمستويات", icon: Award },
      ],
    },
    {
      key: "users",
      title: "إدارة المستخدمين والصلاحيات",
      items: [
        { href: "/admin/customers", label: "إدارة المستخدمين", icon: Users },
        { href: "/admin/staff", label: "المشرفون والصلاحيات", icon: ShieldCheck },
        { href: "/admin/audit-logs", label: "سجل النشاط", icon: History },
      ],
    },
    {
      key: "system",
      title: "إعدادات النظام والأدوات",
      items: [
        { href: "/admin/settings", label: "الإعدادات العامة وتعديل الشعار", icon: Settings },
        { href: "/admin/backup", label: "النسخ الاحتياطي", icon: Database },
        { href: "/admin/cron", label: "المهام المجدولة (Cron)", icon: Clock },
      ],
    },
  ];

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase().trim())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-l border-white/10 bg-slate-950/70 p-4 space-y-4">
      
      {/* Search Input with Clear Button (×) */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث في القائمة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 pl-7"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute left-2 top-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
        )}
      </div>

      {/* Navigation Sections */}
      <div className="space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
        {filteredSections.map((section) => {
          const isOpen = openGroups[section.key] !== false;

          return (
            <div key={section.key} className="space-y-1">
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(section.key)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider"
              >
                <span>{section.title}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {/* Group Links */}
              {isOpen && (
                <div className="space-y-0.5 pt-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Red Badge Indicator for Pending Items */}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </aside>
  );
}
