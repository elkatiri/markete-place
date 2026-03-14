"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productAPI, userAPI, chatAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiMessageSquare,
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiCamera,
  FiMapPin,
  FiPhone,
  FiMail,
  FiArrowUpRight,
  FiArrowRight,
  FiActivity,
  FiEye,
  FiShoppingBag,
  FiBarChart2,
  FiGrid,
  FiSettings,
  FiStar,
} from "react-icons/fi";

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 800;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ─── Mini Sparkline Bar Chart ─── */
function MiniChart({ data, color = "bg-primary-500" }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className={`${color} rounded-sm w-[6px] transition-all duration-500 opacity-70`}
          style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setProfile({
        name: user.name || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const [prodRes, chatRes] = await Promise.all([
        productAPI.getMine(),
        chatAPI.getConversations(),
      ]);
      setProducts(prodRes.data.products);
      setConversations(chatRes.data.conversations);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Derived Stats ─── */
  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === "active");
    const sold = products.filter((p) => p.status === "sold");
    const totalValue = active.reduce((s, p) => s + (p.price || 0), 0);
    const soldValue = sold.reduce((s, p) => s + (p.price || 0), 0);
    const unreadMessages = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

    // Build a 7-element sparkline showing listings per "bucket"
    const sorted = [...products].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    const spark = Array(7).fill(0);
    if (sorted.length > 0) {
      const oldest = new Date(sorted[0].createdAt).getTime();
      const newest = Date.now();
      const range = newest - oldest || 1;
      sorted.forEach((p) => {
        const idx = Math.min(
          6,
          Math.floor(((new Date(p.createdAt).getTime() - oldest) / range) * 7)
        );
        spark[idx]++;
      });
    }

    return {
      total: products.length,
      active: active.length,
      sold: sold.length,
      totalValue,
      soldValue,
      conversations: conversations.length,
      unreadMessages,
      spark,
    };
  }, [products, conversations]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productAPI.delete(id);
      setProducts(products.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(profile);
      setUser(data.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await userAPI.updateAvatar(formData);
      setUser(data.user);
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      e.target.value = "";
      setAvatarUploading(false);
    }
  };

  if (authLoading) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "products", label: "Listings", icon: FiPackage },
    { id: "profile", label: "Profile", icon: FiSettings },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  /* ─── Skeleton loader ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-32 rounded-3xl bg-gray-100 animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Header ─── */}
        <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-5 shadow-premium sm:p-8">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-primary-700" />
              </div>
              <div>
                <p className="text-primary-200 text-sm font-medium">{greeting()}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {user?.name || "User"}
                </h1>
                {user?.location && (
                  <p className="text-primary-200 text-sm flex items-center gap-1 mt-0.5">
                    <FiMapPin size={12} /> {user.location}
                  </p>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20 backdrop-blur-sm"
              >
                <FiMessageSquare size={16} />
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                    {stats.unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/products/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 transition-all hover:shadow-lg hover:shadow-white/20 active:scale-[0.97]"
              >
                <FiPlus size={16} />
                New Listing
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="hide-scrollbar mb-8 flex w-full gap-1 overflow-x-auto rounded-2xl bg-gray-100/80 p-1 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-5 ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Total Listings */}
              <div className="group card-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                      <FiPackage className="text-primary-600" size={20} />
                    </div>
                    <MiniChart data={stats.spark} color="bg-primary-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Total Listings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    <AnimatedNumber value={stats.total} />
                  </p>
                </div>
              </div>

              {/* Active */}
              <div className="group card-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <FiActivity className="text-emerald-600" size={20} />
                    </div>
                    <span className="badge-success">Live</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Active Now</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    <AnimatedNumber value={stats.active} />
                  </p>
                </div>
              </div>

              {/* Sold */}
              <div className="group card-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                      <FiCheckCircle className="text-amber-600" size={20} />
                    </div>
                    {stats.total > 0 && (
                      <span className="text-xs text-gray-400 font-medium">
                        {Math.round((stats.sold / stats.total) * 100)}% rate
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Sold Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    <AnimatedNumber value={stats.sold} />
                  </p>
                </div>
              </div>

              {/* Portfolio Value */}
              <div className="group card-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                      <FiDollarSign className="text-violet-600" size={20} />
                    </div>
                    <FiTrendingUp className="text-emerald-500" size={18} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Portfolio Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    <AnimatedNumber value={stats.totalValue} prefix="$" />
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Products – 2 cols */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Listings</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Your latest products</p>
                  </div>
                  <button
                    onClick={() => setTab("products")}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                  >
                    View all <FiArrowRight size={14} />
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <FiPackage size={28} className="text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-700">No listings yet</h3>
                    <p className="text-sm text-gray-400 mt-1">Create your first listing to get started</p>
                    <Link href="/products/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
                      <FiPlus size={14} /> Create Listing
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product, i) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-200/50">
                          {product.images?.[0] ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiCamera className="text-gray-300" size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm truncate group-hover:text-primary-600 transition-colors">
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-primary-600 text-sm">
                              ${product.price?.toLocaleString()}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                product.status === "active"
                                  ? "text-emerald-600"
                                  : product.status === "sold"
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                product.status === "active"
                                  ? "bg-emerald-500"
                                  : product.status === "sold"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`} />
                              {product.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/products/${product._id}`}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <FiExternalLink size={15} />
                          </Link>
                          <Link
                            href={`/products/${product._id}/edit`}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <FiEdit size={15} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FiMessageSquare className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Conversations</p>
                          <p className="text-xs text-gray-400">Total chats</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.conversations}</span>
                    </div>
                    <div className="w-full h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                          <FiMail className="text-red-500" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Unread</p>
                          <p className="text-xs text-gray-400">New messages</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${stats.unreadMessages > 0 ? "text-red-500" : "text-gray-900"}`}>
                        {stats.unreadMessages}
                      </span>
                    </div>
                    <div className="w-full h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <FiDollarSign className="text-emerald-600" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Revenue</p>
                          <p className="text-xs text-gray-400">From sold items</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">${stats.soldValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Conversations */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Recent Chats</h3>
                    <Link href="/chat" className="text-xs text-primary-600 font-semibold hover:text-primary-700">
                      View all
                    </Link>
                  </div>
                  {conversations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No conversations yet</p>
                  ) : (
                    <div className="space-y-3">
                      {conversations.slice(0, 4).map((conv) => (
                        <Link
                          key={conv.conversationId}
                          href="/chat"
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 flex-shrink-0">
                            {conv.otherUser?.avatar ? (
                              <img src={conv.otherUser.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              conv.otherUser?.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {conv.otherUser?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {conv.lastMessage?.content || "No messages"}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/products/new"
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
                    >
                      <FiPlus className="text-primary-600 group-hover:scale-110 transition-transform" size={20} />
                      <span className="text-xs font-semibold text-primary-700">New Listing</span>
                    </Link>
                    <Link
                      href="/chat"
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                    >
                      <FiMessageSquare className="text-blue-600 group-hover:scale-110 transition-transform" size={20} />
                      <span className="text-xs font-semibold text-blue-700">Messages</span>
                    </Link>
                    <button
                      onClick={() => setTab("products")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                    >
                      <FiPackage className="text-emerald-600 group-hover:scale-110 transition-transform" size={20} />
                      <span className="text-xs font-semibold text-emerald-700">Listings</span>
                    </button>
                    <button
                      onClick={() => setTab("profile")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group"
                    >
                      <FiSettings className="text-violet-600 group-hover:scale-110 transition-transform" size={20} />
                      <span className="text-xs font-semibold text-violet-700">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            LISTINGS TAB
        ════════════════════════════════════════════════════ */}
        {tab === "products" && (
          <div className="animate-fade-in">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Listings</h2>
                <p className="text-sm text-gray-400">{products.length} total products</p>
              </div>
              <Link href="/products/new" className="btn-primary flex items-center gap-2 text-sm">
                <FiPlus size={15} /> Add Product
              </Link>
            </div>

            {/* Status Filters */}
            <div className="flex gap-3 mb-6">
              {[
                { label: "All", count: stats.total },
                { label: "Active", count: stats.active },
                { label: "Sold", count: stats.sold },
              ].map((f) => (
                <span key={f.label} className="badge-neutral">
                  {f.label} <span className="ml-1.5 text-gray-900 font-bold">{f.count}</span>
                </span>
              ))}
            </div>

            {products.length === 0 ? (
              <div className="card text-center py-20">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mb-5">
                  <FiShoppingBag size={32} className="text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">No products yet</h3>
                <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                  Start selling by creating your first listing. It only takes a minute.
                </p>
                <Link href="/products/new" className="btn-primary inline-flex items-center gap-2 mt-6">
                  <FiPlus size={16} /> Create First Listing
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product, i) => (
                  <div
                    key={product._id}
                    className="card-hover flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-200/60">
                      {product.images?.[0] ? (
                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiCamera className="text-gray-300" size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{product.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-lg font-bold text-primary-600">
                              ${product.price?.toLocaleString()}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                                product.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : product.status === "sold"
                                  ? "bg-red-50 text-red-600 border border-red-100"
                                  : "bg-gray-50 text-gray-500 border border-gray-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                product.status === "active"
                                  ? "bg-emerald-500"
                                  : product.status === "sold"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`} />
                              {product.status}
                            </span>
                            {product.category?.name && (
                              <span className="badge-neutral text-xs">{product.category.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {product.location && (
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <FiMapPin size={11} /> {product.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 sm:flex-col sm:gap-1">
                      <Link
                        href={`/products/${product._id}`}
                        className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="View"
                      >
                        <FiEye size={17} />
                      </Link>
                      <Link
                        href={`/products/${product._id}/edit`}
                        className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Edit"
                      >
                        <FiEdit size={17} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            PROFILE TAB
        ════════════════════════════════════════════════════ */}
        {tab === "profile" && (
          <div className="animate-fade-in grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Profile Card */}
            <div className="card p-6 text-center sm:p-8">
              <div className="relative inline-block">
                <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden ring-4 ring-white shadow-lg flex items-center justify-center text-4xl font-bold text-primary-600">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                  <FiCamera size={16} />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={avatarUploading}
                  />
                </label>
              </div>
              {avatarUploading && (
                <p className="text-xs text-primary-600 mt-3 animate-pulse">Uploading...</p>
              )}
              <h2 className="text-xl font-bold text-gray-900 mt-5">{user?.name}</h2>
              <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
              {user?.location && (
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-2">
                  <FiMapPin size={13} /> {user.location}
                </p>
              )}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Listings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.sold}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sold</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.conversations}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Chats</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="card p-6 sm:p-8 lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-sm text-gray-400 mt-1">Update your personal information</p>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input-field"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="input-field pl-10"
                      placeholder="City, State"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="input-field h-28 resize-none"
                    placeholder="Tell buyers about yourself..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{profile.bio.length}/500</p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary px-8">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
