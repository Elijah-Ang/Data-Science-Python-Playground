# Foundations task clarity review

Reviewed 2026-09-17: all 106 cards and 324 exercises. Tasks below are the effective learner-facing content, after editorial refinements.

## I01 — Meet a DataFrame

Build a small table from named columns.

### Follow (I01-1)

Write a dictionary named data using the two columns and four rows in the given table. Import pandas as pd, create df from data, and display df. Practise: DataFrame().

Hint: A dictionary pairs each quoted column name with a list; both lists need the same number of rows.

```python
import pandas as pd

data = {
    "candy": ["Gummy Bear", "Choco Pop", "Mint Bite", "Berry Loop"],
    "price": [1.2, 2.1, 1.5, 2.8],
}

df = pd.DataFrame(data)
df
```

### Change (I01-2)

The supplied café table is going to an accounts colleague. Build df with price first and drink second, keeping every row. Display df.

Hint: Dictionary keys determine the initial column order.

```python
import pandas as pd

data = {
    "price": [6.2, 3.1, 6.8, 2.5],
    "drink": ["Latte", "Tea", "Mocha", "Espresso"],
}
df = pd.DataFrame(data)
df
```

### Transfer (I01-3)

A shelter supplied separate lists named names and ages in the setup code. Build df with columns name and age, pairing items in their supplied order. Display the intake table.

Hint: Use the supplied lists as dictionary values; each position represents the same pet.

```python
import pandas as pd

data = {
    "name": names,
    "age": ages,
}
df = pd.DataFrame(data)
df
```

## I02 — Take the first look

Look at a few rows before making assumptions.

### Follow (I02-1)

Using df, return the first 2 rows of the Candy shop table. Leave the DataFrame as the final expression. Practise: head().

Hint: head starts at the beginning; the number in parentheses limits the rows.

```python
df.head(2)
```

### Change (I02-2)

An import may have been cut short. Display the last two rows of df to inspect its ending.

Hint: The end of a table calls for tail, not head.

```python
df.tail(2)
```

### Transfer (I02-3)

A spot check should include rows from anywhere in df. Display a reproducible sample of three rows using random_state=1.

Hint: A reproducible sample needs both a sample size and a random seed.

```python
df.sample(3, random_state=1)
```

## I01CSV — Load a CSV

Load a file and inspect what arrived.

### Follow (I01CSV-1)

Load the supplied candy.csv into df and display the imported table. Practise: read_csv().

Hint: read_csv returns a DataFrame; assign it before displaying it.

```python
import pandas as pd

df = pd.read_csv("candy.csv")
df
```

### Change (I01CSV-2)

The supplied cafe.csv uses semicolons between fields. Load it into df with the correct separator and display the table with its columns kept separate.

Hint: Check the file preview: the separator is a semicolon, not the default comma.

```python
import pandas as pd

df = pd.read_csv("cafe.csv", sep=";")
df
```

### Transfer (I01CSV-3)

A colleague sent the supplied pets.csv. Load it into a DataFrame and display the first five rows as an intake check.

Hint: Use the import skill with the earlier first-rows inspection skill.

```python
import pandas as pd

pets = pd.read_csv("pets.csv")
pets.head()
```

## I03 — How big is it?

Read the row and column counts.

### Follow (I03-1)

Using df, return the pair (number of rows, number of columns) for Candy shop. Leave the tuple as the final expression. Practise: shape.

Hint: shape is an attribute, so do not add parentheses. Rows come before columns.

```python
df.shape
```

### Change (I03-2)

The import log says the supplied df should contain six orders. Calculate and display its row count to reconcile it with the log.

Hint: len counts records; shape describes both dimensions.

```python
len(df)
```

### Transfer (I03-3)

Load the supplied pets.csv and check its dimensions before preparing a report. Display the complete table’s (rows, columns) pair, not the shape of a preview.

Hint: Inspect the loaded table itself; head() would reduce the row count.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
df.shape
```

## I04 — What columns arrived?

Find the exact column and row labels.

### Follow (I04-1)

Using df, return the column labels of Candy shop in their original order as a list. Practise: columns.

Hint: columns describes fields; index describes row labels.

```python
list(df.columns)
```

### Change (I04-2)

Inspect the row labels of df rather than its column labels. Display them as a list.

Hint: index describes rows; columns describes fields.

```python
list(df.index)
```

### Transfer (I04-3)

A new supplied pets.csv needs a schema check before analysis. Load it into df, then display its column names in file order as a list.

Hint: Read the actual names rather than guessing from the dataset description.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
list(df.columns)
```

## I05 — What types are these?

Distinguish numeric columns from text.

### Follow (I05-1)

Run df.info() to read the overview, then return df.dtypes. Practise: info(), dtypes.

Hint: info prints a report and returns None; dtypes is the Series to leave on the final line.

```python
df.info()
df.dtypes
```

### Change (I05-2)

Before a quick café import check, take the first three records of df and display their dtypes. This checks column types, not whether every value is valid.

Hint: Use dtypes for a returned result; info() prints its overview.

```python
preview = df.head(3)
preview.dtypes
```

### Transfer (I05-3)

Load the supplied pets.csv and display a dtype for every imported column. Keep all records available for later inspection.

Hint: Combine importing with a schema check; do not narrow the table first.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
df.dtypes
```

## IR1 — Review · First contact

Retrieve earlier skills on a fresh table.

### Task 1 (IR1-1)

A spot check should include rows from anywhere in df. Display a reproducible sample of three rows using random_state=1.

Hint: A reproducible sample needs both a sample size and a random seed.

```python
df.sample(3, random_state=1)
```

### Task 2 (IR1-2)

Load the supplied pets.csv and check its dimensions before preparing a report. Display the complete table’s (rows, columns) pair, not the shape of a preview.

Hint: Inspect the loaded table itself; head() would reduce the row count.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
df.shape
```

### Task 3 (IR1-3)

A new supplied pets.csv needs a schema check before analysis. Load it into df, then display its column names in file order as a list.

Hint: Read the actual names rather than guessing from the dataset description.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
list(df.columns)
```

### Task 4 (IR1-4)

Load the supplied pets.csv and display a dtype for every imported column. Keep all records available for later inspection.

Hint: Combine importing with a schema check; do not narrow the table first.

```python
import pandas as pd

