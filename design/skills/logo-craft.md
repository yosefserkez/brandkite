# Logo craft

Runtime fragment: `LOGO_CRAFT` in `convex/lib/design/skills.ts`.
Detectors: `svgChecks` in `convex/lib/design/checks.ts`.

## Principles

- Encode exactly ONE idea, drawn from what the brand actually does or
  believes. A mark that tries to say three things says nothing.
- Construction with intent: negative space, a grid, a repeated geometric
  motif. Confident, precise geometry over organic squiggles.
- Reduction tests — the mark must survive: 16px favicon, single color,
  inverted on dark. If it needs color or size to read, it fails.
- Category clichés to avoid: chat bubbles (messaging), leaves (eco), rockets
  (startups), swooshes, globes, generic hexagons, lightbulbs (ideas),
  upward-trending arrows/charts (finance/growth).

## Deterministic detectors (LLM-authored SVG path)

- viewBox must be `0 0 100 100`; no gradients, filters, or `<text>`;
  at least one drawable shape. One corrective retry on violation.
- (Phase B: rasterize → vision jury; novelty gate via `logoEmbeddings`
  similarity against existing marks.)
