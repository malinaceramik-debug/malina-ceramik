import { createId } from './ids.js';

/** @typedef {'confirmed_source'|'community_confirmed'|'inferred_distribution'|'unknown'} PresenceStatus */

export function createSpecies({
  id,
  namePl,
  nameLatin,
  aliases = [],
  taxonomy,
  identification,
  habitat,
  behavior,
  methods = [],
  typicalRigs = [],
  baits = [],
  tips = [],
  sources = [],
  artworkRef,
  recordPl, // { value, unit, holder?, verifiedSource, verifiedAt } | null — never invented
}) {
  return {
    id: id ?? createId('species'),
    namePl,
    nameLatin,
    aliases,
    taxonomy: taxonomy ?? null,
    identification: identification ?? null,
    habitat: habitat ?? null,
    behavior: behavior ?? null,
    fishingKnowledge: { methods, typicalRigs, baits, tips },
    sources,
    artworkRef: artworkRef ?? null,
    recordPl: recordPl ?? null,
  };
}

export function createSpeciesPresence({ waterBodyId, speciesId, status, sourceRefs = [] }) {
  return {
    waterBodyId,
    speciesId,
    status: /** @type {PresenceStatus} */ (status ?? 'unknown'),
    sourceRefs,
    checkedAt: new Date().toISOString(),
  };
}
