"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";

export default function ProductCard({ product }) {
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : "/placeholder.png";

  return (
    <Link href={`/products/${product._id}`}>
      <div className="card group hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative aspect-square bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">📷</span>
            </div>
          )}
          {product.condition && product.condition !== "used" && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full capitalize">
              {product.condition}
            </span>
          )}
          {product.status === "sold" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-gray-800 truncate">{product.title}</h3>
          <p className="text-lg font-bold text-primary-600 mt-1">
            ${product.price?.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-2">
            {product.location && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FiMapPin size={12} />
                {product.location}
              </span>
            )}
            {product.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {product.category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
