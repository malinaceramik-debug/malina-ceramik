// Central app state. One store, one selectedFisheryId, one set of domain
// records — every feature reads/writes here instead of keeping its own
// parallel "fake selected state" (explicit requirement in the build order).
import * as db from '../storage/db.js';
import { SPECIES, FISHERIES, WATER_BODIES, SPECIES_PRESENCE, REGULATIONS, DEFAULT_GEAR_KITS, DEMO_USER, DEMO_FRIENDS } from '../data/fixtures.js';
import * as Trip from '../domain/trip.js';
import { createCatch, isPersonalBest } from '../domain/catch.js';
import { createPrivateSpot } from '../domain/spot.js';
import { createGearKit, updateGearKit as updateGearKitDomain } from '../domain/gear.js';
import { computeEarnedAchievements } from '../domain/achievement.js';

const listeners = new Set();

const state = {
  ready: false,
  user: DEMO_USER,
  species: SPECIES,
  fisheries: FISHERIES,
  waterBodies: WATER_BODIES,
  speciesPresence: SPECIES_PRESENCE,
  regulations: REGULATIONS,
  friends: DEMO_FRIENDS,
  trips: /** @type {any[]} */ ([]),
  catches: /** @type {any[]} */ ([]),
  privateSpots: /** @type {any[]} */ ([]),
  gearKits: /** @type {any[]} */ ([]),
  newPbEventCount: 0,
  ui: {
    route: '#/map',
    selectedFisheryId: null,
    scan: { phase: 'idle', wave: 0, results: [] }, // 'idle'|'scanning'|'done'
    activeTripId: null,
    toast: null,
    lastCatchCelebration: null, // set once after a catch save, consumed by UI then cleared
  },
};

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(state);
}

function persistEntity(storeName, record) {
  db.put(storeName, record).catch((err) => console.error(`[fishi] persist ${storeName} failed`, err));
}

// ---------- Boot / seed ----------

export async function init() {
  const [trips, catches, privateSpots, gearKits] = await Promise.all([
    db.getAll('trips'),
    db.getAll('catches'),
    db.getAll('privateSpots'),
    db.getAll('gearKits'),
  ]);

  state.trips = trips;
  state.catches = catches;
  state.privateSpots = privateSpots;
  state.gearKits = gearKits;

  if (gearKits.length === 0) {
    const seeded = DEFAULT_GEAR_KITS(state.user.id);
    state.gearKits = seeded;
    await db.putAll('gearKits', seeded);
  }

  const settings = db.getSettings();
  if (settings.activeTripId && trips.some((t) => t.id === settings.activeTripId)) {
    state.ui.activeTripId = settings.activeTripId;
  }

  state.ready = true;
  notify();
}

// ---------- UI-only state ----------

export function setRoute(route) {
  state.ui.route = route;
  notify();
}

export function setSelectedFishery(fisheryId) {
  state.ui.selectedFisheryId = fisheryId;
  notify();
}

export function showToast(message) {
  state.ui.toast = { message, id: Date.now() };
  notify();
}

export function clearToast() {
  state.ui.toast = null;
  notify();
}

export function setScanState(scan) {
  state.ui.scan = { ...state.ui.scan, ...scan };
  notify();
}

export function consumeCatchCelebration() {
  const c = state.ui.lastCatchCelebration;
  state.ui.lastCatchCelebration = null;
  return c;
}

// ---------- Trip actions ----------

export function createPlannedTrip(fields) {
  const trip = Trip.createTrip({ ownerId: state.user.id, ...fields });
  state.trips = [...state.trips, trip];
  persistEntity('trips', trip);
  notify();
  return trip;
}

export function startSpontaneousTrip() {
  let trip = Trip.createTrip({ ownerId: state.user.id });
  trip = Trip.startTrip(trip); // startAt = exact click moment, never backdated
  state.trips = [...state.trips, trip];
  state.ui.activeTripId = trip.id;
  db.setSettings({ activeTripId: trip.id });
  persistEntity('trips', trip);
  notify();
  return trip;
}

export function startPlannedTrip(tripId) {
  const trip = requireTrip(tripId);
  const started = Trip.startTrip(trip);
  replaceTrip(started);
  state.ui.activeTripId = started.id;
  db.setSettings({ activeTripId: started.id });
  return started;
}

export function pauseActiveTrip() {
  const trip = requireTrip(state.ui.activeTripId);
  replaceTrip(Trip.pauseTrip(trip));
}

export function resumeActiveTrip() {
  const trip = requireTrip(state.ui.activeTripId);
  replaceTrip(Trip.resumeTrip(trip));
}

export function finishActiveTrip({ at } = {}) {
  const trip = requireTrip(state.ui.activeTripId);
  const finished = Trip.finishTrip(trip, { at });
  replaceTrip(finished);
  state.ui.activeTripId = null;
  db.setSettings({ activeTripId: null });
  return finished;
}

export function inviteFriendToActiveTrip(friendId) {
  const trip = requireTrip(state.ui.activeTripId);
  replaceTrip(Trip.addParticipant(trip, friendId));
}

export function addParticipantToTrip(tripId, friendId) {
  const trip = requireTrip(tripId);
  replaceTrip(Trip.addParticipant(trip, friendId));
}

