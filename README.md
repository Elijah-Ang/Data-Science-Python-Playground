# Data Science Python Playground

A browser-only Python playground for inspecting, wrangling, visualising, and modelling complete real-world datasets.

## Run locally

Serve the project from its root so the browser can read the CSV files:

```bash
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>. The two active labs are linked from the landing page:

- `playground.html` — the data-analysis workspace.
- `ml.html` — the Machine Learning Playground.

The Python runtime runs in a Web Worker through Pyodide. The first load needs internet access to fetch Pyodide, pandas, matplotlib, SciPy, seaborn, and, on the Machine Learning page, scikit-learn from their public package sources.

## Machine Learning Playground

The ML page is an editable browser notebook. Choose a dataset, feature scenario, model, and fold setting, then run the generated Python one step at a time. The route generator is the single source of truth for both learning modes, so Practice changes the learner's role without introducing a second ML methodology.

### Guided mode

Guided is the default and is intended for following the complete walkthrough:

- the generated Python is available immediately and remains editable;
- each important step has a nearby question, concept, and reading cue;
- the Workflow Reference can show the exact route code;
- `Run Complete` is available when you want to run the walkthrough end to end.

### Practice mode

Practice uses the same dataset, scenario, model, preprocessing, validation, and outputs, but asks the learner to think before the evidence appears:

- make a qualitative prediction before selected steps, or choose `Not sure yet`;
- make a decision when the route presents a real choice, such as interpreting a tuning result or comparing cluster counts;
- run the step and compare the expectation with the actual output;
- make one safe, reversible, one-variable experiment and rerun the evidence that can show its effect;
- use the Workflow Reference deliberately: exact code is behind `Reveal code` rather than displayed immediately;
- work step by step — `Run Complete` is unavailable in Practice mode.

Practice feedback is evidence-focused rather than punitive. It does not ask for random exact scores, automatically tune a model, open the final test early, or use hidden reference labels as an answer key. Practice progress is lightweight session state; Reset clears the current run's predictions, decisions, experiment comparison, and related answers.

#### Evidence comparisons

An experiment changes one meaningful value, such as a model setting, cluster count, or PCA variance target. After the edited step is rerun, Practice guides the learner to the configured evidence target — for example validation evidence, a cluster profile, or PCA selection output. Only then does it show a compact before/after comparison. The comparison stores small summaries rather than old models, charts, or dataframes, and it never turns the experiment into hidden optimisation.

#### Scaffold fading and independent work

Selected high-value Practice tasks can progressively transfer responsibility to the learner:

```text
full example → complete one line → partial starter → goal + hint → small independent task
```

These tasks use real, editable Python and semantic checks where validation is needed; they do not require reproducing one exact spelling or expose diagnostic plumbing that is not part of the lesson. A completed Practice route can end with an **Independent Checkpoint**: a compact transfer task with a goal, checklist, available variables, optional hint, and a hidden reference solution. It reuses training data for supervised work and input data only for clustering/PCA. It does not reuse the sealed final test, award XP, or turn the work into a graded competition.

## Supervised and unsupervised routes

The page keeps two different analytical questions distinct.

### Supervised learning

Supervised routes use selected features `X` to predict a known target `y`. Their workflow includes a train/final split, training-only cross-validation and tuning, diagnostics, and one sealed final-test step. The final test is data that was not used for fitting, tuning, or model selection; it is not opened early by Practice prompts or experiments.

### Clustering and PCA

K-Means and Hierarchical Clustering discover groups from the selected input features. They assign arbitrary cluster labels; they do not predict a known target, run supervised accuracy metrics, or use a final test. PCA creates new axes and row coordinates; it does not create cluster labels. Explained variance describes variation represented by the components, not prediction accuracy.

During the discovery stage, the Inspector hides the dataset's target or reference column for unsupervised routes. The column remains available internally, but fitting, cluster-count or component selection, and practice feedback use the inputs only. A reference label may be added after fitting for clearly labelled descriptive interpretation, such as colouring a projection; it must not become a hidden quality score or answer key.

Scaling is part of the current numeric clustering and PCA routes because distance and variance are sensitive to measurement scale. The route's evidence still needs interpretation: a silhouette or explained-variance value supports a decision but does not provide an objectively guaranteed answer.

## Included data

- Seoul Bike Sharing Demand
- Candy Power Ranking
- Gapminder
- Wine Quality
- Breast Cancer Wisconsin (Diagnostic)
- Palmer Penguins (333-row complete-case teaching copy)
- Car Evaluation

All bundled CSV files remain local to the browser session. Uploaded CSVs are processed in the current tab and are not saved automatically.

## Testing and deployment

Substantial ML changes are developed on a feature branch and reviewed through a pull request. The normal checks cover JavaScript syntax and state behaviour, all generated route structures, representative Python execution, and a real browser/Pyodide smoke journey. The slower full audit runs every generated route at both fold settings and can be requested manually with `full_runtime=true`.

The `main` branch deploys automatically to GitHub Pages through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). That workflow repeats the structural/runtime and browser gates, writes the deployed commit to `pages-deployment-sha.txt`, and publishes only after the gates pass. See [`tests/README.md`](tests/README.md) for exact commands and the release sequence.

## Repository note

This README is organised around the current learner experience rather than an internal phase chronology. Detailed implementation and audit history remains available in Git commits and pull requests. The paused legacy Guided Learning gateway and its space-route curriculum are preserved for maintainers in [`archive/guided-learning-legacy/`](archive/guided-learning-legacy/); they are not part of the active ML runtime.
