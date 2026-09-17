# Data Foundations progression revision

Implemented 17 September 2026 across 89 ordinary lessons and 17 review/checkpoint cards (324 exercises). Published lesson IDs are retained.

The subsequent [practical review](foundations-practical-review.md) replaces the artificial prediction tasks, refines the full curriculum and adds consistent formatting and editor indentation.

## Teaching changes

- Follow introduces one technique with a partial starter and a misconception-focused hint.
- Change adapts a requirement, changes a representation or adapts an input format.
- Transfer selects, combines or interprets previously introduced skills. Canvas setup uses one exercise and is reused in later chart tasks. Interpretation is a follow-up to practical outputs.
- Any additional syntax needed for these rounds is explained in a visible “Tools for these exercises” section. Inspect precedes Wrangle, and both precede Visualise.
- Task requirements remain explicit. Transfer accepts equivalent result-producing methods; the join-cardinality task explicitly practises `merge(..., validate="many_to_one")`.
- Open reflections are clearly identified as learner reflection. Python comments can record observations; the checker does not claim to grade their prose.

## Learning interface

- Visualization begins with choosing a chart, Figure/Axes, basic scatter, labels, histogram and category counts.
- Four core chapters end at the report checkpoint; three optional chapters use a separate Next/Previous sequence. Every card remains directly accessible.
- Checkpoints use numbered requirements. The weather report compares mean temperature rather than summing temperatures.
- Checkpoint hints give an actionable next step instead of referring to a hidden worked example.
- Mobile learners can jump directly to the editor. Chart instructions say to display charts, and each exercise explains final-expression output and fresh-data execution.
- Existing no-saved-learning/no-progress-tracking behavior is preserved.

## Verification

The implementation is covered by `npm run check`, the full 324-solution Foundations runtime suite, negative-answer and alternate-solution regressions, and the Foundations browser suite. The browser suite includes full 324-solution execution in Chromium, responsive checks in Chromium and WebKit, real Python restart/recovery, exports, numbered tasks, inspection feedback, editor focus and core/optional navigation.

Final results: `npm run check` passed; all 324 solutions passed locally and in Chromium/Pyodide; the Chromium and WebKit browser journeys passed. `git diff --check` also passed.

Checker regressions specifically cover CSV separators and first-five previews, missing counts versus percentages, eligible-row selection, held-out scaling, equivalent plotting APIs, absent categories, zero bar baselines, and rejection of the old temperature-total solution.

See [the per-exercise review](foundations-task-clarity.md) for every revised task. The task and visual fingerprints were renewed after authoring and checking the changes. These tests establish executable correctness and interface behavior; they do not replace observing learners use the material.

Implementation is local to the repository; publication is a separate action.
