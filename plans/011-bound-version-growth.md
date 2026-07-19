# Plan 011: Bound unbounded brand-module version growth + fix name-module accumulation + drop duplicate subscriptions

> **Executor instructions**: Follow step by step, verifying each. On any "STOP
> conditions" item, stop and report. This touches the version/publish model —
> preserve its invariants. Update this plan's row in `plans/README.md` when done
> unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/brandModules.ts convex/modules/name.ts src/hooks/useCompanyBrand.ts src/hooks/useBrandModule.ts`
> If any changed, compare the excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Depends on**: 008 (convex-test harness for the retention tests); ideally after 007 (failed-status), but not blocking
- **Category**: perf / bug
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

Three related storage/subscription problems that get worse the more a (paying)
brand is edited:

1. **Version rows accumulate forever.** Every generation calls
   `createModuleInternal` (a new row); `unpublishOtherModules` only flips
   `published:false` and never deletes; `deleteModuleInternal` exists but has
   **zero callers**. `getModulesByType` then `.collect()`s *every* version and
   ships the full list to ~9 live studio subscriptions on every edit. Query cost
   and payload grow linearly and unboundedly with regeneration count.
2. **The name module grows one row without bound.** Unlike every other module,
   `nameWorkflow` appends to a single shared row's `data` array
   (`data = [...existingData, ...new]`) instead of creating a new version — so
   its `data` balloons and the version switcher shows only one "version" for
   names, diverging from the rest of the app.
3. **Colors & typography are each subscribed twice.** `useCompanyBrand` subscribes
   to `getModulesByType` for `typography` and `colors`, and the mounted
   `ColorsModule`/`TypographyModule` subscribe to the same query again via
   `useBrandModule` — doubling reactive re-runs on any colors/typography edit.

## Current state

- `convex/brandModules.ts:108-152` — `getModulesByType`, `.collect()` of all
  versions.
- `convex/brandModules.ts:504-511` — `deleteModuleInternal` (zero callers:
  `grep -rn "deleteModuleInternal" convex --include="*.ts" | grep -v _generated`
  shows only the definition).
- `convex/brandModules.ts:541-561` — `unpublishOtherModules` (flips published,
  never deletes).
- `convex/modules/name.ts:386` — `const data = [...existingData, ...namesWithDomainAvailability];`
  then patches the same `moduleId` (`:388-393`). Compare `convex/modules/mission.ts:139-163`
  which creates a fresh row per run via `createModuleInternal`.
- `src/hooks/useCompanyBrand.ts:100-107` — duplicate `getModulesByType`
  subscriptions for `typography` and `colors`.
- `src/hooks/useBrandModule.ts:50` — the per-module subscription used by
  `ColorsModule`/`TypographyModule`.
- Invariants to preserve: `getCurrentModule` returns the newest **published** row
  (`brandModules.ts:347-376`, with a documented index foot-gun); the studio
  version switcher (`useBrandModule.ts:97-119`) needs the published row plus
  recent versions; `unpublishOtherModules` keeps exactly one published row.

## Commands you will need

| Purpose   | Command                          | Expected on success       |
|-----------|----------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`         | no NEW errors vs baseline |
| Backend   | `npx convex dev --once`          | pushes cleanly            |
| Tests     | `pnpm test`                      | all pass                  |

## Scope

**In scope**:
- `convex/brandModules.ts` — add retention on generation; optionally cap `getModulesByType`
- `convex/modules/name.ts` — align name to the per-version model (or cap the array)
- `src/hooks/useCompanyBrand.ts` — remove the duplicate colors/typography subscriptions
- Tests via the convex-test harness (from plan 008)

**Out of scope**:
- The `getCurrentModule` index ordering comment/logic — leave the published-first
  behavior intact; retention must never delete the published row.
- Migrating existing over-large rows (a data backfill) — this plan changes
  go-forward behavior; note the backfill as a follow-up.
- The workflow-orchestration duplication refactor (DEBT-02) — deferred.

## Git workflow

- Branch: `advisor/011-bound-version-growth`
- Commit style: `Perf: bound brand-module version growth + fix name accumulation`

## Steps

### Step 1: Add a retention step on successful generation

