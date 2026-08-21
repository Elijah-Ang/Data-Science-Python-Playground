# ML route audit

The route generator runs the same JavaScript metadata and code-generation functions used by the playground in a small test-mode VM. It emits every compatible dataset, feature scenario, model, and fold-count combination without starting the browser or Pyodide.

Run the fast structural audit:

```bash
python tests/test_ml_routes.py
```

Run representative Python execution (one route per model/task/split family at both fold settings):

```bash
python tests/test_ml_routes.py --runtime representative
```

Run every generated route in Python at both 5 and 10 folds:

```bash
python tests/test_ml_routes.py --runtime full
```

The structural audit checks Python syntax, route order, splitters, training-only cells, preprocessing shape, imputation, numeric binary handling, tuning defaults, diagnostics, One-R, Naive Bayes compatibility, polynomial pipelines, PCA, clustering, and reset-state wiring. The optional runtime audit executes the cells against the bundled CSV files with a non-interactive Matplotlib backend.
