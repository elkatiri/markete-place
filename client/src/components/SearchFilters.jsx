"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categoryAPI } from "@/lib/api";
import { FiSearch, FiSliders, FiX, FiMapPin, FiChevronDown } from "react-icons/fi";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    location: searchParams.get("location") || "",
    condition: searchParams.get("condition") || "",
    sort: searchParams.get("sort") || "",
  });

  useEffect(() => {
    categoryAPI.getAll().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const clearFilters = () => {
    setFilters({ search: "", category: "", minPrice: "", maxPrice: "", location: "", condition: "", sort: "" });
    router.push("/");
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="mb-6">
      {/* Main search bar */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field pl-10 !rounded-xl"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all ${
            showFilters
              ? "bg-primary-50 border-primary-200 text-primary-700"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          <FiSliders size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable filter panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mobile-card border border-gray-200 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-700">Refine Results</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <FiX size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Category */}
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field !pr-8 appearance-none text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Price Range */}
            <div className="flex gap-2">
              <input type="number" placeholder="Min $" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="input-field flex-1 text-sm" min="0" />
              <input type="number" placeholder="Max $" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="input-field flex-1 text-sm" min="0" />
            </div>

            {/* Location */}
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Location" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} className="input-field pl-8 text-sm" />
            </div>

            {/* Condition */}
            <div className="relative">
              <select
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                className="input-field !pr-8 appearance-none text-sm"
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="input-field !pr-8 appearance-none text-sm"
              >
                <option value="">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="oldest">Oldest First</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {filters.category && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {categories.find(c => c._id === filters.category)?.name || "Category"}
                  <button onClick={() => setFilters({ ...filters, category: "" })}><FiX size={12} /></button>
                </span>
              )}
              {filters.condition && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                  {filters.condition}
                  <button onClick={() => setFilters({ ...filters, condition: "" })}><FiX size={12} /></button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {filters.location}
                  <button onClick={() => setFilters({ ...filters, location: "" })}><FiX size={12} /></button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {filters.minPrice && `$${filters.minPrice}`} - {filters.maxPrice && `$${filters.maxPrice}`}
                  <button onClick={() => setFilters({ ...filters, minPrice: "", maxPrice: "" })}><FiX size={12} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
