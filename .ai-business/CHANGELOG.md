# CHANGELOG

_Business-relevant changes only; newest first._

## 2026-07-18 (batch 4 — generation quality)
- Fixed critical breakage: all text modules were on deprecated `grok-4-fast` (erroring) → upgraded to `grok-4.3`.
- Logo generation rebuilt: brand-aware prompt composing name/industry/audience/voice + the live color palette, on Recraft V4.1 SVG (was a generic black abstract on Recraft 20B). Verified real output.
- Story module rewritten: tight/useful (~90-160 words, buzzwords banned) and composes from current tagline + mission.
- Locked the composability model in VISION.md (compose from current blocks; NO auto-regeneration).

## 2026-07-18
- Created `.ai-business/` control system and `/grow-to-1m-arr` skill; established strategy v1, metrics framework, 90-day roadmap.
- Restored Convex access; confirmed deploy pipeline healthy; established $0/0-user baseline from prod data.
- PostHog personal project (518164, org "Brandkite") connected as the analytics stack.
