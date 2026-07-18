# v2 build roadmap — to "production-ready, comfortable launching"

_Direction: [V2-DIRECTION.md]. Autonomous build. Update statuses as work lands._

## Phase 1 — Identity quality (the make-or-break bar) [DONE 2026-07-18]
- [x] Multi-method logo ensemble: 4 concepts/run (2 Recraft V4.1 + 2 LLM-authored geometric/monogram SVG), user picks. Verified across brands (padlock/shield/monogram all on-brand).
- [x] Transparent background (strip Recraft white rect).
- [x] Concept picker UI + batch signed-URL query.
- [~] Deeper quality (jury/critique/novelty gate) = DESIGN-ENGINE Phase B (parallel agent building the engine).

## Phase 2 — Publishable live site [DONE 2026-07-18]
- [x] Real on-brand landing page at `/s/:slug` from brand (logo, palette, brand Google fonts, website copy) — nav/hero/features/CTA/footer. Verified live at /s/brandkite.
- [x] publish/unpublish + slug + public getSiteBySlug; owner Publish-site control in studio.
- [x] "Made with Brandkite" footer loop; per-site head/meta.
- [ ] Gate publishing behind Pro (free = preview) — Phase 4.
- [ ] Custom domain (later; may partner). OG image per site.

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
