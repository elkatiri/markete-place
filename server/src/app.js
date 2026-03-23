const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const getAllowedOrigins = () => {
  const configuredOrigins = process.env.CLIENT_URL || "http://localhost:3000";

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const createApp = () => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.set("io", null);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reviews", reviewRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  return app;
};

module.exports = createApp;