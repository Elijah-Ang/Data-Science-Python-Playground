# Curriculum review repairs and visual refinement

This follow-up addresses the supplied review of `22dd968` and independently checks the rendered Data Foundations and Machine Learning curricula. It is a review candidate on `curriculum-coherence-2026-10-13`; it has not been merged or deployed.

The uploaded review and copied rendering probes were treated as evidence of defects. Their passing omission assertions were not counted as product validation. New checks use the production lesson renderer, assembled curriculum, real CSS and Python runtime.

## Review findings resolved

| Supplied finding | Repair | Verification |
| --- | --- | --- |
| F11/F12 first-use teaching omitted | Show only current concepts at their relevant workflow steps. Keep familiar steps compact and the full program in the editor. Explain Ridge and candidate comprehensions at their first actual use. | Every current syntax entry is checked in actual visible lesson HTML. |
| Required supplied objects hidden | Show compact definitions for training partitions, incoming batches, unfitted recipes and fitted objects. Fitted objects identify their fitting population. | All 338 ML activities at phone and desktop widths; supplied-estimator provenance checks. |
| Dictionaries, faults, rubric and checked evidence omitted | Display availability dictionaries, the defective snippet, requested output contracts and the readiness rubric in normal lesson content. | W15 fault, W-K2/W-K3 readiness, output names and definitions asserted on rendered pages. |
| Tree/SVM comparison omitted | Display aligned definitions and their preparation/model differences at Apply. | Actual C10/C14 Apply pages; no changed-line decoration. |
| Illustrative plotting code introduces future APIs | Mean/median bars use `sns.barplot`; box plots use the current single-axis API; Inspect summaries use pandas printing. | Current code, rendered controls and production scientific-library checks. |
| V16 Change stage stale | Describe Celsius-to-Fahrenheit conversion. | Activity/description alignment checks. |
| Scalar mode function repeated | Show its definition at the first estimator introduction; later extensions explain the new distinction. | Parameter/progression checks. |

The Reference section remains removed. The exercise dataframe is visible after teaching and syntax, immediately followed by the task in the left pane. Hints and Explained solution are the two closed help rows. Follow/Change/Transfer indicators, independent desktop scrolling, mobile stacking, semantic identifier styles and active-editor-only work remain in place.

## Replacement plan and progression

All **68 reflection and 44 choice activities** now require Python computations: **338 of 338 ML lesson/review/checkpoint activities**, plus the existing **19 independent challenges**, use the Python editor. Stable activity IDs, lesson placement and prerequisites remain. The replacements retain the original reasoning objective while making the evidence observable through code.

The [complete replacement map](curriculum-evidence/review-refinement/ml-replacements.json) lists every original reasoning target, new task, outputs, stage, newly explained syntax and executable fingerprint.

| Stage/family | Computation replacing prose or choices |
| --- | --- |
| ML foundations | Select available inputs and labelled populations; compute errors; separate independent observations from repeated entities. |
| Workflow | Inspect train/final roles, scoring signs, comparable validation evidence, candidate settings and timing constraints. |
| Regression | Calculate conditional prediction differences, residual patterns, input correlation and validation trade-offs. |
| Classification | Calculate per-class errors, threshold costs, independent-neighbour support, impurity, density area and within-class dependence; select supported likelihood routes. |
| Neural networks | Inspect successive loss/error changes without subtracting different metrics; distinguish internal stopping, outer validation and final evaluation. |
| Clustering | Calculate aligned original-unit profiles, sensitivity to units, sampled populations and evidence needed for a new population. |
| PCA | Apply fixed fitted axes; distinguish component scores from a column slice, retained variance from display variance, and consistent sign reversal from changed coordinates. |
| Comparison/reporting | Calculate practical-budget filters and descriptive gains; preserve units, fold variation, evaluation scope and missing final evidence. |

Change and Transfer do different work within each lesson. For example, PCA Change reuses fitted axes, while Transfer compresses three sensors into two coordinates and checks whether a same-shaped column slice has the same meaning. Grouping Transfer distinguishes observed rural rows from fitted urban profiles. Reporting retains the original 4.4/4.2/4.3-hour summaries: it computes descriptive gains and converts units without inventing paired folds or confidence intervals.

Custom practice data are fully visible and named **Exercise evidence**. Supplied validation summaries are described as summaries, rather than presented as model fits executed by the learner. Unrelated inherited illustrations were removed from these activities. Reviews and checkpoints use their actual exercise evidence rather than a generic diagram implying absent fitting or encoding steps.

## Scientific and visual repairs

The audit inventories every activity, including retrieval, reviews, checkpoints, decks, model collections and workflow challenges. It compares representations with objectives, tasks, setup, solutions and grading; separate numeric oracles verify calculations rather than merely comparing the renderer with itself.

