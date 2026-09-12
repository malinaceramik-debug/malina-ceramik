---
name: fishi-domain-integrity
description: Auto-load when touching Trip, Catch, GPS, effort, records/PB, achievements, or Fishidex data logic.
---

# Fishi domain integrity

- `unknown` species is a valid, persistable value — never force a guess.
- A `Catch` never implies fishing effort by itself; effort is a separate,
  explicitly-tracked session.
- Missing length never creates a personal best. Length PB and weight PB are
  independent records.
- `estimated` measurement method != `measured_user` != `media_evidence` — don't
  collapse these.
- Never invent a route/track for time before GPS was reliably running.
- Never claim "explored shoreline" (km of brzeg) from a raw GPS track alone —
  that metric needs shoreline geometry + effort sessions + fix quality, and
  until that model exists, show the literal walked distance instead.
- "No recorded catch" is the only honest phrasing for an empty trip — never
  "caught zero fish" as if presence was verified and absent.
- Private coordinates never become public implicitly (e.g. via a shared trip,
  a public catch post, or a newly-verified fishery).
- A closed/ended trip does not accept new catches.
- Duplicate submission (retry, offline resync) must be idempotent, not create
  a second record.
