'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Container from '@/components/miscellaneous/Container';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClubsData } from '@/hooks/useClubsData';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { ClubExplorer } from '@/components/clubs/ClubExplorer';
import { ClubDetailsDrawer } from '@/components/clubs/ClubDetailsDrawer';
import { AdminClubDrawer } from '@/components/clubs/AdminClubDrawer';
import { EventBookingDialog } from '@/components/clubs/EventBookingDialog';
import { DayEventsModal } from '@/components/clubs/DayEventsModal';
import { CalendarPanel } from '@/components/clubs/CalendarPanel';
import { UserRoleCard } from '@/components/shared/UserRoleCard';
import { collectUserLeadership } from '@/lib/collectUserLeadership';
import { eventsOnDate } from '@/lib/calendarUtils';
import Link from 'next/link';

const heroCards = [
  {
    title: 'Explore',
    description: 'Scroll through every club, meet the leads and dive into their stories.',
  },
  {
    title: 'Book',
    description: 'RSVP to hackathons, workshops or meetups in just a couple clicks.',
  },
  {
    title: 'Manage',
    description: 'Leads can broadcast recruitment, manage gallery drops and events.',
  },
];

export default function ClubsPage() {
  const { user, token, loading: userLoading, isAdmin } = useAuthUser();
  const {
    clubs,
    loading: clubsLoading,
    createClub,
    updateClub,
    deleteClub,
    refresh: refreshClubs,
  } = useClubsData(token);
  const {
    events,
    loading: eventsLoading,
    refresh: refreshEvents,
    bookEvent,
    cancelEvent,
  } = useCalendarEvents(token);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [adminDrawerInstance, setAdminDrawerInstance] = useState(0);
  const [creatingClub, setCreatingClub] = useState(false);
  const [bookingState, setBookingState] = useState({ open: false, club: null, event: null });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  const [dayModal, setDayModal] = useState({ open: false, date: null, events: [] });
  const [adminNotice, setAdminNotice] = useState(null);
  const [deletingClubId, setDeletingClubId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [refreshingRsvps, setRefreshingRsvps] = useState(false);
  const [rsvpNotice, setRsvpNotice] = useState(null);
  const adminNoticeTimeoutRef = useRef(null);
  const rsvpNoticeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (adminNoticeTimeoutRef.current) {
        clearTimeout(adminNoticeTimeoutRef.current);
      }
      if (rsvpNoticeTimeoutRef.current) {
        clearTimeout(rsvpNoticeTimeoutRef.current);
      }
    };
  }, []);

  const closeAdminDrawer = () => {
    setShowAdminDrawer(false);
    setAdminDrawerInstance((prev) => prev + 1);
  };

  const handleRefreshRsvps = async () => {
    try {
      setRefreshingRsvps(true);
      const updated = await refreshEvents();
      setRsvpNotice('RSVPs refreshed successfully!');
      if (rsvpNoticeTimeoutRef.current) {
        clearTimeout(rsvpNoticeTimeoutRef.current);
      }
      rsvpNoticeTimeoutRef.current = setTimeout(() => setRsvpNotice(null), 4000);
      return updated;
    } catch (err) {
      setRsvpNotice('Failed to refresh RSVPs. Please try again.');
      if (rsvpNoticeTimeoutRef.current) {
        clearTimeout(rsvpNoticeTimeoutRef.current);
      }
      rsvpNoticeTimeoutRef.current = setTimeout(() => setRsvpNotice(null), 4000);
    } finally {
      setRefreshingRsvps(false);
    }
  };

  const selectedClub = useMemo(
    () => clubs.find((club) => club._id === selectedClubId) ?? null,
    [clubs, selectedClubId]
  );

  const sortedEventsByClub = useMemo(() => {
    const map = new Map();
    events.forEach((evt) => {
      const clubId = evt.club?._id?.toString() || evt.club?._id || evt.club;
      if (!clubId) return;
      const list = map.get(clubId) || [];
      list.push(evt);
      map.set(clubId, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
      map.set(key, list);
    });
    return map;
  }, [events]);

  const clubsWithMeta = useMemo(() => {
    const now = new Date();
    return clubs.map((club) => {
      const clubEvents = sortedEventsByClub.get(club._id) || [];
      const upcomingCount = clubEvents.filter((evt) => new Date(evt.date) >= now).length;
      return { ...club, upcomingEventCount: upcomingCount };
    });
  }, [clubs, sortedEventsByClub]);

  const leadershipAssignments = useMemo(() => collectUserLeadership(user, clubs), [user, clubs]);

  const userId = user?._id || user?.id || null;
  const userClubs = useMemo(() => {
    if (!userId || !Array.isArray(clubs)) return [];
    return clubs.filter((club) => {
      if (!Array.isArray(club.members)) return false;
      return club.members.some((m) => {
        const mid = m?._id || m?.id || m;
        return mid && String(mid) === String(userId);
      });
    });
  }, [clubs, userId]);

  const handleOpenClub = (club) => {
    setSelectedClubId(club._id);
    setDrawerOpen(true);
  };

  const handleOpenBooking = (club, event) => {
    if (!event) {
      const nextEvent = sortedEventsByClub.get(club._id)?.[0];
      if (!nextEvent) {
        setSelectedClubId(club._id);
        setDrawerOpen(true);
        return;
      }
      event = nextEvent;
    }
    setBookingState({ open: true, club, event });
    // close day modal if open
    setDayModal({ open: false, date: null, events: [] });
  };

  const handleCreateClub = async (payload) => {
    try {
      setCreatingClub(true);
      const created = await createClub(payload);
      await refreshClubs();
      closeAdminDrawer();
      const message = created?.name ? `"${created.name}" is live for members.` : "Club created successfully.";
      setAdminNotice(message);
      if (adminNoticeTimeoutRef.current) {
        clearTimeout(adminNoticeTimeoutRef.current);
      }
      adminNoticeTimeoutRef.current = setTimeout(() => setAdminNotice(null), 5000);
      return created;
    } catch (err) {
      console.error('CREATE_CLUB_ERR', err);
      throw err;
    } finally {
      setCreatingClub(false);
    }
  };

  const handleDeleteClub = async (club) => {
    if (!club?._id) return;
    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(`Delete "${club.name}"? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setDeletingClubId(club._id);
      await deleteClub(club._id);
      setDrawerOpen(false);
      setSelectedClubId(null);
      await refreshClubs();
      await refreshEvents();
      setAdminNotice(`"${club.name}" has been deleted.`);
      if (adminNoticeTimeoutRef.current) {
        clearTimeout(adminNoticeTimeoutRef.current);
      }
      adminNoticeTimeoutRef.current = setTimeout(() => setAdminNotice(null), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingClubId(null);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event) return;
    const eventId = event._id || event.id;
    if (!eventId) return;
    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(`Cancel event "${event.title}"? This will remove it for everyone.`);
    if (!confirmed) return;
    try {
      setDeletingEventId(eventId);
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Unable to delete event');
      const updatedEvents = await refreshEvents();
      await refreshClubs();
      // If a day modal is open, refresh its event list to remove the deleted event
      if (dayModal.open && dayModal.date) {
        const updated = eventsOnDate(updatedEvents || events, dayModal.date);
        setDayModal((prev) => ({ ...prev, events: updated }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleUpdateClub = (clubId) => async (payload) => {
    await updateClub(clubId, payload);
    refreshClubs();
  };

  const handleCreateEvent = async (club, payload) => {
    if (!token) throw new Error('Not authorized');
  const res = await fetch(`/api/clubs/${club._id}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Unable to create event');
    }
    await refreshEvents();
    return data.event;
  };

  const handleBookingSubmit = async ({ eventId, attendeeName, attendeeEmail, notes }) => {
    try {
      setBookingLoading(true);
      await bookEvent({ eventId, attendeeName, attendeeEmail, notes });
      setBookingState((prev) => ({ ...prev, open: false }));
      // Trigger the visible "Refresh my RSVPs" flow and get updated events
      const updatedEvents = await handleRefreshRsvps();
      // If a day modal is open, refresh its event list to reflect updated RSVP state
      if (dayModal.open && dayModal.date) {
        const updated = eventsOnDate(updatedEvents || events, dayModal.date);
        setDayModal((prev) => ({ ...prev, events: updated }));
      }
    } catch (err) {
      throw err;
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async ({ eventId, attendeeEmail }) => {
    if (!eventId) throw new Error('Missing event id');
    const idValue = String(eventId);
    try {
      setCancellingEventId(idValue);
      await cancelEvent({ eventId, attendeeEmail: attendeeEmail ?? user?.email });
      // Trigger the visible "Refresh my RSVPs" flow and get updated events
      const updatedEvents = await handleRefreshRsvps();
      // If a day modal is open, refresh its event list to reflect updated RSVP state
      if (dayModal.open && dayModal.date) {
        const updated = eventsOnDate(updatedEvents || events, dayModal.date);
        setDayModal((prev) => ({ ...prev, events: updated }));
      }
    } catch (err) {
      throw err;
    } finally {
      setCancellingEventId(null);
    }
  };

  const handleOpenDayEvents = ({ date, events }) => {
    setDayModal({ open: true, date, events });
  };

  const handleCloseDayEvents = () => setDayModal({ open: false, date: null, events: [] });

  const isUnauthenticated = !user && !userLoading;

  const heroSubtitle = isUnauthenticated
    ? 'Sign in to unlock bookings, reminders and notifications.'
    : `Logged in as ${user?.username} · ${user?.role === 'admin' ? 'Admin' : 'Member'}`;

  const pageLoading = userLoading || clubsLoading;

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <Container className="w-full flex-col gap-10">
        <section className="w-full rounded-[48px] border border-white/10 bg-linear-to-br from-zinc-900 to-black p-10 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {user && (
              <div className="w-full max-w-sm">
                <UserRoleCard
                  user={user}
                  leadClubs={leadershipAssignments.lead}
                  coLeadClubs={leadershipAssignments.colead}
                  initialOpen
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-col gap-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">ClubSphere Campus</p>
                <h1 className="text-4xl font-semibold md:text-5xl">Plan, build and experience every club in one place.</h1>
                <p className="text-lg text-white/70">{heroSubtitle}</p>
                {user && userClubs.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-white/60">Member of</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {userClubs.map((c) => (
                        <span
                          key={c._id || c.id}
                          className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/80"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {heroCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/5 bg-white/5 p-5">
                <p className="text-sm text-white/50">{card.title}</p>
                <p className="mt-2 text-base text-white/80">{card.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAdmin && (
              <button
                className="rounded-2xl bg-blue-600/80 px-5 py-3 text-sm font-semibold"
                onClick={() => setShowAdminDrawer(true)}
                type="button"
              >
                + Create club
              </button>
            )}
            {user && (
              <button
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRefreshRsvps}
                type="button"
                disabled={refreshingRsvps}
              >
                {refreshingRsvps ? 'Refreshing...' : 'Refresh my RSVPs'}
              </button>
            )}
      
          </div>
          {adminNotice && (
            <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {adminNotice}
            </p>
          )}
          {rsvpNotice && (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              rsvpNotice.includes('successfully')
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                : 'border-red-500/20 bg-red-500/10 text-red-100'
            }`}>
              {rsvpNotice}
            </p>
          )}
        </section>

        {isUnauthenticated ? (
          <div className="w-full rounded-4xl border border-white/5 bg-white/5 p-12 text-center text-white/70">
            <p className="text-lg font-semibold">Access locked</p>
            <p className="mt-2 text-sm text-white/60">
              Create an account or sign in to explore clubs, events, galleries and recruitment updates.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link href="/login" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl border border-white/30 px-5 py-3 text-sm text-white/80 hover:text-white"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : pageLoading ? (
          <div className="w-full rounded-4xl border border-white/5 bg-white/5 p-16 text-center text-white/60">
            Loading clubs...
          </div>
        ) : (
          <div className="grid w-full gap-8 lg:grid-cols-[2fr_1fr]">
            <ClubExplorer
              clubs={clubsWithMeta}
              user={user}
              onSelectClub={handleOpenClub}
              onManageClub={handleOpenClub}
              onBookEvent={handleOpenBooking}
            />
            <CalendarPanel
              events={events}
              loading={eventsLoading}
              onRefresh={refreshEvents}
              onSelectEvent={(club, event) => handleOpenBooking(club, event)}
              onOpenDayEvents={handleOpenDayEvents}
              onCancelEvent={async (event) => {
                try {
                  await handleCancelBooking({ eventId: event.id, attendeeEmail: user?.email });
                } catch (err) {
                  alert(err.message);
                }
              }}
              cancellingEventId={cancellingEventId}
            />
          </div>
        )}
      </Container>

      <ClubDetailsDrawer
        club={selectedClub}
        open={drawerOpen && Boolean(selectedClub)}
        globalEvents={events}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onUpdateClub={selectedClub ? handleUpdateClub(selectedClub._id) : () => Promise.resolve()}
        onCreateEvent={handleCreateEvent}
        onBookEvent={handleOpenBooking}
        onCancelEvent={(event) =>
          handleCancelBooking({ eventId: event._id, attendeeEmail: user?.email })
        }
        cancellingEventId={cancellingEventId}
        onDeleteEvent={handleDeleteEvent}
        onDeleteClub={handleDeleteClub}
        deletingClubId={deletingClubId}
        deletingEventId={deletingEventId}
      />

      <AdminClubDrawer
        key={`${adminDrawerInstance}-${user?._id || "anon"}`}
        open={showAdminDrawer}
        onClose={closeAdminDrawer}
        onCreate={handleCreateClub}
        creating={creatingClub}
        currentUser={user}
      />

      <EventBookingDialog
        open={bookingState.open}
        onClose={() => setBookingState((prev) => ({ ...prev, open: false }))}
        club={bookingState.club}
        event={bookingState.event}
        onSubmit={handleBookingSubmit}
        user={user}
        loading={bookingLoading}
      />
      <DayEventsModal
        open={dayModal.open}
        onClose={handleCloseDayEvents}
        date={dayModal.date}
        events={dayModal.events}
        onBook={(club, event) => handleOpenBooking(club, event)}
        onCancel={(evt) => handleCancelBooking({ eventId: evt._id || evt.id, attendeeEmail: user?.email })}
        onDelete={(evt) => handleDeleteEvent(evt)}
        cancellingEventId={cancellingEventId}
        user={user}
      />
    </div>
  );
}
