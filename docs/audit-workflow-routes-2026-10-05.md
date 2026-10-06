# Workflow and generated-route audit — 5 October 2026

This audit runs in the isolated local candidate. It makes no original-repository edits, Git writes, commits, pushes, deployment, or external assignment submissions. It preserves the 30 workflow IDs, all Data guide IDs, the existing source/state architecture, and unrelated `* 2.*` files. No learning persistence is introduced.

## What was reviewed

Every Data Workflow challenge was reviewed across its task, supplied input, field/unit descriptions, prerequisite links, three hints, model solution, explanation, alternative, named deliverables, and grader. Each has an executed, meaningfully different valid Python solution, a plausible semantic near miss, source mutation checks, and wrong/missing named-output checks. Exact output identifiers remain explicit in the UI.

The Data playground has 131 guide tasks: Seoul 32, Candy 33, Gapminder 33, and Wine 33. The ledger includes the current task question, hint, guide, code, prerequisite chain, data scope, and actual `Do` / `Look for` brief where present. Data is an editable notebook with no answer grader. It is tested as execution plus data-isolation/state contracts, never described as grading a learner's answer.

Statistics also has no answer grader. Its notebook generates task steps from study controls, executes editable code, and checks scientific input/output contracts. The exhaustive **finite** control audit includes disabled combinations: 6,945 configurations, 3,462 accepted and 3,483 rejected. Accepted routes contain 21,330 primary step instances and 264 Advanced calculation surfaces. A separate 32 representative continuous/boundary cases accepts 15 configurations with 94 primary steps. Thus the per-unit execution ledger has **21,688 surfaces**. Continuous inputs are unbounded; this is not exhaustive continuous coverage. Repeated generated code is retained under its distinct study configuration, not removed as an accidental duplicate.

## Repairs and preserved contracts

- IC01 now checks that the full CSV-loaded `df` remains available and unchanged. It previously accepted correct metadata followed by shortening or deleting `df`.
- Every source table is checked exactly, including values, columns, row labels and dtype. Approximate numeric comparison remains available for computed outputs.
- WC08 explicitly requires `combined` and `record_count`, rename of `duration` to `minutes`, numeric conversion, every source row, `df` column order, and unchanged `df` / `second`. Its hints and feedback now match that contract. No output row-order or index requirement was added.
- WC01, WC09 and WC10 feedback no longer introduces alphabetical sorting, row ordering or index resets that their briefs do not require. WC10 still retains the first order identity before price eligibility.
- Frequency plots accept ordinary bars, step/filled-step histograms and stairs, with either orientation and matching axis labels. All eligible observations, contiguous intervals, correct counts, at least two intervals, and zero frequency baseline remain required. Existing zero-baseline requirements are now stated in the briefs.
- Grouped points drawn with `Axes.plot(..., linestyle='None')`, chronological Pandas date plots, and benchmarks drawn using explicit date endpoints are accepted when their evidence is equivalent.
- Invisible named Figures, invisible connections, transparent bars, individually hidden observations, cropped evidence, incorrect units/axes, wrong populations, artificial zero replacements and corrupted exports are rejected. A transparent figure background remains valid when its plotted evidence is visible.
- The visible named Figure is drawn before chart inspection. The older browser Matplotlib otherwise leaves category tick text blank until the first draw, falsely rejecting four valid alternatives that omit `tight_layout()`. Category/value coupling, counts and zero baselines remain exact semantic checks.
- Challenge PNG capture uses an explicit execution hook shared with Foundations. The Foundations reset of `Figure.savefig` remains intact and no longer overwrites the challenge's export capture.
- The challenge integration baseline was refreshed to the **reviewed new** Foundations hash `1e2bedb1740b2f306c99a6c86bbc1a9d6e3f47c31aa6b597725cfeba55ee95d5`, with all 106 cards and 324 stable exercise identities preserved. This is an authorized reviewed content update, not a claim that the older curriculum is unchanged.

The parent applies the Data playground fixes: scope/row-unit wording, a genuine one-type wine filter, correct price-percentile language, and visible same-cell previews for all isolated Wrangle transformations. Frequency-table and count-plot titles now distinguish their purpose. The missing-data guide describes missing values in the selected field, including numeric measurements. The duplicate-copy teaching sample uses a synthetic record ID to retain all 20 original source records and remove only the two introduced copies. Wine already had two identical measurement rows in its first 20 records; whole-row duplicate removal previously removed those source-record identities too. Data code retains its existing fresh-data isolation. Statistics recipes, sample/resample counts, seeds, numerical methods and backend content remain unchanged.

