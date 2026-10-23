import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, maskSecret, decrypt } from "@/lib/encryption";
import { DriverRegistry } from "@/providers/registry";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    // Fetch from new Provider model
    const providers = await prisma.provider.findMany({
      orderBy: { priority: "asc" },
      include: {
        _count: { select: { providerProducts: true, providerOrders: true } },
      },
    });

    const sanitizedProviders = providers.map((p) => {
      let rawToken = "";
      try {
        const decrypted = decrypt(p.credentialsEncrypted);
        const parsed = JSON.parse(decrypted);
        rawToken = parsed.api_token || parsed.api_key || "";
      } catch {
        rawToken = decrypt(p.credentialsEncrypted);
      }

      return {
        id: p.id,
        name: p.name,
        template: p.template,
        baseUrl: p.baseUrl,
        apiTokenMasked: maskSecret(rawToken),
        apiToken: rawToken, // Provided for admin editing
        isActive: p.isActive,
        priority: p.priority,
        balance: p.lastBalance || 0,
        currency: "USD",
        lastSyncAt: p.lastBalanceAt,
        lastError: p.lastError,
        config: p.config,
        _count: {
          products: p._count.providerProducts,
          orders: p._count.providerOrders,
        },
      };
    });

    return NextResponse.json({ success: true, providers: sanitizedProviders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await req.json();
    const {
      name,
      template = "client_api_v1",
      baseUrl,
      apiToken,
      credentials,
      config,
      priority = 1,
      isActive = true,
    } = body;

    if (!name || !baseUrl) {
      return NextResponse.json({ error: "الاسم والعنوان الأساسي (Base URL) حقول مطلوبة" }, { status: 400 });
    }

    // Verify template exists in registry
    const isSupplier = DriverRegistry.hasSupplier(template);
    const isPayment = DriverRegistry.hasPayment(template);

    if (!isSupplier && !isPayment) {
      return NextResponse.json(
        { error: `القالب (${template}) غير مسجل في سجل المحولات (Driver Registry)` },
        { status: 400 }
      );
    }

    const credsObj = credentials || {
      api_token: apiToken || "",
      api_key: apiToken || "",
    };

    const encryptedCredentials = encrypt(JSON.stringify(credsObj));
    const configStr = typeof config === "object" ? JSON.stringify(config) : config || null;

    const provider = await prisma.provider.create({
      data: {
        name: name.trim(),
        template: template.trim(),
        baseUrl: baseUrl.trim(),
        credentialsEncrypted: encryptedCredentials,
        config: configStr,
        priority: Number(priority) || 1,
        isActive: Boolean(isActive),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_PROVIDER",
        userId: admin.id,
        details: `إنشاء مزود جديد: ${provider.name} بالقالب (${provider.template})`,
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
