# Foundations visual accuracy review

Reviewed all 106 cards and all 326 exercise mappings against their teaching goal and reference operation. Inspected complete contact sheets for all three decks plus alternate-round sketches in light and dark themes. These are explicitly labelled concept sketches, not previews of the learner’s expected result. Shared primitives are retained; different operations receive distinct visual semantics.

The per-card fingerprints in `foundations-visual-review.json` cover both library and exercise SVGs, so changing a reviewed visual requires renewing its review. Browser checks cover three widths, both engines and both themes; retrieval rounds must show their source skill.

## Review findings and repairs

- Separated head/position/label selection, sorting/top-N, proportions/group means, dtype inspection/conversion, and duplicate inspection/removal.
- Replaced incorrect pivot-table, category-binning, category-recoding and date-field illustrations with their actual operations.
- Correlations are square and symmetric with unit diagonals, signed values within −1 to 1, and intensity reflecting magnitude. Category matrices encode non-negative counts.
- Counts, means, exact sums and ordered zero-baseline bars have different labelled encodings. Strip plots may overlap; swarm points do not.
- Corrected IQR fences for [10,11,12,13,14,40], consistent rug/histogram counts, transposed pairplot views, marginal counts, reference lines, and a legend that overlapped the data.
- Facets use the same chart across subsets; subplots contain different chart types. Alternate-round sketches reflect membership/range filters, missingness, sort directions, inner joins, scaling, and faceted chart types.
- Review libraries combine sketches of skills actually retrieved; each review exercise displays its own retrieved skill. Checkpoints show profiling, cleaning or a filtered three-view report.

## Per-card decisions

