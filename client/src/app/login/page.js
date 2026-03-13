"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-primary-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8">
            <span className="text-2xl font-bold">M</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight">Welcome back to<br/>Marketplace</h2>
          <p className="text-primary-200 mt-4 text-lg leading-relaxed max-w-md">
            Sign in to manage your listings, chat with buyers, and discover amazing deals.
          </p>
          <div className="flex items-center gap-6 mt-12 text-primary-200">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Secure login</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> No ads</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Free forever</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 bg-surface-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="text-gray-400 mt-2">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
