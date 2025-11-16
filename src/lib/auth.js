// /lib/auth.js
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET) throw new Error("JWT_SECRET must be defined in .env");

export function generateToken(user) {
  // embed only safe fields
  const payload = {
    id: user._id,
    role: user.role,
    managesClub: user.managesClub || null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify Google ID token (sent from client after Google sign-in)
 * Returns the token payload (sub, email, name, picture...) if valid
 */
export async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID must be set in .env");
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload; // properties: sub, email, name, picture, email_verified, ...
}
