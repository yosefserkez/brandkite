# AUTHORIZATION

_Agreed 2026-07-18 with owner (Yosef). Owner statement: personal hobby project, zero active users, "can do anything including dropping db if needed."_

## Context that widens defaults
Because there are **no users and no revenue**, production is effectively a sandbox: prod deploys, schema changes, and data resets are all currently autonomous. **These widen-ed defaults expire the moment there is a single real user or paying customer — then revert to the stricter rules below.**

## Autonomous (no approval)
- All code changes, branches, commits, PRs, merges to main
- Production deploys (Vercel + Convex)
- Schema changes and data operations in prod (while zero users)
- Tests, CI, docs, instrumentation, feature flags, internal artifacts
- Free-tier accounts in already-discussed services (PostHog, Sentry)
- SEO/content changes on brandkite.co

## Notify after execution
- Anything that changes what visitors see materially (positioning, pricing page copy)
- New third-party services beyond those discussed
- Spending within budget caps

## Approval required (always)
- Pricing/product changes in Autumn once ANY real customer exists
- Customer-facing email/announcements to real users
- Paid advertising (any spend)
- Legal/licensing changes (incl. anything touching AGPL)
- Publishing content under the owner's name (blog posts, social)
- New spend above budget caps
- Anything touching Bryan Johnson / Blueprint accounts — **prohibited outright**

## Budget limits (defaults proposed 2026-07-18; not objected)
- ≤ $50/month total new spend without asking
- ≤ $25 per experiment
- $0 paid ads until activation/retention data justifies it
- AI API usage for testing counts toward the $50

## Standing constraints
- Never store secrets in the repo or these docs
- Keep rollback paths; small reviewable commits
- Never fabricate customer evidence; label facts vs. assumptions
