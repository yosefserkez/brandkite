# RISKS

| Risk | Severity | Mitigation | Status |
|---|---|---|---|
| One-shot job-to-be-done → churn kills any subscription model | High | Agency ICP (repeat use) + one-time purchase bridge; validate in Phase 2 | Open (strategic) |
| Zero distribution; product may never be seen | High | Phase 1 channel tests before building more product | Open |
| Willingness-to-pay unvalidated | High | Autumn end-to-end test now; first-10-customers push in Phase 2 | Open |
| R2 signed URLs issued without ownership check (convex/r2.ts) | Med (low today, 0 users) | Fix in Batch 1 | Doing |
| Zero tests/CI → regressions ship silently | Med | CI in Batch 1; tests on revenue-critical flows thereafter | Doing |
| AI provider cost/quality drift (OpenRouter Grok/Gemini, Replicate, OpenAI) | Med | Per-generation cost + failure metrics in PostHog; model routing already cheap | Open |
| AGPL may deter some commercial adopters / enables self-hosting competitors | Low-Med | Hosted convenience + gallery network effects are the moat; revisit licensing only with owner + legal | Watch |
| Key-person/platform deps (Convex, Autumn, Vercel free tiers) | Low | Acceptable at this scale; runbook documents everything | Accepted |
| Magic-link-only auth adds friction (no OAuth) | Med | Measure signup drop-off first; add Google OAuth if data says so | Watch |
| Prod-as-sandbox authorization becomes dangerous once real users arrive | Med | Explicit expiry clause in AUTHORIZATION.md + DECISIONS.md | Armed |