- **Data statistics:** KDE bandwidth and Gaussian evaluation, ECDF/complement steps, histogram counts/interval widths, sample SD, quartiles/fences/whiskers, outliers, violin densities, repeated-time summaries, least-squares lines/residuals, correlations, categorical counts, proportions, means and Boolean rates come from explicit observations. Pair/facet views preserve their source rows and use the requested variables and summaries. Histograms keep a stable count scale while bin controls change. Matrix precision does not turn small proportions into misleading integer-looking values.
- **KNN:** Neighbours and votes use the same fixed training observations, the fitted StandardScaler and Euclidean distances in prepared coordinates. Coordinates have equal aspect; changing k changes neighbours and voting, not the observations or scale. Row identities connect points and predictions.
- **SVM:** RBF contours, decision regions and support rings use fitted dual coefficients and intercepts. C and gamma controls vary their intended setting while holding the observations and other setting fixed. No arbitrary linear margin stands in for a nonlinear fit, and decision scores are not labelled probabilities.
- **Trees:** Paths follow fitted thresholds and actual training leaf summaries. Regression complexity draws piecewise-constant predictions at exact thresholds for the same 16 observations. Depth and minimum-leaf controls match their respective lessons.
- **Polynomial/Ridge:** The expansion lesson shows powers without introducing future fitting APIs. The later fitted example uses PolynomialFeatures, training-only scaling and Ridge consistently in its curve, errors and code. Degree controls preserve training/validation observations.
- **K-Means/Ward:** Native pinned fits supply assignments, centroids, inertia, silhouette, merge heights and cuts. Scaling comparisons use the same observations and row IDs. A cut reads a fixed hierarchy; it does not refit the merges.
- **Neural networks:** Actual fixed-seed fits provide the training loss history and separate held-away macro F1. The two metrics have separate scales. Budget controls keep architecture and observations fixed; iteration spacing is proportional.
- **PCA:** Projection uses a fitted mean and orthonormal axes, with equal units within each coordinate plot. Highlighting a row does not refit axes. Component weights, row scores, cumulative retention, two-axis display and sign equivalence remain distinct. Supplied coordinate examples are centred and orthogonal where they claim to be PCA scores; component weight examples have unit norm.
- **Concept diagrams and teaching code:** Scaling shows computed before/after values and its fitted statistics. Residual-line examples use least squares. Generic comparison bars without evidence were replaced by a process diagram. One-hot column order, covariance shapes, availability boundaries, mean/median captions and month/code/output agreement were checked.

Illustrative observations are labelled separately from the exercise dataframe. Useful emphasis identifies rows, fitted support, paths, axes or contributing observations. Existing palette and shared styling remain. Captions and evidence tables stay visible; larger diagrams have accessible horizontal scrolling at narrow widths, rather than unreadably small labels.

## Reproduce and review

Use the scientific versions in `tests/requirements-pyodide-parity.txt` (sklearn 1.4.2, matching Pyodide 0.26.4). Native tests against a different sklearn release are not evidence of production parity.

```sh
npm ci
npm run check
python3 -m http.server 8015 -d dist
```

`tests/test_visual_context_audit.py` visits all 676 lesson activities at 1440, 390 and 320 pixels in light/dark themes, changes every available native illustration control, then checks decks, collections and challenge routes. `tests/test_ml_learning_presentation.py` checks essential visible information, order, fonts and the two help rows for every ML activity. `tests/test_curriculum_responsive_browser.py` checks all activity layouts, both editor implementations, semantic identifiers, independent wheel scrolling and keyboard escape.

`tests/test_visual_scientific_scenes.py`, `tests/test_teaching_visual_models.py` and `tests/test_model_family_visuals.py` independently recompute the mathematical examples. `scripts/build-teaching-model-fixtures.py --check` verifies the native fitted fixtures. `tests/test_ml_code_practice.py` runs all replacements and checks missing/fabricated outputs, legitimate alternatives and incorrect fitted-PCA reuse. `tests/test_ml_code_practice_browser.py` runs replacements and selected model workflows through the real browser editor/worker/grader. Existing full-runtime, semantic-negative and model-application suites remain relevant.

The [validation receipt](curriculum-evidence/review-refinement/validation.json) records actual commands, runtime versions, counts, source digests and limitations. All **695 Python reference solutions** passed. The final sweep checked **4,056 lesson views, 1,566 interactive states and 324 catalog/challenge views**, with **820 captures**. The actual-page ML information checks cover all 338 activities at two widths. Browser Python evidence covers 136 programs, with the only two subsequently changed executable exercises rerun on the final build; the receipt records their program fingerprints.

The [render inventory](curriculum-evidence/review-refinement/visual-inventory.json) and [render results](curriculum-evidence/review-refinement/all-rendering.json) identify every checked activity and interactive state. The [screenshot index](curriculum-evidence/review-refinement/screenshots.md) links all desktop/mobile contact sheets and full lesson screenshots. The existing [ML concept/thumbnails audit](ml-learning-visual-review.json) was also regenerated from the repaired site. [Data contract comparisons](curriculum-evidence/review-refinement/data-contracts.json) independently confirm unchanged setup, starters, programs, datasets and assessment requirements against `22dd968`; [numerical oracle results](curriculum-evidence/review-refinement/numerical-oracles.json) record the pinned scientific environment.

The single-file preview is generated from the built assets with `scripts/build-review-preview.py`. Its isolated-page/embedded-frame test checks bundled CSS/JS and actual Data/ML Python execution without sibling application assets. Python runtime package downloads remain necessary.

Local rendered evidence uses Chromium. WebKit and physical-device behaviour are not established by those receipts. Earlier evidence directories describe earlier revisions; they are not counted as fresh validation of this follow-up. For a complete source review, start with [the model handoff](model-review-handoff.md).
