import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Event from "../../../../models/Event.js";
import { authorize } from "../../../../lib/checkRole.js";

await connectDB();

async function getEventOr404(eventId) {
  const event = await Event.findById(eventId).populate("club", "_id name");
  if (!event) {
    throw new Error("NOT_FOUND");
  }
  return event;
}

export async function GET(req, { params }) {
  try {
    const { eventId } = await params;
    const event = await Event.findById(eventId)
      .populate("club", "name description")
      .lean();
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ event }, { status: 200 });
  } catch (err) {
    console.error("GET_EVENT_ERR", err);
    return NextResponse.json({ message: "Unable to fetch event" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { eventId } = await params;
    const event = await getEventOr404(eventId);
    await authorize(req, ["lead"], event.club._id.toString());

    const body = await req.json();
    const allowedFields = [
      "title",
      "description",
      "date",
      "location",
      "capacity",
      "liveEventLink",
      "reminderWindowHours",
    ];

    const update = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    });

    const updated = await Event.findByIdAndUpdate(event._id, update, { new: true });
    return NextResponse.json({ message: "Event updated", event: updated }, { status: 200 });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    console.error("PATCH_EVENT_ERR", err);
    const status = err.message?.includes("Access") ? 403 : 500;
    return NextResponse.json({ message: err.message || "Unable to update event" }, { status });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { eventId } = await params;
    const event = await getEventOr404(eventId);
    await authorize(req, ["lead"], event.club._id.toString());
    await Event.findByIdAndDelete(event._id);
    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    const status = err.message?.includes("Access") ? 403 : 500;
    return NextResponse.json({ message: err.message || "Unable to delete event" }, { status });
  }
}
