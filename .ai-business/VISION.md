# VISION — from brand kits to "launch in minutes"

_Owner's directive 2026-07-18: "imagine going from idea to full brand and company ready in minutes… a 1-person engineer can use Brandkite to turn their product into a business with everything they need to market, sell, and grow." Brainstorm, not spec. Nothing here overrides evidence gates in ROADMAP.md._

## Composability model (owner, 2026-07-18) — READ THIS FIRST
The core principle is **composability, NOT auto-regeneration.** Brand elements (name, tagline, colors, logo, tone, personality) are reusable building blocks; every asset (ads, marketing, social, landing) is **composed from the current blocks** at generation time, so it's consistent by construction. Editing a block never auto-regenerates anything downstream — the user regenerates when they choose, and it re-composes from current blocks.
- Every asset is generated **from the current kit state** — a new ad/marketing/social/logo pulls the current name, tagline, colors, logo, tone, personality at generation time, so new output is consistent by construction.
- Shared visual tokens (colors, logo) are **referenced live** wherever assets display them, so editing colors updates where they're shown.
- **Do NOT auto-regenerate** downstream assets when an upstream element changes (e.g. changing colors must not regenerate the logo or rewrite existing ads). The user decides when to regenerate; regeneration then re-pulls current state.
- Positioning is about a **complete, consistent brand + marketing + asset system**, not generic one-off tagline/logo tools.

Implementation implication: modules must read current **published sibling modules** (not just brandContext) as input — the current code only reads brandContext, which is why output isn't internally consistent. Wire sibling-reads into generation; leave regeneration manual.

## The reframe
Today Brandkite answers "what should my brand look like?" The vision answers a bigger question: **"I built a thing — make it a company."** That moves us from a one-shot deliverable (brand kit) to an ongoing operating layer (the marketing/GTM side of a business), which is exactly what fixes the churn problem in STRATEGY.md. The brand kit stops being the product; it becomes **the compiler input**. Every downstream artifact — site, ads, emails, decks — compiles *from* the kit, stays consistent with it, and regenerates when the kit changes.

## Why this can win (and why now)
- The existing module system is already the right architecture: versioned, regenerable, structured modules. "Website," "ad set," and "launch email" are just bigger modules consuming smaller ones.
- The brand kit becomes the **source of truth with gravity**: the more artifacts compile from it, the higher the switching cost — real retention, not engagement hacks.
- Solo technical founders are an exploding segment (AI made building easy; distribution/marketing is now the bottleneck). They'll pay for outcomes, not tools.

## The ladder (each rung = standalone value + upsell)
1. **Brand kit** (today) — identity, strategy, assets. One-shot.
2. **Launch surface** — one-page marketing site generated from the kit, hosted on their subdomain/custom domain, with waitlist/email capture built in. First recurring hook: hosting + updates.
3. **Launch kit** — everything needed for launch day, compiled from the kit: Product Hunt/HN copy, X/LinkedIn threads, launch email, OG images, demo-video script, press blurb. High perceived value, screenshot-able, viral.
4. **Marketing engine** — ongoing: social posts, blog/SEO pages, ad creative + copy variants, email sequences, all on-brand automatically. Subscription justifies itself monthly.
5. **Company-in-a-box (partner layer)** — incorporation (Stripe Atlas/Firstbase referral), domain purchase, Google Workspace, payment setup. Mostly referral/affiliate economics, not our infra. High trust value; do via partners, never build.

## Economic shape
- Rungs 1–2: $0–29 one-time/cheap — acquisition.
- Rung 3: $49–99 one-time "Launch Kit" — cash + wow.
- Rung 4: $49–199/mo "Marketing engine" — the actual ARR product. 500–1,700 customers to $1M ARR.
- Rung 5: referral revenue + positioning moat ("the place you turn an idea into a company").

## What NOT to take literally
- Don't build incorporation, ads-platform integrations, or full website builders soon — partner, embed, or generate static exports instead.
- Don't chase "everything in minutes" breadth before one rung retains: the gate is still ROADMAP's activation/payment evidence.
- "Ads" initially means generated ad creative + copy the founder pastes into Meta/Google — not API spend management (compliance + scope trap).

## Sequencing hypothesis (evidence-gated, maps to ROADMAP phases)
- Phase 1–2 (now): validate rung 1 activation + first payments. Ship rung 2 (one-page site from kit) as the wow feature IF activation data is healthy — it's the smallest step that makes value ongoing and shareable (every generated site links back = distribution loop).
- Phase 3: rung 3 Launch Kit as the monetization spike; measure one-time vs subscription mix.
- Phase 4+ (post-evidence): rung 4 marketing engine = the ARR business. ICP note: this vision centers the **solo technical founder** more than the agency; keep both personas in discovery until data picks.

## Nearest-term implications (already actionable)
- Positioning copy can promise the direction ("from idea to launch-ready") without shipping rungs 3–5.
- Schema/architecture: keep module graph composable — new artifact types must be able to consume existing modules (already true).
- Every public artifact (kit page, future site pages) carries the "Made with Brandkite" loop.
