import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const foundations=require('../foundations/visuals.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../ml-learning/visuals.js',import.meta.url),'utf8'),context);
const ml=context.window.MLLearningVisuals;
const close=(actual,expected,epsilon=1e-8)=>assert(Math.abs(actual-expected)<epsilon,`${actual} ≈ ${expected}`);
const ids=rows=>rows.map(r=>r.id).sort();

// Each changed histogram binning contains the same observations exactly once.
for(const choice of ['wide','narrow','shifted']){
  const {data,summary,code}=foundations.exploration('histogram',choice);
  assert.equal(data.count,9);
  assert.deepEqual(data.bins.flatMap(b=>b.rows).sort(),ids(foundations.exampleRows));
  assert(summary.includes('final right edge'));
  assert(code.includes(`bins=[${data.edges.join(', ')}]`));
}
assert.deepEqual(foundations.exploration('histogram','wide').data.bins.map(b=>b.rows.length),[5,3,0,0,1]);
assert.deepEqual(foundations.exploration('histogram','narrow').data.bins.map(b=>b.rows.length),[1,4,1,2,0,0,0,0,0,1]);
for(const row of foundations.exampleRows){
  const result=foundations.exploration('scatter',row.id);
  assert.deepEqual(result.data.point,[row.x,row.value]);
  assert.equal(result.data.count,9);
  assert(result.svg.includes(`data-row="${row.id}"`));
}
assert.deepEqual(foundations.exploration('count-bars','count').data.groups.map(g=>g.value),[3,2,4]);
assert.deepEqual(foundations.exploration('mean-bars','mean').data.groups.map(g=>g.value),[4,5,6]);
for(const group of ['A','B','C']){
 const result=foundations.exploration('count-bars','count-'+group);
 assert.equal(result.data.trace,group);
 assert.deepEqual(result.data.groups.map(g=>g.value),[3,2,4]);
 assert(!result.code.includes('order='),'Count tracing does not introduce ordering.');
}
assert.deepEqual(foundations.exploration('summary-order','descending').data.groups.map(g=>[g.group,g.value]),[['C',6],['B',5],['A',4]]);
assert.deepEqual(foundations.exploration('summary-order','ascending',{statistic:'median'}).data.groups.map(g=>[g.group,g.value]),[['C',2.5],['A',4],['B',5]]);
assert(foundations.interactive({...foundations.spec('mean-bars'),statistic:'median'}).includes('value="median" selected'));
assert(foundations.diagram({...foundations.spec('scatter-dimensions'),sizeEncoding:false}).includes('constant point size'));
assert(!foundations.diagram({...foundations.spec('scatter-dimensions'),sizeEncoding:false}).includes('magnitude = size'));
assert(foundations.diagram({...foundations.spec('exact-bars'),summaryStatistic:'mean'}).includes('Mean value'));
const box=foundations.exploration('boxplot','box').data;
assert.deepEqual([box.q1,box.median,box.q3],[2,3,6]);
assert.deepEqual(box.whiskers,[1,7]);
assert.deepEqual(box.fences,[-4,12]);
assert.deepEqual(box.outliers,['r9']);
const reference=foundations.exploration('references','both').data;
assert.deepEqual([reference.medianX,reference.medianValue],[3,3]);
const facets=foundations.exploration('facets','groups').data;
assert.deepEqual(facets.panels.flatMap(p=>p.rows).sort(),ids(foundations.exampleRows));
assert.deepEqual(facets.panels.map(p=>p.rows.length),[3,2,4]);

