const Message = require("../models/Message");
const User = require("../models/User");

// Generate consistent conversation ID from two user IDs and optional product
const getConversationId = (userId1, userId2, productId) => {
  const sorted = [userId1, userId2].sort();
  return productId ? `${sorted[0]}_${sorted[1]}_${productId}` : `${sorted[0]}_${sorted[1]}`;
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get distinct conversations
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$read", false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // Populate user details
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        const otherUserId =
          msg.lastMessage.sender.toString() === userId.toString()
            ? msg.lastMessage.receiver
            : msg.lastMessage.sender;

        const otherUser = await User.findById(otherUserId).select("name avatar");

        return {
          conversationId: msg._id,
          lastMessage: msg.lastMessage,
          unreadCount: msg.unreadCount,
          otherUser,
        };
      })
    );

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    // Verify user is part of this conversation
    const parts = conversationId.split("_");
    if (!parts.includes(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .populate("product", "title images price")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, productId } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    const conversationId = getConversationId(req.user._id.toString(), receiverId, productId);

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      product: productId || undefined,
      content,
    });

    await message.populate("sender", "name avatar");
    await message.populate("receiver", "name avatar");

    res.status(201).json({ success: true, message, conversationId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
