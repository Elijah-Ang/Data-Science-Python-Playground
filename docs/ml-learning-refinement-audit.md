# PR #48 refinement audit

Scope: existing 81 teaching cards, 14 reviews, 9 checkpoints and 19 independent Workflow Challenges. The prerequisite graph, challenge IDs and 17-model coverage are preserved. Counts are calculated from the registry; this editorial pass adds/removes no exercises (241 teaching + 42 review + 9 checkpoint = 292, plus 19 challenges).

## Syntax and fading

`syntax_parts.py` supplies explicit `{code, meaning}` entries for every Python teaching card (and the W11 syntax-reading concept). Each code fragment must occur in the displayed snippet; meanings cannot duplicate the conceptual explanation. Four previously prose-only/incomplete snippets were made concrete. The renderer shows syntax parts and worked examples in Follow, collapses both for Change, and collapses syntax while omitting the worked example for Transfer. Supplied data, setup access and the explicit task remain available. Concept interactions retain their existing pattern.

## Task and help review

All 311 activities were reviewed against their tasks, input population, setup, output contract and runnable answer. Five explicit editorial TSVs provide task-specific Think, Tools, Approach and rationale text; missing or duplicate entries fail authoring. Conceptual explanations that already answered the actual scenario are retained. Challenges retain their custom hints and now have expanded step rationales instead of repeating their Approach hint. Reviews use retrieval-oriented support for the changed population/scenario.

Corrections include city-level versus individual causal interpretation in R-R1, distance importance in C-R3, and six tasks that now accurately say to inspect/use already supplied fitted objects rather than claiming that learners must fit them themselves. Solutions remain complete and runnable with the displayed setup. Hints identify reasoning and relevant APIs without supplying the full answer code.

`ml-learning-help-review.json` fingerprints every activity's task, hints, solution, rationale, setup, checks, output contract, syntax, example, prerequisites and surrounding brief. It also fingerprints fixture and preview/input definitions. CI rejects any changed inputs until the affected content is reviewed and the explicit `--record` audit is updated. Fingerprints establish review freshness, not automated proof of pedagogical quality.

## Prepared challenge inputs

Each challenge loads `data/ml-learning/ML-Xnn.csv`; `ml-learning/inputs.json` records exact SHA-256, row count, column order, inferred dtypes, delimiter, target, preview and original-source hash (UTF-8 with LF-normalized line endings, independent of Git checkout settings). Original datasets remain separate provenance links. The generator's `--check` reconstructs every asset, and `test_ml_learning_inputs.py` independently decodes and checks all 19 contracts.

Wine600 is the exact fixed deduplicated sample. Gapminder is the prepared 2007 country population. Seoul is already chronological. Candy popular is explicitly derived at winpercent >= 50: X10 deliberately retains the forbidden source for its leakage task; X12 removes it. Discovery inputs contain measurements only. Ward's file contains all 569 five-feature observations because constructing the reproducible 500-row sample is explicitly part of that task. No interpretation-only labels are needed by these briefs, so none are supplied.

## Grouped briefs and final-test discipline

Supervised briefs show four task groups: Data boundary, Validation & selection, Diagnosis, Final evidence. Time, neural and ablation summaries explain their particular evidence. Clustering/hierarchy/PCA use corresponding population, comparison, representation/profile and interpretation groups. Every original semantic check is assigned exactly once and remains visible as a granular result within its group.

The trace rejects untouched-final confirmation after a subsequent fit, fit_transform, parameter change, search/CV/OOF activity or declared candidate-selection assignment. It also rejects switching fitted prediction objects and changed repeated predictions. Trusted validator prediction checks run outside learner instrumentation. Additional metrics, tables and exports from the same saved final predictions remain valid. Between-run exposure warnings remain in place. Native and real-Pyodide tests include predict → fit another candidate on training rows → predict final rows again, preparation refits, parameter changes, candidate replacement and pre-fitted candidate switching.

## Navigation and build

ML carries `aria-current="location"`. Challenge breadcrumbs are exactly “Machine Learning / Workflow Challenges / ML-Xnn”; the shared Data renderer keeps its prior hierarchy. Browser contracts assert both. The normal build requires Python 3.10+ standard library and Node 22+, documented in README; `PYTHON` can override the authoring executable and Windows defaults to `python`.

Detailed evidence: [prepared input inventory](ml-learning-input-inventory.md), [cold-start measurements and package decision](ml-learning-startup.md), [complete visual/contact-sheet review](ml-learning-visual-audit.md), and [registry-derived prerequisites/counts/model coverage](ml-learning-registry-audit.md). Hosted results are attached to the PR at its final head; the full production route audit must be explicitly dispatched with full_runtime=true before marking it ready.
