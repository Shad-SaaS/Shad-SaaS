import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: List all categories with product counts
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new category
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, image, icon, sortOrder, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "اسم القسم والرابط المباشر مطلوبان" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "الرابط المباشر (Slug) مستخدم بالفعل" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        icon: icon || null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ category, message: "تمت إضافة القسم بنجاح" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing category (including updating or deleting image)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, slug, description, image, icon, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف القسم مطلوب" }, { status: 400 });
    }

    // Check slug collision
    if (slug) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "الرابط المباشر (Slug) مستخدم في قسم آخر" }, { status: 400 });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description: description || null }),
        // If image is explicitly passed as null or string, update it
        ...(image !== undefined && { image: image || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ category: updated, message: "تم تحديث بيانات القسم بنجاح" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a category
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف القسم مطلوب" }, { status: 400 });
    }

    // Count products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف هذا القسم لاحتوائه على ${productCount} منتج مرتبط به. يرجى نقل أو حذف المنتجات أولاً.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف القسم بنجاح" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
