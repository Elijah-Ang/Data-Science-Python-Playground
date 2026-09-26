# Exercise clarity audit and implemented fix plan — 26 September 2026

## Coverage

The review covers every exercise and workflow challenge in Data Foundations and Machine Learning Learn / Refresh: **324 Foundations exercises**, **30 Foundations workflow challenges**, **327 ML exercises**, and **19 ML workflow challenges** (**700 activities total**). It compares learner wording, reference answers, hints, and grading rules. Supplied screenshots were used to locate examples; their text was treated as evidence, not as new product instructions.

The detailed findings are in the [Foundations exercise audit](audit-foundations-exercises-2026-09-26.md), [Foundations workflow matrix](audit-foundations-workflows-2026-09-26.md), [ML exercise and challenge audit](audit-ml-exercises-2026-09-26.md), and [site UI audit](audit-site-ux-2026-09-26.md). The per-activity review ledgers and executable test suites are in the repository.

## Fix plan and implementation

| Step | Rule | Implemented change |
| --- | --- | --- |
| 1. Make the requested evidence concrete | State the population, calculation, result type and required variable names in plain language. Name the Python operation when a vague term hides a simple concept. | Replaced “dimensions” with row/column shape and `df.shape`; rewrote vague category, numeric profile, and ML output prompts. |
| 2. Make the reference direct | Prefer the shortest clear method that expresses the intended calculation. Keep dataset setup separate from the learner answer. | The stock category comparison uses `pd.crosstab`; dtype practice uses `df.dtypes`; challenge answer panels now show answer lines first and place supplied setup in a closed disclosure. ML workflow references lost unused and display-only statements. |
| 3. Align Check answer with the brief | Compare labelled summaries by labels and values, and records by stable keys. Check order only when rank, time, source sequence, or an explicit lesson calls for it. | Removed incidental alphabetical rules from category summaries and charts. Added positive and negative equivalence tests. Strengthened ML checks that previously accepted shape-only results and checked a missing challenge deliverable. |
| 4. Make every learning screen easier to scan | Use one question heading, visible output contracts, concise success feedback, readable code, accessible focus, and setup on demand. Apply those choices through shared components. | Updated shared Data/ML practice styles, Data challenge presentation and ML lesson rendering. Reviewed the Learn hub and Data, Statistics, and ML playground shells at desktop and phone widths for consistency and overflow. |
| 5. Keep the audit reproducible | Execute every reference and run adversarial examples for the revised checks. Refresh review fingerprints after content and UI changes. | Foundations and workflow runtime suites, ML content/reference suites, browser layout checks, and the full web build are the release checks for this pass. |

## What counts as a real requirement

An order rule remains when it changes the interpretation of an answer: months in calendar order, observations in time order, highest-to-lowest ranking, a contractually ordered table export, or a lesson that is explicitly about sorting. A category summary or bar chart is judged by each category’s correct value even when categories appear in another order. The checker still rejects missing categories, wrong values, altered source data, and missing named outputs.

The most visible pattern was a mismatch between the work the learner needed to do and the detail presented around it. In Foundations workflows, 17 of 30 briefs or checks needed changes. The challenge solution renderer had shown full fixture setup for all 30, making a short answer look long. In ML practice, the shared page repeated the opening task sentence in 226 non-Follow activities and showed 79 supplied setup blocks before the learner reached the hints. Shared UI changes address those patterns across the corresponding decks.

## Verification completed

- `npm run check` passed the web build, JavaScript checks, route checks, ML content and receipt audits, and app-shell checks.
- `npm run check:foundations` executed all 324 Foundations reference solutions and semantic negative/equivalence cases.
- `npm run check:workflows` executed all 30 Foundations workflow references and independent, adversarial, export, and chart checks.
- `tests/test_ml_learning_runtime.py` executed all 232 runnable ML activities, including the 19 workflow challenges. ML semantic, vertical, and mastery suites passed.
- Chromium and WebKit checks at desktop and phone widths passed for the revised challenge and ML exercise presentation. The Learn hub and Data, Statistics, and ML playground shells had no page-level overflow or script errors in the route scan.
- `git diff --check` passed. No learning state, drafts, resume records, completion history, or progress tracking were added.
