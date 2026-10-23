/**
 * Unified Provider System Types (Normalized Architecture)
 * Ensures zero vendor lock-in and strict separation between the store logic and providers.
 */

export type InternalErrorCode =
  | "AUTH_FAILED"
  | "IP_NOT_ALLOWED"
  | "PROVIDER_MAINTENANCE"
  | "PROVIDER_INSUFFICIENT_BALANCE"
  | "QTY_NOT_AVAILABLE"
  | "QTY_NOT_ALLOWED"
  | "QTY_TOO_SMALL"
  | "QTY_TOO_LARGE"
  | "PLAYER_BLOCKED"
  | "TWO_FA_REQUIRED"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_UNAVAILABLE"
  | "RETRY_LATER"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export interface NormalizedError {
  internalCode: InternalErrorCode;
  providerCode?: string | number;
  message: string;
  retryable: boolean;
  safeToFailover: boolean;
  shouldRefund: boolean | "unknown";
}

export type NormalizedOrderStatus = "accepted" | "rejected" | "pending";

export type NormalizedQuantityRules =
  | { type: "fixed"; value: number }
  | { type: "list"; values: (number | string)[] }
  | { type: "range"; min: number; max: number };

export interface NormalizedProduct {
  externalId: string;
  name: string;
  price: number; // Wholesale cost price from provider
  basePrice?: number;
  available: boolean;
  categoryName?: string;
  productType?: "amount" | "package" | string;
  params: string[]; // Fields required from customer (e.g. ['playerId'])
  qty: NormalizedQuantityRules;
  raw?: any;
}

export interface NormalizedBalance {
  balance: number;
  currency: string;
  creditLimit?: number;
  usedCredit?: number;
  availableCredit?: number;
  email?: string;
  raw?: any;
}

export interface NormalizedOrderRequest {
  externalProductId: string;
  qty: number;
  params: Record<string, any>;
  orderUuid: string; // Idempotency UUIDv4
}

export interface NormalizedOrderResult {
  externalOrderId?: string;
  status: NormalizedOrderStatus;
  price?: number;
  codes: string[]; // Delivered digital codes/keys if any
  error?: NormalizedError;
  raw?: any;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "boolean" | "select";
  required: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  description?: string;
}

export interface DriverContext {
  providerId: string;
  name: string;
  baseUrl: string;
  credentials: Record<string, string>; // Decrypted credentials (e.g. api_token, api_key)
  config: Record<string, any>; // Provider-specific config overrides (paths, headers, mapping)
  timeoutMs: number;
  rateLimitPerMin?: number;
}

/**
 * SupplierDriver Interface
 * Every supplier adapter template implements this interface.
 */
export interface SupplierDriver {
  readonly template: string;
  readonly configSchema: FieldSchema[];

  getBalance(ctx: DriverContext): Promise<NormalizedBalance>;
  listProducts(ctx: DriverContext, opts?: { categoryId?: string; search?: string }): Promise<NormalizedProduct[]>;
  getProducts(ctx: DriverContext, externalIds: string[]): Promise<NormalizedProduct[]>;
  createOrder(ctx: DriverContext, req: NormalizedOrderRequest): Promise<NormalizedOrderResult>;
  checkOrders(ctx: DriverContext, refs: string[], opts: { byUuid: boolean }): Promise<NormalizedOrderResult[]>;

  verifyWebhook?(ctx: DriverContext, rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook?(ctx: DriverContext, body: any): NormalizedOrderResult;
  testConnection(ctx: DriverContext): Promise<{ ok: boolean; message: string; balance?: NormalizedBalance }>;
}
