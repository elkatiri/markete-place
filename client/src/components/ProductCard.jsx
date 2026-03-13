"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiMapPin, FiHeart, FiEye, FiClock } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

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
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.title}
              </h3>
            </div>
            <p className="text-lg font-bold text-primary-600 mt-2">
              ${product.price?.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {product.location && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FiMapPin size={11} />
                  <span className="truncate max-w-[100px]">{product.location}</span>
                </span>
              )}
              {product.createdAt && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
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
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 shadow-sm ${
          liked
            ? "bg-red-500 text-white scale-110"
            : "bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100"
        }`}
      >
        <FiHeart size={14} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
