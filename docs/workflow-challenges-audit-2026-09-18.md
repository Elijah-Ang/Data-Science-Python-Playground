# Workflow Challenges — implementation audit

Audited 18 September 2026. Local preview only; no production deployment.

## Baseline and inventory

The pre-implementation checkout of main was 3f5e734654fdf05553d503ee113964d2c1ff713e. The tracked Foundations curriculum matched that commit. Existing IDs and the SHA-256 of the complete serialised curriculum are recorded in challenges/foundations-baseline.json. The inventory is derived by executing the curriculum and challenge registries, not by assuming a historical count.

| Deck | Existing cards | Existing exercises | New challenges |
|---|---:|---:|---:|
| Inspect | 27 | 83 | 10 |
| Wrangle / Preprocess | 36 | 111 | 10 |
| Visualise | 43 | 130 | 10 |

- Existing Foundations exercises: **324, unchanged**.
- Existing cards: **106** (89 lesson cards; 17 review cards).
- New Workflow Challenges: **30**, in a separate registry.
- Total executable learning activities: **354**.
- Full curriculum definition hash unchanged: **true**.
- SHA-256: 72b741cb834a0cdb358721557b34670d6934f50ea733db25deda604c55b619fd.

Unrelated untracked duplicate files present before implementation were left untouched.

## Delivered experience

Each deck now has Lessons & Reviews / Workflow Challenges navigation and a separate challenge count. The final core checkpoint links to the collection without entering the ordinary lesson sequence. All thirty challenges are independent and unlocked, with no difficulty categories, saved work, scores, timers or completion records.

Wide case-file tiles use file tabs, deck-colour stripes, folded corners and consistent illustrations for five scenario families. The collection switches from two columns to one on narrower screens. The workspace retains the familiar editor but opens with a question, input previews, explicit deliverables and optional planning. API guidance is confined to deliberately opened Help. Setup is editable in the editor; CSV intake requires the learner to load the supplied file.

Help has distinct Think, Tools and Approach levels plus a separately hidden complete explained solution. Solutions explicitly replace the full script. Prerequisite links live inside Tools. Conceptual tags and scenario illustrations do not identify the solution method.

Check results reports each named deliverable separately. Source preservation is an additional independent policy check. Missing outputs are unavailable, incorrect evidence needs attention, and correct outputs remain identified even if another part fails. Editing marks results as belonging to an earlier run; Run/Reset/navigation clear them appropriately. Checking reveals the results panel without moving keyboard focus. No check result is persisted.

## Architecture and validation

- challenges/registry.js: separate Data collection metadata, thirty authored briefs, deterministic fixtures, prerequisites, policies, hints, solutions and named deliverables.
- challenges/experience.js: reusable createChallengeExperience(registry) presentation factory, receiving collection metadata and workspace/table adapters. No Statistics or ML collections were added.
- challenges/runtime.py: separate run_challenge request path; foundations/worker.js dispatches it independently from existing run_foundation requests. The existing editor and output rendering are shared.
- Structured feedback contains deliverable IDs, labels, statuses and messages. Table checks distinguish meaningful index labels from incidental record indexes; explicit reset-index requirements remain checked.
- Chart checks inspect quantities, eligible observations, axes and bounds. Horizontal/vertical bars, different valid histogram bins, Matplotlib/Seaborn alternatives and modest point jitter are accepted where appropriate.
- Export checks inspect PNG type, resolution, the saved Figure identity, semantic content and label bounds. They do not compare reference pixels or prescribe styling.

The prerequisite audit found that I13 and I20 are optional. IC05 therefore uses core selection, sorting and preview skills; IC09 can construct its cross-tabulation from core group counts and DataFrame construction. Neither challenge requires an optional lesson. An equivalent crosstab solution is still accepted.

## Validation evidence

- npm run check: build, JavaScript checks, baseline definition comparison, curriculum tests, routes and application-shell checks.
- npm run check:workflows: thirty native Python references; equivalent selections, duplicate handling, table construction, alternative chart libraries/orientations, histogram bins and jitter. Negative cases cover mixed results, missing outputs, runtime interruption, invalid types, missingness policy, duplicate multiplication, mutated source inputs, incorrect index labels, wrong aggregation, hidden chart observations and incorrect/missing export.
- Existing native Foundations suite: 324 references plus semantic-negative and recovery checks passed.
- Existing Chromium/Pyodide suite: 324 references passed, with no failures; existing navigation/editor/responsive journeys also passed.
- New challenge browser suites: all thirty references in Chromium and Safari/WebKit; three widths (1440, 834 and 320), both themes, input previews, collapsed hints, keyboard editing, CSV availability, stop/reset, source edits, stale results and reload behaviour checked.
- Screenshot review: desktop case-file shelf, challenge workspace, per-deliverable mixed results and mobile dark-mode collection. Browser evidence is written under tests/evidence/workflow-challenges/.
- CI now runs registry/baseline checks, native challenge checks and the real-browser challenge suite in both browser engines.

