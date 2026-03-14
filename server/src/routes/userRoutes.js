const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth } = require("../middleware/auth");
const { avatarUpload } = require("../config/cloudinary");

router.get("/:id", userController.getProfile);
router.put("/profile", auth, userController.updateProfile);
router.put("/avatar", auth, avatarUpload.single("avatar"), userController.updateAvatar);

module.exports = router;
