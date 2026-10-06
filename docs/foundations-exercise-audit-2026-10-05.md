# Data Foundations exercise audit · 5 October 2026

All 324 existing exercises were reviewed together with their lesson, task, hint, worked example/model solution and effective runtime checks. All stable lesson and exercise IDs remain. The final native matrix passed 2,323 executed cases: 1,502 correct answers (including every reference) and 821 wrong semantic or chart-feature answers. The real Chromium/Pyodide journey passed all 324 reference solutions plus visibility probes and the editor/navigation/reset checks.

This work is confined to the authorized isolated candidate. The original project, unrelated `* 2.*` duplicates, Git history and remote sites were not edited. No learning persistence, draft saving, resume, completion or progress tracking was added.

## What changed

The opening Visualise route is now displayed as Lesson 01 choose a chart (reference V35), Lesson 02 create the canvas (V01), Lesson 03 finish prepared marks (V02), then Lesson 04 map observations in a scatter plot (V16). Choosing the question/type requires no plotting prerequisite. V01 isolates an empty canvas; V02 supplies its plotted scaffold before asking for labels, units and population context. V16 then teaches the data mapping. Static lesson numbers explain the displayed order while stable IDs remain secondary and continue to identify links/tests.

The 14 retrieval cards, containing 50 repeated exercises, are intentional spaced practice. They retain their IDs, faded starters and placement and inherit their source Transfer brief/checking contract. The three practical checkpoints remain distinct checkpoints. The accidental canvas/finishing duplication was corrected without removing those retrieval features or the Change/Transfer teaching transitions. The Visualise checkpoint retains its authored five grouped steps.

A short introduction explains why the examples use Seaborn: named-column input and a short, consistent API for many chart types. It also explains its relationship to Matplotlib Figure/Axes and accepts equivalent supported Python drawing/computation routes. Filtered scatter and line Transfer models now consistently use Seaborn; the useful Matplotlib line alternative remains taught.

Chart checks compare meaningful rendered observations, summaries, matrix identities, layout and explicitly requested features. Equivalent Matplotlib scatter, histogram, bars, boxes, line/SD bands, ECDF, SciPy KDE, fitted-line/residual and imshow routes were executed. Default canvas size and title/axis capitalization/spacing no longer cause incidental failures. Exact data column names, row/category identifiers, files, ranked order and requested calculations remain meaningful and case sensitive.

The independent review exposed hidden, alpha-zero and completely cropped marks passing an earlier check. The repaired runtime verifies visible axes/marks/text and transformed viewport coverage, including per-point transparency and zero-sized points. All chart rounds received applicable visibility probes; ordinary visible opacity and frame removal remain accepted. Explicitly restricted model bounds and the intentionally empty canvas remain supported. A separate final probe passed all 132 cases: hidden whole Figures reject on every one of the 126 plot rounds, all three named-fig negatives reject, and three explicitly visible Figure variants accept.

Correlation annotations now permit unspecified precision only when the displayed number correctly rounds its actual matrix cell. Wrong numeric or nonnumeric cells reject; V23 integer and one-decimal formats remain exact where stated.

Corrected stale ascending-sort, inner-join and distinct facet-function hints. Labelled unranked inspections accept equivalent label-preserving display order. One-hot indicator columns can reorder while preserving the specified source-column prefix. Equivalent nullable numeric/date representations are accepted; explicitly requested category/string/Int64 conversions still check the target storage type. W30 Transfer verifies that the requested working column was actually created. Ordinary displayed/printed/final values work without an unstated answer variable; W25 does not require a variable called combined. Workflow challenge WC08 retains its separately stated named deliverables.

## Exact and flexible figure requirements

| Requirement | Final intentional contract |
| --- | --- |
| Whole-Figure dimensions | V01-1: 6 by 4 inches; V24-2: 6 by 8 inches. Both tasks state them. |
| Facet panel dimensions | V33 Follow/Change/Transfer and its VR6-4 retrieval state height=3 inches per panel. |
| File export | V34 and its retrieval require the finished same chart.png, 150 dpi, tight bounds, saved before display. |
| Other size/text choices | Unspecified whole-Figure size and presentation case/spacing are flexible. |
| Data and chart meaning | Paired records, filter boundaries, calculated values, categorical/matrix identities, explicit ordering/scale/markers/palette/legend/annotation features remain required. |

The starting assembled V16 Weather contract already had no figsize enforcement. Its model's 6 by 4 canvas was an example choice rather than a hidden rule in that snapshot. The final browser probe explicitly passed the ordinary default canvas with Weather Diary, Humidity and Temperature presentation labels, and rejected a case-altered data column reference. Filtered BoardGames passed both Seaborn and Matplotlib and rejected the wrong population.

## Verification

