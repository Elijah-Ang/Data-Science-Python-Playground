# Exact-interface follow-along tour

## Current requirements — 16 September 2026

- Use the actual interface, not similarly styled recreations or AI-generated UI text.
- Show the whole workspace before focusing on a control. Keep that page mounted across its stops.
- Move slowly enough to follow: 1 s pull-back, 650 ms overview dwell, 1.4 s internal scroll where needed, 650 ms pause, then 1.9 s zoom-in.
- Keep all 24 stops: Data (5), Statistics (5), ML (7), Learn / Refresh (7).
- Move the homepage robot to the left on desktop; retain the existing left-side robot / speech-bubble arrangement on mobile. Do not change the rest of the homepage.
- Keep the separate illustrated lesson library removed. Do not introduce saved learning.

## Rendering and accuracy

`tour-pages.js` maps steps to selectors in the real pages. `tutorial.js` embeds one same-origin application document at a time, using the original HTML, CSS, fonts, assets and renderers. No alternative component templates or screenshot rectangles are used. Existing historical raster captures remain in Git, but are not shipped.

Data, Statistics and ML run their real example Python in the disposable frame. This needs the normal runtime download on a first visit; loading and failure states are explicit. Only one active page/runtime is retained. Navigating to another workspace unloads the previous one. Tour frames cannot restore or save notebook drafts, advertise or show leave-confirmation prompts. Lesson code is held only in the demonstration editor.

The camera measures actual element geometry and clips highlights to the real scrolling containers. Opening Workflow/Challenges and scrolling within the guide happen visibly at the page overview before zooming in. Ordinary document scroll events cannot advance the tour: intentional wheel/touch gestures, buttons and arrow keys control the steps. This prevents a child page focusing an editor from unexpectedly changing the chapter. Reduced-motion users get immediate transitions.

Enlarge preview uses an exact DOM snapshot with original ancestor structure and styles, preserving field values and scroll positions. Scripts are removed; controls are inert while the document and reference-window contents remain scrollable. It starts no additional runtime. Show whole page pulls the camera back without changing the step.

## Verification

Static checks cover 24 page/selector mappings, real-page retention, motion durations, draft isolation, advertising exclusion and robot placement. The browser regression script covers all steps at desktop/mobile widths, reduced motion, viewport containment and enlargement. Manual visual checks verify actual source layouts and runtime results; never present test coverage as proof of unexecuted browser tests.

The Statistics example is the real penguin Welch comparison (mean difference −26.9239 g, 95% CI −145.665 to 91.8172 g). ML uses five continuous measures and Logistic Regression. Learn demonstrates the actual I01 exercise and Check answer. Statistics and ML lesson pathways remain marked Coming soon.

Publication remains subject to the existing PR review gate and deployment verification. Nothing here implies AdSense approval.

Local Chrome checks on 16 September: all 24 desktop stops and all 24 phone stops reached the correct rendered targets. Executed Statistics, ML and I01 examples completed; enlarged Workflow/final-test views were inspected. Phone fixes include measuring past display:contents wrappers, deterministic scroll timing, and transform-only camera scaling to preserve iframe scroll geometry. Chromium/WebKit CI regression is updated but was not executed locally.
