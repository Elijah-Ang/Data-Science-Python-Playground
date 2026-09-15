# Data Foundations refinement audit

Base: `main`, verified locally and against `origin/main` at **c57fd72cf92f3da40b05dd53853fcdf5a4904e60** before creating `codex/foundations-pedagogy-refinement`. Includes PRs #42 and #43. This PR is for review only; do not merge or deploy automatically.

Preview: http://127.0.0.1:8010/data-foundations.html

## Curriculum and scope

| Deck | Cards | Core | Go Further | Reviews/checkpoints | Exercises |
|---|---:|---:|---:|---:|---:|
| Inspect | 27 | 20 | 3 | 4 | 83 |
| Wrangle / Preprocess | 36 | 22 | 8 | 6 | 111 |
| Visualise | 43 | 20 | 16 | 7 | 132 |
| Total | **106** | **62** | **27** | **17** | **326** |

There are 89 teaching cards with Follow, Change and Transfer rounds, plus 17 retrieval reviews/final checkpoints. All published IDs remain reachable. I01CSV follows I01; I18S follows I18 through explicit array sequencing, without renumbering old cards. Reviews retain their published IDs and retrieve the revised Transfer rounds.

The three physical deck stacks, cyan/violet/mint accents, Data-only CTA, shared product shell, desktop split and stationary editor, stacked mobile flow, hidden hints/solutions, local drafts and account-free workflow remain. There are no completion records, progress bars or resume controls. No Data/Statistics/ML analytical implementation was changed.

Core means the common day-to-day route. Go Further covers specialised summaries, reshaping, preprocessing and less common charts. All cards remain accessible. Chapter jumps use existing chapter names and hash navigation; they do not introduce search, filters or locking.

## Changed teaching content

- **I01CSV:** load an actual tiny CSV file with `pd.read_csv`, assignment and a notebook-versus-Playground explanation. Its file is materialised in the lesson filesystem before each execution. The result `df` is not preloaded, so simply displaying `df` fails until the learner loads it.
- **I18S:** direct mean, median, min, max, sum, count and quantile in one card, followed by smaller numerical questions.
- **I09:** visible A–F row labels and inclusive label slicing contrast with positional `iloc`.
- **I10–I12:** comparison → membership → inclusive range; meaningful combined conditions; descending → ascending → multiple sort keys.
- **I16:** missing counts → categorical counts including missing values → missing percentages.
- **W10–W18 and W31:** game and pet-supply fields are context-specific; text cleaning includes literal `str.replace` and retains missing values deliberately.
- **W24:** a partially matching lookup makes left and inner joins visibly different. Transfer asks the learner to choose a join for an audit that must retain unmatched observations. Cardinality validation stays required.
- **W29:** Q1/Q3, IQR and both 1.5-IQR fences replace the 75th-percentile rule. In the six-value fixture, Q1=11.25, Q3=13.75 and the upper fence is 17.5; only 40 is flagged. Original values remain intact. The lesson explains screening, measurement context and investigation before exclusion/clipping.
- **V18/V19:** daily sales, hourly temperature and daily visits replace unrelated observations. Separate replicate tables have two measurements at every time and support the mean/SD comparison with raw observations.
- **V30:** actual two-component counts replace manufactured 60/40 splits. Legends name the components and the text explains the upper-segment baseline limitation.
- **V25/V36:** explicit hue/style ordering, category ordering and transparency. The transparency datasets include real coincident coordinates.
- **All teaching cards:** isolated syntax, concise important-parts explanations, a worked example, explicit task, and a partial starter. Follow starters leave meaningful work; Change collapses syntax/example and provides less code; Transfer generally states results rather than an API. CSV loading and merge cardinality remain explicit API tasks.

## Task clarity and controls

