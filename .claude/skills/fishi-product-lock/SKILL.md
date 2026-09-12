---
name: fishi-product-lock
description: Auto-load when working on Fishi 3.0 UI, product flows, or any screen/feature logic. Short guardrail summary of the product's non-negotiable rules — not a replacement for the full spec.
---

# Fishi product lock

Trip > Catch. `Trip` (wyprawa) is the core object. A fish is an event inside a
trip, never the trip's value. A trip with zero recorded catches is never
presented as "0 fish" / failure — show real value instead (time on water,
route if tracked, places visited, photos, companions).

## Visual direction (confirmed 2026-09-12)

Dark navy/near-black backgrounds + neon teal/blue accents. Source of truth:
`design/reference/*.png` + `design/tokens.css`. This is the CURRENT decision —
it overrides any "light pastel" description found elsewhere. Don't revert
without an explicit new owner decision.

## Navigation

Mapa · Wyprawy · (+) central quick action · FishiBox · Profil.
(Note: reference screenshots label the 4th tab "FishiBox", not "Fishidex" —
use the label as shown in `design/reference/`, flag if this seems inconsistent
rather than silently picking one.)

## Scanner

Scans location/map data, never a camera pointed at water, never image
analysis. Waves go: 1) may find nothing → 2) auto-widens radius → 3) reveals
places as cassette carousel → 4) end of results asks "poszerzyć obszar?" only
after the user has scrolled through everything. Results appear on the map
gently, never as a blocking modal.

## Cassette discovery

Horizontal carousel of *places* (fisheries), not species. Marker on map and
active cassette share one `selectedFisheryId` — never two independent
selection states. Swipe snaps the cassette first; camera reacts after, gently.

## Species context

Secondary to the map — a thin rail of small icons, not the main UI. Presence
status must be one of `confirmed_source | community_confirmed |
inferred_distribution | unknown` — never flatten to a single "yes it's here."

## Fishidex

Full atlas entries (Species Core + Fishing Knowledge + Regulation Context +
Personal Layer + Records), not a handful of demo cards called "done."
Regulations always carry jurisdiction + date + source.

## Zero XP / zero fake data

No XP, no levels, no progress bars toward a level. No invented bite
probabilities, percentages, records, or species biology. Demo/mock values are
always visibly labeled as demo, never presented as production truth.

## Privacy by default

Private spots and exact GPS are private by default. Joining a shared trip does
not grant access to someone's full spot collection, history, or continuous
location — sharing scope must be explicit.

## When in doubt

If a requested change would violate one of these, say so and ask, rather than
silently "fixing" the spec to make the code simpler.
