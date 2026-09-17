# Practical exercise review — 17 September 2026

Reviewed all 106 cards: 89 concept lessons and 17 reviews/checkpoints. The curriculum now contains 324 exercises; Figure/Axes setup has one exercise and is reused in subsequent chart lessons instead of adding two canvas-only variations.

## What changed

- First-look inspection precedes CSV loading. CSV Follow imports a table, Change handles a real semicolon-separated file, and Transfer imports a new file and inspects five rows. The six-record fixture makes an incorrect full-table answer observably different.
- Early schema work combines import, preview, row counts, labels and dtypes. Removed guessed row counts, dictionary-wrapped predictions, and typing `None` instead of inspecting data.
- Construction uses supplied lists; naming exercises use meaningful export fields. Copying, filtering, sorting and unit conversion prepare actual handoffs. Category recoding preserves real categories instead of renaming animals “Featured”.
- Batch concatenation now includes repeated source indices, so preserving versus resetting them makes a visible difference. Missingness, raw-value preservation, join coverage and held-out scaling retain explicit analytical requirements.
- Inspection checkpoints now cover a general profile, a selected student population and a station-specific grouped summary. Cleaning checkpoints cover a general clean table, an import audit retaining raw prices, and a billing export with a stated discount policy.
- Replaced literal-answer coding tasks with useful outputs: filtered correlation matrices, outlier review tables, selected-population charts, reference lines, exports and fair comparisons. Interpretation remains an explicitly ungraded reflection. Chart-choice questions remain genuine decisions about variable types and the question.
- Catalogue-price charts use means; sales-order amounts and tips can use totals. Weather and game-duration report summaries use means. Log-scale practice now has request counts spanning orders of magnitude. Raw points replace inappropriate letter-value tail summaries on tiny samples.
- Colour mapping is introduced before additional scatter encodings. Optional distribution/model charts remain exploratory demonstrations, with limits of tiny samples stated. They do not imply population inference.

## Review standard applied to every exercise

1. The requested output answers an inspection, cleaning, reporting or chart-design question.
2. The data and required result are explicit. An added requirement changes the result or the analytical decision.
3. Earlier tools are combined where useful. A new parameter is explained in the lesson or its visible tools before it is required.
4. Follow can constrain the API being taught. Transfer accepts equivalent result-producing code, except explicitly practising join validation.
5. Syntax/setup/examples and reference answers agree. Formatting is checked without changing the Python AST.
6. Reviews retrieve earlier skills; checkpoints combine skills under distinct policies. These are practice tasks, not claims about statistical evidence from small synthetic datasets.

The complete effective prompts, hints and formatted answers are in [the exercise review](foundations-task-clarity.md). Each exercise has a task/solution/data fingerprint in [the review ledger](foundations-task-review.json), and visual fingerprints are retained separately.

## Formatting and editor

`scripts/format-foundations.py` uses Black 25.1.0 with an 88-character target. Multi-entry dictionaries use one field per line, four-space indentation and normal comma/colon spacing. Imports are separated from operations. It checks AST equivalence and generates the committed `foundations/code-style.js` adapter, used by both the browser and runtime tests. Regenerate after content edits; `--check` verifies it is current. It also covers starters, setup snippets, worked examples and isolated syntax.

Tab inserts spaces to the next four-space stop or indents selected lines. Shift+Tab outdents. Native insertion retains undo. Escape followed by Tab or Shift+Tab leaves the editor, with the shortcut documented visibly and in accessible help. No learning-state storage was added.

## Reference and verification

The handbook is used for conceptual ordering and correctness, with current project APIs checked by execution rather than copying old-version syntax:

- [Indexing and selection](https://jakevdp.github.io/PythonDataScienceHandbook/03.02-data-indexing-and-selection.html): distinguish table/Series selection, labels/positions and Boolean filtering.
- [Aggregation and grouping](https://jakevdp.github.io/PythonDataScienceHandbook/03.08-aggregation-and-grouping.html): choose reductions that answer the question and combine grouping with selection.
- [Matplotlib introduction](https://jakevdp.github.io/PythonDataScienceHandbook/04.00-introduction-to-matplotlib.html): build figures, display them and export useful results.

Automated checks cover every reference solution, incorrect and equivalent answers, actual browser Python execution, solution formatting and editor keyboard behaviour. These establish correctness and basic usability; observing learners is still needed to assess teaching effectiveness.

Validated locally: `npm run check`; 324/324 Python reference solutions plus negative/equivalence tests; 324/324 Chromium/Pyodide executions; Chromium and WebKit learner journeys including editor keys; 106 cards and 324 round diagrams across responsive layouts; AST-preserving formatting check.