df = pd.read_csv("pets.csv")
df.dtypes
```

## I06 — Pick one column

Select one named column as a Series.

### Follow (I06-1)

Using df, return the price column as a Series.

Hint: One quoted column name selects a Series; a list of names selects a DataFrame.

```python
df["price"]
```

### Change (I06-2)

Display tip from only the first two rows of df as a Series.

Hint: Take a preview, then select one column.

```python
df.head(2)["tip"]
```

### Transfer (I06-3)

A handoff needs the last two age measurements with their original row labels. Display a Series from df containing those measurements.

Hint: Choose the end of the table, then the required measurement.

```python
df.tail(2)["age"]
```

## I07 — Pick several columns

Keep a two-dimensional table of selected columns.

### Follow (I07-1)

Using df, return a DataFrame containing rating, then price, in that order.

Hint: The inner brackets make a list; its order controls the output columns.

```python
df[["rating", "price"]]
```

### Change (I07-2)

Display price from df as a one-column DataFrame, not a Series.

Hint: Even one name inside a list keeps a two-dimensional table.

```python
df[["price"]]
```

### Transfer (I07-3)

Create a compact preview of the last two rows of df: show name, then age. Display a DataFrame.

Hint: Combine a row preview with a deliberate column order.

```python
df.tail(2)[["name", "age"]]
```

## I08 — Rows by position

Select rows using their zero-based positions.

### Follow (I08-1)

Using df, use iloc to return the first 2 rows and first two columns. Leave the DataFrame as the final expression. Practise: iloc.

Hint: A positional slice excludes the stop. A second slice after the comma selects columns.

```python
df.iloc[:2, :2]
```

### Change (I08-2)

Display the second and third rows of df, keeping all columns. Select by position.

Hint: Position 1 is the second row; the stop is excluded.

```python
df.iloc[1:3]
```

### Transfer (I08-3)

A preview needs the final two records of df and only its first column, as a DataFrame. Select by position without depending on the row labels.

Hint: Negative positions count from the end; a column slice preserves a DataFrame.

```python
df.iloc[-2:, :1]
```

## I09 — Rows and columns by label

Select named rows and columns with loc.

### Follow (I09-1)

Using df, return labels B through D, including the end label, keeping only price as a one-column DataFrame. Practise: loc.

Hint: A label slice includes its ending label. Keep the column name in a list for a DataFrame.

```python
df.loc["B":"D", ["price"]]
```

### Change (I09-2)

Display only rows labelled B and E from df, with price as a one-column DataFrame. Exclude the labels between them.

Hint: A list chooses separate labels; a slice includes the labels in between.

```python
df.loc[["B", "E"], ["price"]]
```

### Transfer (I09-3)

An audit requests labels F then B, in that order, showing weight then age. Display the requested DataFrame from df.

Hint: Both the row list and column list specify their output order.

```python
df.loc[["F", "B"], ["weight", "age"]]
```

## I10 — Filter rows

Keep rows where a condition is true.

### Follow (I10-1)

Using df, keep every row where price is greater than 2.1. Leave the DataFrame as the final expression.

Hint: The comparison makes a mask; df[mask] selects the rows where it is True.

```python
df[df["price"] > 2.1]
```

### Change (I10-2)

Keep the df rows whose drink is either Latte or Tea, using isin. Return a DataFrame in original row order. Practise: isin().

Hint: isin(["Latte", "Tea"]) creates a membership mask.

```python
df[df["drink"].isin(["Latte", "Tea"])]
```

### Transfer (I10-3)

Return the df rows with age from 2 to 5 inclusive, in their original order. Leave the DataFrame as the final expression.

Hint: between(2, 5) includes both endpoints; two comparisons combined with & also work.

```python
df[df["age"].between(2, 5)]
```

## I11 — Combine conditions

Combine row tests without losing their meaning.

### Follow (I11-1)

Using df, keep rows where price is greater than 2.1 AND flavour equals "fruity". Leave the DataFrame as the final expression.

Hint: Parenthesize each comparison before combining them with &.

```python
df[(df["price"] > 2.1) & (df["flavour"] == "fruity")]
```

### Change (I11-2)

Display df rows where price is above 5 OR size equals "Small". Preserve row order.

Hint: OR keeps a row when either comparison is true.

```python
df[(df["price"] > 5) | (df["size"] == "Small")]
```

### Transfer (I11-3)

A report excludes "Cat" records and needs age from 2 through 5 inclusive. Display matching df rows in their original order.

Hint: Use an exclusion and two inclusive boundaries; all must hold.

```python
df[(df["species"] != "Cat") & (df["age"] >= 2) & (df["age"] <= 5)]
```

## IR2 — Review · Select with intent

Retrieve earlier skills on a fresh table.

### Task 1 (IR2-1)

Create a compact preview of the last two rows of df: show name, then age. Display a DataFrame.

Hint: Combine a row preview with a deliberate column order.

```python
df.tail(2)[["name", "age"]]
```

### Task 2 (IR2-2)

An audit requests labels F then B, in that order, showing weight then age. Display the requested DataFrame from df.

Hint: Both the row list and column list specify their output order.

```python
df.loc[["F", "B"], ["weight", "age"]]
```

### Task 3 (IR2-3)

A report excludes "Cat" records and needs age from 2 through 5 inclusive. Display matching df rows in their original order.

Hint: Use an exclusion and two inclusive boundaries; all must hold.

```python
df[(df["species"] != "Cat") & (df["age"] >= 2) & (df["age"] <= 5)]
```

## I12 — Sort the table

Order filtered rows to answer a question.

### Follow (I12-1)

Using df, keep rows with price greater than 2.1; then sort them from highest to lowest rating. Leave the DataFrame as the final expression. Practise: sort_values().

Hint: Filter first, then sort the remaining whole rows; ascending=False puts the highest first.

```python
filtered = df[df["price"] > 2.1]
filtered.sort_values("rating", ascending=False)
```

### Change (I12-2)

Return all rows of df sorted by tip, smallest first. Leave the DataFrame as the final expression. Practise: sort_values().

Hint: sort_values("rating"), ascending=False, filtered = are the tools to try.

```python
df.sort_values("tip", ascending=True)
```

### Transfer (I12-3)

Return df sorted first by species alphabetically, then by age from oldest to youngest within each species.

Hint: Pass a list of columns and a matching list of ascending flags.

```python
df.sort_values(["species", "age"], ascending=[True, False])
```

## I13 — Find extremes

Ask for the largest or smallest observations.

### Follow (I13-1)

Using df, return the 2 rows with the largest price, highest first. Leave the DataFrame as the final expression. Practise: nlargest().

Hint: The count and ranking column are separate arguments; rank whole rows rather than sorting one Series.

```python
df.nlargest(2, "price")
```

### Change (I13-2)

Display the three df records with the smallest price, smallest first.

Hint: The smallest extreme uses the opposite direction from nlargest.

```python
df.nsmallest(3, "price")
```

### Transfer (I13-3)

Among df records in species="Cat", display the record with the largest age. Keep all columns.

Hint: First define the eligible group, then find its extreme.

```python
df[df["species"] == "Cat"].nlargest(1, "age")
```

## I14 — What values exist?

Find distinct category values.

### Follow (I14-1)

Using df, return the number of distinct non-missing values in flavour. Practise: nunique().

Hint: nunique counts labels; unique returns the labels themselves.

```python
df["flavour"].nunique()
```

### Change (I14-2)

Display the actual distinct size labels in df, in order of appearance, as a list.

Hint: The labels themselves require unique, not their count.

```python
list(df["size"].unique())
```

### Transfer (I14-3)

The shelter needs the species represented among pets aged at least 3 in df. Display the distinct species as a list, in first-appearance order.

Hint: Choose the report population before listing its categories.

```python
eligible = df[df["age"] >= 3]
list(eligible["species"].unique())
```

## I15 — Count categories

Compare category frequencies and proportions.

### Follow (I15-1)

Using df, return the proportion of observations in each flavour category. Leave the Series as the final expression. Practise: value_counts().

Hint: normalize=True changes counts to proportions; missing values are excluded by default.

```python
df["flavour"].value_counts(normalize=True)
```

### Change (I15-2)

Display counts of df records in each size category, largest count first. Show counts rather than proportions.

Hint: Leave normalize off when the question asks how many.

```python
df["size"].value_counts()
```

### Transfer (I15-3)

For df records with age at least 3, display the percentage in each species category, largest first. Percentages should total 100.

Hint: Define the report population before calculating its denominator.

```python
df[df["age"] >= 3]["species"].value_counts(normalize=True) * 100
```

## I16 — Find missing values

Locate gaps before summarising.

### Follow (I16-1)

Using df, return the number of missing values in every column. Leave the Series as the final expression. Practise: isna().

Hint: isna makes the missing mask; sum counts True values down each column.

```python
df.isna().sum()
```

### Change (I16-2)

Compare completeness across columns of df. Display the percentage missing in every column, on a 0–100 scale.

Hint: The mean of a Boolean mask is its fraction of True values.

```python
df.isna().mean() * 100
```

### Transfer (I16-3)

An intake report requires a supplied price but allows other fields to be missing. Display the df rows whose price is present; do not convert or change values yet.

Hint: Inspect the price mask only; present text may still need later validation.

```python
df[~df["price"].isna()]
```

## I17 — Find duplicate rows

Count repeated records without removing anything.

### Follow (I17-1)

Using df, return the number of extra, exactly duplicated rows. Practise: duplicated().

Hint: duplicated marks the extra copies only by default, not the first occurrence.

```python
df.duplicated().sum()
```

### Change (I17-2)

Display the extra exactly duplicated rows of df so they can be inspected, leaving the first copy out. Do not remove anything.

Hint: Use the duplicate mask to select the records, not just count them.

```python
df[df.duplicated()]
```

### Transfer (I17-3)

An auditor wants every row involved in an exact duplicate, including the first occurrence. Display those df rows in original order.

Hint: keep=False marks every member of each duplicate set.

```python
df[df.duplicated(keep=False)]
```

## IR3 — Review · Find the surprises

Retrieve earlier skills on a fresh table.

### Task 1 (IR3-1)

Return df sorted first by species alphabetically, then by age from oldest to youngest within each species.

Hint: Pass a list of columns and a matching list of ascending flags.

```python
df.sort_values(["species", "age"], ascending=[True, False])
```

### Task 2 (IR3-2)

For df records with age at least 3, display the percentage in each species category, largest first. Percentages should total 100.

Hint: Define the report population before calculating its denominator.

```python
df[df["age"] >= 3]["species"].value_counts(normalize=True) * 100
```

### Task 3 (IR3-3)

An intake report requires a supplied price but allows other fields to be missing. Display the df rows whose price is present; do not convert or change values yet.

Hint: Inspect the price mask only; present text may still need later validation.

```python
df[~df["price"].isna()]
```

### Task 4 (IR3-4)

An auditor wants every row involved in an exact duplicate, including the first occurrence. Display those df rows in original order.

Hint: keep=False marks every member of each duplicate set.

```python
df[df.duplicated(keep=False)]
```

## I18 — Describe numeric columns

Read a compact numerical profile.

### Follow (I18-1)

Using df, return describe() for the numeric columns price and rating, in that order. Leave the DataFrame as the final expression. Practise: describe().

Hint: Select the requested numeric columns in the requested order before summarizing.

```python
df[["price", "rating"]].describe()
```

### Change (I18-2)

Display describe() for price alone in df, as a Series.

Hint: Selecting one column first produces a Series summary.

```python
df["price"].describe()
```

### Transfer (I18-3)

Profile age and weight, in that order, only for df records in species="Cat". Display their numeric summary as a DataFrame.

Hint: Filter the population before summarizing its measurements.

```python
df[df["species"] == "Cat"][["age", "weight"]].describe()
```

## I18S — Answer one numerical question

Choose a direct summary for a specific question.

### Follow (I18S-1)

Using df price, calculate the mean price. Leave the numeric result on the final line. Practise: mean().

Hint: mean answers an average question, whereas sum answers a total question.

```python
df["price"].mean()
```

### Change (I18S-2)

Return the total of df["tip"] as one number. Practise: sum().

Hint: Use the isolated syntax and the given table to plan your answer.

```python
df["tip"].sum()
```

### Transfer (I18S-3)

What is the middle age in df? Return one number.

Hint: Use the isolated syntax and the given table to plan your answer.

```python
df["age"].median()
```

## I19 — Summarise groups

Compare a simple average across categories.

### Follow (I19-1)

Using df, return mean price for each flavour category as a Series. Practise: groupby(), agg().

Hint: Group by the category, select the measurement, then aggregate it.

```python
df.groupby("flavour")["price"].agg("mean")
```

### Change (I19-2)

Display total price for each size category in df as a Series, with categories alphabetically ordered.

Hint: An average and a total answer different questions.

```python
df.groupby("size")["price"].sum()
```

### Transfer (I19-3)

For df records with age at least 2, compare average weight by species. Display a Series ordered by category.

Hint: Choose the eligible records, grouping field and measured field separately.

```python
df[df["age"] >= 2].groupby("species")["weight"].mean()
```

## I20 — Compare categories

Count combinations of two categories.

### Follow (I20-1)

Using df, return a crosstab of flavour rows against shelf columns. Leave the DataFrame as the final expression. Practise: crosstab().

Hint: The first crosstab argument labels rows; the second labels columns.

```python
pd.crosstab(df["flavour"], df["shelf"])
```

### Change (I20-2)

Display df category counts with shift on rows and size on columns.

Hint: The first argument sets rows, the second columns.

```python
pd.crosstab(df["shift"], df["size"])
```

### Transfer (I20-3)

For df records with age at least 3, display counts of species rows against room columns.

Hint: Both category Series must come from the same selected records.

```python
selected = df[df["age"] >= 3]
pd.crosstab(selected["species"], selected["room"])
```

## I21 — Inspect numeric relationships

Read correlation as association, not causation.

### Follow (I21-1)

Using df, return the correlation matrix for all numeric columns in Study club. Leave the DataFrame as the final expression. Practise: corr().

Hint: Select numeric measurements and remember that a matrix reports pairwise linear associations.

```python
df.corr(numeric_only=True)
```

### Change (I21-2)

Display the correlation matrix for only temperature and humidity in df, in that order.

Hint: Select the two measurements before calculating the matrix.

```python
df[["temperature", "humidity"]].corr()
```

### Transfer (I21-3)

For games lasting at least 20 minutes in df, inspect the linear association between minutes and rating. Display their correlation matrix in that column order.

Hint: Filter whole records so each pair stays together.

```python
selected = df[df["minutes"] >= 20]
selected[["minutes", "rating"]].corr()
```

## I22 — Inspect checkpoint

Profile an unfamiliar eight-row table from scratch.

### Task 1 (I22-1)

Preserve df; build a dictionary named profile. Add shape (rows, columns), columns (list of names), and types (the dtypes Series). Add missing (missing counts per column) and categories (value_counts for size). Leave profile on the final line to display the dictionary.

Hint: Build the profile dictionary one entry at a time. Inspect df without assigning transformed data back to it.

```python
profile = {
    "shape": df.shape,
    "columns": list(df.columns),
    "types": df.dtypes,
    "missing": df.isna().sum(),
    "categories": df["size"].value_counts(),
}
profile
```

### Task 2 (I22-2)

Using df, prepare a profile of students scoring at least 70. Select hours and score in that order and display their describe() summary. Preserve df.

Hint: Select eligible students before profiling their numeric measurements.

```python
selected = df[df["score"] >= 70]
selected[["hours", "score"]].describe()
```

### Task 3 (I22-3)

Using df, compare average temperature and humidity by sky category for station East only. Display a DataFrame with those two measurement columns in that order and sky labels sorted alphabetically. Preserve df.

Hint: Filter the station, then group its records and average the selected measurements.

```python
selected = df[df["station"] == "East"]
selected.groupby("sky")[["temperature", "humidity"]].mean()
```

## W01 — Protect the original

Make changes on a separate working copy.

### Follow (W01-1)

Prepare a separate price-list copy named clean from df. Keep candy and price in that order; leave the original df intact and display clean. Practise: copy().

Hint: Make the copy before preparing the handoff.

```python
clean = df.copy()
clean = clean[["candy", "price"]]
clean
```

### Change (W01-2)

Prepare a separate clean copy of the supplied café df for a price review. Keep every column and sort whole rows by price, highest first. Preserve df and display clean.

Hint: Sorting the copy must not reorder the original.

```python
clean = df.copy()
clean = clean.sort_values("price", ascending=False)
clean
```

### Transfer (W01-3)

Prepare a separate clean table for species="Cat", ordered by age largest first. Preserve df and display clean.

Hint: Combine copying, filtering and sorting without assigning back to df.

```python
clean = df.copy()
clean = clean[clean["species"] == "Cat"].sort_values("age", ascending=False)
clean
```

## W02 — Rename columns

Give a column a clear name.

### Follow (W02-1)

Rename price to amount in df; keep every other column and row. Keep the changes in df and display it. Practise: rename().

Hint: rename returns a table; assign it back to df to retain the new labels.

```python
df = df.rename(columns={"price": "amount"})
df
```

### Change (W02-2)

The accounts export uses explicit currency labels. In df rename price to price_dollars and tip to tip_dollars. Preserve rows and column order; display df.

Hint: Map existing names to the export schema.

```python
df = df.rename(
    columns={
        "price": "price_dollars",
        "tip": "tip_dollars",
    }
)
df
```

### Transfer (W02-3)

Prepare a two-column shelter handoff from df: name, then age renamed age_years. Display the handoff as df.

Hint: Use a label that communicates the measurement and unit.

```python
df = df[["name", "age"]].rename(columns={"age": "age_years"})
df
```

## W03 — Keep / reorder columns

Choose a deliberate column order.

### Follow (W03-1)

Keep only candy, rating and price, in that order, in df. Keep the changes in df and display it.

Hint: Selecting columns also changes their order; keep all fields requested by the handoff.

```python
df = df[["candy", "rating", "price"]]
df
```

### Change (W03-2)

Keep every column of df, but move price to the front. Preserve the relative order of the other columns and all rows. Display df.

Hint: List the complete desired order, not just the field to move.

```python
df = df[["price", "drink", "size", "tip", "shift"]]
df
```

### Transfer (W03-3)

The handoff includes only species="Cat". Keep name and weight, in that order, in df. Display it.

Hint: Filter while the category column is still available.

```python
df = df[df["species"] == "Cat"][["name", "weight"]]
df
```

## W04 — Drop columns

Remove an explicitly unwanted field.

### Follow (W04-1)

Remove the shelf column from df and preserve every row. Keep the changes in df and display it. Practise: drop().

Hint: Use columns= so drop does not interpret the names as row labels.

```python
df = df.drop(columns=["shelf"])
df
```

### Change (W04-2)

Remove both shift and tip from df; retain every row and remaining column in original order. Display df.

Hint: columns accepts a list of fields to remove.

```python
df = df.drop(columns=["shift", "tip"])
df
```

### Transfer (W04-3)

Prepare a separate clean copy of df without name and room for an anonymous measurement handoff. Preserve df and display clean.

Hint: Decide which object should lose the columns before assigning.

```python
clean = df.copy().drop(columns=["name", "room"])
clean
```

## W05 — Filter unwanted rows

Keep observations using a clear rule.

### Follow (W05-1)

For a report limited to flavour equal to "fruity", keep just those rows in df. Keep the changes in df and display it.

Hint: Build a row mask and assign the selected table back to df.

```python
df = df[df["flavour"] == "fruity"]
df
```

### Change (W05-2)

Keep df rows with price from 3 through 6 inclusive. Preserve all columns and row order; display df.

Hint: Both inclusive boundaries must hold.

```python
df = df[(df["price"] >= 3) & (df["price"] <= 6)]
df
```

### Transfer (W05-3)

Prepare df for a report excluding "Cat" in species. Present remaining rows by age, largest first, and display df.

Hint: Exclusion and presentation order are separate steps.

```python
df = df[df["species"] != "Cat"].sort_values("age", ascending=False)
df
```

## W06 — Sort and reset

Sort records and give the result a simple index.

### Follow (W06-1)

Sort df by price, smallest first, then reset its index without adding a column. Keep the changes in df and display it. Practise: sort_values(), reset_index().

Hint: Sort whole rows before resetting their index; drop=True avoids adding the old labels as a column.

```python
df = df.sort_values("price").reset_index(drop=True)
df
```

### Change (W06-2)

Sort df by price descending, then reset the index while retaining the old labels in a column named index. Display df.

Hint: Omit drop=True when the old row labels are evidence worth keeping.

```python
df = df.sort_values("price", ascending=False).reset_index()
df
```

### Transfer (W06-3)

For species="Cat", keep df rows sorted by weight descending and give them fresh consecutive row labels without an extra column. Display df.

Hint: Reset after filtering and sorting, not before.

```python
df = (
    df[df["species"] == "Cat"]
    .sort_values("weight", ascending=False)
    .reset_index(drop=True)
)
df
```

## WR1 — Review · Keep the evidence

Retrieve earlier skills on a fresh table.

### Task 1 (WR1-1)

Prepare a separate clean table for species="Cat", ordered by age largest first. Preserve df and display clean.

Hint: Combine copying, filtering and sorting without assigning back to df.

```python
clean = df.copy()
clean = clean[clean["species"] == "Cat"].sort_values("age", ascending=False)
clean
```

### Task 2 (WR1-2)

The handoff includes only species="Cat". Keep name and weight, in that order, in df. Display it.

Hint: Filter while the category column is still available.

```python
df = df[df["species"] == "Cat"][["name", "weight"]]
df
```

### Task 3 (WR1-3)

For species="Cat", keep df rows sorted by weight descending and give them fresh consecutive row labels without an extra column. Display df.

Hint: Reset after filtering and sorting, not before.

```python
df = (
    df[df["species"] == "Cat"]
    .sort_values("weight", ascending=False)
    .reset_index(drop=True)
)
df
```

## W07 — Create a numeric column

Calculate a whole column at once.

### Follow (W07-1)

The shop offers a two-item pack of each candy. Using df unit prices, add pair_price equal to twice price. Keep the original columns and display df.

Hint: A two-item pack costs two unit prices under this offer.

```python
df["pair_price"] = df["price"] * 2
df
```

### Change (W07-2)

Add total to df, equal to price plus tip. This exercise assumes these café price and tip columns share currency units. Preserve all other data and display df.

Hint: Column arithmetic aligns measurements row by row.

```python
df["total"] = df["price"] + df["tip"]
df
```

### Transfer (W07-3)

Add age_months to df from age in years (12 months per year). Keep the original age values and all other columns; display df.

Hint: A unit conversion belongs in a new, clearly named column.

```python
df["age_months"] = df["age"] * 12
df
```

## W08 — Create a conditional column

Choose values using a Boolean rule.

### Follow (W08-1)

Using df, add band: "high" when price exceeds 2.1, otherwise "low". Keep the changes in df and display it. Practise: where().

Hint: The first np.where result belongs to True rows; equality does not satisfy a strict > test.

```python
import numpy as np

df["band"] = np.where(df["price"] > 2.1, "high", "low")
df
```

### Change (W08-2)

Add band to df: high if price > 5, middle if price > 3, otherwise low. Preserve all rows and display df.

Hint: np.select uses the first matching condition; put high before middle.

```python
import numpy as np

