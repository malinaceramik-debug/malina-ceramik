---
name: fishi-release-gate
description: Run before marking any Fishi vertical slice as DONE.
---

# Fishi release gate

Require, before saying "done":

- Build/typecheck passes.
- Relevant domain tests pass (see fishi-domain-integrity for what must be covered).
- The actual flow was exercised end-to-end (not just a unit test) — browser
  render for web, or explicitly marked `NOT_VERIFIED_ON_DEVICE` for anything
  needing a physical phone (background GPS chief among these).
- Error/offline case checked, not just the happy path.
- Screenshot(s) compared against `design/reference/*.png` (see fishi-visual-qa).
- `prefers-reduced-motion` path checked for anything animated.
- Explicit list of what remains unverified.
- No silent Product Lock drift (see fishi-product-lock).

Don't announce "gotowe" on the strength of a green build alone.
