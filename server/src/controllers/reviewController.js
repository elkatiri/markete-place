const Review = require("../models/Review");
const Product = require("../models/Product");

// Create or update a review
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot review your own product" });
    }

    const review = await Review.findOneAndUpdate(
      { product: productId, reviewer: req.user._id },
      { rating, comment, seller: product.seller },
      { new: true, upsert: true, runValidators: true }
    );
    await review.populate("reviewer", "name avatar");

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });

    const avg =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    res.json({ success: true, reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a seller
exports.getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate("reviewer", "name avatar")
      .populate("product", "title images")
      .sort({ createdAt: -1 });

    const avg =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    res.json({ success: true, reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