df["band"] = np.select(
    [df["price"] > 5, df["price"] > 3], ["high", "middle"], default="low"
)
df
```

### Transfer (W08-3)

A care report marks a pet priority only when species is Dog and age is at least 5. Add priority as True/False to df; preserve the data and display df.

Hint: A Boolean condition can itself become the new column.

```python
df["priority"] = (df["species"] == "Dog") & (df["age"] >= 5)
df
```

## W09 — Recode categories

Map known labels and preserve unknown ones deliberately.

### Follow (W09-1)

The supplied catalogue df is adopting the label fruit in place of fruity. Update flavour while retaining all other labels and columns; display df. Practise: replace().

Hint: replace updates the named category without erasing the others.

```python
df["flavour"] = df["flavour"].replace({"fruity": "fruit"})
df
```

### Change (W09-2)

Add code to df using the lookup {"Large": 1}. Unmapped size labels should become missing; preserve the original labels and display df.

Hint: map makes unmatched labels missing; replace would keep them.

```python
df["code"] = df["size"].map({"Large": 1})
df
```

### Transfer (W09-3)

Prepare a separate clean copy of df for a shelter system that uses Feline and Canine instead of Cat and Dog. Recode species, preserving Rabbit and the original df. Display clean.

Hint: Use a recoding method that preserves labels absent from the mapping.

```python
clean = df.copy()
clean["species"] = clean["species"].replace(
    {
        "Cat": "Feline",
        "Dog": "Canine",
    }
)
clean
```

## W10 — Clean text

Remove accidental spaces and inconsistent letter case.

### Follow (W10-1)

Using df, clean drink by trimming spaces and making it lowercase. Clean size by trimming spaces and making it title case. Keep the changes in df and display it. Practise: str.strip(), str.lower(), str.title().

Hint: strip removes edge spaces; changing case alone leaves those spaces intact.

```python
df["drink"] = df["drink"].str.strip().str.lower()
df["size"] = df["size"].str.strip().str.title()
df
```

### Change (W10-2)

In df, trim and lowercase game, then replace literal hyphens with spaces. Trim and title-case edition. Return the updated DataFrame, retaining all rows and other values. Practise: str.strip(), str.lower(), str.title(), str.replace().

Hint: str.replace("-", " ", regex=False) replaces literal hyphens; missing text remains missing.

```python
df["game"] = df["game"].str.strip().str.lower().str.replace("-", " ", regex=False)
df["edition"] = df["edition"].str.strip().str.title()
df
```

### Transfer (W10-3)

Create clean from df. Trim and lowercase item, then display only rows whose cleaned item is food. Preserve df.

Hint: Normalize the text before comparing it with a category label.

```python
clean = df.copy()
clean["item"] = clean["item"].str.strip().str.lower()
clean = clean[clean["item"] == "food"]
clean
```

## W11 — Search / extract text

Select text matches and split structured names.

### Follow (W11-1)

Using df, keep rows whose candy contains the letter "a", ignoring case. Return the filtered DataFrame. Practise: str.contains().

Hint: regex=False makes the pattern literal; na=False keeps missing text out of the matches.

```python
df[df["candy"].str.contains("a", case=False, na=False, regex=False)]
```

### Change (W11-2)

Display df rows whose drink does NOT contain a, ignoring case. Preserve row order.

Hint: Invert the match mask with ~; do not invert the text.

```python
df[~df["drink"].str.contains("a", case=False, na=False, regex=False)]
```

### Transfer (W11-3)

Search name in df for the literal letter e, ignoring case, then display just name and age for matching rows.

Hint: Match records first, then choose the handoff columns.

```python
df[df["name"].str.contains("e", case=False, na=False, regex=False)][["name", "age"]]
```

## W12 — Convert numeric text

Turn numeric-looking strings into usable numbers.

### Follow (W12-1)

Convert price to numeric in df, making invalid text missing. Preserve every row. Keep the changes in df and display it. Practise: to_numeric().

Hint: errors="coerce" creates missing values for invalid strings; it does not repair the original text.

```python
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df
```

### Change (W12-2)

Convert df price text to numbers without overwriting the raw values. Display the number of new missing values caused by invalid text (exclude values already missing).

Hint: Compare the parsed missing mask with the original missing mask.

```python
parsed = pd.to_numeric(df["price"], errors="coerce")
(parsed.isna() & ~df["price"].isna()).sum()
```

### Transfer (W12-3)

Create clean as a copy of df. Add numeric_price parsed from price, then retain only records with numeric_price above 7. Keep raw price and df unchanged; display clean.

Hint: Parse into a separate column so the original text remains inspectable.

```python
clean = df.copy()
clean["numeric_price"] = pd.to_numeric(clean["price"], errors="coerce")
clean = clean[clean["numeric_price"] > 7]
clean
```

## WR2 — Review · Values with meaning

Retrieve earlier skills on a fresh table.

### Task 1 (WR2-1)

Add age_months to df from age in years (12 months per year). Keep the original age values and all other columns; display df.

Hint: A unit conversion belongs in a new, clearly named column.

```python
df["age_months"] = df["age"] * 12
df
```

### Task 2 (WR2-2)

Create clean from df. Trim and lowercase item, then display only rows whose cleaned item is food. Preserve df.

Hint: Normalize the text before comparing it with a category label.

```python
clean = df.copy()
clean["item"] = clean["item"].str.strip().str.lower()
clean = clean[clean["item"] == "food"]
clean
```

### Task 3 (WR2-3)

Create clean as a copy of df. Add numeric_price parsed from price, then retain only records with numeric_price above 7. Keep raw price and df unchanged; display clean.

Hint: Parse into a separate column so the original text remains inspectable.

```python
clean = df.copy()
clean["numeric_price"] = pd.to_numeric(clean["price"], errors="coerce")
clean = clean[clean["numeric_price"] > 7]
clean
```

## W13 — Convert data types

Choose a type that fits the values.

### Follow (W13-1)

Using df, convert flavour to the category dtype without changing its values. Keep the changes in df and display it. Practise: astype().

Hint: category is a dtype, not a command to rename the values.

```python
df["flavour"] = df["flavour"].astype("category")
df
```

### Change (W13-2)

Convert drink in df to pandas string dtype, preserving its values and other columns. Display df.

Hint: Choose the explicit text dtype rather than a categorical type.

```python
df["drink"] = df["drink"].astype("string")
df
```

### Transfer (W13-3)

A handoff requires whole-number ages that can later include missing values. Convert df age to nullable Int64, keep all values and display df.

Hint: Capital I distinguishes nullable Int64 from ordinary int64.

```python
df["age"] = df["age"].astype("Int64")
df
```

## W14 — Parse dates

Convert date text and handle invalid dates visibly.

### Follow (W14-1)

Using df, parse date using year-month-day order. Keep invalid dates as NaT and retain all rows. Keep the changes in df and display it. Practise: to_datetime().

Hint: Parse with the explicit year-month-day format; invalid dates should remain missing.

```python
df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
df
```

### Change (W14-2)

Parse df date without modifying df. Display the original records whose date cannot be parsed in year-month-day format.

Hint: Use the parsed missing mask to retrieve the original evidence.

```python
parsed = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
df[parsed.isna()]
```

### Transfer (W14-3)

Create a separate clean copy of df with parsed dates. Keep only records dated on or after 2026-08-04 and sort them by date ascending. Display clean; preserve df.

Hint: Parse before chronological comparison; invalid dates will not pass.

```python
clean = df.copy()
clean["date"] = pd.to_datetime(clean["date"], format="%Y-%m-%d", errors="coerce")
clean = clean[clean["date"] >= "2026-08-04"].sort_values("date")
clean
```

## W15 — Work with dates

Extract useful calendar features from parsed dates.

### Follow (W15-1)

Using df, parse date, then add year, month and weekday columns. Retain invalid dates as missing. Keep the changes in df and display it. Practise: to_datetime().

Hint: Parse dates before using .dt; year and month have no parentheses, but day_name does.

```python
df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["weekday"] = df["date"].dt.day_name()
df
```

### Change (W15-2)

Parse df date and display weekday counts for valid dates, largest count first. Preserve df.

Hint: Extract weekday names before counting them; missing dates are excluded.

```python
dates = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
dates.dt.day_name().value_counts()
```

### Transfer (W15-3)

A monthly intake report needs a count for each month in df. Parse date, then display counts by month number in ascending order. Preserve df.

Hint: Count month numbers; sorting the index puts the calendar in order.

```python
dates = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")
dates.dt.month.value_counts().sort_index()
```

## W16 — Drop missing rows

Exclude only rows missing a required field.

### Follow (W16-1)

Using df, convert price to numeric, then keep only rows with a known numeric price. Do not require a known tip or date. Keep the changes in df and display it. Practise: to_numeric(), dropna().

Hint: subset names the fields required by this report; unrelated missing fields must not remove a row.

```python
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df = df.dropna(subset=["price"])
df
```

### Change (W16-2)

Parse price as numeric in df. This report requires both a known price and known discount; keep only eligible rows and display df.

Hint: subset can name both fields required for this report.

```python
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df = df.dropna(subset=["price", "discount"])
df
```

### Transfer (W16-3)

Preserve df. A report needs a valid numeric price but accepts missing discounts. Display a dictionary with keys rows (eligible DataFrame, with parsed prices) and excluded (number removed).

Hint: Keep the denominator before filtering; do not drop rows for unrelated gaps.

```python
clean = df.copy()
clean["price"] = pd.to_numeric(clean["price"], errors="coerce")
eligible = clean.dropna(subset=["price"])
{
    "rows": eligible,
    "excluded": len(df) - len(eligible),
}
```

## W17 — Fill missing values

Choose and document an imputation rule.

### Follow (W17-1)

Using df, fill missing tip with the observed median tip, keeping all rows. This is an exercise assumption, not proof of the true tip. Keep the changes in df and display it. Practise: fillna().

Hint: Calculate the observed median before filling; do not replace known values.

```python
df["tip"] = df["tip"].fillna(df["tip"].median())
df
```

### Change (W17-2)

For this exercise only, a missing discount is confirmed to mean no discount. Fill those gaps with zero in df and display it; preserve all known values.

Hint: Use the supplied meaning of missingness, not a habitual default.

```python
df["discount"] = df["discount"].fillna(0)
df
```

### Transfer (W17-3)

Preserve df in a separate clean copy. Add discount_missing to record the original missing mask, then fill missing discount with its observed median. Keep every row; display clean.

Hint: Record the missing mask before replacing the unknown values.

```python
clean = df.copy()
clean["discount_missing"] = clean["discount"].isna()
clean["discount"] = clean["discount"].fillna(clean["discount"].median())
clean
```

## W18 — Remove duplicates

Remove verified extra copies.

### Follow (W18-1)

Using df, remove extra exact duplicate rows and preserve the first occurrence and its index. Keep the changes in df and display it. Practise: drop_duplicates().

Hint: These identical rows are confirmed copies; the default keeps the first one.

```python
df = df.drop_duplicates()
df
```

### Change (W18-2)

The identical extra rows in df are confirmed accidental copies. Keep the last occurrence of each exact row, retaining original indices; display df.

Hint: keep chooses which copy survives, and therefore which original index remains.

```python
df = df.drop_duplicates(keep="last")
df
```

### Transfer (W18-3)

Preserve df. Remove confirmed extra identical rows into a separate clean table, sort by order and give clean a fresh consecutive index. Display clean.

Hint: Deduplicate before assigning new row labels.

```python
clean = df.copy().drop_duplicates().sort_values("order").reset_index(drop=True)
clean
```

## WR3 — Review · Gaps and duplicates

Retrieve earlier skills on a fresh table.

### Task 1 (WR3-1)

Create a separate clean copy of df with parsed dates. Keep only records dated on or after 2026-08-04 and sort them by date ascending. Display clean; preserve df.

Hint: Parse before chronological comparison; invalid dates will not pass.

```python
clean = df.copy()
clean["date"] = pd.to_datetime(clean["date"], format="%Y-%m-%d", errors="coerce")
clean = clean[clean["date"] >= "2026-08-04"].sort_values("date")
clean
```

### Task 2 (WR3-2)

Preserve df. A report needs a valid numeric price but accepts missing discounts. Display a dictionary with keys rows (eligible DataFrame, with parsed prices) and excluded (number removed).

Hint: Keep the denominator before filtering; do not drop rows for unrelated gaps.

```python
clean = df.copy()
clean["price"] = pd.to_numeric(clean["price"], errors="coerce")
eligible = clean.dropna(subset=["price"])
{
    "rows": eligible,
    "excluded": len(df) - len(eligible),
}
```

### Task 3 (WR3-3)

Preserve df in a separate clean copy. Add discount_missing to record the original missing mask, then fill missing discount with its observed median. Keep every row; display clean.

Hint: Record the missing mask before replacing the unknown values.

```python
clean = df.copy()
clean["discount_missing"] = clean["discount"].isna()
clean["discount"] = clean["discount"].fillna(clean["discount"].median())
clean
```

### Task 4 (WR3-4)

Preserve df. Remove confirmed extra identical rows into a separate clean table, sort by order and give clean a fresh consecutive index. Display clean.

Hint: Deduplicate before assigning new row labels.

```python
clean = df.copy().drop_duplicates().sort_values("order").reset_index(drop=True)
clean
```

## W19 — Group and aggregate

Create readable, named group summaries.

### Follow (W19-1)

Using df, group by flavour. Return a DataFrame with flavour, mean_amount (mean price) and records (row count), in that order. Practise: groupby(), agg().

Hint: A named aggregation pairs an input column with an aggregation function; as_index=False keeps group labels as a column.

```python
df.groupby("flavour", as_index=False).agg(
    mean_amount=("price", "mean"), records=("price", "size")
)
```

### Change (W19-2)

Summarise df by size with named columns total (price sum) and n (price count). Keep size as a regular column and groups alphabetically ordered. Display the summary.

Hint: Each named aggregation pairs an input field with a summary operation.

```python
df.groupby("size", as_index=False).agg(total=("price", "sum"), n=("price", "count"))
```

### Transfer (W19-3)

For df records with age at least 2, compare average weight and group size by species. Display columns species, average, n, with groups alphabetically ordered.

Hint: size counts records; count counts known measurements.

```python
df[df["age"] >= 2].groupby("species", as_index=False).agg(
    average=("weight", "mean"), n=("weight", "size")
)
```

## W20 — Groupwise transformation

Add a group statistic beside each original row.

### Follow (W20-1)

Using df, add group_mean containing the mean price for each row’s flavour category. Preserve all rows. Keep the changes in df and display it. Practise: transform().

Hint: transform keeps one result per original row; agg would reduce each group.

```python
df["group_mean"] = df.groupby("flavour")["price"].transform("mean")
df
```

### Change (W20-2)

Add centered to df: each price minus its size group mean. Keep every original row and display df.

Hint: transform repeats each group mean onto its original rows.

```python
df["centered"] = df["price"] - df.groupby("size")["price"].transform("mean")
df
```

### Transfer (W20-3)

Display df records whose age exceeds the mean for their own species category. Preserve the original columns and row order.

Hint: Compare each record with its own group benchmark, not the overall mean.

```python
means = df.groupby("species")["age"].transform("mean")
df[df["age"] > means]
```

## W21 — Build a pivot table

Summarise a measurement across two category axes.

### Follow (W21-1)

Using df, return a pivot table of mean price, with flavour on rows and shelf on columns. Leave absent combinations missing. Leave the DataFrame as the final expression. Practise: pivot_table().

Hint: Choose the row categories, column categories, measured field and aggregation separately.

```python
df.pivot_table(index="flavour", columns="shelf", values="price", aggfunc="mean")
```

### Change (W21-2)

Build a pivot table from df: size on rows, shift on columns, total price in each cell. Leave absent combinations missing.

Hint: Change the aggregation to match a total rather than a mean.

```python
df.pivot_table(index="size", columns="shift", values="price", aggfunc="sum")
```

### Transfer (W21-3)

For df records with age at least 2, show mean weight by species rows and room columns. Preserve missing combinations in the displayed table.

Hint: Define the subset and measurement before choosing the table layout.

```python
df[df["age"] >= 2].pivot_table(
    index="species", columns="room", values="weight", aggfunc="mean"
)
```

## W22 — Wide → long

Turn measurement columns into variable/value rows.

### Follow (W22-1)

Using df, melt price and rating into measure and value columns, retaining candy as the identifier. Leave the DataFrame as the final expression. Practise: melt().

Hint: Identifiers repeat; selected measurement columns become measure/value rows.

```python
df.melt(
    id_vars=["candy"],
    value_vars=["price", "rating"],
    var_name="measure",
    value_name="value",
)
```

### Change (W22-2)

Reshape df to long form using identifiers drink and size, and measurements price then tip. Name the output columns measure and value. Display the long table.

Hint: Multiple identifier fields repeat beside each stacked measurement.

```python
df.melt(
    id_vars=["drink", "size"],
    value_vars=["price", "tip"],
    var_name="measure",
    value_name="value",
)
```

### Transfer (W22-3)

A shelter chart compares age and weight for pets aged at least 2 in df. Filter those records and reshape both measurements into columns name, measure, value. Keep age before weight.

Hint: Keep the measure column so values with different units remain distinguishable.

```python
selected = df[df["age"] >= 2]
selected.melt(
    id_vars=["name"],
    value_vars=["age", "weight"],
    var_name="measure",
    value_name="value",
)
```

## W23 — Long → wide

Reshape unique identifier/measurement pairs.

### Follow (W23-1)

The supplied long table contains candy, measure and value. Pivot it back with candy on rows, measure on columns and value in cells. Leave the DataFrame as the final expression. Practise: pivot().

Hint: pivot needs one value per identifier/measure pair and does not aggregate repeats.

```python
long.pivot(index="candy", columns="measure", values="value")
```

### Change (W23-2)

From the supplied long table, display a wide table with measure on rows and name on columns, using value as the cell contents.

Hint: Swapping index and columns changes orientation without aggregation.

```python
long.pivot(index="measure", columns="name", values="value")
```

### Transfer (W23-3)

The supplied long table contains one measurement per identifier/measure pair. Keep only measure="rating", then display it wide with game on rows.

Hint: Filter long-form records before reshaping.

```python
long[long["measure"] == "rating"].pivot(index="game", columns="measure", values="value")
```

## W24 — Combine tables by keys

Join a lookup table while checking the relationship.

### Follow (W24-1)

Left-join lookup onto df on flavour; retain every df row and use validate="many_to_one". Return the joined DataFrame. Practise: merge().

Hint: A left join retains unmatched observations; validate checks that the lookup key is unique.

```python
df.merge(lookup, on="flavour", how="left", validate="many_to_one")
```

### Change (W24-2)

Inner-join df with lookup on size, keeping only matched rows. Use validate="many_to_one" and return the joined DataFrame. Practise: merge().

Hint: on="size", how="left", validate="many_to_one" are the tools to try.

```python
df.merge(lookup, on="size", how="inner", validate="many_to_one")
```

### Transfer (W24-3)

Audit the supplied lookup: use merge to left-join it to df on species with validate="many_to_one", then display only observations without a matched priority. Keep all joined columns and original row order.

Hint: An inner join would discard the unmatched evidence you need.

```python
joined = df.merge(lookup, on="species", how="left", validate="many_to_one")
joined[joined["priority"].isna()]
```

## WR4 — Review · Reshape and connect

Retrieve earlier skills on a fresh table.

### Task 1 (WR4-1)

For df records with age at least 2, compare average weight and group size by species. Display columns species, average, n, with groups alphabetically ordered.

Hint: size counts records; count counts known measurements.

```python
df[df["age"] >= 2].groupby("species", as_index=False).agg(
    average=("weight", "mean"), n=("weight", "size")
)
```

### Task 2 (WR4-2)

Display df records whose age exceeds the mean for their own species category. Preserve the original columns and row order.

Hint: Compare each record with its own group benchmark, not the overall mean.

```python
means = df.groupby("species")["age"].transform("mean")
df[df["age"] > means]
```

### Task 3 (WR4-3)

A shelter chart compares age and weight for pets aged at least 2 in df. Filter those records and reshape both measurements into columns name, measure, value. Keep age before weight.

Hint: Keep the measure column so values with different units remain distinguishable.

```python
selected = df[df["age"] >= 2]
selected.melt(
    id_vars=["name"],
    value_vars=["age", "weight"],
    var_name="measure",
    value_name="value",
)
```

### Task 4 (WR4-4)

Audit the supplied lookup: use merge to left-join it to df on species with validate="many_to_one", then display only observations without a matched priority. Keep all joined columns and original row order.

Hint: An inner join would discard the unmatched evidence you need.

```python
joined = df.merge(lookup, on="species", how="left", validate="many_to_one")
joined[joined["priority"].isna()]
```

## W25 — Stack datasets

Append compatible observations vertically.

### Follow (W25-1)

Stack the supplied first and second tables, in that order, with a fresh index. Leave the DataFrame as the final expression. Practise: concat().

Hint: concat takes a list of tables; ignore_index makes fresh row labels.

```python
pd.concat([first, second], ignore_index=True)
```

### Change (W25-2)

Two supplied café batches have the same schema. Combine first then second, retaining their original row labels so an import audit can trace each batch’s positions. Each batch starts its row labels at zero; repeated labels are expected in this intermediate result. Display the combined table.

Hint: ignore_index discards source labels; omit it when those labels are needed.

```python
pd.concat([first, second])
```

### Transfer (W25-3)

Combine supplied first and second, then keep records with age above 2. Display them sorted by age, largest first, with a fresh consecutive index.

Hint: Finish filtering and sorting before assigning presentation indices.

```python
combined = pd.concat([first, second], ignore_index=True)
combined[combined["age"] > 2].sort_values("age", ascending=False).reset_index(drop=True)
```

## W26 — Create bins

Turn numbers into labelled intervals.

### Follow (W26-1)

Using df, add half using cut with boundaries 0, 2.1, and 100; labels "lower" and "upper". Include zero in the first bin. Keep the changes in df and display it. Practise: cut(). Each interval includes its right boundary.

Hint: Fixed boundaries and sample quantiles answer different questions; include the lowest boundary explicitly.

```python
df["half"] = pd.cut(
    df["price"], bins=[0, 2.1, 100], labels=["lower", "upper"], include_lowest=True
)
df
```

### Change (W26-2)

Add half to df using two sample-quantile groups of price, labelled lower then upper. Display df.

Hint: Quantile groups target similar counts, unlike fixed value boundaries.

```python
df["half"] = pd.qcut(df["price"], q=2, labels=["lower", "upper"])
df
```

### Transfer (W26-3)

For df age, a care policy defines young as ages 0 through 3 inclusive and older as ages above 3 through 10. Add band with these labels, retain all rows and display df.

Hint: Policy boundaries call for fixed edges rather than sample quantiles.

```python
df["band"] = pd.cut(
    df["age"], bins=[0, 3, 10], labels=["young", "older"], include_lowest=True
)
df
```

## W27 — Encode categories

Represent category membership as indicator columns.

### Follow (W27-1)

One-hot encode flavour in df with integer indicator columns, preserving the other columns. Return the encoded DataFrame. Practise: get_dummies().

Hint: Specify dtype=int for 0/1 indicators rather than Boolean values.

```python
pd.get_dummies(df, columns=["flavour"], dtype=int)
```

### Change (W27-2)

Encode both size and shift in df into integer indicator columns, retaining other fields. Display the encoded table.

Hint: columns can identify more than one categorical field.

```python
pd.get_dummies(df, columns=["size", "shift"], dtype=int)
```

### Transfer (W27-3)

For df records with age at least 3, prepare a table containing age, weight, and integer indicators for species, in that source-column order. Display it.

Hint: Define the population and fields before encoding; this is representation practice, not model fitting.

```python
selected = df[df["age"] >= 3][["age", "weight", "species"]]
pd.get_dummies(selected, columns=["species"], dtype=int)
```

## W28 — Scale numeric columns

Compare standardisation with min–max scaling.

### Follow (W28-1)

Using df, standardise price and rating using StandardScaler. Return the resulting two-column numeric array. Practise: fit_transform(), StandardScaler().

Hint: The scaler needs a two-dimensional selection, even for a single measurement.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
scaler.fit_transform(df[["price", "rating"]])
```

