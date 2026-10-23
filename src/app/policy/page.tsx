import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PolicyPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto sm:max-w-xl pb-16 text-right">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1 border-b border-white/5 pb-3">
        <h1 className="text-base sm:text-lg font-black text-white">سياسة الاستخدام</h1>
        <Link
          href="/"
          className="p-1.5 rounded-xl bg-[#141b26] text-slate-400 hover:text-white transition-colors"
          title="الرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-4">
        <div className="bg-[#121824] p-6 rounded-3xl border border-white/5 space-y-4 text-xs text-slate-300 leading-relaxed font-medium shadow-lg">
          
          <h2 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
            <span>📢</span>
            <span>*إخلاء مسؤولية هام*</span>
          </h2>

          <p className="font-bold text-white">
            *إلى جميع عملاء ومتابعي موقع Shad-Vip الرسمي:*
          </p>

          <p className="font-bold text-slate-200">
            *نؤكد بشكل صريح وواضح ما يلي:*
          </p>

          <div className="space-y-3 pt-1">
            <p className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 text-slate-300">
              *نحن لا نقدم أي خدمات تتعلق بشحن أو تمويل مواقع المراهنات أو القمار، ولا نعمل في هذا المجال بأي شكل من الأشكال.*
            </p>

            <p className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 text-slate-300">
              *لا يوجد لدينا أي وكيل أو ممثل أو موظف مخول بطلب أموال أو تحويلات مالية أو بيانات شخصية من أي طرف خارج المنصة.*
            </p>

            <p className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 text-emerald-400 font-bold">
              *جميع العمليات والتعاملات تتم حصراً وآلياً عبر الموقع الرسمي فقط:*
              <span className="block font-mono text-cyan-300 mt-1 select-all">https://shad-vip.store</span>
            </p>

            <p className="bg-[#0e131d] p-3 rounded-2xl border border-white/5 text-slate-300">
              *وأي تواصل أو طلب دفع يتم خارج ما ذكرناه لا يمت لنا بأي صلة، ونخلي مسؤوليتنا الكاملة عن أي تعامل يتم خارج الإطار الرسمي المذكور أعلاه.*
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 font-bold text-[11px] leading-relaxed">
            🔒 *نرجو من الجميع توخي الحذر والاعتماد فقط على القنوات الرسمية لتجنب أي محاولات احتيال أو انتحال صفة.*
          </div>

          <p className="text-center text-xs font-bold text-rose-400 pt-2">
            ❤️ *مع خالص الشكر والتقدير لثقتكم الدائمة.*
          </p>

        </div>
      </div>

    </div>
  );
}