## Challenge coverage

| ID | Brief | Scenario family | Taught core prerequisites | Deliverables |
|---|---|---|---|---|
| IC01 | A delivery just arrived | Delivery / logistics | I01CSV, I02, I03, I05 | First look; Dimensions; Column types |
| IC02 | Prepare a focused extract | Delivery / logistics | I07, I11, I12 | Depot handoff; Record count |
| IC03 | Can this report use the data? | Student attendance / study | I16, I11 | Required-field gaps; Eligible records; Excluded records |
| IC04 | Investigate repeated submissions | Student attendance / study | I17, I14 | Every repeated member; Affected submissions |
| IC05 | Who meets both conditions? | Products / sales | I11, I12, I02, I18S | Qualifying shortlist; Units represented |
| IC06 | Understand the category mix | Café / orders | I10, I15 | Morning counts; Morning proportions |
| IC07 | Compare two measurements | Measurements / activity | I18, I16 | Numeric profile; Known measurements |
| IC08 | Compare groups fairly | Student attendance / study | I11, I19 | Comparable population; Group counts; Mean scores |
| IC09 | Where do categories overlap? | Products / sales | I01, I19, I14 | Category combinations; Observed categories |
| IC10 | Brief the next analyst | Delivery / logistics | I03, I16, I19 | Table dimensions; Missingness assessment; Completed-delivery means |
| WC01 | Consistent product names | Products / sales | W01, W09, W10, I14 | Standardised catalogue; Final labels |
| WC02 | Prices that can be used | Café / orders | W12, W01, I16 | Usable prices; Repair queue |
| WC03 | An attendance handoff | Student attendance / study | W14, W16, W06 | Attendance handoff; Excluded records |
| WC04 | Repeated order exports | Café / orders | W18, W01, I17 | Retained orders; Removed copies |
| WC05 | Calculate a useful total | Products / sales | W12, W16, W07 | Priced order lines; Total sales |
| WC06 | Fill only what is justified | Products / sales | W16, W17, W07 | Net order lines; Unpriceable records |
| WC07 | Connect records to a lookup | Delivery / logistics | W24, I17, I16 | Assigned deliveries; Unassigned deliveries |
| WC08 | Combine two batches | Delivery / logistics | W02, W12, W25, W06 | Combined deliveries; Combined record count |
| WC09 | Make repeated measurements usable | Measurements / activity | W22, I11 | Long measurement table; Duration extract |
| WC10 | Prepare a clean handoff | Café / orders | W18, W10, W12, W16, W06 | Billing handoff; Excluded source rows |
| VC01 | Which café category is busiest? | Café / orders | W10, I15, V08, V02 | Drink counts; Figure |
| VC02 | How are delivery times distributed? | Delivery / logistics | W12, W16, V04, V02 | Valid durations; Figure |
| VC03 | Do longer sessions relate to better scores? | Student attendance / study | W16, V16, V02 | Complete pairs; Figure |
| VC04 | What changed over time? | Measurements / activity | W14, I19, V18, V02 | Daily totals; Figure |
| VC05 | Which group has the higher average? | Measurements / activity | W12, I19, V09, V36 | Group means; Figure |
| VC06 | Show a small sample honestly | Student attendance / study | I11, V13, V02 | Attending learners; Figure |
| VC07 | Compare spread, not just averages | Delivery / logistics | W12, W16, V11, V02 | Valid delivery measurements; Figure |
| VC08 | Put the benchmark in context | Measurements / activity | W14, V18, V27, V25 | Daily activity; Figure |
| VC09 | Two views of one question | Café / orders | W10, I11, V24, V04, V08 | Shared population; Drink frequencies; Figure |
| VC10 | Prepare a shareable figure | Products / sales | I19, V29, V34, V36 | Category unit totals; PNG export; Figure |

## Intentional boundaries

Checks assess declared Python evidence, not written interpretation or the quality of every possible visual design. A challenge that specifies a particular representational property, such as quartiles and whiskers, checks that property. Where presentation choice is open, the accepted alternatives are covered by tests. Planning prompts are ungraded text with no input field.

