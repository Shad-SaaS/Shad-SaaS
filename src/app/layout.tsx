import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Shad-Vip | متجر شاد في آي بي — منصة الخدمات والمنتجات الرقمية",
  description: "المنصة الأولى لشحن الألعاب والاشتراكات الرقمية والبطاقات عبر سيريتل كاش وشام كاش بأمان وسرعة فائقة.",
  keywords: ["شحن ببجي", "تيليجرام بريميوم", "فري فاير", "سيريتل كاش", "شام كاش", "متجر رقمي", "Shad-Vip", "shad-vip.store"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let announcement = "⚡ شحن فوري للألعاب والاشتراكات 24/7 عبر سيريتل كاش وشام كاش!";
  let currency = "$";
  let storeName = "Shad-Vip";
  let storeLogo = "";

  try {
    user = await getCurrentUser();
    const settings = await prisma.storeSetting.findMany();
    const findSetting = (id: string, fallback: string) => {
      const found = settings.find((s) => s.id === id);
      return found ? found.value : fallback;
    };

    announcement = findSetting("announcement", announcement);
    currency = findSetting("currency", currency);
    storeName = findSetting("store_name", storeName);
    storeLogo = findSetting("store_logo", storeLogo);
  } catch (err) {
    // Fallback if db is unavailable
  }

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col justify-between selection:bg-amber-500 selection:text-black">
        <Header
          user={user}
          announcement={announcement}
          currency={currency}
          storeName="Shad-Vip"
          storeLogo={storeLogo}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 pb-24 sm:pb-6">
          {children}
        </main>
        <Footer />
        <BottomNav user={user} />
      </body>
    </html>
  );
}
