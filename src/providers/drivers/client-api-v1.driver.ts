import {
  SupplierDriver,
  DriverContext,
  NormalizedBalance,
  NormalizedProduct,
  NormalizedOrderRequest,
  NormalizedOrderResult,
  FieldSchema,
  NormalizedQuantityRules,
} from "../types";
import { createNormalizedError } from "../errors";

export class ClientApiV1Driver implements SupplierDriver {
  readonly template: string = "client_api_v1";

  readonly configSchema: FieldSchema[] = [
    {
      key: "api_token",
      label: "API Token",
      type: "password",
      required: true,
      description: "رمز التوكن الخاص بالمزود (api-token)",
    },
    {
      key: "param_mapping",
      label: "حقل معرّف اللاعب",
      type: "text",
      required: false,
      defaultValue: "playerId",
      description: "المفتاح المرسل لمعرف اللاعب في الطلب (الافتراضي: playerId)",
    },
    {
      key: "custom_auth_header",
      label: "اسم ترويسة المصادقة",
      type: "text",
      required: false,
      defaultValue: "api-token",
      description: "ترويسة المصادقة (الافتراضي: api-token)",
    },
  ];

  private getAuthHeader(ctx: DriverContext): Record<string, string> {
    const headerName = ctx.config?.auth_header || ctx.config?.custom_auth_header || "api-token";
    const token = ctx.credentials?.api_token || ctx.credentials?.token || "";
    return {
      [headerName]: token,
      Accept: "application/json",
      "User-Agent": "Shad-Store-ProviderClient/2.0",
    };
  }

  private normalizeQuantityRules(qtyValues: any): NormalizedQuantityRules {
    if (!qtyValues) {
      return { type: "fixed", value: 1 };
    }

    if (Array.isArray(qtyValues)) {
      return {
        type: "list",
        values: qtyValues.map((v) => (typeof v === "string" ? Number(v) || v : v)),
      };
    }

    if (typeof qtyValues === "object" && (qtyValues.min !== undefined || qtyValues.max !== undefined)) {
      return {
        type: "range",
        min: Number(qtyValues.min ?? 1),
        max: Number(qtyValues.max ?? 1000000),
      };
    }

    return { type: "fixed", value: 1 };
  }

  private extractCodes(replayApi: any): string[] {
    if (!replayApi) return [];
    const codes: string[] = [];

    if (Array.isArray(replayApi)) {
      for (const item of replayApi) {
        if (typeof item === "string") {
          codes.push(item);
        } else if (item && typeof item === "object") {
          if (Array.isArray(item.replay)) {
            for (const r of item.replay) {
              if (r) codes.push(String(r));
            }
          } else if (item.replay) {
            codes.push(String(item.replay));
          } else if (item.code) {
            codes.push(String(item.code));
          }
        }
      }
    }
    return codes;
  }

  private mapErrorCode(code: number | string, originalMsg?: string) {
    const num = Number(code);
    switch (num) {
      case 120:
      case 121:
      case 122:
        return createNormalizedError("AUTH_FAILED", { providerCode: num, message: originalMsg });
      case 123:
        return createNormalizedError("IP_NOT_ALLOWED", { providerCode: num, message: originalMsg });
      case 130:
        return createNormalizedError("PROVIDER_MAINTENANCE", { providerCode: num, message: originalMsg });
      case 100:
        return createNormalizedError("PROVIDER_INSUFFICIENT_BALANCE", { providerCode: num, message: originalMsg });
      case 105:
        return createNormalizedError("QTY_NOT_AVAILABLE", { providerCode: num, message: originalMsg });
      case 106:
        return createNormalizedError("QTY_NOT_ALLOWED", { providerCode: num, message: originalMsg });
      case 107:
        return createNormalizedError("PLAYER_BLOCKED", { providerCode: num, message: originalMsg });
      case 108:
        return createNormalizedError("TWO_FA_REQUIRED", { providerCode: num, message: originalMsg });
      case 109:
        return createNormalizedError("PRODUCT_NOT_FOUND", { providerCode: num, message: originalMsg });
      case 110:
        return createNormalizedError("PRODUCT_UNAVAILABLE", { providerCode: num, message: originalMsg });
      case 111:
        return createNormalizedError("RETRY_LATER", { providerCode: num, message: originalMsg });
      case 112:
        return createNormalizedError("QTY_TOO_SMALL", { providerCode: num, message: originalMsg });
      case 113:
        return createNormalizedError("QTY_TOO_LARGE", { providerCode: num, message: originalMsg });
      case 114:
      case 500:
      default:
        return createNormalizedError("UNKNOWN", { providerCode: num, message: originalMsg });
    }
  }

  /**
   * 1. Get Profile / Balance
   */
  async getBalance(ctx: DriverContext): Promise<NormalizedBalance> {
    const path = ctx.config?.paths?.profile || "/client/api/profile";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeader(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
      });

      if (!res.ok) {
        throw createNormalizedError(res.status === 401 ? "AUTH_FAILED" : "UNKNOWN", {
          providerCode: res.status,
          message: `فشل استدعاء رصيد المزود: HTTP ${res.status}`,
        });
      }

      const data = await res.json();
      return {
        balance: Number(data.balance || 0),
        currency: "USD",
        email: data.email,
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
  async listProducts(ctx: DriverContext, opts?: { categoryId?: string; search?: string }): Promise<NormalizedProduct[]> {
    const path = ctx.config?.paths?.products || "/client/api/products";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeader(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 25000),
      });

      if (!res.ok) {
        throw createNormalizedError(res.status === 401 ? "AUTH_FAILED" : "UNKNOWN", {
          providerCode: res.status,
          message: `فشل جلب منتجات المزود: HTTP ${res.status}`,
        });
      }

