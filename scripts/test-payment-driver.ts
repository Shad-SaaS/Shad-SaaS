import http from "http";
import { prisma } from "../src/lib/db";
import { encrypt } from "../src/lib/encryption";
import { DriverRegistry } from "../src/providers/registry";
import { SamApiPaymentDriver } from "../src/providers/drivers/sam-api-payment.driver";
import { PaymentDriverContext } from "../src/providers/payment-types";
import { PaymentVerificationService } from "../src/services/payment-verification.service";
import { WalletService } from "../src/services/wallet.service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || ""}`);
    failedCount++;
  }
}

async function runPaymentDriverTests() {
  console.log("=======================================================");
  console.log("🧪 STARTING MOCK CONTRACT TESTS FOR PAYMENT DRIVER (PHASE 5)");
  console.log("=======================================================");

  const mockPort = 5991;
  const server = http.createServer((req, res) => {
    const url = req.url || "";

    // 1. Wallets
    if (url === "/api/v1/wallets") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify([
          {
            id: "f9a0738f-eb67-492a-b4ba-e3f08238fac7",
            provider: "shamcash",
            providerDisplayName: "ShamCash",
            label: "محمد أحمد علي",
            phone: "0991234567",
            walletAddress: "e5289b724c3a3a47581b575bfdf6cd53",
            accountNumber: "SC-00012345",
            region: "دمشق",
            status: "active",
          },
          {
            id: "a3c12f88-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
            provider: "syriatel",
            providerDisplayName: "Syriatel Cash",
            label: "محمد",
            phone: "0931234567",
            cashCode: "12345678",
            status: "active",
          },
        ])
      );
      return;
    }

    // 2. Balance ShamCash
    if (url.includes("/api/v1/wallets/shamcash/") && url.includes("/balance")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify([
          { currency: "USD", amount: 4.1 },
          { currency: "SYP", amount: 1606.5 },
          { currency: "EUR", amount: 0 },
        ])
      );
      return;
    }

    // 3. Balance Syriatel
    if (url.includes("/api/v1/wallets/syriatel/") && url.includes("/balance")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ currency: "SYP", amount: 25000 }]));
      return;
    }

    // 4. Invoices
    if (url === "/api/v1/invoices" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          invoiceId: "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
          paymentUrl: "https://sam-api.pro/pay/3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
          expiresAt: "2026-05-01T14:15:00.000Z",
        })
      );
      return;
    }

    // 5. Public invoice details (/pay/{id} without /api!)
    if (url.startsWith("/pay/") && !url.includes("/verify")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
          method: "syriatel",
          identifier: "0991234567",
          amount: "5000",
          currency: "SYP",
          status: "pending",
          expiresAt: "2026-05-01T14:15:00.000Z",
        })
      );
      return;
    }

    // 6. Public verify (/pay/{id}/verify without /api!)
    if (url.startsWith("/pay/") && url.includes("/verify")) {
      let bodyStr = "";
      req.on("data", (c) => (bodyStr += c));
      req.on("end", () => {
        try {
          const body = JSON.parse(bodyStr);
          if (body.transactionRef === "TXN_EXPIRED") {
            res.writeHead(410, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ verified: false, message: "انتهت صلاحية الفاتورة", code: "EXPIRED" }));
            return;
          }
          if (body.transactionRef === "TXN_VALID_99") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ verified: true, message: "تم التحقق من الدفع بنجاح", paidAmount: 5000, currency: "SYP" }));
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ verified: false, message: "رقم العملية غير موجود في سجل المحفظة" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(mockPort, resolve));
  const mockBaseUrl = `http://127.0.0.1:${mockPort}`;

  try {
    // -------------------------------------------------------------
    // Test Group 1: SamApiPaymentDriver Unit & Contract Tests
    // -------------------------------------------------------------
    console.log("\n▶ [Test Group 1] SamApiPaymentDriver Contract Tests:");
    const driver = DriverRegistry.getPayment("samapi_payments");
    assert(!!driver, "Registry contains samapi_payments driver");
    assert(driver?.template === "samapi_payments", "Driver template matches samapi_payments");

    const ctx: PaymentDriverContext = {
      providerId: "prov_sam_mock",
      name: "Sam API Mock",
      baseUrl: `${mockBaseUrl}/api`,
      siteUrl: mockBaseUrl,
      apiKey: "sk_test_mock_secret_key_12345",
      config: { site_url: mockBaseUrl },
      timeoutMs: 5000,
    };

    // 1. Wallets
    const wallets = await driver!.getWallets(ctx);
    assert(wallets.length === 2, "Fetched 2 wallets (ShamCash & Syriatel)");
    assert(wallets[0].walletAddress === "e5289b724c3a3a47581b575bfdf6cd53", "ShamCash walletAddress preserved");
    assert(wallets[1].cashCode === "12345678", "Syriatel cashCode preserved");

    // 2. Balances
    const shamBalances = await driver!.getBalance(ctx, wallets[0].walletAddress!, "shamcash");
    assert(shamBalances.length === 3, "ShamCash returned 3 currencies");
    assert(shamBalances[0].currency === "USD" && shamBalances[0].amount === 4.1, "ShamCash USD balance matches");

    const syrBalances = await driver!.getBalance(ctx, wallets[1].phone!, "syriatel");
    assert(syrBalances.length === 1 && syrBalances[0].amount === 25000, "Syriatel balance matches 25,000 SYP");

    // 3. Create Invoice
    const invoice = await driver!.createInvoice(ctx, {
      method: "syriatel",
      identifier: "0991234567",
      amount: "5000",
      currency: "SYP",
      webhookUrl: "http://localhost:3000/api/webhooks/payments/sam-api",
    });
    assert(invoice.id === "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c", "Invoice created with correct ID");
    assert(Boolean(invoice.paymentUrl?.includes("pay/3f8a1c2d")), "Payment URL generated");

    // 4. Verify Invoice (Success)
    const verifySuccess = await driver!.verifyInvoice(ctx, invoice.id, "TXN_VALID_99");
    assert(verifySuccess.verified === true, "Invoice verified successfully with valid ref");
    assert(verifySuccess.paidAmount === 5000, "Paid amount matches 5000");

    // 5. Verify Invoice (Invalid ref)
    const verifyInvalid = await driver!.verifyInvoice(ctx, invoice.id, "TXN_FAKE_000");
    assert(verifyInvalid.verified === false, "Unmatched ref returned verified: false");

    // 6. Verify Invoice (Expired HTTP 410)
    const verifyExpired = await driver!.verifyInvoice(ctx, invoice.id, "TXN_EXPIRED");
    assert(Boolean(!verifyExpired.verified && verifyExpired.code === "EXPIRED"), "Expired invoice caught properly");

    // -------------------------------------------------------------
    // Test Group 2: PaymentVerificationService & Anti-Fraud
    // -------------------------------------------------------------
    console.log("\n▶ [Test Group 2] PaymentVerificationService & Double-Spending Protection:");

    // Setup DB test user and deposit
    const testUser = await prisma.user.create({
      data: {
        name: "Test Payment User",
        email: `pay_test_${Date.now()}@example.com`,
        passwordHash: "hash123",
        walletBalance: 0,
      },
    });

    const testPaymentMethod = await prisma.paymentMethod.create({
      data: {
        name: "سيريتل كاش سام",
        code: `syriatel_sam_${Date.now()}`,
        accountNumber: "0991234567",
        accountHolderName: "حساب اختبار",
        instructions: "حول الرصيد وضع رقم العملية",
        autoVerification: true,
      },
    });

    // Create Sam Provider record pointing to mock
    const samDbProvider = await prisma.provider.create({
      data: {
        name: "Sam API Payment Provider",
        template: "samapi_payments",
        baseUrl: `${mockBaseUrl}/api`,
        credentialsEncrypted: encrypt(JSON.stringify({ api_key: "sk_test_key" })),
        config: JSON.stringify({ site_url: mockBaseUrl }),
        isActive: true,
        priority: 0,
      },
    });

    // Create Deposit Request 1
    const deposit1 = await prisma.depositRequest.create({
      data: {
        depositNumber: `DEP-${Date.now()}-1`,
        userId: testUser.id,
        paymentMethodCode: testPaymentMethod.code,
        amount: 50000,
        referenceNumber: "TXN_VALID_99",
        receiptImageUrl: "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
        status: "PENDING",
      },
    });

    // Execute automated verification on Deposit 1
    const depResult1 = await PaymentVerificationService.verifyDepositRequest(deposit1.id, "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c");
    assert(depResult1.verified === true && depResult1.approved === true, "Deposit 1 verified and approved automatically");

    const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(updatedUser?.walletBalance === 50000, "Customer wallet credited with deposit amount (50,000)");

    const updatedDep1 = await prisma.depositRequest.findUnique({ where: { id: deposit1.id } });
    assert(updatedDep1?.status === "APPROVED", "Deposit 1 marked as APPROVED in database");

    // -------------------------------------------------------------
    // ANTI-FRAUD TEST: Attempt to reuse the SAME transaction reference!
    // -------------------------------------------------------------
    console.log("\n▶ [Test Group 3] Anti-Fraud Verification - Replay Rejection:");
    const deposit2 = await prisma.depositRequest.create({
      data: {
        depositNumber: `DEP-${Date.now()}-2`,
        userId: testUser.id,
        paymentMethodCode: testPaymentMethod.code,
        amount: 50000,
        referenceNumber: "TXN_VALID_99", // SAME REF!
        receiptImageUrl: "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c",
        status: "PENDING",
      },
    });

    const depResult2 = await PaymentVerificationService.verifyDepositRequest(deposit2.id, "3f8a1c2d-4e5b-6f7a-8b9c-0d1e2f3a4b5c");
    assert(depResult2.approved === false, "Anti-fraud guard strictly rejected duplicate transactionRef");
    assert(depResult2.message.includes("مسبقاً"), "Replay rejection message received");

    // Wallet balance must NOT have changed
    const userAfterReplay = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(userAfterReplay?.walletBalance === 50000, "Wallet balance remained protected without double-credit");

    // Cleanup
    await prisma.walletTransaction.deleteMany({ where: { userId: testUser.id } });
    await prisma.depositRequest.deleteMany({ where: { id: { in: [deposit1.id, deposit2.id] } } });
    await prisma.provider.deleteMany({ where: { id: samDbProvider.id } });
    await prisma.paymentMethod.deleteMany({ where: { id: testPaymentMethod.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  } finally {
    server.close();
  }

  console.log("\n=======================================================");
  console.log(`🏁 PAYMENT DRIVER TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPaymentDriverTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
