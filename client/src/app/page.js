"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, categoryAPI } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";
import SearchFilters from "@/components/SearchFilters";
import Link from "next/link";
import {
  FiArrowRight, FiTrendingUp, FiShield, FiMessageSquare,
  FiZap, FiUsers, FiPackage, FiChevronLeft, FiChevronRight,
  FiPlus,
} from "react-icons/fi";

function HomeContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const hasFilters = Array.from(searchParams.entries()).some(([, v]) => v);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        search: searchParams.get("search") || "",
        category: searchParams.get("category") || "",
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        location: searchParams.get("location") || "",
        condition: searchParams.get("condition") || "",
        sort: searchParams.get("sort") || "",
      };
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [searchParams]);

  useEffect(() => {
    categoryAPI.getAll().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  const categoryIcons = ["💻", "👕", "🏠", "🚗", "⚽", "📚", "🎮", "🎨"];

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      {!hasFilters && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/[0.03]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-primary-100 text-sm font-medium mb-6">
                <FiZap size={14} className="text-amber-300" />
                Trusted by thousands of buyers and sellers
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Buy & Sell
                <span className="block text-primary-200">Anything, Anywhere</span>
              </h1>
              <p className="text-primary-200 text-lg sm:text-xl mt-6 leading-relaxed max-w-lg">
                Your trusted marketplace for discovering amazing deals and connecting with sellers near you.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold text-sm hover:shadow-lg hover:shadow-white/20 transition-all active:scale-[0.97]"
                >
                  Browse Products <FiArrowRight size={16} />
                </Link>
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all"
                >
                  Start Selling <FiPackage size={16} />
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-14 max-w-lg">
              {[
                { label: "Products", value: pagination.total || "500+", icon: FiPackage },
                { label: "Sellers", value: "100+", icon: FiUsers },
                { label: "Secure", value: "100%", icon: FiShield },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <stat.icon className="mx-auto text-primary-200 mb-1" size={18} />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-primary-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Trust bar ─── */}
      {!hasFilters && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              {[
                { icon: FiShield, text: "Verified Sellers" },
                { icon: FiMessageSquare, text: "Real-time Chat" },
                { icon: FiTrendingUp, text: "Best Prices" },
                { icon: FiZap, text: "Instant Listing" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon size={16} className="text-primary-500" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Categories ─── */}
      {!hasFilters && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-sm text-gray-400 mt-0.5">Find what you need by category</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat, i) => (
              <Link
                key={cat._id}
                href={`/?category=${cat._id}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 transition-all hover:-translate-y-0.5"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon || categoryIcons[i % categoryIcons.length]}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Products Section ─── */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {hasFilters ? "Search Results" : "Latest Products"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {pagination.total > 0
                ? `${pagination.total} product${pagination.total !== 1 ? "s" : ""} found`
                : "Discover amazing deals"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <SearchFilters />

        {/* Products Grid */}
        <ProductGrid products={products} loading={loading} />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => fetchProducts(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={18} />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2)
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-1 text-gray-300">...</span>
                  )}
                  <button
                    onClick={() => fetchProducts(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      pagination.page === page
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-surface-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
            <button
              onClick={() => fetchProducts(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page >= pagination.pages}
              className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Footer CTA ─── */}
      {!hasFilters && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to start selling?</h2>
            <p className="text-primary-200 max-w-md mx-auto mb-8">
              Join thousands of sellers and reach buyers in your area. Create your first listing in minutes.
            </p>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:shadow-xl hover:shadow-white/20 transition-all active:scale-[0.97]"
            >
              <FiPlus size={16} /> Create Free Listing
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
