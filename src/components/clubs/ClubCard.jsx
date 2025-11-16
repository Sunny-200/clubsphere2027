"use client";

import { cn } from "@/lib/utils";

export function ClubCard({
  club,
  onSelect,
  onManage,
  onBook,
  canManage,
  canBook,
  highlight,
}) {
  const upcomingEvents = club.upcomingEventCount ?? 0;
  const members = club.members?.length ?? 0;

  return (
    <div
      className={cn(
  "group relative flex h-full flex-col rounded-3xl border border-white/5 bg-zinc-900/70 p-5 text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition duration-300",
  highlight && "ring-2 ring-blue-400/50"
      )}
    >
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{members} members</span>
        {club.hiringStatus && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
            Recruiting
          </span>
        )}
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">{club.name}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-white/70">{club.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
        {club.lead && (
          <Badge label={`Lead · ${club.lead.username}`} />
        )}
        {club.colead && (
          <Badge label={`Co-lead · ${club.colead.username}`} variant="secondary" />
        )}
        {upcomingEvents > 0 && (
          <Badge label={`${upcomingEvents} upcoming event${upcomingEvents > 1 ? "s" : ""}`} variant="accent" />
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <button
          onClick={() => onSelect?.(club)}
          className="flex-1 rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/60"
        >
          View club
        </button>
        {canManage && (
          <button
            onClick={() => onManage?.(club)}
            className="flex-1 rounded-2xl bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Manage
          </button>
        )}
        {canBook && (
          <button
            onClick={() => onBook?.(club)}
            className="flex-1 rounded-2xl bg-fuchsia-600/80 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500"
          >
            Book event
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ label, variant = "default" }) {
  const styles = {
    default: "bg-white/10 text-white/80",
    secondary: "bg-zinc-800 text-white/60",
  accent: "bg-linear-to-r from-purple-500/30 to-pink-500/30 text-pink-100",
  };

  return <span className={cn("rounded-full px-3 py-1", styles[variant])}>{label}</span>;
}
