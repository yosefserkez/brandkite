# STATE

_Last updated: 2026-07-18 ~12:00 ET (session 2026-07-18-0830, batch 3)_

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
- Batch 3 shipped to main (build+CI green): landing hero/how-it-works, public-kit+gallery share-loop CTA, env-gated Google OAuth, checkout redirect fix, free grant 5→30/mo. Deploy triggered.

## Next recommended action
1. **Owner actions** (unblock, then verify): provision Google OAuth creds + flip VITE_GOOGLE_AUTH_ENABLED; verify real Stripe Checkout collects a card (ideally add a test-mode Stripe env). 2. Seed the gallery with a few example kits (BACKLOG #15) so the share loop has content. 3. First distribution test (owner-approved launch post) once landing + funnel are polished. 4. Read PostHog once traffic accrues (magic-link drop-off, activation).

## Blockers / pending
- Google OAuth dormant until owner sets AUTH_GOOGLE_ID/SECRET.
- Real paid-checkout collection unverified end-to-end (live Stripe; needs owner or a test-mode env).
- All MCPs (Autumn, PostHog, Chrome, Convex, Vercel) connected.

## Important commands
See RUNBOOK.md. Quick: `pnpm dev` (app), `npx convex dev` (backend), `npx convex data <table> --prod`, `vercel deploy --prod`.

## Active branch / PR
main (clean at 105e678) — batch branch to be created.
