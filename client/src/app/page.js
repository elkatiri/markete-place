"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
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
  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      {!hasFilters && (
        <div className="full-bleed relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 md:rounded-b-[2.75rem]">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/[0.03]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-12">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-medium text-primary-100 backdrop-blur-sm sm:text-sm">
                  <FiZap size={14} className="text-amber-300" />
                  Trusted by thousands of buyers and sellers
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Buy & Sell
                  <span className="block text-primary-200">Anything, Anywhere</span>
                </h1>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-primary-200 sm:mt-6 sm:text-xl">
                  Your trusted marketplace for discovering amazing deals and connecting with sellers near you.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                  <Link
                    href="#products"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-primary-700 transition-all hover:shadow-lg hover:shadow-white/20 active:scale-[0.97]"
                  >
                    Browse Products <FiArrowRight size={16} />
                  </Link>
                  <Link
                    href="/products/new"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
                  >
                    Start Selling <FiPackage size={16} />
                  </Link>
                </div>

                <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 sm:mt-14 sm:gap-4">
                  {[
                    { label: "Products", value: pagination.total || "500+", icon: FiPackage },
                    { label: "Sellers", value: "100+", icon: FiUsers },
                    { label: "Secure", value: "100%", icon: FiShield },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
                      <stat.icon className="mx-auto text-primary-200 mb-1" size={18} />
                      <p className="text-lg font-bold text-white sm:text-xl">{stat.value}</p>
                      <p className="text-[11px] text-primary-300 sm:text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl">
                <div className="absolute inset-6 rounded-full bg-white/10 blur-3xl" />
                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-primary-950/20 backdrop-blur-sm sm:p-4">
                  <div className="rounded-[1.5rem] bg-white/5 p-2">
                    <DotLottieReact
                      src="https://lottie.host/5e7100e6-c8e3-4f14-8b77-e739097424a3/j16H2Lizbc.lottie"
                      loop
                      autoplay
                      className="h-[240px] w-full sm:h-[420px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Trust bar ─── */}
      {!hasFilters && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="hide-scrollbar flex items-center gap-3 overflow-x-auto text-sm text-gray-500 sm:flex-wrap sm:justify-center sm:gap-8">
              {[
                { icon: FiShield, text: "Verified Sellers" },
                { icon: FiMessageSquare, text: "Real-time Chat" },
                { icon: FiTrendingUp, text: "Best Prices" },
                { icon: FiZap, text: "Instant Listing" },
              ].map((item) => (
                <div key={item.text} className="flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-sm text-gray-400 mt-0.5">Find what you need by category</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <Link
                key={cat._id}
                href={`/?category=${cat._id}`}
                className="group mobile-card flex min-h-[110px] flex-col items-center justify-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 sm:p-5"
              >
          
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Products Section ─── */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between gap-4">
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
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
        <div className="full-bleed bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center sm:py-16">
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
