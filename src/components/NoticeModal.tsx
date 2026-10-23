"use client";

import { useState, useEffect } from "react";
import { X, Bell, ShieldAlert } from "lucide-react";

export default function NoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only if not dismissed recently in session
    const dismissed = sessionStorage.getItem("shad_notice_dismissed");
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("shad_notice_dismissed", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141a24] border border-white/10 rounded-3xl p-5 max-w-sm w-full text-center relative shadow-2xl space-y-4">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-black text-white flex items-center justify-center gap-2 pt-2">
          <span>إشعار هام</span>
          <span className="text-amber-400">🔔</span>
        </h3>

        {/* Body content matching Screenshot 1 */}
        <div className="text-xs text-slate-300 leading-relaxed space-y-3 bg-[#0d121b] p-3.5 rounded-2xl border border-white/5 text-right font-medium">
          <p className="text-cyan-300 font-bold flex items-center gap-1.5">
            <span>✨ يرجى تفعيل إشعارات الموقع أو بوت التلغرام لمتابعة حالة طلباتك فورياً.</span>
          </p>

          <p className="text-slate-200">
            📢 <strong>إلى جميع عملاء وزوار Shad-Vip:</strong>
          </p>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            نؤكد بشكل صريح وواضح أنه <strong>لا يوجد لدينا أي وكيل أو موظف مخول بطلب أموال أو تحويلات مالية أو بيانات شخصية</strong> من أي طرف خارج القنوات الرسمية للموقع.
          </p>

          <p className="text-emerald-400 text-[11px] font-bold">
            ✅ جميع عمليات الشحن والدفع تتم حصراً وآلياً من خلال منصتنا الرسمية.
          </p>
        </div>

        {/* Action Button: موافق */}
        <button
          onClick={handleDismiss}
          className="w-full bg-[#3b4454] hover:bg-[#4a5568] text-white font-black py-2.5 rounded-2xl text-sm transition-all shadow-lg active:scale-98"
        >
          موافق
        </button>

      </div>
    </div>
  );
}
