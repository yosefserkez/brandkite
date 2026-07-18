# METRICS

_Framework v1 — 2026-07-18. Analytics: PostHog project 518164 (personal org "Brandkite"). Web + product analytics unified there; Umami script on live site to be removed._

## Baseline (2026-07-18 — corrected via Autumn)
- **Signed-up users: 13** (Autumn customers); ~7 activated (consumed credits). Companies: ~14. MRR/ARR: **$0 collected**.
- **1 user reached Pro Annual ($300/yr) but never paid** — access granted on an unpaid `open` invoice (invoice-mode); free→paid intent = 1/13, revenue = $0. See FINDINGS-2026-07-18.md.
- Free plan grants only **5 lifetime credits** (one-off, no reset) — likely activation throttle.
- Traffic history: none accessible pre-PostHog. PostHog now live (verified firing on brandkite.co 2026-07-18).

## North star
**Activated brand kits per week** (a kit with ≥5 generated modules including logo+colors+name) — proxies delivered value for every model on the table.

## Event taxonomy (PostHog, snake_case)
| Event | When | Key properties |
|---|---|---|
| `$pageview` | auto | (autocapture on) |
| `signup_completed` | auth account created | method=magic_link |
| `company_created` | company/kit created | source: url_scrape\|description, is_first |
| `module_generation_started` | any module gen kicked off | module_type, trigger: auto\|manual\|regen |
| `module_generation_succeeded` / `_failed` | workflow result | module_type, duration_ms, error (failed) |
| `kit_activated` | company crosses ≥5 succeeded modules incl. name+colors+logo | modules_count |
| `kit_published` | public share toggled on | |
| `public_kit_viewed` | public/c/$id or gallery view | company_id, referrer |
| `checkout_started` | Autumn checkout opened | plan, billing_cycle |
| `plan_purchased` | Autumn success | plan, billing_cycle, amount |
| `credits_exhausted` | credit check blocks generation | plan |
| `share_clicked` | share affordance used | surface |

Identify on login (`posthog.identify(userId, {email})`); reset on logout.

## Funnel definitions
1. **Acquisition→activation:** pageview → signup_completed → company_created → first module_generation_succeeded → kit_activated
2. **Monetization:** kit_activated → checkout_started → plan_purchased
3. **Viral loop:** kit_published → public_kit_viewed → signup_completed (referrer=public kit)

## Targets to unlock next phase (from ROADMAP)
- ≥100 unique visitors/wk from any channel test
- Signup→kit_activated ≥ 40%
- First paying customer (any amount)
- module failure rate < 5%

## Quality/delivery
- Errors: Sentry (to be enabled) + `module_generation_failed` rate in PostHog
- Delivery: CI green on main; deploy = merge to main (Vercel)

## Anti-vanity rule
Never report cumulative signups or total generations without the paired conversion/retention rate.
