import { createId } from './ids.js';

// Alpha uses fixture users for the "friends" flow (see fishi-product-lock —
// real friends/social requires a backend, out of scope for Alpha).
export function createUser({ id, displayName, avatarInitial, isDemoFixture = false }) {
  return {
    id: id ?? createId('user'),
    displayName,
    avatarInitial: avatarInitial ?? displayName.slice(0, 1).toUpperCase(),
    isDemoFixture,
  };
}
