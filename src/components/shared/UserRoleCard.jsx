"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";

export const friendlyRoleLabel = (role) => {
  if (!role) return "Student";
  const normalized = String(role).toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "lead") return "Lead";
  if (normalized === "colead" || normalized === "co-lead") return "Co-lead";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const deriveDisplayName = (user) => {
  if (!user) return "Member";
  return (
    user.name ||
    user.fullName ||
    user.username ||
    (user.email ? user.email.split("@")[0] : "Member")
  );
};

const extractClubName = (club) => {
  if (!club) return "";
  if (typeof club === "string") return club;
  return club.name || club.title || "Unnamed club";
};

export function UserRoleCard({
  user,
  leadClubs = [],
  coLeadClubs = [],
  className = "",
  initialOpen = true,
  profileHref = "/profile",
  showProfileLink = true,
}) {
  const [expanded, setExpanded] = useState(initialOpen);

  const userRole = user?.role;
  const roleLabel = friendlyRoleLabel(userRole);
  const displayName = deriveDisplayName(user);
  const hasLeadership = (leadClubs?.length || 0) + (coLeadClubs?.length || 0) > 0;

  const summary = useMemo(() => {
    if (!userRole) {
      return "Default student access";
    }
    if (userRole === "admin") {
      return "Full administrative access";
    }
    return `${friendlyRoleLabel(userRole)} access`;
  }, [userRole]);

  const leadNames = useMemo(() => leadClubs.map((club) => extractClubName(club)).filter(Boolean), [leadClubs]);
  const coLeadNames = useMemo(
    () => coLeadClubs.map((club) => extractClubName(club)).filter(Boolean),
    [coLeadClubs]
  );

  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Role</p>
          <p className="text-2xl font-semibold text-white">{roleLabel}</p>
          <p className="text-sm text-white/60">Signed in as {displayName}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-lg text-white">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div className="mt-5 space-y-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Access</p>
            <p className="mt-1 text-base font-semibold text-white">{summary}</p>
            <p className="text-white/60">{hasLeadership ? "Leadership privileges active" : "Standard member permissions"}</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Lead</p>
              {leadNames.length ? (
                <ul className="mt-2 space-y-1 text-white/80">
                  {leadNames.map((name) => (
                    <li key={`lead-${name}`} className="rounded-2xl border border-emerald-500/10 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-white/50">Not leading any clubs currently.</p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Co-lead</p>
              {coLeadNames.length ? (
                <ul className="mt-2 space-y-1 text-white/80">
                  {coLeadNames.map((name) => (
                    <li key={`colead-${name}`} className="rounded-2xl border border-sky-500/10 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-white/50">No co-lead assignments yet.</p>
              )}
            </div>
          </div>

          {showProfileLink && (
            <Link
              href={profileHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
            >
              View full profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
