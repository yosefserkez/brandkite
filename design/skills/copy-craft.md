# Copy craft

Runtime fragments: `COPY_CRAFT`, `NO_FABRICATION`, `DISTINCTIVE_VOICE` in
`convex/lib/design/skills.ts`. Detectors: `copyChecks` in
`convex/lib/design/checks.ts`.

## Principles

- Specific beats clever. Name the customer's actual situation, the product's
  actual behavior, the concrete outcome. If a line would work for any
  competitor in the category, it is generic — replace it.
- Plain, declarative, human sentences. Every line earns its place. Words are
  design material, not decoration.
- Derive voice from the brand context (voice summary, customer, industry),
  not from category convention. One deliberate stylistic risk per piece.
- Never fabricate: no invented counts, percentages, ratings, awards, or
  testimonials. A number may appear only if it exists verbatim in the
  supplied brand context.

## Deterministic detectors

- **Buzzwords** (banned outright): revolutionary/revolutionize, seamless(ly),
  unlock, empower, elevate, supercharge, turbocharge, game-changer/-changing,
  cutting-edge, next-level, world-class, best-in-class, state-of-the-art,
  unleash, synergy, transformative, frictionless, streamline,
  enterprise-grade, next-generation.
- **Fabricated stats**: statistic-shaped strings (1,000+, 37%, 10k+, "4.8/5",
  "#1", "N+ users/customers") not present in the source context.
- **AI cadence tells**: more than one em-dash per piece; the aphorism pattern
  "Not a X. A Y."; (advisory, not yet detected: 3+ sections ending on the
  same clipped cadence).
