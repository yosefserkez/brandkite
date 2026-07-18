# Anti-default looks

Runtime fragment: `ANTI_DEFAULT_LOOKS` in `convex/lib/design/skills.ts`.

AI visual output collapses to a few statistical modes ("distributional
convergence"). Naming the modes is the most effective known counter —
independently validated with pairwise preference evals (75% decisive wins for
a skill that does this). These are defaults, not choices; when the brand
genuinely calls for one, push it somewhere specific to the brand.

## The named modes

1. **Safe SaaS kit** — indigo/violet primary on white, gray-500 body,
   rounded-xl cards for everything, icon-tile stacked above heading.
2. **Tasteful startup** — warm cream/beige (~#F4F1EA) background,
   high-contrast serif display, terracotta accent.
3. **Techno dark** — near-black background, single acid-green or neon accent,
   glowing colored box-shadows.
4. **Italic-serif hero** — oversized italic serif display (Fraunces /
   Recoleta / Playfair) with an uppercase tracked eyebrow or pill chip above.
5. **Broadsheet** — hairline rules, zero border-radius, dense newspaper
   columns, numbered 01/02/03 section markers.

## Structural tells (UI-level, for Phase B render critique)

Side-tab accent borders on cards; nested cards; gradient text; monotonous
spacing; bounce/elastic easing; flat type hierarchy (steps < 1.25 ratio);
repeated eyebrow labels as section scaffolding.
