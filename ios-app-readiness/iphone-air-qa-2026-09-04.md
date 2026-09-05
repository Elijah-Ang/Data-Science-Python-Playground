# iPhone Air QA Evidence — 2026-09-04

## Scope

Physical-device delivery check for the current Data Playground source. The target was the connected iPhone Air only; the connected iPad was not operated.

## Source and device

- Source revision: `3d0b02e9175270413fb0434c568e93213d7ce9b3` (`docs: finalize version one store metadata`)
- Bundle identifier: `com.elijahang.datascienceplayground`
- Device: iPhone Air (`iPhone18,4`), CoreDevice identifier `7FB4764F-30D1-5F04-AC3A-EC1C6B05CBA7`
- Device UDID: `00008150-001A0C260208401C`
- OS: iOS `26.6.1`, build `23G83`
- Connection: paired, wired, tunnel connected
- Developer Mode: enabled; developer disk image services available
- Xcode: `26.6` (build `17F113`), iOS SDK `26.5`

## Automated results

- `npm run ios:sync`: passed. Native-only Pyodide bundle was verified in both `dist/` and the iOS app payload.
- Signed Debug build: passed for the exact iPhone destination with Xcode automatic signing and Personal Team `F3F6BG67MC`.
- Signing identity: existing `Apple Development: elijahang77@gmail.com (95PW82JRK6)`; no certificate replacement was performed.
- Managed development profile: `iOS Team Provisioning Profile: com.elijahang.datascienceplayground`, UUID `44d1fac2-3c4e-4129-ad81-e3a8d88a8c2a`; the profile contains the iPhone UDID.
- Local signature verification: `codesign --verify --deep --strict` passed; bundle identifier and team entitlements match the app.
- Install: passed via `xcrun devicectl device install app`; device reported `Data Playground` version `1.0.0`, build `1` installed.

## Launch status

The first launch was blocked by developer-profile trust. The user confirmed trusting the profile, and the retry at 17:03 SGT on 2026-09-04 successfully launched `com.elijahang.datascienceplayground` on the iPhone Air.

## Separate browser-emulation checks

JavaScript, app-shell, and ML state/teaching/practice checks passed. At a 420 × 874 CSS-pixel emulated viewport, both playgrounds had no horizontal page overflow, visible independently scrollable notebook/output regions, accessible navigation labels, and 44px navigation/toolbar touch targets. These are Chromium layout checks, not physical iPhone interaction results.

## Not yet validated

Physical launch passed; no physical runtime/manual interaction checks are claimed as passed yet. Validate offline bundled datasets/Pyodide execution, navigation, CSV/chart sharing, keyboard and safe-area behaviour, rotation, VoiceOver, and representative Data Playground/Machine Learning journeys.
