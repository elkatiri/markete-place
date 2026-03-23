const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const lastSeenAt = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    if (now.getTime() - lastSeenAt > 30000) {
      user.lastSeen = now;
      User.findByIdAndUpdate(user._id, { lastSeen: now }).catch(() => {});
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

// Optional auth - attaches user if token exists, but doesn't block
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (_) {
    // Ignore auth errors for optional auth
  }
  next();
};

// Admin middleware - must be used after auth
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Admin access required" });
};

module.exports = { auth, optionalAuth, admin };
