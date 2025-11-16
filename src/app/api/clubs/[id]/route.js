// src/app/api/clubs/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import mongoose from "mongoose";
import Club from "../../../../models/Club.js";
import { authorize } from "../../../../lib/checkRole.js";
import { findUserByIdentifier } from "../../../../lib/findUserByIdentifier.js";

await connectDB();

// GET club info (anyone)
export async function GET(req, context) {
  try {
    const params = await context.params;
    const club = await Club.findById(params.id)
      .populate("lead colead members", "username email");
    if (!club)
      return NextResponse.json({ message: "Club not found" }, { status: 404 });
    return NextResponse.json({ club }, { status: 200 });
  } catch (err) {
    console.error("GET_CLUB_ERR", err);
    return NextResponse.json({ message: "Invalid club ID" }, { status: 400 });
  }
}

// PATCH (Lead, CoLead, Admin)
export async function PATCH(req, context) {
  const params = await context.params;
  try {
    const decoded = await authorize(req, ["lead", "colead", "admin"], params.id);
    const body = await req.json();
    const club = await Club.findById(params.id);
    if (!club) {
      return NextResponse.json({ message: "Club not found" }, { status: 404 });
    }

    const isAdmin = decoded.role === "admin";
    const canEditMembers =
      decoded.role === "admin" ||
      (club.lead && club.lead.toString() === decoded.id) ||
      (club.colead && club.colead.toString() === decoded.id);

    const baseFields = [
      "description",
      "hiringStatus",
      "hiringDescription",
      "recruitmentFormUrl",
      "recruitmentWindow",
      "announcements",
    ];
    const adminFields = ["name"];
    const allowedFields = isAdmin ? [...baseFields, ...adminFields] : baseFields;

    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    let leadUser = null;
    let coleadUser = null;

    if (isAdmin && body.lead !== undefined) {
      leadUser = await findUserByIdentifier(body.lead);
      if (!leadUser) {
        return NextResponse.json({ message: "Lead user not found" }, { status: 404 });
      }
      updateData.lead = leadUser._id;
    }

    if (isAdmin && body.colead !== undefined) {
      if (!body.colead) {
        updateData.colead = null;
      } else {
        coleadUser = await findUserByIdentifier(body.colead);
        if (!coleadUser) {
          return NextResponse.json({ message: "Co-lead user not found" }, { status: 404 });
        }
        if (leadUser && coleadUser._id.equals(leadUser._id)) {
          return NextResponse.json(
            { message: "Lead and co-lead must be different users" },
            { status: 400 }
          );
        }
        updateData.colead = coleadUser._id;
      }
    }

    if (canEditMembers) {
      const memberIds = new Set(club.members.map((id) => id.toString()));
      const finalLeadId = updateData.lead ?? club.lead;
      const finalCoLeadId = updateData.colead === undefined ? club.colead : updateData.colead;

      if (finalLeadId) memberIds.add(finalLeadId.toString());
      if (finalCoLeadId) memberIds.add(finalCoLeadId.toString());

      if (Array.isArray(body.members)) {
        for (const identifier of body.members) {
          const memberUser = await findUserByIdentifier(identifier);
          if (memberUser) {
            memberIds.add(memberUser._id.toString());
          }
        }
      }

      updateData.members = Array.from(memberIds).map((id) => new mongoose.Types.ObjectId(id));
    }

    const updatedClub = await Club.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).populate("lead colead members", "username email role");

    return NextResponse.json(
      { message: "Club updated successfully", club: updatedClub },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH_CLUB_ERR", err);
    const msg = err.message || "Update failed";
    if (msg.includes("Not authorized") || msg.includes("Access denied"))
      return NextResponse.json({ message: msg }, { status: 403 });
    if (msg.includes("Club not found"))
      return NextResponse.json({ message: msg }, { status: 404 });
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

// DELETE (Admin only)
export async function DELETE(req, context) {
  const params = await context.params;
  try {
    await authorize(req, ["admin"], params.id);
    const deleted = await Club.findByIdAndDelete(params.id);
    if (!deleted)
      return NextResponse.json({ message: "Club not found" }, { status: 404 });
    return NextResponse.json({ message: "Club deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE_CLUB_ERR", err);
    const msg = err.message || "Delete failed";
    if (msg.includes("Not authorized") || msg.includes("Access denied"))
      return NextResponse.json({ message: msg }, { status: 403 });
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
