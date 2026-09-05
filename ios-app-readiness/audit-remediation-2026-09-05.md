# Audit remediation verification — 5 September 2026

The complete finding-by-finding record is [the remediation report](../outputs/2026-09-05-audit-remediation.md). All 40 findings have implementation responses; the original release gate remains open for device and accessibility evidence.

| Surface | Completed evidence | Required before release |
|---|---|---|
| Web | Chromium and WebKit product journeys, full Chromium scientific suite, offline/update failure injection, drafts/export, chart routing and sampled appearance | Full keyboard/focus and 200% zoom traversal across all states |
| iOS simulator | Bundled runtime synchronization, unsigned simulator build, landing/status-bar observation | Interactive device matrix below |
| Physical iPhone/iPad | No new physical-device pass claimed | Rotation, split view, keyboard, VoiceOver, share completion/cancel, suspension/resume, forced termination, fresh-install airplane mode, low-memory and long-session worker/WASM stress |
| Release pipeline | Local builds and content manifests; CI configured | Clean remote CI on committed source, signing, TestFlight and production deployment |

For every manual pass record the device, OS, orientation, content/build ID, steps, expected/actual result and screenshot or recording. Do not infer native lifecycle or accessibility results from desktop WebKit. Simulator interaction automation returned `noWindowsAvailable`; its landing screenshot is only a landing/chrome check.