### Change (W28-2)

Using df, scale price and tip to the range 0–1 using MinMaxScaler. Return the two-column numeric array. Practise: fit_transform(), MinMaxScaler().

Hint: from sklearn.preprocessing import StandardScaler, fit_transform(table), df[["price"]] are the tools to try.

```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()
scaler.fit_transform(df[["price", "tip"]])
```

### Transfer (W28-3)

Using df age and weight in that order, fit StandardScaler on the first four rows only. Transform the last two rows with that same fitted scaler and display the two-column numeric array.

Hint: Held-out rows must not influence the fitted mean or scale.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
scaler.fit(df.iloc[:4][["age", "weight"]])
scaler.transform(df.iloc[4:][["age", "weight"]])
```

## W29 — Handle outliers responsibly

Flag unusual values without deleting evidence.

### Follow (W29-1)

In df, add needs_review: True when price is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df. Practise: quantile().

Hint: The distance extends beyond both quartiles; do not mistake Q3 itself for the upper fence.

```python
q1 = df["price"].quantile(0.25)
q3 = df["price"].quantile(0.75)
iqr = q3 - q1
lower = q1 - 1.5 * iqr
upper = q3 + 1.5 * iqr
df["needs_review"] = (df["price"] < lower) | (df["price"] > upper)
df
```

### Change (W29-2)

Screen price in df using Q1 − 1.5×IQR and Q3 + 1.5×IQR. Display only flagged records for investigation, preserving df.

Hint: The mask identifies records to inspect, not records known to be wrong.

```python
q1 = df["price"].quantile(0.25)
q3 = df["price"].quantile(0.75)
iqr = q3 - q1
df[(df["price"] < q1 - 1.5 * iqr) | (df["price"] > q3 + 1.5 * iqr)]
```

### Transfer (W29-3)

Prepare a review list from df: find ages beyond either 1.5×IQR fence, select those records, then display name and age sorted oldest first. Preserve df; a flag is not permission to delete a record.

Hint: Separate detection, record selection and presentation.

```python
q1 = df["age"].quantile(0.25)
q3 = df["age"].quantile(0.75)
iqr = q3 - q1
flagged = df[(df["age"] < q1 - 1.5 * iqr) | (df["age"] > q3 + 1.5 * iqr)]
flagged[["name", "age"]].sort_values("age", ascending=False)
```

## W30 — Vectorise before apply

Choose a simple column operation before a row function.

### Follow (W30-1)

A price revision raises all unit prices in df by 10%. Add adjusted as the revised price rounded to two decimals, preserving the original price. Display df. Use vectorised arithmetic; do not use apply().

Hint: Keep raw and revised prices side by side.

```python
df["adjusted"] = (df["price"] * 1.1).round(2)
df
```

### Change (W30-2)

Add difference to df, equal to price minus its overall mean. Use vectorised arithmetic and display df. Do not use apply().

Hint: A scalar mean broadcasts across the Series; no row function is needed.

```python
df["difference"] = df["price"] - df["price"].mean()
df
```

### Transfer (W30-3)

Add age_months to df and display only name and age_months for pets aged at least 3 years. Keep df otherwise intact.

Hint: Combine a direct unit conversion with filtering and selection.

```python
df["age_months"] = df["age"] * 12
df[df["age"] >= 3][["name", "age_months"]]
```

## WR5 — Review · Prepare responsibly

Retrieve earlier skills on a fresh table.

### Task 1 (WR5-1)

Combine supplied first and second, then keep records with age above 2. Display them sorted by age, largest first, with a fresh consecutive index.

Hint: Finish filtering and sorting before assigning presentation indices.

```python
combined = pd.concat([first, second], ignore_index=True)
combined[combined["age"] > 2].sort_values("age", ascending=False).reset_index(drop=True)
```

### Task 2 (WR5-2)

For df age, a care policy defines young as ages 0 through 3 inclusive and older as ages above 3 through 10. Add band with these labels, retain all rows and display df.

Hint: Policy boundaries call for fixed edges rather than sample quantiles.

```python
df["band"] = pd.cut(
    df["age"], bins=[0, 3, 10], labels=["young", "older"], include_lowest=True
)
df
```

### Task 3 (WR5-3)

Using df age and weight in that order, fit StandardScaler on the first four rows only. Transform the last two rows with that same fitted scaler and display the two-column numeric array.

Hint: Held-out rows must not influence the fitted mean or scale.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
scaler.fit(df.iloc[:4][["age", "weight"]])
scaler.transform(df.iloc[4:][["age", "weight"]])
```

### Task 4 (WR5-4)

Prepare a review list from df: find ages beyond either 1.5×IQR fence, select those records, then display name and age sorted oldest first. Preserve df; a flag is not permission to delete a record.

Hint: Separate detection, record selection and presentation.

```python
q1 = df["age"].quantile(0.25)
q3 = df["age"].quantile(0.75)
iqr = q3 - q1
flagged = df[(df["age"] < q1 - 1.5 * iqr) | (df["age"] > q3 + 1.5 * iqr)]
flagged[["name", "age"]].sort_values("age", ascending=False)
```

## W31 — Wrangle checkpoint

Clean a messy order table end to end.

### Task 1 (W31-1)

Create clean as a separate copy of df. Remove extra identical rows. Strip and lowercase drink; strip and title-case size. Convert price to numeric and date to datetime, coercing invalid entries. Fill missing tip with the median after deduplication. Sort by order and reset the index. Keep all other values and retain rows with unknown price. Display clean.

Hint: Copy first. Remove confirmed duplicate records before calculating the imputation median; preserve unknown prices.

