# Plan 009: Fix "Generate New Names" — ChangeNameDialog calls an action through `useMutation`

> **Executor instructions**: Follow step by step, verifying each. On any "STOP
> conditions" item, stop and report. Update this plan's row in `plans/README.md`
> when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- src/components/modules/ChangeNameDialog.tsx convex/brandModules.ts`
> If either changed, compare the excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`ChangeNameDialog` binds `regenerateModule` with `useMutation`, but
`api.brandModules.regenerateModule` is defined as an **action**, not a mutation.
The Convex client rejects an action reference passed to the mutation transport at
runtime, so clicking "Generate New Names" fails — and the failure is swallowed by
an empty `catch {}`, leaving the spinner and no new names. This is a broken,
user-facing feature (and it is one of the repo's current `tsc` errors). The fix
is one line plus surfacing the previously-swallowed error.

## Current state

- `src/components/modules/ChangeNameDialog.tsx:1` imports both hooks:
  `import { useAction, useMutation } from "convex/react";`
- `src/components/modules/ChangeNameDialog.tsx:30-31`:
  ```ts
  const generateDomainsAction = useAction(api.modules.name.generateDomains);
  const regenerateModule = useMutation(api.brandModules.regenerateModule); // ← wrong: it's an action
  ```
- `src/components/modules/ChangeNameDialog.tsx:111-123` — `handleRegenerate`
  calls `await regenerateModule({ companyId, type: "name" })` inside a
  `try { … } catch { /* swallowed */ }`.
- Confirmed `regenerateModule` is an action: `convex/brandModules.ts:252`
  `export const regenerateModule = action({ … })`.
- Correct precedent: `src/hooks/useBrandModule.ts:55`
  `const regenerateModule = useAction(api.brandModules.regenerateModule);`

## Commands you will need

| Purpose   | Command                              | Expected on success       |
|-----------|--------------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`             | the ChangeNameDialog action/mutation error is GONE; no new errors |
| Lint      | `pnpm exec biome check src/components/modules/ChangeNameDialog.tsx` | exit 0 |

## Scope

**In scope**:
- `src/components/modules/ChangeNameDialog.tsx`

**Out of scope**:
- `convex/brandModules.ts` — `regenerateModule` is correctly an action; do not
  change it.
- The name-module accumulation behavior — that is plan 011.

## Git workflow

- Branch: `advisor/009-fix-changename-action`
- Commit style: `Fix: ChangeNameDialog regenerate uses useAction, not useMutation`

## Steps

### Step 1: Switch to `useAction`

Change `ChangeNameDialog.tsx:31` to:
```ts
const regenerateModule = useAction(api.brandModules.regenerateModule);
```
`useAction` is already imported on line 1, so no import change is needed. If, after this, `useMutation` is no longer used anywhere in the file, remove it from the import to satisfy the no-unused-import lint rule.

**Verify**: `pnpm exec tsc --noEmit 2>&1 | grep "ChangeNameDialog"` → no output (the type error is gone).

### Step 2: Surface the previously-swallowed error

In `handleRegenerate` (`:111-123`), replace the empty `catch {}` with a user-visible
error. The repo uses `sonner` toasts (imported elsewhere, e.g.
`useBrandModule.ts:4` `import { toast } from "sonner";`). Add
`import { toast } from "sonner";` if not present and, in the catch, call
`toast.error("Couldn't generate new names. Please try again.");`. Keep the
`finally { setIsRegenerating(false); }`.

**Verify**: `pnpm exec biome check src/components/modules/ChangeNameDialog.tsx` → exit 0; `grep -n "catch {" src/components/modules/ChangeNameDialog.tsx` → the regenerate catch is no longer empty (or is now `catch (error)` with a toast).

### Step 3: Manual smoke

Document in your report that "Generate New Names" now issues an action call. A
full run needs a live backend + credits; note whether you could verify end-to-end.

## Test plan

- This is a hook-binding fix; the primary gate is the typecheck error
  disappearing. A component test would require mocking the Convex client and the
  name module — heavier than the fix warrants. If plan 001's jsdom project is set
  up and Testing Library is wired, an optional render test asserting the button
  triggers the action mock is welcome but not required.

## Done criteria

- [ ] `regenerateModule` in ChangeNameDialog uses `useAction`
- [ ] `pnpm exec tsc --noEmit` no longer reports the ChangeNameDialog action/mutation error, and adds no new errors
- [ ] The regenerate error is surfaced (toast), not swallowed
- [ ] `pnpm exec biome check` on the file exits 0
- [ ] No files outside `ChangeNameDialog.tsx` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `regenerateModule` is no longer an action in `convex/brandModules.ts` (drift).
- Line 31 no longer matches the excerpt (drift).

## Maintenance notes

- The other swallowed `catch {}` in this file (`:104-106`, name-save) has the
  same "could show a toast" comment — consider surfacing it too in review, though
  it is out of this plan's strict scope.
- Reviewer: confirm no remaining `useMutation(api.…action…)` mismatch elsewhere:
  `grep -rn "useMutation(api" src` and spot-check each target is a mutation.
