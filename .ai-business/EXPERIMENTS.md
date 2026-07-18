# EXPERIMENTS

_Format: hypothesis → design → threshold → result → decision. No experiment without a stop condition._

## Queue
| ID | Hypothesis | Design | Success threshold | Status |
|---|---|---|---|---|
| E1 | Billing works end-to-end | Test purchase on prod via Autumn checkout, then refund | Charge + credit grant + feature gate all function | planned (Phase 0) |
| E2 | Open-source/maker communities will try it | Show HN + Indie Hackers + r/SideProject posts (owner approval) | ≥100 visitors/wk, ≥10 signups | planned (Phase 1) |
| E3 | Activation is fast enough to wow | PostHog funnel: signup→first module | ≥40% signup→kit_activated; median <5 min to first module | planned (Phase 1) |
| E4 | Public kits drive signups | CTA on public/gallery pages; track public_kit_viewed→signup | any measurable loop (>2% view→signup) | planned (Phase 1) |
| E5 | One-time purchase beats subscription for one-shot users | "Launch Kit" one-time option on pricing page | one-time ≥ 30% of purchase intent | planned (Phase 2) |

## Completed
| ID | Change | Date | Result to watch |
|---|---|---|---|
| E6 | Free credit grant 5 lifetime → **30/month** (Autumn, applied to all 10 test customers, no versioning) | 2026-07-18 | A full kit costs ~27 credits, so 5 couldn't complete one. Watch signup→kit_activated once traffic exists; expect higher activation. Upgrade incentive preserved (Starter 100/mo, Pro 500/mo). |
