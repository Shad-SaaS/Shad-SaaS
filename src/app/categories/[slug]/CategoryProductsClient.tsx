"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Heart } from "lucide-react";
import QuickBuyModal, { QuickBuyItem } from "@/components/QuickBuyModal";

interface Product {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  basePrice: number;
  isActive: boolean;
  executionTime?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
}

interface CategoryProductsClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  products: Product[];
  user: {
    id: string;
    name: string;
    walletBalance: number;
  } | null;
  currency?: string;
}

export default function CategoryProductsClient({
  category,
  products,
  user,
  currency = "$",
}: CategoryProductsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<QuickBuyItem | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (product: Product) => {
    // If not logged in, redirect to login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Determine input type based on category or product name
    const lowerName = (product.name + " " + category.name).toLowerCase();
    let inputType: "id" | "email" | "phone" | "none" = "id";
    let inputPlaceholder = "الآيدي (Player ID)";
    let inputLabel = "playerId";

    if (lowerName.includes("كود") || lowerName.includes("code") || lowerName.includes("مشترك")) {
      inputType = "none";
      inputPlaceholder = "";
      inputLabel = "";
    } else if (lowerName.includes("ايميل") || lowerName.includes("gmail") || lowerName.includes("gemini") || lowerName.includes("شاهد")) {
      inputType = "email";
      inputPlaceholder = "أدخل بريدك الإلكتروني (Gmail)";
      inputLabel = "email";
    } else if (lowerName.includes("سيريتل") || lowerName.includes("هاتف") || lowerName.includes("phone")) {
      inputType = "phone";
      inputPlaceholder = "أدخل رقم الهاتف";
      inputLabel = "phone";
    }

    setSelectedItem({
      id: product.id,
      name: product.name,
      price: product.basePrice,
      currency: currency,
      categoryName: category.name,
      inputType,
      inputPlaceholder,
      inputLabel,
      executionHint: product.executionTime
        ? `سرعة التنفيذ: ${product.executionTime}`
        : "هذا المنتج يعمل بشكل فوري وآلي 24/7",
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl pb-16 text-right">
      
      {/* Top Header matching screenshots */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <h1 className="text-base sm:text-lg font-black text-white">{category.name}</h1>
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xl bg-[#141b26] text-slate-400 hover:text-white transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar matching screenshots */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث في الأقسام والخدمات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121824] border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 shadow-inner text-right"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* 3-Column Grid of Products / Packages matching screenshots */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#121824] p-10 rounded-3xl text-center text-slate-400 text-xs border border-white/5">
          لا توجد خدمات متاحة مطابقة لبحثك في هذا القسم حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {filteredProducts.map((product) => {
            const isUnavailable = !product.isActive;

            return (
              <div
                key={product.id}
                onClick={() => !isUnavailable && handleCardClick(product)}
                className={`group flex flex-col items-center text-center cursor-pointer select-none ${
                  isUnavailable ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {/* 3D Tile Card */}
                <div className="w-full aspect-square rounded-2xl bg-[#141b26] border border-white/10 hover:border-amber-400/50 p-2 relative flex flex-col items-center justify-center shadow-lg overflow-hidden transition-all group-hover:-translate-y-1 group-active:scale-95 ribbon-wrapper">
                  
                  {/* Red Diagonal Ribbon if Unavailable matching screenshot 9 & 10 */}
                  {isUnavailable && (
                    <div className="ribbon-unavailable">
                      غير متاح
                    </div>
                  )}

                  {/* Artwork / Image */}
                  <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-3xl sm:text-4xl">
                        🎮
                      </div>
                    )}
                  </div>

                  {/* Price overlay badge */}
                  <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[10px] font-mono font-bold text-amber-300">
                    {product.basePrice.toFixed(2)} $
                  </div>
                </div>

                {/* Title under card */}
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-amber-400 mt-1.5 transition-colors line-clamp-1">
                  {product.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Buy Modal Popup */}
      {selectedItem && (
        <QuickBuyModal
          item={selectedItem}
          userBalance={user ? user.walletBalance : 0}
          isLoggedIn={!!user}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            router.push("/orders");
          }}
        />
      )}

    </div>
  );
}
