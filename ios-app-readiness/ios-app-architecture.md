# iOS/iPadOS/Mac Architecture

## Implemented route

The project now uses a Capacitor 8 native shell around the existing static web app for the iPhone and iPad targets. The project is organised around these surfaces:

- `index.html` — pixel-art product welcome landing page
- `tutorial.html` — product walkthrough and quick-start tutorial
- `playground.html` — data analysis playground
- `ml.html` — machine-learning playground
- `about.html`, `help.html`, and `privacy.html` — app information and support
- `app/app-platform.js` — native/web bridge boundary
- `scripts/build-web.mjs` — deterministic release-asset builder
- `ios/` — generated Xcode project and native configuration

Keep the web build as a separate browser experience. The iOS target should package the final web assets locally rather than opening the live GitHub Pages URL.

## One source, multiple delivery surfaces

The existing HTML, CSS, JavaScript, and data files remain the source of truth. The same source should feed two release paths:

1. GitHub Pages continues to publish the browser version for computers and general web access.
2. A native build step copies/synchronises the same tested web assets into the Capacitor shell for iPhone and iPad.

During development, an edit to the site scripts can be synchronised and tested in the native target. After an App Store build is published, later script edits do not automatically change the installed app: the native bundle must be rebuilt, signed, tested, and submitted as an app update. This preserves the current site while keeping the submitted binary self-contained and reviewable.

For Mac users, the browser version remains the immediate computer experience. After the iPhone/iPad shell works, validate whether the best native Mac surface is the iPad app on Apple-silicon Macs or a Mac Catalyst target. These are delivery options to test, not an assumption that an iOS shell automatically becomes a full Mac app.

## Why this fits the current project

- The current product already has substantial interaction: editable Python cells, browser-side execution, data inspection, visualisation, modelling, CSV upload, chart/CSV export, and guided learning.
- The project has no sign-in, subscription, or server account dependency in the active routes.
- The owner has approved a free/no-account initial scope, with in-app purchases on hold and advertising tracked separately.
- The existing release checks already cover JavaScript syntax, state behaviour, teaching metadata, route generation, and Pyodide-parity runtime logic.
- A full SwiftUI rewrite would create a second implementation of the Python/editor/data experience and is not the sensible first release path.

## Native bridge responsibilities

The first native layer provides:

1. App bundle identity, signing, icon, launch screen, status-bar and safe-area configuration.
2. Native Files import for CSV files.
3. Native Files/share-sheet export for generated CSVs and charts.
4. External-link handling for dataset source links.
5. A controlled connectivity surface and the existing runtime error reporting.
6. Session-only state: work remains while the WebView process stays alive, but no notebook or recent-work history is persisted after termination.

The owner approved the fresh-canvas model on 2026-08-31. Advertising remains a separate future layer and is not present in the native project.

## Web-layer work completed before device testing

- The native artifact packages Pyodide, NumPy, pandas, matplotlib, SciPy, scikit-learn, Micropip, Seaborn, and their locked dependencies locally.
- The web build keeps the smaller on-demand CDN path while using the same application source.
- Browser-level WebAssembly, Web Worker, canvas, import, and export journeys are covered by the existing smoke and route suites.
- About, Privacy, Help, Support, local fonts, safe-area padding, and native sharing are implemented.
- Preserve the holdout/test-set safeguards and run the existing route checks against the release commit.

Physical iOS WebKit, hardware keyboard, rotation, memory pressure, Files picker, Share Sheet, and cold-install/offline behavior still require full Xcode and devices.

## Confirmed product boundary

The initial scope is free and no-account. In-app purchases are on hold. Ads are desired, but they are a separate implementation milestone because an ad SDK introduces additional third-party data flows, consent work, privacy disclosures, and App Review checks. Analytics and cross-app tracking are not part of the initial scope.

## Acceptance criteria

- A clean install launches to a usable screen without opening Safari.
- The app can run the core data and ML journeys on a physical iPhone and iPad.
- The GitHub Pages version remains usable on computers, and the chosen Mac delivery path is explicitly tested before being advertised as a native Mac experience.
- The app remains usable after network loss once the runtime has been installed or bundled.
- CSV import and chart/CSV export use iOS-native destinations where appropriate.
- A tested source-to-app synchronisation step makes web changes traceable to the native build commit.
- No placeholder URLs, placeholder content, or review-only shortcuts remain in the submitted build.
