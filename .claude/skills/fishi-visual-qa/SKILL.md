---
name: fishi-visual-qa
description: Auto-load when a screen, map surface, cassette, Fishidex, trip panel, or summary view is changed and needs checking against the visual reference before calling it done.
---

# Fishi visual QA checklist

Compare the rendered result against the matching file in
`design/reference/*.png` (dark navy/neon direction, confirmed 2026-09-12), not
against memory of "what Fishi should look like."

Check:

- Colors match `design/tokens.css` (background depth layers, teal CTA vs.
  scan-blue pulse are visually distinct, gold only for records/PRO/highlights).
- Screenshot at 390×667 and 390×844, plus one larger modern phone.
- Safe areas respected (notch, home indicator).
- Outdoor readability: enough contrast on dark surfaces isn't automatic — verify.
- One-hand reach: primary CTA reachable in lower half of screen.
- Touch targets ≥ ~44px.
- No horizontal overflow.
- `prefers-reduced-motion` respected — scanner wave / replay animations must
  have a non-animated equivalent path that loses no data or achievement.
- Long Polish text (diacritics, longer words) doesn't break layout.
- Selected state (cassette ↔ marker) is never color-only — pair with position/shape/size change too.
- On discovery and active-trip screens, the map stays the dominant visual
  element — panels and chrome must not crowd it out.

Report: which reference file you compared against, what matched, what
diverged and why (intentional refinement vs. accidental drift).
