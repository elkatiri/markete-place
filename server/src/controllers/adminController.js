const User = require("../models/User");
const Product = require("../models/Product");
const Message = require("../models/Message");
const Category = require("../models/Category");

// Dashboard stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalProducts, totalMessages, activeProducts, newUsersThisMonth, newProductsThisWeek] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Message.countDocuments(),
        Product.countDocuments({ status: "active" }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Product.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $project: { name: "$category.name", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // New users per day (last 7 days)
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalMessages,
        activeProducts,
        newUsersThisMonth,
        newProductsThisWeek,
        productsByCategory,
        userGrowth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, users, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Cannot delete admin users" });

    await Product.deleteMany({ seller: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User and their products deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products (admin - no status filter)
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};
    if (search) filter.$text = { $search: search };
    if (status) filter.status = status;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("seller", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, products, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manage categories
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const category = await Category.create({ name, slug, icon, description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
