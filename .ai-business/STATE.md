# STATE

_Last updated: 2026-07-18 ~10:30 ET (session 2026-07-18-0830, batch 2)_

## Product & business state
- Brandkite (brandkite.co, live): AI brand-kit studio — generates name, tagline, mission, colors, typography, SVG logo, ~25 more modules from a URL or short description. TanStack Start + React 19 + Convex + Vercel. Public AGPL repo `yosefserkez/brandkite`.
- **ARR: $0 collected. 13 signed-up users** (~7 activated), 1 reached Pro Annual $300/yr but never paid (invoice-mode granted access on an unpaid invoice). NOT pre-launch — there is real organic pull and a validated buyer, but payment collection is broken. See FINDINGS-2026-07-18.md.
- Billing scaffolded via Autumn (Free / Starter $10/mo / Pro $30/mo hardcoded in `src/components/billing.tsx`; real products live in Autumn dashboard — not yet verified there).

## Strategic thesis (current)
Sell to early-stage founders/indie hackers/agencies who need a credible brand identity fast. Wedge: URL-or-blurb → complete, editable, shareable brand kit in minutes. See STRATEGY.md. **Not yet validated by any user evidence.**

## Primary constraint
**Broken payment collection** (billing grants paid access on unpaid invoices) — a validated $300/yr buyer produced $0. Fix this first (approval-gated). Close behind: **signup friction** (magic-link-only wall at first action) and **distribution** (no channels running; gallery empty).

## Work completed
- 2026-07-18: Phase 0 intake + audit; Convex access restored (deploy key valid — early 401 was shell-quoting artifact); control system + skill created; **Batch 1 shipped to main/prod**: R2 signed-URL authz, dead SignInForm removed, SEO baseline (meta/OG/sitemap), PostHog analytics live (project 518164, personal org), Umami removed, CI added. VISION.md captured owner's "idea → launch-ready company" direction.

## Work in progress
- Batch 2 shipped to main: Share button (was stub), Autumn customer name/email fix. Deploy pending push.

## Next recommended action
1. **Get owner decision on payment collection fix** (BACKLOG #1) — approval-gated billing config; can't collect revenue until done. 2. Reduce signup friction: add Google OAuth + read PostHog magic-link drop-off once traffic accrues (#2). 3. Landing copy → v1 positioning (#3). See FINDINGS-2026-07-18.md for the full picture.

## Blockers / pending
- **Owner approval needed** to change billing to card-required checkout (money-collection path).
- Autumn/Convex verified; Chrome + PostHog + Autumn MCP all connected.

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
