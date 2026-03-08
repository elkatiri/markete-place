const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

router.get("/", categoryController.getCategories);
router.post("/", categoryController.createCategory);
router.post("/seed", categoryController.seedCategories);

module.exports = router;
