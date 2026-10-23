import Link from "next/link";
import { Zap, Clock, ArrowLeft } from "lucide-react";

interface ServiceCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDesc?: string | null;
    image?: string | null;
    minPrice: number;
    executionTime?: string | null;
    category?: {
      name: string;
      slug: string;
    };
  };
  currency?: string;
}

export default function ServiceCard({ product, currency = "ل.س" }: ServiceCardProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Card Header Image / Badge */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900/60">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-900/40 to-slate-900 text-blue-400 font-bold">
              {product.name}
            </div>
          )}

          {/* Execution Time Badge */}
          {product.executionTime && (
            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{product.executionTime}</span>
            </div>
          )}

          {/* Category Tag */}
          {product.category && (
            <div className="absolute bottom-2.5 right-2.5 bg-blue-600/80 backdrop-blur-md rounded-md px-2 py-0.5 text-[10px] font-bold text-white">
              {product.category.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1 group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {product.shortDesc || "خدمة رقمية فورية وآمنة برقم الآيدي أو البيانات المطلوبة."}
          </p>
        </div>
      </div>

      {/* Footer Price & Action */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold">يبدأ من</div>
            <div className="text-base font-black text-cyan-400 font-mono">
              {product.minPrice.toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-tajawal text-slate-400">{currency}</span>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="glow-btn px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all"
          >
            <span>طلب</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
