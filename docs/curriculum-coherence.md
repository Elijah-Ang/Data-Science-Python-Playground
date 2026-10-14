# Lesson order, argument values and visual alignment

The reading pane now places Follow code, syntax descriptions and current arguments before the exercise dataframe and task. ML follows the same order for its workflow, current syntax and essential supplied-state/evidence notes. The task remains immediately below the visible dataframe. Hint and Solution remain the two closed help rows; the two desktop panes scroll independently.

Histogram Follow and Change now demonstrate integer bin counts (`bins=4`, then `bins=2`). Transfer demonstrates explicit interval edges with bars whose numeric widths match those edges. The argument row visibly contrasts a count, `[0, 2, 4, 6]`, unequal intervals and automatic rules.

Every current plotting argument lists concrete accepted values beside its explanation. Estimators include mean, median, sum, min, max, standard deviation and a scalar mode function. Mode is shown as a function rather than the unsupported scalar aggregation string `"mode"`. ML current syntax also exposes argument choices and accepted examples without a disclosure.

The audit covers all 338 Data activities and 338 ML activities, including retrieval. Corrected conflicts include:

- Head versus tail/sample, label slices versus explicit label lists, AND versus OR, minima versus maxima, counts versus proportions, and first versus all duplicate occurrences.
- Group means versus totals, conditional choices, mapping unmatched labels, retained indices, group centring, pivot means versus totals, fixed versus quantile intervals, and unmatched join rows.
- Colour versus shape/size encodings, complementary ECDFs, medians without intervals, raw points without jitter, single trajectories without aggregation bands, matrix counts/proportions/means/rates, benchmark types, annotation targets and scatter versus histogram facets.
- RBF SVM boundaries/support vectors and separate gamma controls; KNN choices matching the tuning lesson; depth/leaf controls in tree complexity; class-aligned probability tables; Bernoulli versus Gaussian inputs; fitted replacements, settings versus learned values, coefficient stability and retained PCA scores versus a two-axis display.

Exercise Python, starters, setup, datasets, requested outputs, checks and supplied-object contracts remain unchanged. The Data task hashes and a comparison of the assembled ML registries verify this; the review fingerprints were renewed for changed presentation metadata.

## Validation

- [676 activities and their resolved teaching visuals](curriculum-evidence/activity-alignment/inventory.json).
- [1,352 phone/desktop renders, reading order, independent wheel scrolling and editor interactions](curriculum-evidence/activity-alignment/responsive.json).
- [All Data activities at 320px and 1440px](curriculum-evidence/activity-alignment/data.json), [all ML activities at 390px and 1440px](curriculum-evidence/activity-alignment/ml.json), and [current argument views plus script-free pages](curriculum-evidence/activity-alignment/arguments/chromium-parameters.json).
- [Independent Python checks of computed visuals and accepted histogram/estimator forms](curriculum-evidence/activity-alignment/scientific-checks.txt), plus [the RBF fits checked in production sklearn 1.4.2](curriculum-evidence/activity-alignment/rbf-production.json).
- [Production browser Python checks](curriculum-evidence/activity-alignment/runtime.json) and [isolated/opaque standalone-preview checks, including Data and ML Python](curriculum-evidence/activity-alignment/preview.json).
- [Refreshed ML visual review: 85 teaching concepts, 64 families, 110 thumbnails and 277 captures](ml-learning-visual-review.json).
- [Repository checks](curriculum-evidence/activity-alignment/validation.json) and [final font/scrolling checks at 320px, 390px and 1440px](curriculum-evidence/activity-alignment/final-fonts.json).

Browser validation uses Chromium. Earlier receipts and images remain historical evidence of previous revisions.

## Current screenshots

| Focus | Screenshot |
| --- | --- |
| Histogram bin count | [Illustration](curriculum-evidence/activity-alignment/screenshots/histogram-bins.png) |
| Explicit bin forms, visible dataframe and task | [Arguments](curriculum-evidence/activity-alignment/screenshots/histogram-arguments.png) |
| Teaching before exercise data | [Reading order](curriculum-evidence/activity-alignment/screenshots/reading-order.png) |
| Estimator alternatives and mode function | [Estimator values](curriculum-evidence/activity-alignment/screenshots/estimator-values.png) |
| Nonlinear SVM | [RBF boundary](curriculum-evidence/activity-alignment/screenshots/rbf-svm.png) |
