import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../lib/db.js";
import Club from "../../../models/Club.js";
import User from "../../../models/User.js";
import { verifyToken } from "../../../lib/auth.js";
import { findUserByIdentifier } from "../../../lib/findUserByIdentifier.js";


await connectDB();

export async function GET() {
  const clubs = await Club.find()
    .populate("lead colead members", "username email role")
    .lean();
  return NextResponse.json({ clubs }, { status: 200 });
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return NextResponse.json({ message: "Not authorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Only admin can create clubs" }, { status: 403 });
    }

    const { name, description, lead, colead } = await req.json();

    if (!name || !description || !lead) {
      return NextResponse.json({ message: "name, description and lead are required" }, { status: 400 });
    }

    const leadUser = await findUserByIdentifier(lead);
    if (!leadUser) {
      return NextResponse.json({ message: "Lead user not found" }, { status: 404 });
    }

    let coleadUser = null;
    if (colead) {
      coleadUser = await findUserByIdentifier(colead);
      if (!coleadUser) {
        return NextResponse.json({ message: "Co-lead user not found" }, { status: 404 });
      }
      if (coleadUser._id.equals(leadUser._id)) {
        return NextResponse.json(
          { message: "Lead and co-lead must be different users" },
          { status: 400 }
        );
      }
    }

    const membersSet = new Set([leadUser._id.toString()]);
    if (coleadUser) membersSet.add(coleadUser._id.toString());
    const members = Array.from(membersSet).map((id) => new mongoose.Types.ObjectId(id));

    const newClub = await Club.create({
      name,
      description,
      lead: leadUser._id,
      colead: coleadUser?._id,
      members,
    });
    return NextResponse.json({ message: "Club created successfully", club: newClub }, { status: 201 });
  } catch (err) {
    console.error("POST_CLUB_ERR", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
