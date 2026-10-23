import { NextRequest, NextResponse } from "next/server";
import { ProviderOrderDispatcher } from "@/services/provider-order.dispatcher";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await ProviderOrderDispatcher.syncPendingOrders();
    return NextResponse.json({
      success: true,
      message: `Checked ${result.checked} pending orders, updated ${result.updated}.`,
      result,
    });
  } catch (err: any) {
    console.error("[Cron Sync Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
