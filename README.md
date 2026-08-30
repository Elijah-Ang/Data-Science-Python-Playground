# Data Science Python Playground

A browser-only Python playground for inspecting, wrangling, visualising, and modelling complete real-world datasets.

## Open the playground

Serve the project from its root so the browser can read the bundled CSV files:

```bash
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>. The two labs are available from the landing page:

- [`playground.html`](playground.html) — data exploration and analysis.
- [`ml.html`](ml.html) — the editable Machine Learning Playground.

The Python runtime runs in a Web Worker through Pyodide. The first load needs internet access to fetch Pyodide and the scientific packages used by the labs, including pandas, matplotlib, SciPy, seaborn, and scikit-learn on the Machine Learning page.

## Machine Learning Playground

The Machine Learning Playground generates an editable Python notebook from one dataset, feature scenario, model, and fold-count choice. The route keeps the same modelling methodology while showing the evidence that answers each step's question. Cells remain real, runnable Python, so you can inspect and modify them outside the site as well.

### Guided mode

**Guided** is the default walkthrough. It provides the complete route code, the questions and reading cues beside the evidence, the Workflow Reference, editable cells, and **Run Complete**. Nothing in Guided mode requires an answer before you run a cell.

### Practice mode

**Practice** uses the same route, data, preprocessing, models, and safeguards, but asks you to take more responsibility before the output appears:

1. read the question;
2. predict or make a small decision;
3. run the relevant cell;
4. read the actual evidence and compare it with your expectation;
5. try one safe, reversible change where one is offered;
6. explain what changed and what stayed similar.

Practice prompts are attached only to selected high-value steps, not every cell. Answers are lightweight session state, not grades. **Not sure yet** is an acceptable commitment. The exact Workflow Reference solution is collapsed until you explicitly choose **Reveal code** when you need it. Run Complete is unavailable in Practice so the evidence is encountered step by step; switching back to Guided restores the normal walkthrough.

The completion-pass Practice contract is deliberately gradual. **Scaffold fading** means that, where a route provides a coding task, support can fade from a full example to one missing line, a short partial cell, a goal with a hint, and finally a small independent task. After a route is complete, the **Independent Checkpoint** asks you to recreate a compact, transferable piece of the workflow without reopening the sealed final test. It is practice, not an XP system or a pass/fail certification. In the `5c68ff4` baseline, the active ML page provides the prediction/decision, reveal, and experiment layers; scaffolded coding tasks and the checkpoint are documented as the final transfer contract and are distinct from the archived legacy Guided Learning app.

### Predictions, decisions, and safe experiments

Prediction prompts ask about a direction or consequence that the next evidence can answer—for example, whether scaling matters for a distance-based model or whether the first two PCA axes will retain most of the variance. Decision prompts appear where the workflow already contains a meaningful choice, such as which cluster count to investigate or whether a tuned setting is worth keeping. They do not ask you to guess an exact score.

Safe experiments change one supported value in the existing editable cell. Examples include changing a nearby `n_neighbors`, tree depth, polynomial degree, cluster count, or PCA variance target. After an experiment, rerun the changed task and the later evidence task it names; the edit does not auto-run downstream work. The Practice panel then shows a small **before / after** comparison using the appropriate evidence—validation summaries, cluster profiles, or PCA variance—not a hidden automatic tuning result. For clustering, a candidate is defensible evidence to investigate, not a single graded correct answer. Experiments never open the final test and do not use hidden reference labels as answer keys.

### Two kinds of route

#### Supervised learning

Supervised routes use selected features `X` to predict a known target `y`. The route:

```text
frame → split → explore training data → prepare → build
→ cross-validate → tune or keep defaults → diagnose → final test
```

The current teaching split is 80/20. Cross-validation and tuning use training data only; the final test is held back for the one-time final check. Classification uses stratification, while Seoul Bike uses chronological splitting and forward-in-time validation. Metrics and model-specific diagnostics are tied to the fitted route evidence rather than to the final test early.

#### Unsupervised discovery

K-Means, hierarchical clustering, and PCA are separate discovery routes. They use the selected input features without fitting to a target, so they do not have supervised accuracy, a final-test score, or a CV-versus-test comparison.

- **K-Means** assigns rows to distance-based groups around centroids. Inertia, silhouette, cluster sizes, and original-unit profiles are evidence for comparing solutions; no single cluster count is silently treated as truth.
- **Hierarchical clustering** starts with individual rows and repeatedly merges groups. The dendrogram, merge heights, sampled-row note, silhouette, sizes, and profiles help describe possible cuts.
- **PCA** creates new weighted axes and row coordinates. Explained variance, loadings, component scores, and the 2D projection describe the representation; PCA does not create cluster labels.

### Target isolation

During the discovery stage, the Inspector preview hides the dataset's target or reference label when an unsupervised model is selected. The value remains available internally for dataset integrity, but K-Means, hierarchical clustering, and PCA fit on the selected inputs only. A reference class or numeric target may be added after fitting as clearly labelled, interpretation-only colouring; it cannot choose clusters, components, or a score.

Switching back to a supervised model restores the ordinary feature-and-target preview. This makes the distinction visible without reloading the wrong dataset or changing the underlying data.

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality
- Breast Cancer Wisconsin (Diagnostic)
- Palmer Penguins (333-row complete-case teaching copy)
- Car Evaluation

All bundled CSV files remain local to the browser session. Uploaded CSVs are processed in the current tab and are not saved automatically.

## Testing and release

The generated route space currently contains 127 compatible routes at 5 folds and 127 at 10 folds: 254 route executions in total. Every substantial Machine Learning change should go through the repository's feature-branch and pull-request workflow. The default pull-request gates are the structural route audit, representative Python runtime audit, and Browser/Pyodide smoke test. The slower full 254-route audit is run on the weekly schedule and manually before a completion release.

GitHub Pages deploys from `main` through [`deploy-pages.yml`](.github/workflows/deploy-pages.yml). Deployment repeats the validation gates and publishes a `pages-deployment-sha.txt` marker so the deployed commit can be checked directly.

Live site: <https://elijah-ang.github.io/Data-Science-Python-Playground/>.

For the detailed commands, coverage contract, and release sequence, see [`tests/README.md`](tests/README.md).

## Maintainer notes

The archived Guided Learning gateway and its space-route curriculum are preserved in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/). It is historical reference material and is not part of the Machine Learning Playground runtime.
