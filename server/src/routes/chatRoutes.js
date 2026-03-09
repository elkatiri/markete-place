const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { auth } = require("../middleware/auth");


router.get("/conversations", auth, chatController.getConversations);
router.get("/messages/:conversationId", auth, chatController.getMessages);
router.post("/send", auth, chatController.sendMessage);
router.delete("/conversation/:conversationId", auth, chatController.deleteConversation);
router.post("/block", auth, chatController.blockUser);
router.post("/unblock", auth, chatController.unblockUser);

module.exports = router;
