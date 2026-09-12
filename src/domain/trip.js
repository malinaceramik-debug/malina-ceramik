// Trip is the core object of Fishi (see CLAUDE.md / fishi-product-lock).
// A Catch is an event inside a Trip, never the Trip's value. A Trip with zero
// catches is a fully valid, presentable Trip.
import { createId } from './ids.js';

/** @typedef {'active'|'paused'|'ended'} TripPhase */

export function createTrip({ ownerId, fisheryId, privatePlaceName, goalSpeciesId, plannedFor, gearKitId } = {}) {
  const now = new Date().toISOString();
  return {
    id: createId('trip'),
    ownerId,
    startAt: null, // set explicitly on start — never backdated (see §12 spontaneous trip rule)
    endAt: null,
    phase: /** @type {TripPhase} */ ('planned'),
    fisheryId: fisheryId ?? null,
    privatePlaceName: privatePlaceName ?? null,
    goalSpeciesId: goalSpeciesId ?? null,
    gearKitId: gearKitId ?? null,
    plannedFor: plannedFor ?? null,
    participantIds: [],
    fishingSessions: [], // [{startAt, endAt|null}] — effort tracking, independent of catches
    routeSegments: [], // [{lat,lon,at,accuracy}]
    weatherSnapshots: [],
    catchIds: [],
    photoIds: [],
    forgottenEndSuggestion: null, // {suggestedAt, reason} — never auto-applied
    syncState: { kind: 'local-only' },
    createdAt: now,
    updatedAt: now,
  };
}

export function startTrip(trip, { at } = {}) {
  if (trip.phase !== 'planned' && trip.phase !== 'ended') {
    throw new Error(`Cannot start a trip in phase "${trip.phase}"`);
  }
  const startAt = at ?? new Date().toISOString();
  return {
    ...trip,
    phase: 'active',
    startAt,
    endAt: null,
    fishingSessions: [...trip.fishingSessions, { startAt, endAt: null }],
    updatedAt: new Date().toISOString(),
  };
}

export function pauseTrip(trip) {
  if (trip.phase !== 'active') throw new Error('Only an active trip can be paused');
  const sessions = trip.fishingSessions.slice();
  const last = sessions[sessions.length - 1];
  if (last && !last.endAt) sessions[sessions.length - 1] = { ...last, endAt: new Date().toISOString() };
  return { ...trip, phase: 'paused', fishingSessions: sessions, updatedAt: new Date().toISOString() };
}

export function resumeTrip(trip) {
  if (trip.phase !== 'paused') throw new Error('Only a paused trip can be resumed');
  const sessions = [...trip.fishingSessions, { startAt: new Date().toISOString(), endAt: null }];
  return { ...trip, phase: 'active', fishingSessions: sessions, updatedAt: new Date().toISOString() };
}

export function finishTrip(trip, { at } = {}) {
  if (trip.phase === 'ended') return trip; // idempotent
  if (trip.phase !== 'active' && trip.phase !== 'paused') {
    throw new Error(`Cannot finish a trip in phase "${trip.phase}"`);
  }
  const endAt = at ?? new Date().toISOString();
  const sessions = trip.fishingSessions.slice();
  const last = sessions[sessions.length - 1];
  if (last && !last.endAt) sessions[sessions.length - 1] = { ...last, endAt };
  return { ...trip, phase: 'ended', endAt, fishingSessions: sessions, updatedAt: new Date().toISOString() };
}

export function addParticipant(trip, participantId) {
  if (trip.participantIds.includes(participantId)) return trip; // idempotent
  return { ...trip, participantIds: [...trip.participantIds, participantId], updatedAt: new Date().toISOString() };
}

export function recordRoutePoint(trip, point) {
  // Never invent a route before the trip actually started.
  if (trip.phase !== 'active') return trip;
  return { ...trip, routeSegments: [...trip.routeSegments, point], updatedAt: new Date().toISOString() };
}

export function linkCatch(trip, catchId) {
  if (trip.phase === 'ended') throw new Error('A closed trip cannot accept new catches');
  if (trip.catchIds.includes(catchId)) return trip; // idempotent (retry-safe)
  return { ...trip, catchIds: [...trip.catchIds, catchId], updatedAt: new Date().toISOString() };
}

/** Total fishing-effort duration in ms, from closed sessions only (open session counted up to `now`). */
export function totalEffortMs(trip, now = Date.now()) {
  return trip.fishingSessions.reduce((sum, s) => {
    const end = s.endAt ? new Date(s.endAt).getTime() : now;
    return sum + Math.max(0, end - new Date(s.startAt).getTime());
  }, 0);
}

export function totalDurationMs(trip, now = Date.now()) {
  if (!trip.startAt) return 0;
  const end = trip.endAt ? new Date(trip.endAt).getTime() : now;
  return Math.max(0, end - new Date(trip.startAt).getTime());
}
