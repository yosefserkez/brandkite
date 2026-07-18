# STRATEGY

_v1 — 2026-07-18. Everything below is hypothesis until users exist; validation plan in EXPERIMENTS.md._

## Executive diagnosis
**What it is:** an AI brand studio — paste a URL or a sentence, get a complete editable brand kit (~25 modules: name, tagline, mission, story, tone, personas, positioning, colors, typography, SVG logo w/ vector-searched inspiration) with versioning, regeneration, public share pages, and a gallery. The generation engine is genuinely good and the module breadth is a real differentiator vs. one-shot logo makers.

**State:** technically live but commercially unlaunched. 0 users, 0 revenue, no analytics (fixed 2026-07-18), no SEO, no team invites, no lifecycle email, zero tests/CI. Billing (Autumn: Free/$10 Starter/$30 Pro + credit metering) is wired in code but unverified end-to-end.

**Strongest assets:** working product with fast time-to-wow potential; live domain; clean modern stack an AI agent can iterate on quickly; public-share + gallery pages that can compound as SEO surface; open-source (AGPL) as a credibility/distribution lever.

**Biggest blockers to $1M ARR (ordered):** (1) zero distribution; (2) unvalidated willingness to pay; (3) activation friction unknown/unmeasured; (4) single-player only — no team/agency features; (5) no retention loop (brand kits are near-one-shot jobs-to-be-done).

**The retention problem is strategic, not incidental:** a founder needs a brand kit once. Paths out: (a) agency/repeat-creator customers who make kits continuously, (b) expand from "generate kit" to "operate brand" (asset hub, templates, brand-consistency checks, share/embed), (c) accept churn-heavy consumer motion with cheap acquisition and one-time-ish pricing. Choice deferred until usage data exists.

## Revenue models considered (to $1M ARR)
| Model | Price | Customers needed | Assessment |
|---|---|---|---|
| A. Prosumer subscription (founders/indies) | $10–30/mo | ~3,300–8,300 | Reachable buyers, but severe churn risk (one-shot need) → real number is far higher. Volume acquisition required |
| B. **Agency/studio seats** (freelancers, brand/web agencies, venture studios) | $50–150/mo | ~600–1,600 | Repeat use case (new kit per client), values speed, pays for tools, reachable in communities/marketplaces. Team features needed. **Recommended wedge** |
| C. Credit packs / one-time kit purchase | $29–99 one-time | n/a (not ARR) | Matches one-shot demand honestly; good cash learning engine + top-of-funnel, but doesn't compound to ARR alone |
| D. API/white-label (site builders, agencies embedding brand-gen) | $500–2,000/mo | 40–170 | Highest leverage long-term, needs proof + reliability first |

**Recommended path:** launch with **B as the target customer, C as the monetization bridge** (one-time "Launch Kit" purchase converts one-shot users honestly; subscription for repeat creators/agencies), keep D as year-2 expansion. Model A's pricing stays as-is short-term (already built) but messaging aims at repeat creators.

## Positioning (v1)
- **ICP:** freelance brand/web designers and small agencies (1–10 people) who spin up brand identities for clients; secondary: pre-launch founders.
- **Core promise:** "A complete, client-ready brand identity in 10 minutes — not a logo, the whole kit."
- **Wedge vs. competitors:** Looka/Brandmark = logo-first, shallow; big AI tools = generic chat output, no structure/versioning/share pages. Brandkite = the full strategic kit (positioning, personas, story, voice) + visual identity, editable and shareable.
- **Pricing stance:** do not underprice; agencies bill $2–10k for what this drafts in minutes.

## Why we can win
Breadth + structure (25 versioned modules) is already built; competitors would need to rebuild their product model. Open-source + gallery + public kit pages give organic surface area no ad budget requires. Operating cost is near-zero (Convex/Vercel free tiers, cheap models: Grok-4-fast + Gemini Flash + Recraft).

## Assumptions requiring validation (top 5)
1. Agencies/freelancers will adopt an AI kit generator for client work (activation ≥ 40% of signups generate a full kit).
2. Someone — anyone — pays anything (first 10 paying customers).
3. Time-to-wow is actually fast in practice (measure: signup → first module < 5 min).
4. Public kit pages / gallery generate organic acquisition (share→signup viral coefficient measurable).
5. $10–30 price points aren't leaving 5–10x on the table for the agency segment.
