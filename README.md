# Data Science Python Playground

A browser-only Python playground for inspecting, wrangling, visualising, and modelling complete real-world datasets.

## Run locally

Serve the project from its root so the browser can read the CSV files:

```bash
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>.

The Python runtime runs in a Web Worker through Pyodide. The first load needs internet access to fetch Pyodide, pandas, matplotlib, SciPy, seaborn, and—on the Machine Learning page—scikit-learn from their public package sources.

## Deployment

The `main` branch deploys automatically to GitHub Pages through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Live site: <https://elijah-ang.github.io/Data-Science-Python-Playground/>

For substantial Machine Learning Playground changes, use the release path: work on a feature branch, open a pull request, wait for the structural, representative, browser/Pyodide, and required PR checks to pass, then merge to `main`. The Pages workflow repeats the code/runtime gate and runs its own real browser/Pyodide smoke gate before publishing; deployment is blocked if either gate fails. The full 254-route runtime audit is available from the ML audit workflow's `workflow_dispatch` input and runs on the weekly schedule. The normal PR checks are the structural route audit, representative Python runtime audit, and Browser/Pyodide smoke test; the expensive full audit remains a scheduled/manual release gate.

The main page is a light-mode quick-start tutorial for the two active labs. It explains the shared workflow and links directly to the Data Playground and Machine Learning Playground. The paused Guided Learning gateway and its space-route curriculum are preserved in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/). `playground.html` contains the browser-only data-analysis workspace. `ml.html` contains the Machine Learning Playground: Guided mode provides the complete editable walkthrough, while Practice mode keeps the same route and Python runtime but asks for selected predictions, evidence-based decisions, safe one-variable experiments, code-completion tasks, and a final independent checkpoint. Supervised routes use the 80/20 holdout, training-only 5/10-fold cross-validation and tuning, editable pipelines, diagnostics, and a one-use final test. K-means, hierarchical clustering, and standalone PCA use target-free discovery routes; reference labels remain hidden during fitting and may appear only for clearly labelled post-fit interpretation.

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality
- Breast Cancer Wisconsin (Diagnostic)
- Palmer Penguins (333-row complete-case teaching copy)
- Car Evaluation

All bundled CSV files remain local to the browser session. Uploaded CSVs are processed in the current tab and are not saved automatically.
