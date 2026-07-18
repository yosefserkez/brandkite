# ACCESS

_Never store secret values here. Last updated 2026-07-18._

## Available
| System | Level | Purpose / notes |
|---|---|---|
| GitHub `yosefserkez/brandkite` | push (gh CLI, keyring) | Public AGPL repo; branches/commits/PRs |
| Vercel (user `yserkez`) | full via CLI | Project `brandkite`, repo linked (`.vercel/`); env pull works; deploy key in env is valid |
| Convex | full via `~/.convex/config.json` token | Team `yosef-aaa5e`, project `brandkite`; prod `greedy-ptarmigan-104`, dev `exuberant-magpie-347`. Dashboard: https://dashboard.convex.dev/d/greedy-ptarmigan-104 |
| Convex prod env vars | read/write via CLI | AUTH_RESEND_KEY, AUTUMN_SECRET_KEY, FIRECRAWL_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, R2_* (5), REPLICATE_API_TOKEN, SITE_URL, JWKS/JWT_PRIVATE_KEY all SET |
| Domain brandkite.co | indirect | DNS at Porkbun → Vercel; mail.brandkite.co MX → SES (Resend inbound) |
| Local dev | full | pnpm, node 26; `.env.local` configured for prod deployment (careful) |

| PostHog (personal, org "Brandkite") | full via claude.ai MCP connector (re-authed 2026-07-18 as yosefserkez@gmail.com) | Project 518164 "Default project", token `phc_n5k9HqEKeVS6fBg37XvreDvSrrZJiFAotqJ5j9Mk5Gdt` (public client token). Query + insight + flag access via MCP |

## Requested / pending
| System | What's needed | Why |
|---|---|---|
| Autumn (useautumn.com) | dashboard access or confirmation products exist | Verify Free/Starter/Pro products & credits feature match code |

## Deferred
| System | Trigger |
|---|---|
| Sentry | Before first traffic push (DSN env-gated, likely unset) |
| Resend dashboard | Lifecycle email work (Phase 2+) |
| Porkbun | Only if DNS changes needed |
| Umami (cloud.umami.is script on live site) | Superseded by PostHog; consider removing script |

## Unavailable / prohibited
- **Any Bryan Johnson / Blueprint account** (incl. claude.ai PostHog connector org "Blueprint", Neon MCP, Stripe "Medicine Sandbox" CLI login) — owner directive: Brandkite is strictly personal; never associate.
- Chrome browser extension not currently connected (browser walkthroughs blocked; retry).
