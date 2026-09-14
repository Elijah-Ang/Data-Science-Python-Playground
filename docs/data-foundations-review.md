# Data Foundations — feature review

Review URL: **http://127.0.0.1:8010/data-foundations.html?runtime=local**

Branch: `codex/data-foundations`. Updated for the user-authorised full release. The pending ML/Statistics navigation guards are included in a separate commit with their own test.

## Delivered scope

A single **Learn / Refresh** link sits beside More tasks in Data Playground’s Suggested Route toolbar. It opens a dedicated page with the production Data shell, bundled fonts, shared appearance preferences, shared worker bridge, table serializer and figure viewer. Home / Data / Stats / ML remain the only global destinations.

The landing page contains three physical card stacks. Deck libraries group the complete published sequence into chapters and interleave cumulative retrieval reviews. Lessons use a desktop split layout, with content and visible tiny tables on the left and editable Python, Run / Check / Reset, and actual output on the right. At 800px and below, content precedes the editor and output. Syntax and example disclosures close as practice advances from Follow to Change to Transfer. Hints and solutions always require an explicit reveal.

Draft code uses only the `dspp-foundations-v1` localStorage key. There is no resume button, completion tracking, progress bar or percentage. Reset saved learning clears saved code without affecting other Playground state or the shared theme.

The exercise-type strip is non-interactive and explains Follow (guided practice), Change (a different context), and Transfer (independent practice), marking the current type. Previous/Next remain the navigation controls. Desktop lessons scroll independently on the left while the Python pane remains stationary on the right; the output has its own scroll area. Python input and worked examples use live syntax colouring. The lesson's prominent back link returns to deck selection. Learn / Refresh keeps its dimensions and now uses a filled cyan-to-blue treatment.

## Inventory

| Deck | Teaching lessons | Reviews, including final checkpoint | Total cards | Checked practice rounds |
|---|---:|---:|---:|---:|
| Inspect | 21 | 4 | 25 | 77 |
| Wrangle / Preprocess | 30 | 6 | 36 | 111 |
| Visualise | 36 | 7 | 43 | 132 |
| **Total** | **87** | **17** | **104** | **320** |

All planned IDs **I01–I22**, **W01–W31**, and **V01–V37** are present. The 90 specified cards include the three final checkpoints; 14 additional reviews make 104 cards. Every teaching lesson has three checked practices. Reviews contain three or four retrieval tasks; each final checkpoint has three dataset contexts. Optional stretch disclosures are additional ungraded exploration and are not included in the 320 count.

The first construction exercises explicitly build a dictionary of equal-length lists and call `pd.DataFrame`. Subsequent exercises preload `df`. Auxiliary lookup, long, and split tables are displayed when relevant and their setup is available in a disclosure. Numeric/boolean selection returns, clean copies, date conversion, scaling arrays, and plot outcomes are all executed, rather than simulated.

## Semantic checking

Each Run and Check constructs a fresh namespace and fresh dataset. Reference code runs separately before checked learner code, and reference results are never inserted into learner variables. Syntax errors and normal Python exceptions return a readable diagnostic. A worker restart terminates actual infinite loops; navigation and reset invalidate late results, and a 90-second watchdog preserves the draft if a run stalls.

Table and Series checks use pandas semantic assertions for values, index, column order, and approximate numeric equality. Dtypes are enforced on explicit type-conversion and binning objectives; result names are not graded. Scalars, arrays, lists, tuples and nested profile dictionaries are compared recursively. A displayed final expression or a `result` variable is accepted for value tasks. For example, `df.iloc[:2]` passes a request for the first two rows. Copy exercises also check that the original remains intact and `clean` is a distinct object.

