/* Small pandas operations with fixed, visible observations. The same operation
   supplies the displayed Python and the result; no learner work is retained. */
(function (root) {
'use strict';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const py = value => value === null ? 'None' : typeof value === 'boolean' ? (value ? 'True' : 'False') : typeof value === 'string' ? JSON.stringify(value) : Array.isArray(value) ? '[' + value.map(py).join(', ') + ']' : String(value);
const frame = (columns, rows, index = rows.map((_, i) => i), name = 'df') => ({kind:'table', columns, rows, index, name});
const series = (name, index, values, indexName = '') => ({kind:'series', columns:[name], rows:values.map(value => [value]), index, indexName});
const scalar = value => ({kind:'scalar', value});
const list = values => ({kind:'list', values});
const clone = value => JSON.parse(JSON.stringify(value));
const column = (table, name) => table.rows.map(row => row[table.columns.indexOf(name)]);
const select = (table, names) => frame(names, table.rows.map(row => names.map(name => row[table.columns.indexOf(name)])), table.index.slice());
const subset = (table, predicate) => {
  const positions = table.rows.map((_, i) => i).filter(i => predicate(table.rows[i], i));
  return frame(table.columns.slice(), positions.map(i => table.rows[i].slice()), positions.map(i => table.index[i]));
};
const addColumn = (table, name, values) => {
  const position = table.columns.indexOf(name), names = table.columns.slice();
  if (position < 0) names.push(name);
  return {...frame(names, table.rows.map((source, i) => {
    const row = source.slice(); row[position < 0 ? row.length : position] = values[i]; return row;
  }), table.index.slice()), emphasisColumns:[name]};
};
const unique = values => [...new Set(values)];
const sortedUnique = values => unique(values.filter(value => value !== null)).sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
const mean = values => { const known = values.filter(value => value !== null); return known.reduce((sum,value) => sum + value, 0) / known.length; };
const quantile = (values, q) => {
  const known = values.filter(value => value !== null).slice().sort((a,b) => a-b), position = (known.length-1)*q;
  return known[Math.floor(position)] + (known[Math.ceil(position)]-known[Math.floor(position)])*(position-Math.floor(position));
};
const standardDeviation = (values, ddof=1) => Math.sqrt(values.reduce((sum,value)=>sum+(value-mean(values))**2,0)/(values.length-ddof));
const group = (table, key, measurement) => sortedUnique(column(table,key)).map(label => ({label, values:table.rows.filter(row => row[table.columns.indexOf(key)] === label).map(row => row[table.columns.indexOf(measurement)])}));
const summarise = (values, method) => method === 'mean' ? mean(values) : method === 'median' ? quantile(values,.5) : method === 'sum' ? values.filter(value=>value!==null).reduce((a,b)=>a+b,0) : method === 'size' ? values.length : method === 'count' ? values.filter(value=>value!==null).length : Math.max(...values);
const rows = frame(['candy','flavour','price','rating','shelf'], [
  ['Berry','fruity',2,8,'A'], ['Mint','mint',4,6,'B'], ['Apple','fruity',6,9,'B'], ['Cocoa','chocolate',3,7,'A']
]);
const basic = (...names) => select(rows,names);
const specs = {};
function define(id, label, choices, input, operation, options={}) {
  specs[id] = {id, label, choices:choices.map(choice=>Array.isArray(choice)?choice:[String(choice),String(choice)]), input, operation, ...options};
}

// Inspect: queries change the result, never the underlying observations.
define('I02','Rows to read',[1,2,3],()=>basic('candy','price'),(t,v)=>({code:`df.head(${v})`, result:subset(t,(_,i)=>i<Number(v)), summary:`The first ${v} row${v==='1'?'':'s'}.`}));
define('I06','Column to read',['price','rating'],()=>basic('candy','price','rating'),(t,v)=>({code:`df[${py(v)}]`, result:series(v,t.index,column(t,v)), summary:`One labelled Series of ${v} values; no rows change.`}));
define('I07','Column order',[['rating,price','rating, price'],['price,rating','price, rating']],()=>basic('candy','price','rating'),(t,v)=>({code:`df[[${v.split(',').map(py).join(', ')}]]`, result:select(t,v.split(',')), summary:'The list controls which columns appear and their order.'}));
define('I08','Stop before position',[1,2,3],()=>basic('candy','price','rating'),(t,v)=>({code:`df.iloc[:${v}, :2]`, result:select(subset(t,(_,i)=>i<Number(v)),t.columns.slice(0,2)), summary:`Take row positions 0 through ${Number(v)-1}, and column positions 0 and 1. The stop position is excluded.`}));
define('I09','Last row label',['B','C','D'],()=>({...basic('candy','price'),index:['A','B','C','D']}),(t,v)=>({code:`df.loc["B":${py(v)}, ["price"]]`, result:select(subset(t,(_,i)=>i>=1&&i<=t.index.indexOf(v)),['price']), summary:`Label slicing includes both B and ${v}. Only price is returned.`}));
define('I10','Keep prices greater than',[2,3,4],()=>basic('candy','price'),(t,v)=>({code:`df[df["price"] > ${v}]`, result:subset(t,row=>row[1]>Number(v)), summary:`Only prices strictly above ${v} remain. A price equal to ${v} is excluded.`}));
define('I11','Required flavour',['fruity','mint'],()=>basic('flavour','price'),(t,v)=>({code:`df[(df["price"] > 2) & (df["flavour"] == ${py(v)})]`, result:subset(t,row=>row[1]>2&&row[0]===v), summary:`Both tests must pass: price above 2 and flavour equal to ${v}.`}));
define('I12','Sort direction',[['False','Largest first'],['True','Smallest first']],()=>basic('candy','price','rating'),(t,v)=>{
  const filtered=subset(t,row=>row[1]>2), positions=filtered.rows.map((_,i)=>i).sort((a,b)=>(filtered.rows[a][2]-filtered.rows[b][2])*(v==='True'?1:-1));
  return {code:`filtered = df[df["price"] > 2]\nfiltered.sort_values("rating", ascending=${v})`, result:frame(t.columns,positions.map(i=>filtered.rows[i]),positions.map(i=>filtered.index[i])), summary:'First filter on price; then sort the remaining rows by rating. Each row keeps its label and values.'};
});
define('I13','How many largest rows',[1,2,3],()=>basic('candy','price'),(t,v)=>{
  const positions=t.rows.map((_,i)=>i).sort((a,b)=>t.rows[b][1]-t.rows[a][1]).slice(0,Number(v));
  return {code:`df.nlargest(${v}, "price")`,result:frame(t.columns,positions.map(i=>t.rows[i]),positions.map(i=>t.index[i])),summary:`Return the ${v} highest-price row${v==='1'?'':'s'}, ordered from largest to smallest.`};
});
define('I13L','Column to find the maximum',['reading','temperature'],()=>frame(['reading','temperature'],[[12,22],[15,25],[19,24],[13,20]],[101,106,103,109]),(t,v)=>{
  const values=column(t,v),maximum=Math.max(...values),position=values.indexOf(maximum),label=t.index[position];
  return {code:`df[${py(v)}].idxmax()`,result:scalar(label),summary:`Largest ${v}: ${maximum}. Its row label is ${label}; its position is ${position}.`};
});
define('I14','Category column',['flavour','shelf'],()=>basic('flavour','shelf'),(t,v)=>({code:`df[${py(v)}].nunique()`,result:scalar(unique(column(t,v)).length),summary:`Count distinct ${v} labels, rather than observations.`}));
define('I15','Display the category frequency',[['True','Proportions'],['False','Counts']],()=>frame(['flavour'],[['fruity'],['mint'],['fruity'],['chocolate']]),(t,v)=>{
  const groups=unique(column(t,'flavour')).map(label=>[label,column(t,'flavour').filter(value=>value===label).length]).sort((a,b)=>b[1]-a[1]);
  return {code:`df["flavour"].value_counts(normalize=${v})`,result:series(v==='True'?'proportion':'count',groups.map(g=>g[0]),groups.map(g=>v==='True'?g[1]/t.rows.length:g[1]),'flavour'),summary:v==='True'?'Each count is divided by four rows; proportions sum to 1.':'Each category receives its number of rows; counts sum to 4.'};
});
define('I16','Columns to check',[['all','All columns'],['price','Only price']],()=>frame(['price','tip'],[[2,null],[null,1],[4,null],[3,2]]),(t,v)=>{
  const source=v==='all'?t:select(t,['price']);
  return {code:v==='all'?'df.isna().sum()':'df[["price"]].isna().sum()',result:series('missing',source.columns,source.columns.map(name=>column(source,name).filter(value=>value===null).length)),summary:'Each missing cell contributes one True flag; summing counts those flags down each selected column.'};
});
define('I18','Numeric column',['price','rating'],()=>basic('price','rating'),(t,v)=>{
  const values=column(t,v);
  return {code:`df[[${py(v)}]].describe()`,result:frame([v],[[values.length],[mean(values)],[standardDeviation(values)],[Math.min(...values)],[quantile(values,.25)],[quantile(values,.5)],[quantile(values,.75)],[Math.max(...values)]],['count','mean','std','min','25%','50%','75%','max']),summary:'One column supplies every summary. std uses the sample standard deviation; 50% is the median.'};
});
define('I18S','Column to average',['price','rating'],()=>basic('price','rating'),(t,v)=>({code:`df[${py(v)}].mean()`,result:scalar(mean(column(t,v))),summary:`Add the ${v} values, then divide by their count.`}));
define('I19','Group labels come from',['flavour','shelf'],()=>basic('flavour','shelf','price'),(t,v)=>{
  const groups=group(t,v,'price');
  return {code:`df.groupby(${py(v)})["price"].agg("mean")`,result:series('price',groups.map(g=>g.label),groups.map(g=>mean(g.values)),v),summary:`Rows with the same ${v} label contribute to one mean price. Each group becomes one output row.`};
});
define('I19S','Grouping labels',['bench','station'],()=>frame(['bench','station','reading'],[['A','North',2],['A','South',4],['B','North',8],['C','South',6]]),(t,v)=>{
  const groups=group(t,v,'reading'), means=series('reading',groups.map(g=>g.label),groups.map(g=>mean(g.values)),v);
  return {code:`means = df.groupby(${py(v)})["reading"].mean()\nlist(means.index)`,intermediate:means,result:list(means.index),summary:'Grouping creates one mean per label. means.index returns those group labels, rather than the mean measurements.'};
});
define('I20','Rows × columns',[['flavour,shelf','flavour × shelf'],['shelf,flavour','shelf × flavour']],()=>basic('flavour','shelf'),(t,v)=>{
  const [rowName,colName]=v.split(','), rowLabels=sortedUnique(column(t,rowName)), headers=sortedUnique(column(t,colName));
  return {code:`pd.crosstab(df[${py(rowName)}], df[${py(colName)}])`,result:{...frame(headers,rowLabels.map(label=>headers.map(header=>t.rows.filter(row=>row[t.columns.indexOf(rowName)]===label&&row[t.columns.indexOf(colName)]===header).length)),rowLabels),indexName:rowName},summary:'Each cell counts observations with both labels. Swapping the inputs transposes the same counts.'};
});
define('I21','Numeric columns',[['price,rating','price and rating'],['price','price only']],()=>basic('candy','price','rating'),(t,v)=>{
  const names=v.split(','), values=names.map(name=>column(t,name)), correlation=(a,b)=>a.reduce((sum,value,i)=>sum+(value-mean(a))*(b[i]-mean(b)),0)/Math.sqrt(a.reduce((sum,value)=>sum+(value-mean(a))**2,0)*b.reduce((sum,value)=>sum+(value-mean(b))**2,0));
  return {code:v.includes(',')?'df.corr(numeric_only=True)':'df[["price"]].corr(numeric_only=True)',result:frame(names,values.map(a=>values.map(b=>correlation(a,b))),names),summary:'Only numeric columns enter this matrix. A varying column has correlation 1 with itself.'};
});

// Wrangle: one taught operation at a time, with before/after row labels visible.
define('W01','Columns in the copy',[['candy,price','candy, price'],['candy,rating','candy, rating']],()=>basic('candy','price','rating'),(t,v)=>({code:`clean = df.copy()\nclean = clean[[${v.split(',').map(py).join(', ')}]]\nclean`,result:{...select(t,v.split(',')),name:'clean'},summary:'Selecting columns in clean leaves df intact.'}));
define('W14','format',[['%Y-%m-%d','%Y-%m-%d'],['%d/%m/%Y','%d/%m/%Y']],()=>frame(['date'],[['2026-06-01'],['03/07/2026'],['invalid']]),(t,v)=>{
 const values=column(t,'date').map(value=>v==='%Y-%m-%d'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:v==='%d/%m/%Y'&&/^\d{2}\/\d{2}\/\d{4}$/.test(value)?value.split('/').reverse().join('-'):null);
 return {code:`df["date"] = pd.to_datetime(df["date"], format=${py(v)}, errors="coerce")\ndf`,result:{...addColumn(t,'date',values),missingValue:'NaT'},summary:'Matching text becomes a date; other values become NaT.'};
});

define('W02','New heading',['amount','cost'],()=>basic('candy','price'),(t,v)=>({code:`df = df.rename(columns={"price": ${py(v)}})\ndf`,result:frame(['candy',v],clone(t.rows),t.index.slice()),summary:`Only the heading changes: price becomes ${v}. Every value and row stays in place.`}));
define('W03','Columns in the result',[['candy,rating,price','candy, rating, price'],['candy,price','candy, price']],()=>basic('candy','price','rating'),(t,v)=>({code:`df = df[[${v.split(',').map(py).join(', ')}]]\ndf`,result:select(t,v.split(',')),summary:'The list sets both the retained columns and their order; it does not reorder rows.'}));
define('W04','Column to drop',['shelf','rating'],()=>basic('candy','rating','shelf'),(t,v)=>({code:`df = df.drop(columns=[${py(v)}])\ndf`,result:select(t,t.columns.filter(name=>name!==v)),summary:`Remove the ${v} column.`}));
define('W05','Keep this flavour',['fruity','mint','chocolate'],()=>basic('candy','flavour','price'),(t,v)=>({code:`df = df[df["flavour"] == ${py(v)}]\ndf`,result:subset(t,row=>row[1]===v),summary:`Keep only ${v} rows; retain their existing labels and values.`}));
define('W06','Column to sort',['price','rating'],()=>basic('candy','price','rating'),(t,v)=>{
  const position=t.columns.indexOf(v), positions=t.rows.map((_,i)=>i).sort((a,b)=>t.rows[a][position]-t.rows[b][position]);
  return {code:`df = df.sort_values(${py(v)}).reset_index(drop=True)\ndf`,result:{...frame(t.columns,positions.map(i=>t.rows[i])),sourceRows:positions},summary:`Sort by ${v}, smallest first. Then replace the old row labels with 0, 1, 2, 3.`};
});
define('W07','Multiply each price by',[2,3,4],()=>basic('candy','price'),(t,v)=>({code:`df["pair_price"] = df["price"] * ${v}\ndf`,result:addColumn(t,'pair_price',column(t,'price').map(value=>value*Number(v))),summary:`Every price is multiplied by ${v}.`}));
define('W08','High means price above',[2,3,4],()=>basic('candy','price'),(t,v)=>({code:`import numpy as np\n\ndf["band"] = np.where(df["price"] > ${v}, "high", "low")\ndf`,result:addColumn(t,'band',column(t,'price').map(value=>value>Number(v)?'high':'low')),summary:`True gives high; False gives low. A price equal to ${v} is low.`}));
define('W09','Replace fruity with',['fruit','fresh'],()=>basic('candy','flavour'),(t,v)=>({code:`df["flavour"] = df["flavour"].replace({"fruity": ${py(v)}})\ndf`,result:addColumn(t,'flavour',column(t,'flavour').map(value=>value==='fruity'?v:value)),summary:`Only complete labels equal to fruity become ${v}. All other labels remain unchanged.`}));
define('W10','Case for the drink names',[['lower','lower()'],['title','title()']],()=>frame(['drink','size'],[[' latte ','LARGE'],['TEA','small'],[' mocha ','LARGE']]),(t,v)=>({code:`df["drink"] = df["drink"].str.strip().str.${v}()\ndf["size"] = df["size"].str.strip().str.title()\ndf`,result:frame(t.columns,t.rows.map(([drink,size])=>[v==='lower'?drink.trim().toLowerCase():drink.trim().toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),size.trim().toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())])),summary:'Strip removes surrounding spaces; the selected case method changes drink names. Size always uses title case.'}));
define('W11','Literal text to find',['a','mint','berry'],()=>basic('candy','price'),(t,v)=>({code:`df[df["candy"].str.contains(${py(v)}, case=False, na=False, regex=False)]`,result:subset(t,row=>row[0].toLowerCase().includes(v.toLowerCase())),summary:`Keep names containing ${v}, ignoring case. This is a literal text search, not a pattern.`}));
define('W12','Numeric text column',['price','tip'],()=>frame(['price','tip'],[['2.5','1'],['bad','0.5'],['4','oops']]),(t,v)=>({code:`df[${py(v)}] = pd.to_numeric(df[${py(v)}], errors="coerce")\ndf`,result:addColumn(t,v,column(t,v).map(value=>Number.isFinite(Number(value))?Number(value):null)),summary:`Parse only ${v}. Invalid text becomes NaN; the other text column stays unchanged.`}));
define('W15','Date field',[['year','Year'],['month','Month number'],['weekday','Weekday name']],()=>frame(['date'],[['2026-06-01'],['2026-07-03'],['2026-08-04']]),(t,v)=>{
  const extract=value=>v==='year'?Number(value.slice(0,4)):v==='month'?Number(value.slice(5,7)):['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(value+'T00:00:00Z').getUTCDay()];
  return {code:`df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d", errors="coerce")\ndf[${py(v)}] = df["date"].dt.${v==='weekday'?'day_name()':v}\ndf`,result:addColumn(t,v,column(t,'date').map(extract)),summary:'Read the selected calendar field from each parsed date. Dates and row order remain the same.'};
});
define('W16','Require a value in',['price','tip'],()=>frame(['price','tip'],[[2,null],[null,1],[4,null],[3,2]]),(t,v)=>({code:`df = df.dropna(subset=[${py(v)}])\ndf`,result:subset(t,row=>row[t.columns.indexOf(v)]!==null),summary:`Drop rows missing ${v}. A missing value in the other column does not remove a row.`}),{note:'Here price and tip are already numeric, so the visual isolates dropna.'});
define('W17','Fill gaps in',['tip','price'],()=>frame(['price','tip'],[[2,null],[null,1],[4,3],[6,2]]),(t,v)=>{
  const middle=quantile(column(t,v),.5);
  return {code:`df[${py(v)}] = df[${py(v)}].fillna(df[${py(v)}].median())\ndf`,result:addColumn(t,v,column(t,v).map(value=>value===null?middle:value)),summary:`The known ${v} values have median ${middle}; fill only their missing cells with ${middle}.`};
});
define('W19','Group by',['flavour','shelf'],()=>basic('flavour','shelf','price'),(t,v)=>{
  const groups=group(t,v,'price');
  return {code:`df.groupby(${py(v)}, as_index=False).agg(\n    mean_amount=("price", "mean"), records=("price", "size")\n)`,result:frame([v,'mean_amount','records'],groups.map(g=>[g.label,mean(g.values),g.values.length])),summary:'Each group becomes one row: mean_amount averages price; records counts observations.'};
});
define('W20','Group by',['flavour','shelf'],()=>basic('flavour','shelf','price'),(t,v)=>{
  const means=new Map(group(t,v,'price').map(g=>[g.label,mean(g.values)]));
  return {code:`df["group_mean"] = df.groupby(${py(v)})["price"].transform("mean")\ndf`,result:addColumn(t,'group_mean',column(t,v).map(label=>means.get(label))),summary:'Every original row remains. Rows in the same group receive the same group mean.'};
});
define('W21','Category layout',[['flavour,shelf','flavour rows, shelf columns'],['shelf,flavour','shelf rows, flavour columns']],()=>frame(['flavour','shelf','price'],[['fruity','A',2],['fruity','A',4],['mint','A',8],['mint','B',6]]),(t,v)=>{
  const [rowName,colName]=v.split(','), labels=sortedUnique(column(t,rowName)), columns=sortedUnique(column(t,colName));
  return {code:`df.pivot_table(index=${py(rowName)}, columns=${py(colName)}, values="price", aggfunc="mean")`,result:{...frame(columns,labels.map(label=>columns.map(name=>{const values=t.rows.filter(row=>row[t.columns.indexOf(rowName)]===label&&row[t.columns.indexOf(colName)]===name).map(row=>row[2]);return values.length?mean(values):null;})),labels),indexName:rowName},summary:'Repeated category pairs are averaged. A combination with no observations remains NaN.'};
});
define('W22','Measurements to stack',[['price,rating','price and rating'],['price','price only']],()=>frame(['candy','price','rating'],[['Berry',2,8],['Mint',4,6]]),(t,v)=>{
  const names=v.split(',');
  return {code:`df.melt(\n    id_vars=["candy"], value_vars=[${names.map(py).join(', ')}],\n    var_name="measure", value_name="value"\n)`,result:frame(['candy','measure','value'],names.flatMap(name=>t.rows.map(row=>[row[0],name,row[t.columns.indexOf(name)]]))),summary:`Each candy contributes ${names.length} row${names.length===1?'':'s'}: one for each selected measurement. No selected value is lost.`};
});
define('W23','Measurement to put in cells',[['value','Value'],['reading','Reading']],()=>frame(['candy','measure','value','reading'],[['Berry','price',2,20],['Berry','rating',8,80],['Mint','price',4,40],['Mint','rating',6,60]],undefined,'long'),(t,v)=>{
  const labels=sortedUnique(column(t,'candy')), names=sortedUnique(column(t,'measure'));
  return {code:`long.pivot(index="candy", columns="measure", values=${py(v)})`,result:{...frame(names,labels.map(label=>names.map(name=>t.rows.find(row=>row[0]===label&&row[1]===name)[t.columns.indexOf(v)])),labels),indexName:'candy'},summary:'Each candy/measure pair is unique. Pivot moves the chosen values into columns without averaging.'};
});
define('W24','Lookup field to bring in',['priority','label'],()=>({inputs:[basic('candy','flavour'),frame(['flavour','priority','label'],[['fruity',1,'Fresh'],['mint',2,'Cool']],undefined,'lookup')]}),(t,v)=>{
  const [source,lookup]=t.inputs;
  const result=frame(source.columns.concat(v),source.rows.map(row=>{
    const matched=lookup.rows.find(candidate=>candidate[0]===row[1]);
    return row.concat(matched?matched[lookup.columns.indexOf(v)]:null);
  }));
  return {code:`df.merge(lookup[["flavour", ${py(v)}]], on="flavour", how="left", validate="many_to_one")`,result,summary:`Match equal flavour keys to add ${v}. Every left row remains; chocolate has no lookup match, so its new value is NaN.`};
});
define('W25','Table order',[['first,second','first, then second'],['second,first','second, then first']],()=>({inputs:[frame(['candy','price'],[['Berry',2],['Mint',4]],[0,1],'first'),frame(['candy','price'],[['Apple',6]],[2],'second')]}),(t,v)=>{
  const tables=v.split(',').map(name=>t.inputs.find(input=>input.name===name));
  return {code:`pd.concat([${v.split(',').join(', ')}], ignore_index=True)`,result:frame(tables[0].columns,tables.flatMap(table=>table.rows)),summary:'Tables stack in list order. ignore_index=True numbers the combined rows from zero.'};
});
define('W26','Middle boundary',[2,3,4],()=>frame(['price'],[[0],[2],[3],[4],[5],[7]]),(t,v)=>({code:`df["half"] = pd.cut(\n    df["price"], bins=[0, ${v}, 8], labels=["lower", "upper"], include_lowest=True\n)\ndf`,result:addColumn(t,'half',column(t,'price').map(value=>value<=Number(v)?'lower':'upper')),summary:`Lower includes 0 through ${v}; upper includes values above ${v} through 8. A value on the middle boundary belongs to lower.`}));
define('W27','Category column to encode',['flavour','shelf'],()=>frame(['flavour','shelf','price'],[['fruity','A',2],['mint','B',4],['fruity','B',6]]),(t,v)=>{
  const categories=sortedUnique(column(t,v)), retained=t.columns.filter(name=>name!==v);
  return {code:`pd.get_dummies(df, columns=[${py(v)}], dtype=int)`,result:{...frame(retained.concat(categories.map(label=>v+'_'+label)),t.rows.map(row=>retained.map(name=>row[t.columns.indexOf(name)]).concat(categories.map(label=>Number(row[t.columns.indexOf(v)]===label))))),emphasisColumns:categories.map(label=>v+'_'+label)},summary:'The encoded column becomes one integer indicator per category, sorted by category label. Other columns remain.'};
});
define('W28','Numeric column to standardise',['price','rating'],()=>basic('price','rating'),(t,v)=>{
  const values=column(t,v), average=mean(values), sd=standardDeviation(values,0);
  return {code:`from sklearn.preprocessing import StandardScaler\n\nscaler = StandardScaler()\nscaler.fit_transform(df[[${py(v)}]])`,result:{...frame([v],values.map(value=>[(value-average)/sd])),kind:'array'},summary:`Subtract mean ${format(average)} and divide by population SD ${format(sd)}. The array preserves row order.`};
});
define('W29','Measurement to screen',['price','rating'],()=>frame(['price','rating'],[[10,20],[11,3],[12,4],[13,5],[14,6],[40,7]]),(t,v)=>{
  const values=column(t,v), q1=quantile(values,.25), q3=quantile(values,.75), spread=q3-q1, lower=q1-1.5*spread, upper=q3+1.5*spread;
  return {code:`q1 = df[${py(v)}].quantile(0.25)\nq3 = df[${py(v)}].quantile(0.75)\niqr = q3 - q1\nlower = q1 - 1.5 * iqr\nupper = q3 + 1.5 * iqr\ndf["needs_review"] = (df[${py(v)}] < lower) | (df[${py(v)}] > upper)\ndf`,result:addColumn(t,'needs_review',values.map(value=>value<lower||value>upper)),summary:`Q1=${format(q1)}, Q3=${format(q3)}; flag outside [${format(lower)}, ${format(upper)}]. Flags retain every original measurement.`};
});
define('W30','Multiply each price by',[1.1,1.2,1.5],()=>basic('candy','price'),(t,v)=>({code:`df["adjusted"] = (df["price"] * ${v}).round(2)\ndf`,result:addColumn(t,'adjusted',column(t,'price').map(value=>Math.round((value*Number(v)+Number.EPSILON)*100)/100)),summary:`Multiply every price by ${v}, then round to two decimal places.`}));

function format(value) {
  if (value === null) return 'NaN';
  if (typeof value === 'boolean') return value?'True':'False';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
  return String(value);
}
function evaluate(id, value) {
  const specification=specs[id];
  if (!specification) return null;
  const choice=value === undefined ? specification.choices[0][0] : String(value);
  if (!specification.choices.some(option=>option[0]===choice)) throw new Error('Unknown operation choice: '+id+'/'+choice);
  const input=specification.input(), outcome=specification.operation(input,choice);
  return {id, choice, label:specification.label, choices:clone(specification.choices), inputs:input.inputs||[input], ...outcome, note:specification.note||''};
}
function pythonSetup(id, value) {
  const example=evaluate(id,value);
  if (!example) return '';
  return 'import pandas as pd\n\n'+example.inputs.map(input=>{
    const data='{'+input.columns.map((name,i)=>py(name)+': '+py(input.rows.map(row=>row[i]))).join(', ')+'}';
    return input.name+' = pd.DataFrame('+data+', index='+py(input.index)+')';
  }).join('\n');
}
function identifierContext(example) {
  const columns=unique([...example.inputs.flatMap(input=>input.columns),...(example.result.columns||[])]);
  return {columns,variables:unique([...example.inputs.map(input=>input.name),example.result.name||'df','df','clean','means','filtered','scaler','q1','q3','iqr','lower','upper'])};
}
function proseMarkup(text, example) {
  const context=identifierContext(example);
  // These words are ordinary English in some summaries. A column's mere
  // existence must not turn "a missing value" or "the mean" into code.
  const ordinary=new Set(['mean','count','date','value','label','labels','size','index','reading','group','first','second','lower','upper']);
  const marked=String(text).replace(/\b[A-Za-z_]\w*\b/g,name=>{
    if (ordinary.has(name)) return name;
    const role=context.variables.includes(name)?'variable':context.columns.includes(name)?'column':'';
    return role?'[['+role+':'+name+']]':name;
  });
  if (root.CodeIdentifiers?.format) return root.CodeIdentifiers.format(marked,context);
  return esc(marked).replace(/\[\[(column|variable):([A-Za-z_]\w*)\]\]/g,'<code class="code-identifier" data-code-role="$1">$2</code>');
}
function tableMarkup(table, label, input=null) {
  const output=Boolean(input), changedHeader=name=>output&&!input.columns.includes(name), changedCell=(i,j)=>{
    if (!output) return false;
    const rowIndex=table.sourceRows?.[i]??input.index.indexOf(table.index[i]), columnIndex=input.columns.indexOf(table.columns[j]);
    if (columnIndex<0) return Boolean(table.emphasisColumns?.includes(table.columns[j]));
    return rowIndex>=0&&input.rows[rowIndex][columnIndex]!==table.rows[i][j];
  };
  const caption=label.startsWith('Source ')?'Source <code data-code-role="variable">'+esc(table.name)+'</code>':label==='Computed means Series'?'Computed <code data-code-role="variable">means</code> Series':esc(label);
  return '<div class="operation-table-scroll" tabindex="0" role="region" aria-label="'+esc(label)+'; scroll table if needed"><table class="teaching-example-output operation-table" data-code-table="teaching"><caption>'+caption+'</caption><thead><tr><th scope="col">'+(table.indexName?'<code data-code-role="column">'+esc(table.indexName)+'</code>':'row')+'</th>'+table.columns.map(name=>'<th scope="col"'+(changedHeader(name)?' class="operation-changed"':'')+'><code data-code-role="column">'+esc(name)+'</code></th>').join('')+'</tr></thead><tbody>'+table.rows.map((row,i)=>'<tr><th scope="row">'+esc(table.index[i])+'</th>'+row.map((value,j)=>'<td'+(changedCell(i,j)?' class="operation-changed"':'')+'>'+esc(typeof value==='string'&&(value.trim()!==value||/^[-+]?\d+(\.\d+)?$/.test(value))?JSON.stringify(value):value===null?(table.missingValue||'NaN'):format(value))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function outputMarkup(example) {
  const result=example.result;
  if (result.kind==='scalar') return '<div class="operation-scalar"><span>Result</span><output>'+esc(format(result.value))+'</output></div>';
  if (result.kind==='list') return '<div class="operation-list-result">'+(example.intermediate?tableMarkup(example.intermediate,'Computed means Series'):'')+'<div class="operation-scalar"><span>Result</span><output><code>'+esc(py(result.values))+'</code></output></div></div>';
  return tableMarkup(result,result.kind==='array'?'Result array':'Result',example.inputs[0]);
}
function resultMarkup(example) {
  return '<pre class="operation-code"><code>'+esc(example.code)+'</code></pre><div class="operation-tables"><div class="operation-inputs">'+example.inputs.map(input=>tableMarkup(input,'Source '+input.name)).join('')+'</div><span class="operation-arrow" role="img" aria-label="produces">&rarr;</span>'+outputMarkup(example)+'</div><p class="operation-summary">'+proseMarkup(example.summary,example)+'</p>';
}
function model(curriculum, lesson, round) {
  if (!lesson||lesson.review||round!==lesson.rounds?.[0]||!specs[lesson.id]) return null;
  return evaluate(lesson.id);
}
function render(curriculum, lesson, round) {
  const example=model(curriculum,lesson,round);
  if (!example) return '';
  return '<section class="teaching-explorer operation-explorer" data-operation-explorer="'+esc(example.id)+'" data-code-context="teaching" aria-label="Interactive '+esc(lesson.title)+' example"><p class="operation-example-label">Illustrative data</p><label class="teaching-visual-controls">'+esc(example.label)+' <select data-operation-choice>'+example.choices.map(([value,label],i)=>'<option value="'+esc(value)+'"'+(i===0?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>'+(example.note?'<p class="operation-note">'+proseMarkup(example.note,example)+'</p>':'')+'<div class="operation-result" aria-live="polite" aria-atomic="true">'+resultMarkup(example)+'</div></section>';
}
const mounted = new WeakSet();
function mount(container=root.document) {
  if (!container||mounted.has(container)) return;
  mounted.add(container);
  container.addEventListener('change',event=>{
    const control=event.target.closest?.('[data-operation-choice]'), section=control?.closest('[data-operation-explorer]');
    if (!section) return;
    const example=evaluate(section.dataset.operationExplorer,control.value), result=section.querySelector('.operation-result');
    result.innerHTML=resultMarkup(example);
    root.FoundationLearning?.highlightContent?.(result,identifierContext(example));
  });
}
const api={render,mount,model,evaluate,pythonSetup,ids:Object.freeze(Object.keys(specs))};
root.FoundationOperationVisuals=api;
if (typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
