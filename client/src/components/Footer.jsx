"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-gray-900">Marketplace</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Buy and sell products locally. Safe, secure, and free to use.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Browse</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">All Products</Link></li>
              <li><Link href="/products/new" className="hover:text-primary-600 transition-colors">Sell Something</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary-600 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/login" className="hover:text-primary-600 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-primary-600 transition-colors">Create Account</Link></li>
              <li><Link href="/chat" className="hover:text-primary-600 transition-colors">Messages</Link></li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Secure messaging
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Verified sellers
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> User reviews
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Built with Next.js</span>
            <span>&middot;</span>
            <span>MongoDB</span>
            <span>&middot;</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
