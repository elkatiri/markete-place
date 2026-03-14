const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

function uploadAvatarBuffer(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "marketplace/avatars",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
}

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

    const existingUser = await User.findById(req.user._id).select("avatar avatarPublicId");
    const uploadResult = await uploadAvatarBuffer(req.file);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.secure_url,
        avatarPublicId: uploadResult.public_id,
      },
      { new: true }
    );

    if (existingUser?.avatarPublicId && existingUser.avatarPublicId !== uploadResult.public_id) {
      await cloudinary.uploader.destroy(existingUser.avatarPublicId, { resource_type: "image" });
    }

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
