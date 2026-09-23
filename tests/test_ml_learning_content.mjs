import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {productionInventory} from '../scripts/ml-production.mjs';
const c=JSON.parse(execFileSync('python3',['ml-learning/authoring.py'],{encoding:'utf8',maxBuffer:20*1024*1024}));
const ids=new Set(),coreModels=new Set();
for(const card of c.cards){
  assert(!ids.has(card.id));ids.add(card.id);
  for(const key of ['title','goal','explanation','syntax','visual','sources','chapter'])assert(card[key],card.id+' missing '+key);
  assert(card.sources.length);
  if(card.kind==='teaching'){
    assert(card.exercises.length>=2&&card.exercises.length<=4);
    if(card.exercises.some(e=>e.kind==='python')){
      assert(Array.isArray(card.syntaxBreakdown)&&card.syntaxBreakdown.length,card.id+' syntax parts');
      for(const part of card.syntaxBreakdown){
        assert(card.syntax.includes(part.code),card.id+' syntax not shown: '+part.code);
        assert(part.meaning.length>20&&part.meaning!==card.explanation,card.id+' repeated concept');
      }
    }
  }
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
  assert.equal(ch.deliverableGroups.length,4);
  assert.deepEqual(ch.deliverableGroups.flatMap(g=>g.checks).sort(),ch.exercise.checks.map(x=>x.name).sort());
  assert.equal(ch.inputs[0].file,ch.exercise.inputFile);
  assert.equal(ch.exercise.dataset,ch.id);
  assert.deepEqual(ch.hints,ch.exercise.hints);
  assert(ch.explanationSteps.includes(ch.exercise.explanation));
}
const scaling=c.cards.find(x=>x.id==='ML-W03');assert.deepEqual(scaling.prerequisites,['ML-F-K1']);
const checkpoint=c.cards.find(x=>x.id==='ML-W-K1');
assert(checkpoint.exercises[0].solution.includes('LinearRegression'));
assert(!checkpoint.exercises[0].solution.includes('max_depth'));
console.log(c.cards.length+' cards, '+c.cards.reduce((n,x)=>n+x.exercises.length,0)+' exercises, '+c.challenges.length+' challenges; all production models taught in Core.');

const all=c.cards.flatMap(x=>x.exercises).concat(c.challenges.map(x=>x.exercise));
for(const e of all){
  for(const key of ['think','tools','approach'])assert(e.hints[key]?.length>10,e.id+' '+key);
  assert(e.explanation.length>50,e.id+' rationale');
  assert(!e.hints.tools.includes('Use the syntax on this card'),e.id+' boilerplate');
  assert(e.explanation!==e.hints.approach,e.id+' explanation repeats hint');
}
assert.equal(new Set(all.map(e=>JSON.stringify(e.hints))).size,all.length,'Each task needs its own help');

for(const e of all.filter(e=>e.kind==='python'))assert(e.packages.includes('numpy')&&e.packages.includes('pandas'));
assert.deepEqual(all.find(e=>e.id==='ML-F02-1').packages,['numpy','pandas']);
assert(!all.find(e=>e.id==='ML-F03-1').packages.includes('matplotlib'));
assert(all.find(e=>e.id==='ML-W01-1').packages.includes('matplotlib'));

// Fitting precedes residuals: its schematic must show the learning transition.
const visualContext={window:{}};
vm.runInNewContext(readFileSync('ml-learning/visuals.js','utf8'),visualContext);
const fitting=visualContext.window.MLLearningVisuals.render(c.cards.find(c=>c.id==='ML-F03').visual);
const residuals=visualContext.window.MLLearningVisuals.render(c.cards.find(c=>c.id==='ML-F05').visual);
for(const label of ['Observations X, y','Unfitted estimator','Fitted estimator','Learned line'])assert(fitting.includes(label));
assert(!/residual|actual −|predicted/i.test(fitting));
assert(residuals.includes('actual −')&&residuals.includes('Residuals measure signed vertical differences.'));
