"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { productAPI, categoryAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { FiUpload, FiX } from "react-icons/fi";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "used",
    status: "active",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          productAPI.getOne(id),
          categoryAPI.getAll(),
        ]);

        const product = productRes.data.product;
        if (product.seller._id !== user?._id) {
          toast.error("Not authorized");
          router.push("/");
          return;
        }

        setForm({
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category?._id || "",
          location: product.location || "",
          condition: product.condition || "used",
          status: product.status || "active",
        });
        setExistingImages(product.images || []);
        setCategories(catRes.data.categories || []);
      } catch {
        toast.error("Failed to load product");
        router.push("/dashboard");
      } finally {
        setFetching(false);
      }
    };

    if (user) fetchData();
  }, [id, user, authLoading, router]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = existingImages.length + newImages.length + files.length;
    if (total > 5) {
      return toast.error("Maximum 5 images allowed");
    }
    setNewImages([...newImages, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setNewPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (publicId) => {
    setRemovedImages([...removedImages, publicId]);
    setExistingImages(existingImages.filter((img) => img.publicId !== publicId));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("location", form.location);
      formData.append("condition", form.condition);
      formData.append("status", form.status);
      if (removedImages.length > 0) {
        formData.append("removeImages", JSON.stringify(removedImages));
      }
      newImages.forEach((img) => formData.append("images", img));

      await productAPI.update(id, formData);
      toast.success("Product updated!");
      router.push(`/products/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-400 mt-1">Update your listing details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Photos</label>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(img.publicId)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiX className="text-white" size={18} />
                </button>
              </div>
            ))}
            {newPreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(index)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiX className="text-white" size={18} />
                </button>
              </div>
            ))}
            {existingImages.length + newImages.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
                <FiUpload className="text-gray-300" size={20} />
                <span className="text-xs text-gray-400 mt-1">Upload</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-32 resize-none" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" required>
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input-field">
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
