import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Club from "../../../../../models/Club.js";
import { authorize } from "../../../../../lib/checkRole.js";


await connectDB();

export async function POST(req, { params }) {
  try {
    await authorize(req, ["lead"], params.id);
    const { url, public_id } = await req.json();
    const club = await Club.findById(params.id);
    club.galleryImages.push({ url, public_id });
    await club.save();
    return NextResponse.json({ message: "Image added" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}

export async function GET(req, context) {
   const params = await context.params;
  const club = await Club.findById(params.id).select("galleryImages");
  return NextResponse.json({ gallery: club.galleryImages }, { status: 200 });
}
