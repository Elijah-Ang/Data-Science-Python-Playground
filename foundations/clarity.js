/* Authored concept comparisons and task contracts. Applied after progression edits. */
(function(root){
'use strict';
// Each example is deliberately separate from the exercise data. Follow shows one
// annotated code example; later practices retain the fuller concept reference.
const guides = {};
function guide(id, idea, example, choices, note, extras={}) {
 guides[id] = {idea, example, choices, note, ...extras};
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
 'These methods skip missing values by default. An all-missing mean is missing; a plain sum may be 0, which does not establish a known total.');
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
 'If a date could not be parsed, its year, month and weekday stay missing. Do not treat an invalid date as January or Monday.');
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
guide('W19', 'Rows with the same flavour form a group. .agg(...) means aggregate: it makes one result row per group by running the calculations inside. Each new_name=("input", "operation") defines one output column: the left name is its heading; the pair chooses the source field and calculation.',
 'Fruity has prices 2 and 4, so its mean_amount is (2 + 4) / 2 = 3 and records is 2. Mint has one price, 8, so its mean_amount is 8 and records is 1.',
 [['df.groupby("flavour", as_index=False)','Collect rows by flavour and keep flavour as a regular output column.'],['.agg(...)','Aggregate: reduce each group to one result row using the named calculations inside.'],['mean_amount=("price", "mean")','Create an output column called mean_amount from the mean of price in each group.'],['records=("price", "size")','Create an output column called records from the row count in each group.']],
 'size counts every row in a group, even if the selected value is missing. count counts only non-missing values in the selected column. Use size for a row count and count for known values. When every selected value is present, both totals are equal.',
 {followNote:'size counts every group row, including rows with missing prices; use it for records. count counts only non-missing prices; use it for known prices. This exercise asks for records, so we use size. No prices are missing here, so count also gives the same answer.',exampleOutput:{caption:'Result after .agg(...)',headers:['flavour','mean_amount','records'],rows:[['fruity',3,2],['mint',8,1]]}});
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
guide('W26', 'cut assigns values to fixed intervals whose boundaries you choose. Add a label for each interval to make the result readable.',
 'For bins [0, 3, 10], right=True and include_lowest=True: 0 and 3 are in the first bin; values above 3 through 10 are in the second.',
 [['bins=[0, 3, 10]','Three edges define two intervals. labels must supply two names in interval order.'],['right=True (default)','Include the upper edge of each interval. include_lowest=True also includes the first lower edge.']],
 'Values outside all bins become missing. The cut boundaries stay fixed even if the sample changes.');
guide('W27', 'One-hot encoding replaces category labels with an indicator column for each label.',
 'For species Cat and Dog: the Cat row has species_Cat=1 and species_Dog=0; the Dog row has the reverse.',
 [['columns=["species"]','Choose which category columns to replace; keep other fields.'],['dtype=int','Use 0 and 1 instead of Boolean False and True.'],['Several category fields','Each gets its own prefixed indicator columns.']],
 'A missing category produces all-zero indicators by default. Zero means that row did not match any known label, not that its category was measured as zero.');
guide('W28', 'A scaler learns reference values from a table, then uses them to rescale measurements. Each column is scaled separately.',
 'For [10, 20, 30], MinMaxScaler returns [0, 0.5, 1]. StandardScaler puts the mean at 0 and measures distances in standard deviations.',
 [['StandardScaler()','Subtract the training mean, then divide by its population standard deviation.'],['MinMaxScaler()','Map the training minimum to 0 and maximum to 1 (constant columns become 0).'],['fit_transform(training)','Learn the scale and apply it to the same table.'],['fit(training); transform(other)','Learn from training only, then reuse those parameters on other rows.']],
 'Fit the scaler on training rows, then reuse scaler.transform(other) for new rows. Fitting again changes the reference scale and makes comparisons unreliable.');
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
 'countplot counts the rows you pass it. When drawing prepared counts later, sort_index() orders category labels and sort_values() ranks frequencies.');
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
 'Comparable scales help readers compare panels fairly. A panel with different limits can make the same change look larger or smaller.');
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
guide('I22','Inspect field quality before choosing records and summaries for a question.', 'A column-quality table puts each original field beside its storage type and missing count.', [['df.dtypes.astype(str)','Convert each dtype to text for the quality table.'],['df.isna().sum()','Count missing entries in each field.'],['pd.DataFrame(...)','Align the two Series by field name into one table.']], 'Preserve df so later inspections use the original evidence.');
guide('W31','A cleaning policy specifies which records and values may change, and why.', 'Parse a numeric field before deciding whether it meets a report’s required-field policy.', [['Copy and deduplicate','Keep the source; remove only confirmed accidental copies.'],['Normalize and parse','Clean labels, convert types and keep invalid values visible as gaps.'],['Prepare the handoff','Apply the stated fill and eligibility rules, then select, sort and reset as requested.']], 'The order matters: calculate an imputation median after removing accidental copies.');
guide('V37','Build several views of the same selected population so the charts answer a coherent question.', 'A distribution and a grouped mean can complement each other only when their populations are clear.', [['Select once','Store the eligible records and reuse them for every Figure.'],['Choose each summary','A histogram counts observations; a scatter pairs values; exact bars use calculated means or totals.'],['Finish each Figure','Set its labels, arrange the layout and display it.']], 'The task states the population, chart types and aggregation; each Figure must follow that same brief.');

