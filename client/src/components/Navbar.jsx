"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { chatAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { FAVORITES_UPDATED_EVENT, getFavoriteIds } from "@/lib/favorites";
import {
  FiMenu, FiX, FiPlus, FiMessageSquare, FiUser, FiLogOut,
  FiSearch, FiGrid, FiShield, FiChevronDown,
  FiHome, FiBell, FiHeart,
} from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const avatarRef = useRef(null);

  // Unread conversations badge
  const [unreadConv, setUnreadConv] = useState(0);
  useEffect(() => {
    let isMounted = true;
    async function fetchUnread() {
      try {
        const res = await chatAPI.getConversations();
        if (!isMounted) return;
        const conversations = res.data?.conversations || [];
        setUnreadConv(Array.isArray(conversations) ? conversations.filter((c) => c.unreadCount > 0).length : 0);
      } catch { setUnreadConv(0); }
    }
    if (user) fetchUnread();
    const interval = setInterval(() => { if (user) fetchUnread(); }, 30000);
    const socket = getSocket();
    const handler = () => { if (user) fetchUnread(); };
    socket.on("receive-message", handler);
    socket.on("refresh-unread", handler);
    return () => { isMounted = false; clearInterval(interval); socket.off("receive-message", handler); socket.off("refresh-unread", handler); };
  }, [user]);

  // Close avatar menu on outside click
  useEffect(() => {
    const handleClick = (e) => { if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarMenuOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setAvatarMenuOpen(false); }, [pathname]);

  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const syncFavoriteCount = () => {
      setFavoriteCount(getFavoriteIds().length);
    };

    syncFavoriteCount();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteCount);
    window.addEventListener("storage", syncFavoriteCount);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteCount);
      window.removeEventListener("storage", syncFavoriteCount);
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();

    const params = pathname === "/" ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      params.set("search", trimmedQuery);
    } else {
      params.delete("search");
    }

    const nextUrl = params.toString() ? `/?${params.toString()}` : "/";
    router.push(nextUrl);
  };

  const isActive = (path) => pathname === path;
  const isSectionActive = (path) => pathname === path || pathname.startsWith(`${path}/`);
  const mobileNavItems = [
    { href: "/", label: "Home", icon: FiHome, active: pathname === "/" },
    { href: user ? "/chat" : "/login", label: "Chats", icon: FiMessageSquare, active: isSectionActive("/chat"), badge: unreadConv > 0 ? unreadConv : null },
    { href: user ? "/products/new" : "/login", label: "Sell", icon: FiPlus, active: isSectionActive("/products/new"), primary: true },
    { href: user ? "/dashboard" : "/login", label: user ? "Profile" : "Account", icon: FiUser, active: isSectionActive("/dashboard") || isSectionActive("/login") || isSectionActive("/register") },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between gap-3 md:h-16">
          {/* Logo */}
          <Link href="/" className="group flex flex-shrink-0 items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm transition-all group-hover:shadow-md group-hover:shadow-primary-500/20">
            <span className="text-lg font-bold text-white">M</span>
            </div>
            <div className="flex flex-col">
              
              <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-xl font-bold text-transparent sm:block md:inline-block">
              Marketplace
              </span>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={submitSearch} className="w-full relative group">
              <div className={`pointer-events-none absolute inset-0 rounded-xl bg-primary-500/5 transition-all duration-300 ${searchFocused ? "scale-105 opacity-100" : "scale-100 opacity-0"}`} />
              <FiSearch className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 transition-colors ${searchFocused ? "text-primary-500" : "text-gray-400"}`} size={16} />
              <input
                type="text"
                name="search"
                placeholder="Search products, categories, sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="relative z-10 w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all text-sm placeholder:text-gray-400"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-md border border-gray-200">
                ⌘K
              </kbd>
            </form>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* Nav links */}
                <Link href="/" className={`btn-icon ${isActive("/") ? "text-primary-600 bg-primary-50" : ""}`} title="Home">
                  <FiHome size={20} />
                </Link>

                <Link href="/products/new" className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
                  <FiPlus size={15} />
                  <span>Sell</span>
                </Link>

                <Link href="/favorites" className={`btn-icon relative ${isSectionActive("/favorites") ? "text-primary-600 bg-primary-50" : ""}`} title="Favorites">
                  <FiHeart size={20} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                      {favoriteCount > 99 ? "99+" : favoriteCount}
                    </span>
                  )}
                </Link>

                {/* Messages */}
                <Link href="/chat" className={`btn-icon relative ${isActive("/chat") ? "text-primary-600 bg-primary-50" : ""}`} title="Messages">
                  <FiMessageSquare size={20} />
                  {unreadConv > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white animate-bounce-in">
                      {unreadConv}
                    </span>
                  )}
                </Link>

                {/* Notifications bell */}
                <button className="btn-icon relative" title="Notifications">
                  <FiBell size={20} />
                </button>

                {/* Avatar dropdown */}
                <div className="relative ml-1" ref={avatarRef}>
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-white shadow-sm">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <FiChevronDown size={14} className={`text-gray-400 transition-transform ${avatarMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {avatarMenuOpen && (
                    <div className="dropdown-menu">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        {user.role === "admin" && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            <FiShield size={10} /> ADMIN
                          </span>
                        )}
                      </div>

                      <Link href="/dashboard" className="dropdown-item" onClick={() => setAvatarMenuOpen(false)}>
                        <FiGrid size={16} /> Dashboard
                      </Link>
                      <Link href="/dashboard" className="dropdown-item" onClick={() => { setAvatarMenuOpen(false); }}>
                        <FiUser size={16} /> My Profile
                      </Link>
                      <Link href="/chat" className="dropdown-item" onClick={() => setAvatarMenuOpen(false)}>
                        <FiMessageSquare size={16} /> Messages
                        {unreadConv > 0 && <span className="ml-auto badge-danger text-[10px]">{unreadConv}</span>}
                      </Link>
                      <Link href="/favorites" className="dropdown-item" onClick={() => setAvatarMenuOpen(false)}>
                        <FiHeart size={16} /> Favorites
                      </Link>

                      {user.role === "admin" && (
                        <>
                          <div className="dropdown-divider" />
                          <Link href="/admin" className="dropdown-item text-amber-700" onClick={() => setAvatarMenuOpen(false)}>
                            <FiShield size={16} /> Admin Panel
                          </Link>
                        </>
                      )}

                      <div className="dropdown-divider" />
                      <button
                        onClick={() => { logout(); setAvatarMenuOpen(false); }}
                        className="dropdown-item text-red-600 w-full"
                      >
                        <FiLogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/favorites" className={`btn-icon relative ${isSectionActive("/favorites") ? "text-primary-600 bg-primary-50" : ""}`} title="Favorites">
                  <FiHeart size={20} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                      {favoriteCount > 99 ? "99+" : favoriteCount}
                    </span>
                  )}
                </Link>
                <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>

            <div className="flex items-center gap-2 md:hidden">
              {user && (
                <Link href="/chat" className={`relative btn-icon ${isSectionActive("/chat") ? "bg-primary-50 text-primary-600" : ""}`}>
                  <FiMessageSquare size={20} />
                  {unreadConv > 0 && <span className="notification-dot" />}
                </Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="btn-icon bg-white/70 shadow-sm shadow-slate-900/5">
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="animate-slide-down border-t border-gray-100 pb-4 pt-3 md:hidden">
              <div className="mobile-card overflow-hidden p-3">
                <form onSubmit={submitSearch} className="relative mb-4">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="input-field pl-10"
                  />
                </form>

                {user ? (
                  <div className="space-y-1">
                {/* User card */}
                    <div className="mb-3 flex items-center gap-3 rounded-[1.25rem] bg-surface-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                    {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    <Link href="/" className="dropdown-item rounded-xl"><FiHome size={16} /> Home</Link>
                    <Link href="/products/new" className="dropdown-item rounded-xl"><FiPlus size={16} /> Sell Product</Link>
                    <Link href="/favorites" className="dropdown-item rounded-xl"><FiHeart size={16} /> Favorites</Link>
                    <Link href="/chat" className="dropdown-item rounded-xl">
                      <FiMessageSquare size={16} /> Messages
                      {unreadConv > 0 && <span className="ml-auto badge-danger text-[10px]">{unreadConv}</span>}
                    </Link>
                    <Link href="/dashboard" className="dropdown-item rounded-xl"><FiGrid size={16} /> Dashboard</Link>
                    {user.role === "admin" && (
                      <Link href="/admin" className="dropdown-item rounded-xl text-amber-700"><FiShield size={16} /> Admin Panel</Link>
                    )}
                    <div className="divider my-2" />
                    <button onClick={logout} className="dropdown-item rounded-xl text-red-600 w-full">
                      <FiLogOut size={16} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/favorites" className="btn-secondary text-center text-sm col-span-2">Favorites</Link>
                    <Link href="/login" className="btn-secondary text-center text-sm">Sign In</Link>
                    <Link href="/register" className="btn-primary text-center text-sm">Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav__inner">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  item.primary
                    ? "-mt-6 mx-1 rounded-[1.4rem] bg-primary-600 px-4 py-3 text-white shadow-lg shadow-primary-600/30"
                    : item.active
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-400"
                }`}
              >
                <Icon size={item.primary ? 20 : 18} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-3 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

