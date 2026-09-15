/* Curriculum refinements: stable published IDs, explicit sequencing and teaching metadata. */
(function(root){
'use strict';
function refine(c){
 const {datasets:D,lessons:L}=c, lesson=id=>L.find(l=>l.id===id);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const patch=(id,i,values)=>Object.assign(lesson(id).rounds[i],values);
 const table=(name,columns,a,b,c,id)=>({name,columns,a,b,c,d:c,id});
 for(const [key,text,category] of [['messy_games','game','edition'],['messy_pets','item','package']]){
  const d=D[key];d.columns=Object.fromEntries(Object.entries(d.columns).map(([k,v])=>[({drink:text,size:category,tip:'discount'})[k]||k,v]));
  d.a='discount';d.c=category;d.d=text;
  if(key==='messy_games'){d.columns.game=[' orbit-deluxe ','TILES','quest ','Grove','Grove',' cards-basic'];d.columns.edition=['DELUXE','standard','DELUXE','Standard','Standard','BASIC'];}
  else {d.columns.item=[' hay-bale ','FOOD',' toy-ball ','Bowl','Bowl',' food '];d.columns.package=['BULK','small','SINGLE','Small','Small','BULK'];}
 }
 // Adapt all affected teaching and retrieval material together; never just rename a table.
 for(const l of L)for(const r of l.rounds){
  if(!['messy_games','messy_pets'].includes(r.dataset))continue;
  const d=D[r.dataset];
  for(const field of ['task','solution','starter','hint','setup'])r[field]=r[field].replace(/\bdrink\b/g,d.d).replace(/\bsize\b/g,d.c).replace(/\btip\b/g,'discount');
 }
 lesson('W31').explanation='These orders contain confirmed duplicate records, inconsistent text, invalid prices and invalid dates. Create a separate clean table. Filling the numeric tip or discount with its observed median is an explicit exercise assumption; an unknown price stays missing.';
 // Stable IDs insert these cards without breaking existing bookmarks.
 function insert(after,id,title,goal,explanation,syntax,rounds){
  const source=lesson(after),l={id,deck:'inspect',chapter:source.chapter,title,goal,explanation,syntax,review:false,minutes:8,rounds:rounds.map((r,i)=>({id:`${id}-${i+1}`,label:['Follow','Change','Transfer'][i],target:'value',setup:'',plot:null,strictDtype:false,hint:'Use the isolated syntax and the given table to plan your answer.',...r}))};
  L.splice(L.indexOf(source)+1,0,l);return l;
 }
 insert('I01','I01CSV','Load a CSV','Load a tiny file into a DataFrame.',
  'In Data Playground, the selected dataset is already loaded for you. In an ordinary notebook, pd.read_csv() is one common way to load a table yourself. The file path names a CSV available in the current folder; read_csv returns a DataFrame, which assignment stores in df.',
  [['pd','the short name given to pandas'],['read_csv(...)','read a comma-separated file as a DataFrame'],['"candy.csv"','the file path, written as text'],['df =','store the returned DataFrame in df']],
  ['candy','cafe','pets'].map(key=>({dataset:key+'_build',target:'df',files:{[key+'.csv']:D[key+'_build'].columns},task:`Load the supplied ${key}.csv file into df and display the resulting DataFrame.`,solution:`import pandas as pd\n\ndf = pd.read_csv("${key}.csv")\ndf`,hint:`The tiny ${key}.csv file is already in this lesson's folder. Pass its quoted path to pd.read_csv().`})));
 insert('I18','I18S','Answer one numerical question','Choose a direct summary for a specific question.',
  'describe() provides a broad overview. Direct methods answer one question: mean gives the average, median the middle, min/max the endpoints, sum the total, count the number of known values, and quantile a chosen percentile. Missing values are skipped by these summaries.',
  [['series.mean() / .median()','average / middle value'],['series.min() / .max()','smallest / largest value'],['series.sum() / .count()','total / number of non-missing values'],['series.quantile(0.75)','75th percentile']],
  [
   {dataset:'candy',task:'Using df["price"], return a dictionary with keys mean, median, min, max, sum, count and q75, containing the matching direct summaries (q75 is the 75th percentile).',solution:'price = df["price"]\n{"mean": price.mean(), "median": price.median(), "min": price.min(), "max": price.max(), "sum": price.sum(), "count": price.count(), "q75": price.quantile(0.75)}'},
   {dataset:'cafe',task:'Return the total of df["tip"] as one number.',solution:'df["tip"].sum()'},
   {dataset:'pets',task:'What is the middle age in df? Return one number.',solution:'df["age"].median()'}]);
 // Label slices visibly differ from positional slices.
 for(let i=0;i<3;i++){
  const r=lesson('I09').rounds[i],d=clone(D[r.dataset]),key=r.dataset+'_labelled';d.index=['A','B','C','D','E','F'];D[key]=d;
  Object.assign(r,{dataset:key,setup:'df.index = ["A", "B", "C", "D", "E", "F"]',task:`Return labels B through ${['D','E','F'][i]}, including the end label, keeping only ${d.a} as a one-column DataFrame.`,solution:`df.loc["B":"${['D','E','F'][i]}", ["${d.a}"]]`});
 }
 lesson('I09').explanation='iloc selects integer positions, starting at zero. loc selects row and column labels. Here the row labels are letters: a loc slice from "B" to "D" includes B, C and D. The ending label is included; an iloc stop position is excluded.';
 lesson('I09').syntax=[['df.loc["B":"D", ["price"]]','labels B through D, including D; one price column'],['df.iloc[1:4, [2]]','positions 1, 2 and 3; column at position 2']];
 patch('I10',1,{task:'Keep the df rows whose drink is either Latte or Tea, using isin. Return a DataFrame in original row order.',solution:'df[df["drink"].isin(["Latte", "Tea"])]',hint:'isin(["Latte", "Tea"]) creates a membership mask.'});
 patch('I10',2,{task:'Return the df rows with age from 2 to 5 inclusive, in their original order.',solution:'df[df["age"].between(2, 5)]',hint:'between(2, 5) includes both endpoints; two comparisons combined with & also work.'});
 lesson('I10').explanation+=' For membership, isin([value1, value2]) tests a set of allowed values. between(low, high) includes both endpoints by default.';
 lesson('I10').syntax.push(['series.isin([...])','True for values in the supplied list'],['series.between(low, high)','True inside the inclusive range']);
 patch('I11',2,{task:'Return df rows where age is at least 2 and species is Cat, preserving row order.',solution:'df[(df["age"] >= 2) & (df["species"] == "Cat")]'});
 patch('W08',2,{task:'In df, add band: "high" when age exceeds 3, otherwise "low".',solution:'import numpy as np\ndf["band"] = np.where(df["age"] > 3, "high", "low")\ndf'});
 patch('I12',1,{task:'Return all rows of df sorted by tip, smallest first.',solution:'df.sort_values("tip", ascending=True)'});
 patch('I12',2,{task:'Return df sorted first by species alphabetically, then by age from oldest to youngest within each species.',solution:'df.sort_values(["species", "age"], ascending=[True, False])',hint:'Pass a list of columns and a matching list of ascending flags.'});
 lesson('I12').syntax.push(['ascending=[True, False]','ascending first key, descending second key']);
 // Missing category values make dropna=False an observable requirement.
 D.messy_games.columns.edition[2]=null;
 patch('I16',1,{task:'Return value counts for df["edition"], including missing values as a category.',solution:'df["edition"].value_counts(dropna=False)',hint:'value_counts(dropna=False) counts the missing entries too.'});
 patch('I16',2,{task:'Return the percentage of missing values in every df column as a Series (0–100).',solution:'df.isna().mean() * 100',hint:'The mean of a Boolean mask is the fraction that is True.'});
 lesson('I16').syntax.push(['isna().mean() * 100','percentage of missing cells per column']);
 // Literal replacement is text cleaning, not category recoding.
 for(const i of [1,2]){
  const r=lesson('W10').rounds[i],d=D[r.dataset];
  r.task=`In df, trim and lowercase ${d.d}, then replace literal hyphens with spaces. Trim and title-case ${d.c}. Return the updated DataFrame, retaining all rows and other values.`;
  r.solution=`df["${d.d}"] = df["${d.d}"].str.strip().str.lower().str.replace("-", " ", regex=False)\ndf["${d.c}"] = df["${d.c}"].str.strip().str.title()\ndf`;
  r.hint='str.replace("-", " ", regex=False) replaces literal hyphens; missing text remains missing.';
 }
 lesson('W10').syntax.push(['str.replace("-", " ", regex=False)','replace literal hyphens with spaces']);
 lesson('W10').explanation+=' str.replace(old, new, regex=False) replaces literal text within each value.';
 // Leave one lookup category unmatched so left versus inner changes the result.
 lesson('W24').rounds.forEach((r,i)=>{
  const d=D[r.dataset],keys=[...new Set(d.columns[d.c])].slice(0,-1),how=i===1?'inner':'left';
  r.auxiliary={name:'lookup',columns:{[d.c]:keys,priority:keys.map((_,n)=>n+1)}};
  r.setup=`lookup = pd.DataFrame(${JSON.stringify(r.auxiliary.columns)})`;
  r.task=i===0?`Left-join lookup onto df on ${d.c}; retain every df row and use validate="many_to_one". Return the joined DataFrame.`:i===1?`Inner-join df with lookup on ${d.c}, keeping only matched rows. Use validate="many_to_one" and return the joined DataFrame.`:`Attach lookup priorities to df on ${d.c} for an audit that must retain unmatched observations. Choose left or inner accordingly, validate the many-to-one relationship, and return the joined DataFrame.`;
  r.solution=`df.merge(lookup, on="${d.c}", how="${how}", validate="many_to_one")`;
 });
 lesson('W24').explanation='merge matches keys rather than row positions. A left join keeps every left row, giving unmatched keys missing lookup values. An inner join keeps only matches. validate="many_to_one" checks unique right-hand keys; wrong relationship assumptions can multiply rows.';
 lesson('W24').syntax=[['on="flavour"','the shared key'],['how="left" / how="inner"','all left rows / matching rows only'],['validate="many_to_one"','require each right-hand key to occur once']];
 for(const [i,key] of ['candy','cafe','pets'].entries()){
  const d=clone(D[key]);d.columns[d.a]=[10,11,12,13,14,40];d.name+=' · review measurements';D[key+'_iqr']=d;
  patch('W29',i,{dataset:key+'_iqr',task:`In df, add needs_review: True when ${d.a} is below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, where IQR = Q3 − Q1. Keep all rows and original values; return df.`,solution:`q1 = df["${d.a}"].quantile(0.25)\nq3 = df["${d.a}"].quantile(0.75)\niqr = q3 - q1\nlower = q1 - 1.5 * iqr\nupper = q3 + 1.5 * iqr\ndf["needs_review"] = (df["${d.a}"] < lower) | (df["${d.a}"] > upper)\ndf`});
 }
 lesson('W29').explanation='The 1.5 × IQR rule screens values outside Q1 − 1.5 × IQR and Q3 + 1.5 × IQR. A flagged value is not automatically wrong. Preserve the measurement and investigate its context before excluding or clipping anything.';
 lesson('W29').syntax=[['q1 / q3','25th / 75th percentiles'],['iqr = q3 - q1','spread of the middle half'],['1.5 * iqr','distance beyond each quartile for screening'],['(value < lower) | (value > upper)','flag either tail; retain the original value']];
 // Ordered observations, then genuine replicate measurements at each time.
 D.daily_sales=table('Daily sales',{day:[1,2,3,4,5],sales:[12,15,13,18,21]},'day','sales','day','day');
 D.hourly_temperature=table('Temperature by hour',{hour:[8,10,12,14,16],temperature:[25,27,30,31,29]},'hour','temperature','hour','hour');
 D.site_visits=table('Daily site visits',{day:[1,2,3,4,5],visits:[40,52,47,60,68]},'day','visits','day','day');
 function plotCode(body,d,x=d.a,y=d.b){return `import matplotlib.pyplot as plt\nimport seaborn as sns\n\nfig, ax = plt.subplots(figsize=(6, 4))\n${body}\nax.set(title="${d.name}", xlabel="${x}", ylabel="${y}")\nfig.tight_layout()\nplt.show()`;}
 for(const [i,key] of ['daily_sales','hourly_temperature','site_visits'].entries()){
  const d=D[key];patch('V18',i,{dataset:key,setup:'',solution:plotCode(`sns.lineplot(data=df, x="${d.a}", y="${d.b}", estimator=None, marker="o", ax=ax)`,d),task:`Plot df's ${d.b} over ${d.a} as a line with observation markers ("o") and no aggregation. Use title "${d.name}", x label "${d.a}" and y label "${d.b}". Display the Figure.`});
  const rep=clone(d);rep.name+=' · paired observations';rep.columns={[d.a]:[1,1,2,2,3,3,4,4],[d.b]:[12,14,16,18,14,16,20,22]};if(key==='hourly_temperature')rep.columns.hour=[8,8,10,10,12,12,14,14];rep.columns.replicate=['A','B','A','B','A','B','A','B'];D[key+'_repeated']=rep;
  patch('V19',i,{dataset:key+'_repeated',setup:'',solution:plotCode(`sns.lineplot(data=df, x="${d.a}", y="${d.b}", estimator="mean", errorbar="sd", marker="o", ax=ax)`,rep),task:`Using df's paired measurements, plot mean ${d.b} at each ${d.a}, with one-standard-deviation error bands and "o" markers. Use title "${rep.name}", x label "${d.a}", y label "${d.b}"; display the Figure.`});
 }
 for(const key of ['students_repeated','weather_repeated','games_repeated'])delete D[key];
 lesson('V18').goal='Connect observations along a meaningful time sequence.';
 lesson('V19').explanation='Each time has two measurements, identified by replicate. lineplot with estimator="mean" plots one average per time; errorbar="sd" shows the spread of those measurements, not a confidence interval. estimator=None and errorbar=None instead connect raw observations, including both values at each time.';
 const components=[['Game sessions','genre',['Puzzle','Strategy','Adventure','Family'],'Solo',[2,1,0,3],'Two players',[1,2,2,1]],['Café drinks sold','day',['Mon','Tue','Wed','Thu'],'Hot',[8,10,7,12],'Iced',[4,5,6,3]],['Pet supplies sold','item',['Food','Toys','Bedding','Bowls'],'Online',[4,2,3,1],'Shop',[3,5,2,4]]];
 components.forEach(([name,category,values,a,first,b,second],i)=>{
  const key='components_'+i,d=table(name,{[category]:values,[a]:first,[b]:second},a,b,category,category);D[key]=d;
  patch('V30',i,{dataset:key,solution:plotCode(`first = df["${a}"]\nsecond = df["${b}"]\nax.bar(df["${category}"], first, label="${a}")\nax.bar(df["${category}"], second, bottom=first, label="${b}")\nax.legend()`,d,category,'Count'),task:`Use df's actual ${a} and ${b} counts to draw stacked bars by ${category}, in table order. Put ${a} at the base and ${b} above it; label both components in a legend. Title "${name}", x label "${category}", y label "Count". Display the Figure.`});
 });
 lesson('V30').explanation='Each bar contains two measured parts in the same units. bottom places the upper part on the lower part. Only the base shares a zero baseline, making the upper segments harder to compare precisely. Keep component labels visible.';
 // Chart craft: category ordering and transparency have explicit visual checks.
 for(let i=1;i<3;i++){
  const r=lesson('V25').rounds[i],original=D[r.dataset],d=clone(original);
  d.name+=' · overlapping observations';
  d.columns[d.a][1]=d.columns[d.a][0];d.columns[d.b][1]=d.columns[d.b][0];
  const key=r.dataset+'_overlap';D[key]=d;r.dataset=key;
  r.solution=r.solution.replace(original.name,d.name);r.task=r.task.replace(original.name,d.name);
  const order=[...new Set(d.columns[d.c])].sort();
  r.solution=r.solution.replace('palette="colorblind",',`palette="colorblind", hue_order=${JSON.stringify(order)}, style_order=${JSON.stringify(order)}, alpha=0.6,`);
  r.task+=` Order hue and style categories as ${JSON.stringify(order)} and use alpha=0.6 so overlaps remain visible.`;
  r.plot={...r.plot,alpha:true};
 }
 lesson('V25').syntax.push(['hue_order=[...]','consistent category order across charts'],['alpha=0.6','partial transparency reveals overlapping points']);
 for(let i=1;i<3;i++){
  const r=lesson('V36').rounds[i],d=D[r.dataset],order=[...new Set(d.columns[d.c])].sort();
  r.solution=plotCode(`sns.countplot(data=df, x="${d.c}", order=${JSON.stringify(order)}, ax=ax)\nax.set_ylim(bottom=0)`,d,d.c,'Count');
  r.task=`Count df rows by ${d.c}, with categories ordered ${JSON.stringify(order)} and the y-axis starting at zero. Title "${d.name}", x label "${d.c}", y label "Count". Display the Figure.`;r.plot={categorical:true,limits:true};
 }
 lesson('V36').syntax.push(['order=[...]','set a deliberate category order']);
 // Transfer states outcomes rather than prescribing the API when alternatives are welcome.
 const chartNames={histplot:'draw a histogram',kdeplot:'draw a density curve',ecdfplot:'draw an ECDF',rugplot:'draw rug marks',countplot:'draw category counts',barplot:'draw estimated bars',pointplot:'draw point estimates',boxplot:'draw a box plot',violinplot:'draw a violin plot',stripplot:'draw jittered observations',swarmplot:'draw non-overlapping observations',boxenplot:'draw a letter-value plot',scatterplot:'draw a scatter plot',lineplot:'draw a line plot',regplot:'draw a fitted linear trend with observations',residplot:'draw a residual plot',heatmap:'draw a heatmap'};
 for(const l of L.filter(l=>!l.review&&l.deck==='visualise')){
  const r=l.rounds[2];
  for(const [api,description] of Object.entries(chartNames))r.task=r.task.replace('Use sns.'+api,description[0].toUpperCase()+description.slice(1)).replace('use sns.'+api,description).replace('Plot sns.'+api,description[0].toUpperCase()+description.slice(1));
 }
 patch('I08',2,{task:'Return the first 4 rows and first two columns of df by position, as a DataFrame.'});
 patch('W28',2,{task:'Standardise df columns age and weight by subtracting each mean and dividing by its population standard deviation. Return the two-column numeric array in that order.'});
 // Requirements describe API families rather than source-string matching.
 const intent={I01:['DataFrame'],I01CSV:['read_csv'],I02:['head'],I03:['attr:shape'],I04:['attr:columns'],I05:['info','attr:dtypes'],I08:['index:iloc'],I09:['index:loc'],I12:['sort_values'],I13:['nlargest'],I14:['nunique'],I15:['value_counts'],I17:['duplicated'],I18:['describe'],I19:['groupby','agg'],I20:['crosstab'],I21:['corr'],W01:['copy'],W02:['rename'],W04:['drop'],W06:['sort_values','reset_index'],W08:['where'],W09:['replace'],W10:['str.strip','str.lower','str.title'],W11:['str.contains'],W12:['to_numeric'],W13:['astype'],W14:['to_datetime'],W15:['to_datetime'],W16:['to_numeric','dropna'],W17:['fillna'],W18:['drop_duplicates'],W19:['groupby','agg'],W20:['transform'],W21:['pivot_table'],W22:['melt'],W23:['pivot'],W24:['merge'],W25:['concat'],W26:['cut'],W27:['get_dummies'],W28:['fit_transform'],W29:['quantile'],V01:['subplots'],V02:['set'],V03:['scatterplot'],V04:['histplot'],V05:['kdeplot'],V06:['ecdfplot'],V07:['histplot','rugplot'],V08:['countplot'],V09:['barplot'],V10:['pointplot'],V11:['boxplot'],V12:['violinplot'],V13:['stripplot'],V14:['swarmplot'],V15:['boxenplot'],V16:['scatterplot'],V17:['scatterplot'],V18:['lineplot'],V19:['lineplot'],V20:['regplot'],V21:['residplot'],V22:['heatmap'],V23:['heatmap'],V24:['subplots'],V25:['scatterplot'],V26:['set_xscale'],V27:['axhline','axvline'],V28:['annotate'],V29:['bar'],V30:['bar'],V31:['pairplot'],V32:['jointplot'],V33:['relplot'],V34:['savefig'],V36:['bar']};
 const further=new Set('I13 I20 I21 W08 W20 W21 W23 W26 W27 W28 W29 V05 V06 V07 V10 V12 V14 V15 V19 V20 V21 V23 V28 V30 V31 V32 V33'.split(' '));
 const visuals={
  I01:'mini-table',I01CSV:'csv-table',I02:'selected-row',I03:'table-shape',I04:'table-labels',I05:'column-types',I06:'selected-column',I07:'selected-columns',I08:'selected-row',I09:'labelled-row',I10:'filtered-table',I11:'filtered-table',I12:'sorted-table',I13:'sorted-table',I14:'unique-values',I15:'group-collapse',I16:'missing-cells',I17:'duplicate-rows',I18:'summary-table',I18S:'summary-table',I19:'group-collapse',I20:'heatmap',I21:'heatmap',
  W01:'before-after-table',W02:'renamed-table',W03:'selected-columns',W04:'dropped-column',W05:'filtered-table',W06:'sorted-table',W07:'new-column',W08:'new-column',W09:'before-after-table',W10:'clean-text',W11:'filtered-table',W12:'column-types',W13:'column-types',W14:'date-values',W15:'date-values',W16:'drop-missing',W17:'fill-missing',W18:'duplicate-rows',W19:'group-collapse',W20:'group-broadcast',W21:'reshape-table',W22:'reshape-table',W23:'reshape-wide',W24:'merge-tables',W25:'stack-tables',W26:'histogram',W27:'encoded-categories',W28:'scaled-values',W29:'boxplot',W30:'vectorised-values',
  V01:'canvas',V02:'chart-labels',V03:'scatter',V04:'histogram',V05:'density',V06:'ecdf',V07:'rug',V08:'bars',V09:'bars',V10:'point-interval',V11:'boxplot',V12:'violin',V13:'strip',V14:'swarm',V15:'boxen',V16:'scatter',V17:'scatter',V18:'line',V19:'line-band',V20:'regression',V21:'residual',V22:'heatmap',V23:'heatmap',V24:'multi-panel',V25:'scatter',V26:'chart-labels',V27:'reference-lines',V28:'annotation',V29:'bars',V30:'stacked-bars',V31:'pair-grid',V32:'joint-grid',V33:'multi-panel',V34:'figure-export',V35:'mixed-charts',V36:'bars'
 };
 function visualFamily(variant){
  if(['heatmap'].includes(variant))return 'matrix';
  if(['multi-panel','pair-grid','joint-grid','mixed-charts','challenge'].includes(variant))return 'panels';
  if(['scaled-values','vectorised-values'].includes(variant))return 'values';
  if(['canvas','figure-export'].includes(variant))return 'figure';
  if(['histogram','bars','stacked-bars'].includes(variant))return 'bars';
  if(['density','violin','boxen','boxplot','point-interval','strip','swarm','ecdf','rug'].includes(variant))return 'distribution';
  if(['before-after-table','clean-text','date-values','group-collapse','merge-tables','reshape-table','stack-tables','csv-table','renamed-table','drop-missing','fill-missing','group-broadcast','reshape-wide','encoded-categories'].includes(variant))return 'table-transform';
  if(['mini-table','table-shape','table-labels','column-types','selected-column','selected-columns','selected-row','labelled-row','filtered-table','sorted-table','missing-cells','duplicate-rows','unique-values','summary-table','new-column','dropped-column'].includes(variant))return 'table';
  return 'relationship';
 }
 for(const l of L.filter(l=>!l.review)){
  l.level=further.has(l.id)?'Go Further':'Core';
  l.visual={type:visualFamily(visuals[l.id]),variant:visuals[l.id],label:l.goal,highlight:l.id==='I07'?[1,2]:[2]};
  l.rounds.forEach((r,i)=>{
   r.requiredCalls=i<2?[...(intent[l.id]||[])]:[];r.forbiddenCalls=l.id==='W30'&&i<2?['apply']:[];
   if(l.id==='I01CSV')r.requiredCalls=['read_csv'];
   if(l.id==='W28'&&i<2)r.requiredCalls.push(i?'MinMaxScaler':'StandardScaler');
   if(l.id==='I10'&&i===1)r.requiredCalls=['isin'];
   if(l.id==='I16'&&i<2)r.requiredCalls=[i?'value_counts':'isna'];
   if(l.id==='I18S'&&i<2)r.requiredCalls=i?['sum']:['mean','median','min','max','sum','count','quantile'];
   if(l.id==='V33'&&i===1)r.requiredCalls=['catplot'];
   if(l.id==='V36'&&i===1)r.requiredCalls=['countplot'];
   if(l.id==='W10'&&i===1)r.requiredCalls.push('str.replace');
   if(l.id==='W24'){r.requiredCalls=['merge'];r.requiredKeywords=[{call:'merge',keyword:'validate',value:'many_to_one'}];} // the task explicitly asks to validate join cardinality
   r.resultKind=r.target==='plot'?'Figure':r.target==='df'||r.target==='copy'?'DataFrame':({I03:'tuple',I04:'list',I05:'Series',I06:'Series',I14:'number',I15:'Series',I16:i===1?'Series':'Series',I17:'number',I18S:i===0?'dictionary':'number',I19:'Series',W28:'numeric array'})[l.id]||'DataFrame';
   if(!/\bdf\b|supplied|first and second|long table/i.test(r.task))r.task='Using df, '+r.task[0].toLowerCase()+r.task.slice(1);
   if(!r.task.includes(r.resultKind)&&!/(display|return) (df|clean)/i.test(r.task))r.task+=` ${r.target==='df'?'Keep the changes in df and display it':r.target==='copy'?'Display clean':`Return the ${r.resultKind}`}.`;
   if(r.requiredCalls.length)r.task+=' Practise: '+r.requiredCalls.map(x=>x.replace(/^(attr|index):/,'')+(x.includes(':')?'':'()')).join(', ')+'.';
   if(r.forbiddenCalls.length)r.task+=' Use vectorised arithmetic; do not use apply().';
   r.hint=r.hint.replace(/Read the worked example one piece at a time\. /,'');
   // A partial plan leaves the operation AND its arguments to the learner.
   if(i===0){
    if(l.id==='I01')r.starter='import pandas as pd\n\ndata = {\n    # Add both column names and their four values\n    ____\n}\ndf = ____\ndf';
    else if(l.id==='I01CSV')r.starter='import pandas as pd\n\n# Load the file into df\ndf = ____\ndf';
    else if(r.target==='plot'){
     const figureLevel=['V31','V32','V33'].includes(l.id);
     r.starter='import matplotlib.pyplot as plt\nimport seaborn as sns\n\n'+(figureLevel?'# Create the figure-level chart\ng = ____\ng.figure.tight_layout()\nplt.show()':l.id==='V01'?'fig, ax = ____\n# Set the title and axis labels from Your task\nax.set(____)\nfig.tight_layout()\nplt.show()':'fig, ax = plt.subplots(figsize=(6, 4))\n# Build the requested chart\n____\n# Add the labels from Your task\nax.set(____)\nfig.tight_layout()\nplt.show()');
    }else if(r.target==='copy')r.starter='clean = ____\n# Make the requested change on clean\n____\nclean';
    else if(r.target==='df'){const assignments=r.solution.split('\n').filter(line=>/^df(?:\[.*?\])? = /.test(line));r.starter=(assignments.length?assignments.map(line=>line.replace(/ = .*/, ' = ____')).join('\n'):'# Update df using the task above\n____')+'\ndf';}
    else r.starter='# Build the requested result from the given table\n'+(r.solution.includes('df.iloc')?'result = df.iloc[____, ____]':r.solution.includes('df.loc')?'result = df.loc[____, ____]':'result = ____')+'\nresult';
   }else r.starter=i===1?'# Apply this concept to the new question\n':'# Your Python\n';
  });
  const first=l.rounds[0];
  const guided={I02:'df.____(____)',I03:'df.____',I04:'list(df.____)',I05:'df.____()\ndf.____',I06:'df[____]',I07:'df[[____, ____]]',I10:'mask = df["price"] > ____\ndf[____]',I11:'mask = (df["price"] > ____) & (df["flavour"] == ____)\ndf[mask]',I12:'filtered = df[df["price"] > ____]\nfiltered.sort_values(____, ascending=____)',I16:'df.____().____()',I18S:'price = df["price"]\n# Add all seven requested summary entries\nsummary = {\n    "mean": ____,\n    ____\n}\nsummary',W29:'q1 = df["price"].quantile(____)\nq3 = df["price"].quantile(____)\niqr = ____\nlower = ____\nupper = ____\ndf["needs_review"] = ____\ndf',W24:'df.merge(lookup, on=____, how=____, validate=____)'};
  if(guided[l.id])first.starter=guided[l.id];
  if(l.id==='V02')l.rounds.forEach((r,i)=>{const d=D[r.dataset];r.task=r.task.replace('Complete the supplied chart',`Create a scatter plot from df, x=${d.a}, y=${d.b},`);if(i===0)r.starter=`import matplotlib.pyplot as plt\nimport seaborn as sns\n\nfig, ax = plt.subplots(figsize=(6, 4))\nsns.scatterplot(data=df, x="${d.a}", y="${d.b}", ax=ax)\n# Finish the chart using Your task\nax.set(____)\nfig.tight_layout()\nplt.show()`;});
  if(l.id==='V24')l.rounds[0].starter='import matplotlib.pyplot as plt\nimport seaborn as sns\n\nfig, axes = plt.subplots(____, ____, figsize=(10, 4))\n# Histogram on axes[0], scatter on axes[1]\n____\n# Label each panel\naxes[0].set(____)\naxes[1].set(____)\nfig.tight_layout()\nplt.show()';
  if(l.id==='V34')l.rounds[0].starter=l.rounds[0].starter.replace('plt.show()', '# Save chart.png before display\n____\nplt.show()');
  if(l.id==='W26')l.rounds.forEach(r=>r.task+=' Each interval includes its right boundary.');
  l.example=l.rounds[0].solution;
  if(l.id==='I02')l.example='df.head(3)';
  const lines=l.example.split('\n').filter(s=>s.trim()&&!s.startsWith('import ')&&!s.startsWith('#'));
  l.syntaxCode=l.id==='I02'?'df.head(2)':l.id==='I01'?'df = pd.DataFrame(data)':l.id==='I01CSV'?'df = pd.read_csv("candy.csv")':l.id==='I18S'?'df["price"].mean()':l.id==='W29'?'iqr = q3 - q1\nlower = q1 - 1.5 * iqr\nupper = q3 + 1.5 * iqr':lines.find(s=>s.includes('sns.'))||lines.find(s=>s.includes('df.')||s.includes('df['))||lines[0];
 }
 // Refresh retrieval rounds from revised Transfer exercises, preserving review IDs.
 for(const l of L.filter(l=>l.review)){
  l.level='Review';l.visual={type:'panels',variant:'challenge',label:'Retrieve and combine earlier skills'};
  l.rounds=l.rounds.map((r,i)=>{
   if(r.retrieves){const updated=clone(lesson(r.retrieves).rounds[2]);return {...updated,id:r.id,retrieves:r.retrieves,label:`Task ${i+1}`,starter:'# Bring together what you remember\n'};}
   r.requiredCalls=[];r.forbiddenCalls=[];return r;
  });
 }
 for(const l of L)for(const r of l.rounds){
  r.task=r.task.replace('Using df, create one empty Figure','Create one empty Figure').replace(/Display clean\. Display clean\./g,'Display clean.').replace(/ Label y "Residual"\./g,'');
  if(l.id==='I22'){r.preserveData=true;r.resultKind='dictionary';}
  if(l.id==='W31')r.resultKind='DataFrame';
  if(l.id==='V37')r.resultKind='three Figures';
  if(l.id==='W31')r.task=r.task.replace('Create clean as a separate copy.', 'Create clean as a separate copy of df.');
  if(l.id==='V37')r.task='Using df, '+r.task[0].toLowerCase()+r.task.slice(1);
 }
 return c;
}
if(typeof module!=='undefined')module.exports=refine;else root.refineFoundations=refine;
})(typeof window!=='undefined'?window:globalThis);
