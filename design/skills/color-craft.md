# Color craft

Runtime fragment: `COLOR_CRAFT` in `convex/lib/design/skills.ts`.
Detectors: `paletteChecks` in `convex/lib/design/checks.ts`.

## Principles

- Traceable to the brand: every color earns its place via the brand's
  industry reality, customer temperature, and personality — not category
  convention. If the category defaults to blue, that is an opportunity.
- Diverge deliberately from competitors' palettes (competitor summaries are
  in the brand context — use them).
- Dominant colors + sharp accents beat timid, evenly-weighted palettes.
- Practicality: survives light/dark UI, print, small sizes.

## Deterministic detectors

- **Readability floor**: at least one palette color must reach WCAG 4.5:1
  contrast against white (usable as text).
- **Distinctness**: no two palette colors within ~60 RGB Euclidean distance —
  each color must earn a distinct role.
- (Phase B: check palette against the named default modes — indigo-on-white,
  cream+terracotta — and against extracted competitor palettes.)
