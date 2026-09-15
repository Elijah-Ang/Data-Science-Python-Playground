# Learn / Refresh discovery audit

Starting production main SHA: **a3e4c0b1da497b3fbe064a1ff391e0fceb2bb75d**. Feature branch: `codex/learn-refresh-discovery`. PR only; do not merge or deploy automatically.

## Existing experience inspected

Read the landing HTML/CSS, gate controller and scene motion integration, Data Foundations shell/navigation, shared appearance system, notebook navigation guards, asset build/service worker, and existing landing/product/Foundations tests. Captured production landing, Data Playground and Foundations at 1440px and 390px before implementation. The landing intentionally has a fixed beige palette; the hub follows the existing light/dark product shell. Production main includes the completed Foundations refinements from PR #44.

## Routes and files

- `index.html`: one optional robot/speech-bubble link beside the existing title; original tour, artwork and gate are retained.
- `learn.html`, `learn.css`, `learn.js`: new hub. Data links to `data-foundations.html`; Statistics and ML buttons have a dark silhouette overlay with a centered pixel lock and Coming soon, and announce their status without navigating. Top status labels and the duplicate In the works labels are removed. Shared header theme control and normal product links remain available. Primary Back goes to `index.html`.
- `mascot.js`, `mascot.css`: reusable two-layer controller, metadata, speech-bubble styles and responsive landing composition.
- `assets/mascot/robot-*.png`: exact supplied PNGs under role names; no recoloring, stretching, raster edits or unrelated asset renames.
- `scripts/build-web.mjs`, `scripts/check-app-shell.mjs`, `package.json`: build/precache assets and hub, shell checks, JS syntax checks.
- `tests/test_learn_discovery_browser.py`, `.github/workflows/learn-discovery.yml`: Chromium/WebKit discovery, animation, lifecycle, responsive and existing landing regression checks.
- `tests/test_ui_preferences_browser.py`: retain the exact landing link audit with the new optional hub route included.
- This report documents the design and verification.

The existing Data Learn / Refresh shortcut still leads directly to Data Foundations. Foundations deck/lesson navigation, notebook guards and Data/Statistics/ML implementations were not modified. No saved learning, completion, resume or progress tracking was added.

## Supplied asset mapping and alignment

All sources are 1254 × 1254 RGBA. Very faint alpha pixels extend beyond the visible character, so alpha bounds above 128 were inspected as well as the raw alpha bounds. Display normalization uses independent per-image translation and uniform scale; transition transforms operate separately. The viewport is fixed at 150 × 150 desktop and 100 × 110 tablet/phone, with a 5% inner margin for raised symbols and the widest hand. Images use `object-fit: contain`; normal high-resolution downsampling keeps the supplied outlines legible at these small sizes without a color-altering filter.

| Source time, September 15 2026 | Asset / pose | Visible alpha bounds (left, top, right, bottom) | x %, y %, scale |
| --- | --- | --- | --- |
| 04:40:52 PM | robot-wave.png / wave | 182, 89, 1156, 1208 | 3.5, −3.7, 1.098 |
| 04:40:55 PM | robot-book.png / book (idle) | 96, 149, 1203, 1167 | 8, 0, 1 |
| 04:40:58 PM | robot-teach.png / teach (pointing) | 139, 85, 1175, 1209 | 1.8, −2.95, .907 |
| 04:41:02 PM | robot-think.png / think | 209, 125, 1052, 1195 | −.4, −2.54, 1.093 |
| 04:41:05 PM | robot-celebrate.png / celebrate | 136, 117, 1167, 1185 | −2.2, −1.62, 1.073 |
| 04:41:07 PM | robot-code.png / code | 175, 85, 1166, 1191 | 0, 4.23, .989 |

The source filename prefix is `ChatGPT Image Sep 15, 2026 at `; the table gives the final time segment. The coding pose's character feet were aligned independently of the glow below them. The wave pose's crown was aligned independently of its raised code bubble.

## Motion and manual review

