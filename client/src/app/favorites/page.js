"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { productAPI } from "@/lib/api";
import {
  FAVORITES_UPDATED_EVENT,
  getFavoriteIds,
} from "@/lib/favorites";
import { FiHeart, FiArrowRight } from "react-icons/fi";

export default function FavoritesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      const favoriteIds = getFavoriteIds();

      if (!favoriteIds.length) {
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }

      const results = await Promise.allSettled(
        favoriteIds.map((id) => productAPI.getOne(id))
      );

      if (!isMounted) return;

      const nextProducts = results
        .filter((result) => result.status === "fulfilled" && result.value?.data?.product)
        .map((result) => result.value.data.product);

      setProducts(nextProducts);
      setLoading(false);
    };

    loadFavorites();

    const handleFavoritesChange = () => {
      loadFavorites();
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChange);
    window.addEventListener("storage", handleFavoritesChange);

    return () => {
      isMounted = false;
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChange);
      window.removeEventListener("storage", handleFavoritesChange);
    };
  }, []);

  const hasFavorites = products.length > 0;

  return (
    <div className="page-container">
      <div className="mb-8 rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
              <FiHeart size={14} /> Saved for later
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Your favorite products</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Keep track of listings you want to revisit. Favorites stay saved in this browser so you can compare items and come back later.
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-gray-500 shadow-sm backdrop-blur-sm">
            <span className="font-semibold text-gray-900">{products.length}</span> saved product{products.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {loading ? (
        <ProductGrid products={[]} loading />
      ) : hasFavorites ? (
        <ProductGrid products={products} loading={false} />
      ) : (
        <div className="empty-state rounded-[2rem] border border-dashed border-gray-200 bg-white/70 px-6 py-16 backdrop-blur-sm">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-rose-100 to-orange-100 text-rose-500">
            <FiHeart size={34} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No favorites yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            Tap the heart on any product card and it will appear here for quick access.
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex items-center gap-2">
            Browse products <FiArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}