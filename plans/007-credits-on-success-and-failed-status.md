# Plan 007: Charge credits on generation success (not start), surface failed generations, and meter the create path

> **Executor instructions**: Follow step by step. Run every verification command
> and confirm the expected result before moving on. If a "STOP conditions" item
> occurs, stop and report — do not improvise. This plan touches the billing and
> generation critical path; be conservative. Update this plan's row in
> `plans/README.md` when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/brandModules.ts convex/companies.ts convex/track.ts convex/index.ts convex/modules`
> If any changed, compare the "Current state" excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: M (lean toward L — this is the money + reliability path)
- **Depends on**: 001 (for the test harness the test plan uses)
- **Category**: bug + security
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

Three linked defects in the generation lifecycle:

1. **Users pay for failures.** `regenerateModule` deducts credits immediately
   after `workflow.start(...)`, which returns a workflow-ID *string* synchronously
   before any AI work runs. `if (result)` is therefore always true, so credits
   are deducted the instant the job is queued. If generation then fails
   (OpenRouter/Replicate error, invalid output), the user is charged 1–3 credits
   and gets nothing. There is no refund path.
2. **Failed generations hang forever.** Every module workflow sets
   `generationStatus: "in_progress"` at start and `"succeeded"` at the end, with
   nothing in between. The string `"failed"` is never written anywhere in
   `convex/modules/`. When a workflow throws after retries, the row stays
   `in_progress` permanently and the UI shows a perpetual "Generating…" spinner
   with no retry affordance — even though the `"failed"` state exists in the type
   union (`useBrandModule.ts:14`).
3. **The create path is unmetered.** `companies.create` fires eight generation
   workflows (including the Replicate-backed logo, 3 credits' worth) with **no
   credit check at all** and with unawaited promises. Combined with (1), a user
   can get unlimited free generation by repeatedly creating companies.

The unifying fix is a workflow `onComplete` handler: it is the correct place to
(a) deduct credits only on success, (b) write `failed` on non-success, and (c)
give the create path the same metering boundary as regenerate.

## Current state

- `convex/brandModules.ts:252-312` — `regenerateModule`: gates on
  `checkTrackCredits({ throw: true })` (`:288-293`), starts the workflow
  (`:295-299`), then deducts (`:301-308`):
  ```ts
  const result: unknown = await workflow.start(ctx, workflowRef, { companyId, publish, options });
  if (result) {
  	await ctx.runAction(internal.track.checkTrackCredits, { companyId, credits, deduct: true });
  }
  return result;
  ```
  `regenerateModuleAdmin` (`:317-336`) confirms `workflow.start` returns a
  string ID (`return String(workflowId)`).
- `convex/track.ts:6-35` — `checkTrackCredits({ companyId, credits, deduct?, throw? })`.
  Deduct calls `autumn.track(ctx, { featureId: "credits", value: credits })`.
- `convex/index.ts:1-4` — `export const workflow = new WorkflowManager(components.workflow);`
- Workflow `onComplete` API (from `@convex-dev/workflow`): `workflow.start(ctx, ref, args, { onComplete, context })` where `onComplete` is a **mutation** FunctionReference and receives `{ workflowId, context, result }`. `result` is a `RunResult` with a `kind` discriminator (`"success" | "failed" | "canceled"`). Confirm the exact `RunResult` shape by reading `node_modules/@convex-dev/workflow/dist/types.d.ts` before coding.
- Per-module credit costs live in `MODULE_WORKFLOWS` (`brandModules.ts:192-241`):
  logo = 3, everything else = 1.
- The workflows that set status: e.g. `convex/modules/mission.ts:145` (`in_progress`
  in `createModuleInternal`) and `:158-163` (`updateModuleInternal` with
  `succeeded`). Same shape in all of `colors, marketing, mission, social, tagline,
  story, tone, typography, website, logo, name, brandContext`.
- `convex/companies.ts:326-343` — the unmetered, unawaited create fan-out:
  ```ts
  const workflows = [ internal.modules.name.nameWorkflow, /* …8 total… */ ];
  for (const wf of workflows) {
  	workflow.start(ctx, wf, { companyId, publish: true });
  }
  return companyId;
  ```
- `updateModuleInternal` (`brandModules.ts:444-474`) already accepts an optional
  `generationStatus` and is the natural place a `failed` status would be written
  by moduleId. `upsertModuleByTypeInternal` (`:408-442`) writes by (company,type).

## Commands you will need

| Purpose   | Command                          | Expected on success       |
|-----------|----------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`         | no NEW errors vs baseline |
| Backend   | `npx convex dev --once`          | pushes cleanly            |
| Tests     | `pnpm test` (needs 001)          | all pass                  |
| Lint      | `pnpm exec biome check convex/brandModules.ts convex/track.ts convex/companies.ts` | exit 0 |

## Scope

**In scope**:
- `convex/brandModules.ts` — regenerate deduction, onComplete mutation, create metering wiring
- `convex/companies.ts` — meter + await the create fan-out
- `convex/track.ts` — only if you need a deduct-by-idempotency variant (see plan 008; here keep it simple)
- `src/hooks/useBrandModule.ts` and one module UI component — only to surface the `failed` state with a retry (Step 4); keep minimal

**Out of scope**:
- The atomic check-then-deduct race (concurrent double-spend) — that is **plan
  008**, which depends on this one. Do not attempt idempotency-key work here
  beyond what onComplete needs.
- The `name.ts` unbounded-append behavior — that is **plan 011**.
- Rewriting the per-module workflow boilerplate — deferred (see README).

## Git workflow

- Branch: `advisor/007-credits-on-success`
- Commit style: `Billing: charge credits on generation success + surface failed state`

## Steps