Deterministic choreography: book 1.8s → wave 1.2s → book 2.1s → think 1.5s → book 1.9s → teach 1.3s → book 2.2s → code 1.6s → book 2.1s → celebrate 1.1s → repeat. Transitions add 300ms each, giving an approximately 20-second cycle. The book pose occupies most of the dwell time.

Two image layers overlap inside one stationary viewport. Predecoded incoming images fade in while outgoing images fade out over 300ms with `cubic-bezier(.4,0,.2,1)`. Small context-specific translations, rotations and scale changes accompany the blend. Idle breathing runs over 5.2s with a 2px rise, 1px lateral drift, ±.4° rotation and 1.008 maximum scale. Only opacity and transforms animate; one timer sequences dwell periods. Hover or keyboard focus requests the teaching pose and lifts the bubble 2px. A reaction during an existing transition is queued, preventing abrupt cancellation/snapback.

Manually inspected the six normalized poses together, actual intermediate blend frames, desktop/tablet/phone layouts and the hub in both themes. The crown and feet remain aligned, with a brief continuous blend rather than an abrupt PNG swap. The source drawings have deliberately different expressions, accessories and arm shapes, so this is blended pose animation, not synthesized skeletal/in-between artwork. The book-to-teach transition shows continuous overlap; the bubble tail stays attached above the character on desktop and beside it on phones. A recorded browser motion clip and frame strip are included in local evidence.

Reduced motion shows only the static book pose, disables cycling/breathing and removes hover translation. Hidden pages and pagehide clear the timer, settle transitions and pause breathing. Pageshow resumes appropriately. No-JavaScript still exposes the static mascot, hub link and available learning route.

## Responsive and test evidence

Audited 1600, 1280, 834, 390 and 320 CSS-pixel viewports with both stored appearance settings. Landing keeps its established beige theme; hub switches using the shared theme system. Desktop restores the original centered title sizing and scene geometry, with the mascot absolutely positioned beside the title so it cannot displace it. The hub hero has no mascot. Transition translations and rotations are halved, and scale changes reduced to .996, for quicker, calmer blends; phones add a compact roughly 110px optional invitation row rather than an overlay over the title or artwork. The hub stacks its three pathways on phones and reserves room for coming-soon announcements.

Local checks:

- `npm run check`: build, syntax, route audit and app shell passed.
- Discovery browser audit: Chromium and WebKit passed real opacity overlap, fixed viewport, all six poses/assets, queued focus/hover reactions, reduced motion, hidden/pagehide behavior, route navigation, no-JS fallback and five-width theme screenshots.
- The automated overlap assertion holds the actual WAAPI effects at their midpoint, then resumes them; manual review also inspected real-time frames. During the isolated accelerated pose sequence, the already-verified WebGL scene uses its supported context-loss fallback to avoid unrelated software GPU work on CI. Fresh-page navigation and the separate landing regression retain normal artwork animation. Responsive screenshot captures use reduced motion to avoid software-GPU capture timeouts; the earlier manual motion evidence remains separate.
- Existing Chromium navigation/preferences audit passed.
- Existing Chromium landing refresh/fallback audit passed; the same regression runs in both CI browsers.
- Data: 262 task scenarios plus index, schema, alias reset, display and stream regressions passed.
- Statistics: 64 unit tests passed.
- Existing Chromium product browser regression passed public navigation, tour, Data trust/restart/reset/undo and ML prerequisite enforcement.
- Existing CI Data/ML route audits, Foundations full Pyodide solution audits and Statistics numerical/browser audits run on this PR. Refer to the final PR checks for current results.

Evidence directory: `tests/evidence/learn-discovery/` (ignored build artifacts). It includes per-engine reports, screenshots at all five widths, `pose-alignment.png`, `transition-strip.png`, and `motion/*.webm`.

Key screenshots: `chromium-index-1600-light.png`, `chromium-index-390-light.png`, `chromium-learn-1600-light.png`, `chromium-learn-390-light.png`. Dark hub: `chromium-learn-1280-dark.png`.

Local review: http://127.0.0.1:8010/index.html and http://127.0.0.1:8010/learn.html.
