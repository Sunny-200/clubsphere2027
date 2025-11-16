# Clubs Experience Revamp Plan

_Last updated: 2025-11-14_

## Goals
- Display all clubs with rich metadata (lead, co-lead, members, gallery, recruitment status).
- Role-aware actions: 
  - **Admin**: create/delete clubs, assign leads.
  - **Student (non-lead)**: browse clubs, RSVP/Book events, receive notifications.
  - **Student Lead/Co-lead**: update club info, manage recruitment, events, gallery.
- Calendar-first experience so members can see upcoming events and their RSVPs immediately after login.

## Page Composition (`src/app/(main)/clubs/page.jsx`)
1. **Hero + Role Call-to-Action**
   - Snapshot of the user's role and quick actions ("Create Club", "Manage Events", "Browse events").
2. **Club Explorer Grid**
   - Cards with name, lead avatars, tags (open recruiting, #events this month), quick buttons (view, manage, RSVP).
   - Search + filters (by category/status/upcoming events).
3. **Details Drawer**
   - Opens when a card is selected.
   - Tabs: Overview, Members, Events, Gallery, Recruitment.
4. **Calendar & Upcoming Events**
   - Month view with badges per event; user RSVPs highlighted.
   - Sidebar timeline of the next 3–5 events + reminders.

## New/Updated Components
| Component | Path | Purpose |
|-----------|------|---------|
| `ClubExplorer` | `src/components/clubs/ClubExplorer.jsx` | Fetch & render club cards with filters/search.
| `ClubCard` | `src/components/clubs/ClubCard.jsx` | Individual summary card with role-aware actions.
| `ClubDetailsDrawer` | `src/components/clubs/ClubDetailsDrawer.jsx` | Drawer showing tabs (overview, members, events, gallery, recruitment info).
| `AdminClubDrawer` | `src/components/clubs/AdminClubDrawer.jsx` | Admin-only drawer to create clubs, pre-filling the lead with the signed-in admin but allowing overrides.
| `LeadManagementPanel` | `src/components/clubs/LeadManagementPanel.jsx` | Lead/Co-lead tools (update description, hiring status, recruitment form URL, announcements, events).
| `EventBookingDialog` | `src/components/clubs/EventBookingDialog.jsx` | Student RSVP form capturing name/email/notes and hitting `/api/events/[id]/rsvp`.
| `CalendarPanel` | `src/components/clubs/CalendarPanel.jsx` | Month grid using `date-fns`, shows events + highlights RSVPs.
| `Modal` | `src/components/clubs/Modal.jsx` | Shared dialog shell powering drawers and confirmation prompts.

## Client State & Hooks
| Hook | Responsibility |
|------|----------------|
| `useAuthUser` (new) | Reads JWT from localStorage, fetches `/api/auth/me`, exposes `user`, `isAdmin`, `isLeadOf(clubId)` helpers.
| `useClubsData` (new) | Wraps SWR/fetch for `/api/clubs`, caches clubs/events, exposes mutators for create/update/delete.
| `useCalendarEvents` (new) | Fetches `/api/events/calendar`, merges with RSVP data, exposes `bookEvent` and `cancelBooking`.
| `calendarUtils` (new) | (`src/lib/calendarUtils.js`) Deterministic helpers for month filtering, day lookups, upcoming events, and capacity states shared by hooks + UI.

## API / Backend Enhancements
1. **Models**
   - `EventModel.js`: fix imports; rename `dates`→`date`; add `location`, `capacity`, `rsvps` sub-docs `{ user, email, note, status, notifiedAt }`.
   - `Club.js`: add `recruitmentFormUrl`, `recruitmentWindow`, `announcements` (array of `{ title, body, link, expiresAt }`).
2. **Routes**
   - `POST /api/clubs`: admin-only; accepts lead/co-lead by Mongo ID **or** email, validates existence, and auto-seeds the members array with whoever is assigned to leadership.
   - `PATCH /api/clubs/[id]`: allow updates to description, hiring status, recruitment info, announcements.
   - `POST /api/clubs/[id]/events`: lead/co-lead/admin create events.
   - `GET /api/clubs/[id]/events`: populate RSVPs for detail panel.
   - `POST /api/events/[eventId]/rsvp`: students submit RSVP (email uniqueness enforced per event). Sends confirmation email + rejects if delivery fails.
   - `DELETE /api/events/[eventId]/rsvp`: authenticated attendee or matching email can cancel their seat. Removes RSVP, frees capacity, and emails a cancellation receipt.
   - `GET /api/events/calendar`: returns upcoming events (optionally filtered by user) for calendar view.
   - `PATCH /api/events/[eventId]`: update event metadata (lead/admin).
3. **Email notifications**
   - Add `lib/mailer.js` (Nodemailer + Resend fallback) to send RSVP confirmation + reminder (cron or background job placeholder).
4. **Validation**
   - Extend `src/validation/authSchemas.js` or create `clubSchemas.js` for creation/updating events & clubs.

## User Flows
1. **Admin creating a club**
   - Click "Create Club" button → drawer form → POST `/api/clubs` → optimistic card append.
2. **Student browsing & booking**
   - See public clubs grid → open details → see events tab → click "Book spot" → RSVP dialog → success message + event appears on calendar + confirmation email.
   - If plans change, student hits "Cancel RSVP" → DELETE request (token or email) → slot freed + cancellation email delivered.
3. **Lead updating recruitment**
   - In details panel, `Recruitment` tab shows toggles for hiring, form URL, upcoming interviews. Submit hits PATCH `/api/clubs/[id]`.
4. **Lead managing events**
   - In Events tab, can create event (title, date, location, capacity) → POST to events route; also see RSVP list.
5. **Calendar reminders**
   - Month grid fetches aggregated events; user RSVPs marked with accent color. Hover reveals event info; clicking opens detail drawer targeting that club/event.

## UI/UX Styling Notes
- Continue dark neon style from landing page; use gradients, frosted glass cards.
- Provide skeleton loaders for club list & calendar while fetching.
- Ensure mobile support: switch to stacked layout with sticky CTA + scrollable cards.
- Accessibility: focus traps in dialogs, ARIA labels on calendar cells.

## Open Questions / Assumptions
- Email infra: assume SMTP creds available; fallback to console log in dev.
- Gallery storage: currently only URL/public_id; assume uploads happen elsewhere, we just store references.
- Notifications: reminder scheduling left as placeholder with `scheduledReminderAt` field and TODO note.

---
**Next Steps**
1. Update schemas + API routes to support the data contract.
2. Build hooks/components listed above.
3. Integrate calendar + RSVP + lead/admin controls into `clubs` page.
