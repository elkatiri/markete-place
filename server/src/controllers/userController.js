const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update own profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location, bio },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "marketplace/avatars",
      transformation: [{ width: 800, height: 800, crop: "limit" }],
      resource_type: "image",
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadResult.secure_url },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Avatar upload failed. Please try a different image.",
    });
  }
};

module.exports = exports;
