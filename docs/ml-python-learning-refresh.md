# Python learning refresh

ML Learn / Refresh now follows the Data Foundations presentation: deck tiles,
chapter links, visual lesson cards, a two-pane lesson, static exercise-stage
labels beside the title, and previous/next practice navigation. Workflow
Challenges are the ninth tile on the ML deck-selection page. The separate
model index, onboarding panels, branching map and concept shortcuts are removed.

Both learning areas load `foundations/learning-ui.js` and the same editor,
stage and typography styles. It supplies the Python highlighter and stage
markup. Stage labels describe the open exercise; they are not clickable and
do not save progress. Essential syntax, concept recall, file previews, input
schema, setup and workflow evidence contracts stay visible. Hints, optional
stretches, external references and solutions can still be expanded.

Every one of the 81 ML teaching lessons starts with runnable Python and names
the skill being introduced. Fifteen former concept-only introductions now
teach concrete operations, including assignment and column selection, paired
error arithmetic, estimator settings, grid search, neural architecture and
loss attributes, PCA transformation, candidate dictionaries and schema checks.
Existing interpretation exercises reinforce these Python concepts. The eight
decks retain 104 cards and 292 exercises, followed by 19 independent workflows
covering all 17 playground models. Follow starters run as supplied; later
practice and complete workflow challenges require the learner to write code.

ML lesson-library cards now have concept thumbnails. Data Foundations shows
its operation-specific diagrams in Inspect and Wrangle lessons as well as
Visualise, including stage-specific recall diagrams. All diagrams remain SVG
for sharp labels and responsive rendering. Mobile diagrams scroll within their
own container rather than widening the page.

## Workflow source and maintenance

`scripts/sync-ml-workflows.mjs` exports preparation and estimator code from
`ml-app.js`'s `routeForSelection`, the same source as ML → Workflow. Python
authoring reads the reviewed `ml-learning/playground-workflows.json` snapshot.
Both the build and curriculum checks reject a stale snapshot. After changing
the playground, regenerate it, review the resulting learning recipes, then
run the checks.

Complete supervised exercises use these recipes, validate initial candidates
before comparing a reference and tuning, and reserve final evidence until
after training-only diagnosis. Challenge briefs display the actual route's
step titles and questions. Semantic checks inspect model-specific preparation
without refitting and accept equivalent transformer grouping names. They
reject omitted KNN scaling, target leakage, incorrect folds and premature
final-test use. Discovery keeps its own clustering/PCA sequence.

The linear checkpoint now preserves numeric units and uses a dropped category
reference, matching the playground. PCA's two-axis view uses independent
copies so changing its sign convention cannot mutate the retained scores or
fitted axes.

## Verification

- Curriculum, prerequisite graph, all 17 model families and 19 challenges.
- All 212 runnable ML activities in native Python and real Chromium/WebKit
  Pyodide; semantic negatives, equivalent answers and repeated-run cleanup.
- Every ML card/challenge route at six widths and both themes; keyboard escape,
  code highlighting, visible syntax, static stage labels and no saved learning.
- All 324 Data Foundations teaching panels at desktop and 320px; all 106 cards
  and 324 diagrams checked for geometry, stage alignment and both themes.
- ML visual audit: all 81 teaching concepts, 249 captures and four real fitted
  output figures. Shared learning styles checked in built and file previews.

This work changes local source and its local preview. It does not deploy the
site or alter the separate playground workflow interface.
