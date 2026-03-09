"use client";


import Link from "next/link";
import { useState, useEffect } from "react";
import { chatAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { FiMenu, FiX, FiPlus, FiMessageSquare, FiUser, FiLogOut, FiSearch } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Unread conversations badge (fetch from API)
  const [unreadConv, setUnreadConv] = useState(0);
  useEffect(() => {
    let isMounted = true;
    async function fetchUnread() {
      try {
        const res = await chatAPI.getConversations();
        if (!isMounted) return;
        const conversations = res.data?.conversations || [];
        const count = Array.isArray(conversations)
          ? conversations.filter((c) => c.unreadCount > 0).length
          : 0;
        setUnreadConv(count);
      } catch {
        setUnreadConv(0);
      }
    }
    if (user) fetchUnread();
    // Optionally, poll every 30s for updates
    const interval = setInterval(() => {
      if (user) fetchUnread();
    }, 30000);

    // Listen for new messages via websocket
    const socket = getSocket();
    const handleReceiveMessage = () => {
      if (user) fetchUnread();
    };
    socket.on("receive-message", handleReceiveMessage);
    // Listen for refresh-unread event (triggered when messages are marked as read)
    const handleRefreshUnread = () => {
      if (user) fetchUnread();
    };
    socket.on("refresh-unread", handleRefreshUnread);

    return () => {
      isMounted = false;
      clearInterval(interval);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("refresh-unread", handleRefreshUnread);
    };
  }, [user]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold text-primary-600">Marketplace</span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form action="/" method="GET" className="w-full relative">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </form>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/products/new"
                  className="btn-primary flex items-center space-x-1"
                >
                  <FiPlus />
                  <span>Sell</span>
                </Link>
                <Link href="/chat" className="relative p-2 text-gray-600 hover:text-primary-600">
                  <FiMessageSquare size={22} />
                  {unreadConv > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center border border-white">
                      {unreadConv}
                    </span>
                  )}
                </Link>
                <Link href="/dashboard" className="p-2 text-gray-600 hover:text-primary-600">
                  <FiUser size={22} />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600"
                >
                  <FiLogOut size={22} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form action="/" method="GET" className="relative mb-3">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </form>

            {user ? (
              <>
                <Link
                  href="/products/new"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  📦 Sell Product
                </Link>
                <Link
                  href="/chat"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  💬 Messages
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  👤 Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-primary-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
