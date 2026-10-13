# Curriculum implementation and verification

The existing Inspect, Wrangle, Visualise and ML curricula now share explicit teaching intent, concise task contracts, semantic Python names, predictable workflows and a reading order that puts practice before optional references. Cream backgrounds, pixel headings, dark editors, dataset variety, core/optional paths and transient learning state are preserved.

Review branch: `curriculum-coherence-2026-10-13`, based on `8a72b291a3c4`. Final verified build content ID: `e51fb88889b7`. Production publication and merging are outside this implementation.

## Changes

- **Shared teaching:** Final assembly assigns Introduces, Reuses, Extends and Prerequisites from authored progression. Visible teaching covers the current concept; familiar syntax has optional reminders and complete references. Learn and Refresh change disclosure depth while sharing datasets, code, grading and outputs. Switching depth preserves active code.
- **Inspect and Wrangle:** Every activity has a concise Question / Rows / Result / Constraints brief and supplied/created object metadata. Worked-example names and new aggregation/melt columns carry explicit semantics. Existing task constraints, examples, alternative answers, negative checks and dataset variety remain.
- **Visualise:** The Axes workflow stays familiar, with chart-specific code emphasised and full executable examples retained. Figure-level APIs keep `g` and `g.figure`. Named lesson corrections cover histogram bins, category ordering, progressive scatter encodings, individual versus repeated line observations, mean versus total delivery bars and relationship versus distribution facets.
- **Machine Learning:** Eleven guided Apply activities extend the existing workflow builder, bringing guided applications from six to seventeen. Trees, SVM, logistic, KNN, regression families and both neural branches have comparable milestones. Small inspection activities identify pre-fitted state. Full workflows use progressive numbered explanations, baseline comparison, training validation, diagnostics and a single final evaluation. Unsupervised workflows retain their own sequence.
- **Identifiers:** Scoped declarations and occurrence overrides distinguish input/derived/output columns, Python objects, example-only variables, functions, parameters, operations, files, literals and prose. Teal column borders and dashed violet object borders replace double underlines. Prose decoration leaves Python editors and worked code intact.
- **Visuals:** Eight Foundations concepts and eleven ML cards have accessible controls connecting fixed illustrative observations, operations, Python and results. These include bins, record counts versus statistics, category ordering, quartiles, facets, neighbours/votes, tree paths, linear-margin intuition, polynomial training/validation and PCA coordinates. Supplementary ML schematics are expandable.
- **Responsive/editor UX:** The document order is objective and essential teaching → task/editor → output → optional reference. Desktop keeps two columns with normal explanation scrolling. Stages are compact links. Adaptive editors start at the learner’s work, preserve setup access, keep syntax overlays aligned and support keyboard escape.

## Coverage

| Curriculum | Cards | Teaching | Reviews | Checkpoints | Practices |
|---|---:|---:|---:|---:|---:|
| Inspect | 31 | 27 | 3 | 1 | 95 |
| Wrangle | 36 | 30 | 5 | 1 | 111 |
| Visualise | 43 | 36 | 6 | 1 | 132 |
| ML | 110 | 85 | 14 | 11 | 338 |

All 338 existing Foundations activities and all 110 ML cards remain. ML previously had 327 card activities; eleven applications were added. The independent collections retain 30 Foundations and 19 ML challenges. Visualise retains 20 core lessons, 16 optional extensions and 71 distinct activity datasets. ML retains 38 card dataset variants.

Source coverage and assembled-page coverage are separate:

- [Foundations coverage](curriculum-evidence/foundations-coverage.json) records every card/activity, authored concepts, changed task/solution fields and parameter disclosures.
- [ML coverage and traceability](ml-learning-curriculum-coherence.md) records every model collection and application; [ML verification](curriculum-evidence/ml-verification.json) lists exact runnable activity coverage and package versions.
- [Responsive coverage](curriculum-evidence/responsive-coverage.json) records all 676 card activities at phone and desktop widths; independent challenge routes have separate runtime/UI coverage.
- [Browser Python results](curriculum-evidence/runtime-browser.json) record 33 actual solution/grade runs across named Foundations repairs, all seventeen guided ML applications and the first complete workflows.

## Before and after

Visualise task text decreased from 10,483 to 7,889 words while retaining constraints. Default expanded parameter entries decreased from 1,156 to 72; the complete 1,156 occurrences remain available in collapsed references. `figsize` receives one visible authored introduction, replacing 117 repetitions.

