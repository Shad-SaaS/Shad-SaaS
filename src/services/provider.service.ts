export interface ProviderOrderPayload {
  orderId: string;
  orderNumber: string;
  serviceId: string;
  customerInputs: Record<string, string>;
  quantity?: number;
}

export interface ProviderResult {
  success: boolean;
  externalOrderId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ServiceProviderAdapter {
  providerName: string;
  executeOrder(payload: ProviderOrderPayload): Promise<ProviderResult>;
  checkOrderStatus(externalOrderId: string): Promise<{ status: string; message?: string }>;
}

/**
 * Manual Fulfillment Adapter:
 * For digital orders that require staff to manually top-up or provide credentials.
 */
export class ManualFulfillmentAdapter implements ServiceProviderAdapter {
  providerName = "MANUAL_FULFILLMENT";

  async executeOrder(payload: ProviderOrderPayload): Promise<ProviderResult> {
    return {
      success: true,
      message: `تم تحويل الطلب ${payload.orderNumber} إلى طابور التنفيذ اليدوي لفريق الدعم الفني.`,
      metadata: {
        assignedQueue: "MANUAL_OPERATIONS",
        timestamp: new Date().toISOString(),
      },
    };
  }

  async checkOrderStatus(_externalOrderId: string) {
    return {
      status: "PENDING_STAFF_ACTION",
      message: "الطلب بانتظار إدخال بيانات التفعيل من قبل الإدارة",
    };
  }
}

/**
 * External API Provider Adapter:
 * Pluggable adapter for external SMM or Game top-up API.
 */
export class ExternalApiProviderAdapter implements ServiceProviderAdapter {
  providerName = "EXTERNAL_REST_API";

  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || process.env.EXTERNAL_PROVIDER_API_URL || "";
    this.apiKey = apiKey || process.env.EXTERNAL_PROVIDER_API_KEY || "";
  }

  async executeOrder(payload: ProviderOrderPayload): Promise<ProviderResult> {
    if (!this.apiUrl || !this.apiKey) {
      // Gracefully fall back to manual queue if external API is not configured
      return {
        success: true,
        message: "لم يتم تفعيل مزود API خارجي بعد، تم إدراج الطلب في طابور التنفيذ اليدوي الآمن.",
        metadata: { fallback: true },
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          client_order_id: payload.orderNumber,
          service_id: payload.serviceId,
          parameters: payload.customerInputs,
          quantity: payload.quantity || 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Provider HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        externalOrderId: data.order_id || data.id,
        message: "تم إرسال الطلب بنجاح إلى مزود الخدمة الخارجي",
        metadata: data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `فشل الاتصال بالمزود الخارجي: ${err.message}`,
      };
    }
  }

  async checkOrderStatus(externalOrderId: string) {
    if (!this.apiUrl || !this.apiKey) {
      return { status: "UNKNOWN", message: "API not configured" };
    }

    try {
      const response = await fetch(`${this.apiUrl}/order/status?id=${externalOrderId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return {
        status: data.status || "UNKNOWN",
        message: data.message,
      };
    } catch (err: any) {
      return { status: "ERROR", message: err.message };
    }
  }
}

export function getProviderAdapter(type: string): ServiceProviderAdapter {
  switch (type) {
    case "API":
      return new ExternalApiProviderAdapter();
    case "MANUAL":
    default:
      return new ManualFulfillmentAdapter();
  }
}
