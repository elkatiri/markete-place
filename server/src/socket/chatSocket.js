const Message = require("../models/Message");

const setupChatSocket = (io) => {
  // Track online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User comes online
    socket.on("user-online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online-users", Array.from(onlineUsers.keys()));
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
        const { conversationId, senderId, receiverId, content, productId } = data;

        // Save to database
        const message = await Message.create({
          conversationId,
          sender: senderId,
          receiver: receiverId,
          product: productId || undefined,
          content,
        });

        await message.populate("sender", "name avatar");
        await message.populate("receiver", "name avatar");

        // Emit to conversation room
        io.to(conversationId).emit("receive-message", message);

        // Notify receiver if they're online but not in the room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new-message-notification", {
            conversationId,
            message,
          });
        }
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
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = setupChatSocket;
