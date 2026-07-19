# Plan 013: Add a real `typecheck` script, make `pnpm check` match its docs, refresh convex/README

> **Executor instructions**: Follow step by step, verifying each. On any "STOP
> conditions" item, stop and report. Update this plan's row in `plans/README.md`
> when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- package.json README.md convex/README.md`
> If any changed, compare the excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Depends on**: none (but best run after the tsc-error-fixing plans 009, 010, 012 so `typecheck` is closer to clean)
- **Category**: dx / docs
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`README.md:291` tells developers `pnpm check` does "Type-check + lint + format
check", but `package.json`'s `check` is `biome check` — **lint/format only, no
`tsc`**. There is no `typecheck` script at all, so nothing locally reproduces
CI's type gate (which itself is `continue-on-error`). The result: type errors
(the current ~12, including the ones fixed in plans 009/010/012) sail past local
review because the one command people run doesn't check types. Adding a
`typecheck` script and making `check` honest is a tiny change with outsized effect
on catching regressions before push. The unedited `convex/README.md` boilerplate
is a minor docs cleanup folded in.

## Current state

- `package.json:5-15` — scripts; `"check": "biome check"`, no `typecheck`:
  ```json
  "scripts": {
  	"dev": "vite dev --port 3000",
  	"build": "vite build",
  	"serve": "vite preview",
  	"test": "vitest run",
  	"format": "biome format",
  	"lint": "biome lint",
  	"check": "biome check",
  	…
  }
  ```
- `README.md:291` — `| Type-check + lint + format check | \`pnpm check\` |`.
- `README.md:290` — `| Lint only | \`pnpm lint\` |` (this row is accurate).
- CI runs `pnpm exec tsc --noEmit` only in the `continue-on-error` quality job
  (`.github/workflows/ci.yml`).
- `convex/README.md` — unedited Convex starter boilerplate ("Welcome to your
  Convex functions directory!"), no repo-specific content. By contrast
  `src/components/modules/README.md` is accurate.
- Baseline: `pnpm exec tsc --noEmit` currently reports ~12 errors. `pnpm check`
  (biome) reports thousands of pre-existing lint findings (known, tracked in
  BACKLOG.md — the CI quality job is intentionally `continue-on-error`).

## Commands you will need

| Purpose   | Command                    | Expected on success       |
|-----------|----------------------------|---------------------------|
| Typecheck | `pnpm typecheck`           | runs `tsc --noEmit` (exit code reflects the baseline errors) |
| Check     | `pnpm check`               | runs typecheck + biome    |

## Scope

**In scope**:
- `package.json` (add `typecheck`, adjust `check`)
- `README.md` (make the `pnpm check` row accurate)
- `convex/README.md` (replace boilerplate with a short directory map, or delete)

**Out of scope**:
- Fixing the existing tsc/biome errors — that is other plans' work; this plan
  only makes the commands honest. Do NOT try to zero out the errors here.
- Flipping the CI quality job to blocking — that is a separate BACKLOG item and
  depends on the debt being paid down first.
- Adding pre-commit hooks — optional; mention as a follow-up, don't add here
  unless trivial and requested.

## Git workflow

- Branch: `advisor/013-dx-typecheck-docs`
- Commit style: `DX: add typecheck script + make pnpm check honest`

## Steps

### Step 1: Add a `typecheck` script and fix `check`

In `package.json` scripts, add:
```json
"typecheck": "tsc --noEmit",
```
and change `check` so it actually does what the README claims. Because `tsc`
currently exits non-zero (baseline errors), decide the composition:
- **Recommended**: `"check": "tsc --noEmit && biome check"`. This makes `check`
  fail until the type debt is paid — which is the honest behavior and matches the
  README wording. Note in your report that `pnpm check` will now exit non-zero
  against the current baseline (expected; it surfaces real debt).
- If the operator prefers `check` to stay green for now, instead **fix the README
  wording** (Step 2 alternate) and keep `check` as `biome check`, while still
  adding the standalone `typecheck` script. Pick the recommended option unless
  told otherwise; report which you chose.

**Verify**: `pnpm typecheck` runs `tsc --noEmit` (does the typecheck; exit code
reflects baseline errors — that's fine). `grep -n '"typecheck"' package.json` → present.

### Step 2: Make the README row accurate

If you took the recommended `check = tsc && biome` path, `README.md:291` is now
correct as written. If you kept `check` as biome-only, change `README.md:291` to
describe it as "Lint + format check" and add a new row:
`| Type-check | \`pnpm typecheck\` |`.

Either way, ensure the README's Common-tasks table has an accurate row for
`typecheck`.

**Verify**: `grep -n "typecheck\|pnpm check" README.md` → the table reflects reality.

### Step 3: Refresh convex/README.md

Replace the boilerplate with a short directory map (5–12 lines) covering the real
structure: `schema.ts` (tables + indexes), `modules/` (one file per brand module:
Zod schema + prompt + workflow), `workflows/index.ts` (BRAND_MODULE_TYPES source
of truth), `brandModules.ts` (generic version/publish helpers), `autumn.ts` +
`track.ts` (billing/credits), `site.ts` (published-site payload), `export.ts`,
`lib/design/` (shared generation + deterministic checks), `lib/firecrawl.ts`.
Keep it factual and brief. Deleting the file is an acceptable alternative if a
map isn't wanted.

**Verify**: `head -5 convex/README.md` → repo-specific content, not "Welcome to
your Convex functions directory!".

## Test plan

- No unit tests — this is scripts + docs. Gates: `pnpm typecheck` exists and runs
  `tsc --noEmit`; the README table matches the actual script behavior.

## Done criteria

- [ ] `package.json` has a `typecheck` script running `tsc --noEmit`
- [ ] `pnpm check` behavior matches the README's description of it (via the recommended composed `check`, or a corrected README + standalone typecheck)
- [ ] `README.md` Common-tasks table accurately describes `check`/`typecheck`
- [ ] `convex/README.md` has repo-specific content (or is deleted)
- [ ] No source files (`src/`, `convex/*.ts`) modified — only scripts/docs
- [ ] `plans/README.md` status row updated

## STOP conditions

- `package.json` scripts no longer match the excerpt (drift).
- Composing `check` as `tsc && biome` is undesirable to the operator and no
  guidance is available — default to the recommended path and clearly report that
  `pnpm check` now exits non-zero against the baseline.

## Maintenance notes

- Follow-up (deferred): once the type debt is zero (plans 009/010/012 remove
  several errors), consider making CI's quality job blocking — that's tracked in
  `.ai-business/BACKLOG.md`. A `lint-staged` pre-commit hook that fails only on
  newly-touched files would let the team pay down the biome debt incrementally.
- Reviewer: confirm `typecheck` uses the project's `tsconfig.json` (bare
  `tsc --noEmit` does) and isn't accidentally scoped narrower.
