import { isSameDay, isSameMonth } from "date-fns";

function toDateSafe(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export function eventsInMonth(events = [], monthDate = new Date()) {
  if (!Array.isArray(events)) return [];
  return events.filter((evt) => {
    const eventDate = toDateSafe(evt?.date);
    return eventDate && isSameMonth(eventDate, monthDate);
  });
}

export function eventsOnDate(events = [], day) {
  if (!Array.isArray(events) || !day) return [];
  const dayDate = toDateSafe(day);
  if (!dayDate) return [];
  return events.filter((evt) => {
    const eventDate = toDateSafe(evt?.date);
    return eventDate && isSameDay(eventDate, dayDate);
  });
}

export function getUpcomingEvents(events = [], limit = 4, now = new Date()) {
  if (!Array.isArray(events)) return [];
  const nowDate = toDateSafe(now) ?? new Date();
  return events
    .map((evt) => ({ ...evt, __eventDate: toDateSafe(evt?.date) }))
    .filter((evt) => evt.__eventDate && evt.__eventDate >= nowDate)
    .sort((a, b) => a.__eventDate - b.__eventDate)
    .slice(0, limit)
    .map(({ __eventDate, ...evt }) => evt);
}

export function getAvailabilityState(event = {}) {
  const capacity = Number(event.capacity ?? 0);
  const rsvpCount = Array.isArray(event.rsvps)
    ? event.rsvps.length
    : Number(event.rsvpCount ?? event.currentRsvp ?? 0);
  if (!capacity) return "open";
  if (rsvpCount >= capacity) return "full";
  if (capacity - rsvpCount <= 5) return "limited";
  return "open";
}
