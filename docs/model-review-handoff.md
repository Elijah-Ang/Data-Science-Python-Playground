# Full curriculum change review

Review branch: `curriculum-coherence-2026-10-13`.
Baseline: `8a72b291a3c47cd6db5e825cfb4902a4df1578bb` (the original `work` checkout and current remote `main` when this handoff was written).
Review the current branch HEAD, including the implementation reviewed at `22dd968` and the subsequent review repairs, Python exercise replacements and scientific visual refinement.

The latest [geometry and presentation refinement](curriculum-visual-polish.md) fixes
the histogram baseline, removes extra illustrative tables from Visualise, simplifies
API descriptions, organizes argument alternatives and replaces cramped table SVGs
with native tables. Review `app/code-menu-position.js` and its real Floating UI
integration alongside the existing model/rendering code. The evidence in
`curriculum-evidence/visual-polish/` includes native Python comparisons, full SVG
bounds, activity layouts and the uploaded Visual Learning Sites skill's declared
acceptance checks. Inspect the evidence scopes and current source independently.

The preceding [clickable-code refinement](curriculum-inline-code-controls.md) replaces
standalone illustration dropdowns with independently editable Python values. Review
the shared menu, argument combinations, fixed observations, native Python comparisons,
conditional controls, keyboard use, plain explanations and matching syntax/argument
typography. Its evidence is in `curriculum-evidence/inline-code-controls/`.

The preceding [code-linked visual corrections](curriculum-code-linked-visuals.md)
fix the count-bar selection overlay missed by the earlier checks, replace passive
highlight controls with real Python changes, and refine thumbnail geometry and
wording. Their evidence is in `curriculum-evidence/code-linked-visuals/`.
Read `tests/test_visual_code_geometry.py` alongside the native model oracles:
correct stored data alone do not prove correct visible geometry.

The preceding [stage-specific visual refinement](curriculum-stage-visual-review.md)
removes repeated introductions from later practice, adds fixed-data table
interactions and narrows new-task teaching to genuine additions. Its evidence is
in `curriculum-evidence/stage-visuals/`. Review `foundations/operation-visuals.js`
and `ml-learning/visual_progression.py` alongside the renderers and curricula.

The user requested a committed, pushed review candidate before deciding whether to merge or deploy. Neither action is authorized at this stage. Review the entire cumulative branch, including the full current source and unchanged dependencies it calls. Reviewing only the last commit or screenshots misses earlier curriculum, editor and identifier changes.

## Scope and acceptance criteria

- Concise Data Foundations teaching and coherent ML teaching/workflows, followed by presentation corrections across both curricula.
- Preserve the original stateless Follow/Change/Transfer indicators. No added Learn/Refresh depth controls, saved learner drafts, completion records or progress tracking. Follow code has ordinary syntax colouring, without changed-line emphasis.
- Remove the Reference disclosure and its contents. Keep the exercise dataframe visible. Place teaching/code, syntax and argument descriptions first; put the exercise dataframe next, then the task directly below it in the left reading pane. Preserve essential ML supplied-state and evidence explanations.
- Desktop reading and Python panes scroll independently. Small screens stack naturally. Maintain editor, Run, Check, Stop/restart and Reset behaviour.
- Distinguish column names, variables and syntax in prose and tables; keep syntax/argument code at the same size in both themes.
- List valid argument forms and concrete values visibly. Histogram Follow/Change teach bin counts; Transfer teaches explicit edges, including unequal intervals with proportional bar widths. Estimators list supported summaries and a scalar mode function rather than an unsupported scalar `"mode"` string.
- Keep illustrations, explanations, starters, solutions, tasks and grading consistent across all 338 Data and 338 ML activities. Check the nonlinear RBF SVM, tree complexity, KNN and PCA illustrations against the actual methods they claim to teach.
- All 338 ML lesson/review/checkpoint activities and 19 independent challenges use Python. The 112 replacements retain stable IDs and reasoning objectives while requiring computed evidence; Change and Transfer must differ meaningfully within each lesson.
- Inspect every conceptual and quantitative illustration, including retrieval, decks and workflow collections. Check fixed observations, scale, uncertainty, model behaviour and controls; illustrations must not introduce future Python APIs without explanation.

## Source map