// Follow interactions vary the taught argument while retaining observations,
// coordinates and quantitative scales. The preview never substitutes new data.
const densities=[.5,1,2].map(n=>foundations.exploration('density',String(n)));
for(const [i,result] of densities.entries()){
 assert.deepEqual(result.data.values,foundations.exampleRows.map(row=>row.value));
 assert.deepEqual(result.data.yDomain,[0,.2]);
 assert(result.code.includes(`bw_adjust=${[.5,1,2][i]}`));
 assert(result.data.curve.every(([,density])=>density>=0&&density<=.2));
}
const strip=[false,true].map(jitter=>foundations.exploration('strip',jitter?'0.15':'False'));
assert.deepEqual(strip[0].data.rows,strip[1].data.rows);
assert.deepEqual(strip[0].data.marks.map(row=>row.y),strip[1].data.marks.map(row=>row.y));
assert.notDeepEqual(strip[0].data.marks.map(row=>row.x),strip[1].data.marks.map(row=>row.x));
for(const size of ['3','5','7']){
 const result=foundations.exploration('swarm',size);
 assert.equal(result.data.count,6);
 for(let i=0;i<result.data.marks.length;i++)for(let j=0;j<i;j++){
  const a=result.data.marks[i],b=result.data.marks[j];
  assert(Math.hypot(a.x-b.x,a.y-b.y)>=2*Number(size),'Swarm circles cannot overlap.');
 }
}
const pairs=['colour','shape','size'].map(choice=>foundations.exploration('scatter-dimensions',choice));
for(const result of pairs)assert.deepEqual(result.data.marks.map(({id,x,value,group})=>({id,x,value,group})),foundations.exampleRows.map(({id,x,value,group})=>({id,x,value,group})));
assert(pairs[0].data.marks.every(row=>row.radius===4));
assert(pairs[1].data.marks.every(row=>row.radius===4));
for(const row of pairs[2].data.marks)close(row.area,18+(row.value-1)/17*54);
assert(!foundations.interactive({...foundations.spec('scatter-dimensions'),sizeEncoding:false}).includes('value="size"'),'Follow style teaching has no later size control.');
for(const variant of ['line','point-interval','violin']){
 const choices={line:['none','o'],'point-interval':['none','sd'],violin:['quart','point']}[variant];
 const results=choices.map(choice=>foundations.exploration(variant,choice));
 assert.deepEqual(results[0].data.rows||results[0].data.groups,results[1].data.rows||results[1].data.groups);
 assert.notEqual(results[0].svg,results[1].svg);
}
const components=['zero','first'].map(choice=>foundations.exploration('stacked',choice));
assert.deepEqual(components[0].data.first,components[1].data.first);
assert.deepEqual(components[0].data.second,components[1].data.second);
assert.deepEqual(components[0].data.bottom,[0,0,0]);
assert.deepEqual(components[1].data.bottom,components[1].data.first);

// Actual Euclidean distances change neighbourhood membership and the winning vote.
for(const [k,prediction] of [[1,'B'],[3,'A'],[5,'A']]){
  const result=ml.exploration('C08',String(k));
  assert.equal(result.data.prediction,prediction);
  assert.equal(result.data.votes.A+result.data.votes.B,k);
  assert.equal(result.data.count,9);
  assert.equal(result.data.neighbours.length,k);
  for(const neighbour of result.data.neighbours)close(neighbour.distance,Math.hypot(neighbour.x/result.data.scale[0],neighbour.y/result.data.scale[1]));
  assert(result.code.includes(`n_neighbors=${k}`));
}
for(const row of ml.exampleRows.tree){
  const result=ml.exploration('C14',row.id);
  assert.equal(result.data.prediction,row.group);
  assert.equal(result.data.conditions.length,row.width<=5?1:2);
  assert(result.svg.includes('viewBox="0 0 340 235"'));
}
for(const row of ml.exampleRows.regression){
  const result=ml.exploration('R09',row.id).data;
  close(result.prediction,result.leaf.reduce((sum,r)=>sum+r.y,0)/result.leaf.length);
  close(result.residual,row.y-result.prediction);
}