Plot checks inspect actual Figure/Axes objects: plotted point coordinates, bar rectangles and stack baselines, line coordinates, matrices, polygon geometry, titles, labels and scales. Relevant objectives additionally check legends, mapped marker sizes/colours, annotations, scale limits, rotations, figure dimensions and PNG export/dpi. Jitter/swarm horizontal displacement is normalised so it does not change category membership checks. Style is otherwise not prescribed. Checks compare results, never exact source text. Some structurally different but visually equivalent complex charts can require manual judgement; these are teaching checks, not an adversarial code sandbox.

Axes-level Seaborn uses `fig, ax = plt.subplots(...)`, `ax=ax`, Axes labelling, `fig.tight_layout()` and `plt.show()`. Pairplot, jointplot, relplot, catplot and displot are explicitly taught as figure-level exceptions. Direct Matplotlib is used for exact/stacked bars, references, annotations, subplot management and export.

## Validation

- `npm run check`: build, JavaScript syntax, shared bridge tests, ML state/teaching/routes, app shell and ad-mode checks passed.
- `npm run check:foundations`: 104-card coverage and ordering, three practices per lesson, dataset sizes, review spacing and Data-only navigation passed; **320/320** solution executions plus **18** semantic negative/equivalence/recovery checks passed.
- Chromium production worker audit: **320/320** real Pyodide solutions passed, with no substituted interpreter or mock results.
- Chromium and WebKit browser journeys: navigation, deck/round progression, hints/solutions, saved drafts, draft persistence, exercise reset, full learning reset, wrong-answer rejection, malformed-code recovery, changed-data isolation, actual infinite-loop termination, plot geometry, PNG export and a three-figure checkpoint passed.
- Default CDN runtime smoke: load Python on the normal URL, execute and Check `df.head(2)` passed. The local review URL uses the existing pinned vendor runtime for repeatable review.
- Existing Data runtime: **262** task scenarios plus index, alias reset, schema, display and stream regressions passed.
- Existing Statistics engine: **31** tests passed. Existing production integration browser suite passed its real Pyodide numerical oracle, export and Data/Stats/ML navigation/layout checks.
- Existing ML browser workflow suite passed default, One-R, polynomial, time-series, hierarchical and PCA routes, with no browser errors.

Native Python verification used the installed scientific libraries; browser parity was checked independently with the site's pinned **Pyodide 0.26.4**, **pandas 2.2.0**, **Matplotlib 3.5.2**, **Seaborn 0.13.2** and **scikit-learn 1.4.2** runtime.

## Visual review

Both themes were audited at **1440×1000**, **834×1112** and **390×844** in Chromium and WebKit, with an additional 320px boundary check. There are 48 browser screenshots across deck landing, library, lesson and rendered-plot views in `tests/evidence/foundations/`. The audit verified side-by-side desktop/tablet panes, natural mobile stacking, contained table/code scrolling, no horizontal page overflow, visible keyboard controls, and readable chart links in both themes. Visual inspection caught and fixed low-contrast figure links in dark mode and a WebKit full-page skip-link artefact. These are browser/device-size checks, not claims of physical-device or screen-reader certification.

## Files changed

- `playground.html` — the single Data-only toolbar CTA and its scoped styling.
- `data-foundations.html` — dedicated learning page and production header.
- `foundations/curriculum.js` — original complete curriculum, practice definitions and tiny dataset library.
- `foundations/app.js` — deck/lesson navigation, editor, disclosures, local progress, runtime control and result rendering.
- `foundations/foundations.css` — card stacks, learning layouts and responsive/theme treatment.
- `foundations/runtime.py` — isolated execution and semantic table/value/plot checks.
- `foundations/worker.js` — pinned Pyodide worker through the shared bridge.
- `scripts/build-web.mjs` — include learning assets, derive its baseline CSS from Data Playground and package the shared serializer with the teaching runtime. Generated assets automatically enter the existing asset manifest/service-worker shell.
- `package.json` — curriculum/runtime check command and syntax/coverage integration.
- `tests/test_foundations_curriculum.mjs` — complete sequence and structural checks.
- `tests/test_foundations_runtime.py` — all reference solutions, equivalence, negative cases and recovery.
- `tests/test_foundations_browser.py` — real browser/Pyodide learning journeys and responsive evidence.
- `docs/data-foundations-review.md` — this review, including complete inventory below.

