const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketplace",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const upload = multer({ storage });

const allowedAvatarExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const allowedAvatarMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const lowerName = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedAvatarExtensions.some((ext) => lowerName.endsWith(ext));
    const hasAllowedMimeType = allowedAvatarMimeTypes.includes(file.mimetype);

    if (!hasAllowedMimeType && !hasAllowedExtension) {
      const error = new Error("Please upload a JPG, PNG, WEBP, GIF, or AVIF image");
      error.status = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, upload, avatarUpload };
