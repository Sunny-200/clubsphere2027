"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LeadManagementPanel({
  club,
  onSaveClub,
  onAddMember,
  onCreateEvent,
  savingClub,
  creatingEvent,
  addingMember,
}) {
  const [clubForm, setClubForm] = useState(() => ({
    hiringStatus: club.hiringStatus ?? false,
    hiringDescription: club.hiringDescription ?? "",
    recruitmentFormUrl: club.recruitmentFormUrl ?? "",
  }));

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    capacity: "",
    liveEventLink: "",
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    link: "",
  });
  const [memberEmail, setMemberEmail] = useState("");

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    await onSaveClub(clubForm);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...eventForm,
      capacity: eventForm.capacity ? Number(eventForm.capacity) : undefined,
    };
    await onCreateEvent(payload);
    setEventForm({ title: "", description: "", date: "", location: "", capacity: "", liveEventLink: "" });
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    const announcements = [
      ...(club.announcements || []),
      {
        title: announcementForm.title,
        body: announcementForm.body,
        link: announcementForm.link,
      },
    ];
    await onSaveClub({ announcements });
    setAnnouncementForm({ title: "", body: "", link: "" });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail || !memberEmail.trim()) return;
    const email = memberEmail.trim();
    try {
      if (onAddMember) {
        await onAddMember([email]);
      } else {
        await onSaveClub({ members: [email] });
      }
      setMemberEmail("");
    } catch (err) {
      console.error("ADD_MEMBER_ERR", err);
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-white/10 bg-black/30 p-5">
      <div>
        <h4 className="text-lg font-semibold text-white">Recruitment & updates</h4>
        <p className="text-sm text-white/60">Toggle hiring status, share descriptions, attach forms.</p>
        <form onSubmit={handleClubSubmit} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={clubForm.hiringStatus}
              onChange={(e) => setClubForm((prev) => ({ ...prev, hiringStatus: e.target.checked }))}
            />
            Accepting new members right now
          </label>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Recruitment Description</p>
            <textarea
              value={clubForm.hiringDescription}
              onChange={(e) => setClubForm((prev) => ({ ...prev, hiringDescription: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white placeholder:text-white/40"
              rows={4}
              placeholder="Share timelines, expectations, interview details..."
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Recruitment form URL</p>
            <Input
              type="url"
              value={clubForm.recruitmentFormUrl}
              onChange={(e) => setClubForm((prev) => ({ ...prev, recruitmentFormUrl: e.target.value }))}
              className="mt-2 bg-white/5 text-white placeholder:text-white/40"
              placeholder="https://forms.gle/..."
            />
          </div>
          <button
            type="submit"
            className={cn(
              "w-full rounded-2xl bg-emerald-600/80 px-4 py-3 text-sm font-semibold text-white transition",
              savingClub && "opacity-60"
            )}
            disabled={savingClub}
          >
            {savingClub ? "Saving..." : "Save recruitment updates"}
          </button>
        </form>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white">Add member</h4>
        <p className="text-sm text-white/60">Invite a student to the club by their email.</p>
        <form onSubmit={handleAddMember} className="mt-4 space-y-3">
          <Input
            required
            type="email"
            placeholder="student@example.com"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="bg-white/5 text-white"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600/80 px-4 py-3 text-sm font-semibold text-white"
            disabled={addingMember || savingClub}
          >
            {addingMember ? "Adding..." : "Add member"}
          </button>
        </form>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white">Create quick event</h4>
        <p className="text-sm text-white/60">Publish an event to appear across the calendar & booking flow.</p>
        <form onSubmit={handleEventSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            required
            placeholder="Event title"
            value={eventForm.title}
            onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-white/5 text-white placeholder:text-white/40 md:col-span-2"
          />
          <textarea
            required
            placeholder="What is this about?"
            value={eventForm.description}
            onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
            className="md:col-span-2 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white placeholder:text-white/40"
            rows={3}
          />
          <Input
            required
            type="datetime-local"
            value={eventForm.date}
            onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <Input
            placeholder="Capacity (optional)"
            type="number"
            min="0"
            value={eventForm.capacity}
            onChange={(e) => setEventForm((prev) => ({ ...prev, capacity: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <Input
            placeholder="Location or room"
            value={eventForm.location}
            onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <Input
            placeholder="Live event link (optional)"
            value={eventForm.liveEventLink}
            onChange={(e) => setEventForm((prev) => ({ ...prev, liveEventLink: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <button
            type="submit"
            className={cn(
              "md:col-span-2 w-full rounded-2xl bg-blue-600/80 px-4 py-3 text-sm font-semibold text-white",
              creatingEvent && "opacity-60"
            )}
            disabled={creatingEvent}
          >
            {creatingEvent ? "Publishing..." : "Publish event"}
          </button>
        </form>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white">Share announcement</h4>
        <p className="text-sm text-white/60">Post a quick update for members (recruitment, results, news).</p>
        <form onSubmit={handleAnnouncementSubmit} className="mt-4 space-y-3">
          <Input
            required
            placeholder="Announcement title"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <textarea
            required
            placeholder="Details"
            value={announcementForm.body}
            onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, body: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white"
          />
          <Input
            placeholder="Optional link"
            value={announcementForm.link}
            onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, link: e.target.value }))}
            className="bg-white/5 text-white"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-purple-600/70 px-4 py-3 text-sm font-semibold text-white"
          >
            Post announcement
          </button>
        </form>
      </div>
    </div>
  );
}
