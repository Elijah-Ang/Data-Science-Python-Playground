# Data Foundations Learn and Refresh exercise audit — 26 September 2026

## Scope and method

Reviewed all **324 exercises** in the **106 cards** of Inspect (83 exercises), Wrangle / Preprocess (111), and Visualise (130), including the 17 Refresh cards. I read the final learner task, hint, reference solution, and answer contract for each round. The per-exercise review ledger is [`foundations-task-review.json`](foundations-task-review.json); its 324 fingerprints were renewed after this pass. The screenshots supplied by the learner served as examples to investigate, not as instructions to the application.

The audit asked four questions of each activity: Is the output plain from the task? Does the reference use a direct method for that output? Does Check answer accept equivalent labelled evidence? Does a stated order, display step, or code shape actually support the lesson? I kept order when it expresses ranking, time, the source record sequence, an explicitly taught sort, or an output column contract.

## Findings and action

| Area | Exercises | Finding and resolution |
| --- | --- | --- |
| Opaque shape language | I03-3, IR1-2 | “Dimensions” could mean several things. The task now names the full table shape, the row and column counts, and `df.shape`. |
| Unnecessary preview | I05-2 | Taking `head(3)` before `.dtypes` suggested that the first three rows determine column types. The task and answer now use `df.dtypes` directly. |
| Vague output contract | I22-1, I22-3 | “Column-quality DataFrame” became one row per original column with `dtype` and `missing` fields. The grouped output names temperature and humidity columns; category row order is incidental. |
| Incidental category order | I19, I20, W19, W21, W23 and their Refresh copies | Group summaries, crosstabs, and pivots are checked by category labels and values. The task no longer asks for alphabetical groups. Checks still reject missing or extra categories and values attached to the wrong labels. Required output column order remains explicit. |
| Incidental bar order | V08, V09, V29, V36-2/3, V37 and Refresh copies | The category bar tasks now ask for the right values and labels without requiring alphabetical order. Chart checks compare label-height pairs in either order. V36-1 still asks for highest mean first; V08-2 still specifies a sequence including a zero-count category. |
| Repeated instructions | 18 short data tasks and shared chart tasks | Removed repeated “leave the DataFrame/Series/tuple as the final expression” where the editor already gives that instruction. Prior chart boilerplate was shortened in the shared teaching pass, keeping `plt.show()` guidance at the editor. |

Thirty-seven final task wordings, two direct references, 14 plot contracts, and 14 labelled-table contracts changed in this pass. Those counts are field changes, not 67 distinct defects; a single exercise can appear in multiple counts. The complete 324-solution runtime suite passes after the changes.

Some order requests remain for a reason. I12 teaches multicolumn sorting; W15-3 places months in calendar order; W31 specifies an ordered billing handoff. V10–V14 use the same first-appearance category order across related game plots so the display stays comparable while learners practise different chart types. Chart titles, axis labels, baselines, and requested mark types remain checked.

## Checker evidence

Added positive and negative tests for reordered crosstab/pivot rows and columns, grouped tables, and category bars. A reordered answer passes only when its labels retain the correct values. A missing category, swapped value, wrong grouping calculation, or incorrect bar height still fails. The existing suite executes all 324 reference solutions and checks wrong methods, changed data, chart semantics, and recovery after Python errors.

The Data Foundations workflow challenges have a separate [all-30 audit](audit-foundations-workflows-2026-09-26.md). The shared learning interface has a separate [UI audit](audit-site-ux-2026-09-26.md).
