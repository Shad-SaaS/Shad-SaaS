import { SupplierDriver } from "./types";
import { PaymentProvider } from "./payment-types";

class DriverRegistryImpl {
  private supplierDrivers: Map<string, SupplierDriver> = new Map();
  private paymentDrivers: Map<string, PaymentProvider> = new Map();

  /**
   * Register a supplier driver for a specific template ID
   */
  registerSupplier(driver: SupplierDriver): void {
    if (this.supplierDrivers.has(driver.template)) {
      console.warn(`[DriverRegistry] Overwriting existing supplier driver template: ${driver.template}`);
    }
    this.supplierDrivers.set(driver.template, driver);
  }

  /**
   * Get a supplier driver by template ID
   */
  getSupplier(template: string): SupplierDriver | undefined {
    return this.supplierDrivers.get(template);
  }

  /**
   * Check if a supplier driver template is registered
   */
  hasSupplier(template: string): boolean {
    return this.supplierDrivers.has(template);
  }

  /**
   * List all registered supplier drivers and their configuration schemas
   */
  listSuppliers(): { template: string; configSchema: any[] }[] {
    return Array.from(this.supplierDrivers.values()).map((d) => ({
      template: d.template,
      configSchema: d.configSchema,
    }));
  }

  /**
   * Register a payment provider driver for a specific template ID
   */
  registerPayment(driver: PaymentProvider): void {
    if (this.paymentDrivers.has(driver.template)) {
      console.warn(`[DriverRegistry] Overwriting existing payment driver template: ${driver.template}`);
    }
    this.paymentDrivers.set(driver.template, driver);
  }

  /**
   * Get a payment provider driver by template ID
   */
  getPayment(template: string): PaymentProvider | undefined {
    return this.paymentDrivers.get(template);
  }

  /**
   * Check if a payment provider driver template is registered
   */
  hasPayment(template: string): boolean {
    return this.paymentDrivers.has(template);
  }

  /**
   * List all registered payment provider templates
   */
  listPayments(): { template: string; configSchema: any[] }[] {
    return Array.from(this.paymentDrivers.values()).map((d) => ({
      template: d.template,
      configSchema: d.configSchema,
    }));
  }
}

// Global Singleton Instance
export const DriverRegistry = new DriverRegistryImpl();

// Automatically register default supplier drivers
import { ClientApiV1Driver } from "./drivers/client-api-v1.driver";
import { ModcAgentDriver } from "./drivers/modc-agent.driver";
import { SamApiPaymentDriver } from "./drivers/sam-api-payment.driver";

DriverRegistry.registerSupplier(new ClientApiV1Driver());
DriverRegistry.registerSupplier(new ModcAgentDriver());

// Register default payment driver (separated from suppliers!)
DriverRegistry.registerPayment(new SamApiPaymentDriver());


