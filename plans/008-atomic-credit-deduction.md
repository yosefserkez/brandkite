# Plan 008: Make credit deduction idempotent/atomic to prevent double-spend

> **Executor instructions**: Follow step by step, verifying each. On any "STOP
> conditions" item, stop and report. This is billing-critical — be conservative.
> Update this plan's row in `plans/README.md` when done unless a reviewer
> maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/track.ts convex/brandModules.ts`
> Also confirm plan 007 has landed (the deduct now happens in an onComplete
> branch). If 007 is not landed, STOP — this plan assumes its structure.

## Status

- **Priority**: P2
- **Effort**: M
- **Depends on**: 007 (deduction moved to a single onComplete site), 001 (tests)
- **Category**: bug (billing correctness)
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`checkTrackCredits` reads the balance (`autumn.check`) and deducts
(`autumn.track`) as two separate awaited network calls with no serialization,
and Convex actions are not transactional. Two generations fired close together
(double-click, or several modules regenerated at once) can both pass the `check`
with a balance of 1 and both `track`, driving the balance negative — free usage
beyond entitlement. This is a classic check-then-act race on a shared resource.
Autumn's `track` API accepts an `idempotency_key`; using it (plus deriving the
deduct from a stable per-workflow key) closes the double-charge/double-credit
window without inventing a locking scheme.

## Current state

- `convex/track.ts:6-35` — `checkTrackCredits`:
  ```ts
  const { data: creditsData } = await autumn.check(ctx, { featureId: "credits", requiredBalance: args.credits });
  if (!creditsData?.allowed) { if (args.throw) throw new ConvexError("Not enough usage credits"); return false; }
  if (args.deduct) { await autumn.track(ctx, { featureId: "credits", value: args.credits }); }
  return creditsData.allowed;
  ```
- Autumn `track` supports idempotency. Confirmed shapes:
  - `@useautumn/convex` `TrackArgsType` includes `idempotencyKey?: string` and
    `entityId?`/`featureId?`/`value?` (see `node_modules/@useautumn/convex/dist/client/index.d.ts` `api().track`).
  - Underlying `autumn-js` `TrackParams` includes `idempotency_key?: string` and
    `customer_id` (see `node_modules/autumn-js/dist/sdk/index.d.ts` `TrackParamsSchema`).
  Use the `@useautumn/convex` wrapper's `idempotencyKey` field (camelCase) since
  that is what `autumn.track(ctx, …)` accepts in this codebase.
- After plan 007, the deduct is invoked from the `onComplete` branch with a
  `context` that already carries `{ companyId, type, credits }` and has access to
  the `workflowId`. The `workflowId` is a natural idempotency key: it is unique
  per generation and stable across onComplete retries.

## Commands you will need

| Purpose   | Command                          | Expected on success       |
|-----------|----------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`         | no NEW errors vs baseline |
| Backend   | `npx convex dev --once`          | pushes cleanly            |
| Tests     | `pnpm test`                      | all pass                  |

## Scope

**In scope**:
- `convex/track.ts` — thread an idempotency key into `autumn.track`
- `convex/brandModules.ts` — pass the `workflowId` (or a per-generation key) as the idempotency key from the onComplete site
- A `convex-test` harness setup (dev dependency + config) and tests for the deduct path (create)

**Out of scope**:
- The up-front `checkTrackCredits({ throw: true })` gate — leave it; it is a
  best-effort UX guard, and the idempotency key is what actually prevents
  double-charge. Do not try to make check+deduct a single Autumn call unless the
  Autumn API exposes one (verify; if `autumn.check` has a `sendEvent`/reserve
  mode, note it but do not adopt without confirmation).
- Any change to the deduct *timing* — 007 already moved it to success-only.

## Git workflow

- Branch: `advisor/008-atomic-credits`
- Commit style: `Billing: idempotent credit deduction keyed on workflow id`

## Steps

### Step 1: Add an idempotency key parameter to the deduct

In `convex/track.ts`, add an optional `idempotencyKey: v.optional(v.string())`
arg to `checkTrackCredits` and pass it through to `autumn.track`:
```ts
if (args.deduct) {
	await autumn.track(ctx, {
		featureId: "credits",
		value: args.credits,
		...(args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : {}),
	});
}
```
Confirm the field name (`idempotencyKey`) against `node_modules/@useautumn/convex/dist/client/index.d.ts` before committing — if the wrapper exposes it under a different casing, use that.

**Verify**: `pnpm exec tsc --noEmit` → no new errors.

### Step 2: Pass the workflowId as the key from onComplete

In the `onComplete` deduct site added by plan 007 (in `convex/brandModules.ts`),
pass `idempotencyKey: workflowId` (the `workflowId` from the onComplete args).
This makes the deduct for a given generation idempotent: an onComplete retry, or
any duplicate delivery, deducts at most once.

**Verify**: `grep -n "idempotencyKey" convex/brandModules.ts convex/track.ts` → present in both; `npx convex dev --once` → pushes cleanly.

### Step 3: Set up a convex-test harness (for this and future plans)

- `pnpm add -D convex-test @edge-runtime/vm` (confirm these are the correct
  packages for the installed Convex version by checking Convex testing docs; if
  the version differs, report).
- Add a Vitest project/config entry so Convex function tests run under the
  edge-runtime environment separate from the node unit tests from plan 001.
  Follow the official convex-test setup (a `convexTest(schema)` harness).

**Verify**: a trivial convex-test smoke test (e.g. insert a company, read it
back) passes via `pnpm test`.

### Step 4: Test the deduct idempotency

Write a test that invokes the deduct path twice with the same `idempotencyKey`
and asserts the balance is decremented once. Autumn is an external service; stub
`autumn.track`/`autumn.check` (or the `@useautumn/convex` client) so the test
asserts that `track` is called with the idempotency key and that the harness's
book-keeping reflects a single deduction for a repeated key. If stubbing Autumn
proves impractical in convex-test, fall back to a **pure unit test** of a small
extracted helper that computes the idempotency key and guards a local ledger, and
document the limitation.

**Verify**: `pnpm test` → the idempotency test passes.

## Test plan

- New tests as in Steps 3–4: convex-test harness smoke + deduct idempotency.
- Model after plan 001's Vitest structure; the convex-test harness is new
  infrastructure this plan establishes for later plans (011, and retroactively
  004/005/007 authz/state tests).
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] `autumn.track` is called with an idempotency key derived from the workflowId
- [ ] `checkTrackCredits` accepts and forwards `idempotencyKey`
- [ ] A convex-test harness exists and a smoke test passes
- [ ] A test asserts a repeated deduct key does not double-deduct
- [ ] `npx convex dev --once` pushes cleanly; `pnpm exec tsc --noEmit` adds no new errors
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Plan 007 has not landed (no single onComplete deduct site) — STOP; this plan
  depends on that structure.
- The installed `@useautumn/convex` does not expose an idempotency field on
  `track` — report the actual API; the fallback is a Convex-side dedupe table
  keyed on workflowId, which is a larger change and should be re-planned.
- convex-test cannot be made to run against the installed Convex version — set up
  the pure-unit fallback for the key logic and report.

## Maintenance notes

- The convex-test harness this plan stands up is reused by plans 011 (version
  retention) and retroactively strengthens 004/005/007 tests. Keep its setup in a
  shared test-util so those plans import it.
- Reviewer: confirm the idempotency key is stable per generation and unique
  across generations (workflowId satisfies both). A key that collides across
  generations would *under*-charge.