```python
clean = df.copy()
clean = clean.drop_duplicates()
clean["drink"] = clean["drink"].str.strip().str.lower()
clean["size"] = clean["size"].str.strip().str.title()
clean["price"] = pd.to_numeric(clean["price"], errors="coerce")
clean["date"] = pd.to_datetime(clean["date"], format="%Y-%m-%d", errors="coerce")
clean["tip"] = clean["tip"].fillna(clean["tip"].median())
clean = clean.sort_values("order").reset_index(drop=True)
clean
```

### Task 2 (W31-2)

Prepare clean as a separate copy of the supplied game orders df. Remove confirmed exact duplicate rows. Trim and lowercase game, replacing literal hyphens with spaces; trim and title-case edition. Preserve raw price and add numeric_price with invalid text coerced to missing. Parse date with year-month-day format, preserving invalid dates as NaT. Keep only records with a known numeric_price, sort by order and reset the index. Leave df intact and display clean.

Hint: Preserve the raw price before parsing; eligibility depends on numeric_price only.

```python
clean = df.copy().drop_duplicates()
clean["game"] = clean["game"].str.strip().str.lower().str.replace("-", " ", regex=False)
clean["edition"] = clean["edition"].str.strip().str.title()
clean["numeric_price"] = pd.to_numeric(clean["price"], errors="coerce")
clean["date"] = pd.to_datetime(clean["date"], format="%Y-%m-%d", errors="coerce")
clean = (
    clean.dropna(subset=["numeric_price"]).sort_values("order").reset_index(drop=True)
)
clean
```

### Task 3 (W31-3)

Prepare a billing table clean from the supplied pet-supply orders df, preserving df. Remove confirmed exact duplicate rows. Trim and lowercase item and trim and title-case package. Parse price as numeric, then retain rows with known numeric prices. For this billing export a missing discount means no discount; fill it with zero. Both price and discount use the same currency. Add net_price as price minus discount. Display only order, item, package and net_price, sorted by order with a fresh consecutive index.

Hint: Use the stated meaning of missing discount. Filter invalid prices before calculating the billed amount.

```python
clean = df.copy().drop_duplicates()
clean["item"] = clean["item"].str.strip().str.lower()
clean["package"] = clean["package"].str.strip().str.title()
clean["price"] = pd.to_numeric(clean["price"], errors="coerce")
clean = clean.dropna(subset=["price"])
clean["discount"] = clean["discount"].fillna(0)
clean["net_price"] = clean["price"] - clean["discount"]
clean = (
    clean[["order", "item", "package", "net_price"]]
    .sort_values("order")
    .reset_index(drop=True)
)
clean
```

## V35 — Choose a chart for the question

Match the question and variable types before writing plotting code.

### Follow (V35-1)

Using df, which chart would help ask whether students who study longer tend to score higher? Write "scatter", "histogram", "counts" or "line" as your final Python string.

Hint: Identify the two numeric variables.

```python
"scatter"
```

### Change (V35-2)

Using df, which chart would show how temperatures are distributed, without comparing them with humidity? Write "scatter", "histogram", "counts" or "line".

Hint: One numeric variable calls for a distribution view.

```python
"histogram"
```

### Transfer (V35-3)

Using df, a cinema wants to see which genres occur most often. Choose "scatter", "histogram", "counts" or "line". Write the choice as a Python string.

Hint: Genres are categories; the question asks about their frequencies.

```python
"counts"
```

## V01 — Meet Figure and Axes

Create the canvas and the plotting area.

### Follow (V01-1)

Create one empty Figure with one Axes at 6 by 4 inches. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Practise: subplots().

Hint: subplots returns the whole Figure and its Axes; unpack both names.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))

ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

## V16 — Scatter plot

Plot two numeric measurements observation by observation.

### Follow (V16-1)

Using df, use sns.scatterplot for hours against score. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: scatterplot().

Hint: Keep x and y from the same row; one point represents one paired observation.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V16-2)

Using df, plot humidity horizontally against temperature vertically. Each point must represent one record. Use title "Weather diary", x label "humidity" and y label "temperature". Finish with fig.tight_layout() and display with plt.show().

Hint: Changing the question changes both the data mapping and axis labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="humidity", y="temperature", ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="temperature")
fig.tight_layout()
plt.show()
```

### Transfer (V16-3)

Among df games lasting at least 20 minutes, show the relationship between minutes and rating. Choose a chart that preserves the paired observations. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Filter the records first; each displayed point must retain its original x/y pair.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
ax.scatter(selected["minutes"], selected["rating"])
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V02 — Finish a chart properly

Make a chart readable before sharing it.

### Follow (V02-1)

Create a scatter plot from df, x=hours, y=score, at 6 by 4 inches. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: set().

Hint: Axis labels describe the mapped measurements, while the title describes the question.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V02-2)

Using df, make a scatter chart of temperature and humidity. Its title must communicate the question rather than repeat the dataset name. Use title "Does humidity vary with temperature?", x label "Temperature (°C)" and y label "Humidity (%)". Finish with fig.tight_layout() and display with plt.show().

Hint: Units belong in axis labels; title describes the question.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)
ax.set(
    title="Does humidity vary with temperature?",
    xlabel="Temperature (°C)",
    ylabel="Humidity (%)",
)
fig.tight_layout()
plt.show()
```

### Transfer (V02-3)

Using df, show minutes against rating for games lasting at least 20 minutes. Finish the chart so the title states its restricted population. Use title "Games lasting at least 20 minutes", x label "Minutes" and y label "Rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Translate the question into the selected observations and the quantity on each axis.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)
ax.set(title="Games lasting at least 20 minutes", xlabel="Minutes", ylabel="Rating")
fig.tight_layout()
plt.show()
```

## V04 — Histogram

See how values fall into bins.

### Follow (V04-1)

Using df, use sns.histplot for hours with 4 bins. Title the chart "Study club"; label x "hours" and y "Count". Finish with tight_layout and show. Display the chart with plt.show(). Practise: histplot().

Hint: Bins group a numeric measurement; the vertical height here is a count.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=df, x="hours", bins=4, ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Change (V04-2)

Using df, investigate how a coarser bin choice changes the temperature distribution: use two bins. Use title "Weather diary", x label "temperature" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: Bins change how observations are grouped; filtering changes which observations enter the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=df, x="temperature", bins=2, ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Transfer (V04-3)

For df games lasting at least 20 minutes, show the distribution of playing times with three bins. Use title "Board games", x label "minutes" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: Bins change how observations are grouped; filtering changes which observations enter the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.histplot(data=selected, x="minutes", bins=3, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Count")
fig.tight_layout()
plt.show()
```

## V08 — Count categories

Count observations, not a numeric measurement.

### Follow (V08-1)

Using df, use sns.countplot with flavour on x to count its observations. Use title "Candy shop", x label "flavour" and y label "Count". Finish with tight_layout and show. Display the chart with plt.show(). Practise: countplot().

Hint: Category counts use x alone; supplying a numeric y changes the question.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.countplot(data=df, x="flavour", ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Change (V08-2)

Using df, count sky categories in this order: Sun, Cloud, Rain, Snow. Show Snow with zero observations. Use title "Weather diary", x label "sky" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: A missing category must appear in the count index before plotting.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
counts = (
    df["sky"].value_counts().reindex(["Sun", "Cloud", "Rain", "Snow"], fill_value=0)
)
ax.bar(counts.index, counts.values)
ax.set(title="Weather diary", xlabel="sky", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Transfer (V08-3)

Using df, show which game genres occur most often among games lasting at least 20 minutes. Present the genres alphabetically and display one bar per category. Use title "Board games", x label "genre" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: The denominator is the selected games, not all games.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
counts = selected["genre"].value_counts().sort_index()
ax.bar(counts.index, counts.values)
ax.set(title="Board games", xlabel="genre", ylabel="Count")
fig.tight_layout()
plt.show()
```

## VR1 — Review · Choose and build

Use the skills from this chapter in a fresh question.

### Task 1 (VR1-1)

Using df, a cinema wants to see which genres occur most often. Choose "scatter", "histogram", "counts" or "line". Write the choice as a Python string.

Hint: Genres are categories; the question asks about their frequencies.

```python
"counts"
```

### Task 2 (VR1-2)

Among df games lasting at least 20 minutes, show the relationship between minutes and rating. Choose a chart that preserves the paired observations. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Filter the records first; each displayed point must retain its original x/y pair.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
ax.scatter(selected["minutes"], selected["rating"])
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

### Task 3 (VR1-3)

For df games lasting at least 20 minutes, show the distribution of playing times with three bins. Use title "Board games", x label "minutes" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: Bins change how observations are grouped; filtering changes which observations enter the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.histplot(data=selected, x="minutes", bins=3, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Count")
fig.tight_layout()
plt.show()
```

## V18 — Line plot

Connect observations along a meaningful time sequence.

### Follow (V18-1)

Plot df's sales over day as a line with observation markers ("o") and no aggregation. Use title "Daily sales", x label "day" and y label "sales". Display the Figure. Practise: lineplot().

Hint: A line implies order; estimator=None preserves observations instead of averaging repeated times.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.lineplot(data=df, x="day", y="sales", estimator=None, marker="o", ax=ax)
ax.set(title="Daily sales", xlabel="day", ylabel="sales")
fig.tight_layout()
plt.show()
```

### Change (V18-2)

Using df, show only hourly temperature observations from hour 12 onwards in time order. Use a line with markers and no aggregation. Use title "Temperature by hour", x label "hour" and y label "temperature". Finish with fig.tight_layout() and display with plt.show().

Hint: Restrict the time window before connecting observations.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["hour"] >= 12]
sns.lineplot(
    data=selected, x="hour", y="temperature", estimator=None, marker="o", ax=ax
)
ax.set(title="Temperature by hour", xlabel="hour", ylabel="temperature")
fig.tight_layout()
plt.show()
```

### Transfer (V18-3)

Using df, how did visits change over days 2 through 5 inclusive? Connect those ordered observations with a line and markers, without aggregation. Use title "Daily site visits", x label "day" and y label "visits". Finish with fig.tight_layout() and display with plt.show().

Hint: An ordered time question supports connecting neighboring observations.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[(df["day"] >= 2) & (df["day"] <= 5)]
ax.plot(selected["day"], selected["visits"], marker="o")
ax.set(title="Daily site visits", xlabel="day", ylabel="visits")
fig.tight_layout()
plt.show()
```

## V09 — Compare averages

Distinguish an estimate from a count.

### Follow (V09-1)

Using df, use sns.barplot with flavour on x and price on y, using estimator="mean" and errorbar=None. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: barplot().

Hint: The default bar height is a mean, not the number of records.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.barplot(data=df, x="flavour", y="price", estimator="mean", errorbar=None, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V09-2)

Using df, compare median temperature by sky in df, omitting error bars. Use title "Weather diary", x label "sky" and y label "Median temperature". Finish with fig.tight_layout() and display with plt.show().

Hint: The center of interest changed from mean to median.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.barplot(data=df, x="sky", y="temperature", estimator="median", errorbar=None, ax=ax)
ax.set(title="Weather diary", xlabel="sky", ylabel="Median temperature")
fig.tight_layout()
plt.show()
```

### Transfer (V09-3)

Among df games lasting at least 20 minutes, compare mean rating by genre. Omit error bars and order genres alphabetically. Use title "Board games", x label "genre" and y label "Mean rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Calculate the requested group mean before drawing exact bars.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
means = selected.groupby("genre")["rating"].mean()
ax.bar(means.index, means.values)
ax.set(title="Board games", xlabel="genre", ylabel="Mean rating")
fig.tight_layout()
plt.show()
```

## V13 — Raw points

Show the observations behind a group summary.

### Follow (V13-1)

Using df, use sns.stripplot with flavour on x and price on y, using jitter=0.15. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: stripplot().

Hint: Jitter changes sideways placement, not the measured value.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="flavour", y="price", jitter=0.15, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V13-2)

Using df, show every df humidity observation grouped by sky. Turn jitter off to see where observations overlap. Use title "Weather diary", x label "sky" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="sky", y="humidity", jitter=False, ax=ax)
ax.set(title="Weather diary", xlabel="sky", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V13-3)

Using df, show every rating by genre for games lasting at least 20 minutes. Use raw points with jitter=False; keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Retain individual records instead of aggregating their mean.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.stripplot(data=selected, x="genre", y="rating", jitter=False, ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V11 — Box plot

Read a median and interquartile spread.

### Follow (V11-1)

Using df, use sns.boxplot with flavour on x and price on y. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: boxplot().

Hint: Whiskers stop at observed values within the fences; flagged points are not automatically errors.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.boxplot(data=df, x="flavour", y="price", ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V11-2)

Using df, compare df humidity distributions across sky categories using horizontal boxes: humidity on x and sky on y. Use title "Weather diary", x label "humidity" and y label "sky". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.boxplot(data=df, x="humidity", y="sky", ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="sky")
fig.tight_layout()
plt.show()
```

### Transfer (V11-3)

Using df, compare game ratings by genre only for games lasting at least 20 minutes. Use a box plot and keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: A distribution by category differs from one overall rating distribution.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.boxplot(data=selected, x="genre", y="rating", ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V03 — Map variables visually

Use colour to compare categories in a scatter chart.

### Follow (V03-1)

Using df, compare hours and score with club mapped to colour. Keep point sizes and marker shapes constant. Practise: scatterplot(). Use title "Study club", x label "hours" and y label "score". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", hue="club", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V03-2)

Using df, map sky to colour only; keep identical marker shapes and sizes. Use title "Weather diary", x label "temperature" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Map only the channel needed by this question.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="temperature", y="humidity", hue="sky", ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V03-3)

For df games lasting at least 20 minutes, compare minutes and rating with genre mapped to colour. Keep point sizes and shapes constant. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.scatterplot(data=selected, x="minutes", y="rating", hue="genre", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V17 — Add dimensions to scatter

Use colour and shape without losing readability.

### Follow (V17-1)

Using df, use sns.scatterplot with x=hours, y=score, hue=club, style=club and size=hours. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: scatterplot().

Hint: Use the same category for hue and style so colour is not the only cue.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(
    data=df, x="hours", y="score", hue="club", style="club", size="hours", ax=ax
)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V17-2)

Using df, map sky to both colour and marker shape while plotting df humidity horizontally and temperature vertically. Use title "Weather diary", x label "humidity" and y label "temperature". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="humidity", y="temperature", hue="sky", style="sky", ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="temperature")
fig.tight_layout()
plt.show()
```

### Transfer (V17-3)

Using df, compare minutes and rating with players represented by both colour and marker shape. Exclude games lasting under 20 minutes. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Redundant mappings let shape carry information when colour is hard to distinguish.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.scatterplot(
    data=selected, x="minutes", y="rating", hue="players", style="players", ax=ax
)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## VR2 — Review · Compare observations

Use the skills from this chapter in a fresh question.

### Task 1 (VR2-1)

Using df, how did visits change over days 2 through 5 inclusive? Connect those ordered observations with a line and markers, without aggregation. Use title "Daily site visits", x label "day" and y label "visits". Finish with fig.tight_layout() and display with plt.show().

Hint: An ordered time question supports connecting neighboring observations.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[(df["day"] >= 2) & (df["day"] <= 5)]
ax.plot(selected["day"], selected["visits"], marker="o")
ax.set(title="Daily site visits", xlabel="day", ylabel="visits")
fig.tight_layout()
plt.show()
```

### Task 2 (VR2-2)

Among df games lasting at least 20 minutes, compare mean rating by genre. Omit error bars and order genres alphabetically. Use title "Board games", x label "genre" and y label "Mean rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Calculate the requested group mean before drawing exact bars.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
means = selected.groupby("genre")["rating"].mean()
ax.bar(means.index, means.values)
ax.set(title="Board games", xlabel="genre", ylabel="Mean rating")
fig.tight_layout()
plt.show()
```

### Task 3 (VR2-3)

Using df, show every rating by genre for games lasting at least 20 minutes. Use raw points with jitter=False; keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Retain individual records instead of aggregating their mean.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.stripplot(data=selected, x="genre", y="rating", jitter=False, ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V22 — Correlation heatmap

Show a correlation matrix on a fixed colour scale.

### Follow (V22-1)

Using df, plot sns.heatmap of numeric correlations with annot=True, vmin=-1, vmax=1, center=0 and cmap="vlag". Give the chart title "Study club" and axis labels "Variable" and "Variable". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: heatmap().

Hint: Build a correlation matrix first, then keep the colour scale fixed from -1 to 1.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = df.corr(numeric_only=True)
sns.heatmap(matrix, annot=True, vmin=-1, vmax=1, center=0, cmap="vlag", ax=ax)
ax.set(title="Study club", xlabel="Variable", ylabel="Variable")
fig.tight_layout()
plt.show()
```

### Change (V22-2)

Using df, show df correlations for humidity then temperature only. Use annotations, cmap="coolwarm", vmin=-1, vmax=1 and center=0. Use title "Weather diary", x label "Variable" and y label "Variable". Finish with fig.tight_layout() and display with plt.show().

Hint: Select the variables before correlating; keep the signed scale fixed.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = df[["humidity", "temperature"]].corr()
sns.heatmap(matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1, center=0, ax=ax)
ax.set(title="Weather diary", xlabel="Variable", ylabel="Variable")
fig.tight_layout()
plt.show()
```

### Transfer (V22-3)

Using df games lasting at least 20 minutes, show the correlation matrix for minutes and rating, in that order. Annotate values; use cmap="coolwarm", vmin=-1, vmax=1 and center=0. Use title "Board games", x label "Variable" and y label "Variable". Finish with fig.tight_layout() and display with plt.show().

Hint: Correlations must describe the selected population, with a consistent colour scale.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.heatmap(
    selected[["minutes", "rating"]].corr(),
    annot=True,
    cmap="coolwarm",
    vmin=-1,
    vmax=1,
    center=0,
    ax=ax,
)
ax.set(title="Board games", xlabel="Variable", ylabel="Variable")
fig.tight_layout()
plt.show()
```

## V24 — Multiple subplots

Manage two charts on one Figure.

### Follow (V24-1)

Using df, create a two-panel Figure: a 4-bin histogram of hours on the left and a scatter of hours against score on the right. Use panel titles "Distribution" and "Relationship", x labels "hours", and y labels "Count" and "score". Finish the Figure with tight_layout and show. Practise: subplots().

Hint: Pass each chart its own axes[0] or axes[1]; finish the whole Figure once.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.histplot(data=df, x="hours", bins=4, ax=axes[0])
sns.scatterplot(data=df, x="hours", y="score", ax=axes[1])
axes[0].set(title="Distribution", xlabel="hours", ylabel="Count")
axes[1].set(title="Relationship", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V24-2)

Using df, create two panels stacked vertically: a four-bin temperature histogram titled Distribution above a temperature/humidity scatter titled Relationship. Label their axes (temperature, Count) and (temperature, humidity). Use figsize=(6, 8), finish and display the Figure.

Hint: The grid shape changes where the two Axes appear; each still needs its own labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(2, 1, figsize=(6, 8))
sns.histplot(data=df, x="temperature", bins=4, ax=axes[0])
sns.scatterplot(data=df, x="temperature", y="humidity", ax=axes[1])
axes[0].set(title="Distribution", xlabel="temperature", ylabel="Count")
axes[1].set(title="Relationship", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V24-3)

Using df games lasting at least 20 minutes, build a two-panel Figure: a four-bin minutes histogram titled Distribution on the left and minutes/rating scatter titled Relationship on the right. Label axes (minutes, Count) and (minutes, rating), finish and display.

Hint: Both panels must describe the same selected records.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] >= 20]
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.histplot(data=selected, x="minutes", bins=4, ax=axes[0])
sns.scatterplot(data=selected, x="minutes", y="rating", ax=axes[1])
axes[0].set(title="Distribution", xlabel="minutes", ylabel="Count")
axes[1].set(title="Relationship", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V25 — Legends and palettes

Make category mappings readable without colour alone.

### Follow (V25-1)

Using df, plot hours against score with sns.scatterplot, hue=club, style=club and palette="colorblind". Set the legend title to "Category". Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: scatterplot().

Hint: A legend describes the mapped category; redundant shapes help when colour is insufficient.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(
    data=df, x="hours", y="score", hue="club", style="club", palette="colorblind", ax=ax
)
ax.legend(title="Category")
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V25-2)

