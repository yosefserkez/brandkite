# DESIGN ENGINE — path to genuinely novel, high-caliber generated design

Decided 2026-07-18. Owner prompt: dogfood our own tools; a module = an MCP users call to
create assets per their brand kit + generic quality/novelty skills.

## The decision in one paragraph

Build **one design engine with three consumption surfaces**. The engine is a skills corpus
(distilled, vendored, versioned markdown prompt-fragments + deterministic checkers) plus a
generation pipeline (diverge → generate → render → jury critique → select/refine). The three
surfaces: (1) every existing module workflow in `convex/modules/*` consumes it via a shared
`convex/lib/design/` library, replacing today's copy-pasted inline prompts; (2) a **Brandkite
MCP server** exposes it to users' agents (`get_brand_kit`, `get_design_tokens`,
`generate_asset`, `critique_asset`) — this pulls V2-ROADMAP Phase 5 "brand-as-API" forward
and IS the "module as MCP" product; (3) our own dev harness (`.claude/skills/`) uses the same
corpus when we build the marketing site, and the site's `--brand-*` tokens in `src/styles.css`
get driven by our own published Brandkite kit — visible dogfooding proof.

## Why this shape (research findings)

- **Codebase seams already exist.** Every workflow follows create(in_progress) → generate →
  update(succeeded); the critique loop slots between the last two steps. The `options`
  record already threads UI → workflow → prompt untouched (novelty/quality dials are free).
  `getCurrentModule`/`export.ts:buildMarkdown` are the canonical kit readers. No shared
  prompt layer exists today — anti-slop rules are copy-pasted per module.
- **The skills ecosystem is real, mature, and embeddable.** All key packs are Apache-2.0/MIT:
  Impeccable (pbakaus/impeccable — 46 deterministic anti-pattern detectors, 23 commands),
  Anthropic frontend-design + canvas-design + design-critique (anthropics/skills,
  knowledge-work-plugins), Vercel web-interface-guidelines (vendorable MIT rules file),
  Microsoft frontend-design-review (3 pillars + severity rubric), LottieFiles
  motion-design-skill, taste-skill (numeric dials: DESIGN_VARIANCE / MOTION_INTENSITY /
  VISUAL_DENSITY). Only Superdesign is service-bound (skip).
- **The technique is empirically validated.** Anthropic's "distributional convergence"
  diagnosis (AI-slop = the training-data mode) is fixed by a ~400-token skill at the right
  altitude — no hex codes, no vagueness. Independent pairwise eval: 75% decisive-win rate,
  p=0.006; and explicit guidance helps *smaller* models most (matters — we run grok-4.3, not
  a frontier model). Critique-in-the-loop on rendered output is SOTA (v0's
  generate→render→refine; ReLook; CHI-2024 mockup-feedback).
- **Novelty must be brand-derived, not just cliché-avoiding.** Our unique data:
  `brandContext.market.competitors` and `brand.inspirations`. "Structurally distinct from
  your category's norms" is a novelty definition we can compute and market. And we already
  have `logoEmbeddings` vector search — repurpose it as a **novelty gate**: reject logo
  concepts whose embedding sits too close to existing marks.

## Architecture

```
skills corpus (repo: design/skills/*.md + design/checks/*.ts)
  ├─ vendored+distilled: anthropic-frontend, impeccable-antipatterns, vercel-rules,
  │  ms-review-rubric, motion-choreography  (NOTICE file for Apache/MIT attribution)
  └─ brandkite-native: anti-reference, visual-divergence, critique-jury,
     constraint-inversion, entropy-audit, perceptual-regression
        │
        ▼
convex/lib/design/  (the engine — pure TS, no UI)
  ├─ context.ts    assembleBrandDesignContext(companyId)  — one typed object from published kit
  ├─ prompts.ts    composeSystemPrompt(moduleType, skills[], dials) — right-altitude fragments
  ├─ diverge.ts    N structurally-distinct concept directions seeded from brand context
  │                (extends logo.ts's 4-way ensemble to all visual modules)
  ├─ jury.ts       multi-lens critique (art-direction / product / a11y-engineering lenses),
  │                PAIRWISE selection, not absolute scores; vision model via OpenRouter
  ├─ checks.ts     deterministic post-checks (Impeccable-derived detectors, contrast,
  │                banned-cliché regexes, SVG hygiene) — run before any LLM judge
  ├─ novelty.ts    embedding-distance gate via logoEmbeddings (+ later, competitor-site diff)
  └─ models.ts     central model routing (text / svg / vision-critic), replaces per-file consts
        │
        ├─▶ surface 1: convex/modules/* workflows (generate step + post-gen critique hook)
        ├─▶ surface 2: MCP server (convex HTTP action, streamable HTTP transport):
        │     get_brand_kit · get_design_tokens · generate_asset · critique_asset
        └─▶ surface 3: .claude/skills/ symlinked/derived from the same corpus for dev work
              + marketing-site --brand-* tokens generated from our own published kit
```

Pipeline per visual asset: **diverge (3–5 forced-distinct directions) → generate →
deterministic checks (cheap, kill obvious slop) → render → jury (pairwise, multi-lens) →
select or refine (max 1 refine round) → publish**. Text-only modules get the shorter path:
compose-prompt → generate → deterministic copy checks (buzzword/fabrication) → publish.

Rendering for critique: assets are React-rendered or SVG. SVG → sharp/resvg rasterize in a
Convex action. HTML previews (website module, ad mockups) → satori or a tiny Playwright
render endpoint on Vercel. Start with SVG (logo) which needs no browser.

## What we deliberately rejected

- **Runtime-fetching skill rules** (Vercel's pattern): non-deterministic product behavior +
  third-party runtime dependency. Vendor snapshots, re-sync deliberately.
- **Shipping skill packs wholesale** (Impeccable's 23 commands): they're dev-tool-shaped.
  Distill into Brandkite-altitude fragments; keep the deterministic detectors nearly as-is.
- **Absolute quality scores from an LLM judge**: pairwise preference is what's validated.
- **A separate design microservice**: engine lives in `convex/lib/design/`, same repo/runtime.

## Phasing (each phase ships user-visible value alone)

- **A — corpus + shared prompts (days).** Create `design/skills/` + `convex/lib/design/`
  (context, prompts, models, copy checks). Rewire existing modules to compose from it.
  Install the dev-side skills in `.claude/skills/`. Immediate quality lift, zero new infra.
- **B — critique loop on identity (the V2 "make-or-break bar").** Logo first: diverge →
  checks → rasterize → jury → novelty gate (logoEmbeddings). Then website/marketing previews.
  Expose `options.novelty` + `options.intensity` dials through the existing options channel.
- **C — MCP server + dogfood loop closed.** MCP over Convex HTTP action; token exporter
  (CSS vars/JSON/Tailwind); our marketing site consumes our own kit's tokens via the same
  MCP any customer would use. This is the launch story: "our site is styled by our product."

## Risks / revisit

- Credit economics: jury+refine multiplies LLM calls ~4-6× on visual modules — price via
  module credit costs (logo already 3); measure per-module token spend in Phase B.
- grok-4.3 as critic: vision quality unproven; models.ts keeps the critic swappable
  (claude/gemini via OpenRouter) — evaluate with pairwise tests on 3-5 varied brands
  (V2-ROADMAP Phase 1's manual eyeball loop becomes the eval set).
- MCP auth: signed per-company keys; reuse existing R2 signed-URL authz patterns.
