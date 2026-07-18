# STATE

_Last updated: 2026-07-18 ~09:10 ET (session 2026-07-18-0830)_

## Product & business state
- Brandkite (brandkite.co, live): AI brand-kit studio — generates name, tagline, mission, colors, typography, SVG logo, ~25 more modules from a URL or short description. TanStack Start + React 19 + Convex + Vercel. Public AGPL repo `yosefserkez/brandkite`.
- **ARR: $0. Users: 0** (prod DB: 1 user = admin seed, 1 company, 2 brandModules). Pure pre-launch state despite being technically live.
- Billing scaffolded via Autumn (Free / Starter $10/mo / Pro $30/mo hardcoded in `src/components/billing.tsx`; real products live in Autumn dashboard — not yet verified there).

## Strategic thesis (current)
Sell to early-stage founders/indie hackers/agencies who need a credible brand identity fast. Wedge: URL-or-blurb → complete, editable, shareable brand kit in minutes. See STRATEGY.md. **Not yet validated by any user evidence.**

## Primary constraint
**Zero users / zero distribution.** Nothing else matters until real people hit the funnel. Secondary: no analytics existed (being fixed), activation friction unknown.

## Work completed
- 2026-07-18: Phase 0 intake + audit; Convex access restored (deploy key valid — early 401 was shell-quoting artifact); control system + skill created; **Batch 1 shipped to main/prod**: R2 signed-URL authz, dead SignInForm removed, SEO baseline (meta/OG/sitemap), PostHog analytics live (project 518164, personal org), Umami removed, CI added. VISION.md captured owner's "idea → launch-ready company" direction.

## Work in progress
- Verifying prod deploy + CI green; then PostHog event smoke-test on live site.

## Next recommended action
1. Verify deploy/CI/meta/PostHog on brandkite.co. 2. E1: Autumn checkout end-to-end (BACKLOG #6). 3. Funnel walkthrough + friction doc (#7). Then ROADMAP Phase 0 gate review.

## Blockers / pending
- Autumn dashboard not yet inspected — billing products unverified end-to-end.
- No Chrome extension connection for browser walkthroughs (retry later).

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
