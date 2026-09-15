/* Deterministic, reusable concept diagrams. No images, network, or animations. */
(function(root){
'use strict';
const types=new Set('annotation bars before-after-table boxen boxplot canvas challenge chart-labels clean-text column-types csv-table date-values density drop-missing dropped-column duplicate-rows ecdf encoded-categories figure-export fill-missing filtered-table group-broadcast group-collapse heatmap histogram joint-grid labelled-row line line-band merge-tables mini-table missing-cells mixed-charts multi-panel new-column pair-grid point-interval reference-lines regression renamed-table reshape-table reshape-wide residual rug scaled-values scatter selected-column selected-columns selected-row sorted-table stack-tables stacked-bars strip summary-table swarm table-labels table-shape unique-values vectorised-values violin'.split(' '));
const families=new Set(['table','table-transform','bars','distribution','relationship','matrix','panels','values','figure']);
const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=(x,y,w,h,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const path=(d,cls='')=>`<path d="${d}" class="${cls}"/>`;
const text=(x,y,value)=>`<text x="${x}" y="${y}">${escape(value)}</text>`;
const dot=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" class="visual-fill"/>`;
const axes=(x=25,y=15,w=205,h=65)=>path(`M${x} ${y}v${h}h${w}`);
function miniatureTable(x,y,w,headers,rows,highlight=()=>false){
 const cw=w/headers.length,rh=15;
 return headers.map((h,j)=>rect(x+j*cw,y,cw,rh,'visual-wash')+text(x+j*cw+4,y+11,h)).join('')+rows.map((row,i)=>row.map((v,j)=>rect(x+j*cw,y+(i+1)*rh,cw,rh,highlight(i,j)?'visual-selected':'visual-cell')+text(x+j*cw+4,y+(i+2)*rh-4,v)).join('')).join('');
}
function diagram(v){
 const t=v.variant||v.type;
 if(v.variant&&!families.has(v.type))throw new Error('Unknown visual family: '+v.type);
 if(!types.has(t))throw new Error('Unknown concept visual: '+t);
 let art='';
 const twoTables=['before-after-table','clean-text','date-values','group-collapse','merge-tables','reshape-table','stack-tables','csv-table','renamed-table','drop-missing','fill-missing','group-broadcast','reshape-wide','encoded-categories'].includes(t);
 if(twoTables){
  const variants={
   'before-after-table':[['raw','value'],[['A','2'],['B','4']],['copy','value'],[['A','4'],['B','8']]],
   'clean-text':[['raw'],[[' TEA '],['food-kit']],['clean'],[['tea'],['food kit']]],
   'date-values':[['text'],[['2026-06-01'],['not a date']],['date'],[['2026-06-01'],['NaT']]],
   'group-collapse':[['group','value'],[['A','2'],['A','4'],['B','3']],['group','mean'],[['A','3'],['B','3']]],
   'merge-tables':[['key','value'],[['A','2'],['B','4']],['key','value','tag'],[['A','2','Yes'],['B','4','NaN']]],
   'reshape-table':[['id','x','y'],[['A','2','4'],['B','3','5']],['id','var','value'],[['A','x','2'],['A','y','4'],['B','x','3'],['B','y','5']]],
   'stack-tables':[['batch','value'],[['one','2'],['two','4']],['row','value'],[['0','2'],['1','4'],['2','6']]],
   'csv-table':[['file.csv'],[['name,price'],['Milo,3'],['Luna,2']],['name','price'],[['Milo','3'],['Luna','2']]]
  };
  Object.assign(variants,{
   'renamed-table':[['price'],[['2'],['4']],['amount'],[['2'],['4']]],
   'drop-missing':[['row','price'],[['A','2'],['B','NaN'],['C','4']],['row','price'],[['A','2'],['C','4']]],
   'fill-missing':[['row','price'],[['A','2'],['B','NaN'],['C','4']],['row','price'],[['A','2'],['B','3'],['C','4']]],
   'group-broadcast':[['group','value'],[['A','2'],['A','4'],['B','8']],['group','mean'],[['A','3'],['A','3'],['B','8']]],
   'reshape-wide':[['id','var','value'],[['A','x','2'],['A','y','4'],['B','x','3']],['id','x','y'],[['A','2','4'],['B','3','NaN']]],
   'encoded-categories':[['label'],[['A'],['B'],['A']],['A','B'],[['1','0'],['0','1'],['1','0']]]
  });
  const [a,b,c,d]=variants[t];art=miniatureTable(5,17,104,a,b)+path('M114 43h25m-6-5 6 5-6 5')+miniatureTable(150,17,104,c,d,(i,j)=>j===c.length-1);
  if(t==='merge-tables')art+=text(14,91,'lookup: A → Yes');
 }else if(['mini-table','table-shape','table-labels','column-types','selected-column','selected-columns','selected-row','labelled-row','filtered-table','sorted-table','missing-cells','duplicate-rows','unique-values','summary-table','new-column','dropped-column'].includes(t)){
  let heads=['name','age','price'],rows=[['Milo','3','4.2'],['Luna','2','3.6'],['Rex','5','22']];
  if(t==='labelled-row'){heads=['label','name','price'];rows=[['A','Milo','4.2'],['B','Luna','3.6'],['C','Rex','22']];}
  if(t==='sorted-table')rows=[['Luna','2','3.6'],['Milo','3','4.2'],['Rex','5','22']];
  if(t==='missing-cells')rows[1][2]='NaN';
  if(t==='duplicate-rows')rows[2]=rows[0];
  if(t==='summary-table'){heads=['method','price'];rows=[['mean','9.93'],['median','4.2'],['count','3']];}
  if(t==='unique-values'){heads=['values','unique'];rows=[['A','A'],['A','B'],['B','']];}
  if(t==='column-types'){heads=['name','age','price'];rows=[['text','integer','decimal'],['Milo','3','4.2'],['Luna','2','3.6']];}
  if(t==='new-column'){heads=['price','qty','total'];rows=[['2','3','6'],['4','2','8'],['3','4','12']];}
  art=miniatureTable(12,12,236,heads,rows,(i,j)=>t.includes('column')?(v.highlight||[2]).includes(j):t==='missing-cells'?i===1&&j===2:t==='filtered-table'?i!==1:t==='labelled-row'?i>0:t==='selected-row'?i<2:t==='duplicate-rows'?i===2:t==='new-column'?j===2:false);
  const captions={'table-shape':'3 rows × 3 columns','selected-column':'one column → Series','selected-columns':'selected columns → DataFrame','selected-row':'keep these row positions','labelled-row':'select labels B through C','filtered-table':'keep matching rows','sorted-table':'age: 2 → 3 → 5','missing-cells':'NaN = missing, not zero','duplicate-rows':'same record appears twice','table-labels':'column names ↑','new-column':'price × qty → total'};
  if(t==='dropped-column')art+=path('M172 12l76 60m0-60-76 60','visual-dashed');
  if(t==='filtered-table')art+=path('M16 49h228','visual-muted');
  art+=text(13,92,captions[t]||'a small table, a clear question');
 }else if(t==='canvas'){
  art=rect(14,5,230,91)+axes(44,27,170,51)+text(20,19,'Figure')+text(100,53,'Axes');
 }else if(t==='joint-grid'){
  art=axes(25,35,157,55)+axes(25,5,157,23)+axes(190,35,40,55);
  [40,70,100,130,160].forEach((x,i)=>{art+=rect(x,28-(i%3+1)*6,20,(i%3+1)*6,'visual-fill')+dot(x,75-(i%3)*15);});
  [45,60,75].forEach((y,i)=>art+=rect(190,y,12+i*8,8,'visual-fill'));
 }else if(t==='heatmap'){
  for(let i=0;i<4;i++)for(let j=0;j<5;j++)art+=`<rect x="${45+j*34}" y="${9+i*20}" width="31" height="18" fill="currentColor" opacity="${.15+((i+j*2)%5)*.18}"/>`+text(57+j*34,22+i*20,1+(i+j*2)%5);
  art+=text(13,98,'matrix: values encoded cell by cell');
 }else if(['multi-panel','pair-grid','joint-grid','mixed-charts','challenge'].includes(t)){
  const n=t==='pair-grid'?3:2;
  for(let i=0;i<n;i++)for(let j=0;j<(t==='multi-panel'?1:n);j++){
   const x=15+i*(230/n),y=8+j*(78/n),w=210/n,h=t==='multi-panel'?66:65/n;
   art+=axes(x,y,w,h);
   if(i===j)for(let b=0;b<3;b++)art+=rect(x+9+b*w/4,y+h-(b+1)*h/5,w/5,(b+1)*h/5,'visual-fill');
   else art+=dot(x+w*.25,y+h*.6)+dot(x+w*.5,y+h*.3)+dot(x+w*.75,y+h*.45);
  }
  if(t==='challenge')art+=text(180,96,'Recall → use');
 }else if(t==='scaled-values'||t==='vectorised-values'){
  art=text(10,15,'raw')+text(153,15,t==='vectorised-values'?'× 1.1 on all rows':'scaled');[22,55,78].forEach((h,i)=>{art+=rect(10,25+i*20,h,10,'visual-wash')+rect(153,25+i*20,t==='vectorised-values'?h*1.1:20+i*25,10,'visual-fill');});art+=path('M103 51h34m-6-5 6 5-6 5');
 }else if(t==='figure-export'){
  art=axes(14,12,105,67)+path('M25 64 50 43 75 52 105 25','visual-bold')+path('M130 46h25m-6-5 6 5-6 5')+rect(169,13,65,70)+text(178,42,'.png')+path('M199 50v22m-7-7 7 7 7-7');
 }else{
  art=axes();
  if(['histogram','bars','stacked-bars'].includes(t)){
   [25,48,61,38,19].forEach((h,i)=>{art+=rect(40+i*34,80-h,t==='histogram'?34:29,h,'visual-fill');if(t==='stacked-bars')art+=rect(40+i*34,80-h-12-i*2,29,12+i*2,'visual-hatch');});
  }else if(['density','violin','boxen','boxplot','point-interval','strip','swarm'].includes(t)){
   if(t==='density')art+=path('M30 79C60 79 65 20 112 23S157 74 225 79','visual-bold');
   else if(t==='violin')art+=path('M130 15C170 30 167 61 130 78C93 61 90 30 130 15Z','visual-wash');
   else if(t==='boxplot'||t==='boxen'){art+=path('M55 47h145M55 35v24M200 35v24')+rect(95,25,65,44,'visual-wash')+path('M123 25v44','visual-bold');if(t==='boxen')art+=rect(78,34,97,26,'visual-wash');}
   else if(t==='point-interval'){[70,130,190].forEach((x,i)=>art+=path(`M${x} ${25+i*5}v35m-6 0h12m-6-35h-6m6 0h6`)+dot(x,42+i*5));}
   else [45,55,62,70,100,108,113,145,150,164,174,198].forEach((x,i)=>art+=dot(x,30+(i%4)*12));
  }else if(t==='ecdf')art+=path('M30 78h35V65h35V50h35V35h35V20h45','visual-bold');
  else if(t==='rug'){art+=path('M32 77C70 77 75 20 120 24S165 76 225 77');[55,80,95,104,122,148,170].forEach(x=>art+=path(`M${x} 69v11`));}
  else {
   const points=[[40,65],[65,47],[91,57],[116,33],[143,43],[170,22],[201,28]];
   if(['line','line-band','regression'].includes(t))art+=path(t==='regression'?'M35 69 212 18':'M'+points.map(p=>p.join(' ')).join('L'),'visual-bold');
   if(t==='line-band')art+=path('M40 53 65 36 91 46 116 23 143 30 170 12 201 16L201 39 170 33 143 55 116 43 91 69 65 59 40 76Z','visual-wash');
   points.forEach(([x,y],i)=>art+=dot(x,t==='residual'?46+(i%3-1)*16:y));
   if(t==='reference-lines'||t==='residual')art+=path('M25 46h205','visual-dashed');
   if(t==='annotation')art+=text(161,13,'Peak')+path('M176 16 170 22');
   if(t==='chart-labels')art+=text(95,96,'x label')+text(90,10,'Chart title');
  }
 }
 return `<svg class="concept-visual" viewBox="0 0 260 105" role="img" aria-label="${escape(v.label)}"><title>${escape(v.label)}</title><g>${art}</g></svg>`;
}
if(typeof module!=='undefined')module.exports={diagram,types,families};else root.FoundationVisuals={diagram,types,families};
})(typeof window!=='undefined'?window:globalThis);
