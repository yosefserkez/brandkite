# RUNBOOK

## Environments
- **Prod:** brandkite.co — Vercel project `brandkite` (team yosef-serkezs-projects) + Convex `greedy-ptarmigan-104`
- **Dev Convex:** `exuberant-magpie-347`; local `.env.local` currently points at **prod** (`CONVEX_DEPLOYMENT=prod:greedy-ptarmigan-104`) — switch to dev for risky work: `npx convex dev` re-targets
- Convex dashboard: https://dashboard.convex.dev/d/greedy-ptarmigan-104

## Commands
```bash
pnpm install                 # deps
pnpm dev                     # app (Vite) — needs VITE_CONVEX_URL
npx convex dev               # backend dev loop (targets dev deployment)
pnpm build                   # production build
pnpm test                    # vitest (no tests yet)
npx biome check .            # lint/format
npx convex data <table> --prod           # inspect prod data
npx convex env list --prod               # prod env var names
npx convex logs --prod                   # backend logs
vercel deploy --prod         # manual prod deploy (normally: push to main → Vercel auto-build)
vercel env pull              # refresh .env.local from Vercel (overwrites Convex-written values!)
```

## Deploy path
Push/merge to `main` → Vercel builds with `npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'pnpm run build'` (deploys Convex functions THEN the frontend). Deploy key lives in Vercel env (`CONVEX_DEPLOY_KEY`) — valid as of 2026-07-18. Note: key values contain `|`; naive `export $(grep ...)` mangles them (caused a false 401 diagnosis once).

## Seed / reset
`pnpm seed` equivalent: `npx convex dev --run seed --until-success` (creates brandkite@brandkite.co admin + gallery companies). DB drop authorized while zero users.

## Auth
Magic link via Resend from auth@mail.brandkite.co (convex/auth.ts). No password/OAuth providers.

## Incident basics
- Frontend errors: Sentry (once DSN set) ; backend: `npx convex logs --prod`
- Generation failures: PostHog `module_generation_failed` + Convex workflow status in `brandModules.generationStatus`
- Rollback: Vercel dashboard → previous deployment → promote; Convex functions roll back by redeploying previous commit
