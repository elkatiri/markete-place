"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productAPI, reviewAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ImageGallery from "@/components/ImageGallery";
import toast from "react-hot-toast";
import { FiMapPin, FiClock, FiUser, FiMessageSquare, FiEdit, FiTrash2, FiStar, FiShield, FiShare2 } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (id) {
      reviewAPI.getForProduct(id).then(({ data }) => {
        setReviews(data.reviews);
        setAvgRating(data.averageRating);
      }).catch(() => {});
    }
  }, [id]);

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewAPI.create({ productId: id, rating: reviewRating, comment: reviewText });
      toast.success("Review submitted!");
      setReviewText("");
      setReviewRating(5);
      const { data } = await reviewAPI.getForProduct(id);
      setReviews(data.reviews);
      setAvgRating(data.averageRating);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
    setSubmitting(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isOwner = user && product.seller?._id === user._id;
  const hasReviewed = reviews.some((r) => r.reviewer?._id === user?._id);

  const conditionColors = {
    new: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "like-new": "bg-blue-50 text-blue-700 border border-blue-200",
    used: "bg-amber-50 text-amber-700 border border-amber-200",
    refurbished: "bg-violet-50 text-violet-700 border border-violet-200",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <ImageGallery images={product.images} />

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {product.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {product.category.name}
                  </span>
                )}
                {product.condition && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${conditionColors[product.condition] || "bg-gray-100 text-gray-600"}`}>
                    {product.condition}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleShare} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all">
                <FiShare2 size={16} />
              </button>
              {product.status === "sold" && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Sold</span>
              )}
            </div>
          </div>

          <p className="text-3xl font-bold text-primary-600 mt-5">
            ${product.price?.toLocaleString()}
          </p>

          {/* Rating summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar key={s} size={14} className={s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{avgRating}</span>
              <span className="text-sm text-gray-400">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            {product.location && (
              <span className="flex items-center gap-1.5"><FiMapPin size={14} /> {product.location}</span>
            )}
            <span className="flex items-center gap-1.5">
              <FiClock size={14} /> {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>

          {/* Seller Info */}
          {product.seller && (
            <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {product.seller.avatar ? (
                    <img src={product.seller.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <FiUser className="text-primary-600" size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{product.seller.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {product.seller.location && <span>{product.seller.location}</span>}
                    <span>Member since {new Date(product.seller.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <FiShield className="text-emerald-500 flex-shrink-0" size={18} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {isOwner ? (
              <div className="flex gap-3">
                <Link href={`/products/${product._id}/edit`} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <FiEdit size={16} /> Edit Product
                </Link>
                <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm flex items-center gap-2 transition-colors">
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            ) : user ? (
              <Link href={`/chat?to=${product.seller?._id}&product=${product._id}`} className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-base">
                <FiMessageSquare size={18} /> Contact Seller
              </Link>
            ) : (
              <Link href="/login" className="btn-primary w-full block text-center py-3">Login to Contact Seller</Link>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews ({reviews.length})</h2>

        {/* Submit review */}
        {user && !isOwner && !hasReviewed && (
          <form onSubmit={handleReviewSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Write a Review</h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewRating(s)} className="p-0.5">
                  <FiStar size={20} className={`transition-colors ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                </button>
              ))}
              <span className="text-sm text-gray-400 ml-2">{reviewRating}/5</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              className="input-field resize-none h-20 text-sm"
              maxLength={1000}
            />
            <div className="flex justify-end mt-3">
              <button type="submit" disabled={submitting} className="btn-primary text-sm">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FiStar size={32} className="mx-auto mb-2 opacity-30" />
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {review.reviewer?.avatar ? (
                        <img src={review.reviewer.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <span className="text-primary-700 text-sm font-semibold">{review.reviewer?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{review.reviewer?.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FiStar key={s} size={12} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                </div>
                {review.comment && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
