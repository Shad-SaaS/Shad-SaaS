"use client";

import { useState } from "react";
import {
  Settings,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Save,
  Wallet,
  Smartphone,
  Shield,
} from "lucide-react";

interface SettingItem {
  id: string;
  value: string;
  description?: string | null;
}

interface PaymentMethodItem {
  id: string;
  code: string;
  name: string;
  accountNumber: string;
  accountHolderName: string;
  instructions: string;
  minDeposit: number;
  isActive: boolean;
  autoVerification?: boolean;
}

interface AdminSettingsClientProps {
  initialSettings: SettingItem[];
  initialPaymentMethods: PaymentMethodItem[];
}

export default function AdminSettingsClient({
  initialSettings,
  initialPaymentMethods,
}: AdminSettingsClientProps) {
  const getInitialVal = (key: string, fallback = "") => {
    const found = initialSettings.find((s) => s.id === key);
    return found ? found.value : fallback;
  };

  const [storeName, setStoreName] = useState(getInitialVal("store_name", "Shad-Store | متجر شاد ستور"));
  const [storeLogo, setStoreLogo] = useState(getInitialVal("store_logo", ""));
  const [currency, setCurrency] = useState(getInitialVal("currency", "ل.س"));
  const [announcement, setAnnouncement] = useState(
    getInitialVal(
      "announcement",
      "⚡ مرحباً بكم في متجر شاد ستور (Shad-Store)! شحن فوري للألعاب والاشتراكات عبر سيريتل كاش وشام كاش على مدار الساعة."
    )
  );
  const [contactWhatsapp, setContactWhatsapp] = useState(getInitialVal("contact_whatsapp", "+963988776655"));
  const [contactTelegram, setContactTelegram] = useState(getInitialVal("contact_telegram", "https://t.me/ShadStoreSupport"));
  const [maintenanceMode, setMaintenanceMode] = useState(getInitialVal("maintenance_mode", "false") === "true");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل رفع الشعار", isError: true });
      } else {
        setStoreLogo(data.url);
        setFeedback({ text: "تم رفع صورة الشعار بنجاح! لا تنسَ الضغط على حفظ التغييرات." });
      }
    } catch {
      setFeedback({ text: "حدث خطأ أثناء رفع الشعار", isError: true });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            store_name: storeName.trim(),
            store_logo: storeLogo.trim(),
            currency: currency.trim(),
            announcement: announcement.trim(),
            contact_whatsapp: contactWhatsapp.trim(),
            contact_telegram: contactTelegram.trim(),
            maintenance_mode: String(maintenanceMode),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ text: data.error || "فشل حفظ الإعدادات", isError: true });
      } else {
        setFeedback({ text: data.message || "تم حفظ الإعدادات والشعار وتطبيقها على المتجر بنجاح!" });
      }
    } catch (err: any) {
      setFeedback({ text: "حدث خطأ: " + err.message, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>الإعدادات العامة وهوية المتجر (Shad-Store)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          تعديل اسم المتجر، الشعار، العملة، شريط الإعلانات، وطرق الدفع مباشرة بدون أي تدخل برمجي
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

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Brand & Identity Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span>الهوية والشعار واسم المتجر</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المتجر الرسمي (Store Name):
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: Shad-Store | متجر شاد ستور"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                يظهر في الترويسة، الفوتر، وعناوين المتصفح ومحركات البحث.
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                العملة الافتراضية للمتجر:
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="ل.س أو USD أو $"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 focus:border-blue-500 focus:outline-none text-white text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                الرمز الذي يظهر بجانب كافة أسعار الخدمات والمحفظة.
              </p>
            </div>

            {/* Logo Upload & Preview */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                شعار المتجر (Store Logo):
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                  {storeLogo ? (
                    <img src={storeLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-[10px] text-slate-500">بدون شعار مخصص (يُستخدم SS الافتراضي)</div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingLogo ? "جارٍ الرفع..." : "رفع شعار جديد"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>

                    {storeLogo && (
                      <button
                        type="button"
                        onClick={() => setStoreLogo("")}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-colors"
                      >
                        إزالة الشعار
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={storeLogo}
                    onChange={(e) => setStoreLogo(e.target.value)}
                    placeholder="أو أدخل رابط صورة الشعار مباشرة (URL)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Announcement & Contacts Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>شريط الإعلانات ومعلومات التواصل</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نص شريط الإعلانات العلوي (Announcement Bar):
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم واتساب الدعم الفني:
                </label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رابط تيليجرام الدعم:
                </label>
                <input
                  type="text"
                  value={contactTelegram}
                  onChange={(e) => setContactTelegram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">وضع الصيانة (Maintenance Mode)</div>
                <div className="text-[11px] text-slate-400">
                  عند تفعيله يظهر للزوار تنبيه الصيانة مع استثناء المشرفين.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="glow-btn px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ حفظ التغييرات...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ كافة التغييرات والشعار الآن</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Payment Methods Accounts Section */}
      <div id="payments" className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>حسابات طرق الدفع المعتمدة (سيريتل كاش، شام كاش، MTN)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialPaymentMethods.map((pm) => (
            <div key={pm.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-white">
                <span>{pm.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {pm.isActive ? "مفعّل" : "معطل"}
                </span>
              </div>
              <div className="text-slate-400">
                الحساب المحول إليه: <span className="font-mono text-cyan-300 font-bold">{pm.accountNumber}</span>
              </div>
              <div className="text-slate-400">
                صاحب الحساب: <span className="text-white font-bold">{pm.accountHolderName}</span>
              </div>
              <div className="text-[11px] text-slate-500">{pm.instructions}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
