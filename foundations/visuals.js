/* Small, deterministic teaching sketches built from shared table/chart primitives.
   Values illustrate the operation; they are not the exercise's answer. */
(function(root){
'use strict';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=(x,y,w,h,c='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`;
const path=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const text=(x,y,s,c='')=>`<text x="${x}" y="${y}" class="${c}">${esc(s)}</text>`;
const dot=(x,y,r=3,c='visual-fill')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const axes=(x=28,y=19,w=202,h=59)=>path(`M${x} ${y}v${h}h${w}`);
const arrow=(x=115,y=43)=>path(`M${x} ${y}h25m-5-4 5 4-5 4`);
const caption=s=>text(130,100,s,'visual-caption');
function table(x,y,w,headers,rows,select=()=>false){
 const cw=w/headers.length,rh=14;
 return headers.map((h,j)=>rect(x+j*cw,y,cw,rh,'visual-wash')+text(x+j*cw+3,y+10,h)).join('')+rows.map((row,i)=>row.map((v,j)=>rect(x+j*cw,y+(i+1)*rh,cw,rh,select(i,j)?'visual-selected':'visual-cell')+text(x+j*cw+3,y+(i+2)*rh-4,v)).join('')).join('');
}
const pair=(a,b,c,d,select)=>table(5,15,105,a,b)+arrow()+table(150,15,105,c,d,select);
const points=[[42,65],[68,47],[96,56],[122,34],[148,42],[176,23],[206,30]];
const pointCloud=(encoded=false)=>points.map(([x,y],i)=>{const r=encoded?2+i*.45:3;return encoded&&i%2?rect(x-r,y-r,2*r,2*r,'visual-secondary'):dot(x,y,r);}).join('');
function bars(values,{labels=['A','B','C'],kind='count',zero=true}={}){
 const max=Math.max(...values),height=v=>v/max*48;
 return axes()+text(30,11,kind)+ (zero?text(16,81,'0'):'')+values.map((v,i)=>rect(51+i*63,78-height(v),32,height(v),'visual-fill')+text(57+i*63,73-height(v),v)+text(61+i*63,89,labels[i])).join('');
}
function matrix(values,{names=['x','y','z'],columns=names,correlation=false}={}){
 const cw=48,rh=19,x=70,y=18;
 let art=columns.map((n,j)=>text(x+j*cw+19,11,n)).join('');
 values.forEach((row,i)=>{art+=text(43,y+i*rh+13,names[i]);row.forEach((v,j)=>{const weight=Math.round(Math.abs(v)/(correlation?1:Math.max(...values.flat()))*55);art+=`<rect x="${x+j*cw}" y="${y+i*rh}" width="${cw}" height="${rh}" style="fill:color-mix(in srgb,var(${v<0?'--coral':'--lesson-accent'}) ${weight}%,var(--panel))"/>`+text(x+j*cw+12,y+i*rh+13,correlation?Number(v).toFixed(1):v);});});return art;
}
const scene={};
function define(id,family,label,draw){scene[id]={type:family,label,draw};}
function transform(id,label,a,b,c,d,extra=''){define(id,'table-transform',label,()=>pair(a,b,c,d)+extra);}
// Inspect: distinct selection, summaries, frequencies and matrix meanings.
transform('construct','named lists → rows and columns',['data'],[['name: [A,B]'],['price: [2,4]']],['name','price'],[['A',2],['B',4]]);
transform('csv','CSV text → DataFrame',['tiny.csv'],[['name,price'],['A,2'],['B,4']],['name','price'],[['A',2],['B',4]]);
const sample=[['A',2,8],['B',4,6],['C',3,9]];
function selection(id,label,heads,rows,sel,extra=''){define(id,'table',label,()=>table(18,13,224,heads,rows,sel)+extra);}
selection('head','head(2): first two complete rows',['name','price','score'],sample,i=>i<2);
selection('shape','shape → (3 rows, 3 columns)',['name','price','score'],sample,()=>false);
selection('labels','columns → name, price, score',['name','price','score'],sample,()=>false,path('M19 11h222','visual-bold'));
transform('dtypes','inspect each column’s data type',['name','price'],[['A',2],['B',4]],['column','dtype'],[['name','object'],['price','int64']]);
selection('series','one selected column → Series',['name','price','score'],sample,(_,j)=>j===1);
transform('columns','select two columns in a chosen order',['name','price','score'],sample,['score','price'],[[8,2],[6,4],[9,3]]);
selection('iloc','iloc[:2, :2]: positions 0 and 1',['pos','name','price'],[[0,'A',2],[1,'B',4],[2,'C',3]],(i,j)=>i<2&&j>0);
selection('loc','loc: labels B–D, only price',['label','name','price'],[['A','Milo',2],['B','Luna',4],['C','Rex',3],['D','Pip',5]],(i,j)=>i>0&&j===2);
transform('filter','price > 2: keep matching rows',['row','price'],[['A',2],['B',4],['C',3]],['row','price'],[['B',4],['C',3]]);
selection('and','keep only rows passing BOTH tests',['price>2','fruity?','keep'],[['no','yes','no'],['yes','no','no'],['yes','yes','yes']],i=>i===2);
transform('sort','sort values: highest first',['row','rating'],[['A',8],['B',6],['C',9]],['row','rating'],[['C',9],['A',8],['B',6]]);
transform('largest','largest 2: order AND limit rows',['row','price'],[['A',2],['B',4],['C',3]],['row','price'],[['B',4],['C',3]]);
transform('unique','3 observations, 2 distinct categories',['value'],[['A'],['A'],['B']],['unique','nunique'],[['A',2],['B','']]);
transform('frequency','category counts → proportions',['value'],[['A'],['A'],['B']],['value','share'],[['A','2/3'],['B','1/3']]);
transform('missing','count missing cells per column',['price','tip'],[[2,'NaN'],['NaN',1],[4,'NaN']],['column','missing'],[['price',1],['tip',2]]);
selection('duplicates','one EXTRA duplicate; keep all rows',['name','price','extra?'],[['A',2,'no'],['B',4,'no'],['A',2,'yes']],i=>i===2);
selection('describe','describe: summaries across columns',['stat','price','qty'],[['count',3,3],['mean',4,2],['min',2,1],['max',6,3]],()=>false);
transform('summary','one column → specific numerical answers',['price'],[[2],[4],[6]],['method','result'],[['mean',4],['sum',12],['q75',5]]);
transform('group-mean','collapse each group to its mean',['group','value'],[['A',2],['A',4],['B',8]],['group','mean'],[['A',3],['B',8]]);
define('crosstab','matrix','crosstab: counts for category pairs',()=>matrix([[2,1],[0,3]],{names:['A','B'],columns:['X','Y']}));
define('correlation','matrix','correlation: symmetric, from −1 to 1',()=>matrix([[1,.5,-.5],[.5,1,0],[-.5,0,1]],{correlation:true}));
// Wrangle: show the actual transformation, with conserved rows/values where appropriate.
transform('copy','edit clean; original df stays unchanged',['df','price'],[['A',2],['B',4]],['clean','price'],[['A',4],['B',8]],text(11,82,'df: 2, 4 unchanged'));
transform('rename','new column name, same values',['price'],[[2],[4]],['amount'],[[2],[4]]);
transform('reorder','same columns, different order',['name','price','score'],sample,['name','score','price'],[['A',8,2],['B',6,4],['C',9,3]]);
transform('drop-column','drop one column, keep every row',['name','price','shelf'],[['A',2,'X'],['B',4,'Y']],['name','price'],[['A',2],['B',4]]);
transform('filter-category','keep only the requested category',['name','type'],[['A','fruit'],['B','mint'],['C','fruit']],['name','type'],[['A','fruit'],['C','fruit']]);
transform('reset-index','sort values, then reset row labels',['index','price'],[[0,4],[1,2],[2,3]],['index','price'],[[0,2],[1,3],[2,4]]);
selection('numeric-column','doubled = price × 2, on each row',['price','doubled'],[[2,4],[4,8],[3,6]],(_,j)=>j===1);
selection('conditional','where(price > 3): high or low',['price','>3?','band'],[[2,'no','low'],[4,'yes','high'],[3,'no','low']],(_,j)=>j===2);
transform('recode','replace category labels; keep others',['type'],[['fruity'],['mint'],['fruity']],['type'],[['Featured'],['mint'],['Featured']]);
transform('clean-text','strip whitespace, standardise case',['raw'],[['" TEA "'],['"Latte "']],['clean'],[['"tea"'],['"latte"']]);
transform('replace-text','literal replacement inside each string',['raw'],[['food-kit'],['toy-pack']],['clean'],[['food kit'],['toy pack']]);
transform('search-text','contains “a”: select matching text',['name'],[['Mint'],['Apple'],['Pear']],['name'],[['Apple'],['Pear']]);
transform('to-numeric','numeric text → numbers; invalid → NaN',['text'],[['"2.5"'],['"bad"'],['"4"']],['number'],[[2.5],['NaN'],[4]]);
transform('astype','same labels, explicit category dtype',['object'],[['A'],['B'],['A']],['category'],[['A'],['B'],['A']]);
transform('parse-date','text → datetime; invalid → NaT',['text'],[['2026-06-01'],['not a date']],['datetime'],[['2026-06-01'],['NaT']]);
transform('date-parts','extract calendar fields from dates',['date'],[['2026-06-01'],['2026-07-03']],['year','month','day'],[[2026,6,'Mon'],[2026,7,'Fri']]);
transform('drop-missing','drop rows missing the required value',['row','price'],[['A',2],['B','NaN'],['C',4]],['row','price'],[['A',2],['C',4]]);
transform('fill-missing','fill only the gap with median 3',['row','price'],[['A',2],['B','NaN'],['C',4]],['row','price'],[['A',2],['B',3],['C',4]]);
transform('deduplicate','remove extra copies, keep first row',['name','price'],[['A',2],['B',4],['A',2]],['name','price'],[['A',2],['B',4]]);
transform('aggregate','one row per group, multiple summaries',['group','value'],[['A',2],['A',4],['B',8]],['group','mean','n'],[['A',3,2],['B',8,1]]);
selection('broadcast','group means aligned to original rows',['group','value','mean'],[['A',2,3],['A',4,3],['B',8,8]],(_,j)=>j===2);
transform('pivot-mean','pivot_table: aggregate repeated pairs',['grp','col','val'],[['A','X',2],['A','X',4],['A','Y',8]],['grp','X','Y'],[['A',3,8]]);
transform('melt','wide → long: preserve all four values',['id','x','y'],[['A',2,4],['B',3,5]],['id','var','val'],[['A','x',2],['B','x',3],['A','y',4],['B','y',5]]);
transform('pivot','long → wide: unique id/variable pairs',['id','var','val'],[['A','x',2],['A','y',4],['B','x',3]],['id','x','y'],[['A',2,4],['B',3,'NaN']]);
transform('merge','left join: keep unmatched rows too',['key','value'],[['A',2],['B',4]],['key','val','tag'],[['A',2,'yes'],['B',4,'NaN']],text(13,82,'lookup: A → yes'));
transform('inner-merge','inner join: keep only matching keys',['key','value'],[['A',2],['B',4]],['key','val','tag'],[['A',2,'yes']],text(13,82,'lookup: A → yes'));
define('concat','table-transform','concat: append rows from both tables',()=>table(5,3,91,['first'],[[2],[4]])+text(44,56,'+')+table(5,62,91,['second'],[[6]])+arrow()+table(150,15,105,['index','value'],[[0,2],[1,4],[2,6]]));
selection('bins','cut: (0,3] → low; (3,6] → high',['value','interval','bin'],[[2,'(0,3]','low'],[3,'(0,3]','low'],[5,'(3,6]','high']],(_,j)=>j===2);
transform('one-hot','one indicator column per category',['label'],[['A'],['B'],['A']],['A','B'],[[1,0],[0,1],[1,0]]);
transform('standardise','subtract mean, divide by standard deviation',['value'],[[2],[4],[6]],['z-score'],[['−1.225'],[0],[1.225]]);
transform('minmax','min → 0, max → 1, preserve order',['value'],[[2],[4],[6]],['scaled'],[[0],[.5],[1]]);
define('iqr','distribution','flag outside fences; do not delete',()=>path('M20 54h218')+path('M62.5 28v48M112.5 28v48','visual-dashed')+rect(81.25,40,12.5,28,'visual-wash')+path('M87.5 40v28')+[10,11,12,13,14].map(v=>dot(25+v*5,54,2)).join('')+dot(225,54,4)+text(192,36,'40: flag')+text(48,22,'7.5')+text(106,22,'17.5')+text(40,85,'10, 11, 12, 13, 14, 40'));
transform('vectorise','one expression, applied to every row',['price'],[[2],[4],[6]],['× 1.1'],[[2.2],[4.4],[6.6]]);
transform('membership','isin: keep values in a named set',['drink'],[['Tea'],['Cocoa'],['Latte']],['Tea / Latte'],[['Tea'],['Latte']]);
transform('between','between 2 and 5: include both endpoints',['age'],[[1],[2],[5],[7]],['2 ≤ age ≤ 5'],[[2],[5]]);
transform('sort-ascending','sort values: smallest first',['row','value'],[['A',4],['B',2],['C',3]],['row','value'],[['B',2],['C',3],['A',4]]);
transform('sort-multiple','group alphabetically, then age descending',['type','age'],[['Dog',3],['Cat',2],['Cat',5]],['type','age'],[['Cat',5],['Cat',2],['Dog',3]]);
transform('missing-category','include missing values in category counts',['label'],[['A'],['NaN'],['A']],['label','count'],[['A',2],['NaN',1]]);
transform('missing-percent','missing count ÷ row count × 100',['price','tip'],[[2,'NaN'],['NaN',1],[4,'NaN'],[3,2]],['column','%'],[['price',25],['tip',50]]);
transform('sum','sum: one number from a numeric column',['value'],[[2],[4],[6]],['sum'],[[12]]);
transform('median','median: middle value after sorting',['value'],[[6],[2],[4]],['median'],[[4]]);
// Visualise: label the visual encoding, not just a generic chart silhouette.
define('canvas','figure','Figure contains the plotting Axes',()=>rect(10,3,240,84)+text(17,15,'Figure')+axes(44,25,177,48)+text(111,49,'Axes'));
define('chart-labels','figure','finish title, x label and y label',()=>axes(41,23,189,50)+pointCloud()+text(105,12,'Chart title')+text(117,89,'x label')+`<text x="12" y="58" transform="rotate(-90 12 58)">y label</text>`);
define('encoding','relationship','position + colour + shape + size',()=>axes()+pointCloud(true)+text(35,11,'x / y')+dot(161,10,3)+text(168,13,'A')+rect(192,7,6,6,'visual-secondary')+text(205,13,'B'));
define('histogram','bars','adjacent bins count numeric observations',()=>axes()+text(30,11,'Count')+[2,4,6,3].map((v,i)=>rect(42+i*43,78-v*8,43,v*8,'visual-fill')+text(52+i*43,89,i*2)).join('')+text(216,89,'8'));
define('density','distribution','curve height = estimated density',()=>axes()+text(30,11,'Density')+path('M30 77C57 77 65 24 104 24S150 74 228 77','visual-bold'));
define('ecdf','distribution','ECDF: fraction at or below x',()=>axes()+text(16,81,'0')+text(16,22,'1')+path('M29 78h34V63h42V49h42V34h42V19h40','visual-bold'));
define('rug','distribution','rug: one tick for each observation',()=>axes()+[2,4,3,2].map((v,i)=>rect(42+i*43,78-v*9,43,v*9,'visual-wash')).join('')+[47,68,91,101,114,126,133,146,155,176,198].map(x=>path(`M${x} 68v12`,'visual-bold')).join(''));
define('count-bars','bars','bar height = number of rows',()=>bars([4,2,3],{kind:'Count'}));
define('mean-bars','bars','bar height = group average',()=>bars([2,4,3],{kind:'Mean value'}));
define('point-interval','distribution','dot = mean; interval = ±1 SD',()=>axes()+[69,130,191].map((x,i)=>{const y=[49,35,44][i];return path(`M${x} ${y-13}v26m-5 0h10m-10-26h10`)+dot(x,y,4)+text(x-3,89,['A','B','C'][i]);}).join(''));
define('boxplot','distribution','box: Q1–Q3; line: median; dot: outlier',()=>axes()+path('M52 46h118M52 37v18M170 37v18')+rect(80,32,40,28,'visual-wash')+path('M100 32v28','visual-bold')+dot(216,46)+text(75,27,'Q1')+text(117,27,'Q3'));
define('violin','distribution','width shows density along the value axis',()=>axes()+path('M95 22C98 30 122 36 116 51S101 64 95 75C89 64 74 66 74 51S92 30 95 22Z','visual-wash')+path('M173 24C189 36 191 41 180 50S176 67 173 75C170 67 160 61 164 50S157 36 173 24Z','visual-wash')+text(92,89,'A')+text(170,89,'B'));
function rawPoints(swarm){
 const yy=[30,40,40,40,51,60,69], offsets=swarm?[0,-7,0,7,0,0,0]:[-5,-2,1,3,5,-4,1];
 return axes()+[85,175].map((x,j)=>yy.map((y,i)=>dot(x+offsets[i],y+(j?4:0),3)).join('')+text(x-3,89,j?'B':'A')).join('');
}
define('strip','distribution','jitter separates points; overlap can remain',()=>rawPoints(false));
define('swarm','distribution','swarm packs equal values without overlap',()=>rawPoints(true));
define('boxen','distribution','nested quantile bands expose the tails',()=>axes()+rect(117,22,22,52,'visual-wash')+rect(103,30,50,36,'visual-wash')+rect(87,40,82,17,'visual-wash')+path('M87 49h82','visual-bold')+dot(128,16,2));
define('scatter','relationship','one point per pair of numeric values',()=>axes()+pointCloud()+text(30,11,'y')+text(229,89,'x'));
define('scatter-dimensions','relationship','group = shape/colour; magnitude = size',()=>axes()+pointCloud(true)+dot(165,10,2)+dot(184,10,4)+dot(208,10,6));
define('line','relationship','connect observations in time order',()=>axes()+path('M42 65L95 48L148 55L206 25','visual-bold')+[[42,65],[95,48],[148,55],[206,25]].map(([x,y],i)=>dot(x,y)+text(x-3,89,i+1)).join('')+text(190,11,'Day'));
define('line-band','relationship','line = mean; band = ±1 SD at each x',()=>axes()+path('M42 48L95 34L148 39L206 16L206 36L148 65L95 60L42 74Z','visual-wash')+path('M42 61L95 47L148 52L206 26','visual-bold')+[[42,61],[95,47],[148,52],[206,26]].map(([x,y])=>dot(x,y)).join(''));
define('regression','relationship','straight fitted trend, with observed points',()=>axes()+pointCloud()+path('M35 68L218 20','visual-bold'));
define('residual','relationship','residual = observed minus fitted; zero line',()=>axes()+text(16,49,'0')+path('M28 46h202','visual-dashed')+points.map(([x],i)=>dot(x,[37,57,29,46,62,34,52][i])).join(''));
define('correlation-heatmap','matrix','signed correlations; diagonal always 1',()=>matrix([[1,.5,-.5],[.5,1,0],[-.5,0,1]],{correlation:true}));
define('count-heatmap','matrix','annotated counts for category pairs',()=>matrix([[2,1,0],[0,3,2]],{names:['A','B'],columns:['X','Y','Z']}));
define('subplots','panels','one Figure, two different chart types',()=>rect(6,3,248,85)+text(22,16,'Distribution')+text(151,16,'Relationship')+axes(19,25,100,51)+axes(148,25,94,51)+[22,39,30,16].map((h,i)=>rect(27+i*21,76-h,21,h,'visual-fill')).join('')+[[158,63],[178,48],[196,56],[215,32]].map(([x,y])=>dot(x,y)).join(''));
define('legend','relationship','legend maps category to colour AND shape',()=>axes(25,20,135,58)+points.map(([x,y],i)=>i%2?rect(22+(x-28)*.6-3,y-3,6,6,'visual-secondary'):dot(22+(x-28)*.6,y,3)).join('')+rect(174,17,77,54)+text(181,29,'Category')+dot(186,42)+text(197,45,'A')+rect(183,54,6,6,'visual-secondary')+text(197,61,'B'));
define('log-scale','relationship','equal x spacing = equal ratios on log scale',()=>axes()+text(16,81,'0')+[[45,1],[128,10],[211,100]].map(([x,n])=>path(`M${x} 78v4`)+text(x-5,91,n)).join('')+dot(45,60)+dot(128,42)+dot(211,23)+text(80,12,'log x; y starts at 0'));
define('references','relationship','vertical AND horizontal median benchmarks',()=>axes()+pointCloud()+path('M122 19v59M28 42h202','visual-dashed')+text(134,15,'median x')+text(157,57,'median y'));
define('annotation','relationship','arrow identifies the highest observation',()=>axes()+pointCloud()+text(188,13,'Peak')+path('M192 16L177 23m2-5-2 5 6-1','visual-bold'));
define('exact-bars','bars','precomputed totals → exact bar heights',()=>bars([6,9,3],{kind:'Total (sum)'}));
define('stacked','bars','each total is the sum of both components',()=>axes()+text(15,81,'0')+[2,3,1].map((v,i)=>rect(50+i*63,78-v*9,31,v*9,'visual-fill')+rect(50+i*63,78-(v+2)*9,31,18,'visual-hatch')+text(57+i*63,89,['A','B','C'][i])).join('')+rect(53,3,8,8,'visual-fill')+text(66,11,'part 1')+rect(144,3,8,8,'visual-hatch')+text(157,11,'part 2'));
define('pair-grid','panels','diagonal: distributions; off-diagonal: pairs',()=>{
 const values=[[1,2,3,4,5],[2,4,3,6,5]],binCounts=[[],[]];
 for(let a=0;a<2;a++)for(let k=0;k<3;k++)binCounts[a][k]=values[a].filter(v=>Math.min(2,Math.floor((v-Math.min(...values[a]))/(Math.max(...values[a])-Math.min(...values[a]))*3))===k).length;
 let art='';for(let col=0;col<2;col++)for(let row=0;row<2;row++){
  const x=47+col*91,y=5+row*43;art+=axes(x,y,77,34);
  if(col===row)art+=binCounts[col].map((n,k)=>rect(x+7+k*21,y+34-n*10,21,n*10,'visual-fill')).join('');
  else art+=values[0].map((_,k)=>dot(x+8+(values[col][k]-Math.min(...values[col]))*14,y+30-(values[row][k]-Math.min(...values[row]))*6,2)).join('');
 }return art+text(28,25,'x')+text(28,68,'y')+text(81,91,'x')+text(170,91,'y');
});
define('joint-grid','panels','scatter plus matching x/y marginal counts',()=>{
 const ps=[[48,73],[78,55],[108,73],[138,37],[168,55]];
 return axes(30,34,153,51)+axes(30,3,153,22)+axes(194,34,40,51)+ps.map(([x,y])=>dot(x,y)).join('')+[[1,30],[1,60],[1,90],[1,120],[1,150]].map(([n,x])=>rect(x,25-n*13,30,n*13,'visual-fill')).join('')+[[1,34],[2,52],[2,70]].map(([n,y])=>rect(194,y,n*16,16,'visual-fill')).join('');
});
function facets(kind){return [20,145].map((x,j)=>text(x+22,12,'group '+(j?'B':'A'))+axes(x,21,95,56)+(kind==='hist'?[2,4,3].map((v,i)=>rect(x+8+i*27,77-v*10,27,v*10,'visual-fill')).join(''):kind==='box'?path(`M${x+46} 28v41m-8 0h16m-16-41h16`)+rect(x+30,40,32,18,'visual-wash')+path(`M${x+30} 48h32`):[[15,40],[34,28],[60,42],[78,15]].map(([a,b])=>dot(x+a,22+b)).join(''))).join('');}
define('facets','panels','same chart and scales, separate subsets',()=>facets('scatter'));
define('facet-box','panels','same box plot, one panel per subset',()=>facets('box'));
define('facet-hist','panels','same histogram bins, one panel per subset',()=>facets('hist'));
define('export','figure','save this Figure as a PNG file',()=>axes(12,15,105,63)+[[26,64],[49,42],[72,53],[98,26]].map(([x,y])=>dot(x,y)).join('')+arrow(127)+rect(171,12,71,69)+text(179,39,'chart.png')+text(184,58,'150 dpi'));
define('choose-chart','panels','relationship / distribution / categories',()=>[8,94,180].map(x=>axes(x,23,71,53)).join('')+[[18,64],[35,43],[59,32]].map(([x,y])=>dot(x,y)).join('')+[22,41,29].map((h,i)=>rect(100+i*21,76-h,21,h,'visual-fill')).join('')+[38,19,28].map((h,i)=>rect(187+i*22,76-h,15,h,'visual-fill')).join('')+text(19,15,'Pairs')+text(104,15,'Spread')+text(189,15,'Counts'));
define('honest-bars','bars','zero baseline; deliberate category order',()=>bars([9,6,3],{kind:'Total, descending'}));
define('ordered-counts','bars','zero baseline; explicit category order',()=>bars([3,5,2],{kind:'Count',labels:['A','B','C']}));
// Checkpoints have their own operations, rather than a generic plot collage.
define('profile','table-transform','inspect without changing the original table',()=>table(6,16,93,['name','value'],[['A',2],['B','NaN']])+arrow()+table(149,5,106,['profile','result'],[['shape','(2,2)'],['columns','2 labels'],['types','2 dtypes'],['missing','0, 1'],['counts','A:1 B:1']]));
define('clean-pipeline','table-transform','copy → deduplicate → clean → sort',()=>table(7,16,92,['raw'],[['" TEA "'],['" TEA "'],['"Mint "']])+arrow()+table(150,16,103,['clean'],[['"mint"'],['"tea"']])+text(11,82,'original stays intact'));
define('report','panels','filter first, then compare three views',()=>scene['choose-chart'].draw().replace('Counts','Summary'));
const mapping={
 I01:'construct',I01CSV:'csv',I02:'head',I03:'shape',I04:'labels',I05:'dtypes',I06:'series',I07:'columns',I08:'iloc',I09:'loc',I10:'filter',I11:'and',I12:'sort',I13:'largest',I14:'unique',I15:'frequency',I16:'missing',I17:'duplicates',I18:'describe',I18S:'summary',I19:'group-mean',I20:'crosstab',I21:'correlation',I22:'profile',
 W01:'copy',W02:'rename',W03:'reorder',W04:'drop-column',W05:'filter-category',W06:'reset-index',W07:'numeric-column',W08:'conditional',W09:'recode',W10:'clean-text',W11:'search-text',W12:'to-numeric',W13:'astype',W14:'parse-date',W15:'date-parts',W16:'drop-missing',W17:'fill-missing',W18:'deduplicate',W19:'aggregate',W20:'broadcast',W21:'pivot-mean',W22:'melt',W23:'pivot',W24:'merge',W25:'concat',W26:'bins',W27:'one-hot',W28:'standardise',W29:'iqr',W30:'vectorise',W31:'clean-pipeline',
 V01:'canvas',V02:'chart-labels',V03:'encoding',V04:'histogram',V05:'density',V06:'ecdf',V07:'rug',V08:'count-bars',V09:'mean-bars',V10:'point-interval',V11:'boxplot',V12:'violin',V13:'strip',V14:'swarm',V15:'strip',V16:'scatter',V17:'scatter-dimensions',V18:'line',V19:'line-band',V20:'regression',V21:'residual',V22:'correlation-heatmap',V23:'count-heatmap',V24:'subplots',V25:'legend',V26:'log-scale',V27:'references',V28:'annotation',V29:'exact-bars',V30:'stacked',V31:'pair-grid',V32:'joint-grid',V33:'facets',V34:'export',V35:'choose-chart',V36:'honest-bars',V37:'report'
};
const overrides={I22:{1:'describe',2:'group-mean'},I10:{1:'membership',2:'between'},I12:{1:'sort-ascending',2:'sort-multiple'},I16:{1:'missing-percent',2:'filter'},I18S:{1:'sum',2:'median'},W10:{1:'replace-text',2:'replace-text'},W24:{1:'inner-merge'},W28:{1:'minmax'},V33:{1:'facet-box',2:'facet-hist'},V35:{0:'scatter',1:'histogram',2:'count-bars'},V36:{1:'mean-bars',2:'mean-bars'}};
function spec(variant){const s=scene[variant];if(!s)throw Error('Unknown concept visual: '+variant);return {type:s.type,variant,label:'Concept sketch: '+s.label};}
function configure(curriculum){
 for(const l of curriculum.lessons.filter(l=>mapping[l.id])){
  l.visual=spec(mapping[l.id]);l.rounds.forEach((r,i)=>r.visual=spec(overrides[l.id]?.[i]||mapping[l.id]));
 }
 for(const l of curriculum.lessons.filter(l=>!mapping[l.id])){
  const concepts=[...new Set(l.rounds.map(r=>r.retrieves))];
  if(!l.review||concepts.some(id=>!mapping[id]))throw Error('Missing visual review: '+l.id);
  l.visual={type:'panels',variant:'review',label:'Concept sketch: '+concepts.map(id=>curriculum.lessons.find(l=>l.id===id).title).join('; '),concepts};
  l.rounds.forEach(r=>{r.visual={...curriculum.lessons.find(l=>l.id===r.retrieves).rounds[2].visual};});
 }
}
function artwork(v){
 if(v.variant==='review'){
  // Two legible thumbnails of skills actually retrieved, with every skill named below.
  return v.concepts.slice(0,2).map((id,i)=>`<g transform="translate(${i*130} 6) scale(.49 .70)">${scene[mapping[id]].draw()}</g>`+text(12+i*130,83,id)).join('')+caption(v.concepts.join(' + '));
 }
 const s=scene[v.variant];if(!s||s.type!==v.type)throw Error('Invalid concept visual: '+v.variant);
 return s.draw()+caption(s.label);
}
function diagram(v){return `<svg class="concept-visual" viewBox="0 0 260 108" role="img" aria-label="${esc(v.label)}" data-visual="${esc(v.variant)}"><title>${esc(v.label)}</title><g>${artwork(v)}</g></svg>`;}
const api={diagram,configure,spec,mapping,scene,types:new Set([...Object.keys(scene),'review']),families:new Set(Object.values(scene).map(s=>s.type))};
if(typeof module!=='undefined')module.exports=api;else root.FoundationVisuals=api;
})(typeof window!=='undefined'?window:globalThis);
