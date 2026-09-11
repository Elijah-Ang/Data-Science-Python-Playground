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

The generated Capacitor project lives in `ios/`. It packages the tested site, a pinned local Pyodide runtime, scientific Python wheels, local fonts, native sharing, and export destinations. It never opens the live GitHub Pages site as its application shell. Version 1 uses bundled datasets only; user-supplied CSV import is deferred beyond version 1.

```bash
npm run ios:sync
npm run ios:open
```

The native build requires Node 22+, full Xcode 26+, an Apple signing team, and an iPhone/iPad simulator or device. Install full Xcode and select its developer directory before building. The 5 September 2026 audit successfully built and launched an iOS simulator artifact; signing and physical-device release checks remain separate gates. See `ios-app-readiness` for dated evidence.

## Machine Learning Playground

Open [`ml.html`](ml.html) for an editable, browser-only ML notebook with a single step-by-step workflow for each compatible dataset, feature scenario, and model.

### Working through a route

Choose a setup, then select a route step to add and run its editable Python cell. Each step includes a question and reading cue beside the relevant evidence. **Run all** continues the suggested route, and **Workflow** opens the reference panel with the exact route code. Add a custom cell to explore your own question, or use **Reset data** to start the modelling workspace again.

### Route families

#### Supervised learning

Supervised routes use selected features `X` to predict a known target `y`:

```text
frame → split → explore training data → prepare → build
→ cross-validation → tune or keep defaults → diagnose → final test
```

Classification uses a stratified 80/20 holdout when appropriate; ordinary regression uses a random 80/20 holdout. Seoul Bike uses a chronological holdout and forward-only `TimeSeriesSplit`. Preparation stays inside the pipeline and cross-validation, tuning uses training data only, and the one-use final test remains sealed until the final step.

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

Bundled CSV data remains on-device. Code drafts retain a bundled CSV copy locally; export creates a portable file only when requested.

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
python tests/test_ml_workflow_browser.py --base-url http://127.0.0.1:8000/ml.html
```

The normal release path is: work on a feature branch, run the local checks, open a pull request, wait for the structural route audit, representative Python runtime audit, and Browser/Pyodide smoke test, then merge to `main`. After merging, run the hosted `Validate ML routes` workflow with `full_runtime=true` for the exhaustive 254-route check, require all routes to pass, and verify that GitHub Pages published the merged commit and its cache marker.

The data-analysis workspace remains in [`playground.html`](playground.html). The paused legacy Guided Learning gateway is preserved in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/); it is historical material, not a second ML runtime or the primary description of the current Playground.

## Maintainer note

### Web advertising preparation

Bookmark `?ads=off` on any page for ad-free browsing. It persists for the tab's session and follows internal HTML links, including when session storage is blocked. `?ads=on` clears the preference; it is not consent. This preference does not change notebook storage. The switch is public convenience, not password protection.

The agreed desktop concept can be previewed on `playground.html?ads=on&adpreview=footer` or `ml.html?ads=on&adpreview=footer`: a centred 468 × 60 placeholder between the existing footer text and links, visible only at widths of at least 1280px. No real ads are loaded. Normal visits, native shells and ad-free mode leave it hidden. The footer height is measured to preserve the independently scrolling desktop workspace.

`ad-mode.js` loads before app code on every maintained page. Advertising is deliberately disabled; no advertising or consent SDK is currently requested. Any future ad/CMP loader must use this early policy, remain off in the native shell, and respect regional consent independently. Do not add an unconditional AdSense script or a publisher-controlled refresh timer. Site verification should use the AdSense meta-tag option so the ad-free route does not need to request an advertising script.

Before activation: finish custom-domain DNS and HTTPS, verify the publisher ID in AdSense, publish its exact `ads.txt` entry and verification tag, configure Google's certified consent message, update actual data disclosures, request review, and wait for Ready. Account signup is not site approval.

The repository history and pull requests retain the implementation chronology. Source-level regression names may still mention the phase or feature that introduced a safeguard, but this README documents the current learner experience and release contract rather than requiring readers to follow that history.

## Notebook work and build identity

Data Playground opens with an empty notebook; its cells last only while the page remains open. Copy code you want to keep before navigating away. Machine Learning code drafts save per dataset/model/scenario/fold setup and restore code, not Python variables or current results. **Stop / restart Python** cancels execution and retains code; **Reset data** restores the runtime namespace and retains code. Notebook save/open/report-export controls are not part of the current workspace toolbar; CSV and chart exports are created only when you choose them.

Run `npm run check` for build, JavaScript, worker-transport, scientific metadata and shell checks. Run `npm run check:data` for 262 Data task scenarios and trust regressions. Product browser tests require Playwright and a server for `dist`: `python3 tests/test_product_browser.py --engine chromium --base-url http://127.0.0.1:8000` (repeat with `webkit`).

Production copies only referenced artwork. `dist/asset-manifest.json` records exact file hashes; `dist/build-info.json` records the content ID, commit, modified-source indicator, date and byte count. About displays this identity. Web offline support covers the cached app shell; the remote web Python runtime is not promised on a fresh offline visit. Native builds bundle the pinned runtime.

## Statistics Playground

Open `statistics.html` from the shared Home / Data / Stats / ML navigation. Eight question families guide learners to appropriate inference, assumptions, uncertainty, effect sizes and corrected follow-ups. See [Statistics methods and verification](statistics/README.md). Run `npm run check:statistics` for numerical/session tests and `python3 tests/test_statistics_integration_browser.py --base-url http://127.0.0.1:8000` against a production build for browser verification.
