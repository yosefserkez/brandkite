# Plan 002: Require auth + credit metering on `processBrandInput`, and fix the dropped `files` argument

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cf2d0df..HEAD -- convex/companies.ts convex/track.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Depends on**: none (independent of 001)
- **Category**: security + bug
- **Planned at**: commit `cf2d0df`, 2026-07-18

## Why this matters

`processBrandInput` is a **public Convex action with no authentication check**.
Any anonymous caller can submit arbitrary `urls`/`rawText` and drive unbounded
paid work: a Firecrawl scrape per URL (routed through the app's Firecrawl key —
also a server-side-fetch primitive) followed by an LLM generation, with no auth,
no rate limit, and no credit deduction. This is a denial-of-wallet vector: every
other client-facing generation path (`regenerateModule`) meters credits, this
one does not. Separately, the endpoint **silently drops the `files` argument**:
the public action accepts `files` but never forwards it to the internal action,
so uploaded PDF/DOCX content is ignored during brand-context generation — a
real, shipping product bug.

## Current state

- `convex/companies.ts:442-460` — the public action, missing auth and dropping `files`:
  ```ts
  export const processBrandInput = action({
  	args: {
  		urls: v.optional(v.array(v.string())),
  		files: v.optional(v.array(v.object({ name: v.string(), text: v.string() }))),
  		rawText: v.optional(v.string()),
  	},
  	handler: async (ctx, args): Promise<BrandContext> =>
  		await ctx.runAction(internal.companies.processBrandInputInternal, {
  			urls: args.urls,
  			rawText: args.rawText,
  			// NOTE: args.files is NOT forwarded here — this is the dropped-files bug.
  		}),
  });
  ```
- `convex/companies.ts:462-536` — `processBrandInputInternal` already accepts a
  `files` arg (`:465-472`) and already has the code to turn files into documents
  (`:517-524`: `for (const file of args.files) { documents.push({ name: file.name, summary: \`File content: ${file.text}\` }); }`). So the internal action is ready; only the forward call is missing `files`.
- The client caller: `src/routes/_authenticated/c/new.tsx:32` does
  `const processBrandInput = useAction(api.companies.processBrandInput);` and
  `:62` `const result = await processBrandInput(input);` — this route is under
  `_authenticated`, so a signed-in user is always present when the app calls it.
  Adding an auth gate does not break the intended flow.
- Auth + metering conventions to match:
  - Auth gate pattern (used everywhere), e.g. `convex/companies.ts:299-302`:
    ```ts
    const userId = await getAuthUserId(ctx);
    if (!userId) {
    	throw new Error("Not authenticated");
    }
    ```
    `getAuthUserId` is already imported at `convex/companies.ts:1`.
  - Credit metering: `convex/track.ts:6-35` exports `checkTrackCredits`
    (`internalAction`) taking `{ companyId, credits, deduct?, throw? }`. **Problem:**
    it is keyed on `companyId`, but `processBrandInput` runs *before any company
    exists* (it produces the brand context used to create one). See Step 2 for
    how to meter without a company.

## Commands you will need

| Purpose   | Command                    | Expected on success       |
|-----------|----------------------------|---------------------------|
| Typecheck | `pnpm exec tsc --noEmit`   | no NEW errors vs baseline |
| Lint      | `pnpm exec biome check convex/companies.ts` | exit 0   |
| Backend   | `npx convex dev --once`    | pushes functions, no errors |

## Scope

**In scope**:
- `convex/companies.ts` (the `processBrandInput` action only)
- `convex/track.ts` (only if you add a user-keyed credit check — see Step 2)

**Out of scope** (do NOT touch):
- `processBrandInputInternal` logic beyond confirming it forwards `files`.
- Firecrawl scraping code in `convex/lib/firecrawl.ts` — the SSRF surface is
  Firecrawl's; this plan closes the *unauthenticated* access, not Firecrawl config.
- `src/routes/_authenticated/c/new.tsx` — the client already passes the full
  input object including `files`; no client change is needed.

## Git workflow

