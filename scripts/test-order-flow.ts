import http from "http";
import crypto from "crypto";
import { prisma } from "../src/lib/db";
import { encrypt } from "../src/lib/encryption";
import { ProviderOrderDispatcher } from "../src/services/provider-order.dispatcher";
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

async function runOrderFlowTests() {
  console.log("=======================================================");
  console.log("🧪 STARTING INTEGRATION TESTS FOR ORDER FLOW (PHASE 4)");
  console.log("=======================================================");

  const mockPort = 5988;
  let mockMode = "success"; // "success" | "insufficient_balance" | "blocked" | "pending"
  let receivedOrderUuid: string = "";

  const server = http.createServer((req, res) => {
    let url = req.url || "";
    if (url.includes("order_uuid=")) {
      const match = url.match(/order_uuid=([a-f0-9-]+)/);
      if (match) receivedOrderUuid = match[1];
    }

    if (url.startsWith("/client/api/newOrder")) {
      if (mockMode === "insufficient_balance") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 100, msg: "Insufficient balance" }));
        return;
      }
      if (mockMode === "blocked") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 107, msg: "Player ID blocked" }));
        return;
      }
      if (mockMode === "pending") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "OK", data: { order_id: "ID_PEND_123", status: "wait" } }));
        return;
      }

      // Success default
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "OK",
          data: {
            order_id: "ID_DISPATCH_OK_777",
            status: "accept",
            price: 1.25,
            replay_api: [{ replay: ["DELIVERED_KEY_SECRET_777"] }],
          },
        })
      );
      return;
    }

    if (url.startsWith("/client/api/check")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "OK",
          data: [
            {
              order_id: "ID_PEND_123",
              status: "accept",
              replay_api: ["KEY_FROM_SYNC_POLLING"],
            },
          ],
        })
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(mockPort, resolve));
  const mockBaseUrl = `http://127.0.0.1:${mockPort}`;

  try {
    // Setup test database entities
    const testUser = await prisma.user.create({
      data: {
        name: "Test Dispatch User",
        email: `dispatch_${Date.now()}@example.com`,
        passwordHash: "hash123",
        walletBalance: 100000,
      },
    });

    const testCategory = await prisma.category.create({
      data: {
        name: "Test Dispatch Category",
        slug: `cat-disp-${Date.now()}`,
      },
    });

    // Create Mock Provider in database
    const testProvider = await prisma.provider.create({
      data: {
        name: "Mock Dispatch Provider A",
        template: "client_api_v1",
        baseUrl: mockBaseUrl,
        credentialsEncrypted: encrypt(JSON.stringify({ api_token: "test_token" })),
        isActive: true,
        priority: 1,
      },
    });

    const testProduct = await prisma.product.create({
      data: {
        categoryId: testCategory.id,
        name: "Test Dispatch Product",
        slug: `disp-prod-${Date.now()}`,
        providerType: "API",
        providerProductId: "365",
      },
    });

    const testVariant = await prisma.productVariant.create({
      data: {
        productId: testProduct.id,
        name: "Package 1",
        price: 25000,
      },
    });

    // Link in ProviderProduct
    await prisma.providerProduct.create({
      data: {
        storeProductId: testProduct.id,
        providerId: testProvider.id,
        externalProductId: "365",
        priority: 1,
        isActive: true,
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: Successful Order Dispatch with UUID & Codes
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 1] Successful Order Dispatch & Idempotency UUID:");
    mockMode = "success";

    const order1 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-1`,
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: 25000,
        customerInputs: JSON.stringify({ playerId: "player_9988" }),
        status: "PENDING",
        items: {
          create: [{ variantId: testVariant.id, variantName: "Package 1", quantity: 1, unitPrice: 25000, totalPrice: 25000 }],
        },
      },
    });

    // Debit wallet initially
    await WalletService.debitWallet(testUser.id, 25000, "ORDER", order1.id, "Payment for order 1");

    const dispatchResult1 = await ProviderOrderDispatcher.dispatchOrder(order1.id);
    assert(dispatchResult1.status === "accepted", "Dispatch status is accepted");
    assert(dispatchResult1.codes?.includes("DELIVERED_KEY_SECRET_777") === true, "Delivery codes captured");
    assert(receivedOrderUuid === dispatchResult1.orderUuid, "Driver sent order_uuid to provider");

    // Check store order status in DB
    const updatedOrder1 = await prisma.order.findUnique({ where: { id: order1.id } });
    assert(updatedOrder1?.status === "COMPLETED", "Store order updated to COMPLETED");
    assert(updatedOrder1?.deliveryNotes?.includes("DELIVERED_KEY_SECRET_777") === true, "Delivery notes saved to store order");

    // -------------------------------------------------------------------------
    // TEST 2: Idempotent Retry uses the exact same order_uuid
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 2] Idempotency Guard - Same UUID on Retry:");
    const previousUuid = dispatchResult1.orderUuid;
    const retryResult = await ProviderOrderDispatcher.dispatchOrder(order1.id);
    assert(retryResult.orderUuid === previousUuid, "Retry reused the exact same orderUuid without generating new one");

    // -------------------------------------------------------------------------
    // TEST 3: Safe Rejection with Failover to Second Provider
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 3] Safe Rejection & Automatic Failover:");
    const testProviderB = await prisma.provider.create({
      data: {
        name: "Mock Backup Provider B",
        template: "client_api_v1",
        baseUrl: mockBaseUrl,
        credentialsEncrypted: encrypt(JSON.stringify({ api_token: "test_token_b" })),
        isActive: true,
        priority: 2,
      },
    });

    await prisma.providerProduct.create({
      data: {
        storeProductId: testProduct.id,
        providerId: testProviderB.id,
        externalProductId: "365",
        priority: 2,
        isActive: true,
      },
    });

    // Set Provider A to fail with safe error (Insufficient balance), but Provider B will succeed
    let requestCount = 0;
    server.removeAllListeners("request");
    server.on("request", (req, res) => {
      requestCount++;
      if (requestCount === 1) {
        // First provider fails with code 100
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 100, msg: "Insufficient balance" }));
      } else {
        // Second provider succeeds
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "OK",
            data: {
              order_id: "ID_FAILOVER_SUCCESS",
              status: "accept",
              replay_api: ["FAILOVER_KEY_999"],
            },
          })
        );
      }
    });

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-2`,
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: 25000,
        customerInputs: JSON.stringify({ playerId: "player_failover" }),
        status: "PENDING",
        items: {
          create: [{ variantId: testVariant.id, variantName: "Package 1", quantity: 1, unitPrice: 25000, totalPrice: 25000 }],
        },
      },
    });

    await WalletService.debitWallet(testUser.id, 25000, "ORDER", order2.id, "Payment for order 2");

    const dispatchResult2 = await ProviderOrderDispatcher.dispatchOrder(order2.id);
    assert(dispatchResult2.status === "accepted", "Failover succeeded and order accepted");
    assert(dispatchResult2.providerId === testProviderB.id, "Order executed via backup Provider B");
    assert(requestCount === 2, "Both providers were consulted in priority order");

    // -------------------------------------------------------------------------
    // TEST 4: Rejection & Atomic Automated Wallet Refund
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 4] Final Rejection & Atomic Automated Wallet Refund:");
    server.removeAllListeners("request");
    server.on("request", (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 107, msg: "Player ID blocked" })); // Not safe to failover
    });

    const order3 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-3`,
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: 25000,
        customerInputs: JSON.stringify({ playerId: "blocked_player" }),
        status: "PENDING",
        items: {
          create: [{ variantId: testVariant.id, variantName: "Package 1", quantity: 1, unitPrice: 25000, totalPrice: 25000 }],
        },
      },
    });

    const userBefore = await prisma.user.findUnique({ where: { id: testUser.id } });
    await WalletService.debitWallet(testUser.id, 25000, "ORDER", order3.id, "Payment for order 3");

    const dispatchResult3 = await ProviderOrderDispatcher.dispatchOrder(order3.id);
    assert(dispatchResult3.status === "rejected", "Order status is rejected");

    const userAfter = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(userAfter?.walletBalance === userBefore?.walletBalance, "Customer wallet balance fully and atomically refunded");

    const updatedOrder3 = await prisma.order.findUnique({ where: { id: order3.id } });
    assert(updatedOrder3?.status === "CANCELLED", "Store order updated to CANCELLED");
    assert(updatedOrder3?.refundAmount === 25000, "Store order records full refund amount");

    // Clean up
    await prisma.providerProduct.deleteMany({ where: { storeProductId: testProduct.id } });
    await prisma.providerOrder.deleteMany({ where: { storeOrderId: { in: [order1.id, order2.id, order3.id] } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order3.id] } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order3.id] } } });
    await prisma.walletTransaction.deleteMany({ where: { userId: testUser.id } });
    await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id, order3.id] } } });
    await prisma.productVariant.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.deleteMany({ where: { id: testProduct.id } });
    await prisma.provider.deleteMany({ where: { id: { in: [testProvider.id, testProviderB.id] } } });
    await prisma.category.deleteMany({ where: { id: testCategory.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  } finally {
    server.close();
  }

  console.log("\n=======================================================");
  console.log(`🏁 ORDER FLOW TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOrderFlowTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
