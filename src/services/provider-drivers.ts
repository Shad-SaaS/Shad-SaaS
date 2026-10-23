import crypto from "crypto";

export interface RemoteProductItem {
  id: number | string;
  name: string;
  price: number;
  params: string[];
  category_name?: string;
  available?: boolean;
  qty_values?: { min?: number | string; max?: number | string } | string[] | null;
  product_type?: string;
  base_price?: number;
  category_img?: string;
}

export interface ProviderOrderResult {
  success: boolean;
  orderId?: string;
  status: "accept" | "wait" | "reject" | "error";
  price?: number;
  replayApi?: any[];
  raw?: any;
  error?: string;
}

/**
 * Driver for the client_api_v1 family:
 * Supports: Alkasr, Mersal Card, Alhallak, Tartousi, Alzaeem, Yazancard
 */
export class ClientApiV1Driver {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiToken = apiToken.trim();
  }

  private getHeaders() {
    return {
      "api-token": this.apiToken,
      Accept: "application/json",
      "User-Agent": "Shad-Store-ProviderClient/1.0",
    };
  }

  /**
   * 1. Get Profile and Provider Wallet Balance
   */
  async getProfile(): Promise<{ balance: number; email: string }> {
    const res = await fetch(`${this.baseUrl}/client/api/profile`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`فشل الاتصال بالمزود (${res.status} ${res.statusText})`);
    }

    const data = await res.json();
    return {
      balance: parseFloat(data.balance || "0"),
      email: data.email || "",
    };
  }

  /**
   * 2. Get All Products from Provider
   */
  async getProducts(): Promise<RemoteProductItem[]> {
    const res = await fetch(`${this.baseUrl}/client/api/products`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`فشل جلب المنتجات من المزود: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * 3. Create New Order with Idempotency UUID
   */
  async createOrder(params: {
    productId: string | number;
    qty?: number;
    playerId?: string;
    extraParams?: Record<string, string>;
    orderUuid?: string;
  }): Promise<ProviderOrderResult> {
    const { productId, qty = 1, playerId, extraParams = {}, orderUuid } = params;

    const uuid = orderUuid || crypto.randomUUID();

    const query = new URLSearchParams({
      qty: String(qty),
      order_uuid: uuid,
    });

    if (playerId) {
      query.set("playerId", playerId);
    }

    for (const [k, v] of Object.entries(extraParams)) {
      if (k !== "qty" && k !== "order_uuid" && k !== "playerId") {
        query.set(k, String(v));
      }
    }

    const url = `${this.baseUrl}/client/api/newOrder/${productId}/params?${query.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const json = await res.json();

      if (json.status === "OK" && json.data) {
        return {
          success: true,
          orderId: json.data.order_id,
          status: json.data.status, // "accept" | "wait" | "reject"
          price: json.data.price,
          replayApi: json.data.replay_api,
          raw: json,
        };
      } else {
        return {
          success: false,
          status: "reject",
          error: json.message || json.error || "رفض المزود تنفيذ الطلب",
          raw: json,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "error",
        error: `خطأ اتصال بالمزود: ${err.message}`,
      };
    }
  }

  /**
   * 4. Check Orders Status
   */
  async checkOrders(orderIds: string[]): Promise<any[]> {
    if (!orderIds || orderIds.length === 0) return [];

    const param = `[${orderIds.join(",")}]`;
    const res = await fetch(`${this.baseUrl}/client/api/check?orders=${encodeURIComponent(param)}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`فشل الاستعلام عن الطلبات: ${res.status}`);
    }

    const json = await res.json();
    return json.status === "OK" && Array.isArray(json.data) ? json.data : [];
  }
}

/**
 * Driver for Sam API (Payment Automation for ShamCash & Syriatel Cash)
 */
export class SamApiDriver {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl = "https://www.sam-api.pro/api") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey.trim();
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * 1. Get all connected wallets
   */
  async getWallets() {
    const res = await fetch(`${this.baseUrl}/v1/wallets`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Sam API error: ${res.status}`);
    return res.json();
  }

  /**
   * 2. Verify payment by Transaction Reference
   */
  async verifyPayment(invoiceId: string, transactionRef: string) {
    const payBase = "https://www.sam-api.pro";
    const res = await fetch(`${payBase}/pay/${invoiceId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionRef }),
    });
    return res.json();
  }
}
