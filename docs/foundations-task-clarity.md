# Data Foundations task clarity review

Reviewed every rendered task against its given data and reference solution. The five criteria were: clear action; named data/object; expected result; stated required API; and no requirement hidden only in explanatory prose. This is an editorial review, not a non-empty-string check. The companion JSON fingerprints the reviewed task, solution, dataset and intent rules; curriculum tests require renewed review if any change.

## I01 — Meet a DataFrame

Both literal columns and four rows are visible; construction is not preloaded.

- **I01-1 · Candy shop · first table** — Write a dictionary named data using the two columns and four rows in the given table. Import pandas as pd, create df from data, and display df. Practise: DataFrame().
- **I01-2 · Café orders · first table** — Write a dictionary named data using the two columns and four rows in the given table. Import pandas as pd, create df from data, and display df. Practise: DataFrame().
- **I01-3 · Pet adoption · first table** — Write a dictionary named data using the two columns and four rows in the given table. Import pandas as pd, create df from data, and display df.

## I01CSV — Load a CSV

Names the real CSV file, destination df and displayed DataFrame.

- **I01CSV-1 · Candy shop · first table** — Load the supplied candy.csv file into df and display the resulting DataFrame. Practise: read_csv().
- **I01CSV-2 · Café orders · first table** — Load the supplied cafe.csv file into df and display the resulting DataFrame. Practise: read_csv().
- **I01CSV-3 · Pet adoption · first table** — Load the supplied pets.csv file into df and display the resulting DataFrame. Practise: read_csv().

## I02 — Take the first look

Names exact row count; Follow/Change require head, Transfer accepts positional selection.

- **I02-1 · Candy shop** — Using df, return the first 2 rows of the Candy shop table. Return the DataFrame. Practise: head().
- **I02-2 · Café orders** — Using df, return the first 3 rows of the Café orders table. Return the DataFrame. Practise: head().
- **I02-3 · Pet adoption** — Using df, return the first 4 rows of the Pet adoption table. Return the DataFrame.

## I03 — How big is it?

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I03-1 · Candy shop** — Using df, return the pair (number of rows, number of columns) for Candy shop. Return the tuple. Practise: shape.
- **I03-2 · Café orders** — Using df, return the pair (number of rows, number of columns) for Café orders. Return the tuple. Practise: shape.
- **I03-3 · Pet adoption** — Using df, return the pair (number of rows, number of columns) for Pet adoption. Return the tuple.

## I04 — What columns arrived?

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I04-1 · Candy shop** — Using df, return the column labels of Candy shop in their original order as a list. Practise: columns.
- **I04-2 · Café orders** — Using df, return the column labels of Café orders in their original order as a list. Practise: columns.
- **I04-3 · Pet adoption** — Using df, return the column labels of Pet adoption in their original order as a list.

## I05 — What types are these?

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I05-1 · Candy shop** — Run df.info() to read the overview, then return df.dtypes. Practise: info(), dtypes.
- **I05-2 · Café orders** — Run df.info() to read the overview, then return df.dtypes. Practise: info(), dtypes.
- **I05-3 · Pet adoption** — Run df.info() to read the overview, then return df.dtypes.

## IR1 — Review · First contact

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **IR1-1 · Pet adoption** — Using df, return the first 4 rows of the Pet adoption table. Return the DataFrame.
- **IR1-2 · Pet adoption** — Using df, return the pair (number of rows, number of columns) for Pet adoption. Return the tuple.
- **IR1-3 · Pet adoption** — Using df, return the column labels of Pet adoption in their original order as a list.
- **IR1-4 · Pet adoption** — Run df.info() to read the overview, then return df.dtypes.

## I06 — Pick one column

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I06-1 · Candy shop** — Using df, return the price column as a Series.
- **I06-2 · Café orders** — Using df, return the price column as a Series.
- **I06-3 · Pet adoption** — Using df, return the age column as a Series.

## I07 — Pick several columns

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I07-1 · Candy shop** — Using df, return a DataFrame containing rating, then price, in that order.
- **I07-2 · Café orders** — Using df, return a DataFrame containing tip, then price, in that order.
- **I07-3 · Pet adoption** — Using df, return a DataFrame containing weight, then age, in that order.

## I08 — Rows by position

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I08-1 · Candy shop** — Using df, use iloc to return the first 2 rows and first two columns. Return the DataFrame. Practise: iloc.
- **I08-2 · Café orders** — Using df, use iloc to return the first 3 rows and first two columns. Return the DataFrame. Practise: iloc.
- **I08-3 · Pet adoption** — Return the first 4 rows and first two columns of df by position, as a DataFrame.

## I09 — Rows and columns by label

Visible letter index, inclusive endpoint and one-column DataFrame are explicit.

- **I09-1 · Candy shop** — Using df, return labels B through D, including the end label, keeping only price as a one-column DataFrame. Practise: loc.
- **I09-2 · Café orders** — Using df, return labels B through E, including the end label, keeping only price as a one-column DataFrame. Practise: loc.
- **I09-3 · Pet adoption** — Using df, return labels B through F, including the end label, keeping only age as a one-column DataFrame.

## I10 — Filter rows

Membership keeps only Latte/Tea; inclusive age range has a nonempty, non-total result.

- **I10-1 · Candy shop** — Using df, keep every row where price is greater than 2.1. Return the DataFrame.
- **I10-2 · Café orders** — Keep the df rows whose drink is either Latte or Tea, using isin. Return a DataFrame in original row order. Practise: isin().
- **I10-3 · Pet adoption** — Return the df rows with age from 2 to 5 inclusive, in their original order. Return the DataFrame.

## I11 — Combine conditions

Transfer combines two conditions with an informative result, not an empty table.

- **I11-1 · Candy shop** — Using df, keep rows where price is greater than 2.1 AND flavour equals "fruity". Return the DataFrame.
- **I11-2 · Café orders** — Using df, keep rows where price is greater than 3.1 AND size equals "Large". Return the DataFrame.
- **I11-3 · Pet adoption** — Return df rows where age is at least 2 and species is Cat, preserving row order.

## IR2 — Review · Select with intent

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **IR2-1 · Pet adoption** — Using df, return a DataFrame containing weight, then age, in that order.
- **IR2-2 · Pet adoption** — Using df, return labels B through F, including the end label, keeping only age as a one-column DataFrame.
- **IR2-3 · Pet adoption** — Return df rows where age is at least 2 and species is Cat, preserving row order.

## I12 — Sort the table

Direction and tie-breaking keys are explicit in all rounds.

- **I12-1 · Candy shop** — Using df, keep rows with price greater than 2.1; then sort them from highest to lowest rating. Return the DataFrame. Practise: sort_values().
- **I12-2 · Café orders** — Return all rows of df sorted by tip, smallest first. Return the DataFrame. Practise: sort_values().
- **I12-3 · Pet adoption** — Return df sorted first by species alphabetically, then by age from oldest to youngest within each species.

## I13 — Find extremes

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I13-1 · Candy shop** — Using df, return the 2 rows with the largest price, highest first. Return the DataFrame. Practise: nlargest().
- **I13-2 · Café orders** — Using df, return the 3 rows with the largest price, highest first. Return the DataFrame. Practise: nlargest().
- **I13-3 · Pet adoption** — Using df, return the 4 rows with the largest age, highest first. Return the DataFrame.

