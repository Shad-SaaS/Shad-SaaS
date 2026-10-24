import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك برفع الملفات" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد أي ملف" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate clean safe file name
    const ext = path.extname(file.name) || ".jpg";
    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    
    // Ensure public/uploads exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, cleanName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${cleanName}`;

    return NextResponse.json({
      url: publicUrl,
      message: "تم رفع الصورة بنجاح",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "فشل رفع الصورة" }, { status: 500 });
  }
}
