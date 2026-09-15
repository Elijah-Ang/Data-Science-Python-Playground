import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url), c=require('../foundations/curriculum.js');
assert.equal(c.lessons.length,106);
assert.equal(c.lessons.filter(l=>l.review).length,17);
assert.equal(c.lessons.reduce((n,l)=>n+l.rounds.length,0),326);
for(const [prefix,count] of [['I',22],['W',31],['V',37]])for(let n=1;n<=count;n++)assert(c.lessons.some(l=>l.id===prefix+String(n).padStart(2,'0')));
assert.equal(new Set(c.lessons.flatMap(l=>l.rounds.map(r=>r.id))).size,326);
for(const [key,d] of Object.entries(c.datasets)){
 const lengths=Object.values(d.columns).map(v=>v.length);assert(lengths.every(n=>n===lengths[0]&&n>=4&&n<=10),key);
}
for(const l of c.lessons){
 assert(l.rounds.length>=3,l.id);assert(c.decks.find(d=>d.id===l.deck)?.chapters[l.chapter],l.id);
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
console.log('Foundations: 106 ordered cards, 326 unique exercises, complete I/W/V IDs, valid tiny tables, review spacing and Data-only navigation.');

const taskReviews=JSON.parse(fs.readFileSync(new URL('../docs/foundations-task-review.json',import.meta.url),'utf8')).exercises;
const visuals=require('../foundations/visuals.js');
assert.equal(c.lessons[c.lessons.findIndex(l=>l.id==='I01')+1].id,'I01CSV');
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
