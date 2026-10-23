import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-3">
        <h1 className="text-base sm:text-lg font-black text-white">حول الموقع</h1>
        <Link
          href="/"
          className="p-1.5 rounded-xl bg-[#141b26] text-slate-400 hover:text-white transition-colors"
          title="الرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold text-amber-400">من نحن</span>

        {/* Content matching Screenshot 1 in Batch 4 */}
        <div className="bg-[#121824] p-6 rounded-3xl border border-white/5 space-y-5 text-xs text-slate-300 leading-relaxed font-medium shadow-lg">
          <p className="text-sm font-bold text-white">
            نحن إدارة موقع Shad-Vip
          </p>

          <p>
            نهدف من خلال موقعنا إلى تقديم خدمات تقنية ورقمية عالية المستوى، مبنية على الابتكار، الأمان، والجودة، لتلبية تطلعات عملائنا وتقديم حلول عصرية متكاملة في مجال شحن الألعاب والاشتراكات والبطاقات الرقمية.
          </p>

          <p>
            رؤيتنا تقوم على الدمج بين التطوير الذكي والربط الآلي مع الموردين، والالتزام الصارم بأعلى معايير الأمن السيبراني وحماية التعاملات، لنوفر بيئة آمنة، موثوقة، وفعالة بنسبة 100% لكل مستخدمينا وعملائنا.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-center">
            <div className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xl">⚡</span>
              <h4 className="font-bold text-white text-[11px]">شحن فوري آلي</h4>
              <p className="text-[10px] text-slate-400">تنفيذ سريع على مدار الساعة</p>
            </div>

            <div className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 space-y-1">
              <span className="text-xl">🛡️</span>
              <h4 className="font-bold text-white text-[11px]">حماية 100%</h4>
              <p className="text-[10px] text-slate-400">معاملات مشفرة وآمنة</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
