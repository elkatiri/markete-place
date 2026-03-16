import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

let socket = null;
let currentUserId = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });

    socket.on("connect", () => {
      if (currentUserId) {
        socket.emit("user-online", currentUserId);
      }
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  currentUserId = userId;

  if (!s.connected) {
    s.connect();
  } else {
    s.emit("user-online", userId);
  }
  return s;
};

export const disconnectSocket = () => {
  currentUserId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
