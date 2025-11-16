import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Club from "../../../../../models/Club.js";
import Event from "../../../../../models/Event.js";
import { authorize } from "../../../../../lib/checkRole.js";


await connectDB();

// POST - create event (lead/co-lead only)
export async function POST(req, context) {
  try {
    const params = await context.params;
    await authorize(req, ["lead"], params.id);
    const body = await req.json();
    const { title, description, date, location, capacity, liveEventLink, reminderWindowHours } = body;

    if (!title || !description || !date) {
      return NextResponse.json({ message: "title, description and date are required" }, { status: 400 });
    }

    const newEvent = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      liveEventLink,
      reminderWindowHours,
      club: params.id,
    });

    return NextResponse.json({ message: "Event created", event: newEvent }, { status: 201 });
  } catch (err) {
    console.error("CREATE_EVENT_ERR", err);
    const status = err.message?.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ message: err.message || "Unable to create event" }, { status });
  }
}

// GET - list all events of club (everyone)
export async function GET(req, context) {
  const params = await context.params;
  const events = await Event.find({ club: params.id })
    .sort({ date: 1 })
    .lean();
  return NextResponse.json({ events }, { status: 200 });
}