## I14 — What values exist?

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I14-1 · Candy shop** — Using df, return the number of distinct non-missing values in flavour. Practise: nunique().
- **I14-2 · Café orders** — Using df, return the number of distinct non-missing values in size. Practise: nunique().
- **I14-3 · Pet adoption** — Using df, return the number of distinct non-missing values in species.

## I15 — Count categories

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I15-1 · Candy shop** — Using df, return the proportion of observations in each flavour category. Return the Series. Practise: value_counts().
- **I15-2 · Café orders** — Using df, return the proportion of observations in each size category. Return the Series. Practise: value_counts().
- **I15-3 · Pet adoption** — Using df, return the proportion of observations in each species category. Return the Series.

## I16 — Find missing values

Missing count, missing category count and percentage are distinct outcomes.

- **I16-1 · Messy café orders** — Using df, return the number of missing values in every column. Return the Series. Practise: isna().
- **I16-2 · Messy game sales** — Return value counts for df["edition"], including missing values as a category. Return the Series. Practise: value_counts().
- **I16-3 · Messy pet supplies** — Return the percentage of missing values in every df column as a Series (0–100).

## I17 — Find duplicate rows

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I17-1 · Messy café orders** — Using df, return the number of extra, exactly duplicated rows. Practise: duplicated().
- **I17-2 · Messy game sales** — Using df, return the number of extra, exactly duplicated rows. Practise: duplicated().
- **I17-3 · Messy pet supplies** — Using df, return the number of extra, exactly duplicated rows.

## IR3 — Review · Find the surprises

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **IR3-1 · Pet adoption** — Return df sorted first by species alphabetically, then by age from oldest to youngest within each species.
- **IR3-2 · Pet adoption** — Using df, return the proportion of observations in each species category. Return the Series.
- **IR3-3 · Messy pet supplies** — Return the percentage of missing values in every df column as a Series (0–100).
- **IR3-4 · Messy pet supplies** — Using df, return the number of extra, exactly duplicated rows.

## I18 — Describe numeric columns

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I18-1 · Candy shop** — Using df, return describe() for the numeric columns price and rating, in that order. Return the DataFrame. Practise: describe().
- **I18-2 · Café orders** — Using df, return describe() for the numeric columns price and tip, in that order. Return the DataFrame. Practise: describe().
- **I18-3 · Pet adoption** — Using df, return describe() for the numeric columns age and weight, in that order. Return the DataFrame.

## I18S — Answer one numerical question

Seven dictionary keys in Follow; direct total and middle-value questions fade guidance.

- **I18S-1 · Candy shop** — Using df["price"], return a dictionary with keys mean, median, min, max, sum, count and q75, containing the matching direct summaries (q75 is the 75th percentile). Practise: mean(), median(), min(), max(), sum(), count(), quantile().
- **I18S-2 · Café orders** — Return the total of df["tip"] as one number. Practise: sum().
- **I18S-3 · Pet adoption** — What is the middle age in df? Return one number.

## I19 — Summarise groups

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I19-1 · Candy shop** — Using df, return mean price for each flavour category as a Series. Practise: groupby(), agg().
- **I19-2 · Café orders** — Using df, return mean price for each size category as a Series. Practise: groupby(), agg().
- **I19-3 · Pet adoption** — Using df, return mean age for each species category as a Series.

## I20 — Compare categories

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I20-1 · Candy shop** — Using df, return a crosstab of flavour rows against shelf columns. Return the DataFrame. Practise: crosstab().
- **I20-2 · Café orders** — Using df, return a crosstab of size rows against shift columns. Return the DataFrame. Practise: crosstab().
- **I20-3 · Pet adoption** — Using df, return a crosstab of species rows against room columns. Return the DataFrame.

## I21 — Inspect numeric relationships

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **I21-1 · Study club** — Using df, return the correlation matrix for all numeric columns in Study club. Return the DataFrame. Practise: corr().
- **I21-2 · Weather diary** — Using df, return the correlation matrix for all numeric columns in Weather diary. Return the DataFrame. Practise: corr().
- **I21-3 · Board games** — Using df, return the correlation matrix for all numeric columns in Board games. Return the DataFrame.

## I22 — Inspect checkpoint

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **I22-1 · Messy café orders** — Profile the table without changing df. Save a dictionary named profile with keys "shape", "columns", "types", "missing" and "categories": use shape, a list of columns, dtypes, missing counts per column and value_counts for size. Display profile.
- **I22-2 · Study club** — Profile the table without changing df. Save a dictionary named profile with keys "shape", "columns", "types", "missing" and "categories": use shape, a list of columns, dtypes, missing counts per column and value_counts for club. Display profile.
- **I22-3 · Weather diary** — Profile the table without changing df. Save a dictionary named profile with keys "shape", "columns", "types", "missing" and "categories": use shape, a list of columns, dtypes, missing counts per column and value_counts for sky. Display profile.

## W01 — Protect the original

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W01-1 · Candy shop** — Make a separate copy named clean. Double its price values and leave df unchanged. Display clean. Practise: copy().
- **W01-2 · Café orders** — Make a separate copy named clean. Double its price values and leave df unchanged. Display clean. Practise: copy().
- **W01-3 · Pet adoption** — Make a separate copy named clean. Double its age values and leave df unchanged. Display clean.

## W02 — Rename columns

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W02-1 · Candy shop** — Rename price to amount in df; keep every other column and row. Keep the changes in df and display it. Practise: rename().
- **W02-2 · Café orders** — Rename price to amount in df; keep every other column and row. Keep the changes in df and display it. Practise: rename().
- **W02-3 · Pet adoption** — Rename age to amount in df; keep every other column and row. Keep the changes in df and display it.

## W03 — Keep / reorder columns

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W03-1 · Candy shop** — Keep only candy, rating and price, in that order, in df. Keep the changes in df and display it.
- **W03-2 · Café orders** — Keep only drink, tip and price, in that order, in df. Keep the changes in df and display it.
- **W03-3 · Pet adoption** — Keep only name, weight and age, in that order, in df. Keep the changes in df and display it.

## W04 — Drop columns

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W04-1 · Candy shop** — Remove the shelf column from df and preserve every row. Keep the changes in df and display it. Practise: drop().
- **W04-2 · Café orders** — Remove the shift column from df and preserve every row. Keep the changes in df and display it. Practise: drop().
- **W04-3 · Pet adoption** — Remove the room column from df and preserve every row. Keep the changes in df and display it.

## W05 — Filter unwanted rows

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W05-1 · Candy shop** — For a report limited to flavour equal to "fruity", keep just those rows in df. Keep the changes in df and display it.
- **W05-2 · Café orders** — For a report limited to size equal to "Large", keep just those rows in df. Keep the changes in df and display it.
- **W05-3 · Pet adoption** — For a report limited to species equal to "Cat", keep just those rows in df. Keep the changes in df and display it.

## W06 — Sort and reset

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W06-1 · Candy shop** — Sort df by price, smallest first, then reset its index without adding a column. Keep the changes in df and display it. Practise: sort_values(), reset_index().
- **W06-2 · Café orders** — Sort df by price, smallest first, then reset its index without adding a column. Keep the changes in df and display it. Practise: sort_values(), reset_index().
- **W06-3 · Pet adoption** — Sort df by age, smallest first, then reset its index without adding a column. Keep the changes in df and display it.

