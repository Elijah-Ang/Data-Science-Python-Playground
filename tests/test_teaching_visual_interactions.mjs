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
assert.deepEqual(foundations.exploration('count-bars','sum').data.groups.map(g=>g.value),[12,10,24]);
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

// Actual Euclidean distances change neighbourhood membership and the winning vote.
for(const [k,prediction] of [[1,'B'],[3,'A'],[5,'B']]){
  const result=ml.exploration('C08',String(k));
  assert.equal(result.data.prediction,prediction);
  assert.equal(result.data.votes.A+result.data.votes.B,k);
  assert.equal(result.data.count,6);
  assert.equal(result.data.neighbours.length,k);
  for(const neighbour of result.data.neighbours)close(neighbour.distance,Math.hypot(neighbour.x,neighbour.y));
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
  const {data}=ml.exploration('C10',value);
  close(data.margin,1/data.weight);
  const objective=w=>.5*w*w+data.C*data.rows.reduce((sum,r)=>sum+Math.max(0,1-w*Math.abs(r.x)),0);
  for(let w=0;w<=1.25;w+=.001)assert(objective(data.weight)<=objective(w)+1e-8);
  assert(data.rows.every(r=>(r.x<0?'A':'B')===r.group));
}
assert(ml.exploration('C11','1').summary.includes('does not simulate gamma or an RBF fit'));

// Known quadratic is recovered; displayed curves use their fitted coefficients.
const exact=Array.from({length:8},(_,x)=>[x,2+3*x+.5*x*x]);
const coefficients=ml.polynomialFit(exact,2);
coefficients.forEach((c,i)=>close(c,[2,3,.5][i]));
let previousError=Infinity;
for(const degree of [1,2,4]){
  const {data,summary}=ml.exploration('R07',String(degree));
  assert(data.trainRMSE<=previousError+1e-8);
  previousError=data.trainRMSE;
  for(const [x,y] of data.points)close(y,data.coefficients.reduce((sum,c,i)=>sum+c*x**i,0));
  const validation=Math.sqrt(ml.exampleRows.polynomialValidation.reduce((sum,[x,y])=>sum+(y-data.coefficients.reduce((s,c,i)=>s+c*x**i,0))**2,0)/5);
  close(data.validationRMSE,validation);
  assert(summary.includes('No final test rows'));
}

// All PCA coordinates use one orthonormal rotation fitted to all six centered rows.
for(const row of ml.exampleRows.pca){
  const {data}=ml.exploration('P01',row.id);
  assert.equal(data.scores.length,6);
  assert.equal(data.score.id,row.id);
  const [u,v]=data.weights;
  close(u[0]**2+u[1]**2,1);close(v[0]**2+v[1]**2,1);close(u[0]*v[0]+u[1]*v[1],0);
  for(const original of ml.exampleRows.pca){
    const score=data.scores.find(r=>r.id===original.id),cx=original.x-data.means[0],cy=original.y-data.means[1];
    close(score.pc1,cx*u[0]+cy*u[1]);close(score.pc2,cx*v[0]+cy*v[1]);
    close(score.pc1**2+score.pc2**2,cx**2+cy**2);
  }
}

// Native controls remain labelled, preserve a starting result, and announce changes.
for(const [visuals,visual] of [[foundations,foundations.spec('histogram')],[ml,{id:'C08'}]]){
  const html=visuals.interactive(visual);
  assert(html.includes('<label'));
  assert(html.includes('<select'));
  assert(html.includes('Starting view'));
  assert(html.includes('aria-live="polite"'));
  assert(html.includes('Illustrative'));
  const listeners=[];const container={addEventListener:(event,handler)=>listeners.push([event,handler])};
  visuals.mount(container);visuals.mount(container);
  assert.equal(listeners.length,1);
  let result='';const output={set innerHTML(value){result=value;}};
  const section={dataset:{foundationExplorer:'histogram',mlExplorer:'C08'},querySelector:()=>output};
  const control={value:visuals===foundations?'wide':'5',closest:()=>section};
  listeners[0][1]({target:{closest:()=>control}});
  assert(result.includes(visuals===foundations?'[0, 4)':'predicted class B'));
}
assert.throws(()=>foundations.exploration('histogram','unknown'));
assert.throws(()=>ml.exploration('C08','7'));
console.log('Teaching visuals: data conservation, statistics, neighbour voting, tree paths, SVM margins, fitted curves, PCA transforms and accessible delegated interactions verified.');