Add an `internalMutation` (e.g. `pruneOldVersions({ companyId, type, keep })`)
in `convex/brandModules.ts` that:
- loads all rows for (company, type) via `by_company_type`,
- **always keeps** the published row and the newest `keep` rows by `createdAt`
  (default `keep = 10`; make it a named const),
- deletes the rest via `ctx.db.delete`.
Call it from `updateModuleInternal`'s success path (or from the onComplete
success branch added in plan 007, whichever the module workflows funnel through)
after a new version is written. Ensure it never deletes the just-created row or
the published row.

**Verify**: `pnpm exec tsc --noEmit` → no new errors; `npx convex dev --once` → pushes cleanly; `grep -n "pruneOldVersions\|deleteModuleInternal" convex/brandModules.ts` → the prune path now has a caller.

### Step 2: Cap the read as defense-in-depth (optional but recommended)

In `getModulesByType`, after retention exists, you may add `.order("desc").take(K)`
(K ≥ the retention `keep`) so even pre-existing over-large histories don't ship in
full. Keep the published row reachable — if `take` could exclude it, prefer a
two-query approach (published row + newest K) or rely solely on Step 1's
retention. Choose the simpler correct option and document it.

**Verify**: the studio version switcher still shows recent versions and the
published one (manual smoke; document it).

### Step 3: Align the name module to the version model

In `convex/modules/name.ts`, decide with this rule: **match the other modules** —
create a new version row per regeneration (via `createModuleInternal`) instead of
appending to `existingData`, so names version like everything else and Step 1's
retention applies. Preserve the "set first name as company name on publish"
behavior (`name.ts:397-401`). If product intent is genuinely to accumulate a
growing name pool (the current behavior), instead **cap** the array to the last N
entries and document that choice — but the default is to align with siblings.
This will interact with `ChangeNameDialog` (plan 009) and `useCompanyName`; read
those before changing the shape.

**Verify**: `pnpm exec tsc --noEmit` → no new errors; `npx convex dev --once` → pushes cleanly.

### Step 4: Remove the duplicate colors/typography subscriptions

In `src/hooks/useCompanyBrand.ts:100-107`, remove the `getModulesByType`
subscriptions for `typography` and `colors` **if** the data they provide is also
available via the `ColorsModule`/`TypographyModule` components (which subscribe
via `useBrandModule`). If `useCompanyBrand` genuinely needs that data for other
consumers, instead lift a single subscription and pass it down — do not leave two
independent subscriptions for the same (company, type). Trace the consumers of
`typographyModules`/`colorModules` in `useCompanyBrand` before removing.

**Verify**: `pnpm exec tsc --noEmit` → no new errors; the studio colors/typography
panels still render (manual smoke; document it).

## Test plan

- Using the convex-test harness from plan 008, add tests in a new
  `convex/brandModules.test.ts`:
  - after N+`keep`+1 generations for one (company,type), only `keep`+published
    rows remain;
  - retention never deletes the published row;
  - `unpublishOtherModules` still leaves exactly one published row.
- For name: assert a regeneration creates a new version row (or caps the array,
  per the chosen policy) and that the published/company-name behavior is intact.
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] A retention step deletes old versions on generation, always keeping published + newest `keep`
- [ ] `deleteModuleInternal` (or the new prune mutation) now has a live caller
- [ ] The name module no longer grows one row without bound (versions like siblings, or capped + documented)
- [ ] `useCompanyBrand` no longer duplicates the colors/typography subscriptions
- [ ] `npx convex dev --once` pushes cleanly; `pnpm exec tsc --noEmit` adds no new errors
- [ ] `pnpm test` passes with the new retention tests
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Retention would risk deleting the published or just-created row and you cannot
  guarantee otherwise — STOP and report; correctness beats cleanup here.
- Changing the name-module shape breaks `ChangeNameDialog`/`useCompanyName` types
  in a way you can't resolve within scope — report and stop.
- `useCompanyBrand`'s colors/typography data has consumers that would break —
  lift-and-pass instead of removing, or report.

## Maintenance notes

- Existing over-large rows are not migrated by this plan (go-forward only). File a
  one-off backfill (`npx convex run` script) to prune historical rows and shrink
  the accumulated name row if needed.
- Reviewer: the retention deletion is the risky line — verify the keep-set always
  includes the published row and the newest version, under both create and
  update paths.
- If pagination or a "restore old version" feature is added later, revisit the
  `keep` constant and the read cap.
