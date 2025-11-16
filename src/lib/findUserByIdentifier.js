import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * Accepts a Mongo ObjectId, email address, or username and returns the matching user document.
 * Returns null when no identifier is provided or nothing matches.
 */
export async function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await User.findById(trimmed);
    if (byId) return byId;
  }

  const lowered = trimmed.toLowerCase();
  const byEmail = await User.findOne({ email: lowered });
  if (byEmail) return byEmail;

  return User.findOne({ username: trimmed });
}
