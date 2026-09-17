import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url), c=require('../foundations/curriculum.js');
assert.equal(c.lessons.length,106);
assert.equal(c.lessons.filter(l=>l.review).length,17);
assert.equal(c.lessons.reduce((n,l)=>n+l.rounds.length,0),324);
for(const [prefix,count] of [['I',22],['W',31],['V',37]])for(let n=1;n<=count;n++)assert(c.lessons.some(l=>l.id===prefix+String(n).padStart(2,'0')));
assert.equal(new Set(c.lessons.flatMap(l=>l.rounds.map(r=>r.id))).size,324);
for(const [key,d] of Object.entries(c.datasets)){
 const lengths=Object.values(d.columns).map(v=>v.length);assert(lengths.every(n=>n===lengths[0]&&n>=4&&n<=10),key);
}
for(const l of c.lessons){
 assert(l.rounds.length>=(l.id==='V01'?1:3),l.id);assert(c.decks.find(d=>d.id===l.deck)?.chapters[l.chapter],l.id);
 assert(l.goal&&l.explanation,l.id);
 if(!l.review){assert(l.syntax.every(parts=>parts.length===2&&parts.every(Boolean)),l.id);assert(l.example,l.id);assert(l.rounds[0].starter.includes('____'),l.id);assert.notEqual(l.rounds[0].starter,l.rounds[0].solution,l.id);}
 for(const r of l.rounds){assert(c.datasets[r.dataset],r.id);assert(r.task&&r.hint&&r.solution&&r.starter,r.id);assert(!r.solution.includes('____'),r.id);assert(!/\{(?:a|b|c|d|id|name|cat|n|threshold)\}/.test(r.solution),r.id);}
}
for(const d of c.decks){
 let gap=0;for(const l of c.lessons.filter(x=>x.deck===d.id)){if(l.review)gap=0;else gap++;assert(gap<=7,l.id);}
}
const page=fs.readFileSync(new URL('../playground.html',import.meta.url),'utf8');
assert.equal((page.match(/href="data-foundations.html"/g)||[]).length,1);
for(const file of ['index.html','ml.html','statistics.html'])assert(!fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').includes('data-foundations.html'),file);
console.log('Foundations: 106 ordered cards, 324 unique exercises, complete I/W/V IDs, valid tiny tables, review spacing and Data-only navigation.');

const taskReviews=JSON.parse(fs.readFileSync(new URL('../docs/foundations-task-review.json',import.meta.url),'utf8')).exercises;
const visuals=require('../foundations/visuals.js');
assert.equal(c.lessons[c.lessons.findIndex(l=>l.id==='I02')+1].id,'I01CSV');
assert.equal(c.lessons[c.lessons.findIndex(l=>l.id==='I18')+1].id,'I18S');
for(const l of c.lessons){
 assert(['Core','Go Further','Review'].includes(l.level),l.id);
 assert(l.visual?.type&&l.visual.label,l.id);
 assert(visuals.diagram(l.visual).includes('role="img"'),l.id);
 if(!l.review)assert(l.syntaxCode&&l.rounds[0].starter.includes('____'),l.id);
 for(const r of l.rounds){
  const review=taskReviews[r.id];
  assert(review&&review.sha256===createHash('sha256').update(JSON.stringify([r.task,r.solution,c.datasets[r.dataset],r.requiredCalls||[],r.requiredKeywords||[],r.forbiddenCalls||[]])).digest('hex'),'Task review must be renewed: '+r.id);
  assert(/df|supplied|long table|empty Figure/.test(r.task),r.id);
  for(const call of r.requiredCalls||[])assert(r.task.includes(call.split(':').pop()),r.id);
 }
}
for(const key of ['messy_games','messy_pets']){
 assert(!Object.keys(c.datasets[key].columns).some(k=>['drink','size','tip'].includes(k)),key);
}
for(const id of ['V18','V19'])for(const r of c.lessons.find(l=>l.id===id).rounds){const d=c.datasets[r.dataset];assert(['day','hour'].includes(d.a));if(id==='V19')assert.equal(new Set(d.columns[d.a]).size,d.columns[d.a].length/2);}
for(const r of c.lessons.find(l=>l.id==='V30').rounds)assert(!r.solution.includes('* 0.6'));
console.log('Visual definitions, tiering, task review, stable inserted IDs, distinct schemas and meaningful chart data passed.');

for(const [id,focus] of Object.entries({W15:'.dt.',W16:'.dropna',V02:'ax.set',V24:'plt.subplots',V26:'set_xscale',V27:'ax.axvline',V28:'ax.annotate',V29:'ax.bar',V30:'bottom=first',V34:'fig.savefig'}))assert(c.lessons.find(l=>l.id===id).syntaxCode.includes(focus),id+' must isolate its new syntax');

// A coherent route, visible requirements and a purpose for each practice round.
const lesson=id=>c.lessons.find(l=>l.id===id);
const core=c.lessons.filter(l=>l.deck==='visualise'&&l.path==='core');
assert.equal(core[0].id,'V35');assert.equal(core.at(-1).id,'V37');
assert(core.findIndex(l=>l.id==='V16')<core.findIndex(l=>l.id==='V03'));
assert(!core.some(l=>l.level==='Go Further'));
for(const l of c.lessons){
 for(const r of l.rounds){
  assert(r.demand&&r.steps.length,r.id);
  assert(!/Return the Figure|Read the worked example/.test(r.task+' '+r.hint),r.id);
  if(r.retrieves)assert(c.lessons.indexOf(lesson(r.retrieves))<c.lessons.indexOf(l),r.id+' retrieves a later lesson');
 }
 if(!l.review){
  assert(new Set(l.rounds.map(r=>r.task)).size===l.rounds.length,l.id);
  assert(new Set(l.rounds.map(r=>r.solution)).size===l.rounds.length,l.id);
  if(l.id!=='W24'&&l.rounds[2])assert.equal(l.rounds[2].requiredCalls.length,0,l.id+' Transfer must allow equivalent methods');
 }
}
assert(lesson('V37').rounds[1].solution.includes('["temperature"].mean()'));
assert.equal(lesson('V37').rounds[1].steps.length,5);

// Visual regression checks target previously misleading concepts, not just SVG presence.
for(const l of c.lessons)for(const r of l.rounds){
 assert(visuals.diagram(r.visual).includes('Concept sketch:'),r.id);
 if(r.retrieves)assert.deepEqual(r.visual,c.lessons.find(x=>x.id===r.retrieves).rounds[2].visual,r.id);
}
for(const [a,b] of [['I02','I08'],['I12','I13'],['I15','I19'],['I17','W18'],['W07','W08'],['W12','W13'],['W14','W15'],['W21','W22'],['V08','V09'],['V09','V29'],['V13','V14'],['V16','V17'],['V24','V33']]){
 assert.notEqual(visuals.diagram(c.lessons.find(l=>l.id===a).visual),visuals.diagram(c.lessons.find(l=>l.id===b).visual),a+' / '+b);
}
const renderedTexts=variant=>[...visuals.diagram(visuals.spec(variant)).matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map(m=>({x:+m[1],y:+m[2],value:m[3]}));
for(const name of ['correlation','correlation-heatmap']){
 const cells=renderedTexts(name).filter(t=>t.x>=70&&t.y<80).map(t=>Number(t.value)).filter(Number.isFinite);
 assert.equal(cells.length,9);for(let i=0;i<3;i++)for(let j=0;j<3;j++){assert(Math.abs(cells[i*3+j])<=1);assert.equal(cells[i*3+j],cells[j*3+i]);if(i===j)assert.equal(cells[i*3+j],1);}
}
const swarm=[...visuals.diagram(visuals.spec('swarm')).matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map(m=>m.slice(1).map(Number));
for(let i=0;i<swarm.length;i++)for(let j=i+1;j<swarm.length;j++)assert(Math.hypot(swarm[i][0]-swarm[j][0],swarm[i][1]-swarm[j][1])>=swarm[i][2]+swarm[j][2],'Swarm observations must not overlap');
const sample=[10,11,12,13,14,40],quantile=p=>{const at=(sample.length-1)*p,lo=Math.floor(at);return sample[lo]+(sample[Math.ceil(at)]-sample[lo])*(at-lo);};
const q1=quantile(.25),q3=quantile(.75),fences=[q1-1.5*(q3-q1),q3+1.5*(q3-q1)];
for(const value of fences)assert(renderedTexts('iqr').some(t=>Number(t.value)===value),'IQR fence must agree with shown values');
const visualReviews=JSON.parse(fs.readFileSync(new URL('../docs/foundations-visual-review.json',import.meta.url),'utf8'));
for(const l of c.lessons){
 const fingerprint=createHash('sha256').update(JSON.stringify([visuals.diagram(l.visual),l.rounds.map(r=>visuals.diagram(r.visual))])).digest('hex');
 assert.equal(visualReviews[l.id],fingerprint,'Renew visual accuracy review for '+l.id);
}
console.log('Concept distinctions, signed symmetric correlations, swarm spacing, IQR fences and all visual review fingerprints passed.');

// Practical tasks cannot regress into typing predictions as Python results.
assert.equal(lesson('V01').rounds.length,1);
for(const l of c.lessons)for(const r of l.rounds){
 assert(!r.task.includes('predicted_rows'),r.id);
 if(l.id!=='V35'&&r.retrieves!=='V35')assert(!/^(?:True|False|None|[0-9]+|\([0-9, ]+\))$/.test(r.solution.trim()),r.id);
}
assert(lesson('I01CSV').rounds[1].files['cafe.csv'].includes(';'));
assert(lesson('I01CSV').rounds[2].solution.includes('.head()'));
assert(lesson('I01').rounds[1].solution.includes('\n    "price":'));
assert(lesson('I01').rounds[1].solution.includes('\n    "drink":'));
