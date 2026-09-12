import { createId } from './ids.js';

// Water geometry != fishing permission (fishi-data-provenance). We keep
// WaterBody / Fishery / RegulationFact as separate records rather than one
// blob, even in the Alpha fixture data, so the distinction survives into
// whatever real data source replaces the fixtures later.

export function createWaterBody({ id, name, geometryRef, sourceRefs = [] }) {
  return { id: id ?? createId('water'), name, geometryRef: geometryRef ?? null, sourceRefs };
}

export function createFishery({
  id,
  waterBodyId,
  name,
  authorityName,
  accessProfile,
  type, // 'jezioro' | 'rzeka' | 'staw' | ...
  areaHa,
  maxDepthM,
  distanceKm, // demo-only convenience field, always presented as demo unless computed from real GPS
  coords, // {lat, lon} — demo/prototype coordinates
  photoRef,
  speciesIds = [],
}) {
  return {
    id: id ?? createId('fishery'),
    waterBodyId,
    name,
    authorityName: authorityName ?? null,
    accessProfile: accessProfile ?? null,
    type: type ?? null,
    areaHa: areaHa ?? null,
    maxDepthM: maxDepthM ?? null,
    distanceKm: distanceKm ?? null,
    coords: coords ?? null,
    photoRef: photoRef ?? null,
    speciesIds,
  };
}

export function createRegulationFact({
  jurisdictionId,
  waterId,
  speciesId,
  factType, // 'protected_period' | 'min_size' | 'daily_limit'
  value,
  validFrom,
  validTo,
  sourceRef,
  status = 'missing', // 'verified'|'stale'|'conflict'|'missing'
}) {
  return {
    jurisdictionId,
    waterId: waterId ?? null,
    speciesId: speciesId ?? null,
    factType,
    value,
    validFrom: validFrom ?? null,
    validTo: validTo ?? null,
    sourceRef: sourceRef ?? null,
    status,
    checkedAt: new Date().toISOString(),
  };
}
