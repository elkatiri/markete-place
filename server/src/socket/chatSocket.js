const Message = require("../models/Message");

const onlineUsers = new Map();

const emitChatMessage = (io, message) => {
  io.to(message.conversationId).emit("receive-message", message);

  const receiverId = message.receiver?._id?.toString?.() || message.receiver?.toString?.();
  if (!receiverId) {
    return;
  }

  const receiverSocketIds = onlineUsers.get(receiverId);
  if (receiverSocketIds?.size) {
    receiverSocketIds.forEach((receiverSocketId) => {
      io.to(receiverSocketId).emit("new-message-notification", {
        conversationId: message.conversationId,
        message,
      });
    });
  }
};

const setupChatSocket = (io) => {
  // Track online users
  const broadcastOnlineUsers = () => {
    io.emit("online-users", Array.from(onlineUsers.keys()));
  };

  const markUserOnline = (userId, socketId) => {
    if (!userId) {
      return;
    }

    const activeSockets = onlineUsers.get(userId) || new Set();
    activeSockets.add(socketId);
    onlineUsers.set(userId, activeSockets);
  };

  const markUserOffline = (userId, socketId) => {
    if (!userId || !onlineUsers.has(userId)) {
      return;
    }

    const activeSockets = onlineUsers.get(userId);
    activeSockets.delete(socketId);

    if (activeSockets.size === 0) {
      onlineUsers.delete(userId);
      return;
    }

    onlineUsers.set(userId, activeSockets);
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User comes online
    socket.on("user-online", (userId) => {
      socket.data.userId = userId;
      markUserOnline(userId, socket.id);
      broadcastOnlineUsers();
    });

    // Join a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
    });

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // Send message
    socket.on("send-message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        // Generate conversationId from user IDs only
        const sorted = [senderId, receiverId].sort();
        const conversationId = `${sorted[0]}_${sorted[1]}`;
        // Block check
        const User = require("../models/User");
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (receiver.blockedUsers.includes(senderId)) {
          socket.emit("message-error", { error: "You are blocked by this user." });
          return;
        }
        if (sender.blockedUsers.includes(receiverId)) {
          socket.emit("message-error", { error: "You have blocked this user." });
          return;
        }
        // Save to database
        const message = await Message.create({
          conversationId,
          sender: senderId,
          receiver: receiverId,
          content,
        });

        await message.populate("sender", "name avatar");
        await message.populate("receiver", "name avatar");

        emitChatMessage(io, message);
      } catch (error) {
        socket.emit("message-error", { error: error.message });
      }
    });

    // Mark messages as read
    socket.on("mark-read", async ({ conversationId, userId }) => {
      await Message.updateMany(
        { conversationId, receiver: userId, read: false },
        { read: true }
      );
      io.to(conversationId).emit("messages-read", { conversationId, userId });
    });

    // Typing indicator
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("stop-typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-stop-typing", { conversationId, userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      markUserOffline(socket.data.userId, socket.id);
      broadcastOnlineUsers();
      console.log("User disconnected:", socket.id);
    });
  });
};

setupChatSocket.emitChatMessage = emitChatMessage;

module.exports = setupChatSocket;