[Task clarity review](foundations-task-clarity.md) records all **326 exercise prompts**, grouped by lesson and dataset. Each was compared with the visible table, setup, reference solution and checks for: action; data/object; expected result; required API; and hidden requirements. The companion [review manifest](foundations-task-review.json) fingerprints those inputs. A changed prompt, dataset, solution or intent rule invalidates the review in curriculum tests.

Editorial corrections included empty transfer filters, unspecified population-standard-deviation scaling, implied source tables in the final cleaning checkpoint, a nonexistent “supplied chart” in V02, and right-boundary bin semantics. The review is a reading exercise supported by tests, not an assertion that a non-empty string is sufficient.

“Your task” appears in the lesson reading sequence and remains beside the desktop editor as a scrollable, keyboard-focusable reminder. Controls read **Run code**, **Check answer**, and **Reset code**. The first teaching Follow opened in the page session explains Run versus Check inline, without a modal.

## Navigation and footer

| Location | Prominent return action | Destination |
|---|---|---|
| Foundations landing | ← Data Playground | Normal Data Playground |
| Deck library | ← Choose a deck | Three-deck landing |
| Lesson | ← Inspect / Wrangle / Visualise lessons | Current deck library |

The deck library has no duplicate Foundations breadcrumb. Lessons have a small hierarchy breadcrumb, with the current deck rendered as text so it does not duplicate the primary return link. Footer links include About, Help, Privacy and Credits, alongside local-draft information and reset saved learning.

## Visual system and review

Every teaching card has an explicit visual definition: **89/89**. All 17 reviews/checkpoints use an explicit mixed-skills configuration. Nine rendering families—table, table-transform, bars, distribution, relationship, matrix, panels, values and figure—share deterministic SVG/table/axis/mark primitives. Sixty semantic configurations distinguish concepts without 89 separate assets. Metadata selects the family, configuration, highlight positions and accessible description. Unknown configurations fail validation.

Examples cover selected rows/columns, missing and duplicated cells, filtering, sorting, text cleaning, numeric/date types, group collapse versus broadcasting, merges, reshaping in both directions, encoding, scaling, distributions, categorical plots, ordered lines, correlation matrices, stacked components, figure-level grids and export. The same preview is reused in the lesson opening. These are conceptual sketches; the actual exercise table remains separately visible.

Both themes and 1440px desktop, 834px tablet, 390px mobile, plus the 320px boundary were checked. Each browser captures 24 page/plot screenshots and 66 card-preview screenshots. Representative previews cover inspection, filtering, cleaning, merge/reshape, distribution, categorical, line, heatmap, stacked bars and pair grids. The light/dark mobile contact sheets and full desktop lesson/library were visually inspected. Diagrams use borders, arrows, text, hatching/dashes and numbers as well as color. Histograms have adjacent bins; stacked segments are visually distinct; matrix cells include numbers. No horizontal page overflow was detected. Long tasks remain available beside the editor and on mobile.

Evidence is written under `tests/evidence/foundations/` and uploaded by the Foundations CI jobs. Screenshots and logs are generated evidence, not bundled production assets.

## Validation design

Semantic checks still compare DataFrames, Series, indexes, dictionaries, numeric arrays/scalars and structured plotted data, including relevant labels, axes, categories, legends and exported PNG properties. Expected and learner runs receive independent fresh objects. CSV fixtures are recreated on every execution. Plot finishing, figure-level exceptions and original-value preservation are retained.

AST intent adds `requiredCalls`, `forbiddenCalls`, index access (`iloc`/`loc`), attributes and selected required keyword values. Comments and strings do not satisfy API intent. Formatting, line breaks, variable names, simple callable/import aliases and harmless additional code are accepted. Merge validation also accepts a named literal relationship value. This is a lightweight teaching check, not a complete control-flow proof or adversarial sandbox.

Follow/Change reject correct-output answers using the wrong taught method, including I02, I08/I09 and histogram/scatter lessons. W30 rejects `apply`. Appropriate Transfer alternatives pass, including positional first-row selection, equivalent range masks and a Matplotlib scatter matching the requested data. Both semantic and intent checks must pass where intent is required.

