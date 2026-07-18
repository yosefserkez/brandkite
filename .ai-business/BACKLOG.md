# BACKLOG

_Ranked: impact × confidence ÷ effort. Re-rank continuously. Statuses: todo / doing / done / dropped._

| # | Item | Class | Impact | Conf | Effort | Status |
|---|---|---|---|---|---|---|
| 1 | **Fix payment collection** (card-required checkout, not invoice-mode) — APPROVAL REQUIRED | revenue | Critical | H | S | todo |
| 2 | Reduce signup friction: Google OAuth + measure magic-link drop-off | conversion | H | M | M | todo |
| 3 | Landing hero/copy → v1 positioning | conversion | H | M | S | todo |
| 4 | Public-kit/gallery CTA loop + seed gallery + per-kit OG images | acquisition | H | M | M | todo |
| 5 | Test Free credit grant (5 lifetime → 5/day or higher) | activation | H | M | S | todo |
| 6 | Sentry enable + remove Umami | foundation | M | H | XS | todo |
| 7 | Launch posts (HN/IH/Reddit/X) — needs owner approval | acquisition | H | M | S | todo |
| 8 | One-time "Launch Kit" purchase option | revenue | H | M | M | todo |
| 9 | Activation nudge + upgrade/dunning emails (Resend) | conversion | M | M | M | todo |
| 10 | Team invites (companyMembers flow exists in schema only) | expansion | H | M | L | todo |
| 11 | Brand book export (PDF/tokens) | differentiation | H | M | L | todo |
| 12 | Tests: generation workflow + billing critical paths | foundation | M | H | M | todo |
| 13 | Per-kit dynamic OG image generation | acquisition | M | M | M | todo |
| 14 | Programmatic SEO pages ("brand kit for X") | acquisition | H | L | L | todo |

| 15 | Seed the gallery with 4-6 example public kits | acquisition | M | H | S | todo (CTA loop shipped; gallery still only has the seed company) |
| 16 | Owner: provision Google OAuth creds + flip VITE_GOOGLE_AUTH_ENABLED | conversion | H | H | XS | todo (owner action) |
| 17 | Owner: verify real Stripe Checkout collects a card (test-mode env ideal) | revenue | Critical | H | S | todo (owner action) |

Done 2026-07-18: PostHog instrumentation; SEO baseline; CI; R2 authz; dead SignInForm removal; Share button; Autumn name/email fix; billing verification (E1) + checkout redirect fix; landing hero/how-it-works; public-kit/gallery share-loop CTA; env-gated Google OAuth; free grant 5→30/mo.
Dropped: rewrite/replatform anything (no evidence); paid ads (gate not met).
