# Plan 001: Establish a test baseline — vitest config + unit tests for the deterministic design checks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/lib/design/checks.ts vite.config.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

The repo has Vitest + Testing Library installed but **zero test files exist** and
there is no test config, so `pnpm test` runs nothing. This is the prerequisite
for every other plan that says "add a test": until a working test harness
exists, no plan can prove its fix. The cheapest, highest-value first target is
`convex/lib/design/checks.ts` — pure functions (WCAG contrast math, regex
stat/buzzword detection) with no I/O, which encode the quality bar for the
`credits: 3` logo path and every copy/color check. A wrong constant there
degrades output silently today with no regression net.

## Current state

- `convex/lib/design/checks.ts` — pure deterministic checks. Exports include
  `findBuzzwords`, `allText`, and (confirm by reading the file) `contrastRatio`,
  `paletteChecks`, `typographyChecks`, `svgChecks`, `copyChecks`. Excerpt
  (`checks.ts:26-32`):
  ```ts
  export const findBuzzwords = (text: string): CheckViolation[] => {
  	const lower = text.toLowerCase();
  	return BANNED_BUZZWORDS.filter((word) =>
  		new RegExp(`\\b${word}\\b`, "i").test(lower)
  	).map((word) => `Banned buzzword used: "${word}" — rephrase concretely.`);
  };
  ```
- `vite.config.ts` — has **no** `test` block (excerpt `vite.config.ts:9-20` shows
  only `plugins`). Vitest reads config from `vite.config.ts` or a separate
  `vitest.config.ts`; neither defines `test.environment` today.
- `package.json:9` — `"test": "vitest run"` already exists. `jsdom@^27` is in
  devDependencies but no environment is wired, so any Testing Library test would
  fail today; these `checks.ts` tests need only the default node environment.
- Convention: this repo uses Biome/Ultracite (kebab-case filenames — see AGENTS.md
  line 127 "Use kebab-case, ASCII filenames"). Name test files `*.test.ts`.

## Commands you will need

| Purpose   | Command                        | Expected on success        |
|-----------|--------------------------------|----------------------------|
| Install   | `pnpm install`                 | exit 0                     |
| Tests     | `pnpm test`                    | all pass, N tests reported |
| Typecheck | `pnpm exec tsc --noEmit`       | no NEW errors vs baseline  |
| Lint      | `pnpm exec biome check convex/lib/design/checks.test.ts` | exit 0 |

Baseline note: `pnpm exec tsc --noEmit` currently reports ~12 pre-existing
errors. Do not try to fix those here; only ensure you add none.

## Scope

**In scope** (the only files you may modify/create):
- `vite.config.ts` (add a `test` block) OR create `vitest.config.ts` (choose one; see Step 1)
- `convex/lib/design/checks.test.ts` (create)

**Out of scope** (do NOT touch):
- `convex/lib/design/checks.ts` — you are testing it, not changing it. If a test
  reveals a bug, record it in your report; do not fix it here.
- Any other `convex/` or `src/` file.

## Git workflow

- Branch: `advisor/001-test-baseline`
- Commit message style (match `git log`): short imperative, e.g.
  `Tests: vitest config + design-checks unit tests`. End the body with the
  Co-Authored-By trailer if your environment requires it.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Wire a Vitest config with the node environment

Add a `test` block to `vite.config.ts` (preferred — keeps one config). Read the
current file first, then set `test: { environment: "node", include: ["convex/**/*.test.ts", "src/**/*.test.{ts,tsx}"] }`.
Because `vite.config.ts` is wrapped by `wrapVinxiConfigWithSentry(config, …)`,
add the `test` key inside the `defineConfig({ ... })` object (the `config`
constant), not the Sentry wrapper.

**Verify**: `pnpm test` → exits 0 with "No test files found" (config loads
without error). If it errors about a plugin, STOP.

### Step 2: Write table-driven unit tests for the pure checks

Create `convex/lib/design/checks.test.ts`. First **read `convex/lib/design/checks.ts`
in full** to get the exact exported function names and signatures — the excerpt
above is partial. Write `describe`/`it` blocks covering, at minimum:

- `findBuzzwords`: returns a violation for a string containing a banned word
  (pick one from `BANNED_BUZZWORDS` in `convex/lib/design/skills.ts`), and
  returns `[]` for a clean string.
- `allText`: flattens a nested object/array of strings into one newline-joined
  string (assert a known nested input produces the expected concatenation).
- The contrast/palette check (whatever it is actually named): assert a
  known-good high-contrast pair passes and a known-bad low-contrast pair is
  flagged. Use the file's own exported threshold constant if one exists;
  otherwise assert against a hand-computed WCAG ratio (black on white ≈ 21:1).
- One stat-fabrication case if a `findFabricatedStats`-style export exists: a
  copy string containing `"#1"` or `"90%"` not present in the source context is
  flagged.

Keep tests deterministic — no timers, no network. Import from the relative path
`./checks`.

**Verify**: `pnpm test` → all tests pass; the run reports at least 6 tests.

### Step 3: Confirm lint + no new type errors

**Verify**:
- `pnpm exec biome check convex/lib/design/checks.test.ts` → exit 0
- `pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"` → the count is **≤** the
  pre-existing baseline (run it once before Step 2 to record the baseline).

## Test plan

- New file `convex/lib/design/checks.test.ts` with ≥6 assertions across the
  functions above. This IS the test deliverable.
- No existing test to model after (this is the first). Follow standard Vitest
  `describe`/`it`/`expect` structure.
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] `pnpm test` exits 0 and reports ≥6 passing tests
- [ ] `vite.config.ts` (or new `vitest.config.ts`) defines `test.environment: "node"`
- [ ] `pnpm exec tsc --noEmit` adds no new errors vs baseline
- [ ] `pnpm exec biome check convex/lib/design/checks.test.ts` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `convex/lib/design/checks.ts` does not export the functions named in Current
  state (the file drifted) — report the actual exports and stop.
- `pnpm test` cannot load the config after two fix attempts.
- A test reveals what looks like a real bug in `checks.ts` — record it and stop
  rather than editing the source (that is a separate finding).

## Maintenance notes

- This config is the on-ramp for later plans: 008 (atomic credits) and 011
  (version retention) will add `convex-test`-based tests. When that lands, you
  may need a second Vitest project with the `edge-runtime`/`@edge-runtime/vm`
  environment for Convex function tests — keep the node project for pure units.
- Reviewer should confirm the `test.include` globs don't accidentally pull in
  `_generated` or `node_modules`.
