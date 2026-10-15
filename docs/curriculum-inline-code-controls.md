# Clickable illustrative Python

This follow-up moves illustration controls into their Python programs across Inspect,
Wrangle, Visualise and Machine Learning. Click a highlighted value to choose another
value; the program and result update together. Each independent argument has its own
colour. A generated pixel arrow pointer introduces the interaction. No learner work
or illustration settings are saved.

The shared menu supports mouse, touch and keyboard use, including arrow keys,
Home/End, Enter, Escape and Tab. Its popover stays above the independently scrolling
lesson panes. It follows its code value when the page scrolls. Each target is at least
44 pixels tall; foreground/background contrast exceeds 4.5:1 in both themes.

## What changed

- Line examples expose x, y, estimator and marker together. Circle, square, star,
  triangle, cross and no marker are available. The initial daily observations match
  Follow. Switching x to period groups the same observations, making mean, median,
  total and uncombined rows visibly different. The SD example also exposes its
  interval argument; its summaries stay with mean/median locations. Bands stop
  where a spread cannot be calculated, and axes include negative interval ends.
- Other plots expose applicable axes, grouping, measurement and calculation choices.
  These include scatter mappings, histogram bins, density smoothing, bar summaries,
  point summaries, violin interiors, box orientation and faceted panels.
  Strip/swarm examples keep their relevant displacement or size control.
- Inspect/Wrangle examples expose independent arguments where the lesson supports
  them: slice dimensions, filter column/threshold, sort field/direction, grouping and
  calculation, text matching, missing-value fills, pivot calculation, join type and
  concatenated row labels and inclusion of the lowest bin edge. Missing-value
  and grouping examples use observations that distinguish mean, median and total.
  Inputs remain fixed while results are calculated.
- ML examples expose meaningful combinations: KNN neighbourhood and query coordinates,
  tree input coordinates, SVM C/gamma, polynomial degree/Ridge penalty, initialisation
  seed/number of starts, hierarchy cut/scaling, tree depth/leaf support and test
  fraction/random seed. Constant imputation reveals its independently editable fill
  value. Parameters that introduce a later concept remain in that later lesson.
- Syntax descriptions and argument descriptions use the same 16-pixel body text and
  code size. Their headings share font and colour. ML uses the same “What the syntax
  does” heading. The revised introductions use direct explanations while keeping
  accepted API forms, scientific limits and exercise requirements.

Introductory illustrations remain confined to Follow, with the two previously
reviewed later ML introductions. Static illustrations remain where an extra control
would add little. The original Follow/Change/Transfer indicators, ordinary Follow
syntax colouring, visible exercise data/tasks, independent panes and editor actions
remain intact.

## Review the implementation

Read `foundations/inline-code.js` with the argument models in
`foundations/visuals.js`, `foundations/operation-visuals.js` and
`ml-learning/visuals.js`. The same model produces the displayed program and result.
Editable ranges are computed from actual alternative programs, with explicit ranges
for orientation and fitted-state examples. Repeated references to one parameter
share its control; separately editable parameters remain independently clickable.

`ml-learning/curriculum_coherence.py` contains the plain-language introductions.
`foundations/parameter-guide.js` contains the visible argument explanations and
accepted values. The source-based exercise comparison in
[exercise-contracts.json](curriculum-evidence/inline-code-controls/exercise-contracts.json)
checks every Data round, ML activity and workflow against `b52d860`.
Only ML explanation metadata changes; exercise programs, data and graders match.
Run `python3 tests/test_inline_code_exercise_contracts.py` to repeat that comparison
directly from the recorded Git revision.

The native tests execute the displayed Python using the project's pinned scientific
libraries. They compare line coordinates/markers/SD bands, scatter observations,
bar heights, histogram intervals, densities, box statistics, imputed values,
neighbours/votes, SVM support vectors/decision scores, clustering results and fitted
predictions. `scripts/build-visual-argument-fits.py` reproduces the additional fitted
model fixtures. A separate UI check verifies that every offered argument remains
clickable, including combinations and conditionally available arguments.

[Validation and build identifiers](curriculum-evidence/inline-code-controls/validation.json)
record the exact counts, commands and limits. The evidence folder also contains
full lesson rendering checks, native comparisons, desktop/mobile screenshots,
keyboard/contrast checks, editor-pane checks, catalog checks and the isolated preview
checks. The latest ZIP is linked from
[the download instructions](curriculum-evidence/review-refinement/preview-download.md).
The packaged preview also checks repeated curriculum switching and editable ML
arguments; its local dictionary is scoped so reopening ML does not redeclare it.

Earlier evidence directories describe earlier revisions. Chromium rendering and
opaque-file preview checks do not establish physical Safari/WebKit behaviour.
No merge or production deployment is included in this work.
