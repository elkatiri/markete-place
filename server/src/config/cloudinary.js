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

const allowedAvatarExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"];

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const lowerName = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedAvatarExtensions.some((ext) => lowerName.endsWith(ext));
    const isImageMimeType = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");

    if (!isImageMimeType && !hasAllowedExtension) {
      cb(new Error("Please upload a valid image file"));
      return;
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, upload, avatarUpload };
