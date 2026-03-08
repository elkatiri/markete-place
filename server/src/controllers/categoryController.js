const Category = require("../models/Category");

// Get all categories
exports.getCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({ name, icon, description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed default categories
exports.seedCategories = async (_req, res) => {
  try {
    const defaults = [
      { name: "Electronics", icon: "💻", description: "Phones, laptops, gadgets" },
      { name: "Vehicles", icon: "🚗", description: "Cars, motorcycles, bikes" },
      { name: "Fashion", icon: "👕", description: "Clothing, shoes, accessories" },
      { name: "Home & Garden", icon: "🏠", description: "Furniture, decor, tools" },
      { name: "Sports", icon: "⚽", description: "Equipment, gear, fitness" },
      { name: "Books", icon: "📚", description: "Books, magazines, textbooks" },
      { name: "Toys & Games", icon: "🎮", description: "Games, toys, hobbies" },
      { name: "Services", icon: "🔧", description: "Freelance, repair, tutoring" },
      { name: "Other", icon: "📦", description: "Everything else" },
    ];

    for (const cat of defaults) {
      await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
    }

    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, message: "Categories seeded", categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
