/* Reviewed descriptions for the six existing Data routes; Python is unchanged. */
(function(root){
  'use strict';
  const common={
    preview:['Use the automatically loaded df. Run df.head(10) to inspect the first ten rows before changing anything.','A table shows the starting rows and all their columns. Notice which columns are numbers, labels or dates.'],
    summary:['Summarise every column in df with describe(include="all"), turn columns into rows with transpose(), and round the displayed numbers to two decimal places.','A summary table has one row per column. Numeric columns show scale and spread; label columns show counts and common values. Missing summaries for a different data type are expected.'],
    types:['Run df.dtypes to see how pandas treats each column. Display the returned Series.','Each column name is paired with its type. Read the type before choosing a filter, calculation or chart.']
  };
  const datasets={
    seoul:{
      filter:['Keep only df rows whose `Functioning Day` is "Yes". Make a copy of that selection and use it as the working df for the remaining route.','The working row count falls to operating-day records. The sealed raw copy still contains every original row.'],
      create:['In the current df, round `Temperature(°C)` to one decimal place and store it in the new column `temp_c`.','df has a new temperature column in Celsius. Existing rows and the original temperature measurements remain available.'],
      chart:['From the current operating-day df, calculate mean `Rented Bike Count` for each `Hour`. Draw a line chart with hour on x and average rentals on y; show the chart with plt.show().','One point per hour shows the daily demand pattern. Read the axes and compare the peaks; the chart summarises only the selected operating days.'],
      final:['Sort the current df by `Rented Bike Count`, highest first. Display the first ten records, keeping `Date`, `Hour` and `Rented Bike Count` in that order.','The evidence table identifies the ten highest-demand operating-day records. Use their date and hour to describe the pattern you found.']
    },
    candy:{
      filter:['Keep only df rows whose `chocolate` is 1. Copy the selection into the working df before the later route steps.','The working table contains chocolate candies only. The sealed raw copy still includes the other candies.'],
      create:['Create `low_price_high_win` in df. A row is True when `pricepercent` is at most 0.5 and `winpercent` is at least 50; otherwise it is False.','The new Boolean column marks candies that meet both thresholds. The existing price and win measurements remain available.'],
      chart:['Select the twelve chocolate candies with the highest `winpercent`. Order those selected rows by win percent for a horizontal bar chart, with `competitorname` on y and `winpercent` on x. Display the chart with plt.show().','Twelve bars compare the leading chocolate candies. Read both the names and win percentages; these are recorded preference results.'],
      final:['Sort the working df by `winpercent`, highest first. Display ten rows with `competitorname`, `winpercent` and `low_price_high_win` in that order.','The table shows which high-ranking chocolate candies also meet your price-and-win rule.']
    },
    gapminder:{
      filter:['Keep only df records whose `year` is 2007. Copy that selection into the working df for the rest of this route.','Every remaining row describes a country in 2007. Other years remain in the sealed raw copy.'],
      create:['Multiply `pop` by `gdpPercap` for each row of df. Round the estimate to zero decimal places and store it in `gdp_total`.','The new column estimates each country’s total GDP for the selected year. It uses population and per-person GDP from the same record.'],
      chart:['Calculate the mean `lifeExp` in the current df for each `continent`. Sort those group means and draw a horizontal bar chart: mean life expectancy on x, continent on y. Show it with plt.show().','One bar per continent compares country averages in 2007. Each country contributes equally to the mean; this is not a population-weighted mean.'],
      final:['Sort the working df by `lifeExp`, highest first. Display ten countries with `country`, `lifeExp`, `gdpPercap` and `continent` in that order.','The table names the countries with the highest recorded life expectancy in 2007 and gives economic and regional context.']
    },
    wine:{
      filter:['Keep only df rows with `quality` at least 6. Copy that selection into the working df for the later route steps.','Every remaining wine has a quality score of 6 or more. The raw copy still contains lower-scoring wines.'],
      create:['Use pd.cut() on `alcohol` with boundaries 0, 10, 12 and 20. Name the intervals "low", "mid" and "high", and store the result in `alcohol_band`.','The new category column groups alcohol values into (0, 10], (10, 12] and (12, 20]. A value outside those intervals stays missing.'],
      chart:['Group the current df by `quality` and calculate mean `alcohol` for each score. Plot quality score on x and average alcohol on y as a line chart, then display it with plt.show().','One point per selected quality score compares average alcohol levels. The chart describes an association within the wines scoring at least 6.'],
      final:['Sort the working df by `quality`, highest first. Display ten rows with `wine_type`, `quality`, `alcohol` and `pH` in that order.','The table gives concrete high-scoring records to compare with the chart. Rows tied on quality may appear together.']
    }
  };
  root.DataTaskBriefs={get:(dataset,id)=>common[id]||datasets[dataset]?.[id]||null};
})(window);
