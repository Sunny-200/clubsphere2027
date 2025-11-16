import mongoose from "mongoose";
import "./Club.js";

const { Schema } = mongoose;

const RSVP_SCHEMA = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reminderWindowHours: {
      type: Number,
      default: 24,
      min: 1,
    },
    club: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    liveEventLink: {
      type: String,
      default: "",
      trim: true,
    },
    rsvps: [RSVP_SCHEMA],
  },
  { timestamps: true }
);

EventSchema.virtual("bookedCount").get(function () {
  return this.rsvps.length;
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