| Check | Result |
| --- | --- |
| Original native baseline | 324/324 references passed before fixes. |
| Final expanded native audit | 2,323/2,323 cases; all 324 references; 1,502 positives and 821 negatives; no failures. |
| Existing intent/semantic/recovery suite | All 324 references and regression/recovery checks passed. |
| Visible editable setup | 324/324 references plus missing/edited-setup/fresh-run checks passed. |
| Supplemental whole-Figure visibility | 132/132 cases; 129 negatives rejected and 3 visible variants accepted at the final runtime. |
| New-syntax teaching examples | All 19 self-contained transitions executed; displayed table/chart claims verified. |
| Curriculum/teaching structural checks | 106 cards, 324 unique stable IDs, prerequisite order, complete contracts and visual fingerprints passed. |
| Real Chromium/Pyodide journey | 324/324 references; 12 hidden/transparent/off-viewport/style cases and 12 numeric-annotation/explicit-format cases; navigation, hints, solutions, reset, editor keys, recovery, stop/restart, figure export/zoom and no learning persistence passed. |
| Responsive teaching | All 324 panels at 1440 and 320 pixels passed in Chromium and WebKit, without overflow/page errors. |
| Rendered evidence | 90 journey screenshots across desktop/tablet/mobile and light/dark; 8 focused captures. Five focused screenshots were inspected as actual pixels. |

The final assembled curriculum SHA256 is `1e2bedb1740b2f306c99a6c86bbc1a9d6e3f47c31aa6b597725cfeba55ee95d5`. The final runtime SHA256 is `582c3327cfe083a6fa8bae611d48d82bfa7cde9cb046797a657341da97966f81`. The expanded execution compares source fingerprints before and after its run. An independent reviewer reran 22 numeric-annotation cases and matched all 1,620 ledger lesson/task/hint/solution/grader fields plus source hashes. Focused browser evidence hashes the served files and checks them against the tested local snapshot. The private browser evidence records its exact shared challenge runtime version; subsequent challenge edits belong to the parent's final assembled-bundle verification. Challenge integration's explicit savefig capture hook remains supported; its baseline identity guard was refreshed to the reviewed curriculum hash by the workflow owner.

Earlier browser attempts hit preview timeouts and stale assumptions about legacy fragment URLs, the added secondary reference row and I02's existing sample transition. Those were diagnosed and corrected in the tests; useful teaching was retained. The last failing scaffold assertion and the initial preview-failure logs remain in the evidence directory. A final focused rerun with remote packages timed out during first plotting startup; its log is preserved as focused-browser-failed-remote-startup.log. The final full and focused browser runs use explicit local packages and passed against the exact frozen source. A focused test initially changed the wrong axis name and therefore generated a no-op negative; its failed log is retained and the correct Humidity data-column mutation now rejects. The additional annotation-precision false-failure reproduction is retained as `annotation-precision-before.json`; the final numeric-format tests passed. There are no known remaining blockers in the audited Foundations scope.

## Evidence and reproduction

Evidence directory: `/Users/elijahang/Documents/Codex/2026-10-05/task-2/auto-run-audit/foundations-audit`.

- `audit-ledger.json` and `audit-ledger.csv`: all 324 rows, with task/hint/example/solution/grader review, changed fields, per-lesson rationale, exact intentional contracts and executed test references.
- `expanded-results.json`: exact code, expectation and actual response for all 2,323 cases; `execution-ledger.*` is the smaller execution-only view.
- `final-verification.json` and `figure-visibility-results.json`: current owned-source/evidence identity checks and all-round hidden-Figure regression proof. Ledger code fingerprints hash the raw executed Python text.
- `teaching-examples.json`: executed code, claimed output and observed semantic result for all 19 transitions.
- `browser-evidence/chromium-report.json` and `chromium-pyodide-solutions.json`: full browser journey, 324 references, visibility probes and 90 screenshots, including the numeric-annotation probes.
- `focused-browser-results.json`, `focused-screenshots/`, `browser-source-manifest.json` and `screenshot-inspection.json`: displayed route order, Weather/BoardGames probes, exact served-source hashes and inspected pixels.
- `baseline-curriculum.json`, `baseline-native.log`, final native/structural/browser logs and preserved failed attempts document the before/after checks.

Run `python3 tests/test_foundations_audit.py --evidence-dir <directory>`, `python3 tests/test_foundations_examples.py --evidence-dir <directory>`, `python3 tests/test_foundations_runtime.py`, `python3 tests/test_foundations_workspace.py`, and both Foundations `.mjs` structural suites. With a local built preview, run the browser and teaching-browser suites using `--base-url`, with `--runtime local --all-solutions` for the complete real-Pyodide journey using the preview's local packages. Remote package startup also depends on CDN availability.

These results validate the supplied tiny fixtures and the executed Python/chart routes. They do not prove arbitrary future datasets or unrestricted programs. Conceptual prose illustrations were reviewed for meaning/arithmetic; they are explicitly marked not-run as Python code, while every model and executable transition was executed.
