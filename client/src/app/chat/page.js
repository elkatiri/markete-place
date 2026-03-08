"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { chatAPI } from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { FiSend, FiArrowLeft, FiUser, FiMessageSquare } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

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
      loadConversations();
      connectSocket(user._id);
    }
  }, [user, authLoading, router]);

  const loadConversations = async () => {
    try {
      const { data } = await chatAPI.getConversations();
      setConversations(data.conversations);

      // If redirected from product page, start or open conversation
      if (recipientId && user) {
        const convId = [user._id, recipientId].sort().join("_") + (productId ? `_${productId}` : "");
        const existing = data.conversations.find((c) => c.conversationId === convId);
        if (existing) {
          openConversation(convId);
        } else {
          setActiveConversation({
            conversationId: convId,
            otherUser: { _id: recipientId },
            isNew: true,
          });
        }
      }
    } catch {
      // Conversations may be empty
    }
  };

  const openConversation = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const { data } = await chatAPI.getMessages(conversationId);
      setMessages(data.messages);

      const conv = conversations.find((c) => c.conversationId === conversationId);
      setActiveConversation(conv || { conversationId });

      // Join socket room
      const socket = getSocket();
      socket.emit("join-conversation", conversationId);
      socket.emit("mark-read", { conversationId, userId: user._id });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Socket listener for incoming messages
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleReceiveMessage = (message) => {
      if (activeConversation && message.conversationId === activeConversation.conversationId) {
        setMessages((prev) => [...prev, message]);
        socket.emit("mark-read", { conversationId: message.conversationId, userId: user._id });
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const receiverId =
        activeConversation?.otherUser?._id ||
        activeConversation?.conversationId?.split("_").find((id) => id !== user._id);

      // Send via API
      const { data } = await chatAPI.sendMessage({
        receiverId,
        content,
        productId: productId || undefined,
      });

      // Also emit via socket for real-time
      const socket = getSocket();
      socket.emit("send-message", {
        conversationId: data.conversationId,
        senderId: user._id,
        receiverId,
        content,
        productId,
      });

      setMessages((prev) => [...prev, data.message]);

      // Update active conversation ID if it was new
      if (activeConversation?.isNew) {
        setActiveConversation({ ...activeConversation, conversationId: data.conversationId, isNew: false });
        socket.emit("join-conversation", data.conversationId);
        loadConversations();
      }
    } catch {
      toast.error("Failed to send message");
      setNewMessage(content);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="card flex h-[calc(100vh-8rem)]">
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
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">
                          {conv.otherUser?.name || "User"}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage?.content || ""}
                      </p>
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
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-600" size={14} />
                </div>
                <span className="font-medium">
                  {activeConversation.otherUser?.name || "User"}
                </span>
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
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isMine
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
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
                className="p-4 border-t border-gray-200 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary px-4"
                >
                  <FiSend />
                </button>
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
