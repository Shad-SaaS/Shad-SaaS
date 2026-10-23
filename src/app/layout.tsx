import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Shad-Store | متجر شاد ستور — منصة الخدمات والمنتجات الرقمية",
  description: "المنصة الأولى لشحن الألعاب والاشتراكات الرقمية والبطاقات عبر سيريتل كاش وشام كاش بأمان وسرعة فائقة.",
  keywords: ["شحن ببجي", "تيليجرام بريميوم", "فري فاير", "سيريتل كاش", "شام كاش", "متجر رقمي", "Shad-Store"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let announcement = "⚡ شحن فوري للألعاب والاشتراكات 24/7 عبر سيريتل كاش وشام كاش!";
  let currency = "ل.س";
  let storeName = "Shad-Store | متجر شاد ستور";
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
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-tajawal min-h-screen flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        <Header
          user={user}
          announcement={announcement}
          currency={currency}
          storeName={storeName}
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
