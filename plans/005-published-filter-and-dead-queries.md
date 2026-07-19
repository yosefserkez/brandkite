# Plan 005: Stop leaking draft modules on public reads; remove/gate dead queries

> **Executor instructions**: Follow step by step. Verify each step before moving
> on. On any "STOP conditions" item, stop and report. Update this plan's row in
> `plans/README.md` when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/brandModules.ts`
> If it changed, compare the excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Depends on**: none
- **Category**: security + tech-debt
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

For `isPublic` companies, the module-read queries return **all** module rows —
including `published: false` drafts, superseded versions, and in-progress
generations — to anyone, unlike the export and site-payload paths which filter to
published-only. This leaks work the owner never chose to publish (rejected logo
concepts, draft copy). Two of the affected queries (`getModules`,
`listModuleTypes`) are also **dead** — no `src` caller references them — so the
safest fix is to delete them, and to add the published filter to the one that is
actually used on public paths (`getModulesByType`).

## Current state

- `convex/brandModules.ts:20-60` — `getModules`: for unauthenticated users on a
  public company, `.collect()`s every module with no published filter
  (`:33-38`). **No `src` caller** (`grep -rn "\.getModules\b" src` → nothing).
- `convex/brandModules.ts:62-106` — `listModuleTypes`: same shape, also derives
  types from all rows. **No `src` caller** (`grep -rn "listModuleTypes" src` → nothing).
- `convex/brandModules.ts:108-152` — `getModulesByType`: **this one is used** —
  by `src/hooks/useBrandModule.ts:50` and `src/hooks/useCompanyBrand.ts:100,104`.
  Its unauthenticated/public branch (`:119-130`) also returns all versions with
  no published filter. This is the query that must gain a filter without breaking
  the authenticated studio (which legitimately needs all versions for the version
  switcher).
- Correct precedent: `convex/export.ts:242` and `convex/site.ts:126-128` both do
  `.filter((q) => q.eq(q.field("published"), true))` on public paths.
- Verify "dead" claim before deleting: `grep -rn "getModules\b\|listModuleTypes" src` returned only `heart-pointer.tsx` (unrelated substring match on `getModules`), confirming no real caller. Re-run this grep in Step 1.

## Commands you will need

| Purpose   | Command                              | Expected on success       |
|-----------|--------------------------------------|---------------------------|
| Grep      | `grep -rn "getModules\b\|listModuleTypes" src convex --include="*.ts" --include="*.tsx" \| grep -v _generated` | only definitions, no external callers |
| Typecheck | `pnpm exec tsc --noEmit`             | no NEW errors vs baseline |
| Backend   | `npx convex dev --once`              | pushes cleanly            |

## Scope

**In scope**:
- `convex/brandModules.ts`

**Out of scope**:
- The authenticated branches of `getModulesByType` — owners/members must keep
  seeing all versions (the version switcher depends on it).
- `convex/export.ts`, `convex/site.ts` — already correct.
- Any `src/` file — the used query keeps the same signature.

## Git workflow

- Branch: `advisor/005-published-filter`
- Commit style: `Security: published-only public module reads; drop dead queries`

## Steps

### Step 1: Confirm the two queries are truly unused, then delete them

Run:
```
grep -rn "getModules\b" src --include="*.ts" --include="*.tsx" | grep -v routeTree
grep -rn "listModuleTypes" src --include="*.ts" --include="*.tsx" | grep -v routeTree
grep -rn "getModules\b\|listModuleTypes" convex --include="*.ts" | grep -v _generated | grep -v "brandModules.ts"
```
If all three return nothing (only the definitions in `brandModules.ts` exist),
delete the `getModules` export (`:20-60`) and the `listModuleTypes` export
(`:62-106`).

If any external caller exists, do NOT delete that query — instead add the
published filter to its public branch (as in Step 2) and report the caller.

**Verify**: `pnpm exec tsc --noEmit` → no new errors (nothing referenced them). `grep -c "export const getModules\b\|export const listModuleTypes" convex/brandModules.ts` → 0.

### Step 2: Add the published filter to `getModulesByType`'s public branch

In the **unauthenticated** branch (`convex/brandModules.ts:119-130`) and in the
**public-non-member** branch, add `.filter((q) => q.eq(q.field("published"), true))`
to the query, matching `export.ts:242`. Keep the **owner/member** branch
(`:144-150`) returning all versions unchanged.

Concretely, the unauthenticated public branch becomes:
```ts
const modules = await ctx.db
	.query("brandModules")
	.withIndex("by_company_type", (q) =>
		q.eq("companyId", args.companyId).eq("type", args.type)
	)
	.filter((q) => q.eq(q.field("published"), true))
	.collect();
return modules.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
```
There are two public exits in this function (the early unauthenticated return and
the fallthrough after a failed membership check). Ensure the published filter
applies to the anonymous/public-viewer path but NOT to owner/member access. Read
the whole function (`:108-152`) and place the filter so authenticated
owners/members still get every version.

**Verify**: `pnpm exec tsc --noEmit` → no new errors; `npx convex dev --once` → pushes cleanly.

### Step 3: Manual smoke

Confirm the studio (owner view) still shows the version switcher with multiple
versions, and a logged-out view of a public company shows only published data.
Document this in your report.

## Test plan

- Covered well by the `convex-test` harness from plan 011 (publish/version state
  machine). If it exists when you run this, add a test: an anonymous
  `getModulesByType` on a public company with one published + two draft rows
  returns exactly one row; an owner call returns all three.
- If no harness yet, leave a `// TODO(test)` note referencing plan 011 and
  document manual verification.

## Done criteria

- [ ] `getModules` and `listModuleTypes` deleted (or, if a caller exists, filtered and reported)
- [ ] `getModulesByType` returns only published rows on anonymous/public-non-member paths
- [ ] Owner/member path still returns all versions (studio switcher intact)
- [ ] `pnpm exec tsc --noEmit` adds no new errors; `npx convex dev --once` pushes cleanly
- [ ] No files outside `convex/brandModules.ts` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- A real external caller of `getModules`/`listModuleTypes` exists (drift vs the
  "dead" assumption) — filter instead of delete, and report.
- The owner/member branch of `getModulesByType` cannot be separated from the
  public branch cleanly — report the function shape and stop.

## Maintenance notes

- Any new public-facing module query MUST filter to `published: true`. Consider a
  reviewer checklist item.
- If team viewers (`viewer` role) should see drafts, revisit the branch logic;
  today "member" = editor/owner for write, but read access includes viewers.
