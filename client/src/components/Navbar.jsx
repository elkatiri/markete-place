"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { chatAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import {
  FiMenu, FiX, FiPlus, FiMessageSquare, FiUser, FiLogOut,
  FiSearch, FiGrid, FiSettings, FiShield, FiChevronDown,
  FiHome, FiBell, FiPackage, FiHeart,
} from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-primary-500/20 transition-all">
              <FiPackage className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent hidden sm:block">
              Marketplace
            </span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form action="/" method="GET" className="w-full relative group">
              <div className={`absolute inset-0 rounded-xl bg-primary-500/5 transition-all duration-300 ${searchFocused ? "scale-105 opacity-100" : "scale-100 opacity-0"}`} />
              <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? "text-primary-500" : "text-gray-400"}`} size={16} />
              <input
                type="text"
                name="search"
                placeholder="Search products, categories, sellers..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all text-sm placeholder:text-gray-400"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-md border border-gray-200">
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
                <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn-icon">
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-3 animate-slide-down">
            <form action="/" method="GET" className="relative mb-4">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" name="search" placeholder="Search products..." className="input-field pl-10" />
            </form>

            {user ? (
              <div className="space-y-1">
                {/* User card */}
                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                <Link href="/" className="dropdown-item rounded-xl"><FiHome size={16} /> Home</Link>
                <Link href="/products/new" className="dropdown-item rounded-xl"><FiPlus size={16} /> Sell Product</Link>
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
                <Link href="/login" className="btn-secondary text-center text-sm">Sign In</Link>
                <Link href="/register" className="btn-primary text-center text-sm">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
;