To author another subject, supply collection metadata, input/setup providers, named deliverables and corresponding semantic validators to the shared experience. This pass implements only Data Workflow Challenges.


## Independent audit and polish follow-up

This pass re-read every brief, fixture, reference workflow, hint level, prerequisite link and deliverable contract. It also inspected the integration diff, worker path, reset/navigation behavior, and shared case-file presentation. The curriculum source files still have no differences from main, and the serialized baseline hash is unchanged.

### Individual challenge review

Every entry below was executed in native Python and actual browser Pyodide. Every challenge additionally receives a deliberately wrong named output and a missing output in the audit suite, while independent deliverables continue to be checked.

| ID | Workflow and conceptual coverage | Review / improvement |
|---|---|---|
| IC01 | A delivery just arrived — file intake; schema; inspection | CSV is supplied without df; preview and full-file metadata checked separately. |
| IC02 | Prepare a focused extract — selection; ordering; handoff | Both filters, column order and two-key descending/ascending handoff checked. |
| IC03 | Can this report use the data? — missingness; population; validation | Added an unrelated missing learner label: blanket removal must now fail. |
| IC04 | Investigate repeated submissions — record identity; data quality; investigation | All duplicate members and distinct affected IDs are separate evidence. |
| IC05 | Who meets both conditions? — selection; ranking; summaries | Eligibility precedes ranking; ties and top-three total checked. |
| IC06 | Understand the category mix — population; frequencies; proportions | Replaced untaught Inspect sort_index/size dependency with taught grouped counts and arithmetic. |
| IC07 | Compare two measurements — selection; missingness; summaries | Clarified exact descriptive rows; reconciled reporting-week labels with dates. |
| IC08 | Compare groups fairly — population; comparison; summaries | Counts and means share one population; missing output, wrong summary and partial execution tested. |
| IC09 | Where do categories overlap? — selection; relationships; counts | Core grouped counts plus labelled construction suffice; crosstab remains an accepted alternative. |
| IC10 | Brief the next analyst — schema; data quality; summaries | Full-table intake metadata stays separate from completed-delivery duration summary. |
| WC01 | Consistent product names — text quality; recoding; validation | Explicit spelling equivalence and raw-source preservation; no broad recoding guesses. |
| WC02 | Prices that can be used — numeric quality; eligibility; provenance | Raw text retained; missing, blank and invalid prices appear in the repair list. |
| WC03 | An attendance handoff — dates; required fields; ordering | Added optional-field missingness and unordered dates to expose blanket dropping and omitted ordering. |
| WC04 | Repeated order exports — record identity; retention; validation | Added identical purchases with distinct IDs to distinguish record identity from duplicate-looking fields. |
| WC05 | Calculate a useful total — numeric quality; calculation; summaries | Two parsed numeric inputs and additive money total; raw inputs remain intact. |
| WC06 | Fill only what is justified — missingness; data policy; calculation | Added missing quantity; discount is explicitly a per-line dollar amount, with authorised zero filling only. |
| WC07 | Connect records to a lookup — combine tables; retention; validation | Matched/unmatched evidence, unique lookup relationship and multiplication negative tested. |
| WC08 | Combine two batches — schema alignment; combine tables; ordering | Reversed second batch to exercise chronological-independent ID ordering; schema and numeric alignment checked. |
| WC09 | Make repeated measurements usable — data shape; units; selection | Identifier/measure/value mapping preserves units; duration selection excludes step counts. |
| WC10 | Prepare a clean handoff — record identity; data quality; handoff | Unordered input now exercises final sorting; duplicate retention and price validity policies explicit. |
| VC01 | Which café category is busiest? — text quality; frequencies; communication | Normalised demand counts; accepts horizontal/vertical bars or labelled points; rejects misplaced bars. |
| VC02 | How are delivery times distributed? — numeric quality; distribution; communication | Completed deliveries only; invalid durations excluded, alternative bins and index reset accepted. |
| VC03 | Do longer sessions relate to better scores? — complete pairs; association; communication | More varied scores; pair identity and visible points checked; no causal claim. |
| VC04 | What changed over time? — dates; aggregation; change over time | Connects aggregated chronological daily values; disconnected markers now fail. |
| VC05 | Which group has the higher average? — missingness; comparison; fair scales | Observed group means checked independently; totals fail; labelled point comparison also accepted. |
| VC06 | Show a small sample honestly — population; variation; transparency | Added missing score; individual observations and optional jitter preserved. |
| VC07 | Compare spread, not just averages — data quality; distribution; outliers | Added genuine outlier; checks boxes, whiskers and outliers; normalises browser/native CLOSEPOLY differences. |
| VC08 | Put the benchmark in context — aggregation; reference values; communication | Benchmark must be visible and identified in its own legend entry. |
| VC09 | Two views of one question — population; comparison; distribution | One population supports two different views; panel evidence checked against canonical fixture. |
| VC10 | Prepare a shareable figure — additive measures; comparison; export | Figure precedes export in deliverables; PNG corruption, resolution, finished-figure identity and file replacement handled. |

