"use client";

import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function EventBookingDialog({ open, onClose, event, club, onSubmit, user, loading }) {
  const [form, setForm] = useState({ attendeeName: undefined, attendeeEmail: undefined, notes: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const attendeeNameValue = form.attendeeName ?? user?.username ?? "";
  const attendeeEmailValue = form.attendeeEmail ?? user?.email ?? "";

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setForm({ attendeeName: undefined, attendeeEmail: undefined, notes: "" });
    onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const eventId = event?._id || event?.id;
      await onSubmit({
        ...form,
        attendeeName: attendeeNameValue,
        attendeeEmail: attendeeEmailValue,
        eventId,
      });
      setSuccess("You're booked! Check your inbox for confirmation.");
    } catch (err) {
      setError(err.message);
    }
  };

  const title = event ? `RSVP for ${event.title}` : "RSVP";

  return (
    <Modal open={open} onClose={handleClose} title={title} widthClass="max-w-xl">
      {!event ? (
        <p>Select an event to continue.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          <p className="text-sm text-white/70">
            {club?.name} • {new Date(event.date).toLocaleString()} • {event.location || "TBA"}
          </p>
          {error && <p className="rounded-2xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}
          {success && <p className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{success}</p>}
          <Input
            required
            name="attendeeName"
            value={attendeeNameValue}
            onChange={handleChange}
            className="bg-white/5 text-white"
            placeholder="Full name"
          />
          <Input
            required
            type="email"
            name="attendeeEmail"
            value={attendeeEmailValue}
            onChange={handleChange}
            className="bg-white/5 text-white"
            placeholder="email@example.com"
          />
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white"
            placeholder="Anything you'd like the hosts to know?"
          />
          <button
            type="submit"
            className={cn(
              "w-full rounded-2xl bg-fuchsia-600/80 px-4 py-3 text-sm font-semibold text-white",
              loading && "opacity-60"
            )}
            disabled={loading}
          >
            {loading ? "Booking..." : "Confirm RSVP"}
          </button>
        </form>
      )}
    </Modal>
  );
}
