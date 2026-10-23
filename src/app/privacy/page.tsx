import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>سياسة الخصوصية وحماية البيانات</span>
        </h1>
        <p className="text-xs text-slate-400">نلتزم بحماية سرية معلوماتك وبياناتك الشخصية</p>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed pt-4 border-t border-white/10">
          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">1. جمع البيانات واستخدامها</h3>
            <p>
              نجمع الحد الأدنى الضروري من البيانات فقط لإتمام الطلبات وتقديم الدعم، مثل البريد الإلكتروني، الاسم، ورقم المعاملة لإثبات الدفع.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">2. سرية وأمان البيانات</h3>
            <p>
              يتم تخزين كلمات المرور مشفرة ومجزأة بتقنية bcrypt، وتمر كافة المعاملات عبر اتصالات مشفرة ومؤمنة تماماً.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-white text-sm">3. عدم مشاركة البيانات مع أطراف ثالثة</h3>
            <p>
              لا نقوم ببيع أو تأجير أو مشاركة بيانات عملائنا مع أي جهة خارجية إلا بالقدر المطلوب تقنياً لتنفيذ خدمات الشحن المباشرة.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
