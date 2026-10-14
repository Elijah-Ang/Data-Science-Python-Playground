# Full curriculum change review

Review branch: `curriculum-coherence-2026-10-13`.
Baseline: `8a72b291a3c47cd6db5e825cfb4902a4df1578bb` (the original `work` checkout and current remote `main` when this handoff was written).
Implementation through: `cf945b1`; the subsequent handoff commit changes documentation only.

The user requested a committed, pushed review candidate before deciding whether to merge or deploy. Neither action is authorized at this stage. Review the entire cumulative branch, including the full current source and unchanged dependencies it calls. Reviewing only the last commit or screenshots misses earlier curriculum, editor and identifier changes.

## Scope and acceptance criteria

- Concise Data Foundations teaching and coherent ML teaching/workflows, followed by presentation corrections across both curricula.
- Preserve the original stateless Follow/Change/Transfer indicators. No added Learn/Refresh depth controls, saved learner drafts, completion records or progress tracking. Follow code has ordinary syntax colouring, without changed-line emphasis.
- Remove the Reference disclosure and its contents. Keep the exercise dataframe visible. Place teaching/code, syntax and argument descriptions first; put the exercise dataframe next, then the task directly below it in the left reading pane. Preserve essential ML supplied-state and evidence explanations.
- Desktop reading and Python panes scroll independently. Small screens stack naturally. Maintain editor, Run, Check, Stop/restart and Reset behaviour.
- Distinguish column names, variables and syntax in prose and tables; keep syntax/argument code at the same size in both themes.
- List valid argument forms and concrete values visibly. Histogram Follow/Change teach bin counts; Transfer teaches explicit edges, including unequal intervals with proportional bar widths. Estimators list supported summaries and a scalar mode function rather than an unsupported scalar `"mode"` string.
- Keep illustrations, explanations, starters, solutions, tasks and grading consistent across all 338 Data and 338 ML activities. Check the nonlinear RBF SVM, tree complexity, KNN and PCA illustrations against the actual methods they claim to teach.

## Source map

| Area | Read in full, including dependencies |
| --- | --- |
| Data curriculum composition | `foundations/curriculum.js`, `content-guidance.js`, `visualise-guidance.js`, `teaching.js`, `clarity.js`, `variety.js`, `refinements.js`, `progression.js`, `practical.js` |
| Data lesson rendering and visuals | `foundations/app.js`, `learning-ui.js`, `parameter-guide.js`, `visuals.js`, `code-style.js`, `foundations.css`, `data-foundations.html` |
| ML authoring and generated curriculum | `ml-learning/authoring.py`, `curriculum_coherence.py`, `model_bridges.py`, the other authoring modules, `manifest.json`, `scripts/build-ml-learning.mjs` |
| ML rendering and runtime | `ml-learning/app.js`, `visuals.js`, `learning.css`, `runtime.py`, `worker.js`, shared worker/editor dependencies |
| Semantic identifiers and shared layout | `code-identifiers.js`, `learning-identifiers.js`, `learning-language.js`, `scripts/build-learning-identifiers.py`, `route-slider.css`, `challenges/experience.js` |
| Build, preview and checks | `package.json`, `scripts/build-web.mjs`, `build-learning-pages.mjs`, `build-review-preview.py`, changed audit scripts/workflows and all changed tests |

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

[The latest presentation report](curriculum-coherence.md) links current screenshots and detailed receipts in `curriculum-evidence/activity-alignment/`: all 676 activities, 1,352 phone/desktop renders, argument and font checks, independent scrolling/editor interactions, numerical checks, production sklearn RBF checks and 33 selected production-browser Python runs. The ML visual audit has 277 captures. Repository checks passed; the final code-size correction received additional font/browser and JavaScript checks.

Earlier evidence directories contain historical revisions. In particular, older reports of 583 Python runs describe the earlier implementation, not a fresh rerun of all those programs after the latest presentation changes. Chromium evidence does not establish WebKit or physical-device behaviour.

Latest contract comparisons verify the final presentation corrections preserved Data exercise program contracts and ML task, setup, starter, grader, output and supplied-state contracts relative to the preceding presentation revision. Do not interpret that narrow comparison as proof that the entire branch made no executable changes: inspect the cumulative diff from the baseline, including earlier ML authoring/runtime work.

## Prompt for the reviewing model

> Review the full current code on `curriculum-coherence-2026-10-13` and every cumulative change since `8a72b291a3c47cd6db5e825cfb4902a4df1578bb`. Read `docs/model-review-handoff.md`, `foundations/AGENTS.md`, the complete relevant source and its dependencies, and inspect the built curricula. Check scientific correctness, concise teaching, lesson/visual/task agreement, valid argument alternatives, semantic identifier accuracy, independent scrolling, mobile layout, accessibility, editor/runtime/grader behaviour, build reproducibility and unrelated regressions. Treat test receipts and screenshots as supporting evidence; independently inspect the assertions and source. Report actionable findings with severity, file/line, reproducible example and recommended correction. Distinguish confirmed defects from untested risks, identify coverage gaps, and say explicitly if there are no findings. Do not modify, merge or deploy anything during this review.