## WR1 — Review · Keep the evidence

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **WR1-1 · Pet adoption** — Make a separate copy named clean. Double its age values and leave df unchanged. Display clean.
- **WR1-2 · Pet adoption** — Keep only name, weight and age, in that order, in df. Keep the changes in df and display it.
- **WR1-3 · Pet adoption** — Sort df by age, smallest first, then reset its index without adding a column. Keep the changes in df and display it.

## W07 — Create a numeric column

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W07-1 · Candy shop** — Using df, add a column named doubled equal to price multiplied by 2. Preserve all original columns. Keep the changes in df and display it.
- **W07-2 · Café orders** — Using df, add a column named doubled equal to price multiplied by 2. Preserve all original columns. Keep the changes in df and display it.
- **W07-3 · Pet adoption** — Using df, add a column named doubled equal to age multiplied by 2. Preserve all original columns. Keep the changes in df and display it.

## W08 — Create a conditional column

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W08-1 · Candy shop** — Using df, add band: "high" when price exceeds 2.1, otherwise "low". Keep the changes in df and display it. Practise: where().
- **W08-2 · Café orders** — Using df, add band: "high" when price exceeds 3.1, otherwise "low". Keep the changes in df and display it. Practise: where().
- **W08-3 · Pet adoption** — In df, add band: "high" when age exceeds 3, otherwise "low". Keep the changes in df and display it.

## W09 — Recode categories

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W09-1 · Candy shop** — Using df, in flavour, replace "fruity" with "Featured" and keep all other values unchanged. Keep the changes in df and display it. Practise: replace().
- **W09-2 · Café orders** — Using df, in size, replace "Large" with "Featured" and keep all other values unchanged. Keep the changes in df and display it. Practise: replace().
- **W09-3 · Pet adoption** — Using df, in species, replace "Cat" with "Featured" and keep all other values unchanged. Keep the changes in df and display it.

## W10 — Clean text

Each schema names its own text/category fields; literal replacement is explicit.

- **W10-1 · Messy café orders** — Using df, clean drink by trimming spaces and making it lowercase. Clean size by trimming spaces and making it title case. Keep the changes in df and display it. Practise: str.strip(), str.lower(), str.title().
- **W10-2 · Messy game sales** — In df, trim and lowercase game, then replace literal hyphens with spaces. Trim and title-case edition. Return the updated DataFrame, retaining all rows and other values. Practise: str.strip(), str.lower(), str.title(), str.replace().
- **W10-3 · Messy pet supplies** — In df, trim and lowercase item, then replace literal hyphens with spaces. Trim and title-case package. Return the updated DataFrame, retaining all rows and other values.

## W11 — Search / extract text

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W11-1 · Candy shop** — Using df, keep rows whose candy contains the letter "a", ignoring case. Return the filtered DataFrame. Practise: str.contains().
- **W11-2 · Café orders** — Using df, keep rows whose drink contains the letter "a", ignoring case. Return the filtered DataFrame. Practise: str.contains().
- **W11-3 · Pet adoption** — Using df, keep rows whose name contains the letter "a", ignoring case. Return the filtered DataFrame.

## W12 — Convert numeric text

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W12-1 · Messy café orders** — Convert price to numeric in df, making invalid text missing. Preserve every row. Keep the changes in df and display it. Practise: to_numeric().
- **W12-2 · Messy game sales** — Convert price to numeric in df, making invalid text missing. Preserve every row. Keep the changes in df and display it. Practise: to_numeric().
- **W12-3 · Messy pet supplies** — Convert price to numeric in df, making invalid text missing. Preserve every row. Keep the changes in df and display it.

## WR2 — Review · Values with meaning

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **WR2-1 · Pet adoption** — Using df, add a column named doubled equal to age multiplied by 2. Preserve all original columns. Keep the changes in df and display it.
- **WR2-2 · Messy pet supplies** — In df, trim and lowercase item, then replace literal hyphens with spaces. Trim and title-case package. Return the updated DataFrame, retaining all rows and other values.
- **WR2-3 · Messy pet supplies** — Convert price to numeric in df, making invalid text missing. Preserve every row. Keep the changes in df and display it.

## W13 — Convert data types

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W13-1 · Candy shop** — Using df, convert flavour to the category dtype without changing its values. Keep the changes in df and display it. Practise: astype().
- **W13-2 · Café orders** — Using df, convert size to the category dtype without changing its values. Keep the changes in df and display it. Practise: astype().
- **W13-3 · Pet adoption** — Using df, convert species to the category dtype without changing its values. Keep the changes in df and display it.

## W14 — Parse dates

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W14-1 · Messy café orders** — Using df, parse date using year-month-day order. Keep invalid dates as NaT and retain all rows. Keep the changes in df and display it. Practise: to_datetime().
- **W14-2 · Messy game sales** — Using df, parse date using year-month-day order. Keep invalid dates as NaT and retain all rows. Keep the changes in df and display it. Practise: to_datetime().
- **W14-3 · Messy pet supplies** — Using df, parse date using year-month-day order. Keep invalid dates as NaT and retain all rows. Keep the changes in df and display it.

## W15 — Work with dates

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W15-1 · Messy café orders** — Using df, parse date, then add year, month and weekday columns. Retain invalid dates as missing. Keep the changes in df and display it. Practise: to_datetime().
- **W15-2 · Messy game sales** — Using df, parse date, then add year, month and weekday columns. Retain invalid dates as missing. Keep the changes in df and display it. Practise: to_datetime().
- **W15-3 · Messy pet supplies** — Using df, parse date, then add year, month and weekday columns. Retain invalid dates as missing. Keep the changes in df and display it.

## W16 — Drop missing rows

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W16-1 · Messy café orders** — Using df, convert price to numeric, then keep only rows with a known numeric price. Do not require a known tip or date. Keep the changes in df and display it. Practise: to_numeric(), dropna().
- **W16-2 · Messy game sales** — Using df, convert price to numeric, then keep only rows with a known numeric price. Do not require a known discount or date. Keep the changes in df and display it. Practise: to_numeric(), dropna().
- **W16-3 · Messy pet supplies** — Using df, convert price to numeric, then keep only rows with a known numeric price. Do not require a known discount or date. Keep the changes in df and display it.

## W17 — Fill missing values

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W17-1 · Messy café orders** — Using df, fill missing tip with the observed median tip, keeping all rows. This is an exercise assumption, not proof of the true tip. Keep the changes in df and display it. Practise: fillna().
- **W17-2 · Messy game sales** — Using df, fill missing discount with the observed median discount, keeping all rows. This is an exercise assumption, not proof of the true discount. Keep the changes in df and display it. Practise: fillna().
- **W17-3 · Messy pet supplies** — Using df, fill missing discount with the observed median discount, keeping all rows. This is an exercise assumption, not proof of the true discount. Keep the changes in df and display it.

## W18 — Remove duplicates

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W18-1 · Messy café orders** — Using df, remove extra exact duplicate rows and preserve the first occurrence and its index. Keep the changes in df and display it. Practise: drop_duplicates().
- **W18-2 · Messy game sales** — Using df, remove extra exact duplicate rows and preserve the first occurrence and its index. Keep the changes in df and display it. Practise: drop_duplicates().
- **W18-3 · Messy pet supplies** — Using df, remove extra exact duplicate rows and preserve the first occurrence and its index. Keep the changes in df and display it.

