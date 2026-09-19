/* Authored concept comparisons and task contracts. Applied after progression edits. */
(function(root){
'use strict';
// Each example is deliberately separate from the exercise data. Essential choices
// stay visible in Follow; the longer syntax reference is available on demand.
const guides = {};
function guide(id, idea, example, choices, note) {
 guides[id] = {idea, example, choices, note};
}
guide('I01', 'A DataFrame is a table. A dictionary supplies the column names and lists of values; items at the same position become one row.',
 'Names ["Ada", "Ben"] and ages [4, 7] become two rows: Ada · 4, then Ben · 7.',
 [['{ "name": names, "age": ages }','Each key names a column; each value supplies its list. Key order sets column order.'],['pd.DataFrame(data)','Build the table from that dictionary. Every list must have the same length.'],['df = ...','Store the table as df. Write df on the final line to display it.']],
 'Quoted text is a string; [ ] encloses a list. = assigns a value to a name. import pandas as pd gives pandas the short name pd.');
guide('I01CSV', 'read_csv reads a text file into a DataFrame. The separator tells pandas where one field ends and the next begins.',
 'name;age followed by Ada;4 needs sep=";" to become two columns, name and age.',
 [['pd.read_csv("file.csv")','Read comma-separated fields; the first line supplies column names by default.'],['sep=";"','Split at semicolons instead of commas. A wrong separator can produce one combined column.'],['df = ...; df.head()','Store the whole imported table, then display its first five rows. The preview does not shorten df.']],
 'The quoted filename must name an available file. Import pandas as pd before calling pd.read_csv.');
guide('I02', 'A preview returns selected rows with all their columns. It leaves the original table unchanged.',
 'For rows A, B, C, D: head(2) shows A, B; tail(2) shows C, D.',
 [['head(n) / tail(n)','Take n rows from the start / end. With no number, each defaults to five.'],['sample(n, random_state=1)','Choose n rows from across the table. The fixed seed repeats the selection on the same data.']],
 'A random sample can still miss important groups. It is a spot check, not proof that the table is representative.');
guide('I03', 'shape reports two counts in a fixed order: rows, then columns. Count the entire table unless the question explicitly asks about a preview.',
 'A table with 6 records and 3 fields has shape (6, 3); its first two rows have shape (2, 3).',
 [['df.shape','Return (rows, columns). It is an attribute, so there are no parentheses.'],['len(df) / df.shape[0]','Return just the row count. [0] takes the first item of the pair.'],['df.shape[1]','Return just the column count.']],
 'The heading row and the displayed index are not extra data rows or columns.');
guide('I04', 'Columns name the fields; the index labels the rows. Labels are identifiers and need not match numbered positions.',
 'With columns name, age and row labels A, B: list(df.columns) is ["name", "age"]; list(df.index) is ["A", "B"].',
 [['df.columns','Column labels, in their current order.'],['df.index','Row labels, in their current order. Filtering keeps the existing labels.'],['list(...)','Convert the labels into a Python list.']],
 'Use exact spelling and case: age and Age are different column names.');
guide('I05', 'A dtype describes how a column is stored. Check storage before calculating: text that looks numeric is still text.',
 '"12" is text; 12 is an integer; 12.5 is a decimal. Checking a dtype does not prove that every value is sensible.',
 [['df.dtypes','Return a Series pairing each column name with its dtype.'],['df.info()','Print names, non-missing counts and types; return None, not the printed report.'],['int64 / float64 / object','Whole numbers / decimal numbers / general objects (often text in this runtime).']],
 'A preview retains its columns’ dtypes. Loading a new file infers types from that file, so inspect them again.');
guide('I06', 'Selecting one column name returns a Series: a one-dimensional sequence of values with row labels attached.',
 'df["age"] gives an age Series; df[["age"]] gives a one-column table.',
 [['df["age"]','One name inside brackets selects one Series.'],['df.head(2)["age"]','First choose two rows, then take their age values.'],['df.tail(2)["age"]','Take ages from the final two rows, keeping their original labels.']],
 'The quoted column name must exist. A preview and a column selection can be combined from left to right.');
guide('I07', 'A list of column names keeps a DataFrame, even when the list has just one name. The list also sets the column order.',
 'df[["age", "name"]] shows age first and name second, with every original row.',
 [['df[["age"]]','Outer brackets select; inner brackets make a list. Result: one-column DataFrame.'],['df[["age", "name"]]','Keep only these fields, in this order.'],['df.tail(2)[["name", "age"]]','Combine a row preview with a column list.']],
 'Choosing columns does not sort or renumber rows.');
guide('I08', 'iloc selects by numbered position, starting at zero. A slice includes its start but stops before its end.',
 'For rows A, B, C, D: iloc[1:3] selects B and C. Position 1 means the second row.',
 [['iloc[1:3]','Rows at positions 1 and 2; all columns.'],['iloc[:2, :1]','First two rows, first column, as a DataFrame. The comma separates rows from columns.'],['iloc[-2:, :1]','Final two rows, first column. Negative positions count back from the end.']],
 'A single position such as iloc[0] returns a Series; slices keep the table shape.');
guide('I09', 'loc selects labels, not positions. Use a slice for a continuous range and a list for specific labels.',
 'With labels A, B, C, D, E: loc["B":"D"] selects B, C, D; loc[["D", "B"]] selects D, then B.',
 [['loc["B":"D", ["age"]]','Include both endpoint labels; keep age as a one-column DataFrame.'],['loc[["D", "B"], ["age", "name"]]','Use the exact row and column order in the two lists.']],
 'The comma separates row selection from column selection. Unlike iloc slices, loc label slices include the ending label.');
guide('I10', 'A condition creates a True/False flag for each row. df[mask] returns the whole rows whose flags are True.',
 'For ages [2, 4, 6], age > 4 gives [False, False, True]; filtering keeps only the row with age 6.',
 [['> / >=','Greater than / greater than or equal to. Equality passes only with >=.'],['isin(["A", "B"])','True for either listed value; False for other values.'],['between(2, 5)','True from 2 through 5, including both boundaries by default.']],
 '== compares values; = assigns a value. Filtering preserves row order and original labels.');
guide('I11', 'Combine row conditions to say exactly which records qualify. Each comparison must have its own parentheses.',
 'For a row with age 4 and species Cat: (age >= 2) is True and (species != "Cat") is False.',
 [['(test1) & (test2)','AND: keep a row only if both tests are True.'],['(test1) | (test2)','OR: keep a row if at least one test is True, including when both are True.'],['~(test) / !=','Reverse a True/False mask / test that values are not equal.']],
 'Use & and | for pandas masks. Python and/or are for single truth values, not whole columns.');
guide('I12', 'Sorting moves whole rows together. With multiple sort keys, the first sets the main order and the next resolves ties.',
 'Sorting group ascending, score descending puts group A before B, then higher scores first within each group.',
 [['sort_values("score")','Smallest to largest by default (ascending=True).'],['ascending=False','Largest to smallest.'],['sort_values(["group", "score"], ascending=[True, False])','Pair each column with its own direction.']],
 'The returned table is sorted; df stays unchanged unless you assign the result back to it. Filter first to rank only eligible rows.');
guide('I13', 'Extreme-value selection ranks whole records by a numeric column, then returns the requested number.',
 'For scores [4, 9, 6], nlargest(2, "score") returns the rows for 9 then 6.',
 [['nlargest(n, "score")','Return the n highest rows, already ordered highest first.'],['nsmallest(n, "score")','Return the n lowest rows, already ordered lowest first.'],['Filter, then rank','Find the extreme inside the requested population, not across unrelated rows.']],
 'No extra sort is needed. If the boundary has a tie, the default keeps earlier occurrences.');
guide('I14', 'Distinct values answer “which labels?”; a distinct count answers “how many different labels?”. Neither counts how often each label occurs.',
 'For ["A", "B", "A"], unique() gives A, B; nunique() gives 2.',
 [['unique()','Return distinct values in first-appearance order; a missing value can appear too.'],['list(series.unique())','Turn those distinct values into a Python list.'],['nunique()','Count distinct non-missing values. dropna=False includes missing as a distinct value.']],
 'Filter first when the question is about a subset of the table.');
guide('I15', 'value_counts counts rows for each distinct value. normalize=True divides each count by the number of non-missing values being counted.',
 'For A, A, B: counts are A: 2 and B: 1; proportions are 2/3 and 1/3; percentages are about 66.7 and 33.3.',
 [['value_counts()','Return counts, already largest first by default; no extra sort is needed.'],['normalize=True','Return fractions from 0 to 1. Multiply the result by 100 for percentages.'],['dropna=False','Include missing values as a category and, when normalizing, in the denominator.']],
 'Filtering changes the denominator. Equal counts may appear in either order; a count is not a percentage.');
guide('I16', 'isna flags missing cells True and present cells False. Missing means unknown or absent; it is different from zero.',
 'For [5, missing, 0, missing], isna() is [False, True, False, True]: 2 gaps out of 4, or 50%.',
 [['df.isna().sum()','Count True as 1 and False as 0 down each column.'],['df.isna().mean() * 100','Fraction missing in each column, expressed as a percentage.'],['df[~df["price"].isna()]','Keep rows with a present price; ~ flips the missing-value flags.']],
 'Present text such as "oops" is not missing. Checking for gaps does not check whether a value is valid.');
guide('I17', 'duplicated returns one True/False flag per row. By default it compares every column’s values, ignoring the index; it does not remove rows.',
 'Suppose the complete rows are A, B, A, A. A occurs three times; B occurs once. Read the flags in the same row order.',
 [['keep="first" (default)','Leave the first A False; mark the later A rows True. Flags: False, False, True, True.'],['keep="last"','Leave the last A False; mark the earlier A rows True. Flags: True, False, True, False.'],['keep=False','Mark every A True, including the first. The unique B stays False. Flags: True, False, True, True.']],
 'False here means “do not exempt a copy.” Write it without quotes. mask.sum() counts True flags; df[mask] displays those rows. Matching missing values can also belong to duplicate rows.');
guide('I18', 'describe gives several summaries of the selected numeric values. Each output column describes one input measurement.',
 'For [2, 4, 6], count is 3, mean is 4, min is 2, 50% is 4 and max is 6.',
 [['count / mean / std','Number of known values / average / sample standard deviation (spread).'],['25% / 50% / 75%','Quartiles: the lower quarter, median and upper quarter of the ordered distribution.'],['One column / a list of columns','A Series selection produces a summary Series; a DataFrame selection produces a summary table.']],
 'Missing values are skipped per column, so counts can differ. Select the population and measurements before summarizing.');
guide('I18S', 'Choose the reduction that answers the question. A total, an average and a middle value describe different things.',
 'For [2, 4, 12]: sum is 18, mean is 6 and median is 4. For [2, 4, 8, 10], median is (4 + 8) / 2 = 6.',
 [['sum() / mean()','Add the values / divide their total by the number of known values.'],['median()','Sort conceptually and take the middle; average the middle pair when the count is even.'],['min() / max() / count()','Smallest / largest / number of non-missing values.'],['quantile(0.75)','75th percentile; pandas interpolates between nearby ordered values when needed.']],
 'These methods skip missing values by default. An all-missing sum is 0 by default; that alone does not establish a known total.');
guide('I19', 'groupby gathers rows with the same category. Select the numeric column, then reduce each group to one summary value.',
 'For A: [2, 6] and B: [9], group means are A: 4 and B: 9; group totals are A: 8 and B: 9.',
 [['groupby("group")["value"]','Choose the grouping labels, then the measurement.'],['agg("mean") / mean()','Both calculate one mean per group.'],['sum()','Calculate one total per group.']],
 'Group labels become the Series index and are sorted by default. Missing group labels are excluded unless dropna=False; missing measurements are skipped.');
guide('I20', 'A crosstab counts pairs of category labels. Each cell says how many rows have that exact combination.',
 'If two records are Cat + A and one is Dog + A, the A column contains Cat: 2 and Dog: 1.',
 [['pd.crosstab(first, second)','First supplies row categories; second supplies column categories.'],['Swap the inputs','Transpose the question: former rows become columns.'],['Filter first','Count combinations only within the requested records.']],
 'A zero means no records have that combination among the displayed categories. Counts are not averages.');
guide('I21', 'Correlation summarizes how two numeric measurements move together along a straight-line pattern.',
 'If x increases as y increases, correlation is positive. If y decreases instead, it is negative.',
 [['+1 / −1','Perfect increasing / decreasing straight-line relationship.'],['Near 0','Little linear association; a curved relationship may still exist.'],['corr(numeric_only=True)','Return pairwise correlations for numeric columns, excluding text.']],
 'Missing pairs are omitted; a constant column gives an undefined correlation. A relationship does not prove cause and effect.');
guide('W01', 'Make a separate working table before editing. Assigning another name to df alone still refers to the same object.',
 'clean = df.copy() lets you select or sort clean while keeping the original df available.',
 [['clean = df','Another name for the same table; direct edits can affect df.'],['clean = df.copy()','Independent working DataFrame for these scalar-valued tables.'],['clean = clean[...]','Keep a selection in the working copy; display clean at the end.']],
 'Copying does not filter or sort. Apply each requested change after making the copy.');
guide('W02', 'rename changes labels without changing cell values. A dictionary states each old name and its replacement.',
 '{"cost": "cost_dollars"} changes only the cost heading; the numbers stay the same.',
 [['columns={old: new}','Map existing column names to their new names. Quote both text labels.'],['df = df.rename(columns=...)','Keep the returned table in df. Unlisted columns keep their names.']],
 'A rename preserves row and column order. Select a column list separately if the handoff requires fewer fields.');
guide('W03', 'A column list defines both what survives and where it appears. Assign that selection to df to keep the new layout.',
 'From name, age, weight: selecting ["weight", "name"] removes age and places weight first.',
 [['df = df[[...]]','Keep exactly the listed columns in that order.'],['Move a field to the front','List it first, then list all other fields in their original relative order.']],
 'Column selection keeps all rows unless you also apply a row filter.');
guide('W04', 'drop removes specified labels. Use columns= to make it clear that you are removing fields rather than rows.',
 'Dropping note from name, age, note leaves name, age and the same records.',
 [['drop(columns=["note"])','Remove one field.'],['drop(columns=["note", "code"])','Remove both named fields; keep the remaining order.'],['df = df.drop(...)','Keep the returned table as df; use a clean copy when the source must be preserved.']],
 'Dropping a field does not remove records, reset their labels, or guarantee anonymity.');
guide('W05', 'Filter rows with a rule tied to the report. Assign the selection back to df when the task asks to update the working table.',
 'For [2, 3, 6, 7], the inclusive condition 3 <= value <= 6 keeps 3 and 6.',
 [['== / !=','Include / exclude a named category.'],['(value >= low) & (value <= high)','Require both inclusive boundaries.'],['df = df[mask]','Keep matching rows and every column, preserving their existing order.']],
 'Sorting is a separate operation. Add it only when the report asks for an order.');
guide('W06', 'Sorting moves the existing index labels with their rows. Resetting the index creates new labels 0, 1, 2, ….',
 'After sorting, labels might be [2, 0, 1]. reset_index(drop=True) changes them to [0, 1, 2].',
 [['reset_index()','Keep old labels in a new index column and assign fresh row labels.'],['reset_index(drop=True)','Discard the old labels instead of adding a column.']],
 'Sort or filter before resetting if the new labels should describe the final row order.');
guide('W07', 'Arithmetic on columns works row by row. Assigning to a new column name stores a derived measurement alongside the originals.',
 'Prices [3, 5] plus tips [1, 2] give totals [4, 7]. Ages [2, 3] years become [24, 36] months.',
 [['df["new"] = column * number','Apply the same multiplier to every value.'],['df["new"] = first + second','Combine matching row values; use compatible units.']],
 'An existing column name on the left replaces that column. A new name preserves the source measurements.');
guide('W08', 'A conditional column chooses a value for each row based on a True/False test. Multiple rules are checked in their listed order.',
 'For values [2, 4, 7], rules > 5 → high, > 3 → middle, otherwise low give [low, middle, high].',
 [['np.where(test, yes, no)','Use yes for True rows and no for False rows.'],['np.select(tests, values, default=...)','Take the first matching rule. Put > 5 before > 3, since 7 satisfies both.'],['df["flag"] = mask','Store True/False directly when the output is a flag rather than text.']],
 'Import numpy as np. A strict > test excludes equality; the otherwise branch includes the boundary.');
guide('W09', 'replace and map both use a lookup dictionary, but handle unlisted values differently.',
 'For ["A", "B"] and {"A": 1}: replace gives [1, "B"]; map gives [1, missing].',
 [['replace(lookup)','Change listed values; keep unlisted values as they were.'],['map(lookup)','Return the lookup result for each value; unlisted keys become missing.']],
 'Assign to a new column to preserve the original labels, or replace the original column when requested.');
guide('W10', 'Use .str methods to clean every text value in a column. Each operation solves a different problem; chain them in the needed order.',
 '" TEA-CUP " → strip → "TEA-CUP" → lower → "tea-cup" → replace("-", " ") → "tea cup".',
 [['str.strip()','Remove whitespace at the two ends, not inside the text.'],['str.lower() / str.title()','Lowercase all letters / capitalize the words.'],['str.replace("-", " ", regex=False)','Replace literal hyphens with spaces. regex=False prevents pattern interpretation.']],
 'Cleaning case and spaces does not repair spelling. Each new string operation in a chain needs .str again.');
guide('W11', 'str.contains returns a True/False mask telling you whether each string contains the requested text.',
 'Searching for "a" with case=False matches "Ada" and "TEA"; a missing value gets False with na=False.',
 [['case=False','Ignore upper/lowercase differences; the default is case-sensitive.'],['regex=False','Treat punctuation literally, rather than as a regular-expression pattern.'],['na=False','Use False when text is missing, making the mask safe to filter with.'],['~mask','Reverse the match. A missing value set to False becomes True when inverted.']],
 'df[mask] returns matching rows. Select a column list afterward when only some fields are needed.');
guide('W12', 'to_numeric parses numeric text. Choose what happens when a string cannot be interpreted as a number.',
 '["8.5", "bad", missing] → errors="coerce" → [8.5, missing, missing]. Only "bad" caused a new gap.',
 [['errors="raise" (default)','Stop with an error when parsing fails.'],['errors="coerce"','Replace invalid text with a missing numeric value; existing gaps stay missing.'],['parsed.isna() & ~raw.isna()','Identify new failures, excluding values that were already missing.']],
 'Keep the raw column if the report needs an audit trail. Parsing exposes invalid entries; it does not repair them.');
guide('W13', 'astype changes a column’s storage type. Choose a type that can represent the values and any missingness you need.',
 'Ages [2, 4, missing] can use nullable Int64; ordinary int64 cannot represent the missing value.',
 [['astype("category")','Store repeated labels as categories, without renaming them.'],['astype("string")','Use pandas’ text dtype while preserving text values.'],['astype("Int64")','Use nullable whole numbers. The capital I is significant.']],
 'Do not cast fractional measurements to integers merely to tidy them; that can discard information or fail.');
guide('W14', 'Parse date strings before comparing calendar dates. An explicit format tells pandas which part is the year, month and day.',
 '"2026-08-04" with "%Y-%m-%d" means 4 August 2026. Invalid text becomes NaT with errors="coerce".',
 [['%Y / %m / %d','Four-digit year / month number / day number; literal hyphens match the input separators.'],['errors="coerce"','Make invalid dates missing (NaT); the default raises a parsing error.'],['parsed >= "2026-08-04"','Keep that date and later dates. Missing dates do not pass this comparison.']],
 'parsed.isna() finds all missing parsed dates, including any dates already missing in the source.');
guide('W15', 'The .dt accessor extracts calendar information from a datetime Series. Parse text first; missing dates yield missing calendar values.',
 'For 2026-08-04: year is 2026, month is 8 and day_name() is "Tuesday".',
 [['.dt.year / .dt.month','Year / month number (1 through 12). These attributes have no parentheses.'],['.dt.day_name()','Weekday name. It is a method, so include parentheses.'],['value_counts() / sort_index()','Count each value (largest count first by default) / reorder the result by its labels.']],
 'Monthly counts need sort_index() for calendar order. Sorting counts ranks popularity instead of time.');
guide('W16', 'dropna removes rows missing required fields. Use subset to restrict the check to fields the report actually needs.',
 'A row with price=8 and discount=missing survives subset=["price"], but fails subset=["price", "discount"].',
 [['dropna()','Drop rows with a gap in any column.'],['dropna(subset=["price"])','Require price only; ignore gaps elsewhere.'],['dropna(subset=["price", "discount"])','Require both fields; a gap in either removes the row.']],
 'Parse numeric text before testing numeric completeness. Count exclusions as len(original) − len(eligible).');
guide('W17', 'fillna replaces missing values only. The fill rule is an assumption, so choose it explicitly and retain evidence of the original gaps.',
 '[2, missing, 6] filled with its observed median becomes [2, 4, 6]; the 4 is an estimate.',
 [['fillna(0)','Use zero only when a gap is known to mean none.'],['fillna(series.median())','Use the middle known value as an estimate. Known entries stay unchanged.'],['missing = series.isna()','Record the gap flags before filling; afterward those gaps are no longer visible.']],
 'If every value is missing, the observed median is missing too and cannot fill the gaps.');
guide('W18', 'drop_duplicates removes repeated rows. Decide which copy survives; rows that occur only once are always retained.',
 'For full rows A, B, A, A at indices 0, 1, 2, 3: keeping first retains indices 0, 1; keeping last retains 1, 3.',
 [['keep="first" (default)','Keep the first occurrence of each repeated row.'],['keep="last"','Keep the last occurrence instead.'],['keep=False','Remove every occurrence of repeated rows; only B survives in the example.'],['subset=["order"]','Compare only this key instead of all column values; use it only if that key should identify a record.']],
 'Unlike duplicated, this returns rows, not flags. Retained indices stay unchanged until you reset them. Confirm repeats are accidental before removing them.');
guide('W19', 'Named aggregation produces one row per group, with a name you choose for each summary column.',
 'For prices [2, missing, 6] in one group: mean=4, sum=8, count=2, size=3.',
 [['average=("price", "mean")','Name the output average, use price as input, calculate its mean.'],['count / size','Count known values in a field / count all group rows, including those with a missing field.'],['as_index=False','Keep the group label as a regular column rather than the row index.']],
 'Group labels sort by default. Write named aggregations in the requested output-column order.');
guide('W20', 'transform returns a group statistic at every original row. This lets each observation be compared with its own group.',
 'For A: 2, A: 6, B: 9, transform("mean") returns 4, 4, 9; subtracting gives −2, 2, 0.',
 [['agg("mean")','Reduce each group to one summary row.'],['transform("mean")','Repeat each group mean alongside every row in that group.'],['value > group_mean','Select rows above their own group average.']],
 'The result stays aligned with the original row index, so it can be assigned directly as a column.');
guide('W21', 'pivot_table groups by two categories and summarizes a numeric value for each combination.',
 'If Cat + room A has weights 2 and 6, its cell is 4 with aggfunc="mean" or 8 with aggfunc="sum".',
 [['index / columns','Category on output rows / category on output columns.'],['values / aggfunc','Measurement to summarize / operation, such as "mean" or "sum".'],['Missing combination','No matching records: leave it missing unless a zero has a defensible meaning.']],
 'Filter the population first. Unlike pivot, pivot_table can combine several records for the same cell.');
guide('W22', 'melt stacks measurement columns into rows. Identifiers repeat so every stacked value can still be traced to its source record.',
 'One row Ada · age 4 · weight 8 becomes Ada · age · 4 and Ada · weight · 8.',
 [['id_vars=["name"]','Keep name beside each measurement. More than one identifier is allowed.'],['value_vars=["age", "weight"]','Stack age values, then weight values; other measurements are not included.'],['var_name="measure", value_name="value"','Name the column holding former headings and the column holding their values.']],
 'With n input rows and two measurement columns, the long result has 2 × n rows, including missing measurements.');
guide('W23', 'pivot spreads a measurement-label column across new columns. It rearranges existing values without calculating a summary.',
 'Ada · age · 4 and Ada · weight · 8 become one Ada row with age=4 and weight=8.',
 [['index="name"','Which field identifies output rows.'],['columns="measure", values="value"','Which labels become columns / which values fill their cells.'],['Repeated name + measure pair','pivot raises an error because a cell cannot hold two values. Use an explicit aggregation only when appropriate.']],
 'The supplied long table is your input. Missing combinations stay missing.');
guide('W24', 'merge attaches fields by matching a key. The join type decides what happens to records without a match.',
 'If left keys are A, B and lookup has only A: a left join keeps A and B; an inner join keeps only A.',
 [['on="key"','Compare values of this shared field; matching is not based on row position.'],['how="left"','Keep every left row; unmatched lookup fields become missing.'],['how="inner"','Keep only rows with matching keys.'],['validate="many_to_one"','Allow repeated left keys, but require unique right keys. Raise an error if the lookup repeats a key.']],
 'In this supplied lookup every matched priority is present. A missing joined priority therefore identifies an unmatched record.');
guide('W25', 'concat appends tables in the order listed. It matches column names, rather than looking for matching records.',
 'Batches with indices [0, 1] and [0, 1] produce [0, 1, 0, 1], or [0, 1, 2, 3] with ignore_index=True.',
 [['pd.concat([first, second])','Append second below first and retain existing row labels.'],['ignore_index=True','Number the combined rows consecutively from zero.']],
 'Check that both batches use compatible columns and units. If you filter or sort afterward, reset the final index when requested.');
guide('W26', 'cut assigns values to fixed intervals; qcut chooses boundaries from the observed distribution to aim for equally sized groups.',
 'For bins [0, 3, 10], right=True and include_lowest=True: 0 and 3 are in the first bin; values above 3 through 10 are in the second.',
 [['bins=[0, 3, 10]','Three edges define two intervals. labels must supply two names in interval order.'],['right=True (default)','Include the upper edge of each interval. include_lowest=True also includes the first lower edge.'],['pd.qcut(values, q=2)','Split at sample quantiles into two groups; ties can prevent unique boundaries.']],
 'Values outside all bins become missing. Choose policy boundaries with cut, not sample-dependent qcut.');
guide('W27', 'One-hot encoding replaces category labels with an indicator column for each label.',
 'For species Cat and Dog: the Cat row has species_Cat=1 and species_Dog=0; the Dog row has the reverse.',
 [['columns=["species"]','Choose which category columns to replace; keep other fields.'],['dtype=int','Use 0 and 1 instead of Boolean False and True.'],['Several category fields','Each gets its own prefixed indicator columns.']],
 'Missing categories produce all-zero indicators by default. For prediction, align later data to the categories learned from training data.');
guide('W28', 'A scaler learns reference values from a table, then uses them to rescale measurements. Each column is scaled separately.',
 'For [10, 20, 30], MinMaxScaler returns [0, 0.5, 1]. StandardScaler puts the mean at 0 and measures distances in standard deviations.',
 [['StandardScaler()','Subtract the training mean, then divide by its population standard deviation.'],['MinMaxScaler()','Map the training minimum to 0 and maximum to 1 (constant columns become 0).'],['fit_transform(training)','Learn the scale and apply it to the same table.'],['fit(training); transform(other)','Learn from training only, then reuse those parameters on other rows.']],
 'Use a two-dimensional column list. Held-out values may lie outside 0–1; never fit again on them to force the range.');
guide('W29', 'The IQR rule flags unusually low or high values for review. It does not establish that a value is wrong.',
 'If Q1=10 and Q3=14, IQR=4. The fences are 4 and 20: 3 and 21 are flagged; 4 and 20 are not.',
 [['quantile(0.25) / quantile(0.75)','Find Q1 and Q3, the endpoints of the middle half.'],['lower = Q1 − 1.5 × IQR','Flag values strictly below this fence.'],['upper = Q3 + 1.5 × IQR','Flag values strictly above this fence. Combine the tests with |.']],
 'A flag column preserves all records. Use the mask to create a review list only when asked.');
guide('W30', 'Express a calculation directly on a Series when possible. Vectorized arithmetic applies the operation to every value.',
 'Prices [10, 20] × 1.1 become [11, 22]. Subtracting their original mean (15) gives [−5, 5].',
 [['series * 1.1','Increase each value by 10%.'],['(expression).round(2)','Round the calculated values to two decimal places.'],['series - series.mean()','Subtract one overall average from each value.'],['apply(function)','Run custom logic on values; unnecessary for these direct arithmetic tasks.']],
 'Use a new column name to preserve the original values. Filter afterward if the output needs only selected records.');
guide('V01', 'A Figure is the whole canvas; an Axes is a plotting area inside it. Even one plotting area is called Axes.',
 'fig, ax = plt.subplots(figsize=(6, 4)) creates a canvas 6 inches wide and 4 inches high with one plotting area.',
 [['fig, ax = ...','Store the two returned objects separately: canvas and plotting area.'],['ax.set(title=..., xlabel=..., ylabel=...)','Name the chart and its horizontal and vertical axes.'],['fig.tight_layout(); plt.show()','Adjust spacing around labels, then display the Figure.']],
 'Import matplotlib.pyplot as plt. This first exercise makes an empty labelled canvas; subsequent lessons add observations.');
guide('V02', 'A chart needs a title that says what is being shown and axis labels that identify the measurements and units.',
 'x="temperature" selects data; xlabel="Temperature (°C)" changes the displayed label without renaming the data column.',
 [['ax.set(title=..., xlabel=..., ylabel=...)','Set all three labels on the intended plotting area.'],['figsize=(6, 4)','Set canvas width and height in inches when creating it.'],['fig.tight_layout(); plt.show()','Arrange the labels and display the finished Figure.']],
 'After filtering, the title should make that restricted population clear.');
guide('V03', 'A visual mapping links a column to how each observation appears. A fixed appearance gives all observations the same style.',
 'hue="club" assigns different colours to clubs. color="blue" makes every point blue.',
 [['x / y','Numeric columns for horizontal / vertical positions.'],['hue="group"','Map each category to a colour and add a legend.'],['style / size','Map a category to marker shape / a numeric value to marker area.']],
 'data=df supplies the columns; ax=ax draws on your existing Axes. Add a mapping only when it helps answer the question.');
guide('V04', 'A histogram divides the numeric axis into intervals and counts observations inside each one.',
 'With values [1, 2, 3, 7] and edges [0, 4, 8], the bars have heights 3 and 1.',
 [['sns.histplot(data=df, x="value", bins=4, ax=ax)','Use four intervals across the numeric range; height is count by default.'],['More / fewer bins','Show finer / broader detail. The data do not change.']],
 'Here intervals exclude their right edge except the final interval. A few observations cannot establish a stable population shape.');
guide('V05', 'A kernel density estimate (KDE) smooths observations into a curve. Its height is density, not a count or a probability at one exact value.',
 'Increasing bw_adjust from 1 to 2 makes bumps wider and the combined curve smoother; it does not add observations.',
 [['bw_adjust=1','Use the default smoothing bandwidth. Larger values smooth more; smaller values reveal more bumps.'],['cut=0','Stop drawing at the observed minimum and maximum.'],['sns.kdeplot(..., x="value", ax=ax)','Draw a smoothed view of a numeric column.']],
 'Probability is represented by area over an interval. Tiny samples and smoothing choices can create misleading shapes.');
guide('V06', 'An ECDF shows the fraction of observations at or below each x value. It uses the observed values without bins or smoothing.',
 'For [2, 4, 4, 8], the ECDF at x=4 is 3/4 = 0.75. The fraction strictly above 4 is 1/4 = 0.25.',
 [['sns.ecdfplot(..., x="value", ax=ax)','Default: fraction at or below x.'],['complementary=True','Fraction strictly above x: 1 minus the usual ECDF.']],
 'Tied values produce a larger jump at the same x. Read the vertical scale as a proportion from 0 to 1.');
guide('V07', 'A rug draws a small tick at every observed value. Overlay it on a distribution plot to keep the raw observations visible.',
 'Values [2, 4, 4, 8] produce ticks at 2, 4, 4 and 8, but the two ticks at 4 overlap.',
 [['sns.histplot(...) / sns.kdeplot(...)','Draw the distribution first.'],['sns.rugplot(..., x="value", ax=ax)','Add ticks using the same data column and the same Axes.']],
 'A visible tick count can undercount repeated values. Rug ticks mark positions; their height does not encode a measurement.');
guide('V08', 'A count plot makes one bar per category; its height is the number of records in that category.',
 'Labels A, A, B produce bars A: 2 and B: 1. An explicitly requested C needs a zero bar.',
 [['sns.countplot(data=df, x="group", ax=ax)','Count observations automatically; no numeric y is needed.'],['value_counts().reindex(order, fill_value=0)','Prepare counts in a chosen order and add absent labels with zero.'],['ax.bar(counts.index, counts.values)','Draw those prepared labels and counts without recounting.']],
 'sort_index() orders prepared counts by category label; sort_values() orders them by count.');
guide('V09', 'A summary bar represents a numeric statistic within a category. It does not show how many observations are in that group.',
 'For group A values [2, 4, 12], the mean bar is 6 and the median bar is 4; the record count is 3.',
 [['estimator="mean" (default)','Bar height is the group average.'],['estimator="median"','Bar height is the middle group value.'],['errorbar=None','Omit the error interval; the estimate is still uncertain.']],
 'Use x for categories and y for measurements. Choose a summary that matches the question, then label it accurately.');
guide('V10', 'A point plot marks one summary per category. An interval can describe spread of observations or uncertainty of the summary; these are different claims.',
 'A mean of 10 with standard deviation 2 gets an SD interval from 8 to 12. This is not a confidence interval.',
 [['errorbar="sd"','One standard deviation either side of the estimate; spread of the observed values.'],['errorbar=("ci", 95)','A bootstrapped 95% confidence interval for the estimate, expressing uncertainty.'],['errorbar=None','Draw no interval. estimator="median" changes the default mean to a median.'],['capsize=0.15','Set the width of the small caps at interval ends.']],
 'A group with one observation cannot estimate its sample standard deviation. Small groups support limited conclusions.');
guide('V11', 'A box plot summarizes ordered values: the box covers the middle half and the line inside marks the median.',
 'With Q1=10 and Q3=14, IQR=4. The usual fences are 4 and 20; whiskers end at observed values inside them.',
 [['Box / middle line','25th–75th percentiles / median (50th percentile).'],['Whiskers / separate points','Most extreme observations inside the 1.5×IQR fences / observations beyond them.'],['Numeric x, categorical y','Make horizontal boxes by swapping the measurement and category axes.']],
 'Separate points are review candidates, not proven errors. Quartiles can be unstable in small groups.');
guide('V12', 'A violin’s width shows an estimated density within a group. Wide parts indicate values near many observations, not a larger measured value.',
 'Two groups can have the same median while one is tightly clustered and the other spread out; their violin widths differ along the value axis.',
 [['cut=0','Stop the estimated shape at the observed range.'],['inner="quart"','Draw the quartiles inside the violin.'],['inner="point"','Show individual observations inside the violin.']],
 'The outline is smoothed and depends on sample size. The added raw points help distinguish observations from the estimate.');
guide('V13', 'A strip plot draws every observation at its category. Jitter separates overlapping points along the category direction.',
 'Two observations both measuring 4 keep that measured height; jitter moves them slightly left or right.',
 [['jitter=0.15','Spread points a little around each category position.'],['jitter=False','Use the exact category position, exposing where points overlap.'],['x="value", y="group"','Horizontal version: numeric values run left to right.']],
 'For ordinary text categories, Seaborn uses first-appearance order unless you supply order=[...].');
guide('V14', 'A swarm plot moves points sideways just enough to reduce overlap while preserving every measured value.',
 'Several records measuring 4 line up beside one another at value 4; none is moved to a different measurement.',
 [['sns.swarmplot(...)','Pack observations within each category instead of adding random jitter.'],['size=5','Set marker size; larger points need more room.'],['Numeric x, categorical y','Pack a horizontal swarm while keeping numeric positions unchanged.']],
 'Crowded groups may not fit. A warning about unplaced points signals a readability problem, not missing input records.');
guide('V15', 'With only a few observations per group, show the actual measurements. A complex distribution shape can imply more evidence than is available.',
 'For a group containing weights 3 and 7, two visible points communicate both known values directly.',
 [['stripplot(..., jitter=False)','Show raw values at their category positions.'],['boxplot(...)','Summarize quartiles; useful when enough observations support that summary.'],['boxenplot(...)','Show nested quantile bands for larger samples; not needed for these tiny groups.']],
 'A horizontal raw-point plot puts measurements on x and categories on y. Overlapping points can still hide repeated values.');
guide('V16', 'A scatter plot uses one point for each row’s pair of numeric values. The horizontal and vertical coordinates must come from the same record.',
 'A record with hours=2 and score=70 appears at (2, 70); x chooses hours and y chooses score.',
 [['import seaborn as sns','Load Seaborn plotting functions under the short name sns.'],['data=df, x="hours", y="score"','Seaborn reads both named columns from the supplied table.'],['ax=ax','Draw on the Axes you created.'],['Filter, then plot','Use the selected table for both coordinates so the population stays consistent.']],
 'Patterns can suggest association, clusters or unusual observations. A scatter plot alone cannot establish causation.');
guide('V17', 'Use a small number of visual mappings so a scatter plot stays readable. Mapping the same group to colour and shape gives two ways to recognize it.',
 'Club A might be blue circles and club B orange crosses; the legend explains both cues.',
 [['hue="group"','Give groups distinct colours.'],['style="group"','Give the same groups distinct marker shapes.'],['size="measurement"','Map larger numeric values to larger marker areas; this is different from setting one fixed marker size.']],
 'x and y still locate each observation. Add a size mapping only when that extra measure helps answer the question.');
guide('V18', 'A line connects measurements along an ordered axis such as time. Decide whether repeated times represent raw observations or a summary.',
 'At times 1, 2, 3 with sales 4, 7, 5, the line follows those values in time order.',
 [['estimator=None','Keep raw observations rather than averaging values at the same x.'],['marker="o"','Show a circular marker at each plotted observation.'],['sort=True (default)','Seaborn sorts x before connecting. Matplotlib ax.plot connects in the supplied order.']],
 'For multiple measurements at each time, choose a replicate or an aggregation deliberately; arbitrary connections can mislead.');
guide('V19', 'When several rows share an x value, a line can summarize them or follow one repeated measurement series.',
 'At day 1, replicates A=4 and B=8 have mean 6. Selecting replicate A instead plots its observed value 4.',
 [['estimator="mean"','One average y at each x.'],['errorbar="sd"','Show spread around that average using one standard deviation.'],['estimator=None','Do not aggregate repeated x values; filter to one replicate to follow its trajectory.']],
 'A replicate label identifies which measurement series a row belongs to. An SD band describes spread, not confidence in the mean.');
guide('V20', 'A regression plot overlays a fitted straight line on the paired observations. It summarizes a model of the relationship.',
 'A fitted line can rise while individual points fall above and below it; predictions are not the original observations.',
 [['sns.regplot(..., x=..., y=..., ax=ax)','Fit y from x and draw the observations and fitted line.'],['ci=None','Omit the confidence band. This changes the display, not whether the fit is uncertain.'],['Filter before fitting','Fit only the population named in the question.']],
 'Inspect the points for curves and influential observations. A fitted line does not demonstrate a causal effect.');
guide('V21', 'A residual is observed y minus predicted y. A residual plot helps inspect what a fitted straight line fails to explain.',
 'If observed y=12 and predicted y=10, residual=+2. If observed y=8, residual=−2.',
 [['sns.residplot(..., x=..., y=..., ax=ax)','Fit the relationship and plot residuals vertically against x.'],['Residual = 0','The prediction equals the observation. Positive means above the fitted line; negative means below.'],['Curves / widening spread','Possible nonlinear structure / changing error spread that the line does not capture.']],
 'Pass the original y measurement, not precomputed residuals, to residplot for this exercise. Label the vertical axis Residual.');
guide('V22', 'A correlation heatmap colours a matrix of pairwise numeric relationships. Keep a fixed colour scale so colours retain the same meaning.',
 'A cell at row hours and column score contains their correlation. The mirrored score–hours cell contains the same value.',
 [['corr(numeric_only=True)','Calculate the matrix before plotting it.'],['vmin=-1, vmax=1, center=0','Use the full correlation range with a neutral midpoint.'],['annot=True','Print each cell’s value. cmap="vlag" or "coolwarm" selects a diverging palette.']],
 'A constant column has undefined correlation. Correlation measures linear association and does not establish causation.');
guide('V23', 'A heatmap colours the values you supply in a matrix. Choose whether each cell should count records or summarize a measurement.',
 'Two records in one category pair give count 2; if their ratings are 3 and 5, their mean rating is 4.',
 [['pd.crosstab(rows, columns)','Prepare a matrix of category-pair counts.'],['pivot_table(..., aggfunc="mean")','Prepare a matrix of average measurements.'],['annot=True, fmt="d"','Print integer counts; fmt=".1f" instead prints decimal summaries to one decimal place.']],
 'cmap="Blues" uses light-to-dark blue. An absent measurement combination stays missing, not zero.');
guide('V24', 'subplots creates several plotting areas on one Figure. Send each chart to its intended Axes.',
 'subplots(1, 2) creates left and right panels; subplots(2, 1) creates upper and lower panels.',
 [['fig, axes = plt.subplots(rows, columns, ...)','Keep the whole Figure and its collection of Axes.'],['axes[0] / axes[1]','First / second Axes for a one-row or one-column layout.'],['ax=axes[1]','Direct a Seaborn chart to the second panel. Set labels on that same Axes.']],
 'figsize describes the whole canvas. Finish with fig.tight_layout() and plt.show() once for the complete Figure.');
guide('V25', 'A legend explains how appearance maps to data. Use distinct shapes alongside colour so group identity remains readable without colour.',
 'With hue and style both mapped to group, each group gets a colour and a marker shape in the legend.',
 [['palette="colorblind"','Use a categorical palette designed for distinguishable colours.'],['hue_order / style_order','Lists fix the category-to-colour and category-to-shape order. Use the same list for both.'],['alpha=0.6','Partially transparent points reveal some overlap; 0 is invisible and 1 opaque.'],['ax.legend(title="Category")','Name the legend without changing the chart title.']],
 'Palette chooses colours; hue names the data column that receives those colours.');
guide('V26', 'An axis scale controls the spacing of values; limits control the visible range. Neither changes the underlying observations.',
 'On a log axis, 1→10 and 10→100 take equal space: each is a tenfold increase.',
 [['ax.set_xscale("log")','Use multiplicative spacing on x; these exercises require positive x values.'],['ax.set_xlim(low, high) / ax.set_ylim(low, high)','Set the visible x / y range. Keep every relevant observation visible.'],['ax.set_ylim(bottom=0)','Fix just the lower y bound; the upper bound remains automatic.'],['tick_params(axis="x", labelrotation=30)','Rotate x labels 30 degrees without rotating the data.']],
 'Linear axes are the default. State units and use common limits when panels need direct comparison.');
guide('V27', 'Reference lines put an interpretable benchmark beside observations. Their orientation determines which measurement they refer to.',
 'A horizontal line at rating=4 compares every point’s rating with 4; a vertical line at minutes=30 compares durations.',
 [['ax.axhline(y, linestyle="--")','Horizontal dashed line at a y value.'],['ax.axvline(x, linestyle="--")','Vertical dashed line at an x value.'],['mean() / median() / supplied value','Choose the benchmark specified in the task; these choices answer different questions.']],
 'A chosen threshold is not an estimated average or an automatic decision rule.');
guide('V28', 'An annotation links text to a specific observation. Select the relevant row first so both coordinates describe the same point.',
 'xy=(2, 70) points to that data location; xytext=(8, 8) with offset points places text a little right and above it.',
 [['idxmax() / idxmin()','Return the row label of the largest / smallest value (first if tied). Use loc to retrieve that row.'],['xy / xytext','Data location being labelled / text location.'],['textcoords="offset points"','Interpret xytext as a typographic-point offset from xy.'],['arrowprops={"arrowstyle": "->"}','Draw an arrow from the text to the observation.']],
 'Filter before finding the extreme when the annotation should describe only eligible observations.');
guide('V29', 'ax.bar draws supplied heights exactly. Calculate the intended mean or total first; the drawing call does not summarize raw records.',
 'For group A values [2, 6], use height 4 for an average or height 8 for a total.',
 [['groupby(...).mean() / .sum()','Prepare the group statistic that answers the question.'],['summary.index / summary.values','Category labels / already calculated heights.'],['ax.bar(summary.index, summary.values)','Draw one bar per supplied summary value.']],
 'A catalogue’s average price and sales revenue are different quantities. Here the Follow example compares mean catalogue prices.');
guide('V30', 'Stacked bars add components with the same units. The bottom parameter sets where the upper segment starts.',
 'A base count of 3 and upper count of 2 make a total height of 5; the upper segment starts at 3.',
 [['ax.bar(labels, first)','Draw the base component from zero.'],['ax.bar(labels, second, bottom=first)','Draw the second component above the first.'],['label=...; ax.legend()','Name each component so the stack is interpretable.']],
 'Upper segments have different baselines. Plot one component alone from zero when comparing that component across categories.');
guide('V31', 'pairplot creates its own Figure: distributions on the diagonal and pairwise relationships off the diagonal.',
 'For two variables, the grid shows each distribution and the relationship twice with swapped axes.',
 [['vars=["a", "b"]','Choose numeric variables in the stated order.'],['diag_kind="hist"','Use histograms on the diagonal. hue="group" adds category colours.'],['corner=True','Remove mirrored upper panels; the lower panels and diagonal remain.'],['g.figure.tight_layout(); plt.show()','Finish and display the Figure owned by the returned grid g.']],
 'Do not create a separate fig, ax or pass ax=. Limit variables to keep the grid readable.');
guide('V32', 'jointplot creates a central relationship plot with a distribution along each margin, all on its own Figure.',
 'A central scatter pairs hours and score; the top margin describes hours and the side margin describes score.',
 [['g = sns.jointplot(..., kind="scatter")','Create and store the complete grid.'],['g.ax_joint','Access the central Axes, for example to add a horizontal benchmark.'],['g.figure.tight_layout(); plt.show()','Finish and display the grid’s Figure.']],
 'A line added to g.ax_joint affects the central relationship, not the marginal distributions.');
guide('V33', 'Faceting repeats a chart for different subsets of one category. These Seaborn functions create the Figure and panels for you.',
 'col="station" creates one panel per station; each panel uses only records from that station.',
 [['relplot(kind="scatter")','Scatter relationships, using numeric x and y.'],['catplot(kind="box")','Box plots, using a category and a numeric measurement.'],['displot(kind="hist", bins=4)','Histograms of one numeric measurement, with four bins.'],['height=3','Set each panel’s height to 3 inches; aspect controls width relative to height.']],
 'Store the returned grid as g; finish g.figure and display it. Comparable scales help readers compare panels fairly.');
guide('V34', 'savefig exports a specific Figure to a file. Finish the labels and layout before saving, then display it.',
 'A 6 × 4 inch Figure at 150 dpi is about 900 × 600 pixels before tight cropping changes the edges.',
 [['fig.savefig("chart.png", ...)','Save this Figure as a PNG image with the requested filename.'],['dpi=150','Raster resolution: 150 pixels per inch.'],['bbox_inches="tight"','Crop around the Figure’s visible content, including surrounding labels.']],
 'In this workspace, the saved image appears as a download under the output. Use the same finished Figure for export and display.');
guide('V35', 'Choose a chart from the question and the types of data. Decide what each mark should represent before writing plotting code.',
 '“Do longer study times go with higher scores?” compares two measurements per person, so one point per person is useful.',
 [['"scatter"','Relationship between two numeric measurements.'],['"histogram"','Distribution of one numeric measurement.'],['"counts"','Frequency of category labels.'],['"line"','Change along an ordered sequence such as time.']],
 'These exercises ask for the chart name as a quoted Python string, not a Figure.');
guide('V36', 'Bar length represents magnitude, so use a zero baseline. Choose an order that supports the comparison without changing the values.',
 'Values 4 and 5 differ by 25%. A y-axis beginning at 3 exaggerates their apparent bar-length ratio.',
 [['sort_values(ascending=False)','Rank computed summaries from largest to smallest.'],['sort_index()','Order a summary by its category labels instead.'],['ax.set_ylim(bottom=0)','Keep the bar baseline at zero.']],
 'Calculate the requested mean or total from the full eligible population; do not omit observations to make a pattern clearer.');
// Checkpoints retrieve the preceding concepts rather than introducing new APIs.
guide('I22','Build an inspection from the question: choose records, choose fields, then summarize.', 'A report about one station must filter that station before calculating its weather summaries.', [['Structure','shape, columns and dtypes describe what arrived.'],['Completeness','isna().sum() counts gaps; value_counts() counts category observations.'],['Profile','describe() or grouped means summarize the relevant measurements.']], 'Preserve df so each inspection uses the original evidence.');
guide('W31','A cleaning policy specifies which records and values may change, and why.', 'Parse a numeric field before deciding whether it meets a report’s required-field policy.', [['Copy and deduplicate','Keep the source; remove only confirmed accidental copies.'],['Normalize and parse','Clean labels, convert types and keep invalid values visible as gaps.'],['Prepare the handoff','Apply the stated fill and eligibility rules, then select, sort and reset as requested.']], 'The order matters: calculate an imputation median after removing accidental copies.');
guide('V37','Build several views of the same selected population so the charts answer a coherent question.', 'A distribution and a grouped mean can complement each other only when their populations are clear.', [['Select once','Store the eligible records and reuse them for every Figure.'],['Choose each summary','A histogram counts observations; a scatter pairs values; exact bars use calculated means or totals.'],['Finish each Figure','Set its labels, arrange the layout and display it.']], 'The task states the population, chart types and aggregation; each Figure must follow that same brief.');

function clarify(c) {
 const byId=Object.fromEntries(c.lessons.map(l=>[l.id,l]));
 for(const l of c.lessons) {
  if(!l.review && !guides[l.id]) throw new Error('Missing concept guide: '+l.id);
  if(guides[l.id]) l.guide=guides[l.id];
 }
 const task=(id,index,text)=>{byId[id].rounds[index].task=text;};
 task('I17',0,'Using df, count extra copies of exact duplicate rows, excluding the first occurrence of each repeated row. Display one number. Use duplicated().');
 task('I17',1,'Display the later copies of exact duplicate rows in df, leaving each first occurrence out. Compare all columns and keep original row order. Preserve df.');
 task('I17',2,'Display every df row that has an exact copy elsewhere in the table, including the first occurrence. Compare all columns; keep original row order and preserve df.');
 byId.I17.rounds[2].hint='Create a mask with duplicated(keep=False), then use df[mask] to display all flagged rows. A row without any identical copy stays False.';
 byId.I17.explanation=guides.I17.idea+' '+guides.I17.choices.map(([a,b])=>a+': '+b).join(' ')+' '+guides.I17.note;
 byId.I17.syntax=[['df.duplicated()','True for later copies; False for the first occurrence and unique rows.'],['keep="last"','Exempt the last copy instead of the first.'],['keep=False','True for every copy of a repeated row, including the first; unique rows remain False.'],['mask.sum() / df[mask]','Count flagged rows / display flagged rows.']];
 task('I15',1,'Display the count of df records in each size category as a Series.');
 task('I15',2,'For df records with age at least 3, display the percentage in each species category as a Series, on a 0–100 scale.');
 task('I19',1,'Display total price for each size category in df as a Series.');
 task('I19',2,'For df records with age at least 2, display average weight by species as a Series.');
 task('W15',1,'Parse date without changing df. Display the count of valid dates for each weekday name as a Series.');
 // These summaries are keyed by category; display order is not part of the question.
 for(const id of ['I15','I19'])for(const r of byId[id].rounds)r.unorderedIndex=true;
 byId.W15.rounds[1].unorderedIndex=true;
 task('W19',1,'Summarise df by size. Display columns size, total (sum of price), and n (number of non-missing prices), in that order, with size sorted alphabetically.');
 task('W19',2,'For df records with age at least 2, display average weight and row count by species. Use columns species, average, n, in that order, with species sorted alphabetically.');
 task('W04',2,'Prepare a separate clean copy of df without name and room for a measurement handoff. Preserve df and display clean.');
 task('W18',2,'Preserve df. Remove confirmed extra identical rows into a separate clean table, keeping each first occurrence. Sort by order ascending and reset to consecutive row labels without adding an index column. Display clean.');
 task('W27',2,'For df records with age at least 3, display a table containing age, then weight, then integer indicator columns for species.');
 task('W28',0,'Using df, standardise price then rating with StandardScaler. Display a numeric array with those two columns in that order. Use fit_transform().');
 task('W28',1,'Using df, scale price then tip to 0–1 with MinMaxScaler. Display a numeric array with those two columns in that order. Use fit_transform().');
 byId.V29.explanation=guides.V29.idea+' '+guides.V29.example+' '+guides.V29.note;
 byId.V29.syntax=[['groupby(...).mean() / .sum()','Calculate the requested group means / totals.'],['ax.bar(summary.index, summary.values)','Draw the category labels and calculated heights.']];
 byId.V29.syntaxCode='means = df.groupby("flavour")["price"].mean()\nax.bar(means.index, means.values)';
 byId.I01CSV.syntax.push(['sep=";"','Use semicolons rather than the default commas to separate fields.']);
 byId.I11.syntax[1]=['(test1) | (test2)','True when either or both comparisons are True.'];
 // Stale suggestions must not describe an earlier version of the exercise.
 byId.I01.stretch='Try adding one extra value to just one column list. Why can pandas no longer pair values into complete rows?';
 byId.W11.explanation=guides.W11.idea+' '+guides.W11.note;
 byId.W11.syntax=guides.W11.choices;
 const checkpoint=byId.W31.rounds;
 for(const r of checkpoint)r.task=r.task.replace('Remove extra identical rows.','Remove confirmed extra identical rows, keeping the first occurrence.').replace('Remove confirmed exact duplicate rows.','Remove confirmed extra identical rows, keeping the first occurrence.').replace('date to datetime, coercing invalid entries','date to datetime with year-month-day format, making invalid values missing').replace('Sort by order and reset the index.','Sort by order ascending and reset to consecutive row labels without adding an index column.').replace('sort by order and reset the index.','sort by order ascending and reset to consecutive row labels without adding an index column.').replace('sorted by order with a fresh consecutive index','sorted by order ascending with a fresh consecutive index and no added index column');
 for(const l of c.lessons)for(const r of l.rounds){
  if(r.retrieves)continue; // Refresh copied retrievals after their source contracts.
  r.task=r.task.replace(/Using df, use /g,'Using df, call ')
   .replace(/Practise: /g,'Use: ').replace(/care-about threshold/g,'review threshold').replace(/Using df, show df /g,'Using df, show ').replace(/Using df, compare df /g,'Using df, compare ');
  r.task=r.task.replace(/Use: ([^.]+(?:\(\))?[^.]*?)\.(?=\s|$)/g, (match, list, offset, text)=> {
   const before=text.slice(0,offset);
   const missing=list.split(', ').filter(call=>!before.includes(call.replace(/\(\)$/,'')));
   return missing.length?'Use: '+missing.join(', ')+'.':'';
  }).replace(/\s+/g,' ').trim();
  // Do not repeat a display instruction already present elsewhere in the brief.
  if(/Finish.*(?:show\(\)|tight_layout and show)/.test(r.task))r.task=r.task.replace(/ Display the chart with plt\.show\(\)\./g,'');
  if(/preserve df|df unchanged|without (?:modifying|overwriting).*df|keep df unchanged/i.test(r.task))r.preserveData=true;
  if(l.id!=='V37')r.steps=r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 }
 // Retrieval retains its identity and starter, but uses the corrected source brief/checker.
 for(const l of c.lessons)for(let i=0;i<l.rounds.length;i++){
  const r=l.rounds[i];if(!r.retrieves)continue;
  const source=byId[r.retrieves].rounds[2];
  l.rounds[i]={...JSON.parse(JSON.stringify(source)),id:r.id,label:r.label,retrieves:r.retrieves,starter:r.starter,demand:r.demand};
 }
 return c;
}
const api={guides,clarify};
if(typeof module!=='undefined')module.exports=api;else root.FoundationClarity=api;
})(typeof window!=='undefined'?window:globalThis);
