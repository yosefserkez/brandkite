---
name: brandkite-copy
description: Use when writing or editing any copy for Brandkite's own surfaces — landing page, headings, CTAs, dialogs, empty states, emails, meta tags, published-site copy. Carries Brandkite's positioning context and the copy stack (positioning → hierarchy → draft → seven sweeps). Trigger on any user-visible string change.
---

# Brandkite copy (dogfooding the copy stack)

Method corpus: `design/skills/positioning.md`, `message-hierarchy.md`,
`headline-divergence.md`, `copy-craft.md`, `copy-editing.md`. This file
binds it to OUR positioning — read this before writing, then run:
positioning check → message hierarchy → draft → seven sweeps.

## Brandkite positioning (the context document)

- **Category**: AI brand kit generator — the shelf people search is
  "brand kit / logo generator", the story we sell is "a living brand
  system, not one-off assets".
- **Audience**: agencies and freelance designers (primary — repeat use),
  founders/indie hackers (secondary). #1 frustration: complete, consistent
  identity is slow/expensive via agency and comes out fragmented via DIY
  (a ChatGPT name here, a Canva logo there — nothing matches).
- **Competitive frame**: direct — logo/brand-kit generators (produce
  disconnected assets); secondary — agencies (quality but slow, $$$,
  founders can't afford), DIY with ChatGPT+Canva (fragments that drift);
  indirect — "we'll fix branding later".
- **Differentiators**: everything is generated together from one source
  of truth and stays consistent; regenerate any piece and it composes
  with the rest; the kit is live (publishable site), not a PDF.
- **Objections**: "AI branding = generic slop" (answer by SHOWING — the
  landing page demos a real kit; never argue it in prose); "will it fit
  my brand?" (per-module controls, versions, your context in, publish
  when happy); "another AI tool" (outcome language, never "AI-powered").
- **Claims policy**: we have no users or revenue to cite — ZERO numbers,
  counts, ratings, or testimonials anywhere. Product-behavior claims
  only ("free to start", "no credit card", "minutes, not weeks" only if
  literally true). "AI-powered", "platform", "tools" are banned filler.
- **Voice**: calm, specific, founder-to-founder. Plain verbs, short
  sentences, minimal copy (owner direction: no slogans/subtitle spam).
  The product name is **Brandkite** — never "BrandKite".

## House CTA rules

First person, verb + what they get: "Start my kit", "Generate my kit",
"See it live". Never: Submit, Sign Up, Learn More, Get Started. Every CTA
gets adjacent risk reversal ("Free to start · no credit card").

## Where copy lives

Landing: `src/components/landing/*`, `src/routes/index.tsx`. Dialogs:
`LoginPromptDialog` call sites. Unauthenticated studio footer:
`get-started-card.tsx`. Site meta: route head tags. Published brand
sites render CUSTOMER copy — never edit generated module content by hand;
improve `convex/lib/design/skills.ts` fragments instead and regenerate.