      const items = await res.json();
      if (!Array.isArray(items)) {
        return [];
      }

      return items.map((item: any): NormalizedProduct => ({
        externalId: String(item.id),
        name: item.name,
        price: Number(item.price || item.base_price || 0),
        basePrice: item.base_price !== undefined ? Number(item.base_price) : undefined,
        available: item.available !== false,
        categoryName: item.category_name,
        productType: item.product_type || "amount",
        params: Array.isArray(item.params) ? item.params : ["playerId"],
        qty: this.normalizeQuantityRules(item.qty_values),
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
   * 3. Get Specific Products by IDs
   */
  async getProducts(ctx: DriverContext, externalIds: string[]): Promise<NormalizedProduct[]> {
    if (externalIds.length === 0) return [];
    const path = ctx.config?.paths?.products || "/client/api/products";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}?products_id=${externalIds.join(",")}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeader(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
      });

      if (!res.ok) {
        throw createNormalizedError("UNKNOWN", { message: `HTTP ${res.status}` });
      }

      const items = await res.json();
      if (!Array.isArray(items)) return [];

      return items.map((item: any): NormalizedProduct => ({
        externalId: String(item.id),
        name: item.name,
        price: Number(item.price || item.base_price || 0),
        basePrice: item.base_price !== undefined ? Number(item.base_price) : undefined,
        available: item.available !== false,
        categoryName: item.category_name,
        productType: item.product_type || "amount",
        params: Array.isArray(item.params) ? item.params : ["playerId"],
        qty: this.normalizeQuantityRules(item.qty_values),
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
   * 4. Create Order (GET method in client_api_v1!)
   */
  async createOrder(ctx: DriverContext, req: NormalizedOrderRequest): Promise<NormalizedOrderResult> {
    const basePath = ctx.config?.paths?.new_order || "/client/api/newOrder/{id}/params";
    const resolvedPath = basePath.replace("{id}", encodeURIComponent(req.externalProductId));

    const query = new URLSearchParams();
    query.set("qty", String(req.qty));
    query.set("order_uuid", req.orderUuid);

    // Map params: first field defaults to playerId unless overridden in config
    const playerKey = ctx.config?.param_mapping || "playerId";
    if (req.params) {
      for (const [k, v] of Object.entries(req.params)) {
        if (v !== undefined && v !== null && v !== "") {
          if (k === "playerId" || k === "player_id" || k === "target") {
            query.set(playerKey, String(v));
          } else {
            query.set(k, String(v));
          }
        }
      }
    }

    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${resolvedPath}?${query.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeader(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 25000),
      });

      const data = await res.json();

      // Check if response contains an error code (client_api_v1 returns JSON with code or status: ERROR)
      if (data.code || data.status === "ERROR" || data.status === "error") {
        const error = this.mapErrorCode(data.code || 500, data.msg || data.message);
        return {
          status: "rejected",
          codes: [],
          error,
          raw: data,
        };
      }

      // Successful order creation response
      const orderData = data.data || data;
      const statusRaw = String(orderData.status || "").toLowerCase();
      const status: "accepted" | "rejected" | "pending" =
        statusRaw === "accept" || statusRaw === "accepted"
          ? "accepted"
          : statusRaw === "reject" || statusRaw === "rejected"
          ? "rejected"
          : "pending";

      return {
        externalOrderId: orderData.order_id ? String(orderData.order_id) : undefined,
        status,
        price: orderData.price ? Number(orderData.price) : undefined,
        codes: this.extractCodes(orderData.replay_api),
        raw: data,
      };
    } catch (err: any) {
      // On network timeout or network drop: NEVER reject immediately!
      // Keep as pending with TIMEOUT error so the caller can poll checkOrders using order_uuid.
      return {
        status: "pending",
        codes: [],
        error: createNormalizedError("TIMEOUT", { message: err.message }),
      };
    }
  }

  /**
   * 5. Check Orders (Single or Batch, by ID or by UUID)
   */
  async checkOrders(
    ctx: DriverContext,
    refs: string[],
    opts: { byUuid: boolean }
  ): Promise<NormalizedOrderResult[]> {
    if (refs.length === 0) return [];
    const path = ctx.config?.paths?.check || "/client/api/check";

    const query = new URLSearchParams();
    query.set("orders", `[${refs.join(",")}]`);
    if (opts.byUuid) {
      query.set("uuid", "1");
    }

    const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}?${query.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeader(ctx),
        signal: AbortSignal.timeout(ctx.timeoutMs || 20000),
      });

      if (!res.ok) {
        throw createNormalizedError("UNKNOWN", { message: `HTTP ${res.status}` });
      }

      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

      return items.map((item: any): NormalizedOrderResult => {
        const rawStatus = String(item.status || "").toLowerCase();
        const status: "accepted" | "rejected" | "pending" =
          rawStatus === "accept" || rawStatus === "accepted"
            ? "accepted"
            : rawStatus === "reject" || rawStatus === "rejected"
            ? "rejected"
            : "pending";

        return {
          externalOrderId: item.order_id ? String(item.order_id) : undefined,
          status,
          price: item.price ? Number(item.price) : undefined,
          codes: this.extractCodes(item.replay_api),
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
   * 6. Test Connection
   */
  async testConnection(ctx: DriverContext): Promise<{ ok: boolean; message: string; balance?: NormalizedBalance }> {
    try {
      const balance = await this.getBalance(ctx);
      return {
        ok: true,
        message: `تم الاتصال بنجاح. الرصيد المتاح: ${balance.balance} ${balance.currency}${balance.email ? ` (${balance.email})` : ""}`,
        balance,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `فشل الاتصال بالمزود: ${err.message}`,
      };
    }
  }
}
