import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  Users,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  Layers,
  ChevronLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalOrdersCount,
    pendingOrdersCount,
    processingOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    pendingDepositsCount,
    customersCount,
    orders,
    pendingDeposits,
    currencySetting,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.depositRequest.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.storeSetting.findUnique({ where: { id: "currency" } }),
  ]);

  const currency = currencySetting?.value || "ل.س";

  // Aggregate total sales
  const salesAgg = await prisma.order.aggregate({
    where: { status: { in: ["COMPLETED", "PROCESSING"] } },
    _sum: { totalAmount: true },
  });
  const totalRevenue = salesAgg._sum.totalAmount || 0;

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">لوحة العمليات والمؤشرات</h1>
          <p className="text-xs text-slate-400 mt-1">
            إحصائيات حية مستخرجة مباشرة من قاعدة بيانات المتجر
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingDepositsCount > 0 && (
            <Link
              href="/admin/deposits"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{pendingDepositsCount} طلبات شحن معلقة</span>
            </Link>
          )}

          {pendingOrdersCount > 0 && (
            <Link
              href="/admin/orders"
              className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingOrdersCount} طلبات جديدة</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>إجمالي المبيعات المؤكدة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {totalRevenue.toLocaleString("ar-SA")}{" "}
            <span className="text-xs font-tajawal text-emerald-400">{currency}</span>
          </div>
          <div className="text-[11px] text-slate-500">من الطلبات المكتملة وقيد التنفيذ</div>
        </div>

        {/* Total Orders */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>إجمالي عدد الطلبات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {totalOrdersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            <span className="text-amber-400 font-bold">{pendingOrdersCount} معلق</span> ·{" "}
            <span className="text-emerald-400 font-bold">{completedOrdersCount} مكتمل</span>
          </div>
        </div>

        {/* Pending Top-up Deposits */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>طلبات شحن الرصيد</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {pendingDepositsCount}
          </div>
          <div className="text-[11px] text-amber-400 font-bold">بانتظار التحقق الإداري</div>
        </div>

        {/* Total Customers */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>العملاء المسجلون</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {customersCount}
          </div>
          <div className="text-[11px] text-slate-500">حسابات العملاء النشطة</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Table (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>آخر الطلبات المسجلة</span>
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">لا توجد طلبات حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-400">{order.orderNumber}</span>
                      <span className="text-slate-300 font-tajawal text-xs">{order.product.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      العميل: <span className="text-slate-300">{order.user.name}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <div className="font-black text-white">
                      {order.totalAmount.toLocaleString("ar-SA")} {currency}
                    </div>
                    <div className="mt-1">
                      {order.status === "PENDING" && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          جديد
                        </span>
                      )}
                      {order.status === "PROCESSING" && (
                        <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                          قيد المعالجة
                        </span>
                      )}
                      {order.status === "COMPLETED" && (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          مكتمل
                        </span>
                      )}
                      {order.status === "CANCELLED" && (
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">
                          ملغي
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Deposits Review Queue (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>طلبات شحن معلقة ({pendingDepositsCount})</span>
            </h3>
            <Link
              href="/admin/deposits"
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <span>صفحة الشحن</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <div>رائع! لا توجد طلبات شحن معلقة حالياً.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{dep.user.name}</span>
                    <span className="font-mono font-black text-amber-300">
                      {dep.amount.toLocaleString("ar-SA")} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>الوسيلة: {dep.paymentMethodCode}</span>
                    <span className="font-mono text-slate-300">إشعار: {dep.referenceNumber}</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                    <Link
                      href="/admin/deposits"
                      className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors"
                    >
                      مراجعة واعتماد
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