Using df, plot temperature against humidity with sns.scatterplot, hue=sky, style=sky and palette="colorblind". Set the legend title to "Category". Give the chart title "Weather diary · overlapping observations" and axis labels "temperature" and "humidity". Finish with fig.tight_layout() and plt.show(). Order hue and style categories as ["Cloud","Rain","Sun"] and use alpha=0.6 so overlaps remain visible. Display the chart with plt.show(). Practise: scatterplot().

Hint: palette="colorblind", ax.legend(title=...), style= are the tools to try.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(
    data=df,
    x="temperature",
    y="humidity",
    hue="sky",
    style="sky",
    palette="colorblind",
    hue_order=["Cloud", "Rain", "Sun"],
    style_order=["Cloud", "Rain", "Sun"],
    alpha=0.6,
    ax=ax,
)
ax.legend(title="Category")
ax.set(
    title="Weather diary · overlapping observations",
    xlabel="temperature",
    ylabel="humidity",
)
fig.tight_layout()
plt.show()
```

### Transfer (V25-3)

Using df, map players to both colour and shape for minutes against rating. Use palette="colorblind", alpha=0.6, and legend title Players. Use title "Board games · overlapping observations", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: The legend must describe the mapped field, not a leftover label from another chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(
    data=df,
    x="minutes",
    y="rating",
    hue="players",
    style="players",
    palette="colorblind",
    alpha=0.6,
    ax=ax,
)
ax.legend(title="Players")
ax.set(
    title="Board games · overlapping observations", xlabel="minutes", ylabel="rating"
)
fig.tight_layout()
plt.show()
```

## V26 — Axes and scales

Choose limits, ticks and transformations consciously.

### Follow (V26-1)

The supplied df spans several orders of magnitude in request count. Plot requests against response_ms on a logarithmic x-axis and a linear y-axis starting at zero. Rotate x tick labels by 30 degrees. Practise: set_xscale(). Use title "Service load test", x label "Requests" and y label "Response time (ms)". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="requests", y="response_ms", ax=ax)
ax.set_xscale("log")
ax.set_ylim(bottom=0)
ax.tick_params(axis="x", labelrotation=30)
ax.set(title="Service load test", xlabel="Requests", ylabel="Response time (ms)")
fig.tight_layout()
plt.show()
```

### Change (V26-2)

Prepare the supplied df weather chart for a dashboard using common panel scales: temperature from 20 to 35 °C and humidity from 0 to 100%. Retain all observations. Use title "Weather diary", x label "Temperature (°C)" and y label "Humidity (%)". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)
ax.set_xlim(20, 35)
ax.set_ylim(0, 100)
ax.set(title="Weather diary", xlabel="Temperature (°C)", ylabel="Humidity (%)")
fig.tight_layout()
plt.show()
```

### Transfer (V26-3)

Compare minutes and rating for every game in df on linear axes. Keep the full dataset visible; set the rating axis from 0 to 5, its stated scale. Use title "Board games", x label "minutes" and y label "Rating (0–5)". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="minutes", y="rating", ax=ax)
ax.set_ylim(0, 5)
ax.set(title="Board games", xlabel="minutes", ylabel="Rating (0–5)")
fig.tight_layout()
plt.show()
```

## V27 — Reference lines

Add a benchmark with a clear meaning.

### Follow (V27-1)

Using df, scatter hours against score; add dashed reference lines at median hours and median score. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: axhline(), axvline().

Hint: Horizontal benchmarks use y units and vertical benchmarks use x units.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", ax=ax)
ax.axvline(df["hours"].median(), linestyle="--")
ax.axhline(df["score"].median(), linestyle="--")
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V27-2)

Using df, show df temperature against humidity with just a dashed horizontal line at mean humidity. Use title "Weather diary", x label "temperature" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)
ax.axhline(df["humidity"].mean(), linestyle="--")
ax.set(title="Weather diary", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V27-3)

Using df, plot minutes against rating and mark the care-about threshold rating=4 with a dashed horizontal line. This is a chosen review benchmark, not an estimated mean. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: A y-value benchmark requires a horizontal line.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
ax.scatter(df["minutes"], df["rating"])
ax.axhline(4, linestyle="--")
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## VR3 — Review · Explain the evidence

Use the skills from this chapter in a fresh question.

### Task 1 (VR3-1)

Using df games lasting at least 20 minutes, show the correlation matrix for minutes and rating, in that order. Annotate values; use cmap="coolwarm", vmin=-1, vmax=1 and center=0. Use title "Board games", x label "Variable" and y label "Variable". Finish with fig.tight_layout() and display with plt.show().

Hint: Correlations must describe the selected population, with a consistent colour scale.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.heatmap(
    selected[["minutes", "rating"]].corr(),
    annot=True,
    cmap="coolwarm",
    vmin=-1,
    vmax=1,
    center=0,
    ax=ax,
)
ax.set(title="Board games", xlabel="Variable", ylabel="Variable")
fig.tight_layout()
plt.show()
```

### Task 2 (VR3-2)

Using df games lasting at least 20 minutes, build a two-panel Figure: a four-bin minutes histogram titled Distribution on the left and minutes/rating scatter titled Relationship on the right. Label axes (minutes, Count) and (minutes, rating), finish and display.

Hint: Both panels must describe the same selected records.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] >= 20]
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
sns.histplot(data=selected, x="minutes", bins=4, ax=axes[0])
sns.scatterplot(data=selected, x="minutes", y="rating", ax=axes[1])
axes[0].set(title="Distribution", xlabel="minutes", ylabel="Count")
axes[1].set(title="Relationship", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

### Task 3 (VR3-3)

Using df, plot minutes against rating and mark the care-about threshold rating=4 with a dashed horizontal line. This is a chosen review benchmark, not an estimated mean. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: A y-value benchmark requires a horizontal line.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
ax.scatter(df["minutes"], df["rating"])
ax.axhline(4, linestyle="--")
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V29 — Exact precomputed bars

Draw numbers that have already been calculated.

### Follow (V29-1)

Using df, calculate mean price by flavour in alphabetical order, then draw those exact values as bars. This compares catalogue prices, not sales revenue. Practise: bar(). Use title "Candy shop", x label "flavour" and y label "Mean price". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
means = df.groupby("flavour")["price"].mean()
ax.bar(means.index, means.values)
ax.set(title="Candy shop", xlabel="flavour", ylabel="Mean price")
fig.tight_layout()
plt.show()
```

### Change (V29-2)

Using df, draw exact total tips by size from df, with categories alphabetically ordered. Use title "Café orders", x label "size" and y label "Total tips". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
totals = df.groupby("size")["tip"].sum()
ax.bar(totals.index, totals.values)
ax.set(title="Café orders", xlabel="size", ylabel="Total tips")
fig.tight_layout()
plt.show()
```

### Transfer (V29-3)

Using df, compare average weight by species with exact bars, ordered alphabetically. Calculate the averages yourself before plotting. Use title "Pet adoption", x label "species" and y label "Mean weight". Finish with fig.tight_layout() and display with plt.show().

Hint: Body weights describe individuals; the question asks for a group average.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
means = df.groupby("species")["weight"].mean()
ax.bar(means.index, means.values)
ax.set(title="Pet adoption", xlabel="species", ylabel="Mean weight")
fig.tight_layout()
plt.show()
```

## V34 — Save a figure

Export the specific Figure you have finished.

### Follow (V34-1)

Using df, scatter hours against score, finish its title and labels, then save chart.png at 150 dpi with a tight bounding box before displaying. Use title "Study club", x label "hours", y label "score". Display the chart with plt.show(). Practise: savefig().

Hint: Save the explicit finished Figure before display, with the requested resolution.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
fig.savefig("chart.png", dpi=150, bbox_inches="tight")
plt.show()
```

### Change (V34-2)

Using df, export a four-bin temperature histogram as chart.png at 150 dpi with bbox_inches="tight" before displaying. Use title "Weather diary", x label "temperature" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: Export the finished Figure, including its labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=df, x="temperature", bins=4, ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="Count")
fig.tight_layout()
fig.savefig("chart.png", dpi=150, bbox_inches="tight")
plt.show()
```

### Transfer (V34-3)

For df games lasting at least 20 minutes, make a minutes-versus-rating scatter for a report. Save chart.png at 150 dpi with bbox_inches="tight" before displaying. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
ax.scatter(selected["minutes"], selected["rating"])
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
fig.savefig("chart.png", dpi=150, bbox_inches="tight")
plt.show()
```

## V36 — Avoid misleading charts

Make the scale and selection honest.

### Follow (V36-1)

Using df, compare mean price by flavour as bars, highest mean first. Start the y-axis at zero so lengths represent the price comparison fairly. Practise: bar(). Use title "Candy shop", x label "flavour" and y label "Mean price". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
means = df.groupby("flavour")["price"].mean().sort_values(ascending=False)
ax.bar(means.index, means.values)
ax.set_ylim(bottom=0)
ax.set(title="Candy shop", xlabel="flavour", ylabel="Mean price")
fig.tight_layout()
plt.show()
```

### Change (V36-2)

Using df, compare average price by size as bars ordered alphabetically with a zero baseline. Use title "Café orders", x label "size" and y label "Mean price". Finish with fig.tight_layout() and display with plt.show().

Hint: Bar lengths need a zero baseline; the height must represent the requested mean.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
means = df.groupby("size")["price"].mean()
ax.bar(means.index, means.values)
ax.set_ylim(bottom=0)
ax.set(title="Café orders", xlabel="size", ylabel="Mean price")
fig.tight_layout()
plt.show()
```

### Transfer (V36-3)

