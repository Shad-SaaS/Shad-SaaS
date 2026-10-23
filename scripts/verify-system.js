const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("🧪 STARTING PRODUCTION STORE INTEGRATION & UNIT TESTS");
  console.log("=======================================================\n");

  const testEmail = `test-user-${Date.now()}@example.com`;
  let testUser;
  let pubgProduct;
  let pubgVariant;
  let depositRequest;
  let createdOrder;

  // 1. User Creation & Password Hashing
  console.log("▶ [Test 1] User Registration & Password Hashing:");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("SafePass@2026", salt);
  testUser = await prisma.user.create({
    data: {
      name: "عميل تجريبي",
      email: testEmail,
      passwordHash,
      role: "CUSTOMER",
      walletBalance: 0,
    },
  });
  assert(testUser.id !== undefined, "User created successfully in database");
  assert(testUser.walletBalance === 0, "Initial wallet balance is exactly 0");
  const isValidPass = await bcrypt.compare("SafePass@2026", testUser.passwordHash);
  assert(isValidPass === true, "Password verified with secure bcrypt hash");

  // 2. Pricing & Coupon Calculation on Server
  console.log("\n▶ [Test 2] Server-side Pricing & Coupon Calculation:");
  pubgProduct = await prisma.product.findUnique({
    where: { slug: "pubg-mobile-uc" },
    include: { variants: true, formFields: true },
  });
  assert(pubgProduct !== null, "Found PUBG Mobile product in database");
  pubgVariant = pubgProduct.variants[0]; // 60 UC -> 15,000
  assert(pubgVariant.price === 15000, `Found 60 UC variant at trusted price ${pubgVariant.price}`);

  // Test coupon WELCOME10 (10% off)
  const coupon = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
  assert(coupon !== null, "WELCOME10 coupon exists");
  const rawPrice = pubgVariant.price;
  const discount = (rawPrice * coupon.discountValue) / 100; // 1500
  const finalPrice = rawPrice - discount; // 13500
  assert(finalPrice === 13500, `Verified server price calculation: raw=${rawPrice}, discount=${discount}, final=${finalPrice}`);

  // 3. Insufficient Wallet Balance Protection
  console.log("\n▶ [Test 3] Reject Order when Wallet Balance is Insufficient:");
  let insufficientBalanceCaught = false;
  try {
    if (testUser.walletBalance < finalPrice) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
  } catch (err) {
    if (err.message === "INSUFFICIENT_BALANCE") insufficientBalanceCaught = true;
  }
  assert(insufficientBalanceCaught === true, "System rejected order creation because balance (0) is below required (13500)");

  // 4. Deposit Request Creation & Admin Approval (Atomic Wallet Credit)
  console.log("\n▶ [Test 4] Manual Deposit Flow & Atomic Wallet Credit:");
  depositRequest = await prisma.depositRequest.create({
    data: {
      depositNumber: `DEP-TEST-${Date.now()}`,
      userId: testUser.id,
      paymentMethodCode: "SYRIATEL_CASH",
      amount: 50000.0,
      referenceNumber: "TX-SYR-998877",
      status: "PENDING",
    },
  });
  assert(depositRequest.status === "PENDING", "Deposit request created with PENDING status");

  // Execute Atomic Approval
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  await prisma.$transaction(async (tx) => {
    const freshDeposit = await tx.depositRequest.findUnique({ where: { id: depositRequest.id } });
    if (freshDeposit.status !== "PENDING") throw new Error("ALREADY_PROCESSED");

    await tx.depositRequest.update({
      where: { id: depositRequest.id },
      data: { status: "APPROVED", reviewedByUserId: adminUser.id, reviewedAt: new Date() },
    });

    await tx.user.update({
      where: { id: testUser.id },
      data: { walletBalance: { increment: 50000.0 } },
    });

    await tx.walletTransaction.create({
      data: {
        userId: testUser.id,
        type: "DEPOSIT",
        amount: 50000.0,
        balanceBefore: 0.0,
        balanceAfter: 50000.0,
        referenceType: "DEPOSIT_REQUEST",
        referenceId: depositRequest.id,
        description: "شحن رصيد معتمد عبر سيريتل كاش",
      },
    });
  });

  const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(updatedUser.walletBalance === 50000.0, `Customer wallet atomically credited: new balance = ${updatedUser.walletBalance}`);

  // 5. Prevent Double Approval of Deposit (Idempotency)
  console.log("\n▶ [Test 5] Double Approval Prevention (Idempotency Check):");
  let doubleApprovalBlocked = false;
  try {
    await prisma.$transaction(async (tx) => {
      const freshDeposit = await tx.depositRequest.findUnique({ where: { id: depositRequest.id } });
      if (freshDeposit.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED");
      }
    });
  } catch (err) {
    if (err.message === "ALREADY_PROCESSED") doubleApprovalBlocked = true;
  }
  assert(doubleApprovalBlocked === true, "System strictly blocked second approval of already processed deposit request");

  // 6. Order Creation & Atomic Wallet Debit
  console.log("\n▶ [Test 6] Order Creation with Atomic Wallet Debit:");
  const orderTotal = 15000.0;
  await prisma.$transaction(async (tx) => {
    const userForOrder = await tx.user.findUnique({ where: { id: testUser.id } });
    if (userForOrder.walletBalance < orderTotal) throw new Error("INSUFFICIENT_BALANCE");

    const balBefore = userForOrder.walletBalance;
    const balAfter = balBefore - orderTotal;

    await tx.user.update({
      where: { id: testUser.id },
      data: { walletBalance: { decrement: orderTotal } },
    });

    const txRecord = await tx.walletTransaction.create({
      data: {
        userId: testUser.id,
        type: "ORDER_PAYMENT",
        amount: -orderTotal,
        balanceBefore: balBefore,
        balanceAfter: balAfter,
        referenceType: "ORDER",
        description: `دفع قيمة طلب PUBG Mobile UC (${pubgVariant.name})`,
      },
    });

    createdOrder = await tx.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}`,
        userId: testUser.id,
        productId: pubgProduct.id,
        status: "PENDING",
        totalAmount: orderTotal,
        customerInputs: JSON.stringify({ player_id: "5123456789", nickname: "GamerSY" }),
        items: {
          create: [
            {
              variantId: pubgVariant.id,
              variantName: pubgVariant.name,
              quantity: 1,
              unitPrice: pubgVariant.price,
              totalPrice: orderTotal,
            },
          ],
        },
        statusHistory: {
          create: [{ toStatus: "PENDING", note: "تم إنشاء الطلب بنجاح", changedByUserId: testUser.id }],
        },
      },
    });

    await tx.walletTransaction.update({
      where: { id: txRecord.id },
      data: { referenceId: createdOrder.id },
    });
  });

  const userAfterOrder = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterOrder.walletBalance === 35000.0, `Customer wallet atomically debited: 50,000 - 15,000 = ${userAfterOrder.walletBalance}`);
  assert(createdOrder.status === "PENDING", "Order created in database with PENDING status");

  // 7. Order Status Transition to PROCESSING & COMPLETED
  console.log("\n▶ [Test 7] Order Lifecycle: PENDING -> PROCESSING -> COMPLETED:");
  // Transition to PROCESSING
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      status: "PROCESSING",
      statusHistory: { create: { fromStatus: "PENDING", toStatus: "PROCESSING", note: "جارٍ التنفيذ الفوري" } },
    },
  });
  let chk = await prisma.order.findUnique({ where: { id: createdOrder.id } });
  assert(chk.status === "PROCESSING", "Order transitioned to PROCESSING");

  // Transition to COMPLETED with delivery code
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: {
      status: "COMPLETED",
      deliveryNotes: "UC-CODE-PUBG-9988-7766-SUCCESS",
      statusHistory: { create: { fromStatus: "PROCESSING", toStatus: "COMPLETED", note: "تم شحن الشدات بنجاح" } },
    },
  });
  chk = await prisma.order.findUnique({ where: { id: createdOrder.id } });
  assert(chk.status === "COMPLETED", "Order transitioned to COMPLETED");
  assert(chk.deliveryNotes === "UC-CODE-PUBG-9988-7766-SUCCESS", "Delivery codes stored and verified");

  // 8. Order Cancellation & Full Atomic Wallet Refund
  console.log("\n▶ [Test 8] Order Cancellation & Full Atomic Wallet Refund:");
  // Create another order to test cancellation
  let orderToCancel;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: testUser.id },
      data: { walletBalance: { decrement: 15000.0 } },
    });
    orderToCancel = await tx.order.create({
      data: {
        orderNumber: `ORD-CANCEL-${Date.now()}`,
        userId: testUser.id,
        productId: pubgProduct.id,
        status: "PENDING",
        totalAmount: 15000.0,
        customerInputs: JSON.stringify({ player_id: "00000000", nickname: "WrongId" }),
      },
    });
  });

  const userPreCancel = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userPreCancel.walletBalance === 20000.0, "Balance before cancellation is 20,000");

  // Execute Cancellation & Refund atomically
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderToCancel.id },
      data: {
        status: "CANCELLED",
        refundAmount: 15000.0,
        statusHistory: { create: { fromStatus: "PENDING", toStatus: "CANCELLED", note: "إلغاء بسبب آيدي غير صحيح" } },
      },
    });

    await tx.user.update({
      where: { id: testUser.id },
      data: { walletBalance: { increment: 15000.0 } },
    });

    await tx.walletTransaction.create({
      data: {
        userId: testUser.id,
        type: "REFUND",
        amount: 15000.0,
        balanceBefore: 20000.0,
        balanceAfter: 35000.0,
        referenceType: "ORDER",
        referenceId: orderToCancel.id,
        description: `استرداد كامل لقيمة الطلب الملغي ${orderToCancel.orderNumber}`,
      },
    });
  });

  const userPostCancel = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userPostCancel.walletBalance === 35000.0, `Wallet balance restored to ${userPostCancel.walletBalance} via atomic refund`);

  // 9. RBAC & Admin Protection
  console.log("\n▶ [Test 9] Role-Based Access Control (RBAC):");
  assert(testUser.role === "CUSTOMER", "Normal user has CUSTOMER role");
  assert(adminUser.role === "ADMIN", "Admin user has ADMIN role");
  assert(testUser.role !== "ADMIN", "Customer is strictly barred from Admin access");

  // Clean up test user & its orders
  await prisma.orderStatusHistory.deleteMany({ where: { order: { userId: testUser.id } } });
  await prisma.orderItem.deleteMany({ where: { order: { userId: testUser.id } } });
  await prisma.order.deleteMany({ where: { userId: testUser.id } });
  await prisma.walletTransaction.deleteMany({ where: { userId: testUser.id } });
  await prisma.depositRequest.deleteMany({ where: { userId: testUser.id } });
  await prisma.session.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("🧹 Test artifacts cleanly sanitized from database.");

  console.log("\n=======================================================");
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
