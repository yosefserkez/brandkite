# STATE

_Last updated: 2026-07-18 ~14:45 ET (session 2026-07-18-1430, batch 4)_

## Product & business state
- Brandkite (brandkite.co, live): AI brand-kit studio — generates name, tagline, mission, colors, typography, SVG logo, ~25 more modules from a URL or short description. TanStack Start + React 19 + Convex + Vercel. Public AGPL repo `yosefserkez/brandkite`.
- **ARR: $0. Effectively pre-launch.** 13 signups are friends; the lone Pro-Annual ($300/yr) is the owner's own test (confirmed 2026-07-18). No validated external demand. Payment collection is also broken (invoice-mode grants access on unpaid invoices) — fix approved. See FINDINGS-2026-07-18.md.
- Billing scaffolded via Autumn (Free / Starter $10/mo / Pro $30/mo hardcoded in `src/components/billing.tsx`; real products live in Autumn dashboard — not yet verified there).

## Strategic thesis (current)
Sell to early-stage founders/indie hackers/agencies who need a credible brand identity fast. Wedge: URL-or-blurb → complete, editable, shareable brand kit in minutes. See STRATEGY.md. **Not yet validated by any user evidence.**

## Primary constraint
**Broken payment collection** (billing grants paid access on unpaid invoices) — a validated $300/yr buyer produced $0. Fix this first (approval-gated). Close behind: **signup friction** (magic-link-only wall at first action) and **distribution** (no channels running; gallery empty).

## Work completed
- 2026-07-18: Phase 0 intake + audit; Convex access restored (deploy key valid — early 401 was shell-quoting artifact); control system + skill created; **Batch 1 shipped to main/prod**: R2 signed-URL authz, dead SignInForm removed, SEO baseline (meta/OG/sitemap), PostHog analytics live (project 518164, personal org), Umami removed, CI added. VISION.md captured owner's "idea → launch-ready company" direction.

## Work in progress
- Batch 5 shipped (generation quality + product): Grok 4.3 fix; brand-aware V4.1 logo; tight composable story; per-module controls (logo + marketing); **marketing module** (ad copy, controls, anti-fabrication); getCurrentModule published-version fix; regenerated Brandkite demo kit; **interactive landing** (animated real-kit build + callouts + inline try-it input, neutral chrome, brand's own colors — LIVE); **brand kit Markdown export** (backend done+verified; UI landing).

## Big product direction (owner, 2026-07-18) — see VISION.md
Brandkite = a **living, consistent brand SYSTEM that scales across marketing** (anti-ChatGPT / not one-off). Lead with outcomes, de-emphasize colors/typography (make compact), minimal copy (NO ai-slop slogans/subtitles/bullets), calmer/softer aesthetic (pastel/watercolor/generated imagery), less padding/bands.

## v2 BUILD STATUS (2026-07-18, committed direction = V2-DIRECTION.md)
- ✅ **#1 Identity quality** (make-or-break): multi-method logo ensemble (4 concepts/run: 2 Recraft V4.1 + 2 LLM-authored geometric/monogram SVG) + transparent bg + concept picker. Verified across brands.
- ✅ **#2 Publishable site** (flagship): real on-brand landing page at `/s/:slug` from the brand (logo/palette/fonts/website copy) + owner Publish control. **LIVE at brandkite.co/s/brandkite** — looks professional.
- 🔧 **Design engine** (DESIGN-ENGINE.md): a PARALLEL agent is building `convex/lib/design/` (models/context/skills/checks/generate) + wiring modules. Foundation committed. Coordinate via shared tree — pull/rebase, don't race its files (convex/lib/design/, convex/modules/*).
- ⏭ Next (non-conflicting, production): gate publishing Free-preview/Pro (Autumn) + verify checkout collects (test key); per-site OG meta; front-door reshape (identity+site first); Phase 5 API/MCP = engine surface 2 (parallel agent).

## NEXT SESSION — goal: run ads, get paying customers, run experiments/optimizations
The critical path to *paying customers* (do in this order; don't run ads until 1–3 hold):
1. **Verify payment actually collects** (BLOCKER for revenue). Wire the Autumn TEST-mode key (owner provided; value not stored — ask owner to re-share or set via `npx convex env set` on a test path), OR do a small real card test then refund. Confirm clicking Upgrade → Stripe Checkout charges a card. Until proven, "conversions" earn $0.
2. **Make signup + activation convert.** Add Google OAuth (needs owner to create Google creds + set AUTH_GOOGLE_ID/SECRET, then flip VITE_GOOGLE_AUTH_ENABLED). Watch PostHog for magic-link drop-off. Ensure the landing → signup → first-kit funnel is smooth (PostHog events already instrumented).
3. **Landing conversion polish** (also the product demo): the interactive "change color/font → ads restyle live" proof (VISION.md); kill AI-slop copy incl. the sidebar About/Key-Features bullets; calmer aesthetic; compact colors/typography.
4. **Then run ad experiments** — needs owner **budget approval + stop conditions** (AUTHORIZATION.md: paid ads require approval). Start one channel, small budget, clear success threshold; measure with PostHog; iterate. Design as EXPERIMENTS.md entries.
5. Ongoing product depth (supports retention/expansion): expand modules (vision/values/positioning/messaging, social, landing copy) — each declares `options`, composes from siblings. Logo transparent-bg polish.

## Owner actions needed (unblock the above)
- Autumn test-mode key (re-share) OR approve a small real-card checkout test.
- Google OAuth credentials.
- Ad budget + per-experiment cap + which channel to test first.

## Resume via `/grow-to-1m-arr` — read STATE.md, VISION.md, AUTHORIZATION.md; verify prod via PostHog (personal project 518164) + `npx convex data --prod`.

## Blockers / pending
- Google OAuth dormant until owner sets AUTH_GOOGLE_ID/SECRET.
- Real paid-checkout collection unverified end-to-end (live Stripe; needs owner or a test-mode env).
- All MCPs (Autumn, PostHog, Chrome, Convex, Vercel) connected.

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
