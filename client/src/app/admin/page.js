"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminAPI, categoryAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  FiUsers, FiPackage, FiMessageSquare, FiTrendingUp,
  FiTrash2, FiSearch, FiChevronLeft, FiChevronRight,
  FiPlus, FiTag, FiActivity
} from "react-icons/fi";

const TABS = [
  { key: "overview", label: "Overview", icon: FiActivity },
  { key: "users", label: "Users", icon: FiUsers },
  { key: "products", label: "Products", icon: FiPackage },
  { key: "categories", label: "Categories", icon: FiTag },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
      toast.error("Admin access required");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your marketplace platform</p>
        </div>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && <OverviewPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "categories" && <CategoriesPanel />}
      </div>
    </div>
  );
}

function OverviewPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(({ data }) => setStats(data.stats)).catch(() => toast.error("Failed to load stats")).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCards count={4} />;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: FiUsers, color: "blue", sub: `+${stats.newUsersThisMonth} this month` },
    { label: "Total Products", value: stats.totalProducts, icon: FiPackage, color: "emerald", sub: `${stats.activeProducts} active` },
    { label: "Messages", value: stats.totalMessages, icon: FiMessageSquare, color: "violet", sub: "All time" },
    { label: "New This Week", value: stats.newProductsThisWeek, icon: FiTrendingUp, color: "amber", sub: "Products listed" },
  ];

  const colorMap = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}><Icon size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Products by Category</h3>
        <div className="space-y-3">
          {stats.productsByCategory.map((cat, i) => {
            const max = stats.productsByCategory[0]?.count || 1;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32 truncate">{cat.name || "Uncategorized"}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${(cat.count / max) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{cat.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.userGrowth.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Users (Last 7 Days)</h3>
          <div className="flex items-end gap-2 h-32">
            {stats.userGrowth.map((day, i) => {
              const max = Math.max(...stats.userGrowth.map((d) => d.count)) || 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-600">{day.count}</span>
                  <div className="w-full bg-primary-200 rounded-t-md" style={{ height: `${(day.count / max) * 80}px`, minHeight: "4px" }} />
                  <span className="text-[10px] text-gray-400">{day._id.slice(-2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, search, limit: 15 });
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch { toast.error("Failed to load users"); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.updateUserRole(id, role);
      toast.success("Role updated");
      fetchUsers();
    } catch { toast.error("Failed to update role"); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}" and all their products?`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h3 className="font-semibold text-gray-900">Users</h3>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-8 text-sm !py-2" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan="5" className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "admin" && (
                      <button onClick={() => handleDelete(u._id, u.name)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-icon"><FiChevronLeft size={16} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-icon"><FiChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getProducts({ page, search, status: statusFilter, limit: 15 });
      setProducts(data.products);
      setTotalPages(data.pages);
    } catch { toast.error("Failed to load products"); }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete product "${title}"?`)) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h3 className="font-semibold text-gray-900">Products</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field text-sm !py-2 w-32">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
          <div className="relative flex-1 sm:w-52">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-8 text-sm !py-2" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Seller</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Listed</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan="6" className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.images?.[0] ? (
                        <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📦</div>
                      )}
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.seller?.name || "N/A"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">${p.price?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "active" ? "bg-green-100 text-green-700" : p.status === "sold" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(p._id, p.title)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-icon"><FiChevronLeft size={16} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-icon"><FiChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "", description: "" });

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.categories || []);
    } catch { toast.error("Failed to load categories"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await adminAPI.createCategory(newCat);
      toast.success("Category created");
      setNewCat({ name: "", icon: "", description: "" });
      setShowAdd(false);
      fetchCategories();
    } catch { toast.error("Failed to create category"); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await adminAPI.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Categories</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm flex items-center gap-1.5">
          <FiPlus size={14} /> Add Category
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="input-field text-sm flex-1" required />
          <input type="text" placeholder="Icon (emoji)" value={newCat.icon} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} className="input-field text-sm w-24" />
          <input type="text" placeholder="Description" value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} className="input-field text-sm flex-1" />
          <button type="submit" className="btn-primary text-sm whitespace-nowrap">Create</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No categories. Add one above.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon || "📁"}</span>
                  <div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(cat._id, cat.name)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex justify-between mb-3"><div className="h-4 w-24 bg-gray-100 rounded" /><div className="h-9 w-9 bg-gray-100 rounded-lg" /></div>
          <div className="h-7 w-16 bg-gray-100 rounded mt-2" />
          <div className="h-3 w-20 bg-gray-100 rounded mt-3" />
        </div>
      ))}
    </div>
  );
}
