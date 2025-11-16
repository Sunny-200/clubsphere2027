"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useCalendarEvents(token) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventsInternal = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value);
        }
      });
      const qs = query.toString();
      const res = await fetch(`/api/events/calendar${qs ? `?${qs}` : ""}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      if (!res.ok) throw new Error("Unable to load events");
      const data = await res.json();
      const evts = data.events || [];
      setEvents(evts);
      setError(null);
      return evts;
    } catch (err) {
      console.error("FETCH_EVENTS_ERR", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refresh = useCallback(async (params = {}) => {
    if (!token) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return [];
    }
    return await fetchEventsInternal(params);
  }, [token, fetchEventsInternal]);

  const lastTokenRef = useRef(null);
  useEffect(() => {
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;
    refresh();
  }, [token, refresh]);

  const bookEvent = useCallback(
    async ({ eventId, attendeeName, attendeeEmail, notes }) => {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ attendeeName, attendeeEmail, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Unable to RSVP");
      }
      await refresh();
      return data;
    },
    [token, refresh]
  );

  const cancelEvent = useCallback(
    async ({ eventId, attendeeEmail } = {}) => {
      if (!eventId) throw new Error("Event id is required to cancel");
      const body = attendeeEmail ? { attendeeEmail } : null;
      const headers = {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "DELETE",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        throw new Error(data?.message || "Unable to cancel RSVP");
      }
      await refresh();
      return data;
    },
    [token, refresh]
  );

  const value = useMemo(
    () => ({ events, loading, error, refresh, bookEvent, cancelEvent }),
    [events, loading, error, refresh, bookEvent, cancelEvent]
  );

  return value;
}
