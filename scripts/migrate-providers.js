const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Encryption helper matching src/lib/encryption.ts
function encryptCredentials(credentialsObj) {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "shad-store-default-secure-fallback-encryption-key-32b";
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const text = JSON.stringify(credentialsObj);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

async function migrate() {
  console.log("==========================================");
  console.log("Starting Provider Migration Script (Phase 2)");
  console.log("==========================================");

  // 1. Fetch all existing legacy ApiProvider rows
  const legacyProviders = await prisma.apiProvider.findMany();
  console.log(`[Migration] Found ${legacyProviders.length} legacy ApiProvider rows.`);

  let migratedCount = 0;

  for (const p of legacyProviders) {
    // Map template
    let template = "client_api_v1";
    let creds = { api_token: p.apiToken || "" };

    if (p.code === "modc" || p.name.toLowerCase().includes("modc")) {
      template = "modc_agent";
      creds = { api_key: p.apiToken || "" };
    } else if (p.code === "sam_api" || p.name.toLowerCase().includes("sam")) {
      template = "samapi_payments";
      creds = { api_key: p.apiToken || "" };
    }

    const encryptedCredentials = encryptCredentials(creds);

    const config = {
      auth_header: template === "modc_agent" ? "x-api-key" : template === "samapi_payments" ? "Authorization" : "api-token",
      param_mapping: template === "modc_agent" ? "player_id" : "playerId",
      order_method: template === "modc_agent" ? "POST" : "GET",
    };

    // Upsert into new Provider model
    const newProvider = await prisma.provider.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        template,
        baseUrl: p.baseUrl,
        credentialsEncrypted: encryptedCredentials,
        config: JSON.stringify(config),
        isActive: p.isActive,
        priority: 1,
        timeoutMs: 15000,
        rateLimitPerMin: template === "modc_agent" ? 100 : null,
        lastBalance: p.balance,
      },
      update: {
        name: p.name,
        template,
        baseUrl: p.baseUrl,
        credentialsEncrypted: encryptedCredentials,
        config: JSON.stringify(config),
        isActive: p.isActive,
      },
    });

    console.log(`[Migration] Migrated provider: ${newProvider.name} (${newProvider.id}) -> Template: ${template}`);
    migratedCount++;
  }

  // 2. Link existing products to ProviderProduct
  const productsWithProviders = await prisma.product.findMany({
    where: {
      providerId: { not: null },
      providerProductId: { not: null },
    },
  });

  console.log(`[Migration] Found ${productsWithProviders.length} products associated with providers.`);
  let productLinksCount = 0;

  for (const prod of productsWithProviders) {
    if (!prod.providerId || !prod.providerProductId) continue;

    await prisma.providerProduct.upsert({
      where: {
        providerId_externalProductId_storeProductId: {
          providerId: prod.providerId,
          externalProductId: prod.providerProductId,
          storeProductId: prod.id,
        },
      },
      create: {
        providerId: prod.providerId,
        externalProductId: prod.providerProductId,
        storeProductId: prod.id,
        costOverride: prod.costPrice > 0 ? prod.costPrice : null,
        priority: 1,
        isActive: true,
      },
      update: {
        costOverride: prod.costPrice > 0 ? prod.costPrice : null,
      },
    });
    productLinksCount++;
  }

  console.log(`[Migration] Successfully linked ${productLinksCount} products to ProviderProduct.`);
  console.log("==========================================");
  console.log(`Migration Complete: ${migratedCount} providers, ${productLinksCount} product links.`);
  console.log("==========================================");
}

migrate()
  .catch((e) => {
    console.error("[Migration Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
