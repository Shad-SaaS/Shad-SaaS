import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Key,
  Calendar,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      product: { select: { name: true, image: true, executionTime: true } },
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const currencySetting = await prisma.storeSetting.findUnique({ where: { id: "currency" } });
  const currency = currencySetting?.value || "ل.س";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            <span>سجل طلباتي</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تابع حالة تنفيذ طلباتك الحالية وأكواد التفعيل المسلمة
          </p>
        </div>

        <Link
          href="/"
          className="glow-btn px-4 py-2 rounded-xl text-xs font-bold"
        >
          طلب خدمة جديدة
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">لا توجد طلبات سابقة</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            لم تقم بإنشاء أي طلبات حتى الآن. تصفح الخدمات الرقمية المتاحة واختر ما يناسبك.
          </p>
          <Link
            href="/"
            className="glow-btn px-6 py-2.5 rounded-xl text-xs font-bold inline-block"
          >
            تصفح المتجر الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            let parsedInputs: Record<string, string> = {};
            try {
              parsedInputs = JSON.parse(order.customerInputs);
            } catch {}

            return (
              <div
                key={order.id}
                className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">رقم الطلب:</span>
                    <span className="font-bold text-cyan-400">{order.orderNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(order.createdAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Status Badge */}
                    {order.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        بانتظار التنفيذ
                      </span>
                    )}
                    {order.status === "PROCESSING" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        <Zap className="w-3.5 h-3.5" />
                        جارٍ التنفيذ
                      </span>
                    )}
                    {order.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مكتمل ومسلّم
                      </span>
                    )}
                    {order.status === "CANCELLED" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        ملغي ومسترد للمحفظة
                      </span>
                    )}
                    {order.status === "PARTIAL" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        مكتمل جزئياً ومسترد
                      </span>
                    )}
                  </div>
                </div>

                {/* Product & Variant Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">
                      {order.product.name}
                    </h3>
                    <div className="text-xs text-slate-300 space-x-2 space-x-reverse">
                      {order.items.map((item) => (
                        <span key={item.id} className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          {item.variantName} (×{item.quantity})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right sm:text-left font-mono">
                    <div className="text-sm font-black text-cyan-300">
                      {order.totalAmount.toLocaleString("ar-SA")} {currency}
                    </div>
                    {order.refundAmount > 0 && (
                      <div className="text-[11px] text-purple-400 font-bold">
                        مسترد للمحفظة: {order.refundAmount.toLocaleString("ar-SA")} {currency}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Submitted Inputs Display */}
                {Object.keys(parsedInputs).length > 0 && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(parsedInputs).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-mono font-bold text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delivery Notes / Code display */}
                {order.deliveryNotes && (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Key className="w-4 h-4" />
                      <span>بيانات التسليم أو كود التفعيل:</span>
                    </div>
                    <div className="font-mono text-white text-sm bg-black/40 p-2.5 rounded-xl border border-white/10 break-all select-all">
                      {order.deliveryNotes}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
