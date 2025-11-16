import assert from "node:assert/strict";
import {
  eventsInMonth,
  eventsOnDate,
  getUpcomingEvents,
  getAvailabilityState,
} from "../src/lib/calendarUtils.js";

const sampleEvents = [
  {
    id: "kickoff",
    title: "Fall Kickoff",
    date: "2025-09-05T17:00:00.000Z",
    capacity: 100,
    rsvps: new Array(95).fill(null),
  },
  {
    id: "retro",
    title: "Monthly Retro",
    date: "2025-09-15T12:00:00.000Z",
    capacity: 30,
    rsvps: new Array(30).fill(null),
  },
  {
    id: "hacknight",
    title: "Hack Night",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    capacity: 20,
    rsvps: [{ email: "dev@example.com" }],
  },
];

const september = new Date("2025-09-01T00:00:00.000Z");

function testEventsInMonth() {
  const filtered = eventsInMonth(sampleEvents, september);
  assert.equal(filtered.length, 2, "Should include only September events");
}

function testEventsOnDate() {
  const day = new Date("2025-09-05T00:00:00.000Z");
  const events = eventsOnDate(sampleEvents, day);
  assert.equal(events.length, 1, "Should find a single event on Sept 5th");
  assert.equal(events[0].id, "kickoff");
}

function testUpcoming() {
  const upcoming = getUpcomingEvents(sampleEvents, 2, new Date("2025-09-01"));
  assert.equal(upcoming.length, 2, "Should return the requested limit");
  assert.equal(upcoming[0].id, "kickoff", "Soonest event should be first");
}

function testAvailability() {
  assert.equal(getAvailabilityState(sampleEvents[0]), "limited", "Limited seats when <=5 remain");
  assert.equal(getAvailabilityState(sampleEvents[1]), "full", "Full when at capacity");
  assert.equal(getAvailabilityState(sampleEvents[2]), "open", "Open when plenty spots left");
  assert.equal(getAvailabilityState({ capacity: 0 }), "open", "Zero/undefined capacity defaults to open");
}

function run() {
  testEventsInMonth();
  testEventsOnDate();
  testUpcoming();
  testAvailability();
  console.log("✅ calendarUtils tests passed");
}

run();
