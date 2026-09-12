import { createId } from './ids.js';

// Private by default (fishi-domain-integrity, fishi-product-lock). Never
// upgraded to a public fishery automatically.
export function createPrivateSpot({ ownerId, fisheryId, position, label, createdFromTripId }) {
  const now = new Date().toISOString();
  return {
    id: createId('spot'),
    ownerId,
    fisheryId: fisheryId ?? null,
    position, // {lat, lon} — private, never shared implicitly
    label,
    visibility: 'private',
    createdFromTripId: createdFromTripId ?? null,
    createdAt: now,
  };
}
