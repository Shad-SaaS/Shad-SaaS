import { NextRequest, NextResponse } from "next/server";
import { PaymentVerificationService } from "@/services/payment-verification.service";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[SamApi Webhook] Received payment notification:", payload.event, payload.invoiceId);

    if (payload.event === "invoice.paid" || payload.status === "paid") {
      const result = await PaymentVerificationService.handleInvoicePaidWebhook(payload);
      return NextResponse.json({ success: true, result });
    }

    if (payload.event === "invoice.expired") {
      console.log(`[SamApi Webhook] Invoice ${payload.invoiceId} expired.`);
      return NextResponse.json({ success: true, message: "Invoice expired acknowledged" });
    }

    return NextResponse.json({ success: true, message: "Unhandled event acknowledged" });
  } catch (err: any) {
    console.error("[SamApi Webhook Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 200 }); // Return 200 so upstream provider doesn't get 500 error
  }
}
