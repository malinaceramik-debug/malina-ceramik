import { createId } from './ids.js';

export function createGearKit({ ownerId, name, items = [] }) {
  const now = new Date().toISOString();
  return {
    id: createId('gear'),
    ownerId,
    name,
    items, // [{kind:'wedka'|'kolowrotek'|'linka'|'przypon'|'przynęta', label}]
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGearKit(kit, patch) {
  return { ...kit, ...patch, updatedAt: new Date().toISOString() };
}
