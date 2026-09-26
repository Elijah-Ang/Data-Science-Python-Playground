# Machine Learning exercise clarity audit — 26 September 2026

## Scope and method

Reviewed the assembled learner content for all **110 cards, 327 Learn/Refresh exercises** (213 Python, 47 decisions, 67 reflections), and **19 workflow challenges**. For each activity, compared the displayed task with the reference answer, checked outputs, explanations and hints. Searched the full inventory for hidden dictionary keys, ordered lists, vague output formats, unspecified source values, and requirements that the checker did not enforce. Read all 19 challenge briefs and deliverable groups against their checks. Executed all **232 Python reference answers**; negative checker cases cover representative wrong values and scientifically equivalent alternatives.

## Findings and fixes

| Pattern | Examples | Change |
| --- | --- | --- |
| A prompt asked for values but grading required an unstated container or key. | `ML-W10-1` required `answer['fit_intercept']`; `ML-R02-1` required `answer['RMSE']`; `ML-C14-1` required `answer['leaf']`; `ML-P04-2` required decimal dictionary keys. | Replaced 13 authored cases with named outputs, plus the copied `ML-P-R1-1` retrieval case. The prompt now names each checked result. |
| The prompt implied a supplied example or result, but the reference created values that were never stated. | `ML-F06-1`, `ML-M02-1`, `ML-M03-1`, `ML-M04-1`. | Stated the data directly in the task. Removed the extra `role` column from the `ML-M03-1` evidence table. |
| A term or instruction hid a concrete Python result. | `ML-R08-1` asked for “expanded training dimensions” but returned x and x² columns; `ML-C05-3` asked for “coefficient dimensions” but required a class-by-feature table; `ML-C02-3` said “explicit order” without saying A then B. | Named the rows, columns, order and output only where they matter to the learning goal. |
| A checker accepted any result with plausible shape. | `ML-C14-1` accepted an unrelated positive leaf ID; `ML-U06-1` accepted three arbitrary finite inertia values; `ML-U07-1` accepted any matrix of the right shape. | Compared results to the relevant fitted estimator or supplied evidence, while allowing equivalent cluster labels for the Ward cut. Search exercises now verify reported scores match the fitted search. |
| A challenge deliverable and checker disagreed. | `ML-X18` asked for silhouette evidence across cuts 2–8 but never checked `cut_evidence`. Plots in `ML-X17`–`X19` were phrased as mandatory while grading focused on numeric evidence. | Added the cut-comparison check and described plots as optional aids to interpretation. Discovery policy text now describes discovery inputs instead of generic target-leakage rules. |
| The explained solution carried Playground-only display code and unrelated output. | `ML-X01` included five unused feature lists, bare `preprocessor` and `pipeline` displays, broad imports, a printed summary and an empty `loss_curves`. | Removed display-only and unused recipe statements, trimmed imports and omitted `loss_curves` from non-neural supervised briefs. `ML-X01` went from 91 to 61 lines; `ML-X02` from 122 to 72. The model, validation, diagnosis and final-test steps remain. |

## Editorial rule used

An exact variable name or order is stated when the checker relies on it. Class and feature order remain explicit because they attach values to meanings. Arbitrary presentation order and containers are not imposed for two independent scalar results. Tasks name the population, output and purpose in plain language; hints and reference answers use the same contract.

Complete workflow challenges still have longer references because they implement an entire split, validation, diagnosis and final evaluation. Their variable contracts are visible alongside the brief, and alternative model nominations remain self-reviewed rather than tied to the reference choice.
