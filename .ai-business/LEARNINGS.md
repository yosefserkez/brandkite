# LEARNINGS

_Validated learnings only — no opinions. Each entry: evidence → implication._

## 2026-07-18 — evidence from existing (pre-instrumentation) usage
- **13 people signed up organically and ~7 generated brand modules** with zero marketing → the core product creates enough pull for real strangers to try it. Evidence: Autumn customer list + credit usage.
- **At least one user tried to buy Pro Annual ($300/yr).** Willingness to pay at the top tier exists, unprompted. Evidence: `kn76nae4…` open $300 invoice + Pro access used.
- **The payment path does not collect money** (invoice-mode grants access before payment). Evidence: open/draft unpaid invoices, `@invoices.useautumn.com` email. → Any conversion optimization is worthless until collection is fixed. See FINDINGS-2026-07-18.md.
- **Signup is a hard magic-link wall at the first action** (no OAuth/demo). Implication (not yet quantified): likely large top-of-funnel loss; PostHog will now measure it.
