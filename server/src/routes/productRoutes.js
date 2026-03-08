const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { auth } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.get("/", productController.getProducts);
router.get("/mine", auth, productController.getMyProducts);
router.get("/:id", productController.getProduct);
router.post("/", auth, upload.array("images", 5), productController.createProduct);
router.put("/:id", auth, upload.array("images", 5), productController.updateProduct);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
