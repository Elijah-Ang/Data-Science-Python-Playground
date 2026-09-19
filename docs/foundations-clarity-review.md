# Foundations teaching and task clarity review — 19 September 2026

Scope: all 324 Data Foundations exercises across Inspect (83), Wrangle (111), and Visualise (130), including retrieval and checkpoints. This review concerns the Follow / Change / Transfer curriculum, not the separate workflow challenges, Statistics workspace or Machine Learning workspace.

## Teaching standard

Every one of the 89 Follow lessons now has an individually authored guide in `foundations/clarity.js`. The three checkpoints have reference guides too. Each guide supplies:

1. A short explanation of what the operation does and what it returns.
2. A small concrete example separate from the exercise answer.
3. Two to four comparisons explaining the choices needed across the lesson’s stages, including defaults, boundaries, missingness and output shape where relevant.
4. One interpretation note addressing the most important misconception.

Essential teaching is visible in Follow. The page reads idea → example → choices → worked code → inputs/task. The old abstract process strip, separate tools box and tiled syntax cards no longer compete with the explanation. Plot concepts retain their illustrations. Supplementary syntax sits under the worked code. Change, Transfer and retrieval retain the task-first layout and offer a complete inline concept reference without requiring navigation away from learner code.

The duplicate-row example uses full rows A, B, A, A and compares all three `keep` settings in a semantic HTML table. The unique B stays False under every option. Text explains that `duplicated` flags rows, `mask.sum()` counts flags, `df[mask]` selects rows, and `drop_duplicates` actually removes rows. The illustrative flags are also checked against pandas.

## Findings and corrections

| Finding | Correction |
| --- | --- |
| `keep=False` introduced only as “every member of duplicate groups” | Concrete flags for first/last/False; explicit first-occurrence and unique-row behavior; Boolean spelling; count versus row selection. |
| New tools introduced too briefly or only in later-stage hints | Options explained in Follow: CSV separators; negative positions; label lists; normalizing counts; map/replace; missing-value policies; keep/reset options; fit/transform; plot estimators, intervals, orientation and figure ownership. |
| Counts and proportions demanded an unnecessary largest-first order | Remove the requirement. Explain that `value_counts` already ranks counts by default. Accept any category order for these Series summaries. |
| Group summary and weekday tasks conflated answer values with display order | Unordered category-keyed checking for I19 and W15 Change. Wrong values, missing/extra categories and duplicate category labels still fail. Explicit sorting tasks remain strict. |
| Some tasks repeated “display” and method requirements | Remove redundant chart-display sentences and already-stated method requirements; retain intentional method constraints. |
| Exact-bar teaching still said “totals” after the example switched to means | Explain preparation of either mean or total; update the syntax reference to match the actual Follow example. |
| Vague named-aggregation outputs | State output column order and distinguish non-missing count from row count. |
| Cleaning checkpoints omitted retention, date-format or reset-index details | State first-copy retention, year-month-day parsing, ascending order and no added index column where the reference requires them. |
| Retrieval copies could lag behind edited source briefs | Refresh copied tasks and checker settings from their current Transfer source. |

No exercise identities, reference-solution values, datasets, navigation paths or learning-state persistence were added or removed. The workflow-challenge baseline was renewed because it fingerprints the full Foundations curriculum, including teaching and task text; the 30 workflow challenges are unchanged.

## Verification

- All 324 reference solutions pass both the native Python curriculum audit and the production browser/Pyodide worker (324 passed, zero failures). Browser journeys also check incorrect answers, reset/recovery, chart validation, figure export and responsive light/dark layouts.
- New regressions execute the duplicate truth table, accept reordered category summaries, reject incorrect values/missing categories, and preserve intentional sort checks.
- All 324 teaching pages render at 1440 px and 320 px in Chromium and WebKit without document or teaching-panel overflow.
- Structural checks require an authored guide for every concept, visible essential teaching, bounded comparison sizes and synchronized retrieval contracts.
- `npm run check` passes the build, JavaScript, route, workflow-challenge and app-shell checks.
- Representative desktop and mobile screenshots are in `outputs/foundations-clarity/` (local, ignored evidence).

The local native Python environment uses pandas 3.0.1 and Seaborn 0.13.2. The browser audit separately exercises the site's configured Pyodide runtime; native success is not treated as browser-runtime parity.

## Reference checks

Official API behavior was cross-checked against [pandas duplicated](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.duplicated.html), [pandas value_counts](https://pandas.pydata.org/docs/reference/api/pandas.Series.value_counts.html), and [Seaborn lineplot](https://seaborn.pydata.org/generated/seaborn.lineplot.html). Content is authored for this curriculum rather than copied from the screenshot or documentation.
