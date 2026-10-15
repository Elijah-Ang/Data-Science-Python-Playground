/* Small, deterministic teaching sketches built from shared table/chart primitives.
   Values illustrate the operation; they are not the exercise's answer. */
(function(root){
'use strict';
if(!root.InlineCode&&typeof module!=='undefined')root.InlineCode=require('./inline-code.js');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=(x,y,w,h,c='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`;
const path=(d,c='')=>`<path d="${d}" class="${c}"/>`;
const text=(x,y,s,c='')=>`<text x="${x}" y="${y}" class="${c}">${esc(s)}</text>`;
const dot=(x,y,r=3,c='visual-fill')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const axes=(x=28,y=19,w=202,h=59)=>path(`M${x} ${y}v${h}h${w}`);
const arrow=(x=115,y=43)=>path(`M${x} ${y}h25m-5-4 5 4-5 4`);
const caption=s=>text(130,100,s,'visual-caption');
function table(x,y,w,headers,rows,select=()=>false){
 const cw=w/headers.length,rh=Math.min(14,(90-y)/(rows.length+1));
 return headers.map((h,j)=>rect(x+j*cw,y,cw,rh,'visual-wash')+text(x+j*cw+3,y+10,h)).join('')+rows.map((row,i)=>row.map((v,j)=>rect(x+j*cw,y+(i+1)*rh,cw,rh,select(i,j)?'visual-selected':'visual-cell')+text(x+j*cw+3,y+(i+2)*rh-4,v)).join('')).join('');
}
const pair=(a,b,c,d,select)=>table(5,15,105,a,b)+arrow()+table(150,15,105,c,d,select);
const points=[[42,65],[68,47],[96,56],[122,34],[148,42],[176,23],[206,30]];
const pointCloud=(encoded=false,size=true)=>points.map(([x,y],i)=>{const r=encoded&&size?2+i*.45:3;return encoded&&i%2?rect(x-r,y-r,2*r,2*r,'visual-secondary'):dot(x,y,r);}).join('');
function bars(values,{labels=['A','B','C'],kind='count',zero=true}={}){
 const max=Math.max(...values),height=v=>v/max*48;
 return axes()+text(30,11,kind)+ (zero?text(16,81,'0'):'')+values.map((v,i)=>rect(51+i*63,78-height(v),32,height(v),'visual-fill')+text(57+i*63,73-height(v),v)+text(61+i*63,89,labels[i])).join('');
}
function matrix(values,{names=['x','y','z'],columns=names,correlation=false,unitMax=null,decimals=null}={}){
 const cw=48,rh=19,x=70,y=18;
 let art=columns.map((n,j)=>text(x+j*cw+19,11,n)).join('');
 values.forEach((row,i)=>{art+=text(43,y+i*rh+13,names[i]);row.forEach((v,j)=>{const weight=Math.round(Math.abs(v)/(unitMax||(correlation?1:Math.max(...values.flat())))*55);art+=`<rect x="${x+j*cw}" y="${y+i*rh}" width="${cw}" height="${rh}" style="fill:color-mix(in srgb,var(${v<0?'--coral':'--lesson-accent'}) ${weight}%,var(--panel))"/>`+text(x+j*cw+12,y+i*rh+13,decimals!==null?Number(v).toFixed(decimals):correlation?Number(v).toFixed(1):v);});});return art;
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
transform('copy','edit clean; original df stays unchanged',['df','price'],[['A',2],['B',4]],['clean','price'],[['A',2],['B',4]],text(11,82,'edit clean; df stays intact'));
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
transform('search-text','contains “a”, ignoring case: select matching text',['name'],[['Mint'],['Apple'],['Pear']],['name'],[['Apple'],['Pear']]);
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
selection('bins','cut with include_lowest: [0,3] low; (3,6] high',['value','interval','bin'],[[2,'[0,3]','low'],[3,'[0,3]','low'],[5,'(3,6]','high']],(_,j)=>j===2);
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
define('encoding','relationship','position = x/y; category = colour',()=>axes()+points.map(([x,y],i)=>dot(x,y,3,i%2?'visual-secondary':'visual-fill')).join('')+text(35,11,'x / y')+dot(161,10,3)+text(168,13,'A')+dot(195,10,3,'visual-secondary')+text(205,13,'B'));
define('numeric-hue','relationship','position = x/y; numeric magnitude = colour',()=>axes()+points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3" style="fill:color-mix(in srgb,var(--lesson-accent) ${25+i*10}%,var(--panel))"/>`).join(''));
define('raw-no-jitter','distribution','one mark per row; no jitter; repeats may overlap',()=>axes()+[85,175].map((x,j)=>[30,40,40,40,51,60,69].map(y=>dot(x,y+(j?4:0),3)).join('')+text(x-3,89,j?'B':'A')).join(''));
define('linear-limits','relationship','linear axes; chosen limits change the displayed window',()=>axes()+pointCloud()+text(125,89,'linear range'));
define('histogram','bars','adjacent bins count numeric observations',()=>axes()+text(30,11,'Count')+[2,4,6,3].map((v,i)=>rect(42+i*43,78-v*8,43,v*8,'visual-fill')+text(52+i*43,89,i*2)).join('')+text(216,89,'8'));
define('density','distribution','curve height = estimated density',()=>axes()+text(30,11,'Density')+path('M30 77C57 77 65 24 104 24S150 74 228 77','visual-bold'));
define('ecdf','distribution','ECDF: fraction at or below x',()=>axes()+text(16,81,'0')+text(16,22,'1')+path('M29 78h34V63h42V49h42V34h42V19h40','visual-bold'));
define('rug','distribution','rug: one tick for each observation',()=>axes()+[2,4,3,2].map((v,i)=>rect(42+i*43,78-v*9,43,v*9,'visual-wash')).join('')+[47,68,91,101,114,126,133,146,155,176,198].map(x=>path(`M${x} 68v12`,'visual-bold')).join(''));
define('count-bars','bars','bar height = number of rows',()=>bars(summaries('count').map(g=>g.value),{kind:'Count'}));
define('mean-bars','bars','bar height = group average',(v={})=>bars(summaries(v.statistic==='median'?'median':'mean').map(g=>g.value),{kind:v.statistic==='median'?'Median value':'Mean value'}));
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
define('scatter-dimensions','relationship','group = shape/colour; magnitude = size',(v={})=>axes()+pointCloud(true,v.sizeEncoding!==false)+(v.sizeEncoding===false?dot(165,10,3)+text(176,13,'A')+rect(198,7,6,6,'visual-secondary')+text(210,13,'B'):dot(165,10,2)+dot(184,10,4)+dot(208,10,6)));
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
define('exact-bars','bars','precomputed values → exact bar heights',(v={})=>bars(v.summaryStatistic?summaries(v.summaryStatistic).map(g=>g.value):[6,9,3],{kind:v.summaryStatistic==='mean'?'Mean value':v.summaryStatistic==='median'?'Median value':'Total (sum)'}));
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
define('honest-bars','bars','zero baseline; preserve the same values and order',()=>bars([9,6,3],{kind:'Mean value'}));
define('ordered-counts','bars','zero baseline; explicit category order',()=>bars([3,5,2],{kind:'Count',labels:['A','B','C']}));
// Checkpoints have their own operations, rather than a generic plot collage.
define('profile','table-transform','column types and missing counts; original unchanged',()=>table(6,16,93,['name','price'],[['A',2],['B','NaN']])+arrow()+table(149,16,106,['field','dtype','miss'],[['name','object',0],['price','float64',1]]));
define('clean-pipeline','table-transform','copy → deduplicate → clean → sort',()=>table(7,16,92,['raw'],[['" TEA "'],['" TEA "'],['"Mint "']])+arrow()+table(150,16,103,['clean'],[['"mint"'],['"tea"']])+text(11,82,'original stays intact'));
define('report','panels','filter first, then compare three views',()=>scene['choose-chart'].draw().replace('Counts','Summary'));
transform('series-labels','index labels and values are different',['label','reading'],[[101,12],[109,4],[103,19]],['index','values'],[['101',12],['109',4],['103',19]]);
define('extreme-label','table','maximum value 19 belongs to label 103',()=>table(15,15,145,['label','reading'],[[101,12],[109,4],[103,19]],i=>i===2)+text(175,38,'idxmax()')+text(184,61,'103'));
transform('summary-order','sort the values; labels move with them',['bench','median'],[['A',10],['B',4],['C',7]],['bench','median'],[['B',4],['C',7],['A',10]]);
transform('aligned-series','join summaries by matching index labels',['label','mean'],[['A',4],['B',9]],['label','mean','n'],[['A',4,2],['B',9,3]]);
// Activity-specific sketches: changed operations must not retain the Follow caption.
selection('tail','tail(2): last two complete rows',['name','price','score'],sample,i=>i>0);
selection('sample','sample(2): seeded rows from across the table',['name','price','score'],sample,i=>i!==1);
selection('row-count','len(df): number of rows = 3',['name','price','score'],sample,()=>false);
selection('index-labels','index → A, B, C; row labels are not columns',['label','price'],[['A',2],['B',4],['C',3]],(_,j)=>j===0);
selection('loc-list','loc: select explicit labels, in requested order',['label','price'],[['D',5],['B',4]],()=>true);
selection('or','keep rows passing EITHER test',['test 1','test 2','keep'],[['no','yes','yes'],['yes','no','yes'],['no','no','no']],i=>i<2);
transform('smallest','smallest 2: order AND limit rows',['row','price'],[['A',2],['B',4],['C',3]],['row','price'],[['A',2],['C',3]]);
selection('minimum-label','minimum value 4 belongs to label 109',['label','reading'],[[101,12],[109,4],[103,19]],i=>i===1);
transform('category-counts','value_counts: rows per category',['value'],[['A'],['A'],['B']],['value','count'],[['A',2],['B',1]]);
selection('all-duplicates','keep=False: flag every member of a duplicate set',['name','price','flag'],[['A',2,'yes'],['B',4,'no'],['A',2,'yes']],i=>i!==1);
transform('group-sum','collapse each group to its total',['group','value'],[['A',2],['A',4],['B',8]],['group','sum'],[['A',6],['B',8]]);
transform('reset-keep-index','reset_index(): retain the former index as a column',['index','price'],[[0,4],[1,2],[2,3]],['new','index','price'],[[0,1,2],[1,2,3],[2,0,4]]);
selection('numeric-sum','total = price + tip, on each row',['price','tip','total'],[[2,1,3],[4,2,6]],(_,j)=>j===2);
selection('months','months = years × 12, on each row',['years','months'],[[2,24],[4,48]],(_,j)=>j===1);
selection('multiple-conditions','select: first matching condition wins',['value','>5?','>3?','band'],[[2,'no','no','low'],[4,'no','yes','middle'],[6,'yes','yes','high']],(_,j)=>j===3);
selection('boolean-column','a Boolean column records whether both tests pass',['Dog?','age≥5?','priority'],[['yes','yes','True'],['yes','no','False'],['no','yes','False']],(_,j)=>j===2);
transform('map-missing','map: unmatched labels become missing',['size'],[['Large'],['Small']],['code'],[[1],['NaN']]);
transform('not-contains','invert contains: keep nonmatching strings',['name'],[['Mint'],['Apple'],['Pear']],['name'],[['Mint']]);
transform('string-type','same values, explicit string dtype',['object'],[['Tea'],['Latte']],['string'],[['Tea'],['Latte']]);
transform('nullable-integer','Int64: integer values can include missing',['value'],[[2],[4],['NaN']],['Int64'],[[2],[4],['<NA>']]);
transform('fill-zero','fill only gaps with the chosen constant 0',['value'],[[2],['NaN'],[4]],['filled'],[[2],[0],[4]]);
transform('deduplicate-last','remove extra copies, retain last occurrence',['row','name'],[[0,'A'],[1,'B'],[2,'A']],['row','name'],[[1,'B'],[2,'A']]);
transform('aggregate-sum','one row per group: total and nonmissing count',['grp','val'],[['A',2],['A',4],['B',8]],['grp','sum','count'],[['A',6,2],['B',8,1]]);
selection('group-centered','centered = value − its group mean',['grp','value','centered'],[['A',2,-1],['A',4,1],['B',8,0]],(_,j)=>j===2);
transform('above-group-mean','compare each row with its own group mean',['grp','value','mean'],[['A',2,3],['A',4,3],['B',8,8]],['grp','value'],[['A',4]]);
transform('pivot-sum','pivot_table: total within each repeated pair',['grp','col','val'],[['A','X',2],['A','X',4],['A','Y',8]],['grp','X','Y'],[['A',6,8]]);
selection('quantile-bins','qcut: quantile boundaries aim for equal group counts',['value','group'],[[1,'lower'],[2,'lower'],[3,'lower'],[8,'upper'],[10,'upper'],[12,'upper']],()=>false);
define('ecdf-complement','distribution','complementary ECDF: fraction above x',()=>axes()+text(16,81,'0')+text(16,22,'1')+path('M29 19h34V34h42V49h42V63h42V78h40','visual-bold'));
define('median-points','distribution','dot = median; no interval',(v={})=>axes()+[69,130,191].map((x,i)=>dot(x,[49,35,44][i],4)+text(x-3,89,['A','B','C'][i])).join(''));
define('proportion-heatmap','matrix','each cell = row proportion; each row sums to 1',()=>matrix([[.67,.33],[.25,.75]],{names:['A','B'],columns:['X','Y'],unitMax:1,decimals:2}));
define('mean-heatmap','matrix','each cell = mean measurement for a category pair',()=>matrix([[2.5,4.5],[6.5,3.5]],{names:['A','B'],columns:['X','Y']}));
define('rate-heatmap','matrix','each cell = fraction meeting the Boolean condition',()=>matrix([[.5,.25],[1,.75]],{names:['A','B'],columns:['X','Y'],unitMax:1,decimals:2}));
define('smallest-annotation','relationship','arrow identifies the smallest x observation',()=>axes()+pointCloud()+path('M78 22L42 65m0-8v8h8','visual-bold')+text(30,16,'Smallest x'));
define('lowest-annotation','relationship','arrow identifies the lowest eligible y observation',()=>axes()+pointCloud()+path('M78 22L42 65m0-8v8h8','visual-bold')+text(30,16,'Lowest y'));
define('reference-mean','relationship','horizontal line = arithmetic mean of y',()=>axes()+pointCloud()+path('M29 '+(points.reduce((sum,p)=>sum+p[1],0)/points.length)+'h201','visual-dashed')+text(133,39,'y mean'));
define('reference-threshold','relationship','horizontal line = chosen y threshold, not a summary',()=>axes()+pointCloud()+path('M29 '+(points.reduce((sum,p)=>sum+p[1],0)/points.length)+'h201','visual-dashed')+text(133,39,'threshold'));
define('reference-vertical','relationship','vertical line = chosen x threshold, not a summary',()=>axes()+pointCloud()+path('M122 19v59','visual-dashed')+text(133,39,'threshold'));
const mapping={
 I06S:'series-labels',I13L:'extreme-label',I19S:'summary-order',I19A:'aligned-series',
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
function sceneLabel(v){
 if(scienceIds.has(v.variant))return scientificPlot(v.variant,v).description;
 if(v.variant==='scatter-dimensions'&&v.sizeEncoding===false)return 'group = shape/colour; constant point size';
 if(v.variant==='mean-bars'&&v.statistic==='median')return 'bar height = group median';
 if(v.variant==='exact-bars'&&v.summaryStatistic)return `precomputed ${v.summaryStatistic} → exact bar heights`;
 return scene[v.variant]?.label||v.label;
}
function artwork(v){
 if(v.variant==='review'){
  // Two legible thumbnails of skills actually retrieved, with every skill named below.
  return v.concepts.slice(0,2).map((id,i)=>`<g transform="translate(${i*130} 6) scale(.49 .70)">${scene[mapping[id]].draw()}</g>`+text(12+i*130,83,id)).join('')+caption(v.concepts.join(' + '));
 }
 const s=scene[v.variant];if(!s||s.type!==v.type)throw Error('Invalid concept visual: '+v.variant);
 return s.draw(v);
}
function diagram(v){const label=v.variant==='review'?v.label:'Concept sketch: '+sceneLabel(v);return `<svg class="concept-visual" viewBox="0 0 260 108" role="img" aria-label="${esc(label)}" data-visual="${esc(v.variant)}"><title>${esc(label)}</title><g>${artwork(v)}</g></svg>`;}
// This separate example is deliberately labelled: these are computed teaching
// marks, never a substitute for the learner's executed Python figure.
const exampleRows=Object.freeze([
 ['r1','A',1,2],['r2','A',2,4],['r3','A',3,6],['r4','B',2,3],
 ['r5','B',4,7],['r6','C',1,1],['r7','C',3,2],['r8','C',5,3],['r9','C',6,18]
].map(([id,group,x,value],i)=>Object.freeze({id,group,x,value,cost:[8,3,7,2,5,1,6,4,9][i],shift:i%2===0?'AM':'PM'})));
// Repeated measurements make the effect of category-direction jitter visible.
// They stay fixed when either the offset or marker size changes.
const rawRows=Object.freeze([['s1','A',2],['s2','A',2],['s3','A',7],['s4','B',3],['s5','B',3],['s6','B',8]].map(([id,group,value])=>Object.freeze({id,group,value})));
const q=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b),at=(sorted.length-1)*p,lo=Math.floor(at);return sorted[lo]+(sorted[Math.ceil(at)]-sorted[lo])*(at-lo);};
const fmt=n=>Number(n.toFixed(2)).toString();
const et=(x,y,s)=>`<text x="${x}" y="${y}" style="font-size:12px">${esc(s)}</text>`;
function plotRows(rows,x=40,y=25,w=435,h=150,selected=''){
 const px=v=>x+v/7*w,py=v=>y+h-v/20*h;
 return axes(x,y,w,h)+[0,2,4,6].map(n=>et(px(n)-3,y+h+17,n)).join('')+[0,10,20].map(n=>et(x-26,py(n)+4,n)).join('')+et(x+w-5,y+h+33,'x')+et(x-28,y-6,'value')+
 rows.map(r=>`<g data-row="${r.id}"><title>${esc(`${r.id}: group ${r.group}, x=${r.x}, value=${r.value}`)}</title>`+dot(px(r.x),py(r.value),r.id===selected?6:4,r.id===selected?'visual-selected':'visual-fill')+'</g>').join('');
}
function summaries(kind){return ['A','B','C'].map(group=>{const rows=exampleRows.filter(r=>r.group===group),values=rows.map(r=>r.value);return {group,rows:rows.map(r=>r.id),value:kind==='count'?rows.length:kind==='sum'?values.reduce((a,b)=>a+b,0):kind==='median'?q(values,.5):values.reduce((a,b)=>a+b,0)/rows.length};});}
function summaryBars(groups,label,max=Math.max(9,...groups.map(g=>g.value))){return axes(65,25,410,145)+et(66,16,label)+et(43,174,'0')+et(39,54,fmt(max))+groups.map((g,i)=>rect(105+i*130,170-g.value/max*120,65,g.value/max*120,'visual-fill')+et(115+i*130,160-g.value/max*120,fmt(g.value))+et(125+i*130,192,g.group)).join('');}
// Quantitative miniature plots share explicit observations and compute every
// summary from them. Scene artwork and the visible evidence table use one model.
const scienceIds=new Set(['density','ecdf','ecdf-complement','rug','point-interval','median-points','boxplot','violin','line','line-band','regression','residual','stacked','stacked-share','stacked-compare','pair-grid','correlation','correlation-heatmap','facet-box','facet-hist','crosstab','count-heatmap','proportion-heatmap','mean-heatmap','rate-heatmap']);
const lineObservations=[[1,2],[2,7],[3,6],[4,10]];
const repeatedObservations=[[1,2],[1,4],[2,3],[2,7],[3,6],[3,8]];
const pairObservations=[[1,2,5],[2,4,3],[3,3,4],[4,6,1],[5,5,2]];
function mean(a){return a.reduce((s,n)=>s+n,0)/a.length;}
function spread(a){const m=mean(a);return Math.sqrt(a.reduce((s,n)=>s+(n-m)**2,0)/(a.length-1));}
function leastSquares(rows){const mx=mean(rows.map(r=>r[0])),my=mean(rows.map(r=>r[1]));const slope=rows.reduce((s,[x,y])=>s+(x-mx)*(y-my),0)/rows.reduce((s,[x])=>s+(x-mx)**2,0);return {slope,intercept:my-slope*mx};}
function kde(values,bw=1){const bandwidth=spread(values)*values.length**(-.2)*bw;return {bandwidth,at:x=>mean(values.map(v=>Math.exp(-.5*((x-v)/bandwidth)**2)))/(bandwidth*Math.sqrt(2*Math.PI))};}
function smallPlot(xlo,xhi,ylo,yhi,xlabel='value',ylabel='count'){
 const px=v=>35+(v-xlo)/(xhi-xlo)*207,py=v=>80-(v-ylo)/(yhi-ylo)*60;
 return {px,py,art:axes(35,20,207,60)+[xlo,xhi].map(v=>text(px(v)-5,92,fmt(v))).join('')+[ylo,yhi].map(v=>text(2,py(v)+3,fmt(v))).join('')+text(182,12,xlabel)+text(36,12,ylabel)};
}
function scientificPlot(id,v={}){
 const observations=v.rows||exampleRows;
 const values=observations.map(r=>r.value);let art='',data={},description=scene[id]?.label||id;
 if(id==='density'){
  const model=kde(values,v.bandwidth||1),curve=Array.from({length:81},(_,i)=>{const x=Math.min(...values)+(Math.max(...values)-Math.min(...values))*i/80;return [x,model.at(x)];});
  // A bandwidth comparison must not silently rescale the density axis.
  const yMax=v.yMax||.2,p=smallPlot(Math.min(...values),Math.max(...values),0,yMax,'value','density');
  art=p.art+path(curve.map(([x,y],i)=>`${i?'L':'M'}${p.px(x)} ${p.py(y)}`).join(''),'visual-bold');data={values,bandwidth:model.bandwidth,bwAdjust:v.bandwidth||1,curve,yDomain:[0,yMax]};description=`Gaussian KDE; bw_adjust=${v.bandwidth||1}; area, not height, represents probability`;
 }else if(id==='ecdf'||id==='ecdf-complement'){
  const complement=id==='ecdf-complement',unique=[...new Set(values)].sort((a,b)=>a-b),p=smallPlot(0,20,0,1,'value',complement?'fraction > x':'fraction ≤ x');
  let d=`M${p.px(0)} ${p.py(complement?1:0)}`;const steps=unique.map(x=>({x,share:values.filter(n=>complement?n>x:n<=x).length/values.length}));
  for(const step of steps)d+=`H${p.px(step.x)}V${p.py(step.share)}`;d+=`H${p.px(20)}`;art=p.art+path(d,'visual-bold');data={values,steps};
 }else if(id==='rug'){
  const edges=[0,4,8,12,16,20],counts=edges.slice(0,-1).map((lo,i)=>values.filter(n=>n>=lo&&(i===4?n<=edges[i+1]:n<edges[i+1])).length),p=smallPlot(0,20,0,6);
  art=p.art+counts.map((n,i)=>rect(p.px(edges[i]),p.py(n),p.px(edges[i+1])-p.px(edges[i]),p.py(0)-p.py(n),'visual-wash')).join('')+values.map(n=>path(`M${p.px(n)} 76v9`,'visual-bold')).join('');data={values,edges,counts};
 }else if(['point-interval','median-points','violin'].includes(id)){
  const groups=[...new Set(observations.map(row=>row.group))].map(group=>{const vals=observations.filter(r=>r.group===group).map(r=>r.value);return {group,values:vals,mean:mean(vals),median:q(vals,.5),sd:spread(vals)};}),center=g=>v.estimator==='median'?g.median:v.estimator==='sum'?g.values.reduce((n,x)=>n+x,0):g.mean,lowest=Math.min(...groups.map(g=>center(g)-g.sd)),yBottom=id==='point-interval'&&lowest < -3?Math.floor(lowest)-1:-3,yTop=v.estimator==='sum'?Math.max(20,...observations.map(row=>row.value))*3:20,p=smallPlot(0,4,yBottom,yTop,'group','value');
  art=axes(35,20,207,60)+text(2,p.py(0)+3,'0')+text(2,p.py(yTop)+3,fmt(yTop))+(yBottom < -3?text(2,p.py(yBottom)+3,fmt(yBottom)):'')+text(36,12,'value');
  for(const [i,g] of groups.entries()){
   const x=p.px(i+1);art+=text(x-3,92,g.group);
   if(id==='violin'){
    const density=kde(g.values),ys=Array.from({length:41},(_,j)=>Math.min(...g.values)+(Math.max(...g.values)-Math.min(...g.values))*j/40),ownPeak=Math.max(...ys.map(density.at)),globalPeak=Math.max(...groups.flatMap(other=>{const fit=kde(other.values);return Array.from({length:41},(_,i)=>fit.at(Math.min(...other.values)+(Math.max(...other.values)-Math.min(...other.values))*i/40));})),peak=v.densityNorm==='width'?ownPeak:v.densityNorm==='count'?ownPeak*Math.max(...groups.map(g=>g.values.length))/g.values.length:globalPeak;
    const side=ys.map(y=>[x+density.at(y)/peak*17,p.py(y)]),other=[...ys].reverse().map(y=>[x-density.at(y)/peak*17,p.py(y)]);
    art+=path([...side,...other].map(([a,b],j)=>`${j?'L':'M'}${a} ${b}`).join('')+'Z','visual-wash')+(v.inner==='quart'?[.25,.5,.75].map(t=>path(`M${x-9} ${p.py(q(g.values,t))}h18`,'visual-dashed')).join(''):g.values.map(y=>dot(x,p.py(y),1.7)).join(''));
   }else if(id==='point-interval'){const center=v.estimator==='median'?g.median:v.estimator==='sum'?g.values.reduce((n,x)=>n+x,0):g.mean;art+=(v.showInterval===false?'':path(`M${x} ${p.py(center-g.sd)}V${p.py(center+g.sd)}m-4 0h8m-8 ${p.py(center-g.sd)-p.py(center+g.sd)}h8`))+dot(x,p.py(center),3);}
   else art+=dot(x,p.py(g.median),3);
  }data={groups,yDomain:[yBottom,yTop]};description=id==='point-interval'?(v.showInterval===false?'Group means; intervals omitted':'Mean and ±1 sample SD, computed within each group'):id==='violin'?(v.inner==='quart'?'Gaussian density within endpoints; lines mark quartiles':'Gaussian density within observed endpoints; dots show every value'):description;
 }else if(id==='boxplot'){
  const q1=q(values,.25),median=q(values,.5),q3=q(values,.75),iqr=q3-q1,fences=[q1-1.5*iqr,q3+1.5*iqr],inside=values.filter(n=>n>=fences[0]&&n<=fences[1]),whiskers=[Math.min(...inside),Math.max(...inside)],outliers=values.filter(n=>n<fences[0]||n>fences[1]),p=smallPlot(0,20,0,1,'value','');
  art=p.art+path(`M${p.px(whiskers[0])} 48H${p.px(whiskers[1])}M${p.px(whiskers[0])} 40v16M${p.px(whiskers[1])} 40v16`)+rect(p.px(q1),34,p.px(q3)-p.px(q1),28,'visual-wash')+path(`M${p.px(median)} 34v28`,'visual-bold')+outliers.map(n=>dot(p.px(n),48,3)).join('');data={values,q1,median,q3,fences,whiskers,outliers};
 }else if(id==='line'||id==='line-band'){
  const band=id==='line-band',rows=band?repeatedObservations:lineObservations,groups=[...new Set(rows.map(r=>r[0]))].map(x=>{const vals=rows.filter(r=>r[0]===x).map(r=>r[1]);return {x,mean:mean(vals),sd:vals.length>1?spread(vals):0};}),p=smallPlot(1,band?3:4,0,11,'day','value');
  art=p.art;if(band&&v.showInterval!==false)art+=path(groups.map((g,i)=>`${i?'L':'M'}${p.px(g.x)} ${p.py(g.mean+g.sd)}`).join('')+[...groups].reverse().map(g=>`L${p.px(g.x)} ${p.py(g.mean-g.sd)}`).join('')+'Z','visual-wash');
  art+=path(groups.map((g,i)=>`${i?'L':'M'}${p.px(g.x)} ${p.py(g.mean)}`).join(''),'visual-bold')+(v.showMarkers===false?'':groups.map(g=>dot(p.px(g.x),p.py(g.mean),2)).join(''));data={rows,groups};description=band?'Mean with ±1 sample SD at each day':'One observation per day; connect in time order';
 }else if(id==='regression'||id==='residual'){
  const rows=id==='residual'?[[1,8],[2,3],[3,2],[4,3],[5,8]]:pairObservations.map(r=>r.slice(0,2)),fit=leastSquares(rows),residuals=rows.map(([x,y])=>[x,y-fit.intercept-fit.slope*x]),resid=id==='residual',p=smallPlot(1,5,resid?-4:0,resid?4:7,'x',resid?'residual':'y');
  art=p.art+path(resid?`M${p.px(1)} ${p.py(0)}H${p.px(5)}`:`M${p.px(1)} ${p.py(fit.intercept+fit.slope)}L${p.px(5)} ${p.py(fit.intercept+5*fit.slope)}`,resid?'visual-dashed':'visual-bold')+(resid?residuals:rows).map(([x,y])=>dot(p.px(x),p.py(y),2.7)).join('');data={rows,fit,residuals};description=resid?'Actual y minus the fitted line, on the same observations':'Least-squares line fitted to the five displayed pairs';
 }else if(id.startsWith('stacked')){
  const first=[2,3,1],second=[3,1,4],totals=first.map((n,i)=>n+second[i]),share=id==='stacked-share',compare=id==='stacked-compare',h=share?100:6;
  art=axes(22,18,compare?105:220,62)+text(4,83,'0')+text(22,12,share?'share (%)':'count');
  for(let i=0;i<3;i++){const a=share?first[i]/totals[i]*100:first[i],b=share?second[i]/totals[i]*100:second[i],x=35+i*(compare?31:70),w=compare?19:38;art+=rect(x,80-a/h*56,w,a/h*56,'visual-fill')+rect(x,80-(a+b)/h*56,w,b/h*56,'visual-hatch')+text(x+3,92,['A','B','C'][i]);}
  if(compare)art+=axes(158,18,89,62)+text(160,12,'part 2')+second.map((n,i)=>rect(167+i*27,80-n/6*56,18,n/6*56,'visual-hatch')+text(170+i*27,92,['A','B','C'][i])).join('');
  data={groups:['A','B','C'],first,second,totals,share};description=share?'Each bar totals 100%; filled = part 1, hatched = part 2':compare?'Composition and the same part 2 on a common zero baseline':'Each total adds part 1 (filled) and part 2 (hatched)';
 }else if(id==='pair-grid'){
  const count=v.variableCount||2,cell=count===3?69:94,names=['x','y','z'];
  for(let r=0;r<count;r++)for(let c=0;c<count;c++){
   if(v.corner&&c>r)continue;
   const x=38+c*cell,y=10+r*(count===3?25:38),w=cell-7,h=count===3?20:32;art+=axes(x,y,w,h);
   if(r===c){const values=pairObservations.map(row=>row[c]),lo=Math.min(...values),hi=Math.max(...values),counts=[0,0,0];for(const value of values)counts[Math.min(2,Math.floor((value-lo)/(hi-lo)*3))]++;art+=counts.map((n,i)=>rect(x+i*w/3,y+h-n/(Math.max(...counts))*h,w/3,n/Math.max(...counts)*h,'visual-fill')).join('');}
   else art+=pairObservations.map(row=>dot(x+(row[c]-1)/5*w,y+h-(row[r]-1)/6*h,1.8)).join('');
   if(c===0)art+=text(22,y+h/2+3,names[r]);if(r===count-1)art+=text(x+w/2,94,names[c]);
  }data={rows:pairObservations.map(row=>row.slice(0,count)),names:names.slice(0,count),corner:!!v.corner};description=v.corner?'Lower-triangle pairs and matching diagonal distributions':'Same observations in every pair; matching diagonal distributions';
 }else if(['crosstab','count-heatmap','proportion-heatmap','mean-heatmap','rate-heatmap'].includes(id)){
  const names=['A','B'],columns=id==='count-heatmap'?['X','Y','Z']:['X','Y'];let inputs;
  if(id==='mean-heatmap')inputs=[['A','X',[2,3]],['A','Y',[4,5]],['B','X',[6,7]],['B','Y',[3,4]]];
  else if(id==='rate-heatmap')inputs=[['A','X',[0,0,1,1]],['A','Y',[0,1,1,1]],['B','X',[0,0,0,0]],['B','Y',[0,0,0,1]]];
  else inputs=id==='count-heatmap'?[['A','X',[1,1]],['A','Y',[1]],['B','Y',[1,1,1]],['B','Z',[1,1]]]:id==='proportion-heatmap'?[['A','X',[1,1]],['A','Y',[1]],['B','X',[1]],['B','Y',[1,1,1]]]:[['A','X',[1,1]],['A','Y',[1]],['B','Y',[1,1,1]]];
  const counts=names.map(name=>columns.map(column=>inputs.find(r=>r[0]===name&&r[1]===column)?.[2].length||0));
  const values=names.map((name,i)=>columns.map((column,j)=>{const raw=inputs.find(r=>r[0]===name&&r[1]===column)?.[2]||[];return id==='mean-heatmap'?mean(raw):id==='rate-heatmap'?raw.filter(v=>v===0).length/raw.length:id==='proportion-heatmap'?counts[i][j]/counts[i].reduce((a,b)=>a+b):counts[i][j];}));
  art=matrix(values,{names,columns,unitMax:['proportion-heatmap','rate-heatmap'].includes(id)?1:null,decimals:['mean-heatmap','proportion-heatmap','rate-heatmap'].includes(id)?2:0});data={inputs,names,columns,values};
 }else if(id==='correlation'||id==='correlation-heatmap'){
  const cols=[0,1,2].map(i=>pairObservations.map(row=>row[i])),values=cols.map(a=>cols.map(b=>a.reduce((s,n,i)=>s+(n-mean(a))*(b[i]-mean(b)),0)/Math.sqrt(a.reduce((s,n)=>s+(n-mean(a))**2,0)*b.reduce((s,n)=>s+(n-mean(b))**2,0))));
  art=matrix(values,{correlation:true,decimals:2});data={rows:pairObservations,columns:['x','y','z'],values};
 }else{
  const groups=['A','B'].map(group=>({group,values:observations.filter(r=>r.group===group).map(r=>r.value)}));
  art=groups.map((g,j)=>{const x=25+j*122,w=90,py=v=>78-v/8*55;let a=text(x+25,12,'group '+g.group)+axes(x,20,w,58);if(id==='facet-hist'){const counts=[0,0,0,0];for(const value of g.values)counts[Math.min(3,Math.floor(value/2))]++;a+=counts.map((n,i)=>rect(x+i*w/4,78-n*18,w/4,n*18,'visual-fill')).join('');}else{const q1=q(g.values,.25),q3=q(g.values,.75),median=q(g.values,.5);a+=path(`M${x+45} ${py(Math.min(...g.values))}V${py(Math.max(...g.values))}`)+rect(x+30,py(q3),30,py(q1)-py(q3),'visual-wash')+path(`M${x+30} ${py(median)}h30`,'visual-bold');}return a+text(x,92,id==='facet-hist'?'0 → 8':'value: 0 → 8');}).join('');data={groups};
 }
 return {art,data,description};
}
for(const id of scienceIds){if(!scene[id])define(id,'bars',id,()=> '');scene[id].draw=v=>scientificPlot(id,v).art;}
function scientificEvidence(v){
 if(!scienceIds.has(v.variant))return '';
 const {data}=scientificPlot(v.variant,v);let heads,rows;
 if(data.inputs){heads=['Group','Column',v.variant==='mean-heatmap'||v.variant==='rate-heatmap'?'Observed values':'Observations'];rows=data.inputs.map(([a,b,values])=>[a,b,v.variant==='mean-heatmap'||v.variant==='rate-heatmap'?values.join(', '):values.length]);}
 else if(data.groups?.[0]?.values){heads=['group','Observed values'];rows=data.groups.map(g=>[g.group,g.values.join(', ')]);}
 else if(data.rows){heads=data.columns||data.names||(v.variant==='line'||v.variant==='line-band'?['day','value']:null)||(data.rows[0].length===3?['x','y','z']:['x','value']);rows=data.rows;}
 else if(data.values&&!Array.isArray(data.values[0])){heads=['Column','Observed values'];rows=[['value',data.values.join(', ')]];}
 else if(data.first){heads=['Group','Part 1','Part 2'];rows=data.groups.map((g,i)=>[g,data.first[i],data.second[i]]);}
 if(!rows)return '';
 return `<table class="teaching-example-output"><caption>Illustrative data</caption><thead><tr>${heads.map(h=>`<th scope="col">${['x','y','z','value','day','group'].includes(h)?`<code data-code-role="column">${esc(h)}</code>`:esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(n=>`<td>${esc(n)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

const explorerSpecs={
 scatter:{label:'Axes',options:[['x:value','x = x, y = value'],['value:x','x = value, y = x'],['cost:value','x = cost, y = value']]},
 encoding:{label:'Category colour',options:[['plain','One colour'],['hue','hue="group"']]},
 'scatter-dimensions':{label:'Category markers',options:[['colour','Colour only'],['shape','Colour + style="group"'],['size','Add size="value"']]},
 density:{label:'Smoothing · bw_adjust',options:[['0.5','0.5 · less smoothing'],['1','1 · default smoothing'],['2','2 · more smoothing']]},
 strip:{label:'Category displacement · jitter',options:[['False','False · exact category position'],['0.15','0.15 · separate repeated values']]},
 swarm:{label:'Fixed marker size',options:[['3','size=3'],['5','size=5'],['7','size=7']]},
 line:{label:'Observation markers',options:[['none','marker=None'],['o','marker="o"']]},
 'line-band':{label:'Spread around each day’s mean',options:[['none','errorbar=None'],['sd','errorbar="sd"']]},
 'point-interval':{label:'Observed spread · errorbar',options:[['none','None · means only'],['sd','"sd" · mean ± one SD']]},
 violin:{label:'Inner marks',options:[['quart','inner="quart" · quartiles'],['point','inner="point" · observations']]},
 stacked:{label:'Upper component starts at',options:[['zero','bottom=0 · components overlap'],['first','bottom=first · stack components']]},
 histogram:{label:'Number of bins',options:[['2','2 bins'],['4','4 bins'],['8','8 bins'],['wide','Edges: 0, 4, 8, 12, 16, 20'],['narrow','Edges: 0, 2, 4, …, 20'],['shifted','Edges: 0, 3, 6, …, 21'],['unequal','Edges: 0, 2, 5, 20']]},
 'count-bars':{label:'Count column',options:[['group','group'],['shift','shift']]},
 'mean-bars':{label:'Height represents',options:[['count','Record count'],['mean','Mean value'],['median','Median value']]},
 'summary-order':{label:'Group summary order',options:[['original','A, B, C'],['ascending','Mean: smallest first'],['descending','Mean: largest first']]},
 boxplot:{label:'Value axis',options:[['x','x · horizontal'],['y','y · vertical']]},
 'log-scale':{label:'x scale',options:[['linear','linear'],['log','log']]},
 'exact-bars':{label:'Calculate bar heights',options:[['mean','mean()'],['sum','sum()'],['median','median()']]},
 references:{label:'Calculated median line',options:[['x','x median'],['value','Value median'],['both','Both medians']]},
 facets:{label:'Panel grouping',options:[['pooled','One panel'],['groups','col="group"']]}
};
function exploration(variant,choice,options={}){
 const spec=explorerSpecs[variant];if(!spec||!spec.options.some(([value])=>value===choice))throw Error('Unknown teaching visual choice');
 let art='',summary='',code='',data;
 if(['density','line','line-band','point-interval','violin'].includes(variant)){
  const settings=variant==='density'?{bandwidth:Number(choice)}:variant==='line'?{showMarkers:choice==='o'}:['point-interval','line-band'].includes(variant)?{showInterval:choice==='sd'}:{inner:choice,densityNorm:'area'};
  const model=scientificPlot(variant,settings);art=`<g transform="translate(0 6) scale(2)">${model.art}</g>`;data={...model.data,choice,count:model.data.rows?.length||exampleRows.length};
  if(variant==='density'){
   summary=`bw_adjust=${choice} controls smoothing; cut=0 stops the curve at the data endpoints.`;
   code=`sns.kdeplot(data=example, x="value", bw_adjust=${choice}, cut=0, ax=ax)`;
  }else if(variant==='line'){
   summary=choice==='o'?'marker="o" marks each observation.':'marker=None draws the line without markers.';
   code=`sns.lineplot(data=example, x="day", y="value", estimator=None, marker=${choice==='o'?'"o"':'None'}, ax=ax)`;
  }else if(variant==='line-band'){
   summary=choice==='sd'?'errorbar="sd" adds one sample SD above and below each mean.':'errorbar=None draws the means without a band.';
   code=`sns.lineplot(data=example, x="day", y="value", estimator="mean", errorbar=${choice==='sd'?'"sd"':'None'}, marker="o", ax=ax)`;
  }else if(variant==='point-interval'){
   summary=choice==='sd'?'errorbar="sd" adds one sample SD above and below each mean.':'errorbar=None shows just the means.';
   code=`sns.pointplot(data=example, x="group", y="value", estimator="mean", errorbar=${choice==='sd'?'"sd"':'None'}, capsize=0.15, ax=ax)`;
  }else{
   summary=choice==='quart'?'inner="quart" marks the quartiles.':'inner="point" marks the observations.';
   code=`sns.violinplot(data=example, x="group", y="value", cut=0, inner="${choice}", ax=ax)`;
  }
 }else if(variant==='strip'||variant==='swarm'){
  const jitter=variant==='strip'&&choice!=='False'?.15:0,size=variant==='swarm'?Number(choice):5,px=group=>group==='A'?160:370,py=value=>175-value/10*145;
  const marks=rawRows.map((row,i)=>{const same=rawRows.filter(other=>other.group===row.group&&other.value===row.value),rank=same.findIndex(other=>other.id===row.id),offset=variant==='swarm'?(rank-(same.length-1)/2)*(size*2+2):jitter?[-18,18,0,-18,18,0][i]:0;return {...row,x:px(row.group)+offset,y:py(row.value)};});
  art=axes(50,25,420,150)+[0,5,10].map(n=>et(24,py(n)+4,n)).join('')+et(50,17,'value')+et(155,195,'A')+et(365,195,'B')+marks.map(row=>`<g data-row="${row.id}"><title>${esc(`${row.id}: ${row.group}, value=${row.value}`)}</title>`+dot(row.x,row.y,variant==='swarm'?size:5)+'</g>').join('');
  summary=variant==='swarm'?`size=${choice} changes marker size and the packing space needed.`:jitter?'jitter=0.15 separates repeated values only along the category axis; measured values stay fixed.':'jitter=False leaves repeated values overlapping.';
  code=`sns.${variant==='swarm'?'swarmplot':'stripplot'}(data=example, x="group", y="value", ${variant==='swarm'?'size='+choice:'jitter='+choice}, ax=ax)`;data={rows:rawRows,marks,count:rawRows.length,jitter,size};
 }else if(variant==='encoding'||variant==='scatter-dimensions'){
  const coloured=variant==='scatter-dimensions'||choice==='hue',shaped=variant==='scatter-dimensions'&&choice!=='colour',sized=choice==='size';
  const categories=['A','B','C'],colours=['var(--lesson-accent)','var(--coral)','var(--ink)'];
  const marker=(x,y,radius,group)=>{const style=`fill:${coloured?colours[group]:colours[0]};stroke:var(--ink);stroke-width:1`,side=radius*Math.sqrt(Math.PI),triangle=radius*Math.sqrt(4*Math.PI/Math.sqrt(3)),height=triangle*Math.sqrt(3)/2;
   return shaped&&group===1?`<rect x="${x-side/2}" y="${y-side/2}" width="${side}" height="${side}" style="${style}"/>`:shaped&&group===2?`<path d="M${x} ${y-height*2/3}l${triangle/2} ${height}h${-triangle}Z" style="${style}"/>`:`<circle cx="${x}" cy="${y}" r="${radius}" style="${style}"/>`;};
  art=axes(40,25,435,150)+[0,2,4,6].map(n=>et(40+n/7*435-3,192,n)).join('')+[0,10,20].map(n=>et(14,175-n/20*150+4,n)).join('')+et(460,213,'x')+et(14,17,'value');
  // Seaborn's default six-point marker maps numeric size to 18–72 pt².
  const marks=exampleRows.map(row=>{const group=categories.indexOf(row.group),radius=sized?Math.sqrt((18+(row.value-1)/17*54)/Math.PI):4,x=40+row.x/7*435,y=175-row.value/20*150;
   art+=`<g data-row="${row.id}"><title>${esc(`${row.id}: group ${row.group}, x=${row.x}, value=${row.value}`)}</title>${marker(x,y,radius,group)}</g>`;return {id:row.id,x:row.x,value:row.value,group:row.group,radius,area:Math.PI*radius*radius};});
  if(coloured)art+=categories.map((group,i)=>marker(260+i*70,12,3,i)+et(270+i*70,16,group)).join('');
  summary=sized?'size="value" maps value to marker area.':shaped?'style="group" adds a marker shape for each group.':coloured?'hue="group" gives each group a colour.':'Without hue, every point uses one colour.';
  code=`sns.scatterplot(data=example, x="x", y="value"${coloured?', hue="group"':''}${shaped?', style="group"':''}${sized?', size="value"':''}, ax=ax)`;data={marks,count:exampleRows.length,coloured,shaped,sized};
 }else if(variant==='stacked'){
  const first=[2,3,1],second=[3,1,4],groups=['A','B','C'],stack=choice==='first',px=i=>100+i*140,py=value=>175-value/6*140;
  art=axes(50,25,420,150)+[0,3,6].map(n=>et(25,py(n)+4,n)).join('')+et(50,17,'count')+first.map((n,i)=>rect(px(i),py(n),60,175-py(n),'visual-fill')+rect(px(i),py(second[i]+(stack?n:0)),60,second[i]/6*140,'visual-hatch')+et(px(i)+24,197,groups[i])).join('')+rect(280,5,12,12,'visual-fill')+et(298,16,'Part 1')+rect(380,5,12,12,'visual-hatch')+et(398,16,'Part 2');
  summary=stack?'bottom=first puts each upper component above its matching lower component. Totals: A=5, B=4, C=5.':'bottom=0 starts both components at zero, so they overlap. Component values stay unchanged.';
  code='ax.bar(example["group"], example["first"], label="Part 1")\n'+`ax.bar(example["group"], example["second"], bottom=${stack?'example["first"]':'0'}, label="Part 2")\nax.legend()`;data={groups,first,second,bottom:stack?first:[0,0,0],totals:first.map((n,i)=>n+second[i]),count:3};
 }else if(variant==='scatter'){
  const [xKey,yKey]=choice.split(':'),domains={x:7,value:20,cost:10},ticks={x:[0,2,4,6],value:[0,10,20],cost:[0,5,10]},px=n=>50+n/domains[xKey]*420,py=n=>170-n/domains[yKey]*145;
  const marks=exampleRows.map(row=>({id:row.id,x:row[xKey],y:row[yKey],cx:px(row[xKey]),cy:py(row[yKey])}));
  art=axes(50,25,420,145)+ticks[xKey].map(n=>et(px(n)-3,192,n)).join('')+ticks[yKey].map(n=>et(24,py(n)+4,n)).join('')+et(445,212,xKey)+et(15,17,yKey)+marks.map(mark=>`<g data-row="${mark.id}"><title>${esc(`${mark.id}: ${xKey}=${mark.x}, ${yKey}=${mark.y}`)}</title>`+dot(mark.cx,mark.cy,4)+'</g>').join('');
  summary=`Horizontal: ${xKey}. Vertical: ${yKey}.`;
  code=`sns.scatterplot(data=example, x="${xKey}", y="${yKey}", ax=ax)`;data={xKey,yKey,marks,rows:exampleRows,xDomain:[0,domains[xKey]],yDomain:[0,domains[yKey]],count:exampleRows.length};
 }else if(variant==='log-scale'){
  const rows=[[1,2],[10,4],[100,6],[1000,8]],log=choice==='log',px=x=>50+(log?Math.log10(x)/3:(x-1)/999)*420,py=y=>170-y/10*145;
  const ticks=log?[1,10,100,1000]:[1,500,1000],marks=rows.map(([x,y])=>({x,y,cx:px(x),cy:py(y)}));
  art=axes(50,25,420,145)+ticks.map(n=>et(px(n)-(n===1000?24:3),192,n)).join('')+[0,5,10].map(n=>et(24,py(n)+4,n)).join('')+et(20,17,'value')+et(390,212,'x · '+choice)+marks.map(mark=>dot(mark.cx,mark.cy,4)).join('');
  summary=log?'Equal steps represent ×10 in x.':'Equal steps represent equal differences in x.';
  code=`sns.scatterplot(data=example, x="x", y="value", ax=ax)\nax.set_xscale("${choice}")\nax.set_ylim(bottom=0)`;data={rows,marks,scale:choice,count:rows.length};
 }else if(variant==='histogram'){
  const countChoice=/^\d+$/.test(choice),lo=Math.min(...exampleRows.map(r=>r.value)),hi=Math.max(...exampleRows.map(r=>r.value));
  const edges=countChoice?Array.from({length:Number(choice)+1},(_,i)=>lo+(hi-lo)*i/Number(choice)):choice==='wide'?[0,4,8,12,16,20]:choice==='narrow'?Array.from({length:11},(_,i)=>i*2):choice==='unequal'?[0,2,5,20]:[0,3,6,9,12,15,18,21];
  const bins=edges.slice(0,-1).map((lo,i)=>({lo,hi:edges[i+1],rows:exampleRows.filter(r=>r.value>=lo&&(i===edges.length-2?r.value<=edges[i+1]:r.value<edges[i+1])).map(r=>r.id)}));
  const span=edges.at(-1)-edges[0],px=value=>50+(value-edges[0])/span*420,max=exampleRows.length;art=axes(50,25,420,145)+et(50,17,'count')+et(29,174,'0')+et(29,54,'9')+bins.map((b,i)=>rect(px(b.lo),170-b.rows.length/max*120,px(b.hi)-px(b.lo),b.rows.length/max*120,'visual-fill')+et(px(b.lo)+4,162-b.rows.length/max*120,b.rows.length)+et(px(b.lo),192,fmt(b.lo))).join('')+et(462,192,edges.at(-1));
  summary=`${bins.map(b=>`[${b.lo}, ${b.hi}${b===bins.at(-1)?']':')'}: ${b.rows.length}`).join('; ')}. Left edge included; only the final right edge is included.`;
  code=`sns.histplot(data=example, x="value", bins=${countChoice?choice:`[${edges.join(', ')}]`}, ax=ax)`;data={mode:countChoice?'count':'edges',edges,bins,count:bins.reduce((n,b)=>n+b.rows.length,0)};
 }else if(variant==='count-bars'){
  const groups=[...new Set(exampleRows.map(row=>row[choice]))].map(group=>{const rows=exampleRows.filter(row=>row[choice]===group);return {group,rows:rows.map(row=>row.id),value:rows.length};});
  art=summaryBars(groups,'Count',9)+et(435,212,choice);
  summary=groups.map(group=>`${group.group}: ${group.value}`).join(' · ');
  code=`sns.countplot(data=example, x="${choice}", ax=ax)`;data={kind:'count',column:choice,groups,count:exampleRows.length,yDomain:[0,9]};
 }else if(['mean-bars','summary-order','exact-bars'].includes(variant)){
  const kind=variant==='summary-order'?(options.statistic==='median'?'median':'mean'):choice==='count'?'count':choice,groups=summaries(kind);
  if(variant==='summary-order'&&choice!=='original')groups.sort((a,b)=>choice==='ascending'?a.value-b.value:b.value-a.value);
  const max=variant==='exact-bars'?25:Math.max(9,...groups.map(group=>group.value));
  art=summaryBars(groups,kind==='count'?'Count':`${kind} of value`,max);
  summary=groups.map(group=>`${group.group}: ${fmt(group.value)}`).join(' · ');
  code=variant==='exact-bars'?`summary = example.groupby("group")["value"].${kind}()\nax.bar(summary.index, summary.values)`:kind==='count'?'sns.countplot(data=example, x="group", ax=ax)':variant==='summary-order'?`summary = example.groupby("group")["value"].${kind}()\n${choice!=='original'?`summary = summary.sort_values(ascending=${choice==='ascending'?'True':'False'})\n`:''}print(summary)`:`sns.barplot(data=example, x="group", y="value", estimator="${kind}", errorbar=None, ax=ax)`;
  data={kind,groups,yDomain:[0,max],count:exampleRows.length};
 }else if(variant==='boxplot'){
  const values=exampleRows.map(row=>row.value),q1=q(values,.25),median=q(values,.5),q3=q(values,.75),iqr=q3-q1,fences=[q1-1.5*iqr,q3+1.5*iqr],inside=values.filter(value=>value>=fences[0]&&value<=fences[1]),outliers=exampleRows.filter(row=>row.value<fences[0]||row.value>fences[1]),whiskers=[Math.min(...inside),Math.max(...inside)];
  const px=value=>50+value/20*420,py=value=>170-value/20*145;
  if(choice==='x')art=axes(50,25,420,145)+[0,5,10,15,20].map(n=>et(px(n)-(n===20?10:3),192,n)).join('')+et(435,212,'value')+path(`M${px(whiskers[0])} 95H${px(whiskers[1])}M${px(whiskers[0])} 85v20M${px(whiskers[1])} 85v20`)+rect(px(q1),75,px(q3)-px(q1),40,'visual-wash')+path(`M${px(median)} 75v40`,'visual-bold')+outliers.map(row=>dot(px(row.value),95,4)).join('');
  else art=axes(50,25,420,145)+[0,5,10,15,20].map(n=>et(24,py(n)+4,n)).join('')+et(15,17,'value')+path(`M260 ${py(whiskers[0])}V${py(whiskers[1])}M248 ${py(whiskers[0])}h24M248 ${py(whiskers[1])}h24`)+rect(240,py(q3),40,py(q1)-py(q3),'visual-wash')+path(`M240 ${py(median)}h40`,'visual-bold')+outliers.map(row=>dot(260,py(row.value),4)).join('');
  summary=`Q1=${q1} · median=${median} · Q3=${q3}. Whiskers: ${whiskers.join('–')}; outlier: ${outliers.map(row=>row.value).join(', ')}.`;
  code=`sns.boxplot(data=example, ${choice}="value", ax=ax)`;data={axis:choice,q1,median,q3,fences,whiskers,outliers:outliers.map(row=>row.id),count:values.length};
 }else if(variant==='references'){
  const medianX=q(exampleRows.map(r=>r.x),.5),medianValue=q(exampleRows.map(r=>r.value),.5);art=plotRows(exampleRows);
  if(choice!=='value')art+=path(`M${40+medianX/7*435} 25V175`,'visual-dashed');
  if(choice!=='x')art+=path(`M40 ${175-medianValue/20*150}H475`,'visual-dashed');
  summary=`The calculated x median is ${medianX}; the value median is ${medianValue}. ${choice==='x'?'The x benchmark becomes a vertical line.':choice==='value'?'The value benchmark becomes a horizontal line.':'Each benchmark uses its own measurement axis.'}`;
  code=(choice!=='value'?'ax.axvline(example["x"].median(), linestyle="--")':'')+(choice==='both'?'\n':'')+(choice!=='x'?'ax.axhline(example["value"].median(), linestyle="--")':'');data={medianX,medianValue,count:exampleRows.length};
 }else{
  const panels=choice==='pooled'?[{group:'All',rows:exampleRows}]:['A','B','C'].map(group=>({group,rows:exampleRows.filter(r=>r.group===group)}));
  art=choice==='pooled'?plotRows(exampleRows):panels.map((p,i)=>et(52+i*162,17,`${p.group}: ${p.rows.length} rows`)+plotRows(p.rows,38+i*162,35,125,125)).join('');
  summary=`${panels.map(p=>`${p.group}: ${p.rows.map(r=>r.id).join(', ')}`).join('; ')}. Panels share the x and value scales.`;code=choice==='pooled'?'sns.scatterplot(data=example, x="x", y="value", ax=ax)':'sns.relplot(data=example, x="x", y="value", col="group", kind="scatter")';data={panels:panels.map(p=>({group:p.group,rows:p.rows.map(r=>r.id)})),count:panels.reduce((n,p)=>n+p.rows.length,0)};
 }
 const svg=`<div class="teaching-visual-scroll" tabindex="0" role="region" aria-label="Teaching chart; scroll if needed"><svg class="concept-visual data-teaching-visual" viewBox="0 0 520 225" role="img" aria-label="${esc(summary)}"><title>${esc(summary)}</title><g>${art}</g></svg></div>`;
 return {summary,code,svg,data};
}
function shortResult(result,variant,choice){
 const d=result.data;
 if(['density','line','line-band','point-interval','violin','strip','swarm','encoding','scatter-dimensions','stacked'].includes(variant))return result.summary;
 if(['scatter','log-scale','count-bars','exact-bars','boxplot'].includes(variant))return result.summary;
 if(variant==='histogram')return `${d.bins.length} bins. ${choice==='unequal'?'Widths follow the edges; height still counts rows.':'Include left edges and the final right edge.'}`;
 if(variant==='summary-order')return `Labels and ${d.kind==='median'?'medians':'means'} move together; observations stay unchanged.`;
 if(d.groups)return `${d.kind==='count'?'Count rows':d.kind==='mean'?'Average values':d.kind==='median'?'Take the middle value after sorting':'Add values'} within each group.`;
 if(variant==='references')return [choice!=='value'?`x median is ${d.medianX} → vertical`:null,choice!=='x'?`value median is ${d.medianValue} → horizontal`:null].filter(Boolean).join('; ')+'.';
 return choice==='pooled'?'One panel.':'One panel per group, with shared scales.';
}
function exampleTable(variant){
 if(variant==='scatter'||variant==='count-bars'||variant==='log-scale'){
  const heads=variant==='scatter'?['row','x','value','cost']:variant==='count-bars'?['row','group','shift']:['x','value'];
  const rows=variant==='scatter'?exampleRows.map(row=>[row.id,row.x,row.value,row.cost]):variant==='count-bars'?exampleRows.map(row=>[row.id,row.group,row.shift]):[[1,2],[10,4],[100,6],[1000,8]];
  return `<table class="teaching-example-output teaching-visual-data"><caption class="sr-only">Illustrative data</caption><thead><tr>${heads.map(head=>`<th scope="col">${head==='row'?head:`<code data-code-role="column">${head}</code>`}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 }

 if(variant==='line'||variant==='line-band')return `<table class="teaching-example-output teaching-visual-data" data-code-table="teaching"><caption class="sr-only">Example observations</caption><thead><tr><th scope="col"><code data-code-role="column">day</code></th><th scope="col"><code data-code-role="column">value</code></th></tr></thead><tbody>${(variant==='line'?lineObservations:repeatedObservations).map(row=>`<tr>${row.map(value=>`<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 if(variant==='stacked')return '<table class="teaching-example-output teaching-visual-data" data-code-table="teaching"><caption class="sr-only">Example component counts</caption><thead><tr><th scope="col"><code data-code-role="column">group</code></th><th scope="col"><code data-code-role="column">first</code></th><th scope="col"><code data-code-role="column">second</code></th></tr></thead><tbody>'+['A','B','C'].map((group,i)=>`<tr><th scope="row">${group}</th><td>${[2,3,1][i]}</td><td>${[3,1,4][i]}</td></tr>`).join('')+'</tbody></table>';
 const observations=['strip','swarm'].includes(variant)?rawRows:exampleRows;
 const numeric=['histogram','boxplot','density'].includes(variant),coordinates=['scatter','references','facets','encoding','scatter-dimensions'].includes(variant);
 const heads=numeric?['Column','Values']:['Group',variant==='count-bars'?'Records':coordinates?'(x, value)':'Values'];
 const rows=numeric?[['value',observations.map(r=>r.value).join(', ')]]:[...new Set(observations.map(row=>row.group))].map(group=>[group,observations.filter(r=>r.group===group).map(r=>variant==='count-bars'?r.id:coordinates?`(${r.x},${r.value})`:r.value).join(', ')]);
 return `<table class="teaching-example-output teaching-visual-data" data-code-table="${numeric?'dictionary':'teaching'}"><caption class="sr-only">Example observations</caption><thead><tr>${heads.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(([group,values])=>`<tr><th scope="row">${numeric?`<code data-code-role="column">${esc(group)}</code>`:esc(group)}</th><td>${esc(values)}</td></tr>`).join('')}</tbody></table>`;
}
const lineExampleRows=Object.freeze([
 [1,2,8],[1,4,3],[1,9,6],[2,3,2],[2,7,5],[2,8,9],[3,6,1],[3,8,7],[3,10,4]
].map(([day,value,cost],i)=>Object.freeze({id:'l'+(i+1),day,value,cost})));
const dailyExampleRows=Object.freeze([
 [1,1,2,8],[2,1,4,3],[3,1,9,6],[4,2,3,2],[5,2,7,5],[6,2,8,9]
].map(([day,period,value,cost],i)=>Object.freeze({id:'d'+(i+1),day,period,value,cost})));
const numerical=['x','value','cost'],categories=['group','shift'];
const stringOptions=values=>values.map(v=>[v,JSON.stringify(v)]);
function plotArguments(variant,state={},settings={}){
 const fields=[],add=(key,label,values,fallback)=>fields.push({key,label,value:String(state[key]??fallback),options:values.map(v=>Array.isArray(v)?v:[String(v),String(v)])});
 const numeric=(key,fallback,values=numerical)=>add(key,key+' · '+(key==='x'?'horizontal':'vertical')+' column',stringOptions(values),fallback);
 if(['scatter','encoding','scatter-dimensions'].includes(variant)){
  numeric('x','x');numeric('y','value');
  if(variant!=='scatter')add('hue','Colour by column',[['None','None · one colour'],...stringOptions(categories)],'group');
  if(variant==='scatter-dimensions'){
   add('style','Marker shape by column',[['None','None · one shape'],...stringOptions(categories)],'group');
   if(settings.sizeEncoding!==false)add('size','Marker size by column',[['None','None · one size'],...stringOptions(numerical)],'None');
  }
 }else if(variant==='facets'){
  numeric('x','x');numeric('y','value');add('col','One panel per category',[['None','None · one panel'],...stringOptions(categories)],'group');
 }else if(['line','line-band'].includes(variant)){
  if(variant==='line')add('x','Horizontal time column',[['day','"day" · individual days'],['period','"period" · three-day groups']],'day');else numeric('x','day',['day','cost','value']);numeric('y','value',['value','cost']);
  add('estimator','Combine values at the same x',[["None","None · keep every row"],['mean','"mean" · average'],['median','"median" · middle value'],...(variant==='line'?[['sum','"sum" · total']]:[])],variant==='line'?'None':'mean');
  add('marker','Point marker',[["None","None · no marker"],['o','"o" · circle'],['s','"s" · square'],['*','"*" · star'],['^','"^" · triangle'],['x','"x" · cross']],'o');
  if(variant==='line-band')add('errorbar','Spread around the summary',[["None","None · no band"],['sd','"sd" · one standard deviation']],'sd');
 }else if(['mean-bars','point-interval','violin','exact-bars'].includes(variant)){
  add('x','Group column',stringOptions(categories),'group');numeric('y','value');
  if(['mean-bars','point-interval','exact-bars'].includes(variant))add('estimator','Calculation per group',stringOptions(variant==='point-interval'?['mean','median']:['mean','median','sum']),settings.statistic||'mean');
  if(variant==='point-interval')add('errorbar','Spread around the summary',[["None","None · no interval"],['sd','"sd" · one standard deviation']],'sd');
  if(variant==='violin')add('inner','Marks inside each violin',stringOptions(['quart','point']),'quart');
 }else if(variant==='strip')add('jitter','Separate overlapping dots',[['False','False · no sideways spread'],['0.15','0.15 · add sideways spread']],'0.15');
 else if(variant==='swarm')add('size','Dot size',[3,5,7],'5');
 else if(variant==='histogram'){
  numeric('x','value');add('bins','Number of bins',(settings.choices||['2','4','8']).map(v=>[v,explorerSpecs.histogram.options.find(o=>o[0]===v)?.[1]||v]),settings.choices?.includes('4')||!settings.choices?'4':settings.choices[0]);
 }else if(variant==='density'){
  numeric('x','value');add('bw_adjust','How much to smooth',[.5,1,2],String(settings.bandwidth||1));
 }else if(variant==='count-bars')add('x','Category column',stringOptions(categories),'group');
 else if(variant==='boxplot'){add('axis','Measurement axis',[['x','x · horizontal'],['y','y · vertical']],settings.choice||'y');add('column','Measurement column',stringOptions(numerical),'value');}
 else{
  const available=explorerSpecs[variant].options.filter(([v])=>!settings.choices||settings.choices.includes(v));
  add('choice',explorerSpecs[variant].label,available,settings.choice??available[1]?.[0]??available[0][0]);
 }
 for(const f of fields)if(!f.options.some(([v])=>String(v)===f.value))throw Error('Unknown plot argument '+variant+'/'+f.key+'/'+f.value);
 return fields;
}
const pyValue=value=>value==='None'?'None':JSON.stringify(value);
function plotArgumentModel(variant,state={},settings={}){
 const args=Object.fromEntries(plotArguments(variant,state,settings).map(f=>[f.key,f.value]));
 if('choice' in args)return exploration(variant,args.choice,{statistic:settings.statistic});
 const rows=variant==='line'?dailyExampleRows:variant==='line-band'?lineExampleRows:variant==='strip'||variant==='swarm'?rawRows:exampleRows;
 let art='',code='',summary='',data={rows,args,count:rows.length};
 const wrap=()=>({code,summary,data,svg:`<div class="teaching-visual-scroll" tabindex="0" role="region" aria-label="Teaching chart; scroll if needed"><svg class="concept-visual data-teaching-visual" viewBox="0 0 520 245" role="img" aria-label="${esc(summary)}"><title>${esc(summary)}</title><g>${art}</g></svg></div>`});
 const domain=name=>name==='x'?7:name==='cost'?10:name==='day'?(variant==='line'?7:4):name==='period'?3:20;
 const marker=(x,y,shape,r=4,style='')=>{
  const attr=style?` style="${style}"`:'';
  if(shape==='None')return '';
  if(shape==='s')return `<rect x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}" class="visual-fill"${attr}/>`;
  if(shape==='^')return `<path d="M${x} ${y-r}l${r} ${r*2}h${-r*2}Z" class="visual-fill"${attr}/>`;
  if(shape==='x')return `<path d="M${x-r} ${y-r}l${2*r} ${2*r}m${-2*r} 0l${2*r} ${-2*r}" class="visual-bold"${attr}/>`;
  if(shape==='*')return `<path d="${Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.38196601125:r;return `${i?'L':'M'}${x+Math.cos(a)*rad} ${y+Math.sin(a)*rad}`;}).join('')}Z" class="visual-fill"${attr}/>`;
  return `<circle cx="${x}" cy="${y}" r="${r}" class="visual-fill"${attr}/>`;
 };
 if(['scatter','encoding','scatter-dimensions','line','line-band'].includes(variant)){
  const linePlot=variant==='line'||variant==='line-band',xKey=args.x,yKey=args.y,xMax=domain(xKey),yMax=linePlot?Math.ceil((variant==='line'&&args.estimator==='sum'?Math.max(...[...new Set(rows.map(r=>r[xKey]))].map(x=>rows.filter(r=>r[xKey]===x).reduce((total,r)=>total+r[yKey],0))):Math.max(...rows.map(r=>r[yKey])))*(variant==='line-band'?1.2:1.1)):domain(yKey),px=x=>55+x/xMax*410,py=y=>190-y/yMax*150;
  art=axes(55,40,410,150)+(linePlot&&xKey==='period'?[1,2]:linePlot&&xKey==='day'&&variant==='line'?[1,3,6]:[0,xMax/2,xMax]).map(n=>et(px(n)-7,210,fmt(n))).join('')+[0,yMax/2,yMax].map(n=>et(15,py(n)+4,fmt(n))).join('')+et(425,232,xKey)+et(55,30,yKey);
  if(linePlot){
   const aggregate=vals=>args.estimator==='sum'?vals.reduce((s,v)=>s+v,0):args.estimator==='median'?q(vals,.5):mean(vals);
   const groups=[...new Set(rows.map(r=>r[xKey]))].sort((a,b)=>a-b).map(x=>{const values=rows.filter(r=>r[xKey]===x).map(r=>r[yKey]);return {x,value:aggregate(values),sd:values.length>1?spread(values):null,values};});
   const points=args.estimator==='None'?rows.map(row=>[row[xKey],row[yKey]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]):groups.map(g=>[g.x,g.value]);
   const intervals=args.estimator!=='None'&&args.errorbar==='sd'?groups.filter(g=>g.sd!==null):[];
   const bands=[];let band=[];
   if(intervals.length)for(const group of groups){if(group.sd!==null)band.push(group);else if(band.length){bands.push(band);band=[];}}if(band.length)bands.push(band);
   for(const segment of bands)art+=path(segment.map((g,i)=>`${i?'L':'M'}${px(g.x)} ${py(g.value+g.sd)}`).join('')+[...segment].reverse().map(g=>`L${px(g.x)} ${py(g.value-g.sd)}`).join('')+'Z','visual-wash');
   art+=path(points.map(([x,y],i)=>`${i?'L':'M'}${px(x)} ${py(y)}`).join(''),'visual-bold')+points.map(([x,y])=>marker(px(x),py(y),args.marker)).join('');
   code=`sns.lineplot(data=example, x="${xKey}", y="${yKey}",\n    estimator=${pyValue(args.estimator)}, marker=${pyValue(args.marker)},\n    errorbar=${pyValue(args.errorbar||'None')}, ax=ax)`;
   if(variant==='line')code+='  # hide the interval band';
   summary=args.estimator==='None'?(variant==='line'&&xKey==='day'?'One observation per day; select period to group three days.':groups.some(g=>g.values.length>1)?`Repeated ${xKey} values are joined directly; choose a summary to combine them.`:'Keep every observation and connect them in x order.'):groups.every(g=>g.values.length===1)?`One row per ${xKey}: ${yKey} stays unchanged.`:`${args.estimator==='mean'?'Average':args.estimator==='median'?'Middle value of':'Total'} ${yKey} at each ${xKey}.`;
   if(args.errorbar==='sd')summary+=args.estimator==='None'?' No band is calculated when estimator=None.':!intervals.length?` SD needs at least two observations per ${xKey}.`:intervals.every(g=>g.sd===0)?` SD is zero at repeated ${xKey} values; these intervals lie on the line.`:` Band: the chosen summary ± one sample SD at repeated ${xKey} values.`;
   data={...data,xKey,yKey,groups,points,intervals,bands,yDomain:[0,yMax],xDomain:[0,xMax]};
  }else{
   const colours=['var(--lesson-accent)','var(--coral)','var(--ink)'],hues=args.hue&&args.hue!=='None'?[...new Set(rows.map(r=>r[args.hue]))]:[],styles=args.style&&args.style!=='None'?[...new Set(rows.map(r=>r[args.style]))]:[],sizes=args.size&&args.size!=='None'?rows.map(r=>r[args.size]):null;
   const marks=rows.map(row=>{const hi=hues.indexOf(row[args.hue]),si=styles.indexOf(row[args.style]),radius=sizes?Math.sqrt((18+(row[args.size]-Math.min(...sizes))/(Math.max(...sizes)-Math.min(...sizes))*54)/Math.PI):4;const mark={id:row.id,x:row[xKey],y:row[yKey],cx:px(row[xKey]),cy:py(row[yKey]),radius};art+=`<g data-row="${row.id}"><title>${esc(row.id+': '+xKey+'='+mark.x+', '+yKey+'='+mark.y)}</title>`+marker(mark.cx,mark.cy,si===1?'s':si===2?'^':'o',radius,`fill:${colours[Math.max(0,hi)]}`)+'</g>';return mark;});
   hues.forEach((group,i)=>{art+=marker(260+i*75,15,'o',3,`fill:${colours[i]}`)+et(269+i*75,20,group);});
   if(styles.length)styles.forEach((group,i)=>{art+=marker(60+i*65,15,i===1?'s':i===2?'^':'o',3)+et(70+i*65,20,group);});
   code=`sns.scatterplot(data=example, x="${xKey}", y="${yKey}"${args.hue?', hue='+pyValue(args.hue):''}${args.style?', style='+pyValue(args.style):''}${args.size?', size='+pyValue(args.size):''}, ax=ax)`;
   summary=`Horizontal: ${xKey}. Vertical: ${yKey}.`+(args.hue&&args.hue!=='None'?` Colour: ${args.hue}.`:'')+(args.style&&args.style!=='None'?` Shape: ${args.style}.`:'')+(sizes?` Size: ${args.size}.`:'');data={...data,xKey,yKey,marks,xDomain:[0,xMax],yDomain:[0,yMax]};
  }
 }else if(variant==='facets'){
  const labels=args.col==='None'?['All']:[...new Set(rows.map(r=>r[args.col]))],panels=labels.map(group=>({group,rows:args.col==='None'?rows:rows.filter(row=>row[args.col]===group)})),width=panels.length===1?410:panels.length===2?190:130,gap=panels.length===3?32:30;
  panels.forEach((panel,i)=>{const left=50+i*(width+gap),px=x=>left+x/domain(args.x)*width,py=y=>190-y/domain(args.y)*150;art+=axes(left,40,width,150)+et(left,34,panel.group)+[0,domain(args.x)].map(n=>et(px(n)-(n?12:0),212,n)).join('')+(i===0?[0,domain(args.y)].map(n=>et(18,py(n)+4,n)).join('')+et(50,16,args.y):'')+et(left+width-40,235,args.x)+panel.rows.map(row=>`<g data-row="${row.id}">`+dot(px(row[args.x]),py(row[args.y]),4)+'</g>').join('');});
  code=`g = sns.relplot(data=example, x="${args.x}", y="${args.y}",
    col=${pyValue(args.col)}, kind="scatter")`;
  summary=args.col==='None'?'One panel.':`Panels by ${args.col}: `+panels.map(p=>`${p.group}: ${p.rows.length}`).join(' · ')+'.';
  data={...data,panels,xKey:args.x,yKey:args.y};
 }else if(['mean-bars','exact-bars','point-interval','violin'].includes(variant)){
  const groups=[...new Set(rows.map(r=>r[args.x]))].map(group=>{const members=rows.filter(r=>r[args.x]===group),values=members.map(r=>r[args.y]),value=args.estimator==='sum'?values.reduce((s,v)=>s+v,0):args.estimator==='median'?q(values,.5):mean(values);return {group,values,rows:members.map(r=>r.id),value,sd:spread(values)};});
  if(variant==='mean-bars'||variant==='exact-bars'){
   art=summaryBars(groups,args.estimator+' of '+args.y,args.estimator==='sum'?rows.reduce((n,row)=>n+row[args.y],0):Math.max(9,...rows.map(row=>row[args.y])))+et(430,215,args.x);
   code=variant==='exact-bars'?`summary = example.groupby("${args.x}")["${args.y}"].${args.estimator}()\nax.bar(summary.index, summary.values)`:`sns.barplot(data=example, x="${args.x}", y="${args.y}",\n    estimator="${args.estimator}", errorbar=None, ax=ax)`;
  }else{
   const model=scientificPlot(variant,{rows:rows.map(r=>({...r,group:r[args.x],value:r[args.y]})),showInterval:args.errorbar==='sd',inner:args.inner,densityNorm:'area',estimator:args.estimator});
   art=`<g transform="translate(0 6) scale(2)">${model.art.replaceAll('>value<','>'+esc(args.y)+'<')}</g>`;data.yDomain=model.data.yDomain;
   code=variant==='violin'?`sns.violinplot(data=example, x="${args.x}", y="${args.y}",\n    inner="${args.inner}", cut=0, ax=ax)`:`sns.pointplot(data=example, x="${args.x}", y="${args.y}",\n    estimator="${args.estimator}", errorbar=${pyValue(args.errorbar)}, capsize=0.15, ax=ax)`;
  }
  summary=groups.map(g=>`${g.group}: ${fmt(g.value)}`).join(' · ');if(variant==='violin')summary=args.inner==='quart'?'Lines mark the middle value and the two quartiles.':'Dots show the observations inside each density shape.';
  data={...data,groups,kind:args.estimator};
 }else if(variant==='histogram'||variant==='density'){
  const values=rows.map(r=>r[args.x]);
  if(variant==='density'){
   const model=scientificPlot('density',{rows:rows.map(r=>({...r,value:r[args.x]})),bandwidth:Number(args.bw_adjust),yMax:args.x==='x'?.5:.2});art=`<g transform="translate(0 6) scale(2)">${model.art.replaceAll('>value<','>'+esc(args.x)+'<')}</g>`;
   code=`sns.kdeplot(data=example, x="${args.x}", bw_adjust=${args.bw_adjust}, cut=0, ax=ax)`;summary='A larger bw_adjust smooths the curve more. The observations stay the same.';data={...data,...model.data};
  }else{
   const number=/^\d+$/.test(args.bins),lo=Math.min(...values),hi=Math.max(...values),edges=number?Array.from({length:Number(args.bins)+1},(_,i)=>lo+(hi-lo)*i/Number(args.bins)):args.bins==='wide'?[0,4,8,12,16,20]:args.bins==='narrow'?Array.from({length:11},(_,i)=>i*2):args.bins==='unequal'?[0,2,5,20]:[0,3,6,9,12,15,18,21];
   const bins=edges.slice(0,-1).map((lo,i)=>({lo,hi:edges[i+1],rows:rows.filter(r=>r[args.x]>=lo&&(i===edges.length-2?r[args.x]<=edges[i+1]:r[args.x]<edges[i+1])).map(r=>r.id)})),px=x=>55+(x-edges[0])/(edges.at(-1)-edges[0])*410;
   art=axes(55,25,410,150)+et(55,17,'count')+et(25,194,'0')+et(25,44,'9')+bins.map(b=>rect(px(b.lo),190-b.rows.length/9*150,px(b.hi)-px(b.lo),b.rows.length/9*150,'visual-fill')+et(px(b.lo)+4,183-b.rows.length/9*150,b.rows.length)+et(px(b.lo),212,fmt(b.lo))).join('')+et(450,212,fmt(edges.at(-1)))+et(420,235,args.x);
   code=`sns.histplot(data=example, x="${args.x}", bins=${number?args.bins:'['+edges.join(', ')+']'}, ax=ax)`;summary=`${bins.length} bins. Heights count observations in each interval.`;data={...data,edges,bins,mode:number?'count':'edges'};
  }
 }else if(variant==='count-bars'){
  const model=exploration(variant,args.x);return {...model,data:{...model.data,args,rows}};
 }else if(variant==='boxplot'){
  const model=scientificPlot('boxplot',{rows:rows.map(r=>({...r,value:r[args.column]}))});
  // Reuse the exact Tukey calculation, then orient its measured coordinates.
  const d=model.data,px=n=>55+n/20*410,py=n=>190-n/20*150;
  art=axes(55,40,410,150)+[0,10,20].map(n=>args.axis==='x'?et(px(n)-4,213,n):et(20,py(n)+4,n)).join('');
  if(args.axis==='x')art+=et(420,235,args.column)+path(`M${px(d.whiskers[0])} 115H${px(d.whiskers[1])}M${px(d.whiskers[0])} 105v20M${px(d.whiskers[1])} 105v20`)+rect(px(d.q1),95,px(d.q3)-px(d.q1),40,'visual-wash')+path(`M${px(d.median)} 95v40`,'visual-bold')+d.outliers.map(n=>dot(px(n),115,4)).join('');
  else art+=et(55,30,args.column)+path(`M260 ${py(d.whiskers[0])}V${py(d.whiskers[1])}M248 ${py(d.whiskers[0])}h24M248 ${py(d.whiskers[1])}h24`)+rect(240,py(d.q3),40,py(d.q1)-py(d.q3),'visual-wash')+path(`M240 ${py(d.median)}h40`,'visual-bold')+d.outliers.map(n=>dot(260,py(n),4)).join('');
  summary=`Quartiles: ${d.q1}, ${d.median}, ${d.q3}. Whiskers: ${d.whiskers.join('–')}.`;code=`sns.boxplot(data=example, ${args.axis}="${args.column}", ax=ax)`;data={...data,...d};
 }else if(variant==='strip'||variant==='swarm'){
  // Swarm/strip examples have only group/value fields; keep those coordinates.
  const original=exploration(variant,variant==='strip'?args.jitter:args.size);return {...original,data:{...original.data,args}};
 }
 return wrap();
}
function plotCode(variant,state,settings){
 const model=plotArgumentModel(variant,state,settings),controls=plotArguments(variant,state,settings).map(arg=>root.InlineCode.choices(arg.key,arg.label,arg.value,arg.options,value=>plotArgumentModel(variant,{...state,[arg.key]:value},settings)));
 if(variant==='boxplot'){const axis=controls.find(c=>c.key==='axis'),value=plotArguments(variant,state,settings).find(a=>a.key==='axis').value,start=model.code.indexOf(value+'=');axis.ranges=[{start,end:start+1}];}
 return root.InlineCode.render(model.code,controls,'plot');
}
function plotDataTable(variant){
 if(!['scatter','encoding','scatter-dimensions','line','line-band','mean-bars','exact-bars','point-interval','violin','histogram','density','count-bars','boxplot','strip','swarm','facets'].includes(variant))return exampleTable(variant);
 const rows=variant==='line'?dailyExampleRows:variant==='line-band'?lineExampleRows:variant==='strip'||variant==='swarm'?rawRows:exampleRows,heads=variant==='line'?['day','period','value','cost']:variant==='line-band'?['day','value','cost']:variant==='strip'||variant==='swarm'?['group','value']:variant==='count-bars'?['group','shift']:['scatter','histogram','density','boxplot'].includes(variant)?['x','value','cost']:['group','shift','x','value','cost'];
 return `<div class="operation-table-scroll" tabindex="0" role="region" aria-label="Illustrative observations"><table class="teaching-example-output teaching-visual-data"><thead><tr>${heads.map(h=>`<th scope="col"><code data-code-role="column">${h}</code></th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${heads.map(h=>`<td>${esc(row[h])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function plotSummaryMarkup(result){
 const name=value=>'<code data-code-role="column">'+esc(value)+'</code>',args=result.data.args||{};let html=esc(result.summary);
 const anchored=(prefix,value)=>{if(value&&value!=='None')html=html.replaceAll(esc(prefix+value),esc(prefix)+name(value));};
 if(html.startsWith('One row per ')&&args.x&&args.y)html=html.replace(esc('One row per '+args.x+': '+args.y),'One row per '+name(args.x)+': '+name(args.y));
 if(result.data.rows?.[0]?.period!==undefined)html=html.replace('select period','select '+name('period'));
 anchored('Repeated ',args.x);anchored('repeated ',args.x);anchored(' per ',args.x);
 anchored('Horizontal: ',args.x);anchored('Vertical: ',args.y);anchored(' at each ',args.x);anchored('Average ',args.y);anchored('Total ',args.y);anchored('Middle value of ',args.y);
 anchored('Panels by ',args.col);anchored('Colour: ',args.hue);anchored('Shape: ',args.style);anchored('Size: ',args.size);
 html=html.replace(/\bbw_adjust\b/g,'<code data-code-role="parameter">bw_adjust</code>');
 if(!args.x&&!args.y)html=html.replace(/\b(x|value) median\b/g,(_,column)=>name(column)+' median');
 return html;
}
function resultHtml(result){return result.svg+`<p>${plotSummaryMarkup(result)}</p>`;}
function interactive(v){
 if(!explorerSpecs[v.variant])return '';
 const settings={...v,statistic:v.summaryStatistic||v.statistic},state={};
 const key={histogram:'bins','count-bars':'x',boxplot:'axis',density:'bw_adjust',strip:'jitter',swarm:'size',violin:'inner','mean-bars':'estimator','exact-bars':'estimator'}[v.variant];
 if(key&&v.choice)state[key]=v.choice;
 if(v.variant==='scatter'&&v.choice)[state.x,state.y]=v.choice.split(':');
 if(v.variant==='encoding'&&v.choice)state.hue=v.choice==='plain'?'None':'group';
 if(v.variant==='line'&&v.choice)state.marker=v.choice==='none'?'None':v.choice;
 if(['line-band','point-interval'].includes(v.variant)&&v.choice)state.errorbar=v.choice==='none'?'None':v.choice;
 if(v.variant==='facets'&&v.choice)state.col=v.choice==='pooled'?'None':'group';

 if(v.variant==='histogram'&&!state.bins&&v.choices?.length)state.bins=v.choices.includes('4')?'4':v.choices[0];
 const model=plotArgumentModel(v.variant,state,settings);
 return `<section class="teaching-explorer foundation-visual-explorer" data-foundation-explorer="${esc(v.variant)}" data-visual-settings="${esc(JSON.stringify(settings))}" data-visual-state="${esc(JSON.stringify(state))}"><p>Illustrative data</p>${plotDataTable(v.variant)}<div class="illustrative-code-controls">${plotCode(v.variant,state,settings)}</div><div class="teaching-visual-result" aria-live="polite" aria-atomic="true">${resultHtml(model)}</div></section>`;
}
// Explicit teaching alignment, applied after all curriculum overlays. Reviews
// reuse the matching operation, rather than blindly taking the Transfer sketch.
transform('weekday-counts','count observations per weekday after parsing dates',['weekday'],[['Mon'],['Tue'],['Mon']],['weekday','count'],[['Mon',2],['Tue',1]]);
transform('month-counts','count observations per month; display in calendar order',['month'],[[7],[6],[7]],['month','count'],[[6,1],[7,2]]);
transform('pivot-transposed','pivot: measure labels on rows, names on columns',['name','measure','value'],[['A','x',2],['B','x',3],['A','y',4]],['measure','A','B'],[['x',2,3],['y',4,'NaN']]);
transform('unmatched-join','left join, then select unmatched left rows',['key','value'],[['A',2],['B',4]],['key','val','tag'],[['B',4,'NaN']],text(13,82,'lookup: A → yes'));
define('concat-keep-index','table-transform','concat: append rows and keep their original indices',()=>table(5,3,91,['idx','first'],[[0,2],[1,4]])+text(44,56,'+')+table(5,62,91,['idx','second'],[[0,6]])+arrow()+table(150,15,105,['index','value'],[[0,2],[1,4],[0,6]]));
const activityIdeas={
 'W08-2':'np.select evaluates several conditions in order and uses the first match.',
 'W08-3':'Combining row tests produces a Boolean value for each row.',
 'W23-2':'Choose which grouping labels become the rows and which become the columns; pivot does not aggregate.',
 'W26-2':'qcut chooses boundaries from quantiles, aiming for equal numbers of observations per group.',
 'V06-2':'A complementary ECDF gives the fraction of observations above each value.',
 'V06-3':'A complementary ECDF gives the fraction of observations above each value.',
 'I17-3':'duplicated(keep=False) flags every member of a repeated set, including its first occurrence.',
 'IR3-4':'duplicated(keep=False) flags every member of a repeated set, including its first occurrence.'
};
const activityVariants={
 'I02-2':'tail','I02-3':'sample','I03-2':'row-count','I04-2':'index-labels',
 'I09-2':'loc-list','I09-3':'loc-list','I11-2':'or','I13-2':'smallest','I13L-2':'minimum-label',
 'I16-3':'drop-missing','I15-2':'category-counts','I17-3':'all-duplicates','I19-2':'group-sum',
 'W05-2':'between','W06-2':'reset-keep-index','W07-2':'numeric-sum','W07-3':'months',
 'V30-2':'stacked-compare','V30-3':'stacked-share','W08-2':'multiple-conditions','W08-3':'boolean-column','W09-2':'map-missing',
 'W10-3':'clean-text','W11-2':'not-contains','W13-2':'string-type','W13-3':'nullable-integer',
 'W15-2':'weekday-counts','W15-3':'month-counts','W23-2':'pivot-transposed','W24-3':'unmatched-join','W25-2':'concat-keep-index','W17-2':'fill-zero','W18-2':'deduplicate-last','W19-2':'aggregate-sum',
 'W20-2':'group-centered','W20-3':'above-group-mean','W21-2':'pivot-sum','W26-2':'quantile-bins',
 'V03-2':'numeric-hue','V03-3':'scatter','V13-2':'raw-no-jitter','V13-3':'raw-no-jitter','V15-1':'raw-no-jitter','V15-2':'raw-no-jitter','V15-3':'raw-no-jitter','V26-2':'linear-limits','V26-3':'linear-limits',
 'V06-2':'ecdf-complement','V06-3':'ecdf-complement','V10-2':'median-points',
 'V19-2':'line','V23-2':'proportion-heatmap','V23-3':'mean-heatmap',
 'V27-2':'reference-mean','V27-3':'reference-threshold','V28-2':'smallest-annotation','V33-3':'facets',
 'IR2-2':'loc-list','IR3-3':'drop-missing','IR1-1':'sample','IR3-4':'all-duplicates','WR2-1':'months','WR2-2':'clean-text',
 'WR4-4':'unmatched-join','WR4-2':'above-group-mean','VR1-1':'line','VR3-3':'reference-vertical',
 'VR6-4':'facet-hist','VR2-3':'strip','VR4-4':'raw-no-jitter','VR4-2':'ecdf','VR4-3':'median-points','VR5-4':'rate-heatmap','VR6-1':'lowest-annotation'
};
function align(curriculum){
 for(const lesson of curriculum.lessons)for(const round of lesson.rounds){
  if(activityVariants[round.id])round.visual=spec(activityVariants[round.id]);
  if(activityIdeas[round.id])round.activityIdea=activityIdeas[round.id];
  const v=round.visual;
  if(v.variant==='histogram')Object.assign(v,{choices:round.id==='V04-3'?['wide','narrow','unequal']:['2','4','8'],choice:round.id==='V04-3'?'unequal':round.id==='V04-2'?'2':'4',binMode:round.id==='V04-3'?'edges':'count'});
  if(v.variant==='count-bars')Object.assign(v,{choice:'group',choices:['group','shift']});
  if(v.variant==='scatter')Object.assign(v,{choice:'x:value'});
  if(v.variant==='boxplot')Object.assign(v,{choice:'y'});
  if(v.variant==='log-scale')Object.assign(v,{choice:'log'});
  if(v.variant==='exact-bars')Object.assign(v,{choice:'mean'});
  if(v.variant==='references')v.choice='both';
  if(v.variant==='mean-bars')v.choices=['mean','median'];
  if(v.variant==='summary-order')Object.assign(v,{summaryStatistic:round.id==='I19S-1'?'mean':'median',choice:round.id==='I19S-1'?'original':round.id==='I19S-3'?'descending':'ascending'});
  if(v.variant==='scatter-dimensions')v.sizeEncoding=!!round.solution.match(/\bsize\s*=/);
  if(round.id==='VR2-4')v.sizeEncoding=false;
  if(v.variant==='violin')v.densityNorm=round.solution.match(/density_norm\s*=\s*["'](\w+)/)?.[1]||'area';
  if(v.variant==='violin')v.inner=/inner\s*=\s*["']quart/.test(round.solution)?'quart':'point';
  if(v.variant==='density')v.bandwidth=/bw_adjust\s*=\s*2/.test(round.solution)?2:1;
  if(v.variant==='pair-grid'){const vars=round.solution.match(/vars\s*=\s*\[([^\]]+)/);v.variableCount=vars?(vars[1].match(/["'][A-Za-z_]/g)||[]).length:2;v.corner=/corner\s*=\s*True/.test(round.solution);}
 }
 // Catalogue thumbnails introduce the Follow concept, without later stage cues.
 for(const lesson of curriculum.lessons)if(!lesson.review&&lesson.rounds[0]?.visual)lesson.visual={...lesson.rounds[0].visual};
}
const mounted=new WeakSet();
function mount(container=root.document){
 if(!container||mounted.has(container))return;mounted.add(container);
 container.addEventListener('illustrative-code-change',event=>{
  const section=event.target.closest?.('[data-foundation-explorer]');if(!section)return;
  const variant=section.dataset.foundationExplorer,settings=JSON.parse(section.dataset.visualSettings),state={...JSON.parse(section.dataset.visualState),[event.detail.key]:event.detail.value};
  section.dataset.visualState=JSON.stringify(state);section.querySelector('.illustrative-code-controls').innerHTML=plotCode(variant,state,settings);
  const result=section.querySelector('.teaching-visual-result');result.innerHTML=resultHtml(plotArgumentModel(variant,state,settings));root.FoundationLearning?.highlightContent?.(result);
 });
}
const api={plotArguments,plotArgumentModel,plotCode,lineExampleRows,explorerSpecs,diagram,configure,align,activityVariants,spec,mapping,scene,sceneLabel,scientificPlot,scientificEvidence,scienceIds,interactive,mount,exploration,exampleRows,types:new Set([...Object.keys(scene),'review']),families:new Set(Object.values(scene).map(s=>s.type))};
if(typeof module!=='undefined')module.exports=api;else root.FoundationVisuals=api;
})(typeof window!=='undefined'?window:globalThis);
