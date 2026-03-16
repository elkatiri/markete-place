// Delete a conversation (all messages for a conversationId)
const chatSocket = require("../socket/chatSocket");
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();
    // Only allow if user is part of the conversation
    const parts = conversationId.split("_");
    if (!parts.includes(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await Message.deleteMany({ conversationId });
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.body;
    if (userIdToBlock === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    }
    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
      await user.save();
    }
    res.json({ success: true, message: "User blocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.body;
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== userIdToUnblock
    );
    await user.save();
    res.json({ success: true, message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const Message = require("../models/Message");
const Product = require("../models/Product");
const User = require("../models/User");

// Generate consistent conversation ID from two user IDs and optional product
const getConversationId = (userId1, userId2) => {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

const createPopulatedMessage = async ({ senderId, receiverId, content = "", productId, image }) => {
  const conversationId = getConversationId(senderId.toString(), receiverId.toString());

  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    product: productId || undefined,
    image,
    content: content?.trim?.() || "",
  });

  await message.populate("sender", "name avatar");
  await message.populate("receiver", "name avatar");
  await message.populate("product", "title images price");

  return { message, conversationId };
};

const ensureMessagingAllowed = async (senderId, receiverId) => {
  if (receiverId === senderId.toString()) {
    const error = new Error("Cannot message yourself");
    error.status = 400;
    throw error;
  }

  const [sender, receiver] = await Promise.all([
    User.findById(senderId),
    User.findById(receiverId),
  ]);

  if (!receiver) {
    const error = new Error("Receiver not found");
    error.status = 404;
    throw error;
  }

  if (receiver.blockedUsers.includes(senderId)) {
    const error = new Error("You are blocked by this user.");
    error.status = 403;
    throw error;
  }

  if (sender.blockedUsers.includes(receiverId)) {
    const error = new Error("You have blocked this user.");
    error.status = 400;
    throw error;
  }
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

        const [otherUser, product] = await Promise.all([
          User.findById(otherUserId).select("name avatar"),
          msg.lastMessage.product
            ? Product.findById(msg.lastMessage.product).select("title images price")
            : null,
        ]);

        return {
          conversationId: msg._id,
          lastMessage: {
            ...msg.lastMessage,
            product,
          },
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

    await ensureMessagingAllowed(req.user._id, receiverId);
    const { message, conversationId } = await createPopulatedMessage({
      senderId: req.user._id,
      receiverId,
      content,
      productId,
    });

    const io = req.app.get("io");
    if (io) {
      chatSocket.emitChatMessage(io, message);
    }

    res.status(201).json({ success: true, message, conversationId });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Send an image message
exports.sendImageMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    await ensureMessagingAllowed(req.user._id, receiverId);

    const { message, conversationId } = await createPopulatedMessage({
      senderId: req.user._id,
      receiverId,
      content,
      image: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });

    const io = req.app.get("io");
    if (io) {
      chatSocket.emitChatMessage(io, message);
    }

    res.status(201).json({ success: true, message, conversationId });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
