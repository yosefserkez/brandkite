# Plan 006: Remove (or sanitize) the latent raw-SVG injection sink in `Logo`

> **Executor instructions**: Follow step by step, verifying each step. On any
> "STOP conditions" item, stop and report. Update this plan's row in
> `plans/README.md` when done unless a reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- src/components/logo.tsx`
> If it changed, compare the excerpt to live code; mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`Logo` has an `svg` branch that renders a string via `dangerouslySetInnerHTML`.
It is **not reachable today** — every live caller passes `url` and renders an
`<img>` — but it is a loaded footgun: logos are AI/Replicate-generated SVG, and
the obvious next feature (inline, recolorable logos on the public site) would
wire stored SVG straight into this sink, giving stored XSS on the origin
(`<script>`/`onload` inside the SVG executes). Closing it now, while nothing
depends on it, is cheap; closing it after someone wires it up is a scramble.

## Current state

- `src/components/logo.tsx:1-45` — the component:
  ```tsx
  type LogoProps = { svg: string; url?: never } | { svg?: never; url: string };

  export default function Logo(props: LogoProps) {
  	if (props.svg) {
  		return <InlineSVG svg={props.svg} />;
  	}
  	if (props.url) {
  		return (
  			<div className="logo h-full w-full">
  				<img alt="Logo" className="h-full w-full object-contain" height="100" src={props.url} width="100" />
  			</div>
  		);
  	}
  	return null;
  }

  function InlineSVG(props: { svg: string }) {
  	return (
  		<div
  			className="logo h-full w-full"
  			// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to set the SVG
  			dangerouslySetInnerHTML={{ __html: props.svg }}
  		/>
  	);
  }
  ```
- Confirmed live callers pass `url`, not `svg`:
  `src/components/modules/LogoModule.tsx:95,112`, `BillboardPreview.tsx:35`.
  Re-verify in Step 1.

## Commands you will need

| Purpose   | Command                                    | Expected on success       |
|-----------|--------------------------------------------|---------------------------|
| Grep      | `grep -rn "svg=" src --include="*.tsx" \| grep -i "logo"` | no caller passes a stored SVG string to `Logo` |
| Typecheck | `pnpm exec tsc --noEmit`                   | no NEW errors vs baseline |
| Lint      | `pnpm exec biome check src/components/logo.tsx` | exit 0               |

## Scope

**In scope**:
- `src/components/logo.tsx`

**Out of scope**:
- Adding a sanitizer dependency (DOMPurify) — only if Step 2's investigation
  shows a real current need for inline SVG, which it should not. Default to
  removal.
- Any caller file — none should pass `svg` today.

## Git workflow

- Branch: `advisor/006-remove-svg-sink`
- Commit style: `Security: remove unused raw-SVG innerHTML sink in Logo`

## Steps

### Step 1: Confirm the `svg` branch is unused

Run:
```
grep -rn "<Logo" src --include="*.tsx"
grep -rn "svg={" src --include="*.tsx"
```
For every `<Logo ... />` usage, confirm it passes `url`, not `svg`. If any caller
passes `svg` with a **stored/AI-generated** string, STOP — this is reachable and
needs the sanitize path (Step 3), plus caller review.

### Step 2: Remove the `svg` branch (default path)

If no caller passes `svg`:
- Delete the `InlineSVG` component.
- Change `LogoProps` to `{ url: string }` and remove the `props.svg` branch from
  `Logo`, keeping only the `<img>` rendering.

**Verify**: `pnpm exec tsc --noEmit` → no new errors (nothing referenced the
`svg` variant). `grep -n "dangerouslySetInnerHTML" src/components/logo.tsx` → 0 matches.

### Step 3 (ONLY if Step 1 found a real `svg` caller): sanitize instead of remove

Do not reach this step unless Step 1 forced it. If inline SVG is genuinely
needed:
- Add `dompurify` (+ `@types/dompurify`) via `pnpm add`, and sanitize with the
  SVG profile before injection: `DOMPurify.sanitize(props.svg, { USE_PROFILES: { svg: true, svgFilters: true } })`.
- Add a code comment forbidding raw inline SVG on public routes without
  sanitization.
- Because this adds a dependency and touches callers, report it as expanded
  scope rather than proceeding silently.

## Test plan

- This is a deletion of dead code; the verification is the typecheck + grep
  proving the sink is gone and nothing broke. No new unit test is required for
  removal.
- If Step 3 was taken, add a test asserting `DOMPurify.sanitize` strips a
  `<script>` embedded in an SVG string (requires the jsdom environment — note
  the dependency on plan 001's config, and that jsdom is already installed).

## Done criteria

- [ ] `grep -n "dangerouslySetInnerHTML" src/components/logo.tsx` → 0 (removal path)
      OR the SVG is sanitized before injection (Step 3 path, reported as expanded scope)
- [ ] All `<Logo>` callers still typecheck (`pnpm exec tsc --noEmit` no new errors)
- [ ] `pnpm exec biome check src/components/logo.tsx` exits 0
- [ ] No files outside `src/components/logo.tsx` modified (removal path)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A caller passes a stored/AI SVG string to `Logo` (drift vs "unused") — switch
  to Step 3 and report the caller for review.
- Removing the `svg` variant produces type errors, meaning something does depend
  on it — report and stop.

## Maintenance notes

- If inline, recolorable logos are built later (a plausible roadmap item given
  the design engine), that feature MUST sanitize server-side on upload or
  client-side with DOMPurify — never pass raw stored SVG to innerHTML.
- Reviewer: confirm no new `dangerouslySetInnerHTML` was introduced elsewhere in
  the process of removing this one.
