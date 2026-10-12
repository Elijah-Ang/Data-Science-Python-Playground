# Prerequisite teaching and readable instructions

Candidate basis: `0bfaa7ee4f4d62217e5d57c885a6ba8fa65a6664`, the preserved four-improvement review candidate. Reviewed source date: 2026-10-12 (Asia/Singapore). This additional repair stays at the review stage.

## What the screenshot exposed

The screenshot is V13-3, the Raw points Transfer practice displayed as lesson 09 in the Visualise Core sequence. It is not stable lesson V09. I04 already practised `list(df.index)`. The missing bridge was how a **grouped Series** pairs category labels with summary values, how value sorting keeps those pairs together, and why `.index` supplies chart category order rather than the median numbers.

| Missing bridge | Earlier teaching and practice | Later use |
| --- | --- | --- |
| Series labels versus values and numbered positions | I06S, immediately after I06; three practices | I19S/I19A, V08, V13, V29 |
| Extreme value versus its row label; retrieve both fields from one eligible row | I13L, immediately after I13; three practices | V28 and VR6 |
| Grouped Series; sort statistics, then extract attached labels | I19S, immediately after I19; three practices | V13-3 and V29 |
| Series constructor alignment by label, including a missing report | I19A, immediately after I19S; three practices | I22, W20/W28, V29 |
| Convert dtype descriptions to text without converting original data | Visible I19A-3 worked panel | I22 column-quality checkpoint |

I06S/I19S/I19A are Core. I13L is Go Further, matching its later annotation application. Each new lesson has an explanation, diagram, small result, syntax breakdown, editable setup, hints and distinct Follow/Change/Transfer practices. Earlier-teaching links appear at the later applications. V13-3 also has its own visible worked chain; its genuine `.median().sort_values().index` solution remains intact.

The fixtures distinguish labels from positions and values. Bench median order differs from mean order, alphabetical order and raw encounter order. Alignment inputs use different displayed orders; an absent spot-check stays missing. The eligible extreme differs from the global extreme. These distinctions are tested with valid alternatives and wrong answers, not just a reference pass.

## Broader prerequisite audit

The effective assembled curriculum and all 30 Foundations workflow briefs were inspected, including reference/setup code, visible syntax, local teaching, hints, earlier lessons and retrieval links. An AST attribute inventory is a candidate finder, not proof of adequate teaching. It identified 110 distinct original operations; manual review also checked chains whose individual names were already mentioned but whose object/identity transitions were insufficiently taught.

Additional first-use repairs:

- I06 Change explains `df["reading"]` versus `df.reading`, including property/name collisions and why brackets work for arbitrary column names. This supports the briefs’ dotted column access.
- I16 Transfer’s existing presence-test panel now works through `.notna()` alongside `~.isna()`. Present text still need not be a valid number.
- V04 Change demonstrates `ax.hist` with observations and explicit edges, beside the Seaborn route. It explains count heights, endpoint rules and small-sample limitations before histogram workflow briefs.

Existing adequate teaching was retained: explicit category reindexing/zero completion at V08 Change; normalization axis at V23 Change; figure-level `catplot`/`displot` at V33 Transfer; fit-versus-transform at W28. The lexical scan’s apparent `displot` gap in VR6 was resolved by its actual earlier worked panel, rather than adding duplicate teaching. ML’s existing Python-first introductions, syntax breakdowns, model guides, workflow dictionaries and advisory prerequisite graph remain intact. No new cross-task ML dependency or prerequisite lock is introduced.

## Instructions and exact names

The shared `learning-language.js` renderer covers all **338 Foundations practices, 327 ML practices and 49 independent briefs**. It presents actions as numbered steps, separates sentences and safe action clauses, uses familiar verbs, and offers short task-word explanations. Conditions remain attached to their actions. Numbers, quoted labels, Python expressions, units and scientific limits remain literal. The five-case ML reporting checkpoint has an explicit short-step version that retains all five numerical cases and the required conclusion/limitation report.

WC02 has authored short steps for `eligible` and `invalid`. They state all original columns, `numeric_price`, usable versus missing/unreadable prices, original row order, and original `price` text in both outputs. The numerical-conversion and source-preservation contracts are unchanged.

`code-identifiers.js` now accepts activity-specific authored contexts. `learning-identifiers.js` is reproducibly generated from supplied schemas and reference-code ASTs: **714 activity identities**. It never inspects learner code or stores learner state. Python objects use the inline code box. Table columns additionally use an underline and a descriptive title; the distinction does not rely only on colour. A short key explains the two appearances. `price` and `numeric_price` are both columns; `eligible` and `invalid` are output objects. Common English words need explicit naming cues, so explanatory prose does not become indiscriminately styled. Existing x/y consistency and dimension/hyphenated-word exclusions remain tested.

Static pages and enhanced pages use the same instruction and identifier renderers. Editors, code blocks, attribute values, table data cells and controls are not rewritten by text decoration. All original 326 Foundations activity IDs, 43 Visualise cards/132 rounds, 110 ML cards/327 practices and 19 ML briefs remain. The four new Inspect cards add twelve practices. Statistics Coming soon remains the same button/non-link; its source, Statistics calculations, M03 supplied evidence, background assets, motion, analytics/privacy/ad settings and receipts are unchanged.

## Validation and evidence boundaries

Passed local checks are recorded in `work/prerequisite-audit/`: 338 reference answers; 338 visible-setup runs; 39 focused prerequisite cases; 277 responsibility cases; 210 Visualise cases; 174 variety cases; 73 parameter examples; all 30 workflow references, alternatives and negative/policy cases; curriculum/teaching/identifier/language and static-route contracts. Parameter inventory is now 2,723 occurrences across the same 68 entries because the additional V13 worked chain is included.

Chromium checks cover all 338 teaching states at 1440/320px, all 338 diagrams at three widths, all ML card/challenge routes at six widths with Run/Check/keyboard/state behaviour, route/history navigation, 92 representative language views across desktop/mobile/light/dark, and six no-JavaScript pages. The 665 activity instruction contexts are checked separately from those 92 rendered views; they are not claimed as 665 browser captures. The parameter probe covers 264 round/width states and all 43 static lessons at 320px.

An additional historical expanded audit initially returned 33 failures. Evidence is preserved. Its dictionary corruption raised a Python TypeError; some plot mutations changed `df` after setup had already drawn the marks; alternatives dropped an explicit category order or treated supplied arrays as column-name strings; image cell centres differed from the authored heatmap; and a string decision’s display helper did not leave its requested scalar result. The harness now creates meaningful invalid dictionaries, changes an actual required title for prepared marks, preserves declared orders/arrays, uses correct Matplotlib mesh cell coordinates and retains scalar-result semantics. The product grader was not changed. Final expanded outcomes and exact-commit hosted outcomes are recorded in the handoff receipt rather than inherited from the older audit.

The current executor is restricted despite the parent-observed Full access UI. Initial default-context loopback binding returned `PermissionError: [Errno 1] Operation not permitted`; the build’s Python child spawn returned `EPERM`. Supported per-command allowances and the existing pinned local runtime allow local browser/build checks without changing network, proxy or security configuration. Local WebKit availability and independent final-revision review must be reported separately. Previous baseline independent review is not approval of this new diff. Exact-main hosted `full_runtime=true` remains a later release gate; no merge, deployment, Mac action or AdSense submission is part of this review stage.
