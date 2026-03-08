const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { auth } = require("../middleware/auth");

router.get("/conversations", auth, chatController.getConversations);
router.get("/messages/:conversationId", auth, chatController.getMessages);
router.post("/send", auth, chatController.sendMessage);

module.exports = router;
