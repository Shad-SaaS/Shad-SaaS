import crypto from "crypto";
import {
  SupplierDriver,
  DriverContext,
  NormalizedBalance,
  NormalizedProduct,
  NormalizedOrderRequest,
  NormalizedOrderResult,
  FieldSchema,
} from "../types";
import { createNormalizedError } from "../errors";

export class ModcAgentDriver implements SupplierDriver {
  readonly template: string = "modc_agent";

  readonly configSchema: FieldSchema[] = [
    {
      key: "api_key",
      label: "API Key (x-api-key)",
      type: "password",
      required: true,
      description: "مفتاح الـ API الخاص بـ ModC",
    },
    {
      key: "webhook_secret",
      label: "Webhook Secret Key",
      type: "password",
      required: false,
      description: "المفتاح السري لتوقيع HMAC-SHA256 لإشعارات الويب هوك",
    },
    {
      key: "sandbox_mode",
      label: "وضع الاختبار (Sandbox Mode)",
      type: "boolean",
      required: false,
      defaultValue: false,
      description: "تفعيل بيئة الاختبار التجريبية دون خصم رصيد حقيقي",
    },
  ];

  private getHeaders(ctx: DriverContext): Record<string, string> {
    const key = ctx.credentials?.api_key || ctx.credentials?.api_token || "";
    const isSandbox = ctx.config?.sandbox_mode === true || ctx.config?.sandbox_mode === "true";

    const headers: Record<string, string> = {
      "x-api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Shad-Store-ModcClient/1.0",
    };

    if (isSandbox) {
      headers["x-sandbox-mode"] = "true";
    }

    return headers;
  }

  private mapHttpStatus(status: number, message?: string) {
    switch (status) {
      case 400:
        return createNormalizedError("VALIDATION_ERROR", { providerCode: 400, message });
      case 401:
      case 403:
        return createNormalizedError("AUTH_FAILED", { providerCode: status, message });
      case 402:
        return createNormalizedError("PROVIDER_INSUFFICIENT_BALANCE", { providerCode: 402, message });
      case 404:
        return createNormalizedError("PRODUCT_NOT_FOUND", { providerCode: 404, message });
      case 429:
        return createNormalizedError("RATE_LIMITED", { providerCode: 429, message });
      case 500:
      default:
        return createNormalizedError("UNKNOWN", { providerCode: status, message });
    }
  }

