"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categoryAPI } from "@/lib/api";
import { FiFilter, FiX } from "react-icons/fi";

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

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      condition: "",
      sort: "",
    });
    router.push("/");
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="mb-6">
      {/* Filter toggle for mobile */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden btn-secondary flex items-center gap-2 mb-3"
      >
        <FiFilter />
        Filters
        {hasActiveFilters && (
          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">!</span>
        )}
      </button>

      <div className={`${showFilters ? "block" : "hidden"} md:block`}>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field"
            />

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Price Range */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min $"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="input-field w-1/2"
                min="0"
              />
              <input
                type="number"
                placeholder="Max $"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="input-field w-1/2"
                min="0"
              />
            </div>

            {/* Location */}
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="input-field"
            />

            {/* Condition */}
            <select
              value={filters.condition}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
              className="input-field"
            >
              <option value="">Any Condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="input-field"
            >
              <option value="">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={applyFilters} className="btn-primary">
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary flex items-center gap-1">
                <FiX />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
