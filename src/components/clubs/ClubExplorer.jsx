"use client";

import { useMemo, useState } from "react";
import { ClubCard } from "./ClubCard.jsx";
import { Input } from "@/components/ui/input";

export function ClubExplorer({ clubs = [], user, onSelectClub, onManageClub, onBookEvent }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();

  const userId = user?._id || user?.id;

  const filtered = useMemo(() => {
    if (!normalizedQuery) return clubs;
    return clubs.filter((club) => {
      return (
        club.name.toLowerCase().includes(normalizedQuery) ||
        club.description?.toLowerCase().includes(normalizedQuery) ||
        club.lead?.username?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [clubs, normalizedQuery]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Discover clubs</h2>
          <p className="text-sm text-white/60">Browse all active communities and jump into events.</p>
        </div>
        <div className="w-full max-w-sm">
          <Input
            type="search"
            placeholder="Search by name, lead, interest..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-white/70">
          No clubs matched your search yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((club) => {
            const isLead = userId && club.lead && (club.lead._id === userId || club.lead === userId);
            const isCoLead = userId && club.colead && (club.colead._id === userId || club.colead === userId);
            const canManage = isLead || isCoLead || user?.role === "admin";
            return (
              <ClubCard
                key={club._id}
                club={club}
                onSelect={onSelectClub}
                onManage={onManageClub}
                onBook={(c) => onBookEvent?.(c, null)}
                canManage={canManage}
                canBook={Boolean(user)}
                highlight={isLead || isCoLead}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
