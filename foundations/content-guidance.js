/* Authored task briefs and concept dependencies for Inspect and Wrangle. */
(function (root) {
  'use strict';

  // These are teaching declarations, never records of a learner's activity.
  // The order in curriculum.js is the source of truth for prerequisite checks.
  const concepts = {
    I01: [['python.import', 'python.assignment', 'python.dictionary', 'python.list', 'pandas.dataframe-construction'], [], [], []],
    I02: [['python.method-call', 'pandas.head', 'pandas.tail', 'pandas.sample', 'pandas.random-state'], ['pandas.dataframe-construction'], [], ['I01']],
    I01CSV: [['pandas.read-csv', 'pandas.csv-separator'], ['python.import', 'python.assignment', 'pandas.head'], [], ['I01', 'I02']],
    I03: [['python.tuple', 'python.len', 'pandas.shape'], ['pandas.read-csv'], [], ['I01CSV']],
    I04: [['python.list-conversion', 'pandas.columns', 'pandas.index'], ['pandas.read-csv'], [], ['I01CSV', 'I03']],
    I05: [['pandas.info', 'pandas.dtypes'], ['pandas.read-csv', 'pandas.columns'], [], ['I04']],
    I06: [['pandas.series-selection'], ['pandas.head', 'pandas.tail', 'pandas.index'], [], ['I02', 'I04']],
    I06S: [['pandas.series-labels', 'pandas.series-values', 'numpy.array'], ['pandas.series-selection', 'python.list-conversion', 'pandas.tail'], ['pandas.index'], ['I04', 'I06']],
    I07: [['pandas.dataframe-selection'], ['python.list', 'pandas.tail'], ['pandas.series-selection'], ['I06']],
    I08: [['pandas.iloc', 'python.slice'], ['pandas.dataframe-selection'], [], ['I07']],
    I09: [['pandas.loc'], ['pandas.index', 'pandas.dataframe-selection'], ['python.slice'], ['I04', 'I08']],
    I10: [['python.comparison', 'pandas.boolean-mask', 'pandas.filter', 'pandas.isin', 'pandas.between'], ['pandas.series-selection'], [], ['I06']],
    I11: [['pandas.boolean-combination'], ['python.comparison', 'pandas.boolean-mask', 'pandas.between'], [], ['I10']],
    I12: [['pandas.sort-values'], ['pandas.boolean-mask'], [], ['I10', 'I11']],
    I13: [['pandas.nlargest', 'pandas.nsmallest'], ['pandas.boolean-mask'], ['pandas.sort-values'], ['I10', 'I12']],
    I13L: [['pandas.idxmax', 'pandas.idxmin'], ['pandas.index', 'pandas.loc', 'pandas.boolean-mask', 'python.dictionary'], ['pandas.nlargest'], ['I06S', 'I09', 'I13']],
    I14: [['pandas.unique', 'pandas.nunique'], ['pandas.boolean-mask', 'python.list-conversion'], [], ['I10']],
    I15: [['pandas.value-counts', 'pandas.normalized-counts'], ['pandas.boolean-mask'], ['pandas.nunique'], ['I10', 'I14']],
    I16: [['pandas.isna', 'pandas.sum', 'pandas.mean'], ['pandas.boolean-mask'], ['pandas.boolean-combination'], ['I10', 'I11']],
    I17: [['pandas.duplicated'], ['pandas.sum', 'pandas.boolean-mask'], [], ['I16']],
    I18: [['pandas.describe', 'statistics.numeric-summary'], ['pandas.boolean-mask', 'pandas.dataframe-selection'], [], ['I07', 'I10', 'I16']],
    I18S: [['pandas.median'], ['pandas.series-selection'], ['pandas.mean', 'pandas.sum', 'statistics.numeric-summary'], ['I16', 'I18']],
    I19: [['pandas.groupby', 'pandas.agg', 'pandas.group-summary'], ['pandas.mean', 'pandas.sum', 'pandas.boolean-mask'], [], ['I10', 'I18S']],
    I19S: [['pandas.grouped-series-order'], ['pandas.groupby', 'pandas.mean', 'pandas.median', 'pandas.series-values', 'python.list-conversion'], ['pandas.index', 'pandas.sort-values'], ['I06S', 'I12', 'I18S', 'I19']],
    I19A: [['pandas.series-alignment', 'pandas.astype', 'pandas.dtype-as-text'], ['pandas.dataframe-construction', 'pandas.groupby', 'pandas.value-counts', 'pandas.dtypes', 'pandas.isna', 'pandas.sum'], ['pandas.index'], ['I01', 'I05', 'I16', 'I19S']],
    I20: [['pandas.crosstab'], ['pandas.series-selection', 'pandas.boolean-mask'], ['pandas.value-counts'], ['I10', 'I15']],
    I21: [['pandas.corr', 'statistics.linear-association'], ['pandas.boolean-mask', 'pandas.dataframe-selection'], [], ['I07', 'I10', 'I18']],
    I22: [[], ['pandas.series-alignment', 'pandas.dtype-as-text', 'pandas.isna', 'pandas.sum', 'pandas.boolean-mask', 'pandas.describe', 'pandas.groupby', 'pandas.mean', 'pandas.dataframe-selection'], [], ['I10', 'I18', 'I19', 'I19A']],
    W01: [['pandas.copy'], ['pandas.dataframe-selection', 'pandas.boolean-mask', 'pandas.sort-values'], [], ['I07', 'I10', 'I12']],
    W02: [['pandas.rename'], ['python.assignment', 'python.dictionary', 'pandas.dataframe-selection'], [], ['I01', 'I07', 'W01']],
    W03: [[], ['python.assignment', 'pandas.boolean-mask'], ['pandas.dataframe-selection'], ['I07', 'I10', 'W02']],
    W04: [['pandas.drop'], ['pandas.copy'], ['pandas.dataframe-selection'], ['W01', 'W03']],
    W05: [[], ['pandas.boolean-combination', 'pandas.sort-values'], ['pandas.boolean-mask'], ['I11', 'I12', 'W03']],
    W06: [['pandas.reset-index'], ['pandas.boolean-mask', 'pandas.sort-values'], ['pandas.index'], ['I04', 'I12', 'W05']],
    W07: [['pandas.column-assignment', 'pandas.derived-column', 'pandas.vector-arithmetic'], ['pandas.series-selection', 'python.assignment'], [], ['I06', 'W03']],
    W08: [['numpy.where', 'numpy.select'], ['pandas.column-assignment', 'pandas.boolean-combination'], [], ['I11', 'W07']],
    W09: [['pandas.replace', 'pandas.map'], ['python.dictionary', 'pandas.copy', 'pandas.column-assignment'], [], ['W01', 'W07']],
    W10: [['pandas.str-accessor', 'pandas.str-strip', 'pandas.str-lower', 'pandas.str-title', 'pandas.str-replace'], ['pandas.copy', 'pandas.boolean-mask', 'pandas.column-assignment'], [], ['W01', 'W07', 'W09']],
    W11: [['pandas.str-contains'], ['pandas.boolean-mask', 'pandas.boolean-combination', 'pandas.dataframe-selection'], ['pandas.str-accessor'], ['I11', 'W10']],
    W12: [['pandas.to-numeric', 'pandas.coerce-invalid'], ['pandas.isna', 'pandas.sum', 'pandas.copy', 'pandas.boolean-mask', 'pandas.column-assignment'], [], ['I16', 'W01', 'W07']],
    W13: [['pandas.nullable-dtype'], ['pandas.dtypes', 'pandas.column-assignment'], ['pandas.astype'], ['I05', 'I19A', 'W07', 'W12']],
    W14: [['pandas.to-datetime', 'pandas.nat'], ['pandas.copy', 'pandas.isna', 'pandas.boolean-mask', 'pandas.sort-values'], ['pandas.coerce-invalid'], ['I12', 'W01', 'W12']],
    W15: [['pandas.dt-accessor', 'pandas.dt-year', 'pandas.dt-month', 'pandas.dt-day-name', 'pandas.sort-index'], ['pandas.to-datetime', 'pandas.value-counts', 'pandas.column-assignment'], [], ['I15', 'W07', 'W14']],
    W16: [['pandas.dropna'], ['pandas.copy', 'pandas.to-numeric', 'pandas.isna'], [], ['W01', 'W12']],
    W17: [['pandas.fillna'], ['pandas.copy', 'pandas.isna', 'pandas.median', 'pandas.column-assignment'], [], ['I16', 'I18S', 'W01', 'W07']],
    W18: [['pandas.drop-duplicates'], ['pandas.copy', 'pandas.sort-values', 'pandas.reset-index'], ['pandas.duplicated'], ['I17', 'W01', 'W06']],
    W19: [['pandas.named-aggregation', 'pandas.size', 'pandas.count'], ['pandas.groupby', 'pandas.mean', 'pandas.sum', 'pandas.boolean-mask'], ['pandas.agg'], ['I19', 'W18']],
    W20: [['pandas.transform'], ['pandas.groupby', 'pandas.mean', 'pandas.column-assignment', 'pandas.boolean-mask', 'pandas.vector-arithmetic'], ['pandas.series-alignment'], ['I19A', 'W07', 'W19']],
    W21: [['pandas.pivot-table'], ['pandas.mean', 'pandas.sum', 'pandas.boolean-mask'], ['pandas.groupby', 'pandas.crosstab'], ['I20', 'W19']],
    W22: [['pandas.melt'], ['pandas.boolean-mask'], ['pandas.dataframe-selection'], ['I07', 'I10', 'W21']],
    W23: [['pandas.pivot'], ['pandas.boolean-mask', 'pandas.melt'], ['pandas.pivot-table'], ['W21', 'W22']],
    W24: [['pandas.merge', 'pandas.join-validation'], ['pandas.isna', 'pandas.boolean-mask'], [], ['I16', 'W23']],
    W25: [['pandas.concat'], ['pandas.boolean-mask', 'pandas.sort-values', 'pandas.reset-index'], [], ['W06', 'W24']],
    W26: [['pandas.cut', 'pandas.qcut'], ['pandas.column-assignment'], [], ['W07', 'W25']],
    W27: [['pandas.get-dummies'], ['pandas.boolean-mask', 'pandas.dataframe-selection'], [], ['I07', 'I10', 'W26']],
    W28: [['sklearn.standard-scaler', 'sklearn.minmax-scaler', 'sklearn.fit-transform', 'sklearn.fit', 'sklearn.transform'], ['pandas.iloc', 'pandas.dataframe-selection', 'numpy.array'], [], ['I06S', 'I08', 'W27']],
    W29: [['pandas.quantile', 'statistics.iqr-fences'], ['pandas.boolean-combination', 'pandas.boolean-mask', 'pandas.column-assignment', 'pandas.sort-values'], ['statistics.numeric-summary'], ['I11', 'I12', 'I18', 'W07']],
    W30: [['pandas.vectorisation'], ['pandas.column-assignment', 'pandas.mean', 'pandas.boolean-mask', 'pandas.dataframe-selection'], ['pandas.vector-arithmetic'], ['W07', 'W09', 'W29']],
    W31: [[], ['pandas.copy', 'pandas.drop-duplicates', 'pandas.str-strip', 'pandas.str-lower', 'pandas.str-title', 'pandas.str-replace', 'pandas.to-numeric', 'pandas.to-datetime', 'pandas.fillna', 'pandas.median', 'pandas.dropna', 'pandas.vector-arithmetic', 'pandas.sort-values', 'pandas.reset-index', 'pandas.dataframe-selection'], [], ['W01', 'W06', 'W07', 'W10', 'W12', 'W14', 'W16', 'W17', 'W18']]
  };

  // One explanation per idea. Worked code and value tables carry the detail.
  const conciseGuides = {
    I01: ['A DataFrame is a table. A dictionary names its columns; equal-length lists supply the rows.', 'Names ["A", "B"] and ages [2, 4] form rows A/2 and B/4.', 'Use quotes for text and `=` to store a value under a name.'],
    I02: ['A preview selects rows with all their columns and leaves `df` unchanged.', 'For rows A–D, `head(2)` shows A/B; `tail(2)` shows C/D.', 'A spot check can miss important groups.'],
    I01CSV: ['`read_csv()` loads a text file into a DataFrame. The separator keeps its fields apart.', 'In tiny.csv, `name,price` supplies two column names. The next line, `A,2`, becomes one row.', 'Import pandas as `pd`; use an available filename.'],
    I03: ['`df.shape` gives the table’s size as (rows, columns).', 'A six-row, five-column table has shape (6, 5).', '`shape` is an attribute: no parentheses.'],
    I04: ['`df.columns` holds the exact field names in their current order.', 'The columns ["name", "age"] describe two fields, regardless of the number of rows.', 'Names are case-sensitive; preserve their spelling.'],
    I05: ['A dtype describes how a column stores values. `info()` also reports non-missing counts.', 'Ages may use int64; decimal prices may use float64.', 'A stored type does not prove that values are correct.'],
    I06: ['One column name inside brackets returns a Series: values with row labels.', '`df["age"]` is a Series; `df[["age"]]` is a table.', 'Use the exact column name, including case.'],
    I06S: ['A Series pairs each value with an index label. Labels and numbered positions are different.', 'Labels [101, 109, 103] pair with readings [12, 4, 19].', '`index` has no parentheses; `to_numpy()` returns values without labels.'],
    I07: ['A list of column names inside `df[...]` returns a DataFrame.', 'Selecting ["rating", "price"] keeps that column order.', 'Even a list containing one column name returns a table.'],
    I08: ['`iloc` selects numbered positions. In `start:stop`, the stop is excluded.', '`df.iloc[:3]` selects positions 0, 1 and 2.', 'A single position returns a Series; a slice returns a table.'],
    I09: ['`loc` selects labels. A label slice includes its end label.', 'Labels B through D include B, C and D.', 'Use a list for separated labels or a chosen order.'],
    I10: ['A condition makes one True/False flag per row. `df[mask]` keeps the True rows.', 'For ages [2, 4, 6], `age > 4` keeps only 6.', '`==` compares; `=` assigns. Filtering keeps row order and labels.'],
    I11: ['Combine row masks with `&` for both, `|` for either and `~` to reverse.', '“Age at least 3 AND Dog” keeps rows meeting both tests.', 'Put each comparison in parentheses; pandas masks need `&` and `|`.'],
    I12: ['Sorting moves whole rows. Additional keys order ties in the first key.', 'Sort groups A–Z, then scores highest first within each group.', '`sort_values()` returns a table; assign it back to change `df`.'],
    I13: ['`nlargest()` returns the requested number of highest-value records.', 'The two largest prices in [3, 8, 2] are 8 and 3.', 'Filter first when the extreme must come from eligible rows.'],
    I13L: ['`idxmax()` returns the largest known value’s row label, rather than its value or numbered position.', 'For reading 19 at row label 103, `idxmax()` returns 103.', 'Find the extreme within the eligible table. Ties return the first matching label.'],
    I14: ['`nunique()` counts distinct known values in one column.', '["A", "B", "A"] contains two distinct labels.', '`nunique()` excludes missing values by default.'],
    I15: ['`value_counts()` counts records per category; `normalize=True` returns proportions.', 'Two A records out of four give proportion 0.5, or 50%.', 'Missing values are excluded unless `dropna=False`.'],
    I16: ['`isna()` marks gaps True. Missing means unknown or absent, rather than zero.', '[5, missing, 0, missing] has two gaps: 50%.', 'Present text such as "oops" can still be invalid.'],
    I17: ['`duplicated()` flags repeated rows; its default leaves each first occurrence unflagged.', 'Rows A/B/A/A produce flags False/False/True/True.', 'Use Boolean `False` without quotes to include first copies. Repeated categories alone are not duplicate rows.'],
    I18: ['`describe()` summarises numeric columns with count, centre, spread and percentiles.', 'The 50% row is the median; count excludes missing values.', 'Investigate unusual values before deciding to change them.'],
    I18S: ['`mean()` adds the known values and divides by their count.', 'For [2, 3, 10], the mean is (2 + 3 + 10) / 3 = 5.', 'Missing values are skipped; an all-missing mean is undefined.'],
    I19: ['`groupby()` gathers equal category labels; an aggregation gives one result per group.', 'Prices 2 and 4 in one group have mean 3 and total 6.', 'An average alone does not show group size or variation.'],
    I19S: ['A grouped Series holds categories in its index and their means in its values.', 'Mean readings Ash=10, Birch=4, Cedar=7 have labels Ash, Birch, Cedar.', 'Read `index` when the requested result is the category labels.'],
    I19A: ['A DataFrame built from Series matches their index labels, regardless of displayed order.', 'Means A=4/B=9 and counts B=3/A=2 match A with 4/2 and B with 9/3.', 'Keep labels for alignment. An unreported count stays missing.'],
    I20: ['A crosstab counts records for pairs of categories.', 'A row with `flavour` fruity and `shelf` A adds one to that cell.', 'Zero means no observed rows for that category pair.'],
    I21: ['Correlation measures linear association, from −1 to 1 when defined.', 'Positive correlation means larger values tend to occur together.', 'Correlation does not establish causation; tiny samples can mislead.'],
    I22: ['Combine familiar inspection tools without changing the source table.', 'A quality profile pairs each field’s dtype with its missing count.', 'Keep the selected population clear before summarising it.'],
    W01: ['`copy()` creates a separate table for changes while preserving `df`.', 'Select or sort `clean`; the original `df` remains intact.', 'Giving `df` another name alone does not make a copy.'],
    W02: ['`rename()` changes column headings without changing their values.', 'Rename `price` to `amount` with a dictionary mapping old name to new name.', 'Assign the returned table to keep the rename.'],
    W03: ['Select a list of columns to keep and reorder them.', '["name", "age"] keeps just those fields in that order.', 'Assignment replaces the working table; omitted fields are dropped.'],
    W04: ['`drop(columns=[...])` removes named fields and keeps the rows.', 'Dropping `shelf` leaves every candy record.', 'Store the returned table to keep the change.'],
    W05: ['Assign a filtered table when only matching rows belong in the working data.', 'Keeping `flavour` "fruity" excludes other flavours.', 'State the eligibility rule before removing rows.'],
    W06: ['Sort first, then reset row labels. `drop=True` discards the old labels.', 'Sorted labels [3, 1, 5] become [0, 1, 2].', 'Without `drop=True`, old labels become a column named `index`.'],
    W07: ['Column arithmetic calculates a value for every row.', 'Prices [2, 3] become pair prices [4, 6] when multiplied by 2.', 'Use a new column name to preserve the source values; check units.'],
    W08: ['`np.where()` chooses one of two values from a row’s True/False test.', 'Prices [2, 4] tested against > 3 become ["low", "high"].', 'A strict `>` excludes equality.'],
    W09: ['`replace()` changes listed values and keeps unmatched values as they are.', 'With {"A": "Group A"}, ["A", "B"] becomes ["Group A", "B"].', 'Assign the returned values to keep the change.'],
    W10: ['`.str` applies text methods to a column. Chain the steps in the required order.', '" TEA-CUP " becomes "tea cup" after strip, lowercase and literal hyphen replacement.', 'Each text step needs `.str`; case and spacing changes do not fix spelling.'],
    W11: ['`str.contains()` makes a row mask for matching text.', 'Ignoring case, literal "a" matches "Latte" and "Tea".', 'Use `regex=False` for literal text and `na=False` for missing values.'],
    W12: ['`to_numeric()` parses numbers stored as text. `errors="coerce"` makes invalid text missing.', '"6.20" becomes 6.2; "oops" becomes NaN.', 'Keep a separate parsed column when raw text must remain.'],
    W13: ['`astype()` changes a column’s storage type.', 'Changing labels A/B/A to `"category"` keeps the same three values and row order.', 'Conversion must fit the values; invalid conversions can raise an error.'],
    W14: ['`to_datetime()` parses date text using the stated format.', '"2026-06-01" becomes a date; invalid text becomes NaT with coercion.', 'NaT marks an unknown date.'],
    W15: ['After parsing dates, `.dt` extracts calendar fields.', '2026-06-01 has year 2026, month 6 and weekday Monday.', 'Invalid dates remain missing in derived fields.'],
    W16: ['`dropna(subset=[...])` removes rows missing required fields.', 'A report requiring price can keep rows with unknown tips.', 'Parse first: invalid numeric text may reveal additional missing values.'],
    W17: ['`fillna()` replaces gaps using an explicit assumption.', 'If missing discount means none, fill it with zero.', 'A median fill is an assumption; preserve a missingness flag when needed.'],
    W18: ['`drop_duplicates()` removes extra identical records.', 'Rows A/B/A become A/B when keeping the first occurrence.', 'Remove only confirmed copies; preserve labels or reset them deliberately.'],
    W19: ['`agg()` makes one row per group. In `output=("source", "operation")`, output names a new column.', 'Prices 2 and 4 give `mean_amount` 3 and `records` 2; a lone price 8 gives 8 and 1.', '`size` counts rows; `count` counts known values. They agree when nothing is missing.'],
    W20: ['`transform()` repeats a group statistic at each original row label.', 'A group mean of 5 is assigned to every row in that group.', 'Aggregation shrinks groups; transformation keeps the original rows.'],
    W21: ['A pivot table aggregates measurements for row/column category pairs.', 'Mean `price` can be compared by `flavour` rows and `shelf` columns.', 'Repeated pairs are aggregated; absent combinations stay missing.'],
    W22: ['`melt()` stacks measurement columns into rows and repeats their identifiers.', '`price` 2 and `rating` 4 become two rows with `candy`, `measure`, `value`.', '`measure` and `value` are chosen output headings. Two measurements double the row count.'],
    W23: ['`pivot()` turns `measure` labels into column headings without aggregation.', 'A `candy`/`measure`/`value` table becomes one row per `candy`.', 'Each identifier/measurement pair must be unique. Missing combinations remain missing.'],
    W24: ['`merge()` matches rows using a shared key.', 'A left join keeps every source row and attaches matching lookup fields.', '`validate="many_to_one"` checks lookup-key uniqueness; unmatched lookup values are missing.'],
    W25: ['`concat()` stacks compatible tables in the supplied order.', '`second` appears below `first`; all their rows remain.', '`ignore_index=True` creates consecutive labels; otherwise original labels remain.'],
    W26: ['`cut()` assigns values to fixed intervals with chosen labels.', 'Edges [0, 3, 10] define [0, 3] and (3, 10] when the lowest edge is included.', 'Values outside the intervals become missing.'],
    W27: ['One-hot encoding replaces a category with one indicator column per label.', 'A Cat row has Cat=1 and other species indicators=0.', 'Integer indicators use 0/1; preserve the other fields.'],
    W28: ['A scaler learns reference values and rescales each column separately.', '`StandardScaler` subtracts the mean and divides by the population standard deviation.', 'Fit on training rows; use the fitted scaler to transform later rows.'],
    W29: ['Use 1.5×IQR fences to flag values for investigation.', 'IQR = Q3 − Q1; fences are Q1 − 1.5×IQR and Q3 + 1.5×IQR.', 'Keep original values and rows: a flag requires review.'],
    W30: ['Vectorised arithmetic applies a calculation to every column value.', 'Multiplying prices by 1.1 raises them by 10%.', 'Use a new field to preserve the source values.'],
    W31: ['Combine cleaning steps under the stated missing-value and duplicate policies.', 'Parse before checking numeric completeness; deduplicate before calculating the required median.', 'Keep `df` intact and make only the requested changes.']
  };
  const conciseSyntax = {
    W19: ['Group by `flavour`; keep it as a column.', 'Calculate one result row per group.', 'Name the new output column `mean_amount`.', 'A two-item tuple: source column `price`, then operation `mean`.', 'Name the new output column `records`.', 'Use source column `price` with row-count operation `size`.'],
    W28: ['Import the standardisation tool.', 'Create the scaler.', 'Select both columns in this order.', 'Learn each column’s mean/spread and return its scaled values.'],
    W26: ['Assign prices to these fixed intervals.', 'Name the two intervals in order.', 'Include zero in the first interval.'],
    W08: ['Import NumPy as `np`.', 'Create the new `band` column.', 'Choose yes for True rows; no otherwise.', 'Prices equal to 2.1 fail this strict test.', 'Use "high" for True and "low" for False.'],
    I19A: ['Match the Series by bench label.', 'Labels used to match values.', 'Remove labels; table construction then matches positions.'],
    I10: ['Test each price; return one Boolean per row.', 'Keep rows with True flags.', 'Compare values; `=` assigns.'],
    I12: ['Sort by this column.', 'Put largest values first.', 'Name the filtered table.'],
    I02: ['The source table.', 'Access the table’s method.', 'Select first rows.', 'Call the method for two rows.'],
    I06: ['Select one Series.', 'Select from the table.', 'Values with row labels.'],
    I16: ['Mark missing cells True.', 'Count True flags down each column.', 'Missing-value representations.']
  };
  const conciseChoices = {
    W19: ['Group by `flavour`; keep it as a column.', 'Calculate one result row per group.', 'Create `mean_amount` from each group’s mean `price`.', 'Create `records` from each group’s row count.'],
    W28: ['Subtract the training mean and divide by its population standard deviation.', 'Map the training minimum/maximum to 0/1; constant columns become 0.', 'Learn and apply the scale to these rows.', 'Fit training rows; reuse the scale on other rows.'],
    W26: ['Three edges define two intervals; supply two labels.', 'Include each upper edge; include the first lower edge with `include_lowest=True`.'],
    W08: ['Choose yes for True rows; no otherwise.', 'Use the first matching rule.', 'Store a Boolean flag directly.'],
    I19A: ['Match Series by label; keep the union of their labels.', 'Keep unreported cells missing.', 'Arrays match positions rather than labels.'],
    I10: ['Strictly greater / greater or equal.', 'Match either listed value.', 'Include both endpoints by default.'],
    I12: ['Smallest first by default.', 'Largest first.', 'Match each key with its sort direction.'],
    I16: ['Count missing cells per column.', 'Return the percentage missing per column.', 'Reverse the missing mask to keep present prices.'],
    I06: ['Select one labelled Series.', 'Preview two rows, then select their ages.', 'Select the final two ages with original labels.'],
    I02: ['Select first / last rows; default five.', 'Sample rows; the fixed seed repeats the choice on identical data.']
  };
  const conciseTransitions = {
    'I02-3': ['`sample()` chooses rows from across the table. A fixed seed repeats the selection.', 'The two-row sample below selects D and C.', 'A fixed seed makes a spot check repeatable, not representative.', ['Choose rows from across the table.', 'Select two rows.', 'Repeat the selection on identical input.']],
    'I06-2': ['Brackets select any column name. Dot notation is a shortcut for names that do not conflict with pandas.', '`sample["reading"]` and `sample.reading` select the same Series.', 'Names with spaces or conflicts such as "index" need brackets.', ['Select by exact column name.', 'Shortcut for this ordinary column name.', 'The row-label property / a column named "index".']],
    'I10-2': ['`isin()` flags values belonging to a supplied list.', 'Tea and Latte match; Coffee does not.', 'Filtering retains original row order.', ['Read each drink value.', 'Flag either allowed drink True.', 'Keep True rows.']],
    'I10-3': ['`between()` flags values inside a range, including both endpoints by default.', 'The range 2–5 keeps ages 2 and 5.', 'Strict `>` or `<` tests would exclude an endpoint.', ['Read each age.', 'Flag ages 2–5, including endpoints.', 'Keep True rows.']],
    'I12-3': ['Supply one sort direction per key. Later keys order ties in earlier keys.', 'Group A comes first; its score 3 precedes score 1.', 'The column and direction lists must match.', ['Sort group first, then score within group.', 'Group A–Z; score highest first.', 'Sort whole rows so values stay paired.']],
    'I14-2': ['`unique()` returns distinct values in first-appearance order.', '["Large", "Small", "Large"] gives ["Large", "Small"].', '`nunique()` returns a count; `unique()` returns the values.', ['Find distinct labels in appearance order.', 'Convert the returned array to a list.', 'Count distinct labels instead of returning them.']],
    'I16-2': ['The mean of missing-value flags is the missing fraction. Multiply by 100 for a percentage.', 'Two gaps among four prices give 50%.', '`sum()` counts gaps; `mean() * 100` gives their percentage.', ['Mark gaps True.', 'Average flags: True=1, False=0.', 'Convert fraction to percentage.']],
    'I16-3': ['Reverse an `isna()` mask with `~`, or use `notna()`, to select present values.', 'Prices 2 and 4 remain; the missing price is excluded.', 'A present value can still contain invalid text.', ['Flag missing prices True.', 'Reverse the flags.', 'Keep True rows.', 'Flag present prices True directly.']],
    'I19A-3': ['`df.dtypes` describes storage types. `astype(str)` turns those descriptions into text.', 'The dtype int64 becomes the text "int64".', 'Convert the dtype descriptions, leaving the original measurements unchanged.', ['Storage types indexed by field name.', 'Convert descriptions to Python text.', 'Missing counts indexed by field name.', 'Match both Series by field name.']],
    'W08-2': ['`np.select()` uses the result for the first True condition.', 'Price 6 matches both tests, so test > 5 first.', 'Testing > 3 first would label 6 "middle".', ['Choose among several conditions.', 'Check in order; first True wins.', 'Pair conditions with labels by position.', 'Use "low" if no test matches.', 'Store the chosen labels.']],
    'W09-2': ['`map()` looks up each label and leaves unmatched labels missing.', 'Large gets code 1; Small gets a missing code.', '`replace()` keeps unmatched labels. Missing values can make numeric codes display as 1.0.', ['Read original size labels.', 'Look up codes; unmatched labels become missing.', 'Store codes in a new column.']],
    'W10-2': ['After trimming and lowercasing, `str.replace()` swaps literal text inside each value.', '"  Sky-Run  " becomes "sky run".', 'Each chained text method needs `.str`.', ['Trim both ends.', 'Make letters lowercase.', 'Replace literal hyphens with spaces.', 'Store the cleaned values.']],
    'W15-3': ['`value_counts()` sorts by frequency. `sort_index()` orders the resulting month labels.', 'Month 1 comes before month 3, regardless of their counts.', 'Use label order for calendar sequence.', ['Count each observed month number.', 'Order those month labels numerically.']],
    'W26-2': ['`qcut()` chooses sample-based boundaries to make similarly sized groups.', 'Prices 2/3 form the lower group; 8/9 form the upper group.', 'Ties can prevent equal counts or distinct bins. `cut()` uses fixed boundaries instead.', ['Choose boundaries from sample values.', 'Use these numeric prices.', 'Aim for two groups of equal size.', 'Name the groups lower and upper.', 'Store each row’s group.']],
    'W28-2': ['`MinMaxScaler` maps the training minimum to 0 and maximum to 1.', 'Scores [10, 20, 30] become [0, 0.5, 1].', 'Fit training rows; transform later rows with the same scaler.', ['Import the scaler.', 'Create a scaler for minimum/maximum.', 'Select a two-dimensional score table.', 'Learn the bounds and return scaled values.']],
    'W28-3': ['`fit()` learns reference values; `transform()` reuses them on other rows.', 'Training scores 10/20 have mean 15 and population SD 5; score 30 becomes 3.', 'Held-out rows must not affect the training scale.', ['Use the first two training rows.', 'Store their mean and spread; return no scaled rows.', 'Select the held-out row as a table.', 'Apply the learned scale to that row.']]
  };
  function shortenTeaching(lesson) {
    const copy = conciseGuides[lesson.id];
    if (copy && lesson.guide) [lesson.guide.idea, lesson.guide.example, lesson.guide.note] = copy;
    if (lesson.id === 'W19') lesson.guide.followNote = '`size` counts every group row, including missing prices. Use it for `records`. These prices are complete, so `count` gives the same totals.';
    if (lesson.id === 'I06S') lesson.syntaxLater = ['readings.to_numpy()'];
    if (lesson.id === 'I13L') {
      lesson.syntaxLater = lesson.syntax.slice(1).map(([code]) => code);
      lesson.syntaxCode = lesson.rounds[0].solution;
    }
    if (lesson.id === 'I19S') {
      lesson.syntax = [
        ['means = df.groupby("bench")["reading"].mean()', 'Calculate one mean per bench; bench names become the Series index.'],
        ['list(means.index)', 'Return those bench labels in their existing order.'],
        ['medians = df.groupby("bench")["reading"].median()', 'Calculate the median summaries used by Change.'],
        ['ranked = medians.sort_values()', 'Sort the Series by value, keeping category labels attached.'],
        ['ranked.to_numpy()', 'Read the numeric summary values in the same order.']
      ];
      lesson.syntaxLater = lesson.syntax.slice(2).map(([code]) => code);
      lesson.syntaxCode = lesson.rounds[0].solution;
    }
    for (const [index, meaning] of (conciseSyntax[lesson.id] || []).entries()) if (lesson.syntax[index]) lesson.syntax[index][1] = meaning;
    for (const [index, meaning] of (conciseChoices[lesson.id] || []).entries()) if (lesson.guide.choices[index]) lesson.guide.choices[index][1] = meaning;
    if (lesson.id === 'W22') lesson.guide.choices = [
      ['id_vars=["candy"]', 'Repeat `candy` beside each measurement.'],
      ['value_vars=["price", "rating"]', 'Stack `price`, then `rating`.'],
      ['var_name="measure", value_name="value"', 'Name the output columns `measure` and `value`.']
    ];
    for (const round of lesson.rounds) {
      const transition = conciseTransitions[round.id];
      if (!transition || !round.teaching) continue;
      const [idea, example, note, meanings] = transition;
      Object.assign(round.teaching, {idea, example, note});
      for (const [index, meaning] of meanings.entries()) if (round.teaching.parts[index]) round.teaching.parts[index][1] = meaning;
    }
  }

  const b = (question, rows, result, constraints = []) => ({question, rows, result, constraints});
  const briefs = {
    I01: [
      b('How do column lists become one table?', 'Use the supplied two-column, four-row table.', 'Create `data`, then `df` with all given values; display `df`.', ['Import pandas as `pd`; use `DataFrame()`.']),
      b('How can the column order support an accounts handoff?', 'Use every row of the supplied café table.', 'Build and display `df` with `price` first, then `drink`.'),
      b('How do two supplied lists stay paired?', 'Use the supplied lists `names` and `ages` in their current order.', 'Build and display `df` with columns `name`, `age`.')
    ],
    I02: [
      b('What does the beginning of the table look like?', 'Use the first two rows of `df`.', 'Display a DataFrame with every column.', ['Use `head()`.']),
      b('What arrived at the end of the import?', 'Use the last two rows of `df`.', 'Display a DataFrame with every column.', ['Use `tail()`.']),
      b('What can a repeatable spot check reveal?', 'Sample three rows from anywhere in `df`.', 'Display the sampled DataFrame with every column.', ['Use `sample()` with `random_state=1`.'])
    ],
    I01CSV: [
      b('How does a file become a table?', 'Use the supplied `candy.csv`.', 'Load every row into `df` and display it.', ['Use `read_csv()`.']),
      b('Which separator keeps the fields apart?', 'Use the supplied `cafe.csv`, whose fields use semicolons.', 'Load every row into `df` and display its separate columns.'),
      b('What does the imported intake table look like?', 'Use the supplied `pets.csv`.', 'Load the full table, then display its first five rows.')
    ],
    I03: [
      b('How many rows and columns arrived?', 'Use all of `df`.', 'Display the tuple (row count, column count).', ['Use `shape` without parentheses.']),
      b('Does the row count match the six-order import log?', 'Use all rows of `df`.', 'Calculate and display the row count as one number.'),
      b('How big is the imported table?', 'Load the supplied `pets.csv` into `df`.', 'Display `df.shape` for the full imported table.')
    ],
    I04: [
      b('Which field names can code select?', 'Use all columns of `df` in their current order.', 'Display the column labels as a list.', ['Use `columns`.']),
      b('Which labels identify the rows?', 'Use all rows of `df` in their current order.', 'Display the row labels as a list.'),
      b('Which fields did the file supply?', 'Load the supplied `pets.csv` into `df`.', 'Display its column names as a list in file order.')
    ],
    I05: [
      b('How did pandas store each field?', 'Use the full supplied `df`.', 'Run `df.info()`, then display `df.dtypes`.'),
      b('Are price and tip stored numerically?', 'Use every column of `df`.', 'Display a dtype for each column.'),
      b('Which types did the import produce?', 'Load the supplied `pets.csv`.', 'Display a dtype for every imported column.', ['Keep every record.'])
    ],
    I06: [
      b('How can one measurement be inspected?', 'Use every row of `df`.', 'Display `{a}` as a Series.'),
      b('What are the first two tips?', 'Use the first two rows of `df`.', 'Display `tip` as a Series.'),
      b('Which age measurements end the table?', 'Use the last two rows of `df`.', 'Display `age` as a Series, retaining the original row labels.')
    ],
    I06S: [
      b('Which labels belong to the measurements?', 'Select `reading` from all rows of `df`.', 'Display its row labels as a list in their current order.', ['Use the Series `index` attribute.']),
      b('Which numbers are the measurements?', 'Use `reading` from all rows of `df`.', 'Display the measurements as a list.', ['Use `to_numpy()`; return values rather than row labels or positions.']),
      b('How can a handoff preserve labels and values?', 'Use the final two `reading` observations in `df`.', 'Display a dictionary with `labels` and `values` lists in matching order.', ['Retain the original row labels.'])
    ],
    I07: [
      b('How can two columns remain a table?', 'Use every row of `df`.', 'Display a DataFrame with `{b}`, then `{a}`.'),
      b('How can a single field remain two-dimensional?', 'Use every row of `df`.', 'Display `price` as a one-column DataFrame.'),
      b('What belongs in a compact preview?', 'Use the last two rows of `df`.', 'Display a DataFrame with `name`, then `age`.')
    ],
    I08: [
      b('Which rectangle lies at the start of the table?', 'Use the first two row positions and first two column positions of `df`.', 'Display a DataFrame.', ['Use `iloc`.']),
      b('Which rows occupy positions one and two?', 'Use the second and third rows of `df`, keeping all columns.', 'Display a DataFrame selected by position.'),
      b('How can a preview ignore row labels?', 'Use the final two rows and first column of `df`.', 'Display a DataFrame selected by position.')
    ],
    I09: [
      b('Which rows belong to a label interval?', 'Use `df` row labels "B" through "D", including "D".', 'Display `price` as a one-column DataFrame.', ['Use `loc`.']),
      b('How can separated labels be selected?', 'Use only `df` row labels "B" and "E".', 'Display `price` as a one-column DataFrame.'),
      b('How can a handoff preserve requested label order?', 'Use `df` row labels "F", then "B".', 'Display columns `weight`, then `age`, as a DataFrame.')
    ],
    I10: [
      b('Which prices exceed the threshold?', 'Use `df` rows where `price` > 2.1.', 'Display all columns in original row order.'),
      b('Which orders belong to either requested drink?', 'Use `df` rows where `drink` is "Latte" or "Tea".', 'Display all columns in original row order.', ['Use `isin()`.']),
      b('Which ages lie within the eligible interval?', 'Use `df` rows with `age` from 2 through 5 inclusive.', 'Display all columns in original row order.')
    ],
    I11: [
      b('Which rows satisfy both requirements?', 'Use `df` rows where `price` > 2.1 AND `flavour` is "fruity".', 'Display all columns in original row order.'),
      b('Which rows satisfy at least one requirement?', 'Use `df` rows where `price` > 5 OR `size` is "Small".', 'Display all columns in original row order.'),
      b('Which non-cat records meet the age policy?', 'Use `df` rows excluding "Cat", with `age` from 2 through 5 inclusive.', 'Display all columns in original row order.')
    ],
    I12: [
      b('Which eligible candies have the highest ratings?', 'Use `df` rows where `price` > 2.1.', 'Display all columns sorted by `rating`, highest first.', ['Use `sort_values()`.']),
      b('Which tips are smallest?', 'Use every row of `df`.', 'Display all columns sorted by `tip`, smallest first.', ['Use `sort_values()`.']),
      b('How do ages compare within each species?', 'Use every row of `df`.', 'Display all columns sorted by `species` alphabetically, then `age` oldest first within species.')
    ],
    I13: [
      b('Which two candies have the highest prices?', 'Use all rows of `df`.', 'Display the two largest `price` records, highest first, with every column.', ['Use `nlargest()`.']),
      b('Which three orders have the lowest prices?', 'Use all rows of `df`.', 'Display the three smallest `price` records, smallest first, with every column.'),
      b('Which eligible cat is oldest?', 'Use `df` rows where `species` is "Cat".', 'Display the record with the largest `age`, keeping every column.')
    ],
    I13L: [
      b('Which label identifies the largest reading?', 'Use all rows of `df`.', 'Display the index label of the largest `reading`.', ['Use `idxmax()`; return the label rather than its reading or position.']),
      b('What measurements belong to the shortest observation?', 'Use the `df` row with the smallest `hours`.', 'Display a Series with `hours`, then `reading`.', ['Use `idxmin()`.']),
      b('Which peak belongs to the eligible population?', 'Use `df` rows with `hours` at most 4.', 'Display the highest-reading row as a dictionary with `hours` and `reading`.', ['Find the maximum within eligible rows.'])
    ],
    I14: [
      b('How many distinct flavours exist?', 'Use all `df` rows.', 'Display the number of distinct non-missing `flavour` values.', ['Use `nunique()`.']),
      b('Which size labels arrived?', 'Use all `df` rows.', 'Display distinct `size` labels as a list in first-appearance order.'),
      b('Which species occur in the eligible population?', 'Use `df` rows with `age` at least 3.', 'Display distinct `species` labels as a list in first-appearance order.')
    ],
    I15: [
      b('What share belongs to each flavour?', 'Use all `df` rows.', 'Display `flavour` proportions as a Series on a 0–1 scale.', ['Use `value_counts()`.']),
      b('How many orders use each size?', 'Use all `df` rows.', 'Display the count per `size` as a Series.'),
      b('What percentage of eligible pets belongs to each species?', 'Use `df` rows with `age` at least 3.', 'Display percentages per `species` as a Series on a 0–100 scale.')
    ],
    I16: [
      b('Which fields contain gaps?', 'Use every row and column of `df`.', 'Display the missing-value count per column as a Series.', ['Use `isna()`.']),
      b('How does completeness compare across fields?', 'Use every row and column of `df`.', 'Display the percentage missing per column on a 0–100 scale.'),
      b('Which records have a supplied price?', 'Use `df` rows where `price` is present.', 'Display every original column in original row order.', ['Keep other missing fields; preserve values without parsing them.'])
    ],
    I17: [
      b('How many extra identical records arrived?', 'Compare all columns in `df`.', 'Display the number of extra duplicate copies, excluding each first occurrence.', ['Use `duplicated()`.']),
      b('Which records are later identical copies?', 'Compare all columns in `df`.', 'Display only later duplicate copies in original row order.', ['Exclude each first occurrence; preserve `df`.']),
      b('Which records belong to an identical-row group?', 'Compare all columns in `df`.', 'Display every row with an exact copy elsewhere, in original row order.', ['Include each first occurrence; preserve `df`.'])
    ],
    I18: [
      b('What is the numerical profile of two fields?', 'Use every row of `df`.', 'Display the `describe()` DataFrame for `price`, then `rating`.'),
      b('What is the numerical profile of price?', 'Use every row of `df`.', 'Display the `describe()` summary of `price` as a Series.'),
      b('What is the profile of the eligible cats?', 'Use `df` rows where `species` is "Cat".', 'Display a numeric-summary DataFrame for `age`, then `weight`.')
    ],
    I18S: [
      b('What is the average price?', 'Use every `price` in `df`.', 'Display the mean as one number.', ['Use `mean()`.']),
      b('What is the total tip?', 'Use every `tip` in `df`.', 'Display the total as one number.', ['Use `sum()`.']),
      b('What is the middle age?', 'Use every `age` in `df`.', 'Display the median as one number.')
    ],
    I19: [
      b('How does average price compare across flavours?', 'Group all `df` rows by `flavour`.', 'Display mean `price` per flavour as a Series.', ['Use `groupby()` and `agg()`.']),
      b('How does total price compare across sizes?', 'Group all `df` rows by `size`.', 'Display total `price` per size as a Series.'),
      b('How does weight compare across eligible species?', 'Use `df` rows with `age` at least 2; group by `species`.', 'Display mean `weight` per species as a Series.')
    ],
    I19S: [
      b('Which category labels belong to the grouped means?', 'Group all `df` rows by `bench` and calculate mean `reading`.', 'Display the grouped category labels as a list in default label order.', ['Use the grouped Series `index`.']),
      b('How can typical readings choose category order?', 'Group all `df` rows by `bench` and calculate median `reading`.', 'Display only bench labels as a list, lowest median first.', ['Use `index`; retain the extreme reading; order by medians rather than means or labels.']),
      b('How can ranked labels and medians stay paired?', 'Group all `df` rows by `bench` and calculate median `reading`.', 'Display a dictionary with `labels` and `medians` lists, highest median first.', ['Keep both lists in the same descending order.'])
    ],
    I19A: [
      b('How can summaries in different orders be combined safely?', 'Use supplied Series `means` and `counts` from `df`.', 'Display a DataFrame with `mean`, then `records`, aligned by bench label.', ['Keep bench labels as the index.']),
      b('How should a partial spot check appear beside full-sample means?', 'Use supplied Series `means` and `checks` from `df`.', 'Display a DataFrame with `mean`, then `checks`, aligned by bench label.', ['Keep every supplied bench label; leave unreported `checks` missing.']),
      b('How can storage types and missing counts form one profile?', 'Use every field of `df`.', 'Display a column-quality DataFrame with readable type text in `dtype` and missing counts in `missing`.', ['Align by field name; preserve `df`.'])
    ],
    I20: [
      b('How often does each flavour/shelf pair occur?', 'Use all `df` rows.', 'Display a crosstab with `flavour` on rows and `shelf` on columns.', ['Use `crosstab()`.']),
      b('How often does each shift/size pair occur?', 'Use all `df` rows.', 'Display category counts with `shift` on rows and `size` on columns.'),
      b('How are eligible species distributed across rooms?', 'Use `df` rows with `age` at least 3.', 'Display counts with `species` on rows and `room` on columns.')
    ],
    I21: [
      b('How are the numeric fields linearly associated?', 'Use all `df` rows and all numeric columns.', 'Display their correlation matrix.', ['Use `corr()`.']),
      b('How are temperature and humidity linearly associated?', 'Use all `df` rows.', 'Display the correlation matrix for `temperature`, then `humidity`.'),
      b('How are duration and rating associated among longer games?', 'Use `df` rows with `minutes` at least 20.', 'Display the correlation matrix for `minutes`, then `rating`.')
    ],
    I22: [
      b('What quality profile did the table arrive with?', 'Use every original field of `df`.', 'Display a DataFrame with one row per field, with `dtype` as readable type text and `missing` as its missing-value count.', ['Preserve `df`.']),
      b('What is the profile of students meeting the score threshold?', 'Use `df` rows with `score` at least 70.', 'Display `describe()` for `hours`, then `score`.', ['Preserve `df`.']),
      b('How does average weather compare within the East station?', 'Use `df` rows where `station` is "East"; group by `sky`.', 'Display a DataFrame of mean `temperature`, then `humidity`.', ['Preserve `df`.'])
    ],
    W01: [
      b('How can a price list preserve the source table?', 'Use every row of `df`.', 'Create and display a separate copy `clean` with `candy`, then `price`.', ['Use `copy()`; preserve `df`.']),
      b('How can a price review preserve the source table?', 'Use every row and column of `df`.', 'Create and display a separate copy `clean`, sorted by `price` highest first.', ['Preserve `df`.']),
      b('How can a cat-age review preserve the source table?', 'Use `df` rows where `species` is "Cat".', 'Create and display a separate `clean` table, sorted by `age` highest first.', ['Preserve `df`.'])
    ],
    W02: [
      b('Which heading makes the amount explicit?', 'Keep every row and other column of `df`.', 'Rename `price` to `amount`; store and display the result as `df`.', ['Use `rename()`.']),
      b('Which headings state the currency?', 'Keep every row of `df` and its column order.', 'Rename `price` to `price_dollars` and `tip` to `tip_dollars`; display updated `df`.'),
      b('Which fields belong in the age handoff?', 'Use every row of `df`.', 'Keep `name`, then `age` renamed `age_years`; store and display the handoff as `df`.')
    ],
    W03: [
      b('Which fields belong in the catalogue handoff?', 'Use every row of `df`.', 'Keep only `candy`, `rating`, `price`, in that order; update and display `df`.'),
      b('How can price lead the export?', 'Keep every row and column of `df`.', 'Move `price` first; preserve the relative order of other columns; display updated `df`.'),
      b('Which measurements belong in the cat handoff?', 'Use `df` rows where `species` is "Cat".', 'Keep only `name`, then `weight`; update and display `df`.')
    ],
    W04: [
      b('Which field can be omitted from the export?', 'Keep every row of `df`.', 'Remove `shelf`; update and display `df`.', ['Use `drop()`.']),
      b('Which fields can be omitted together?', 'Keep every row of `df`.', 'Remove `shift` and `tip`; display updated `df` with remaining columns in original order.'),
      b('How can a measurement handoff protect its source?', 'Keep every row of `df`.', 'Create and display a separate copy `clean` without `name` and `room`.', ['Preserve `df`.'])
    ],
    W05: [
      b('Which rows belong in the fruity report?', 'Use `df` rows where `flavour` is "fruity".', 'Keep every column; update and display `df`.'),
      b('Which prices fall within the report interval?', 'Use `df` rows with `price` from 3 through 6 inclusive.', 'Keep every column and original row order; update and display `df`.'),
      b('Which non-cat records belong in the age report?', 'Use `df` rows excluding "Cat" in `species`.', 'Sort by `age` largest first; update and display `df`.')
    ],
    W06: [
      b('How can sorted records receive fresh row labels?', 'Use every row of `df`, sorted by `price` smallest first.', 'Update and display `df` with consecutive row labels starting at zero.', ['Use `sort_values()` and `reset_index()`; add no index column.']),
      b('How can old labels remain available after sorting?', 'Use every row of `df`, sorted by `price` largest first.', 'Update and display `df` with a reset index and old labels in column `index`.'),
      b('How can an eligible subset receive fresh labels?', 'Use `df` rows where `species` is "Cat", sorted by `weight` largest first.', 'Update and display `df` with consecutive row labels starting at zero.', ['Add no index column.'])
    ],
    W07: [
      b('What does a two-item pack cost?', 'Use every row and original column of `df`.', 'Add `pair_price` equal to twice `price`; display updated `df`.'),
      b('What is the amount including a tip?', 'Use every row and original column of `df`.', 'Add `total` equal to `price` plus `tip`; display updated `df`.', ['Price and tip share currency units in this exercise.']),
      b('What is age expressed in months?', 'Use every row and original column of `df`.', 'Add `age_months` equal to `age` times 12; display updated `df`.', ['Preserve original ages in years.'])
    ],
    W08: [
      b('Which prices fall above the threshold?', 'Keep every row and original column of `df`.', 'Add `band`: "high" if `price` > 2.1, otherwise "low"; display updated `df`.', ['Use `where()`.']),
      b('Which of three price bands applies?', 'Keep every row and original column of `df`.', 'Add `band`: "high" if `price` > 5, "middle" if > 3, otherwise "low"; display updated `df`.'),
      b('Which pets meet both priority requirements?', 'Keep every row and original column of `df`.', 'Add Boolean `priority`: True only when `species` is "Dog" AND `age` is at least 5; display updated `df`.')
    ],
    W09: [
      b('How can one category label be changed?', 'Keep every row and column of `df`.', 'Replace "fruity" with "fruit" in `flavour`; preserve other labels; display updated `df`.', ['Use `replace()`.']),
      b('Which lookup values are known?', 'Keep every row and original column of `df`.', 'Add `code` from the lookup {"Large": 1} for `size`; display updated `df`.', ['Leave unmapped labels missing.']),
      b('How can a system-specific recode protect the original?', 'Use every row of `df`.', 'Create a separate copy `clean`; recode "Cat" to "Feline" and "Dog" to "Canine" in `species`; display `clean`.', ['Preserve "Rabbit" and `df`.'])
    ],
    W10: [
      b('Which text changes make labels consistent?', 'Keep every row and other value of `df`.', 'Trim and lowercase `drink`; trim and title-case `size`; display updated `df`.', ['Use `str.strip()`, `str.lower()` and `str.title()`.']),
      b('How can literal hyphens be normalised?', 'Keep every row and other value of `df`.', 'Trim and lowercase `game`, replacing literal hyphens with spaces; trim and title-case `edition`; display updated `df`.', ['Use `str.strip()`, `str.lower()`, `str.title()` and `str.replace()`.']),
      b('Which cleaned items belong in the food report?', 'Use a separate copy `clean` of `df`.', 'Trim and lowercase `item`; retain only cleaned "food" rows; display `clean`.', ['Preserve `df`.'])
    ],
    W11: [
      b('Which candy names contain the requested letter?', 'Use `df` rows whose `candy` contains literal "a", ignoring case.', 'Display every original column in original row order.', ['Use `str.contains()`.']),
      b('Which drink names do not contain the requested letter?', 'Use `df` rows whose `drink` does not contain literal "a", ignoring case.', 'Display every original column in original row order.'),
      b('Which names belong in the letter-search handoff?', 'Use `df` rows whose `name` contains literal "e", ignoring case.', 'Display `name`, then `age`, in original row order.')
    ],
    W12: [
      b('Which price text can become numeric?', 'Keep every row and other value of `df`.', 'Convert `price` to numeric, making invalid text missing; display updated `df`.', ['Use `to_numeric()`.']),
      b('How many new gaps does parsing reveal?', 'Parse every `price` in `df` without overwriting raw values.', 'Display the number of new missing values caused by invalid text.', ['Exclude prices that were already missing.']),
      b('Which parsed prices meet the threshold?', 'Use a separate copy `clean` of `df`.', 'Add parsed `numeric_price`; retain rows where it is > 7; display `clean`.', ['Keep raw `price` and preserve `df`.'])
    ],
    W13: [
      b('Which storage type fits repeated labels?', 'Keep every row and value of `df`.', 'Convert `flavour` to category dtype; display updated `df`.', ['Use `astype()`.']),
      b('Which storage type explicitly represents text?', 'Keep every row and value of `df`.', 'Convert `drink` to pandas string dtype; display updated `df`.'),
      b('Which integer type can later represent missing ages?', 'Keep every row and value of `df`.', 'Convert `age` to nullable "Int64" dtype; display updated `df`.')
    ],
    W14: [
      b('Which date strings can be interpreted?', 'Keep every row and other value of `df`.', 'Parse `date` in year-month-day format; display updated `df`.', ['Use `to_datetime()`; leave invalid dates as NaT.']),
      b('Which original records contain invalid dates?', 'Parse `date` from all `df` rows in year-month-day format.', 'Display original records whose dates cannot be parsed.', ['Preserve `df`.']),
      b('Which parsed dates belong in the later intake?', 'Use a separate copy `clean` of `df`; parse `date` in year-month-day format.', 'Keep dates on or after "2026-08-04", sort by date ascending and display `clean`.', ['Preserve `df`.'])
    ],
    W15: [
      b('Which calendar fields describe each date?', 'Keep every row and other value of `df`; parse `date` in year-month-day format.', 'Add `year`, `month` and `weekday`; display updated `df`.', ['Use `to_datetime()`; retain invalid dates as missing.']),
      b('How many valid dates occur on each weekday?', 'Parse `date` from all `df` rows in year-month-day format.', 'Display the count per weekday name as a Series.', ['Exclude invalid dates; preserve `df`.']),
      b('How many valid dates occur in each month?', 'Parse `date` from all `df` rows in year-month-day format.', 'Display counts by month number, in ascending month order.', ['Exclude invalid dates; preserve `df`.'])
    ],
    W16: [
      b('Which prices meet the report completeness rule?', 'Parse `price` as numeric in `df`; keep only known numeric prices.', 'Update and display `df` with every original column.', ['Use `to_numeric()` and `dropna()`; accept missing `tip` or `date`.']),
      b('Which rows meet both completeness requirements?', 'Parse `price` as numeric in `df`; require known `price` AND `discount`.', 'Keep eligible rows; update and display `df`.'),
      b('How can eligible prices be selected without changing the source?', 'Parse `price` in a separate copy of `df`.', 'Display a DataFrame of rows with known numeric `price`.', ['Accept missing discounts; preserve `df`.'])
    ],
    W17: [
      b('How can an explicit median assumption fill tip gaps?', 'Keep every row and other value of `df`.', 'Fill missing `tip` with the observed median tip; display updated `df`.', ['Use `fillna()`; the median is an exercise assumption.']),
      b('How can a confirmed no-discount policy fill gaps?', 'Keep every row and known value of `df`.', 'Fill missing `discount` with zero; display updated `df`.', ['For this exercise, a missing discount is confirmed to mean no discount.']),
      b('How can imputation retain evidence of original gaps?', 'Use a separate copy `clean` of `df`, retaining every row.', 'Add the original missing mask as `discount_missing`, then fill missing `discount` with its observed median; display `clean`.', ['Preserve `df`.'])
    ],
    W18: [
      b('How can confirmed accidental copies be removed?', 'Compare every column in `df`.', 'Remove extra exact duplicates; keep each first occurrence and original index; display updated `df`.', ['Use `drop_duplicates()`.']),
      b('How can the last copy be retained deliberately?', 'Compare every column in `df`; identical extra rows are confirmed accidental copies.', 'Keep each last occurrence and original indices; display updated `df`.'),
      b('How can deduplication protect and organise the source?', 'Use a separate copy `clean` of `df`.', 'Remove confirmed extra exact duplicates, keeping each first occurrence; sort `order` ascending and reset consecutive row labels; display `clean`.', ['Add no index column; preserve `df`.'])
    ],
    W19: [
      b('How can an average show its group size too?', 'Group all `df` rows by `flavour`.', 'Display columns `flavour`, `mean_amount` (mean `price`), `records` (row count), in that order.', ['Use `groupby()` and `agg()`.']),
      b('How can a total show how many prices were supplied?', 'Group all `df` rows by `size`.', 'Display columns `size`, `total` (sum of `price`), `n` (non-missing price count), in that order.'),
      b('How can eligible group averages show sample sizes?', 'Use `df` rows with `age` at least 2; group by `species`.', 'Display columns `species`, `average` (mean `weight`), `n` (row count), in that order.')
    ],
    W20: [
      b('How can each row carry its group average?', 'Keep every row and original column of `df`.', 'Add `group_mean`, the mean `price` for each row’s `flavour`; display updated `df`.', ['Use `transform()`.']),
      b('How far is each price from its own group average?', 'Keep every row and original column of `df`.', 'Add `centered`, each `price` minus its `size` group mean; display updated `df`.'),
      b('Which pets are older than their own species average?', 'Use `df` rows whose `age` exceeds their `species` mean age.', 'Display every original column in original row order.')
    ],
    W21: [
      b('How do average prices compare across flavour/shelf pairs?', 'Use all `df` rows.', 'Display mean `price` with `flavour` on rows and `shelf` on columns.', ['Use `pivot_table()`; leave absent combinations missing.']),
      b('How do total prices compare across size/shift pairs?', 'Use all `df` rows.', 'Display total `price` with `size` on rows and `shift` on columns.', ['Leave absent combinations missing.']),
      b('How does eligible mean weight compare across species/room pairs?', 'Use `df` rows with `age` at least 2.', 'Display mean `weight` with `species` on rows and `room` on columns.', ['Leave absent combinations missing.'])
    ],
    W22: [
      b('How can two measurements become one long column?', 'Use all `df` rows.', 'Display columns `candy`, `measure`, `value`, stacking `price` then `rating`.', ['Use `melt()`; retain `candy` as the identifier.']),
      b('How can two identifiers stay attached to stacked values?', 'Use all `df` rows.', 'Display columns `drink`, `size`, `measure`, `value`, stacking `price` then `tip`.'),
      b('How can eligible measurements form a long chart input?', 'Use `df` rows with `age` at least 2.', 'Display columns `name`, `measure`, `value`, stacking `age` then `weight`.')
    ],
    W23: [
      b('How can measurement labels become column headings?', 'Use the supplied `long` table with `candy`, `measure`, `value`.', 'Display a wide table with `candy` on rows, `measure` on columns and `value` in cells.', ['Use `pivot()`.']),
      b('How can the wide orientation be reversed?', 'Use the supplied `long` table.', 'Display a wide table with `measure` on rows, `name` on columns and `value` in cells.'),
      b('How can one eligible measurement be presented wide?', 'Use supplied `long` rows where `measure` is "rating".', 'Display a wide table with `game` on rows, `measure` on columns and `value` in cells.')
    ],
    W24: [
      b('Which lookup values match each original row?', 'Left-join supplied `lookup` onto `df` on `flavour`.', 'Display all joined columns, retaining every `df` row.', ['Use `merge()` with `validate="many_to_one"`.']),
      b('Which rows have a lookup match?', 'Inner-join supplied `lookup` with `df` on `size`.', 'Display every joined column for matched rows only.', ['Use `merge()` with `validate="many_to_one"`.']),
      b('Which observations have no lookup priority?', 'Left-join supplied `lookup` onto `df` on `species`.', 'Display only rows without a matched `priority`, keeping all joined columns and original row order.', ['Use `merge()` with `validate="many_to_one"`.'])
    ],
    W25: [
      b('How can compatible batches become one table?', 'Append supplied `second` below supplied `first`, retaining every row.', 'Display the combined DataFrame with consecutive row labels starting at zero.', ['Use `pd.concat()` with `ignore_index=True`; the result variable name is your choice.']),
      b('How can original batch positions remain traceable?', 'Append supplied `second` below supplied `first`, retaining every row.', 'Display the combined table with original row labels, including repeated labels.', ['Both batches start at zero; the result variable name is your choice.']),
      b('Which combined records belong in the age report?', 'Append supplied `second` below supplied `first`; retain `age` > 2.', 'Display all columns sorted by `age` largest first, with consecutive row labels starting at zero.', ['The result variable name is your choice.'])
    ],
    W26: [
      b('Which policy interval contains each price?', 'Keep every row and original column of `df`.', 'Add `half` from `price` bins 0, 2.1, 100, labelled "lower", then "upper"; display updated `df`.', ['Use `cut()`; include zero; intervals include their right boundary.']),
      b('Which sample-quantile half contains each price?', 'Keep every row and original column of `df`.', 'Add `half` using two sample-quantile groups of `price`, labelled "lower", then "upper"; display updated `df`.'),
      b('Which care-policy age band applies?', 'Keep every row and original column of `df`.', 'Add `band`: "young" for ages 0 through 3 inclusive, "older" for ages above 3 through 10; display updated `df`.')
    ],
    W27: [
      b('How can flavour labels become indicator columns?', 'Use every row of `df`.', 'Display a one-hot encoded DataFrame for `flavour`, preserving the other columns.', ['Use `get_dummies()` with integer indicators.']),
      b('How can two categorical fields be encoded?', 'Use every row of `df`.', 'Display integer indicator columns for `size` and `shift`, preserving other fields.'),
      b('Which numeric and encoded fields belong in the eligible handoff?', 'Use `df` rows with `age` at least 3.', 'Display `age`, then `weight`, then integer indicator columns for `species`.')
    ],
    W28: [
      b('How can two numeric scales be standardised?', 'Use all `df` rows and columns `price`, then `rating`.', 'Display the standardised two-column numeric array.', ['Use `StandardScaler()` and `fit_transform()`.']),
      b('How can two numeric fields be placed on a 0–1 scale?', 'Use all `df` rows and columns `price`, then `tip`.', 'Display the two-column numeric array scaled to 0–1.', ['Use `MinMaxScaler()` and `fit_transform()`.']),
      b('How can later observations use an earlier fitted scale?', 'Use `df` columns `age`, then `weight`.', 'Fit `StandardScaler` on the first four rows only; transform and display the last two rows as a numeric array.', ['Use the same fitted scaler; learn no scale parameters from the last two rows.'])
    ],
    W29: [
      b('Which prices merit investigation under the IQR screen?', 'Keep every row and original value of `df`.', 'Add Boolean `needs_review` for `price` below Q1 − 1.5×IQR or above Q3 + 1.5×IQR; display updated `df`.', ['IQR = Q3 − Q1; use `quantile()`.']),
      b('Which original prices lie beyond either IQR fence?', 'Screen `price` in all `df` rows using Q1 − 1.5×IQR and Q3 + 1.5×IQR.', 'Display only flagged records for investigation.', ['Preserve `df`; IQR = Q3 − Q1.']),
      b('Which ages belong on an ordered review list?', 'Screen `age` in all `df` rows using Q1 − 1.5×IQR and Q3 + 1.5×IQR.', 'Display flagged rows with `name`, then `age`, oldest first.', ['IQR = Q3 − Q1; preserve `df`; a flag is a request for review, not permission to delete.'])
    ],
    W30: [
      b('What is the revised price after a ten-percent increase?', 'Keep every row and original value of `df`.', 'Add `adjusted`, equal to `price` × 1.1 rounded to two decimals; display updated `df`.', ['Use vectorised arithmetic; do not use `apply()`.']),
      b('How far is each price from the overall mean?', 'Keep every row and original value of `df`.', 'Add `difference`, equal to `price` minus its overall mean; display updated `df`.', ['Use vectorised arithmetic; do not use `apply()`.']),
      b('Which eligible ages should appear in months?', 'Add `age_months` to `df` from `age` in years, using 12 months per year.', 'Display only `name`, then `age_months`, for rows with `age` at least 3.', ['Keep `df` otherwise intact, including the new column.'])
    ],
    W31: [
      b('How can café records be cleaned without inventing prices?', 'Create a separate copy `clean` of `df`; keep first occurrences after removing confirmed exact duplicates.', 'Display `clean` sorted by `order` ascending, with consecutive row labels and no added index column.', ['Trim/lowercase `drink`; trim/title-case `size`.', 'Parse `price` as numeric and `date` in year-month-day format; make invalid entries missing.', 'Fill missing `tip` with the median after deduplication.', 'Retain unknown-price rows, preserve other values and leave `df` intact.']),
      b('Which game orders can support a numeric-price report?', 'Create a separate copy `clean` of `df`; keep first occurrences after removing confirmed exact duplicates.', 'Display `clean` with known `numeric_price`, sorted by `order` ascending, with consecutive row labels and no added index column.', ['Trim/lowercase `game`; replace literal hyphens with spaces; trim/title-case `edition`.', 'Preserve raw `price`; add parsed `numeric_price`, making invalid text missing.', 'Parse `date` in year-month-day format, retaining invalid dates as NaT; preserve `df`.']),
      b('Which pet-supply orders can be billed under the discount policy?', 'Create a separate copy `clean` of `df`; keep first occurrences after removing confirmed exact duplicates.', 'Display `clean` with only `order`, `item`, `package`, `net_price`, sorted by `order` ascending, with consecutive row labels and no added index column.', ['Trim/lowercase `item`; trim/title-case `package`.', 'Parse `price` as numeric; keep known numeric-price rows.', 'A missing `discount` means zero for this billing export; fill it with zero.', 'Add `net_price` as `price` minus `discount` in the same currency; preserve `df`.'])
    ]
  };

  const stages = {
    I01: ['Build a two-column table.', 'Change the column order.', 'Pair supplied lists.'],
    I02: ['Inspect the beginning.', 'Inspect the ending.', 'Take a repeatable sample.'],
    I01CSV: ['Read a comma-separated file.', 'Choose the separator.', 'Inspect an imported preview.'],
    I03: ['Read both dimensions.', 'Count only rows.', 'Measure a new import.'],
    I04: ['Read column labels.', 'Read row labels.', 'Check an imported schema.'],
    I05: ['Read types and completeness.', 'Check stored column types.', 'Inspect imported types.'],
    I06: ['Select one Series.', 'Select a short Series.', 'Retain original labels.'],
    I06S: ['Extract row labels.', 'Extract measurement values.', 'Pair labels and values.'],
    I07: ['Select a two-column table.', 'Keep a one-column table.', 'Combine preview and selection.'],
    I08: ['Select a rectangle by position.', 'Change the row slice.', 'Select from the end.'],
    I09: ['Select an inclusive label interval.', 'Select separated labels.', 'Choose label and column order.'],
    I10: ['Filter by a threshold.', 'Filter by category membership.', 'Filter by an inclusive interval.'],
    I11: ['Require both conditions.', 'Accept either condition.', 'Combine exclusion and interval.'],
    I12: ['Filter, then sort.', 'Reverse the sort direction.', 'Sort by two fields.'],
    I13: ['Find the largest records.', 'Find the smallest records.', 'Find an eligible extreme.'],
    I13L: ['Return the extreme label.', 'Use the label to select.', 'Find a peak within eligible rows.'],
    I14: ['Count distinct categories.', 'List distinct categories.', 'List categories within eligible rows.'],
    I15: ['Calculate category proportions.', 'Count category records.', 'Calculate eligible percentages.'],
    I16: ['Count missing values.', 'Compare missing percentages.', 'Select present values.'],
    I17: ['Count extra copies.', 'Inspect later copies.', 'Inspect every duplicate-group member.'],
    I18: ['Describe two numeric fields.', 'Describe one Series.', 'Describe an eligible population.'],
    I18S: ['Calculate one mean.', 'Calculate one total.', 'Calculate one median.'],
    I19: ['Average within groups.', 'Total within groups.', 'Filter, then summarise groups.'],
    I19S: ['Extract grouped labels.', 'Order labels by medians.', 'Pair ranked labels and medians.'],
    I19A: ['Align differently ordered summaries.', 'Keep unreported checks missing.', 'Align a column-quality profile.'],
    I20: ['Count category pairs.', 'Change the table orientation.', 'Count eligible category pairs.'],
    I21: ['Inspect numeric correlations.', 'Choose two numeric fields.', 'Inspect an eligible relationship.'],
    I22: ['Build a quality profile.', 'Describe eligible students.', 'Compare groups within one station.'],
    W01: ['Copy, then select.', 'Copy, then sort.', 'Copy, filter and sort.'],
    W02: ['Rename one heading.', 'State currency in headings.', 'Prepare a renamed handoff.'],
    W03: ['Keep and order fields.', 'Move one field first.', 'Filter and select fields.'],
    W04: ['Drop one field.', 'Drop two fields.', 'Drop fields in a copy.'],
    W05: ['Keep one category.', 'Keep an inclusive price range.', 'Exclude, then sort.'],
    W06: ['Sort and discard old labels.', 'Sort and retain old labels.', 'Reset an eligible subset.'],
    W07: ['Calculate a pack price.', 'Add values with matching units.', 'Convert years to months.'],
    W08: ['Assign two conditional labels.', 'Assign three conditional labels.', 'Record a Boolean policy.'],
    W09: ['Replace one label.', 'Map a partial lookup.', 'Recode in a separate copy.'],
    W10: ['Trim and normalise case.', 'Replace literal punctuation.', 'Clean before filtering.'],
    W11: ['Find a literal letter.', 'Invert the text search.', 'Search, then select fields.'],
    W12: ['Parse prices explicitly.', 'Count newly invalid prices.', 'Preserve raw and parsed prices.'],
    W13: ['Use a category dtype.', 'Use a string dtype.', 'Use a nullable integer dtype.'],
    W14: ['Parse dates explicitly.', 'Inspect invalid date records.', 'Select a parsed date window.'],
    W15: ['Extract calendar fields.', 'Count weekday names.', 'Count months in calendar order.'],
    W16: ['Require a known numeric price.', 'Require two known fields.', 'Apply completeness rules in a copy.'],
    W17: ['Fill gaps with an explicit median assumption.', 'Apply a confirmed zero policy.', 'Record missingness before filling.'],
    W18: ['Keep first exact occurrences.', 'Keep last exact occurrences.', 'Deduplicate in a sorted copy.'],
    W19: ['Pair group averages with row counts.', 'Pair totals with non-missing counts.', 'Summarise eligible groups.'],
    W20: ['Repeat the group mean at each row.', 'Centre within groups.', 'Compare rows with their group mean.'],
    W21: ['Aggregate category pairs.', 'Change the cell statistic.', 'Pivot an eligible population.'],
    W22: ['Stack two measurement columns.', 'Retain two identifiers.', 'Filter before stacking measurements.'],
    W23: ['Turn measures into headings.', 'Reverse the wide orientation.', 'Pivot one selected measurement.'],
    W24: ['Keep every left-hand record.', 'Keep only matched records.', 'Audit unmatched lookup keys.'],
    W25: ['Append with fresh labels.', 'Retain original batch labels.', 'Append, filter and sort.'],
    W26: ['Apply fixed policy intervals.', 'Apply sample-quantile intervals.', 'Apply an age-band policy.'],
    W27: ['Encode one category.', 'Encode two categories.', 'Encode an eligible handoff.'],
    W28: ['Standardise two numeric fields.', 'Scale fields to zero–one.', 'Fit earlier; transform later.'],
    W29: ['Flag unusual values without deletion.', 'Display flagged evidence.', 'Prepare an ordered review list.'],
    W30: ['Vectorise a price revision.', 'Vectorise mean centring.', 'Derive a field before selecting.'],
    W31: ['Clean while retaining unknown prices.', 'Preserve raw text and eligible prices.', 'Prepare billing under an explicit discount policy.']
  };

  // Each stage is explicit: a newly encountered method is not inferred from
  // a keyword in learner code, a hint, or an incidental supplied setup.
  const stageIntroductions = {
    I02: [['python.method-call', 'pandas.head'], ['pandas.tail'], ['pandas.sample', 'pandas.random-state']],
    I01CSV: [['pandas.read-csv'], ['pandas.csv-separator'], []],
    I03: [['python.tuple', 'pandas.shape'], ['python.len'], []],
    I04: [['python.list-conversion', 'pandas.columns'], ['pandas.index'], []],
    I06: [['pandas.series-selection'], [], []],
    I06S: [['pandas.series-labels'], ['pandas.series-values', 'numpy.array'], []],
    I10: [['python.comparison', 'pandas.boolean-mask', 'pandas.filter'], ['pandas.isin'], ['pandas.between']],
    I13: [['pandas.nlargest'], ['pandas.nsmallest'], []],
    I13L: [['pandas.idxmax'], ['pandas.idxmin'], []],
    I14: [['pandas.nunique'], ['pandas.unique'], []],
    I16: [['pandas.isna', 'pandas.sum'], ['pandas.mean'], []],
    I18S: [[], [], ['pandas.median']],
    I19S: [[], ['pandas.grouped-series-order'], []],
    I19A: [['pandas.series-alignment'], [], ['pandas.astype', 'pandas.dtype-as-text']],
    W08: [['numpy.where'], ['numpy.select'], []],
    W09: [['pandas.replace'], ['pandas.map'], []],
    W10: [['pandas.str-accessor', 'pandas.str-strip', 'pandas.str-lower', 'pandas.str-title'], ['pandas.str-replace'], []],
    W15: [['pandas.dt-accessor', 'pandas.dt-year', 'pandas.dt-month', 'pandas.dt-day-name'], [], ['pandas.sort-index']],
    W19: [['pandas.named-aggregation', 'pandas.size'], ['pandas.count'], []],
    W26: [['pandas.cut'], ['pandas.qcut'], []],
    W28: [['sklearn.standard-scaler', 'sklearn.fit-transform'], ['sklearn.minmax-scaler'], ['sklearn.fit', 'sklearn.transform']]
  };
  // This is an authored difference from earlier teaching, not a change of
  // dataset or task wording. Familiar combinations do not earn a new panel.
  // Excerpts read the visible exercise objects; no second example dataset or
  // inherited concept illustration is needed in Change and Transfer.
  const stageTeaching = {
    'I02-2': {idea:'`tail()` selects from the end instead of the beginning.', code:'df.tail(2)', parts:[['tail(2)','Return the last two rows, keeping their original labels.']]},
    'I02-3': {idea:'`sample()` selects rows from across the table. Fix the seed to repeat the selection on identical data.', code:'df.sample(3, random_state=1)', parts:[['sample(3)','Choose three rows without replacement.'],['random_state=1','Repeat this random selection; it does not make the sample representative.']]},
    'I01CSV-2': {idea:'This file separates fields with semicolons. Tell `read_csv()` which separator to use.', code:'pd.read_csv("cafe.csv", sep=";")', parts:[['sep=";"','Split fields at semicolons instead of the default commas.']]},
    'I03-2': {idea:'`len()` gives the row count alone, rather than the pair returned by `shape`.', code:'len(df)', parts:[['len(df)','Count rows; do not count columns or non-missing cells.']]},
    'I04-2': {idea:'`index` holds row labels, while `columns` holds column labels.', code:'list(df.index)', parts:[['df.index','Read existing row labels in their current order.']]},
    'I06S-2': {idea:'`to_numpy()` extracts measurements without their row labels. `list()` gives the requested list.', code:'list(df["reading"].to_numpy())', parts:[['to_numpy()','Return the Series values as a NumPy array, keeping their order.']]},
    'I08-3': {idea:'A negative slice start counts back from the end of the table.', code:'df.iloc[-2:, :1]', parts:[['-2:','Start two rows from the end and include the remaining rows.']]},
    'I09-2': {idea:'A list selects separate row labels in exactly the order you specify.', code:'df.loc[["B", "E"], ["price"]]', parts:[['["B", "E"]','Keep only these labels; unlike a slice, do not include labels between them.']]},
    'I10-2': {idea:'`isin()` tests whether each value belongs to a list of allowed values.', code:'df["drink"].isin(["Latte", "Tea"])', parts:[['isin(["Latte", "Tea"])','Flag either allowed drink True; the familiar outer filter keeps those rows.']]},
    'I10-3': {idea:'`between()` tests an inclusive range.', code:'df["age"].between(2, 5)', parts:[['between(2, 5)','Include ages 2 through 5, including both endpoints by default.']]},
    'I12-3': {idea:'Use one direction per sort key. The second key orders ties in the first.', code:'df.sort_values(["species", "age"], ascending=[True, False])', parts:[['ascending=[True, False]','Sort species A–Z, then age highest first within each species.']]},
    'I13-2': {idea:'`nsmallest()` reverses the extreme: choose the lowest values instead of the highest.', code:'df.nsmallest(3, "price")', parts:[['nsmallest(3, "price")','Return three lowest-price rows, smallest first.']]},
    'I13L-2': {idea:'`idxmin()` finds the smallest value’s row label. Reuse `loc` to read that row.', code:'label = df["hours"].idxmin()\nrow = df.loc[label]\nrow[["hours", "reading"]]', parts:[['idxmin()','Return the first minimum’s label, rather than its value or numbered position.'],['row[["hours", "reading"]]','Read these fields from the same row as a Series, in the requested order.']]},
    'I14-2': {idea:'`unique()` returns the distinct labels; `nunique()` returned their count.', code:'list(df["size"].unique())', parts:[['unique()','Keep distinct labels in first-appearance order.'],['list(...)','Convert the returned array to a Python list.']]},
    'I16-2': {idea:'Average missing-value flags to get the missing fraction, then multiply by 100.', code:'df.isna().mean() * 100', parts:[['mean()','Average True=1 and False=0 in each column.']]},
    'I17-3': {idea:'`keep=False` flags every row belonging to a duplicate group, including its first occurrence.', code:'df.duplicated(keep=False)', parts:[['keep=False','Use the Boolean False without quotes; unique rows stay False.']]},
    'I18S-2': {idea:'`sum()` adds the known values instead of averaging them.', code:'df["tip"].sum()', parts:[['sum()','Return the total; missing values are skipped by default.']]},
    'I18S-3': {idea:'`median()` gives the middle known value rather than the mean or total.', code:'df["age"].median()', parts:[['median()','Sort known values and take the middle; average the two middle values for an even count.']]},
    'I19S-2': {idea:'Sort a grouped Series by its values while keeping each category label attached.', code:'medians = df.groupby("bench")["reading"].median()\nranked = medians.sort_values()\nlist(ranked.index)', parts:[['medians.sort_values()','Order median values smallest first; Series sorting needs no column name.'],['ranked.index','Extract the category labels in that sorted order, rather than the median numbers.']]},
    'I19A-3': {idea:'`astype(str)` makes dtype descriptions readable text. It leaves the original data unchanged.', code:'df.dtypes.astype(str)', parts:[['astype(str)','Convert the dtype descriptions, such as int64, to text.']]},
    'W06-2': {idea:'Without `drop=True`, `reset_index()` preserves the old labels in a new column.', code:'df.reset_index()', parts:[['reset_index()','Create consecutive row labels and keep old labels in the index column.']]},
    'W08-2': {idea:'`np.select()` chooses among several rules. The first True rule wins.', code:'np.select([df["price"] > 5, df["price"] > 3],\n          ["high", "middle"], default="low")', parts:[['conditions, choices','Match each condition to the choice at the same position.'],['default="low"','Use this value when no condition matches.']]},
    'W09-2': {idea:'`map()` looks up each value; unmatched labels become missing instead of staying unchanged.', code:'df["size"].map({"Large": 1})', parts:[['map({"Large": 1})','Map Large to 1; Small has no mapping and becomes missing.']]},
    'W10-2': {idea:'`str.replace()` changes text inside each value after the familiar trimming and case changes.', code:'.str.replace("-", " ", regex=False)', parts:[['str.replace("-", " ", regex=False)','Replace literal hyphens with spaces; no pattern matching.']]},
    'W15-3': {idea:'`sort_index()` puts the counted month labels in calendar order instead of frequency order.', code:'dates.dt.month.value_counts().sort_index()', parts:[['sort_index()','Sort labels 1–12; keep each count attached to its month.']]},
    'W18-2': {idea:'`keep="last"` keeps the last occurrence of each duplicate group instead of the first.', code:'df.drop_duplicates(keep="last")', parts:[['keep="last"','Retain the final matching row in the current order; other confirmed copies are removed.']]},
    'W19-2': {idea:'Use `count` when the question asks for known prices. `size` would count every row.', code:'n=("price", "count")', parts:[['"count"','Count non-missing source values; a missing price contributes zero.']]},
    'W24-2': {idea:'An inner join keeps only keys found in both tables. A left join kept every source row.', code:'how="inner"', parts:[['how="inner"','Drop unmatched source keys; keep validate="many_to_one" to check the lookup.']]},
    'W26-2': {idea:'`qcut()` chooses boundaries from the sample to aim for equally sized groups; `cut()` used fixed boundaries.', code:'pd.qcut(df["price"], q=2, labels=["lower", "upper"])', parts:[['q=2','Aim for two groups with equal numbers of observations; ties can prevent equal counts or distinct bins.']]},
    'W28-2': {idea:'`MinMaxScaler` maps the training minimum to 0 and maximum to 1 instead of standardising by mean and spread.', code:'from sklearn.preprocessing import MinMaxScaler\nscaler = MinMaxScaler()', parts:[['MinMaxScaler()','Use (value − training minimum) / training range; a constant training column becomes 0.']]},
    'W28-3': {idea:'Learn the scale from training rows, then apply that same scale to later rows.', code:'scaler.fit(df.iloc[:4][["age", "weight"]])\nscaler.transform(df.iloc[4:][["age", "weight"]])', parts:[['fit(...)','Learn the training means and population standard deviations; return the scaler.'],['transform(...)','Reuse those stored values without learning from the later rows.']]}
  };
  const canonicalNames = {
    'pandas.read-csv': 'pandas.read_csv', 'pandas.sort-values': 'pandas.sort_values',
    'pandas.value-counts': 'pandas.value_counts', 'pandas.reset-index': 'pandas.reset_index',
    'pandas.str-strip': 'pandas.str.strip', 'pandas.str-lower': 'pandas.str.lower',
    'pandas.str-title': 'pandas.str.title', 'pandas.str-replace': 'pandas.str.replace',
    'pandas.str-contains': 'pandas.str.contains', 'pandas.to-numeric': 'pandas.to_numeric',
    'pandas.to-datetime': 'pandas.to_datetime', 'pandas.dt-year': 'pandas.dt.year',
    'pandas.dt-month': 'pandas.dt.month', 'pandas.dt-day-name': 'pandas.dt.day_name',
    'pandas.sort-index': 'pandas.sort_index', 'pandas.drop-duplicates': 'pandas.drop_duplicates',
    'pandas.pivot-table': 'pandas.pivot_table', 'pandas.get-dummies': 'pandas.get_dummies',
    'sklearn.standard-scaler': 'sklearn.StandardScaler', 'sklearn.minmax-scaler': 'sklearn.MinMaxScaler',
    'sklearn.fit-transform': 'sklearn.fit_transform'
  };
  const ids = names => names.map(name => canonicalNames[name] || name);

  const object = (name, type, description) => ({name, type, description});
  const createdByRound = {
    'I01-1': [object('data', 'dictionary', 'Column names paired with four-value lists.'), object('df', 'DataFrame', 'The table you construct from data.')],
    'I01-2': [object('data', 'dictionary', 'Price then drink, each with four values.'), object('df', 'DataFrame', 'The table you construct in the requested column order.')],
    'I01-3': [object('data', 'dictionary', 'Column names paired with the supplied names and ages lists.'), object('df', 'DataFrame', 'The paired intake table you construct.')],
    'I01CSV-1': [object('df', 'DataFrame', 'The full table you read from candy.csv.')],
    'I01CSV-2': [object('df', 'DataFrame', 'The full table you read using semicolon-separated fields.')],
    'I01CSV-3': [object('pets', 'DataFrame', 'The full imported table; head displays a preview without removing rows.')],
    'I03-3': [object('df', 'DataFrame', 'The full imported table whose shape you inspect.')],
    'I04-3': [object('df', 'DataFrame', 'The full imported table whose column labels you inspect.')],
    'I05-3': [object('df', 'DataFrame', 'The full imported table whose storage types you inspect.')],
    'I06S-1': [object('readings', 'Series', 'The reading values, retaining their original row labels.')],
    'I06S-3': [object('last', 'Series', 'The final two labelled reading observations.')],
    'I12-1': [object('filtered', 'DataFrame', 'Eligible price rows before sorting.')],
    'I13L-2': [object('row', 'Series', 'The whole original row identified by the smallest hours label.')],
    'I13L-3': [object('selected', 'DataFrame', 'Only observations with hours at most 4.'), object('row', 'Series', 'The highest-reading row within selected.')],
    'I14-3': [object('eligible', 'DataFrame', 'Records with age at least 3.')],
    'I19S-1': [object('means', 'Series', 'One mean reading per bench; bench names are the index labels.')],
    'I19S-2': [object('medians', 'Series', 'One median reading per bench.'), object('ranked', 'Series', 'Those medians sorted lowest first, with bench labels still attached.')],
    'I19S-3': [object('medians', 'Series', 'One median reading per bench.'), object('ranked', 'Series', 'Those medians sorted highest first, with bench labels still attached.')],
    'I20-3': [object('selected', 'DataFrame', 'Records with age at least 3.')],
    'I21-3': [object('selected', 'DataFrame', 'Games lasting at least 20 minutes.')],
    'I22-2': [object('selected', 'DataFrame', 'Students scoring at least 70.')],
    'I22-3': [object('selected', 'DataFrame', 'East-station records before grouping by sky.')],
    'W12-2': [object('parsed', 'Series', 'Parsed numeric prices, aligned with the unchanged original rows.')],
    'W14-2': [object('parsed', 'Series', 'Parsed datetimes, with invalid dates represented as NaT.')],
    'W15-2': [object('dates', 'Series', 'Parsed dates used to count weekday names.')],
    'W15-3': [object('dates', 'Series', 'Parsed dates used to count month numbers.')],
    'W20-3': [object('means', 'Series', 'The species mean age repeated at each original row label.')],
    'W22-3': [object('selected', 'DataFrame', 'Records with age at least 2, before reshaping.')],
    'W24-3': [object('joined', 'DataFrame', 'The left join before selecting unmatched lookup records.')],
    'W25-3': [object('combined', 'DataFrame', 'Both batches appended before selecting and sorting eligible rows.')],
    'W27-3': [object('selected', 'DataFrame', 'Eligible rows with age, weight and species before encoding.')],
    'W28-1': [object('scaler', 'StandardScaler', 'The tool that learns means and spreads from the supplied table.')],
    'W28-2': [object('scaler', 'MinMaxScaler', 'The tool that learns minima and maxima from the supplied table.')],
    'W28-3': [object('scaler', 'StandardScaler', 'Fitted on only the first four rows, then reused to transform the last two.')],
    'W29-3': [object('flagged', 'DataFrame', 'Age records outside either IQR fence, before the review handoff.')]
  };

  // Names that are authored output headings, rather than columns to look up.
  const outputColumns = {
    I01: [['candy', 'price'], ['price', 'drink'], ['name', 'age']],
    I19A: [['mean', 'records'], ['mean', 'checks'], ['dtype', 'missing']],
    I22: [['dtype', 'missing'], ['hours', 'score'], ['temperature', 'humidity']],
    W02: [['amount'], ['price_dollars', 'tip_dollars'], ['name', 'age_years']],
    W06: [[], ['index'], []],
    W07: [['pair_price'], ['total'], ['age_months']],
    W08: [['band'], ['band'], ['priority']],
    W09: [[], ['code'], []],
    W12: [[], [], ['numeric_price']],
    W15: [['year', 'month', 'weekday'], [], []],
    W17: [[], [], ['discount_missing']],
    W19: [['flavour', 'mean_amount', 'records'], ['size', 'total', 'n'], ['species', 'average', 'n']],
    W20: [['group_mean'], ['centered'], []],
    W22: [['candy', 'measure', 'value'], ['drink', 'size', 'measure', 'value'], ['name', 'measure', 'value']],
    W26: [['half'], ['half'], ['band']],
    W29: [['needs_review'], [], []],
    W30: [['adjusted'], ['difference'], ['name', 'age_months']],
    W31: [[], ['numeric_price'], ['order', 'item', 'package', 'net_price']]
  };

  function supplied(round, sourceId, index) {
    if (round.files) return Object.keys(round.files).map(name => object(name, 'CSV file', 'Available file; no DataFrame is loaded until your code reads it.'));
    if (sourceId === 'I01') return index === 2 ? [object('names', 'list', 'Four names in intake order.'), object('ages', 'list', 'Four ages paired with names by position.')] : [];
    const inputs = [object('df', 'DataFrame', 'The source table created by the visible setup.')];
    if (sourceId === 'I19A' && index < 2) {
      inputs.push(object('means', 'Series', 'Mean reading for every bench, indexed by bench label.'));
      inputs.push(index === 0 ? object('counts', 'Series', 'Full-sample row counts, displayed in a different order from means.') : object('checks', 'Series', 'A partial spot-check count; absent bench labels remain unreported.'));
    }
    if (sourceId === 'W23') inputs.push(object('long', 'DataFrame', 'A prepared long measurement table supplied by the setup.'));
    if (sourceId === 'W24') inputs.push(object('lookup', 'DataFrame', 'The exact given lookup table; each key identifies at most one lookup row.'));
    if (sourceId === 'W25') inputs.push(object('first', 'DataFrame', 'The first three source rows.'), object('second', 'DataFrame', 'The remaining source rows.'));
    return inputs;
  }

  function expand(value, dataset) {
    return value.replace(/\{(a|b|c|d|id)\}/g, (_, key) => dataset[key]);
  }
  function apply(curriculum) {
    const byId = new Map(curriculum.lessons.map(lesson => [lesson.id, lesson]));
    for (const lesson of curriculum.lessons.filter(item => item.deck === 'inspect' || item.deck === 'wrangle')) {
      shortenTeaching(lesson);
      const declared = concepts[lesson.id];
      if (declared) {
        const [introduces, reuses, extendsConcepts, prerequisites] = declared;
        lesson.concepts = {introduces: ids(introduces), reuses: ids(reuses), extends: ids(extendsConcepts), prerequisites: [...prerequisites]};
      } else if (lesson.rounds.every(round => round.retrieves)) {
        const sources = [...new Set(lesson.rounds.map(round => round.retrieves))];
        const retrieved = sources.flatMap(id => { const source = byId.get(id).concepts; return [...source.introduces, ...source.reuses, ...source.extends]; });
        lesson.concepts = {introduces: [], reuses: [...new Set(retrieved)], extends: [], prerequisites: sources};
      } else {
        throw new Error('Missing authored concept map for ' + lesson.id);
      }
      if (lesson.guide) lesson.guide.prerequisiteLessons = lesson.concepts.prerequisites.map(id => ({id, title: byId.get(id).title}));
      for (const [roundIndex, round] of lesson.rounds.entries()) {
        const sourceId = round.retrieves || lesson.id;
        const index = round.retrieves ? byId.get(sourceId).rounds.findIndex(sourceRound => sourceRound.dataset === round.dataset && sourceRound.solution === round.solution) : roundIndex;
        if (index < 0 || !briefs[sourceId]?.[index]) throw new Error('Missing authored brief for ' + round.id);
        const authored = briefs[sourceId][index];
        const source = byId.get(sourceId);
        round.stageTeaching = !round.retrieves && roundIndex > 0 ? stageTeaching[round.id] || null : null;
        const introductionPlan = stageIntroductions[sourceId] || [source.concepts.introduces, [], []];
        const introduced = ids(introductionPlan[index] || []);
        const earlierInLesson = ids(introductionPlan.slice(0, index).flat());
        round.concepts = round.retrieves ? {
          introduces: [],
          reuses: [...new Set([...source.rounds[index].concepts.introduces, ...source.rounds[index].concepts.reuses, ...source.rounds[index].concepts.extends])],
          extends: [],
          prerequisites: [sourceId]
        } : {
          introduces: introduced,
          reuses: [...new Set([...source.concepts.reuses, ...earlierInLesson])],
          extends: [...source.concepts.extends],
          prerequisites: [...source.concepts.prerequisites]
        };
        const dataset = curriculum.datasets[round.dataset];
        round.brief = {
          question: expand(authored.question, dataset),
          rows: expand(authored.rows, dataset),
          result: expand(authored.result, dataset),
          constraints: authored.constraints.map(value => expand(value, dataset))
        };
        round.task = [round.brief.rows, round.brief.result, ...round.brief.constraints].join(' ');
        round.steps = [round.brief.rows, round.brief.result, ...round.brief.constraints];
        round.stageSummary = round.retrieves ? 'Retrieve: ' + stages[sourceId][index].replace(/^./, value => value.toLowerCase()) : stages[sourceId][index];
        const sourceRoundId = sourceId + '-' + (index + 1);
        const created = (createdByRound[sourceRoundId] || []).map(item => ({...item}));
        if (round.target === 'copy' && !created.some(item => item.name === 'clean')) created.push(object('clean', 'DataFrame', 'A separate working copy created by your code; df remains the original.'));
        if (sourceId === 'W16' && index === 2) created.push(object('clean', 'DataFrame', 'A separate parsed-price copy used to display eligible rows.'));
        round.provenance = {supplied: supplied(round, sourceId, index), created};
        round.identifiers = {
          outputColumns: [...(outputColumns[sourceId]?.[index] || [])],
          inputColumns: Object.keys(dataset.columns),
          variables: [...new Set([...round.provenance.supplied, ...created].filter(item => item.type !== 'CSV file').map(item => item.name))],
          exampleVariables: sourceId === 'I19S' ? ['sample', 'medians', 'ranked', 'order'] : [],
          suppliedObjects: round.provenance.supplied.filter(item => item.type !== 'CSV file').map(item => item.name),
          files: round.provenance.supplied.filter(item => item.type === 'CSV file').map(item => item.name),
          createdObjects: created.map(item => item.name),
          occurrences: sourceId === 'I19A' && index === 1 ? [{text: 'checks', role: 'column', before: 'then '}, {text: 'checks', role: 'variable', before: 'and '}, {text: 'checks', role: 'column', before: 'unreported '}] : []
        };
        const laterSyntax = new Set(source.syntaxLater || []);
        const primarySyntax = source.syntax.filter(([code]) => !laterSyntax.has(code));
        // Source-authored syntaxLater is an exact list of teaching choices.
        // A new practice's authored transition owns its new method parts.
        round.syntaxGuidance = {
          current: !round.retrieves && index === 0 ? primarySyntax : round.stageTeaching?.parts || [],
          reminders: !round.retrieves && index > 0 ? primarySyntax : [],
          reference: round.retrieves ? [...source.syntax] : source.syntax.filter(([code]) => laterSyntax.has(code))
        };
      }
    }
    // Show the labelled intermediate, not just the final list of names.
    const ordering = byId.get('I19S');
    const grouping = byId.get('W19');
    grouping.guide.identifiers = {...grouping.guide.identifiers, operations: ['mean', 'sum', 'size', 'count']};
    ordering.visual.summaryStatistic = 'mean';
    ordering.rounds.forEach((round,index) => { round.visual.summaryStatistic = index === 0 ? 'mean' : 'median'; });
    ordering.guide.example = '`means` pairs bench names with mean readings. `means.index` holds the category labels in that same order.';
    ordering.guide.note = 'Select the index for category names; select values when the requested result is numeric.';
    ordering.guide.exampleCode = 'sample = pd.DataFrame({"bench": ["Ash", "Birch", "Cedar"], "reading": [10, 4, 7]})\nmeans = sample.groupby("bench")["reading"].mean()\nlist(means.index)';
    ordering.guide.exampleObjects = {
      supplied: [object('sample', 'DataFrame', 'Three bench readings constructed in the small example.')],
      created: [object('means', 'Series', 'Bench labels with mean reading values: Ash=10, Birch=4, Cedar=7.')]
    };
    ordering.guide.exampleOutput = {caption: 'A grouped Series keeps category labels with its means', headers: ['Object', 'Index labels', 'Values'], rows: [['means', 'Ash, Birch, Cedar', '10, 4, 7'], ['means.index', 'Ash, Birch, Cedar', 'labels only']]};
    return curriculum;
  }

  const api = {apply};
  root.FoundationContentGuidance = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
