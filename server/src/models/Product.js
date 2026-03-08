const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    location: {
      type: String,
      default: "",
    },
    condition: {
      type: String,
      enum: ["new", "like-new", "used", "refurbished"],
      default: "used",
    },
    status: {
      type: String,
      enum: ["active", "sold", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
