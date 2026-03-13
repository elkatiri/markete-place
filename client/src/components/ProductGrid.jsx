"use client";

import ProductCard from "./ProductCard";
import { FiSearch, FiPlus } from "react-icons/fi";
import Link from "next/link";

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
              <div className="h-5 bg-gray-200 rounded-lg w-2/5" />
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mb-5">
          <FiSearch size={32} className="text-primary-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">No products found</h3>
        <p className="text-gray-400 mt-2 max-w-sm">
          Try adjusting your search or filters to find what you&apos;re looking for
        </p>
        <Link href="/products/new" className="btn-primary inline-flex items-center gap-2 mt-6">
          <FiPlus size={16} /> List a Product
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product, i) => (
        <div key={product._id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
