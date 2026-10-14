/* Shared, version-pinned reference for the options used by Visualise lessons.
 * Code inventory audits final assembly; authored progression chooses current
 * teaching. Reused syntax stays available on demand. No learner state is stored.
 */
(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sources={
 categorical:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/categorical.py',
 relational:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/relational.py',
 distributions:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/distributions.py',
 regression:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/regression.py',
 matrix:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/matrix.py',
 facets:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/axisgrid.py',
 statistics:'https://github.com/mwaskom/seaborn/blob/v0.13.2/seaborn/_statistics.py',
 axes:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/axes/_axes.py',
 axesBase:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/axes/_base.py',
 figure:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/figure.py',
 text:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/text.py',
 legend:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/legend.py',
 pyplot:'https://github.com/matplotlib/matplotlib/blob/v3.5.2/lib/matplotlib/pyplot.py',
 pandas:'https://github.com/pandas-dev/pandas/blob/v2.2.0/pandas/core/frame.py',
 pivot:'https://github.com/pandas-dev/pandas/blob/v2.2.0/pandas/core/reshape/pivot.py'
};
const registry={};
function entry(key,purpose,forms,range,defaultValue,effect,example,caveat,source){
 registry[key]={id:key,keyword:key.split('.').at(-1),purpose,forms,range,default:defaultValue,effect,example,caveat,source:sources[source]};
}
entry('data','Choose the table or values the chart reads.','A pandas DataFrame, compatible mapping, Series or array-like data.','Use rows from the population named in the question.','None for these Seaborn long-form chart functions.','Column-name mappings such as x="cost" are looked up in this object.','sns.scatterplot(data=df, x="distance", y="minutes")','heatmap expects a required rectangular numeric matrix; pairplot expects a table. Their data argument is not optional.', 'relational');
for(const key of ['x','y'])entry(key,`Map a variable to the ${key} axis.`,'A column name in data or an aligned vector of values.','Numeric or categorical values, according to the chart.','None.','Sets which measurements or categories determine mark positions.',`sns.scatterplot(data=df, ${key}="minutes")`,'Categorical charts position category levels on one axis; swapping x and y changes orientation. regplot/residplot require numeric pairs.', 'relational');
entry('hue','Map a variable to mark colour.','A column name or aligned vector.','Categories use distinct colours; numeric values can use a continuous scale.','None.','Adds a colour encoding and usually a legend.','sns.scatterplot(data=df, x="distance", y="minutes", hue="route")','Colour indicates the mapped variable, not a causal effect. Use colour choices consistently across panels.', 'relational');
entry('style','Map a variable to marker shape or line pattern.','A column name or aligned vector.','Levels are treated as categories, including numeric values.','None.','Distinguishes groups with a second visual channel.','sns.scatterplot(data=df, x="distance", y="minutes", style="route")','Mapping hue and style to the same group is redundant encoding; it does not add another measured variable.', 'relational');
entry('size','Map a data variable to mark size.','A column name or aligned vector.','Numeric values use a scaled range; categories use distinct sizes.','None.','Larger marks encode different values of the mapped variable.','sns.scatterplot(data=df, x="distance", y="minutes", size="parcels")','In scatterplot, size maps data. In stripplot and swarmplot, size is a fixed marker radius instead.', 'relational');
for(const fn of ['stripplot','swarmplot'])entry(fn+'.size','Set a fixed marker radius.','A number in points.','Use a positive radius; 0 makes the points invisible.','5 points.','Makes every observation marker larger or smaller.',`sns.${fn}(data=df, x="group", y="cost", size=4)`,'This does not map a column. Seaborn converts the radius to Matplotlib scatter area by squaring it; large swarm markers can prevent packing.', 'categorical');
entry('ax','Choose the Matplotlib Axes that receives the chart.','A Matplotlib Axes object.','One of the axes returned by plt.subplots, or another existing Axes.','None: use the currently active Axes.','Places marks in the intended panel rather than whichever panel is active.','sns.histplot(data=df, x="cost", ax=axes[0])','Figure-level functions such as relplot, catplot, displot, pairplot and jointplot create their own Figure; do not pass ax to them.', 'relational');
entry('figsize','Set the Figure dimensions.','A pair (width, height) of numbers in inches.','Both dimensions must be positive.','Matplotlib rcParams["figure.figsize"], normally (6.4, 4.8).','Changes the available canvas space, not the data.','fig, ax = plt.subplots(figsize=(6, 4))','Pixel dimensions also depend on DPI. A multi-panel Figure shares this total size across its panels.', 'pyplot');
for(const key of ['nrows','ncols'])entry(key,'Choose the number of subplot rows or columns.','A positive integer.','At least 1.','1.','Creates a grid of separate Axes.','fig, axes = plt.subplots(nrows=1, ncols=2)','With the default squeeze=True, a 1×1 grid returns one Axes and a 1×2 grid returns a one-dimensional array.', 'pyplot');
for(const key of ['sharex','sharey'])entry(key,'Choose whether panels share an axis scale.','A boolean or "none", "all", "row", "col".','True/"all" shares all; False/"none" keeps scales independent.','False.','Coordinates limits and ticks between the selected panels.','fig, axes = plt.subplots(1, 2, sharey=True)','A shared scale supports comparisons, but may make a small-range panel harder to read. Shared axes cannot later be unshared.', 'pyplot');
entry('title','Name the question or view shown by the Axes.','A text string.','Use a short, informative description.','An empty title on a new Axes.','Adds a heading above the plot.','ax.set(title="Delivery time by route")','A title does not replace labels stating units and the analysed population.', 'axes');
for(const key of ['xlabel','ylabel'])entry(key,'Label an axis and its units.','A text string.','Describe the mapped variable; include units when known.','Empty on a new Axes; Seaborn may infer a column name.','Explains how to read positions on that axis.',`ax.set(${key}="Minutes")`,'Changing a label does not change the data or scale.', 'axesBase');
entry('bins','Choose histogram bin boundaries.','A positive integer bin count, a sequence of numeric edges, or a NumPy bin-rule string such as "auto".','Edges must increase; a count must be at least 1. There is no universal best count.','"auto" in histplot (and displot kind="hist").','Controls which observations are grouped into each interval.','sns.histplot(data=df, x="weight", bins=[0, 2, 5, 10])','Unequal-width bins still show counts by default: taller bars need not mean greater density per unit. Matplotlib hist defaults to 10 bins instead.', 'distributions');
entry('bw_adjust','Multiply the density estimator bandwidth.','A positive number.','Below 1 gives less smoothing; above 1 gives more. There is no 0–1 restriction.','1.','Changes the smoothness of a KDE or violin outline.','sns.kdeplot(data=df, x="minutes", bw_adjust=1.5, cut=0)','Smoothing cannot create more observations. Tiny samples do not support reliable tail or population-shape claims.', 'distributions');
entry('cut','Limit how far a density curve extends beyond the extreme observations.','A nonnegative number of bandwidth units.','0 ends the evaluation grid at the observed extremes; larger values extend it.','3 in kdeplot; 2 in violinplot.','Changes the displayed density support, without removing observations.','sns.violinplot(data=df, x="group", y="cost", cut=0)','cut=0 does not correct boundary bias or prove that a population ends at the smallest and largest observed values.', 'categorical');
entry('order','Set the order of categorical positions.','A sequence of category values, usually strings.','List the levels you intend to display in the intended order.','None: infer levels from the data.','Moves groups into a deliberate display order without changing their statistics.','sns.countplot(data=df, x="status", order=["open", "closed"])','In regplot, order means polynomial degree instead; that is a different option. Missing listed categories can remain as empty positions.', 'categorical');
for(const key of ['hue_order','style_order'])entry(key,'Set the order of the levels in a visual mapping.','A sequence of level values.','Use consistent levels and order across related charts.','None: infer levels from the data.','Coordinates colours or marker styles and legend order.',`sns.scatterplot(data=df, x="distance", y="minutes", ${key==='hue_order'?'hue':'style'}="route", ${key}=["local", "express"])`,'hue_order concerns colour groups, while style_order concerns style groups. Neither sorts the underlying rows.', 'relational');
entry('estimator','Choose the summary calculated within each group.','An aggregation string accepted by pandas, or a callable that maps a vector of observations to one scalar.','Examples include "mean", "median", "sum", "min", "max", or lambda v: np.quantile(v, .75).','"mean" in barplot, pointplot and lineplot.','Changes the statistic shown by each bar, point or aggregated line position.','sns.barplot(data=df, x="group", y="cost", estimator="median", errorbar=None)','barplot and pointplot need a scalar aggregation; do not use None to request raw observations. With bootstrap CI, a callable must also handle resampled NumPy arrays. Use a strip/swarm chart for individual rows.', 'categorical');
entry('lineplot.estimator','Choose aggregation at each x value, or keep individual observations.','An aggregation string, a vector-to-scalar callable, or None.','Use None when aggregation is inappropriate; otherwise choose the statistic that answers the question.','"mean".','With None, lineplot draws observations instead of reducing repeated x values to a summary.','sns.lineplot(data=df, x="day", y="minutes", estimator=None)','lineplot still sorts by x by default. For independent replicate traces, map their identifier with units and use estimator=None.', 'relational');
entry('errorbar','Choose a spread or uncertainty interval around the summary.','"ci", "pi", "se", "sd"; (method, level); a vector-to-(low, high) callable; or None.','ci/pi levels are percentile widths from 0 to 100. se/sd levels are nonnegative multipliers, not percentages.','("ci", 95). A bare "ci"/"pi" uses 95; a bare "se"/"sd" uses 1.','sd/pi describe spread of observations; se/ci describe estimate uncertainty. CI bootstraps the chosen estimator; se uses the standard error of the mean. None hides the interval.','sns.pointplot(data=df, x="group", y="cost", errorbar=("sd", 2))','CI uses bootstrap resampling (n_boot=1000, seed=None by default). Use seed for reproducibility. A callable supplies actual endpoints. Small samples give weak evidence; intervals do not establish causation.', 'statistics');
entry('n_boot','Choose the number of bootstrap resamples.','A positive integer.','More resamples increase computation and can stabilise the simulated interval; they do not add observations.','1000.','Changes the bootstrap calculation used for confidence intervals.','sns.barplot(data=df, x="group", y="cost", errorbar=("ci", 95), n_boot=2000, seed=7)','Used for bootstrap CI, not sd, se or pi intervals. In regplot it supports ci; the regplot ci API differs from errorbar.', 'statistics');
entry('seed','Make bootstrap resampling repeatable.','An integer, NumPy Generator, RandomState, or None.','Any valid generator seed; None leaves randomness unseeded.','None.','Makes an unchanged bootstrap calculation repeatable.','sns.pointplot(data=df, x="group", y="cost", errorbar="ci", seed=7)','This controls bootstrap randomness, not stripplot jitter. A fixed seed does not improve the reliability of a small sample.', 'categorical');
entry('jitter','Separate overlapping observations along the categorical direction.','True, False, or a numeric half-width.','False/0 switches it off. A nonnegative float sets the uniform displacement half-width; there is no 0–1-only range. Boolean True selects the special default amount.','True; internally the default half-width is 0.1 category units.','Adds random categorical-axis displacement while leaving the measured coordinate unchanged.','sns.stripplot(data=df, x="group", y="cost", jitter=0.15)','With ordinary ordinal categories, jitter=0.15 means up to ±0.15 category positions. The 0.13.2 docstring calls True/1 special-cased, but its implementation special-cases only boolean True: numeric 1 uses a half-width of 1. dodge narrows jitter by hue levels; native_scale changes the category unit. Large jitter can mix neighbouring groups.', 'categorical');
entry('ci','Choose the regression estimate confidence band.','A number from 0 to 100, or None.','The number is a percentage width; None disables the band.','95 in regplot.','Controls the bootstrap confidence band around the fitted regression line.','sns.regplot(data=df, x="distance", y="minutes", ci=None)','regplot uses ci, not the errorbar interface: it does not accept "sd", "pi" or an interval callable through ci. A fitted association does not establish causation.', 'regression');
entry('color','Use one fixed colour.','A Matplotlib colour name, hex string, RGB/RGBA tuple, or another accepted colour specification.','RGB channels and any alpha channel lie between 0 and 1.','None: choose a colour from the active palette or colour cycle.','Sets the colour of marks or lines without mapping another variable.','sns.stripplot(data=df, x="group", y="cost", color="black")','Use hue with palette for a variable-to-colour mapping. Fixed colour should not be presented as a separate data channel.', 'categorical');
entry('palette','Choose colours for a hue mapping.','A palette name, list of colours, category-to-colour dictionary, or Matplotlib colormap.','Dictionary keys must match the hue levels. Choose distinguishable colours for categories.','None: the current Seaborn palette or an inferred numeric colormap.','Changes which colours encode the hue values.','sns.scatterplot(data=df, x="distance", y="minutes", hue="route", palette={"local":"blue", "express":"orange"})','A numeric colormap conveys ordering; an arbitrary categorical palette does not. Keep the same mapping across comparisons.', 'relational');
entry('alpha','Set transparency.','A number, or None to use the artist default.','0 is fully transparent; 1 is opaque.','Normally opaque for scatterplot unless the style or artist specifies otherwise.','Makes overlapping marks easier to see.','sns.scatterplot(data=df, x="distance", y="minutes", alpha=0.5)','Overlapping translucent marks may appear darker; this is not a calibrated count or density scale.', 'axes');
entry('marker','Choose a fixed marker shape.','A Matplotlib marker specification, such as "o", "s", or "^".','Use a shape that remains readable at the displayed size.','No visible point marker for lineplot; scatterplot normally uses circles through Matplotlib.','Shows positions with the chosen symbol.','sns.lineplot(data=df, x="day", y="minutes", marker="o")','marker selects a fixed shape. style maps a data variable to shapes or line patterns.', 'relational');
entry('capsize','Set error-bar cap width.','A nonnegative number.','Measured relative to categorical position spacing; 0 draws no caps.','0 in barplot and pointplot.','Adds horizontal caps at interval endpoints.','sns.pointplot(data=df, x="group", y="cost", errorbar="sd", capsize=0.15)','This changes appearance only. Matplotlib errorbar uses capsize in points, so its units differ.', 'categorical');
entry('inner','Choose the marks drawn inside each violin.','"box", "quart", "point", "stick", or None (strings starting with these names are accepted).','None omits internal marks; the other choices show summaries or observations.','"box".','Adds an interior cue to the smooth density outline.','sns.violinplot(data=df, x="group", y="cost", inner="quart", cut=0)','The outline is a smoothed estimate. For a tiny sample, showing raw observations can be more honest than treating the violin shape as stable.', 'categorical');
entry('annot','Write values inside heatmap cells.','True/False, or a rectangular array-like annotation table of the same shape.','True uses the plotted values; False/None draws no annotations.','None.','Shows precise values alongside colour.','sns.heatmap(matrix, annot=True, fmt=".0f")','An annotation DataFrame is matched by position, not by index labels. Ensure its rows and columns align with the plotted matrix.', 'matrix');
entry('fmt','Format heatmap annotation text.','A Python format-specification string.','For example ".0f" means no decimals, ".2f" two decimals, and ".0%" percent notation.','".2g".','Changes annotation display precision, without changing values.','sns.heatmap(matrix, annot=True, fmt=".2f")','fmt matters only when annotations are enabled. Percent formatting is appropriate for proportions such as 0.25, not already-scaled values such as 25.', 'matrix');
entry('cmap','Map numeric heatmap values to colours.','A Matplotlib colormap name/object or list of colours.','Use sequential colour for ordered amounts and diverging colour for meaningful signed differences.','None: Seaborn chooses according to whether center is set.','Sets the numeric colour scale.','sns.heatmap(correlation, cmap="coolwarm", vmin=-1, vmax=1, center=0)','cmap is a matrix value mapping; palette is normally a hue-variable mapping. Colour alone is less precise than annotated values.', 'matrix');
for(const key of ['vmin','vmax'])entry(key,'Anchor the lower or upper end of the heatmap colour scale.','A number or None.','Choose meaningful shared endpoints, with vmin less than vmax.','None: infer the colour limits from data and other options.','Makes colour meaning comparable across related heatmaps.',`sns.heatmap(correlation, ${key}=${key==='vmin'?'-1':'1'})`,'Values beyond a chosen limit use the end colour. A fixed scale can reveal comparisons but can also hide variation; state the scale.', 'matrix');
entry('center','Set the meaningful midpoint of a diverging colour scale.','A numeric value or None.','Choose a substantive reference, such as 0 for signed correlation.','None.','Centres the colormap around the supplied value and influences the default cmap.','sns.heatmap(correlation, center=0, vmin=-1, vmax=1)','center does not set the data limits or subtract a reference from the matrix. Use vmin/vmax separately when shared limits matter.', 'matrix');
entry('complementary','Show the survival form of the empirical cumulative distribution.','A boolean.','False shows the ECDF; True shows its complement.','False.','Switches the cumulative proportion to 1 minus that proportion.','sns.ecdfplot(data=df, x="minutes", complementary=True)','The complementary curve describes the proportion strictly above each plotted observed value; the regular ECDF describes the proportion at or below it.', 'distributions');
entry('legend','Choose how a semantic legend is shown.','"auto", "brief", "full" or False on relational plots; boolean on distribution functions.','"brief" samples numeric levels; "full" includes every level.','"auto" on scatterplot/lineplot; True on distribution plots.','Controls the key explaining hue, size or style.','sns.scatterplot(data=df, x="distance", y="minutes", hue="route", legend="full")','False removes the key, not the mapping. Keep categories interpretable through direct labels or another clear key.', 'relational');
entry('labels','Supply the displayed legend text.','A sequence of strings.','One label for each corresponding legend handle.','Infer labels from the artists when omitted.','Names the plotted groups in the legend.','ax.legend(labels=["Observed", "Reference"])','Passing only labels depends on artist order and can mislabel evidence. Explicit handles plus labels are safer when combining artists.', 'axes');
entry('legend.title','Name the variable represented by the legend.','A string or None.','Use the grouping variable or another concise description.','None.','Adds a heading to the legend.','ax.legend(title="Route")','This does not change group labels; supply the intended artist labels separately.', 'legend');
for(const key of ['col','row'])entry(key,'Split a figure into panels by category.','A column name in the supplied data.','Use a modest number of levels so each panel stays readable.','None: do not facet in this direction.','Creates separate panels using the same plotting kind.',`sns.relplot(data=df, x="distance", y="minutes", ${key}="route", kind="scatter")`,'Figure-level functions create their own Axes. Check that each panel uses the correct population and that scales support the requested comparison.', 'facets');
entry('height','Set each facet panel height.','A positive number of inches.','Must be greater than 0.','5 in relplot/catplot/displot; 2.5 in pairplot; 6 in jointplot.','Changes panel dimensions, rather than the total Figure size.','sns.displot(data=df, x="cost", col="group", height=3)','With aspect=1 by default, each facet is approximately as wide as it is high. More panels increase the total Figure dimensions.', 'facets');
entry('aspect','Set each facet panel width relative to its height.','A positive number.','Panel width = height × aspect.','1 in the facet functions used here.','Makes each panel wider or narrower.','sns.relplot(data=df, x="distance", y="minutes", col="route", height=3, aspect=1.2)','This is panel geometry, not a data-axis aspect ratio. jointplot does not expose this same facet parameter.', 'facets');
entry('kind','Choose the chart drawn by a figure-level convenience function.','A supported chart-name string.','relplot: "scatter"/"line"; catplot: "strip", "swarm", "box", "violin", "boxen", "point", "bar", "count"; displot: "hist", "kde", "ecdf"; jointplot: "scatter", "kde", "hist", "hex", "reg", "resid".','"scatter" in relplot/jointplot; "strip" in catplot; "hist" in displot.','Dispatches to that plotting function and its statistical choices.','sns.catplot(data=df, x="group", y="cost", col="region", kind="box")','Accepted options depend on the selected kind. For example bins belongs to hist, estimator to aggregate line/bar/point, and jitter to strip.', 'facets');
entry('vars','Choose variables for a pairplot.','A list of column-name strings.','Select a small set of meaningful numeric measurements.','None: infer suitable numeric columns.','Limits the pairwise relationships and diagonal distributions shown.','sns.pairplot(df, vars=["distance", "minutes"], corner=True)','Numeric IDs are not measurements merely because they contain numbers. Check missingness and pairwise eligible rows.', 'facets');
entry('diag_kind','Choose the pairplot diagonal display.','"auto", "hist", "kde" or None.','None omits the diagonal distribution; hist shows bins; kde shows a smoothed estimate.','"auto"; normally hist without hue and kde with hue.','Changes the univariate displays along the diagonal.','sns.pairplot(df, vars=["distance", "minutes"], diag_kind="hist")','For a tiny sample, a histogram or raw-data view avoids overstating density shape. Each diagonal concerns one variable, not a pairwise association.', 'facets');
entry('corner','Show only the lower triangle in a pairplot.','A boolean.','True omits the duplicate upper-triangle relationships.','False.','Reduces repeated panels while retaining the diagonal.','sns.pairplot(df, vars=["distance", "minutes"], corner=True)','It changes layout only; the remaining panels still need correct pairwise populations and labels.', 'facets');
entry('linestyle','Choose a fixed line pattern.','A Matplotlib style string such as "-", "--", ":", "-.", or a dash specification.','Use distinct readable patterns.','Normally a solid line.','Makes a reference line visually distinct.','ax.axvline(10, linestyle="--")','Reference lines mark a threshold or benchmark; drawing one does not make it an inferred statistical finding.', 'axes');
entry('bar.bottom','Set the starting vertical coordinate of bars.','A scalar number or one value per bar.','Use the same units as bar heights.','0.','Offsets each bar; for a stack, the upper component begins at the lower component height.','ax.bar(groups, second, bottom=first, label="Second component")','A stack requires additive components with compatible units. Unequal baselines make upper-segment comparisons harder.', 'axes');
entry('label','Name an artist for the legend.','A string (bar also accepts per-bar labels).','Use a meaningful group or component name.','No useful legend label is supplied by default.','Makes the artist discoverable by ax.legend().','ax.bar(groups, first, label="Resolved")','Calling label alone does not draw a legend. Repeated per-bar labels are not automatically deduplicated.', 'axes');
entry('set_ylim.bottom','Set the lower y-axis display limit.','A number or None.','Choose a limit consistent with the question; 0 is usual for magnitude bars.','None: retain the current lower limit.','Changes the displayed coordinate range.','ax.set_ylim(bottom=0)','Truncated bar axes can exaggerate differences. A logarithmic axis cannot show 0; retain a positive lower limit there.', 'axesBase');
for(const key of ['bottom','left'])entry('subplots_adjust.'+key,'Set a Figure margin.','A number measured as a fraction of the Figure width or height.','Usually between 0 and 1, with left < right and bottom < top.','None: retain the current setting; initial Matplotlib defaults are left=0.125, bottom=0.11.','Leaves room for labels or titles around the Axes.',`fig.subplots_adjust(${key}=0.2)`,'This is a layout margin, not an axis limit or a stacked-bar baseline.', 'figure');
entry('tick_params.axis','Choose which axis tick appearance is changed.','"x", "y" or "both".','These are the three supported axis selectors.','"both".','Restricts the tick styling to the intended axis.','ax.tick_params(axis="x", labelrotation=45)','This selects tick styling; pandas axis instead selects table rows or columns.', 'axesBase');
entry('labelrotation','Rotate tick-label text.','A number of degrees.','Choose an angle that keeps labels readable; 0 is horizontal.','0 for unrotated labels unless previously changed.','Changes label orientation without changing category order.','ax.tick_params(axis="x", labelrotation=45)','Rotate only when useful and leave room in the layout. It does not resolve unclear or excessively numerous category labels.', 'axesBase');
entry('xy','Set the point an annotation refers to.','A pair (x, y) of coordinates.','Coordinates use xycoords, which defaults to "data".','Required for annotate.','Positions the annotation target and any arrow endpoint.','ax.annotate("Benchmark", xy=(10, 20))','Data coordinates refer to measured axis units. An annotation target does not add an observation to the dataset.', 'text');
entry('xytext','Set the annotation text position.','A pair (x, y) of coordinates, or None.','Its units are determined by textcoords.','None: use xy.','Moves the text away from the target.','ax.annotate("Benchmark", xy=(10, 20), xytext=(8, 30))','With textcoords="offset points", xytext is a relative displacement in points rather than a second data coordinate.', 'text');
entry('textcoords','Choose coordinate units for annotation text.','A supported coordinate string, transform, artist or callable; a pair may specify x and y systems separately.','Useful strings include "data", "axes fraction", "figure fraction", "offset points" and "offset pixels".','None: use the xycoords system (normally "data").','Determines how xytext is interpreted.','ax.annotate("High", xy=(10, 20), xytext=(0, 12), textcoords="offset points")','Offset coordinates apply to textcoords and are relative to xy. Axes fraction uses (0,0) at the lower left and (1,1) at the upper right.', 'text');
entry('xycoords','Choose coordinate units for an annotation target.','A supported coordinate string, transform, artist or callable.','"data" uses measured values; "axes fraction" uses relative panel coordinates.','"data".','Determines how xy is interpreted.','ax.annotate("Panel A", xy=(0.05, 0.95), xycoords="axes fraction")','The target coordinate system and the text coordinate system can differ. Check both before interpreting an arrow.', 'text');
entry('arrowprops','Choose whether and how an annotation arrow is drawn.','A dictionary of arrow properties, or None.','For example {"arrowstyle": "->"}; widths and colours follow Matplotlib arrow properties.','None: no arrow.','Connects annotation text to xy with the chosen arrow.','ax.annotate("High", xy=(10, 20), xytext=(8, 30), arrowprops={"arrowstyle":"->"})','The arrow is an explanatory cue. Its length or thickness does not encode a measurement unless that is explicitly designed.', 'text');
entry('dpi','Set the exported image resolution.','A positive number of dots per inch, or "figure".','More DPI increases raster pixels for the same physical Figure size.','rcParams["savefig.dpi"], normally "figure".','Controls raster resolution at save time.','fig.savefig("chart.png", dpi=150)','DPI does not improve a sparse dataset or make text semantically correct. Vector formats such as SVG/PDF keep most elements resolution independent.', 'figure');
entry('bbox_inches','Choose the saved image boundary.','None, "tight", or a Matplotlib Bbox in inches.','"tight" computes a boundary around the artists.','None: save the full Figure rectangle.','Can include labels while trimming excess outer space.','fig.savefig("chart.png", dpi=150, bbox_inches="tight")','A tight boundary can change the exported dimensions from figsize × dpi. Check that annotations and legends are included.', 'figure');
entry('subset','Choose which columns determine missing-row removal.','A column label or a sequence of labels.','Use the variables needed for the analysis.','None: consider all columns.','dropna removes rows with missing values in the selected columns (how="any" by default).','working = df.dropna(subset=["wait_minutes", "consult_minutes"])','Pairwise eligibility differs from dropping every row with any missing field. Record the analysed population before comparing charts.', 'pandas');
entry('numeric_only','Restrict correlation to numeric/boolean columns.','A boolean.','True includes float, integer and boolean columns.','False in pandas 2.2.0 DataFrame.corr.','Excludes columns that cannot be used in the numeric calculation.','matrix = df[measurements].corr(numeric_only=True)','This does not identify meaningful measurements: numeric IDs still qualify. corr uses pairwise complete observations, so pair counts can differ.', 'pandas');
entry('axis','Choose pandas table direction or alignment.','0/"index" or 1/"columns".','sum(axis=1) works across columns within each row; sum(axis=0) works down rows.','0 for DataFrame.sum; "columns" (1) for DataFrame.div.','For div, axis tells pandas whether a Series aligns with row labels or column labels.','row_proportions = counts.div(counts.sum(axis=1), axis=0)','The direction of summation and the alignment direction of division are different decisions. A zero denominator produces missing or infinite results, not a meaningful proportion.', 'pandas');
entry('pivot_table.index','Choose the pivot table row groups.','A column label, Grouper, array, or list of these.','Array groupers must match the row count.','None.','Groups observations into the pivot row labels.','df.pivot_table(index="region", columns="status", values="cost", aggfunc="mean")','Unlike a DataFrame constructor index, these are grouping keys from the original observations.', 'pivot');
entry('DataFrame.index','Set DataFrame row labels.','An Index or array-like labels.','Length must match the number of rows; labels need not be unique.','A RangeIndex when no index is supplied or inferred.','Names the rows without adding a data column.','pd.DataFrame({"count":[2, 3]}, index=["open", "closed"])','Row labels are not measurements. Pivot-table index selects groups rather than assigning labels directly.', 'pandas');
entry('columns','Choose pivot table column groups.','A column label, Grouper, array, or list of these.','Array groupers must match the row count.','None.','Groups observations into pivot column labels.','df.pivot_table(index="region", columns="status", values="cost", aggfunc="sum")','Absent combinations are missing unless an explicit fill is justified. A missing value must not silently become an observed zero.', 'pivot');
entry('values','Choose the variable(s) aggregated by a pivot table.','A column name or list of column names.','Use variables with meaningful units for the selected aggregation.','None: aggregate suitable remaining columns.','Controls what goes inside each grouped cell.','df.pivot_table(index="region", columns="status", values="cost", aggfunc="mean")','The grouping keys define cell populations. Selecting values does not fix a wrong population or make missing combinations observed.', 'pivot');
entry('aggfunc','Choose a pivot-table aggregation.','A function, aggregation name, list of functions, or mapping of columns to aggregations.','The operation must be meaningful for the selected values.','"mean".','Reduces the observations in each cell to the requested summary.','df.pivot_table(index="region", columns="status", values="cost", aggfunc="sum")','A total, mean and record count answer different questions. Do not replace an unknown combination with zero merely to make the heatmap complete.', 'pivot');
entry('ascending','Choose sort direction.','A boolean or a list of booleans for a multi-column DataFrame sort.','True means low to high; False means high to low.','True.','Changes displayed order without changing values.','summary = df.groupby("group")["cost"].mean().sort_values(ascending=False)','A sorted mean does not identify the group with the largest total or the most observations.', 'pandas');
entry('sort','Choose whether lineplot sorts positions before drawing.','A boolean.','True sorts by x (and y where applicable); False preserves the supplied observation order.','True.','Controls the order in which line segments connect observations.','sns.lineplot(data=df, x="day", y="minutes", estimator=None, sort=False)','Sorting does not aggregate rows or create a meaningful time order. Use a line only when connecting positions is substantively justified.', 'relational');

// A small Python-aware lexer is shared by browser rendering and the audit. It
// skips strings/comments and compares function contexts, rather than matching
// every equals sign (which would confuse assignments with keyword arguments).
function tokens(text){
 const out=[];let i=0;const value=String(text||'');
 while(i<value.length){
  const c=value[i];
  if(/\s/.test(c)){i++;continue;}
  if(c==='#'){while(i<value.length&&value[i]!=='\n')i++;continue;}
  if(c==='"'||c==="'"){
   const triple=value.slice(i,i+3)===c.repeat(3),end=triple?c.repeat(3):c;i+=end.length;
   while(i<value.length){if(value[i]==='\\'){i+=2;continue;}if(value.slice(i,i+end.length)===end){i+=end.length;break;}i++;}
   out.push({type:'string',value:'<string>'});continue;
  }
  const name=value.slice(i).match(/^[A-Za-z_]\w*/);
  if(name){out.push({type:'name',value:name[0],end:i+name[0].length});i+=name[0].length;continue;}
  const pair=value.slice(i,i+2);
  if(['==','!=','<=','>=',':=','**','//','->'].includes(pair)){out.push({type:'symbol',value:pair});i+=2;continue;}
  out.push({type:'symbol',value:c});i++;
 }
 return out;
}
function functionAt(items,i){
 if(items[i-1]?.type!=='name')return '';
 let fn=items[i-1].value,j=i-2;
 while(items[j]?.value==='.'&&items[j-1]?.type==='name'){fn=items[j-1].value+'.'+fn;j-=2;}
 return fn;
}
function keywords(text,{prose=false,strictStandalone=false}={}){
 const items=tokens(text),stack=[],found=[];
 for(let i=0;i<items.length;i++){
  const value=items[i].value;
  if(['(','[','{'].includes(value)){stack.push({symbol:value,fn:value==='('?functionAt(items,i):''});continue;}
  if([')',']','}'].includes(value)){stack.pop();continue;}
  if(items[i].type==='name'&&items[i+1]?.value==='='&&items[i-1]?.value!=='.'){
   const current=stack.at(-1);
   if(current?.fn)found.push({function:current.fn,keyword:value});
   else if(prose&&(registry[value]||(strictStandalone&&String(text)[items[i].end]==='=')))found.push({function:'reference',keyword:value});
  }
 }
 return found;
}
function method(fn){return fn.split('.').at(-1);}
function lookup(fn,keyword){
 const last=method(fn),variant=registry[last+'.'+keyword];
 if(variant)return variant;
 // A starter can blank the operation but still introduce its named options.
 if(last==='____'&&keyword==='bottom')return registry['bar.bottom'];
 if(keyword==='bottom'&&last==='reference')return registry['bar.bottom'];
 if(keyword==='index'&&last!=='pivot_table')return registry['DataFrame.index'];
 if(keyword==='axis'&&last==='tick_params')return registry['tick_params.axis'];
 if(keyword==='title'&&last==='legend')return registry['legend.title'];
 return registry[keyword];
}
function fields(object,prefix,out){
 if(object==null)return;
 if(typeof object==='string'){out.push({field:prefix,text:object,prose:!/(?:Code|code|setup|solution|starter)$/.test(prefix)&&!/^[^.]+\.example$/.test(prefix),strictStandalone:/\.(?:syntax|syntaxLater|choices|parts)\.\d+(?:\.0)?$/.test(prefix)});return;}
 if(Array.isArray(object)){object.forEach((item,i)=>fields(item,prefix+'.'+i,out));return;}
 if(typeof object==='object')for(const [key,value]of Object.entries(object))fields(value,prefix+'.'+key,out);
}
function authoredFields(lesson,round,curriculum){
 const out=[],first=round===lesson.rounds[0]&&!lesson.review;
 if(first)for(const key of ['example','syntaxCode','syntax','syntaxLater','guide','explanation'])fields(lesson[key],lesson.id+'.'+key,out);
 if(!first&&!round.teaching){const source=round.retrieves?curriculum?.lessons.find(l=>l.id===round.retrieves):lesson;fields(source?.guide,(source?.id||lesson.id)+'.guide',out);}
 fields(lesson.stretch,lesson.id+'.stretch',out);
 for(const key of ['setup','starter','hint','solution','teaching','task','steps'])fields(round[key],round.id+'.'+key,out);
 return out;
}
function roundKeywords(lesson,round,curriculum){
 const found=authoredFields(lesson,round,curriculum).flatMap(field=>keywords(field.text,{prose:field.prose,strictStandalone:field.strictStandalone}).map(item=>({...item,field:field.field})));
 const actual=found.filter(item=>item.function!=='reference'&&method(item.function)!=='____');
 return found.flatMap(item=>{
  if(item.function!=='reference'&&method(item.function)!=='____')return [item];
  const functions=[...new Set(actual.filter(other=>other.keyword===item.keyword).map(other=>other.function))];
  return functions.length?functions.map(fn=>({...item,function:fn,fromReference:item.function==='reference',fromBlank:method(item.function)==='____'})):[item];
 });
}
function inventory(curriculum){
 return curriculum.lessons.filter(l=>l.deck==='visualise').flatMap(lesson=>lesson.rounds.flatMap(round=>roundKeywords(lesson,round,curriculum).map(item=>({...item,lesson:lesson.id,round:round.id,entry:lookup(item.function,item.keyword)?.id||null}))));
}
function entriesFor(curriculum,lesson,round){
 if(lesson.deck!=='visualise')return [];
 const found=roundKeywords(lesson,round,curriculum);
 const groups=new Map();
 for(const item of found){const definition=lookup(item.function,item.keyword);if(!definition)continue;const group=groups.get(definition.id)||{...definition,functions:[]};if(!group.functions.includes(item.function))group.functions.push(item.function);groups.set(definition.id,group);}
 for(const id of [...(round.parameterTeaching?.introduces||[]),...(round.parameterTeaching?.extends||[])]){
  if(!registry[id])throw new Error(round.id+': unknown authored parameter '+id);
  if(!groups.has(id))groups.set(id,{...registry[id],functions:[]});
 }
 return [...groups.values()];
}
function guidanceFor(curriculum,lesson,round){
 const entries=entriesFor(curriculum,lesson,round),plan=round.parameterTeaching||{introduces:[],extends:[],reuses:[],prerequisites:[]};
 const introduces=new Set(plan.introduces),extendsSet=new Set(plan.extends),reuses=new Set(plan.reuses);
 return {introduces:entries.filter(item=>introduces.has(item.id)),extends:entries.filter(item=>extendsSet.has(item.id)&&!introduces.has(item.id)),reminders:entries.filter(item=>reuses.has(item.id)&&!introduces.has(item.id)&&!extendsSet.has(item.id)),reference:entries,prerequisites:plan.prerequisites||[]};
}
function parameterCode(item){return `<code data-code-role="parameter">${esc(item.keyword)}</code>`;}
const conciseMeanings={
 data:'The table containing the named columns; here, df.',
 x:'Column-name text or an aligned vector for the horizontal axis.',
 y:'Column-name text or an aligned vector for the vertical axis.',
 ax:'The Axes returned by plt.subplots; receives this chart.',
 figsize:'(width, height) in inches; changes canvas space.',
 bins:'A positive bin count, increasing interval edges, or a rule such as "auto".',
 hue:'A column mapped to colour; categories get distinct colours.',
 style:'A column mapped to marker shapes or line patterns.',
 size:'A numeric column mapped to marker area; categories get distinct sizes.',
 order:'Category labels in the intended display order; accepts a list or Index.',
 estimator:'"mean" averages, "median" takes the middle value, and "sum" totals each group.',
 'lineplot.estimator':'"mean" combines repeated x values; None keeps individual observations.',
 palette:'A palette name, colour list, or category-to-colour mapping.',
 alpha:'Transparency from 0 (invisible) to 1 (opaque).'
};
// Visible alternatives accompany each current argument, rather than a hidden reference.
const acceptedValues={
 data:[['df','DataFrame'],['{"x": [1, 2]}','mapping'],['[1, 2, 3]','one-variable data']],
 x:[['"distance"','column name'],['df["distance"]','Series'],['[1, 2, 3]','aligned values']],
 y:[['"minutes"','column name'],['df["minutes"]','Series'],['[3, 5, 7]','aligned values']],
 hue:[['"group"','column name'],['df["group"]','aligned categories or numbers']],
 style:[['"group"','column name'],['df["group"]','aligned category levels']],
 size:[['"weight"','column name'],['df["weight"]','aligned size values']],
 'stripplot.size':[['3','small radius'],['5','default radius'],['8','larger radius']],
 'swarmplot.size':[['3','small radius'],['5','default radius'],['8','larger radius']],
 ax:[['ax','single panel'],['axes[0]','first panel'],['axes[1, 0]','grid panel']],
 figsize:[['(6, 4)','width and height in inches'],['(10, 4)','wider canvas']],
 nrows:[['1','one row'],['2','two rows; any positive integer']],
 ncols:[['1','one column'],['2','two columns; any positive integer']],
 sharex:[['False','independent'],['True','all panels'],['"row"','within rows'],['"col"','within columns']],
 sharey:[['False','independent'],['True','all panels'],['"row"','within rows'],['"col"','within columns']],
 title:[['"Delivery times"','any text string']],
 xlabel:[['"Distance (km)"','any text string']],
 ylabel:[['"Time (minutes)"','any text string']],
 bins:[['4','four equal-width bins over the data range'],['[0, 2, 4, 6]','three intervals of width 2; values outside 0–6 are excluded'],['[0, 2, 5, 10]','three unequal-width intervals'],['"auto"','automatic rule; also "fd", "doane", "scott", "stone", "rice", "sturges", "sqrt"']],
 bw_adjust:[['0.5','less smoothing'],['1','default smoothing'],['2','more smoothing; any positive number']],
 cut:[['0','stop at observed extremes'],['2','extend by two bandwidths; any nonnegative number']],
 order:[['["A", "B", "C"]','explicit category order'],['ranked.index','labels from a sorted summary']],
 hue_order:[['["local", "express"]','category list'],['summary.index','Index of category labels']],
 style_order:[['["local", "express"]','category list'],['summary.index','Index of category labels']],
 estimator:[['"mean"','average'],['"median"','middle value'],['"sum"','total'],['"min"','minimum'],['"max"','maximum'],['"std"','standard deviation'],['mode_value','custom scalar function for the most frequent value']],
 'lineplot.estimator':[['None','keep observations'],['"mean"','average repeated x values'],['"median"','middle value'],['"sum"','total'],['mode_value','custom scalar function']],
 errorbar:[['None','no interval'],['"sd"','observed standard deviation'],['"pi"','observed percentile interval'],['"se"','standard error'],['"ci"','bootstrap confidence interval'],['("ci", 95)','method and level'],['interval_function','function returning (low, high)']],
 n_boot:[['1000','default resample count'],['2000','more resamples; positive integer']],
 seed:[['7','integer seed'],['None','unseeded'],['np.random.default_rng(7)','NumPy Generator']],
 jitter:[['False','no displacement'],['True','default displacement'],['0.15','random offset up to ±0.15 category units']],
 ci:[['None','no confidence band'],['95','95% band; percentage from 0 to 100']],
 color:[['"blue"','colour name'],['"#3366cc"','hex colour'],['(0.2, 0.4, 0.8)','RGB channels from 0 to 1']],
 palette:[['"deep"','named palette'],['["blue", "orange"]','colour list'],['{"A": "blue", "B": "orange"}','category mapping']],
 alpha:[['0','invisible'],['0.5','half transparent'],['1','opaque'],['None','artist default']],
 marker:[['"o"','circle'],['"s"','square'],['"^"','triangle'],['"x"','cross']],
 capsize:[['0','no caps'],['0.15','cap width relative to category spacing']],
 inner:[['"box"','mini box plot'],['"quart"','quartiles'],['"point"','observations'],['"stick"','observation lines'],['None','no interior marks']],
 annot:[['True','write matrix values'],['False','omit labels'],['labels','same-shape array of custom labels']],
 fmt:[['"d"','integers'],['".0f"','no decimals'],['".2f"','two decimals'],['".0%"','proportions as percentages']],
 cmap:[['"Blues"','sequential amounts'],['"coolwarm"','signed differences'],['plt.get_cmap("viridis")','colormap object']],
 vmin:[['0','numeric lower endpoint'],['-1','correlation lower endpoint'],['None','infer from data']],
 vmax:[['100','numeric upper endpoint'],['1','correlation upper endpoint'],['None','infer from data']],
 center:[['0','neutral value for signed data'],['None','no specified centre']],
 complementary:[['False','fraction at or below x'],['True','fraction above x']],
 legend:[['"auto"','infer detail'],['"brief"','sample numeric levels'],['"full"','every level'],['False','hide legend']],
 labels:[['["Train", "Test"]','one text label per legend handle']],
 'legend.title':[['"Group"','title text'],['None','no title']],
 col:[['"group"','column defining panel columns']],
 row:[['"group"','column defining panel rows']],
 height:[['3','panel height in inches; positive number']],
 aspect:[['1','square panel dimensions'],['1.5','width = 1.5 × height']],
 vars:[['["length", "width"]','list of numeric column names']],
 diag_kind:[['"auto"','infer'],['"hist"','histogram'],['"kde"','density curve'],['None','no diagonal plot']],
 corner:[['False','full grid'],['True','omit upper triangle']],
 linestyle:[['"-"','solid'],['"--"','dashed'],['":"','dotted'],['"-."','dash-dot']],
 'bar.bottom':[['0','zero baseline'],['first','one preceding height per stacked bar']],
 label:[['"Online"','legend text'],['["A", "B"]','per-bar labels']],
 'set_ylim.bottom':[['0','zero baseline'],['-5','other numeric limit'],['None','keep current limit']],
 'subplots_adjust.bottom':[['0.2','Figure fraction; below top']],
 'subplots_adjust.left':[['0.2','Figure fraction; left of right']],
 'tick_params.axis':[['"x"','horizontal ticks'],['"y"','vertical ticks'],['"both"','both axes']],
 labelrotation:[['0','horizontal'],['45','diagonal'],['90','vertical; angle in degrees']],
 xy:[['(10, 20)','target coordinates']],
 xytext:[['(8, 30)','text coordinates'],['(0, 12)','offset when textcoords="offset points"'],['None','place text at xy']],
 textcoords:[['"data"','measurement units'],['"axes fraction"','panel fractions'],['"figure fraction"','Figure fractions'],['"offset points"','relative point offset'],['"offset pixels"','relative pixel offset']],
 xycoords:[['"data"','measurement units'],['"axes fraction"','panel fractions'],['"figure fraction"','Figure fractions']],
 arrowprops:[['None','no arrow'],['{"arrowstyle": "->"}','forward arrow'],['{"arrowstyle": "<->"}','double-ended arrow']],
 dpi:[['150','dots per inch; positive number'],['"figure"','use Figure DPI']],
 bbox_inches:[['None','full Figure'],['"tight"','trim around artists'],['bbox','Matplotlib Bbox in inches']],
 subset:[['["price"]','one required column'],['["price", "tip"]','several required columns']],
 numeric_only:[['True','numeric and boolean columns'],['False','attempt all columns']],
 axis:[['0','row-index direction/alignment; also "index"'],['1','column direction/alignment; also "columns"']],
 'pivot_table.index':[['"region"','one row-group column'],['["region", "status"]','multiple row-group columns']],
 'DataFrame.index':[['["A", "B"]','one label per row'],['series.index','existing Index']],
 columns:[['"status"','one column-group key'],['["status", "shift"]','multiple group keys']],
 values:[['"cost"','one measurement'],['["cost", "duration"]','several measurements']],
 aggfunc:[['"mean"','average'],['"median"','middle'],['"sum"','total'],['"count"','nonmissing count'],['"size"','row count'],['["mean", "sum"]','several summaries'],['summary_function','custom function']],
 ascending:[['True','smallest first'],['False','largest first'],['[True, False]','separate directions for two sort keys']],
 sort:[['True','sort positions before drawing'],['False','preserve supplied row order']]
};
const chartKinds={relplot:['scatter','line'],catplot:['strip','swarm','box','violin','boxen','point','bar','count'],displot:['hist','kde','ecdf'],jointplot:['scatter','kde','hist','hex','reg','resid']};
function valueChoices(item){
 let choices=acceptedValues[item.id];
 if(item.id==='kind')choices=[...new Set(item.functions.flatMap(fn=>chartKinds[method(fn)]||[]))].map(value=>[JSON.stringify(value),'']);
 if(!choices?.length)throw Error('Missing visible argument values: '+item.id);
 const columnArguments=new Set(['x','y','hue','style','size','col','row','vars','subset','values','pivot_table.index','columns']);
 return '<p class="foundation-argument-values"><strong>Accepts:</strong> '+choices.map(([value,meaning])=>{
  const role=columnArguments.has(item.id)&&/^(?:[\"']|\[[\"'])/.test(value)?'column':/^(?:df|ax|axes\[[^\]]+\]|first|labels|bbox)$/.test(value)?'variable':'syntax';
  return '<code data-code-role="'+role+'">'+esc(value)+'</code>'+(meaning?' — '+esc(meaning):'');
 }).join('; ')+'.</p>';
}
function currentDefinition(item,lesson,round,level){
 let meaning=level==='extend'&&extensionNotes[round.id]?.[item.id] || conciseMeanings[item.id] || item.purpose+' '+item.forms;
 if(item.id==='errorbar'&&lesson.id==='V09')meaning='None hides intervals; the mean or median bar height stays unchanged.';
 if(item.id==='lineplot.estimator'&&lesson.id==='V18')meaning='None keeps each observed time point; "mean" would combine repeated times.';
 return `<div class="foundation-parameter-row" data-parameter="${esc(item.id)}" data-guidance="${level}"><dt>${parameterCode(item)}</dt><dd>${esc(meaning)}${valueChoices(item)}</dd></div>`;
}
// Teach both members of a related pair, while sharing their accepted forms and
// example. This applies to authored introductions wherever that pair is used.
const pairedIntroductions={
 y:{after:'x',purpose:'Choose the vertical coordinate.',explanation:'Like x, y accepts a column-name string in data or an aligned vector; its default is None. Here y maps pressure_kpa to vertical position while x keeps volume_ml horizontal. Changing y changes the vertical measurement. Keep both values from the same observation.',example:'sns.scatterplot(data=df, x="volume_ml", y="pressure_kpa", ax=ax)'},
 vmax:{after:'vmin',purpose:'Choose the upper end of the colour scale.',explanation:'vmax accepts a number or None, like vmin; None infers the upper limit from the data. For correlations, vmin=-1 and vmax=1 fix one comparable scale across charts. Changing either endpoint changes colour mapping, rather than the correlation values.',example:'sns.heatmap(matrix, vmin=-1, vmax=1, center=0, ax=ax)'},
 xytext:{after:'xy',purpose:'Place the annotation text away from its anchor.',explanation:'Use a pair (x, y) or None. The default None places text at xy. textcoords determines the pair’s units; it defaults to xycoords. With textcoords="offset points", xytext=(0, 12) moves text 12 points above xy while leaving the measured anchor unchanged.',example:'ax.annotate("Peak", xy=(10, 20), xytext=(0, 12), textcoords="offset points")'}
};
const extensionExamples={
 'V04-3':{bins:'sns.histplot(data=df, x="weight_kg", bins=[0, 2, 5, 10], ax=ax)'},
 'V13-3':{order:'medians = df.groupby("bench")["reading"].median()\nranked = medians.sort_values()\norder = ranked.index'},
 'V11-2':{order:'ranked = medians.sort_values(ascending=False)\norder = ranked.index'},
 'V17-3':{size:'plotted["speed_kmh"] = plotted["distance_km"] / plotted["minutes"] * 60'},
 'V19-1':{'lineplot.estimator':'sns.lineplot(data=df, x="day", y="sales", estimator="mean", errorbar="sd", ax=ax)',errorbar:'errorbar="sd"'},
 'V10-1':{errorbar:'sns.pointplot(data=df, x="batch", y="result", estimator="mean", errorbar="sd", ax=ax)'},
 'V12-1':{cut:'sns.violinplot(data=df, x="group", y="measurement", cut=0, ax=ax)'},
 'V23-2':{axis:'row_totals = counts.sum(axis=1)\nproportions = counts.div(row_totals, axis=0)'},
 'V23-3':{aggfunc:'aggfunc="mean"'},
 'V33-1':{kind:'sns.relplot(data=df, x="minutes", y="thickness", col="workshop", kind="scatter", height=3)'},
 'V33-2':{kind:'sns.catplot(data=df, x="method", y="thickness", col="workshop", kind="box", height=3)'},
 'V33-3':{kind:'sns.relplot(data=df, x="inflow", y="outflow", col="region", kind="scatter", height=3)'}
};
const extensionNotes={
 'V04-3':{bins:'An integer chooses a count of equal-width bins. A sequence instead states the interval edges; [0, 2, 5, 10] gives three unequal-width intervals.'},
 'V13-3':{order:'The same plotting argument now receives the Index extracted from a sorted grouped Series, rather than a hand-written list.'},
 'V11-2':{order:'Median-based ordering also works with horizontal boxes. Keep category labels and their summary values paired while sorting.'},
 'V17-3':{size:'Calculate speed in km/h first, then map that derived numeric column to marker area.'},
 'V19-1':{'lineplot.estimator':'This dataset has repeated times. estimator="mean" creates one mean per time; selecting one replicate and using None creates a different, observed trajectory.',errorbar:'errorbar="sd" describes the spread of observed replicates at each time. It is not a confidence interval for the mean.'},
 'V10-1':{errorbar:'This optional lesson introduces the interpretation of observation-spread intervals. errorbar="sd" shows one standard deviation, rather than uncertainty about an estimate.'},
 'V12-1':{cut:'For a violin, cut limits the density outline beyond the observed range; it does not delete observations.'},
 'V23-2':{axis:'sum(axis=1) works across columns to calculate a total for each row. div(..., axis=0) instead aligns that Series by row label before dividing. They use different directions because summation and alignment are different operations.'},
 'V23-3':{aggfunc:'Use a measured mean inside each category-pair cell. A count of rows and a mean measurement answer different questions; missing combinations remain missing.'},
 'V33-1':{kind:'For relplot, kind="scatter" makes relationship panels. It does not select a univariate distribution.'},
 'V33-2':{kind:'catplot uses kinds such as "box" for category distributions. This is a different family from relplot’s paired relationships.'},
 'V33-3':{kind:'Choose relplot(kind="scatter") for inflow/outflow relationships. displot(kind="hist") would answer a different, one-variable distribution question.'}
};
function renderCurrent(curriculum,lesson,round){
 const g=guidanceFor(curriculum,lesson,round);if(!g.introduces.length&&!g.extends.length)return '';
 const rows=g.introduces.map(item=>currentDefinition(item,lesson,round,'introduce')).join('')+g.extends.map(item=>currentDefinition(item,lesson,round,'extend')).join('');
 const mode=g.introduces.concat(g.extends).some(item=>['estimator','lineplot.estimator'].includes(item.id))?'<p>For mode, pass a function that returns one value. Here ties choose the smallest mode:</p><pre><code>def mode_value(values):\n    return pd.Series(values).mode().iloc[0]</code></pre>':'';
 const estimator=g.introduces.some(item=>item.id==='estimator')?'<table class="teaching-example-output"><caption>Same measurements: 2, 2, 8</caption><thead><tr><th scope="col">Summary</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">Mean</th><td>4</td></tr><tr><th scope="row">Median</th><td>2</td></tr><tr><th scope="row">Sum</th><td>12</td></tr></tbody></table>':'';
 return `<section class="foundation-parameter-guide foundation-parameter-teaching" aria-label="Current parameter teaching"><h3>Arguments</h3><dl class="foundation-parameter-parts">${rows}</dl>${estimator}${mode}</section>`;
}
function renderReference(curriculum,lesson,round){
 const g=guidanceFor(curriculum,lesson,round);if(!g.reference.length)return '';
 return `<section class="foundation-parameter-guide foundation-parameter-reference" aria-label="Parameter reference"><h3>Argument reference</h3><div class="foundation-table-scroll"><table data-code-table="teaching"><thead><tr><th scope="col">Argument</th><th scope="col">Meaning and accepted forms</th><th scope="col">Default</th></tr></thead><tbody>${g.reference.map(item=>`<tr data-parameter="${esc(item.id)}" data-guidance="reference"><th scope="row">${parameterCode(item)}<br><a href="${esc(item.source)}" target="_blank" rel="noopener">API source</a></th><td>${esc(item.purpose)} ${esc(item.forms)}</td><td>${esc(item.default)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function render(curriculum,lesson,round,{level}={}){
 if(level==='current')return renderCurrent(curriculum,lesson,round);
 if(level==='reference')return renderReference(curriculum,lesson,round);
 return renderCurrent(curriculum,lesson,round)+renderReference(curriculum,lesson,round);
}
const api={versions:{seaborn:'0.13.2',matplotlib:'3.5.2',pandas:'2.2.0'},sources,registry,keywords,lookup,authoredFields,inventory,entriesFor,guidanceFor,acceptedValues,valueChoices,renderCurrent,renderReference,render};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.FoundationParameters=api;
})(typeof window==='undefined'?globalThis:window);
