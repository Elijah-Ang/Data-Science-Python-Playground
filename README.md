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

For substantial Machine Learning Playground changes, use the lightweight release path: work on a feature branch, open a pull request, wait for the structural, representative, and browser/Pyodide smoke audits to pass, then merge to `main`. The Pages workflow repeats the code/runtime gate and runs its own real browser/Pyodide smoke gate before publishing; deployment is blocked if either gate fails. The full 254-route runtime audit is available from the ML audit workflow's `workflow_dispatch` input and runs on the weekly schedule. Branch protection is not currently configured, so the pull-request/merge check remains a project-maintainer responsibility.

The main page is a light-mode quick-start tutorial for the two active labs. It explains the shared workflow and links directly to the Data Playground and Machine Learning Playground. The paused Guided Learning gateway and its space-route curriculum are preserved in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/). `playground.html` contains the browser-only data-analysis workspace, while `ml.html` contains the machine-learning workspace with an 80/20 holdout, training-only 5/10-fold cross-validation and tuning, editable pipelines, diagnostics, and a final test step. K-means, hierarchical clustering, and standalone PCA use separate unsupervised discovery routes because they do not have a supervised target or test score.

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality
- Breast Cancer Wisconsin (Diagnostic)
- Palmer Penguins (333-row complete-case teaching copy)
- Car Evaluation

All bundled CSV files remain local to the browser session. Uploaded CSVs are processed in the current tab and are not saved automatically.
