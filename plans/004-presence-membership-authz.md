# Plan 004: Enforce company membership on presence read/write (fix IDOR + PII leak)

> **Executor instructions**: Follow step by step. Run every verification command
> and confirm the expected result before moving on. If a "STOP conditions" item
> occurs, stop and report — do not improvise. Update this plan's row in
> `plans/README.md` when done, unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/presence.ts convex/brandModules.ts`
> If either changed, compare the "Current state" excerpts to live code; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

Both presence functions authenticate the caller but never check that the caller
belongs to the company. `getPresence` returns collaborators' **names and email
addresses** for any `companyId`; public company IDs are visible in `/public/c/$id`
URLs, so any signed-in user can enumerate the emails of another company's active
viewers — a PII disclosure and IDOR. `updatePresence` similarly lets an outsider
insert presence rows into arbitrary companies (viewer-list pollution / spoofing).
The fix is to reuse the membership check the rest of the backend already uses.

## Current state

- `convex/presence.ts:5-39` — `updatePresence`: checks `getAuthUserId` only, then
  inserts/patches a presence row for `args.companyId` with no membership check.
- `convex/presence.ts:41-77` — `getPresence`: checks `getAuthUserId` only, then
  returns rows including `email` (`:68`) and `name` (`:67`) for any `companyId`.
- The membership helper to reuse — `convex/brandModules.ts:513-539`
  `checkWriteAccess(ctx, companyId, userId)` returns `true` for owner or a
  `companyMembers` row with role `editor`/`owner`. It is a **non-exported**
  module-local function today. Access-control read pattern also appears inline in
  `convex/companies.ts:280-287` (owner OR `isPublic` OR membership row).
- For presence, the right gate is "can this user see this company" (owner, member
  of any role, or the company is public), matching `companies.get` semantics —
  presence is a collaboration signal, and public companies legitimately show
  viewers. Do NOT expose `email` to non-members even for public companies (see Step 3).

## Commands you will need

| Purpose   | Command                          | Expected on success       |
|-----------|----------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`         | no NEW errors vs baseline |
| Lint      | `pnpm exec biome check convex/presence.ts` | exit 0          |
| Backend   | `npx convex dev --once`          | pushes cleanly            |

## Scope

**In scope**:
- `convex/presence.ts`

**Out of scope**:
- `convex/brandModules.ts` — do not move/rename `checkWriteAccess`. Write a
  small local access check inside `presence.ts` instead (see Step 1); extracting
  a shared helper is a separate refactor.
- `src/components/PresenceIndicator.tsx` — the client already calls these
  functions with a real `companyId`; no client change needed.

## Git workflow

- Branch: `advisor/004-presence-authz`
- Commit style: `Security: enforce membership on presence read/write`

## Steps

### Step 1: Add a local "can access company" check

At the top of `convex/presence.ts`, add a helper (import `Id`/`QueryCtx`/`MutationCtx`
types from `./_generated/dataModel` and `./_generated/server` as needed):
```ts
async function canAccessCompany(
	ctx: QueryCtx | MutationCtx,
	companyId: Id<"companies">,
	userId: Id<"users">
): Promise<boolean> {
	const company = await ctx.db.get(companyId);
	if (!company) return false;
	if (company.ownerId === userId) return true;
	if (company.isPublic) return true;
	const membership = await ctx.db
		.query("companyMembers")
		.withIndex("by_company_user", (q) =>
			q.eq("companyId", companyId).eq("userId", userId)
		)
		.first();
	return membership !== null;
}
```
(Match the exact `by_company_user` index usage from `brandModules.ts:531-536`.)

### Step 2: Gate `updatePresence`

After the existing `getAuthUserId` null-check, add:
```ts
if (!(await canAccessCompany(ctx, args.companyId, userId))) {
	return; // silently no-op: do not write presence for companies the user can't access
}
```

### Step 3: Gate `getPresence` and stop leaking email to non-members

After the `getAuthUserId` null-check (which returns `[]`), add the access gate
returning `[]` when it fails. Additionally, **only include `email` when the
viewer is an owner/member** (not merely because the company is public):
- Compute `const isMember = <owner or membership row>` (reuse the logic; you can
  factor a small boolean). For public-but-non-member viewers, return the
  presence rows with `name` only and `email` omitted (or set to `undefined`).

**Verify (both steps)**: `pnpm exec tsc --noEmit` → no new errors; `npx convex dev --once` → pushes cleanly; `grep -n "canAccessCompany" convex/presence.ts` → used in both functions.

## Test plan

- Presence authz is best covered by a `convex-test` harness (introduced in plan
  008/011). If that harness exists when you run this, add a test asserting:
  - a non-member signed-in user gets `[]` from `getPresence` for a private company;
  - `updatePresence` writes nothing for a company the caller can't access;
  - a public-company non-member gets rows without `email`.
- If no harness exists yet, document manual verification in your report and leave
  a `// TODO(test)` note referencing plan 011. Do not block on building a harness.

## Done criteria

- [ ] `updatePresence` no-ops for companies the caller can't access
- [ ] `getPresence` returns `[]` for companies the caller can't access
- [ ] `getPresence` omits `email` for public-company non-member viewers
- [ ] `pnpm exec tsc --noEmit` adds no new errors; `npx convex dev --once` pushes cleanly
- [ ] No files outside `convex/presence.ts` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `by_company_user` index no longer exists in `convex/schema.ts` (drift).
- `PresenceIndicator` turns out to rely on cross-company reads (would mean the
  IDOR is load-bearing) — report and stop.

## Maintenance notes

- If a shared `checkReadAccess` helper is later extracted (see the duplication in
  `companies.ts`, `brandModules.ts`, `export.ts`), replace `canAccessCompany`
  with it and delete the local copy.
- Reviewer: confirm `email` is not reachable by any non-member path, including
  the public-company branch.
