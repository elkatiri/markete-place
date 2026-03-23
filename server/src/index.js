const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const createApp = require("./app");

dotenv.config();
const setupChatSocket = require("./socket/chatSocket");
const app = createApp();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Connect to MongoDB
connectDB().catch(() => process.exit(1));

// Setup Socket.io
setupChatSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