A shelter report compares average weight by species in df. Show exact bars ordered alphabetically with a zero baseline, preserving the actual differences. Use title "Pet adoption", x label "species" and y label "Mean weight". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
means = df.groupby("species")["weight"].mean()
ax.bar(means.index, means.values)
ax.set_ylim(bottom=0)
ax.set(title="Pet adoption", xlabel="species", ylabel="Mean weight")
fig.tight_layout()
plt.show()
```

## V37 — Visualise checkpoint

Build a coherent three-chart mini-report.

### Task 1 (V37-1)

Using df, keep rows with hours greater than 3 in selected. Use these same records for all three charts. Figure 1: four-bin histogram of hours. Title Distribution; axis labels hours and Count. Figure 2: scatter of hours against score. Title Relationship; axis labels hours and score. Figure 3: exact bars of total hours by club, with groups alphabetically ordered. Title Totals; axis labels club and Total. Create three separate Figures. Finish each with tight_layout() and display each with plt.show().

Hint: Define selected once, then reuse it for all three Figures. Compute the grouped summary before drawing exact bars.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["hours"] > 3]

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=selected, x="hours", bins=4, ax=ax)
ax.set(title="Distribution", xlabel="hours", ylabel="Count")
fig.tight_layout()
plt.show()

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=selected, x="hours", y="score", ax=ax)
ax.set(title="Relationship", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()

totals = selected.groupby("club")["hours"].sum()
fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(totals.index, totals.values)
ax.set(title="Totals", xlabel="club", ylabel="Total")
fig.tight_layout()
plt.show()
```

### Task 2 (V37-2)

Using df, keep rows with temperature greater than 24 in selected. Use these same records for all three charts. Figure 1: four-bin histogram of temperature. Title Distribution; axis labels temperature and Count. Figure 2: scatter of temperature against humidity. Title Relationship; axis labels temperature and humidity. Figure 3: exact bars of mean temperature by sky, with groups alphabetically ordered. Title Means; axis labels sky and Mean temperature. Create three separate Figures. Finish each with tight_layout() and display each with plt.show().

Hint: Define selected once, then reuse it for all three Figures. Compute the grouped summary before drawing exact bars.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["temperature"] > 24]

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=selected, x="temperature", bins=4, ax=ax)
ax.set(title="Distribution", xlabel="temperature", ylabel="Count")
fig.tight_layout()
plt.show()

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=selected, x="temperature", y="humidity", ax=ax)
ax.set(title="Relationship", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()

totals = selected.groupby("sky")["temperature"].mean()
fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(totals.index, totals.values)
ax.set(title="Means", xlabel="sky", ylabel="Mean temperature")
fig.tight_layout()
plt.show()
```

### Task 3 (V37-3)

Using df, keep rows with minutes greater than 15 in selected. Use these same records for all three charts. Figure 1: four-bin histogram of minutes. Title Distribution; axis labels minutes and Count. Figure 2: scatter of minutes against rating. Title Relationship; axis labels minutes and rating. Figure 3: exact bars of mean minutes by genre, with groups alphabetically ordered. Title Means; axis labels genre and Mean minutes. Create three separate Figures. Finish each with tight_layout() and display each with plt.show().

Hint: Define selected once, then reuse it for all three Figures. Compute the grouped summary before drawing exact bars.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] > 15]

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=selected, x="minutes", bins=4, ax=ax)
ax.set(title="Distribution", xlabel="minutes", ylabel="Count")
fig.tight_layout()
plt.show()

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)
ax.set(title="Relationship", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()

totals = selected.groupby("genre")["minutes"].mean()
fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(totals.index, totals.values)
ax.set(title="Means", xlabel="genre", ylabel="Mean minutes")
fig.tight_layout()
plt.show()
```

## V05 — Density curve

Understand a smoothed view of a distribution.

### Follow (V05-1)

Using df, use sns.kdeplot for hours, with bw_adjust=1 and cut=0. Title the chart "Study club"; label x "hours" and y "Density". Finish with tight_layout and show. Display the chart with plt.show(). Practise: kdeplot().

Hint: Density is not a count. cut=0 prevents the curve extending beyond observed values.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.kdeplot(data=df, x="hours", bw_adjust=1, cut=0, ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="Density")
fig.tight_layout()
plt.show()
```

### Change (V05-2)

Using df, use a density curve for df temperature with bw_adjust=2 and cut=0 to examine stronger smoothing. Use title "Weather diary", x label "temperature" and y label "Density". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.kdeplot(data=df, x="temperature", bw_adjust=2, cut=0, ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="Density")
fig.tight_layout()
plt.show()
```

### Transfer (V05-3)

For df games lasting at least 20 minutes, inspect the distribution of minutes using a KDE with cut=0 and bw_adjust=1. Treat its shape as exploratory. Use title "Board games", x label "minutes" and y label "Density". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.kdeplot(data=selected, x="minutes", cut=0, bw_adjust=1, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Density")
fig.tight_layout()
plt.show()
```

## V06 — ECDF

Read the fraction at or below a value.

### Follow (V06-1)

Using df, use sns.ecdfplot for hours. Title the chart "Study club"; label x "hours" and y "Proportion". Finish with tight_layout and show. Display the chart with plt.show(). Practise: ecdfplot().

Hint: The ECDF height is the fraction at or below the horizontal value.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.ecdfplot(data=df, x="hours", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="Proportion")
fig.tight_layout()
plt.show()
```

### Change (V06-2)

Using df, show the fraction of df humidity observations ABOVE each x value using a complementary ECDF. Use title "Weather diary", x label "humidity" and y label "Proportion above". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.ecdfplot(data=df, x="humidity", complementary=True, ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="Proportion above")
fig.tight_layout()
plt.show()
```

### Transfer (V06-3)

A club needs to see what fraction of df games finish within each duration. Display an ECDF of minutes for games rated at least 4. Use title "Board games", x label "minutes" and y label "Proportion". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["rating"] >= 4]
sns.ecdfplot(data=selected, x="minutes", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Proportion")
fig.tight_layout()
plt.show()
```

## V07 — Rug marks

Keep individual observations visible beneath a distribution.

### Follow (V07-1)

Using df, use a 4-bin sns.histplot of hours, then overlay sns.rugplot for hours on the same ax. Title the chart "Study club"; label x "hours" and y "Count". Finish with tight_layout and show. Display the chart with plt.show(). Practise: histplot(), rugplot().

Hint: Pass the same ax to both calls so the rug marks and distribution share a scale.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.histplot(data=df, x="hours", bins=4, ax=ax)
sns.rugplot(data=df, x="hours", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Change (V07-2)

Using df, show df humidity as a density curve with cut=0, then add rug marks on that same Axes to retain the raw observations. Use title "Weather diary", x label "humidity" and y label "Density". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.kdeplot(data=df, x="humidity", cut=0, ax=ax)
sns.rugplot(data=df, x="humidity", ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="Density")
fig.tight_layout()
plt.show()
```

### Transfer (V07-3)

For df games rated at least 4, show a four-bin histogram of minutes with rug marks on the same Axes so individual durations remain visible. Use title "Board games", x label "minutes" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["rating"] >= 4]
sns.histplot(data=selected, x="minutes", bins=4, ax=ax)
sns.rugplot(data=selected, x="minutes", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Count")
fig.tight_layout()
plt.show()
```

## V10 — Point estimates

Show a group estimate with uncertainty.

### Follow (V10-1)

Using df, use sns.pointplot with flavour on x and price on y, using errorbar="sd" and capsize=0.15. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: pointplot().

Hint: One SD describes spread of observations, not a confidence interval for the mean.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.pointplot(data=df, x="flavour", y="price", errorbar="sd", capsize=0.15, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V10-2)

Using df, compare median humidity by sky in df using points, with no error bars. Use title "Weather diary", x label "sky" and y label "Median humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.pointplot(data=df, x="sky", y="humidity", estimator="median", errorbar=None, ax=ax)
ax.set(title="Weather diary", xlabel="sky", ylabel="Median humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V10-3)

Compare mean game rating by genre in df. Use point estimates with one-standard-deviation error bars and capsize=0.15. Keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "Mean rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.pointplot(data=df, x="genre", y="rating", errorbar="sd", capsize=0.15, ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="Mean rating")
fig.tight_layout()
plt.show()
```

## V12 — Violin plot

Recognise smoothing inside categorical distributions.

### Follow (V12-1)

Using df, use sns.violinplot with flavour on x and price on y, using cut=0. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: violinplot().

Hint: The smooth shape depends on a density estimate; tiny groups do not support strong tail claims.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.violinplot(data=df, x="flavour", y="price", cut=0, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V12-2)

Using df, compare df humidity by sky using violins with cut=0 and inner="point" so the raw measurements remain visible. Use title "Weather diary", x label "sky" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.violinplot(data=df, x="sky", y="humidity", cut=0, inner="point", ax=ax)
ax.set(title="Weather diary", xlabel="sky", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V12-3)

For df games lasting at least 20 minutes, compare ratings by genre with violins, cut=0 and inner="point". Keep categories in first-appearance order and inspect the raw points before interpreting the smooth shape. Use title "Board games", x label "genre" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.violinplot(data=selected, x="genre", y="rating", cut=0, inner="point", ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V14 — Non-overlapping raw points

Separate observations without changing their values.

### Follow (V14-1)

Using df, use sns.swarmplot with flavour on x and price on y, using size=5. Use title "Candy shop", x label "flavour" and y label "price". Finish with tight_layout and show. Display the chart with plt.show(). Practise: swarmplot().

Hint: Swarm packing moves points along the category direction while retaining their measurements.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.swarmplot(data=df, x="flavour", y="price", size=5, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V14-2)

Using df, show every df humidity observation grouped by sky with horizontal swarm spacing: humidity on x and sky on y. Use title "Weather diary", x label "humidity" and y label "sky". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.swarmplot(data=df, x="humidity", y="sky", ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="sky")
fig.tight_layout()
plt.show()
```

### Transfer (V14-3)

For df games lasting at least 20 minutes, show individual ratings by genre with a swarm plot. Keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.swarmplot(data=selected, x="genre", y="rating", size=5, ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V15 — Choose detail to suit the sample

Prefer observed points when groups are too small for tail summaries.

### Follow (V15-1)

Using df, inspect every price by flavour with a strip plot and jitter=False. The catalogue is too small to justify detailed tail estimates. Practise: stripplot(). Use title "Candy shop", x label "flavour" and y label "price". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="flavour", y="price", jitter=False, ax=ax)
ax.set(title="Candy shop", xlabel="flavour", ylabel="price")
fig.tight_layout()
plt.show()
```

### Change (V15-2)

Compare humidity by sky in df using horizontal raw points with jitter=False. Map humidity to x and sky to y. Use title "Weather diary", x label "humidity" and y label "sky". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="humidity", y="sky", jitter=False, ax=ax)
ax.set(title="Weather diary", xlabel="humidity", ylabel="sky")
fig.tight_layout()
plt.show()
```

### Transfer (V15-3)

A shelter has only two pets per species in df. Show every weight by species with raw points and jitter=False, rather than estimating tail shapes. Use title "Pet adoption", x label "species" and y label "weight". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="species", y="weight", jitter=False, ax=ax)
ax.set(title="Pet adoption", xlabel="species", ylabel="weight")
fig.tight_layout()
plt.show()
```

## VR4 — Review · distribution detail

Use the skills from this chapter in a fresh question.

### Task 1 (VR4-1)

For df games lasting at least 20 minutes, inspect the distribution of minutes using a KDE with cut=0 and bw_adjust=1. Treat its shape as exploratory. Use title "Board games", x label "minutes" and y label "Density". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.kdeplot(data=selected, x="minutes", cut=0, bw_adjust=1, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Density")
fig.tight_layout()
plt.show()
```

### Task 2 (VR4-2)

A club needs to see what fraction of df games finish within each duration. Display an ECDF of minutes for games rated at least 4. Use title "Board games", x label "minutes" and y label "Proportion". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["rating"] >= 4]
sns.ecdfplot(data=selected, x="minutes", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Proportion")
fig.tight_layout()
plt.show()
```

### Task 3 (VR4-3)

Compare mean game rating by genre in df. Use point estimates with one-standard-deviation error bars and capsize=0.15. Keep categories in first-appearance order. Use title "Board games", x label "genre" and y label "Mean rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.pointplot(data=df, x="genre", y="rating", errorbar="sd", capsize=0.15, ax=ax)
ax.set(title="Board games", xlabel="genre", ylabel="Mean rating")
fig.tight_layout()
plt.show()
```

### Task 4 (VR4-4)

A shelter has only two pets per species in df. Show every weight by species with raw points and jitter=False, rather than estimating tail shapes. Use title "Pet adoption", x label "species" and y label "weight". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.stripplot(data=df, x="species", y="weight", jitter=False, ax=ax)
ax.set(title="Pet adoption", xlabel="species", ylabel="weight")
fig.tight_layout()
plt.show()
```

## V19 — Understand lineplot aggregation

Notice when a line summarises repeated x values.

### Follow (V19-1)

Using df's paired measurements, plot mean sales at each day, with one-standard-deviation error bands and "o" markers. Use title "Daily sales · paired observations", x label "day", y label "sales"; display the Figure. Practise: lineplot().

Hint: Repeated times are aggregated when estimator is mean; the SD band shows within-time spread.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.lineplot(
    data=df, x="day", y="sales", estimator="mean", errorbar="sd", marker="o", ax=ax
)
ax.set(title="Daily sales · paired observations", xlabel="day", ylabel="sales")
fig.tight_layout()
plt.show()
```

### Change (V19-2)

Using df paired measurements, show just replicate A over hour with markers and no aggregation. Use title "Temperature by hour · paired observations", x label "hour" and y label "temperature". Finish with fig.tight_layout() and display with plt.show().

Hint: Selecting a replicate changes the unit represented by each point.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["replicate"] == "A"]
sns.lineplot(
    data=selected, x="hour", y="temperature", estimator=None, marker="o", ax=ax
)
ax.set(
    title="Temperature by hour · paired observations",
    xlabel="hour",
    ylabel="temperature",
)
fig.tight_layout()
plt.show()
```

### Transfer (V19-3)

From the supplied repeated df visits, show replicate B over day as a line with markers and no aggregation. This report follows one replicate, not a mean across replicates. Use title "Daily site visits · paired observations", x label "day" and y label "visits". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["replicate"] == "B"]
sns.lineplot(data=selected, x="day", y="visits", estimator=None, marker="o", ax=ax)
ax.set(title="Daily site visits · paired observations", xlabel="day", ylabel="visits")
fig.tight_layout()
plt.show()
```

## V20 — Regression view

View a fitted linear trend alongside observations.

### Follow (V20-1)

Using df, use sns.regplot with x=hours, y=score and ci=None. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: regplot().

Hint: ci=None removes the displayed confidence band; it does not make the fit certain.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.regplot(data=df, x="hours", y="score", ci=None, ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V20-2)

Using df, fit and show a linear trend of humidity against temperature for df observations from station East only. Omit the confidence band. Use title "Weather diary", x label "temperature" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["station"] == "East"]
sns.regplot(data=selected, x="temperature", y="humidity", ci=None, ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V20-3)

For df games lasting at least 20 minutes, inspect a linear trend of rating against minutes with the observations and no confidence band. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.regplot(data=selected, x="minutes", y="rating", ci=None, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V21 — Residual view

Inspect what a fitted line leaves unexplained.

### Follow (V21-1)

Using df, use sns.residplot with x=hours and y=score. Title "Study club"; x label "hours"; y label "Residual". Finish with tight_layout and show. Display the chart with plt.show(). Practise: residplot().

Hint: Residuals are observed minus predicted, not the original measured y values.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.residplot(data=df, x="hours", y="score", ax=ax)
ax.set(title="Study club", xlabel="hours", ylabel="Residual")
fig.tight_layout()
plt.show()
```

### Change (V21-2)

Using df, inspect residuals of a linear humidity-versus-temperature fit using df station East observations only. Use title "Weather diary", x label "temperature" and y label "Residual". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["station"] == "East"]
sns.residplot(data=selected, x="temperature", y="humidity", ax=ax)
ax.set(title="Weather diary", xlabel="temperature", ylabel="Residual")
fig.tight_layout()
plt.show()
```

### Transfer (V21-3)

For df games lasting at least 20 minutes, inspect residuals of a linear rating-versus-minutes fit. Keep minutes on x. Use title "Board games", x label "minutes" and y label "Residual". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.residplot(data=selected, x="minutes", y="rating", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Residual")
fig.tight_layout()
plt.show()
```

## V23 — Categorical / matrix heatmap

Prepare a matrix before colouring its cells.

### Follow (V23-1)

Using df, build a crosstab of club by group, then sns.heatmap with annot=True, fmt="d", cmap="Blues". Give the chart title "Study club" and axis labels "group" and "club". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: heatmap().

Hint: A category-count matrix and a measurement-average matrix answer different questions.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = pd.crosstab(df["club"], df["group"])
sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", ax=ax)
ax.set(title="Study club", xlabel="group", ylabel="club")
fig.tight_layout()
plt.show()
```

### Change (V23-2)

Using df, show df counts with station on rows and sky on columns, using annotated integer cells and cmap="Blues". Use title "Weather diary", x label "sky" and y label "station". Finish with fig.tight_layout() and display with plt.show().

Hint: Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = pd.crosstab(df["station"], df["sky"])
sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", ax=ax)
ax.set(title="Weather diary", xlabel="sky", ylabel="station")
fig.tight_layout()
plt.show()
```

### Transfer (V23-3)

Using df, show mean rating for genre rows and players columns. Use an annotated heatmap with fmt=".1f" and cmap="Blues"; leave absent combinations missing. Use title "Board games", x label "players" and y label "genre". Finish with fig.tight_layout() and display with plt.show().

Hint: A crosstab counts; a pivot table with a mean summarizes ratings.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = df.pivot_table(
    index="genre", columns="players", values="rating", aggfunc="mean"
)
sns.heatmap(matrix, annot=True, fmt=".1f", cmap="Blues", ax=ax)
ax.set(title="Board games", xlabel="players", ylabel="genre")
fig.tight_layout()
plt.show()
```

## VR5 — Review · models and matrices

Use the skills from this chapter in a fresh question.

### Task 1 (VR5-1)

From the supplied repeated df visits, show replicate B over day as a line with markers and no aggregation. This report follows one replicate, not a mean across replicates. Use title "Daily site visits · paired observations", x label "day" and y label "visits". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["replicate"] == "B"]
sns.lineplot(data=selected, x="day", y="visits", estimator=None, marker="o", ax=ax)
ax.set(title="Daily site visits · paired observations", xlabel="day", ylabel="visits")
fig.tight_layout()
plt.show()
```

### Task 2 (VR5-2)

For df games lasting at least 20 minutes, inspect a linear trend of rating against minutes with the observations and no confidence band. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.regplot(data=selected, x="minutes", y="rating", ci=None, ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

### Task 3 (VR5-3)

For df games lasting at least 20 minutes, inspect residuals of a linear rating-versus-minutes fit. Keep minutes on x. Use title "Board games", x label "minutes" and y label "Residual". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.residplot(data=selected, x="minutes", y="rating", ax=ax)
ax.set(title="Board games", xlabel="minutes", ylabel="Residual")
fig.tight_layout()
plt.show()
```

### Task 4 (VR5-4)

Using df, show mean rating for genre rows and players columns. Use an annotated heatmap with fmt=".1f" and cmap="Blues"; leave absent combinations missing. Use title "Board games", x label "players" and y label "genre". Finish with fig.tight_layout() and display with plt.show().

Hint: A crosstab counts; a pivot table with a mean summarizes ratings.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
matrix = df.pivot_table(
    index="genre", columns="players", values="rating", aggfunc="mean"
)
sns.heatmap(matrix, annot=True, fmt=".1f", cmap="Blues", ax=ax)
ax.set(title="Board games", xlabel="players", ylabel="genre")
fig.tight_layout()
plt.show()
```

## V28 — Annotate important points

Explain an observation directly on the chart.

### Follow (V28-1)

Using df, scatter hours against score. Label the row with highest score "Peak", offset by (8, 8) points, with an arrow. Give the chart title "Study club" and axis labels "hours" and "score". Finish with fig.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: annotate().

Hint: Find the target row, then use both coordinates from that same row for the annotation.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="hours", y="score", ax=ax)
peak = df.loc[df["score"].idxmax()]
ax.annotate(
    "Peak",
    xy=(peak["hours"], peak["score"]),
    xytext=(8, 8),
    textcoords="offset points",
    arrowprops={"arrowstyle": "->"},
)
ax.set(title="Study club", xlabel="hours", ylabel="score")
fig.tight_layout()
plt.show()
```

### Change (V28-2)

Using df, plot df temperature against humidity and annotate the lowest humidity as "Driest", offset by (8, 8) points with an arrow. Use title "Weather diary", x label "temperature" and y label "humidity". Finish with fig.tight_layout() and display with plt.show().

Hint: Find the minimum of the measured field, then label its paired coordinates.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)
point = df.loc[df["humidity"].idxmin()]
ax.annotate(
    "Driest",
    xy=(point["temperature"], point["humidity"]),
    xytext=(8, 8),
    textcoords="offset points",
    arrowprops={"arrowstyle": "->"},
)
ax.set(title="Weather diary", xlabel="temperature", ylabel="humidity")
fig.tight_layout()
plt.show()
```

### Transfer (V28-3)

Using df games lasting at least 20 minutes, plot minutes against rating. Annotate the highest-rated selected game as Peak, offset (8, 8) points with an arrow. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Find the peak inside the report population, not in the original table.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)
peak = selected.loc[selected["rating"].idxmax()]
ax.annotate(
    "Peak",
    xy=(peak["minutes"], peak["rating"]),
    xytext=(8, 8),
    textcoords="offset points",
    arrowprops={"arrowstyle": "->"},
)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

## V30 — Stacked bars

Build a part-to-whole bar from known components.

### Follow (V30-1)

Use df's actual Solo and Two players counts to draw stacked bars by genre, in table order. Put Solo at the base and Two players above it; label both components in a legend. Title "Game sessions", x label "genre", y label "Count". Display the Figure. Practise: bar().

Hint: The upper bars need bottom equal to the lower component, not zero.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
first = df["Solo"]
second = df["Two players"]
ax.bar(df["genre"], first, label="Solo")
ax.bar(df["genre"], second, bottom=first, label="Two players")
ax.legend()
ax.set(title="Game sessions", xlabel="genre", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Change (V30-2)

Using df, stack Hot counts above Iced counts for each day, in table order. Label the two components in the legend. Use title "Café drinks sold", x label "day" and y label "Count". Finish with fig.tight_layout() and display with plt.show().

Hint: The upper component needs the lower component as its bottom.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(df["day"], df["Iced"], label="Iced")
ax.bar(df["day"], df["Hot"], bottom=df["Iced"], label="Hot")
ax.legend()
ax.set(title="Café drinks sold", xlabel="day", ylabel="Count")
fig.tight_layout()
plt.show()
```

### Transfer (V30-3)

The supplied df contains Online and Shop counts. Compare Shop counts across items using bars with a common zero baseline, in table order. Use title "Pet supplies sold", x label "item" and y label "Shop count". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(df["item"], df["Shop"])
ax.set_ylim(bottom=0)
ax.set(title="Pet supplies sold", xlabel="item", ylabel="Shop count")
fig.tight_layout()
plt.show()
```

## V31 — Pair relationships

Explore several pairwise relationships in one figure.

### Follow (V31-1)

Using df, use pairplot for hours and score, hue=club, diag_kind="hist". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: pairplot().

Hint: pairplot owns its Figure; do not create an extra empty Figure first.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.pairplot(data=df, vars=["hours", "score"], hue="club", diag_kind="hist")
g.figure.tight_layout()
plt.show()
```

### Change (V31-2)

Using df, create a pairplot for humidity then temperature with histogram diagonals, no hue grouping and corner=True to omit mirrored upper panels. Finish g.figure with tight_layout() and display with plt.show().

Hint: The upper and lower panels repeat the same variable pairs with swapped axes.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.pairplot(
    data=df, vars=["humidity", "temperature"], diag_kind="hist", corner=True
)
g.figure.tight_layout()
plt.show()
```

### Transfer (V31-3)

For df games lasting at least 20 minutes, create a pairplot of minutes and rating, with histogram diagonals and no hue grouping. Finish g.figure with tight_layout() and display with plt.show().

Hint: Select the population and variables before creating the grid.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] >= 20]
g = sns.pairplot(data=selected, vars=["minutes", "rating"], diag_kind="hist")
g.figure.tight_layout()
plt.show()
```

## V32 — Joint relationships

Connect a relationship to its marginal distributions.

### Follow (V32-1)

Using df, use jointplot with x=hours, y=score, kind="scatter". This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: jointplot().

Hint: jointplot owns a Figure with a central Axes and marginal Axes.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.jointplot(data=df, x="hours", y="score", kind="scatter")
g.figure.tight_layout()
plt.show()
```

### Change (V32-2)

Using df, create a joint scatter of temperature against humidity. Add a dashed horizontal line at median humidity to the central Axes only. Finish g.figure with tight_layout() and display with plt.show().

Hint: Use g.ax_joint to target the relationship panel without altering the margins.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.jointplot(data=df, x="temperature", y="humidity", kind="scatter")
g.ax_joint.axhline(df["humidity"].median(), linestyle="--")
g.figure.tight_layout()
plt.show()
```

### Transfer (V32-3)

For df games lasting at least 20 minutes, create a joint scatter of minutes against rating. Add a dashed horizontal line at rating 4 to the central Axes only. Finish g.figure with tight_layout() and display with plt.show().

Hint: The reference belongs to the relationship panel, not either marginal distribution.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] >= 20]
g = sns.jointplot(data=selected, x="minutes", y="rating", kind="scatter")
g.ax_joint.axhline(4, linestyle="--")
g.figure.tight_layout()
plt.show()
```

## V33 — Faceting

Repeat the same chart across comparable subsets.

### Follow (V33-1)

Using df, create relplot scatter panels of hours against score, split by club, using height=3. This is a figure-level exception: do not create fig, ax first. Finish with g.figure.tight_layout() and plt.show(). Display the chart with plt.show(). Practise: relplot().

Hint: Figure-level functions create their own panels; height describes each panel.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.relplot(data=df, x="hours", y="score", col="club", kind="scatter", height=3)
g.figure.tight_layout()
plt.show()
```

