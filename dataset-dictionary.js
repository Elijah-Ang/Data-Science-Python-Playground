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

// Audit populations vary the analytical properties as well as the scenario.
const auditedFixtures = {
 CHANNEL8: ['One synthetic contact-channel observation in a declared training or incoming batch.', {channel:['Named contact channel','email / phone / chat / kiosk'],batch:['Available encoder-fitting boundary','training / incoming']}],
 INTAKE48: ['One independent synthetic device intake.', {
  case_id:['Administrative identifier; exclude from prediction inputs','Identifier'],
  backlog_at_open:['Cases waiting when this case enters','Cases'],
  device_age_years:['Device age available at intake','Years'],
  completion_hours:['Later elapsed time to completion; target','Hours'],
  invoice_hours:['Later invoice derived from completion time; unavailable at intake','Hours']
 }],
 LAB90: ['One independent synthetic lab observation; class counts are 63, 18 and 9.', {
  sample_id:['Administrative identifier','Identifier'],signal:['Signed measured signal','Synthetic signal units'],
  speed_rpm:['Rotational speed available at measurement','Revolutions per minute'],
  status:['Later lab class; target','routine / watch / urgent'],
  confirmed_urgent:['Outcome-derived urgent flag; unavailable before confirmation','0 / 1']
 }],
 PROCESS30: ['One process observation in supplied chronological order; the final six rows shift to a new operating range.', {
  temperature_c:['Observed process temperature','Degrees Celsius'],pressure_bar:['Observed pressure','Bar'],
  output:['Observed process response','Synthetic output units']
 }],
 CUBIC60: ['One independent synthetic observation of a cubic response with noise.', {
  x:['Signed input coordinate','Synthetic input units'],y:['Observed cubic response; target','Synthetic response units']
 }],
 ERROR15: ['One labelled evaluation case; class C has observations but no predicted C cases.', {
  actual:['Observed class','A / B / C'],predicted:['Classifier output','A / B; C remains in the evaluation schema']
 }],
 ERROR12_REVIEW: ['One inspection case with two policy predictions on the same 27 observations.', {
  actual:['Observed inspection class','clear / inspect / urgent'],predicted:['First policy output','clear / inspect / urgent'],
  alternative:['Second policy output; compare class errors as well as accuracy','clear / inspect / urgent']
 }],
 RULE24_REVIEW: ['One synthetic stock-check case with unequal category frequencies and a continuous input.', {
  distance:['Continuous distance coordinate','Synthetic distance units'],fragile:['Binary category','0 / 1'],
  service_code:['Unordered service category encoded as integers','2 / 4 / 7; values are names, not magnitudes'],
  label:['Confirmed stock-check decision; target','audit / release']
 }],
 MATERIAL96: ['One independent synthetic material specimen; class supports are unequal.', {
  density_g_cm3:['Measured density','Grams per cubic centimetre'],conductivity_ms:['Measured conductivity','Millisiemens'],
  material:['Known material class','glass / metal / polymer']
 }],
 CLUSTER45_ANISO: ['One synthetic measured item; elongated groups have unequal support and overlapping geometry.', {
  length_mm:['Measured item length','Millimetres'],width_cm:['Measured item width','Centimetres']
 }],
 PCA60_MIXED: ['One synthetic sensor observation with several partly independent directions and a noise channel.', {
  a:['First sensor channel','Synthetic channel-a units'],b:['Mixed sensor channel','Synthetic channel-b units'],
  c:['Independent sensor channel','Synthetic channel-c units'],d:['Mixed sensor channel','Synthetic channel-d units'],
  e:['Independent noise channel','Synthetic channel-e units']
 }]
};
for (const [name,[row,columns]] of Object.entries(auditedFixtures)) window.DatasetDictionary[name] = {
 row,columns,units:'Use the units beside each named column; scale fitting geometry separately from original-unit interpretation.',
 assumptions:'Deterministic synthetic observations illustrate analytical decisions. They do not support deployment, causal claims or claims about a real population.'
};
