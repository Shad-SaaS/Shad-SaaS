"use client";

import { useState } from "react";
import {
  Download,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Layers,
  ArrowRight,
  Search,
} from "lucide-react";

interface ProviderOption {
  id: string;
  name: string;
  code: string;
  baseUrl: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface AdminApiProductsClientProps {
  providers: ProviderOption[];
  categories: CategoryOption[];
  currency?: string;
}

export default function AdminApiProductsClient({
  providers,
  categories,
  currency = "ل.س",
}: AdminApiProductsClientProps) {
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [profitMargin, setProfitMargin] = useState("15");
  const [exchangeRate, setExchangeRate] = useState("14500");

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleFetchProducts = async () => {
    if (!selectedProviderId) return;
    setLoading(true);
    setFeedback(null);
    setProducts([]);
    setSelectedIds({});

    try {
      const res = await fetch(`/api/admin/providers/${selectedProviderId}/products`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل جلب المنتجات من المزود", isError: true });
      } else {
        setProducts(data.products || []);
        if (data.notice) {
          setFeedback({ text: data.notice });
        }
      }
    } catch (err: any) {
      setFeedback({ text: "خطأ: " + err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedIds).length === products.length) {
      setSelectedIds({});
    } else {
      const all: Record<string, boolean> = {};
      products.forEach((p) => {
        all[p.id] = true;
      });
      setSelectedIds(all);
    }
  };

  const handleImportSelected = async () => {
    const selectedList = products.filter((p) => selectedIds[p.id]);
    if (selectedList.length === 0) {
      setFeedback({ text: "يرجى تحديد منتج واحد على الأقل للاستيراد", isError: true });
      return;
    }

    setImporting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/providers/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          categoryId: selectedCategoryId,
          profitMarginPercent: Number(profitMargin),
          exchangeRate: Number(exchangeRate),
          products: selectedList,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل استيراد المنتجات", isError: true });
      } else {
        setFeedback({ text: data.message });
        setSelectedIds({});
      }
    } catch (err: any) {
      setFeedback({ text: "خطأ: " + err.message, isError: true });
    } finally {
      setImporting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-purple-400" />
          <span>استيراد المنتجات المتقدم عبر مزودي الـ API</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          جلب قوائم المنتجات الحية بنقرة واحدة، احتساب هامش الربح، واستيرادها مباشرة إلى متجر Shad-Store
        </p>
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

      {/* Control Configuration Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div>
            <label className="block text-slate-300 font-bold mb-1">اختر مزود الـ API:</label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
            >
              {providers.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name} ({pr.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">القسم المستهدف بالمتجر:</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">سعر الصرف (USD إلى {currency}):</label>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">نسبة هامش الربح (%):</label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
            />
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            onClick={handleFetchProducts}
            disabled={loading}
            className="glow-btn px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>جلب قائمة المنتجات من المزود الآن</span>
          </button>

          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                المحدد: <strong className="text-white">{Object.keys(selectedIds).length}</strong> من {products.length}
              </span>
              <button
                onClick={handleImportSelected}
                disabled={importing || Object.keys(selectedIds).length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>استيراد المحدد إلى المتجر</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      {products.length > 0 && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-3 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="تصفية المنتجات بالاسم أو المعرف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs pr-8"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>

            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
            >
              {Object.keys(selectedIds).length === products.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-slate-950/70">
                  <th className="py-2.5 px-3">تحديد</th>
                  <th className="py-2.5 px-3">معرف المزود</th>
                  <th className="py-2.5 px-3">اسم المنتج</th>
                  <th className="py-2.5 px-3">القسم عند المزود</th>
                  <th className="py-2.5 px-3">سعر التكلفة (USD)</th>
                  <th className="py-2.5 px-3">سعر البيع المقترح ({currency})</th>
                  <th className="py-2.5 px-3">حقول الإدخال المطلوبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredProducts.map((p) => {
                  const isChecked = !!selectedIds[p.id];
                  const costUsd = Number(p.price) || 0;
                  const profitMult = 1 + (Number(profitMargin) || 15) / 100;
                  const sellSyp = Math.round(costUsd * Number(exchangeRate) * profitMult);

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedIds((prev) => ({
                              ...prev,
                              [p.id]: !prev[p.id],
                            }))
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-white/20"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{p.id}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.category_name || "—"}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">${costUsd}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-400">
                        {sellSyp.toLocaleString("ar-SA")} {currency}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {p.params ? p.params.join(" · ") : "ID"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
