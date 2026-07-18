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
- Batch 4 shipped to main + prod (generation quality): Grok 4.3 (deprecation fix), brand-aware V4.1 logo, tightened composable story, per-module controls (backend + logo colorMode/style UI). Composability model locked in VISION.md.

## Next recommended action
Continue the complete-package expansion **module-by-module WITH controls** (owner priorities: marketing/ads copy, brand-strategy depth [vision/values/positioning/personas/messaging], launch/website copy). Each new module: declare `options` in its workflow args (shared regenerate passes it), compose from current published sibling blocks, add BrandStudioPage JSX + controls. Then: logo transparent-bg polish; broaden sibling-reads; owner actions (Google OAuth creds, real checkout verification, Autumn test-mode wiring).

## Blockers / pending
- Google OAuth dormant until owner sets AUTH_GOOGLE_ID/SECRET.
- Real paid-checkout collection unverified end-to-end (live Stripe; needs owner or a test-mode env).
- All MCPs (Autumn, PostHog, Chrome, Convex, Vercel) connected.

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
