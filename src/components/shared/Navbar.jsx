"use client";

import React, { useState } from "react";
import Container from "@/components/miscellaneous/Container";
import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { IconBell, IconX } from "@tabler/icons-react"; // ✅ Import the bell and close icons from Tabler Icons
import { Modal } from "@/components/clubs/Modal";

const deriveDisplayName = (user) => {
  if (!user) return null;
  return (
    user.name ||
    user.fullName ||
    user.username ||
    (user.email ? user.email.split("@")[0] : null)
  );
};

const Navbar = () => {
  const { user, loading, logout } = useAuthUser();
  const [annOpen, setAnnOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setAnnLoading(true);
      const res = await fetch('/api/clubs');
      if (!res.ok) throw new Error('Unable to fetch clubs');
      const data = await res.json();
      const clubs = data.clubs || [];
      // For each club, pick the latest announcement (last element)
      const items = clubs
        .map((c) => {
          const anns = Array.isArray(c.announcements) ? c.announcements : [];
          if (!anns.length) return null;
          const latest = anns[anns.length - 1];
          return {
            clubId: c._id,
            clubName: c.name,
            title: latest.title,
            link: latest.link || null,
          };
        })
        .filter(Boolean);
      setAnnouncements(items);
    } catch (err) {
      console.error('FETCH_ANNOUNCEMENTS_ERR', err);
      setAnnouncements([]);
    } finally {
      setAnnLoading(false);
    }
  };
  const displayName = deriveDisplayName(user);
  const initial = displayName?.[0]?.toUpperCase();

  return (
    <div className="fixed top-0 z-50 py-1 h-18 bg-transparent backdrop-blur-[2px] w-full">
      <Container className="h-full flex items-center justify-between">
        <div className="text-4xl text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500 bg-size-[200%_200%] animate-gradient font-bold cursor-pointer">
          <Link href={"/"}>ClubSphere</Link>
        </div>

        <div className="flex items-center gap-6">
          {/* ✅ Only show Clubs link if user is NOT logged in */}
          {!user ? (
            <li className="list-none text-lg hover:text-neutral-400 transition-colors duration-200">
              <Link href={"/clubs"}>Clubs</Link>
            </li>
          ) : null}

          {loading ? (
            <div className="text-sm text-white/70">Checking session…</div>
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* ✅ Add Bell Icon Button */}
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Notifications"
                onClick={async () => {
                  setAnnOpen(true);
                  // fetch announcements when opening
                  await fetchAnnouncements();
                }}
              >
                <IconBell className="text-white" size={20} />
              </button>

              <Modal open={annOpen} onClose={() => setAnnOpen(false)} title="Notifications">
                <div style={{ marginTop: '80px' }}>
                  {annLoading ? (
                    <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-6 text-center text-white/60">Loading…</div>
                  ) : announcements.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/60">No announcements yet.</p>
                  ) : (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        <button
                          aria-label="Close notifications"
                          onClick={() => setAnnOpen(false)}
                          className="rounded-full bg-white/5 p-2 text-white/80 hover:bg-white/10"
                        >
                          <IconX size={16} />
                        </button>
                      </div>
                      <ul className="space-y-3">
                        {announcements.map((a) => (
                          <li key={a.clubId} className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 text-sm text-white/80">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{a.clubName}</p>
                                <p className="text-sm text-white/70">{a.title}</p>
                              </div>
                              {a.link && (
                                <a href={a.link} target="_blank" rel="noreferrer" className="text-xs text-emerald-300">Open</a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Modal>

              {/* User Profile Button */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90 hover:border-white/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/80 text-base font-semibold text-white">
                  {initial || "U"}
                </div>
                <span className="max-w-[140px] truncate">{displayName || "User"}</span>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={logout}
                className="rounded-xl bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href={"/login"}
              className="rounded-xl bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
            >
              Sign in
            </Link>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Navbar;