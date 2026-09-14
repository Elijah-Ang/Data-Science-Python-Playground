import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url), c=require('../foundations/curriculum.js');
assert.equal(c.lessons.length,104);
assert.equal(c.lessons.filter(l=>l.review).length,17);
assert.equal(c.lessons.reduce((n,l)=>n+l.rounds.length,0),320);
for(const [prefix,count] of [['I',22],['W',31],['V',37]])for(let n=1;n<=count;n++)assert(c.lessons.some(l=>l.id===prefix+String(n).padStart(2,'0')));
assert.equal(new Set(c.lessons.flatMap(l=>l.rounds.map(r=>r.id))).size,320);
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
 let gap=0;for(const l of c.lessons.filter(x=>x.deck===d.id)){if(l.review)gap=0;else gap++;assert(gap<=6,l.id);}
}
const page=fs.readFileSync(new URL('../playground.html',import.meta.url),'utf8');
assert.equal((page.match(/href="data-foundations.html"/g)||[]).length,1);
for(const file of ['index.html','ml.html','statistics.html'])assert(!fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').includes('data-foundations.html'),file);
console.log('Foundations: 104 ordered cards, 320 unique exercises, complete I/W/V IDs, valid tiny tables, review spacing and Data-only navigation.');
