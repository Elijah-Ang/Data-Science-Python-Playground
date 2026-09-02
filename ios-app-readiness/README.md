# iOS App Readiness

This folder tracks the work required to keep the Data Science Python Playground published on GitHub Pages while also preparing a publishable iPhone/iPad app and a validated Mac delivery path.

## Source of truth

- `iOS_App_Readiness_Tracker.xlsx` — master task register, dashboard, release checklist, and evidence map.
- `ios-app-architecture.md` — recommended packaging and app architecture.
- `web-runtime-inventory.md` — current web capabilities, dependencies, and mobile risks.
- `web-to-app-build-workflow.md` — how one set of HTML/CSS/JavaScript sources feeds GitHub Pages and the native app build.
- `privacy-policy-draft.md` — first privacy-policy draft and publication checklist.
- `../privacy.html` — the public-policy page wired into the GitHub Pages source; its live URL is still to be recorded after deployment.
- `ads-and-consent-plan.md` — advertising, consent, and privacy implementation plan.
- `app-store-listing-draft.md` — first draft of App Store metadata.
- `app-icon-brief.md` — initial app-icon direction and acceptance criteria.
- `data-flow-audit.md` — observed first-party and third-party data flows for web and native builds.
- `release-and-versioning.md` — commit, version, build, and release-traceability rules.
- `third-party-rights-and-licenses.md` — dependency and dataset attribution inventory.
- `app-review-notes-draft.md` — reviewer-facing explanation and test path.
- `export-compliance-notes.md` — encryption/export-compliance working record.

## Status convention

- **Done** means the task's current deliverable has been created and is recorded in the workbook's Evidence / File column.
- **In Progress** means work has started but the acceptance criteria are not complete.
- **Needs User Info** means a decision, legal detail, account detail, or URL is required before continuing.
- **Not Started** means it remains in the backlog.

Drafting a document is deliberately tracked separately from final approval or implementation. The workbook should remain useful as the project evolves: update the task's status, evidence file, owner, and notes rather than deleting completed rows.

## Current recommendation

Keep the existing web version and package the active playground as a local-first iOS app using a native shell around the static HTML/CSS/JavaScript. The app should bundle or reliably cache its Python runtime and expose native file import/export and sharing. Do not make the app depend on the live GitHub Pages URL.

## Implemented foundation — 2026-08-31

- Capacitor 8 iOS project created with bundle identifier `com.elijahang.datascienceplayground`.
- Shared build produces a compact GitHub Pages artifact or a native artifact with a pinned local Pyodide 0.26.4 package closure.
- Native bridge routes chart/CSV exports through the iOS Share Sheet and external web links through the Capacitor Browser.
- PWA manifest, offline shell, local fonts, responsive safe areas, connectivity status, About, Privacy, Help, and Support surfaces added.
- App icon, launch assets, file-sharing keys, and an initial privacy manifest added.
- GitHub Pages and route-audit workflows now build and test the release artifact.

Full Xcode, signing, simulator/device testing, TestFlight, and App Store Connect remain outside this source-only pass. Advertising remains deliberately excluded until the provider, placement, account IDs, and consent behavior are decided.

## Confirmed scope — 2026-08-31

- Packaging: approved Capacitor-style native shell.
- Native device targets: iPhone and iPad.
- Computer target: keep the GitHub Pages/browser version; validate iPad-on-Apple-silicon-Mac and/or Mac Catalyst separately.
- Business model: free and no accounts for the initial scope; in-app purchases are on hold.
- Monetization direction: ads are desired and tracked as a separate workstream.
- Bundle identifier: `com.elijahang.datascienceplayground` is approved for registration.
- Analytics: no analytics or cross-app tracking initially.
- Support contact: Elijah Ang; email `elijahang77@gmail.com`; phone `+65 8822 7539`.
