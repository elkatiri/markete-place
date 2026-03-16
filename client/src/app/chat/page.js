"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { chatAPI } from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { FiSend, FiArrowLeft, FiUser, FiMessageSquare, FiPackage, FiImage, FiX } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const DEFAULT_PRODUCT_MESSAGE = "Is this product still available?";

function ChatContent() {
    // Blocked state for UI
    const [blocked, setBlocked] = useState(false);

    // Check if user is blocked (simple fetch on open conversation)
    const checkBlocked = useCallback(async (otherUserId) => {
      // This is a simple check: try to send a dummy block/unblock request and catch error, or fetch user profile if you have block info there
      // For now, just optimistically reset
      setBlocked(false);
    }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [sendingImage, setSendingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const initializedFromParamsRef = useRef(false);

  // If coming from product page with ?to=sellerId&product=productId
  const recipientId = searchParams.get("to");
  const productId = searchParams.get("product");

  // Load conversations
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      connectSocket(user._id);
      initializeChat();
    }
  }, [user, authLoading, router, recipientId, productId]);

  const initializeChat = async () => {
    const currentConversations = await loadConversations();

    if (!recipientId || !user || initializedFromParamsRef.current) {
      return;
    }

    initializedFromParamsRef.current = true;
    const conversationId = [user._id, recipientId].sort().join("_");

    if (productId) {
      try {
        const { data } = await chatAPI.sendMessage({
          receiverId: recipientId,
          productId,
          content: DEFAULT_PRODUCT_MESSAGE,
        });
        const updatedConversations = await loadConversations();
        await openConversation(data.conversationId || conversationId, updatedConversations);
      } catch {
        toast.error("Failed to start product conversation");
      }
      return;
    }

    const existing = currentConversations.find((c) => c.conversationId === conversationId);
    if (existing) {
      await openConversation(conversationId, currentConversations);
    } else {
      setActiveConversation({
        conversationId,
        otherUser: { _id: recipientId },
        isNew: true,
      });
    }
  };

  const loadConversations = async () => {
    try {
      const { data } = await chatAPI.getConversations();
      setConversations(data.conversations);
      return data.conversations;
    } catch {
      // Conversations may be empty
      return [];
    }
  };

  const isUserOnline = useCallback(
    (otherUserId) => Boolean(otherUserId && onlineUserIds.includes(otherUserId)),
    [onlineUserIds]
  );

  const openConversation = async (conversationId, currentConversations = conversations) => {
    setLoadingMessages(true);
    try {
      const { data } = await chatAPI.getMessages(conversationId);
      setMessages(data.messages);

      const conv = currentConversations.find((c) => c.conversationId === conversationId);
      setActiveConversation(conv || { conversationId });

      // Check block status
      const otherUserId = (conv && conv.otherUser?._id) || (conversationId.split("_").find((id) => id !== user._id));
      if (otherUserId) checkBlocked(otherUserId);

      // Join socket room
      const socket = getSocket();
      socket.emit("join-conversation", conversationId);
      socket.emit("mark-read", { conversationId, userId: user._id });
      // Notify all clients to refresh unread badge
      socket.emit("refresh-unread", { userId: user._id });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async () => {
    if (!activeConversation?.conversationId) return;
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await chatAPI.deleteConversation(activeConversation.conversationId);
      toast.success("Conversation deleted");
      setActiveConversation(null);
      loadConversations();
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  // Block/unblock user
  const handleBlockUser = async () => {
    const otherUserId = activeConversation?.otherUser?._id;
    if (!otherUserId) return;
    try {
      await chatAPI.blockUser(otherUserId);
      setBlocked(true);
      toast.success("User blocked");
    } catch {
      toast.error("Failed to block user");
    }
  };
  const handleUnblockUser = async () => {
    const otherUserId = activeConversation?.otherUser?._id;
    if (!otherUserId) return;
    try {
      await chatAPI.unblockUser(otherUserId);
      setBlocked(false);
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  // Socket listener for incoming messages
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleReceiveMessage = (message) => {
      if (activeConversation && message.conversationId === activeConversation.conversationId) {
        setMessages((prev) => {
          // Only add if not already present (by _id)
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        socket.emit("mark-read", { conversationId: message.conversationId, userId: user._id });
        // Notify all clients to refresh unread badge
        socket.emit("refresh-unread", { userId: user._id });
      }
      // Refresh conversations list
      loadConversations();
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      if (activeConversation) {
        socket.emit("leave-conversation", activeConversation.conversationId);
      }
    };
  }, [user, activeConversation]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleOnlineUsers = (userIds) => {
      setOnlineUserIds(Array.isArray(userIds) ? userIds : []);
    };

    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const clearSelectedImage = useCallback(() => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImage(null);
    setSelectedImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [selectedImagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      e.target.value = "";
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const content = newMessage.trim();

    try {
      const receiverId =
        activeConversation?.otherUser?._id ||
        activeConversation?.conversationId?.split("_").find((id) => id !== user._id);

      if (!receiverId) {
        toast.error("No recipient selected");
        return;
      }

      if (selectedImage) {
        setSendingImage(true);
        const formData = new FormData();
        formData.append("receiverId", receiverId);
        formData.append("image", selectedImage);
        if (content) {
          formData.append("content", content);
        }

        const { data } = await chatAPI.sendImageMessage(formData);
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === data.message._id)) {
            return prev;
          }
          return [...prev, data.message];
        });

        if (activeConversation?.isNew) {
          setActiveConversation({
            ...activeConversation,
            conversationId: data.conversationId,
            isNew: false,
          });
          const socket = getSocket();
          socket.emit("join-conversation", data.conversationId);
        }

        setNewMessage("");
        clearSelectedImage();
        loadConversations();
        return;
      }

      setNewMessage("");

      // Only emit via socket for real-time; do NOT call REST API
      const socket = getSocket();
      socket.emit("send-message", {
        senderId: user._id,
        receiverId,
        content,
      });

      // Update active conversation ID if it was new
      // (No REST API response, so just clear isNew and reload conversations)
      if (activeConversation?.isNew) {
        setActiveConversation({ ...activeConversation, isNew: false });
        loadConversations();
      }
    } catch {
      toast.error("Failed to send message");
      setNewMessage(content);
    } finally {
      setSendingImage(false);
    }
  };

  if (authLoading) return null;

  // Calculate unread conversations count for Navbar
  const unreadConversations = conversations.filter((c) => c.unreadCount > 0).length;
  if (typeof window !== "undefined") {
    window.__MARKETPLACE_UNREAD_CONV = unreadConversations;
    // This is a hack to allow Navbar to read this value reactively
    // A better solution would be to use a global state/store
  }

  return (
    <div className="mobile-screen max-w-6xl mx-auto !px-0 sm:!px-4">
      <div className="mobile-card flex min-h-[calc(100dvh-11rem)] overflow-hidden rounded-none border-y border-white/70 sm:min-h-[calc(100dvh-9rem)] sm:rounded-[1.75rem] sm:border">
        {/* Conversations sidebar */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
            activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiUser size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Contact a seller to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => openConversation(conv.conversationId)}
                  className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    activeConversation?.conversationId === conv.conversationId
                      ? "bg-primary-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-primary-600" />
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          isUserOnline(conv.otherUser?._id) ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {conv.otherUser?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isUserOnline(conv.otherUser?._id) ? "Online" : "Offline"}
                          </p>
                        </div>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.lastMessage?.product?.images?.[0]?.url ? (
                          <img
                            src={conv.lastMessage.product.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : conv.lastMessage?.image?.url ? (
                          <img
                            src={conv.lastMessage.image.url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : conv.lastMessage?.product ? (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            <FiPackage className="text-gray-400" size={16} />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          {conv.lastMessage?.product?.title && (
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {conv.lastMessage.product.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 truncate">
                            {conv.lastMessage?.content || (conv.lastMessage?.image?.url ? "Sent a photo" : "")}
                          </p>
                        </div>
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={`flex-1 flex flex-col ${
            !activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-primary-600" size={14} />
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      isUserOnline(activeConversation.otherUser?._id) ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                </div>
                <div>
                  <span className="block font-medium">
                    {/* Show the other user's name, not the auth user */}
                    {(() => {
                      // Try to get from activeConversation.otherUser
                      if (activeConversation.otherUser?.name) return activeConversation.otherUser.name;
                      // Fallback: find from conversations list
                      const conv = conversations.find((c) => c.conversationId === activeConversation.conversationId);
                      if (conv?.otherUser?.name) return conv.otherUser.name;
                      return "User";
                    })()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {isUserOnline(activeConversation.otherUser?._id) ? "Online now" : "Offline"}
                  </span>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    onClick={handleDeleteConversation}
                    className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                  >
                    Delete
                  </button>
                  {blocked ? (
                    <button
                      onClick={handleUnblockUser}
                      className="text-xs text-yellow-700 border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-50"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={handleBlockUser}
                      className="text-xs text-yellow-700 border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-50"
                    >
                      Block
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine =
                      msg.sender?._id === user._id || msg.sender === user._id;
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[84%] rounded-2xl px-4 py-2 sm:max-w-[70%] ${
                            isMine
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                            {msg.image?.url && (
                              <a href={msg.image.url} target="_blank" rel="noreferrer" className="mb-3 block overflow-hidden rounded-xl">
                                <img
                                  src={msg.image.url}
                                  alt="Chat attachment"
                                  className="max-h-72 w-full rounded-xl object-cover"
                                />
                              </a>
                            )}
                          {msg.product && (
                            <div
                              className={`mb-3 rounded-xl overflow-hidden border ${
                                isMine
                                  ? "border-primary-400/40 bg-primary-500/40"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3 p-2.5">
                                {msg.product.images?.[0]?.url ? (
                                  <img
                                    src={msg.product.images[0].url}
                                    alt=""
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <FiPackage className="text-gray-400" size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={`text-xs font-medium ${isMine ? "text-primary-100" : "text-gray-500"}`}>
                                    Product inquiry
                                  </p>
                                  <p className={`font-semibold truncate ${isMine ? "text-white" : "text-gray-900"}`}>
                                    {msg.product.title}
                                  </p>
                                  <p className={`text-sm ${isMine ? "text-primary-100" : "text-primary-600"}`}>
                                    ${msg.product.price?.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {msg.content ? <p className="break-words">{msg.content}</p> : null}
                          <p
                            className={`text-xs mt-1 ${
                              isMine ? "text-primary-200" : "text-gray-400"
                            }`}
                          >
                            {msg.createdAt &&
                              formatDistanceToNow(new Date(msg.createdAt), {
                                addSuffix: true,
                              })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={sendMessage}
                className="border-t border-gray-200 p-4"
              >
                {selectedImagePreview ? (
                  <div className="mb-3 inline-flex max-w-[10rem] flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
                    <div className="relative">
                      <img
                        src={selectedImagePreview}
                        alt="Selected upload"
                        className="h-28 w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                    <p className="truncate text-xs text-gray-500">{selectedImage?.name}</p>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
                    className="input-field flex-1"
                    maxLength={1000}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-primary-300 hover:text-primary-600"
                    title="Send image"
                  >
                    <FiImage size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || sendingImage}
                    className="btn-primary px-4"
                  >
                    {sendingImage ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      </span>
                    ) : (
                      <FiSend />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose from your existing conversations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
