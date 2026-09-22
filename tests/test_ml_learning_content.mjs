import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {productionInventory} from '../scripts/ml-production.mjs';
const c=JSON.parse(execFileSync('python3',['ml-learning/authoring.py'],{encoding:'utf8',maxBuffer:20*1024*1024}));
const ids=new Set(),coreModels=new Set();
for(const card of c.cards){
  assert(!ids.has(card.id));ids.add(card.id);
  for(const key of ['title','goal','explanation','syntax','visual','sources','chapter'])assert(card[key],card.id+' missing '+key);
  assert(card.sources.length);
  if(card.kind==='teaching')assert(card.exercises.length>=2&&card.exercises.length<=4);
  for(const model of card.models)if(card.tier==='core')coreModels.add(model);
  for(const e of card.exercises){
    assert(e.task&&e.solution&&e.hints, e.id+' missing teaching content');
    if(e.kind==='python')assert(e.checks.length&&e.dataset&&e.outputs.length);
    if(e.kind==='decision')assert(e.options.length>=2&&e.correct.every(i=>i>=0&&i<e.options.length));
  }
}
assert.deepEqual([...coreModels].sort(),Object.keys(productionInventory().MODELS).sort());
for(const ch of c.challenges){
  assert(ch.prerequisites.every(id=>ids.has(id)));
  assert(ch.inputs.length&&ch.deliverables.length&&ch.reference&&ch.explanationSteps.length);
  assert(!ch.exercise.starter.includes('fit('),'Challenges cannot start with a solution-shaped scaffold');
  assert.equal(ch.exercise.preload,false);
}
const scaling=c.cards.find(x=>x.id==='ML-W03');assert.deepEqual(scaling.prerequisites,['ML-F-K1']);
const checkpoint=c.cards.find(x=>x.id==='ML-W-K1');
assert(checkpoint.exercises[0].solution.includes('LinearRegression'));
assert(!checkpoint.exercises[0].solution.includes('max_depth'));
console.log(c.cards.length+' cards, '+c.cards.reduce((n,x)=>n+x.exercises.length,0)+' exercises, '+c.challenges.length+' challenges; all production models taught in Core.');
