# v2 build roadmap — to "production-ready, comfortable launching"

_Direction: [V2-DIRECTION.md]. Autonomous build. Update statuses as work lands._

## Phase 1 — Identity quality (the make-or-break bar) [IN PROGRESS]
- [ ] Logo: generate MULTIPLE distinct concepts per run (3-4), let user pick + regenerate individually. Variety = perceived quality.
- [ ] Logo prompt/model: iconic, simple, memorable marks; strip Recraft white background (transparent); tasteful defaults.
- [ ] Cohesive identity: ensure color + type pair well with the logo and each other (a real system, not 3 unrelated outputs).
- [ ] Quality check: generate for 3-5 varied brands, eyeball; iterate prompts until "I'd ship this."

## Phase 2 — Publishable live site (the flagship living output)
- [ ] A real, beautiful public landing page rendered from the brand (logo, colors, fonts) + website module copy — NOT the studio card. Full hero/features/CTA/footer, on-brand.
- [ ] Public route + hosting on brandkite.co (e.g. `/s/:slug` or subdomain). Slug per company.
- [ ] Publish/unpublish control; edit → site updates. SEO/OG per site.
- [ ] Gate publishing behind Pro (free = preview only).
- [ ] Custom domain support (later; may partner).

## Phase 3 — Front-door reshape (identity + site first, demote strategy filler)
- [ ] Reorder studio: identity + site + go-to-market up top; mission/vision/values/personas/tone/story optional/collapsed.
- [ ] Message: founder-to-founder, outcome-first. Rewrite key copy.

## Phase 4 — Pricing around publishing
- [ ] Autumn: Free (preview only) / Pro (~$19-29, publish+custom domain+export+unlimited) / Scale (API). Gate publish/export.
- [ ] VERIFY checkout actually collects (test-mode key → a deployment; end-to-end).

## Phase 5 — Scale / API layer (brand-as-infrastructure)
- [ ] Public REST API: fetch a brand's source-of-truth (identity tokens, colors, fonts, logo URLs, copy) by key.
- [ ] API keys + auth + rate limits (per plan). Docs.
- [ ] Design tokens export (CSS vars / JSON / Tailwind).

## Phase 6 — Production readiness
- [ ] Tests on revenue-critical + generation paths; CI green.
- [ ] Sentry on; error handling; empty/failed states.
- [ ] Perf, accessibility, mobile.
- [ ] Owner unblocks: Google OAuth creds; real checkout verification; ad budget.

## Cross-cutting
- Keep composability (compose from current blocks; no auto-regen). New modules declare `options`.
- Dogfood: brandkite.co built from its own brand where feasible.
- Test in Chrome as built; commit incrementally; keep docs current.