export function recordRoutePointForActiveTrip(point) {
  if (!state.ui.activeTripId) return;
  const trip = requireTrip(state.ui.activeTripId);
  replaceTrip(Trip.recordRoutePoint(trip, point));
}

export function suggestForgottenEnd(tripId, reason) {
  const trip = requireTrip(tripId);
  replaceTrip({ ...trip, forgottenEndSuggestion: { suggestedAt: new Date().toISOString(), reason } });
}

export function dismissForgottenEnd(tripId) {
  const trip = requireTrip(tripId);
  replaceTrip({ ...trip, forgottenEndSuggestion: null });
}

export function assignGearToTrip(tripId, gearKitId) {
  const trip = requireTrip(tripId);
  replaceTrip({ ...trip, gearKitId });
}

function requireTrip(tripId) {
  const trip = state.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error(`Trip ${tripId} not found`);
  return trip;
}

function replaceTrip(trip) {
  state.trips = state.trips.map((t) => (t.id === trip.id ? trip : t));
  persistEntity('trips', trip);
  notify();
  return trip;
}

// ---------- Catch actions ----------

export function addCatchToActiveTrip(fields) {
  const tripId = state.ui.activeTripId;
  const trip = requireTrip(tripId);
  const c = createCatch({
    tripId,
    ownerId: fields.ownerId ?? state.user.id,
    speciesId: fields.speciesId ?? null,
    position: fields.position ?? null,
    photoIds: fields.photoIds ?? [],
    length: fields.length ?? null,
    weight: fields.weight ?? null,
    releaseStatus: fields.releaseStatus ?? 'unknown',
    gearKitId: fields.gearKitId ?? null,
    note: fields.note ?? '',
  });

  const priorCatches = state.catches;
  const pb = isPersonalBest(priorCatches, c);

  state.catches = [...state.catches, c];
  persistEntity('catches', c);
  replaceTrip(Trip.linkCatch(requireTrip(tripId), c.id));

  const isFirstEver = priorCatches.filter((x) => x.ownerId === c.ownerId).length === 0;
  if (pb.length || pb.weight) state.newPbEventCount += 1;

  state.ui.lastCatchCelebration = {
    catchId: c.id,
    isFirstEver,
    isFirstSpeciesEver: c.speciesId ? !priorCatches.some((x) => x.speciesId === c.speciesId) : false,
    isPbLength: pb.length,
    isPbWeight: pb.weight,
  };

  notify();
  return c;
}

export function addFriendCatch({ friendId, speciesId }) {
  const tripId = state.ui.activeTripId;
  if (!tripId) return null;
  const c = createCatch({ tripId, ownerId: friendId, speciesId, releaseStatus: 'unknown' });
  state.catches = [...state.catches, c];
  persistEntity('catches', c);
  replaceTrip(Trip.linkCatch(requireTrip(tripId), c.id));
  return c;
}

// ---------- Private spots ----------

export function savePrivateSpot({ fisheryId, position, label, createdFromTripId }) {
  const spot = createPrivateSpot({ ownerId: state.user.id, fisheryId, position, label, createdFromTripId });
  state.privateSpots = [...state.privateSpots, spot];
  persistEntity('privateSpots', spot);
  notify();
  return spot;
}

// ---------- Gear ----------

export function addGearKit({ name, items }) {
  const kit = createGearKit({ ownerId: state.user.id, name, items });
  state.gearKits = [...state.gearKits, kit];
  persistEntity('gearKits', kit);
  notify();
  return kit;
}

export function editGearKit(kitId, patch) {
  const kit = state.gearKits.find((k) => k.id === kitId);
  if (!kit) return;
  const updated = updateGearKitDomain(kit, patch);
  state.gearKits = state.gearKits.map((k) => (k.id === kitId ? updated : k));
  persistEntity('gearKits', updated);
  notify();
}

// ---------- Derived / selectors ----------

export function getAchievements() {
  return computeEarnedAchievements({
    trips: state.trips,
    catches: state.catches,
    privateSpots: state.privateSpots,
    newPbEventCount: state.newPbEventCount,
  });
}

export function getActiveTrip() {
  return state.ui.activeTripId ? state.trips.find((t) => t.id === state.ui.activeTripId) ?? null : null;
}

export function getCatchesForTrip(tripId) {
  return state.catches.filter((c) => c.tripId === tripId);
}

export function filterMapBySpecies(speciesId) {
  const matches = state.fisheries.filter((f) => f.speciesIds.includes(speciesId));
  state.ui.scan = { phase: 'done', wave: 3, results: matches };
  state.ui.selectedFisheryId = matches[0]?.id ?? null;
  notify();
  return matches;
}

// ---------- Demo scenario loader (Alpha only) ----------

export async function loadDemoScenario(name) {
  const { applyScenario } = await import('../data/scenarios.js');
  await applyScenario(name, { state, persistEntity, notify });
}

export async function resetAllData() {
  await db.clearAll();
  db.setSettings({ activeTripId: null });
  state.trips = [];
  state.catches = [];
  state.privateSpots = [];
  state.gearKits = DEFAULT_GEAR_KITS(state.user.id);
  await db.putAll('gearKits', state.gearKits);
  state.newPbEventCount = 0;
  state.ui.activeTripId = null;
  notify();
}
