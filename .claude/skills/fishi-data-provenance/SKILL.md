---
name: fishi-data-provenance
description: Auto-load when working on Water/Fishery/SpeciesPresence/Regulations data or anything resembling a Data Factory pipeline.
---

# Fishi data provenance

- Water geometry != fishing permission. Never let one imply the other in code
  or copy.
- Regional species presence != confirmed presence on a specific water body.
- Every regulation fact carries jurisdiction + date + source. No bare "you can
  fish here" without that context.
- Presence status is always one of `confirmed_source | community_confirmed |
  inferred_distribution | unknown` — surface which one, don't flatten it.
- Conflicting or stale source data is shown as explicitly conflicting/stale,
  not silently resolved to whichever value loaded first.
- Demo/seed values are never promoted to production without being relabeled.
