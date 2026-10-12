import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),c=require('../foundations/curriculum.js');
const teaching=require('../foundations/teaching.js');
globalThis.FoundationVisuals=require('../foundations/visuals.js');
const lesson=id=>c.lessons.find(l=>l.id===id),position=id=>c.lessons.indexOf(lesson(id));
const inserted=['I06S','I13L','I19S','I19A'];
for(const [before,after] of [['I06','I06S'],['I13','I13L'],['I19','I19S'],['I19S','I19A']]){
 assert.equal(position(after),position(before)+1,after+' follows the skill it builds on');
}
assert.equal(lesson('I19S').level,'Core','The category-order prerequisite must not be optional');
for(const item of c.prerequisiteTeaching.concepts){
 for(const consumer of item.consumers)assert(position(item.taughtBy)<position(consumer),item.id+' is taught before '+consumer);
}
assert.equal(inserted.flatMap(id=>lesson(id).rounds).length,12);
for(const id of inserted){
 const l=lesson(id);
 assert(l.guide.exampleOutput?.rows.length,id+' shows a concrete result');
 assert(l.syntaxCode&&l.explanation&&l.rounds[0].starter.includes('____'),id);
 assert.deepEqual(l.rounds.map(r=>r.label),['Follow','Change','Transfer']);
 for(const r of l.rounds){
  const html=teaching.intro(c,l,r)+teaching.syntax(l)+teaching.transition(r);
  assert(!html.includes('<details'),r.id+' required teaching remains visible');
  assert(html.includes('A small example')&&html.includes('Concept sketch:'),r.id);
 }
}
const bridge=lesson('V13').rounds[2];
const bridgeHTML=teaching.transition(bridge);
assert(bridgeHTML.includes('Build the category order from a grouped Series'));
assert(bridgeHTML.includes('ranked.index')&&bridgeHTML.includes('median numbers'));
for(const id of ['I06S','I19S'])assert(bridgeHTML.includes('href="data-foundations-'+id+'.html"'));
assert(lesson('V13').rounds[2].solution.includes('.median().sort_values().index'),'Retain the genuine application rather than removing the prerequisite');
for(const [consumer,source] of [['I22','I19A'],['W20','I19A'],['V28','I13L'],['V29','I19S']]){
 assert(teaching.intro(c,lesson(consumer),lesson(consumer).rounds[0]).includes('data-foundations-'+source+'.html'),consumer+' has a usable earlier-teaching link');
}
const baseline=JSON.parse(fs.readFileSync(new URL('../challenges/foundations-baseline.json',import.meta.url))).previousPrerequisiteInventory;
assert(baseline,'Keep the verified prior activity inventory');
const original=new Set(baseline.lessonInventory.flatMap(l=>l.rounds));
const current=new Set(c.lessons.flatMap(l=>l.rounds.map(r=>r.id)));
for(const id of original)assert(current.has(id),'Preserve original activity '+id);
assert.equal(original.size,326);
assert.equal(current.size-original.size,12);
assert.equal(c.lessons.filter(l=>l.deck==='visualise').length,43);
assert.equal(c.lessons.filter(l=>l.deck==='visualise').flatMap(l=>l.rounds).length,132);
console.log('Prerequisites: four ordered lessons, twelve practices, concrete examples, earlier teaching links and all original 326 activity identities preserved.');
