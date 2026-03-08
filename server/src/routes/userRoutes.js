const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.get("/:id", userController.getProfile);
router.put("/profile", auth, userController.updateProfile);
router.put("/avatar", auth, upload.single("avatar"), userController.updateAvatar);

module.exports = router;