| Area | Read in full, including dependencies |
| --- | --- |
| Data curriculum composition | `foundations/curriculum.js`, `content-guidance.js`, `visualise-guidance.js`, `teaching.js`, `clarity.js`, `variety.js`, `refinements.js`, `progression.js`, `practical.js` |
| Data lesson rendering and visuals | `foundations/app.js`, `inline-code.js`, `operation-visuals.js`, `learning-ui.js`, `parameter-guide.js`, `visuals.js`, `code-style.js`, `foundations.css`, `data-foundations.html` |
| ML authoring and generated curriculum | `ml-learning/authoring.py`, `code_practice.py`, `curriculum_coherence.py`, `model_bridges.py`, `mastery.py`, the other authoring modules, `manifest.json`, `scripts/build-ml-learning.mjs` |
| ML rendering and runtime | `ml-learning/app.js`, `visuals.js`, `learning.css`, `runtime.py`, `worker.js`, shared worker/editor dependencies |
| Semantic identifiers and shared layout | `code-identifiers.js`, `learning-identifiers.js`, `learning-language.js`, `scripts/build-learning-identifiers.py`, `route-slider.css`, `challenges/experience.js` |
| Build, preview and checks | `package.json`, `scripts/build-web.mjs`, `build-learning-pages.mjs`, `build-review-preview.py`, changed audit scripts/workflows and all changed tests |
| Scientific visual evidence | `scripts/build-teaching-model-fixtures.py`, `scripts/build-visual-argument-fits.py`, `tests/test_inline_code_models.py`, `tests/test_inline_code_controls.mjs`, `tests/test_visual_scientific_scenes.py`, `test_teaching_visual_models.py`, `test_model_family_visuals.py`, `test_visual_context_audit.py`, `test_ml_code_practice.py`, `test_ml_code_practice_browser.py` |

Paths in the table are repository relative; filenames abbreviated within a row share its first directory. Generated `dist/` is ignored: build it to inspect the assembled curricula and actual served assets. Review authoring inputs as well as generated output. Large JSON receipts and screenshots account for much of the diff; they are evidence, not a substitute for source review.

## Reproduction and evidence

Use Node 22 or newer, Python and the repository's documented Python/browser dependencies. From the repository root:

```sh
git diff --name-status 8a72b291a3c47cd6db5e825cfb4902a4df1578bb...HEAD
git diff 8a72b291a3c47cd6db5e825cfb4902a4df1578bb...HEAD -- foundations ml-learning scripts tests
npm ci
npm run check
python3 -m http.server 8000 -d dist
```

`npm run check` builds the site and runs JavaScript, route and app-shell checks. Browser checks are separate; consult each changed browser test's `--help` for its runtime, browser and URL options. `scripts/build-review-preview.py --help` explains how to regenerate the single-file HTML preview from `dist/`. The preview bundles site assets but Python still requires its pinned runtime downloads.

[The current refinement report](curriculum-review-refinement.md) traces the supplied `22dd968` findings to repairs and describes the replacement plan and scientific changes. Current evidence is in `curriculum-evidence/review-refinement/`: the complete 112-activity replacement map, rendered inventory, desktop/mobile contact sheets, all-activity presentation checks, Python grading and numerical-oracle results. Read `validation.json` for precise counts, commands, runtime versions and source digests. The earlier [presentation report](curriculum-coherence.md) and its `activity-alignment/` evidence are historical context.

Earlier evidence directories contain historical revisions. In particular, older reports of 583 Python runs describe the earlier implementation, not a fresh rerun of all those programs after the latest presentation changes. Chromium evidence does not establish WebKit or physical-device behaviour.

All 338 Data exercise program-contract hashes are preserved by this follow-up. ML has intentional executable changes: the 112 replacements and clearer faded workflow starters. Inspect their inputs, outputs and graders rather than assuming the previous presentation-only comparison applies. Review the cumulative diff from the baseline, including earlier ML authoring/runtime work.

## Prompt for the reviewing model

> Review the full current code on `curriculum-coherence-2026-10-13` and every cumulative change since `8a72b291a3c47cd6db5e825cfb4902a4df1578bb`. Read `docs/model-review-handoff.md`, `docs/curriculum-visual-polish.md`, `docs/curriculum-inline-code-controls.md`, `docs/curriculum-code-linked-visuals.md`, `docs/curriculum-review-refinement.md`, `foundations/AGENTS.md`, the complete relevant source and its dependencies, and inspect the built curricula. Independently recheck the supplied `22dd968` review findings. Check the 112 Python replacements for meaningful progression, scientific validity, actual computation, visible supplied state and fair grading. Check every visual family against its data, fitted method, code, labels, scales and interactive states. Inspect actual filled geometry and axis baselines, and verify that controls change executable Python rather than only highlighting a row. Check independent combinations of highlighted code values, conditional fields, menu focus/scroll behaviour and exact code/result agreement. Review the native table examples and actual Floating UI ownership/cleanup. Also check concise teaching, lesson/visual/task agreement, valid argument alternatives, semantic identifiers, independent scrolling, mobile layout, accessibility, editor/runtime behaviour, build reproducibility and unrelated regressions. Treat receipts and screenshots as supporting evidence; independently inspect the assertions and source. Report actionable findings with severity, file/line, reproducible example and recommended correction. Distinguish confirmed defects from untested risks, identify coverage gaps, and say explicitly if there are no findings. Do not modify, merge or deploy anything during this review.
