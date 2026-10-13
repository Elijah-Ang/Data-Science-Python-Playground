/* Authored teaching intent for the final Visualise path. No learner history. */
(function(root){
'use strict';
// This order follows the published core path, then the optional extensions.
// Each entry names the actual learning decision, not an inferred first keyword.
const progression={
 V35:['chart.choice',[],[]],
 V01:['matplotlib.figure-axes',['python.assignment'],['I01']],
 V02:['matplotlib.labels',['matplotlib.figure-axes'],['V01']],
 V16:['seaborn.scatterplot',['matplotlib.figure-axes','matplotlib.labels'],['V02','I07']],
 V04:['seaborn.histplot',['seaborn.data-mapping','matplotlib.figure-axes'],['V16']],
 V08:['seaborn.countplot',['seaborn.data-mapping'],['V04','I15']],
 V18:['seaborn.lineplot',['seaborn.data-mapping','pandas.sort_values'],['V16','I12']],
 V09:['seaborn.barplot',['seaborn.countplot','pandas.mean'],['V08','I18S']],
 V13:['seaborn.stripplot',['seaborn.data-mapping','pandas.group-summary'],['V09','I19S']],
 V11:['seaborn.boxplot',['seaborn.stripplot','pandas.median'],['V13','I18S']],
 V03:['seaborn.hue',['seaborn.scatterplot'],['V16']],
 V17:['seaborn.style',['seaborn.scatterplot','seaborn.hue'],['V03']],
 V22:['seaborn.heatmap',['pandas.corr'],['I21','V03']],
 V24:['matplotlib.subplots-panels',['matplotlib.figure-axes','seaborn.histplot','seaborn.scatterplot'],['V04','V16']],
 V25:['seaborn.palette',['seaborn.hue','seaborn.style'],['V17']],
 V26:['matplotlib.scales',['matplotlib.labels'],['V02']],
 V27:['matplotlib.reference-lines',['seaborn.scatterplot','pandas.median'],['V16','I18S']],
 V29:['matplotlib.bar',['pandas.group-summary','pandas.series-labels'],['V09','I19','I19S']],
 V34:['matplotlib.savefig',['matplotlib.labels','matplotlib.figure-axes'],['V02']],
 V36:['chart.fair-comparison',['matplotlib.bar','matplotlib.scales'],['V29','V26']],
 V37:['chart.report',['chart.choice','pandas.filter','matplotlib.subplots-panels'],['V24','V29','V36']],
 V05:['seaborn.kdeplot',['seaborn.histplot'],['V04']],
 V06:['seaborn.ecdfplot',['seaborn.histplot'],['V04']],
 V07:['seaborn.rugplot',['seaborn.histplot','seaborn.kdeplot'],['V04','V05']],
 V10:['seaborn.pointplot',['seaborn.barplot','pandas.mean'],['V09']],
 V12:['seaborn.violinplot',['seaborn.boxplot','seaborn.kdeplot'],['V11','V05']],
 V14:['seaborn.swarmplot',['seaborn.stripplot'],['V13']],
 V15:['chart.sample-detail',['seaborn.stripplot','seaborn.violinplot'],['V12','V13']],
 V19:['chart.repeated-measurements',['seaborn.lineplot','pandas.filter'],['V18','V10']],
 V20:['seaborn.regplot',['seaborn.scatterplot'],['V16']],
 V21:['seaborn.residplot',['seaborn.regplot'],['V20']],
 V23:['pandas.crosstab',['seaborn.heatmap','pandas.groupby'],['V22','W19','W23']],
 V28:['matplotlib.annotate',['matplotlib.reference-lines','pandas.loc','pandas.idxmax'],['V27','I09','I13L']],
 V30:['chart.stacked-bars',['matplotlib.bar'],['V29']],
 V31:['seaborn.pairplot',['seaborn.scatterplot','seaborn.histplot'],['V16','V04']],
 V32:['seaborn.jointplot',['seaborn.scatterplot','seaborn.histplot','seaborn.figure-grid'],['V31']],
 V33:['seaborn.relplot',['seaborn.figure-grid','seaborn.scatterplot'],['V31','V16','V04']]
};
// Names are function-specific registry IDs. Only this authored map can promote
// a reference into current teaching; setup/hint/solution scanning cannot do so.
const parameterPlan={
 V01:[['figsize']],V02:[['title','xlabel','ylabel']],V16:[['data','x','y','ax'],[],[]],
 V04:[['bins'],[],[]],V08:[[],['order']],
 V18:[['lineplot.estimator','marker','sort']],V09:[['estimator','errorbar']],
 V13:[['jitter']],V11:[[]],V03:[['hue']],V17:[['style'],['size']],
 V22:[['annot','cmap','vmin','vmax','center']],V24:[['nrows','ncols']],
 V25:[['palette','legend.title'],['hue_order','style_order','alpha']],
 V26:[['set_ylim.bottom'],['tick_params.axis','labelrotation']],V27:[['linestyle']],
 V29:[[]],V34:[['dpi','bbox_inches'],['subplots_adjust.left','subplots_adjust.bottom']],
 V36:[[]],V37:[[]],V05:[['bw_adjust','cut']],V06:[[],['complementary']],V07:[[]],
 V10:[['capsize']],V12:[['inner']],V14:[['swarmplot.size']],V15:[[]],
 V19:[[]],V20:[['ci']],V21:[[]],V23:[['fmt']],
 V28:[['xy','xytext','textcoords','arrowprops']],V30:[['label','bar.bottom']],
 V31:[['vars','diag_kind','corner']],V32:[['kind']],V33:[['col','height']]
};
const extensions={
 'V04-3':['bins'], 'V13-3':['order'], 'V11-2':['order'], 'V17-3':['size'],
 'V19-1':['lineplot.estimator','errorbar'], 'V10-1':['errorbar'],
 'V12-1':['cut'], 'V23-2':['axis'], 'V23-3':['aggfunc'], 'V33-1':['kind'], 'V33-2':['kind'], 'V33-3':['kind']
};
const summaries={
 V35:['Choose a paired view.','Choose a distribution.','Choose category counts.'],
 V01:['Create an empty canvas.'],V02:['Label the chart.','Adapt the labels.','Finish a new chart.'],
 V16:['Plot paired measurements.','Select a population.','Handle missing pairs.'],
 V04:['Count values in bins.','Compare fewer bins.','Use specified bin edges.'],
 V08:['Count category records.','Choose category order.','Count open requests.'],
 V18:['Connect one observation per day.','Select a time window.','Plot change from a baseline.'],
 V09:['Compare mean fares.','Compare median fares.','Compare typical repair costs.'],
 V13:['Show every raw point.','Turn jitter off.','Order groups by medians.'],
 V11:['Summarise distributions.','Order horizontal boxes.','Apply boxes to new data.'],
 V03:['Reuse positions; add colour.','Choose the grouping.','Map a new category.'],
 V17:['Add group shapes.','Add numeric marker size.','Calculate and encode speed.'],
 V22:['Show measured correlations.','Select useful variables.','Use paired complete rows.'],
 V24:['Build complementary panels.','Stack the same views.','Report one population.'],
 V25:['Use complete legends.','Adjust order and opacity.','Replace a misleading draft.'],
 V26:['Choose an honest scale.','Make ticks readable.','Show a useful range.'],
 V27:['Mark measurement medians.','Change the benchmark.','Apply a new threshold.'],
 V29:['Plot precomputed means.','Compare group totals.','Compute a pooled percentage.'],
 V34:['Export the finished chart.','Make room for labels.','Export selected evidence.'],
 V36:['Restore the zero baseline.','Use a linear bar scale.','Repair a new comparison.'],
 V37:['Build a coherent report.','Handle incomplete pairs.','Use a new reporting context.'],
 V05:['Estimate a density.','Change the smoothing.','Apply to a new measurement.'],
 V06:['Read cumulative proportions.','Reverse the direction.','Compare a new threshold.'],
 V07:['Show observed positions.','Pair marks with density.','Use a new distribution.'],
 V10:['Show means and spread.','Change the centre.','Contrast points and summaries.'],
 V12:['Read a density outline.','Change the inner display.','Add observed points.'],
 V14:['Separate coincident points.','Change orientation.','Order a new set of groups.'],
 V15:['Replace unsupported detail.','Change the mapping.','Explain a new sample.'],
 V19:['Summarise repeated times.','Follow one replicate.','Compare trajectory and summary.'],
 V20:['Fit a straight-line view.','Select the fitting rows.','Assess a new relationship.'],
 V21:['Inspect fit deviations.','Choose the fit population.','Inspect a new pattern.'],
 V23:['Count category pairs.','Normalise within rows.','Summarise measured cells.'],
 V28:['Annotate a whole record.','Choose a different extreme.','Select before annotating.'],
 V30:['Stack additive amounts.','Compare components directly.','Show within-item shares.'],
 V31:['Choose numeric measurements.','Remove duplicate panels.','Apply a pairwise view.'],
 V32:['Read pairs and margins.','Add a central reference.','Use a new joint view.'],
 V33:['Facet paired relationships.','Facet category distributions.','Choose the facet family.']
};
const expandedOrder=(code)=>code.replace(/order = df\.groupby\(("[^"]+")\)\[("[^"]+")\]\.median\(\)\.sort_values\(([^)]*)\)\.index/g,
 (_,category,measurement,args)=>`medians = df.groupby(${category})[${measurement}].median()\nranked = medians.sort_values(${args})\norder = ranked.index`);
// One definition, one small example and one useful caveat. These are authored
// replacements, not shortened previews of a second, longer teaching view.
const conciseGuides={
 V35:['Match the chart to the question and data types.','Distance versus time: scatter. Stone diameters: histogram.','Return a quoted chart name in these exercises.'],
 V01:['A Figure is the canvas; an Axes is one plotting area.','`fig, ax = plt.subplots(figsize=(6, 4))` creates a 6-by-4-inch canvas.','This exercise creates an empty canvas. Later lessons add data.'],
 V02:['Use a title for the question and axis labels for measurements and units.','`distance_km` can be labelled "Distance (km)" without renaming the column.','Label the values actually plotted, including any unit conversion.'],
 V16:['A scatter point pairs two numeric measurements from the same row.','`volume_ml=9` and `pressure_kpa=20` give the point (9, 20).','Keep coordinates paired when selecting rows. Association does not establish causation.'],
 V04:['A histogram counts numeric observations in intervals called bins.','Values [1, 2, 3, 7] in intervals [0, 4, 8] give counts 3 and 1.','Interior boundaries enter the right bin; the last bin includes its upper edge.'],
 V08:['A count plot shows the number of records per category.','A, A, B gives counts A: 2 and B: 1.','`order` changes category positions, not counts; an empty listed category has count zero.'],
 V18:['A line connects observations along a meaningful sequence, such as time.','One row per day gives one observed sales total per marker.','`estimator=None` retains observations. Repeated times need an explicit replicate or summary choice.'],
 V09:['A summary bar shows a numeric statistic for each category.','Fares [2, 2, 3, 9]: mean 4, median 2.5, count 4.','Choose the statistic requested; a summary bar is not a record count.'],
 V13:['A strip plot shows every measurement within its category.','Readings [2, 2, 7] produce three points; two may overlap.','`jitter` separates category positions without changing measured values.'],
 V11:['A box covers the middle half of ordered values; its line marks the median.','Values [2, 4, 6] have median 4.','Points beyond whiskers need review; they are not proven errors.'],
 V03:['Map a data column to colour when group identity matters.','`hue="habitat"` colours observations by habitat; `color="blue"` makes all points blue.','Categorical `hue` assigns distinct colours; numeric `hue` uses a colour range.'],
 V17:['Add marker shape to the familiar category colours.','Observations from one instrument share a colour and shape.','Change adds numeric marker area; Transfer first calculates that measurement.'],
 V22:['A correlation heatmap colours pairwise linear relationships between numeric measurements.','A light–height cell holds their correlation; `sample_id` identifies a record.','Exclude identifiers. Constant columns have undefined correlation; correlation does not establish causation.'],
 V24:['`subplots` creates several Axes on one Figure. Direct each chart to its panel.','A pH histogram and a pH–conductivity scatter use separate Axes.','`figsize` sizes the whole canvas. Arrange and display the complete Figure once.'],
 V25:['A legend explains data mappings; colour plus shape keeps categories distinguishable.','Overlapping production-line observations remain identifiable through colour and shape.','`palette` chooses colours; `hue` chooses the column receiving them.'],
 V26:['Scale sets value spacing; limits set the visible range.','On a log axis, 1→10 and 10→100 occupy equal space.','Keep relevant observations visible. Common panel limits support fair comparisons.'],
 V27:['Reference lines mark a benchmark on the appropriate measurement axis.','Mean yield is a horizontal benchmark; median rpm is vertical.','Use the requested mean, median or documented threshold. A threshold is not an automatic decision.'],
 V29:['Calculate group summaries, then give their exact heights to `ax.bar`.','North deliveries [2, 8]: mean 5 boxes per delivery; total 10 boxes.','`ax.bar` draws supplied heights. Choose mean for typical size or sum for total boxes.'],
 V34:['Finish labels and layout, then save the Figure before displaying it.','`fig.savefig("chart.png", dpi=150, bbox_inches="tight")` exports the finished PNG.','Keep the requested filename, resolution and bounding box.'],
 V36:['Bar lengths compare magnitude fairly from a zero baseline on a linear scale.','Values 3 and 7 appear as lengths 1 and 5 when the baseline starts at 2.','Repair the axis while preserving every group, value and requested order.'],
 V37:['Use one selected population for all views in a report.','A histogram describes its distribution; grouped bars compare its summaries.','Reuse the selected rows and finish each Figure with its requested labels.'],
 V05:['A KDE smooths observations into an estimated density curve.','Changing `bw_adjust` from 1 to 2 produces a smoother curve.','Probability is area over an interval. Tiny samples and smoothing can mislead.'],
 V06:['An ECDF gives the fraction of observations at or below each value.','For [2, 4, 4, 8], the fraction at or below 4 is 0.75.','`complementary=True` shows the fraction strictly above; ties create larger jumps.'],
 V07:['A rug marks each observed position with a small tick.','For [2, 4, 4, 8], the two ticks at 4 overlap.','Tick height carries no measurement; overlapping ticks can hide repeats.'],
 V10:['A point plot shows category summaries with optional intervals.','Mean 10 and SD 2 give an SD interval from 8 to 12.','SD describes observed spread; a confidence interval describes uncertainty in the estimate.'],
 V12:['A violin’s width represents estimated density within a category.','Adding three observed points exposes how little data supports a smooth outline.','The outline depends on smoothing and sample size; wider does not mean a larger measurement.'],
 V14:['A swarm separates overlapping points along the category axis, preserving measured positions.','Three 10-mm bolts remain three points at length 10.','Crowded groups may produce an unplaced-point warning. Reduce marker size to improve readability.'],
 V15:['Replace unsupported density detail with the observed values.','Readings [3, 7, 7] remain three observations, including the coincident pair.','`ax.clear()` removes labels too. Restore them; raw points may still overlap.'],
 V19:['Repeated times can be summarised or followed as one replicate’s trajectory.','At day 1, A=4 and B=8 give mean 6; replicate A gives 4.','An SD band describes spread between observations, not confidence in the mean.'],
 V20:['A regression plot adds a fitted straight line to paired observations.','Fit a Reference calibration using only Reference rows, not Trial rows.','Inspect curves and influential points. A fitted line does not establish causation.'],
 V21:['A residual is observed y minus predicted y.','Observed 12 and predicted 10 give residual +2.','Give `residplot` the original measurements; it fits the line and calculates residuals.'],
 V23:['A heatmap colours a prepared matrix of counts or measurement summaries.','Two East–Adult entries give that category-pair cell count 2.','Missing measurement combinations stay missing. A count of zero has a different meaning.'],
 V28:['Select one row, then annotate its paired coordinates.','A 2-m² panel producing 22 W belongs at (2, 22).','Find the extreme within the plotted population; both coordinates must come from that row.'],
 V30:['Stack components with the same units; `bottom` sets the upper segment’s starting height.','Base 3 plus upper 2 gives total height 5.','Upper segments have different baselines. Compare one component alone from zero when needed.'],
 V31:['`pairplot` creates a Figure with distributions diagonally and paired relationships elsewhere.','Choose oxygen, temperature and depth; exclude a lake sample’s identifier.','Finish `g.figure`; avoid a separate canvas and limit columns to keep the grid readable.'],
 V32:['`jointplot` combines a central relationship with each measurement’s marginal distribution.','The centre pairs `delay_minutes` with `passengers`; margins show them separately.','Add central benchmarks through `g.ax_joint` to leave the margins unchanged.'],
 V33:['Faceting repeats a chart for each category’s rows on a Seaborn-created Figure.','Use workshop panels to compare the same relationship or distribution.','Comparable scales support fair panel comparisons. Finish `g.figure`, the grid’s own canvas.']
};
const conciseChoices={
 V02:['Set the title and both axis labels.','Set the same labels individually.','Arrange and display the Figure.','Convert measured values, then label their resulting units.'],
 V16:['Read both coordinates from one row.','Draw on the supplied Axes.','Select one table for both coordinates.','Arrange and display the Figure.'],
 V03:['Use the paired measurements for position.','Categories get distinct colours; numeric values get a colour range.','Give all points one colour.','List every mapped value in the legend.'],
 V04:['Count values in four intervals.','Change interval detail, keeping observations fixed.'],
 V08:['Count rows automatically; no numeric y is needed.','Choose category order, retaining empty categories at zero.'],
 V09:['Average within each group.','Middle value within each group.','Omit intervals; uncertainty still exists.'],
 V11:['Quartiles (25%–75%) / median.','Extremes within 1.5×IQR fences / points outside them.','Swap axes for horizontal boxes.'],
 V25:['Choose distinguishable category colours.','Keep colour and shape orders aligned; `alpha=0.6` can expose overlap.','Name the legend.','Clear the draft, then restore labels when redrawing.'],
 V26:['Use multiplicative spacing; values must be positive.','Set the visible range; retain relevant observations.','Set only the lower bound; leave the upper automatic.','Rotate labels without moving observations.'],
 V27:['Horizontal dashed benchmark at y.','Vertical dashed benchmark at x.','Use the benchmark requested by the question.'],
 V29:['Compute mean boxes per delivery for each depot.','Pair depot labels with their calculated heights.','Compute total boxes per depot.'],
 V34:['Save this Figure under the requested filename.','150 pixels per inch.','Crop around visible content, including labels.'],
 V36:['Start bars at zero; keep the upper bound automatic.','Use equal spacing for equal changes.','Use a common range containing every mean.'],
 V10:['Observed spread: one SD each side.','Uncertainty: a bootstrapped 95% confidence interval.','Omit intervals; `estimator="median"` changes the centre.','Set interval-end cap width.'],
 V12:['Stop at observed values.','Show quartiles.','Show observations inside the violin.','Omit the inner layer before adding raw points.'],
 V14:['Pack points within categories without random jitter.','Set a fixed marker size.','Preserve measured x positions in a horizontal swarm.'],
 V15:['Remove draft marks and labels.','Show every observed value.','Restore labels after clearing.','Place measurements horizontally.'],
 V19:['Average y at each x.','Show one SD of observed spread.','Keep observations; filter one replicate for its trajectory.'],
 V20:['Fit y from x; draw points and fitted line.','Omit the confidence band, not the uncertainty.','Select the fitting population first.'],
 V21:['Fit the line, then plot its residuals against x.','Zero: prediction matches observation. Positive: above; negative: below.','Look for curvature or changing spread.'],
 V23:['Count category combinations.','Summarise a measurement per combination.','Print integer counts; `.1f` prints one decimal.'],
 V28:['Select the whole maximum-output row.','Observation location / text location.','Measure the text offset in typographic points.','Draw an arrow to the observation.'],
 V30:['Draw the lower component from zero.','Stack the upper component on the lower.','Label the components.','Divide both components by their item total for percentage shares.'],
 V31:['Select numeric columns in the requested order.','Histogram diagonals; `hue` adds group colour.','Keep only diagonal and lower panels.','Finish the returned grid’s Figure.'],
 V32:['Create and store the grid.','Target the central Axes.','Finish the grid’s Figure.'],
 V33:['Two numeric measurements: scatter panels.','Category and measurement: box panels.','One numeric measurement: four-bin histograms.','Panel height in inches; `aspect` controls relative width.']
};
function conciseGuideCopy(byId){
 for(const [id,[idea,example,note]]of Object.entries(conciseGuides)){
  Object.assign(byId[id].guide,{idea,example,note});
  const meanings=conciseChoices[id];
  if(meanings){
   if(meanings.length!==byId[id].guide.choices.length)throw new Error(id+': concise choices must retain their meanings');
   byId[id].guide.choices=byId[id].guide.choices.map(([code],i)=>[code,meanings[i]]);
  }
 }
}
const conciseTransitions={
 'V04-2':{idea:'Change `bins=4` to `bins=2` for wider intervals on the same data.',example:'Eight observations remain eight observations.',result:'Two bins.',parts:[['bins=2','Use two equal-width intervals.']],note:'Bin count changes the view, not the measurements.'},
 'V04-3':{idea:'A `bins` list specifies interval boundaries instead of an interval count.',example:'Values [1, 3, 8, 9] with edges [0, 4, 10] give counts 2 and 2.',parts:[['bins=[0, 4, 10]','Three edges define two intervals.']],note:'Interior edges enter the right bin. With unequal widths, count height does not make bar area a frequency.'},
 'V08-2':{idea:'`order` sets category positions and keeps listed empty categories.',example:'For email, chat, email, the order chat, email, phone gives counts 1, 2, 0.',parts:[['order=[...]','List categories in their required display order.'],['"phone" in order','Keep its tick at zero; add no invented record.']],note:'An empty category has count zero, but its mean is undefined.'},
 'V13-3':{idea:'Compute medians, sort with labels attached, then extract those labels for `order`.',example:'The supplied bench medians are A=4, B=5 and C=7.',parts:[['medians = sample.groupby("bench")["reading"].median()','One labelled median per bench.'],['ranked = medians.sort_values()','Sort medians with bench labels attached.'],['order = ranked.index','Extract ordered bench labels.'],['order=order','Order categories; keep all raw readings.']],note:'`ranked.values` gives numbers; `ranked.index` gives category labels.',referenceNote:'The equivalent chain returns the ordered labels.'},
 'V17-2':{idea:'Keep instrument colour and shape; map `area_cm2` to marker area.',example:'The same instrument keeps its shape; greater collecting area gives a larger mark.',result:'Separate legend scales explain instrument and collecting area.',parts:[['size="area_cm2"','Larger numeric values give larger marker areas.']],note:'Marker area represents collecting area, not observation count or uncertainty.'},
 'V17-3':{idea:'Calculate speed in km/h, then map it to marker area.',example:'6 km in 30 minutes gives 12 km/h; in 15 minutes, 24 km/h.',result:'Positions show distance and duration; area shows speed.',parts:[['distance_km / minutes * 60','Convert km/min to km/h; supplied durations are positive.'],['size="speed_kmh"','Map derived speed, retaining surface colour and shape.']],note:'Duration alone cannot compare speed when distances differ.'},
 'V23-2':{idea:'Divide each row by its own total to get within-group proportions.',example:'Counts [1, 3] become [0.25, 0.75]; [2, 0] become [1, 0].',parts:[['sum(axis=1)','Compute each row total.'],['div(totals, axis=0)','Align totals to row labels, then divide.']],note:'A grand-total denominator would answer a different question.'},
 'V25-3':{idea:'`ax.clear()` removes one Axes’ marks and labels. Redraw the requested evidence.',example:'Replace a line joining (1, 3) and (2, 1) with two separate points.',result:'Two points replace the draft line.',parts:[['ax.clear()','Clear this plotting area.'],['ax.scatter(...)','Redraw the observations.'],['ax.set(...)','Restore the removed labels.']],note:'The source data stays intact. Redraw every requested pair.'},
 'V32-2':{idea:'Add the benchmark to `g.ax_joint`, the grid’s central Axes.',example:'A horizontal line at score 70 crosses only the central scatter.',result:'The margins remain unchanged.',parts:[['g.ax_joint','Target the central relationship panel.'],['.axhline(70, linestyle="--")','Draw a dashed horizontal benchmark at 70.']],note:'`jointplot` creates its own Axes; use its returned grid.'},
 'V33-2':{idea:'`catplot` uses the familiar grid pattern for categorical charts.',example:'Compare thickness by method in separate workshop box-plot panels.',result:'Each workshop compares Brush and Spray.',parts:[['sns.catplot(...)','Create a categorical-chart grid.'],['x="method", y="thickness"','Pair categories with their measurements.'],['col="workshop"','One panel per workshop.'],['kind="box", height=3','Boxes; three-inch panel height.']],note:'Finish `g.figure`; the grid supplies its own canvas.'},
 'V33-3':{idea:'Use `relplot` for paired measurements; `displot` shows one measurement’s distribution.',example:'Inflow versus outflow needs scatter panels. Inflow frequency needs histogram panels.',result:'One scatter per region retains the requested pairs.',parts:[['relplot(x="inflow", y="outflow", kind="scatter")','Choose relationship panels.'],['displot(x="inflow", kind="hist")','Contrast: distribution panels for another question.'],['col="region"','One region’s rows per panel.']],note:'This task asks for the relationship; it requires one scatter grid.'}
};
// Worked excerpts use the plotting imports and objects already taught. The
// exercise editor retains its complete runnable starter and solution.
const conciseExamples={
 'V04-3':'sns.histplot(x=[1, 3, 8, 9], bins=[0, 4, 10], ax=ax)',
 'V08-2':'sns.countplot(x=["email", "chat", "email"], order=["chat", "email", "phone"], ax=ax)',
 'V13-3':'medians = df.groupby("bench")["reading"].median()\nranked = medians.sort_values()\norder = ranked.index',
 'V25-3':'ax.clear()\nax.scatter([1, 2], [3, 1])\nax.set(xlabel="x", ylabel="y")',
 'V32-2':'g = sns.jointplot(x=[1, 2, 3], y=[60, 70, 80], kind="scatter")\ng.ax_joint.axhline(70, linestyle="--")',
 'V33-2':'sample = pd.DataFrame({"workshop": ["East"] * 4 + ["West"] * 4, "method": ["Brush", "Brush", "Spray", "Spray"] * 2, "thickness": [2, 4, 1, 3, 5, 7, 4, 6]})\ng = sns.catplot(data=sample, x="method", y="thickness", col="workshop", kind="box", height=3)',
 'V33-3':'g = sns.relplot(data=df, x="inflow", y="outflow", col="region", kind="scatter", height=3)'
};
function conciseTransitionCopy(byId){
 for(const l of Object.values(byId))for(const r of l.rounds){
  if(conciseTransitions[r.id])Object.assign(r.teaching,conciseTransitions[r.id]);
  if(conciseExamples[r.id])Object.assign(r.teaching,{code:conciseExamples[r.id],excerpt:true});
  if(r.id==='V13-3'){
   r.teaching.parts[0][0]='medians = df.groupby("bench")["reading"].median()';
   r.teaching.result='Bench labels ordered by ascending median.';
   r.teaching.identifiers.variables=['df','medians','ranked','order'];
  }
 }
}
const steps=text=>String(text).split(/(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.trim()).filter(Boolean);
function apply(c){
 if(c.teachingGuidance?.version===1)return c;
 const byId=Object.fromEntries(c.lessons.map(l=>[l.id,l]));
 const histogram=byId.V04.rounds[1];
 histogram.alternativeTeaching={...histogram.teaching,title:'Another way to draw this'};
 histogram.teaching={title:'Change only the bin count',idea:'Keep the same observations and sns.histplot workflow. Change bins=4 to bins=2 to combine the data into fewer, wider intervals.',example:'The same eight stone measurements remain in the chart. The bars become wider because the interval boundaries change.',code:'sns.histplot(data=df, x="diameter_mm", bins=2, ax=ax)',result:'Two bins count the same eight observations.',parts:[['bins=2','Use two equal-width intervals instead of four.'],['data=df','Keep every original stone measurement.']],noteTitle:'The evidence stays fixed',note:'A coarser chart changes the view, not the measurements. A larger bin count gives more detail; it does not add observations.'};
 const raw=byId.V13.rounds[2];
 raw.solution=expandedOrder(raw.solution);
 raw.teaching.code=raw.teaching.code.replace('list(ranked.index)','order = ranked.index\nlist(order)');
 raw.teaching.parts=[['medians = sample.groupby("bench")["reading"].median()','A Series containing one median reading, labelled by bench.'],['ranked = medians.sort_values()','The same labelled Series ordered by numeric median.'],['order = ranked.index','An Index of bench labels in the chosen order; values remain attached while sorting.'],['order=order','Pass those labels to the plot; every original reading remains a raw point.']];
 raw.teaching.identifiers={inputColumns:['bench','reading'],variables:['sample','medians','ranked','order'],exampleVariables:['medians','ranked','order']};
 raw.teaching.referenceCode='order = df.groupby("bench")["reading"].median().sort_values().index';
 raw.teaching.referenceNote='Once each intermediate object is familiar, this chain performs the same three steps. It returns labels, not the median values.';
 for(const id of ['V11','V14'])for(const r of byId[id].rounds)r.solution=expandedOrder(r.solution);
 // Colour was taught in V03. Shape is the single new mapping in Follow;
 // numeric marker area is the single added mapping in Change on the same rows.
 const dimensions=byId.V17,follow=dimensions.rounds[0],change=dimensions.rounds[1];
 follow.solution=follow.solution.replace(/\s*size="area_cm2",/,'');
 follow.starter=follow.solution.replace('sns.scatterplot','sns.____');
 follow.plot.legendFields=['instrument'];
 follow.visual={...follow.visual,sizeEncoding:false,label:'Concept sketch: group identity uses colour and shape; marker sizes are constant'};
 follow.question='How do signal and exposure time compare between instruments?';
 follow.task='Show seconds against signal for every exposure. Reuse colour for instrument and add marker shape for that same group. Keep constant marker sizes and show an instrument legend. Chart: title "Observatory exposures"; x "seconds"; y "signal".';
 follow.decision=follow.demand='Reuse colour and add shape for the same instrument group.';
 follow.hint='Keep hue="instrument" and add style="instrument"; leave numeric size for Change.';
 change.solution=follow.solution.replace('style="instrument",','style="instrument",\n    size="area_cm2",');
 change.plot.legendFields=['instrument','area_cm2'];
 change.question='Does collecting area help explain the instrument comparison?';
 change.task='Keep the same exposure rows, positions, instrument colours and marker shapes. Add area_cm2 as marker area and include legends for instrument and area_cm2. Chart: title "Observatory exposures"; x "seconds"; y "signal".';
 change.decision=change.demand='Add a numeric size encoding to the familiar grouped scatter.';
 change.hint='Keep hue and style on instrument; add size="area_cm2" and retain both legend sections.';
 dimensions.guide.example='A Wide-instrument observation has the same colour and marker shape as other Wide observations. Both cues identify instrument; neither changes its measured seconds or signal.';
 dimensions.guide.choices=[['hue="instrument"','Reuse the familiar category colours.'],['style="instrument"','Add distinct shapes for the same category.']];
 dimensions.guide.note='First identify instrument through colour and shape. The Change practice adds collecting area as marker size; Transfer calculates a new size measurement.';
 dimensions.syntax=[['style="instrument"','Map the category to marker shape, independently of its colour.']];
 dimensions.syntaxCode=follow.solution.slice(follow.solution.indexOf('sns.scatterplot'),follow.solution.indexOf('\nax.set'));
 change.teaching={title:'Add one numeric size mapping',idea:'Keep colour and shape for instrument. size now maps collecting area to marker area, so larger area_cm2 values produce larger marks; it is different from one fixed marker size.',example:'Two exposures from the same instrument keep the same colour and shape. The exposure with greater collecting area gets a larger mark.',code:'sns.scatterplot(data=df, x="seconds", y="signal", hue="instrument", style="instrument", size="area_cm2", ax=ax)',result:'The legend explains instrument identity and the separate collecting-area scale.',parts:[['size="area_cm2"','Read the numeric area column and map its magnitude to marker area.'],['hue="instrument", style="instrument"','Keep the group cues learned in Follow.']],noteTitle:'One question, one extra dimension',note:'Marker area represents collecting area here. It does not indicate additional observations or uncertainty.'};
 dimensions.rounds[2].teaching={title:'Calculate speed, then map its magnitude',idea:'Calculate speed before drawing. Distance divided by minutes is km/min; multiplying by 60 gives km/h. Map that derived quantity to marker area while colour and shape continue to identify surface.',example:'A 6 km ride lasting 30 minutes has speed 6 / 30 × 60 = 12 km/h. A second 6 km ride lasting 15 minutes has speed 24 km/h, so its speed mark is larger.',code:'plotted = df.copy()\nplotted["speed_kmh"] = plotted["distance_km"] / plotted["minutes"] * 60\nsns.scatterplot(data=plotted, x="distance_km", y="minutes", hue="surface", style="surface", size="speed_kmh", ax=ax)',result:'Positions still show distance and duration. Marker area answers a separate question about speed.',parts:[['distance_km / minutes * 60','Prepare speed in km/h. Supplied durations are positive, so division is defined.'],['size="speed_kmh"','Encode the derived speed rather than raw duration.'],['hue="surface", style="surface"','Reuse two ways to identify the same surface category.']],noteTitle:'Why speed for size?',note:'Speed compares distance travelled per hour. Duration alone cannot answer that question when distances differ; the marker-size legend must state speed.',identifiers:{inputColumns:['distance_km','minutes','surface'],derivedColumns:['speed_kmh'],variables:['plotted','df']}};
 const exact=byId.V29;
 exact.guide.noteTitle='Mean or total?';
 exact.guide.idea='Prepare one labelled mean or total per depot, then draw those exact heights with ax.bar. The summary calculation and the drawing operation are separate steps.';
 exact.guide.note='Mean boxes answers “How large was a typical delivery?” Total boxes answers “How many boxes arrived altogether?” ax.bar draws the values you supply; it does not choose the summary.';
 exact.guide.example='North receives 2 and 8 boxes: its mean delivery is 5 boxes, while its total is 10 boxes. South receives 5 and 7: mean 6, total 12. These are different questions about the same deliveries.';
 exact.guide.choices=[['means = df.groupby("depot")["boxes"].mean()','Calculate one mean boxes-per-delivery value per depot.'],['ax.bar(means.index, means.values)','Use depot labels as positions and exact means as heights.'],['.sum()','Calculate total boxes when the question asks how many arrived altogether.']];
 exact.syntax=[['means = df.groupby("depot")["boxes"].mean()','A labelled Series of mean delivery sizes.'],['means.index, means.values','Depot labels and their matching precomputed means.'],['ax.bar(means.index, means.values)','Draw the exact supplied heights.']];
 exact.syntaxLater=[];
 exact.explanation='Compute the quantity the question asks for, then give those exact values to ax.bar. A mean describes boxes per delivery; a total counts boxes across every delivery. Neither is calculated by the bar-drawing method.';
 exact.rounds.forEach((r,i)=>r.visual={...r.visual,summaryStatistic:['mean','sum','pooled rate'][i],label:'Concept sketch: precomputed values → exact bar heights'});
 byId.V09.rounds.forEach((r,i)=>r.visual={...r.visual,statistic:i?'median':'mean',label:'Concept sketch: each bar shows one chosen group summary, rather than a record count'});
 const facet=byId.V33.rounds[2];
 facet.teaching={title:'Choose between relationship and distribution panels',idea:'Choose the plotting family from the question. relplot pairs two measurements within each panel; displot shows the distribution of one measurement. Both create their own grid and return g.',example:'For inflow versus outflow by region, use relationship panels. For the distribution of inflow within each region, use distribution panels instead.',code:'g = sns.relplot(data=df, x="inflow", y="outflow", col="region", kind="scatter", height=3)\ng.figure.tight_layout()\nplt.show()',result:'One scatter panel per region retains the inflow/outflow pairs. A histogram of inflow would omit the requested relationship.',parts:[['relplot(x="inflow", y="outflow", kind="scatter")','Choose this family for the Transfer task: how two measured quantities vary together.'],['displot(x="inflow", kind="hist")','The familiar histogram, arranged in distribution panels for a different question: how one quantity is distributed.'],['col="region"','Use only each region’s rows in its own panel.'],['g.figure','Finish the Figure owned by the grid, using the familiar layout/display steps.']],noteTitle:'Choose from the analytical question',note:'The task requires relationship panels. displot is a contrast to help choose the correct family, rather than a second required chart.',referenceCode:'g = sns.displot(data=df, x="inflow", col="region", kind="hist", bins=4, height=3)',identifiers:{inputColumns:['inflow','outflow','region'],variables:['df','g']}};
 const line=byId.V18;
 line.guide.example='Daily sales has one row per day. The marker for day 1 is that day’s observed sales total, not an average of several rows. Connecting the markers follows the time sequence.';
 line.guide.note='This introductory dataset has one observation per x-value. When times repeat, select a replicate or deliberately summarise them; V19 compares those choices.';
 line.guide.prerequisiteLessons=[{id:'I12',title:'Sort whole rows'}];
 line.explanation='Each introductory point is one day’s recorded sales total. A line connects those observations along a meaningful time order. estimator=None keeps observations; Seaborn otherwise averages repeated x-values by default. With several observations at each time, choose one replicate or an explicit summary, as in the optional aggregation lesson.';
 conciseGuideCopy(byId);
 conciseTransitionCopy(byId);
 // These arguments have already been taught in Inspect/Wrangle. Further
 // reminders follow the explicit introduction plan above, never code words.
 const parameterKnown=new Set(['ascending','subset','numeric_only','DataFrame.index','pivot_table.index','columns','values','aggfunc','axis']);
 for(const l of c.lessons.filter(l=>l.deck==='visualise')){
  const spec=progression[l.id],retrieval=l.rounds.filter(r=>r.retrieves);
  if(!l.review&&!spec)throw new Error(l.id+': author Visualise concept progression before publishing a new lesson');
  l.concepts=spec?{introduces:[spec[0]],reuses:spec[1],extends:[],prerequisites:spec[2]}:{introduces:[],reuses:[...new Set(retrieval.flatMap(r=>byId[r.retrieves]?.concepts?.introduces||[]))],extends:[],prerequisites:retrieval.map(r=>r.retrieves)};
  if(l.id==='V16')l.concepts.introduces.push('seaborn.data-mapping');
  if(l.id==='V31')l.concepts.introduces.push('seaborn.figure-grid');
  if(l.guide)l.guide.prerequisiteLessons=l.concepts.prerequisites.filter(id=>byId[id]).map(id=>({id,title:byId[id].title}));
  for(const [index,r]of l.rounds.entries()){
   const intro=parameterPlan[l.id]?.[index]||[],extend=extensions[r.id]||[];
   const parameterPrerequisites=l.concepts.prerequisites;
   r.parameterTeaching={introduces:intro,extends:extend,reuses:[...parameterKnown].filter(id=>!intro.includes(id)&&!extend.includes(id)),prerequisites:parameterPrerequisites};
   intro.forEach(id=>parameterKnown.add(id));
   r.concepts={introduces:index===0?[...l.concepts.introduces]:[],reuses:index===0?[...l.concepts.reuses]:[...l.concepts.reuses,...l.concepts.introduces],extends:[],prerequisites:parameterPrerequisites};
   if(r.id==='V17-2')r.concepts.introduces.push('seaborn.size-mapping');
   if(r.id==='V17-3')r.concepts.extends.push('pandas.derived-column','seaborn.size-mapping');
   if(r.id==='V13-3')r.concepts.extends.push('pandas.series-labels');
   if(r.retrieves)r.concepts={introduces:[],reuses:[...(byId[r.retrieves]?.concepts?.introduces||[])],extends:[],prerequisites:[r.retrieves]};
   r.stageSummary=summaries[l.id]?.[index]||('Retrieve '+(byId[r.retrieves]?.title||'the technique').toLowerCase()+'.');
   // Prefixes authored by variety are consistent; remove only that generated
   // framing, retaining every actual selection, output and chart constraint.
   const prefix='Question: '+r.question+' ';
   let action=r.task.startsWith(prefix)?r.task.slice(prefix.length):r.task;
   action=action.replace(/^Each row in the supplied table df represents [^.]+\.\s*/,'').replace(/^This exercise uses [^.]+\.\s*/,'').replace(/^Using df,\s*/i,'');
   action=action.charAt(0).toUpperCase()+action.slice(1);
   const chart=action.match(/\s*Chart:\s*([\s\S]*)$/);if(chart)action=action.slice(0,chart.index).trim();
   if(l.id==='V01'){r.question='Create an empty chart canvas.';action='Make one Figure with one Axes, sized 6 by 4 inches. Arrange the layout and display it.';}
   const rows=l.id==='V01'?'No data needed.':`One row: ${r.observationUnit}.`;
   const instruction=steps(action);
   r.brief={question:r.question,rows,result:instruction[0]||action,constraints:[...instruction.slice(1),...(chart?['Chart: '+chart[1]]:[])]};
   if(r.id==='V09-1')r.brief={question:'Compare average fares by route.',rows:'One row: one purchased ticket.',result:'Using all tickets, plot mean `fare` by `route`, without error bars.',constraints:['Title: "Bus fare receipts". Axes: "route" and "Mean fare".']};
   if(r.id==='V08-3')r.brief={question:'Compare open requests by channel.',rows:'One row: one received support request.',result:'Keep open requests; plot counts by `channel`, most first.',constraints:chart?['Chart: '+chart[1]]:[]};
   r.steps=[r.brief.result,...r.brief.constraints];r.task=r.steps.join(' ');
   const created=[...r.solution.matchAll(/^([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?\s*=(?!=)/gm)].flatMap(m=>[m[1],m[2]].filter(Boolean));
   const supplied=['df',...(r.setup.match(/\bfig\s*,\s*ax\s*=/)?['fig','ax']:[])];
   r.provenance={supplied:supplied.map(name=>({name,type:name==='df'?'DataFrame':name==='fig'?'Figure':'Axes',description:name==='df'?'Loaded from the visible supplied table.':'Created by the supplied setup.'})),created:[...new Set(created)].filter(name=>!supplied.includes(name)).map(name=>({name,type:name==='fig'?'Figure':name==='ax'?'Axes':name==='g'?'Seaborn grid':'Python object',description:'Created by your Python for this task.'}))};
   r.identifiers={...r.identifiers,inputColumns:Object.keys(c.datasets[r.dataset].columns),variables:[...new Set([...supplied,...created])],...(r.id==='V17-3'?{derivedColumns:['speed_kmh']}:{}),...(r.id==='V18-3'?{derivedColumns:['change']}:{}),...(r.id==='V13-3'?{exampleVariables:['sample','medians','ranked','order']}:{}),occurrences:[...(r.identifiers?.occurrences||[]),...(chart?[{text:chart[1],role:'literal'}]:[]),...(l.id==='V04'?[{text:'stone',role:'prose',before:'measured '},{text:'stone',role:'prose',before:'largest '}]:[])]};
   const familiar=/^(?:fig, ax\s*=|fig\.tight_layout|plt\.show|data=|ax=ax|x=|y=|hue=)/;
   const isFamiliar=code=>familiar.test(code)&&l.id!=='V01'&&!intro.some(id=>code.includes(id+'='));
   const syntax=index===0&&!l.review?l.syntax:(r.teaching?.parts||[]);
   r.syntaxGuidance={current:syntax.filter(([code])=>!isFamiliar(code)),reminders:syntax.filter(([code])=>isFamiliar(code)),reference:[]};
   r.workflow={same:'Select rows, draw, label and display.',changed:r.stageSummary,why:r.decision||l.goal,changedLines:r.solution.split('\n').flatMap((line,i)=>/sns\.\w+\(|ax\.(?:bar|hist|plot|scatter|annotate|axvline|axhline|set_[xy]scale|set_[xy]lim)\(|^\s*(?:bins|estimator|errorbar|jitter|style|size|col|kind)=/.test(line)?[i+1]:[])};
   if(['V31','V32','V33'].includes(l.id))r.workflow.same='Choose mappings, then finish the grid’s Figure.';
   if(['V31','V32','V33'].includes(l.id))r.workflow.changed='Seaborn supplies the canvas. Store its grid as `g` and finish `g.figure`.';
  }
  if(!l.review){const r=l.rounds[0];l.example=(r.setup?r.setup+'\n\n':'')+r.solution;}
 }
 // A retrieval keeps the chart family but its current question can choose a
 // different summary from the source lesson's Transfer activity.
 for(const l of visualiseLessons(c).filter(l=>l.review))for(const r of l.rounds){
  if(r.retrieves==='V09')r.visual={...r.visual,statistic:r.solution.includes('estimator="median"')?'median':'mean',label:'Concept sketch: each bar shows the summary requested for this question'};
 }
 const visualise=c.lessons.filter(l=>l.deck==='visualise');
 c.teachingGuidance={version:1,visualiseCards:visualise.length,visualisePractices:visualise.flatMap(l=>l.rounds).length,authoring:'explicit authored curriculum progression',learnerState:false};
 return c;
}
function visualiseLessons(c){return c.lessons.filter(l=>l.deck==='visualise');}
// Formatting can move calls and keyword lines. Resolve emphasis only after the
// final code formatter, and keep familiar data preparation out of the excerpt
// emphasis when the new step is a plotting operation.
function changedLines(code,lesson,round){
 const focus={V01:/\bplt\.subplots\(/,V02:/\bax\.set\(/,V24:/\bplt\.subplots\(/,V34:/\bfig\.savefig\(/}[lesson.id];
 const chart=/\bsns\.\w+\(|\bax\.(?:bar|hist|plot|scatter|clear|annotate|axvline|axhline|set_[xy]scale|set_[xy]lim)\(/;
 const options=/^\s*(?:bins|estimator|errorbar|jitter|style|size|col|kind)=/;
 const derived=round?.identifiers?.derivedColumns||[];
 return String(code||'').split('\n').flatMap((line,index)=>{
  const preparation=derived.some(name=>line.includes('["'+name+'"] =')||line.includes("['"+name+"'] ="));
  return (focus?focus.test(line):chart.test(line))||options.test(line)||preparation?[index+1]:[];
 });
}
function finalise(c){
 for(const lesson of visualiseLessons(c))for(const round of lesson.rounds){
  if(!round.workflow)continue;
  round.workflow.changedLines=changedLines(round.solution,lesson,round);
  round.workflow.changedSyntaxLines=changedLines(lesson.syntaxCode,lesson,round);
  round.workflow.changedTeachingLines=changedLines(round.teaching?.code,lesson,round);
 }
 return c;
}
const api={apply,finalise,changedLines,progression,parameterPlan};
if(typeof module!=='undefined')module.exports=api;else root.FoundationVisualiseGuidance=api;
})(typeof window!=='undefined'?window:globalThis);
