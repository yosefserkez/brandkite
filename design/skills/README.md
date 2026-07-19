# Design skills corpus

Source-of-truth knowledge for the Brandkite design engine (decision record:
`.ai-business/DESIGN-ENGINE.md`). Each file is one distilled skill: concrete
enough to steer generation away from statistical defaults, open enough to
leave room for brand-specific judgment ("right altitude" — no hex codes for
their own sake, no vagueness).

## Consumers — keep in sync

1. **Product** — `convex/lib/design/skills.ts` holds the runtime prompt
   fragments and `convex/lib/design/checks.ts` the deterministic detectors.
   When a corpus file changes, update the corresponding fragment/check.
2. **Dev harness** — `.claude/skills/brandkite-design/SKILL.md` applies the
   same principles when we build Brandkite's own UI and marketing surface.

## Index

Design:
- `anti-default-looks.md` — the named AI-slop visual modes to avoid
- `color-craft.md` — brand-derived palettes, contrast floor, divergence
- `typography-craft.md` — pairing with intent, overused-font list
- `logo-craft.md` — one idea, reduction tests, category clichés

Copy (the stack runs positioning → hierarchy → draft → edit):
- `positioning.md` — the context document every copy task reads first
- `message-hierarchy.md` — promise/proof/CTA sequencing + CRO audit
- `headline-divergence.md` — six materially different headline angles
- `copy-craft.md` — specificity, banned buzzwords, AI cadence tells
- `copy-editing.md` — the seven sweeps + word-level pass + panel gate

- `NOTICE.md` — attribution for vendored/distilled sources

Dev-harness companions (installed, not distilled — see each skill's own
license): `.agents/skills/make-interfaces-feel-better/` — design-
engineering micro-polish (radii, optical alignment, animation feel).

## Rules for adding skills

- Vendor-distill, never runtime-fetch. Snapshot ideas here with attribution
  in NOTICE.md; re-sync deliberately.
- Every claim should be checkable: prefer rules a deterministic detector or a
  critique lens can enforce over vibes.
- Phase B additions (visual-divergence, critique-jury lenses,
  motion-choreography, novelty gate) get their own files here first.