## Reproduce

```sh
npm run check
npm run check:foundations
# For the repeatable local-runtime review; vendor/pyodide is the existing runtime bundle.
ln -s ../vendor/pyodide dist/pyodide
python3 -m http.server 8010 -d dist
python3 tests/test_foundations_browser.py --all-solutions
python3 tests/test_foundations_browser.py --engine webkit
```

The normal web build continues to use the existing CDN runtime. Native builds continue to package the existing vendor runtime. Learner code, drafts and datasets are not sent to a server. A first online visit is required to obtain remote runtime packages on the normal web path, consistent with the existing Playground.

## Interaction references

Reviewed the public Codédex [Setting Up](https://www.codedex.io/python/01-setting-up), [Hello World](https://www.codedex.io/python/02-hello-world) and [Pattern](https://www.codedex.io/python/03-pattern) exercises. The borrowed idea is the explanation/example/instruction/help/editor/output/progression structure; lesson text, artwork and visual identity are original to this implementation. The axes-versus-figure distinction was checked against [Seaborn’s official function overview](https://seaborn.pydata.org/tutorial/function_overview.html).

## Tiny dataset inventory

| Key | Context | Rows | Columns |
|---|---|---:|---|
| candy | Candy shop | 6 | candy, flavour, price, rating, shelf |
| cafe | Café orders | 6 | drink, size, price, tip, shift |
| pets | Pet adoption | 6 | name, species, age, weight, room |
| students | Study club | 8 | student, club, hours, score, group |
| games | Board games | 6 | game, genre, minutes, rating, players |
| weather | Weather diary | 8 | day, sky, temperature, humidity, station |
| movies | Movie night | 6 | movie, genre, minutes, rating, screen |
| messy | Messy café orders | 8 | order, drink, size, price, tip, date |
| messy_games | Messy game sales | 6 | order, drink, size, price, tip, date |
| messy_pets | Messy pet supplies | 6 | order, drink, size, price, tip, date |
| candy_build | Candy shop · first table | 4 | candy, price |
| cafe_build | Café orders · first table | 4 | drink, price |
| pets_build | Pet adoption · first table | 4 | name, age |
| students_repeated | Study club · repeated measurements | 8 | student, club, hours, score, group |
| weather_repeated | Weather diary · repeated measurements | 8 | day, sky, temperature, humidity, station |
| games_repeated | Board games · repeated measurements | 6 | game, genre, minutes, rating, players |

The 16 reusable fixtures include seven clean contexts, three deliberately messy order variants, three four-row construction tables and three repeated-measurement variants. Lookup, long and split companions derive from these visible fixtures.

## Complete card coverage

### Inspect

| Card | Lesson / review | Core learning goal | Practices |
|---|---|---|---:|
| I01 | Meet a DataFrame | Build a small table from named columns. | 3 |
| I02 | Take the first look | Look at a few rows before making assumptions. | 3 |
| I03 | How big is it? | Read the row and column counts. | 3 |
| I04 | What columns arrived? | Find the exact column and row labels. | 3 |
| I05 | What types are these? | Distinguish numeric columns from text. | 3 |
| IR1 | Review · First contact | Retrieve earlier skills on a fresh table. | 4 |
| I06 | Pick one column | Select one named column as a Series. | 3 |
| I07 | Pick several columns | Keep a two-dimensional table of selected columns. | 3 |
| I08 | Rows by position | Select rows using their zero-based positions. | 3 |
| I09 | Rows and columns by label | Select named rows and columns with loc. | 3 |
| I10 | Filter rows | Keep rows where a condition is true. | 3 |
| I11 | Combine conditions | Combine row tests without losing their meaning. | 3 |
| IR2 | Review · Select with intent | Retrieve earlier skills on a fresh table. | 3 |
| I12 | Sort the table | Order filtered rows to answer a question. | 3 |
| I13 | Find extremes | Ask for the largest or smallest observations. | 3 |
| I14 | What values exist? | Find distinct category values. | 3 |
| I15 | Count categories | Compare category frequencies and proportions. | 3 |
| I16 | Find missing values | Locate gaps before summarising. | 3 |
| I17 | Find duplicate rows | Count repeated records without removing anything. | 3 |
| IR3 | Review · Find the surprises | Retrieve earlier skills on a fresh table. | 4 |
| I18 | Describe numeric columns | Read a compact numerical profile. | 3 |
| I19 | Summarise groups | Compare a simple average across categories. | 3 |
| I20 | Compare categories | Count combinations of two categories. | 3 |
| I21 | Inspect numeric relationships | Read correlation as association, not causation. | 3 |
| I22 | Inspect checkpoint | Profile an unfamiliar eight-row table from scratch. | 3 |

### Wrangle / Preprocess

| Card | Lesson / review | Core learning goal | Practices |
|---|---|---|---:|
| W01 | Protect the original | Make changes on a separate working copy. | 3 |
| W02 | Rename columns | Give a column a clear name. | 3 |
| W03 | Keep / reorder columns | Choose a deliberate column order. | 3 |
| W04 | Drop columns | Remove an explicitly unwanted field. | 3 |
| W05 | Filter unwanted rows | Keep observations using a clear rule. | 3 |
| W06 | Sort and reset | Sort records and give the result a simple index. | 3 |
| WR1 | Review · Keep the evidence | Retrieve earlier skills on a fresh table. | 3 |
| W07 | Create a numeric column | Calculate a whole column at once. | 3 |
| W08 | Create a conditional column | Choose values using a Boolean rule. | 3 |
| W09 | Recode categories | Map known labels and preserve unknown ones deliberately. | 3 |
| W10 | Clean text | Remove accidental spaces and inconsistent letter case. | 3 |
| W11 | Search / extract text | Select text matches and split structured names. | 3 |
| W12 | Convert numeric text | Turn numeric-looking strings into usable numbers. | 3 |
| WR2 | Review · Values with meaning | Retrieve earlier skills on a fresh table. | 3 |
| W13 | Convert data types | Choose a type that fits the values. | 3 |
| W14 | Parse dates | Convert date text and handle invalid dates visibly. | 3 |
| W15 | Work with dates | Extract useful calendar features from parsed dates. | 3 |
| W16 | Drop missing rows | Exclude only rows missing a required field. | 3 |
| W17 | Fill missing values | Choose and document an imputation rule. | 3 |
| W18 | Remove duplicates | Remove verified extra copies. | 3 |
| WR3 | Review · Gaps and duplicates | Retrieve earlier skills on a fresh table. | 4 |
| W19 | Group and aggregate | Create readable, named group summaries. | 3 |
| W20 | Groupwise transformation | Add a group statistic beside each original row. | 3 |
| W21 | Build a pivot table | Summarise a measurement across two category axes. | 3 |
| W22 | Wide → long | Turn measurement columns into variable/value rows. | 3 |
| W23 | Long → wide | Reshape unique identifier/measurement pairs. | 3 |
| W24 | Combine tables by keys | Join a lookup table while checking the relationship. | 3 |
| WR4 | Review · Reshape and connect | Retrieve earlier skills on a fresh table. | 4 |
| W25 | Stack datasets | Append compatible observations vertically. | 3 |
| W26 | Create bins | Turn numbers into labelled intervals. | 3 |
| W27 | Encode categories | Represent category membership as indicator columns. | 3 |
| W28 | Scale numeric columns | Compare standardisation with min–max scaling. | 3 |
| W29 | Handle outliers responsibly | Flag unusual values without deleting evidence. | 3 |
| W30 | Vectorise before apply | Choose a simple column operation before a row function. | 3 |
| WR5 | Review · Prepare responsibly | Retrieve earlier skills on a fresh table. | 4 |
| W31 | Wrangle checkpoint | Clean a messy order table end to end. | 3 |

### Visualise

| Card | Lesson / review | Core learning goal | Practices |
|---|---|---|---:|
| V01 | Meet Figure and Axes | Create the canvas and the plotting area. | 3 |
| V02 | Finish a chart properly | Make a chart readable before sharing it. | 3 |
| V03 | Map variables visually | Connect columns to visual channels. | 3 |
| V04 | Histogram | See how values fall into bins. | 3 |
| V05 | Density curve | Understand a smoothed view of a distribution. | 3 |
| V06 | ECDF | Read the fraction at or below a value. | 3 |
| VR1 | Review · A readable distribution | Retrieve earlier skills on a fresh table. | 3 |
| V07 | Rug marks | Keep individual observations visible beneath a distribution. | 3 |
| V08 | Count categories | Count observations, not a numeric measurement. | 3 |
| V09 | Compare averages | Distinguish an estimate from a count. | 3 |
| V10 | Point estimates | Show a group estimate with uncertainty. | 3 |
| V11 | Box plot | Read a median and interquartile spread. | 3 |
| V12 | Violin plot | Recognise smoothing inside categorical distributions. | 3 |
| VR2 | Review · Counts, averages, spread | Retrieve earlier skills on a fresh table. | 3 |
| V13 | Raw points | Show the observations behind a group summary. | 3 |
| V14 | Non-overlapping raw points | Separate observations without changing their values. | 3 |
| V15 | Large-sample categorical distribution | Recognise a letter-value plot and its limits. | 3 |
| V16 | Scatter plot | Plot two numeric measurements observation by observation. | 3 |
| V17 | Add dimensions to scatter | Use colour and shape without losing readability. | 3 |
| V18 | Line plot | Show a relationship along an ordered numeric axis. | 3 |
| VR3 | Review · Points and relationships | Retrieve earlier skills on a fresh table. | 3 |
| V19 | Understand lineplot aggregation | Notice when a line summarises repeated x values. | 3 |
| V20 | Regression view | View a fitted linear trend alongside observations. | 3 |
| V21 | Residual view | Inspect what a fitted line leaves unexplained. | 3 |
| V22 | Correlation heatmap | Show a correlation matrix on a fixed colour scale. | 3 |
| V23 | Categorical / matrix heatmap | Prepare a matrix before colouring its cells. | 3 |
| V24 | Multiple subplots | Manage two charts on one Figure. | 3 |
| VR4 | Review · Inspect the model view | Retrieve earlier skills on a fresh table. | 4 |
| V25 | Legends and palettes | Make category mappings readable without colour alone. | 3 |
| V26 | Axes and scales | Choose limits, ticks and transformations consciously. | 3 |
| V27 | Reference lines | Add a benchmark with a clear meaning. | 3 |
| V28 | Annotate important points | Explain an observation directly on the chart. | 3 |
| V29 | Exact precomputed bars | Draw numbers that have already been calculated. | 3 |
| V30 | Stacked bars | Build a part-to-whole bar from known components. | 3 |
| VR5 | Review · Finish with a purpose | Retrieve earlier skills on a fresh table. | 4 |
| V31 | Pair relationships | Explore several pairwise relationships in one figure. | 3 |
| V32 | Joint relationships | Connect a relationship to its marginal distributions. | 3 |
| V33 | Faceting | Repeat the same chart across comparable subsets. | 3 |
| V34 | Save a figure | Export the specific Figure you have finished. | 3 |
| V35 | Choose the right chart | Translate a question into a suitable visual form. | 3 |
| V36 | Avoid misleading charts | Make the scale and selection honest. | 3 |
| VR6 | Review · Figure-level exceptions | Retrieve earlier skills on a fresh table. | 4 |
| V37 | Visualise checkpoint | Build a coherent three-chart mini-report. | 3 |
