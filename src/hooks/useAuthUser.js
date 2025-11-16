"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LOCAL_USER_KEY = "user";
const LOCAL_TOKEN_KEY = "token";

export function useAuthUser() {
  const router = useRouter(); // ✅ Add this
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hydrateFromStorage = useCallback(() => {
    if (typeof window === "undefined") return { storedUser: null, storedToken: null };
    const storedToken = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    const storedUserRaw = window.localStorage.getItem(LOCAL_USER_KEY);
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    return { storedUser, storedToken };
  }, []);

  const fetchFreshUser = useCallback(
    async (tokenValue) => {
      if (!tokenValue) return null;
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${tokenValue}`,
          },
        });
        if (!res.ok) {
          throw new Error("Unable to fetch profile");
        }
        const data = await res.json();
        if (data?.user) {
          window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
        return null;
      } catch (err) {
        console.warn("AUTH_USER_FETCH_ERR", err);
        return null;
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { storedToken, storedUser } = hydrateFromStorage();
    setToken(storedToken || null);
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    let userToUse = storedUser;
    if (!userToUse) {
      userToUse = await fetchFreshUser(storedToken);
    }

    setUser(userToUse);
    if (!userToUse) {
      setError("Session expired");
      window.localStorage.removeItem(LOCAL_TOKEN_KEY);
      window.localStorage.removeItem(LOCAL_USER_KEY);
      setToken(null);
    }
    setLoading(false);
    return userToUse;
  }, [fetchFreshUser, hydrateFromStorage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const role = user?.role;

  const helpers = useMemo(() => {
    const getUserId = () => (user?._id || user?.id || user?.userId || null);
    const ensureId = (entity) => {
      if (!entity) return null;
      if (typeof entity === "string") return entity;
      return entity._id || entity.id || null;
    };

    return {
      isAdmin: role === "admin",
      isLeadOrCoLead: (club) => {
        if (!club || !user) return false;
        const userId = getUserId();
        if (!userId) return false;
        const leadId = ensureId(club.lead);
        const coLeadId = ensureId(club.colead);
        return leadId === userId || coLeadId === userId;
      },
      managesClub: user?.managesClub ? ensureId(user.managesClub) : null,
    };
  }, [role, user]);

  // ✅ Updated logout function with redirect
  const logout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    window.localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    setToken(null);
    router.push("/"); // ✅ Redirect to home page
  }, [router]);

  return {
    user,
    token,
    loading,
    error,
    refresh,
    ...helpers,
    logout,
  };
}