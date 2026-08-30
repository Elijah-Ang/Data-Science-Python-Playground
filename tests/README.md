# ML route audit

The route generator runs the same JavaScript metadata and code-generation functions used by the playground in a small test-mode VM. It emits every compatible dataset, feature scenario, model, and fold-count combination without starting the browser or Pyodide.

Run the fast structural audit:

```bash
python tests/test_ml_routes.py
node tests/test_ml_state.mjs
node tests/test_ml_teaching.mjs
node tests/test_ml_practice_final.mjs
```

Run representative Python execution (one route per model/task/split family at both fold settings):

```bash
python tests/test_ml_routes.py --runtime representative
```

Run every generated route in Python at both 5 and 10 folds:

```bash
python tests/test_ml_routes.py --runtime full
```

Run the browser/Pyodide smoke test locally after starting `python3 -m http.server 8000`:

```bash
python tests/test_ml_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The structural audit checks Python syntax, route order, splitters, training-only cells, preprocessing shape, direct `df` use for already-clean datasets, imputation, numeric binary handling, tuning defaults, diagnostics, One-R, Naive Bayes compatibility, polynomial pipelines, PCA, clustering, reset-state wiring, supervised evidence teaching, shared concepts, model-specific interpretations, neural-network routes, the precision checkpoint’s typed Gaussian density evidence, density-above-one fixture, precise QDA wording, and the generated Step 8 simplicity/line-count contract. It also checks Phase 3 clustering/PCA target isolation and variance/loading terminology. `test_ml_teaching.mjs` verifies deterministic metric/CV/final-test calculations, Seoul time-series wording and route-specific MLP stopping, feature/target/X/y grounding, split concepts, preprocessing plans, Pipeline/fit/predict, fold mechanics, hyperparameter/tuning explanations, model interpretation coverage, neural-network teaching, and Gaussian Naive Bayes copy precision.

`test_ml_practice_final.mjs` covers deterministic Practice metadata and route identity, scaffold-fading exercise types, semantic-validator registration, independent-checkpoint metadata, clean-workflow references, safe-experiment evidence targets, and holdout/target-safe reference code. The browser smoke test covers Practice prediction/decision gates, reference-code reveal, safe experiment comparisons, semantic scaffold completion, independent checkpoint exposure, keyboard-usable controls, mobile output attachment, warning/error disclosures, target-isolation switches, reset/invalidation, and the representative Guided journeys. The optional runtime audit executes the cells against the bundled CSV files with a non-interactive Matplotlib backend and exercises fake-frame and real-pandas reset regressions, fitted-model interpretation fidelity, KNN self-neighbour protection, class-label alignment, out-of-fold prediction stories, model-faithful SVM/LDA/QDA boundary fixtures, Gaussian Naive Bayes density/probability semantics, neural-network loss/architecture/same-OOF/target-scaling/time-aware fidelity, and target-free clustering/PCA behavior.

The runtime audit uses the exact scientific-package versions shipped by Pyodide 0.26.4 in CI. The small state harness checks that editing or deleting a completed guided cell stales and clears downstream cells, that the complete walkthrough starts at the earliest stale step, and that custom cells remain independent.

The normal GitHub Actions run executes the representative runtime set and a browser smoke test covering supervised evidence interpretation, clustering/PCA target isolation, model-specific diagnostics, neural-network routes, Practice predictions/decisions, scaffold validators, safe experiment comparisons, independent checkpoints, invalidation, complete routes, fitted PCA, warning/error presentation, and browser reset recovery. The Pages deployment workflow runs those gates again and deploys only after they pass. The full 254-route runtime audit is available through `workflow_dispatch` and the scheduled audit; it is the mandatory exhaustive release check for substantial ML workflow changes.