- Branch: `advisor/002-secure-process-brand-input`
- Commit style: `Security: auth + meter processBrandInput; forward dropped files arg`

## Steps

### Step 1: Add an authentication gate and forward `files`

In `processBrandInput` (`convex/companies.ts:442`), add at the top of the handler:
```ts
const userId = await getAuthUserId(ctx);
if (!userId) {
	throw new Error("Not authenticated");
}
```
Then forward `files` in the internal call:
```ts
return await ctx.runAction(internal.companies.processBrandInputInternal, {
	urls: args.urls,
	files: args.files,
	rawText: args.rawText,
});
```

**Verify**: `pnpm exec tsc --noEmit` → no new errors. `grep -n "files: args.files" convex/companies.ts` → one match.

### Step 2: Meter the work per user (denial-of-wallet gate)

`checkTrackCredits` is company-keyed and no company exists yet at this point.
Choose the **lowest-risk** option that fits how Autumn is keyed (Autumn's
`identify` in `convex/autumn.ts:9-28` keys the customer on `userId`, not
company):

- **Preferred**: add a lightweight per-user check that does not require a
  `companyId`. In `convex/track.ts`, add a sibling `internalAction`
  `checkUserCredits({ credits, deduct?, throw? })` that calls
  `autumn.check(ctx, { featureId: "credits", requiredBalance: credits })` and,
  on `deduct`, `autumn.track(ctx, { featureId: "credits", value: credits })` —
  identical to the existing body but without the `companyId` arg (Autumn already
  resolves the customer from the authenticated ctx via `identify`). Call it from
  `processBrandInput` with a small cost (e.g. `credits: 1`, `throw: true`)
  *before* scraping, and `deduct: true` *after* a successful result.
- If wiring a new Autumn check proves complex, the minimum acceptable fallback
  is the auth gate from Step 1 plus a simple per-user rate limit (e.g. reject if
  the same `userId` called within the last N seconds using a small Convex table).
  If you take the fallback, note it in your report so a follow-up can add real
  metering.

Do **not** leave the endpoint authenticated-but-unmetered without saying so.

**Verify**: `npx convex dev --once` → pushes without error. `grep -n "checkUserCredits\|checkTrackCredits\|rateLimit" convex/companies.ts` → at least one match inside `processBrandInput`.

### Step 3: Confirm the internal action already handles files

Read `convex/companies.ts:517-524` and confirm the `for (const file of args.files)`
loop exists. If it does, no change is needed there — Step 1's forward is
sufficient. If it does NOT exist, STOP (drift).

**Verify**: `grep -n "for (const file of args.files)" convex/companies.ts` → one match.

## Test plan

- If plan 001 has landed (vitest config exists), add a small test only if you
  introduce a pure helper (e.g. the rate-limit key builder). The core change
  (auth gate, forwarding) is best verified by the backend push + a manual smoke:
  document in your report that an unauthenticated call now throws.
- No existing test to model after. Metering/auth on Convex actions is verified
  via `convex-test` in a later plan; a full harness is not required here.

## Done criteria

- [ ] `processBrandInput` rejects when `getAuthUserId` returns null
- [ ] `args.files` is forwarded to `processBrandInputInternal` (`grep` confirms)
- [ ] A credit check (or documented rate-limit fallback) gates the paid work
- [ ] `pnpm exec tsc --noEmit` adds no new errors
- [ ] `npx convex dev --once` pushes cleanly
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `processBrandInputInternal` no longer contains the file-handling loop (drift).
- Adding an Autumn user-keyed check requires changing `convex/autumn.ts`'s
  `identify` — that is out of scope; take the rate-limit fallback and report.
- The client route calls `processBrandInput` from an unauthenticated context you
  discover during testing (would mean the gate breaks a real flow) — report and stop.

## Maintenance notes

- Whoever adds team/multi-user onboarding should confirm the metering still keys
  on the acting user, not a not-yet-existing company.
- Reviewer: scrutinize that the credit deduction happens only on *success* (after
  the scrape/generate returns), mirroring the fix in plan 007 for the
  regenerate path — a failed scrape must not charge.