// The analytic linear soft-margin solution minimises the SVM primal objective.
for(const value of ['0.05','0.2','1']){
  const {data}=ml.exploration('C10',value,{kernel:'linear'});
  close(data.margin,1/data.weight);
  const objective=w=>.5*w*w+data.C*data.rows.reduce((sum,r)=>sum+Math.max(0,1-w*Math.abs(r.x)),0);
  for(let w=0;w<=1.25;w+=.001)assert(objective(data.weight)<=objective(w)+1e-8);
  assert(data.rows.every(r=>(r.x<0?'A':'B')===r.group));
}
for(const [id,choices] of [['C10',['0.5','1','10']],['C11',['0.5','2','10']],['C11-gamma',['0.1','1','10']]])for(const choice of choices){
 const result=ml.exploration(id,choice);assert.equal(result.data.kernel,'rbf');assert(result.code.includes('kernel="rbf"'));assert.equal(result.data.support.length,result.data.supportCounts.reduce((a,b)=>a+b));assert(!result.summary.includes('linear calculation'));
}
for(const [id,choices] of [['R10',['3','5','None']],['R10-leaf',['1','5','10']]])for(const choice of choices){const r=ml.exploration(id,choice);assert(r.code.includes(`${r.data.parameter}=${choice}`));assert(r.data.leaves>=1);}
assert(!ml.interactive({id:'P06'}));

// Known quadratic is recovered; displayed curves use their fitted coefficients.
const exact=Array.from({length:8},(_,x)=>[x,2+3*x+.5*x*x]);
const coefficients=ml.polynomialFit(exact,2);
coefficients.forEach((c,i)=>close(c,[2,3,.5][i]));
let previousError=Infinity;
for(const degree of [1,2,4]){
  const {data,summary}=ml.exploration('R08',String(degree));
  assert(data.alpha===1&&data.scaled);
  previousError=data.trainRMSE;
  for(const [x,y] of data.points)close(y,data.coefficients.reduce((sum,c,i)=>sum+c*x**i,0));
  const validation=Math.sqrt(ml.exampleRows.polynomialValidation.reduce((sum,[x,y])=>sum+(y-data.coefficients.reduce((s,c,i)=>s+c*x**i,0))**2,0)/5);
  close(data.validationRMSE,validation);
  assert(summary.includes('No final test rows'));
}

// All PCA coordinates use one orthonormal rotation after the Follow scaler.
for(const row of ml.exampleRows.pca){
  const {data}=ml.exploration('P01',row.id);
  assert.equal(data.scores.length,6);
  assert.equal(data.score.id,row.id);
  const [u,v]=data.weights;
  close(u[0]**2+u[1]**2,1);close(v[0]**2+v[1]**2,1);close(u[0]*v[0]+u[1]*v[1],0);
  for(const original of ml.exampleRows.pca){
    const score=data.scores.find(r=>r.id===original.id),cx=(original.x-data.means[0])/data.scales[0],cy=(original.y-data.means[1])/data.scales[1];
    close(score.pc1,cx*u[0]+cy*u[1]);close(score.pc2,cx*v[0]+cy*v[1]);
    close(score.pc1**2+score.pc2**2,cx**2+cy**2);
  }
}

// Native controls remain labelled, keep one concise current result, and announce changes.
for(const [visuals,visual] of [[foundations,foundations.spec('histogram')],[ml,{id:'C08'}]]){
  const html=visuals.interactive(visual);
  assert(html.includes('<label'));
  assert(html.includes('<select'));
  assert(!html.includes('Comparison baseline'),'Keep one concise current result.');
  assert(html.includes('aria-live="polite"'));
  assert(html.includes('Illustrative'));
  const listeners=[];const container={addEventListener:(event,handler)=>listeners.push([event,handler])};
  visuals.mount(container);visuals.mount(container);
  assert.equal(listeners.length,1);
  let result='';const output={set innerHTML(value){result=value;}};
  const section={dataset:{foundationExplorer:'histogram',mlExplorer:'C08'},querySelector:()=>output};
  const control={value:visuals===foundations?'wide':'5',closest:()=>section};
  listeners[0][1]({target:{closest:()=>control}});
  assert(result.includes(visuals===foundations?'[0, 4)':'predicted class A'));
}
assert.throws(()=>foundations.exploration('histogram','unknown'));
assert.throws(()=>ml.exploration('C08','7'));
console.log('Teaching visuals: data conservation, statistics, neighbour voting, tree paths, SVM margins, fitted curves, PCA transforms and accessible delegated interactions verified.');

