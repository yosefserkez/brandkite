# DECISIONS

| Date | Decision | Rationale | Revisit when |
|---|---|---|---|
| 2026-07-18 | Target agencies/freelance designers as primary ICP; founders secondary | Repeat use case beats one-shot founder need for ARR; see STRATEGY.md model B | First 20 user conversations |
| 2026-07-18 | Keep existing stack (TanStack Start/Convex/Vercel); no rewrites | Works, cheap, fast to iterate; zero evidence for replatforming | Never, absent evidence |
| 2026-07-18 | PostHog (personal org "Brandkite", project 518164) as sole analytics; drop Umami | One tool for web+product analytics, MCP-operable by agent; Umami creds unavailable | — |
| 2026-07-18 | Keep Autumn for billing (don't switch to direct Stripe) | Already wired; switching = effort with no user-facing gain | If Autumn blocks a needed pricing model |
| 2026-07-18 | Keep current $10/$30 prices until first users; aim messaging at agencies | Price changes without users = noise; agency tier ($49+) comes with Phase 2 evidence | 10 paying customers |
| 2026-07-18 | Prod treated as sandbox (deploys/schema/data autonomous) | Owner: zero users, "can do anything incl. dropping db" | **Immediately upon first real user/customer** |
| 2026-07-18 | Blueprint/Bryan Johnson systems strictly off-limits for Brandkite | Owner directive; personal/work separation | Never |