## Executed evidence

- Expanded workflow semantics: **279 / 279** expected acceptance/rejection cases pass, including 30 meaningful alternatives and 30 semantic near misses. Independent extra fixtures distinguish first authoritative copies, identity-before-eligibility, unrelated punctuation and retained unknown measurements. Ten hidden-Figure cases and four chart-only wrong-category mappings verify their individual figure results.
- Existing workflow reference/adversarial suites pass; the JavaScript metadata/prerequisite/baseline guard passes.
- Existing Data runtime suite: 262 fresh/after-route task scenarios plus index, aliases/reset, schema, display/stream and isolated-data checks. The final source snapshot retains 254 unchanged canonical scenarios and replaces eight affected scenarios with passing final known-copy checks; eight additional read-only captures verify all original records, exact values/types and route frames. All 20 isolated transformations show same-cell evidence, and all 131 content checks are clean. Twelve meaningful alternatives across the four datasets compare 42,560 full result rows and all columns; these audit comparisons do not add a learner-facing answer grader.
- Existing Statistics native suite: **64 tests pass**, with independent numerical oracles and rendered figure tests.
- Exhaustive Statistics finite audit: original 1,999 bootstrap and 9,999 permutation resample counts; no numerical mocks or reduced resampling. Confidence, group-swap, correlation-swap and factor-order invariants pass.
- The final served workflow suite **passes 139 / 139 in Chromium and 139 / 139 in WebKit** on bundle `3b17072a…`, with exact runtime, registry and curriculum preflight comparisons. The preserved `d5405929…` results are 131 / 135 per engine: four valid chart alternatives were falsely rejected before the first-draw repair. Actual-worker diagnostics and a separate 14-case candidate compatibility probe record the repair; those earlier records remain distinct.
- Real-Pyodide Data worker audit **passes in Chromium and WebKit**, with 172 worker executions per engine: every one of the 32 optional Wrangle outputs, including all 20 dataset-specific transformations, and 12 meaningful full-frame alternatives comparing 42,560 rows. Authored visibility code runs unchanged through the UI. Comparison runs append only read-only full-frame hashes and metadata, and verify exact route-data isolation. This Data run used bundle `b1b14513…`. The final read-only component witness checks all 131 current task contracts, Data runtime and CSVs against that tested snapshot; it does not repeat all 172 worker executions or claim the whole HTML/UI file is unchanged.

The Statistics permutation pass disables stage rendering to enumerate scientific execution efficiently. Native figure tests and final browser review provide separate rendering evidence.

## Reproduce

```sh
node tests/test_workflow_challenges.mjs
python3 tests/test_workflow_challenges_audit.py
python3 tests/test_workflow_challenges_semantics.py --output /path/to/review
python3 tests/test_data_runtime.py
python3 tests/test_data_guide_identity.py --output /path/to/review
python3 -m unittest discover -s statistics/tests -p 'test_*.py'
python3 statistics/audit/routes.py --workers 4 --output /path/to/review/statistics-permutations
python3 tests/test_workflow_challenges_semantics_browser.py --base-url http://127.0.0.1:8162 --engine chromium --output /path/to/review/browser
python3 tests/test_workflow_challenges_semantics_browser.py --base-url http://127.0.0.1:8162 --engine webkit --output /path/to/review/browser
python3 tests/test_data_guide_worker_browser.py --base-url http://127.0.0.1:8162 --engine chromium --output /path/to/review/browser
python3 tests/test_data_guide_worker_browser.py --base-url http://127.0.0.1:8162 --engine webkit --output /path/to/review/browser
```

Local review artifacts are under `auto-run-audit/workflow-audit`: `workflow-coverage.json/.csv`, exact `workflow-executions.json`, `data-guides-coverage.json/.csv`, `data-guide-executions.json`, `statistics-step-coverage.json/.csv`, the code keyed by hash in `statistics-task-code.json`, rejected-design evidence, numerical audit results, commands, logs and summary JSON. PASS means a check actually ran and matched its declared expectation. NOT RUN is used for unexecuted alternatives, near misses, or nonexistent answer graders; it is not replaced by a fabricated passing grade.
