# ML route and learner-surface audit

The route generator runs the same JavaScript metadata and code-generation functions used by the playground in a small test-mode VM. It emits every compatible dataset, feature scenario, model, and fold-count combination without starting the browser or Pyodide.

The expected route matrix is:

```text
127 compatible routes at 5 folds
127 compatible routes at 10 folds
254 routes in total
```

## Local checks

Run the fast structural checks after changing route generation, teaching metadata, or Practice state:

```bash
node --check ml-app.js
node tests/test_ml_state.mjs
node tests/test_ml_teaching.mjs
python tests/test_ml_routes.py
```

Run representative Python execution — one route per model, task, and split family at both fold settings:

```bash
python tests/test_ml_routes.py --runtime representative
```

Run every generated route in Python at both 5 and 10 folds:

```bash
python tests/test_ml_routes.py --runtime full
```

Run the real browser/Pyodide smoke test locally after starting the static server:

```bash
python3 -m http.server 8000
python tests/test_ml_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The Python audit uses the Pyodide-parity dependencies in [`requirements-pyodide-parity.txt`](requirements-pyodide-parity.txt). CI also runs [`check_pyodide_versions.py`](check_pyodide_versions.py) so local scientific-package versions do not silently diverge from the browser runtime.

## What the checks protect

### Route and methodology contract

The structural and runtime audits cover route order, dataset/scenario/model compatibility, splitters, training-only cells, preprocessing shape, imputation, categorical handling, pipelines, tuning, diagnostics, One-R, Naive Bayes, polynomial routes, PCA, clustering, reset/invalidation, and the 254-route matrix. They preserve the supervised train/final split, classification stratification, Seoul chronology, KFold/StratifiedKFold/TimeSeriesSplit, training-fold-only preprocessing, sealed final test, and final-model behaviour.

### Teaching and Practice contract

The learner-surface checks cover:

- Guided mode as the complete editable walkthrough with nearby questions, concepts, and reading cues.
- Practice mode using the same generated route and methodology while adding prediction-before-run and evidence-linked decision prompts.
- Workflow Reference reveal behaviour and lightweight session identity.
- Safe one-variable experiments with deterministic mutation definitions, a later `evidenceTaskId`, plain-data baseline/after snapshots, and reflection only after the evidence target has successfully rerun.
- Reset, route identity, manual-edit invalidation, stale downstream cells, and the guarantee that experiments do not become automatic tuning.
- Scaffold-fading tasks and independent checkpoints, where present, through semantic postconditions rather than exact source-text matching. Validators focus on transferable operations such as a valid model/pipeline, fold evidence, cluster labels/profile, or a reduced PCA representation; diagnostic plumbing is not required from the learner.

Practice checks must not reference `X_test`, `y_test`, final-test results, or hidden unsupervised reference labels before their normal legal interpretation point. A qualitative prediction may be compared with generated training/CV/diagnostic evidence, but the final test remains sealed until the final step.

### Supervised evidence

Runtime checks verify primary metric direction and numeric summaries, fold means/ranges, train-validation differences, final-test comparison, metric sign handling, model-specific diagnostics, out-of-fold examples, and holdout safety. They also protect the readability of the model-specific teaching without requiring the learner to reproduce implementation-only diagnostic plumbing.

### Unsupervised discovery

Clustering and PCA checks keep the reference target out of fitting, scoring, cluster-count/component selection, and pre-fit Practice feedback. They verify that the Inspector preview hides the reference column during discovery and restores it when switching back to a supervised model.

For K-Means and Hierarchical Clustering, runtime checks cover finite candidate evidence, valid neutral `selected_k`/cut values, cluster-label/profile alignment, reproducible hierarchical sampling, original-unit profiles, and the distinction between silhouette support and an automatic answer. PCA checks cover scaled input alignment, finite explained variance, the chosen variance criterion, feature-labelled loadings, row scores, PC1/PC2 projection values, large-feature redundancy summaries, and post-fit-only reference colouring.

### Learner-surface quality

The final learner-surface audit tracks visible line counts by route and model family, checks that primary cells do not grow with implementation-only plumbing or opaque helper calls, and confirms that the detailed route, scaffolded Practice solution, and clean-workflow reference stay derived from the same route definitions. Browser regressions also cover keyboard-usable Practice controls, responsive/narrow layouts, semantic error categories with expandable tracebacks, warning-versus-failure presentation, and Reset/recovery behaviour.

### Browser/Pyodide surface

The browser test executes real notebook journeys and checks visible outputs, not only source strings. It covers supervised classification, regression, mixed/categorical routes, Seoul time-aware behaviour, model-specific teaching, indexed tables, clustering and PCA target isolation, Practice predictions/decisions, evidence comparisons, experiment invalidation/reset, reference-code reveal, scaffold-fading tasks, independent checkpoints, and final-test sealing. Manual review should exercise desktop and narrow/mobile viewports, reference reveal, independent checkpoint completion, error recovery, warning rendering, and Reset after an experiment.

## Release workflow

Use the following sequence for substantial ML or learner-surface changes:

1. Start from the merged `main` commit on a feature branch.
2. Run the local syntax, state, teaching, structural, representative-runtime, browser/Pyodide, and full 254-route checks appropriate to the change.
3. Open a pull request and wait for the hosted **Structural route audit**, **Representative Python runtime audit**, and **Browser/Pyodide route smoke test** to pass.
4. Merge only after the required pull-request checks are green.
5. Update local `main` and rerun the merged checks.
6. Manually dispatch **Validate ML routes** with `full_runtime=true`; require the hosted 254/254 runtime to succeed.
7. Verify the Pages deployment and confirm that `pages-deployment-sha.txt` matches the merged commit.

The full runtime is intentionally not required on every pull request because it is slower; it is available through `workflow_dispatch` and the scheduled audit. The Pages workflow repeats the normal gates before publishing. Branch protection is not currently configured, so maintainers must enforce the pull-request and hosted-check sequence when merging.

## Maintainer history

This file describes the active route, learner-surface, and release contracts rather than repeating an obsolete phase chronology. Detailed implementation history is intentionally kept in Git commits, pull requests, and the archived Guided Learning implementation.