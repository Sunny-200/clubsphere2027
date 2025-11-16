"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  eventsInMonth,
  eventsOnDate,
  getUpcomingEvents,
} from "@/lib/calendarUtils";

export function CalendarPanel({
  events = [],
  loading,
  onRefresh,
  onSelectEvent,
  onOpenDayEvents,
  onCancelEvent,
  cancellingEventId,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [monthEvents, setMonthEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMonthEvents(eventsInMonth(events, currentMonth));
  }, [events, currentMonth]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsForDay = (day) => eventsOnDate(monthEvents, day);

  const upcoming = useMemo(() => getUpcomingEvents(events), [events]);

  const refreshForMonth = useCallback(
    async (date) => {
      if (!onRefresh) return;
      try {
        setRefreshing(true);
        await onRefresh({ month: format(date, "yyyy-MM") });
      } finally {
        setRefreshing(false);
      }
    },
    [onRefresh]
  );

  const initialFetch = useRef(false);
  useEffect(() => {
    if (initialFetch.current) return;
    initialFetch.current = true;
    refreshForMonth(currentMonth);
  }, [currentMonth, refreshForMonth]);

  const changeMonth = (delta) => {
    const next = addMonths(currentMonth, delta);
    setCurrentMonth(next);
    refreshForMonth(next);
  };

  const handleRefreshClick = () => refreshForMonth(currentMonth);

  return (
    <section className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Club calendar</h3>
          <p className="text-sm text-white/60">Track everything happening across clubs.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <button
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 disabled:opacity-50"
            onClick={() => changeMonth(-1)}
            disabled={refreshing}
          >
            ←
          </button>
          <span>{format(currentMonth, "MMMM yyyy")}</span>
          <button
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 disabled:opacity-50"
            onClick={() => changeMonth(1)}
            disabled={refreshing}
          >
            →
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 text-xs disabled:opacity-50"
            onClick={handleRefreshClick}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-white/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const outside = !isSameMonth(day, currentMonth);
          return (
            <button
              key={day.toISOString()}
              className={`min-h-[90px] rounded-2xl border px-2 py-2 text-left text-xs transition ${outside ? "border-white/5 text-white/20" : "border-white/10 text-white/70"} ${isToday ? "bg-white/10" : ""}`}
              disabled={dayEvents.length === 0}
              onClick={() => {
                if (!dayEvents.length) return;
                // If parent provided a handler to open a day view, prefer it
                if (onOpenDayEvents) return onOpenDayEvents({ date: day, events: dayEvents });
                // Fallback to previous behaviour (open first event)
                return onSelectEvent?.(dayEvents[0].club, dayEvents[0]);
              }}
            >
              <p className="text-sm font-semibold">{format(day, "d")}</p>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    className={`rounded-full px-2 py-1 text-[10px] ${evt.isUserRsvp ? "bg-fuchsia-500/30 text-fuchsia-50" : "bg-white/10 text-white/70"}`}
                  >
                    {evt.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-white/50">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">Next up</h4>
        {loading ? (
          <p className="text-sm text-white/60">Loading events...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/60">No upcoming events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-white/70">
            {upcoming.map((evt) => (
              <li
                key={evt.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-white">{evt.title}</p>
                  <p className="text-xs text-white/50">
                    {format(new Date(evt.date), "EEE, MMM d • h:mm a")}
                  </p>
                </div>
                {evt.isUserRsvp ? (
                  <button
                    className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-100 disabled:opacity-60"
                    onClick={() => onCancelEvent?.(evt)}
                    disabled={cancellingEventId === evt.id}
                  >
                    {cancellingEventId === evt.id ? "Cancelling..." : "Cancel"}
                  </button>
                ) : (
                  <button
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                    onClick={() => onSelectEvent?.(evt.club, evt)}
                  >
                    RSVP
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
