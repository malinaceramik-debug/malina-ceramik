// A Catch is an event inside a Trip. It never implies fishing effort by
// itself (effort is tracked separately via Trip.fishingSessions). `unknown`
// species is a first-class, persistable value — never force a guess.
import { createId } from './ids.js';

/** @typedef {'estimated'|'measured_user'|'media_evidence'} MeasurementMethod */
/** @typedef {{value:number, unit:'cm'|'kg', method: MeasurementMethod}} Measurement */

export function createCatch({
  tripId,
  ownerId,
  speciesId, // may be null/undefined => 'unknown'
  caughtAt,
  position,
  photoIds = [],
  length, // Measurement|undefined
  weight, // Measurement|undefined
  releaseStatus = 'unknown',
  gearKitId,
  note,
}) {
  if (!tripId) throw new Error('Catch requires tripId');
  if (!ownerId) throw new Error('Catch requires ownerId');
  const now = new Date().toISOString();
  return {
    id: createId('catch'),
    tripId,
    ownerId,
    speciesId: speciesId ?? null, // null === explicit "unknown", not an error state
    caughtAt: caughtAt ?? now,
    position: position ?? null,
    photoIds,
    length: length ?? null,
    weight: weight ?? null,
    releaseStatus,
    gearKitId: gearKitId ?? null, // snapshot of the gear kit id at catch time — immutable after creation
    note: note ?? '',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Personal bests are independent per measurement axis. Missing length never
 * creates a length PB; missing weight never creates a weight PB. Only
 * `measured_user` or `media_evidence` count — `estimated` never sets a PB.
 */
export function computePersonalBests(catches, speciesId) {
  const relevant = catches.filter((c) => c.speciesId === speciesId);
  let lengthPB = null;
  let weightPB = null;
  for (const c of relevant) {
    if (c.length && c.length.method !== 'estimated') {
      if (!lengthPB || c.length.value > lengthPB.length.value) lengthPB = c;
    }
    if (c.weight && c.weight.method !== 'estimated') {
      if (!weightPB || c.weight.value > weightPB.weight.value) weightPB = c;
    }
  }
  return { lengthPB, weightPB };
}

export function isPersonalBest(catches, candidate) {
  if (!candidate.speciesId) return { length: false, weight: false };
  const prior = catches.filter((c) => c.id !== candidate.id && c.speciesId === candidate.speciesId);
  const { lengthPB, weightPB } = computePersonalBests(prior, candidate.speciesId);
  const isLengthPB =
    !!candidate.length && candidate.length.method !== 'estimated' &&
    (!lengthPB || candidate.length.value > lengthPB.length.value);
  const isWeightPB =
    !!candidate.weight && candidate.weight.method !== 'estimated' &&
    (!weightPB || candidate.weight.value > weightPB.weight.value);
  return { length: isLengthPB, weight: isWeightPB };
}
