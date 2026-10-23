import Link from "next/link";
import { ShieldCheck, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          <span>الشروط والأحكام وسياسة الاستخدام</span>
        </h1>
        <p className="text-xs text-slate-400">آخر تحديث: 2026</p>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed pt-4 border-t border-white/10">
          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">1. طبيعة الخدمات الرقمية</h3>
            <p>
              يقدم متجر إكس زد ستور خدمات شحن الألعاب والاشتراكات والبطاقات الرقمية. يتم تنفيذ الطلبات برقم الآيدي أو البيانات المطلوبة حصراً، ولا نطلب كلمة مرور حسابك الشخصي مطلقاً.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">2. دقة بيانات الطلب</h3>
            <p>
              يتحمل العميل المسؤولية الكاملة عن صحة البيانات المدخلة في نموذج الطلب (مثل Player ID أو رابط الحساب). لا يمكن إلغاء أو استرداد قيمة الطلب في حال تم تنفيذه لمعرف خاطئ زوده العميل.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">3. سياسة الاسترداد والإلغاء</h3>
            <p>
              في حال تعذر تنفيذ الخدمة من قبل المتجر أو حدوث خطأ فني قبل الشحن، يحق للعميل إلغاء الطلب واسترداد كامل المبلغ مباشرة إلى رصيد محفظته في المتجر.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">4. أمان المعاملات المالية</h3>
            <p>
              تخضع عمليات شحن المحفظة اليدوية (سيريتل كاش، شام كاش، MTN) للمطابقة والتحقق الإداري لمنع الاحتيال وضمان حقوق الطرفين.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
