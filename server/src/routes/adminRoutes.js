const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { auth, admin } = require("../middleware/auth");

// All routes require auth + admin
router.use(auth, admin);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);
router.get("/products", adminController.getProducts);
router.delete("/products/:id", adminController.deleteProduct);
router.post("/categories", adminController.createCategory);
router.delete("/categories/:id", adminController.deleteCategory);

module.exports = router;