const noteTitles={
 I01:'Read the symbols',I02:'A preview has limits',I01CSV:'Before reading a file',I03:'What counts as data',I04:'Names must match',I05:'Check types again',I06:'Use an existing column name',I07:'Rows stay in place',I08:'Check the result shape',I09:'The end label is included',I10:'Compare versus assign',I11:'Use pandas Boolean operators',I12:'Keep the sorted result',I13:'Ties at the boundary',I14:'Choose the right rows',I15:'Count versus proportion',I16:'Missing versus invalid',I17:'Flags and duplicates',I18:'Counts can differ',I18S:'When every value is missing',I19:'Which rows form groups',I20:'What zero means',I21:'Limits of correlation',
 W01:'Copy, then change',W02:'A rename changes headings',W03:'Rows stay in place',W04:'Dropping a field',W05:'Filtering is not sorting',W06:'Reset at the right time',W07:'New or existing name',W08:'The threshold boundary',W09:'Keep the original labels?',W10:'Each string step needs .str',W11:'Keep the requested fields',W12:'Preserve the raw text',W13:'Choose a type that fits',W14:'Missing parsed dates',W15:'Invalid dates stay missing',W16:'Check completeness after parsing',W17:'No median if all are missing',W18:'Rows versus flags',W19:'Why size here?',W20:'The original row positions',W21:'Repeated combinations',W22:'How many rows result?',W23:'Missing combinations',W24:'Spot unmatched rows',W25:'Stack compatible tables',W26:'Values outside the bins',W27:'What an all-zero row means',W28:'Do not refit held-out data',W29:'Flag before removing',W30:'Preserve the source values',
 V35:'Return a chart name',V01:'Start with the canvas',V16:'A pattern is not a cause',V02:'Name the population',V04:'Small samples have limits',V08:'Sort counts deliberately',V18:'Repeated times need a choice',V09:'Match bars to the question',V13:'Category order',V11:'Outliers are candidates',V03:'Map only useful cues',V17:'Keep x and y clear',V22:'Limits of correlation',V24:'Finish the whole Figure',V25:'Colour versus data mapping',V26:'Compare scales fairly',V27:'What a threshold means',V29:'Mean price versus revenue',V34:'Export the finished Figure',V36:'Use the full population',V05:'Smoothing can mislead',V06:'Ties and proportions',V07:'Ticks can overlap',V10:'Small groups have limits',V12:'Estimate versus observations',V14:'When points do not fit',V15:'Read the axes',V19:'Spread is not confidence',V20:'A fit is not a cause',V21:'Pass the original measurement',V23:'Missing is not zero',V28:'Find the extreme after filtering',V30:'Compare stacked components',V31:'The grid owns its Figure',V32:'Change the central Axes',V33:'Finish the grid',
 I22:'Keep the source table',W31:'Order the cleaning steps',V37:'Use one clear population'
};
for(const [id,title] of Object.entries(noteTitles))guides[id].noteTitle=title;

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
 byId.W19.syntaxCode='df.groupby("flavour", as_index=False).agg(\n    mean_amount=("price", "mean"),\n    records=("price", "size")\n)';
 byId.W19.example=byId.W19.syntaxCode;
 byId.W19.syntax[1][1]='Aggregate the rows in each flavour group. The calculations named inside these parentheses produce the result columns.';
 byId.W19.syntax[2][1]='Inside .agg(...), this chosen name becomes a new result column heading. There is no earlier mean_amount column to find.';
 byId.W19.syntax[3][1]='The parentheses and comma make a two-item tuple: price is the input column; mean averages its known values within each group.';
 byId.W19.syntax[4][1]='Inside .agg(...), this chosen name becomes the second result column heading: the count of records in the group.';
 byId.W19.syntax[5][1]='The pair names price as the input column and size as the pandas operation used for records.';
 byId.W19.rounds[0].hint='Inside .agg(...), mean_amount=("price", "mean") averages price for each flavour. records=("price", "size") counts all rows in that flavour group.';
 byId.W19.rounds[1].hint='Inside .agg(...), total=("price", "sum") adds known prices. n=("price", "count") counts non-missing prices, which can be less than the row count.';
 // First-exercise syntax names parts of the code learners can see. Related
 // methods remain available in a separate, optional reference below it.
 byId.I07.syntax=[['df[["rating", "price"]]','Keep only rating and price, in that order, as a DataFrame.'],['inner [ ]','The inner brackets make a Python list of column names.'],['comma','Separate the two names inside that list.']];
 byId.I08.syntax=[['df.iloc[:2, :2]','Select a rectangular part of df by numbered position.'],['first :2','Take row positions 0 and 1; stop before position 2.'],['comma','Separate the row selection from the column selection.'],['second :2','Take column positions 0 and 1.'],['df.iloc[0]','A single row position returns a Series instead of a table.']];
 byId.I10.syntax[0]=['df["price"] > 2.1','Test each price; the result is one True or False per row.'];
 byId.I11.syntax=[['(df["price"] > 2.1)','The first test marks prices above 2.1.'],['&','Keep a row only when both parenthesised tests are True.'],['(df["flavour"] == "fruity")','The second test marks fruity rows; == compares values.'],['df[...]','Use the combined True/False mask to keep matching rows.'],['|','Use this instead of & when either test may be True.'],['~','Reverse a True/False mask.']];
 byId.I17.syntax=[['df.duplicated()','Mark later copies of complete rows True; the first copy stays False.'],['.sum()','Count those True flags to get the number of extra copies.'],['keep="last"','Exempt the last copy instead of the first.'],['keep=False','Mark every copy of a repeated row, including the first.'],['df[mask]','Show the rows whose duplicate flags are True.']];
 byId.I18S.syntax=[['df["price"]','Choose the numeric column whose values answer the question.'],['.mean()','Average its known values.'],['.median()','Find the middle known value instead.'],['.sum() / .count()','Add known values / count known values.'],['.min() / .max()','Smallest / largest known value.'],['.quantile(0.75)','The 75th percentile of known values.']];
 byId.I20.syntax=[['pd.crosstab(...)','Count how often pairs of category values occur.'],['df["flavour"]','The first Series supplies the output row labels.'],['df["shelf"]','The second Series supplies the output column labels.'],['each cell','The number of records with that row-and-column combination.']];
 byId.W02.syntax=[['df.rename(columns={"price": "amount"})','Return a table with the price heading changed to amount; the values stay put.'],['columns={"price": "amount"}','In the dictionary, the old heading comes first and the new heading second.'],['df =','Store the returned table so the new heading is kept.']];
 byId.W03.syntax=[['df[["candy", "rating", "price"]]','Keep exactly these three columns in the listed order.'],['inner [ ]','Make a list of column names; the outer brackets select from df.'],['df =','Store the smaller table under the name df.']];
 byId.W05.syntax=[['df["flavour"] == "fruity"','Produce a True/False test for every row; == compares rather than assigns.'],['df[mask]','Keep only rows whose test is True.'],['df =','Store those matching rows as the new df.']];
 byId.W07.syntax=[['df["pair_price"] =','Create a new column called pair_price on the left.'],['df["price"] * 2','Multiply each existing price by two on the right, row by row.']];
 byId.W08.syntax=[['import numpy as np','Load NumPy and name it np.'],['df["band"] =','Create a new band column from the result.'],['np.where(test, yes, no)','For each row, return yes when its test is True and no otherwise.'],['df["price"] > 2.1','The test: equality with 2.1 is False and goes to the otherwise branch.'],['"high", "low"','Use high for True and low for False.']];
 byId.W11.syntax=[['df["candy"].str.contains("a", ...)','Check each candy name for the text a; return one True/False flag per row.'],['case=False','Match A and a alike.'],['na=False','Treat a missing name as no match so the mask can filter rows.'],['regex=False','Treat the search text literally rather than as a pattern.'],['df[...]','Keep the rows whose flags are True.'],['~mask','Reverse the flags to select non-matches instead.']];
 byId.W12.syntax=[['df["price"] =','Replace the text column with the parsed numeric values.'],['pd.to_numeric(df["price"], errors="coerce")','Try to turn each price string into a number.'],['errors="coerce"','Make invalid text missing (NaN) instead of stopping with an error.']];
 byId.W20.syntax=[['df.groupby("flavour")','Make one group for each flavour.'],['["price"]','Select the price values to summarise inside each group.'],['.transform("mean")','Calculate each group mean and repeat it at every original row in that group.'],['df["group_mean"] =','Store those aligned means in a new column beside the original rows.']];
 byId.W23.syntax=[['long.pivot(...)','Reshape the supplied long table into wider rows.'],['index="candy"','Use each candy name to identify an output row.'],['columns="measure"','Turn each measure label into an output column.'],['values="value"','Put each corresponding value into its new cell.']];
 byId.W24.syntax=[['on="flavour"','Match rows on equal flavour values in both tables.'],['how="left"','Keep every df row; unmatched lookup values become missing.'],['validate="many_to_one"','Allow repeated flavours in df but require each flavour to appear only once in lookup.'],['how="inner"','Keep only rows with matches on both sides instead.']];
 byId.W26.syntax=[['pd.cut(df["price"], bins=[0, 2.1, 100], ...)','Place each price into an interval bounded by the listed edges.'],['labels=["lower", "upper"]','Name the first and second intervals in order.'],['include_lowest=True','Include the lowest edge, 0, in the first interval.']];
 byId.W26.rounds[1].teaching={
  title:'Meet pd.qcut',
  idea:'pd.qcut chooses boundaries from the values in the sample. It aims to put similar numbers of rows in each group, whereas pd.cut uses the fixed boundaries you supply.',
  example:'With prices 2, 3, 8 and 9, two quantile groups put the two lower prices together and the two higher prices together.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"price": [2, 3, 8, 9]})\nsample["half"] = pd.qcut(\n    sample["price"], q=2, labels=["lower", "upper"]\n)\nsample',
  output:{caption:'Result of the four-price example',headers:['price','half'],rows:[[2,'lower'],[3,'lower'],[8,'upper'],[9,'upper']]},
  parts:[
   ['pd.qcut(...)','Find group boundaries from the sample values instead of supplying fixed edges with bins=[...].'],
   ['sample["price"]','Use these numeric values to decide where the groups divide.'],
   ['q=2','Ask for two quantile groups, each aiming to contain half the rows.'],
   ['labels=["lower", "upper"]','Call the group with lower values lower, and the group with higher values upper.'],
   ['sample["half"] =','Save each row’s group label in a new half column.']
  ],
  noteTitle:'Why use qcut in this practice?',
  note:'The task asks for two groups based on this sample, without fixed price boundaries. Use qcut with q=2. Tied values at a boundary can make equally sized groups impossible; some tied samples cannot form two distinct quantile bins.'
 };
 byId.W08.rounds[1].teaching={
  title:'Meet np.select',
  idea:'np.where chooses between two results. np.select handles several conditions: it checks them in order and uses the result for the first True condition.',
  example:'A price of 6 matches both > 5 and > 3, so the > 5 condition must come first to label it high.',
  code:'import pandas as pd\nimport numpy as np\n\nsample = pd.DataFrame({"price": [2, 4, 6]})\nsample["band"] = np.select(\n    [sample["price"] > 5, sample["price"] > 3],\n    ["high", "middle"], default="low"\n)\nsample',
  output:{caption:'Result of the three-price example',headers:['price','band'],rows:[[2,'low'],[4,'middle'],[6,'high']]},
  parts:[
   ['np.select(...)','Choose one result for each row from several possible conditions.'],
   ['[price > 5, price > 3]','Test these conditions in order; the first True one wins.'],
   ['["high", "middle"]','Pair each condition with its output label in the same position.'],
   ['default="low"','Use low when neither condition is True.'],
   ['sample["band"] =','Store the chosen label beside each input price.']
  ],
  noteTitle:'Why is the order important?',
  note:'The price 6 satisfies both tests. If > 3 came first, 6 would be labelled middle before the > 5 test was reached.'
 };
 byId.W28.rounds[1].teaching={
  title:'Meet MinMaxScaler',
  idea:'StandardScaler measures distance from a mean. MinMaxScaler instead maps the smallest training value to 0 and the largest to 1; values between them follow proportionally.',
  example:'For scores 10, 20 and 30, the returned values are 0, 0.5 and 1 in the same row order.',
  code:'import pandas as pd\nfrom sklearn.preprocessing import MinMaxScaler\n\nsample = pd.DataFrame({"score": [10, 20, 30]})\nscaler = MinMaxScaler()\nscaler.fit_transform(sample[["score"]])',
  output:{caption:'Rows in the returned numeric array',headers:['input score','scaled score'],rows:[[10,0],[20,0.5],[30,1]]},
  parts:[
   ['from sklearn.preprocessing import MinMaxScaler','Import the tool that scales each numeric column to the 0–1 range.'],
   ['scaler = MinMaxScaler()','Create a scaler to hold the learned minimum and maximum.'],
   ['sample[["score"]]','Pass a two-dimensional table; the inner brackets list its columns.'],
   ['scaler.fit_transform(...)','Learn the minimum and maximum from this table, then return the scaled values as a numeric array.']
  ],
  noteTitle:'When to fit again?',
  note:'Fit on the training rows. For new rows, call scaler.transform(...) so they use the same minimum and maximum.'
 };
 byId.V08.syntax=byId.V08.syntax.filter(([code])=>!['counts.reindex(order, fill_value=0)','ax.bar(counts.index, counts.values)'].includes(code));
 byId.V08.rounds[1].teaching={
  title:'Prepare counts before drawing bars',
  idea:'countplot counts the rows it receives. When a chart must also show a category with no rows, prepare the counts and add the missing category with zero before drawing bars.',
  example:'Sun appears twice, Rain once, and Snow is absent. The prepared counts still include a zero for Snow.',
  code:'import pandas as pd\nimport matplotlib.pyplot as plt\n\nsample = pd.DataFrame({"sky": ["Sun", "Rain", "Sun"]})\ncounts = sample["sky"].value_counts().reindex(\n    ["Sun", "Rain", "Snow"], fill_value=0\n)\nfig, ax = plt.subplots()\nax.bar(counts.index, counts.values)\nax.set(xlabel="sky", ylabel="Count")\nfig.tight_layout()\nplt.show()',
  output:{caption:'Counts used as bar heights',headers:['sky','count'],rows:[['Sun',2],['Rain',1],['Snow',0]]},
  parts:[
   ['value_counts()','Count the observed rows for each sky value.'],
   ['reindex([...], fill_value=0)','Put labels in the requested order and add absent labels with a zero count.'],
   ['counts.index','Use those labels for the bar positions.'],
   ['counts.values','Use the matching prepared counts for bar heights.'],
   ['ax.bar(...)','Draw the prepared counts; bar does not count raw rows for you.']
  ],
  noteTitle:'Why prepare the counts?',
  note:'The task explicitly includes Snow even though no row says Snow. Reindex creates its zero before the bars are drawn.'
 };
 byId.V33.rounds[1].teaching={
  title:'Meet catplot for category panels',
  idea:'relplot repeats a relationship chart across panels. catplot uses the same figure-level pattern for a categorical chart, such as a box plot of numeric values within categories.',
  example:'This sample makes one panel per station. Within each panel, Sun and Rain each have a temperature box.',
  code:'import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({\n    "station": ["A"] * 6 + ["B"] * 6,\n    "sky": ["Sun"] * 3 + ["Rain"] * 3 + ["Sun"] * 3 + ["Rain"] * 3,\n    "temperature": [20, 21, 22, 17, 18, 19, 24, 25, 26, 21, 22, 23]\n})\ng = sns.catplot(\n    data=sample, x="sky", y="temperature", col="station", kind="box", height=3\n)\ng.figure.tight_layout()\nplt.show()',
  result:'Two panels, A and B, with a Sun and Rain box in each panel.',
  parts:[
   ['sns.catplot(...)','Create a figure of categorical charts, one panel for each station.'],
   ['x="sky", y="temperature"','Place categories along x and their numeric temperatures along y.'],
   ['col="station"','Split the rows into separate station panels.'],
   ['kind="box"','Summarise the temperature distribution with boxes.'],
   ['g.figure.tight_layout(); plt.show()','Arrange and display the Figure owned by the returned grid g.']
  ],
  noteTitle:'Where is fig, ax?',
  note:'catplot creates its own Figure and returns a grid named g. Finish g.figure; do not call plt.subplots() first.'
 };
 byId.V33.rounds[2].teaching={
  title:'Meet displot for distribution panels',
  idea:'displot makes distribution charts across panels. Give it one numeric x column, then use col to split that distribution by category.',
  example:'The two genres become separate panels, each showing the distribution of its own game lengths.',
  code:'import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({\n    "genre": ["Puzzle"] * 4 + ["Race"] * 4,\n    "minutes": [10, 15, 20, 25, 30, 35, 40, 45]\n})\ng = sns.displot(\n    data=sample, x="minutes", col="genre", kind="hist", bins=4, height=3\n)\ng.figure.tight_layout()\nplt.show()',
  result:'One histogram panel for Puzzle and one for Race; each uses only that genre’s rows.',
  parts:[
   ['sns.displot(...)','Create a figure of distribution charts.'],
   ['x="minutes"','Use this one numeric field to form the distribution.'],
   ['col="genre"','Make one panel per genre using that genre’s rows.'],
   ['kind="hist", bins=4','Draw a histogram with four numeric bins.'],
   ['g.figure.tight_layout(); plt.show()','Arrange and display the Figure owned by g.']
  ],
  noteTitle:'Which facet function fits?',
  note:'Use relplot for a relationship between measurements, catplot for a categorical comparison, and displot for a distribution.'
 };
 byId.I02.rounds[2].teaching={
  title:'Take a repeatable random sample',
  idea:'head and tail take rows from the ends of a table. sample chooses rows from anywhere; random_state fixes the selection so a later run can reproduce it.',
  example:'From four named rows, this two-row sample selects D and C. Running it again with the same seed selects the same rows.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"name": ["A", "B", "C", "D"]})\nsample.sample(n=2, random_state=1)',
  output:{caption:'Sample result with the original row labels',headers:['row','name'],rows:[[3,'D'],[2,'C']]},
  parts:[
   ['sample.sample(...)','Choose rows rather than taking only the beginning or end.'],
   ['n=2','Return two rows.'],
   ['random_state=1','Use a fixed seed so this same input gives the same selection again.']
  ],
  noteTitle:'Why fix the seed?',
  note:'A fixed seed lets someone repeat the spot check. It does not make the sampled rows representative of every possible pattern.'
 };
 byId.I10.rounds[1].teaching={
  title:'Filter for several named values',
  idea:'isin makes one True/False value per row. It is True when the row’s value appears in the supplied list; use that mask inside df[...] to keep matching rows.',
  example:'Tea and Latte are in the allowed list, while Coffee is not.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"drink": ["Tea", "Coffee", "Latte"]})\nsample[sample["drink"].isin(["Tea", "Latte"])]',
  output:{caption:'Rows kept by the membership test',headers:['drink'],rows:[['Tea'],['Latte']]},
  parts:[
   ['sample["drink"]','Read the value to test from every row.'],
   ['.isin(["Tea", "Latte"])','Mark a row True when its drink matches either listed name.'],
   ['sample[...]','Keep only the rows whose membership flag is True.']
  ],
  noteTitle:'Why use a list?',
  note:'The list gives all allowed values in one test. The table stays in its original row order.'
 };
 byId.I10.rounds[2].teaching={
  title:'Filter an inclusive range',
  idea:'between(low, high) makes a True/False mask for values inside a range. By default it includes both endpoints.',
  example:'Ages 2 and 5 both survive a range from 2 through 5; ages 1 and 6 do not.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"age": [1, 2, 5, 6]})\nsample[sample["age"].between(2, 5)]',
  output:{caption:'Rows kept by the inclusive range',headers:['age'],rows:[[2],[5]]},
  parts:[
   ['sample["age"]','Read the numeric value from every row.'],
   ['.between(2, 5)','Mark values from 2 through 5 True, including 2 and 5.'],
   ['sample[...]','Keep only the rows with a True range flag.']
  ],
  noteTitle:'What about the boundaries?',
  note:'Use between here because the task includes both ages 2 and 5. A strict > or < comparison would drop an endpoint.'
 };
 byId.I12.rounds[2].teaching={
  title:'Sort by two keys in different directions',
  idea:'Give sort_values a list of columns when the first sort key alone can tie. A matching list of ascending values sets the direction for each key.',
  example:'Sort groups alphabetically, then put the higher score first within group A.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"group": ["B", "A", "A"], "score": [2, 1, 3]})\nsample.sort_values(["group", "score"], ascending=[True, False])',
  output:{caption:'Result in sorted order',headers:['group','score'],rows:[['A',3],['A',1],['B',2]]},
  parts:[
   ['["group", "score"]','Sort by group first; use score to order rows within the same group.'],
   ['ascending=[True, False]','Sort group A to Z, then score high to low. Each Boolean matches the column in the same position.'],
   ['sample.sort_values(...)','Return the sorted whole rows, keeping each score with its group.']
  ],
  noteTitle:'Why two direction values?',
  note:'One ascending value would apply to both keys. This task asks for opposite directions, so the lists must align.'
 };
 byId.I14.rounds[1].teaching={
  title:'Get the labels, not just their count',
  idea:'nunique counts distinct known values. unique returns the distinct values themselves, in first-appearance order; list(...) turns that array into a Python list.',
  example:'The labels S, M, S contain two distinct names, S then M.',
  code:'import pandas as pd\n\nsample = pd.Series(["S", "M", "S"])\nlist(sample.unique())',
  result:'["S", "M"], a list of the labels rather than the number 2.',
  parts:[
   ['sample.unique()','Return each distinct value once, ordered by its first appearance.'],
   ['list(...)','Convert the returned array to the list requested by the task.'],
   ['sample.nunique()','Use this different method when the question asks how many distinct values there are.']
  ],
  noteTitle:'Which result is needed?',
  note:'Choose unique when the report needs the labels. Choose nunique when it needs their count.'
 };
 byId.I16.rounds[1].teaching={
  title:'Turn missing flags into percentages',
  idea:'isna makes True for missing cells and False for known cells. The mean of those Boolean values is the fraction missing in each column; multiply by 100 for a percentage.',
  example:'Two of four prices are missing, so the missing fraction is 0.5 and the percentage is 50.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"price": [2, None, 4, None]})\nsample.isna().mean() * 100',
  output:{caption:'Missing percentage by column',headers:['column','percent missing'],rows:[['price','50.0']]},
  parts:[
   ['sample.isna()','Mark each missing cell True and each known cell False.'],
   ['.mean()','Average those flags down each column: True counts as 1 and False as 0.'],
   ['* 100','Convert the fraction, such as 0.5, to a percentage, such as 50.']
  ],
  noteTitle:'Count or percentage?',
  note:'The Follow example uses sum to count missing cells. This task uses mean times 100 to compare completeness across columns.'
 };
 byId.I16.rounds[2].teaching={
  title:'Keep rows with a known value',
  idea:'isna marks missing prices. The ~ operator reverses each True/False flag, so df[~mask] keeps rows with a present price.',
  example:'Of prices 2, missing and 4, only the rows with 2 and 4 remain.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"price": [2, None, 4]})\nsample[~sample["price"].isna()]',
  output:{caption:'Rows with a known price',headers:['price'],rows:[['2.0'],['4.0']]},
  parts:[
   ['sample["price"].isna()','Mark missing prices True.'],
   ['~','Reverse the mask: known prices become True.'],
   ['sample[...]','Keep only the rows whose reversed mask is True.']
  ],
  noteTitle:'What counts as known?',
  note:'This checks whether a cell is missing. It does not check whether present text is a valid number.'
 };
 byId.W09.rounds[1].teaching={
  title:'Map labels to new values',
  idea:'replace changes labels found in a lookup and keeps the rest. map returns a lookup result for every row, leaving unmatched labels missing.',
  example:'Large maps to 1. Small has no match, so its new code is missing while the original size stays visible.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"size": ["Large", "Small", "Large"]})\nsample["code"] = sample["size"].map({"Large": 1})\nsample',
  output:{caption:'Mapped code beside the original label',headers:['size','code'],rows:[['Large','1.0'],['Small','NaN'],['Large','1.0']]},
  parts:[
   ['sample["size"]','Read each original size label without changing that column.'],
   ['.map({"Large": 1})','Look up each label; values missing from the dictionary become missing.'],
   ['sample["code"] =','Store the looked-up result in a new column.']
  ],
  noteTitle:'Why map here?',
  note:'The task wants unmatched labels to become missing codes. Use replace instead when unmatched original labels should stay as they are. Pandas may display the known code as 1.0 because this column also contains a missing value.'
 };
 byId.W10.rounds[1].teaching={
  title:'Replace literal text inside a column',
  idea:'String operations can be chained. After trimming and lowercasing each value, str.replace swaps a literal hyphen for a space inside every non-missing string.',
  example:'The text "  Sky-Run  " becomes "sky run" after all three steps.',
  code:'import pandas as pd\n\nsample = pd.DataFrame({"game": ["  Sky-Run  ", "Tea"]})\nsample["game"] = (sample["game"].str.strip().str.lower()\n                  .str.replace("-", " ", regex=False))\nsample',
  output:{caption:'Cleaned game text',headers:['game'],rows:[['sky run'],['tea']]},
  parts:[
   ['.str.strip()','Remove spaces at the start and end of each value.'],
   ['.str.lower()','Make letters lowercase.'],
   ['.str.replace("-", " ", regex=False)','Replace each literal hyphen with a space; do not interpret the hyphen as a pattern.'],
   ['sample["game"] =','Store the complete cleaned result back in the column.']
  ],
  noteTitle:'Why use .str again?',
  note:'Each step returns a text Series. Use .str before another text method; the chained steps run from left to right.'
 };
 byId.W15.rounds[2].teaching={
  title:'Order counts by their labels',
  idea:'value_counts counts each month but usually orders by frequency. sort_index reorders the resulting Series by month label, so the calendar runs from earlier to later months.',
  example:'Month 3 appears twice and month 1 once. Sorting by index displays month 1 before month 3.',
  code:'import pandas as pd\n\nsample = pd.Series([3, 1, 3], name="month")\nsample.value_counts().sort_index()',
  output:{caption:'Counts in month order',headers:['month','count'],rows:[[1,1],[3,2]]},
  parts:[
   ['sample.value_counts()','Count how many rows have each month number.'],
   ['.sort_index()','Sort the month labels on the left, not the count values on the right.']
  ],
  noteTitle:'Which sort answers the question?',
  note:'sort_values would rank months by how often they occurred. The report asks for calendar order, so sort the month index.'
 };
 byId.W28.rounds[2].teaching={
  title:'Fit on training rows, then transform new rows',
  idea:'fit learns a scaler’s reference values from the training rows. transform applies those same values to other rows without learning from them again.',
  example:'Training scores 10 and 20 have mean 15 and population standard deviation 5. The new score 30 transforms to 3.',
  code:'import pandas as pd\nfrom sklearn.preprocessing import StandardScaler\n\nsample = pd.DataFrame({"score": [10, 20, 30]})\nscaler = StandardScaler()\nscaler.fit(sample.iloc[:2][["score"]])\nscaler.transform(sample.iloc[2:][["score"]])',
  output:{caption:'One new row transformed using the training scale',headers:['new score','scaled value'],rows:[[30,'3.0']]},
  parts:[
   ['sample.iloc[:2][["score"]]','Use only the first two rows to learn the training scale.'],
   ['scaler.fit(...)','Store their mean and spread inside scaler; this does not return the scaled rows.'],
   ['sample.iloc[2:][["score"]]','Select the held-out row, still as a two-dimensional table.'],
   ['scaler.transform(...)','Scale the held-out row using the already fitted reference values.']
  ],
  noteTitle:'Why not fit_transform on all rows?',
  note:'The held-out row must not change the learned mean or spread. Fit once on training rows, then transform the rest.'
 };
 byId.V18.rounds[2].teaching={
  title:'Connect ordered points with ax.plot',
  idea:'Seaborn lineplot can summarise repeated x values. Matplotlib ax.plot draws the supplied x and y points and connects them in the order given, without calculating a summary.',
  example:'Three daily visit counts become three connected markers in day order.',
  code:'import pandas as pd\nimport matplotlib.pyplot as plt\n\nsample = pd.DataFrame({"day": [1, 2, 3], "visits": [5, 7, 6]})\nfig, ax = plt.subplots()\nax.plot(sample["day"], sample["visits"], marker="o")\nax.set(xlabel="day", ylabel="visits")\nfig.tight_layout()\nplt.show()',
  result:'Markers at (1, 5), (2, 7) and (3, 6), joined in that supplied order.',
  parts:[
   ['sample["day"]','Supply the x positions in the order they should be connected.'],
   ['sample["visits"]','Supply the matching y measurement from each row.'],
   ['ax.plot(..., marker="o")','Draw the line and show each observation with a marker.']
  ],
  noteTitle:'When should you sort first?',
  note:'ax.plot does not reorder dates or average repeats. Select and order the rows first when the task needs a time sequence.'
 };
 byId.V32.rounds[1].teaching={
  title:'Add a line to the central joint panel',
  idea:'jointplot returns a grid with a central relationship chart and marginal distributions. g.ax_joint is the central Axes; add the reference line there to leave the margins untouched.',
  example:'A horizontal line at score 70 crosses the central scatter only.',
  code:'import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({"hours": [1, 2, 3], "score": [60, 70, 80]})\ng = sns.jointplot(data=sample, x="hours", y="score", kind="scatter")\ng.ax_joint.axhline(70, linestyle="--")\ng.figure.tight_layout()\nplt.show()',
  result:'A dashed horizontal reference at score 70 on the central scatter; the two marginal distributions remain unchanged.',
  parts:[
   ['g = sns.jointplot(...)','Create and keep the whole joint figure and its panels.'],
   ['g.ax_joint','Choose the central relationship Axes, not either margin.'],
   ['.axhline(70, linestyle="--")','Draw a dashed horizontal line at y=70 on that Axes.'],
   ['g.figure.tight_layout(); plt.show()','Finish and display the grid’s Figure.']
  ],
  noteTitle:'Why not use ax?',
  note:'jointplot creates its own Axes. Use g.ax_joint to target its central chart directly.'
 };
 byId.W28.rounds[1].hint='Import MinMaxScaler from sklearn.preprocessing, create scaler = MinMaxScaler(), then call scaler.fit_transform() on the two requested columns.';
 // Teach new operations at the practice that needs them, not as unexplained
 // alternate syntax beside the Follow code.
 for(const [id,codes] of Object.entries({
  I10:['series.isin([...])','series.between(low, high)'],
  I12:['ascending=[True, False]'],
  I16:['isna().mean() * 100'],
  W09:['map({"old": "new"})'],
  W10:['str.replace("-", " ", regex=False)'],
  V32:['g.ax_joint']
 }))byId[id].syntax=byId[id].syntax.filter(([code])=>!codes.includes(code));
 byId.I14.syntax=[['df["flavour"]','Choose the column whose category values you want to count.'],['.nunique()','Count its distinct known values.']];
 byId.W28.syntax=[['from sklearn.preprocessing import StandardScaler','Import the standardisation tool.'],['scaler = StandardScaler()','Create that tool and store it as scaler.'],['df[["price", "rating"]]','Pass a two-column table in the requested order.'],['scaler.fit_transform(...)','Learn each column’s mean and spread from this table, then return the scaled numbers.']];
 byId.V29.syntax=[['df.groupby("flavour")["price"].mean()','Compute one average price per flavour before drawing bars.'],['means.index','Use the flavour labels as bar positions.'],['means.values','Use the already computed averages as bar heights.'],['ax.bar(means.index, means.values)','Draw those exact heights; bar does not calculate an average for you.'],['.sum()','Compute group totals instead when the question asks for totals.']];
 byId.V16.syntax=[['sns.scatterplot(...)','Draw one point for each record.'],['data=df','Read the values from df.'],['x="hours"','Use hours for each point’s horizontal position.'],['y="score"','Use score from the same row for its vertical position.'],['ax=ax','Draw on the Axes created earlier in the code.']];
 byId.V23.syntax=[['matrix = pd.crosstab(...)','Count each club-and-group combination into a matrix.'],['sns.heatmap(matrix, ...)','Colour the counts in that matrix; it does not count the raw rows itself.'],['annot=True, fmt="d"','Print each integer count inside its cell.'],['cmap="Blues"','Use a light-to-dark blue colour scale.']];
 byId.V33.syntax=[['g = sns.relplot(...)','Create a whole grid of relationship charts and store it as g.'],['x="hours", y="score"','Plot those two measurements within each panel.'],['col="club"','Make one panel for each club, using only its rows.'],['kind="scatter"','Draw points rather than lines.'],['height=3','Make each panel 3 inches high.'],['g.figure.tight_layout()','Arrange the complete grid before display.']];
 byId.I01CSV.syntax.push(['sep=";"','Use semicolons rather than the default commas to separate fields.']);
 const laterSyntax={
  I01CSV:['sep=";"'],I03:['len(df)','[0]'],I04:['df.index'],I08:['df.iloc[0]'],I09:['df.iloc[1:4, [2]]'],
  I10:['=='],I11:['|','~'],I13:['df.nsmallest(2, "price")'],I15:['dropna=False'],I17:['keep="last"','keep=False','df[mask]'],I18S:['.median()','.sum() / .count()','.min() / .max()','.quantile(0.75)'],
  W01:['clean["price"] ='],W11:['~mask'],W13:['astype("string")','astype("Int64")'],W17:['mode().iloc[0]'],W18:['subset=["order"]'],W24:['how="inner"'],W30:['map(dictionary)','apply(lambda x: ...)'],
  V03:['style="club"','size="hours"'],V25:['hue_order=[...]','alpha=0.6'],V26:['ax.tick_params(axis="x", labelrotation=30)'],V29:['.sum()'],V36:['alpha=','order=[...]'],V19:['estimator=None']
 };
 for(const [id,parts] of Object.entries(laterSyntax)){
  const available=new Set(byId[id].syntax.map(([code])=>code));
  for(const code of parts)if(!available.has(code))throw new Error('Missing related syntax: '+id+' '+code);
  byId[id].syntaxLater=parts;
 }
 task('W19',1,'Summarise df by size. Display columns size, total (sum of price), and n (number of non-missing prices), in that order.');
 task('W19',2,'For df records with age at least 2, display average weight and row count by species. Use columns species, average, n, in that order.');
 // Labelled category summaries may be arranged differently without changing
 // their answer. Keep ordered records and explicitly ordered columns strict.
 for(const r of byId.I20.rounds){r.unorderedIndex=true;r.unorderedColumns=true;}
 for(const r of byId.W21.rounds){r.unorderedIndex=true;r.unorderedColumns=true;}
 for(const r of byId.W23.rounds){r.unorderedIndex=true;r.unorderedColumns=true;}
 for(const r of byId.W19.rounds)r.unorderedRowsBy=c.datasets[r.dataset].c;
 byId.I22.rounds[2].unorderedIndex=true;
 task('W04',2,'Prepare a separate clean copy of df without name and room for a measurement handoff. Preserve df and display clean.');
 task('W18',2,'Preserve df. Remove confirmed extra identical rows into a separate clean table, keeping each first occurrence. Sort by order ascending and reset to consecutive row labels without adding an index column. Display clean.');
 task('W27',2,'For df records with age at least 3, display a table containing age, then weight, then integer indicator columns for species.');
 task('W28',0,'Using df, standardise price then rating with StandardScaler. Display a numeric array with those two columns in that order. Use fit_transform().');
 task('W28',1,'Using df, scale price then tip to 0–1 with MinMaxScaler. Display a numeric array with those two columns in that order. Use fit_transform().');
 byId.V29.explanation=guides.V29.idea+' '+guides.V29.example+' '+guides.V29.note;
 byId.V29.syntaxCode='means = df.groupby("flavour")["price"].mean()\nax.bar(means.index, means.values)';
 // Category/value pairs carry the evidence in these charts; their display
 // order is flexible. Keep the explicitly ranked and table-order charts strict.
 for(const id of ['V08','V09','V29','V36'])for(const r of byId[id].rounds){
  if(id==='V08'&&r.label==='Change')continue;
  if(id==='V36'&&r.label==='Follow')continue;
  r.plot={...r.plot,unorderedBars:true};
 }
 for(const r of byId.V37.rounds)r.plot={...r.plot,unorderedBars:true,unorderedBarsFigure:2};
 // Stale suggestions must not describe an earlier version of the exercise.
 byId.I01.stretch='Try adding one extra value to just one column list. Why can pandas no longer pair values into complete rows?';
 byId.W11.explanation=guides.W11.idea+' '+guides.W11.note;
 const checkpoint=byId.W31.rounds;
 for(const r of checkpoint)r.task=r.task.replace('Remove extra identical rows.','Remove confirmed extra identical rows, keeping the first occurrence.').replace('Remove confirmed exact duplicate rows.','Remove confirmed extra identical rows, keeping the first occurrence.').replace('date to datetime, coercing invalid entries','date to datetime with year-month-day format, making invalid values missing').replace('Sort by order and reset the index.','Sort by order ascending and reset to consecutive row labels without adding an index column.').replace('sort by order and reset the index.','sort by order ascending and reset to consecutive row labels without adding an index column.').replace('sorted by order with a fresh consecutive index','sorted by order ascending with a fresh consecutive index and no added index column');
 for(const l of c.lessons)for(const r of l.rounds){
  if(r.retrieves)continue; // Refresh copied retrievals after their source contracts.
  r.task=r.task.replace(/Using df, use /g,'Using df, call ')
   .replace(/Practise: /g,'Use: ').replace(/care-about threshold/g,'review threshold').replace(/Using df, show df /g,'Using df, show ').replace(/Using df, compare df /g,'Using df, compare ')
   .replace(/ Leave the (?:DataFrame|Series|tuple) as the final expression\./g,'');
  // V01/V02 teach chart finishing, and the panel/export lessons need their
  // own display instructions. Later exercises can use the shared editor cue.
  if(l.deck==='visualise'&&r.target==='plot'&&!(['V01','V02','V24','V34','V37'].includes(l.id)||(['V31','V32','V33'].includes(l.id)&&r.label==='Follow'))){
   r.task=r.task.replace(/ Finish with fig\.tight_layout\(\) and (?:display with )?plt\.show\(\)\./g,'')
    .replace(/ Finish with tight_layout and show\./g,'')
    .replace(/ Finish g\.figure with tight_layout\(\) and display with plt\.show\(\)\./g,'')
    .replace(/; finish with g\.figure\.tight_layout\(\) and plt\.show\(\)\./g,'.')
    .replace(/ Finish the returned Figure and display it\./g,'')
    .replace(/ Display the chart with plt\.show\(\)\./g,'')
    .replace(/ Display the Figure\./g,'')
    .replace(/(?: |;) ?display the Figure\./g,'.');
   r.task=r.task.replace(/ Use title ("[^"]+"), x label ("[^"]+") and y label ("[^"]+")\./g,' Chart: title $1; x $2; y $3.')
    .replace(/ Give the chart title ("[^"]+") and axis labels ("[^"]+") and ("[^"]+")\./g,' Chart: title $1; x $2; y $3.')
    .replace(/ Title the chart ("[^"]+"); label x ("[^"]+") and y ("[^"]+")\./g,' Chart: title $1; x $2; y $3.')
    .replace(/ Use title ("[^"]+"), x label ("[^"]+"), y label ("[^"]+")\./g,' Chart: title $1; x $2; y $3.')
    .replace(/ Title ("[^"]+"), x label ("[^"]+"), y label ("[^"]+")\./g,' Chart: title $1; x $2; y $3.')
    .replace(/ Title ("[^"]+"); x label ("[^"]+"); y label ("[^"]+")\./g,' Chart: title $1; x $2; y $3.');
  }
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
 // Reviewed clarity examples: retain the existing outputs and grader requirements.
 const reviewedTasks = {
  I02:[
   ['Use the supplied df. Call head() to display its first two rows, keeping every column.','Leave the resulting DataFrame on the final line so it appears in Output. Success means the two beginning rows of the Candy shop table are shown.'],
   ['An import may have been cut short. Use tail() on df to inspect its last two rows.','Display that table on the final line. Success means you can read the ending records and all their columns.'],
   ['Take a spot check from anywhere in df: use sample() for three rows with random_state=1.','Display the sampled table on the final line. The same seed should give the same three records each time.']
  ],
  W25:[
   ['Use the supplied `first` and `second` tables. Call pd.concat() to append `second` below `first`, including every row.','Use `ignore_index=True` for consecutive row labels starting at zero. Display the finished DataFrame on the final line. Its name is your choice; Check answer reads the displayed value.'],
   ['The two supplied café batches use the same columns. Append `second` below `first`, keeping their original row labels.','Each batch starts at zero, so repeated row labels are expected and let an audit trace the batch positions. Display the finished table on the final line; its variable name is your choice.'],
   ['Append the supplied `first` and `second` tables, then keep records whose `age` is above 2.','Sort those records by `age`, largest first, and reset to consecutive row labels. Display the finished table on the final line; its variable name is your choice.']
  ],
  V03:[
   ['Use df to create a scatter plot with `hours` on x and `score` on y. Use scatterplot() and map `club` to colour only.','Keep point sizes and marker shapes constant. Set title "Study club", x label "hours" and y label "score".','Finish the Figure and display it with plt.show(). Success means the points and colour groups use those columns and the labels match.'],
   ['Use df to create a scatter plot of `temperature` on x against `humidity` on y. Map `sky` to colour only.','Keep identical marker shapes and sizes. Set title "Weather diary", x label "temperature" and y label "humidity".','Finish the Figure and display it with plt.show(). The colours should distinguish sky categories without changing the marker shape or size.'],
   ['First select df games with `minutes` at least 20. Plot `minutes` on x against `rating` on y and map `genre` to colour only.','Keep point sizes and shapes constant. Set title "Board games", x label "minutes" and y label "rating".','Finish the Figure and display it with plt.show(). The chart should show only the selected games, with those labels.']
  ]
 };
 for(const [id,rounds] of Object.entries(reviewedTasks))rounds.forEach((steps,i)=>{const r=byId[id].rounds[i];r.steps=steps;r.task=steps.join(' ');});
 const existingBriefs=new Map(c.lessons.flatMap(l=>l.rounds.map(r=>[r.id,{task:r.task,steps:r.steps}])));
 // Canvas, labels and data mapping are separate prerequisite skills. The
 // labels lesson supplies its plotting scaffold before scatter mapping is taught.
 byId.V01.rounds[0].task='Create one empty Figure with one Axes at 6 by 4 inches. Finish with fig.tight_layout() and display it with plt.show().';
 byId.V01.rounds[0].solution='import matplotlib.pyplot as plt\n\nfig, ax = plt.subplots(figsize=(6, 4))\nfig.tight_layout()\nplt.show()';
 byId.V01.rounds[0].starter=byId.V01.rounds[0].solution.replace('plt.subplots','plt.____');
 byId.V01.syntax=[['fig, ax =','Store the whole canvas and its plotting area separately.'],['plt.subplots(...)','Create the Figure and Axes.'],['figsize=(6, 4)','Make the canvas 6 inches wide and 4 inches high.'],['fig.tight_layout()','Adjust spacing within the Figure.'],['plt.show()','Display the Figure in Output.']];
 byId.V01.syntaxCode='fig, ax = plt.subplots(figsize=(6, 4))';
 byId.V01.guide.choices=[['fig, ax = plt.subplots(...)','Create and store the canvas and its plotting area.'],['figsize=(6, 4)','Set width and height in inches.'],['fig.tight_layout(); plt.show()','Adjust spacing and display the Figure.']];
 byId.V01.guide.note='This first exercise creates an empty canvas. The next lesson names a prepared chart; the scatter lesson then adds and maps observations.';
 byId.V02.rounds[0].solution=byId.V02.rounds[0].solution.replace('title="Study club", xlabel="hours", ylabel="score"','title="Study hours and scores", xlabel="Hours studied", ylabel="Score"');
 byId.V02.rounds[0].task='The starter has already drawn df hours against score. Finish that prepared chart: title "Study hours and scores", x label "Hours studied" and y label "Score". Keep its paired observations. Finish the Figure and display it with plt.show().';
 byId.V02.rounds[0].starter=byId.V02.rounds[0].solution.replace('ax.set(title="Study hours and scores", xlabel="Hours studied", ylabel="Score")','ax.set(____)');
 byId.V02.rounds[1].task='The starter draws df temperature against humidity. Finish its labels so they communicate the question and units: title "Does humidity vary with temperature?", x label "Temperature (°C)" and y label "Humidity (%)". Keep every observation, finish the Figure and display it with plt.show().';
 byId.V02.rounds[2].task='The starter selects df games lasting at least 20 minutes and plots minutes against rating. Finish its labels so the restricted population is clear: title "Games lasting at least 20 minutes", x label "Minutes" and y label "Rating". Keep those paired observations, finish the Figure and display it with plt.show().';
 for(const r of byId.V02.rounds.slice(1))r.starter=r.solution.replace(/ax\.set\([\s\S]*?\)\nfig\.tight_layout\(\)/,'# Add the requested title and axis labels here\n\nfig.tight_layout()');
 byId.V02.guide.note='The starter supplies the plotted observations. Labels name the question, units and selected population; changing a label does not rename a data column.';
 byId.V02.guide.choices=[['ax.set(title=..., xlabel=..., ylabel=...)','Set the title and both labels on the prepared plotting area.'],['ax.set_title(...); ax.set_xlabel(...); ax.set_ylabel(...)','Set the same text one label at a time.'],['fig.tight_layout(); plt.show()','Arrange the labels and display the finished Figure.']];
 byId.V02.syntaxCode='ax.set(title="Study hours and scores", xlabel="Hours studied", ylabel="Score")';
 // The introductory examples consistently use Seaborn for data-aware charts.
 for(const id of ['V16','V34'])byId[id].rounds[2].solution=byId[id].rounds[2].solution.replace('ax.scatter(selected["minutes"], selected["rating"])','sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)');
 byId.V18.rounds[2].solution=byId.V18.rounds[2].solution.replace('ax.plot(selected["day"], selected["visits"], marker="o")','sns.lineplot(data=selected, x="day", y="visits", estimator=None, marker="o", ax=ax)');
 byId.I12.rounds[1].hint='sort_values("tip", ascending=True) orders whole rows from the smallest tip to the largest.';
 byId.W24.rounds[1].hint='Use how="inner" to keep matching size keys only; validate="many_to_one" checks that each lookup key is unique.';
 for(const r of byId.V33.rounds)r.hint=r.label==='Follow'?'relplot creates its own Figure; col splits records by the named category and height sets each panel height.':r.label==='Change'?'catplot(kind="box") compares distributions within each station panel; x names the category and y the measurement.':'displot(kind="hist", bins=4) draws four-bin distributions separately for each genre; height=3 sets each panel height.';
 // Plot answers are checked by what they draw. Library names in a task identify
 // the demonstrated route; equivalent Matplotlib and other Python routes work.
 const descriptions={scatterplot:'draw a scatter plot',histplot:'draw a histogram',kdeplot:'draw a density curve',ecdfplot:'draw an ECDF',countplot:'draw category counts',barplot:'draw summary bars',pointplot:'draw point estimates',boxplot:'draw a box plot',violinplot:'draw a violin plot',stripplot:'draw raw points',swarmplot:'draw a swarm plot',regplot:'draw a regression plot',residplot:'draw a residual plot'};
 for(const l of c.lessons)for(const r of l.rounds){
  if(r.retrieves)continue;
  if(r.target==='plot'){
   r.requiredCalls=[];r.requiredKeywords=[];
   r.task=r.task.replace(/ Use: [^.]+\(\)(?:, [^.]+\(\))*\./g,'');
   for(const [method,description] of Object.entries(descriptions))r.task=r.task.replace(new RegExp('call sns\\.'+method,'g'),description).replace(new RegExp('call a ([^.]*)sns\\.'+method,'g'),'draw a $1'+method.replace(/plot$/,''));
   r.task=r.task.replace(/with sns\.scatterplot/g,'as a scatter plot').replace(/Use scatterplot\(\) and /g,'');
   r.task=r.task.replace(/call a 4-bin sns\.histplot/g,'draw a four-bin histogram').replace(/plot sns\.heatmap of/g,'draw a heatmap of').replace(/call heatmap/g,'draw a heatmap');
   const rules=r.plot={...r.plot};
   rules.textCaseInsensitive=true;
   if(!/figsize|\d+ by \d+ inches/.test(r.task))delete rules.size;
   if(/scatter|sns\.scatterplot|ax\.scatter/.test(r.solution)&&!rules.colors)rules.semantic='scatter';
   if(/stripplot|swarmplot/.test(r.solution))rules.semantic='scatter';
   if(/ax\.bar\(|countplot\(|barplot\(/.test(r.solution)){rules.categorical=true;rules.barGeometry=true;}
   if(/jitter=False/.test(r.solution))delete rules.jitter;
   if(/swarmplot/.test(r.solution))rules.swarm=true;
   if(/x="humidity", y="sky"/.test(r.solution))rules.categoryAxis='y';
   if(/marker="o"/.test(r.solution))rules.markers=true;
   if(/markers \("o"\)|"o" markers/.test(r.task))rules.markerShape='o';
   if(rules.colors){
    rules.semantic='encodedScatter';rules.legendOrder=/Order hue and style/.test(r.task);rules.fixedPalette=/palette="colorblind"/.test(r.task);
    rules.legendTitle=/legend title/.test(r.task);
    rules.legendFields=[...new Set([...r.solution.matchAll(/(?:hue|style|size)="([^"]+)"/g)].map(match=>match[1]))];
    if(!r.task.includes('legend'))r.task+=' Include a legend explaining every mapped variable.';
   }
   if(/linestyle="--"/.test(r.solution))rules.lineStyles=true;
   if(/ecdfplot\(/.test(r.solution))rules.lineDrawstyle=true;
   if(/annotate\(/.test(r.solution))rules.annotationDetails=true;
   if(/heatmap\(/.test(r.solution)){rules.annotations=true;rules.matrixLabels=true;rules.palette=true;}
   if(l.id==='V22')rules.numericAnnotations=true;
   if(/boxplot\(|kind="box"/.test(r.solution))rules.boxSummary=true;
   if(/regplot\(/.test(r.solution))rules.fitLine=true;
   if(l.id==='V24')rules.layout=true;
   if(l.id==='V33')rules.panelHeight=3;
   if(l.id==='V26'&&r.label==='Follow'){delete rules.limits;rules.zeroBaseline=true;}
  }
  if(l.id==='V35')r.textCaseInsensitive=true;
  if(['I05','I18'].includes(l.id)||(l.id==='I16'&&r.label!=='Transfer')||(l.id==='I22'&&r.label!=='Transfer'))r.unorderedIndex=true;
  if(l.id==='I21'&&r.label==='Follow'){r.unorderedIndex=true;r.unorderedColumns=true;}
  if(l.id==='W27')r.unorderedColumnsAfter=r.label==='Follow'?4:r.label==='Change'?3:2;
  if(['W12','W14','W26','W31'].includes(l.id))r.strictDtype=false;
  if(l.id==='W13'){r.strictDtype=false;r.dtypeRules={column:r.label==='Follow'?'flavour':r.label==='Change'?'drink':'age',dtype:r.label==='Follow'?'category':r.label==='Change'?'string':'Int64'};}
  if(l.id==='W30'&&r.label==='Transfer')r.compareWorkingDf=true;
  r.steps=existingBriefs.get(r.id)?.task===r.task?existingBriefs.get(r.id).steps:r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 }
 // Author the learner's layer after semantic rules have read the complete chart.
 // Setup is shown in the same editable Python cell; solutions belong only under
 // Your work. Prepared marks retain their data, labels and original plot rules.
 const finishFocusedPlot='fig.tight_layout()\nplt.show()';
 function chartLayers(r){
  const code=r.solution.replace(/^import (?:matplotlib\.pyplot as plt|seaborn as sns)\n/gm,'').trim();
  const canvasEnd=code.indexOf('\n');
  const labelsStart=code.indexOf('\nax.set(')+1;
  const labelsEnd=code.indexOf('\nfig.tight_layout()',labelsStart);
  if(canvasEnd<0||labelsStart<=0||labelsEnd<0)throw new Error('Missing prepared chart layers: '+r.id);
  return {canvas:code.slice(0,canvasEnd),chart:code.slice(0,labelsStart).trim(),marks:code.slice(canvasEnd+1,labelsStart).trim(),labels:code.slice(labelsStart,labelsEnd)};
 }
 function focusedRound(id,index,setup,work,steps,hint,setupDescription,starter='# Write your answer here\n'){
  const r=byId[id].rounds[index];
  Object.assign(r,{setup,solution:work,starter,steps,task:steps.join(' '),hint,setupDescription});
 }
 const labelBriefs=[
  ['The supplied setup creates fig and ax and draws every df hours/score pair.','Set title "Study hours and scores", x label "Hours studied" and y label "Score".','Keep the prepared observations; arrange the labels with fig.tight_layout() and display with plt.show().'],
  ['The supplied setup draws every df temperature/humidity pair on ax.','Set title "Does humidity vary with temperature?", x label "Temperature (°C)" and y label "Humidity (%)".','Keep the prepared observations; arrange the labels and display the finished Figure.'],
  ['The supplied setup selects games lasting at least 20 minutes and draws their minutes/rating pairs on ax.','Make that population clear: title "Games lasting at least 20 minutes", x label "Minutes" and y label "Rating".','Keep the selected observations; arrange the labels and display the finished Figure.']
 ];
 byId.V02.rounds.forEach((r,i)=>{
  const p=chartLayers(r);
  focusedRound('V02',i,p.chart,p.labels+'\n'+finishFocusedPlot,labelBriefs[i],[
   'Use ax.set to name the prepared chart and both measurements, then arrange and display fig.',
   'The setup already supplies the points. Put °C and % in the displayed axis labels, then arrange and display fig.',
   'The setup already supplies the filtered points. Name that population in the title and label its measurements.'
  ][i],[
   'A prepared hours/score scatter with fig and ax.',
   'A prepared temperature/humidity scatter with fig and ax.',
   'A prepared minutes/rating scatter for games lasting at least 20 minutes.'
  ][i],i===0?'ax.set(____)\n'+finishFocusedPlot:'# Set the requested title and axis labels, then arrange and display fig\n');
 });
 byId.V02.explanation='The supplied setup creates the Figure, Axes and plotted observations. Your work finishes that chart with a meaningful title and labels that name the measurements, units and selected population. Use ax methods for the labels, fig.tight_layout() for spacing and plt.show() for display.';
 byId.V02.guide.note='The supplied setup draws the observations. Labels name the question, units and selected population; changing a label does not rename a data column.';
 byId.V02.syntax=[['ax.set(title=..., xlabel=..., ylabel=...)','Name the prepared chart and both axes.'],['ax.set_title(...); ax.set_xlabel(...); ax.set_ylabel(...)','Set the same labels one at a time.'],['fig.tight_layout()','Arrange the labels on the supplied Figure.'],['plt.show()','Display the finished Figure.']];
 byId.V02.syntaxCode='ax.set(title="Study hours and scores", xlabel="Hours studied", ylabel="Score")';
 const scatterBriefs=[
  ['The supplied setup creates fig and an empty ax with title "Study club", x label "hours" and y label "score".','Add one point for every df record: hours horizontally and score vertically, keeping each row’s pair together.','Arrange and display the completed Figure.'],
  ['The supplied setup creates fig and an empty ax with title "Weather diary", x label "humidity" and y label "temperature".','Add one point for every df record: humidity horizontally and temperature vertically.','Keep each row’s pair together; arrange and display the completed Figure.'],
  ['The supplied setup creates fig and an empty ax with title "Board games", x label "minutes" and y label "rating".','Select df games lasting at least 20 minutes, then show minutes horizontally and rating vertically for those records only.','Keep both coordinates from the same selected row; arrange and display the completed Figure.']
 ];
 byId.V16.rounds.forEach((r,i)=>{
  const p=chartLayers(r);
  focusedRound('V16',i,p.canvas+'\n'+p.labels,p.marks+'\n'+finishFocusedPlot,scatterBriefs[i],[
   'Map hours to x and score to y from the same df; draw on the supplied ax.',
   'The supplied labels identify the new orientation: humidity is x and temperature is y.',
   'Create selected with minutes >= 20, then read both coordinates from selected when drawing on ax.'
  ][i],[
   'An empty Figure and Axes, labelled for hours against score.',
   'An empty Figure and Axes, labelled for humidity against temperature.',
   'An empty Figure and Axes, labelled for selected games’ minutes against rating.'
  ][i],i===0?'sns.scatterplot(data=df, x=____, y=____, ax=ax)\n'+finishFocusedPlot:'# Map the requested paired observations onto the supplied ax\n');
 });
 byId.V16.explanation='The supplied setup creates and labels an empty Figure and Axes. Your work maps the two numeric measurements to point positions; each point must pair x and y from one row. Filter first when the requested population is restricted. Scatter plots show association, clusters and unusual observations; they do not establish causation, and a tiny cloud does not establish a dependable relationship.';
 byId.V16.guide.choices=[['data=df, x="hours", y="score"','Read both coordinates from the same supplied table.'],['ax=ax','Draw the points on the supplied, already labelled Axes.'],['Filter, then plot','Use the selected table for both coordinates so the population stays consistent.'],['fig.tight_layout(); plt.show()','Arrange and display the completed Figure.']];
 byId.V16.guide.note='The setup supplies the canvas and finished labels; your work supplies the paired observations. A scatter plot can suggest association, clusters or unusual points, but cannot establish causation.';
 byId.V16.syntax[4]=['ax=ax','Draw on the supplied, already labelled Axes.'];
 const scaleBriefs=[
  ['The supplied setup draws every load-test request/response pair and labels the chart "Service load test", "Requests" and "Response time (ms)".','Use a logarithmic x-axis, a linear y-axis beginning at zero and x tick labels rotated by 30 degrees.','Retain every observation; arrange and display fig.'],
  ['The supplied setup draws every weather temperature/humidity pair and labels the chart "Weather diary", "Temperature (°C)" and "Humidity (%)".','Give this dashboard panel linear limits of 20 to 35 °C on x and 0 to 100% on y.','Keep all observations visible; arrange and display fig.'],
  ['The supplied setup draws every game’s minutes/rating pair and labels the chart "Board games", "minutes" and "Rating (0–5)".','Keep linear axes and set the rating axis from 0 to 5, its stated scale.','Retain the full dataset and keep every observation visible; arrange and display fig.']
 ];
 byId.V26.rounds.forEach((r,i)=>{
  const p=chartLayers(r),start=p.marks.search(/^ax\.set_(?:xscale|yscale|xlim|ylim)\(/m);
  if(start<0)throw new Error('Missing axis work: '+r.id);
  const work=p.marks.slice(start)+'\n'+finishFocusedPlot;
  focusedRound('V26',i,p.canvas+'\n'+p.marks.slice(0,start).trim()+'\n'+p.labels,work,scaleBriefs[i],[
   'Set xscale to "log"; set only the lower y bound to 0 and rotate x tick labels by 30 degrees.',
   'Use ax.set_xlim(20, 35) and ax.set_ylim(0, 100) on the prepared chart.',
   'Use ax.set_ylim(0, 5); retain the supplied points and their linear scales.'
  ][i],[
   'A labelled load-test scatter with automatic linear axes.',
   'A labelled weather scatter with automatic linear axes.',
   'A labelled game scatter containing every record, with automatic linear axes.'
  ][i],i===0?work.replace('ax.set_xscale("log")','ax.set_xscale(____)'):'# Set the requested axis scale or limits, then arrange and display fig\n');
 });
 byId.V26.explanation='The supplied chart already contains and labels the paired observations. Your work changes the axis scale, visible limits or tick rotation. A log scale represents multiplicative ratios and requires positive values; limits can hide evidence. Retain the requested population and keep all observations visible.';
 byId.V26.guide.note='The supplied charts start with automatic linear axes. Change their scale or range for the stated purpose while retaining the observations, labels and units. Common panel limits support fair comparison.';
 byId.V26.syntax=[['ax.set_xscale("log")','Use multiplicative spacing for the positive request counts.'],['ax.set_ylim(bottom=0)','Start y at zero while keeping its upper bound automatic.'],['ax.tick_params(axis="x", labelrotation=30)','Rotate x tick labels by 30 degrees.'],['ax.set_xlim(20, 35) / ax.set_ylim(0, 100)','Use explicit, common panel ranges.'],['fig.tight_layout(); plt.show()','Arrange and display the adjusted Figure.']];
 byId.V26.syntaxLater=['ax.set_xlim(20, 35) / ax.set_ylim(0, 100)'];
 byId.V26.syntaxCode='ax.set_xscale("log")\nax.set_ylim(bottom=0)\nax.tick_params(axis="x", labelrotation=30)';
 const referenceBriefs=[
  ['The supplied setup draws every hours/score pair and supplies title "Study club", x label "hours" and y label "score".','Add dashed reference lines at median hours vertically and median score horizontally.','Keep the supplied observations and labels; arrange and display fig.'],
  ['The supplied setup draws every temperature/humidity pair and supplies title "Weather diary", x label "temperature" and y label "humidity".','Add just one dashed horizontal line at the mean humidity.','Keep the supplied observations and labels; arrange and display fig.'],
  ['The supplied setup draws every minutes/rating pair and supplies title "Board games", x label "minutes" and y label "rating".','Add one dashed horizontal line at the review threshold rating=4.','This chosen benchmark is not an estimated mean or an automatic decision rule. Keep every observation and the supplied labels; arrange and display fig.']
 ];
 byId.V27.rounds.forEach((r,i)=>{
  const p=chartLayers(r),start=p.marks.search(/^ax\.ax(?:h|v)line\(/m);
  if(start<0)throw new Error('Missing reference-line work: '+r.id);
  const work=p.marks.slice(start)+'\n'+finishFocusedPlot;
  focusedRound('V27',i,p.canvas+'\n'+p.marks.slice(0,start).trim()+'\n'+p.labels,work,referenceBriefs[i],[
   'Compute each median from its own measurement; x values need axvline and y values need axhline.',
   'Mean humidity is a y-axis benchmark: add only ax.axhline(df["humidity"].mean(), linestyle="--").',
   'The chosen threshold is the y value 4, so add ax.axhline(4, linestyle="--") without estimating it from df.'
  ][i],'A labelled scatter with every record and no reference lines.',i===0?work.replace('df["hours"].median()','df["hours"].____()'):'# Add the requested benchmark to the prepared ax, then arrange and display fig\n');
 });
 byId.V27.explanation='The supplied setup draws and labels the scatter plot. Your work adds the specified benchmark. axhline draws in y data units; axvline draws in x data units. An observed mean, an observed median and a chosen threshold have different meanings; a reference line is not automatically a decision boundary.';
 byId.V27.guide.note='The supplied chart has no benchmarks. Add only those requested: means and medians come from the relevant measurement; a documented threshold is supplied directly and is not an automatic decision rule.';
 byId.V27.syntax=[['ax.axvline(df["hours"].median(), linestyle="--")','Add the median hours as a vertical benchmark.'],['ax.axhline(df["score"].median(), linestyle="--")','Add the median score as a horizontal benchmark.'],['linestyle="--"','Draw a dashed line.'],['mean() / median() / supplied value','Use the benchmark with the meaning stated in the task.'],['fig.tight_layout(); plt.show()','Arrange and display the chart with its benchmarks.']];
 const annotationBriefs=[
  ['The supplied setup draws every hours/score pair and supplies title "Study club", x label "hours" and y label "score".','Find the row with the highest score and label its paired coordinates "Peak", offset by (8, 8) points with an arrow.','Keep the prepared chart; arrange and display fig.'],
  ['The supplied setup draws every temperature/humidity pair and supplies title "Weather diary", x label "temperature" and y label "humidity".','Find the row with the lowest humidity and label its paired coordinates "Driest", offset by (8, 8) points with an arrow.','Keep the prepared chart; arrange and display fig.'],
  ['The supplied setup creates selected from games lasting at least 20 minutes, draws their minutes/rating pairs and supplies title "Board games", x label "minutes" and y label "rating".','Find the highest-rated game within selected and label its paired coordinates "Peak", offset by (8, 8) points with an arrow.','Keep those selected observations; arrange and display fig.']
 ];
 byId.V28.rounds.forEach((r,i)=>{
  const p=chartLayers(r),start=p.marks.search(/^(?:peak|point) = /m);
  if(start<0)throw new Error('Missing annotation work: '+r.id);
  const work=p.marks.slice(start)+'\n'+finishFocusedPlot;
  focusedRound('V28',i,p.canvas+'\n'+p.marks.slice(0,start).trim()+'\n'+p.labels,work,annotationBriefs[i],[
   'Use idxmax to find the highest-score row; both annotation coordinates must come from that row.',
   'Use idxmin on humidity, retrieve that row with loc and annotate its temperature/humidity pair.',
   'Use selected.loc[selected["rating"].idxmax()] so the peak is found inside the supplied report population.'
  ][i],i===2?'A labelled scatter of games lasting at least 20 minutes, plus selected; no annotation.':'A labelled scatter with every record and no annotation.',i===0?work.replace('xy=(peak["hours"], peak["score"])','xy=(____, ____)'):'# Find the requested row and annotate its paired coordinates on ax\n');
 });
 byId.V28.explanation='The supplied setup draws and labels the observations. Your work selects the relevant row and annotates its paired coordinates. xy is the observation in data units; xytext=(8, 8) with textcoords="offset points" positions the label right and above it. An arrow connects the label to the point. Find an extreme within selected when the chart shows a restricted population.';
 byId.V28.guide.note='The setup supplies the plotted population; your work finds the extreme within that same table. Use selected for the filtered-game practice so the annotation cannot identify an excluded row.';
 byId.V28.syntax=[['peak = df.loc[df["score"].idxmax()]','Retrieve the whole row with the highest score.'],['ax.annotate("Peak", xy=(x, y), ...)','Label the chosen row’s paired coordinates on the prepared Axes.'],['xytext=(8, 8), textcoords="offset points"','Place the text 8 points right and 8 points above the observation.'],['arrowprops={"arrowstyle": "->"}','Point an arrow at that observation.'],['idxmin()','Find the row label of a minimum in the later practice.'],['fig.tight_layout(); plt.show()','Arrange and display the annotated chart.']];
 byId.V28.syntaxLater=['idxmin()'];
 byId.V28.syntaxCode=byId.V28.rounds[0].solution.replace('\n'+finishFocusedPlot,'');
 // Different export handoffs keep the same strict PNG contract: export a
 // finished chart, repair its spacing, then complete a report chart's labels.
 const exportWork='fig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()';
 byId.V34.rounds.forEach((r,i)=>{
  const p=chartLayers(r);
  if(i===0)focusedRound('V34',i,p.chart+'\n'+p.labels+'\nfig.tight_layout()',exportWork,[
   'The supplied setup prepares a fully labelled and arranged hours/score scatter: title "Study club", x "hours", y "score".',
   'Export that same Figure as chart.png at 150 dpi with bbox_inches="tight", then display it with plt.show().'
  ],'The supplied fig is finished: save it with the requested filename, dpi and tight bounding box before display.','A fully labelled and arranged hours/score scatter, ready to export.',exportWork.replace('fig.savefig','fig.____'));
  if(i===1)focusedRound('V34',i,p.chart+'\n'+p.labels+'\nfig.subplots_adjust(left=0.02, bottom=0.02)', 'fig.tight_layout()\n'+exportWork,[
   'The supplied setup prepares a four-bin temperature histogram with title "Weather diary", x "temperature" and y "Count", but leaves cramped margins.',
   'Keep the title, axis labels and tick labels inside the Figure canvas without clipping; adjust its margins as needed. Export chart.png at 150 dpi with bbox_inches="tight" before displaying it with plt.show().'
  ],'fig.tight_layout() is one way to fit the title and all labels inside the canvas; manual margin adjustments also work. Save the same Figure before display.','A labelled four-bin temperature histogram with cramped margins.','# Arrange the supplied Figure, export it and then display it\n');
  if(i===2)focusedRound('V34',i,p.chart+'\nax.set(title="Board games", xlabel="", ylabel="")','ax.set(xlabel="minutes", ylabel="rating")\nfig.tight_layout()\n'+exportWork,[
   'The supplied setup selects games lasting at least 20 minutes and draws their paired scatter with title "Board games"; both axis labels are blank.',
   'Complete the report handoff: set x label "minutes" and y label "rating", then arrange the Figure.',
   'Export that same Figure as chart.png at 150 dpi with bbox_inches="tight" before displaying it with plt.show(). Keep every selected pair.'
  ],'Finish the missing axis labels and layout before saving the same fig at 150 dpi with a tight bounding box.','A selected-game scatter with its title supplied and both axis labels blank.','# Finish the missing report labels, arrange fig, export it and display it\n');
 });
 byId.V34.rounds[1].plot.figureTextFits=true;
 byId.V34.explanation='Export the specific Figure supplied in the editor. A finished handoff needs only saving and display; an unfinished handoff needs its stated label or spacing repairs first. fig.savefig writes chart.png at the requested 150 dpi, and bbox_inches="tight" includes surrounding labels. Save before plt.show(); the PNG appears as a download beneath Output.';
 byId.V34.guide.idea='Export a specific Figure after completing the handoff’s labels and layout. Save that Figure before displaying it.';
 byId.V34.guide.note='Every practice keeps the same PNG contract: chart.png, 150 dpi, a tight bounding box and export before display. Change repairs cramped margins; Transfer finishes missing report labels before export.';
 byId.V34.syntax=[['fig.savefig("chart.png", dpi=150, bbox_inches="tight")','Export the supplied, finished Figure with the requested file and resolution.'],['dpi=150','Save at 150 pixels per inch.'],['bbox_inches="tight"','Include surrounding labels in the saved image.'],['plt.show()','Display the same Figure after exporting it.'],['fig.tight_layout()','Repair spacing before exporting an unfinished handoff.'],['ax.set(xlabel=..., ylabel=...)','Complete missing report axis labels before export.']];
 byId.V34.syntaxLater=['fig.tight_layout()','ax.set(xlabel=..., ylabel=...)'];
 // Repair drafts without recalculating or selecting away their evidence.
 byId.V36.rounds.forEach((r,i)=>{
  const p=chartLayers(r),marks=p.marks.replace(/^ax\.set_ylim\(bottom=0\)\n?/m,'').trim();
  const draft=[
   'ax.set_ylim(bottom=float(means.min()) * 0.8)',
   'ax.set_yscale("log")',
   'ax.set_ylim(1, 25)'
  ][i];
  const work=[
   'ax.set_ylim(bottom=0)',
   'ax.set_yscale("linear")\nax.set_ylim(bottom=0)',
   'ax.set_ylim(0, 25)'
  ][i]+'\n'+finishFocusedPlot;
  focusedRound('V36',i,p.canvas+'\n'+marks+'\n'+p.labels+'\n'+draft,work,[
   ['The supplied draft calculates mean price by flavour from every candy record, ranks the means highest first and draws exact bars labelled "Candy shop", "flavour" and "Mean price".','Its y-axis is truncated above zero. Repair the lower bound to zero so bar lengths represent the comparison fairly.','Keep every mean and the ranked order; arrange and display fig.'],
   ['The supplied draft calculates mean price by size from every café record and draws exact bars labelled "Café orders", "size" and "Mean price".','Its y-axis is logarithmic. Restore a linear y-axis beginning at zero so bar lengths compare those actual means fairly.','Keep every group and its original mean; arrange and display fig.'],
   ['The supplied shelter draft calculates mean weight by species from every pet record and draws exact bars labelled "Pet adoption", "species" and "Mean weight".','Its y-axis starts at 1. Use the report’s common linear range from 0 to 25; every group mean fits inside that range.','Keep every group and its actual mean weight; arrange and display fig.']
  ][i],[
   'The means and ranking are supplied. Set only the lower y bound to zero, keeping the upper bound automatic.',
   'Use ax.set_yscale("linear") before ax.set_ylim(bottom=0); keep the supplied mean-price bars.',
   'Use ax.set_ylim(0, 25) to match the report range. Dog mean weight is 20.25, so this upper bound keeps it visible.'
  ][i],[
   'A misleading draft of ranked mean-price bars with a truncated y baseline.',
   'A misleading draft of mean-price bars on a logarithmic y-axis.',
   'A misleading draft of mean-weight bars with y limits from 1 to 25.'
  ][i],i===0?work.replace('bottom=0','bottom=____'):'# Repair the draft’s y-axis, then arrange and display fig\n');
  if(i===2)r.plot={...r.plot,limits:true};
 });
 byId.V36.goal='Repair a misleading bar axis while preserving the evidence.';
 byId.V36.explanation='The supplied drafts already compute the requested group means from the full populations and draw exact bars. Your work repairs their axes while preserving those means and groups. A truncated baseline exaggerates differences in bar length; a logarithmic bar axis changes that length comparison. Use linear axes beginning at zero, and an explicit common range when the report requires one.';
 byId.V36.guide.idea='Bar length represents magnitude. Repair misleading baselines or scales without changing the values or dropping groups.';
 byId.V36.guide.choices=[['ax.set_ylim(bottom=0)','Restore a zero baseline while leaving the upper limit automatic.'],['ax.set_yscale("linear")','Restore equal spacing for equal changes before comparing bar lengths.'],['ax.set_ylim(0, 25)','Use a stated common range that starts at zero and contains every group mean.']];
 byId.V36.guide.note='The setup calculates the means from every supplied record; Follow also ranks them highest first. Preserve those values, groups and requested order while repairing the draft’s axis. Hiding a group or changing a height does not fix a misleading comparison.';
 byId.V36.syntax=[['ax.set_ylim(bottom=0)','Restore the baseline of the supplied mean-price bars.'],['fig.tight_layout(); plt.show()','Arrange and display the repaired Figure.'],['ax.set_yscale("linear")','Repair a draft that uses a logarithmic bar axis.'],['ax.set_ylim(0, 25)','Use the common zero-based report range.']];
 byId.V36.syntaxLater=['ax.set_yscale("linear")','ax.set_ylim(0, 25)'];
 byId.V36.syntaxCode='ax.set_ylim(bottom=0)';
 // This intentionally unsuitable draft is an illustration to repair, not a
 // recommended density estimate. Replacing it is a different responsibility
 // from V13's first construction of a raw-point chart.
 byId.V15.rounds.forEach((r,i)=>{
  const p=chartLayers(r);
  const draft=p.marks.replace('sns.stripplot','sns.violinplot').replace('jitter=False','inner=None, cut=0');
  const work='ax.clear()\n'+p.marks+'\n'+p.labels+'\n'+finishFocusedPlot;
  focusedRound('V15',i,'# Illustration to repair: these tiny groups do not support detailed density shapes\n'+p.canvas+'\n'+draft+'\n'+p.labels,work,[
   ['The supplied setup contains a violin draft for price by flavour, an illustration to repair rather than a recommended density estimate. Each group has only one to three observations.','Clear the draft Axes and replace its density shapes with every observed price as raw points at flavour positions, using jitter=False.','ax.clear() also removes labels: restore title "Candy shop", x "flavour" and y "price", then arrange and display fig.'],
   ['The supplied setup contains a horizontal violin draft for humidity by sky, an illustration to repair rather than a recommended density estimate. Each group has only two to four observations.','Clear the draft Axes and replace its density shapes with every observed humidity as horizontal raw points, using jitter=False; map humidity to x and sky to y.','Restore title "Weather diary", x "humidity" and y "sky" after clearing, then arrange and display fig.'],
   ['The supplied setup contains a violin draft for shelter weights, an illustration to repair rather than a recommended density estimate. There are only two pets per species.','Clear the draft Axes and replace its density shapes with every observed weight as raw points at species positions, using jitter=False.','Restore title "Pet adoption", x "species" and y "weight" after clearing. Keep every pet; arrange and display fig.']
  ][i],[
   'ax.clear() removes the unsuitable density marks and their labels. Draw the supplied records as raw points, then restore the labels.',
   'Clear first so no density remains. Draw humidity on x and sky on y, then restore the horizontal labels.',
   'Clear the density draft, draw all weights by species without estimating a shape, and restore the labels.'
  ][i],'An intentionally unsuitable violin draft for tiny groups, supplied only as an illustration to repair.',i===0?work.replace('ax.clear()','ax.____()'):'# Replace the unsuitable draft with the observations and restore its labels\n');
 });
 byId.V15.goal='Replace an over-detailed draft with the observed values.';
 byId.V15.explanation='The supplied violin draft is an intentionally unsuitable illustration to repair. With only a few observations in each group, a detailed density shape can imply more evidence than the sample contains. Clear the draft Axes and show every observed value as a raw point instead. ax.clear() removes the marks, title and labels, so restore the stated labels as part of the repair.';
 byId.V15.guide.idea='A draft can imply more detail than a tiny sample supports. Replace its density shape with the actual observations, preserving every record.';
 byId.V15.guide.choices=[['ax.clear()','Remove the draft marks, title and axis labels before drawing the replacement.'],['stripplot(..., jitter=False)','Show every measured value at its category position.'],['ax.set(title=..., xlabel=..., ylabel=...)','Restore the labels removed by clear.'],['x="value", y="group"','Use horizontal raw points when the measurement belongs on x.']];
 byId.V15.guide.note='The supplied violin is an illustration to repair, not a recommended density estimate or evidence for detailed tails. Clearing removes its labels too. Restore them; overlapping raw points can still hide repeated values.';
 byId.V15.syntax=[['ax.clear()','Remove the unsuitable draft and its labels from the supplied Axes.'],['sns.stripplot(..., jitter=False)','Replace the density shapes with every observed value.'],['ax.set(title=..., xlabel=..., ylabel=...)','Restore the title and axis labels after clearing.'],['fig.tight_layout(); plt.show()','Arrange and display the repaired Figure.']];
 byId.V15.syntaxCode='ax.clear()\nsns.stripplot(data=df, x="flavour", y="price", jitter=False, ax=ax)';
 // These Transfer rounds apply an already introduced technique to new data.
 // Their outputs remain distinct; the demand does not claim another new skill.
 byId.V10.rounds[2].demand='Apply the same technique independently';
 byId.V19.rounds[2].demand='Apply the same technique independently';
 for(const l of c.lessons.filter(l=>!l.review))l.example=l.rounds[0].solution;
 byId.V18.rounds[2].teaching.title='Another route: connect observations with ax.plot';
 byId.V18.rounds[2].teaching.idea='The model uses Seaborn with estimator=None. Matplotlib ax.plot is an equivalent way to connect the supplied observations in order, without calculating a summary.';
 // Retrieval retains its identity and starter, but uses the corrected source brief/checker.
 for(const l of c.lessons)for(let i=0;i<l.rounds.length;i++){
  const r=l.rounds[i];if(!r.retrieves)continue;
  const source=byId[r.retrieves].rounds[2];
  const retrieval=JSON.parse(JSON.stringify(source));
  delete retrieval.teaching;
  l.rounds[i]={...retrieval,id:r.id,label:r.label,retrieves:r.retrieves,starter:r.starter,demand:r.demand};
 }
 // The 2026-10 audit authors practice contracts after every legacy override.
 // Reviews retain retrieval links while asking fresh questions on deliberate evidence.
 function fixture(key,name,columns,a,b,categ,feature){
  c.datasets[key]={name,columns,a,b,c:categ||a,d:categ||a,id:Object.keys(columns)[0],feature};
 }
 fixture('parcel_weights','Parcel dispatch',{parcel:['P1','P2','P3','P4','P5','P6','P7','P8'],weight_kg:[1,1,2,2,3,4,8,9],service:['Local','Local','Local','Express','Local','Express','Express','Express']},'weight_kg','weight_kg','service','Ties and a sparse heavy tail; dropping heavy parcels changes the distribution.');
 fixture('issue_channels','Support requests',{channel:['email','chat','email','phone','chat','email','web'],status:['open','open','closed','open','closed','open','closed'],minutes:[4,8,3,14,6,5,11]},'minutes','minutes','channel','Unequal channel counts; categorical eligibility changes the ranking.');
 fixture('repair_costs','Repair invoices',{kind:['Basic','Basic','Basic','Basic','Extended','Extended','Extended','Specialist','Specialist'],cost:[10,11,12,80,22,24,26,35,36]},'cost','cost','kind','Unequal group sizes and a Basic outlier separate count, mean and median.');
 fixture('material_samples','Material trial',{sample:['A','B','C','D','E','F'],batch:['trial','standard','trial','standard','trial','standard'],volume_ml:[9,3,6,12,3,8],mass_g:[18,4,13,17,5,12]},'volume_ml','mass_g','batch','Scrambled pairs distinguish independently sorted coordinates and wrong batch.');
 fixture('clinic_pairs','Clinic visits',{visit:['A','B','C','D','E','F'],wait_minutes:[12,null,6,18,9,15],consult_minutes:[8,20,14,null,11,7],note:['routine','routine',null,'routine','routine','routine'],service:['Remote','Clinic','Clinic','Remote','Clinic','Remote']},'wait_minutes','consult_minutes','visit','Missing plotting values require pairwise eligibility; a missing unrelated note must survive.');
 fixture('meter_readings','Meter readings',{hour:[14,8,12,10,16],reading:[31,25,30,27,29]},'hour','reading','hour','Input order is deliberately nonchronological.');
 fixture('bike_routes','Bicycle routes',{route:['A','B','C','D','E','F'],distance_km:[3,5,8,3,5,8],minutes:[12,22,38,16,29,48],surface:['paved','paved','paved','gravel','gravel','gravel']},'distance_km','minutes','surface','Matched distances with systematically different times; derived speeds differ from raw duration.');
 fixture('bench_readings','Test bench readings',{bench:['A','A','A','B','B','B','C','C'],reading:[4,4,7,2,5,5,6,8],sequence:[1,2,3,1,2,3,1,2]},'sequence','reading','bench','Repeated readings are distinct observations, not one mean.');
 fixture('packing_runs','Packaging runs',{run_id:[101,102,103,104,105,106],speed:[10,20,15,30,25,18],output:[19,39,31,58,49,35],defects:[4,7,3,10,6,5]},'speed','output','run_id','Numeric identifiers must be excluded from scientific correlation.');
 fixture('sound_sensors','Sound sensor checks',{status:['valid','invalid','valid','valid','invalid','valid'],distance_m:[1,2,3,4,5,6],level:[80,130,69,64,10,58]},'distance_m','level','status','Invalid records create extremes and must be omitted from both views.');
 fixture('capacity_test','Service capacity test',{load:[10,30,45,60,80,100],latency_ms:[25,29,34,50,90,140]},'load','latency_ms','load','Chosen x benchmark 60 differs from median load 52.5.');
 fixture('particle_diameters','Particle measurements',{diameter:[2,2.2,2.5,3,6,6.2,6.4,7]},'diameter','diameter','diameter','Separated clusters allow a controlled smoothing comparison without changing rows.');
 fixture('delivery_delays','Delivery delays',{delay_minutes:[0,2,5,5,9,12],route:['Urban','Urban','Rural','Urban','Rural','Rural']},'delay_minutes','delay_minutes','route','Ties at five distinguish strictly above from at or above; zero is observed.');
 fixture('part_strength','Manufactured part strength',{batch:['A','A','A','B','B','B','C','C','C'],strength:[8,10,12,4,10,16,9,10,11]},'strength','strength','batch','Equal centres but unequal spreads distinguish centre from interval meaning.');
 fixture('ceramic_checks','Ceramic checks',{batch:['A','A','B','B','C','C'],mass_g:[3,7,4,6,2,8],volume_ml:[1,3,2,5,1,4]},'volume_ml','mass_g','batch','Two values per group; an unrelated paired view must remain intact during repair.');
 fixture('machine_replicates','Machine replicates',{hour:[1,1,2,2,3,3,4,4],replicate:['A','B','A','B','A','B','A','B'],output:[8,12,11,19,15,17,14,24]},'hour','output','replicate','Individual trajectories differ from mean and spread at repeated hours.');
 fixture('calibration_checks','Calibration checks',{input:[1,2,3,4,5,6],measured:[3,5,7,30,11,13],usable:[true,true,true,false,true,true]},'input','measured','usable','A documented failed calibration changes the full-table fit materially.');
 fixture('curved_response','Response experiment',{dose:[1,2,3,4,5,6,7],response:[9,4,1,0,1,4,9]},'dose','response','dose','Symmetric curved response creates structured nonzero straight-line residuals.');
 fixture('loading_waits','Loading-zone waits',{zone:['A','A','A','B','B','C'],side:['Front','Front','Rear','Rear','Rear','Front'],wait_minutes:[0,2,4,8,10,0]},'wait_minutes','wait_minutes','zone','Measured zero, repeated cells and absent combinations have different meanings.');
 fixture('installations','Installation outputs',{name:['A','B','C','D','E'],active:[true,false,true,true,false],hours:[2,3,5,7,9],output:[10,99,24,18,60]},'hours','output','active','Global maximum is inactive; active maximum is a different paired record.');
 fixture('recycling_sites','Material collection',{site:['North','East','West','South'],paper:[8,15,4,11],glass:[7,3,9,5]},'paper','glass','site','Unequal bases make stacked glass and zero-baseline glass comparisons different.');
 fixture('plant_trays','Plant-tray observations',{tray_id:[201,202,203,204,205,206,207,208],light:[4,6,9,11,5,7,8,12],height:[7,10,13,16,8,12,11,18],leaf_area:[11,15,21,26,12,19,18,30],location:['Window','Window','Window','Window','Interior','Interior','Interior','Interior']},'light','height','location','Three varying measurements, two groups and a numeric identifier.');
 fixture('reservoir_flow','Reservoir monitoring',{region:['North','North','North','North','South','South','South','South'],inflow:[2,4,6,8,3,4,6,9],outflow:[1,3,5,7,2,4,4,8]},'inflow','outflow','region','Overlapping measurement ranges need comparable relationship facets.');
 fixture('support_totals','Support team shifts',{team:['A','A','B','B','C','C'],received:[2,18,10,10,4,16],resolved:[2,9,7,6,1,12]},'received','resolved','team','Unequal workloads make mean shift percentages differ from pooled resolution rates.');
 fixture('library_weeks','Library visits',{week:[1,2,3,4,5],visits:[24,31,28,40,36]},'week','visits','week','One observation per ordered week asks about change through time.');
 fixture('rainfall_log','Rainfall log',{day:[1,2,3,4,5,6],rain_mm:[0,3,0,7,2,0]},'day','rain_mm','day','Dry days are known zero measurements; a rug retains repeated zeros.');
 fixture('sales_receipts','Shop receipts',{item:['A','B','C','D','E','F'],department:['Books','Books','Tools','Tools','Books','Tools'],units:[2,0,3,1,4,2],unit_price:[10,99,8,20,6,15]},'units','unit_price','department','Zero-unit rows are outside sold-item population; revenue is price times quantity.');
 const finishAudit='fig.tight_layout()\nplt.show()';
 const plotImports=body=>'import matplotlib.pyplot as plt\n'+(/\bsns\./.test(body)?'import seaborn as sns\n':'')+'\n';
 function contract(id,index,dataset,brief,body,x,y,options={}){
  const l=byId[id],r=l.rounds[index];
  const title=options.title||c.datasets[dataset].name;
  const labels=`ax.set(title=${JSON.stringify(title)}, xlabel=${JSON.stringify(x)}, ylabel=${JSON.stringify(y)})`;
  const work=options.raw?body:body+'\n'+labels+'\n'+finishAudit;
  Object.assign(r,{dataset,task:brief+(options.raw?'':` Chart: title "${title}"; x "${x}"; y "${y}".`),
   solution:options.setup?work:plotImports(work)+(options.raw?'':'fig, ax = plt.subplots(figsize=(6, 4))\n')+work,
   setup:options.setup||'',setupDescription:options.setupDescription||'',starter:options.starter||'# Choose the data and chart operations from the brief\n',
   hint:options.hint||options.decision,demand:options.decision,decision:options.decision,fixtureFeature:c.datasets[dataset].feature||options.feature,
   prerequisites:options.prerequisites||['Inspect','Wrangle',id],target:'plot',resultKind:'Figure',requiredCalls:[],requiredKeywords:[],forbiddenCalls:[],
   plot:{textCaseInsensitive:true,...options.rules},steps:[]});
  r.steps=r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  delete r.teaching;delete r.reflection;delete r.checkPlotResponse;
  return r;
 }
 const bars={categorical:true,barGeometry:true,unorderedBars:true};
 const scatter={semantic:'scatter'};
 const encoded=(fields,extra={})=>({semantic:'encodedScatter',colors:true,legend:true,legendFields:fields,legendOrder:false,fixedPalette:false,legendTitle:false,...extra});
 function summaryPanels(dataset,left,right,x,y,leftTitle,rightTitle){
  return 'fig, axes = plt.subplots(1, 2, figsize=(10, 4))\n'+left.replaceAll('ax=ax','ax=axes[0]')+'\n'+right.replaceAll('ax=ax','ax=axes[1]')+`\naxes[0].set(title="${leftTitle}", xlabel="${x}", ylabel="${y}")\naxes[1].set(title="${rightTitle}", xlabel="${x}", ylabel="${y}")\n`+finishAudit;
 }
 fixture('weather_medians','Weather stations',{sky:['Sun','Sun','Sun','Sun','Rain','Rain','Rain','Cloud','Cloud'],temperature:[22,23,24,35,16,18,29,20,26],humidity:[40,40,45,35,80,85,85,60,65]},'temperature','humidity','sky','Asymmetric group values distinguish mean from median; repeated humidity exposes overlap.');
 byId.V09.rounds[1].dataset='weather_medians';
 byId.V09.rounds[1].fixtureFeature=c.datasets.weather_medians.feature;
 byId.V09.rounds[1].task=byId.V09.rounds[1].task.replace('Weather diary','Weather stations');
 byId.V09.rounds[1].solution=byId.V09.rounds[1].solution.replace('Weather diary','Weather stations');
 byId.V13.rounds[1].dataset='weather_medians';
 byId.V13.rounds[1].fixtureFeature=c.datasets.weather_medians.feature;
 byId.V14.rounds[1].dataset='weather_medians';
 byId.V14.rounds[1].fixtureFeature=c.datasets.weather_medians.feature;
 // Counting remains a raw-row Seaborn operation; an absent label is a zero count.
 contract('V08',1,'weather','Using df, count sky categories in reporting order Sun, Cloud, Rain, Snow. Retain Snow on the axis with a count of zero even though it has no rows.',
  'sns.countplot(data=df, x="sky", order=["Sun", "Cloud", "Rain", "Snow"], ax=ax)','sky','Count',{title:'Weather diary',rules:{categorical:true,barGeometry:true,categoryCounts:true},decision:'Choose a reporting order and retain an absent category without inventing a row.'});
 byId.V08.rounds[1].teaching={title:'Choose an order, including empty categories',idea:'countplot counts raw rows. order sets the displayed category labels, including a label with no observations. Its tick remains visible at zero; an empty category need not have a visible rectangle.',example:'Tasks arrived as email, chat, email. A report requests chat, email, phone; phone has no tasks.',code:'import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({"channel": ["email", "chat", "email"]})\nfig, ax = plt.subplots()\nsns.countplot(data=sample, x="channel", order=["chat", "email", "phone"], ax=ax)\nax.set(xlabel="channel", ylabel="Count")\nfig.tight_layout()\nplt.show()',output:{caption:'Counts in the requested reporting order',headers:['channel','count'],rows:[['chat',1],['email',2],['phone',0]]},parts:[['x="channel"','Supply the category column; countplot counts its rows.'],['order=[...]','Choose category positions explicitly instead of first appearance or frequency order.'],['"phone" in order','Keep an empty category tick with zero observations. Do not add a fake record.']],noteTitle:'What does empty mean?',note:'Zero observed rows is a count. An absent measurement group has no mean; do not turn an undefined mean into zero.'};
 byId.V08.syntaxCode='sns.countplot(data=df, x="flavour", ax=ax)';
 byId.V08.guide.choices=[['sns.countplot(data=df, x="category", ax=ax)','Count raw rows in each category.'],['order=[...]','Choose a reporting order; an absent listed category has zero rows.']];
 byId.V08.guide.note='A count is the number of records in the requested population. The order parameter changes display positions, not the counts; an empty listed category stays visible at zero.';
 byId.V08.guide.noteTitle='Count the requested population';
 contract('V08',2,'issue_channels','Using df, count only open requests by channel. The report compares workload, so place channels in descending open-request count; do not count already closed requests.',
  'selected = df[df["status"] == "open"]\norder = selected["channel"].value_counts().index\nsns.countplot(data=selected, x="channel", order=order, ax=ax)','channel','Open requests',{rules:{categorical:true,barGeometry:true,categoryCounts:true},decision:'Choose the eligible workload and rank its categories by the eligible counts.',hint:'Filter by status before value_counts determines the category order; pass the raw selected rows to countplot.'});
 contract('V09',2,'repair_costs','Using df, show the typical repair cost by kind as the middle ordered cost in each group, without error bars. An unusually expensive Basic repair should not pull the typical cost upward.',
  'sns.barplot(data=df, x="kind", y="cost", estimator="median", errorbar=None, ax=ax)','kind','Median cost',{rules:bars,decision:'Infer median from the report meaning and distinguish it from mean and count.',hint:'The middle ordered value is a median. Keep every invoice; changing the summary is different from dropping the expensive one.'});
 contract('V02',1,'weather','df stores temperature in Celsius. The supplied setup transforms those values before plotting them against humidity. Name the horizontal units accurately: choose x label "Temperature (°C)" or "Temperature (°F)" from that setup. Set title Weather relationship and y label Humidity (%). Keep all prepared pairs and arrange and display fig.',
  '', 'Temperature (°F)','Humidity (%)',{title:'Weather relationship',setup:'fig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(x=df["temperature"] * 9 / 5 + 32, y=df["humidity"], ax=ax)',setupDescription:'A prepared scatter whose horizontal values use °F = °C × 9/5 + 32; df still stores Celsius.',rules:scatter,decision:'Infer displayed units from the prepared coordinate transformation.',hint:'A label describes the plotted values, not just the original column. The conversion changes their displayed unit.'});
 contract('V02',2,'material_samples','The supplied setup chooses a batch before plotting its volume_ml/mass_g pairs. Read the setup and choose title "Trial batch" or "All samples" to describe the population actually shown. Label x Volume (mL) and y Mass (g), keep the prepared pairs, arrange and display fig.',
  '', 'Volume (mL)','Mass (g)',{title:'Trial batch',setup:'selected = df[df["batch"] == "trial"]\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="volume_ml", y="mass_g", ax=ax)',setupDescription:'The code selects trial samples and draws only their paired measurements.',rules:scatter,decision:'Choose an accurate population title by reading the supplied selection.',hint:'The title describes the observations on ax. Selecting trial rows means the plotted evidence is not all samples.'});
 // A visible numeric mapping and an ungrouped view test encoding decisions.
 contract('V03',1,'capacity_test','Using df, plot latency_ms against load and map latency_ms to colour only. Keep marker shapes and sizes constant; include a legend explaining the mapped values.',
  'sns.scatterplot(data=df, x="load", y="latency_ms", hue="latency_ms", legend="full", ax=ax)','load','latency_ms',{rules:encoded(['latency_ms']),decision:'Encode a varying numeric measurement rather than a categorical group.',hint:'A numeric hue maps a range of measured values to colours. hue uses the column name; a fixed color cannot show that range.'});
 byId.V03.guide.choices.push(['hue="measurement"','Numeric hue uses a colour range for measured values; legend="full" lists these tiny sample values.']);
 contract('V03',2,'material_samples','Using df, show mass_g against volume_ml for every sample in one ungrouped scatter. Use constant colour, shape and size, without a category legend: the question concerns the overall paired relationship.',
  'sns.scatterplot(data=df, x="volume_ml", y="mass_g", ax=ax)','volume_ml','mass_g',{rules:encoded([],{legend:false}),decision:'Remove unnecessary mappings while preserving all paired observations.',hint:'Do not supply hue, style or size column mappings for this overall relationship.'});
 contract('V16',1,'weather','Using df, show temperature in degrees Fahrenheit horizontally against humidity vertically for every observation. Convert each temperature with °F = °C × 9/5 + 32 and keep its own humidity partner.',
  'sns.scatterplot(x=df["temperature"] * 9 / 5 + 32, y=df["humidity"], ax=ax)','Temperature (°F)','Humidity (%)',{title:'Weather diary',rules:scatter,decision:'Transform a coordinate into the requested units while preserving row pairing.',hint:'Transform the whole temperature Series; use humidity from those same rows.'});
 contract('V16',2,'clinic_pairs','Using df, show wait_minutes against consult_minutes only where both plotting measurements are known. A missing note does not disqualify a visit. Keep each eligible visit’s pair together.',
  'selected = df.dropna(subset=["wait_minutes", "consult_minutes"])\nsns.scatterplot(data=selected, x="wait_minutes", y="consult_minutes", ax=ax)','wait_minutes','consult_minutes',{rules:scatter,decision:'Define pairwise completeness without dropping rows for unrelated missing fields.',hint:'dropna(subset=[...]) tests only the two plotted measurements. Filtering each coordinate independently breaks pairing.'});
 contract('V04',2,'parcel_weights','Using df, show every parcel weight in the reporting intervals 0–2, 2–5 and 5–10 kg. Use the boundaries [0, 2, 5, 10] as histogram bins. The intervals have unequal widths; retain the sparse heavy tail and show counts, not density.',
  'sns.histplot(data=df, x="weight_kg", bins=[0, 2, 5, 10], ax=ax)','weight_kg','Count',{rules:{},decision:'Choose meaningful unequal-width reporting intervals rather than another equal-bin count.',hint:'A list supplied to bins states the interval boundaries. Values on interior boundaries enter the interval to their right; the last interval includes its upper boundary.'});
 byId.V04.rounds[2].teaching={title:'Use explicit bin boundaries',idea:'An integer bins count chooses equal-width intervals. A list gives the boundaries themselves, so reporting intervals can have different widths.',example:'Measurements 1, 3, 8 and 9 split at [0, 4, 10] produce counts 2 and 2 across widths 4 and 6.',code:'import matplotlib.pyplot as plt\nimport seaborn as sns\n\nfig, ax = plt.subplots()\nsns.histplot(x=[1, 3, 8, 9], bins=[0, 4, 10], ax=ax)\nax.set(xlabel="measurement", ylabel="Count")\nfig.tight_layout()\nplt.show()',output:{caption:'Counts in the two specified intervals',headers:['interval','count'],rows:[['0–4',2],['4–10',2]]},parts:[['bins=[0, 4, 10]','Three boundaries define two intervals with different widths.'],['ylabel="Count"','Heights count observations; unequal widths are a display choice, not a density estimate.']],noteTitle:'At a boundary',note:'Interior boundary values enter the interval to the right; the final interval includes its upper edge. With unequal widths, bar area does not represent frequency when heights are counts.'};
 contract('V18',2,'meter_readings','Using df, show how each reading changed relative to the first chronological reading. Sort by hour, subtract that earliest reading from every reading, then connect the paired changes over hour with markers and no aggregation. The first plotted change must be zero.',
  'ordered = df.sort_values("hour").copy()\nordered["change"] = ordered["reading"] - ordered.iloc[0]["reading"]\nsns.lineplot(data=ordered, x="hour", y="change", estimator=None, marker="o", ax=ax)','hour','Change from first reading',{rules:{markers:true},decision:'Choose a chronological baseline and derive a change trajectory rather than filter another time window.',hint:'The first row in the supplied table is not the earliest hour. Sort first, then subtract that first chronological reading.'});
 delete byId.V18.rounds[2].teaching;
 contract('V13',2,'bench_readings','Using df, show every reading by bench as raw points, including repeated identical readings. Order benches by their median reading from lowest to highest and turn jitter off; the order should aid the centre comparison without replacing individual measurements.',
  'order = df.groupby("bench")["reading"].median().sort_values().index\nsns.stripplot(data=df, x="bench", y="reading", order=order, jitter=False, ax=ax)','bench','reading',{rules:scatter,decision:'Calculate a meaningful group order while keeping raw observation multiplicity.',hint:'Use grouped medians only to choose the order; give stripplot the original rows.'});
 contract('V11',2,'repair_costs','Using df, compare cost distributions by repair kind with a box plot. Order the kinds by median cost from lowest to highest. Keep the expensive Basic invoice as evidence; a flagged value is not automatically an error.',
  'order = df.groupby("kind")["cost"].median().sort_values().index\nsns.boxplot(data=df, x="kind", y="cost", order=order, ax=ax)','kind','cost',{rules:{boxSummary:true,categorical:true},decision:'Rank distributions by centre while retaining a legitimate extreme observation.',hint:'Find the order from medians, then draw boxes from all invoices so spread and the extreme remain visible.'});
 contract('V17',2,'bike_routes','Using df, compare minutes against distance_km for both surfaces. Make surface identifiable through both colour and marker shape. Use marker area to show average speed in km/h, calculated as distance_km divided by minutes times 60, rather than encoding raw duration. Include legends explaining surface and speed.',
  'plotted = df.copy()\nplotted["speed_kmh"] = plotted["distance_km"] / plotted["minutes"] * 60\nsns.scatterplot(data=plotted, x="distance_km", y="minutes", hue="surface", style="surface", size="speed_kmh", ax=ax)','distance_km','minutes',{rules:encoded(['surface','speed_kmh']),decision:'Derive a comparable rate and encode it independently from redundant group identity.',hint:'Convert the distance/time ratio into km/h before size maps the derived speed_kmh column. A size mapping to minutes would answer a different question.'});
 contract('V22',2,'packing_runs','Using df, compare linear association among speed, output and defects in that order. run_id is an identifier, not a measurement. Annotate the matrix and use cmap="coolwarm", vmin=-1, vmax=1, center=0.',
  'matrix = df[["speed", "output", "defects"]].corr()\nsns.heatmap(matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1, center=0, ax=ax)','Variable','Variable',{rules:{annotations:true,matrixLabels:true,numericAnnotations:true,palette:true,clim:true},decision:'Exclude a numeric identifier before building a multivariable correlation matrix.',hint:'Select the three measurements explicitly before corr; a numeric dtype alone does not make run_id meaningful.'});
 contract('V24',2,'sound_sensors','Using df, show only records marked valid in both panels of a vertical Figure: a four-bin level histogram titled Distribution above distance_m/level paired points titled Relationship. Label axes (level, Count) and (distance_m, level).',
  'selected = df[df["status"] == "valid"]\nfig, axes = plt.subplots(2, 1, figsize=(6, 8))\nsns.histplot(data=selected, x="level", bins=4, ax=axes[0])\nsns.scatterplot(data=selected, x="distance_m", y="level", ax=axes[1])\naxes[0].set(title="Distribution", xlabel="level", ylabel="Count")\naxes[1].set(title="Relationship", xlabel="distance_m", ylabel="level")\n'+finishAudit,'','',{raw:true,rules:{layout:true,semantic:'scatter'},decision:'Apply documented quality eligibility consistently across complementary views.',hint:'Define selected once and use it in both panels. The invalid extremes belong in neither view.'});
 contract('V25',2,'bike_routes','The supplied setup draws one layer per surface, using colour alone and an incomplete legend. Repair the chart so surface is represented by both colour and shape with palette="colorblind" and legend title Surface. Preserve all paired observations and constant marker size; remove the misleading draft before redrawing.',
  'ax.clear()\nsns.scatterplot(data=df, x="distance_km", y="minutes", hue="surface", style="surface", palette="colorblind", ax=ax)\nax.legend(title="Surface")','distance_km','minutes',{setup:'fig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=df, x="distance_km", y="minutes", hue="surface", ax=ax)\nax.legend(title="Group", labels=["paved"])',setupDescription:'A colour-only draft with an incomplete legend. ax.clear() removes its marks and labels before repair.',rules:encoded(['surface'],{fixedPalette:true,legendTitle:true}),decision:'Diagnose and repair missing accessibility cues and a misleading legend.',hint:'Clear the draft once, redraw the same rows with redundant surface cues, then restore complete labels and legend.'});
 byId.V25.rounds[2].teaching={title:'Clear a misleading draft before redrawing',idea:'ax.clear() removes the marks and labels on one plotting area. Redraw the requested evidence there and restore its labels; the Figure still exists.',example:'A draft line joins [1, 2] to [3, 1]. Clear its Axes and replace it with the two separate observations.',code:'import matplotlib.pyplot as plt\n\nfig, ax = plt.subplots()\nax.plot([1, 2], [3, 1])\nax.clear()\nax.scatter([1, 2], [3, 1])\nax.set(xlabel="x", ylabel="y")\nfig.tight_layout()\nplt.show()',result:'Two separate observations replace the draft line on the same Axes.',parts:[['ax.clear()','Remove the previous marks, title and axis labels from this Axes only.'],['ax.scatter(...)','Draw replacement evidence after clearing.'],['ax.set(...)','Restore labels removed by clear.']],noteTitle:'Preserve the evidence',note:'Clearing removes the draft, not the source data. Redraw every requested pair; leaving the original marks creates extra evidence.'};
 byId.V25.guide.choices.push(['ax.clear()','Remove a misleading draft before redrawing; restore its labels because clear removes those too.']);
 contract('V29',2,'support_totals','Using df, compare each team’s overall resolution percentage with exact bars. Pool all its shifts: total resolved divided by total received, multiplied by 100. This is a workload-weighted rate, not the average of shift percentages.',
  'totals = df.groupby("team")[["resolved", "received"]].sum()\nrates = totals["resolved"] / totals["received"] * 100\nax.bar(rates.index, rates.values)','team','Resolution (%)',{rules:bars,decision:'Construct a pooled group rate from totals before drawing supplied heights.',hint:'Aggregate numerator and denominator separately, then divide their group totals. Unequal shift workloads make an average of percentages incorrect.'});
 byId.V29.guide.choices.push(['totals["done"] / totals["received"] * 100','A pooled percentage divides group totals; averaging individual percentages weights small and large workloads equally.']);
 // Distribution extensions now ask a decision beyond another duration filter.
 contract('V05',2,'particle_diameters','Using df, compare KDE smoothing multipliers 1 and 2 on the same observations in two horizontal panels. Keep cut=0 and shared visible diameter limits 2 to 7. Titles Less smoothing and More smoothing; label diameter and Density.',
  summaryPanels('particle_diameters','sns.kdeplot(data=df, x="diameter", bw_adjust=1, cut=0, ax=ax)\naxes[0].set_xlim(2, 7)','sns.kdeplot(data=df, x="diameter", bw_adjust=2, cut=0, ax=ax)\naxes[1].set_xlim(2, 7)','diameter','Density','Less smoothing','More smoothing'),'','',{raw:true,rules:{layout:true,limits:true},decision:'Control evidence and axis range while comparing a display assumption.',hint:'Only bw_adjust changes; both panels receive the complete diameter Series and the same limits.'});
 contract('V06',2,'delivery_delays','Using df, show the fraction of deliveries with delays strictly above each x as an ECDF, retaining zero-delay deliveries and ties. The boundary at five minutes excludes both deliveries equal to five.',
  'sns.ecdfplot(data=df, x="delay_minutes", complementary=True, ax=ax)','delay_minutes','Proportion above',{rules:{lineDrawstyle:true},decision:'Apply the complementary tail to tied boundary values without changing the denominator.',hint:'complementary=True shows 1 minus the at-or-below fraction. Do not prefilter out zero delays or replace > with >=.'});
 contract('V07',2,'rainfall_log','Using df, draw a three-bin rainfall histogram and overlay one rug mark per day on the same Axes. Keep dry days as known zero measurements; coincident zero marks are still separate observations.',
  'sns.histplot(data=df, x="rain_mm", bins=3, ax=ax)\nsns.rugplot(data=df, x="rain_mm", ax=ax)','rain_mm','Count',{rules:{},decision:'Keep repeated zeros in a count distribution and its raw-evidence overlay.',hint:'Both calls use the full rain_mm column and the same ax. Zero rainfall is not missing data.'});
 contract('V10',2,'part_strength','Using df, make two horizontal panels with batch order A, B, C and a common strength range 0 to 20. Left: mean strength with one-standard-deviation intervals and capsize=0.15, titled Mean and SD. Right: every raw strength value with jitter=False, titled Observations. Label batch and strength on both.',
  summaryPanels('part_strength','sns.pointplot(data=df, x="batch", y="strength", order=["A", "B", "C"], estimator="mean", errorbar="sd", capsize=0.15, ax=ax)\naxes[0].set_ylim(0, 20)','sns.stripplot(data=df, x="batch", y="strength", order=["A", "B", "C"], jitter=False, ax=ax)\naxes[1].set_ylim(0, 20)','batch','strength','Mean and SD','Observations'),'','',{raw:true,rules:{layout:true,categorical:true,limits:true,semantic:'scatter'},decision:'Connect equal group centres and different spreads to their raw evidence.',hint:'SD describes variation of observations. It is neither a confidence interval nor the difference between group means.'});
 contract('V12',2,'part_strength','Using df, compare strength by batch with violins using cut=0 and inner=None. Overlay every raw observation as separate raw points with jitter=False on the same Axes. The density shape is exploratory; keep its actual evidence visible.',
  'sns.violinplot(data=df, x="batch", y="strength", cut=0, inner=None, ax=ax)\nsns.stripplot(data=df, x="batch", y="strength", jitter=False, color="black", ax=ax)','batch','strength',{rules:{semantic:'scatter'},decision:'Combine an exploratory density with a separate auditable raw-evidence layer.',hint:'inner=None removes the internal summary; the earlier stripplot technique supplies every observation on the same ax.'});
 byId.V12.guide.choices.push(['inner=None','Omit the built-in inner summary before adding a separate raw-point layer.']);
 contract('V14',2,'bench_readings','Using df, show every reading by bench with a swarm. Order benches by median reading from lowest to highest. Repeated identical readings must remain separate observations; only the category-direction positions may move.',
  'order = df.groupby("bench")["reading"].median().sort_values().index\nsns.swarmplot(data=df, x="bench", y="reading", order=order, size=5, ax=ax)','bench','reading',{rules:{swarm:true,semantic:'scatter'},decision:'Combine evidence-preserving packing with an order derived from group centres.',hint:'Use medians for order only. Give swarmplot all original records so duplicates are packed separately.'});
 const ceramicSetup='fig, axes = plt.subplots(1, 2, figsize=(10, 4))\nsns.violinplot(data=df, x="batch", y="mass_g", inner=None, cut=0, ax=axes[0])\naxes[0].set(title="Draft density", xlabel="batch", ylabel="mass_g")\nsns.scatterplot(data=df, x="volume_ml", y="mass_g", ax=axes[1])\naxes[1].set(title="Paired measurements", xlabel="volume_ml", ylabel="mass_g")';
 contract('V15',2,'ceramic_checks','The supplied setup has an over-detailed violin draft on axes[0] and a legitimate paired scatter on axes[1]. Replace only the first panel with every mass_g observation by batch using jitter=False. Restore its title Observations and labels batch and mass_g. Preserve the second panel and all its evidence.',
  'axes[0].clear()\nsns.stripplot(data=df, x="batch", y="mass_g", jitter=False, ax=axes[0])\naxes[0].set(title="Observations", xlabel="batch", ylabel="mass_g")\n'+finishAudit,'','',{raw:true,setup:ceramicSetup,setupDescription:'Two panels: an unsuitable density draft at axes[0], and a valid paired scatter at axes[1].',rules:{semantic:'scatter',layout:true},decision:'Target a local repair and preserve an unaffected chart.',hint:'Clear and redraw axes[0] only. Clearing axes[1] or all Figures erases valid evidence.'});
 contract('V19',2,'machine_replicates','Using df, compare two units of analysis in horizontal panels. Left: replicate A’s output over hour as a line with markers and no aggregation, titled Replicate A. Right: mean output at each hour across both replicates with SD bands and markers, titled Mean and SD. Label hour and output on both.',
  'selected = df[df["replicate"] == "A"]\n'+summaryPanels('machine_replicates','sns.lineplot(data=selected, x="hour", y="output", estimator=None, marker="o", ax=ax)','sns.lineplot(data=df, x="hour", y="output", estimator="mean", errorbar="sd", marker="o", ax=ax)','hour','output','Replicate A','Mean and SD'),'','',{raw:true,rules:{markers:true,layout:true},decision:'Contrast an individual trajectory with a population-at-time summary.',hint:'The trajectory panel uses selected; the mean/SD panel uses both replicates. Connecting interleaved raw rows creates neither requested view.'});
 contract('V20',2,'calibration_checks','Using df, show usable calibration observations and their fitted straight line without a confidence band. The usable flag documents a failed calibration; exclude that record from both the points and fit, without deleting any other observation.',
  'selected = df[df["usable"]]\nsns.regplot(data=selected, x="input", y="measured", ci=None, ax=ax)','input','measured',{rules:{fitLine:true},decision:'Keep the fitting population aligned with a documented eligibility decision.',hint:'Fit and show the same usable rows. Fitting all rows then displaying only usable points would give the wrong trend.'});
 contract('V21',2,'curved_response','Using df, inspect residuals of a straight-line response-versus-dose fit, keeping dose on x. Draw observed-minus-predicted deviations rather than the original response.',
  'sns.residplot(data=df, x="dose", y="response", ax=ax)','dose','Residual',{rules:scatter,decision:'Diagnose a straight-line model from its residual evidence.',hint:'Pass original response to residplot so it fits the line and calculates deviations. Inspect whether those deviations have a systematic curved pattern or look unstructured around zero.'});
 byId.V21.rounds[2].task+=' After displaying the plot, finish with the Python string "curved" or "unstructured" to describe the residual pattern in these supplied observations.';
 byId.V21.rounds[2].solution+='\n"curved"';
 byId.V21.rounds[2].checkPlotResponse=true;
 byId.V21.rounds[2].steps=byId.V21.rounds[2].task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 contract('V23',1,'loading_waits','Using df, show the proportion of records using each side within each zone as a heatmap: zone rows and side columns. Each zone’s row must sum to one. Annotate with fmt=".2f" and cmap="Blues".',
  'matrix = pd.crosstab(df["zone"], df["side"])\nmatrix = matrix.div(matrix.sum(axis=1), axis=0)\nsns.heatmap(matrix, annot=True, fmt=".2f", cmap="Blues", ax=ax)','side','zone',{rules:{annotations:true,matrixLabels:true,palette:true},decision:'Choose a within-row denominator rather than raw counts or an overall proportion.',hint:'Count combinations first, then divide every row by its own total. div(..., axis=0) aligns each zone denominator with that row.'});
 byId.V23.rounds[1].teaching={title:'Normalize within a row',idea:'A row total supplies that group’s denominator. Dividing along axis=0 aligns each row with its own total.',example:'A table has A counts 1 and 3, and B counts 2 and 0. Their row proportions are 0.25/0.75 and 1/0.',code:'import pandas as pd\n\ncounts = pd.DataFrame({"Left": [1, 2], "Right": [3, 0]}, index=["A", "B"])\ncounts.div(counts.sum(axis=1), axis=0)',output:{caption:'Fractions within each row',headers:['group','Left','Right'],rows:[['A',0.25,0.75],['B',1,0]]},parts:[['sum(axis=1)','Add across columns to get one denominator per row.'],['div(totals, axis=0)','Align the denominator Series to row labels and divide each row.']],noteTitle:'Which denominator?',note:'Dividing by the grand total answers a different question. This task asks for proportions within each group.'};
 contract('V23',2,'loading_waits','Using df, show mean wait_minutes for zone rows and side columns. Use one-decimal annotations and cmap="Blues". Keep known zero waits; leave unobserved combinations missing rather than replacing them with zero.',
  'matrix = df.pivot_table(index="zone", columns="side", values="wait_minutes", aggfunc="mean")\nsns.heatmap(matrix, annot=True, fmt=".1f", cmap="Blues", ax=ax)','side','zone',{rules:{annotations:true,matrixLabels:true,palette:true},decision:'Distinguish counts, measured zero and absent measurement groups.',hint:'A pivot-table mean summarizes measured waits. fillna(0) would invent zero wait for groups with no observations.'});
 contract('V28',2,'installations','The supplied setup creates selected from active installations and draws their hours/output pairs. Annotate the highest-output active installation as Active peak, offset (8, 8) points with an arrow. Keep the prepared population and labels.',
  'peak = selected.loc[selected["output"].idxmax()]\nax.annotate("Active peak", xy=(peak["hours"], peak["output"]), xytext=(8, 8), textcoords="offset points", arrowprops={"arrowstyle": "->"})','hours','output',{setup:'selected = df[df["active"]]\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="hours", y="output", ax=ax)',setupDescription:'An active-installation scatter with selected, fig and ax.',rules:{...scatter,annotations:true,annotationDetails:true},decision:'Find the extreme within the plotted population when the global extreme is excluded.',hint:'Use selected for both idxmax and row lookup. The highest output in df belongs to an inactive installation.'});
 byId.V28.guide.note='Find the extreme inside the same population that is plotted. An excluded record can be the global maximum; both annotation coordinates must still come from one eligible row.';
 contract('V30',1,'recycling_sites','Using df, compare composition and precise component amounts in one horizontal two-panel Figure. Left: paper at the base with glass stacked above, titled Composition. Right: glass alone from zero, titled Glass comparison. Keep site order North, East, West, South and labels site and Amount on both; include the paper/glass legend on the left.',
  'fig, axes = plt.subplots(1, 2, figsize=(10, 4))\naxes[0].bar(df["site"], df["paper"], label="paper")\naxes[0].bar(df["site"], df["glass"], bottom=df["paper"], label="glass")\naxes[0].legend()\naxes[1].bar(df["site"], df["glass"])\naxes[1].set_ylim(bottom=0)\naxes[0].set(title="Composition", xlabel="site", ylabel="Amount")\naxes[1].set(title="Glass comparison", xlabel="site", ylabel="Amount")\n'+finishAudit,'','',{raw:true,rules:{categorical:true,barGeometry:true,legend:true,layout:true},decision:'Choose complementary views for total composition and a precise component comparison.',hint:'Glass needs paper as bottom only in the composition panel. The comparison panel starts glass at zero.'});
 contract('V30',2,'components_2','Using df, compare Online and Shop shares within each item rather than their absolute counts. Draw 100% stacked bars in table item order: Online at the base, Shop above. Calculate each share using that item’s combined count, include a component legend and use a 0–100 percentage axis.',
  'total = df["Online"] + df["Shop"]\nonline = df["Online"] / total * 100\nshop = df["Shop"] / total * 100\nax.bar(df["item"], online, label="Online")\nax.bar(df["item"], shop, bottom=online, label="Shop")\nax.legend()\nax.set_ylim(0, 100)','item','Share (%)',{rules:{categorical:true,barGeometry:true,legend:true,limits:true},decision:'Normalize components by their own total to compare relative composition.',hint:'Compute one total per item, then divide both components by that same row total. A grand total or raw counts would not make each item’s stack equal 100%.',feature:'Different item totals make normalized composition distinct from raw stacked counts.'});
 byId.V30.guide.choices.push(['component / row_total * 100','Normalize both components by the same item total when the question asks for shares rather than absolute amounts.']);
 contract('V31',2,'plant_trays','Using df, inspect relationships among light, height and leaf_area only, in that order. tray_id is an identifier. Use histogram diagonals, distinguish location by colour, and omit mirrored upper panels. Use the figure-level pairplot route and finish its own Figure.',
  'g = sns.pairplot(data=df, vars=["light", "height", "leaf_area"], hue="location", diag_kind="hist", corner=True)\ng.figure.tight_layout()\nplt.show()','','',{raw:true,rules:{},decision:'Select measurements and remove redundant pair panels while retaining category context.',hint:'vars lists measurements; corner=True omits the upper mirrored panels. Do not create an extra empty Figure first.'});
 contract('V32',2,'capacity_test','Using df, create a joint scatter of load against latency_ms with its marginal distributions. Add a dashed vertical line at the stated design load 60 to the central panel only; keep every observation, including above-capacity tests.',
  'g = sns.jointplot(data=df, x="load", y="latency_ms", kind="scatter")\ng.ax_joint.axvline(60, linestyle="--")\ng.figure.tight_layout()\nplt.show()','','',{raw:true,rules:{semantic:'scatter',lineStyles:true},decision:'Target an x-unit policy reference to the central panel while retaining margins.',hint:'Use g.ax_joint.axvline, not a marginal Axes or a median-derived threshold.'});
 // New facet families receive neutral examples, then Transfer combines known routes.
 const catTeaching=byId.V33.rounds[1].teaching;
 catTeaching.example='A small coating test compares thickness by method within separate workshops.';
 catTeaching.code='import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({"workshop": ["East"] * 4 + ["West"] * 4, "method": ["Brush", "Brush", "Spray", "Spray"] * 2, "thickness": [2, 4, 1, 3, 5, 7, 4, 6]})\ng = sns.catplot(data=sample, x="method", y="thickness", col="workshop", kind="box", height=3)\ng.figure.tight_layout()\nplt.show()';
 catTeaching.result='East and West panels each compare Brush and Spray thickness distributions.';
 catTeaching.parts=[['sns.catplot(...)','Create categorical-chart panels on its own Figure.'],['x="method", y="thickness"','Compare numeric distributions within categories.'],['col="workshop"','Use one panel per workshop.'],['kind="box", height=3','Reuse box summaries with a three-inch panel height.'],['g.figure','Arrange the Figure created by the grid.']];
 contract('V33',2,'reservoir_flow','Using df, compare how outflow varies with inflow separately in North and South. Choose the already-taught relationship-facet family, with one scatter panel per region and height=3; keep comparable scales and all paired observations.',
  'g = sns.relplot(data=df, x="inflow", y="outflow", col="region", kind="scatter", height=3)\ng.figure.tight_layout()\nplt.show()','','',{raw:true,rules:{semantic:'scatter',panelHeight:3,limits:true},decision:'Choose the facet family from a paired-relationship question rather than copying a distribution call.',hint:'The question pairs two measurements within each region. relplot creates relationship panels; displot would answer a one-variable distribution question.'});
 // Existing export and scale repairs already have distinct responsibilities.
 // Replace the remaining duration population in the export task with completeness.
 {const r=byId.V34.rounds[2];r.dataset='clinic_pairs';r.setup='selected = df.dropna(subset=["wait_minutes", "consult_minutes"])\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="wait_minutes", y="consult_minutes", ax=ax)';r.task='The supplied setup prepares the complete wait_minutes/consult_minutes pairs from df but leaves both axis labels blank. Finish title Clinic visits and labels Wait (minutes) and Consultation (minutes), arrange the Figure, then save chart.png at 150 dpi with bbox_inches="tight" before displaying. Preserve the prepared pairs, including the visit whose note is missing.';r.solution='ax.set(title="Clinic visits", xlabel="Wait (minutes)", ylabel="Consultation (minutes)")\nfig.tight_layout()\nfig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()';r.hint='Label and arrange the prepared Figure before saving the explicit fig; a missing unrelated note is not a reason to drop a paired observation.';r.demand=r.decision='Repair the deliverable labels and export the same complete-pair evidence.';r.setupDescription='A complete-pair clinic scatter with blank axis labels.';r.steps=r.task.split(/(?<=[.!?])\s+/);}
 // A report checkpoint varies its eligibility policy and derived measurement.
 contract('V37',1,'clinic_pairs','Using df, define selected from visits with both wait_minutes and consult_minutes known. Keep the visit with a missing note. Create three separate Figures from this same population: a four-bin wait_minutes histogram titled Distribution (wait_minutes, Count); a wait_minutes/consult_minutes scatter titled Relationship (wait_minutes, consult_minutes); exact bars of mean consult_minutes by service titled Means (service, Mean consultation). Finish and display each Figure.',
  'selected = df.dropna(subset=["wait_minutes", "consult_minutes"])\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.histplot(data=selected, x="wait_minutes", bins=4, ax=ax)\nax.set(title="Distribution", xlabel="wait_minutes", ylabel="Count")\n'+finishAudit+'\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="wait_minutes", y="consult_minutes", ax=ax)\nax.set(title="Relationship", xlabel="wait_minutes", ylabel="consult_minutes")\n'+finishAudit+'\nmeans = selected.groupby("service")["consult_minutes"].mean()\nfig, ax = plt.subplots(figsize=(6, 4))\nax.bar(means.index, means.values)\nax.set(title="Means", xlabel="service", ylabel="Mean consultation")\n'+finishAudit,'','',{raw:true,rules:{semantic:'scatter',barGeometry:true,unorderedBars:true,unorderedBarsFigure:2},decision:'Carry a pairwise completeness policy through every report view.',hint:'dropna(subset=...) defines the report population once. Reuse selected; do not let note missingness change any chart.'});
 contract('V37',2,'sales_receipts','Using df, select sold items with units greater than zero and derive revenue as units times unit_price. Create three separate Figures from those same records: a four-bin unit_price histogram titled Prices (unit_price, Count); units/revenue paired scatter titled Sales (units, Revenue); exact bars of total revenue by department titled Revenue by department (department, Total revenue). Finish and display each Figure.',
  'selected = df[df["units"] > 0].copy()\nselected["revenue"] = selected["units"] * selected["unit_price"]\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.histplot(data=selected, x="unit_price", bins=4, ax=ax)\nax.set(title="Prices", xlabel="unit_price", ylabel="Count")\n'+finishAudit+'\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="units", y="revenue", ax=ax)\nax.set(title="Sales", xlabel="units", ylabel="Revenue")\n'+finishAudit+'\ntotals = selected.groupby("department")["revenue"].sum()\nfig, ax = plt.subplots(figsize=(6, 4))\nax.bar(totals.index, totals.values)\nax.set(title="Revenue by department", xlabel="department", ylabel="Total revenue")\n'+finishAudit,'','',{raw:true,rules:{semantic:'scatter',barGeometry:true,unorderedBars:true,unorderedBarsFigure:2},decision:'Distinguish unit prices from derived revenue and aggregate the correct quantity across consistent sold-item views.',hint:'Calculate revenue row by row before grouping. Adding or averaging unit prices does not calculate departmental revenue.'});
 // Each review retrieves a known skill on a fresh problem; never clone Transfer.
 const reviewSourcesAudit={VR1:['V35','V16','V04','V08'],VR2:['V18','V09','V13','V17'],VR3:['V22','V24','V27'],VR4:['V05','V06','V10','V15'],VR5:['V19','V20','V21','V23'],VR6:['V28','V30','V31','V33']};
 for(const [id,sources] of Object.entries(reviewSourcesAudit)){
  byId[id].rounds=sources.map((source,index)=>({...JSON.parse(JSON.stringify(byId[source].rounds[2])),id:`${id}-${index+1}`,label:`Task ${index+1}`,retrieves:source,starter:'# Retrieve and combine the earlier skills\n',teaching:undefined}));
  byId[id].goal='Retrieve earlier skills on fresh evidence and a new reporting question.';
 }
 {const r=byId.VR1.rounds[0];Object.assign(r,{dataset:'library_weeks',task:'Using df, choose the view that shows how visits changed across weeks in their time order, with one observation per week. Write "scatter", "histogram", "counts" or "line".',solution:'"line"',setup:'',target:'expression',plot:null,resultKind:'string',hint:'An ordered time question benefits from connecting neighbouring observations.',decision:'Choose ordered change rather than association, distribution or frequency.',demand:'Choose ordered change rather than association, distribution or frequency.',prerequisites:['V35'],fixtureFeature:c.datasets.library_weeks.feature,steps:['Choose the chart that answers an ordered weekly-change question.'],textCaseInsensitive:true});}
 contract('VR1',1,'material_samples','Using df, show mass_g against volume_ml for trial-batch samples only, keeping each sample’s two measurements paired.',
  'selected = df[df["batch"] == "trial"]\nsns.scatterplot(data=selected, x="volume_ml", y="mass_g", ax=ax)','volume_ml','mass_g',{rules:scatter,decision:'Retrieve paired plotting with categorical eligibility instead of a duration threshold.',prerequisites:['V16','I10']});
 contract('VR1',2,'parcel_weights','Using df, show the weight distribution of every parcel with four histogram bins. Retain the sparse heavy tail rather than dropping it as inconvenient evidence.',
  'sns.histplot(data=df, x="weight_kg", bins=4, ax=ax)','weight_kg','Count',{rules:{},decision:'Retrieve numeric bin counts while preserving ties and rare heavy parcels.',prerequisites:['V04']});
 contract('VR1',3,'issue_channels','Using df, count requests by channel in reporting order phone, email, chat, web. Include every status; this report measures all requests received.',
  'sns.countplot(data=df, x="channel", order=["phone", "email", "chat", "web"], ax=ax)','channel','Count',{rules:{categorical:true,barGeometry:true,categoryCounts:true},decision:'Retrieve count semantics in a reporting order distinct from ranking and first appearance.',prerequisites:['V08']});
 contract('VR2',0,'meter_readings','Using df, connect every reading over hour in chronological order with observation markers and no aggregation. The input rows are scrambled; keep each reading paired with its own hour.',
  'ordered = df.sort_values("hour")\nsns.lineplot(data=ordered, x="hour", y="reading", estimator=None, marker="o", ax=ax)','hour','reading',{rules:{markers:true},decision:'Order time explicitly before connecting neighbouring observations.',prerequisites:['V18','I12']});
 contract('VR2',1,'support_totals','Using df, compare mean received requests per shift by team using summary bars and no error bars. This is a per-shift typical workload, not a pooled resolution percentage or a count of shift records.',
  'sns.barplot(data=df, x="team", y="received", estimator="mean", errorbar=None, ax=ax)','team','Mean received per shift',{rules:bars,decision:'Choose a group measurement mean rather than a frequency or ratio.',prerequisites:['V09']});
 contract('VR2',2,'bench_readings','Using df, show every reading by bench with jitter=0.15. Preserve repeated values and each measured reading; do not replace groups with one average.',
  'sns.stripplot(data=df, x="bench", y="reading", jitter=0.15, ax=ax)','bench','reading',{rules:{semantic:'scatter',jitter:true},decision:'Retrieve raw point multiplicity with category-direction jitter.',prerequisites:['V13']});
 contract('VR2',3,'material_samples','Using df, show mass_g against volume_ml and make batch identifiable through both colour and shape. Keep sizes constant and include a complete batch legend.',
  'sns.scatterplot(data=df, x="volume_ml", y="mass_g", hue="batch", style="batch", ax=ax)','volume_ml','mass_g',{rules:encoded(['batch']),decision:'Retrieve redundant category mappings with paired trial/standard evidence.',prerequisites:['V17']});
 contract('VR3',0,'plant_trays','Using df, show a correlation matrix for leaf_area, height and light in that order; exclude tray_id. Annotate values, use cmap="coolwarm", vmin=-1, vmax=1 and center=0.',
  'matrix = df[["leaf_area", "height", "light"]].corr()\nsns.heatmap(matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1, center=0, ax=ax)','Variable','Variable',{rules:{annotations:true,matrixLabels:true,numericAnnotations:true,palette:true,clim:true},decision:'Retrieve scientifically meaningful variable selection and a fixed signed scale.',prerequisites:['V22']});
 contract('VR3',1,'calibration_checks','Using df, use usable records in both panels of one horizontal Figure. Left: a three-bin measured histogram titled Usable measurements (measured, Count). Right: input/measured scatter titled Calibration pairs (input, measured). The failed-calibration record belongs in neither view.',
  'selected = df[df["usable"]]\nfig, axes = plt.subplots(1, 2, figsize=(10, 4))\nsns.histplot(data=selected, x="measured", bins=3, ax=axes[0])\nsns.scatterplot(data=selected, x="input", y="measured", ax=axes[1])\naxes[0].set(title="Usable measurements", xlabel="measured", ylabel="Count")\naxes[1].set(title="Calibration pairs", xlabel="input", ylabel="measured")\n'+finishAudit,'','',{raw:true,rules:{semantic:'scatter',layout:true},decision:'Retrieve a consistent documented population across two report views.',prerequisites:['V24','I10']});
 contract('VR3',2,'capacity_test','Using df, plot latency_ms against load for every observation. Mark the stated design load 60 with a dashed vertical line. Do not substitute a measured average or remove observations above the benchmark.',
  'sns.scatterplot(data=df, x="load", y="latency_ms", ax=ax)\nax.axvline(60, linestyle="--")','load','latency_ms',{rules:{semantic:'scatter',lineStyles:true},decision:'Retrieve an x-oriented external benchmark rather than an estimated statistic.',prerequisites:['V27']});
 contract('VR4',0,'rainfall_log','Using df, inspect the rainfall distribution with a KDE using cut=0 and bw_adjust=2, and overlay a rug showing every day on the same Axes. Retain all zero-rainfall days; smoothing does not create extra evidence.',
  'sns.kdeplot(data=df, x="rain_mm", cut=0, bw_adjust=2, ax=ax)\nsns.rugplot(data=df, x="rain_mm", ax=ax)','rain_mm','Density',{rules:{},decision:'Retrieve smoothing and its raw-evidence overlay with repeated real zeros.',prerequisites:['V05','V07']});
 contract('VR4',1,'parcel_weights','Using df, show the fraction of parcels at or below each weight_kg with an ordinary ECDF. Retain every parcel and the tied low weights; do not show the complementary tail.',
  'sns.ecdfplot(data=df, x="weight_kg", ax=ax)','weight_kg','Proportion',{rules:{lineDrawstyle:true},decision:'Retrieve the at-or-below direction with ties, contrasting the earlier strictly-above brief.',prerequisites:['V06']});
 contract('VR4',2,'repair_costs','Using df, compare median repair cost by kind using points and no error bars. Keep every invoice, including the expensive Basic repair. This report asks for the middle cost, not mean or spread.',
  'sns.pointplot(data=df, x="kind", y="cost", estimator="median", errorbar=None, ax=ax)','kind','Median cost',{rules:{categorical:true},decision:'Retrieve a robust centre without claiming an uncertainty interval.',prerequisites:['V10']});
 contract('VR4',3,'bench_readings','The supplied setup draws an over-detailed violin for each bench on ax. Replace it with horizontal raw readings using jitter=False, preserving every duplicate observation. Restore title Bench observations, x reading and y bench.',
  'ax.clear()\nsns.stripplot(data=df, x="reading", y="bench", jitter=False, ax=ax)','reading','bench',{setup:'fig, ax = plt.subplots(figsize=(6, 4))\nsns.violinplot(data=df, x="bench", y="reading", cut=0, inner=None, ax=ax)',setupDescription:'A density draft for tiny bench groups; ax.clear() also clears labels.',title:'Bench observations',rules:{semantic:'scatter',categoryAxis:'y'},decision:'Retrieve draft replacement while changing the orientation and preserving duplicates.',prerequisites:['V15','V13']});
 fixture('river_replicates','River monitoring',{day:[1,1,1,2,2,3,3,3,3],station:['Up','Mid','Down','Up','Down','Up','Mid','Down','Tributary'],level:[2,4,6,5,9,4,5,12,15]},'day','level','station','Unequal daily observation counts and changing spreads require within-time summaries, not a station trajectory.');
 contract('VR5',0,'river_replicates','Using df, report typical river level across the observed stations at each day and the spread of actual readings. Use a mean line with SD bands and observation markers; each point summarizes that day’s records, not a tracked station. Keep all available readings even though the number of stations differs by day.',
  'sns.lineplot(data=df, x="day", y="level", estimator="mean", errorbar="sd", marker="o", ax=ax)','day','Mean level',{rules:{markers:true},decision:'Retrieve within-day centre and spread when observation counts vary by time.',prerequisites:['V19']});
 contract('VR5',1,'material_samples','Using df, show mass_g against volume_ml with fitted straight lines in two horizontal panels: trial samples on the left, standard on the right. Titles Trial and Standard; label volume_ml and mass_g. Fit each line on only its own displayed batch and omit confidence bands.',
  'trial = df[df["batch"] == "trial"]\nstandard = df[df["batch"] == "standard"]\n'+summaryPanels('material_samples','sns.regplot(data=trial, x="volume_ml", y="mass_g", ci=None, ax=ax)','sns.regplot(data=standard, x="volume_ml", y="mass_g", ci=None, ax=ax)','volume_ml','mass_g','Trial','Standard'),'','',{raw:true,rules:{fitLine:true,layout:true},decision:'Retrieve separate fitting populations in a controlled comparison.',prerequisites:['V20','V24']});
 contract('VR5',2,'curved_response','Using df, draw straight-line residuals with response as x and dose as y, keeping response on the horizontal axis. The axes deliberately reverse the earlier experiment view; pass original dose values so the fit and residuals answer this reversed prediction question.',
  'sns.residplot(data=df, x="response", y="dose", ax=ax)','response','Residual dose',{rules:scatter,decision:'Retrieve residual semantics for a reversed response/predictor question.',prerequisites:['V21']});
 contract('VR5',3,'loading_waits','Using df, show the fraction of observed waits that were exactly zero for side rows and zone columns. True counts as 1 and False as 0, so averaging the zero-wait flag gives the required fraction. Use two-decimal annotations, cmap="Blues" and a fixed 0–1 colour range. Leave unobserved combinations missing.',
  'working = df.copy()\nworking["zero_wait"] = working["wait_minutes"] == 0\nmatrix = working.pivot_table(index="side", columns="zone", values="zero_wait", aggfunc="mean")\nsns.heatmap(matrix, annot=True, fmt=".2f", cmap="Blues", vmin=0, vmax=1, ax=ax)','zone','side',{rules:{annotations:true,matrixLabels:true,palette:true,clim:true},decision:'Retrieve matrix aggregation for a zero-occurrence rate rather than an average duration.',prerequisites:['V23','W08','I16']});
 contract('VR6',0,'calibration_checks','The supplied setup shows usable calibration pairs. Find the usable record with the lowest measured value and annotate its paired coordinates as Lowest usable, offset (8, 8) points with an arrow. Keep the plotted population.',
  'point = selected.loc[selected["measured"].idxmin()]\nax.annotate("Lowest usable", xy=(point["input"], point["measured"]), xytext=(8, 8), textcoords="offset points", arrowprops={"arrowstyle": "->"})','input','measured',{setup:'selected = df[df["usable"]]\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=selected, x="input", y="measured", ax=ax)',setupDescription:'A scatter of usable calibration pairs with selected, fig and ax.',rules:{semantic:'scatter',annotations:true,annotationDetails:true},decision:'Retrieve an eligible minimum and its paired coordinates instead of an eligible maximum.',prerequisites:['V28']});
 contract('VR6',1,'recycling_sites','Using df, draw stacked collection amounts in table site order. Put glass at the base and paper above it, with both component names in the legend. Use the actual measurements; paper is a component, not a combined total.',
  'ax.bar(df["site"], df["glass"], label="glass")\nax.bar(df["site"], df["paper"], bottom=df["glass"], label="paper")\nax.legend()','site','Amount',{rules:{categorical:true,barGeometry:true,legend:true},decision:'Retrieve actual component offsets with the base reversed.',prerequisites:['V30']});
 contract('VR6',2,'packing_runs','Using df, inspect pairwise relationships among speed, output and defects only, with histogram diagonals and corner=True. Exclude the run identifier and omit mirrored upper panels. Finish pairplot’s own Figure without an extra canvas.',
  'g = sns.pairplot(data=df, vars=["speed", "output", "defects"], diag_kind="hist", corner=True)\ng.figure.tight_layout()\nplt.show()','','',{raw:true,rules:{},decision:'Retrieve multivariable selection and panel redundancy reduction without category grouping.',prerequisites:['V31']});
 contract('VR6',3,'bike_routes','Using df, compare the distribution of minutes separately for paved and gravel surfaces. Choose the taught distribution-facet family with three histogram bins and height=3. The question asks for one measurement’s distribution within each surface, rather than paired distance/time relationships.',
  'g = sns.displot(data=df, x="minutes", col="surface", kind="hist", bins=3, height=3)\ng.figure.tight_layout()\nplt.show()','','',{raw:true,rules:{panelHeight:3},decision:'Retrieve and choose distribution facets from the analytical question.',prerequisites:['V33','V04']});
 // Teach distribution facets before their first review, using a neutral example.
 byId.V33.rounds[2].teaching={title:'Choose a distribution-facet route',idea:'relplot panels pair two measurements. displot panels display the distribution of one measurement; col splits its records by a category.',example:'A tiny warehouse sample compares package mass distributions separately for two depots.',code:'import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nsample = pd.DataFrame({"depot": ["A"] * 4 + ["B"] * 4, "mass": [1, 1, 3, 8, 2, 4, 4, 7]})\ng = sns.displot(data=sample, x="mass", col="depot", kind="hist", bins=2, height=3)\ng.figure.tight_layout()\nplt.show()',result:'Two histograms summarize mass separately in depot A and depot B.',parts:[['sns.displot(...)','Create distribution panels on its own Figure.'],['x="mass"','Choose the one measurement whose distribution is shown.'],['col="depot"','Split observations into panels.'],['kind="hist", bins=2','Use the already-taught histogram, with two bins per panel.'],['g.figure','Finish the Figure created by the grid.']],noteTitle:'Choose from the question',note:'A paired relationship uses relplot; category distributions can use catplot; one-variable frequencies use displot. The exercise still requires you to choose the relevant family.'};
 const retainedDecisions={
 V35:['Choose a paired relationship view.','Distinguish one-variable distribution from association.','Choose category frequencies from a cinema question.'],
 V01:['Create and distinguish the Figure canvas and Axes plotting area.'],
 V02:['Finish a prepared chart with measurement labels.','Infer the units of the prepared transformed coordinate.','Name the population actually plotted by the supplied setup.'],
 V03:['Map one categorical field to colour while holding other channels constant.'],
 V04:['Count observations in equal-width numeric bins.','Change the bin resolution while retaining the observations.'],
 V05:['Draw an exploratory density on the observed measurement range.','Increase smoothing without claiming additional evidence.'],
 V06:['Show the fraction at or below each observed value.','Reverse the ECDF tail to answer strictly-above questions.'],
 V07:['Overlay raw observation marks on a count distribution.','Keep raw evidence visible beside a smoothed density.'],
 V08:['Count category records rather than summarize a measurement.'],
 V09:['Summarize category measurements with means rather than counts.','Replace mean with median on asymmetric groups.'],
 V10:['Show group means with intervals describing observation spread.','Change the centre to median and remove intervals.'],
 V11:['Summarize group centres, spread and extreme observations with boxes.','Move the numeric measurement onto the horizontal axis.'],
 V12:['Show an exploratory density within each category.','Expose observed values inside the estimated density.'],
 V13:['Show individual category measurements with sideways jitter.','Turn jitter off and inspect coincident observations.'],
 V14:['Separate coincident raw points while preserving measured values.','Pack points along the vertical category direction.'],
 V15:['Replace an over-detailed tiny-sample draft with observed values.','Repair a horizontal category plot and restore its labels.'],
 V16:['Map each record’s paired measurements to one point.'],
 V17:['Encode group identity redundantly and a measurement through size.','Retain redundant group identity while removing size encoding.'],
 V18:['Connect ordered observations without aggregation.','Restrict the plotted time window before connecting observations.'],
 V19:['Summarize repeated times with their mean and observation spread.','Follow one replicate instead of aggregating across replicates.'],
 V20:['Inspect a fitted linear association without claiming causation.','Fit only the specified station’s observations.'],
 V21:['Plot observed-minus-fitted deviations instead of original outcomes.','Keep the residual fit within the specified station population.'],
 V22:['Map pairwise numeric correlations to a fixed signed colour scale.','Select and order measurements before correlating.'],
 V23:['Display the counts of two-category combinations.'],
 V24:['Place complementary views on their intended Axes.','Adapt the panel arrangement while preserving each view’s meaning.'],
 V25:['Explain redundant category encodings with an accessible palette.','Expose overlap while keeping category order consistent across colour and shape.'],
 V26:['Use a logarithmic axis for positive values spanning orders of magnitude.','Apply common dashboard limits without hiding observations.','Use the stated rating scale while retaining the whole population.'],
 V27:['Distinguish x and y medians through correctly oriented reference lines.','Use a mean-derived benchmark in the measurement’s units.','Use a chosen rating benchmark without claiming it is an observed estimate.'],
 V28:['Annotate both coordinates from the highest-scoring record.','Select a minimum rather than a maximum and retain its paired coordinates.'],
 V29:['Calculate group means before drawing supplied bar heights.','Calculate group totals rather than group averages.'],
 V30:['Stack actual components with the correct cumulative baseline.',null,'Choose a common zero baseline for precise component comparisons.'],
 V31:['Inspect paired relationships and marginal distributions on a grid-owned Figure.','Reduce mirrored panels while retaining selected measurements.'],
 V32:['Inspect a relationship and its margins on a grid-owned Figure.','Target a measured median to the central joint panel only.'],
 V33:['Split a paired relationship into category panels.','Choose category-distribution panels using the new catplot family.'],
 V34:['Export a prepared Figure before display.','Repair cramped margins before exporting the finished chart.'],
 V36:['Repair a truncated bar baseline while preserving values and rank.','Restore a logarithmic bar axis to a fair linear comparison.','Use a common zero-based comparison range while preserving group means.'],
 V37:['Combine consistent selected evidence into three complementary report views.']};
 for(const [id,decisions] of Object.entries(retainedDecisions))decisions.forEach((decision,index)=>{
  const r=byId[id].rounds[index];if(decision&&!r.decision){r.decision=decision;r.demand=decision;}
 });

 for(const r of byId.V02.rounds.slice(1)){
  r.task=r.task.replace(/ Chart: title.*$/, '');
  r.steps=r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 }
 byId.V02.rounds[1].setupDescription='A prepared scatter; inspect its setup calculation to identify the displayed units.';
 byId.V02.guide.choices.push(['°C × 9/5 + 32 = °F','A unit conversion changes the plotted measurement scale. The axis label must describe the plotted values, even when the original column is unchanged.']);
 byId.V02.rounds[2].setupDescription='A prepared scatter; inspect its selection to identify the plotted population.';
 // Check only requested ranges; unrequested limits are presentation choices.
 for(const [id,index,flag] of [['V05',2,'xLimits'],['V10',2,'yLimits'],['V26',2,'yLimits'],['V36',2,'yLimits'],['V30',2,'yLimits']]){
  const rules=byId[id].rounds[index].plot;delete rules.limits;rules[flag]=true;
 }
 delete byId.V33.rounds[2].plot.limits;byId.V33.rounds[2].plot.sharedLimits=true;
 for(const id of ['V13','V14','V12','V15'])byId[id].rounds[2].plot.categorical=true;
 byId.VR4.rounds[3].plot.categorical=true;
 byId.VR2.rounds[2].plot.categorical=true;
 // Keep learner work focused when the lesson is about marks or annotations.
 for(const index of [1,2]){
  const r=byId.V16.rounds[index];
  const labelLine=r.solution.split('\n').find(line=>line.startsWith('ax.set('));
  r.setup='fig, ax = plt.subplots(figsize=(6, 4))\n'+labelLine;
  r.setupDescription='An empty labelled Axes on fig; add only the requested paired observations.';
  r.solution=r.solution.replace(plotImports(r.solution),'').replace('fig, ax = plt.subplots(figsize=(6, 4))\n','').replace(labelLine+'\n','');
  r.task='The supplied setup creates fig and an empty labelled ax. '+r.task;
 }
 for(const r of [byId.V28.rounds[2],byId.VR6.rounds[0]]){
  const labelLine=r.solution.split('\n').find(line=>line.startsWith('ax.set('));
  r.setup+='\n'+labelLine;
  r.solution=r.solution.replace(labelLine+'\n','');
  r.setupDescription+=' The title and measurement labels are already supplied.';
 }
 byId.V25.guide.choices=byId.V25.guide.choices.filter(([code])=>code!=='alpha=0.6');
 byId.V25.guide.choices.find(([code])=>code==='hue_order / style_order')[1]+=' alpha=0.6 can reveal some overlapping points without changing their coordinates.';
 // Prepared bars use Matplotlib directly; keep their demonstrated imports exact.
 for(const r of [byId.V29.rounds[0],byId.V29.rounds[1],byId.V30.rounds[0]])
  for(const field of ['solution','starter'])r[field]=r[field].replace('import seaborn as sns\n','');
 // Audit metadata states the actual available prerequisite chain, including
 // deliberate retrieval. Visuals remain the source concept sketch, not answers.
 for(const l of c.lessons.filter(l=>l.deck==='visualise'))for(const r of l.rounds){
  if(!r.decision)r.decision=r.demand;
  if(!r.prerequisites)r.prerequisites=r.retrieves?[r.retrieves]:['Inspect','Wrangle',...(r.label==='Follow'?[]:[l.id])];
  if(!r.fixtureFeature)r.fixtureFeature=c.datasets[r.dataset].feature||'Existing deterministic fixture retained for focused retrieval of the stated concept.';
  if(r.retrieves)r.visual=JSON.parse(JSON.stringify(byId[r.retrieves].rounds[2].visual));
 }
 for(const l of c.lessons.filter(l=>l.deck==='visualise'&&!l.review))l.example=l.rounds[0].solution;

 byId.WR2.rounds.forEach((r,i)=>{r.demand=['Section 02 · W07: create a numeric column','Section 02 · W10: clean text','Section 03 · W12: convert numeric text'][i];});
 return c;
}
const api={guides,clarify};
if(typeof module!=='undefined')module.exports=api;else root.FoundationClarity=api;
})(typeof window!=='undefined'?window:globalThis);
