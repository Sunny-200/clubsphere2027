import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Event from "../../../../models/Event.js";
import { verifyToken } from "../../../../lib/auth.js";

await connectDB();

function getRangeFromMonth(monthParam) {
  if (!monthParam) return null;
  const [year, month] = monthParam.split("-").map(Number);
  if (!year || !month) return null;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export async function GET(req) {
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");
  const mineOnly = url.searchParams.get("mine") === "true";
  const limit = Number(url.searchParams.get("limit")) || 200;

  let userId = null;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (mineOnly && !token) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      userId = decoded.id;
    } catch (err) {
      console.warn("CALENDAR_TOKEN_ERR", err?.message);
    }
  }

  const range = getRangeFromMonth(monthParam);
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const query = {};
  if (range) {
    query.date = { $gte: range.start, $lte: range.end };
  } else {
    query.date = { $gte: thirtyDaysAgo };
  }

  const events = await Event.find(query)
    .sort({ date: 1 })
    .limit(limit)
    .populate("club", "name description lead colead")
    .lean();

  const payload = events
    .map((evt) => {
      const isUserRsvp = userId
        ? evt.rsvps?.some((r) => r.user?.toString() === userId)
        : false;

      return {
        id: evt._id.toString(),
        title: evt.title,
        date: evt.date,
        location: evt.location,
        capacity: evt.capacity,
        bookedCount: evt.rsvps?.length || 0,
        club: evt.club,
        liveEventLink: evt.liveEventLink,
        reminderWindowHours: evt.reminderWindowHours,
        isUserRsvp,
      };
    })
    .filter((evt) => (mineOnly ? evt.isUserRsvp : true));

  return NextResponse.json({ events: payload }, { status: 200 });
}