### Collection and instructional quality

The ten original workflow ideas per deck remain intact and freely available. The collection reinforces intake → selection/quality → summaries, preparation → policy decisions → multi-table handoffs, and evidence preparation → visual comparisons → multi-panel/export communication, without adding difficulty categories or gates. Prerequisite links point only to taught Core lessons; these are representative cumulative workflows, not a claim that every optional plotting API appears.

All thirty briefs now have workflow-specific conceptual tags, deliverable labels, and explained-solution reasons. Default openings contain no method recommendations or solution skeleton. Output types are declared explicitly, so a learner is not surprised by a Series-versus-DataFrame check. Index requirements are metadata, no longer guessed from prose. No scores, completion tracking, reflections, drafts or activity state are saved.

### Visual and interaction changes

- More legible case-file metadata, restrained scenario icon panels, descriptive output labels, and consistent Open brief affordances.
- Compact named-output chips replace repeated paragraphs above the editor. The full brief retains numbered, separated requirements, output names/types and a clearly marked data policy.
- Inputs, Deliverables and Help buttons navigate within the brief without moving the desktop workspace. Data previews are keyboard-scrollable and clearly labelled with their row counts.
- Editable setup now places one observation per line instead of hundreds of vertically expanded dictionary items. Reference solutions use consistent Python spacing and line wrapping.
- Help stays closed and separates conceptual, tool and approach guidance from the explained complete script.
- Checking states distinguish this run, previous-run results, interrupted execution and missing evidence. Starting another run clears previous checking states immediately; Stop clears pending results.
- Responsive header spacing fixes crowded navigation at 320px; mobile retains a clear editor jump. Light/dark, reduced motion, visible focus, text-plus-icon status and touch-sized brief navigation are supported.

### Validator findings fixed

The original passing reference tests did not detect invisible marks, misplaced bars, disconnected time series, boxes without their middle-half outline, unlabelled benchmark legends or corrupt exported files. These now have explicit negative tests. Equivalent bars drawn in a different artist order, point comparisons, horizontal bars, different histogram bins, jitter, alternate plotting libraries and reindexed duration evidence remain valid where the brief allows them. The browser suite caught and verified a Matplotlib-version-specific box-outline representation difference. Validation inspects represented evidence, not learner source code.

### Verification for this audit

- `npm run check`: build, JavaScript, curriculum/teaching models, route checks and application-shell checks.
- `npm run check:workflows`: registry/baseline invariants, all 30 references, all 30 wrong/missing-output cases, policy negatives and meaningful alternative solutions.
- `tests/test_workflow_challenges_browser.py` in Chromium and WebKit: all 30 references in real Pyodide; semantic negatives/alternatives; loading, stale, interrupted and runtime-error states; CSV isolation; editable setup; reset/reload; Tab/Escape; help disclosure; no activity persistence. All routes inspected at 1440px, 834px and 320px in both themes.
- Existing Foundations native and real-browser regression suites: all 324 reference exercises remain executable.
- Final screenshots reviewed at desktop and narrow mobile sizes, including the brief, deliverables, collection and mixed feedback. Evidence is written to `tests/evidence/workflow-challenges/`.

No production deployment was performed. Automatic checks establish the declared outputs and chart evidence; meaningful titles, interpretation and communication quality still require human judgement. Keyboard semantics and browser layouts were tested; this is not a claim of a manual assistive-technology certification.

Final preview: http://127.0.0.1:8041/data-foundations.html#inspect/challenges

Release verification recorded: native Foundations 324/324; browser Foundations 324/324 (67.5 s); full Workflow browser audit Chromium 30/30 (26.5 s), WebKit 30/30 (33.4 s), both with the additional audit negatives and all route/viewport/theme checks. Registry inventory: 324 existing exercises + 30 challenges = 354 executable activities.
