// Demo-mode scenario switcher (§27). Dev/demo-only convenience for exercising
// every flow without manually replaying it — never shown as user-facing
// "real" data. Each scenario clears local data first, then seeds a plausible
// state via the same domain factories/actions the app itself uses.
import * as Trip from '../domain/trip.js';
import { createCatch } from '../domain/catch.js';
import { createPrivateSpot } from '../domain/spot.js';
import * as db from '../storage/db.js';
import { DEFAULT_GEAR_KITS } from './fixtures.js';

function hoursAgoISO(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

export async function applyScenario(name, { state, persistEntity, notify }) {
  await db.clearAll();
  db.setSettings({ activeTripId: null });
  state.trips = [];
  state.catches = [];
  state.privateSpots = [];
  state.newPbEventCount = 0;
  state.ui.activeTripId = null;
  state.ui.selectedFisheryId = null;
  state.ui.scan = { phase: 'idle', wave: 0, results: [] };

  const ownerId = state.user.id;
  state.gearKits = DEFAULT_GEAR_KITS(ownerId);
  await db.putAll('gearKits', state.gearKits);
  const gearKitId = state.gearKits[1].id; // "Szczupak" kit

  function seedTrip(overrides) {
    let trip = Trip.createTrip({ ownerId, fisheryId: 'fishery_bagry', ...overrides });
    return trip;
  }

  switch (name) {
    case 'new_user': {
      // nothing seeded — genuinely first run
      break;
    }

    case 'scanner_results': {
      state.ui.scan = { phase: 'done', wave: 3, results: state.fisheries };
      break;
    }

    case 'planned_trip': {
      const trip = seedTrip({ plannedFor: hoursAgoISO(-20), goalSpeciesId: 'species_szczupak', gearKitId });
      state.trips = [trip];
      await db.putAll('trips', state.trips);
      break;
    }

    case 'active_empty_trip': {
      let trip = seedTrip({});
      trip = Trip.startTrip(trip, { at: hoursAgoISO(0.4) });
      state.trips = [trip];
      state.ui.activeTripId = trip.id;
      db.setSettings({ activeTripId: trip.id });
      await db.putAll('trips', state.trips);
      break;
    }

    case 'active_trip_with_catch': {
      let trip = seedTrip({ gearKitId });
      trip = Trip.startTrip(trip, { at: hoursAgoISO(1.2) });
      const c = createCatch({
        tripId: trip.id, ownerId, speciesId: 'species_szczupak',
        caughtAt: hoursAgoISO(0.3), length: { value: 61, unit: 'cm', method: 'measured_user' },
        releaseStatus: 'released', gearKitId,
      });
      trip = Trip.linkCatch(trip, c.id);
      state.trips = [trip];
      state.catches = [c];
      state.ui.activeTripId = trip.id;
      db.setSettings({ activeTripId: trip.id });
      await db.putAll('trips', state.trips);
      await db.putAll('catches', state.catches);
      break;
    }

    case 'shared_trip': {
      let trip = seedTrip({ gearKitId });
      trip = Trip.startTrip(trip, { at: hoursAgoISO(0.9) });
      trip = Trip.addParticipant(trip, 'user_marek');
      trip = Trip.addParticipant(trip, 'user_kamil');
      const mine = createCatch({ tripId: trip.id, ownerId, speciesId: 'species_okon', caughtAt: hoursAgoISO(0.4), releaseStatus: 'released' });
      const friendCatch = createCatch({ tripId: trip.id, ownerId: 'user_marek', speciesId: 'species_sandacz', caughtAt: hoursAgoISO(0.2), releaseStatus: 'kept' });
      trip = Trip.linkCatch(trip, mine.id);
      trip = Trip.linkCatch(trip, friendCatch.id);
      state.trips = [trip];
      state.catches = [mine, friendCatch];
      state.ui.activeTripId = trip.id;
      db.setSettings({ activeTripId: trip.id });
      await db.putAll('trips', state.trips);
      await db.putAll('catches', state.catches);
      break;
    }

    case 'finished_trip': {
      let trip = seedTrip({ gearKitId });
      trip = Trip.startTrip(trip, { at: hoursAgoISO(4) });
      const c1 = createCatch({ tripId: trip.id, ownerId, speciesId: 'species_szczupak', caughtAt: hoursAgoISO(3.2), length: { value: 58, unit: 'cm', method: 'measured_user' }, releaseStatus: 'released' });
      const c2 = createCatch({ tripId: trip.id, ownerId, speciesId: 'species_okon', caughtAt: hoursAgoISO(2.5), releaseStatus: 'kept' });
      trip = Trip.linkCatch(trip, c1.id);
      trip = Trip.linkCatch(trip, c2.id);
      trip = Trip.finishTrip(trip, { at: hoursAgoISO(0.5) });
      state.trips = [trip];
      state.catches = [c1, c2];
      await db.putAll('trips', state.trips);
      await db.putAll('catches', state.catches);
      break;
    }

    case 'zero_catch_summary': {
      let trip = seedTrip({});
      trip = Trip.startTrip(trip, { at: hoursAgoISO(2.5) });
      trip = Trip.finishTrip(trip, { at: hoursAgoISO(0.2) });
      state.trips = [trip];
      await db.putAll('trips', state.trips);
      break;
    }

    case 'user_with_history': {
      const trips = [];
      const catches = [];
      const specs = ['species_szczupak', 'species_okon', 'species_sandacz'];
      for (let i = 0; i < 4; i += 1) {
        let trip = seedTrip({ fisheryId: i % 2 ? 'fishery_kryspinow' : 'fishery_bagry', gearKitId });
        trip = Trip.startTrip(trip, { at: hoursAgoISO(24 * (i + 2) + 2) });
        const c = createCatch({
          tripId: trip.id, ownerId, speciesId: specs[i % specs.length],
          caughtAt: hoursAgoISO(24 * (i + 2) + 1),
          length: { value: 40 + i * 6, unit: 'cm', method: 'measured_user' },
          releaseStatus: 'released',
        });
        trip = Trip.linkCatch(trip, c.id);
        trip = Trip.finishTrip(trip, { at: hoursAgoISO(24 * (i + 2)) });
        trips.push(trip);
        catches.push(c);
      }
      state.trips = trips;
      state.catches = catches;
      state.privateSpots = [createPrivateSpot({ ownerId, fisheryId: 'fishery_bagry', position: { lat: 50.02, lon: 20.01 }, label: 'Pod trzcinami' })];
      await db.putAll('trips', state.trips);
      await db.putAll('catches', state.catches);
      await db.putAll('privateSpots', state.privateSpots);
      break;
    }

    default:
      break;
  }

  notify();
}
