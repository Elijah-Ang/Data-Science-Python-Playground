# Stage-specific curriculum visuals

This refinement addresses repeated introductory illustrations, controls that teach
the wrong operation, and unnecessary or missing later-stage explanations. Review
it alongside the cumulative [model handoff](model-review-handoff.md). Nothing is
merged or deployed.

## Result

Data Foundations introduces each main illustration in Follow. Change, Transfer
and retrieval practice omit that illustration. The same rule applies to ML, with
two explicit exceptions: `ML-C08-2` teaches how to retrieve the fitted five
neighbours, and `ML-R10-2` introduces minimum leaf support. Their focused visuals
explain those additions; neither repeats the preceding introduction.

There are 45 concise Data Foundations additions and 17 ML additions. They explain
new operations or argument forms, using existing exercise objects and short code
excerpts. Familiar data changes and combinations do not create a new panel. The
139 familiar later Data tasks and 198 later ML tasks have no inherited main visual.
No new lesson IDs or prerequisites were needed: these additions extend the
current operation or apply previously taught ideas.

The progression audit corrected Follow explanations for grouped means, distinct
counts, Series labels, extreme labels, replacing category labels, reading comma
CSV files and category conversion. Sorting a grouped result, unlabelled arrays,
alternate duplicate policies and other later operations stay in their intended
stage. ML guides name the exact fitted pipeline step used by the task.

## Interactive examples

44 Inspect/Wrangle Follow lessons now have 100 fixed-data states. A short pandas
call connects a source table to its result. Selection, sorting, renaming, text
cleaning, missing values, aggregation, reshaping, joining, encoding and scaling
use appropriate controls. Renaming highlights the heading while leaving its
values unhighlighted; sorting preserves the identity of the observations. Small
screens stack the tables and keep column names intact, with local table scrolling
when needed. Lessons without a useful current argument retain a simple visual.

17 Visualise Follow lessons have directly relevant controls. The audit covers
bin counts, smoothing, category colour and marker style, jitter, swarm packing,
line markers, sample-SD intervals, violin interiors and stacking. The same
observations remain visible while the intended setting changes. Category-count
Follow traces observations into counts; ordering is taught later. Each explorer
shows one current result and matching Python, without repeated baseline prose.

25 ML Follow lessons have interactive examples. Added operations include feature
selection, fitting, prediction, partitioning, scaling, encoding and imputation.
K-Means initialisation varies the seed rather than the number of groups; sampling
varies the selected observations; loss-history inspection highlights the supplied
history; polynomial expansion shows expanded columns; PCA standardises before
fitting and keeps the fitted axes fixed while inspecting scores.

Illustrative observations are labelled separately from exercise data. Source
values, output tables and numerical results are checked against native pandas,
NumPy, SciPy and the pinned scikit-learn environment. Identifier styling uses the
actual example's columns and Python objects, including after control changes.

## Validation and evidence

The [evidence directory](curriculum-evidence/stage-visuals/) records exact builds
and source digests. Automated browser coverage and visual inspection are separate:
the full sweep renders every activity; contact sheets and selected full lesson
and widget captures support manual inspection.

- `rendering.json`: 676 activities at 1440, 390 and 320 pixels in both themes;
  4,056 actual views and 1,482 interactive option states, with no recorded issues.
- `final-delta.json` and `final-delta.diff`: eight final explanatory corrections,
  48 additional views, and exact article-HTML equality for the other 668 activities
  after normalising generated numeric SVG marker IDs.
- `css-followup.json`: checks the final column-heading wrapping correction in all
  44 affected operation lessons. The correction is scoped to their table headers.
- `responsive.json`: editor alignment, touch sizing, keyboard escape and independent
  desktop reading/editor scrolling on the final CSS.
- `visualise-*`: native calculations, executed illustrative Python and actual
  desktop/mobile lesson captures. Dense charts retain labelled local panning to
  keep their axis text readable; page-level overflow is checked separately.
- `ml-progression.json`, the refreshed ML visual audit, and native tests: 33 new
  operation states, 29 model states, existing model oracles, 85 teaching visuals,
  110 thumbnails and four executed Python figures.
- `contracts.json`: all 338 Data and 338 ML exercise contracts retain their
  existing programs, requirements and data relative to `97ca093`; the 19 ML
  independent challenges also remain unchanged.
- `preview.json`: self-contained review navigation, isolated assets and real
  Data/ML Python grading. Safari on a physical Mac is not independently tested.

`npm run check` passes. Targeted native and browser commands are recorded in
`validation.json`; the new native regressions are included in the curriculum CI
workflows. Chromium rendering does not establish WebKit or physical-device
behaviour. Earlier reports remain historical evidence for their recorded builds.
