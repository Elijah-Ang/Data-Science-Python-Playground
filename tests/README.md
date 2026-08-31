# ML route verification

The test suite checks the same generated route metadata and Python cells used by the Machine Learning Playground. It covers all compatible dataset, feature-scenario, model, and fold-count combinations without requiring the browser for the structural checks.

The expected route inventory is **127 routes at 5 folds and 127 routes at 10 folds: 254 routes total**. A change to teaching metadata, Practice state, or generated Python must preserve that inventory unless a genuine compatibility correction is documented.

## Fast local checks

Run these from the repository root:

```bash
node --check ml-app.js
node tests/test_ml_state.mjs
node tests/test_ml_teaching.mjs
python -m py_compile tests/test_ml_routes.py tests/test_ml_browser.py
python tests/test_ml_routes.py
```

`test_ml_state.mjs` protects stale-state invalidation, Reset, complete-walkthrough start points, custom cells, Guided/Practice identity, and Practice state isolation. `test_ml_teaching.mjs` checks deterministic learner copy, route concepts, metric and validation teaching, model-specific explanations, target isolation, and the presence of Practice metadata without requiring fragile DOM text matching.

## Runtime checks

Representative execution exercises one route per model, task, and split family at both fold settings:

```bash
python tests/test_ml_routes.py --runtime representative
```

The full runtime audit executes every generated route at both 5 and 10 folds against the bundled CSV files with a non-interactive Matplotlib backend:

```bash
python tests/test_ml_routes.py --runtime full
```

The runtime checks preserve the modelling contract: correct splitters and fold order, training-only preprocessing, pipeline/tuning behavior, sealed final-test handling, fitted-model diagnostic fidelity, One-R and Naive Bayes semantics, neural-network loss and out-of-fold evidence, target/reference isolation for unsupervised routes, and finite/aligned tables and plots.

## Practice-mode coverage

Practice uses the existing route source of truth; enabling Practice must not generate a different ML methodology or a hidden duplicate model implementation. Tests cover:

- deterministic route/setup identities and session-local state;
- qualitative predictions and decisions, including the explicit `Not sure yet` path;
- safe one-variable experiment definitions that match the editable cell;
- an `evidenceTaskId` later than the mutated task where downstream evidence is required;
- preservation of a small plain-data baseline snapshot and an after snapshot;
- reflection withheld until the configured evidence task has successfully rerun;
- Before/After evidence comparisons for validation, tuning, profiles, and PCA variance selection;
- Reset, route changes, fold changes, upstream staleness, and manual edits clearing incompatible Practice state;
- scaffold-fading tasks validated by semantic postconditions rather than exact answer text;
- Independent Checkpoint completion, hints, and reference-solution reveal state without scores or gamification;
- no pre-final Practice metadata or feedback referring to `X_test`, `y_test`, final-test results, or hidden unsupervised labels.

The semantic validators check meaningful outcomes—such as a fitted estimator family, a valid cluster-label count, a fold table with the expected columns, or a PCA representation with the requested number of components—so valid alternative Python is not rejected merely because it is written differently.

## Unsupervised safety checks

Structural and runtime coverage verifies that:

- the Inspector discovery preview omits the configured target/reference column for unsupervised routes and restores it when a supervised model is selected;
- K-Means, Hierarchical Clustering, and PCA fit and choose their descriptive evidence from input features rather than hidden labels;
- cluster-count and component-count Practice feedback never uses a reference target as an answer key;
- clustering profiles use original feature units and PCA loadings/scores remain aligned with feature and row labels;
- supervised final-test concepts are not forced into clustering or PCA routes.

## Browser/Pyodide smoke test

Start a local server first:

```bash
python3 -m http.server 8000 -d dist
python tests/test_ml_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The browser suite checks real route journeys rather than only source tokens. It covers Guided versus Practice mode, prediction and decision prompts, reference-code reveal, safe experiments waiting for their evidence target, before/after comparisons, Reset recovery, supervised holdout protection, unsupervised target hiding, clustering/PCA interpretation, model-specific diagnostics, and the Browser/Pyodide runtime.

When the browser suite is extended for responsive coverage, repeat it at a narrow/mobile viewport and check that editors, tables, experiment controls, reference reveals, hints, semantic feedback, and Independent Checkpoints remain keyboard usable and readable. Error details should remain expandable without replacing the underlying technical diagnostic.

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

The source and test names may retain historical feature labels to explain why a regression exists. This file intentionally describes the current testing contract—route correctness, learner-facing Practice behavior, leakage safeguards, and release gates—instead of presenting the implementation's phase history as user documentation.
