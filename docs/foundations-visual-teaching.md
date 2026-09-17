# Visual teaching panels

The left-hand material covers every current exercise: 106 cards and 324 rounds across Inspect, Wrangle and Visualise.

`foundations/teaching.js` owns concise, authored concept summaries, input/operation/result flows, and visible cautions. Round-specific flow overrides cover changed workflows such as CSV intake, sampling, missing percentages, eligibility checks and cleaning handoffs. Retrieval exercises link back to the concept they actually retrieve.

Follow contains an enlarged illustrative diagram, a short explanation, a three-part operation flow and a visible “Remember” note. Existing detailed explanations remain available under “More detail”; prerequisite tool notes remain visible. Syntax tokens and their meanings are grouped into readable cards. Chart choice shows all four alternatives instead of displaying only the answer's chart.

Change, Transfer and retrieval practice start with the current scenario/task, the available inputs and concise requirements. They do not repeat Follow's diagram, explanation, syntax cards or worked example. A link leads back to the concept lesson when needed; supplementary tools and hints remain optional.

`foundations/workspace.js` assembles visible, editable setup followed by the starter. Dataset creation, imports and auxiliary tables execute as part of the learner's code, not as hidden runtime setup. CSV files are supplied as files; learners still load them. Construction exercises do not receive a completed table. Run uses a fresh namespace, Reset restores the entire setup/starter, and Jump to your work moves the caret below supplied setup. Reference answers retain a separate namespace for checking.

The presentation review used the Python Data Science Handbook's [indexing examples](https://jakevdp.github.io/PythonDataScienceHandbook/03.02-data-indexing-and-selection.html), [pivot-table workflow](https://jakevdp.github.io/PythonDataScienceHandbook/03.09-pivot-tables.html) and [scatter-plot demonstrations](https://jakevdp.github.io/PythonDataScienceHandbook/04.02-simple-scatter-plots.html). These are worked notebook examples rather than a graded Follow/Change/Transfer sequence. The adopted pattern is explicit inputs, a concrete question, executable operations and inspectable results; its historical APIs are not copied into this curriculum.

Diagrams are examples, not exercise answers. They retain accessible text descriptions; the operation flow also works as plain text. The chart-choice grid becomes a single column on small screens. No learning state, draft persistence or progress tracking was added.

Validation:

- `npm run check`, including exhaustive teaching-model coverage and existing curriculum checks.
- `tests/test_foundations_teaching_browser.py`: all 324 panels rendered at 1440px and 320px, with no document/panel overflow or JavaScript errors.
- Existing Chromium and WebKit learning journeys, including keyboard editing and responsive layouts.
- `tests/test_foundations_workspace.py`: all 324 answers run with visible setup; deleted setup fails, edits affect output, and subsequent runs start fresh.
- Screenshot inspection of CSV intake, syntax cards, chart choice and mobile layout.

When adding or changing a concept, update its authored teaching entry and any round-specific route. A missing entry fails the teaching test instead of silently substituting generic prose.
