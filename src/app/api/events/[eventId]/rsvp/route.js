import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../../../lib/db.js";
import Event from "../../../../../models/Event.js";
import { verifyToken } from "../../../../../lib/auth.js";
import {
  buildEventConfirmationTemplate,
  buildEventCancellationTemplate,
  sendMail,
} from "../../../../../lib/mailer.js";

await connectDB();

export async function POST(req, context) {
  try {
    const params = await context.params;
    const eventId = params.eventId;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
    }
    const { attendeeName, attendeeEmail, notes } = await req.json();

    if (!attendeeName || !attendeeEmail) {
      return NextResponse.json({ message: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = attendeeEmail.trim().toLowerCase();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    let userId = null;

    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (err) {
        console.warn("RSVP_TOKEN_ERR", err?.message);
      }
    }

    const event = await Event.findById(eventId).populate("club", "name");
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.capacity && event.rsvps.length >= event.capacity) {
      return NextResponse.json({ message: "Event is at capacity" }, { status: 409 });
    }

    const alreadyBooked = event.rsvps.some((rsvp) => {
      const existingEmail = rsvp.attendeeEmail?.trim().toLowerCase();
      if (userId && rsvp.user) {
        if (rsvp.user.toString() === userId) {
          return true;
        }
      }
      return existingEmail === normalizedEmail;
    });

    if (alreadyBooked) {
      return NextResponse.json(
        { message: "This email already has a seat for this event" },
        { status: 409 }
      );
    }

    event.rsvps.push({
      user: userId,
      attendeeName,
      attendeeEmail: normalizedEmail,
      notes,
      status: "confirmed",
    });

    const rsvpIndex = event.rsvps.length - 1;
    await event.save();

    try {
      const template = buildEventConfirmationTemplate({
        attendeeName,
        eventTitle: event.title,
        eventDate: event.date,
        clubName: event.club?.name ?? "Club",
        location: event.location,
        liveEventLink: event.liveEventLink,
      });

      await sendMail({ to: normalizedEmail, ...template });
      if (rsvpIndex >= 0) {
        event.rsvps[rsvpIndex].notifiedAt = new Date();
        await event.save();
      }
    } catch (mailErr) {
      console.error("RSVP_EMAIL_ERR", mailErr?.message);
      if (rsvpIndex >= 0) {
        event.rsvps.splice(rsvpIndex, 1);
        await event.save();
      }
      return NextResponse.json(
        { message: "RSVP failed because the confirmation email could not be delivered" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "RSVP confirmed", eventId: event._id },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST_RSVP_ERR", err);
    return NextResponse.json({ message: "Unable to RSVP" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const eventId = params.eventId;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
    }

    let payload = {};
    try {
      payload = await req.json();
    } catch (err) {
      payload = {};
    }

    const attendeeEmail = payload.attendeeEmail?.trim().toLowerCase();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    let userId = null;

    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (err) {
        console.warn("RSVP_CANCEL_TOKEN_ERR", err?.message);
      }
    }

    if (!userId && !attendeeEmail) {
      return NextResponse.json(
        { message: "Provide an attendee email or authenticate to cancel" },
        { status: 400 }
      );
    }

    const event = await Event.findById(eventId).populate("club", "name");
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const rsvpIndex = event.rsvps.findIndex((rsvp) => {
      const existingEmail = rsvp.attendeeEmail?.trim().toLowerCase();
      if (userId && rsvp.user && rsvp.user.toString() === userId) {
        return true;
      }
      if (attendeeEmail && existingEmail === attendeeEmail) {
        return true;
      }
      return false;
    });

    if (rsvpIndex === -1) {
      return NextResponse.json(
        { message: "No RSVP matching that user or email" },
        { status: 404 }
      );
    }

    const [removedRsvp] = event.rsvps.splice(rsvpIndex, 1);
    await event.save();

    if (removedRsvp?.attendeeEmail) {
      try {
        const template = buildEventCancellationTemplate({
          attendeeName: removedRsvp.attendeeName,
          eventTitle: event.title,
          eventDate: event.date,
          clubName: event.club?.name ?? "Club",
          location: event.location,
        });
        await sendMail({ to: removedRsvp.attendeeEmail, ...template });
      } catch (mailErr) {
        console.warn("RSVP_CANCEL_EMAIL_ERR", mailErr?.message);
      }
    }

    return NextResponse.json(
      { message: "RSVP cancelled", eventId: event._id },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE_RSVP_ERR", err);
    return NextResponse.json({ message: "Unable to cancel RSVP" }, { status: 500 });
  }
}
