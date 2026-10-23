const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed database for Shad-Store...");

  // 1. Create Admin & Demo Customer
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("AdminPassword@2026", salt);
  const customerPasswordHash = await bcrypt.hash("CustomerPassword@2026", salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@xz-store.com" },
    update: {
      name: "مدير النظام العام",
      role: "ADMIN",
    },
    create: {
      name: "مدير النظام العام",
      email: "admin@xz-store.com",
      phone: "+963933001122",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      walletBalance: 250000.0,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "عمر السوري",
      role: "CUSTOMER",
    },
    create: {
      name: "عمر السوري",
      email: "customer@example.com",
      phone: "+963987654321",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      walletBalance: 150000.0,
    },
  });

  console.log(`✅ Admin and Customer ready: ${admin.email}, ${customer.email}`);

  // 2. Store Settings with Official Name "Shad-Store" and Logo
  const settings = [
    { id: "store_name", value: "Shad-Store | متجر شاد ستور", description: "اسم المتجر الرسمي" },
    { id: "store_logo", value: "", description: "شعار المتجر (رابط أو مسار صورة)" },
    { id: "announcement", value: "⚡ مرحباً بكم في متجر شاد ستور (Shad-Store)! شحن فوري للألعاب والاشتراكات عبر سيريتل كاش وشام كاش على مدار الساعة.", description: "شريط الإعلانات العلوي" },
    { id: "currency", value: "ل.س", description: "العملة الافتراضية للمتجر" },
    { id: "contact_whatsapp", value: "+963988776655", description: "رقم واتساب الدعم الفني" },
    { id: "contact_telegram", value: "https://t.me/ShadStoreSupport", description: "حساب تيليجرام للدعم" },
    { id: "hero_title", value: "بوابتك الأولى لشحن الألعاب والاشتراكات الرقمية", description: "عنوان الهيرو" },
    { id: "hero_subtitle", value: "تسليم فوري، أسعار منافسة، ودفع آمن عبر وسائل الدفع المحلية السورية والعالمية.", description: "وصف الهيرو" },
    { id: "maintenance_mode", value: "false", description: "وضع الصيانة (true/false)" },
  ];

  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { id: s.id },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 3. Payment Methods
  const paymentMethods = [
    {
      code: "SYRIATEL_CASH",
      name: "سيريتل كاش (Syriatel Cash)",
      accountNumber: "0987112233",
      accountHolderName: "متجر شاد ستور الرقمي",
      instructions: "يرجى التحويل من تطبيق سيريتل كاش أو الرمز #150*1* إلى الرقم أعلاه، ثم نسخ رقم إشعار العملية وإرفاق لقطة شاشة للإشعار.",
      minDeposit: 5000.0,
      icon: "smartphone",
      autoVerification: true,
    },
    {
      code: "MTN_CASH",
      name: "إم تي إن كاش (MTN Cash)",
      accountNumber: "0944556677",
      accountHolderName: "متجر شاد ستور الرقمي",
      instructions: "التحويل عبر الرمز *070# إلى الرقم أعلاه وإدخال رقم الإشعار المستلم بالرسالة النصية.",
      minDeposit: 5000.0,
      icon: "phone",
      autoVerification: false,
    },
    {
      code: "SHAM_CASH",
      name: "شام كاش (Sham Cash)",
      accountNumber: "SHAM-887722",
      accountHolderName: "حساب شام كاش المعتمد",
      instructions: "التحويل الداخلي في شام كاش إلى المعرف المذكور، وكتابة رقم الحوالة في الحقل أدناه.",
      minDeposit: 10000.0,
      icon: "wallet",
      autoVerification: true,
    },
    {
      code: "CRYPTO_USDT",
      name: "العملات الرقمية (USDT - TRC20)",
      accountNumber: "TXyZ987AbcTrxTronAddressExample2026",
      accountHolderName: "Shad Store Treasury",
      instructions: "الإرسال عبر شبكة TRON (TRC-20) حصراً. أدخل هاش المعاملة (TxID) وسيتم التحقق وإضافة الرصيد.",
      minDeposit: 50000.0,
      icon: "bitcoin",
      autoVerification: false,
    },
    {
      code: "AL_HARAM",
      name: "حوالات الهرم / الفؤاد",
      accountNumber: "دمشق - فرع المزة - هاتف: 0933112233",
      accountHolderName: "محمد سامر الأحمد",
      instructions: "إرسال الحوالة بالليرة السورية ورفع صورة إشعار الإرسال الصادر من شركة الهرم مع رقم الحوالة.",
      minDeposit: 25000.0,
      icon: "building-2",
      autoVerification: false,
    },
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: pm,
      create: pm,
    });
  }

  // 4. API Providers
  const apiProviders = [
    {
      name: "القصر في آي بي (Alkasr VIP)",
      code: "alkasr",
      template: "client_api_v1",
      baseUrl: "https://api.alkasr-vip.com",
      apiToken: "DEMO_ALKASR_TOKEN",
      isActive: true,
      balance: 1450.5,
      currency: "USD",
    },
    {
      name: "مرسال كارد (Mersal Card)",
      code: "mersal",
      template: "client_api_v1",
      baseUrl: "https://api.mersal-card.com",
      apiToken: "DEMO_MERSAL_TOKEN",
      isActive: true,
      balance: 878.2,
      currency: "USD",
    },
    {
      name: "الحلاق ستور (Alhallak Store)",
      code: "alhallak",
      template: "client_api_v1",
      baseUrl: "https://api.alhallak-store.com",
      apiToken: "DEMO_ALHALLAK_TOKEN",
      isActive: true,
      balance: 320.0,
      currency: "USD",
    },
    {
      name: "طرطوسي ستور (Tartousi Store)",
      code: "tartousi",
      template: "client_api_v1",
      baseUrl: "https://api.tartousi-store1.com",
      apiToken: "DEMO_TARTOUSI_TOKEN",
      isActive: true,
      balance: 512.4,
      currency: "USD",
    },
    {
      name: "الزعيم سيريانا (Alzaeem Store)",
      code: "alzaeem",
      template: "client_api_v1",
      baseUrl: "https://api.alzaeemstore.com",
      apiToken: "DEMO_ALZAEEM_TOKEN",
      isActive: true,
      balance: 110.0,
      currency: "USD",
    },
    {
      name: "يزن كارد (Yazancard)",
      code: "yazancard",
      template: "client_api_v1",
      baseUrl: "https://api.yazancard.com",
      apiToken: "DEMO_YAZAN_TOKEN",
      isActive: true,
      balance: 95.0,
      currency: "USD",
    },
    {
      name: "سام للمدفوعات (Sam API)",
      code: "sam_api",
      template: "sam_api",
      baseUrl: "https://www.sam-api.pro/api",
      apiToken: "sk_demo_sam_api_token_2026",
      isActive: true,
      balance: 0.0,
      currency: "SYP",
    },
  ];

  for (const prov of apiProviders) {
    await prisma.apiProvider.upsert({
      where: { code: prov.code },
      update: prov,
      create: prov,
    });
  }

  // 5. VIP Tiers
  const vipTiers = [
    { name: "برونزي (عضو جديد)", minSpent: 0, discountRate: 0, badgeColor: "blue", sortOrder: 1 },
    { name: "فضي (Silver)", minSpent: 200000, discountRate: 2, badgeColor: "cyan", sortOrder: 2 },
    { name: "ذهبي (Gold VIP)", minSpent: 500000, discountRate: 5, badgeColor: "gold", sortOrder: 3 },
    { name: "ماسي (Diamond VIP)", minSpent: 1000000, discountRate: 8, badgeColor: "purple", sortOrder: 4 },
  ];

  for (const tier of vipTiers) {
    const existing = await prisma.vipTier.findFirst({ where: { name: tier.name } });
    if (!existing) {
      await prisma.vipTier.create({ data: tier });
    }
  }

  // 6. Order Message Templates
  const templates = [
    { event: "ORDER_CREATED", title: "تم إنشاء طلبك بنجاح", content: "عزيزي {user_name}، تم استلام طلبك رقم {order_number} بنجاح وجارٍ مراجعته." },
    { event: "ORDER_ACCEPTED", title: "تم إكمال وتسليم طلبك", content: "عزيزي {user_name}، تم إنجاز طلبك {order_number} بنجاح. كود/بيانات التسليم: {delivery_notes}" },
    { event: "ORDER_REJECTED", title: "تعذر تنفيذ الطلب واسترداد الرصيد", content: "نعتذر منك {user_name}، تم إلغاء الطلب {order_number} لسبب: {note}. وتمت إعادة كامل المبلغ لمحفظتك." },
    { event: "DEPOSIT_CREATED", title: "طلب شحن رصيد جديد", content: "تم تسجيل طلب شحن بمبلغ {amount} ل.س برقم إشعار {reference_number} وهو قيد المراجعة." },
    { event: "DEPOSIT_APPROVED", title: "تم اعتماد شحن رصيدك", content: "تهانينا! تمت إضافة مبلغ {amount} ل.س إلى محفظتك بنجاح بعد التحقق من الحوالة." },
    { event: "DEPOSIT_REJECTED", title: "تم رفض طلب شحن الرصيد", content: "نعتذر، لم نتمكن من اعتماد طلب الشحن {deposit_number}. السبب: {reason}" },
  ];

  for (const t of templates) {
    await prisma.orderMessageTemplate.upsert({
      where: { event: t.event },
      update: t,
      create: t,
    });
  }

  // 7. Categories
  const categories = [
    { name: "شحن ألعاب", slug: "games", description: "شحن فوري لأشهر الألعاب العالمية بأسعار مخفضة", icon: "gamepad-2", sortOrder: 1 },
    { name: "اشتراكات وتطبيقات", slug: "subscriptions", description: "اشتراكات تيليجرام بريميوم، نتفليكس، سبوتيفاي وغيرها", icon: "sparkles", sortOrder: 2 },
    { name: "بطاقات رقمية", slug: "gift-cards", description: "بطاقات جوجل بلاي، آيتونز، وبطاقات الهدايا العالمية", icon: "credit-card", sortOrder: 3 },
    { name: "خدمات تواصل اجتماعي", slug: "social-media", description: "زيادة متابعين وتفاعل حسابات إنستغرام، تيك توك، وتيليجرام", icon: "share-2", sortOrder: 4 },
    { name: "ذكاء اصطناعي وتصميم", slug: "ai-tools", description: "حسابات ChatGPT Plus، كانفا برو، وأدوات المطورين", icon: "bot", sortOrder: 5 },
  ];

  const catMap = {};
  for (const c of categories) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    catMap[c.slug] = created.id;
  }

  // 8. Banners
  const banners = [
    {
      title: "شحن شدات ببجي العالمية فوري برقم الآيدي",
      subtitle: "أسرع تسليم بأسعار خاصة للدفع عبر سيريتل وشام كاش",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
      targetUrl: "/products/pubg-mobile-uc",
      isFeatured: true,
      sortOrder: 1,
    },
    {
      title: "تفعيل رسمي لاشتراك تيليجرام بريميوم",
      subtitle: "تفعيل مباشر بدون الحاجة لكلمة المرور كهدية رسمية",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      targetUrl: "/products/telegram-premium",
      isFeatured: true,
      sortOrder: 2,
    },
  ];

  for (const b of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!existing) {
      await prisma.banner.create({ data: b });
    }
  }

  // 9. Link Product to Provider (PUBG Mobile -> Alkasr Provider ID)
  const alkasrProv = await prisma.apiProvider.findUnique({ where: { code: "alkasr" } });
  if (alkasrProv) {
    await prisma.product.updateMany({
      where: { slug: "pubg-mobile-uc" },
      data: {
        providerId: alkasrProv.id,
        providerProductId: "365",
        providerType: "API",
      },
    });
  }

  console.log("🎉 Shad-Store Seed completed successfully with all providers and settings!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
