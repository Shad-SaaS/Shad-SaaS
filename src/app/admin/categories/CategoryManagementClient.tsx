"use client";

import { useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: {
    products: number;
  };
}

interface Props {
  initialCategories: Category[];
}

export default function CategoryManagementClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Loading & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setSortOrder(categories.length);
    setIsActive(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "فشل رفع الصورة");
      } else {
        setImage(data.url);
        setSuccessMessage("تم رفع الصورة بنجاح");
      }
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم لرفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage("");
    setSuccessMessage("تم حذف الصورة من القسم");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description,
        image: image || null,
        sortOrder: Number(sortOrder),
        isActive,
      };

      if (editingCategory) {
        // Update
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setErrorMessage(data.error || "فشل تحديث بيانات القسم");
        } else {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
          );
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setErrorMessage(data.error || "فشل إنشاء القسم");
        } else {
          setCategories((prev) => [...prev, { ...data.category, _count: { products: 0 } }]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      setErrorMessage("حدث خطأ أثناء الحفظ: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "تعذر حذف القسم");
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      }
    } catch {
      alert("تعذر الاتصال بالخادم لحذف القسم");
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>إدارة التصنيفات والأقسام (التحكم الكامل)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل الأقسام، رفع وحذف الصور، وضبط الترتيب والظهور في واجهة المتجر
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-vip-gold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Categories Visual Cards / Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-slate-400">
                <th className="py-3.5 px-4 font-bold">صورة القسم</th>
                <th className="py-3.5 px-4 font-bold">اسم القسم</th>
                <th className="py-3.5 px-4 font-bold">الرابط المباشر (Slug)</th>
                <th className="py-3.5 px-4 font-bold">عدد المنتجات</th>
                <th className="py-3.5 px-4 font-bold">الترتيب</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  
                  {/* Category Thumbnail */}
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center relative shadow-md">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    {c.name}
                  </td>

                  {/* Slug */}
                  <td className="py-3.5 px-4 font-mono text-cyan-400">
                    /category/{c.slug}
                  </td>

                  {/* Products count */}
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {c._count.products}
                  </td>

                  {/* Sort order */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    {c.sortOrder}
                  </td>

                  {/* Active status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {c.isActive ? "نشط" : "معطل"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="btn-vip-slate px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                        title="تعديل بيانات وصورة القسم"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121824] border border-white/10 rounded-3xl p-6 max-w-lg w-full text-right shadow-2xl relative space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>{editingCategory ? "تعديل بيانات وصور القسم" : "إضافة تصنيف / قسم جديد"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Category Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">اسم القسم *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory && !slug) {
                      setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"));
                    }
                  }}
                  placeholder="مثال: شحن الألعاب"
                  className="w-full bg-[#18202d] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">الرابط المباشر (Slug) *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="مثال: games"
                  className="w-full bg-[#18202d] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Image Control (Add / Upload / Delete image) */}
              <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                <label className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>صورة القسم (إضافة، تغيير، أو حذف)</span>
                </label>

                {/* Current Image Preview */}
                {image ? (
                  <div className="flex items-center gap-3 bg-[#0d121c] p-2.5 rounded-xl border border-white/10">
                    <img
                      src={image}
                      alt="معاينة"
                      className="w-14 h-14 object-cover rounded-lg border border-white/10 shadow"
                    />
                    <div className="flex-1 truncate">
                      <div className="text-[11px] font-mono text-slate-300 truncate">{image}</div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="mt-1 text-rose-400 hover:text-rose-300 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الصورة نهائياً</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-[#0d121c] p-3 rounded-xl border border-dashed border-white/10 text-center">
                    لا توجد صورة محددة لهذا القسم حالياً
                  </div>
                )}

                {/* Upload or URL Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  
                  {/* File Upload from Disk */}
                  <label className="btn-vip-slate py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-center">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isUploading ? "جاري الرفع..." : "رفع صورة من جهازك"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {/* Manual URL Input */}
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="أو ضع رابط صورة مباشر..."
                    className="bg-[#18202d] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">وصف القسم (اختياري)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للخدمات التابعة لهذا القسم..."
                  className="w-full bg-[#18202d] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-[#18202d] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-[#18202d] border border-white/10 rounded-xl px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-200">القسم نشط في المتجر</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-vip-gold px-6 py-2.5 rounded-xl text-black font-black flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{editingCategory ? "حفظ التعديلات" : "إضافة القسم"}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