## Cold-start cost

Fresh Chromium contexts, same local build server and remote production Pyodide CDN, three runs per version:

| I02 time to Python ready | Runs (seconds) | Median |
|---|---|---:|
| Before | 5.49, 5.63, 5.63 | 5.63 s |
| After | 2.66, 2.48, 2.45 | 2.48 s |

This was a **56% reduction** in this environment. Timings depend on network and machine; they are measurements, not a guaranteed SLA. Tests verify package boundaries rather than a fragile CDN timing threshold.

Fresh inspection loads pandas, NumPy and pandas' small dependencies. Matplotlib/Seaborn/SciPy are added for plotting, and scikit-learn for scaling. The worker caches successful loads and retains the shared serialized transport/restart behavior. Cold-start regression tests execute Inspect → CSV → scaling → plotting → Inspect in both browser engines and verify loaded package sets and real results.

## Verification

- `npm run check`: passed; includes curriculum, JS, ML structural routes, shared app shell and ad-mode checks.
- Native Foundations: **326/326** references plus method-intent negatives, semantic alternatives, join validation, IQR, wrong plots, error recovery and fresh-data checks passed.
- Chromium full real Pyodide: **326/326**, zero failures; complete journey/visual run approximately 74 seconds locally.
- WebKit full real Pyodide: **326/326**, zero failures; complete journey/visual run approximately 77 seconds locally.
- Cold-start package-transition regression: passed in Chromium and WebKit.
- Data regression: **262 task scenarios**, plus index, alias reset, schema, display and stream checks passed.
- Statistics unit regression: **64 tests passed**. No methodology changes.
- Existing GitHub Data/ML route and Statistics production workflows run for this PR; the new Foundations workflow requires native checks and full Pyodide/visual checks in both engines. Review the latest PR checks for exact CI status.

## Tiny dataset inventory

All primary teaching datasets contain 4–8 rows. Auxiliary lookup tables can be smaller. CSV files use the four-row construction tables. The inventory below includes deliberate labelled, IQR, replicate and overlap variants, for **30 dataset definitions**.

| Dataset | Rows | Columns |
|---|---:|---|
| candy | 6 | candy, flavour, price, rating, shelf |
| cafe | 6 | drink, size, price, tip, shift |
| pets | 6 | name, species, age, weight, room |
| students | 8 | student, club, hours, score, group |
| games | 6 | game, genre, minutes, rating, players |
| weather | 8 | day, sky, temperature, humidity, station |
| movies | 6 | movie, genre, minutes, rating, screen |
| messy | 8 | order, drink, size, price, tip, date |
| messy_games | 6 | order, game, edition, price, discount, date |
| messy_pets | 6 | order, item, package, price, discount, date |
| candy_build | 4 | candy, price |
| cafe_build | 4 | drink, price |
| pets_build | 4 | name, age |
| candy_labelled | 6 | candy, flavour, price, rating, shelf |
| cafe_labelled | 6 | drink, size, price, tip, shift |
| pets_labelled | 6 | name, species, age, weight, room |
| candy_iqr | 6 | candy, flavour, price, rating, shelf |
| cafe_iqr | 6 | drink, size, price, tip, shift |
| pets_iqr | 6 | name, species, age, weight, room |
| daily_sales | 5 | day, sales |
| hourly_temperature | 5 | hour, temperature |
| site_visits | 5 | day, visits |
| daily_sales_repeated | 8 | day, sales, replicate |
| hourly_temperature_repeated | 8 | hour, temperature, replicate |
| site_visits_repeated | 8 | day, visits, replicate |
| components_0 | 4 | genre, Solo, Two players |
| components_1 | 4 | day, Hot, Iced |
| components_2 | 4 | item, Online, Shop |
| weather_overlap | 8 | day, sky, temperature, humidity, station |
| games_overlap | 6 | game, genre, minutes, rating, players |
