# ML route audit

The route generator runs the same JavaScript metadata and code-generation functions used by the playground in a small test-mode VM. It emits every compatible dataset, feature scenario, model, and fold-count combination without starting the browser or Pyodide.

Run the fast structural audit:

```bash
python tests/test_ml_routes.py
node tests/test_ml_state.mjs
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

The structural audit checks Python syntax, route order, splitters, training-only cells, preprocessing shape, direct `df` use for already-clean datasets, imputation, numeric binary handling, tuning defaults, diagnostics, One-R, Naive Bayes compatibility, polynomial pipelines, PCA, clustering, and reset-state wiring. The optional runtime audit executes the cells against the bundled CSV files with a non-interactive Matplotlib backend and exercises both fake-frame and real-pandas reset regressions.

The runtime audit uses the exact scientific-package versions shipped by Pyodide 0.26.4 in CI. The small state harness checks that editing or deleting a completed guided cell stales and clears downstream cells, that the complete walkthrough starts at the earliest stale step, and that custom cells remain independent.

The normal GitHub Actions run executes the representative runtime set and a browser smoke test covering invalidation, a complete nine-step supervised route, fitted PCA, and browser reset recovery. The Pages deployment workflow runs that browser gate again and deploys only after it passes. The full 254-route runtime audit is available through `workflow_dispatch` and the scheduled audit; it should be checked before merging substantial ML workflow changes.