## WR3 — Review · Gaps and duplicates

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **WR3-1 · Messy pet supplies** — Using df, parse date using year-month-day order. Keep invalid dates as NaT and retain all rows. Keep the changes in df and display it.
- **WR3-2 · Messy pet supplies** — Using df, convert price to numeric, then keep only rows with a known numeric price. Do not require a known discount or date. Keep the changes in df and display it.
- **WR3-3 · Messy pet supplies** — Using df, fill missing discount with the observed median discount, keeping all rows. This is an exercise assumption, not proof of the true discount. Keep the changes in df and display it.
- **WR3-4 · Messy pet supplies** — Using df, remove extra exact duplicate rows and preserve the first occurrence and its index. Keep the changes in df and display it.

## W19 — Group and aggregate

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W19-1 · Candy shop** — Using df, group by flavour. Return a DataFrame with flavour, mean_amount (mean price) and records (row count), in that order. Practise: groupby(), agg().
- **W19-2 · Café orders** — Using df, group by size. Return a DataFrame with size, mean_amount (mean price) and records (row count), in that order. Practise: groupby(), agg().
- **W19-3 · Pet adoption** — Using df, group by species. Return a DataFrame with species, mean_amount (mean age) and records (row count), in that order.

## W20 — Groupwise transformation

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W20-1 · Candy shop** — Using df, add group_mean containing the mean price for each row’s flavour category. Preserve all rows. Keep the changes in df and display it. Practise: transform().
- **W20-2 · Café orders** — Using df, add group_mean containing the mean price for each row’s size category. Preserve all rows. Keep the changes in df and display it. Practise: transform().
- **W20-3 · Pet adoption** — Using df, add group_mean containing the mean age for each row’s species category. Preserve all rows. Keep the changes in df and display it.

## W21 — Build a pivot table

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W21-1 · Candy shop** — Using df, return a pivot table of mean price, with flavour on rows and shelf on columns. Leave absent combinations missing. Return the DataFrame. Practise: pivot_table().
- **W21-2 · Café orders** — Using df, return a pivot table of mean price, with size on rows and shift on columns. Leave absent combinations missing. Return the DataFrame. Practise: pivot_table().
- **W21-3 · Pet adoption** — Using df, return a pivot table of mean age, with species on rows and room on columns. Leave absent combinations missing. Return the DataFrame.

## W22 — Wide → long

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W22-1 · Candy shop** — Using df, melt price and rating into measure and value columns, retaining candy as the identifier. Return the DataFrame. Practise: melt().
- **W22-2 · Café orders** — Using df, melt price and tip into measure and value columns, retaining drink as the identifier. Return the DataFrame. Practise: melt().
- **W22-3 · Pet adoption** — Using df, melt age and weight into measure and value columns, retaining name as the identifier. Return the DataFrame.

## W23 — Long → wide

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W23-1 · Candy shop** — The supplied long table contains candy, measure and value. Pivot it back with candy on rows, measure on columns and value in cells. Return the DataFrame. Practise: pivot().
- **W23-2 · Pet adoption** — The supplied long table contains name, measure and value. Pivot it back with name on rows, measure on columns and value in cells. Return the DataFrame. Practise: pivot().
- **W23-3 · Board games** — The supplied long table contains game, measure and value. Pivot it back with game on rows, measure on columns and value in cells. Return the DataFrame.

## W24 — Combine tables by keys

Unmatched lookup keys make join choice observable; cardinality validation is stated.

- **W24-1 · Candy shop** — Left-join lookup onto df on flavour; retain every df row and use validate="many_to_one". Return the joined DataFrame. Practise: merge().
- **W24-2 · Café orders** — Inner-join df with lookup on size, keeping only matched rows. Use validate="many_to_one" and return the joined DataFrame. Practise: merge().
- **W24-3 · Pet adoption** — Attach lookup priorities to df on species for an audit that must retain unmatched observations. Choose left or inner accordingly, validate the many-to-one relationship, and return the joined DataFrame. Practise: merge().

## WR4 — Review · Reshape and connect

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **WR4-1 · Pet adoption** — Using df, group by species. Return a DataFrame with species, mean_amount (mean age) and records (row count), in that order.
- **WR4-2 · Pet adoption** — Using df, add group_mean containing the mean age for each row’s species category. Preserve all rows. Keep the changes in df and display it.
- **WR4-3 · Pet adoption** — Using df, melt age and weight into measure and value columns, retaining name as the identifier. Return the DataFrame.
- **WR4-4 · Pet adoption** — Attach lookup priorities to df on species for an audit that must retain unmatched observations. Choose left or inner accordingly, validate the many-to-one relationship, and return the joined DataFrame. Practise: merge().

## W25 — Stack datasets

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W25-1 · Candy shop** — Stack the supplied first and second tables, in that order, with a fresh index. Return the DataFrame. Practise: concat().
- **W25-2 · Café orders** — Stack the supplied first and second tables, in that order, with a fresh index. Return the DataFrame. Practise: concat().
- **W25-3 · Pet adoption** — Stack the supplied first and second tables, in that order, with a fresh index. Return the DataFrame.

## W26 — Create bins

All bin edges, labels, zero inclusion and right-boundary inclusion are specified.

- **W26-1 · Candy shop** — Using df, add half using cut with boundaries 0, 2.1, and 100; labels "lower" and "upper". Include zero in the first bin. Keep the changes in df and display it. Practise: cut(). Each interval includes its right boundary.
- **W26-2 · Café orders** — Using df, add half using cut with boundaries 0, 3.1, and 100; labels "lower" and "upper". Include zero in the first bin. Keep the changes in df and display it. Practise: cut(). Each interval includes its right boundary.
- **W26-3 · Pet adoption** — Using df, add half using cut with boundaries 0, 7, and 100; labels "lower" and "upper". Include zero in the first bin. Keep the changes in df and display it. Each interval includes its right boundary.

## W27 — Encode categories

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W27-1 · Candy shop** — One-hot encode flavour in df with integer indicator columns, preserving the other columns. Return the encoded DataFrame. Practise: get_dummies().
- **W27-2 · Café orders** — One-hot encode size in df with integer indicator columns, preserving the other columns. Return the encoded DataFrame. Practise: get_dummies().
- **W27-3 · Pet adoption** — One-hot encode species in df with integer indicator columns, preserving the other columns. Return the encoded DataFrame.

## W28 — Scale numeric columns

Array column order and scaling convention are specified; named scaler is required in teaching rounds.

- **W28-1 · Candy shop** — Using df, standardise price and rating using StandardScaler. Return the resulting two-column numeric array. Practise: fit_transform(), StandardScaler().
- **W28-2 · Café orders** — Using df, scale price and tip to the range 0–1 using MinMaxScaler. Return the two-column numeric array. Practise: fit_transform(), MinMaxScaler().
- **W28-3 · Pet adoption** — Standardise df columns age and weight by subtracting each mean and dividing by its population standard deviation. Return the two-column numeric array in that order.

## W29 — Handle outliers responsibly

Both IQR fences and preservation of raw measurements are in the task.