### Change (V33-2)

Using df, use catplot with x="sky", y="temperature", col="station", kind="box", height=3. It creates its own Figure; finish with g.figure.tight_layout() and plt.show(). Practise: catplot().

Hint: relplot(kind="scatter"), catplot(kind="box"), displot(kind="hist"), col= are the tools to try.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.catplot(data=df, x="sky", y="temperature", col="station", kind="box", height=3)
g.figure.tight_layout()
plt.show()
```

### Transfer (V33-3)

Using df, use displot of minutes, split by genre, with kind="hist", bins=4, height=3. Finish the returned Figure and display it.

Hint: relplot(kind="scatter"), catplot(kind="box"), displot(kind="hist"), col= are the tools to try.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.displot(data=df, x="minutes", col="genre", kind="hist", bins=4, height=3)
g.figure.tight_layout()
plt.show()
```

## VR6 — Review · figures and composition

Use the skills from this chapter in a fresh question.

### Task 1 (VR6-1)

Using df games lasting at least 20 minutes, plot minutes against rating. Annotate the highest-rated selected game as Peak, offset (8, 8) points with an arrow. Use title "Board games", x label "minutes" and y label "rating". Finish with fig.tight_layout() and display with plt.show().

Hint: Find the peak inside the report population, not in the original table.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
selected = df[df["minutes"] >= 20]
sns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)
peak = selected.loc[selected["rating"].idxmax()]
ax.annotate(
    "Peak",
    xy=(peak["minutes"], peak["rating"]),
    xytext=(8, 8),
    textcoords="offset points",
    arrowprops={"arrowstyle": "->"},
)
ax.set(title="Board games", xlabel="minutes", ylabel="rating")
fig.tight_layout()
plt.show()
```

### Task 2 (VR6-2)

The supplied df contains Online and Shop counts. Compare Shop counts across items using bars with a common zero baseline, in table order. Use title "Pet supplies sold", x label "item" and y label "Shop count". Finish with fig.tight_layout() and display with plt.show().

Hint: Choose the observations first, then map the requested measurements to the chart.

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(df["item"], df["Shop"])
ax.set_ylim(bottom=0)
ax.set(title="Pet supplies sold", xlabel="item", ylabel="Shop count")
fig.tight_layout()
plt.show()
```

### Task 3 (VR6-3)

For df games lasting at least 20 minutes, create a pairplot of minutes and rating, with histogram diagonals and no hue grouping. Finish g.figure with tight_layout() and display with plt.show().

Hint: Select the population and variables before creating the grid.

```python
import matplotlib.pyplot as plt
import seaborn as sns

selected = df[df["minutes"] >= 20]
g = sns.pairplot(data=selected, vars=["minutes", "rating"], diag_kind="hist")
g.figure.tight_layout()
plt.show()
```

### Task 4 (VR6-4)

Using df, use displot of minutes, split by genre, with kind="hist", bins=4, height=3. Finish the returned Figure and display it.

Hint: relplot(kind="scatter"), catplot(kind="box"), displot(kind="hist"), col= are the tools to try.

```python
import matplotlib.pyplot as plt
import seaborn as sns

g = sns.displot(data=df, x="minutes", col="genre", kind="hist", bins=4, height=3)
g.figure.tight_layout()
plt.show()
```
