"use client";

import { useState } from "react";

const TABS = [
  { key: "users", label: "Users" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "moderation", label: "Moderation" },
  { key: "settings", label: "Settings" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-t font-semibold ${tab === t.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6 min-h-[300px]">
        {tab === "users" && <UsersPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "categories" && <CategoriesPanel />}
        {tab === "reports" && <ReportsPanel />}
        {tab === "moderation" && <ModerationPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

function UsersPanel() {
  return <div>Users management (view, edit, delete, assign roles)</div>;
}
function ProductsPanel() {
  return <div>Products management (approve, edit, remove)</div>;
}
function CategoriesPanel() {
  return <div>Categories management (add, edit, delete)</div>;
}
function ReportsPanel() {
  return <div>Reports & analytics (stats, charts, etc.)</div>;
}
function ModerationPanel() {
  return <div>Moderation tools (review reports, manage content)</div>;
}
function SettingsPanel() {
  return <div>Platform settings (site info, payment, etc.)</div>;
}
