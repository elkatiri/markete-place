"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { productAPI, categoryAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { FiUpload, FiX } from "react-icons/fi";

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "used",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    categoryAPI.getAll().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, [user, authLoading, router]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed");
    }
    setImages([...images, ...files]);

    // Generate previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.price || !form.category) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("location", form.location);
      formData.append("condition", form.condition);
      images.forEach((img) => formData.append("images", img));

      const { data } = await productAPI.create(formData);
      toast.success("Product listed successfully!");
      router.push(`/products/${data.product._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mobile-screen max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sell a Product</h1>
        <p className="text-sm text-gray-400 mt-1">Fill in the details to list your item</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="mobile-card border border-white/80 p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Photos <span className="text-gray-400 font-normal">(Max 5)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 group sm:h-24 sm:w-24">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="text-white" size={18} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-all hover:border-primary-400 hover:bg-primary-50/50 sm:h-24 sm:w-24">
                <FiUpload className="text-gray-300" size={20} />
                <span className="text-xs text-gray-400 mt-1">Upload</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="What are you selling?" maxLength={100} required />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-32 resize-none" placeholder="Describe your product in detail..." maxLength={2000} required />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="0.00" min="0" step="0.01" required />
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

        {/* Location & Condition */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="City, State" />
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
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Publishing...
            </span>
          ) : "Publish Product"}
        </button>
      </form>
    </div>
  );
}
