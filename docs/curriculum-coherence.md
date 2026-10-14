# Lesson presentation update

The latest requested layout applies across Data and ML lessons:

- Reference and its rendered contents are removed. The actual dataframe table remains visible, including supplementary input tables where used.
- The task descriptor sits on the left immediately below the dataframe table. Python editors and outputs occupy the right pane. Lessons without a dataset place the task below their concept visual.
- Follow code has no changed-line or special token emphasis. Normal Python syntax colours remain.
- Inline snippets under “What the syntax does” and “Arguments” both use 16px monospace text.

Hint and Solution remain as the two closed help rows. Original stage indicators and independent desktop scrolling are retained. Phone layouts stack the lesson and editor naturally. The same task position is used by the independent briefs that share these panes.

Exercise programs, datasets, scientific grading and authored curriculum files are unchanged by this layout update. The reference explanations are deliberately absent from the rendered lessons, as requested.

## Current review evidence

- [Data: 676 lesson views](curriculum-evidence/task-layout-data.json).
- [ML: 676 lesson views](curriculum-evidence/task-layout-ml.json).
- [All 1,352 responsive renders, actual independent wheel scrolling, editor interactions and matching snippet sizes](curriculum-evidence/task-layout-responsive.json).
- [Focused teaching/code checks](curriculum-evidence/task-layout-focus/after-layout.json).
- [Self-contained preview: isolated assets, opaque viewer, real Data/ML Python runs](curriculum-evidence/task-layout-preview.json).
- [Refreshed ML visual audit](ml-learning-visual-review.json).

Actual desktop screenshots show the dataframe and task in the left pane:

| Data | ML |
|---|---|
| [Group and aggregate](curriculum-evidence/task-layout-after/W19-dataframe-task-desktop.png) | [Regression workflow](curriculum-evidence/task-layout-after/ML-F11-dataframe-task-desktop.png) |

The remaining desktop/phone captures are in [task-layout-after](curriculum-evidence/task-layout-after/). Earlier receipts and screenshots record the earlier presentation and are retained as historical evidence.

The implementation is on `curriculum-coherence-2026-10-13`; no publication or merge has occurred. Chromium was checked locally; WebKit and physical-device checks remain CI/manual coverage.