- **W29-1 · Candy shop · review measurements** — In df, add needs_review: True when price is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df. Practise: quantile().
- **W29-2 · Café orders · review measurements** — In df, add needs_review: True when price is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df. Practise: quantile().
- **W29-3 · Pet adoption · review measurements** — In df, add needs_review: True when age is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df.

## W30 — Vectorise before apply

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **W30-1 · Candy shop** — Using df, add adjusted equal to price multiplied by 1.1, rounded to two decimals. Use a direct column operation. Keep the changes in df and display it. Use vectorised arithmetic; do not use apply().
- **W30-2 · Café orders** — Using df, add adjusted equal to price multiplied by 1.1, rounded to two decimals. Use a direct column operation. Keep the changes in df and display it. Use vectorised arithmetic; do not use apply().
- **W30-3 · Pet adoption** — Using df, add adjusted equal to age multiplied by 1.1, rounded to two decimals. Use a direct column operation. Keep the changes in df and display it.

## WR5 — Review · Prepare responsibly

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **WR5-1 · Pet adoption** — Stack the supplied first and second tables, in that order, with a fresh index. Return the DataFrame.
- **WR5-2 · Pet adoption** — Using df, add half using cut with boundaries 0, 7, and 100; labels "lower" and "upper". Include zero in the first bin. Keep the changes in df and display it. Each interval includes its right boundary.
- **WR5-3 · Pet adoption** — Standardise df columns age and weight by subtracting each mean and dividing by its population standard deviation. Return the two-column numeric array in that order.
- **WR5-4 · Pet adoption · review measurements** — In df, add needs_review: True when age is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df.

## W31 — Wrangle checkpoint

The source df, cleaning order, fields, unknown prices and median assumption are explicit.

- **W31-1 · Messy café orders** — Create clean as a separate copy of df. Remove extra identical rows. Strip and lowercase drink; strip and title-case size. Convert price to numeric and date to datetime, coercing invalid entries. Fill missing tip with the median after deduplication. Sort by order and reset the index. Keep all other values and retain rows with unknown price. Display clean.
- **W31-2 · Messy game sales** — Create clean as a separate copy of df. Remove extra identical rows. Strip and lowercase game; strip and title-case edition. Convert price to numeric and date to datetime, coercing invalid entries. Fill missing discount with the median after deduplication. Sort by order and reset the index. Keep all other values and retain rows with unknown price. Display clean.
- **W31-3 · Messy pet supplies** — Create clean as a separate copy of df. Remove extra identical rows. Strip and lowercase item; strip and title-case package. Convert price to numeric and date to datetime, coercing invalid entries. Fill missing discount with the median after deduplication. Sort by order and reset the index. Keep all other values and retain rows with unknown price. Display clean.

## V01 — Meet Figure and Axes

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V01-1 · Study club** — Create one empty Figure with one Axes at 6 by 4 inches. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Practise: subplots().
- **V01-2 · Weather diary** — Create one empty Figure with one Axes at 6 by 4 inches. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Practise: subplots().
- **V01-3 · Board games** — Create one empty Figure with one Axes at 6 by 4 inches. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show().

## V02 — Finish a chart properly

Tasks now request a scatter explicitly; no hidden supplied-chart assumption.

- **V02-1 · Study club** — Create a scatter plot from df, x=hours, y=score, at 6 by 4 inches. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: set().
- **V02-2 · Weather diary** — Create a scatter plot from df, x=temperature, y=humidity, at 6 by 4 inches. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: set().
- **V02-3 · Board games** — Create a scatter plot from df, x=minutes, y=rating, at 6 by 4 inches. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V03 — Map variables visually

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V03-1 · Study club** — Using df, use sns.scatterplot: x=hours, y=score, hue=club, style=club, size=hours. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V03-2 · Weather diary** — Using df, use sns.scatterplot: x=temperature, y=humidity, hue=sky, style=sky, size=temperature. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V03-3 · Board games** — Using df, draw a scatter plot: x=minutes, y=rating, hue=genre, style=genre, size=minutes. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V04 — Histogram

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V04-1 · Study club** — Using df, use sns.histplot for hours with 4 bins. Title the chart "Study club"; label x "hours" and y "Count". Finish with tight_layout and show. Return the Figure. Practise: histplot().
- **V04-2 · Weather diary** — Using df, use sns.histplot for temperature with 4 bins. Title the chart "Weather diary"; label x "temperature" and y "Count". Finish with tight_layout and show. Return the Figure. Practise: histplot().
- **V04-3 · Board games** — Using df, draw a histogram for minutes with 4 bins. Title the chart "Board games"; label x "minutes" and y "Count". Finish with tight_layout and show. Return the Figure.

## V05 — Density curve

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V05-1 · Study club** — Using df, use sns.kdeplot for hours, with bw_adjust=1 and cut=0. Title the chart "Study club"; label x "hours" and y "Density". Finish with tight_layout and show. Return the Figure. Practise: kdeplot().
- **V05-2 · Weather diary** — Using df, use sns.kdeplot for temperature, with bw_adjust=1 and cut=0. Title the chart "Weather diary"; label x "temperature" and y "Density". Finish with tight_layout and show. Return the Figure. Practise: kdeplot().
- **V05-3 · Board games** — Using df, draw a density curve for minutes, with bw_adjust=1 and cut=0. Title the chart "Board games"; label x "minutes" and y "Density". Finish with tight_layout and show. Return the Figure.

## V06 — ECDF

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V06-1 · Study club** — Using df, use sns.ecdfplot for hours. Title the chart "Study club"; label x "hours" and y "Proportion". Finish with tight_layout and show. Return the Figure. Practise: ecdfplot().
- **V06-2 · Weather diary** — Using df, use sns.ecdfplot for temperature. Title the chart "Weather diary"; label x "temperature" and y "Proportion". Finish with tight_layout and show. Return the Figure. Practise: ecdfplot().
- **V06-3 · Board games** — Using df, draw an ECDF for minutes. Title the chart "Board games"; label x "minutes" and y "Proportion". Finish with tight_layout and show. Return the Figure.

## VR1 — Review · A readable distribution

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR1-1 · Board games** — Create a scatter plot from df, x=minutes, y=rating, at 6 by 4 inches. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR1-2 · Board games** — Using df, draw a histogram for minutes with 4 bins. Title the chart "Board games"; label x "minutes" and y "Count". Finish with tight_layout and show. Return the Figure.
- **VR1-3 · Board games** — Using df, draw an ECDF for minutes. Title the chart "Board games"; label x "minutes" and y "Proportion". Finish with tight_layout and show. Return the Figure.

## V07 — Rug marks

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V07-1 · Study club** — Using df, use a 4-bin sns.histplot of hours, then overlay sns.rugplot for hours on the same ax. Title the chart "Study club"; label x "hours" and y "Count". Finish with tight_layout and show. Return the Figure. Practise: histplot(), rugplot().
- **V07-2 · Weather diary** — Using df, use a 4-bin sns.histplot of temperature, then overlay sns.rugplot for temperature on the same ax. Title the chart "Weather diary"; label x "temperature" and y "Count". Finish with tight_layout and show. Return the Figure. Practise: histplot(), rugplot().
- **V07-3 · Board games** — Using df, use a 4-bin sns.histplot of minutes, then overlay sns.rugplot for minutes on the same ax. Title the chart "Board games"; label x "minutes" and y "Count". Finish with tight_layout and show. Return the Figure.

