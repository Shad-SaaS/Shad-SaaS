# ARCHITECTURE.md — الهيكل المعماري للنظام (System Architecture)

## 1. النظرة المعمارية العامة (High-Level Architecture)
تعتمد المنصة على بنية ثلاثية الطبقات (Layered Architecture) مبنية بواسطة إطار العمل Next.js App Router مع بيئة TypeScript كاملة:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser / RTL)                 │
│  - Customer Storefront (Home, Catalog, Product, Cart, Orders) │
│  - Customer Wallet & Top-up Flow (Receipt Upload)            │
│  - Admin Dashboard (/admin - KPIs, Orders, Deposits, Users) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / Form-Data
┌──────────────────────────────▼──────────────────────────────┐
│                  Application / API Gateway                   │
│  - Next.js App Router (Server Components & Route Handlers)  │
│  - RBAC Middleware (Session, Role Authorization)             │
│  - Zod Input Validation & Sanitization                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Domain Services Layer                     │
│  - AuthService (Hashing, Session management)                │
│  - WalletService (Atomicity, Balance, Double-Spend Guard)    │
│  - OrderService (Lifecycle, Price Recalc, Refund Engine)    │
│  - CatalogService (Categories, Products, Dynamic Fields)    │
│  - DepositService (Manual Flow, Verification, Ledger)       │
│  - CouponService (Validation, Deductions, Limit Checking)    │
│  - ServiceProviderAdapter (Manual & External API fulfillment)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma Client
┌──────────────────────────────▼──────────────────────────────┐
│                    Persistence & Database                    │
│  - Prisma ORM (SQLite / PostgreSQL with transactions)       │
│  - Atomic ACID Guarantees on Wallet Ledger & Orders         │
│  - Upload Storage (Secure Local/S3 File Uploads)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. تفصيل الطبقات المعمارية (Architectural Layers)

### 2.1 طبقة الواجهات (Presentation & Storefront)
- **Next.js App Router (`src/app`)**:
  - `(storefront)`: المسارات العامة للعملاء (`/`, `/categories`, `/products/[slug]`, `/orders`, `/wallet`, `/support`, `/login`, `/register`).
  - `(admin)`: لوحة الإدارة المحمية (`/admin`, `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/deposits`, `/admin/customers`, `/admin/coupons`, `/admin/settings`, `/admin/tickets`).
  - `api`: واجهات برمجية لرفع الملفات، معالجة الطلبات، وعمليات الإدارة.
- **مكونات التصميم (UI Component Library)**:
  - دعم RTL أصيل، ألوان مستوحاة من `x-z.store`، وتأثيرات زجاجية (Glassmorphism).
  - مكونات إعادة الاستخدام: `Header`, `Sidebar`, `ServiceCard`, `DepositModal`, `OrderStatusBadge`, `DynamicOrderForm`.

### 2.2 طبقة الخدمات الأساسية (Domain Service Layer)
تم عزل منطق الأعمال بالكامل في مجلد `src/services/` لضمان عدم ارتباط المنطق الحساس بالواجهة:
- **`wallet.service.ts`**:
  - `creditWallet(userId, amount, referenceType, referenceId, description)`: زيادة الرصيد ذرياً مع قيد في `WalletTransaction`.
  - `debitWallet(userId, amount, referenceType, referenceId, description)`: حسم الرصيد ذرياً مع فحص الرصيد الكافي داخل قفل المعاملة (Database Transaction).
  - `getWalletBalance(userId)`: استرجاع الرصيد المؤكد.
- **`order.service.ts`**:
  - `createOrder(...)`: إعادة احتساب السعر في السيرفر، تطبيق الكوبون، حسم الرصيد، إنشاء الطلب، وتسجيل تاريخ الحالة.
  - `transitionStatus(orderId, nextStatus, note, refundAmount?)`: التحقق من صحة الانتقال وحساب المبالغ المستردة عند الإلغاء أو الإنجاز الجزئي.
- **`provider.service.ts`**:
  - واجهة مجردة `ServiceProviderAdapter` تدعم:
    1. `ManualFulfillmentAdapter`: تكليف المشرفين بالبيانات المطلوبة وإدخال كود التفعيل/التسليم.
    2. `ExternalSmmOrGameAdapter`: محاكاة واجهة API لمزود خدمات رقمية مع دعم Idempotency وإعادة المحاولة.

---

## 3. تدفق البيانات والعمليات المالية (Financial Data Flow)

### 3.1 تدفق شحن المحفظة (Manual Top-up Flow)
1. العميل يفتح صفحة المحفظة -> يختار وسيلة الدفع (مثل سيريتل كاش).
2. النظام يعرض رقم الحساب المعتمد والتعليمات.
3. العميل يدخل المبلغ ورقم المعاملة ويرفع إشعار التحويل.
4. الخادم يحفظ الإشعار بآلية آمنة وينشئ سجلاً في `DepositRequest` بحالة `PENDING`.
5. المشرف في `/admin/deposits` يراجع العملية -> يضغط "موافقة":
   - يتم تشغيل `prisma.$transaction`:
     1. التحقق من أن حالة الطلب ما زالت `PENDING`.
     2. تحديث حالة الطلب إلى `APPROVED`.
     3. إضافة المبلغ لرصيد محفظة العميل `User.walletBalance`.
     4. إنشاء قيد مالي في `WalletTransaction` بنوع `DEPOSIT`.
     5. تسجيل العملية في `AuditLog`.

### 3.2 تدفق إنشاء الطلب (Order Creation Flow)
1. العميل يحدد الخدمة والباقة والبيانات المطلوبة (مثل معرف الحساب).
2. يتم إرسال الطلب إلى السيرفر -> السيرفر يجلب السعر الرسمي للباقة من قاعدة البيانات.
3. إذا وجد كوبون: يتحقق من شروطه ويخصم القيمة المعتمدة.
4. داخل `prisma.$transaction`:
   - التحقق من رصيد محفظة العميل >= المبلغ الإجمالي.
   - حسم المبلغ من المحفظة.
   - إنشاء قيد `WalletTransaction` بنوع `ORDER_PAYMENT`.
   - إنشاء سجل `Order` بحالة `PENDING`.
   - إضافة سجل في `OrderStatusHistory`.
5. إذا كانت الخدمة ترتبط بمزود فوري، يتم إشعار مزود الخدمة، وإلا تنتظر التنفيذ الإداري.
