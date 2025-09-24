// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .select("_id name email role company")
      .lean();
    if (!req.user) return res.status(401).json({ message: "User not found" });

    next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
};

export const admin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin only" });
};

// 🔹 Add this:
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.user?.role)) return next();
  return res.status(403).json({ message: "Forbidden" });
};
