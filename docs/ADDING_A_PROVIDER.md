# دليل إضافة مزود جديد (Adding a Provider Guide)

يوضح هذا الدليل كيفية ربط وإضافة مزودي الخدمات الرقمية إلى متجر **Shad-Store** دون تعقيد، وفقاً لمعمارية **Provider Adapters**.

---

## الحالة 1: إضافة مزود جديد يتبع قالباً موجوداً مسبقاً (بدون أي تعديل برمجي)

إذا كان المزود الجديد يتبع أحد القوالب المدعومة حالياً:
* **`client_api_v1`**: مثل (Mersal Card, Alkasr VIP, Alhallak Store, Yazancard, Tartousi Store, Alzaeem Syriana).
* **`modc_agent`**: مثل (ModC في وضع الوكيل Agent).

### الخطوات من لوحة التحكم مباشرة:
1. توجّه إلى لوحة التحكم: **مزودو API** (`/admin/providers`).
2. اضغط على زر **إضافة مزود جديد**.
3. اختر اسم القالب المطابق (مثلاً: `client_api_v1`).
4. أدخل عنوان المزود الأساسي (`Base URL`) ومفتاح الربط (`API Token` أو `API Key`).
5. (اختياري) يمكنك تخصيص مسارات الـ Endpoints أو حقل معرف اللاعب من خانة الإعدادات المتقدمة `config`.
6. اضغط على زر **اختبار الاتصال** للتحقق من جلب الرصيد بنجاح.
7. اضغط على **حفظ وتفعيل**.

---

## الحالة 2: إضافة قالب مزود جديد كلياً (Driver جديد)

إذا كان المزود يمتلك توثيقاً برمجياً جديداً لا يطابق أي قالب حالي:

### الخطوة 1: نسخ نموذج الـ Driver
انسخ ملف النموذج المرجعي [`src/providers/template-driver.ts`](file:///d:/Shad-SaaS/src/providers/template-driver.ts) إلى اسم جديد، مثلاً:
`src/providers/drivers/new-provider.driver.ts`

### الخطوة 2: تطبيق واجهة `SupplierDriver`
قم ببرمجة الدوال الأساسية الست:
```typescript
import { SupplierDriver, DriverContext, NormalizedBalance, NormalizedProduct, NormalizedOrderRequest, NormalizedOrderResult } from "../types";

export class NewProviderDriver implements SupplierDriver {
  readonly template = "new_provider_v1";
  readonly configSchema = [
    { key: "api_key", label: "مفتاح الـ API", type: "password", required: true }
  ];

  async getBalance(ctx: DriverContext): Promise<NormalizedBalance> { ... }
  async listProducts(ctx: DriverContext): Promise<NormalizedProduct[]> { ... }
  async getProducts(ctx: DriverContext, externalIds: string[]): Promise<NormalizedProduct[]> { ... }
  async createOrder(ctx: DriverContext, req: NormalizedOrderRequest): Promise<NormalizedOrderResult> { ... }
  async checkOrders(ctx: DriverContext, refs: string[], opts: { byUuid: boolean }): Promise<NormalizedOrderResult[]> { ... }
  async testConnection(ctx: DriverContext) { ... }
}
```

### الخطوة 3: تسجيل القالب في الـ Registry
في ملف التسجيل المركزي [`src/providers/registry.ts`](file:///d:/Shad-SaaS/src/providers/registry.ts) أضف سطراً واحداً فقط:
```typescript
import { NewProviderDriver } from "./drivers/new-provider.driver";

DriverRegistry.registerSupplier(new NewProviderDriver());
```

فور إتمام هذا السطر، سيظهر القالب الجديد تلقائياً في قائمة القوالب داخل لوحة التحكم، وسيتم توليد نموذج الإدخال الخاص به ديناميكياً دون لمس كود الطلبات أو المنتجات أو واجهة المتجر.
