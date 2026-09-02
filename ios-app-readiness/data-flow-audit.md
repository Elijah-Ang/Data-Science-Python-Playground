# Data Flow Audit

## First-party data

| Data | Web build | Native build | Server storage |
|---|---|---|---|
| Bundled datasets | Read from the same release origin | Read from packaged app assets | None |
| Python code and results | Processed locally by Pyodide in a Web Worker | Processed locally by bundled Pyodide in a Web Worker | None |
| CSV/chart exports | Browser download | Temporary app-cache file, then iOS Share Sheet/Files destination chosen by user | None by the app |

The app currently has no accounts, persistent notebook/recent-work storage, backend API, analytics, push notifications, location, camera, microphone, contacts, health, or advertising SDK. Bundled datasets and in-session analysis are not used for targeting and are not intentionally transmitted by the app. Session state may survive foreground/background transitions while iOS keeps the app process alive, but it is not restored after termination.

## Third-party requests

- The web release requests the pinned Pyodide runtime and Python packages from jsDelivr/PyPI-compatible sources when needed. Those hosts receive normal network request metadata.
- The native release packages the required runtime and wheels locally and does not use the live GitHub Pages URL as its shell.
- Dataset source links open external publisher pages only after the user selects a link.
- The GitHub Pages host necessarily serves the public web files and receives ordinary hosting request metadata.

## Privacy declaration implications

- Current product behavior supports a no-account, no-tracking disclosure, subject to verification of GitHub Pages and third-party runtime hosting disclosures for the web surface.
- Capacitor Filesystem privacy-manifest reasons are documented in `ios/App/App/PrivacyInfo.xcprivacy` and must be revalidated with the archived SDK set.
- Adding ads changes this audit. The provider SDK, consent platform, identifiers, diagnostics, retention, regional behavior, and App Store privacy answers must be reviewed before integration.

## Device-validation gaps

Verify temporary export cleanup, Share Sheet behavior, session reset after termination, WebView network traffic, and the final Xcode privacy report on a signed build.