## V08 — Count categories

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V08-1 · Candy shop** — Using df, use sns.countplot with flavour on x to count its observations. Use title "Candy shop", x label "flavour" and y label "Count". Finish with tight_layout and show. Return the Figure. Practise: countplot().
- **V08-2 · Café orders** — Using df, use sns.countplot with size on x to count its observations. Use title "Café orders", x label "size" and y label "Count". Finish with tight_layout and show. Return the Figure. Practise: countplot().
- **V08-3 · Pet adoption** — Using df, draw category counts with species on x to count its observations. Use title "Pet adoption", x label "species" and y label "Count". Finish with tight_layout and show. Return the Figure.

## V09 — Compare averages

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V09-1 · Candy shop** — Using df, use sns.barplot with flavour on x and price on y, using estimator="mean" and errorbar=None. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: barplot().
- **V09-2 · Café orders** — Using df, use sns.barplot with size on x and price on y, using estimator="mean" and errorbar=None. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: barplot().
- **V09-3 · Pet adoption** — Using df, draw estimated bars with species on x and age on y, using estimator="mean" and errorbar=None. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V10 — Point estimates

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V10-1 · Candy shop** — Using df, use sns.pointplot with flavour on x and price on y, using errorbar="sd" and capsize=0.15. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: pointplot().
- **V10-2 · Café orders** — Using df, use sns.pointplot with size on x and price on y, using errorbar="sd" and capsize=0.15. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: pointplot().
- **V10-3 · Pet adoption** — Using df, draw point estimates with species on x and age on y, using errorbar="sd" and capsize=0.15. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V11 — Box plot

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V11-1 · Candy shop** — Using df, use sns.boxplot with flavour on x and price on y. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: boxplot().
- **V11-2 · Café orders** — Using df, use sns.boxplot with size on x and price on y. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: boxplot().
- **V11-3 · Pet adoption** — Using df, draw a box plot with species on x and age on y. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V12 — Violin plot

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V12-1 · Candy shop** — Using df, use sns.violinplot with flavour on x and price on y, using cut=0. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: violinplot().
- **V12-2 · Café orders** — Using df, use sns.violinplot with size on x and price on y, using cut=0. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: violinplot().
- **V12-3 · Pet adoption** — Using df, draw a violin plot with species on x and age on y, using cut=0. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## VR2 — Review · Counts, averages, spread

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR2-1 · Pet adoption** — Using df, draw category counts with species on x to count its observations. Use title "Pet adoption", x label "species" and y label "Count". Finish with tight_layout and show. Return the Figure.
- **VR2-2 · Pet adoption** — Using df, draw estimated bars with species on x and age on y, using estimator="mean" and errorbar=None. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.
- **VR2-3 · Pet adoption** — Using df, draw a box plot with species on x and age on y. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V13 — Raw points

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V13-1 · Candy shop** — Using df, use sns.stripplot with flavour on x and price on y, using jitter=0.15. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: stripplot().
- **V13-2 · Café orders** — Using df, use sns.stripplot with size on x and price on y, using jitter=0.15. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: stripplot().
- **V13-3 · Pet adoption** — Using df, draw jittered observations with species on x and age on y, using jitter=0.15. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V14 — Non-overlapping raw points

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V14-1 · Candy shop** — Using df, use sns.swarmplot with flavour on x and price on y, using size=5. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: swarmplot().
- **V14-2 · Café orders** — Using df, use sns.swarmplot with size on x and price on y, using size=5. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: swarmplot().
- **V14-3 · Pet adoption** — Using df, draw non-overlapping observations with species on x and age on y, using size=5. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V15 — Large-sample categorical distribution

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V15-1 · Candy shop** — Using df, use sns.boxenplot with flavour on x and price on y. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: boxenplot().
- **V15-2 · Café orders** — Using df, use sns.boxenplot with size on x and price on y. Use title "Café orders", x label "size" and y label "price". Finish with tight_layout and show. Return the Figure. Practise: boxenplot().
- **V15-3 · Pet adoption** — Using df, draw a letter-value plot with species on x and age on y. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.

## V16 — Scatter plot

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V16-1 · Study club** — Using df, use sns.scatterplot for hours against score. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V16-2 · Weather diary** — Using df, use sns.scatterplot for temperature against humidity. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V16-3 · Board games** — Using df, draw a scatter plot for minutes against rating. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V17 — Add dimensions to scatter

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V17-1 · Study club** — Using df, use sns.scatterplot with x=hours, y=score, hue=club, style=club and size=hours. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V17-2 · Weather diary** — Using df, use sns.scatterplot with x=temperature, y=humidity, hue=sky, style=sky and size=temperature. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V17-3 · Board games** — Using df, draw a scatter plot with x=minutes, y=rating, hue=genre, style=genre and size=minutes. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V18 — Line plot

Actual ordered time columns and raw-observation semantics are explicit.

- **V18-1 · Daily sales** — Plot df's sales over day as a line with observation markers ("o") and no aggregation. Use title "Daily sales", x label "day" and y label "sales". Display the Figure. Practise: lineplot().
- **V18-2 · Temperature by hour** — Plot df's temperature over hour as a line with observation markers ("o") and no aggregation. Use title "Temperature by hour", x label "hour" and y label "temperature". Display the Figure. Practise: lineplot().
- **V18-3 · Daily site visits** — Plot df's visits over day as a line with observation markers ("o") and no aggregation. Use title "Daily site visits", x label "day" and y label "visits". Display the Figure.

## VR3 — Review · Points and relationships

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR3-1 · Pet adoption** — Using df, draw jittered observations with species on x and age on y, using jitter=0.15. Use title "Pet adoption", x label "species" and y label "age". Finish with tight_layout and show. Return the Figure.
- **VR3-2 · Board games** — Using df, draw a scatter plot with x=minutes, y=rating, hue=genre, style=genre and size=minutes. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR3-3 · Daily site visits** — Plot df's visits over day as a line with observation markers ("o") and no aggregation. Use title "Daily site visits", x label "day" and y label "visits". Display the Figure.

## V19 — Understand lineplot aggregation

Repeated time measurements support the requested mean and SD band.

- **V19-1 · Daily sales · paired observations** — Using df's paired measurements, plot mean sales at each day, with one-standard-deviation error bands and "o" markers. Use title "Daily sales · paired observations", x label "day", y label "sales"; display the Figure. Practise: lineplot().
- **V19-2 · Temperature by hour · paired observations** — Using df's paired measurements, plot mean temperature at each hour, with one-standard-deviation error bands and "o" markers. Use title "Temperature by hour · paired observations", x label "hour", y label "temperature"; display the Figure. Practise: lineplot().
- **V19-3 · Daily site visits · paired observations** — Using df's paired measurements, plot mean visits at each day, with one-standard-deviation error bands and "o" markers. Use title "Daily site visits · paired observations", x label "day", y label "visits"; display the Figure.

