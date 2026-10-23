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
} from "lucide-react";

interface ProviderItem {
  id: string;
  name: string;
  code: string;
  template: string;
  baseUrl: string;
  apiToken: string;
  isActive: boolean;
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
  const [code, setCode] = useState("");
  const [template, setTemplate] = useState("client_api_v1");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [currency, setCurrency] = useState("USD");
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
        setFeedback({ text: data.error || "فشل فحص الرصيد", isError: true });
      } else {
        setFeedback({ text: data.message });
        if (data.balance !== undefined) {
          setProviders((prev) =>
            prev.map((p) => (p.id === id ? { ...p, balance: data.balance } : p))
          );
        }
      }
    } catch (err: any) {
      setFeedback({ text: "خطأ: " + err.message, isError: true });
    } finally {
      setCheckingId(null);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, template, baseUrl, apiToken, currency }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل إضافة المزود", isError: true });
      } else {
        setFeedback({ text: "تم تسجيل وتفعيل المزود بنجاح!" });
        setProviders((prev) => [data.provider, ...prev]);
        setModalOpen(false);
        setName("");
        setCode("");
        setBaseUrl("");
        setApiToken("");
      }
    } catch (err: any) {
      setFeedback({ text: "خطأ: " + err.message, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-400" />
            <span>مزودو الخدمات والـ API (API Providers)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة مزودي المنتجات (Alkasr, Mersal, Tartousi...) ومزود الدفع الآلي (Sam API) وفحص الأرصدة الحية
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="glow-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مزود API جديد</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.isError
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const isChecking = checkingId === p.id;
          const isTokenVisible = showTokens[p.id];

          return (
            <div
              key={p.id}
              className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  <div className="text-[10px] text-blue-400 font-mono mt-0.5">{p.code} ({p.template})</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {p.isActive ? "نشط" : "معطل"}
                  </span>
                </div>
              </div>

              {/* URL and Token */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-tajawal text-[11px]">الرابط الأساسي:</span>
                  <a
                    href={p.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>{p.baseUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-tajawal text-[11px]">مفتاح الـ API:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[11px]">
                      {isTokenVisible ? p.apiToken : "••••••••••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleTokenVisibility(p.id)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      {isTokenVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Balance & Actions Bar */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 font-tajawal">رصيدك لدى المزود: </span>
                  <span className="font-mono font-black text-cyan-300 text-sm">
                    {p.balance.toLocaleString("ar-SA")} {p.currency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCheckBalance(p.id)}
                    disabled={isChecking}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-blue-400" : ""}`} />
                    <span>فحص الرصيد</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel border border-white/15 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">إضافة مزود API جديد</h3>

            <form onSubmit={handleAddProvider} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">اسم المزود:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Alkasr VIP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">المعرف (Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="alkasr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">قالب المزود (Template):</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  >
                    <option value="client_api_v1">client_api_v1 (Mersal/Alkasr)</option>
                    <option value="sam_api">sam_api (Payments)</option>
                    <option value="modc_agent">modc_agent</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">العنوان الأساسي (Base URL):</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.alkasr-vip.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">رمز المصادقة (API Token):</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل مفتاح الـ API الخاص بالمزود هنا"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glow-btn px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>حفظ المزود</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
