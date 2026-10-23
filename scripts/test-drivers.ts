import http from "http";
import crypto from "crypto";
import { DriverRegistry } from "../src/providers/registry";
import { ClientApiV1Driver } from "../src/providers/drivers/client-api-v1.driver";
import { ModcAgentDriver } from "../src/providers/drivers/modc-agent.driver";
import { DriverContext } from "../src/providers/types";

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

async function runMockContractTests() {
  console.log("=======================================================");
  console.log("🧪 STARTING MOCK CONTRACT TESTS FOR PROVIDER DRIVERS");
  console.log("=======================================================");

  // 1. Setup Mock Server
  let mockServerPort = 5899;
  let lastRequestBody: any = null;
  let lastRequestHeaders: any = null;
  let lastRequestUrl: string = "";

  const server = http.createServer((req, res) => {
    lastRequestUrl = req.url || "";
    lastRequestHeaders = req.headers;

    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", () => {
      try {
        lastRequestBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        lastRequestBody = rawBody;
      }

      // --- MOCK RESPONSES FOR client_api_v1 ---
      if (req.url === "/client/api/profile") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ balance: "8788.683", email: "user@email.com" }));
        return;
      }

      if (req.url === "/client/api/products") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify([
            {
              id: 365,
              name: "UC 60",
              price: 0.104,
              params: ["ادخل الايدي الاعب"],
              category_name: "UC 60",
              available: true,
              qty_values: { min: "1", max: "15000" },
              product_type: "amount",
            },
            {
              id: 18,
              name: "PUBG Global Package",
              price: 1.094,
              params: ["معرف اللاعب"],
              category_name: "PUBG",
              available: true,
              qty_values: ["110", "150", "210"],
              product_type: "package",
            },
            {
              id: 99,
              name: "Fixed Qty Product",
              price: 5.0,
              params: ["playerId"],
              available: true,
              qty_values: null,
            },
          ])
        );
        return;
      }

      if (req.url?.startsWith("/client/api/newOrder/365/params")) {
        if (req.url.includes("force_error=100")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 100, msg: "Insufficient balance" }));
          return;
        }
        if (req.url.includes("force_error=105")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 105, msg: "Quantity not available" }));
          return;
        }
        if (req.url.includes("force_status=wait")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "OK",
              data: { order_id: "ID_wait_123", status: "wait", price: 1.2 },
            })
          );
          return;
        }
        if (req.url.includes("force_status=reject")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "OK",
              data: { order_id: "ID_rej_123", status: "reject", price: 1.2 },
            })
          );
          return;
        }

        // Standard Success
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "OK",
            data: {
              order_id: "ID_9fffb0d849a45215",
              status: "accept",
              price: 1.26048,
              data: { playerId: "test" },
              replay_api: [{ replay: ["erg3eg", "CODE_PUBG_123"] }],
            },
          })
        );
        return;
      }

      if (req.url?.startsWith("/client/api/check")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "OK",
            data: [
              {
                order_id: "ID_9fffb0d849a45215",
                quantity: 1,
                data: { playerId: "test" },
                status: "accept",
                price: "1.2604800000000000",
                replay_api: ["erg3eg"],
              },
            ],
          })
        );
        return;
      }

      // --- MOCK RESPONSES FOR modc_agent ---
      if (req.url === "/api/v1/agent/balance") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            balance: 150.0,
            credit_limit: 500.0,
            used_credit: 50.0,
            available_credit: 450.0,
            currency: "USD",
          })
        );
        return;
      }

      if (req.url === "/api/v1/agent/products") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            products: [
              {
                id: "prod_123",
                name: "1000 Diamonds",
                price: 9.99,
                stock: 500,
                category: "Games",
                params_required: ["player_id"],
              },
            ],
          })
        );
        return;
      }

      if (req.url === "/api/v1/agent/order") {
        if (lastRequestBody?.product_id === "err_402") {
          res.writeHead(402, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Insufficient balance" }));
          return;
        }
        if (lastRequestBody?.product_id === "err_404") {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Product not found" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "OK",
            data: {
              order_id: "ord_abc123",
              status: "completed",
              price: 9.99,
              data: { playerId: "player_123" },
              replay_api: [{ replay: ["CODE123XYZ"] }],
            },
          })
        );
        return;
      }

      if (req.url?.startsWith("/api/v1/agent/order/status")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            order_id: "ord_abc123",
            status: "completed",
            code: "CODE123XYZ",
            amount: 9.99,
            quantity: 1,
            product_name: "1000 Diamonds",
          })
        );
        return;
      }

      // Default fallback
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Mock endpoint not found" }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(mockServerPort, () => {
      resolve();
    });
  });

  const mockBaseUrl = `http://127.0.0.1:${mockServerPort}`;

  try {
    // ==========================================
    // 2. TEST DriverRegistry
    // ==========================================
    console.log("\n▶ [Test Group 1] DriverRegistry Registration & Lookup:");
    const clientDriver = DriverRegistry.getSupplier("client_api_v1");
    const modcDriver = DriverRegistry.getSupplier("modc_agent");

    assert(!!clientDriver, "Registry contains client_api_v1 driver");
    assert(clientDriver?.template === "client_api_v1", "client_api_v1 template match");
    assert(!!modcDriver, "Registry contains modc_agent driver");
    assert(modcDriver?.template === "modc_agent", "modc_agent template match");
    assert(DriverRegistry.listSuppliers().length >= 2, "List suppliers returns at least 2 drivers");

    // ==========================================
    // 3. TEST ClientApiV1Driver
    // ==========================================
    console.log("\n▶ [Test Group 2] ClientApiV1Driver Contract Tests:");
    const clientCtx: DriverContext = {
      providerId: "prov_client_1",
      name: "Mersal Mock",
      baseUrl: mockBaseUrl,
      credentials: { api_token: "test_secret_token_123" },
      config: { param_mapping: "playerId" },
      timeoutMs: 5000,
    };

    // 3.1 Balance
    const balanceResult = await clientDriver!.getBalance(clientCtx);
    assert(balanceResult.balance === 8788.683, "ClientApiV1 balance matches 8788.683");
    assert(balanceResult.email === "user@email.com", "ClientApiV1 email matches user@email.com");
    assert(lastRequestHeaders["api-token"] === "test_secret_token_123", "Sent correct api-token header");

    // 3.2 List Products & Quantity Normalization
    const products = await clientDriver!.listProducts(clientCtx);
    assert(products.length === 3, "Parsed 3 normalized products");
    assert(products[0].qty.type === "range" && (products[0].qty as any).max === 15000, "Normalized range qty correctly");
    assert(products[1].qty.type === "list" && (products[1].qty as any).values.length === 3, "Normalized list qty correctly");
    assert(products[2].qty.type === "fixed" && (products[2].qty as any).value === 1, "Normalized null qty to fixed 1");

    // 3.3 Create Order Success (with UUID and Codes extraction)
    const orderUuid = "ecbdd545-e616-4aee-8770-7eefa977bcd0";
    const orderSuccess = await clientDriver!.createOrder(clientCtx, {
      externalProductId: "365",
      qty: 1,
      orderUuid,
      params: { playerId: "test_player_id" },
    });
    assert(orderSuccess.status === "accepted", "Order status accepted");
    assert(orderSuccess.externalOrderId === "ID_9fffb0d849a45215", "External order ID matches");
    assert(orderSuccess.codes.includes("CODE_PUBG_123"), "Extracted replay_api codes properly");
    assert(lastRequestUrl.includes(`order_uuid=${orderUuid}`), "Sent order_uuid query parameter for idempotency");
    assert(lastRequestUrl.includes("playerId=test_player_id"), "Mapped player ID param correctly");

    // 3.4 Wait status mapping
    const orderWait = await clientDriver!.createOrder(clientCtx, {
      externalProductId: "365",
      qty: 1,
      orderUuid: "wait_uuid",
      params: { force_status: "wait" },
    });
    assert(orderWait.status === "pending", "wait status normalized to pending");

    // 3.5 Reject status mapping
    const orderReject = await clientDriver!.createOrder(clientCtx, {
      externalProductId: "365",
      qty: 1,
      orderUuid: "reject_uuid",
      params: { force_status: "reject" },
    });
    assert(orderReject.status === "rejected", "reject status normalized to rejected");

    // 3.6 Error Code Mapping: 100 -> PROVIDER_INSUFFICIENT_BALANCE (Safe to failover)
    const orderErr100 = await clientDriver!.createOrder(clientCtx, {
      externalProductId: "365",
      qty: 1,
      orderUuid: "err100_uuid",
      params: { force_error: "100" },
    });
    assert(orderErr100.status === "rejected", "Error order status is rejected");
    assert(orderErr100.error?.internalCode === "PROVIDER_INSUFFICIENT_BALANCE", "Mapped 100 to PROVIDER_INSUFFICIENT_BALANCE");
    assert(orderErr100.error?.safeToFailover === true, "100 is safeToFailover");

    // 3.7 Error Code Mapping: 105 -> QTY_NOT_AVAILABLE
    const orderErr105 = await clientDriver!.createOrder(clientCtx, {
      externalProductId: "365",
      qty: 1,
      orderUuid: "err105_uuid",
      params: { force_error: "105" },
    });
    assert(orderErr105.error?.internalCode === "QTY_NOT_AVAILABLE", "Mapped 105 to QTY_NOT_AVAILABLE");

    // 3.8 Check Orders (by UUID)
    const checkResults = await clientDriver!.checkOrders(clientCtx, [orderUuid], { byUuid: true });
    assert(checkResults.length === 1, "checkOrders returned 1 item");
    assert(checkResults[0].status === "accepted", "checkOrders status is accepted");
    assert(lastRequestUrl.includes("uuid=1"), "Passed uuid=1 when checking by order_uuid");

    // 3.9 Test Connection
    const testConn = await clientDriver!.testConnection(clientCtx);
    assert(testConn.ok === true, "testConnection succeeds");
    assert(testConn.balance?.balance === 8788.683, "testConnection returned balance");

    // ==========================================
    // 4. TEST ModcAgentDriver
    // ==========================================
    console.log("\n▶ [Test Group 3] ModcAgentDriver Contract Tests:");
    const modcCtx: DriverContext = {
      providerId: "prov_modc_1",
      name: "ModC Mock",
      baseUrl: mockBaseUrl,
      credentials: { api_key: "modc_live_secret_key_abc", webhook_secret: "my_hmac_secret_xyz" },
      config: { sandbox_mode: false },
      timeoutMs: 5000,
    };

    // 4.1 Balance
    const modcBal = await modcDriver!.getBalance(modcCtx);
    assert(modcBal.balance === 150.0, "ModC balance matches 150.0");
    assert(modcBal.availableCredit === 450.0, "ModC available credit matches 450.0");
    assert(lastRequestHeaders["x-api-key"] === "modc_live_secret_key_abc", "Sent correct x-api-key header");

    // 4.2 List Products
    const modcProducts = await modcDriver!.listProducts(modcCtx);
    assert(modcProducts.length === 1, "ModC products count is 1");
    assert(modcProducts[0].name === "1000 Diamonds", "ModC product name matches");

    // 4.3 Create Order Success (POST JSON body)
    const modcOrder = await modcDriver!.createOrder(modcCtx, {
      externalProductId: "prod_123",
      qty: 2,
      orderUuid: "modc_uuid_456",
      params: { player_id: "gamer_99" },
    });
    assert(modcOrder.status === "accepted", "ModC order status completed -> accepted");
    assert(modcOrder.codes.includes("CODE123XYZ"), "ModC code extracted correctly");
    assert(lastRequestBody?.product_id === "prod_123", "Sent product_id in POST body");
    assert(lastRequestBody?.order_uuid === "modc_uuid_456", "Sent order_uuid in POST body");
    assert(lastRequestBody?.player_id === "gamer_99", "Sent player_id in POST body");

    // 4.4 HTTP 402 Insufficient Balance
    const modcErr402 = await modcDriver!.createOrder(modcCtx, {
      externalProductId: "err_402",
      qty: 1,
      orderUuid: "modc_err_uuid",
      params: {},
    });
    assert(modcErr402.error?.internalCode === "PROVIDER_INSUFFICIENT_BALANCE", "Mapped HTTP 402 to PROVIDER_INSUFFICIENT_BALANCE");
    assert(modcErr402.error?.safeToFailover === true, "HTTP 402 safe to failover");

    // 4.5 Check Single Order Status
    const modcCheck = await modcDriver!.checkOrders(modcCtx, ["ord_abc123"], { byUuid: false });
    assert(modcCheck.length === 1, "ModC order check returned 1 order");
    assert(modcCheck[0].status === "accepted", "ModC order status is accepted");
    assert(modcCheck[0].codes.includes("CODE123XYZ"), "ModC order code verified");

    // 4.6 Webhook Signature Verification (HMAC-SHA256)
    const samplePayload = JSON.stringify({
      order_id: "ord_abc123",
      status: "completed",
      code: "DELIVERED_KEY_999",
      amount: 9.99,
    });
    const validSignature = crypto.createHmac("sha256", "my_hmac_secret_xyz").update(samplePayload).digest("hex");
    const isSigValid = modcDriver!.verifyWebhook!(modcCtx, samplePayload, {
      "x-webhook-signature": validSignature,
    });
    const isBadSigValid = modcDriver!.verifyWebhook!(modcCtx, samplePayload, {
      "x-webhook-signature": "bad_signature_hex_123456",
    });
    assert(isSigValid === true, "Valid HMAC-SHA256 signature verified");
    assert(isBadSigValid === false, "Tampered signature rejected");

    // 4.7 Parse Webhook Payload
    const parsedWebhook = modcDriver!.parseWebhook!(modcCtx, JSON.parse(samplePayload));
    assert(parsedWebhook.status === "accepted", "Parsed webhook status completed -> accepted");
    assert(parsedWebhook.codes.includes("DELIVERED_KEY_999"), "Parsed webhook delivery code");

    // 4.8 Test Connection
    const modcTest = await modcDriver!.testConnection(modcCtx);
    assert(modcTest.ok === true, "ModC testConnection succeeds");
  } finally {
    server.close();
  }

  console.log("\n=======================================================");
  console.log(`🏁 CONTRACT TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMockContractTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