## V20 — Regression view

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V20-1 · Study club** — Using df, use sns.regplot with x=hours, y=score and ci=None. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: regplot().
- **V20-2 · Weather diary** — Using df, use sns.regplot with x=temperature, y=humidity and ci=None. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: regplot().
- **V20-3 · Board games** — Using df, draw a fitted linear trend with observations with x=minutes, y=rating and ci=None. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V21 — Residual view

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V21-1 · Study club** — Using df, use sns.residplot with x=hours and y=score. Title "Study club"; x label "hours"; y label "Residual". Finish with tight_layout and show. Return the Figure. Practise: residplot().
- **V21-2 · Weather diary** — Using df, use sns.residplot with x=temperature and y=humidity. Title "Weather diary"; x label "temperature"; y label "Residual". Finish with tight_layout and show. Return the Figure. Practise: residplot().
- **V21-3 · Board games** — Using df, draw a residual plot with x=minutes and y=rating. Title "Board games"; x label "minutes"; y label "Residual". Finish with tight_layout and show. Return the Figure.

## V22 — Correlation heatmap

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V22-1 · Study club** — Using df, plot sns.heatmap of numeric correlations with annot=True, vmin=-1, vmax=1, center=0 and cmap="vlag". Give the chart title "Study club" and axis labels "Variable" and "Variable". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: heatmap().
- **V22-2 · Weather diary** — Using df, plot sns.heatmap of numeric correlations with annot=True, vmin=-1, vmax=1, center=0 and cmap="vlag". Give the chart title "Weather diary" and axis labels "Variable" and "Variable". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: heatmap().
- **V22-3 · Board games** — Using df, draw a heatmap of numeric correlations with annot=True, vmin=-1, vmax=1, center=0 and cmap="vlag". Give the chart title "Board games" and axis labels "Variable" and "Variable". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V23 — Categorical / matrix heatmap

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V23-1 · Study club** — Using df, build a crosstab of club by group, then sns.heatmap with annot=True, fmt="d", cmap="Blues". Give the chart title "Study club" and axis labels "group" and "club". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: heatmap().
- **V23-2 · Weather diary** — Using df, build a crosstab of sky by station, then sns.heatmap with annot=True, fmt="d", cmap="Blues". Give the chart title "Weather diary" and axis labels "station" and "sky". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: heatmap().
- **V23-3 · Board games** — Using df, build a crosstab of genre by players, then sns.heatmap with annot=True, fmt="d", cmap="Blues". Give the chart title "Board games" and axis labels "players" and "genre". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V24 — Multiple subplots

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V24-1 · Study club** — Using df, create a two-panel Figure: a 4-bin histogram of hours on the left and a scatter of hours against score on the right. Use panel titles "Distribution" and "Relationship", x labels "hours", and y labels "Count" and "score". Finish the Figure with tight_layout and show. Practise: subplots().
- **V24-2 · Weather diary** — Using df, create a two-panel Figure: a 4-bin histogram of temperature on the left and a scatter of temperature against humidity on the right. Use panel titles "Distribution" and "Relationship", x labels "temperature", and y labels "Count" and "humidity". Finish the Figure with tight_layout and show. Practise: subplots().
- **V24-3 · Board games** — Using df, create a two-panel Figure: a 4-bin histogram of minutes on the left and a scatter of minutes against rating on the right. Use panel titles "Distribution" and "Relationship", x labels "minutes", and y labels "Count" and "rating". Finish the Figure with tight_layout and show.

## VR4 — Review · Inspect the model view

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR4-1 · Board games** — Using df, draw a fitted linear trend with observations with x=minutes, y=rating and ci=None. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR4-2 · Board games** — Using df, draw a residual plot with x=minutes and y=rating. Title "Board games"; x label "minutes"; y label "Residual". Finish with tight_layout and show. Return the Figure.
- **VR4-3 · Board games** — Using df, draw a heatmap of numeric correlations with annot=True, vmin=-1, vmax=1, center=0 and cmap="vlag". Give the chart title "Board games" and axis labels "Variable" and "Variable". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR4-4 · Board games** — Using df, create a two-panel Figure: a 4-bin histogram of minutes on the left and a scatter of minutes against rating on the right. Use panel titles "Distribution" and "Relationship", x labels "minutes", and y labels "Count" and "rating". Finish the Figure with tight_layout and show.

## V25 — Legends and palettes

Palette, hue/style order and alpha are stated when checked.

- **V25-1 · Study club** — Using df, plot hours against score with sns.scatterplot, hue=club, style=club and palette="colorblind". Set the legend title to "Category". Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: scatterplot().
- **V25-2 · Weather diary · overlapping observations** — Using df, plot temperature against humidity with sns.scatterplot, hue=sky, style=sky and palette="colorblind". Set the legend title to "Category". Give the chart title "Weather diary · overlapping observations" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Order hue and style categories as ["Cloud","Rain","Sun"] and use alpha=0.6 so overlaps remain visible. Return the Figure. Practise: scatterplot().
- **V25-3 · Board games · overlapping observations** — Using df, plot minutes against rating with sns.scatterplot, hue=genre, style=genre and palette="colorblind". Set the legend title to "Category". Give the chart title "Board games · overlapping observations" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Order hue and style categories as ["Adventure","Puzzle","Strategy"] and use alpha=0.6 so overlaps remain visible. Return the Figure.

## V26 — Axes and scales

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V26-1 · Study club** — Using df, scatter hours against score, set x to log scale, set the y lower limit to zero, and rotate x tick labels by 30 degrees. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: set_xscale().
- **V26-2 · Weather diary** — Using df, scatter temperature against humidity, set x to log scale, set the y lower limit to zero, and rotate x tick labels by 30 degrees. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: set_xscale().
- **V26-3 · Board games** — Using df, scatter minutes against rating, set x to log scale, set the y lower limit to zero, and rotate x tick labels by 30 degrees. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V27 — Reference lines

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V27-1 · Study club** — Using df, scatter hours against score; add dashed reference lines at median hours and median score. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: axhline(), axvline().
- **V27-2 · Weather diary** — Using df, scatter temperature against humidity; add dashed reference lines at median temperature and median humidity. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: axhline(), axvline().
- **V27-3 · Board games** — Using df, scatter minutes against rating; add dashed reference lines at median minutes and median rating. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V28 — Annotate important points

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V28-1 · Study club** — Using df, scatter hours against score. Label the row with highest score "Peak", offset by (8, 8) points, with an arrow. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: annotate().
- **V28-2 · Weather diary** — Using df, scatter temperature against humidity. Label the row with highest humidity "Peak", offset by (8, 8) points, with an arrow. Give the chart title "Weather diary" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: annotate().
- **V28-3 · Board games** — Using df, scatter minutes against rating. Label the row with highest rating "Peak", offset by (8, 8) points, with an arrow. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V29 — Exact precomputed bars

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V29-1 · Candy shop** — Using df, sum price by flavour, then use ax.bar to draw those exact totals. Give the chart title "Candy shop" and axis labels "flavour" and "Total". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: bar().
- **V29-2 · Café orders** — Using df, sum price by size, then use ax.bar to draw those exact totals. Give the chart title "Café orders" and axis labels "size" and "Total". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: bar().
- **V29-3 · Pet adoption** — Using df, sum age by species, then use ax.bar to draw those exact totals. Give the chart title "Pet adoption" and axis labels "species" and "Total". Finish with fig.tight_layout() and plt.show(). Return the Figure.

## V30 — Stacked bars

Actual component columns, baseline component, category order and legend are named.

