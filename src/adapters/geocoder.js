// DemoGeocoderAdapter — no real geocoding provider is configured. Only
// matches against the fixture fishery/place names we actually have, and is
// honest when it finds nothing rather than inventing a result.
import { FISHERIES } from '../data/fixtures.js';

export function demoSearchPlaces(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FISHERIES.filter((f) => f.name.toLowerCase().includes(q));
}
