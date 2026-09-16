# Web advertising readiness — 16 September 2026

## Implemented
- Homepage preserved apart from the requested desktop tour button enlargement and left-side robot placement.
- Follow-along tour has 25 stops, beginning at the homepage garden gate. Prepared exact-interface snapshots show Data, Statistics, ML and Learn / Refresh without loading Python, with slow overview-to-focus movement and enlarged views. See docs/tour-follow-along-plan.md.
- Separate illustrated lesson library removed at user request; interactive curriculum preserved.
- Foundations Credits destination repaired.
- Build emits canonical links and sitemap; robots advertises sitemap.
- Privacy describes GitHub hosting, Cloudflare Access email codes/cookies, private access and current advertising-disabled state.
- Public ads=off/on bypass retired and legacy tab preference cleared. Private hostname and native shell remain ad-free.
- Regression checks cover maintained HTML links/assets, canonical URLs and absence of removed library routes.

## Release gates — do not mark complete without evidence
- Confirm deployment and maintained public entry points on the custom domain.
- Reassess content discoverability without adding a separate reading library or changing homepage aesthetics.
- Inspect Google's fetched/rendered pages in Search Console; submit sitemap if account access is available. Local HTML tests do not prove Google indexing.
- Request a fresh AdSense review after the release is verified. “Low value content” is Google's stated category; these improvements cannot guarantee approval.
- Keep advertising disabled until approval, actual unit configuration and consent tests pass.
- The European message was published on 7 September; publication alone is not an end-to-end consent test.
- Before enabling: verify consent accept/reject/manage/revoke behaviour for applicable regions, required US-state settings, browser storage failures, ad blockers, private and native exclusion, and privacy disclosures matching the live SDK.
- Start with one clearly labelled, non-overlapping desktop placement on substantive content pages. Do not put ads on login, errors, loading/empty workspaces or navigation-only screens. Keep mobile off initially. No timed interrupting popups or automatic refresh.
- Use provider-supported preview/test methods; never click live ads for testing.

## Deliberately not changed
Homepage content/artwork, notebook functionality, datasets, native app deployment, Cloudflare access permissions and billing.
