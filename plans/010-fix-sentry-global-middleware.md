# Plan 010: Remove or rewire the broken Sentry global-middleware file

> **Executor instructions**: Follow step by step, verifying each. On any "STOP
> conditions" item, stop and report. Update this plan's row in `plans/README.md`
> when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- src/app/global-middleware.ts`
> If it changed, compare the excerpt to live code; mismatch → STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Depends on**: none
- **Category**: bug / tech-debt
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`src/app/global-middleware.ts` imports `registerGlobalMiddleware` from
`@tanstack/react-start`, but that member no longer exists in the installed
version (it is one of the repo's current `tsc` errors). The file is imported by
nothing else, so today it is dead — meaning the Sentry server middleware it
intends to register **never runs**, silently leaving server-side request
tracing/error capture absent via this path. Either the file should be deleted (if
Sentry server coverage is provided elsewhere) or rewired to the current TanStack
Start global-middleware API so the tracing it promises actually happens.

## Current state

- `src/app/global-middleware.ts` (entire file):
  ```ts
  import { sentryGlobalServerMiddlewareHandler } from "@sentry/tanstackstart-react";
  import { createMiddleware, registerGlobalMiddleware } from "@tanstack/react-start";

  registerGlobalMiddleware({
  	middleware: [createMiddleware().server(sentryGlobalServerMiddlewareHandler())],
  });
  ```
- `tsc` error: `src/app/global-middleware.ts(4,2): error TS2305: Module '"@tanstack/react-start"' has no exported member 'registerGlobalMiddleware'.`
- No importer: `grep -rn "global-middleware" src` returns only this file.
- Sentry IS wired at build level via `vite.config.ts:2,22-29`
  (`wrapVinxiConfigWithSentry`), so client + source-map upload exist independent
  of this file.

## Commands you will need

| Purpose   | Command                              | Expected on success       |
|-----------|--------------------------------------|---------------------------|
| Grep      | `grep -rn "global-middleware\|registerGlobalMiddleware" src` | only this file (before deletion) |
| Typecheck | `pnpm exec tsc --noEmit`             | the TS2305 error is GONE; no new errors |
| Build     | `pnpm build`                         | succeeds (env `VITE_CONVEX_URL=https://placeholder.convex.cloud`) |

## Scope

**In scope**:
- `src/app/global-middleware.ts` (delete, or rewire)

**Out of scope**:
- `vite.config.ts` Sentry wrapping — leave it; client/source-map Sentry works.
- Adding new Sentry instrumentation beyond restoring what this file intended.

## Git workflow

- Branch: `advisor/010-fix-sentry-middleware`
- Commit style: `Fix: remove dead Sentry global-middleware (invalid import)`

## Steps

### Step 1: Confirm it is unreferenced

**Verify**: `grep -rn "global-middleware" src --include="*.ts" --include="*.tsx" | grep -v "src/app/global-middleware.ts"` → no output. If there IS an importer, do not delete — go to Step 3.

### Step 2 (default): Delete the dead file

Remove `src/app/global-middleware.ts`.

**Verify**:
- `pnpm exec tsc --noEmit 2>&1 | grep global-middleware` → no output (error gone).
- `pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"` → count decreased by 1 vs baseline, no new errors.
- `pnpm build` → succeeds.

Deleting is correct here because the file never ran (nothing imported it), so no
behavior is lost — only a broken, dead registration is removed. Note in your
report that **server-side Sentry request middleware is not currently active**;
restoring it is the optional Step 3 follow-up.

### Step 3 (ONLY if an importer exists, or the operator wants server tracing restored): rewire to the current API

Check `@sentry/tanstackstart-react` and `@tanstack/react-start` docs for the
current server-middleware registration mechanism (the API moved away from
`registerGlobalMiddleware`; recent TanStack Start uses a `start.ts` /
`createStart({ requestMiddleware: [...] })` or `globalMiddleware` convention).
Wire `sentryGlobalServerMiddlewareHandler()` via the supported path and confirm
the entry file that registers it is actually imported by the app.
Because this depends on the exact installed versions, if the correct mechanism is
not clearly documented for the installed version, prefer Step 2 (delete) and
report that server tracing needs a follow-up.

**Verify**: `pnpm build` succeeds and the registration file is in the import graph.

## Test plan

- No unit test — this is dead-code removal (or framework wiring). The gate is the
  disappearing `tsc` error plus a clean `pnpm build`.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` no longer reports the `registerGlobalMiddleware` error and adds no new errors
- [ ] `pnpm build` succeeds
- [ ] Either the file is deleted, or it is rewired via a supported API and is in the import graph
- [ ] Report states whether server-side Sentry request middleware is active after this change
- [ ] No files outside `src/app/global-middleware.ts` modified (delete path)
- [ ] `plans/README.md` status row updated

## STOP conditions

- An importer of `global-middleware` exists (drift vs "dead") — do not delete;
  attempt Step 3 or report.
- Step 3's correct registration API for the installed versions is unclear after a
  reasonable docs check — fall back to Step 2 and report the tracing gap.

## Maintenance notes

- If server-side error visibility matters (it likely does for a live product),
  file a follow-up to restore Sentry request middleware via the current API —
  this plan's default path removes the broken attempt but does not restore
  coverage.
- Reviewer: confirm client Sentry (via `vite.config.ts`) is unaffected.
