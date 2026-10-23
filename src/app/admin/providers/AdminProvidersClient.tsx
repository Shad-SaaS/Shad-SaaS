"use client";

import { useState } from "react";
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  DollarSign,
  Loader2,
  Layers,
  Eye,
  EyeOff,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface ProviderItem {
  id: string;
  name: string;
  code?: string;
  template: string;
  baseUrl: string;
  apiToken: string;
  apiTokenMasked?: string;
  isActive: boolean;
  priority?: number;
  balance: number;
  currency: string;
  lastSyncAt?: Date | null;
  _count?: { products: number };
}

interface AdminProvidersClientProps {
  initialProviders: ProviderItem[];
}

export default function AdminProvidersClient({ initialProviders }: AdminProvidersClientProps) {
  const [providers, setProviders] = useState(initialProviders);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("client_api_v1");
  const [baseUrl, setBaseUrl] = useState("https://");
  const [apiToken, setApiToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);
  const [priority, setPriority] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTokenVisibility = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCheckBalance = async (id: string) => {
    setCheckingId(id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/providers/${id}/balance`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل فحص الرصيد والاتصال", isError: true });
      } else {
        setFeedback({ text: data.message });
        if (data.balance !== undefined) {
          setProviders((prev) =>
            prev.map((p) => (p.id === id ? { ...p, balance: data.balance, lastSyncAt: new Date() } : p))
          );
        }
      }
    } catch {
      setFeedback({ text: "حدث خطأ غير متوقع في الشبكة", isError: true });
    } finally {
      setCheckingId(null);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const credentials: Record<string, string> = {
        api_token: apiToken.trim(),
        api_key: apiToken.trim(),
      };
      if (webhookSecret.trim()) {
        credentials.webhook_secret = webhookSecret.trim();
      }

      const config: Record<string, any> = {
        sandbox_mode: sandboxMode,
      };

      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          template,
          baseUrl: baseUrl.trim(),
          credentials,
          config,
          priority: Number(priority) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل إضافة المزود", isError: true });
      } else {
        setFeedback({ text: "تم تسجيل وتفعيل المزود الجديد بنجاح في النظام!" });
        setModalOpen(false);
        // Refresh list
        const refreshRes = await fetch("/api/admin/providers");
        const refreshData = await refreshRes.json();
        if (refreshData.providers) {
          setProviders(refreshData.providers);
        }
        // Reset form
        setName("");
        setBaseUrl("https://");
        setApiToken("");
        setWebhookSecret("");
      }
    } catch {
      setFeedback({ text: "حدث خطأ أثناء إرسال البيانات", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-400" />
            إدارة مزودي API الخارجيين
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ربط وإدارة بوابات ومزودي المنتجات عبر بنية المحولات الموحدة (Provider Adapters)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/api-products"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm border border-white/10 transition-colors"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            جدول استيراد المنتجات
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة مزود جديد
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-bold ${
            feedback.isError
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            إغلاق ✕
          </button>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((p) => {
          const isChecking = checkingId === p.id;
          const isTokenVisible = showTokens[p.id];
          const isPayment = p.template === "samapi_payments";

          return (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-white/10 hover:border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-lg relative group"
            >
              <div>
                {/* Provider Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {p.name}
                      {p.isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" title="نشط" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" title="معطل" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/5 border border-white/5 text-cyan-300 font-mono px-2 py-0.5 rounded">
                        {p.template}
                      </span>
                      {p.priority && (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                          أولوية: {p.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                    {p._count?.products || 0} منتج مرتبط
                  </span>
                </div>

                {/* Base URL */}
                <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate font-mono bg-black/20 p-2 rounded-lg border border-white/5 mb-4">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{p.baseUrl}</span>
                </div>

                {/* Balance & Financial Info */}
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-white/5 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      {isPayment ? "نوع البوابة:" : "الرصيد عند المزود:"}
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {isPayment ? "تحقق إيداعات" : `${p.balance.toLocaleString()} ${p.currency}`}
                    </span>
                  </div>

                  {p.lastSyncAt && (
                    <div className="text-[11px] text-slate-400 text-left font-mono">
                      آخر فحص: {new Date(p.lastSyncAt).toLocaleTimeString("ar-SA")}
                    </div>
                  )}
                </div>

                {/* Credentials / Token */}
                <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs font-mono text-slate-300 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Key className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">
                      {isTokenVisible ? p.apiToken : p.apiTokenMasked || "••••••••••••••••"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleTokenVisibility(p.id)}
                    className="text-slate-400 hover:text-white p-1"
                    title={isTokenVisible ? "إخفاء" : "إظهار"}
                  >
                    {isTokenVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleCheckBalance(p.id)}
                  disabled={isChecking}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  اختبار الاتصال
                </button>

                {!isPayment && (
                  <Link
                    href={`/admin/api-products?providerId=${p.id}`}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    title="مزامنة واستيراد المنتجات"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    المنتجات
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-cyan-400" />
              إضافة مزود API جديد
            </h2>

            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المزود *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: القصر في آي بي أو ModC Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">قالب الـ Driver المعياري *</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="client_api_v1">client_api_v1 (Mersal / Alkasr / Alhallak / Yazancard / Tartousi / Alzaeem)</option>
                  <option value="modc_agent">modc_agent (ModC وضع الوكيل - POST & Sandbox & Webhook)</option>
                  <option value="samapi_payments">samapi_payments (سام للمدفوعات - مراجعة الإيداعات)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">العنوان الأساسي (Base URL) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.example.com/"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {template === "modc_agent" ? "مفتاح API (x-api-key) *" : "التوكن / المفتاح السري (API Token) *"}
                </label>
                <input
                  type="password"
                  required
                  placeholder="أدخل الرمز أو المفتاح السري"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  يتم تشفير هذا المفتاح تلقائياً بخوارزمية AES-256-GCM قبل حفظه في قاعدة البيانات.
                </p>
              </div>

              {template === "modc_agent" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">سر الويب هوك (Webhook Secret)</label>
                    <input
                      type="password"
                      placeholder="المفتاح السري لتوقيع HMAC-SHA256"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="sandboxToggle"
                      checked={sandboxMode}
                      onChange={(e) => setSandboxMode(e.target.checked)}
                      className="rounded bg-slate-800 border-white/10 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="sandboxToggle" className="text-xs text-slate-300 font-bold">
                      تفعيل وضع الاختبار (Sandbox Mode) لاختبار الطلبات بدون خصم رصيد
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الأولوية (Priority)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) || 1)}
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  المزود صاحب الأولوية 1 يتم استدعاؤه أولاً، وإذا حدث فشل آمن يتم التحويل التلقائي لصاحب الأولوية 2.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ وتفعيل المزود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
