/**
 * TEMPLATE_DRIVER — Boilerplate & Reference Implementation for New Supplier Drivers
 *
 * To add a new driver:
 * 1. Duplicate this file as `my_driver.ts`
 * 2. Set `template = "my_custom_template"`
 * 3. Define the `configSchema` for any custom fields required in the admin panel
 * 4. Implement each method, translating provider responses to Normalized types
 * 5. Register in `DriverRegistry.registerSupplier(new MyDriver())` in `src/providers/index.ts`
 */

import {
  SupplierDriver,
  DriverContext,
  NormalizedBalance,
  NormalizedProduct,
  NormalizedOrderRequest,
  NormalizedOrderResult,
  FieldSchema,
} from "./types";
import { createNormalizedError } from "./errors";

export class TemplateDriver implements SupplierDriver {
  readonly template: string = "example_template_v1";

  /**
   * FieldSchema defines what inputs will automatically render in the Admin Panel
   */
  readonly configSchema: FieldSchema[] = [
    {
      key: "api_key",
      label: "API Key / Token",
      type: "password",
      required: true,
      description: "المفتاح السري المقدم من المزود الخارجي",
    },
    {
      key: "param_mapping",
      label: "Player ID Key",
      type: "text",
      required: false,
      defaultValue: "playerId",
      description: "اسم المعامل في طلب الشراء (مثال: playerId أو player_id)",
    },
  ];

  /**
   * 1. Get Wallet Balance from Provider
   */
  async getBalance(ctx: DriverContext): Promise<NormalizedBalance> {
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/balance`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ctx.credentials.api_key}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(ctx.timeoutMs || 10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      return {
        balance: Number(data.balance || 0),
        currency: data.currency || "USD",
        raw: data,
      };
    } catch (err: any) {
      throw createNormalizedError(err.name === "TimeoutError" ? "TIMEOUT" : "UNKNOWN", {
        message: err.message,
      });
    }
  }

  /**
   * 2. List all available products from Provider
   */
  async listProducts(ctx: DriverContext): Promise<NormalizedProduct[]> {
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/products`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ctx.credentials.api_key}`,
      },
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    const items = await res.json();
    return items.map((item: any): NormalizedProduct => ({
      externalId: String(item.id),
      name: item.name,
      price: Number(item.price || 0),
      available: item.available ?? true,
      categoryName: item.category,
      productType: item.type || "amount",
      params: item.params || ["playerId"],
      qty: { type: "fixed", value: 1 },
      raw: item,
    }));
  }

  /**
   * 3. Fetch specific products by their external IDs
   */
  async getProducts(ctx: DriverContext, externalIds: string[]): Promise<NormalizedProduct[]> {
    const all = await this.listProducts(ctx);
    return all.filter((p) => externalIds.includes(p.externalId));
  }

  /**
   * 4. Create Order with Idempotency UUID
   */
  async createOrder(ctx: DriverContext, req: NormalizedOrderRequest): Promise<NormalizedOrderResult> {
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/orders`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.credentials.api_key}`,
        },
        body: JSON.stringify({
          product_id: req.externalProductId,
          quantity: req.qty,
          params: req.params,
          order_uuid: req.orderUuid, // Always send orderUuid!
        }),
        signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          status: "rejected",
          codes: [],
          error: createNormalizedError("VALIDATION_ERROR", { message: data.message }),
          raw: data,
        };
      }

      return {
        externalOrderId: data.order_id,
        status: data.status === "completed" ? "accepted" : "pending",
        price: data.price,
        codes: data.codes || [],
        raw: data,
      };
    } catch (err: any) {
      return {
        status: "pending", // Timeout or network failure: never reject immediately!
        codes: [],
        error: createNormalizedError("TIMEOUT", { message: err.message }),
      };
    }
  }

  /**
   * 5. Check order status by order IDs or order_uuid
   */
  async checkOrders(
    ctx: DriverContext,
    refs: string[],
    opts: { byUuid: boolean }
  ): Promise<NormalizedOrderResult[]> {
    const paramName = opts.byUuid ? "uuids" : "ids";
    const url = `${ctx.baseUrl.replace(/\/+$/, "")}/api/check?${paramName}=${refs.join(",")}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ctx.credentials.api_key}`,
      },
      signal: AbortSignal.timeout(ctx.timeoutMs || 15000),
    });

    const data = await res.json();
    return (data.orders || []).map((o: any): NormalizedOrderResult => ({
      externalOrderId: o.id,
      status: o.status === "accept" || o.status === "completed" ? "accepted" : o.status === "reject" ? "rejected" : "pending",
      price: o.price,
      codes: o.codes || [],
      raw: o,
    }));
  }

  /**
   * 6. Test connection and verify credentials
   */
  async testConnection(ctx: DriverContext): Promise<{ ok: boolean; message: string; balance?: NormalizedBalance }> {
    try {
      const balance = await this.getBalance(ctx);
      return {
        ok: true,
        message: `تم الاتصال بنجاح. الرصيد: ${balance.balance} ${balance.currency}`,
        balance,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `فشل الاتصال: ${err.message}`,
      };
    }
  }
}
