// /middleware/authMiddleware.js
import { verifyToken } from "../lib/auth.js";
import dbConnect from "../lib/db.js";
import User from "../models/User.js";

await dbConnect();

export const protect = async (req, res, next) => {
  try {
    // Accept token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    // Attach to req.user (same shape as token payload plus db fields)
    req.user = {
      id: user._id,
      role: user.role,
      managesClub: user.managesClub || null,
      email: user.email,
      username: user.username
    };

    return next();
  } catch (err) {
    console.error("PROTECT_ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const isLead = (req, res, next) => {
  if (!req.user) return res.status(500).json({ message: "isLead used before protect" });
  if (req.user.role === "lead" || req.user.role === "co-lead") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: requires lead/co-lead role" });
};