| Card | Concept represented | Alternate exercise visuals |
| --- | --- | --- |
| I01 · Meet a DataFrame | named lists → rows and columns | Same operation; new dataset/context |
| I01CSV · Load a CSV | CSV text → DataFrame | Same operation; new dataset/context |
| I02 · Take the first look | head(2): first two complete rows | Same operation; new dataset/context |
| I03 · How big is it? | shape → (3 rows, 3 columns) | Same operation; new dataset/context |
| I04 · What columns arrived? | columns → name, price, score | Same operation; new dataset/context |
| I05 · What types are these? | inspect each column’s data type | Same operation; new dataset/context |
| IR1 · Review · First contact | Take the first look; How big is it?; What columns arrived?; What types are these? | head(2): first two complete rows; shape → (3 rows, 3 columns); columns → name, price, score; inspect each column’s data type |
| I06 · Pick one column | one selected column → Series | Same operation; new dataset/context |
| I07 · Pick several columns | select two columns in a chosen order | Same operation; new dataset/context |
| I08 · Rows by position | iloc[:2, :2]: positions 0 and 1 | Same operation; new dataset/context |
| I09 · Rows and columns by label | loc: labels B–D, only price | Same operation; new dataset/context |
| I10 · Filter rows | price > 2: keep matching rows | isin: keep values in a named set; between 2 and 5: include both endpoints |
| I11 · Combine conditions | keep only rows passing BOTH tests | Same operation; new dataset/context |
| IR2 · Review · Select with intent | Pick several columns; Rows and columns by label; Combine conditions | select two columns in a chosen order; loc: labels B–D, only price; keep only rows passing BOTH tests |
| I12 · Sort the table | sort values: highest first | sort values: smallest first; group alphabetically, then age descending |
| I13 · Find extremes | largest 2: order AND limit rows | Same operation; new dataset/context |
| I14 · What values exist? | 3 observations, 2 distinct categories | Same operation; new dataset/context |
| I15 · Count categories | category counts → proportions | Same operation; new dataset/context |
| I16 · Find missing values | count missing cells per column | include missing values in category counts; missing count ÷ row count × 100 |
| I17 · Find duplicate rows | one EXTRA duplicate; keep all rows | Same operation; new dataset/context |
| IR3 · Review · Find the surprises | Sort the table; Count categories; Find missing values; Find duplicate rows | group alphabetically, then age descending; category counts → proportions; missing count ÷ row count × 100; one EXTRA duplicate; keep all rows |
| I18 · Describe numeric columns | describe: summaries across columns | Same operation; new dataset/context |
| I18S · Answer one numerical question | one column → specific numerical answers | sum: one number from a numeric column; median: middle value after sorting |
| I19 · Summarise groups | collapse each group to its mean | Same operation; new dataset/context |
| I20 · Compare categories | crosstab: counts for category pairs | Same operation; new dataset/context |
| I21 · Inspect numeric relationships | correlation: symmetric, from −1 to 1 | Same operation; new dataset/context |
| I22 · Inspect checkpoint | inspect without changing the original table | Same operation; new dataset/context |
| W01 · Protect the original | edit clean; original df stays unchanged | Same operation; new dataset/context |
| W02 · Rename columns | new column name, same values | Same operation; new dataset/context |
| W03 · Keep / reorder columns | same columns, different order | Same operation; new dataset/context |
| W04 · Drop columns | drop one column, keep every row | Same operation; new dataset/context |
| W05 · Filter unwanted rows | keep only the requested category | Same operation; new dataset/context |
| W06 · Sort and reset | sort values, then reset row labels | Same operation; new dataset/context |
| WR1 · Review · Keep the evidence | Protect the original; Keep / reorder columns; Sort and reset | edit clean; original df stays unchanged; same columns, different order; sort values, then reset row labels |
| W07 · Create a numeric column | doubled = price × 2, on each row | Same operation; new dataset/context |
| W08 · Create a conditional column | where(price > 3): high or low | Same operation; new dataset/context |
| W09 · Recode categories | replace category labels; keep others | Same operation; new dataset/context |
| W10 · Clean text | strip whitespace, standardise case | literal replacement inside each string |
| W11 · Search / extract text | contains “a”: select matching text | Same operation; new dataset/context |
| W12 · Convert numeric text | numeric text → numbers; invalid → NaN | Same operation; new dataset/context |
| WR2 · Review · Values with meaning | Create a numeric column; Clean text; Convert numeric text | doubled = price × 2, on each row; literal replacement inside each string; numeric text → numbers; invalid → NaN |
| W13 · Convert data types | same labels, explicit category dtype | Same operation; new dataset/context |
| W14 · Parse dates | text → datetime; invalid → NaT | Same operation; new dataset/context |
| W15 · Work with dates | extract calendar fields from dates | Same operation; new dataset/context |
| W16 · Drop missing rows | drop rows missing the required value | Same operation; new dataset/context |
| W17 · Fill missing values | fill only the gap with median 3 | Same operation; new dataset/context |
| W18 · Remove duplicates | remove extra copies, keep first row | Same operation; new dataset/context |
| WR3 · Review · Gaps and duplicates | Parse dates; Drop missing rows; Fill missing values; Remove duplicates | text → datetime; invalid → NaT; drop rows missing the required value; fill only the gap with median 3; remove extra copies, keep first row |
| W19 · Group and aggregate | one row per group, multiple summaries | Same operation; new dataset/context |
| W20 · Groupwise transformation | group means aligned to original rows | Same operation; new dataset/context |
| W21 · Build a pivot table | pivot_table: aggregate repeated pairs | Same operation; new dataset/context |
| W22 · Wide → long | wide → long: preserve all four values | Same operation; new dataset/context |
| W23 · Long → wide | long → wide: unique id/variable pairs | Same operation; new dataset/context |
| W24 · Combine tables by keys | left join: keep unmatched rows too | inner join: keep only matching keys |
| WR4 · Review · Reshape and connect | Group and aggregate; Groupwise transformation; Wide → long; Combine tables by keys | one row per group, multiple summaries; group means aligned to original rows; wide → long: preserve all four values; left join: keep unmatched rows too |
| W25 · Stack datasets | concat: append rows from both tables | Same operation; new dataset/context |
| W26 · Create bins | cut: (0,3] → low; (3,6] → high | Same operation; new dataset/context |
| W27 · Encode categories | one indicator column per category | Same operation; new dataset/context |
| W28 · Scale numeric columns | subtract mean, divide by standard deviation | min → 0, max → 1, preserve order |
| W29 · Handle outliers responsibly | flag outside fences; do not delete | Same operation; new dataset/context |
| W30 · Vectorise before apply | one expression, applied to every row | Same operation; new dataset/context |
| WR5 · Review · Prepare responsibly | Stack datasets; Create bins; Scale numeric columns; Handle outliers responsibly | concat: append rows from both tables; cut: (0,3] → low; (3,6] → high; subtract mean, divide by standard deviation; flag outside fences; do not delete |
| W31 · Wrangle checkpoint | copy → deduplicate → clean → sort | Same operation; new dataset/context |
| V01 · Meet Figure and Axes | Figure contains the plotting Axes | Same operation; new dataset/context |
| V02 · Finish a chart properly | finish title, x label and y label | Same operation; new dataset/context |
| V03 · Map variables visually | position + colour + shape + size | Same operation; new dataset/context |
| V04 · Histogram | adjacent bins count numeric observations | Same operation; new dataset/context |
| V05 · Density curve | curve height = estimated density | Same operation; new dataset/context |
| V06 · ECDF | ECDF: fraction at or below x | Same operation; new dataset/context |
| VR1 · Review · A readable distribution | Finish a chart properly; Histogram; ECDF | finish title, x label and y label; adjacent bins count numeric observations; ECDF: fraction at or below x |
| V07 · Rug marks | rug: one tick for each observation | Same operation; new dataset/context |
| V08 · Count categories | bar height = number of rows | Same operation; new dataset/context |
| V09 · Compare averages | bar height = group average | Same operation; new dataset/context |
| V10 · Point estimates | dot = mean; interval = ±1 SD | Same operation; new dataset/context |
| V11 · Box plot | box: Q1–Q3; line: median; dot: outlier | Same operation; new dataset/context |
| V12 · Violin plot | width shows density along the value axis | Same operation; new dataset/context |
| VR2 · Review · Counts, averages, spread | Count categories; Compare averages; Box plot | bar height = number of rows; bar height = group average; box: Q1–Q3; line: median; dot: outlier |
| V13 · Raw points | jitter separates points; overlap can remain | Same operation; new dataset/context |
| V14 · Non-overlapping raw points | swarm packs equal values without overlap | Same operation; new dataset/context |
| V15 · Large-sample categorical distribution | nested quantile bands expose the tails | Same operation; new dataset/context |
| V16 · Scatter plot | one point per pair of numeric values | Same operation; new dataset/context |
| V17 · Add dimensions to scatter | group = shape/colour; magnitude = size | Same operation; new dataset/context |
| V18 · Line plot | connect observations in time order | Same operation; new dataset/context |
| VR3 · Review · Points and relationships | Raw points; Add dimensions to scatter; Line plot | jitter separates points; overlap can remain; group = shape/colour; magnitude = size; connect observations in time order |
| V19 · Understand lineplot aggregation | line = mean; band = ±1 SD at each x | Same operation; new dataset/context |
| V20 · Regression view | straight fitted trend, with observed points | Same operation; new dataset/context |
| V21 · Residual view | residual = observed minus fitted; zero line | Same operation; new dataset/context |
| V22 · Correlation heatmap | signed correlations; diagonal always 1 | Same operation; new dataset/context |
| V23 · Categorical / matrix heatmap | annotated counts for category pairs | Same operation; new dataset/context |
| V24 · Multiple subplots | one Figure, two different chart types | Same operation; new dataset/context |
| VR4 · Review · Inspect the model view | Regression view; Residual view; Correlation heatmap; Multiple subplots | straight fitted trend, with observed points; residual = observed minus fitted; zero line; signed correlations; diagonal always 1; one Figure, two different chart types |
| V25 · Legends and palettes | legend maps category to colour AND shape | Same operation; new dataset/context |
| V26 · Axes and scales | equal x spacing = equal ratios on log scale | Same operation; new dataset/context |
| V27 · Reference lines | vertical AND horizontal median benchmarks | Same operation; new dataset/context |
| V28 · Annotate important points | arrow identifies the highest observation | Same operation; new dataset/context |
| V29 · Exact precomputed bars | precomputed totals → exact bar heights | Same operation; new dataset/context |
| V30 · Stacked bars | each total is the sum of both components | Same operation; new dataset/context |
| VR5 · Review · Finish with a purpose | Legends and palettes; Reference lines; Annotate important points; Stacked bars | legend maps category to colour AND shape; vertical AND horizontal median benchmarks; arrow identifies the highest observation; each total is the sum of both components |
| V31 · Pair relationships | diagonal: distributions; off-diagonal: pairs | Same operation; new dataset/context |
| V32 · Joint relationships | scatter plus matching x/y marginal counts | Same operation; new dataset/context |
| V33 · Faceting | same chart and scales, separate subsets | same box plot, one panel per subset; same histogram bins, one panel per subset |
| V34 · Save a figure | save this Figure as a PNG file | Same operation; new dataset/context |
| V35 · Choose the right chart | relationship / distribution / categories | one point per pair of numeric values; adjacent bins count numeric observations; bar height = number of rows |
| V36 · Avoid misleading charts | zero baseline; deliberate category order | zero baseline; explicit category order |
| VR6 · Review · Figure-level exceptions | Pair relationships; Joint relationships; Faceting; Avoid misleading charts | diagonal: distributions; off-diagonal: pairs; scatter plus matching x/y marginal counts; same histogram bins, one panel per subset; zero baseline; explicit category order |
| V37 · Visualise checkpoint | filter first, then compare three views | Same operation; new dataset/context |