The original build was archived from the base commit and rendered with the same Chromium and viewports as the updated build. Exact editor positions and default-visible content are recorded in [before](curriculum-evidence/before-layout.json) and [after](curriculum-evidence/after-layout.json). Screenshot pairs show the actual enhanced pages:

| Example | Phone before / after | Desktop before / after |
|---|---|---|
| Histogram | [Before](curriculum-evidence/before-V04-390.png) / [After](curriculum-evidence/after-V04-390.png) | [Before](curriculum-evidence/before-V04-1440.png) / [After](curriculum-evidence/after-V04-1440.png) |
| Summary bars and estimator | [Before](curriculum-evidence/before-V09-390.png) / [After](curriculum-evidence/after-V09-390.png) | [Before](curriculum-evidence/before-V09-1440.png) / [After](curriculum-evidence/after-V09-1440.png) |
| First complete regression | [Before](curriculum-evidence/before-ML-F11-390.png) / [After](curriculum-evidence/after-ML-F11-390.png) | [Before](curriculum-evidence/before-ML-F11-1440.png) / [After](curriculum-evidence/after-ML-F11-1440.png) |
| Classification trees | [Before](curriculum-evidence/before-ML-C14-390.png) / [After](curriculum-evidence/after-ML-C14-390.png) | [Before](curriculum-evidence/before-ML-C14-1440.png) / [After](curriculum-evidence/after-ML-C14-1440.png) |

Representative initial mobile editor positions (390 × 844 px):

| Lesson | Before | After | Reduction |
|---|---:|---:|---:|
| V04 histogram | 8,362 px | 3,253 px | 61% |
| V09 summary bars | 9,921 px | 3,879 px | 61% |
| V13 raw points | 9,675 px | 2,744 px | 72% |
| V17 scatter encodings | 10,502 px | 2,688 px | 74% |
| ML-F11 complete regression | 10,608 px | 2,909 px | 73% |
| ML-C14 classification trees | 5,435 px | 3,363 px | 38% |

These are document positions, not execution timings. The final exhaustive card sweep's largest initial editor position is 4,229 px in the first scatter-mapping lesson; its four newly introduced arguments remain fully explained. The largest ML position is 3,737 px in the neighbour investigation. Source and rendered evidence distinguishes required teaching from optional documentation.

## Issue → implementation → verification

| Finding | Implemented change | Verification |
|---|---|---|
| Repeated/early parameter documentation | Authored first-use/extension plan and three guidance levels | All 132 Visualise activities, parameter API contracts and browser disclosure suite |
| I19S missing example objects | Worked/example metadata and explicit occurrences | Named final-source identifier regressions and executed solution |
| W19 missing output names; `size` ambiguity | Named output columns; scoped aggregation-operation meanings | Identifier scope collision tests and executed aggregation |
| W22 common-word output columns | Explicit melt output roles | Named source regression and executed reshape |
| V09 title corruption and heavy styling | Literal title protection; restrained role styling | Literal/prose regressions, both-theme contrast checks and screenshots |
| V04 alternate-API detour | Same-observation `bins` change; optional Matplotlib alternative | Change solution in browser; fixed-bin interaction/statistic checks |
| V13 opaque chaining | Named intermediate summaries, sorting and label extraction; optional equivalent chain | Transfer execution and semantic object tests |
| V17 simultaneous encodings | Shape, then numeric size; separate speed preparation in Transfer | All three stages executed and plotting negatives |
| V29 stale prices/revenue explanation | Correct delivery mean/total teaching | Actual examples, variety tests and browser Change run |
| V33 method mismatch | Explicit relationship/distribution choice | Transfer execution and faceting row-conservation checks |
| Line aggregation ambiguity | Individual observations versus repeated times and function-specific estimator behaviour | Parameter/variety runtime checks |
| Empty canvas/support-count narration | Concise briefs with labels and population requirements | Authored-guidance checks and executed references |
| Unequal model milestones | Existing builder extended to every supervised family | Seventeen applications, model-method negatives and all-activity execution |
| Hidden fitted setup/incorrect evidence contracts | Supplied-state labels and learner-output contracts | Provenance metadata tests and contract/runtime regressions |
| ML-F11/F12 overloaded first workflows | Eight progressive questions with attached syntax and complete scripts | Both workflows executed in the actual browser runtime |
| KNN internals too early | Fit/predict first; neighbour inspection introduced in its investigation | Intro, investigation and Apply runtime/grader checks |
| Logistic title promises wrong activity | Tuning title agrees with activity; separate full Apply | Title/metadata checks and Apply execution |
| LDA midpoint details too early | Shared covariance first; labelled deeper activity with immediate syntax | Deeper activity and Apply execution |
| Neural branch/unit inconsistency | Comparable applications and separate input/target/inverse explanations | Target-transform checks and neural runtime cases |
| PCA/clustering forced into prediction patterns | Explicit discovery workflow and interpretation limits | Discovery audit and three guided unsupervised applications |
| SVM RBF example with linear diagram | Explicit linear-margin intuition; exact illustrative support/margin geometry | Numerical agreement with fitted linear SVC and responsive interaction checks |
| Decorative/disconnected visuals | Data/operation/code/result explorers | Numeric invariants, sklearn comparisons and actual browser controls |
| Long mobile lead-in and editor setup view | Natural DOM order, concise stages, post-output references and work positioning | All-activity responsive sweep, editor keyboard/reset and before/after measurements |