  /**
   * 1. Get Balance
   */
  async getBalance(ctx: DriverContext): Promise<NormalizedBalance> {
    const isSandbox = ctx.config?.sandbox_mode === true || ctx.config?.sandbox_mode === "true";
    const path = isSandbox ? "/api/v1/sandbox/balance" : ctx.config?.paths?.balance || "/api/v1/agent/balance";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
      });

      if (!res.ok) {
        throw this.mapHttpStatus(res.status, `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      return {
        balance: Number(data.balance ?? (data.available_credit || 0)),
        currency: data.currency || "USD",
        creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
        usedCredit: data.used_credit ? Number(data.used_credit) : undefined,
        availableCredit: data.available_credit ? Number(data.available_credit) : undefined,
        raw: data,
      };
    } catch (err: any) {
      if (err.internalCode) throw err;
      throw createNormalizedError(err.name === "TimeoutError" ? "TIMEOUT" : "UNKNOWN", {
        message: err.message,
      });
    }
  }

  /**
   * 2. List Products
   */
  async listProducts(ctx: DriverContext): Promise<NormalizedProduct[]> {
    const path = ctx.config?.paths?.products || "/api/v1/agent/products";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 25000),
      });

      if (!res.ok) {
        throw this.mapHttpStatus(res.status, `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const products = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];

      return products.map((item: any): NormalizedProduct => ({
        externalId: String(item.id),
        name: item.name,
        price: Number(item.price || 0),
        available: item.available !== false && (item.stock === undefined || item.stock > 0),
        categoryName: item.category,
        productType: item.product_type || "package",
        params: Array.isArray(item.params_required) ? item.params_required : ["player_id"],
        qty: { type: "fixed", value: 1 },
        raw: item,
      }));
    } catch (err: any) {
      if (err.internalCode) throw err;
      throw createNormalizedError(err.name === "TimeoutError" ? "TIMEOUT" : "UNKNOWN", {
        message: err.message,
      });
    }
  }

  /**
   * 3. Get Products by IDs
   */
  async getProducts(ctx: DriverContext, externalIds: string[]): Promise<NormalizedProduct[]> {
    const all = await this.listProducts(ctx);
    return all.filter((p) => externalIds.includes(p.externalId));
  }

  /**
   * 4. Create Order (POST JSON body with order_uuid)
   */
  async createOrder(ctx: DriverContext, req: NormalizedOrderRequest): Promise<NormalizedOrderResult> {
    const isSandbox = ctx.config?.sandbox_mode === true || ctx.config?.sandbox_mode === "true";
    const path = isSandbox ? "/api/v1/sandbox/order" : ctx.config?.paths?.new_order || "/api/v1/agent/order";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;

    // Extract player_id
    const playerId =
      req.params?.player_id ||
      req.params?.playerId ||
      req.params?.target ||
      (req.params ? Object.values(req.params)[0] : undefined);

    const body: Record<string, any> = {
      product_id: req.externalProductId,
      quantity: req.qty || 1,
      order_uuid: req.orderUuid, // Strict Idempotency UUIDv4
    };

    if (playerId) {
      body.player_id = String(playerId);
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(ctx),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(ctx.timeoutMs || 25000),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          status: "rejected",
          codes: [],
          error: this.mapHttpStatus(res.status, data.message || `HTTP ${res.status}`),
          raw: data,
        };
      }

      const orderData = data.data || data;
      const rawStatus = String(orderData.status || "").toLowerCase();
      const status: "accepted" | "rejected" | "pending" =
        rawStatus === "accept" || rawStatus === "completed" || rawStatus === "accepted"
          ? "accepted"
          : rawStatus === "reject" || rawStatus === "rejected"
          ? "rejected"
          : "pending";

      const codes: string[] = [];
      if (orderData.code) codes.push(String(orderData.code));
      if (Array.isArray(orderData.replay_api)) {
        for (const item of orderData.replay_api) {
          if (typeof item === "string") codes.push(item);
          else if (item && Array.isArray(item.replay)) codes.push(...item.replay.map(String));
        }
      }

      return {
        externalOrderId: orderData.order_id ? String(orderData.order_id) : undefined,
        status,
        price: orderData.price ? Number(orderData.price) : undefined,
        codes,
        raw: data,
      };
    } catch (err: any) {
      // Timeout or network drop: NEVER reject immediately!
      return {
        status: "pending",
        codes: [],
        error: createNormalizedError("TIMEOUT", { message: err.message }),
      };
    }
  }

  /**
   * 5. Check Orders
   */
  async checkOrders(
    ctx: DriverContext,
    refs: string[],
    opts: { byUuid: boolean }
  ): Promise<NormalizedOrderResult[]> {
    if (refs.length === 0) return [];

    // If single order ID, use /api/v1/agent/order/status?order_id=...
    if (!opts.byUuid && refs.length === 1) {
      const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/v1/agent/order/status?order_id=${encodeURIComponent(refs[0])}`;
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: this.getHeaders(ctx),
          signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
        });

        if (!res.ok) {
          throw this.mapHttpStatus(res.status);
        }

        const data = await res.json();
        const rawStatus = String(data.status || "").toLowerCase();
        const status: "accepted" | "rejected" | "pending" =
          rawStatus === "completed" || rawStatus === "accept"
            ? "accepted"
            : rawStatus === "reject" || rawStatus === "failed"
            ? "rejected"
            : "pending";

        return [
          {
            externalOrderId: data.order_id ? String(data.order_id) : refs[0],
            status,
            price: data.amount ? Number(data.amount) : undefined,
            codes: data.code ? [String(data.code)] : [],
            raw: data,
          },
        ];
      } catch (err: any) {
        if (err.internalCode) throw err;
        throw createNormalizedError("UNKNOWN", { message: err.message });
      }
    }

    // Otherwise use provider check: /api/v1/provider/check?orders=[...]
    const param = opts.byUuid ? `orders=[${refs.join(",")}]&uuid=1` : `orders=[${refs.join(",")}]`;
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/v1/provider/check?${param}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 20000),
      });

      if (!res.ok) {
        throw this.mapHttpStatus(res.status);
      }

      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

      return items.map((item: any): NormalizedOrderResult => {
        const rawStatus = String(item.status || "").toLowerCase();
        const status: "accepted" | "rejected" | "pending" =
          rawStatus === "completed" || rawStatus === "accept"
            ? "accepted"
            : rawStatus === "reject" || rawStatus === "failed"
            ? "rejected"
            : "pending";

        return {
          externalOrderId: item.order_id ? String(item.order_id) : undefined,
          status,
          price: item.price ? Number(item.price) : undefined,
          codes: item.code ? [String(item.code)] : [],
          raw: item,
        };
      });
    } catch (err: any) {
      if (err.internalCode) throw err;
      throw createNormalizedError(err.name === "TimeoutError" ? "TIMEOUT" : "UNKNOWN", {
        message: err.message,
      });
    }
  }

  /**
   * 6. Webhook Verification (HMAC-SHA256 constant-time comparison)
   */
  verifyWebhook(ctx: DriverContext, rawBody: string, headers: Record<string, string>): boolean {
    const secret = ctx.credentials?.webhook_secret || ctx.config?.webhook_secret;
    if (!secret) return true; // If no secret configured, allow or warn

    const signature = headers["x-webhook-signature"] || headers["X-Webhook-Signature"];
    if (!signature) return false;

    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const sigBuf = Buffer.from(signature, "hex");
      const expBuf = Buffer.from(expected, "hex");

      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * 7. Webhook Payload Parsing
   */
  parseWebhook(ctx: DriverContext, body: any): NormalizedOrderResult {
    const rawStatus = String(body.status || "").toLowerCase();
    const status: "accepted" | "rejected" | "pending" =
      rawStatus === "completed" || rawStatus === "accept"
        ? "accepted"
        : rawStatus === "reject" || rawStatus === "failed"
        ? "rejected"
        : "pending";

    return {
      externalOrderId: body.order_id ? String(body.order_id) : undefined,
      status,
      price: body.amount ? Number(body.amount) : undefined,
      codes: body.code ? [String(body.code)] : [],
      raw: body,
    };
  }

  /**
   * 8. Test Connection
   */
  async testConnection(ctx: DriverContext): Promise<{ ok: boolean; message: string; balance?: NormalizedBalance }> {
    try {
      const balance = await this.getBalance(ctx);
      return {
        ok: true,
        message: `تم الاتصال بـ ModC بنجاح. الرصيد: ${balance.balance} ${balance.currency}${
          balance.availableCredit !== undefined ? ` (الائتمان المتاح: ${balance.availableCredit})` : ""
        }`,
        balance,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `فشل الاتصال بـ ModC: ${err.message}`,
      };
    }
  }
}