- **V30-1 · Game sessions** — Use df's actual Solo and Two players counts to draw stacked bars by genre, in table order. Put Solo at the base and Two players above it; label both components in a legend. Title "Game sessions", x label "genre", y label "Count". Display the Figure. Practise: bar().
- **V30-2 · Café drinks sold** — Use df's actual Hot and Iced counts to draw stacked bars by day, in table order. Put Hot at the base and Iced above it; label both components in a legend. Title "Café drinks sold", x label "day", y label "Count". Display the Figure. Practise: bar().
- **V30-3 · Pet supplies sold** — Use df's actual Online and Shop counts to draw stacked bars by item, in table order. Put Online at the base and Shop above it; label both components in a legend. Title "Pet supplies sold", x label "item", y label "Count". Display the Figure.

## VR5 — Review · Finish with a purpose

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR5-1 · Board games · overlapping observations** — Using df, plot minutes against rating with sns.scatterplot, hue=genre, style=genre and palette="colorblind". Set the legend title to "Category". Give the chart title "Board games · overlapping observations" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Order hue and style categories as ["Adventure","Puzzle","Strategy"] and use alpha=0.6 so overlaps remain visible. Return the Figure.
- **VR5-2 · Board games** — Using df, scatter minutes against rating; add dashed reference lines at median minutes and median rating. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR5-3 · Board games** — Using df, scatter minutes against rating. Label the row with highest rating "Peak", offset by (8, 8) points, with an arrow. Give the chart title "Board games" and axis labels "minutes" and "rating". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **VR5-4 · Pet supplies sold** — Use df's actual Online and Shop counts to draw stacked bars by item, in table order. Put Online at the base and Shop above it; label both components in a legend. Title "Pet supplies sold", x label "item", y label "Count". Display the Figure.

## V31 — Pair relationships

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V31-1 · Study club** — Using df, use pairplot for hours and score, hue=club, diag_kind="hist". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure. Practise: pairplot().
- **V31-2 · Weather diary** — Using df, use pairplot for temperature and humidity, hue=sky, diag_kind="hist". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure. Practise: pairplot().
- **V31-3 · Board games** — Using df, use pairplot for minutes and rating, hue=genre, diag_kind="hist". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure.

## V32 — Joint relationships

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V32-1 · Study club** — Using df, use jointplot with x=hours, y=score, kind="scatter". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure. Practise: jointplot().
- **V32-2 · Weather diary** — Using df, use jointplot with x=temperature, y=humidity, kind="scatter". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure. Practise: jointplot().
- **V32-3 · Board games** — Using df, use jointplot with x=minutes, y=rating, kind="scatter". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure.

## V33 — Faceting

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V33-1 · Study club** — Using df, create relplot scatter panels of hours against score, split by club, using height=3. This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure. Practise: relplot().
- **V33-2 · Weather diary** — Using df, use catplot with x="sky", y="temperature", col="station", kind="box", height=3. It creates its own Figure; finish with g.figure.tight_layout() and plt.show(). Practise: catplot().
- **V33-3 · Board games** — Using df, use displot of minutes, split by genre, with kind="hist", bins=4, height=3. Finish the returned Figure and display it.

## V34 — Save a figure

Reviewed all three contexts: column names, operation, output and API requirements match the visible data and solution.

- **V34-1 · Study club** — Using df, scatter hours against score, finish its title and labels, then save chart.png at 150 dpi with a tight bounding box before displaying. Use title "Study club", x label "hours", y label "score". Return the Figure. Practise: savefig().
- **V34-2 · Weather diary** — Using df, scatter temperature against humidity, finish its title and labels, then save chart.png at 150 dpi with a tight bounding box before displaying. Use title "Weather diary", x label "temperature", y label "humidity". Return the Figure. Practise: savefig().
- **V34-3 · Board games** — Using df, scatter minutes against rating, finish its title and labels, then save chart.png at 150 dpi with a tight bounding box before displaying. Use title "Board games", x label "minutes", y label "rating". Return the Figure.

## V35 — Choose the right chart

Questions vary between relationship, distribution and category counts.

- **V35-1 · Study club** — Using df, how does score vary with hours? Build a scatter plot to inspect this numeric relationship. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Return the Figure.
- **V35-2 · Weather diary** — Using df, how are the eight temperatures distributed? Draw a four-bin histogram. Title it "Weather diary" and label the axes "temperature" and "Count". Finish and display the Figure.
- **V35-3 · Movie night** — Using df, which genres occur most often in Movie night? Draw the category counts in their order of first appearance. Title it "Movie night" and label the axes "genre" and "Count". Finish and display the Figure.

## V36 — Avoid misleading charts

Category ordering and zero baseline are explicit.

- **V36-1 · Candy shop** — Using df, sum price by flavour, sort totals from highest to lowest, draw exact bars, and start y at zero. Give the chart title "Candy shop" and axis labels "flavour" and "Total". Finish with fig.tight_layout() and plt.show(). Return the Figure. Practise: bar().
- **V36-2 · Café orders** — Count df rows by size, with categories ordered ["Large","Small"] and the y-axis starting at zero. Title "Café orders", x label "size", y label "Count". Display the Figure. Practise: countplot().
- **V36-3 · Pet adoption** — Count df rows by species, with categories ordered ["Cat","Dog","Rabbit"] and the y-axis starting at zero. Title "Pet adoption", x label "species", y label "Count". Display the Figure.

## VR6 — Review · Figure-level exceptions

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **VR6-1 · Board games** — Using df, use pairplot for minutes and rating, hue=genre, diag_kind="hist". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure.
- **VR6-2 · Board games** — Using df, use jointplot with x=minutes, y=rating, kind="scatter". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Return the Figure.
- **VR6-3 · Board games** — Using df, use displot of minutes, split by genre, with kind="hist", bins=4, height=3. Finish the returned Figure and display it.
- **VR6-4 · Pet adoption** — Count df rows by species, with categories ordered ["Cat","Dog","Rabbit"] and the y-axis starting at zero. Title "Pet adoption", x label "species", y label "Count". Display the Figure.

## V37 — Visualise checkpoint

Retrieval tasks preserve the revised source task requirements; final checkpoints name the required outputs.

- **V37-1 · Study club** — Using df, keep rows with hours greater than 3 in a table named selected. Build three separate Figures: a 4-bin histogram of selected hours; a scatter of selected hours against score; and exact bars of total selected hours by club. Use titles "Distribution", "Relationship", "Totals". Label axes (hours, Count), (hours, score) and (club, Total). Finish and show each Figure.
- **V37-2 · Weather diary** — Using df, keep rows with temperature greater than 24 in a table named selected. Build three separate Figures: a 4-bin histogram of selected temperature; a scatter of selected temperature against humidity; and exact bars of total selected temperature by sky. Use titles "Distribution", "Relationship", "Totals". Label axes (temperature, Count), (temperature, humidity) and (sky, Total). Finish and show each Figure.
- **V37-3 · Board games** — Using df, keep rows with minutes greater than 15 in a table named selected. Build three separate Figures: a 4-bin histogram of selected minutes; a scatter of selected minutes against rating; and exact bars of total selected minutes by genre. Use titles "Distribution", "Relationship", "Totals". Label axes (minutes, Count), (minutes, rating) and (genre, Total). Finish and show each Figure.

