/* Shared provenance and interpretation boundaries for both workspaces and exports. */
window.DatasetDictionary = {
 'data/seoul-bike.csv': {
  row:'One hourly rental observation in Seoul.',
  source:'https://archive.ics.uci.edu/dataset/560/seoul+bike+sharing+demand',
  units:'Rented Bike Count: rentals in an hour. Temperature/dew point: °C. Humidity: %. Wind: m/s. Visibility: tens of metres. Solar radiation: MJ/m². Rainfall: mm. Snowfall: cm.',
  assumptions:'Functioning Day is service operation, not weekday status. Observed same-hour weather is explanatory input; forecasting requires weather forecasts available at prediction time. ML uses chronological splitting.'
 },
 'data/candy-power-ranking.csv': {
  row:'One candy product in the survey.',
  source:'https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking',
  units:'sugarpercent: sugar percentile. pricepercent: price percentile. winpercent: percentage of survey matchups won. Ingredient, bar and multipack fields are 0/1 flags.',
  assumptions:'Percentile ranks are neither physical sugar percentages nor currency prices. Ratios of percentiles do not measure economic value. Chocolate and fruit flags can overlap; non-chocolate is not synonymous with fruit. The ML class target is defined by winpercent ≥ 50.'
 },
 'data/gapminder.csv': {
  row:'One country-year in the archived five-year teaching extract.',
  source:'https://github.com/jennybc/gapminder',
  units:'lifeExp: life expectancy in years. pop: people. gdpPercap: GDP per person in the source’s inflation-adjusted international-dollar convention.',
  assumptions:'These are historical country aggregates, not individual causal effects. Data time-series questions use the full original extract; ML uses a 2007 cross-section and a random split, not a future forecast.'
 },
 'data/wine-quality.csv': {
  row:'One red or white wine sample.',
  source:'https://archive.ics.uci.edu/dataset/186/wine+quality',
  units:'quality: ordered sensory score (0–10). alcohol: volume percent. pH: acidity scale. Other chemistry units follow the linked source dictionary.',
  assumptions:'The score is ordinal but modelled as regression here. ML removes exact duplicate rows before splitting. Chemistry must be available at prediction time; predictive associations do not establish effects of changing an ingredient.'
 },
 'data/palmer-penguins.csv': {
  row:'One measured penguin.',
  source:'https://allisonhorst.github.io/palmerpenguins/',
  units:'Bill length/depth and flipper length: mm. Body mass: grams. Year and island: sampling context.',
  assumptions:'ML uses 333 complete cases. Removing incomplete records may change the represented population. Geographic context may not generalise to new islands.'
 },
 'data/breast-cancer.csv': {
  row:'One tumour sample represented by cell-nucleus image measurements.',
  source:'https://archive.ics.uci.edu/dataset/17/breast-cancer-wisconsin-diagnostic',
  units:'Computed image features, with mean, standard-error and worst summaries as defined by the source. Diagnosis is a category.',
  assumptions:'This is a historical teaching classification dataset, not a clinical decision system. Measurements are assumed available before prediction.'
 },
 'data/car-evaluation.csv': {
  row:'One categorical car configuration from a decision-model evaluation dataset.',
  source:'https://archive.ics.uci.edu/dataset/19/car+evaluation',
  units:'Buying/maintenance cost, doors, capacity, luggage and safety are categorical ratings, not observed currency prices.',
  assumptions:'Acceptability is derived from the source decision model. Performance reproduces that rating system and does not establish real-world safety or consumer preference.'
 }
};

// Units below follow the synthetic fixture: MIX60 assigns no physical units.
for (const name of ['MIX60','MISSING60']) window.DatasetDictionary[name] = {
 row:'One synthetic delivery observation generated for practice.',
 units:'Distance, weight and duration use the fixture’s numeric units; no kilometres, kilograms, minutes or other physical units are specified. RMSE is reported in the same synthetic duration units as the target.',
 assumptions:'These deterministic teaching observations do not describe real deliveries. Service effects and the alternating weekend flag are built into the generated response; they do not establish real-world causal effects.',
 columns:{
  distance:['Numeric delivery-distance input','Synthetic distance units; physical unit unspecified'],
  weight:['Numeric parcel-weight input','Synthetic weight units; physical unit unspecified'],
  service:['Delivery-service category','standard / express / economy'],
  weekend:['Binary weekend input, alternating in the fixture','0 / 1 indicator'],
  duration:['Numeric delivery-duration target','Synthetic duration units; physical unit unspecified']
 }
};
