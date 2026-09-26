# Data Foundations Workflow Challenges: task and answer audit

Audited all **30** challenges on 26 September 2026: ten each in Inspect, Wrangle / Preprocess, and Visualise. I read every question, deliverable, answer, explanation, and alternative alongside its validator. I checked whether the stated output matches what Check answer accepts, whether an order rule changes the answer, and whether the reference takes an avoidable detour. Screenshots supplied by the learner were treated as examples to investigate, not as instructions to the application.

## Decision rule

- Keep order when it carries meaning: top-ranked records, chronological trends, original records in an extract, or a requested handoff sequence.
- Compare category summaries by their **labels and values** when display order is incidental. For a cross-tab, both labelled axes may appear in any order. Category charts may place categories in any order but must attach each value to the right label.
- Use ordinary task language and name the Python concept when a vague everyday word hides the expected output. `df.shape` is now identified as the row and column count.
- Name deliverables by the evidence they contain. “Comparable population,” “Numeric profile,” and “Missingness assessment” became “Attendees with scores,” “Current-week summary,” and “Missing values by column.”
- Prefer the shortest taught or discoverable reference that expresses the same calculation. The answer for IC09 now uses `pd.crosstab`; its Help introduces that function, while grouped counts remain valid.
- Keep distinct deliverables when they provide different evidence. A workflow may need an eligible table and a count of excluded rows even when the count can be derived from the table.

## Findings and disposition

| Challenge | Finding and action |
|---|---|
| IC01 | **Changed.** “Dimensions” was opaque. The task now names the shape, row count, column count, and `df.shape`; column types name `df.dtypes`. Type labels can appear in any order. |
| IC02 | Reviewed. Longest-first ranking and its ID tie-break make the requested handoff deterministic. Kept. |
| IC03 | **Changed.** Missing counts were tied to an unnecessary hours-then-score display order. They now match by field label. Eligibility remains tied to required fields. |
| IC04 | Reviewed. “Every repeated member” is explicit about the first copy and ID identity. Kept. |
| IC05 | Reviewed. Top three, availability filter, and tie-break define the actual shortlist. Kept. |
| IC06 | **Changed.** Alphabetical drink order did not affect counts or shares. Tasks and explanations now focus on the AM denominator; the answer uses `value_counts()`. Both summaries match by drink label. |
| IC07 | **Changed.** A long enumeration of descriptive rows obscured the simple `describe()` operation. The task now names it. Summary rows/columns and known counts match by their labels. |
| IC08 | **Changed.** The screenshot’s group counts and means did not require alphabetizing. The tasks now state population and measure; checks accept either group order. The reference uses straightforward `count()` and `mean()`. |
| IC09 | **Changed.** The screenshot’s reference split East and West, grouped twice, then assembled a DataFrame. The answer is now an available-stock filter plus `pd.crosstab()` and `nunique()`. Both cross-tab axes may be reordered; labels and cell values must still match. |
| IC10 | **Changed.** “Dimensions” now points directly to `df.shape`. Depot means and per-column missing counts match by label without a display-order rule. |
| WC01 | **Changed.** A list of cleaned distinct product labels no longer has to be alphabetized; the check rejects duplicates but accepts any list order. |
| WC02 | Reviewed. Numeric conversion, raw price retention, and the valid/invalid partition are necessary to the repair workflow. Kept. |
| WC03 | Reviewed. Date parsing, required-field filter, chronological handoff, and consecutive index are explicit. Kept. |
| WC04 | Reviewed. First occurrence of a confirmed duplicate ID is a stated data policy; legitimate repeat purchases remain. Kept. |
| WC05 | Reviewed. Parsing both numeric inputs and calculating line totals are necessary for the sales total. Kept. |
| WC06 | Reviewed. Zero-filling is authorized only for discount; the missing-price and missing-quantity rules are explicit. Kept. |
| WC07 | Reviewed. Matched and unmatched outputs are separate operational lists. Lookup uniqueness prevents duplicated deliveries. Kept. |
| WC08 | **Changed.** Sorting the combined file by delivery ID was unnecessary. The answer now aligns the schemas and appends both batches; the check matches rows by delivery ID in either order. |
| WC09 | **Changed.** Requiring `melt`’s steps-before-minutes row order was incidental. The task now asks for both measurements for every record, including missing values; checks match by record ID and measure. |
| WC10 | **Changed.** Billing rows no longer have to be sorted by order ID or have a reset index. The first-upload and price policies remain; the check matches the compact extract by order ID. |
| VC01 | **Changed.** Drink count order is presentation, not evidence. The answer omits sorting; labelled bars/points can use any category order. |
| VC02 | Reviewed. Histogram intervals and all parseable durations are the substantive requirements; bin count is flexible. Kept. |
| VC03 | Reviewed. Complete hours/score pairs and visible paired points match the question; no causal claim is implied. Kept. |
| VC04 | Reviewed. Chronological order carries the trend’s meaning. Kept. |
| VC05 | **Changed.** Group mean order is incidental; means and the plotted category comparison now match by label. Zero baseline remains for bars. |
| VC06 | **Changed.** The arbitrary alphabetical group-position rule is gone. The point check accepts either group order while retaining every learner’s group and score. |
| VC07 | **Changed.** The arbitrary alphabetical depot-position rule is gone. Box statistics are checked against the displayed depot labels, including medians, whiskers, and outliers. |
| VC08 | Reviewed. Chronological daily values and the labelled 9,000-step benchmark are integral to the question. Kept. |
| VC09 | **Changed.** Drink counts may use any label order. The two panels still show the two requested views from the same population. |
| VC10 | **Changed.** Category unit totals and the chart may use any category order. PNG identity, 150 dpi, and complete labels remain part of the export brief. |

## Implementation and verification

The registry records `unorderedIndex`, `unorderedColumns`, `unorderedItems`, or `unorderedRowsBy` only on outputs where order is incidental. The checker aligns these outputs by labels or business keys while retaining unique-label, value, shape, and output-type checks. Chart checks map displayed category labels to expected values and continue to reject missing categories, misplaced bars, altered values, hidden marks, invalid box statistics, and bad exports.

The native test suite runs all 30 reference answers and negative cases. Added equivalence tests cover reversed IC08 group summaries, reversed IC09 cross-tab rows and columns, reordered descriptive statistics, reordered labels, reordered bars, and reversed point/box category positions. Added negative tests verify that swapping means under the wrong labels and replacing cross-tab labels still fail.

The full “Explained solution” previously displayed the fixture setup as well as the answer, creating the very long code block in the screenshot. The workspace now presents the concise `solution` first and keeps setup in a separate disclosure. The [site UX audit](audit-site-ux-2026-09-26.md) covers that shared presentation change.
