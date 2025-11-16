"use client";

import { Modal } from "./Modal.jsx";
import { format, isSameDay } from "date-fns";

export function DayEventsModal({ open, onClose, date, events = [], onBook, onCancel, onDelete, cancellingEventId, user }) {
  const title = date ? `Events on ${format(date, "EEE, MMM d, yyyy")}` : "Events";

  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-2xl">
      {events.length === 0 ? (
        <p className="text-sm text-white/60">No events scheduled for this day.</p>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const evtDate = new Date(evt.date);
            const time = format(evtDate, "h:mm a");
            const isRsvp = Boolean(evt.isUserRsvp);
            const key = evt._id || evt.id || `${evt.title}-${evt.date}`;
            return (
              <div
                key={key}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{evt.title}</p>
                    <p className="text-xs text-white/60">{time} • {evt.location || "TBA"}</p>
                    {evt.description && (
                      <p className="mt-2 text-sm text-white/60">{evt.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    {isRsvp ? (
                      <button
                        className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-100 disabled:opacity-60"
                        onClick={() => onCancel?.(evt)}
                        disabled={cancellingEventId === (evt._id || evt.id)}
                      >
                        {cancellingEventId === (evt._id || evt.id) ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <button
                        className="rounded-full bg-fuchsia-600/80 px-3 py-1 text-xs text-white"
                        onClick={() => onBook?.(evt.club, evt)}
                      >
                        RSVP
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="rounded-full border border-red-500/20 px-3 py-1 text-xs text-red-100 disabled:opacity-60"
                        onClick={() => onDelete?.(evt)}
                        disabled={cancellingEventId === (evt._id || evt.id)}
                      >
                        Cancel event
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
