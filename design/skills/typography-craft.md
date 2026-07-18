# Typography craft

Runtime fragment: `TYPOGRAPHY_CRAFT` in `convex/lib/design/skills.ts`.
Detectors: `typographyChecks` in `convex/lib/design/checks.ts`.

## Principles

- Typography carries the personality: a display face with a point of view,
  a workhorse text face that stays out of its way.
- The pairing needs a named axis of deliberate contrast: serif/sans, weight,
  or width. Same-font systems need explicit justification.
- Freely available faces only (Google Fonts / web-safe), legible in UI.
- Type scale steps at ≥1.25 ratio; fewer sizes, clearer hierarchy.

## Deterministic detectors

- **Display-font defaults** (rejected as headline face): Inter, Roboto,
  Open Sans, Lato, Arial, Helvetica (Neue) — and the overused "distinctive"
  picks: Space Grotesk, Plus Jakarta Sans, Geist, Fraunces. Workhorses are
  acceptable as the body/primary face when the pairing rationale says why.
- **Identical pairing**: headline font must differ from primary font.
