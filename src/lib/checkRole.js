// src/lib/checkRole.js
import { verifyToken } from "./auth.js";
import Club from "../models/Club.js";

export async function authorize(req, allowedRoles = [], clubId = null) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) throw new Error("Not authorized");

  const decoded = verifyToken(token);

  console.log("AUTH DEBUG:", {
    userId: decoded.id,
    role: decoded.role,
    clubId
  });

  // ✅ Admins can always proceed
  if (decoded.role === "admin") {
    console.log("ACCESS: Admin granted");
    return decoded;
  }

  // ✅ If no clubId given, only admin can pass
  if (!clubId) {
    throw new Error("Access denied (no club specified)");
  }

  const club = await Club.findById(clubId);
  if (!club) throw new Error("Club not found");

  const isLead = club.lead.toString() === decoded.id;
  const isCoLead = club.colead?.toString() === decoded.id;
  const isMember = club.members.some(
    (memberId) => memberId.toString() === decoded.id
  );

  // ✅ Now strictly check roles
  if (allowedRoles.includes("lead") && (isLead || isCoLead)) {
    console.log("ACCESS: Lead/CoLead authorized");
    return decoded;
  }

  if (allowedRoles.includes("member") && isMember) {
    console.log("ACCESS: Member authorized");
    return decoded;
  }

  if (allowedRoles.includes("admin") && decoded.role === "admin") {
    console.log("ACCESS: Admin authorized");
    return decoded;
  }

  // ❌ If none of the above matched
  console.log("ACCESS DENIED:", decoded.role);
  throw new Error("Access denied (not Lead/CoLead)");
}
