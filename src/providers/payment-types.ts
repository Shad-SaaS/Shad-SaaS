/**
 * Unified Payment Provider System Types (Independent from Supplier/Products)
 * Exclusively responsible for wallet verifications, invoices, and deposit matching.
 */

import { FieldSchema } from "./types";

export interface NormalizedWallet {
  id: string;
  provider: "shamcash" | "syriatel" | string;
  providerDisplayName: string;
  label?: string;
  phone?: string;
  walletAddress?: string; // 32 hex for ShamCash
  accountNumber?: string;
  region?: string;
  cashCode?: string; // 8 digits for Syriatel Cash
  status: "active" | "inactive" | string;
}

export interface NormalizedWalletBalance {
  currency: string;
  amount: number;
  label?: string | null;
}

export interface NormalizedWalletTransaction {
  id: string;
  type: "credit" | "debit" | string;
  amount: number;
  currency: string;
  counterparty?: string | null;
  description?: string | null;
  status?: string | null;
  occurredAt: string; // ISO 8601
}

export interface CreateInvoiceRequest {
  method: "shamcash" | "syriatel" | string;
  identifier: string; // Wallet UUID, address, or phone number
  amount: string | number;
  currency: "USD" | "SYP" | "EUR" | string;
  webhookUrl: string;
}

export interface NormalizedInvoice {
  id: string;
  method: string;
  identifier: string;
  amount: string;
  currency: string;
  status: "pending" | "paid" | "expired" | string;
  paymentUrl?: string;
  expiresAt: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface VerifyInvoiceResult {
  verified: boolean;
  message: string;
  code?: string;
  transactionRef?: string;
  paidAmount?: number;
  paidCurrency?: string;
}

export interface PaymentDriverContext {
  providerId: string;
  name: string;
  baseUrl: string;
  siteUrl?: string;
  apiKey: string;
  config: Record<string, any>;
  timeoutMs: number;
}

export interface PaymentProvider {
  readonly template: string;
  readonly configSchema: FieldSchema[];

  getWallets(ctx: PaymentDriverContext): Promise<NormalizedWallet[]>;
  getBalance(ctx: PaymentDriverContext, walletRef: string, method?: string): Promise<NormalizedWalletBalance[]>;
  getTransactions(
    ctx: PaymentDriverContext,
    walletRef: string,
    direction?: "in" | "out" | "all",
    method?: string
  ): Promise<NormalizedWalletTransaction[]>;

  createInvoice(ctx: PaymentDriverContext, req: CreateInvoiceRequest): Promise<NormalizedInvoice>;
  getInvoice(ctx: PaymentDriverContext, invoiceId: string): Promise<NormalizedInvoice>;
  verifyInvoice(ctx: PaymentDriverContext, invoiceId: string, transactionRef: string): Promise<VerifyInvoiceResult>;

  verifyWebhook?(ctx: PaymentDriverContext, rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook?(ctx: PaymentDriverContext, body: any): {
    event: "invoice.paid" | "invoice.expired" | string;
    invoiceId: string;
    method: string;
    identifier: string;
    amount: string;
    currency: string;
    transactionRef?: string;
    paidAmount?: number;
    counterparty?: string;
    paidAt?: string;
    expiredAt?: string;
  };
}
