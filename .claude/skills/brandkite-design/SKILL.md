---
name: brandkite-design
description: Use when designing, building, or reviewing any UI in this repo — landing page, studio, published brand sites, emails, or visual assets. Applies the Brandkite design engine's own quality bar (we dogfood it). Trigger on tasks touching src/routes, src/components, src/styles.css, or any visual/copy output.
---

# Brandkite design (dogfooding the design engine)

We sell design quality. Our own surfaces must pass the same bar our product
enforces. The canonical corpus is `design/skills/*.md`; runtime fragments are
in `convex/lib/design/skills.ts`. This skill applies them to dev work.

## Owner's aesthetic direction (standing)

Calmer/softer aesthetic; minimal copy — NO ai-slop slogans, subtitles, or
bullet spam; de-emphasize colors/typography sections visually; less padding,
fewer gray bands; lead with outcomes.

## Process (two passes, always)

1. **Plan a token system before writing code**: palette (named values),
   type roles (display/body/utility), one-sentence layout concept, and the
   ONE signature element the page will be remembered by.
2. **Critique the plan against the brief** before building: if any part is
   what you'd produce for any similar page, revise it. Spend boldness in one
   place; keep everything around it quiet. After building, screenshot and
   critique again (use Chrome tools).

## Hard avoids (from `design/skills/anti-default-looks.md`)

- Safe SaaS kit (indigo-on-white, gray-500 body, rounded-xl card grids,
  icon-tile-above-heading feature cards)
- Cream + serif + terracotta "tasteful startup"; near-black + acid accent
- Italic-serif hero with uppercase eyebrow/pill; numbered 01/02/03 sections
- Gradient text, nested cards, side-tab accent borders, bounce easing,
  glowing shadows on dark
- Copy tells: buzzwords (see `design/skills/copy-craft.md`), >1 em-dash,
  "Not a X. A Y." aphorisms, fabricated stats

## Quality floor (non-negotiable, from Vercel WIG)

- Keyboard: visible `:focus-visible` on all interactives; never remove
  outlines without replacement; `<button>` for actions, `<a>`/`<Link>` for
  navigation.
- Forms: labels on every control, correct `type`/`inputmode`/`autocomplete`,
  inline errors, never block paste.
- Motion: `prefers-reduced-motion` honored; animate transform/opacity only;
  no `transition: all`. One orchestrated moment beats scattered effects.
- Text: `text-wrap: balance` on headings, `tabular-nums` for number columns,
  truncation strategy for user content (`min-w-0` on flex children).
- Images: explicit dimensions; lazy-load below fold.
- Responsive to mobile; test light and dark.

## Companion skill

For micro-polish (concentric border radii, optical alignment, shadow
layering, stagger/exit animations, tabular-nums, hit areas), also load
`make-interfaces-feel-better` (installed at
`.agents/skills/make-interfaces-feel-better/`) — it covers execution
detail this skill doesn't repeat. Dev-time use only; not part of the
product corpus.

## Repo specifics

- Tailwind v4, CSS-first config: tokens live in `src/styles.css` (`:root` /
  `.dark`) — shadcn semantic vars in oklch + `--brand-*` ramps and
  `--font-brand-*`. Use tokens, never hardcoded hex/px in components.
- The `--brand-*` ramps are placeholders until Phase C drives them from our
  own published brand kit — don't hand-tune them into load-bearing values.
- Components: `src/components/ui/` (shadcn) — extend, don't fork styles.
- Landing: `src/routes/index.tsx` + `src/components/landing/`. Published
  brand sites: `src/routes/s/$slug.tsx`.