### Step 1: Read the workflow RunResult shape

Read `node_modules/@convex-dev/workflow/dist/types.d.ts` and confirm the
`RunResult` union: the `kind: "success"` branch and how failure/cancel are
represented. Do not proceed until you know the exact discriminator field and
values — the onComplete handler branches on it.

**Verify**: you can state the success discriminator (e.g. `result.kind === "success"`).

### Step 2: Add an `onComplete` mutation that deducts on success and marks failure

In `convex/brandModules.ts`, add an `internalMutation` (e.g. `onModuleWorkflowComplete`)
taking the onComplete args plus a `context` you pass at start-time carrying
`{ companyId, type, credits, moduleId? }`. Behavior:
- On `result.kind === "success"`: deduct credits. **Note**: `autumn.track` runs
  in an *action*, not a mutation — so the onComplete mutation cannot call
  `checkTrackCredits` (an action) directly. Two options; pick the one that
  matches the installed Convex API:
  - Schedule the deduct action from the mutation via `ctx.scheduler.runAfter(0, internal.track.checkTrackCredits, { companyId, credits, deduct: true })`, **or**
  - Make the onComplete target an `internalAction` if `@convex-dev/workflow`
    accepts an action for onComplete (it may require a mutation — verify against
    the type from Step 1; if it must be a mutation, use the scheduler approach).
- On non-success: patch the module row to `generationStatus: "failed"`. If the
  `context` carries the `moduleId`, patch it directly; otherwise look up the
  newest row for (company,type) and mark it failed.

### Step 3: Rewire `regenerateModule` and the create fan-out to use onComplete

- In `regenerateModule` (`brandModules.ts:295-308`): **remove** the post-`start`
  `if (result) { … deduct … }` block. Keep the up-front `checkTrackCredits({ throw: true })`
  gate (it prevents starting when the balance is already insufficient). Pass
  `{ onComplete: internal.brandModules.onModuleWorkflowComplete, context: { companyId, type, credits } }`
  as the 4th arg to `workflow.start`.
- In `companies.create` (`companies.ts:326-343`): decide the credit policy for the
  first kit. The safest choice consistent with the rest of the app is to **meter
  it like regenerate** — but the initial kit is 8 workflows and blocking creation
  on 10+ credits may be intended-free onboarding. Because this is a product
  decision, do the following: add a single `checkTrackCredits({ throw: true })`
  gate for the *total* create cost before the loop, `await` all `workflow.start`
  calls (wrap in `Promise.all`), and attach the same `onComplete` so each
  workflow deducts its own credits on success. If gating the whole create on
  credits would block legitimate first-time users (no credits yet), instead
  grant a bounded free onboarding by NOT gating create but STILL attaching
  onComplete for `failed`-status handling, and **report this choice** so the
  owner can confirm the free-first-kit policy. Do not leave create both unmetered
  AND without failure handling.

**Verify**: `grep -n "onComplete" convex/brandModules.ts convex/companies.ts` → present in both start sites; `grep -n "if (result)" convex/brandModules.ts` → the old deduct block is gone; `npx convex dev --once` → pushes cleanly.

### Step 4: Surface the `failed` state in the UI with a retry

In `src/hooks/useBrandModule.ts` / the module rendering path, when
`selected.generationStatus === "failed"`, show an error state with a "Try again"
action that calls `regenerate(...)`. Keep it small — reuse existing button/toast
primitives. The type already includes `"failed"` (`useBrandModule.ts:14`).

**Verify**: `pnpm exec tsc --noEmit` → no new errors.

### Step 5: Full verification

**Verify**:
- `npx convex dev --once` → pushes cleanly
- `pnpm exec tsc --noEmit` → no new errors
- `pnpm exec biome check` on the touched files → exit 0

## Test plan

- With plan 001's harness present, add tests (a `convex-test` harness may be set
  up in plan 008/011 — if it exists, reuse it; otherwise add pure-unit tests for
  any extracted helper such as a `creditsForType(type)` function):
  - onComplete on `success` schedules/performs a deduct of the right credit count.
  - onComplete on failure patches the module to `generationStatus: "failed"`.
  - `regenerateModule` no longer deducts synchronously after `start` (assert the
    deduct call is not made in the start path).
- Model test structure after plan 001's tests.
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] Credits are deducted only from the `onComplete` success branch, not after `workflow.start`
- [ ] A failed workflow results in `generationStatus: "failed"` on the module row
- [ ] The UI renders a retry affordance for `failed` modules
- [ ] `companies.create` awaits its `workflow.start` calls and either meters them or documents the free-first-kit decision
- [ ] `npx convex dev --once` pushes cleanly; `pnpm exec tsc --noEmit` adds no new errors
- [ ] `pnpm test` passes (new tests included)
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `@convex-dev/workflow` version installed does not support `onComplete` (the
  option is absent from the type read in Step 1) — report the version and stop;
  the fallback (a terminal deduct/status step inside each workflow) is a much
  larger change touching all 12 module files and should be re-planned.
- onComplete must be a mutation and the scheduler cannot reach the deduct action
  — report and stop.
- Metering `companies.create` would block all first-time users (no starting
  credits) — take the documented free-first-kit path and report for owner sign-off.

## Maintenance notes

- Plan 008 builds directly on this: it adds an idempotency key to the deduct so
  concurrent/ retried workflows can't double-charge. Keep the deduct call in one
  place (the onComplete branch) so 008 has a single site to harden.
- Reviewer: the highest-risk line is the deduct — confirm it fires exactly once
  per successful generation and never on failure. Trace context passing from
  `workflow.start` to `onComplete`.
- Watch: if a new module type is added to `MODULE_WORKFLOWS`, its credit cost
  must flow into the onComplete `context`.
