# Plan 003: Fix stored XSS in the published-site JSON-LD script

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If
> anything in "STOP conditions" occurs, stop and report — do not improvise.
> When done, update this plan's status row in `plans/README.md` unless a
> reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- src/routes/s/$slug.tsx`
> If the file changed, compare the "Current state" excerpt against the live code
> before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

The public published-site route injects a JSON-LD `<script>` using
`dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}`. `JSON.stringify`
does **not** escape `<`, `>`, or the line separators `U+2028`/`U+2029`, so a
`</script>` sequence embedded in an owner-controlled field breaks out of the
script element. The `jsonLd.name` field comes from `data.name` (the company name,
set unsanitized via `companies.update`, `name: v.string()`), and `description`
from the tagline. Result: **stored XSS executing on the `brandkite.co` origin**
for every visitor to that owner's `/s/$slug` page — session/token theft or
phishing under the real brand domain. The in-code comment claiming the data is
"trusted server data" is incorrect; these fields are user-controlled.

## Current state

- `src/routes/s/$slug.tsx:105-124` — the vulnerable sink:
  ```tsx
  const jsonLd = {
  	"@context": "https://schema.org",
  	"@type": "Organization",
  	name: data.name,
  	url: `${SITE_ORIGIN}/s/${slug}`,
  	...(data.tagline ? { description: data.tagline } : {}),
  	...(data.logoUrl ? { logo: data.logoUrl } : {}),
  };

  return (
  	<>
  		{/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from
  		    trusted server data, serialized via JSON.stringify. */}
  		<script
  			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
  			type="application/ld+json"
  		/>
  		<PublishedSite data={data} />
  	</>
  );
  ```
- `data.name`/`data.tagline` originate from `convex/site.ts` `buildSitePayload`
  (`site.ts:134`, `:157-161`) and ultimately from owner input
  (`convex/companies.ts:364` `update` with `name: v.string()` — no sanitization).
- The `<meta>` tags built in `head()` (`$slug.tsx:47-74`) are handled by
  TanStack Router's head API, which escapes attribute values — those are **not**
  in scope here; only the raw `<script>` innerHTML is the sink.

## Commands you will need

| Purpose   | Command                              | Expected on success       |
|-----------|--------------------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`             | no NEW errors vs baseline |
| Lint      | `pnpm exec biome check src/routes/s/$slug.tsx` | exit 0          |
| Tests     | `pnpm test` (if 001 landed)          | all pass                  |

## Scope

**In scope**:
- `src/routes/s/$slug.tsx`
- `src/lib/utils.ts` (only to add a small shared escaper — optional; see Step 1)
- A test file for the escaper if you extract one (create)

**Out of scope**:
- `convex/site.ts` / `convex/companies.ts` — input sanitization at write time is
  a valid defense-in-depth follow-up but changing stored-name rules risks
  breaking existing companies; this plan fixes the *output* encoding, which is
  the correct and sufficient boundary.
- The `<meta>`/`head()` tags — already escaped by the router.
- `PublishedSite` component — it renders via auto-escaped JSX (already safe).

## Git workflow

- Branch: `advisor/003-fix-jsonld-xss`
- Commit style: `Security: escape user fields in published-site JSON-LD script`

## Steps

### Step 1: Add a JSON-for-HTML-script escaper

Create a small pure function that makes a JSON string safe to embed inside a
`<script>` element. Put it in `src/lib/utils.ts` (the repo's shared util module —
confirm it exists and note its export style before adding):
```ts
// Safe to embed inside a <script> element: neutralizes </script> breakout and
// the JS-invalid line separators U+2028/U+2029.
export const escapeJsonForScript = (json: string): string =>
	json
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/ /g, "\\u2028")
		.replace(/ /g, "\\u2029");
```

**Verify**: `pnpm exec biome check src/lib/utils.ts` → exit 0.

### Step 2: Apply it at the sink

In `src/routes/s/$slug.tsx`, import `escapeJsonForScript` and change the sink:
```tsx
dangerouslySetInnerHTML={{ __html: escapeJsonForScript(JSON.stringify(jsonLd)) }}
```
Update the `biome-ignore` comment above it to state the content is now escaped
(not "trusted"), so the next reader isn't misled — e.g.
`// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD, escaped via escapeJsonForScript for <script> embedding.`

**Verify**: `pnpm exec tsc --noEmit` → no new errors. `pnpm exec biome check src/routes/s/$slug.tsx` → exit 0.

### Step 3: Confirm no other unescaped `<script>` innerHTML exists

**Verify**: `grep -rn "dangerouslySetInnerHTML" src/routes src/components/site` — for each hit, confirm it is either this now-fixed JSON-LD or the `src/components/logo.tsx` SVG sink (handled separately in plan 006). Report any *other* script/style innerHTML sink you find rather than fixing it here.

## Test plan

- If plan 001 has landed, add `src/lib/utils.test.ts` (or extend the existing
  test file) asserting `escapeJsonForScript`:
  - input `'{"name":"</script><script>alert(1)</script>"}'` → output contains no
    literal `</script>` (contains `</script`).
  - input with ` ` → output contains `\\u2028`, not the raw separator.
  - a clean JSON string round-trips to valid JSON after unescaping the `\uXXXX`.
- Model structure after the tests written in plan 001.
- Verification: `pnpm test` → all pass, including the new escaper cases.

## Done criteria

- [ ] The JSON-LD `__html` is passed through `escapeJsonForScript`
- [ ] `escapeJsonForScript` exists and is unit-tested (if 001 landed)
- [ ] `grep -n "JSON.stringify(jsonLd)" src/routes/s/$slug.tsx` shows it wrapped by the escaper
- [ ] `pnpm exec tsc --noEmit` adds no new errors; `pnpm exec biome check` on touched files exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The sink in `$slug.tsx` no longer matches the excerpt (drift).
- `src/lib/utils.ts` does not exist or uses a module style incompatible with a
  named export — report and place the helper adjacent to the route instead.
- Step 3 finds another unescaped `<script>`/`<style>` innerHTML fed by
  user/AI content — report it (may need its own plan).

## Maintenance notes

- Any future feature that inlines AI- or user-generated text into a `<script>`
  or `<style>` tag (e.g. injected analytics, inline theme CSS) must reuse
  `escapeJsonForScript` or an equivalent — add a reviewer note.
- Defense-in-depth follow-up (deferred): sanitize/limit the company `name` at
  write time in `companies.update`, and consider a CSP header on the SSR routes.
