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

## Product direction: complete, composable brand+marketing package (owner, 2026-07-18)
Core = composability (compose assets from current brand blocks; no auto-regen). Current 8 modules are "not enough."
| # | Item | Notes |
|---|---|---|
| P1 | Per-module generation controls (#23) | logo: brand/mono/b&w + flat/line/3d; colors: mood; type: serif/sans. Thread options UI→regenerate→workflow→prompt |
| P0 | **Interactive "landing = demo" page** (owner, 2026-07-18) | Show-don't-tell + convert. Ideas: inline "try it" input in the hero that kicks off generation; callouts/arrows annotating each part of the live demo kit; make it wow + easy to try. Landing doubles as the product demo. Clean/sexy, on-system neutral, NO off-system colors. Needs focused craft pass |
| ✔ | Marketing module (ad copy, platform/goal controls) | DONE 2026-07-18: backend + UI (clean/aligned/neutral), verified. First of the expanded asset modules |
| P2 | Expand more modules toward complete package | Implement enum types with NO workflow yet (vision, values, positioning, personas, messaging/differentiators, voice) + NEW assets: social kit, one-liner/boilerplate, landing-page copy, email/deck. Each composes from current blocks + controls. New module workflows MUST declare `options` arg |
| P3 | Broaden composability | Wire sibling-reads into remaining text modules (tagline/mission/tone read each other) for consistency |
| P4 | Logo polish | Strip Recraft's white background rect (make transparent); expose style/color controls (ties to P1) |
| P5 | Visual QA loop | In-app "regenerate" already uses new pipeline; owner should eyeball outputs |

Done 2026-07-18: PostHog instrumentation; SEO baseline; CI; R2 authz; dead SignInForm removal; Share button; Autumn name/email fix; billing verification (E1) + checkout redirect fix; landing hero/how-it-works; public-kit/gallery share-loop CTA; env-gated Google OAuth; free grant 5→30/mo.
Dropped: rewrite/replatform anything (no evidence); paid ads (gate not met).
