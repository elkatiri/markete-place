"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ImageGallery from "@/components/ImageGallery";
import toast from "react-hot-toast";
import { FiMapPin, FiClock, FiUser, FiMessageSquare, FiEdit, FiTrash2 } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await productAPI.getOne(id);
        setProduct(data.product);
      } catch {
        toast.error("Product not found");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productAPI.delete(id);
      toast.success("Product deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isOwner = user && product.seller?._id === user._id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <ImageGallery images={product.images} />

        {/* Details */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {product.title}
              </h1>
              {product.category && (
                <span className="inline-block mt-2 text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>
            {product.status === "sold" && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                Sold
              </span>
            )}
          </div>

          <p className="text-3xl font-bold text-primary-600 mt-4">
            ${product.price?.toLocaleString()}
          </p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            {product.location && (
              <span className="flex items-center gap-1">
                <FiMapPin /> {product.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiClock />{" "}
              {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
            </span>
            {product.condition && (
              <span className="capitalize bg-green-50 text-green-700 px-2 py-0.5 rounded">
                {product.condition}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Seller Info */}
          {product.seller && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold">{product.seller.name}</p>
                  {product.seller.location && (
                    <p className="text-sm text-gray-500">{product.seller.location}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Member since{" "}
                    {new Date(product.seller.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {isOwner ? (
              <div className="flex gap-3">
                <Link
                  href={`/products/${product._id}/edit`}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                >
                  <FiEdit /> Edit Product
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn-danger flex items-center gap-2"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            ) : user ? (
              <Link
                href={`/chat?to=${product.seller?._id}&product=${product._id}`}
                className="btn-primary flex items-center justify-center gap-2 w-full"
              >
                <FiMessageSquare /> Contact Seller
              </Link>
            ) : (
              <Link href="/login" className="btn-primary w-full block text-center">
                Login to Contact Seller
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
