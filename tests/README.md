# Machine Learning validation

The ML test harness runs the same route metadata and Python code-generation functions used by the browser. It covers every compatible dataset, feature scenario, model, and fold-count combination without requiring a learner to open the site.

## Fast local checks

Run these from the repository root:

```bash
node --check ml-app.js
node tests/test_ml_state.mjs
node tests/test_ml_teaching.mjs
python -m py_compile tests/test_ml_routes.py tests/test_ml_browser.py
python tests/test_ml_routes.py
```

The structural route audit verifies route order and compatibility, generated Python syntax, split and preprocessing structure, training-only boundaries, diagnostics, reset/invalidation wiring, supervised teaching metadata, unsupervised target isolation, and the Practice-mode metadata contract.

## Runtime checks

Run one representative route for each model, task, and split family at both fold settings:

```bash
python tests/test_ml_routes.py --runtime representative
```

Run every generated route at both 5 and 10 folds:

```bash
python tests/test_ml_routes.py --runtime full
```

The expected route counts are:

```text
127 routes at 5 folds
127 routes at 10 folds
254 total route executions
```

The runtime audit uses the scientific-package versions shipped by Pyodide 0.26.4, a non-interactive Matplotlib backend, and the bundled CSV files. It checks numerical and fitted-evidence fidelity in addition to whether cells execute.

## Browser/Pyodide smoke test

Install the browser test dependencies if needed, start the site, then run the real browser smoke test:

```bash
python -m pip install playwright==1.52.0
python -m playwright install chromium
python3 -m http.server 8000
python tests/test_ml_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The browser journey covers supervised and unsupervised routes, target/reference isolation, indexed tables, model-specific teaching, Practice interactions, safe experiment sequencing, PCA criterion changes, holdout protection, reset recovery, and the final output surfaces. It should be extended with durable semantic selectors when a new learner-facing interaction is added; avoid assertions that depend on fragile prose or exact floating-point formatting.

## What the tests protect

### Learning modes and Practice state

Guided mode must keep the trusted complete route, editable cells, visible Workflow Reference code, and Run Complete. Practice mode must use the same generated Python and ML methodology while adding selected prediction and decision prompts. The mode switch must not mutate the route or corrupt the Python workspace.

Practice state is identified by dataset, scenario, model, and fold count, then by task. Tests protect:

- prediction and decision answers, including the explicit “Not sure yet” path;
- reference-code reveal state;
- safe one-variable experiment definitions;
- the experiment's later evidence target;
- small plain-data before/after snapshots rather than models or output payloads;
- no reflection before the changed task's evidence target is rerun;
- reset, route changes, fold changes, stale upstream cells, and manual edits clearing incompatible state.

The active `5c68ff4` baseline exposes prediction/decision prompts, reference reveal, and evidence-aware experiments. The final completion-pass contract also covers scaffold fading and the Independent Checkpoint; those are separate from the archived legacy Guided Learning runtime. Where a route exposes a scaffolded task, validate the learner's result through semantic postconditions—such as a fitted estimator, a fold-score table, valid cluster labels, or a PCA representation—not exact answer text. The same rule applies to the Independent Checkpoint: check the compact analytical outcome, never arbitrary formatting or a hidden final-test result. Reference reveals are support, not a grade.

### Supervised workflows

The supervised checks preserve the nine-step route:

```text
frame → split → explore training data → prepare → build
→ cross-validate → tune or keep defaults → diagnose → final test
```

They cover feature/target grounding, 80/20 splitting, stratification, chronological Seoul handling, preprocessing inside pipelines and folds, model fitting, CV/tuning evidence, model-specific diagnostics, one-use final-test behavior, metric direction, and final-vs-CV comparison. Step 8 and Practice metadata must not reference `X_test`, `y_test`, `test_prediction`, or `test_result` before the legal final step.

### Clustering and PCA

Unsupervised checks use `X`/prepared inputs only. They do not score K-Means, hierarchical clustering, or PCA against a hidden target and do not add supervised train/test/CV concepts. They verify that:

- the Inspector preview hides the reference target during discovery and restores it when a supervised model is selected;
- K-Means and hierarchical candidate evidence remains finite and aligned with labels, sizes, profiles, and sampled rows;
- cluster-count/cut suggestions are not silently promoted to the final learner decision;
- cluster profiles use original feature units and PCA charts are labelled as projections;
- PCA variance, 90%-criterion selection, loadings, scores, and feature labels remain numerically faithful;
- reference labels can be used only after fitting for clearly descriptive interpretation.

## Practice-learning contract

Practice is a transfer-of-responsibility layer, not a second ML implementation. Its intended progression is:

```text
full example
→ complete one meaningful line
→ edit a small partial cell
→ work from a goal and optional hint
→ complete an independent compact task
```

Scaffolded tasks should focus on transferable operations such as constructing a split, pipeline, estimator, CV call, cluster profile, or PCA representation. They must be validated semantically so valid alternative Python remains acceptable.

The Independent Checkpoint is the final small transfer task. It uses training data for supervised routes and input data for clustering/PCA; it must not reopen the sealed final test or use hidden reference labels as an answer key. A checkpoint validator should verify the requested result and essential safeguards, not award points, XP, badges, or certificates.

## Local release workflow

Use this sequence for substantial ML changes:

```text
feature branch
→ local structural and runtime checks
→ Browser/Pyodide smoke and manual journey review
→ pull request
→ hosted structural, representative-runtime, and browser gates
→ merge to main
→ rerun merged checks
→ manually dispatch Validate ML routes with full_runtime=true
→ require hosted 254/254 success
→ verify GitHub Pages deployment, merged SHA, and cache marker
```

The normal workflow is [`ml-route-audit.yml`](../.github/workflows/ml-route-audit.yml), named **Validate ML routes**. It runs structural checks on pull requests and pushes, representative runtime after structural success, and Browser/Pyodide smoke after the structural gate. The full runtime job runs for the weekly schedule or for a manual dispatch with `full_runtime=true`; it is intentionally not required on every pull request.

Pages deployment is [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml). It repeats the JavaScript, state, teaching, package-version, structural, representative, and browser gates before publishing. Its deployment step writes the exact commit SHA to `pages-deployment-sha.txt`; a release is not complete until that marker matches the merged `main` SHA.

Older phase names may still appear in test comments or commit history because they explain how the suite evolved. They are maintainer history, not learner prerequisites and not a substitute for the current mode, route, and safety contracts above.
