import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DriverRegistry } from "@/providers/registry";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const suppliers = DriverRegistry.listSuppliers();
    const payments = DriverRegistry.listPayments();

    return NextResponse.json({
      success: true,
      suppliers,
      payments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
