# ML route verification

The test suite checks the same generated route metadata and Python cells used by the Machine Learning Playground. It covers all compatible dataset, feature-scenario, model, and fold-count combinations without requiring the browser for the structural checks.

The expected route inventory is **127 routes at 5 folds and 127 routes at 10 folds: 254 routes total**. A change to teaching metadata, route state, or generated Python must preserve that inventory unless a genuine compatibility correction is documented.

## Fast local checks

Run these from the repository root:

```bash
node --check ml-app.js
node tests/test_ml_state.mjs
node tests/test_ml_teaching.mjs
node tests/test_ml_practice_final.mjs
python -m py_compile tests/test_ml_routes.py tests/test_ml_browser.py tests/test_ml_workflow_browser.py
python tests/test_ml_routes.py
```

`test_ml_state.mjs` protects stale-state invalidation, Reset, complete-walkthrough start points, and custom cells. `test_ml_teaching.mjs` checks deterministic learner copy, route concepts, metric and validation teaching, model-specific explanations, and target isolation without requiring fragile DOM text matching. The teaching audit also maintains the current Step 8 learner-code simplicity and line-count contract.

The fast checks retain `test_ml_practice_final.mjs` for regression coverage of legacy internal helpers and safe reference code. Its filename does not describe an available learner mode; the interface presents one editable step-by-step workflow.

## Runtime checks

Representative execution exercises one route per model, task, and split family at both fold settings:

```bash
python tests/test_ml_routes.py --runtime representative
```

The full runtime audit executes every generated route at both 5 and 10 folds against the bundled CSV files with a non-interactive Matplotlib backend:

```bash
python tests/test_ml_routes.py --runtime full
```

Python audits use the Pyodide-parity dependencies in `requirements-pyodide-parity.txt`; CI also runs `check_pyodide_versions.py` so the scientific-package versions cannot silently drift away from the browser runtime.

The runtime checks preserve the modelling contract: correct splitters and fold order, training-only preprocessing, pipeline/tuning behavior, sealed final-test handling, fitted-model diagnostic fidelity, One-R and Naive Bayes semantics, neural-network loss and out-of-fold evidence, target/reference isolation for unsupervised routes, and finite/aligned tables and plots.

## Unsupervised safety checks

Structural and runtime coverage verifies that:

- the Inspector discovery preview omits the configured target/reference column for unsupervised routes and restores it when a supervised model is selected;
- K-Means, Hierarchical Clustering, and PCA fit and choose their descriptive evidence from input features rather than hidden labels;
- clustering profiles use original feature units and PCA loadings/scores remain aligned with feature and row labels;
- supervised final-test concepts are not forced into clustering or PCA routes.

## Browser/Pyodide smoke test

Start a local server first:

```bash
python3 -m http.server 8000 -d dist
python tests/test_ml_workflow_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The focused browser suite checks real route journeys rather than only source tokens. It covers the single direct-run interface, the Workflow reference, Run all, Reset recovery, supervised holdout protection, unsupervised target hiding, clustering/PCA interpretation, model-specific optional diagnostics, edited optional-cell invalidation, and the Browser/Pyodide runtime. It also verifies that retired notebook controls are absent. The historical `test_ml_browser.py` filename remains a compatibility entry point for this focused suite.

When the browser suite is extended for responsive coverage, repeat it at a narrow/mobile viewport and check that editors, tables, route controls, reference panels, and output explanations remain keyboard usable and readable. Error details should remain expandable without replacing the underlying technical diagnostic.

## Release workflow

For a normal change:

1. Create a feature branch and keep unrelated working-tree edits out of the commit.
2. Run syntax, state/reset, teaching, structural, representative-runtime, browser, and—when relevant—full local route checks.
3. Open a pull request and require the structural route audit, representative Python runtime audit, and Browser/Pyodide smoke test to pass.
4. Merge only the reviewed feature branch.
5. On merged `main`, rerun the focused checks and manually dispatch `Validate ML routes` with `full_runtime=true`.
6. Require the hosted 254/254 runtime result, then verify the Pages deployment, deployed commit SHA, and asset cache marker.

The full audit is intentionally not required on every pull request when the workflow input is disabled; it remains scheduled and is mandatory for the final post-merge release verification.

## Maintainer history note

The source and test names may retain historical feature labels to explain why a regression exists. This file intentionally describes the current testing contract—route correctness, the current learner interface, leakage safeguards, and release gates—instead of presenting the implementation's phase history as user documentation.

## Product regression matrix — September 2026

- `test_data_runtime.py`: 262 generated task/start-state scenarios; semantic row identity, corrupted-alias reset, authoritative schema, multiple display/figure outputs, bounded stream text. Optional questions use independent original-data views; sequential questions execute their declared prerequisites.
- `test_worker_bridge.mjs`: serialization, queued cancellation, restart, and startup-error recovery.
- `test_product_browser.py --engine chromium|webkit`: rendered public navigation at phone/tablet/desktop widths; Data stale output, namespace reset, real infinite-loop cancellation, drafts, delete/undo, route geometry; ML direct-button and keyboard prerequisite enforcement.
- `test_notebook_session_browser.py`: retired notebook-management controls stay absent while the supported automatic `NotebookSession` save/restore API remains available. It does not pretend a removed export UI exists.
- `test_ui_preferences_browser.py --engine chromium|webkit`: landing tour placement, removed landing controls, duplicate mode-caption removal, always-visible inspector, compact routes, and moon/sun persistence.
- `test_tutorial_browser.py --engine chromium|webkit`: guided-tour chapter order, responsive capture loading, keyboard-safe chapter state, no horizontal overflow, and replay.
- `test_session_browser.py`: edit during execution; 30-cell notebook; stable editor identity; cross-workspace draft restoration.
- `test_offline_browser.py`: a landing-only online visit followed by first offline workspace visits; unrelated origin cache preservation.
- `test_teaching_fixtures.py`: executable tutorial/counts, imbalanced dummy classification and evaluation-mean versus fitted training-mean R².

The focused browser suite runs in both Chromium and WebKit in CI. Scientific route tests disable draft restoration to keep each route fixture independent; the product tests cover persistence separately. Physical-device lifecycle and assistive-technology checks are recorded separately and must never be inferred from these automated passes.

- `test_update_browser.py`: interrupted precache rejection/retry, failed-storage setup/update cancellation, and edited-draft preservation through explicit update. Uses `http://127.0.0.1:8001` and temporarily changes the built service worker; run alone against a disposable `dist` build.
- `test_figure_browser.py`, `test_theme_browser.py`, `test_component_browser.py`: selected-image zoom/share routing, persistent appearance/contrast samples, and responsive component contact sheets.
