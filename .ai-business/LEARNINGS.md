# LEARNINGS

_Validated learnings only — no opinions. Each entry: evidence → implication._

## 2026-07-18 — generation quality
- **`x-ai/grok-4-fast` was DEPRECATED** and returning hard errors from xAI — all 7 text modules were silently breaking. Fixed by upgrading to `x-ai/grok-4.3`. Lesson: pin/monitor model deprecations; a single stale model id broke the whole product's core value.
- **The logo prompt ignored the brand entirely** (same generic black abstract every time) — the model wasn't the main problem, the prompt was. Making it compose from the brand (name, industry, audience, voice, live palette) + Recraft V4.1 produced a genuinely professional, on-palette mark. Verified with a real render.
- Composability works: modules reading current published siblings (logo←colors, story←tagline+mission) makes output internally consistent without any auto-regeneration.

## 2026-07-18 — corrected read of existing usage
- **The 13 signups are friends; the one Pro-Annual ($300/yr) "purchase" is the owner testing** (owner confirmed 2026-07-18). So: **willingness-to-pay from real strangers is NOT validated**, and there is **no external traction evidence**. Treat the product as effectively pre-launch/friends-and-family.
- What the friendly usage does show: the generation flow works end-to-end and ~7 accounts produced brand modules without hand-holding (weak positive on usability, not on demand).
- **The payment path does not collect money** (invoice-mode grants access before payment). Confirmed via the owner's own test: Pro access granted on an unpaid `open` invoice. Fix approved 2026-07-18 (card-required checkout). No revenue to recover (it's the owner).
- **Signup is a hard magic-link wall at the first action** (no OAuth/demo). Not yet quantified; PostHog now live to measure it. Owner approved adding Google OAuth.
