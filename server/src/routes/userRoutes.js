const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth } = require("../middleware/auth");
const { avatarUpload } = require("../config/cloudinary");

const handleAvatarUpload = (req, res, next) => {
	avatarUpload.single("avatar")(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		const status = error.name === "MulterError" ? 400 : error.status || 400;
		res.status(status).json({
			success: false,
			message:
				error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE"
					? "Avatar image must be smaller than 5MB"
					: error.message,
		});
	});
};

router.get("/:id", userController.getProfile);
router.put("/profile", auth, userController.updateProfile);
router.put("/avatar", auth, handleAvatarUpload, userController.updateAvatar);

module.exports = router;
