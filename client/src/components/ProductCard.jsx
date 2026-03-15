"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMapPin, FiHeart, FiEye, FiClock } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import {
  FAVORITES_UPDATED_EVENT,
  isFavoriteProduct,
  toggleFavoriteProduct,
} from "@/lib/favorites";

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : "/placeholder.png";

  const conditionColors = {
    new: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "like-new": "bg-blue-50 text-blue-700 border-blue-200",
    used: "bg-gray-50 text-gray-600 border-gray-200",
    refurbished: "bg-violet-50 text-violet-700 border-violet-200",
  };

  useEffect(() => {
    setLiked(isFavoriteProduct(product._id));

    const syncFavoriteState = () => {
      setLiked(isFavoriteProduct(product._id));
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
    window.addEventListener("storage", syncFavoriteState);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
      window.removeEventListener("storage", syncFavoriteState);
    };
  }, [product._id]);

  return (
    <div className="group relative">
      <Link href={`/products/${product._id}`}>
        <div className="card-hover cursor-pointer">
          {/* Image container */}
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <FiEye size={32} />
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top badges row */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                {product.condition && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize border backdrop-blur-sm ${conditionColors[product.condition] || conditionColors.used}`}>
                    {product.condition === "like-new" ? "Like New" : product.condition}
                  </span>
                )}
                {product.images?.length > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-black/40 text-white backdrop-blur-sm">
                    {product.images.length} photos
                  </span>
                )}
              </div>
            </div>

            {/* Sold overlay */}
            {product.status === "sold" && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white font-bold text-sm rounded-full border border-white/30">
                  SOLD
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-gray-800 transition-colors group-hover:text-primary-600 sm:text-sm">
                {product.title}
              </h3>
            </div>
            <p className="mt-2 text-base font-bold text-primary-600 sm:text-lg">
              ${product.price?.toLocaleString()}
            </p>
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              {product.location && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 sm:text-xs">
                  <FiMapPin size={11} />
                  <span className="truncate max-w-[88px] sm:max-w-[100px]">{product.location}</span>
                </span>
              )}
              {product.createdAt && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 sm:text-xs">
                  <FiClock size={11} />
                  {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
            {product.category && (
              <span className="inline-flex mt-2 text-[10px] font-medium bg-surface-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
                {product.category.name}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Floating like button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const result = toggleFavoriteProduct(product._id);
          setLiked(result.favorite);
        }}
        aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all ${
          liked
            ? "bg-red-500 text-white scale-110"
            : "bg-white/85 text-gray-500 backdrop-blur-sm opacity-100 hover:bg-white hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
      >
        <FiHeart size={14} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
