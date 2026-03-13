import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Products
export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getMine: () => api.get("/products/mine"),
  create: (formData) =>
    api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/products/${id}`),
};

// Chat
export const chatAPI = {
  getConversations: () => api.get("/chat/conversations"),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (data) => api.post("/chat/send", data),
  deleteConversation: (conversationId) => api.delete(`/chat/conversation/${conversationId}`),
  blockUser: (userIdToBlock) => api.post("/chat/block", { userIdToBlock }),
  unblockUser: (userIdToUnblock) => api.post("/chat/unblock", { userIdToUnblock }),
};

// Categories
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  seed: () => api.post("/categories/seed"),
};

// Users
export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put("/users/profile", data),
  updateAvatar: (formData) =>
    api.put("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Admin
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getProducts: (params) => api.get("/admin/products", { params }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  createCategory: (data) => api.post("/admin/categories", data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

// Reviews
export const reviewAPI = {
  create: (data) => api.post("/reviews", data),
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  getForSeller: (sellerId) => api.get(`/reviews/seller/${sellerId}`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default api;
