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
- [x] SSR the `/s/:slug` route (server loader via ConvexHttpClient): crawlable body + real `<title>`/description/OG/Twitter/canonical in head — was a client-only shell before. Logo served as a 7-day signed URL so og:image previews don't expire. (2026-07-18)
- [ ] Gate publishing behind Pro (free = preview) — Phase 4.
- [ ] Custom domain (later; may partner).
- [x] JSON-LD Organization structured data on each published site (2026-07-18).
- [x] **Custom site URLs** — owners rename their slug (`setSiteSlug`, validated + unique), edited inline from the "Site live" popover (2026-07-18).
- [x] **Preview before publish** — owner-only `getSitePreview` + `/s/preview/:companyId` (noindex, "not published yet" banner); "Preview" action next to Publish (2026-07-18).
- [ ] Branded OG **card** per site (1200×630, `og:image` route) — currently og:image is the bare logo (summary card); a rendered card unfurls better.
- [ ] Per-site **brand favicon** (use the brand logo) — needs to OVERRIDE the root layout's default favicons, not append (appending gives an ambiguous dual-favicon). Do via TanStack head dedup/merge on the `/s` route.
- [ ] Missing/unpublished slug should return **HTTP 404**, not 200 — else search engines can index the "not available" page. Low value today (≈0 missing-slug traffic); deprioritized after two dead-ends. Tried & reverted: (a) `notFound()` → blank "Error" shell in SSR; (b) `setResponseStatus` in the loader → import pulls `node:async_hooks` into the client bundle, build fails; (c) `createServerFn` loader wrapping the fetch + `setResponseStatus` → builds, but the server-fn RPC 500s ("HTTPError") when called from the loader during SSR in `node .output/server`. Next thing to try: set status in a server-route/middleware layer, or an nitro route handler for `/s/:slug`. Keep transient errors as 503 (retryable), not 404.

## Design engine workstream (decision record: DESIGN-ENGINE.md)
_One engine, three surfaces: module workflows, user-facing MCP, our own dev harness + site tokens._
- [x] **Phase A — corpus + shared prompts + deterministic checks** (2026-07-18): skills corpus (`design/skills/`), engine lib (`convex/lib/design/` — models/context/skills/checks + `generateChecked` one-corrective-retry loop), all 10 generating modules rewired onto it (incl. marketing/social/website added to the validation registry; Boonton leftover fixed in tone), dev-side skill `.claude/skills/brandkite-design/`.
- [ ] **Phase B — rendered-critique loop on identity** (deepens Phase 1's bar): diverge (3-5 forced-distinct directions) → deterministic checks → render (SVG rasterize first; no browser) → pairwise multi-lens jury (vision model via `lib/design/models`) → select/refine (max 1 round). `logoEmbeddings` as novelty gate. `options.novelty` + `options.intensity` dials. Eval: pairwise tests on 3-5 varied brands; watch per-module token spend (jury ≈ 4-6× calls).
- [ ] **Phase C — Brandkite MCP server + closed dogfood loop** (absorbs Phase 5 token export): MCP over Convex HTTP action — `get_brand_kit` / `get_design_tokens` / `generate_asset` / `critique_asset`; token exporter (CSS vars / JSON / Tailwind); brandkite.co `--brand-*` tokens driven by our own published kit via the same MCP a customer would use.

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