## Verification and review

The exact scientific environment uses numpy 1.26.4, pandas 2.2.0, scikit-learn 1.4.2, scipy 1.12.0, Matplotlib 3.5.2 and Seaborn 0.13.2. Browser Python uses Pyodide 0.26.4 with its locked packages, rather than substituting native execution for browser evidence.

- All 338 Foundations reference programs pass; the final responsibility receipt records 277 passing positive/negative checks, unchanged source and unchanged datasets during execution.
- All 245 runnable ML activities (226 card programs plus 19 independent challenge programs) pass in both pinned native Python and actual Chromium/Pyodide. The remaining 112 decision/reflection activities have structural and browser coverage. Model applications reject ten methodological near misses; core, classification, discovery, mastery and supplied-state regressions also pass.
- The final full check chain (`build:web`, `check:js`, `check:routes`, `check:app-shell`) passes, including the 254 existing modelling routes.
- Generated Python formatting passes for 597 snippets and 178 mappings. The last two formatting changes preserve independent Python ASTs; focal line metadata is resolved against the final formatted code. [Formatting evidence](curriculum-evidence/foundations-format-validation.json) and the [repository check log](curriculum-evidence/repository-check.log) are retained.
- Supplied-state metadata agrees with native fitted state for 107 estimators across 75 setups, including fitted aliases and scalers; transformed arrays are distinguished from fitted objects.
- The identifier registry covers 725 contexts. Final-source named regressions, five generator cases and all 676 activity-language checks pass.
- Visual interactions pass numeric/model checks and 114 isolated browser checks across 1440/390/320 px and both themes. The full ML visual audit captures 85 concepts, 57 variant families, 110 thumbnails, all nineteen challenge tiles and four real fitted figures.
- All 1,352 card/viewport renders pass without page errors, page overflow or editor misalignment. Real keyboard/reset/disclosure checks and emulated touch tablet checks also pass.
- Twelve focused desktop/mobile checks verify that plotting calls and newly derived variables retain line emphasis after the complete syntax-colouring pass; familiar preparation stays neutral. [ML workflow highlighting checks](curriculum-evidence/ml-workflow-highlight-checks.json) also confirm the tree/SVM comparison and full-workflow syntax.
- Language checks cover 112 enhanced views and nine static pages, including visible M03 reporting evidence in both modes. Identifier style checks cover 40 views and both themes, with contrast above 10.4:1.
- Parameter browser verification covers 264 activity/viewport states and 43 static pages, with real reference/reminder opening and closing.

To review locally, build with `npm run build:web` and serve `dist` with `python3 -m http.server 8000 -d dist`. The review preview uses `/data-foundations.html` and `/ml-learn.html`. Automated browser scripts accept `--base-url`; the focused evidence scripts use installed Chromium. A vendored, ignored runtime can be served from `dist/pyodide` for `?runtime=local` verification.

No known curriculum or runtime failures remain in the checks run. WebKit and physical-device checks were not run locally. The Chromium evidence covers desktop, phone and emulated touch layouts; run the retained Chromium/WebKit matrix in `.github/workflows/foundations-audit.yml` and `.github/workflows/ml-learning-audit.yml`, and check editor/visual controls on physical touch devices before publication. No production deployment or primary-branch merge was performed.
