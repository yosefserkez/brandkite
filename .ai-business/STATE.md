# STATE

_Last updated: 2026-07-18 ~09:00 ET (session 2026-07-18-0830)_

## Product & business state
- Brandkite (brandkite.co, live): AI brand-kit studio — generates name, tagline, mission, colors, typography, SVG logo, ~25 more modules from a URL or short description. TanStack Start + React 19 + Convex + Vercel. Public AGPL repo `yosefserkez/brandkite`.
- **ARR: $0. Users: 0** (prod DB: 1 user = admin seed, 1 company, 2 brandModules). Pure pre-launch state despite being technically live.
- Billing scaffolded via Autumn (Free / Starter $10/mo / Pro $30/mo hardcoded in `src/components/billing.tsx`; real products live in Autumn dashboard — not yet verified there).

## Strategic thesis (current)
Sell to early-stage founders/indie hackers/agencies who need a credible brand identity fast. Wedge: URL-or-blurb → complete, editable, shareable brand kit in minutes. See STRATEGY.md. **Not yet validated by any user evidence.**

## Primary constraint
**Zero users / zero distribution.** Nothing else matters until real people hit the funnel. Secondary: no analytics existed (being fixed), activation friction unknown.

## Work completed
- 2026-07-18: Phase 0 intake; full repo + access audit; Convex login restored; confirmed Vercel deploy key is VALID (early 401 was a shell-quoting artifact — pipeline works); prod env has all API keys incl. AUTUMN_SECRET_KEY; created this control system.

## Work in progress
- First execution batch (branch TBD): R2 signed-URL authz fix, dead SignInForm removal, SEO baseline, PostHog instrumentation (env-gated), GitHub Actions CI.

## Next recommended action
Finish first execution batch → deploy → walk the live funnel end-to-end as a user → then first distribution tests (see ROADMAP Phase 1).

## Blockers / pending
- **PostHog client token**: user created personal project 518164 (us.posthog.com/project/518164) but the `phc_` token hasn't been provided; claude.ai PostHog MCP is the user's WORK org (Blueprint) — never use it for Brandkite. Instrumentation ships env-gated (`VITE_POSTHOG_KEY`).
- Autumn dashboard not yet inspected — billing products unverified end-to-end.
- No Chrome extension connection for browser walkthroughs (retry later).

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
