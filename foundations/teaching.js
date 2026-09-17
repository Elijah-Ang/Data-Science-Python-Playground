(function (root) {
  'use strict';
  // Authored teaching summaries. Diagrams use illustrative data, never exercise answers.
  const rows = `
I01|Build a table by pairing values in named lists.|Named lists|Pair values by position|Rows and columns|Every column must contain the same number of values.
I01CSV|Read a CSV file into a DataFrame you can inspect.|CSV file|Read fields and headers|A DataFrame|The separator must match the file. A preview does not shorten the loaded table.
I02|Choose a small view before making assumptions about a table.|Whole table|Choose a preview|A few complete rows|head shows the start; tail shows the end; sample selects rows throughout the table.
I03|Read the dimensions before working with a table.|DataFrame|Read its shape|Row count, column count|shape is an attribute: use df.shape without parentheses.
I04|Check exact names before selecting data.|Table|Read column or index labels|Names you can select|columns names the fields; index labels the rows. Spelling and case matter.
I05|Check how each column is stored before calculating with it.|Columns|Inspect data types|Numeric, text or date types|A numeric-looking string is still text. A present value is not necessarily valid.
I06|Select one named column as a Series.|DataFrame|Select one column name|A Series|One name selects a Series; a list of names selects a DataFrame.
I07|Keep the fields you need in the order you need them.|All columns|Select a list of names|A smaller DataFrame|Even a one-item list keeps the result two-dimensional.
I08|Select cells using their numbered positions.|Row and column positions|Select with iloc|Chosen cells|Positions start at zero. A slice includes its start and excludes its stop.
I09|Select cells using row and column labels.|Row and column labels|Select with loc|Chosen cells|Label slices include both endpoints; a list selects only the labels listed.
I10|Keep complete rows that satisfy a condition.|All rows|Test a condition|Matching rows|The condition produces True or False for each row; selection keeps the True rows.
I11|Combine conditions to describe which records qualify.|Two conditions|Combine with AND or OR|Matching rows|Use & for AND and the vertical bar for OR. Put each comparison in parentheses.
I12|Order records by one or more fields.|Unordered rows|Sort by chosen keys|Ordered rows|For several keys, the first decides the main order; later keys break ties.
I13|Find the highest or lowest values within the relevant population.|Eligible rows|Rank by a measure|Top or bottom records|Filter first when the question applies only to part of the table.
I14|Find which labels occur, or how many distinct labels exist.|One column|Find distinct values|Labels or a count|unique returns values; nunique returns their count. Check how missing values are handled.
I15|Count how often categories occur.|Category values|Count each label|A frequency table|For proportions, the selected rows determine the denominator.
I16|Find missing cells, then choose what the question needs.|Cells|Test for missing values|Counts, percentages or eligible rows|Missing is not zero. Require only the fields needed for the analysis.
I17|Find repeated records before deciding whether to remove any.|Rows|Compare selected fields|Duplicate flags|By default, only later copies are flagged. keep=False flags every copy.
I18|Summarise the relevant measures for the relevant records.|Selected rows and columns|Describe their values|A statistical summary|Choose the population first; a whole-table summary may answer a different question.
I18S|Reduce a measure to one useful answer.|Numeric values|Sum, average or find the middle|A summary value|A total, mean and median answer different questions. Most reductions skip missing values.
I19|Summarise a measure separately for each group.|Records with group labels|Split and aggregate|One summary per group|Choose a meaningful reduction: temperatures can be averaged; counts can be added.
I20|Count combinations of two categories.|Two categorical columns|Count each combination|A cross-tabulation|The first input supplies rows; the second supplies columns.
I21|Explore how numeric variables vary together.|Paired numeric values|Calculate correlation|An association matrix|Correlation measures linear association, not causation. Near zero can still hide a curved relationship.
I22|Combine inspection tools to answer a specific question.|Relevant population|Inspect and summarise|Evidence for the question|Select the correct records and measures before summarising. Preserve the source table.
W01|Keep a separate working table before making changes.|Original table|Make a copy|Independent working table|Assigning another name alone does not copy a DataFrame.
W02|Give columns clear, consistent names.|Old column names|Apply a name mapping|Renamed columns|rename returns a result: assign it when you need to keep the change.
W03|Choose and order the fields needed for a handoff.|All fields|Select an ordered list|A focused table|Fields omitted from the list are omitted from the result.
W04|Remove fields that the output does not need.|Table|Drop named columns|Retained fields|Use columns= to distinguish column names from row labels.
W05|Keep records that satisfy a stated policy.|All records|Apply eligibility conditions|Eligible records|A filter returns a selection. Assign it if the working table should change.
W06|Reset row labels after filtering or sorting.|Selected or sorted rows|Reset the index|Fresh row labels|drop=True discards the old labels; otherwise they become a column.
W07|Calculate a new measure from values in each row.|Existing measures|Apply arithmetic|A derived column|Use compatible units and keep the original values when they are still useful.
W08|Turn conditions into understandable categories.|Values|Apply ordered rules|Flags or labels|With np.select, the first matching condition wins. Put specific cases first.
W09|Translate labels with an explicit lookup.|Original labels|Apply a mapping|Standardised values|replace keeps unmatched values; map makes unmatched values missing.
W10|Clean text consistently before comparing labels.|Messy strings|Trim or normalise text|Consistent labels|Removing spaces and changing case are separate operations. Literal replacement can use regex=False.
W11|Select records by a text pattern.|Text values|Test a pattern|Matching records|case=False ignores case; regex=False treats text literally; na=False excludes missing text.
W12|Parse numeric text and make failures visible.|Raw text|Convert to numbers|Numbers and missing values|errors='coerce' exposes failures as missing values; it does not repair them.
W13|Choose a storage type that fits the values.|Column values|Convert the data type|A typed column|Integers cannot represent fractions. Nullable Int64 can represent missing integers.
W14|Turn date text into dates using a known format.|Date strings|Parse the specified format|Dates and NaT|An explicit format avoids day/month ambiguity. Invalid dates need a policy.
W15|Extract calendar information from parsed dates.|Datetime column|Use a calendar accessor|Calendar features|The .dt accessor needs datetime values, not unparsed strings.
W16|Keep records with the fields required for a particular use.|Records with gaps|Check required fields|Eligible records|Use subset to avoid excluding rows for unrelated missing fields.
W17|Fill missing values using a defensible rule.|Gaps|Apply a fill policy|Usable values|An estimate is not an observation. Zero is appropriate only when it has the right meaning.
W18|Remove confirmed duplicate records with a clear retention rule.|Repeated records|Choose which copy to keep|Retained records|Identical values can describe separate real events. Decide what makes a record a duplicate.
W19|Build a named summary for each group.|Grouped records|Apply named reductions|Summary columns|count counts known values; size counts rows, including rows with missing values.
W20|Attach a group statistic to every original row.|Grouped records|Transform within groups|One result per input row|transform preserves row alignment; aggregation reduces groups to summary rows.
W21|Summarise values across two grouping dimensions.|Long records|Group and aggregate|A pivot table|Specify rows, columns, values and reduction. An absent combination is not automatically zero.
W22|Stack repeated measurement columns into rows.|Wide table|Melt measurement columns|Long table|Keep identifier columns; the variable column tells you which measurement each value represents.
W23|Spread a variable column across new columns.|Long table|Pivot unique combinations|Wide table|pivot needs one value per row/column combination; it does not aggregate duplicates.
W24|Combine tables through a shared key.|Records and a lookup|Match key values|Joined records|A left join keeps unmatched left rows. Check key uniqueness to avoid multiplying records.
W25|Append batches with compatible columns.|Separate batches|Concatenate rows|One combined table|Check column names and units. ignore_index=True creates fresh row labels.
W26|Turn a continuous measure into defined bands.|Numeric values|Apply bin boundaries|Band labels|cut uses boundaries; qcut uses quantiles. Check endpoints and ties.
W27|Represent categories with indicator columns.|Category labels|Encode each category|Zero/one columns|Training and later data need compatible category columns.
W28|Scale measures using statistics learned from training data.|Training values|Fit a scale, then transform|Rescaled values|Fit on training data only. Reuse that fitted transformation on held-out data.
W29|Flag unusual values for review using a stated rule.|Numeric values|Calculate fences|Review candidates|An outlier flag is a reason to investigate, not proof of an error.
W30|Express column operations directly when possible.|A column|Apply a vector operation|Transformed values|Prefer arithmetic, .str or map when they express the operation clearly.
W31|Turn a messy table into a defensible handoff.|Source records|Clean under explicit policies|A usable table and audit|Keep required-field and duplicate policies tied to the purpose of this report.
V01|Create a Figure and an Axes before drawing.|A new Figure|Add an Axes|A place to plot|The Figure is the whole canvas; the Axes is the plotting area inside it.
V02|Explain a chart with a title and labelled axes.|Plotted marks|Add context and units|A readable chart|Labels should explain the measures, not just repeat short column names.
V03|Use a visual property to show an additional variable.|Paired values and a category|Map a category to colour|Grouped points|hue maps a data column; color sets one fixed colour.
V04|Show how observations are distributed across numeric intervals.|Numeric observations|Count values in bins|A histogram|Bin choices change the appearance. Tiny samples cannot establish a population shape.
V05|Explore a smoothed view of a numeric distribution.|Numeric observations|Estimate a smooth density|A density curve|Density is not a count. Smoothing and small samples can create misleading shapes.
V06|Show the fraction of observations at or below each value.|Ordered values|Accumulate their fractions|An ECDF|Read the height as the fraction at or below x; its complement is the fraction above x.
V07|Add individual observations alongside a distribution view.|Numeric observations|Mark each value|A rug plot|Overlapping ticks can hide repeated values; the rug supplies raw-data context.
V08|Compare how frequently categories occur.|Category labels|Count each category|Count bars|A required but absent category needs an explicit zero and a defined order.
V09|Compare a numeric summary between categories.|Values within groups|Calculate a group estimate|Summary bars|A mean bar is not a count. Hiding error bars does not remove uncertainty.
V10|Compare group estimates with a clearly defined interval.|Grouped values|Estimate centre and spread|Points and intervals|A standard-deviation interval describes spread; a confidence interval describes estimate uncertainty.
V11|Compare medians and quartiles across groups.|Ordered group values|Summarise quartiles|Box plots|Whiskers commonly use 1.5 IQR. Points beyond them are not automatically errors.
V12|Compare smoothed distributions across groups.|Group observations|Estimate each density|Violin shapes|Small groups and smoothing choices can make the shape unreliable.
V13|Show individual observations within categories.|Group observations|Draw every value|A strip plot|Jitter separates overlapping points without changing the measured value.
V14|Separate observations to make overlaps easier to see.|Group observations|Pack points sideways|A swarm plot|Crowded groups may not fit cleanly; keep the raw values readable.
V15|Choose a display that respects a small sample.|A few observations|Show individual values|An honest group comparison|Small groups usually need visible observations more than elaborate distribution summaries.
V16|Look for a relationship between two numeric measures.|Paired numeric values|Plot one point per row|A scatter plot|Association alone does not show that one variable causes the other.
V17|Distinguish groups with a small number of clear encodings.|Values and categories|Map colour, size or style|Readable groups|Avoid encoding too many variables at once; redundant shape can support colour.
V18|Show how a measure changes along an ordered dimension.|Ordered observations|Connect values in order|A line plot|Check sorting and repeated x values; a plotting function may aggregate repeats.
V19|Choose what repeated observations should mean in a line chart.|Repeated measurements|Select or summarise repeats|A line and optional interval|A spread interval and an uncertainty interval make different claims.
V20|Compare observations with a fitted linear trend.|Paired observations|Fit and draw a line|Points and a trend|A fitted line does not prove causality or that a linear model is suitable.
V21|Check what a fitted model fails to explain.|Observed and predicted values|Subtract prediction from observation|Residuals around zero|Curves or changing spread in residuals can reveal model problems.
V22|Compare linear associations among numeric measures.|Numeric columns|Calculate pairwise correlation|A correlation heatmap|Use a scale from -1 to 1, centred on zero. Correlation is not causation.
V23|Display combinations of two categories as a matrix.|Two categorical fields|Count or summarise combinations|A heatmap|State what each cell measures. Missing combinations and measured zeros differ.
V24|Place related charts in one Figure.|One Figure|Assign a chart to each Axes|A set of panels|Draw on the intended Axes and finish the whole Figure once.
V25|Make chart encodings easy to identify.|Mapped categories|Explain marks with a legend|An interpretable chart|Do not rely on colour alone. Transparency can help with overlapping observations.
V26|Choose axes that preserve the meaning of the comparison.|Measured values|Choose a scale and limits|Readable axes|Logarithmic axes require positive values. Limits must not hide relevant observations.
V27|Add a reference value to support interpretation.|A chart and benchmark|Draw a reference line|A visible comparison|A horizontal line uses a y value; a vertical line uses an x value.
V28|Call attention to a relevant observation with an annotation.|A selected observation|Place text and an arrow|A labelled finding|xy locates the observation; xytext locates the text. Find the point in the relevant population.
V29|Draw bars from values you have already calculated.|A computed summary|Use values as bar heights|Exact summary bars|Axes.bar does not aggregate. Choose a meaningful total or average before plotting.
V30|Show how components contribute to a total.|Component values|Stack on cumulative bases|Parts of a total|Upper segments lack a common baseline; side-by-side views can make comparisons easier.
V31|Explore relationships among a few numeric variables.|Selected numeric columns|Plot pairs and distributions|A pair grid|The grid owns its Figure. Limit variables so the panels remain readable.
V32|Combine a relationship view with its marginal distributions.|Paired numeric values|Plot joint and marginal views|A joint grid|The grid owns its Figure; use its joint Axes when annotating the relationship.
V33|Compare the same chart across subsets.|Values and a grouping field|Split into comparable panels|Facets|Use comparable scales and clear group labels. A figure-level grid manages its own Figure.
V34|Export the Figure you have finished preparing.|A finished Figure|Save with size and format|An image file|Save the intended Figure. DPI controls raster resolution; tight bounding boxes help retain labels.
V35|Choose a chart by the question and the types of data.|An analytical question|Identify variables and purpose|A suitable chart|Relationships, distributions, category counts and ordered changes need different displays.
V36|Make visual comparisons that fairly represent the values.|A question and its data|Choose honest encodings|A supported comparison|Bars usually need a zero baseline. Do not omit observations that change the conclusion.
V37|Build several views that answer one coherent reporting question.|One selected population|Summarise and plot|Related evidence|Use the same population across views and choose meaningful aggregations.
`.trim().split('\n');
  const copy = Object.fromEntries(rows.map(line => {
    const [id, summary, input, operation, output, rule] = line.split('|');
    return [id, {summary, route: [input, operation, output], rule}];
  }));
  const routes = Object.fromEntries(`
I01CSV-2|Delimited text|Match the separator|Separate columns
I01CSV-3|CSV file|Load, then preview|The first rows
I02-2|Whole table|Look at the end|Last rows
I02-3|Whole table|Sample with a fixed seed|A repeatable preview
I03-2|Whole table|Count records|A row count
I03-3|CSV file|Load, then read dimensions|Rows and columns
I04-2|DataFrame|Read its index|Row labels
I04-3|CSV file|Load, then inspect columns|Field names
I05-3|CSV file|Load, then inspect types|Storage types
I14-3|Selected records|Find distinct labels|Relevant categories
I16-2|Missing-value flags|Divide counts by row count|Missing percentages
I16-3|All records|Check required fields|Eligible records
I17-3|Records|Flag every repeated copy|All duplicate members
I22-1|Whole table|Inspect structure and gaps|A compact profile
I22-2|Eligible students|Describe selected measures|A numeric profile
I22-3|Selected station|Group by weather|Group means
W01-2|Original table|Copy, then sort|Ordered working table
W01-3|Original table|Copy, filter and sort|Eligible working table
W07-2|Price and tip|Add row by row|A total column
W07-3|Age in years|Convert units|Age in months
W09-2|Labels and lookup|Map known codes|Codes and missing values
W12-2|Raw text|Parse and identify failures|An invalid-value count
W16-3|Raw records|Parse and check eligibility|Kept rows and exclusions
W17-3|Original gaps|Record gaps, then fill|Values and a fill flag
W24-3|Records and lookup|Join and check matches|Unmatched records
W25-2|Indexed batches|Append without renumbering|Original row labels
W28-3|Training and held-out data|Fit on training; transform both|Comparable scaled values
W29-3|Numeric records|Flag, select and sort|Candidates for review
W31-1|Working copy|Clean confirmed problems|A usable handoff
W31-2|Raw values|Parse and check eligibility|Clean rows and an audit
W31-3|Billing records|Validate required measures|Eligible billing rows
V19-3|Repeated measurements|Select one replicate|One ordered line
V30-3|Component values|Use a common baseline|A direct comparison
`.trim().split('\n').map(line => {const [id,...route] = line.split('|'); return [id,route];}));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function model(curriculum, lesson, round) {
    const source = round.retrieves ? curriculum.lessons.find(item => item.id === round.retrieves) : lesson;
    if (!source || !copy[source.id]) throw new Error('Missing visual teaching: ' + lesson.id);
    const effectiveRound = round.retrieves ? source.rounds[2] : round;
    return {...copy[source.id], route: routes[effectiveRound.id] || copy[source.id].route, source, effectiveRound};
  }
  function previewDiagram(round) {
    const kind = round.id.endsWith('-2') ? 'tail' : round.id.endsWith('-3') ? 'sample' : 'head';
    const selected = {head:[0,1],tail:[3,4],sample:[1,3]}[kind];
    const records = [['A',2],['B',4],['C',6],['D',8],['E',10]];
    function row(values,y,chosen) {
      return '<rect x="12" y="' + y + '" width="93" height="14" class="' + (chosen?'visual-selected':'visual-cell') + '"/><text x="22" y="' + (y+10) + '">' + values[0] + '</text><text x="65" y="' + (y+10) + '">' + values[1] + '</text>';
    }
    const label = {head:'head(2): first two rows',tail:'tail(2): last two rows',sample:'sample: rows from across the table'}[kind];
    return '<svg class="concept-visual" viewBox="0 0 260 108" role="img" aria-label="' + label + '"><title>' + label + '</title><g>' + records.map((record,i)=>row(record,8+i*14,selected.includes(i))).join('') + '<path d="M114 43h27m-6-5 6 5-6 5"/><g transform="translate(139 15)">' + selected.map((index,i)=>row(records[index],8+i*14,true)).join('') + '</g><text x="130" y="100" class="visual-caption">' + label + '</text></g></svg>';
  }
  function intro(curriculum, lesson, round) {
    const m = model(curriculum, lesson, round);
    const visuals = root.FoundationVisuals;
    const chartChoices = [['scatter','Two numeric variables'],['histogram','One numeric distribution'],['count-bars','Category frequencies'],['line','Change over time']];
    const diagram = m.source.id === 'V35'
      ? '<div class="teaching-chart-choices">' + chartChoices.map(([id,label]) => '<figure>' + visuals.diagram(visuals.spec(id)) + '<figcaption>' + esc(label) + '</figcaption></figure>').join('') + '</div>'
      : '<figure class="teaching-illustration">' + (m.source.id === 'I02' ? previewDiagram(m.effectiveRound) : visuals.diagram(round.visual)) + '<figcaption>Illustrative example · use the supplied data for your task</figcaption></figure>';
    return '<section class="teaching-overview" data-teaching-source="' + esc(m.source.id) + '"><h3>' + (round.retrieves ? 'Recall · ' + esc(m.source.title) : 'The idea, visually') + '</h3><p class="teaching-summary">' + esc(m.summary) + '</p>' + diagram + '<ol class="teaching-route" aria-label="How the operation works">' + m.route.map((text,i) => '<li><span class="teaching-route-label">' + ['Input','Operation','Result'][i] + '</span><strong>' + esc(text) + '</strong></li>').join('') + '</ol><p class="teaching-rule"><strong>Remember</strong> ' + esc(m.rule) + '</p><details class="teaching-detail"><summary>More detail</summary><p>' + esc(m.source.explanation) + '</p></details>' + (m.source.tools?.length ? '<aside class="teaching-tools"><h3>Tools you may need</h3><ul>' + m.source.tools.map(tool => '<li>' + esc(tool) + '</li>').join('') + '</ul></aside>' : '') + (round.retrieves ? '<details><summary>Recall the syntax</summary>' + syntax(m.source) + '</details>' : '') + '</section>';
  }
  function syntax(lesson) {
    return '<pre class="isolated-syntax"><code>' + esc(lesson.syntaxCode) + '</code></pre><dl class="foundation-syntax teaching-syntax-parts">' + lesson.syntax.map(([code,meaning],i) => '<div><dt><span aria-hidden="true">' + (i+1) + '</span><code>' + esc(code) + '</code></dt><dd>' + esc(meaning) + '</dd></div>').join('') + '</dl>';
  }
  const api = {copy, model, intro, syntax};
  root.FoundationTeaching = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
