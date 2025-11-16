"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useClubsData(token) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clubs");
      if (!res.ok) throw new Error("Unable to load clubs");
      const data = await res.json();
      setClubs(data.clubs || []);
      setError(null);
    } catch (err) {
      console.error("FETCH_CLUBS_ERR", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      setClubs([]);
      setLoading(false);
      setError(null);
      return;
    }
    await fetchClubs();
  }, [token, fetchClubs]);

  const lastTokenRef = useRef(null);
  useEffect(() => {
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;
    refresh();
  }, [token, refresh]);

  const createClub = useCallback(
    async (payload) => {
      if (!token) throw new Error("Not authorized");
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Unable to create club");
      }

      const data = await res.json();
      setClubs((prev) => [...prev, data.club]);
      return data.club;
    },
    [token]
  );

  const updateClub = useCallback(
    async (clubId, payload) => {
      if (!token) throw new Error("Not authorized");
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Unable to update club");
      }
      const data = await res.json();
      setClubs((prev) => prev.map((club) => (club._id === clubId ? data.club : club)));
      return data.club;
    },
    [token]
  );

  const deleteClub = useCallback(
    async (clubId) => {
      if (!token) throw new Error("Not authorized");
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Unable to delete club");
      }
      setClubs((prev) => prev.filter((club) => club._id !== clubId));
    },
    [token]
  );

  const value = useMemo(
    () => ({ clubs, loading, error, refresh, createClub, updateClub, deleteClub }),
    [clubs, loading, error, refresh, createClub, updateClub, deleteClub]
  );

  return value;
}
