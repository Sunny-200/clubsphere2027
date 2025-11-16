"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal.jsx";
import { LeadManagementPanel } from "./LeadManagementPanel.jsx";

export function ClubDetailsDrawer({
  club,
  open,
  onClose,
  user,
  onUpdateClub,
  onCreateEvent,
  onBookEvent,
  onCancelEvent,
  cancellingEventId,
  onDeleteEvent,
  deletingEventId,
  onDeleteClub,
  deletingClubId,
  globalEvents,
}) {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [error, setError] = useState(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [coleadSearch, setColeadSearch] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const clubId = club?._id;
  const normalizedUserId = user?._id ? String(user._id) : user?.id ? String(user.id) : null;
  const isDeletingClub = clubId && deletingClubId ? String(deletingClubId) === String(clubId) : false;

  const isAdmin = user?.role === "admin";
  const isLeadOrCoLead = useMemo(() => {
    if (!club || !normalizedUserId) return false;
    const leadId = club.lead
      ? typeof club.lead === "string"
        ? club.lead
        : club.lead._id || club.lead.id
      : null;
    const coLeadId = club.colead
      ? typeof club.colead === "string"
        ? club.colead
        : club.colead._id || club.colead.id
      : null;
    return [leadId, coLeadId].some((id) => id && String(id) === normalizedUserId);
  }, [club, normalizedUserId]);

  const canManage = isAdmin || isLeadOrCoLead;

  const fetchEvents = useCallback(async () => {
    if (!clubId) return;
    try {
      setEventsLoading(true);
      const res = await fetch(`/api/clubs/${clubId}/events`);
      if (!res.ok) throw new Error("Unable to load events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("CLUB_EVENTS_ERR", err);
      setError(err.message);
    } finally {
      setEventsLoading(false);
    }
  }, [clubId]);

  // Keep local events in sync with global events when drawer is open.
  useEffect(() => {
    if (!open || !clubId || !Array.isArray(globalEvents)) return;
    const list = globalEvents.filter((evt) => {
      const evtClubId = evt.club?._id?.toString() || evt.club?._id || evt.club;
      return String(evtClubId) === String(clubId);
    });
    setEvents(list);
  }, [globalEvents, open, clubId]);

  useEffect(() => {
    if (open && clubId) {
      fetchEvents();
    }
  }, [open, clubId, fetchEvents]);

  const handleSaveClub = async (payload) => {
    try {
      setSavingClub(true);
      await onUpdateClub(payload);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingClub(false);
    }
  };

  const handleAddMembers = async (emails = []) => {
    try {
      setAddingMember(true);
      await onUpdateClub({ members: emails });
      // refresh events/members view
      await fetchEvents();
      setError(null);
    } catch (err) {
      console.error("ADD_MEMBERS_ERR", err);
      setError(err.message || "Unable to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleCreateEvent = async (payload) => {
    try {
      setCreatingEvent(true);
      if (!clubId) throw new Error("Club not found");
      await onCreateEvent(club, {
        ...payload,
        date: payload.date ? new Date(payload.date).toISOString() : undefined,
      });
      await fetchEvents();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingEvent(false);
    }
  };

  const recruitmentInfo = club?.hiringStatus
    ? club.hiringDescription || "We are currently accepting new members."
    : "Recruitment is currently paused.";

  const normalizedUserEmail = user?.email?.trim().toLowerCase() || null;

  const hasUserBooking = useCallback(
    (event) => {
      if (!event || !Array.isArray(event.rsvps)) return false;
      return event.rsvps.some((rsvp) => {
        if (normalizedUserId && rsvp.user) {
          const rsvpUserId = String(rsvp.user);
          if (rsvpUserId === normalizedUserId) {
            return true;
          }
        }
        if (normalizedUserEmail && rsvp.attendeeEmail) {
          return rsvp.attendeeEmail.trim().toLowerCase() === normalizedUserEmail;
        }
        return false;
      });
    },
    [normalizedUserEmail, normalizedUserId]
  );

  const handleCancelSeat = async (event) => {
    if (!onCancelEvent) return;
    try {
      await onCancelEvent(event);
      await fetchEvents();
      setError(null);
    } catch (err) {
      console.error("CLUB_CANCEL_RSVP_ERR", err);
      setError(err.message || "Unable to cancel RSVP");
    }
  };

  const handleSaveLeadership = async () => {
    try {
      setSavingClub(true);
      setError(null);
      
      const updates = {};
      
      if (leadSearch.trim() && leadSearch !== (club.lead?.email || "")) {
        updates.lead = leadSearch.trim();
      }
      
      if (coleadSearch.trim() && coleadSearch !== (club.colead?.email || "")) {
        updates.colead = coleadSearch.trim();
      }
      
      if (Object.keys(updates).length === 0) {
        setError("No changes to save");
        setSavingClub(false);
        return;
      }
      
      await onUpdateClub(updates);
      setLeadSearch("");
      setColeadSearch("");
      setError(null);
    } catch (err) {
      console.error("LEADERSHIP_UPDATE_ERR", err);
      setError(err.message || "Failed to update leadership");
    } finally {
      setSavingClub(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={club?.name ?? "Club details"}>
      {!club && <p>No club selected.</p>}
      {club && (
        <div className="space-y-8">
          {error && <p className="rounded-2xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}

          <section className="space-y-4">
            <p className="text-sm text-white/70">{club.description}</p>
            <div className="grid gap-3 text-sm text-white/60 md:grid-cols-3">
              <Stat label="Lead" value={club.lead?.username || "TBD"} />
              <Stat label="Co-lead" value={club.colead?.username || "—"} />
              <Stat label="Members" value={club.members?.length ?? 0} />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-base font-semibold text-white">Recruitment status</h4>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
              <p>{recruitmentInfo}</p>
              {club.recruitmentFormUrl && (
                <a
                  href={club.recruitmentFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-emerald-300"
                >
                  Open recruitment form ↗
                </a>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Upcoming events</h4>
              <button
                className="text-sm text-white/60 hover:text-white"
                onClick={fetchEvents}
                disabled={eventsLoading}
              >
                Refresh
              </button>
            </div>
            {eventsLoading ? (
              <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-6 text-center text-white/60">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/60">
                No events published yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((event) => {
                  const eventId = event._id || event.id;
                  const isCancelling = cancellingEventId === String(eventId);
                  const isFull = Boolean(event.capacity) && (event.rsvps?.length ?? 0) >= event.capacity;
                  const userBooked = hasUserBooking(event);
                  return (
                    <li
                      key={eventId}
                      className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 text-sm text-white/80"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-white/50">
                          {new Date(event.date).toLocaleString()} • {event.location || "TBA"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        {event.capacity ? (
                          <span>
                            {event.rsvps?.length ?? 0}/{event.capacity} seats
                          </span>
                        ) : (
                          <span>{event.rsvps?.length ?? 0} RSVPs</span>
                        )}
                        {userBooked ? (
                          <button
                            className="rounded-full bg-red-500/20 px-4 py-1 text-red-100 disabled:opacity-60"
                            onClick={() => handleCancelSeat(event)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? "Cancelling..." : "Cancel RSVP"}
                          </button>
                        ) : (
                          <button
                            className="rounded-full bg-white/10 px-4 py-1 text-white disabled:opacity-50"
                            onClick={() => onBookEvent?.(club, event)}
                            disabled={isFull}
                          >
                            {isFull ? "Full" : "RSVP"}
                          </button>
                        )}
                        {canManage && (
                          <button
                            className="rounded-full border border-red-500/20 px-4 py-1 text-red-100 disabled:opacity-60"
                            onClick={() => onDeleteEvent?.(event)}
                            disabled={deletingEventId === String(eventId)}
                          >
                            {deletingEventId === String(eventId) ? "Cancelling..." : "Cancel event"}
                          </button>
                        )}
                      </div>
                    </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="text-base font-semibold text-white">Members</h4>
            <div className="flex flex-wrap gap-2">
              {club.members?.length ? (
                club.members.map((member) => (
                  <span
                    key={member._id}
                    className="rounded-full border border-white/10 px-4 py-1 text-sm text-white/70"
                  >
                    {member.username}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/60">No members added yet.</p>
              )}
            </div>
          </section>

          {club.galleryImages?.length ? (
            <section className="space-y-3">
              <h4 className="text-base font-semibold text-white">Gallery</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {club.galleryImages.map((image) => (
                  <div
                    key={image.public_id}
                    className="relative h-32 overflow-hidden rounded-2xl border border-white/5 bg-white/5"
                  >
                    <img
                      src={image.url}
                      alt="Club gallery"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {club.announcements?.length ? (
            <section className="space-y-3">
              <h4 className="text-base font-semibold text-white">Latest announcements</h4>
              <div className="space-y-2">
                {club.announcements.map((announce) => (
                  <div
                    key={`${announce.title}-${announce.expiresAt ?? "permanent"}`}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/80"
                  >
                    <p className="font-semibold text-white">{announce.title}</p>
                    <p className="text-white/70">{announce.body}</p>
                    {announce.link && (
                      <a
                        href={announce.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-sky-300"
                      >
                        View more ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isAdmin && onDeleteClub && (
            <section className="space-y-3">
              <h4 className="text-base font-semibold text-white">Admin controls</h4>
              <p className="text-sm text-white/60">Edit club leadership or delete the entire club.</p>
              
              <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Lead</label>
                  <input
                    type="email"
                    placeholder="Enter lead email"
                    defaultValue={club.lead?.email || ""}
                    onChange={(e) => {
                      setLeadSearch(e.target.value);
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                  {club.lead && (
                    <p className="mt-2 text-xs text-white/60">Current: {club.lead.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Co-lead</label>
                  <input
                    type="email"
                    placeholder="Enter co-lead email (optional)"
                    defaultValue={club.colead?.email || ""}
                    onChange={(e) => {
                      setColeadSearch(e.target.value);
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                  {club.colead && (
                    <p className="mt-2 text-xs text-white/60">Current: {club.colead.email}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl bg-blue-600/80 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => handleSaveLeadership()}
                  disabled={savingClub}
                >
                  {savingClub ? "Saving..." : "Save leadership changes"}
                </button>
              </div>

              <p className="text-sm text-white/60 mt-4">Deleting a club removes its events, gallery, and members.</p>
              <button
                type="button"
                className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                onClick={() => onDeleteClub(club)}
                disabled={isDeletingClub}
              >
                {isDeletingClub ? "Deleting club..." : "Delete club"}
              </button>
            </section>
          )}

          {canManage && (
            <LeadManagementPanel
              key={club._id || club.id || "club"}
              club={club}
              onSaveClub={handleSaveClub}
              onAddMember={handleAddMembers}
              addingMember={addingMember}
              onCreateEvent={handleCreateEvent}
              savingClub={savingClub}
              creatingEvent={creatingEvent}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}
