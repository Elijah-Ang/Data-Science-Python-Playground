/* Editorial progression: each round changes the reasoning, not just the nouns. */
(function(root){
'use strict';
function progress(c){
 const L=c.lessons,D=c.datasets,lesson=id=>L.find(l=>l.id===id),clone=x=>JSON.parse(JSON.stringify(x));
 const q=JSON.stringify;
 function revise(id,i,task,solution,hint,options={}){
  const r=lesson(id).rounds[i];
  Object.assign(r,{task,solution,hint,target:'value',strictDtype:false,requiredCalls:[],requiredKeywords:[],forbiddenCalls:[],plot:null,resultKind:'value',starter:i===0?'# Build your answer\n____':'# Write your answer here\n',...options});
  r.demand=options.demand||(i===0?'Follow the technique':i===1?'Adapt a requirement':'Choose and combine');
 }
 const configs={
 I01:[
  d=>['The supplied table has four rows. Construct df with the numeric column first and the name column second. Keep all values and display df.',`import pandas as pd\ndata = ${q({[d.a]:d.columns[d.a],[d.id]:d.columns[d.id]})}\ndf = pd.DataFrame(data)\ndf`,'The order of keys in your dictionary becomes the column order.',{target:'df'}],
  d=>['A colleague typed the four names and measurements into two separate lists. Build the supplied table as df, using variables names and measurements for those lists. Display df.',`import pandas as pd\nnames = ${q(d.columns[d.id])}\nmeasurements = ${q(d.columns[d.a])}\ndata = {${q(d.id)}: names, ${q(d.a)}: measurements}\ndf = pd.DataFrame(data)\ndf`,'A dictionary value can be the name of a list, rather than a list written inside the dictionary.',{target:'df'}]],
 I02:[
  ()=>['An import may have been cut short. Display the last two rows of df to inspect its ending.','df.tail(2)','The end of a table calls for tail, not head.'],
  ()=>['A spot check should include rows from anywhere in df. Display a reproducible sample of three rows using random_state=1.','df.sample(3, random_state=1)','A reproducible sample needs both a sample size and a random seed.']],
 I03:[
  d=>['Predict df.shape by reading the given table. Write your predicted (rows, columns) tuple as the final line; Check answer compares your prediction. No table operation is needed.',`(${Object.values(d.columns)[0].length}, ${Object.keys(d.columns).length})`,'Count data rows separately from column headings.',{demand:'Predict the output'}],
  ()=>['A preview shows only df.head(2). What is the shape of that preview? Calculate and display its (rows, columns) tuple.','df.head(2).shape','shape belongs to the object immediately before it, which can be a preview.']],
 I04:[
  ()=>['Inspect the row labels of df rather than its column labels. Display them as a list.','list(df.index)','index describes rows; columns describes fields.'],
  ()=>['Inspect just the last two records of df. Display their original row labels as a list.','list(df.tail(2).index)','Taking a preview does not renumber its rows.']],
 I05:[
  ()=>['The code result = df.info() prints an overview. What value is stored in result? Write None as a Python value if nothing is returned.','None','Printing an overview and returning an object are different actions.',{demand:'Explain a return value'}],
  d=>[`For a report using only ${d.a}, display that column's dtype. Keep df unchanged.`,`df[${q(d.a)}].dtype`,'A Series has dtype (singular); a DataFrame has dtypes.',{bridge:'df["column"] selects one Series; its dtype attribute describes that one column.'}]],
 I06:[
  d=>[`Display ${d.b} from only the first two rows of df as a Series.`,`df.head(2)[${q(d.b)}]`,'Take a preview, then select one column.'],
  d=>[`A handoff needs the last two ${d.a} measurements with their original row labels. Display a Series from df containing those measurements.`,`df.tail(2)[${q(d.a)}]`,'Choose the end of the table, then the required measurement.']],
 I07:[
  d=>[`Display ${d.a} from df as a one-column DataFrame, not a Series.`,`df[[${q(d.a)}]]`,'Even one name inside a list keeps a two-dimensional table.'],
  d=>[`Create a compact preview of the last two rows of df: show ${d.id}, then ${d.a}. Display a DataFrame.`,`df.tail(2)[${q([d.id,d.a])}]`,'Combine a row preview with a deliberate column order.']],
 I08:[
  ()=>['Display the second and third rows of df, keeping all columns. Select by position.','df.iloc[1:3]','Position 1 is the second row; the stop is excluded.'],
  ()=>['A preview needs the final two records of df and only its first column, as a DataFrame. Select by position without depending on the row labels.','df.iloc[-2:, :1]','Negative positions count from the end; a column slice preserves a DataFrame.',{bridge:'In iloc, -2 means two positions before the end, and -2: keeps those final two rows.'}]],
 I09:[
  d=>[`Display only rows labelled B and E from df, with ${d.a} as a one-column DataFrame. Exclude the labels between them.`,`df.loc[["B", "E"], [${q(d.a)}]]`,'A list chooses separate labels; a slice includes the labels in between.',{bridge:'df.loc[["B", "E"], ["price"]] selects two named rows rather than a continuous slice.'}],
  d=>[`An audit requests labels F then B, in that order, showing ${d.b} then ${d.a}. Display the requested DataFrame from df.`,`df.loc[["F", "B"], ${q([d.b,d.a])}]`,'Both the row list and column list specify their output order.']],
 I10:[null,null],
 I11:[
  d=>[`Display df rows where ${d.a} is above 5 OR ${d.c} equals ${q(d.columns[d.c][1])}. Preserve row order.`,`df[(df[${q(d.a)}] > 5) | (df[${q(d.c)}] == ${q(d.columns[d.c][1])})]`,'OR keeps a row when either comparison is true.'],
  d=>[`A report excludes ${q(d.columns[d.c][0])} records and needs ${d.a} from 2 through 5 inclusive. Display matching df rows in their original order.`,`df[(df[${q(d.c)}] != ${q(d.columns[d.c][0])}) & (df[${q(d.a)}] >= 2) & (df[${q(d.a)}] <= 5)]`,'Use an exclusion and two inclusive boundaries; all must hold.']],
 I12:[null,null],
 I13:[
  d=>[`Display the three df records with the smallest ${d.a}, smallest first.`,`df.nsmallest(3, ${q(d.a)})`,'The smallest extreme uses the opposite direction from nlargest.'],
  d=>[`Among df records in ${d.c}=${q(d.columns[d.c][0])}, display the record with the largest ${d.a}. Keep all columns.`,`df[df[${q(d.c)}] == ${q(d.columns[d.c][0])}].nlargest(1, ${q(d.a)})`,'First define the eligible group, then find its extreme.']],
 I14:[
  d=>[`Display the actual distinct ${d.c} labels in df, in order of appearance, as a list.`,`list(df[${q(d.c)}].unique())`,'The labels themselves require unique, not their count.'],
  d=>[`Do the first three rows of df contain as many distinct ${d.c} values as the whole table? Display a dictionary with keys preview and full containing the two distinct non-missing counts.`,`{"preview": df.head(3)[${q(d.c)}].nunique(), "full": df[${q(d.c)}].nunique()}`,'Compare coverage, not the number of rows.']],
 I15:[
  d=>[`Display counts of df records in each ${d.c} category, largest count first. Show counts rather than proportions.`,`df[${q(d.c)}].value_counts()`,'Leave normalize off when the question asks how many.'],
  d=>[`For df records with ${d.a} at least 3, display the percentage in each ${d.c} category, largest first. Percentages should total 100.`,`df[df[${q(d.a)}] >= 3][${q(d.c)}].value_counts(normalize=True) * 100`,'Define the report population before calculating its denominator.']],
 I16:[
  ()=>['Compare completeness across columns of df. Display the percentage missing in every column, on a 0–100 scale.','df.isna().mean() * 100','The mean of a Boolean mask is its fraction of True values.'],
  ()=>['An intake report requires a supplied price but allows other fields to be missing. Display the df rows whose price is present; do not convert or change values yet.','df[~df["price"].isna()]','Inspect the price mask only; present text may still need later validation.']],
 I17:[
  ()=>['Display the extra exactly duplicated rows of df so they can be inspected, leaving the first copy out. Do not remove anything.','df[df.duplicated()]','Use the duplicate mask to select the records, not just count them.'],
  ()=>['An auditor wants every row involved in an exact duplicate, including the first occurrence. Display those df rows in original order.','df[df.duplicated(keep=False)]','keep=False marks every member of each duplicate set.',{bridge:'duplicated(keep=False) marks all copies; the default marks only later copies.'}]],
 I18:[
  d=>[`Display describe() for ${d.a} alone in df, as a Series.`,`df[${q(d.a)}].describe()`,'Selecting one column first produces a Series summary.'],
  d=>[`Profile ${d.a} and ${d.b}, in that order, only for df records in ${d.c}=${q(d.columns[d.c][0])}. Display their numeric summary as a DataFrame.`,`df[df[${q(d.c)}] == ${q(d.columns[d.c][0])}][${q([d.a,d.b])}].describe()`,'Filter the population before summarizing its measurements.']],
 I18S:[null,null],
 I19:[
  d=>[`Display total ${d.a} for each ${d.c} category in df as a Series, with categories alphabetically ordered.`,`df.groupby(${q(d.c)})[${q(d.a)}].sum()`,'An average and a total answer different questions.'],
  d=>[`For df records with ${d.a} at least 2, compare average ${d.b} by ${d.c}. Display a Series ordered by category.`,`df[df[${q(d.a)}] >= 2].groupby(${q(d.c)})[${q(d.b)}].mean()`,'Choose the eligible records, grouping field and measured field separately.']],
 I20:[
  d=>[`Display df category counts with ${d.d} on rows and ${d.c} on columns.`,`pd.crosstab(df[${q(d.d)}], df[${q(d.c)}])`,'The first argument sets rows, the second columns.'],
  d=>[`For df records with ${d.a} at least 3, display counts of ${d.c} rows against ${d.d} columns.`,`selected = df[df[${q(d.a)}] >= 3]\npd.crosstab(selected[${q(d.c)}], selected[${q(d.d)}])`,'Both category Series must come from the same selected records.']],
 I21:[
  d=>[`Display the correlation matrix for only ${d.a} and ${d.b} in df, in that order.`,`df[${q([d.a,d.b])}].corr()`,'Select the two measurements before calculating the matrix.'],
  ()=>['A colleague says a correlation near zero proves that df has no relationship between its variables. Is that conclusion justified? Write True or False as your final Python value.','False','Correlation measures linear association; a curved pattern can have low correlation.',{demand:'Evaluate an interpretation'}]],
 W01:[
  d=>[`Make clean as a separate copy of df. Keep only ${d.id} and ${d.a} in clean, in that order, while preserving every original df value. Display clean.`,`clean = df.copy()\nclean = clean[${q([d.id,d.a])}]\nclean`,'Copy first; narrowing clean must not narrow df.',{target:'copy'}],
  d=>[`Prepare a separate clean table for ${d.c}=${q(d.columns[d.c][0])}, ordered by ${d.a} largest first. Preserve df and display clean.`,`clean = df.copy()\nclean = clean[clean[${q(d.c)}] == ${q(d.columns[d.c][0])}].sort_values(${q(d.a)}, ascending=False)\nclean`,'Combine copying, filtering and sorting without assigning back to df.',{target:'copy'}]],
 W02:[
  d=>[`Rename ${d.a} to amount and ${d.b} to measure in df. Preserve rows, values and column order. Display df.`,`df = df.rename(columns={${q(d.a)}: "amount", ${q(d.b)}: "measure"})\ndf`,'One rename dictionary can contain multiple old-to-new pairs.',{target:'df'}],
  d=>[`A two-column handoff needs ${d.id}, then ${d.a} renamed amount. Replace df with this handoff table and display it.`,`df = df[${q([d.id,d.a])}].rename(columns={${q(d.a)}: "amount"})\ndf`,'Select the old names before renaming, or select the new names afterwards.',{target:'df'}]],
 W03:[
  d=>[`Keep every column of df, but move ${d.a} to the front. Preserve the relative order of the other columns and all rows. Display df.`,`df = df[${q([d.a,...Object.keys(d.columns).filter(k=>k!==d.a)])}]\ndf`,'List the complete desired order, not just the field to move.',{target:'df'}],
  d=>[`The handoff includes only ${d.c}=${q(d.columns[d.c][0])}. Keep ${d.id} and ${d.b}, in that order, in df. Display it.`,`df = df[df[${q(d.c)}] == ${q(d.columns[d.c][0])}][${q([d.id,d.b])}]\ndf`,'Filter while the category column is still available.',{target:'df'}]],
 W04:[
  d=>[`Remove both ${d.d} and ${d.b} from df; retain every row and remaining column in original order. Display df.`,`df = df.drop(columns=${q([d.d,d.b])})\ndf`,'columns accepts a list of fields to remove.',{target:'df'}],
  d=>[`Prepare a separate clean copy of df without ${d.id} and ${d.d} for an anonymous measurement handoff. Preserve df and display clean.`,`clean = df.copy().drop(columns=${q([d.id,d.d])})\nclean`,'Decide which object should lose the columns before assigning.',{target:'copy'}]],
 W05:[
  d=>[`Keep df rows with ${d.a} from 3 through 6 inclusive. Preserve all columns and row order; display df.`,`df = df[(df[${q(d.a)}] >= 3) & (df[${q(d.a)}] <= 6)]\ndf`,'Both inclusive boundaries must hold.',{target:'df'}],
  d=>[`Prepare df for a report excluding ${q(d.columns[d.c][0])} in ${d.c}. Present remaining rows by ${d.a}, largest first, and display df.`,`df = df[df[${q(d.c)}] != ${q(d.columns[d.c][0])}].sort_values(${q(d.a)}, ascending=False)\ndf`,'Exclusion and presentation order are separate steps.',{target:'df'}]],
 W06:[
  d=>[`Sort df by ${d.a} descending, then reset the index while retaining the old labels in a column named index. Display df.`,`df = df.sort_values(${q(d.a)}, ascending=False).reset_index()\ndf`,'Omit drop=True when the old row labels are evidence worth keeping.',{target:'df'}],
  d=>[`For ${d.c}=${q(d.columns[d.c][0])}, keep df rows sorted by ${d.b} descending and give them fresh consecutive row labels without an extra column. Display df.`,`df = df[df[${q(d.c)}] == ${q(d.columns[d.c][0])}].sort_values(${q(d.b)}, ascending=False).reset_index(drop=True)\ndf`,'Reset after filtering and sorting, not before.',{target:'df'}]],
 W07:[
  d=>[`Add total to df, equal to ${d.a} plus ${d.b}. This exercise assumes these café price and tip columns share currency units. Preserve all other data and display df.`,`df["total"] = df[${q(d.a)}] + df[${q(d.b)}]\ndf`,'Column arithmetic aligns measurements row by row.',{target:'df'}],
  d=>[`Add age_months to df from age in years (12 months per year). Keep the original age values and all other columns; display df.`,`df["age_months"] = df["age"] * 12\ndf`,'A unit conversion belongs in a new, clearly named column.',{target:'df'}]],
 W08:[
  d=>[`Add band to df: high if ${d.a} > 5, middle if ${d.a} > 3, otherwise low. Preserve all rows and display df.`,`df["band"] = np.select([df[${q(d.a)}] > 5, df[${q(d.a)}] > 3], ["high", "middle"], default="low")\ndf`,'np.select uses the first matching condition; put high before middle.',{target:'df'}],
  ()=>['A care report marks a pet priority only when species is Dog and age is at least 5. Add priority as True/False to df; preserve the data and display df.','df["priority"] = (df["species"] == "Dog") & (df["age"] >= 5)\ndf','A Boolean condition can itself become the new column.',{target:'df'}]],
 W09:[
  d=>[`Add code to df using the lookup {${q(d.columns[d.c][0])}: 1}. Unmapped ${d.c} labels should become missing; preserve the original labels and display df.`,`df["code"] = df[${q(d.c)}].map({${q(d.columns[d.c][0])}: 1})\ndf`,'map makes unmatched labels missing; replace would keep them.',{target:'df'}],
  d=>[`In a separate clean copy of df, rename the ${d.c} label ${q(d.columns[d.c][0])} to Featured. Preserve all other labels and df; display clean.`,`clean = df.copy()\nclean[${q(d.c)}] = clean[${q(d.c)}].replace({${q(d.columns[d.c][0])}: "Featured"})\nclean`,'Choose the recoding behavior that preserves unknown labels.',{target:'copy'}]],
 W10:[null,
  d=>[`Create clean from df. Trim and lowercase ${d.d}, then display only rows whose cleaned ${d.d} is food. Preserve df.`,`clean = df.copy()\nclean[${q(d.d)}] = clean[${q(d.d)}].str.strip().str.lower()\nclean = clean[clean[${q(d.d)}] == "food"]\nclean`,'Normalize the text before comparing it with a category label.',{target:'copy'}]],
 W11:[
  d=>[`Display df rows whose ${d.id} does NOT contain a, ignoring case. Preserve row order.`,`df[~df[${q(d.id)}].str.contains("a", case=False, na=False, regex=False)]`,'Invert the match mask with ~; do not invert the text.'],
  d=>[`Search ${d.id} in df for the literal letter e, ignoring case, then display just ${d.id} and ${d.a} for matching rows.`,`df[df[${q(d.id)}].str.contains("e", case=False, na=False, regex=False)][${q([d.id,d.a])}]`,'Match records first, then choose the handoff columns.']],
 W12:[
  ()=>['Convert df price text to numbers without overwriting the raw values. Display the number of new missing values caused by invalid text (exclude values already missing).','parsed = pd.to_numeric(df["price"], errors="coerce")\n(parsed.isna() & ~df["price"].isna()).sum()','Compare the parsed missing mask with the original missing mask.'],
  ()=>['Create clean as a copy of df. Add numeric_price parsed from price, then retain only records with numeric_price above 7. Keep raw price and df unchanged; display clean.','clean = df.copy()\nclean["numeric_price"] = pd.to_numeric(clean["price"], errors="coerce")\nclean = clean[clean["numeric_price"] > 7]\nclean','Parse into a separate column so the original text remains inspectable.',{target:'copy'}]],
 W13:[
  d=>[`Convert ${d.id} in df to pandas string dtype, preserving its values and other columns. Display df.`,`df[${q(d.id)}] = df[${q(d.id)}].astype("string")\ndf`,'Choose the explicit text dtype rather than a categorical type.',{target:'df',strictDtype:true}],
  ()=>['A handoff requires whole-number ages that can later include missing values. Convert df age to nullable Int64, keep all values and display df.','df["age"] = df["age"].astype("Int64")\ndf','Capital I distinguishes nullable Int64 from ordinary int64.',{target:'df',strictDtype:true}]],
 W14:[
  ()=>['Parse df date without modifying df. Display the original records whose date cannot be parsed in year-month-day format.','parsed = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")\ndf[parsed.isna()]','Use the parsed missing mask to retrieve the original evidence.'],
  ()=>['Create a separate clean copy of df with parsed dates. Keep only records dated on or after 2026-08-04 and sort them by date ascending. Display clean; preserve df.','clean = df.copy()\nclean["date"] = pd.to_datetime(clean["date"], format="%Y-%m-%d", errors="coerce")\nclean = clean[clean["date"] >= "2026-08-04"].sort_values("date")\nclean','Parse before chronological comparison; invalid dates will not pass.',{target:'copy',bridge:'A parsed datetime Series can be compared with an ISO date string such as "2026-08-04".'}]],
 W15:[
  ()=>['Parse df date and display weekday counts for valid dates, largest count first. Preserve df.','dates = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")\ndates.dt.day_name().value_counts()','Extract weekday names before counting them; missing dates are excluded.'],
  ()=>['A monthly intake report needs a count for each month in df. Parse date, then display counts by month number in ascending order. Preserve df.','dates = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")\ndates.dt.month.value_counts().sort_index()','Count month numbers; sorting the index puts the calendar in order.',{bridge:'sort_index() sorts a Series by its labels, unlike sort_values(), which sorts the counts.'}]],
 W16:[
  d=>[`Parse price as numeric in df. This report requires both a known price and known ${d.a}; keep only eligible rows and display df.`,`df["price"] = pd.to_numeric(df["price"], errors="coerce")\ndf = df.dropna(subset=["price", ${q(d.a)}])\ndf`,'subset can name both fields required for this report.',{target:'df'}],
  ()=>['Preserve df. A report needs a valid numeric price but accepts missing discounts. Display a dictionary with keys rows (eligible DataFrame, with parsed prices) and excluded (number removed).','clean = df.copy()\nclean["price"] = pd.to_numeric(clean["price"], errors="coerce")\neligible = clean.dropna(subset=["price"])\n{"rows": eligible, "excluded": len(df) - len(eligible)}','Keep the denominator before filtering; do not drop rows for unrelated gaps.']],
 W17:[
  d=>[`For this exercise only, a missing ${d.a} is confirmed to mean no discount. Fill those gaps with zero in df and display it; preserve all known values.`,`df[${q(d.a)}] = df[${q(d.a)}].fillna(0)\ndf`,'Use the supplied meaning of missingness, not a habitual default.',{target:'df'}],
  d=>[`Preserve df in a separate clean copy. Add ${d.a}_missing to record the original missing mask, then fill missing ${d.a} with its observed median. Keep every row; display clean.`,`clean = df.copy()\nclean[${q(d.a+'_missing')}] = clean[${q(d.a)}].isna()\nclean[${q(d.a)}] = clean[${q(d.a)}].fillna(clean[${q(d.a)}].median())\nclean`,'Record the missing mask before replacing the unknown values.',{target:'copy'}]],
 W18:[
  ()=>['The identical extra rows in df are confirmed accidental copies. Keep the last occurrence of each exact row, retaining original indices; display df.','df = df.drop_duplicates(keep="last")\ndf','keep chooses which copy survives, and therefore which original index remains.',{target:'df',bridge:'drop_duplicates(keep="last") retains the final copy rather than the first.'}],
  ()=>['Preserve df. Remove confirmed extra identical rows into a separate clean table, sort by order and give clean a fresh consecutive index. Display clean.','clean = df.copy().drop_duplicates().sort_values("order").reset_index(drop=True)\nclean','Deduplicate before assigning new row labels.',{target:'copy'}]],
 W19:[
  d=>[`Summarise df by ${d.c} with named columns total (${d.a} sum) and n (${d.a} count). Keep ${d.c} as a regular column and groups alphabetically ordered. Display the summary.`,`df.groupby(${q(d.c)}, as_index=False).agg(total=(${q(d.a)}, "sum"), n=(${q(d.a)}, "count"))`,'Each named aggregation pairs an input field with a summary operation.'],
  d=>[`For df records with ${d.a} at least 2, compare average ${d.b} and group size by ${d.c}. Display columns ${d.c}, average, n, with groups alphabetically ordered.`,`df[df[${q(d.a)}] >= 2].groupby(${q(d.c)}, as_index=False).agg(average=(${q(d.b)}, "mean"), n=(${q(d.b)}, "size"))`,'size counts records; count counts known measurements.']],
 W20:[
  d=>[`Add centered to df: each ${d.a} minus its ${d.c} group mean. Keep every original row and display df.`,`df["centered"] = df[${q(d.a)}] - df.groupby(${q(d.c)})[${q(d.a)}].transform("mean")\ndf`,'transform repeats each group mean onto its original rows.',{target:'df'}],
  d=>[`Display df records whose ${d.a} exceeds the mean for their own ${d.c} category. Preserve the original columns and row order.`,`means = df.groupby(${q(d.c)})[${q(d.a)}].transform("mean")\ndf[df[${q(d.a)}] > means]`,'Compare each record with its own group benchmark, not the overall mean.']],
 W21:[
  d=>[`Build a pivot table from df: ${d.c} on rows, ${d.d} on columns, total ${d.a} in each cell. Leave absent combinations missing.`,`df.pivot_table(index=${q(d.c)}, columns=${q(d.d)}, values=${q(d.a)}, aggfunc="sum")`,'Change the aggregation to match a total rather than a mean.'],
  d=>[`For df records with ${d.a} at least 2, show mean ${d.b} by ${d.c} rows and ${d.d} columns. Preserve missing combinations in the displayed table.`,`df[df[${q(d.a)}] >= 2].pivot_table(index=${q(d.c)}, columns=${q(d.d)}, values=${q(d.b)}, aggfunc="mean")`,'Define the subset and measurement before choosing the table layout.']],
 W22:[
  d=>[`Reshape df to long form using identifiers ${d.id} and ${d.c}, and measurements ${d.a} then ${d.b}. Name the output columns measure and value. Display the long table.`,`df.melt(id_vars=${q([d.id,d.c])}, value_vars=${q([d.a,d.b])}, var_name="measure", value_name="value")`,'Multiple identifier fields repeat beside each stacked measurement.'],
  d=>[`A chart needs only ${d.b} measurements for df records with ${d.a} at least 2, in long form. Display columns ${d.id}, measure, value in that order.`,`df[df[${q(d.a)}] >= 2].melt(id_vars=[${q(d.id)}], value_vars=[${q(d.b)}], var_name="measure", value_name="value")`,'Filter while the wide table still contains the selection field.']],
 W23:[
  d=>[`From the supplied long table, display a wide table with measure on rows and ${d.id} on columns, using value as the cell contents.`,`long.pivot(index="measure", columns=${q(d.id)}, values="value")`,'Swapping index and columns changes orientation without aggregation.'],
  d=>[`The supplied long table contains one measurement per identifier/measure pair. Keep only measure=${q(d.b)}, then display it wide with ${d.id} on rows.`,`long[long["measure"] == ${q(d.b)}].pivot(index=${q(d.id)}, columns="measure", values="value")`,'Filter long-form records before reshaping.']],
 W24:[null,
  d=>[`Audit the supplied lookup: use merge to left-join it to df on ${d.c} with validate="many_to_one", then display only observations without a matched priority. Keep all joined columns and original row order.`,`joined = df.merge(lookup, on=${q(d.c)}, how="left", validate="many_to_one")\njoined[joined["priority"].isna()]`,'An inner join would discard the unmatched evidence you need.',{requiredCalls:['merge'],requiredKeywords:[{call:'merge',keyword:'validate',value:'many_to_one'}]}]],
 W25:[
  ()=>['Stack the supplied second table before first, with fresh consecutive indices. Display the result.','pd.concat([second, first], ignore_index=True)','The list order determines which batch appears first.'],
  d=>[`Combine supplied first and second, then keep records with ${d.a} above 2. Display them sorted by ${d.a}, largest first, with a fresh consecutive index.`,`combined = pd.concat([first, second], ignore_index=True)\ncombined[combined[${q(d.a)}] > 2].sort_values(${q(d.a)}, ascending=False).reset_index(drop=True)`,'Finish filtering and sorting before assigning presentation indices.']],
 W26:[
  d=>[`Add half to df using two sample-quantile groups of ${d.a}, labelled lower then upper. Display df.`,`df["half"] = pd.qcut(df[${q(d.a)}], q=2, labels=["lower", "upper"])\ndf`,'Quantile groups target similar counts, unlike fixed value boundaries.',{target:'df'}],
  ()=>['For df age, a care policy defines young as ages 0 through 3 inclusive and older as ages above 3 through 10. Add band with these labels, retain all rows and display df.','df["band"] = pd.cut(df["age"], bins=[0, 3, 10], labels=["young", "older"], include_lowest=True)\ndf','Policy boundaries call for fixed edges rather than sample quantiles.',{target:'df'}]],
 W27:[
  d=>[`Encode both ${d.c} and ${d.d} in df into integer indicator columns, retaining other fields. Display the encoded table.`,`pd.get_dummies(df, columns=${q([d.c,d.d])}, dtype=int)`,'columns can identify more than one categorical field.'],
  d=>[`For df records with ${d.a} at least 3, prepare a table containing ${d.a}, ${d.b}, and integer indicators for ${d.c}, in that source-column order. Display it.`,`selected = df[df[${q(d.a)}] >= 3][${q([d.a,d.b,d.c])}]\npd.get_dummies(selected, columns=[${q(d.c)}], dtype=int)`,'Define the population and fields before encoding; this is representation practice, not model fitting.']],
 W28:[null,
  ()=>['Using df age and weight in that order, fit StandardScaler on the first four rows only. Transform the last two rows with that same fitted scaler and display the two-column numeric array.','from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nscaler.fit(df.iloc[:4][["age", "weight"]])\nscaler.transform(df.iloc[4:][["age", "weight"]])','Held-out rows must not influence the fitted mean or scale.',{bridge:'scaler.fit(training_table) learns parameters. scaler.transform(other_table) applies those parameters without relearning them.'}]],
 W29:[
  d=>[`Screen ${d.a} in df using Q1 − 1.5×IQR and Q3 + 1.5×IQR. Display only flagged records for investigation, preserving df.`,`q1 = df[${q(d.a)}].quantile(.25)\nq3 = df[${q(d.a)}].quantile(.75)\niqr = q3 - q1\ndf[(df[${q(d.a)}] < q1 - 1.5 * iqr) | (df[${q(d.a)}] > q3 + 1.5 * iqr)]`,'The mask identifies records to inspect, not records known to be wrong.'],
  ()=>['A df observation lies beyond an IQR fence. Does that alone justify deleting it as an error? Write True or False.','False','A screening rule cannot establish whether a measurement is erroneous.',{demand:'Evaluate an analytical decision'}]],
 W30:[
  d=>[`Add difference to df, equal to ${d.a} minus its overall mean. Use vectorised arithmetic and display df.`,`df["difference"] = df[${q(d.a)}] - df[${q(d.a)}].mean()\ndf`,'A scalar mean broadcasts across the Series; no row function is needed.',{target:'df',forbiddenCalls:['apply']}],
  ()=>['Add age_months to df and display only name and age_months for pets aged at least 3 years. Keep df otherwise intact.','df["age_months"] = df["age"] * 12\ndf[df["age"] >= 3][["name", "age_months"]]','Combine a direct unit conversion with filtering and selection.']]
 };
 for(const [id,pair] of Object.entries(configs))pair.forEach((make,j)=>{
  if(!make)return;const r=lesson(id).rounds[j+1],parts=make(D[r.dataset],r);revise(id,j+1,...parts);
 });
 // Existing rounds that already change the decision retain their carefully reviewed tasks.
 const retained={I10:['Use category membership','Use an inclusive interval'],I12:['Change sort direction','Sort with two keys'],I18S:['Choose a total','Choose a robust middle'],W10:['Replace literal punctuation'],W24:['Keep matches only'],W28:['Choose a different scaling rule']};
 for(const [id,demands] of Object.entries(retained))demands.forEach((d,i)=>{if(d)lesson(id).rounds[i+1].demand=d;});
 // One summary at a time; the seven-function dictionary was an unnecessary first-step jump.
 revise('I18S',0,'Using df price, calculate the mean price. Leave the numeric result on the final line.','df["price"].mean()','mean answers an average-price question.',{requiredCalls:['mean'],demand:'Follow an average calculation'});
 lesson('I18S').rounds[0].task+=' Practise: mean().';lesson('I18S').rounds[0].starter='df["price"].____()';
 // CSV loading should not depend on column selection before that skill is taught.
 revise('I01CSV',1,'The supplied cafe.csv contains four orders. Load it into a DataFrame named orders and display orders; df is not supplied in this file exercise.','import pandas as pd\norders = pd.read_csv("cafe.csv")\norders','Assignment chooses the variable name; read_csv does not require the name df.');
 // CSV transfer includes a verifiable prediction alongside the constructed table.
 {const r=lesson('I01CSV').rounds[2];revise('I01CSV',2,'Read the supplied pets.csv preview. Display a dictionary with keys predicted_rows (your predicted integer) and table (the loaded DataFrame). The header is not a data record.','import pandas as pd\n{"predicted_rows": 4, "table": pd.read_csv("pets.csv")}','Count the data lines, then use the dictionary structure introduced in Meet a DataFrame.',{demand:'Predict and verify a file import'});}

 // Visual progression and checkpoint refinements follow below.
 const imports='import matplotlib.pyplot as plt\nimport seaborn as sns\n\n';
 function plot(id,i,task,body,x,y,options={}){
  const r=lesson(id).rounds[i];
  if(i>0&&['V08','V09','V10','V11','V12','V13','V14','V15'].includes(id))r.dataset=i===1?'weather':'games';
  const d=D[r.dataset],title=options.title||d.name;
  const solution=imports+'fig, ax = plt.subplots(figsize=(6, 4))\n'+body+`\nax.set(title=${q(title)}, xlabel=${q(x)}, ylabel=${q(y)})\nfig.tight_layout()\nplt.show()`;
  revise(id,i,task+` Use title ${q(title)}, x label ${q(x)} and y label ${q(y)}. Finish with fig.tight_layout() and display with plt.show().`,solution,options.hint||'Translate the question into the selected observations and the quantity on each axis.',{target:'plot',plot:{labels:true,...options.rules},resultKind:'Figure',...options});
 }
 for(const id of ['V01','V02','V03','V04','V05','V06','V07','V08','V09','V10','V11','V12','V13','V14','V15','V16','V17','V18','V19','V20','V21','V22','V23','V24','V25','V26','V27','V28','V29','V30','V31','V32','V33','V34','V35','V36']){
  lesson(id).rounds[0].demand='Follow the technique';
 }
 // Choosing a chart is a reasoning task before the plotting APIs are introduced.
 const choice=lesson('V35');choice.title='Choose a chart for the question';choice.goal='Match the question and variable types before writing plotting code.';
 choice.explanation='Use scatter for the relationship between two numeric variables; histogram for the distribution of one numeric variable; category counts for how often labels occur; and a line for values along an ordered time sequence. A Python string in quotes can express your choice.';
 choice.syntax=[['"scatter"','relationship between two numeric variables'],['"histogram"','distribution of one numeric variable'],['"counts"','frequency of category labels'],['"line"','change along an ordered time sequence']];choice.syntaxCode='"scatter"';
 ['scatter','histogram','counts'].forEach((answer,i)=>revise('V35',i,[
  'Using df, which chart would help ask whether students who study longer tend to score higher? Write "scatter", "histogram", "counts" or "line" as your final Python string.',
  'Using df, which chart would show how temperatures are distributed, without comparing them with humidity? Write "scatter", "histogram", "counts" or "line".',
  'Using df, a cinema wants to see which genres occur most often. Choose "scatter", "histogram", "counts" or "line". Write the choice as a Python string.'
 ][i],q(answer),['Identify the two numeric variables.','One numeric variable calls for a distribution view.','Genres are categories; the question asks about their frequencies.'][i],{demand:['Follow a chart choice','Distinguish a distribution question','Select a chart for a new question'][i]}));
 choice.rounds[0].starter='"____"';
 revise('V01',1,'Predict the number of plotting areas created by plt.subplots(1, 2). Using the given df only as context, write the number as a Python integer.','2','The two arguments specify rows and columns of plotting areas.',{bridge:'subplots(rows, columns) makes a grid; the number of Axes is rows multiplied by columns.',demand:'Predict the canvas structure'});
 revise('V01',2,'A report about df needs one Figure containing three panels in one row. Write the (rows, columns) tuple you would pass to subplots.','(1, 3)','A Figure can hold several Axes; a horizontal strip has one row.',{demand:'Plan a report canvas'});
 for(let i=1;i<3;i++){
  const d=D[lesson('V16').rounds[i].dataset];
  if(i===1)plot('V16',i,`Using df, plot ${d.b} horizontally against ${d.a} vertically. Each point must represent one record.`,`sns.scatterplot(data=df, x=${q(d.b)}, y=${q(d.a)}, ax=ax)`,d.b,d.a,{hint:'Changing the question changes both the data mapping and axis labels.'});
  else plot('V16',i,`Among df games lasting at least 20 minutes, show the relationship between minutes and rating. Choose a chart that preserves the paired observations.`,`selected = df[df["minutes"] >= 20]\nax.scatter(selected["minutes"], selected["rating"])`,'minutes','rating',{rules:{semantic:'scatter'},hint:'Filter the records first; each displayed point must retain its original x/y pair.'});
 }
 plot('V02',1,'Using df, make a scatter chart of temperature and humidity. Its title must communicate the question rather than repeat the dataset name.','sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)','Temperature (°C)','Humidity (%)',{title:'Does humidity vary with temperature?',hint:'Units belong in axis labels; title describes the question.'});
 plot('V02',2,'Using df, show minutes against rating for games lasting at least 20 minutes. Finish the chart so the title states its restricted population.','selected = df[df["minutes"] >= 20]\nsns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)','Minutes','Rating',{title:'Games lasting at least 20 minutes',rules:{semantic:'scatter'}});
 for(let i=1;i<3;i++){
  const d=D[lesson('V04').rounds[i].dataset];
  plot('V04',i,i===1?'Using df, investigate how a coarser bin choice changes the temperature distribution: use two bins.':'For df games lasting at least 20 minutes, show the distribution of playing times with three bins.',`${i===2?'selected = df[df["minutes"] >= 20]\n':''}sns.histplot(data=${i===2?'selected':'df'}, x=${q(d.a)}, bins=${i===1?2:3}, ax=ax)`,d.a,'Count',{hint:'Bins change how observations are grouped; filtering changes which observations enter the chart.'});
 }
 // An absent category is visible and checkable rather than disappearing from the chart.
 lesson('V08').syntax.push(['counts.reindex(order, fill_value=0)','include absent categories and choose their order'],['ax.bar(counts.index, counts.values)','draw already counted values']);
 plot('V08',1,'Using df, count sky categories in this order: Sun, Cloud, Rain, Snow. Show Snow with zero observations.', 'counts = df["sky"].value_counts().reindex(["Sun", "Cloud", "Rain", "Snow"], fill_value=0)\nax.bar(counts.index, counts.values)','sky','Count',{rules:{categorical:true},bridge:'value_counts() produces counts. reindex(order, fill_value=0) adds absent labels; ax.bar draws those exact counts.',hint:'A missing category must appear in the count index before plotting.'});
 plot('V08',2,'Using df, show which game genres occur most often among games lasting at least 20 minutes. Present the genres alphabetically and display one bar per category.', 'selected = df[df["minutes"] >= 20]\ncounts = selected["genre"].value_counts().sort_index()\nax.bar(counts.index, counts.values)','genre','Count',{rules:{categorical:true,semantic:'bars'},hint:'The denominator is the selected games, not all games.',reflection:'Add a Python comment naming the most frequent genre or tied genres and their counts. Support it with the displayed bars.'});
 // Remaining charts use targeted adaptations or interpretation instead of copied recipes.
 const visualChanges={
 V03:['Map sky to colour only; keep identical marker shapes and sizes.','sns.scatterplot(data=df, x="temperature", y="humidity", hue="sky", ax=ax)','temperature','humidity'],
 V05:['Use a density curve for df temperature with bw_adjust=2 and cut=0 to examine stronger smoothing.','sns.kdeplot(data=df, x="temperature", bw_adjust=2, cut=0, ax=ax)','temperature','Density'],
 V06:['Show the fraction of df humidity observations ABOVE each x value using a complementary ECDF.','sns.ecdfplot(data=df, x="humidity", complementary=True, ax=ax)','humidity','Proportion above'],
 V07:['Show df humidity as a density curve with cut=0, then add rug marks on that same Axes to retain the raw observations.','sns.kdeplot(data=df, x="humidity", cut=0, ax=ax)\nsns.rugplot(data=df, x="humidity", ax=ax)','humidity','Density'],
 V09:['Compare median temperature by sky in df, omitting error bars.','sns.barplot(data=df, x="sky", y="temperature", estimator="median", errorbar=None, ax=ax)','sky','Median temperature'],
 V10:['Compare median humidity by sky in df using points, with no error bars.','sns.pointplot(data=df, x="sky", y="humidity", estimator="median", errorbar=None, ax=ax)','sky','Median humidity'],
 V11:['Compare df humidity distributions across sky categories using horizontal boxes: humidity on x and sky on y.','sns.boxplot(data=df, x="humidity", y="sky", ax=ax)','humidity','sky'],
 V12:['Compare df humidity by sky using violins with cut=0 and inner="point" so the raw measurements remain visible.','sns.violinplot(data=df, x="sky", y="humidity", cut=0, inner="point", ax=ax)','sky','humidity'],
 V13:['Show every df humidity observation grouped by sky. Turn jitter off to see where observations overlap.','sns.stripplot(data=df, x="sky", y="humidity", jitter=False, ax=ax)','sky','humidity'],
 V14:['Show every df humidity observation grouped by sky with horizontal swarm spacing: humidity on x and sky on y.','sns.swarmplot(data=df, x="humidity", y="sky", ax=ax)','humidity','sky'],
 V15:['For syntax practice, use a horizontal letter-value plot of df humidity by sky. The layout changes, but the tiny sample still cannot establish tail behavior.','sns.boxenplot(data=df, x="humidity", y="sky", ax=ax)','humidity','sky'],
 V17:['Map sky to both colour and marker shape while plotting df humidity horizontally and temperature vertically.','sns.scatterplot(data=df, x="humidity", y="temperature", hue="sky", style="sky", ax=ax)','humidity','temperature'],
 V20:['Fit and show a linear trend of humidity against temperature for df observations from station East only. Omit the confidence band.','selected = df[df["station"] == "East"]\nsns.regplot(data=selected, x="temperature", y="humidity", ci=None, ax=ax)','temperature','humidity'],
 V21:['Inspect residuals of a linear humidity-versus-temperature fit using df station East observations only.','selected = df[df["station"] == "East"]\nsns.residplot(data=selected, x="temperature", y="humidity", ax=ax)','temperature','Residual'],
 V22:['Show df correlations for humidity then temperature only. Use annotations, cmap="coolwarm", vmin=-1, vmax=1 and center=0.','matrix = df[["humidity", "temperature"]].corr()\nsns.heatmap(matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1, center=0, ax=ax)','Variable','Variable'],
 V23:['Show df counts with station on rows and sky on columns, using annotated integer cells and cmap="Blues".','matrix = pd.crosstab(df["station"], df["sky"])\nsns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", ax=ax)','sky','station'],
 V26:['Show temperature against humidity from df on ordinary linear axes with both lower limits at zero.','sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)\nax.set_xlim(left=0)\nax.set_ylim(bottom=0)','temperature','humidity'],
 V27:['Show df temperature against humidity with just a dashed horizontal line at mean humidity.','sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)\nax.axhline(df["humidity"].mean(), linestyle="--")','temperature','humidity'],
 V28:['Plot df temperature against humidity and annotate the lowest humidity as "Driest", offset by (8, 8) points with an arrow.','sns.scatterplot(data=df, x="temperature", y="humidity", ax=ax)\npoint = df.loc[df["humidity"].idxmin()]\nax.annotate("Driest", xy=(point["temperature"], point["humidity"]), xytext=(8, 8), textcoords="offset points", arrowprops={"arrowstyle": "->"})','temperature','humidity'],
 V29:['Draw exact total tips by size from df, with categories alphabetically ordered.','totals = df.groupby("size")["tip"].sum()\nax.bar(totals.index, totals.values)','size','Total tips']
 };
 for(const [id,[task,body,x,y]] of Object.entries(visualChanges))plot(id,1,'Using df, '+task[0].toLowerCase()+task.slice(1),body,x,y,{rules:{...lesson(id).rounds[0].plot},hint:({V03:'Map only the channel needed by this question.',V09:'The center of interest changed from mean to median.',V22:'Select the variables before correlating; keep the signed scale fixed.',V28:'Find the minimum of the measured field, then label its paired coordinates.'})[id]||'Identify what changed from Follow: the measurement, summary or visual encoding. Update the data mapping and matching labels.'});
 const interpretations={
 V05:['A smoother KDE from df proves the population has that exact shape. Is this justified?','False','Smoothing is a display choice, and the sample is tiny.'],
 V06:['An ECDF calculated from df reaches 0.75 at a value x. What percentage of observations are at or below x?','75','The vertical coordinate is a fraction; convert it to a percentage.'],
 V07:['Two df observations have the same value and their rug marks overlap. Does one visible tick prove there was only one observation?','False','Overlapping marks can hide repeated values.'],
 V10:['A plot from df uses errorbar="sd". Does its band represent a confidence interval for the mean?','False','Standard deviation describes observation spread, not uncertainty in a mean.'],
 V12:['A violin drawn from the tiny df table looks bimodal. Does its appearance alone establish two population subgroups?','False','Density shape depends on smoothing and sample size.'],
 V14:['A swarm plot moves df points sideways to avoid overlap. Does that change their measured y values?','False','Packing adjusts category-direction positions only.'],
 V15:['For a six-record df, choose the more direct view of the actual measurements: "raw points" or "letter-value tails".','"raw points"','Detailed tail estimates need more observations.'],
 V19:['The line chart from df uses estimator="mean" and errorbar="sd". What does each point summarize: "mean per time" or "one individual trajectory"?','"mean per time"','Repeated times are grouped; the chart is not a tracked individual.'],
 V20:['A rising fitted regression line in df establishes that increasing x causes y to rise. Is that justified?','False','A fitted association does not establish a causal mechanism.'],
 V21:['A df residual is observed minus predicted. With observed 12 and predicted 9, what residual should be plotted?','3','Keep the subtraction order: observed minus predicted.'],
 V26:['A df measurement includes zero. Can all values be shown unchanged on an ordinary logarithmic axis?','False','The ordinary logarithm is undefined at zero; silently dropping it changes the evidence.'],
 V31:['A pairplot of df has four selected numeric variables. How many panels are in its square grid, including the diagonal?','16','There is one row and one column per selected variable.'],
 V32:['For a jointplot of df, which handle addresses the central plotting area: "g.ax_joint" or "g.figure"?','"g.ax_joint"','Figure is the whole canvas; the joint Axes is one plotting area.'],
 V34:['You create two Figures for df, fig_a and fig_b, and need to export the first. Which handle should call savefig: "fig_a" or "fig_b"?','"fig_a"','Saving an explicit Figure avoids relying on whichever figure is currently active.']
 };
 for(const [id,[task,solution,hint]] of Object.entries(interpretations))revise(id,2,task+' Write the answer as a Python value on the final line.',solution,hint,{demand:'Interpret or diagnose'});
 // Transfer chart tasks combine an earlier data operation with a meaningful chart decision.
 plot('V03',2,'Using df, compare minutes and rating using one fixed blue colour, without category, size or shape mappings.','ax.scatter(df["minutes"], df["rating"], color="blue")','minutes','rating',{rules:{semantic:'scatter'},hint:'A fixed colour is appearance; it does not encode a column.'});
 plot('V09',2,'Among df games lasting at least 20 minutes, compare mean rating by genre. Omit error bars and order genres alphabetically.','selected = df[df["minutes"] >= 20]\nmeans = selected.groupby("genre")["rating"].mean()\nax.bar(means.index, means.values)','genre','Mean rating',{rules:{semantic:'bars',categorical:true},hint:'Calculate the requested group mean before drawing exact bars.'});
 plot('V11',2,'Using df, compare game ratings by genre only for games lasting at least 20 minutes. Use a box plot and keep categories in first-appearance order.','selected = df[df["minutes"] >= 20]\nsns.boxplot(data=selected, x="genre", y="rating", ax=ax)','genre','rating',{hint:'A distribution by category differs from one overall rating distribution.'});
 plot('V13',2,'Using df, show every rating by genre for games lasting at least 20 minutes. Use raw points with jitter=False; keep categories in first-appearance order.','selected = df[df["minutes"] >= 20]\nsns.stripplot(data=selected, x="genre", y="rating", jitter=False, ax=ax)','genre','rating',{hint:'Retain individual records instead of aggregating their mean.'});
 plot('V17',2,'Using df, compare minutes and rating with players represented by both colour and marker shape. Exclude games lasting under 20 minutes.','selected = df[df["minutes"] >= 20]\nsns.scatterplot(data=selected, x="minutes", y="rating", hue="players", style="players", ax=ax)','minutes','rating',{rules:{colors:true,legend:true},hint:'Redundant mappings let shape carry information when colour is hard to distinguish.'});
 plot('V18',1,'Using df, show only hourly temperature observations from hour 12 onwards in time order. Use a line with markers and no aggregation.','selected = df[df["hour"] >= 12]\nsns.lineplot(data=selected, x="hour", y="temperature", estimator=None, marker="o", ax=ax)','hour','temperature',{hint:'Restrict the time window before connecting observations.'});
 plot('V18',2,'Using df, how did visits change over days 2 through 5 inclusive? Connect those ordered observations with a line and markers, without aggregation.','selected = df[(df["day"] >= 2) & (df["day"] <= 5)]\nax.plot(selected["day"], selected["visits"], marker="o")','day','visits',{rules:{semantic:'line'},hint:'An ordered time question supports connecting neighboring observations.'});
 plot('V19',1,'Using df paired measurements, show just replicate A over hour with markers and no aggregation.','selected = df[df["replicate"] == "A"]\nsns.lineplot(data=selected, x="hour", y="temperature", estimator=None, marker="o", ax=ax)','hour','temperature',{hint:'Selecting a replicate changes the unit represented by each point.'});
 plot('V22',2,'Using df games lasting at least 20 minutes, show the correlation matrix for minutes and rating, in that order. Annotate values; use cmap="coolwarm", vmin=-1, vmax=1 and center=0.','selected = df[df["minutes"] >= 20]\nsns.heatmap(selected[["minutes", "rating"]].corr(), annot=True, cmap="coolwarm", vmin=-1, vmax=1, center=0, ax=ax)','Variable','Variable',{rules:{clim:true},hint:'Correlations must describe the selected population, with a consistent colour scale.'});
 plot('V23',2,'Using df, show mean rating for genre rows and players columns. Use an annotated heatmap with fmt=".1f" and cmap="Blues"; leave absent combinations missing.','matrix = df.pivot_table(index="genre", columns="players", values="rating", aggfunc="mean")\nsns.heatmap(matrix, annot=True, fmt=".1f", cmap="Blues", ax=ax)','players','genre',{hint:'A crosstab counts; a pivot table with a mean summarizes ratings.'});
 // Multi-panel changes do not introduce an unrelated plotting family.
 {const r=lesson('V24').rounds[1];revise('V24',1,'Using df, create two panels stacked vertically: a four-bin temperature histogram titled Distribution above a temperature/humidity scatter titled Relationship. Label their axes (temperature, Count) and (temperature, humidity). Use figsize=(6, 8), finish and display the Figure.',r.solution.replace('plt.subplots(1, 2, figsize=(10, 4))','plt.subplots(2, 1, figsize=(6, 8))'),'The grid shape changes where the two Axes appear; each still needs its own labels.',{target:'plot',plot:{size:true},resultKind:'Figure'});}
 {const r=lesson('V24').rounds[2];revise('V24',2,'Using df games lasting at least 20 minutes, build a two-panel Figure: a four-bin minutes histogram titled Distribution on the left and minutes/rating scatter titled Relationship on the right. Label axes (minutes, Count) and (minutes, rating), finish and display.',r.solution.replace('fig, axes =','selected = df[df["minutes"] >= 20]\nfig, axes =').replaceAll('data=df','data=selected'),'Both panels must describe the same selected records.',{target:'plot',plot:{},resultKind:'Figure'});}
 // Preserve the substantive overlap/order adaptation in V25 Change; Transfer chooses a different grouping.
 lesson('V25').rounds[1].demand='Make overlap and category order explicit';
 plot('V25',2,'Using df, map players to both colour and shape for minutes against rating. Use palette="colorblind", alpha=0.6, and legend title Players.','sns.scatterplot(data=df, x="minutes", y="rating", hue="players", style="players", palette="colorblind", alpha=0.6, ax=ax)\nax.legend(title="Players")','minutes','rating',{rules:{legend:true,colors:true,alpha:true},hint:'The legend must describe the mapped field, not a leftover label from another chart.'});
 plot('V27',2,'Using df, plot minutes against rating and mark the care-about threshold rating=4 with a dashed horizontal line. This is a chosen review benchmark, not an estimated mean.','ax.scatter(df["minutes"], df["rating"])\nax.axhline(4, linestyle="--")','minutes','rating',{rules:{semantic:'scatter'},hint:'A y-value benchmark requires a horizontal line.'});
 plot('V28',2,'Using df games lasting at least 20 minutes, plot minutes against rating. Annotate the highest-rated selected game as Peak, offset (8, 8) points with an arrow.','selected = df[df["minutes"] >= 20]\nsns.scatterplot(data=selected, x="minutes", y="rating", ax=ax)\npeak = selected.loc[selected["rating"].idxmax()]\nax.annotate("Peak", xy=(peak["minutes"], peak["rating"]), xytext=(8, 8), textcoords="offset points", arrowprops={"arrowstyle": "->"})','minutes','rating',{rules:{annotations:true},hint:'Find the peak inside the report population, not in the original table.'});
 plot('V29',2,'Using df, compare average weight by species with exact bars, ordered alphabetically. Calculate the averages yourself before plotting.','means = df.groupby("species")["weight"].mean()\nax.bar(means.index, means.values)','species','Mean weight',{rules:{semantic:'bars',categorical:true},hint:'Body weights describe individuals; the question asks for a group average.'});
 {const r=lesson('V30').rounds[1];plot('V30',1,'Using df, stack Hot counts above Iced counts for each day, in table order. Label the two components in the legend.','ax.bar(df["day"], df["Iced"], label="Iced")\nax.bar(df["day"], df["Hot"], bottom=df["Iced"], label="Hot")\nax.legend()','day','Count',{rules:{legend:true},hint:'The upper component needs the lower component as its bottom.'});}
 revise('V30',2,'Using df, you need to compare Shop counts across items precisely. In a stacked chart where Online is the base, do Shop segments share a common zero baseline? Write True or False.','False','Only the base component starts at zero; upper segments start at different heights.',{demand:'Evaluate a comparison'});
 {const r=lesson('V31').rounds[1];revise('V31',1,'Using df, create a pairplot for humidity then temperature with histogram diagonals, no hue grouping and corner=True to omit mirrored upper panels. Finish g.figure with tight_layout() and display with plt.show().',imports+'g = sns.pairplot(data=df, vars=["humidity", "temperature"], diag_kind="hist", corner=True)\ng.figure.tight_layout()\nplt.show()','The upper and lower panels repeat the same variable pairs with swapped axes.',{target:'plot',plot:{},resultKind:'Figure',bridge:'pairplot(corner=True) removes the upper triangle of mirrored pairwise panels.'});}
 {const r=lesson('V32').rounds[1];revise('V32',1,'Using df, create a joint scatter of temperature against humidity. Add a dashed horizontal line at median humidity to the central Axes only. Finish g.figure with tight_layout() and display with plt.show().',imports+'g = sns.jointplot(data=df, x="temperature", y="humidity", kind="scatter")\ng.ax_joint.axhline(df["humidity"].median(), linestyle="--")\ng.figure.tight_layout()\nplt.show()','Use g.ax_joint to target the relationship panel without altering the margins.',{target:'plot',plot:{},resultKind:'Figure'});}
 lesson('V33').rounds[1].demand='Compare category distributions across panels';lesson('V33').rounds[2].demand='Choose distribution panels for a new context';
 {const r=lesson('V34').rounds[1];const body='sns.histplot(data=df, x="temperature", bins=4, ax=ax)';plot('V34',1,'Using df, export a four-bin temperature histogram as chart.png at 150 dpi with bbox_inches="tight" before displaying.',body,'temperature','Count',{rules:{export:true},hint:'Export the finished Figure, including its labels.'});r.solution=r.solution.replace('plt.show()','fig.savefig("chart.png", dpi=150, bbox_inches="tight")\nplt.show()');}
 // Judgement should change what is shown, not just decorate another identical plot.
 plot('V36',1,'Using df, compare average price by size as bars ordered alphabetically with a zero baseline.','means = df.groupby("size")["price"].mean()\nax.bar(means.index, means.values)\nax.set_ylim(bottom=0)','size','Mean price',{rules:{categorical:true,semantic:'bars',zeroBaseline:true},hint:'Bar lengths need a zero baseline; the height must represent the requested mean.'});
 revise('V36',2,'A bar chart from df shows values 4 and 5 but starts its y-axis at 3. Does the apparent bar-length ratio faithfully represent the ratio 4:5? Write True or False.','False','The visible lengths become 1 and 2, exaggerating the relative difference.',{demand:'Diagnose a misleading chart'});

 // Fix the analytical question, and write checkpoint requirements as actual steps.
 {const r=lesson('V37').rounds[1];r.task=r.task.replace('total selected temperature','mean selected temperature').replace('"Totals"','"Means"').replace('(sky, Total)','(sky, Mean temperature)');r.solution=r.solution.replace('["temperature"].sum()','["temperature"].mean()').replace('title="Totals"','title="Means"').replace('ylabel="Total"','ylabel="Mean temperature"');}
 const checkpointHints={I22:'Build the profile dictionary one entry at a time. Inspect df without assigning transformed data back to it.',W31:'Copy first. Remove confirmed duplicate records before calculating the imputation median; preserve unknown prices.',V37:'Define selected once, then reuse it for all three Figures. Compute the grouped summary before drawing exact bars.'};
 for(const [id,hint] of Object.entries(checkpointHints))for(const r of lesson(id).rounds)r.hint=hint;
 const followHints={
  I01:'A dictionary pairs each quoted column name with a list; both lists need the same number of rows.',I01CSV:'The quoted filename names the input file; assignment stores the returned table.',
  I02:'head starts at the beginning; the number in parentheses limits the rows.',I03:'shape is an attribute, so do not add parentheses. Rows come before columns.',I04:'columns describes fields; index describes row labels.',I05:'info prints a report and returns None; dtypes is the Series to leave on the final line.',
  I06:'One quoted column name selects a Series; a list of names selects a DataFrame.',I07:'The inner brackets make a list; its order controls the output columns.',I08:'A positional slice excludes the stop. A second slice after the comma selects columns.',I09:'A label slice includes its ending label. Keep the column name in a list for a DataFrame.',
  I10:'The comparison makes a mask; df[mask] selects the rows where it is True.',I11:'Parenthesize each comparison before combining them with &.',I12:'Filter first, then sort the remaining whole rows; ascending=False puts the highest first.',I13:'The count and ranking column are separate arguments; rank whole rows rather than sorting one Series.',I14:'nunique counts labels; unique returns the labels themselves.',I15:'normalize=True changes counts to proportions; missing values are excluded by default.',I16:'isna makes the missing mask; sum counts True values down each column.',I17:'duplicated marks the extra copies only by default, not the first occurrence.',I18:'Select the requested numeric columns in the requested order before summarizing.',I18S:'mean answers an average question, whereas sum answers a total question.',I19:'Group by the category, select the measurement, then aggregate it.',I20:'The first crosstab argument labels rows; the second labels columns.',I21:'Select numeric measurements and remember that a matrix reports pairwise linear associations.',
  W01:'Another name for df is not a copy; use copy before editing clean.',W02:'rename returns a table; assign it back to df to retain the new labels.',W03:'Selecting columns also changes their order; keep all fields requested by the handoff.',W04:'Use columns= so drop does not interpret the names as row labels.',W05:'Build a row mask and assign the selected table back to df.',W06:'Sort whole rows before resetting their index; drop=True avoids adding the old labels as a column.',W07:'Arithmetic on a Series works row by row; assignment to a new label adds a column.',W08:'The first np.where result belongs to True rows; equality does not satisfy a strict > test.',W09:'replace preserves unmapped labels; map would turn them into missing values.',W10:'strip removes edge spaces; changing case alone leaves those spaces intact.',W11:'regex=False makes the pattern literal; na=False keeps missing text out of the matches.',W12:'errors="coerce" creates missing values for invalid strings; it does not repair the original text.',W13:'category is a dtype, not a command to rename the values.',W14:'Parse with the explicit year-month-day format; invalid dates should remain missing.',W15:'Parse dates before using .dt; year and month have no parentheses, but day_name does.',W16:'subset names the fields required by this report; unrelated missing fields must not remove a row.',W17:'Calculate the observed median before filling; do not replace known values.',W18:'These identical rows are confirmed copies; the default keeps the first one.',W19:'A named aggregation pairs an input column with an aggregation function; as_index=False keeps group labels as a column.',W20:'transform keeps one result per original row; agg would reduce each group.',W21:'Choose the row categories, column categories, measured field and aggregation separately.',W22:'Identifiers repeat; selected measurement columns become measure/value rows.',W23:'pivot needs one value per identifier/measure pair and does not aggregate repeats.',W24:'A left join retains unmatched observations; validate checks that the lookup key is unique.',W25:'concat takes a list of tables; ignore_index makes fresh row labels.',W26:'Fixed boundaries and sample quantiles answer different questions; include the lowest boundary explicitly.',W27:'Specify dtype=int for 0/1 indicators rather than Boolean values.',W28:'The scaler needs a two-dimensional selection, even for a single measurement.',W29:'The distance extends beyond both quartiles; do not mistake Q3 itself for the upper fence.',W30:'Use the direct Series arithmetic and round the result; a row-wise function is unnecessary.',
  V01:'subplots returns the whole Figure and its Axes; unpack both names.',V02:'Axis labels describe the mapped measurements, while the title describes the question.',V03:'A column name maps a visual channel; a fixed colour does not encode a variable.',V04:'Bins group a numeric measurement; the vertical height here is a count.',V05:'Density is not a count. cut=0 prevents the curve extending beyond observed values.',V06:'The ECDF height is the fraction at or below the horizontal value.',V07:'Pass the same ax to both calls so the rug marks and distribution share a scale.',V08:'Category counts use x alone; supplying a numeric y changes the question.',V09:'The default bar height is a mean, not the number of records.',V10:'One SD describes spread of observations, not a confidence interval for the mean.',V11:'Whiskers stop at observed values within the fences; flagged points are not automatically errors.',V12:'The smooth shape depends on a density estimate; tiny groups do not support strong tail claims.',V13:'Jitter changes sideways placement, not the measured value.',V14:'Swarm packing moves points along the category direction while retaining their measurements.',V15:'Letter-value detail is a large-sample tool; these tiny groups demonstrate syntax only.',V16:'Keep x and y from the same row; one point represents one paired observation.',V17:'Use the same category for hue and style so colour is not the only cue.',V18:'A line implies order; estimator=None preserves observations instead of averaging repeated times.',V19:'Repeated times are aggregated when estimator is mean; the SD band shows within-time spread.',V20:'ci=None removes the displayed confidence band; it does not make the fit certain.',V21:'Residuals are observed minus predicted, not the original measured y values.',V22:'Build a correlation matrix first, then keep the colour scale fixed from -1 to 1.',V23:'A category-count matrix and a measurement-average matrix answer different questions.',V24:'Pass each chart its own axes[0] or axes[1]; finish the whole Figure once.',V25:'A legend describes the mapped category; redundant shapes help when colour is insufficient.',V26:'Log scales require positive values; limits can hide evidence.',V27:'Horizontal benchmarks use y units and vertical benchmarks use x units.',V28:'Find the target row, then use both coordinates from that same row for the annotation.',V29:'Compute the requested group quantities first; ax.bar uses the supplied heights without aggregation.',V30:'The upper bars need bottom equal to the lower component, not zero.',V31:'pairplot owns its Figure; do not create an extra empty Figure first.',V32:'jointplot owns a Figure with a central Axes and marginal Axes.',V33:'Figure-level functions create their own panels; height describes each panel.',V34:'Save the explicit finished Figure before display, with the requested resolution.',V36:'Bar lengths must start at zero to preserve magnitude comparisons.'
 };
 for(const [id,hint] of Object.entries(followHints))lesson(id).rounds[0].hint=hint;
 for(const l of L){
  l.tools=[...new Set(l.rounds.map(r=>r.bridge).filter(Boolean))];
 }
 lesson('I01CSV').tools=[];
 // Teach each adaptation before asking for it; Transfer adds no unexplained API.
 lesson('V09').tools.push('estimator="median" changes a Seaborn barplot from the default mean to the median.');
 lesson('V06').tools.push('complementary=True changes an ECDF from the fraction at or below x to the fraction above x.');
 lesson('V10').tools.push('estimator="median" changes the point summary; errorbar=None omits its error bars.');
 lesson('V12').tools.push('inner="point" draws the observed measurements inside each violin.');
 for(const id of ['V11','V14','V15'])lesson(id).tools.push('For a horizontal categorical plot, map the measurement to x and the category to y.');
 lesson('V28').tools.push('idxmin() finds the row label of the minimum, just as idxmax() finds the maximum.');
 lesson('V35').tools=[];
 lesson('V35').rounds.forEach(r=>{r.visual={type:'panels',variant:'report',label:'Concept sketch: choose a view for the question'};});
 (typeof module!=='undefined'?require('./practical.js'):root.practicalFoundations)(c);
 // Explicit numbered checkpoint instructions preserve all requirements from the prose.
 for(const l of L)for(const r of l.rounds){
  r.task=r.task.replace(/Return the Figure\./g,'Display the chart with plt.show().').replace(/Return the (DataFrame|Series|tuple|list|number|numeric array)\./g,'Leave the $1 as the final expression.');
  if(!r.demand)r.demand=l.review?'Retrieve and combine':r.label==='Follow'?'Follow the technique':r.label==='Change'?'Adapt a requirement':'Choose and combine';
  if(/preserve df|df unchanged|without (?:modifying|overwriting).*df|keep df unchanged/i.test(r.task))r.preserveData=true;
  if(!l.review&&r.label==='Transfer'){r.requiredCalls=[];r.requiredKeywords=[];r.forbiddenCalls=[];if(l.id==='W24'){r.requiredCalls=['merge'];r.requiredKeywords=[{call:'merge',keyword:'validate',value:'many_to_one'}];}}
  if(r.forbiddenCalls?.includes('apply')&&!r.task.includes('apply'))r.task+=' Do not use apply().';
  r.steps=r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 }
 for(const r of lesson('I22').rounds){const d=D[r.dataset];r.steps=[
  'Preserve df; build a dictionary named profile.',
  'Add shape (rows, columns), columns (list of names), and types (the dtypes Series).',
  `Add missing (missing counts per column) and categories (value_counts for ${d.c}).`,
  'Leave profile on the final line to display the dictionary.'
 ];r.task=r.steps.join(' ');}
 // Inspection checkpoints now answer different questions with earlier tools.
 revise('I22',1,'Using df, prepare a profile of students scoring at least 70. Select hours and score in that order and display their describe() summary. Preserve df.',
  'selected = df[df["score"] >= 70]\nselected[["hours", "score"]].describe()',
  'Select eligible students before profiling their numeric measurements.',{preserveData:true,demand:'Profile a report population'});
 revise('I22',2,'Using df, compare average temperature and humidity by sky category for station East only. Display a DataFrame with those two measurement columns in that order and sky labels sorted alphabetically. Preserve df.',
  'selected = df[df["station"] == "East"]\nselected.groupby("sky")[["temperature", "humidity"]].mean()',
  'Filter the station, then group its records and average the selected measurements.',{preserveData:true,demand:'Answer a grouped inspection question'});
 for(const r of lesson('I22').rounds)r.steps=r.task.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
 for(const [i,r] of lesson('V37').rounds.entries()){
  const d=D[r.dataset],mean=i!==0,threshold=d.columns[d.a][1];
  if(i===2)r.solution=r.solution.replace('["minutes"].sum()', '["minutes"].mean()').replace('title="Totals"','title="Means"').replace('ylabel="Total"','ylabel="Mean minutes"');
  r.steps=[`Using df, keep rows with ${d.a} greater than ${threshold} in selected. Use these same records for all three charts.`,
   `Figure 1: four-bin histogram of ${d.a}. Title Distribution; axis labels ${d.a} and Count.`,
   `Figure 2: scatter of ${d.a} against ${d.b}. Title Relationship; axis labels ${d.a} and ${d.b}.`,
   `Figure 3: exact bars of ${mean?'mean':'total'} ${d.a} by ${d.c}, with groups alphabetically ordered. Title ${mean?'Means':'Totals'}; axis labels ${d.c} and ${mean?'Mean '+d.a:'Total'}.`,
   'Create three separate Figures. Finish each with tight_layout() and display each with plt.show().'];r.task=r.steps.join(' ');
 }
 // Paths are navigation only: no saved learning, completion records or tracking.
 const chapters=[
  ['Choose and build','V35 V01 V16 V02 V04 V08 VR1'],
  ['Compare observations','V18 V09 V13 V11 V03 V17 VR2'],
  ['Explain the evidence','V22 V24 V25 V26 V27 VR3'],
  ['Make a useful report','V29 V34 V36 V37'],
  ['Optional · distribution detail','V05 V06 V07 V10 V12 V14 V15 VR4'],
  ['Optional · models and matrices','V19 V20 V21 V23 VR5'],
  ['Optional · figures and composition','V28 V30 V31 V32 V33 VR6']
 ];
 c.decks.find(d=>d.id==='visualise').chapters=chapters.map(([name])=>name);
 const newVisual=[];chapters.forEach(([,ids],chapter)=>ids.split(' ').forEach(id=>{const l=lesson(id);l.chapter=chapter;l.path=chapter<4?'core':'extension';if(!l.review)l.level=chapter<4?'Core':'Go Further';newVisual.push(l);}));
 c.lessons=[...L.filter(l=>l.deck!=='visualise'),...newVisual];
 c.decks.find(d=>d.id==='wrangle').description='Start after Inspect. Protect the original, then clean, reshape and combine with a reason for every change.';
 c.decks.find(d=>d.id==='visualise').description='Start after Inspect and Wrangle. Follow the four core chapters to a report; the final three chapters are optional extensions. Next stays within your chosen path.';
 // Retrieval must only draw on skills already encountered on its own path.
 const reviewSources={VR1:['V35','V16','V04','V08'],VR2:['V18','V09','V13','V17'],VR3:['V22','V24','V27'],VR4:['V05','V06','V10','V15'],VR5:['V19','V20','V21','V23'],VR6:['V28','V30','V31','V33']};
 for(const l of c.lessons.filter(l=>l.review)){
  const sources=reviewSources[l.id];
  l.rounds=l.rounds.map((r,i)=>{
   const source=sources?.[i]||r.retrieves;
   if(!source)return r;
   return {...clone(lesson(source).rounds[2]),id:r.id,label:`Task ${i+1}`,retrieves:source,starter:'# Retrieve the earlier skill\n',demand:'Retrieve and combine'};
  });
  if(sources){l.title='Review · '+chapters[l.chapter][0].replace('Optional · ','');l.goal='Use the skills from this chapter in a fresh question.';}
 }
 for(const l of c.lessons.filter(l=>!l.review)){
  l.example=l.rounds[0].solution;
  l.rounds[0].demand=l.rounds[0].demand||'Follow the technique';
 }
 (typeof module!=='undefined'?require('./visuals.js'):root.FoundationVisuals).configure(c);
 if(typeof process==='undefined'||!process.env.FOUNDATIONS_RAW_CODE)(typeof module!=='undefined'?require('./code-style.js'):root.styleFoundationsCode)(c);
 return c;
}
if(typeof module!=='undefined')module.exports=progress;else root.progressFoundations=progress;
})(typeof window!=='undefined'?window:globalThis);
