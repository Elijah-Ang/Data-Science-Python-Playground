# Data Science Python Playground

A local-first Python playground for inspecting, wrangling, visualising, and modelling complete real-world datasets. One set of web sources feeds both GitHub Pages and a Capacitor iPhone/iPad shell.

The root route (`index.html`) is the lightweight pixel-art welcome landing page. The former walkthrough now lives explicitly at [`tutorial.html`](tutorial.html), so the tutorial and the working playground remain separate surfaces.

## Start locally

Install the pinned JavaScript dependencies, build the web release, and serve it locally:

```bash
npm ci
npm run build:web
npm run dev
```

Then open <http://127.0.0.1:8000/>. The GitHub Pages build loads Pyodide on demand; analysis stays in the current browser session.

## iPhone and iPad build

The generated Capacitor project lives in `ios/`. It packages the tested site, a pinned local Pyodide runtime, scientific Python wheels, local fonts, native sharing, and Files integration. It never opens the live GitHub Pages site as its application shell.

```bash
npm run ios:sync
npm run ios:open
```

The native build requires Node 22+, full Xcode 26+, an Apple signing team, and an iPhone/iPad simulator or device. This Mac currently has Command Line Tools but not the full Xcode/iOS SDK, so synchronisation is verified while compilation, signing, and physical-device testing remain prerequisites.

## Machine Learning Playground

Open [`ml.html`](ml.html) for an editable, browser-only ML notebook. Each route uses the same generated Python workflow and methodology whether it is being followed in Guided mode or worked through in Practice mode.

### Learning modes

**Guided** is the default walkthrough. It keeps the complete route code visible and editable, shows the question and reading cue beside the relevant evidence, and keeps **Run Complete** and the exact Workflow Reference available. It is intended for understanding and following a complete analysis.

**Practice** uses the same dataset, scenario, model, Python, and runtime, but asks the learner to think before the evidence appears. Selected steps ask for a qualitative prediction or a decision before running; `Not sure yet` is always a valid way to continue. Feedback compares the committed expectation with the evidence produced by the route.

Practice also supports safe, reversible one-variable experiments. An experiment changes a real value in the editable route, then waits for the downstream evidence that can actually show its effect. The Practice panel preserves a small baseline snapshot and shows a compact **Before / After** comparison after that evidence is rerun. It does not turn experiments into automatic tuning or open the final test.

Where a Practice task uses scaffold fading, support can move from a full example to completing one meaningful line, a partial starter, a focused hint, and a small retrieval task. After a route, an **Independent Checkpoint** asks the learner to rebuild a compact piece of the workflow using the variables already available in that route. These activities are lightweight and evidence-focused: there are no XP scores, badges, or certificates.

The exact Workflow Reference remains available in Practice, but its reference solution is collapsed behind an explicit reveal. Revealing it is a normal support choice, not a failure. Guided mode does not hide code or require Practice interactions.

### Route families

#### Supervised learning

Supervised routes use selected features `X` to predict a known target `y`:

```text
frame → split → explore training data → prepare → build
→ cross-validation → tune or keep defaults → diagnose → final test
```

Classification uses a stratified 80/20 holdout when appropriate; ordinary regression uses a random 80/20 holdout. Seoul Bike uses a chronological holdout and forward-only `TimeSeriesSplit`. Preparation stays inside the pipeline and cross-validation, tuning uses training data only, and the one-use final test remains sealed until the final step.

Practice predictions, decisions, experiments, and the Independent Checkpoint follow those same boundaries. They may use route metadata, training evidence, validation evidence, and diagnostics already generated, but never pre-open `X_test`, `y_test`, or final-test results.

#### Clustering and PCA

Clustering and PCA are separate unsupervised discovery routes. They use the selected input features without fitting to a target and therefore do not use a supervised train/test split, cross-validation, accuracy, macro F1, or a final-test comparison.

K-Means and Hierarchical Clustering discover groups. Candidate `k` values, inertia, silhouette, dendrogram structure, cluster sizes, profiles, and a PCA map are descriptive evidence—not proof that one cluster count is objectively correct. Cluster labels such as `0`, `1`, and `2` are arbitrary names.

PCA creates new weighted axes and row coordinates. The route teaches scaling, explained variance, cumulative variance, loadings, component scores, and the difference between a selected reduced representation and a two-dimensional teaching projection.

### Target and reference-label isolation

During unsupervised discovery, the Inspector preview and learner-facing evidence hide the dataset's target or reference label. K-Means, Hierarchical Clustering, and PCA fit from `X` (or the prepared feature matrix) only; the hidden reference column is not used to fit, choose, or score the discovery model.

For descriptive interpretation, a reference label may be added after fitting—for example, to colour a PCA projection by a known class or numeric reference. It is labelled as interpretation-only and does not change the fitted components or clusters. Switching between supervised and unsupervised models updates the preview without reloading the wrong dataset.

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality
- Breast Cancer Wisconsin (Diagnostic)
- Palmer Penguins (333-row complete-case teaching copy)
- Car Evaluation

All bundled CSV files remain local to the browser session and are not saved automatically.

## Testing and release

The route suite generates every compatible dataset, feature scenario, model, and fold-count combination. The expected inventory is **127 routes at 5 folds plus 127 routes at 10 folds: 254 routes total**.

Live site: <https://elijah-ang.github.io/Data-Science-Python-Playground/>

Run the fast checks from the repository root:

```bash
npm run check
```

For real Python execution and browser coverage:

```bash
python tests/test_ml_routes.py --runtime representative
python tests/test_ml_routes.py --runtime full
python3 -m http.server 8000 -d dist
python tests/test_ml_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The normal release path is: work on a feature branch, run the local checks, open a pull request, wait for the structural route audit, representative Python runtime audit, and Browser/Pyodide smoke test, then merge to `main`. After merging, run the hosted `Validate ML routes` workflow with `full_runtime=true` for the exhaustive 254-route check, require all routes to pass, and verify that GitHub Pages published the merged commit and its cache marker.

The data-analysis workspace remains in [`playground.html`](playground.html). The paused legacy Guided Learning gateway is preserved in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/); it is historical material, not a second ML runtime or the primary description of the current Playground.

## Maintainer note

The repository history and pull requests retain the implementation chronology. Source-level regression names may still mention the phase or feature that introduced a safeguard, but this README documents the current learner experience and release contract rather than requiring readers to follow that history.
