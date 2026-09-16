# Exact-interface follow-along tour

## Experience

25 stops begin with Enter Data Playground on the homepage garden gate, then Data (5), Statistics (5), ML (7), and Learn / Refresh (7). The robot stays on the left. Homepage design and learning persistence are unchanged.

The original HTML/CSS, fonts, form values and real completed outputs are captured at desktop (1440×960) and phone (390×844) sizes. These are DOM snapshots, not screenshots or recreated components. Text remains sharp when enlarged. Snapshots load on demand; visitors never start Python in the tour. The actual workspaces still start Python normally when opened.

Camera timing: 750 ms pull-back, 350 ms overview dwell, 1.05 s scroll where needed, 250 ms pause, 1.45 s zoom-in. Scroll positions carry across snapshots of the same page. Reduced motion skips animation. Enlarge preview preserves original ancestors/styles and scroll context. Routine loading notices are suppressed; genuine failures remain visible.

The garden highlight measures the visible gate sign rather than the larger touch target. Challenges, Workflow and Statistics Study setup briefly highlight their real opening button with a Click/Tap cue, then reveal the captured panel within the same chapter. This uses parent-controlled visibility in script-free snapshots; no runtime is started.

Preview changes are double-buffered: the outgoing frame remains painted while the incoming script-free frame loads, decodes images and resolves fonts. Same-page scroll context is restored before a 220 ms blend. Opening panels are hidden before that blend to avoid briefly exposing the answer before the button cue. Cancelled transitions remove their staged frame; the current preview remains intact. Reduced motion skips the blend.

## Capture and refresh

After changing the actual interface or example results:

1. Run npm run build:web.
2. Run node scripts/serve-tour-capture.mjs.
3. Open http://127.0.0.1:8004/tutorial.html and click Capture desktop and mobile tour. Wait for Complete. This local authoring step runs the real example routes once for each profile and saves 50 HTML snapshots to assets/tour-snapshots.
4. Stop the capture server. Rebuild and run node tests/test_tour_content.mjs. Inspect changed visuals before publishing.

The maintainer capture helper retains original page selectors and preparation actions in scripts/tour-capture-pages.js. Keep its locations aligned with tour-pages.js. No capture server or helper ships in the public build. The server binds only to loopback, validates same-origin writes and restricts output filenames.

Capture strips scripts and event handlers, freezes selected/input values and canvas output, and makes controls inert. Published frames use sandbox=allow-same-origin WITHOUT allow-scripts. They cannot initialise Python, run ad scripts, restore drafts or submit forms. Snapshots use noindex and original relative assets. No runtime fallback silently reintroduces Python loading.

Examples are real results: Statistics compares Adelie and Chinstrap penguin mass (−26.9239 g; 95% CI −145.665 to 91.8172 g). ML uses five continuous measures with Logistic Regression. Lessons show the actual I01 exercise and checked answer. Statistics and ML lesson pathways remain Coming soon.

## Verification

Static checks cover all 25 mappings and 50 script-free snapshots, garden entry, camera timing, draft isolation and robot position. Browser regression covers desktop/mobile targets, spotlight containment, enlargement and replay. Publication remains subject to repository review requirements. This does not imply AdSense approval.

16 September validation: all 25 desktop and 25 phone steps reached ready state in Chrome using the script-free snapshots. Garden entry and enlarged lesson view were visually inspected. Build, JavaScript checks and app-shell checks passed. The updated Chromium/WebKit CI script was not run locally.

Follow-up verification: desktop and phone gate boxes fit the sign. Challenges, Study setup and Workflow each showed the Click/Tap button cue and then their panel; all six sequences reached ready state without a routine loading notice.
