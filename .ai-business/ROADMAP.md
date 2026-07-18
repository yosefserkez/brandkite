# ROADMAP — 90 days from 2026-07-18

_Gate-based, not date-based: each phase unlocks on evidence, not calendar. Rolling; re-plan at every gate._

## Phase 0 — Foundation (now → ~1 week)
Immediate repairs + measurement. All autonomous.
- [x] Control system + skill (this)
- [ ] Batch 1: R2 authz fix, dead auth code removal, SEO baseline, PostHog instrumentation, CI
- [ ] Verify Autumn checkout end-to-end with a test purchase (then refund) — is billing real?
- [ ] Full funnel walkthrough (signup → kit → publish → upgrade) — document every friction point
- [ ] Enable Sentry (free tier), remove Umami script
- [ ] Landing page: rewrite hero/meta copy to v1 positioning (client-ready kit in 10 min)

**Gate:** funnel measurably works end-to-end incl. payment.

## Phase 1 — First users & activation truth (~weeks 2–4)
Cheapest credible distribution tests; fix activation as data arrives.
- Launch posts: Show HN (open-source angle), r/SideProject, r/Entrepreneur, Indie Hackers, X — **owner approval per post (published under his name)**
- Product Hunt prep (assets exist: billboard.png, gallery)
- Gallery/public-kit pages: add "Made with Brandkite → make yours" CTA loop + OG images per kit
- Onboarding: measure drop-off; kill friction (target signup→first module < 5 min)
- 10 manual "concierge" kits for real founders/agencies in exchange for feedback calls

**Gate:** ≥100 visitors/wk, signup→activation ≥40%, 5+ user conversations.

## Phase 2 — Monetization validation (~weeks 4–8)
- Add one-time "Launch Kit" purchase (credit pack) alongside subs
- Pricing page experiment: agency-oriented tier framing ($49+/mo, unlimited kits, client workspaces)
- Team invites (schema exists; build the flow) if agency signal is real
- Export polish (PDF brand book / tokens / Figma-ready) — the artifact people pay for
- Lifecycle email: activation nudge + trial/credit-exhausted upgrade (Resend)

**Gate:** first 10 paying customers; pick the winning model (B vs C emphasis).

## Phase 3 — Double down (~weeks 8–13)
Depends on Phase 2 evidence. Candidate directions:
- Agency motion: client workspaces, white-label share pages, per-client billing
- SEO/programmatic: public gallery at scale, "brand kit for X" pages, template library
- Paid acquisition tests ONLY if activation+conversion are credible (owner approval, budget TBD)
- API/embed pilot if inbound interest

## Standing technical thread (all phases, ~20% of effort)
Tests around revenue-critical flows (generation workflow, auth, billing), error budgets, dependency updates, docs.