// A bin count passes the same integer to Python and uses the actual data range.
for(const choice of ['2','4','8']){const r=foundations.exploration('histogram',choice);assert.equal(r.data.bins.length,Number(choice));assert.equal(r.data.count,9);assert.equal(r.data.edges[0],1);assert.equal(r.data.edges.at(-1),18);assert(r.code.includes(`bins=${choice}`));}
const c=require('../foundations/curriculum.js');
for(const [id,variant] of Object.entries(foundations.activityVariants))assert.equal(c.lessons.flatMap(l=>l.rounds).find(r=>r.id===id).visual.variant,variant,id);
for(const [index,binMode] of [[0,'count'],[1,'count'],[2,'edges']]){const r=c.lessons.find(l=>l.id==='V04').rounds[index];assert.equal(r.visual.binMode,binMode);const html=foundations.interactive(r.visual);assert(!html.includes('Width '));assert.equal(html.includes('Number of bins'),index<2);}
const count=c.lessons.find(l=>l.id==='V08').rounds[0];assert(foundations.interactive(count.visual).includes('value="count-A" selected'));
assert.deepEqual(count.visual.choices,['count-A','count-B','count-C']);
assert(!foundations.interactive(count.visual).includes('order='),'Follow count interaction does not teach the Change order argument early.');
const parameters=require('../foundations/parameter-guide.js');
for(const l of c.lessons)for(const r of l.rounds){const g=parameters.guidanceFor(c,l,r);for(const entry of [...g.introduces,...g.extends])assert(parameters.valueChoices(entry).includes('Accepts:'),r.id+' '+entry.id);}
const bins=parameters.renderCurrent(c,c.lessons.find(l=>l.id==='V04'),c.lessons.find(l=>l.id==='V04').rounds[0]);assert(bins.includes('[0, 2, 4, 6]'));assert(bins.includes('four equal-width bins'));
const estimator=parameters.renderCurrent(c,c.lessons.find(l=>l.id==='V09'),c.lessons.find(l=>l.id==='V09').rounds[0]);assert(estimator.includes('mode_value'));assert(estimator.includes('pd.Series(values).mode().iloc[0]'));assert(!estimator.includes('estimator=&quot;mode&quot;'));

assert(parameters.valueChoices({...parameters.registry.x,functions:['sns.scatterplot']}).includes('data-code-role="column"'));
assert(parameters.valueChoices({...parameters.registry.ax,functions:['sns.scatterplot']}).includes('data-code-role="variable"'));
assert(parameters.valueChoices({...parameters.registry.bins,functions:['sns.histplot']}).includes('data-code-role="syntax"'));

for(const degree of [1,2,3,4]){const r=ml.exploration('R07',String(degree));assert(!r.code.includes('Ridge'));assert(!r.code.includes('LinearRegression'));assert(!r.code.includes('make_pipeline'));assert(r.data.rows.every(row=>row.slice(1).every((v,i)=>Math.abs(v-row[0]**(i+1))<1e-9)));}
assert(!foundations.exploration('mean-bars','mean').code.includes('ax.bar'));
assert(foundations.exploration('mean-bars','mean').code.includes('sns.barplot'));
assert(!foundations.exploration('boxplot','box').code.includes('subplots'));
assert(!foundations.exploration('boxplot','raw').code.includes('stripplot'));
