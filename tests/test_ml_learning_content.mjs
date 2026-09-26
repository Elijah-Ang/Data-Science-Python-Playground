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
    assert.equal(card.exercises[0].kind,'python',card.id+' must introduce a runnable Python skill');
    assert(card.pythonSkill.length>20,card.id+' must name its Python skill');
    assert.equal(card.exercises[0].label,'Follow');
    assert.equal(card.exercises[0].starter,card.exercises[0].solution,card.id+' Follow should run before learners adapt it');
    assert.equal(card.exercises[1].label,'Change');
    assert(card.exercises.length>=3&&card.exercises.length<=4);
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
  assert(ch.workflowSteps.length>=7,ch.id+' needs the complete playground sequence');
  assert.equal(ch.workflowSteps[0].id,'frame');
  assert(ch.playgroundRoute.dataset&&ch.playgroundRoute.scenario);
  if(ch.family!=='clustering'&&ch.family!=='pca')assert.equal(ch.workflowSteps.at(-1).id,'final');
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

// Small exercises name their output variables; complete workflows show a
// separate variable contract beside the brief.
for(const e of all.filter(e=>e.kind==='python'&&!e.contract)){
  for(const name of e.outputs.filter(name=>!['answer','X','y','X_train','X_test'].includes(name)))
    assert(e.task.includes(name),e.id+' hides output '+name);
}
for(const challenge of c.challenges){
  const contractNames=new Set(challenge.exercise.contract.map(item=>item.name));
  for(const name of challenge.exercise.outputs)
    assert(contractNames.has(name),challenge.id+' hides output '+name);
}
for(const [id,names] of Object.entries({
  'ML-F05-2':['original_rmse','shifted_rmse'],
  'ML-W02-2':['model_rmse','reference_rmse'],
  'ML-W10-1':['fit_intercept','distance_coefficient'],
  'ML-W14-1':['train','test'],
  'ML-R01-1':['slope','intercept'],
  'ML-R02-1':['rmse','r2'],
  'ML-R02-3':['evaluation_mean','training_mean'],
  'ML-R-R1-2':['evaluation_mean','training_mean'],
  'ML-R09-2':['leaf','prediction'],
  'ML-R11-1':['slope','training_r2'],
  'ML-C02-1':['precision_b','recall_b'],
  'ML-C03-2':['macro_f1','accuracy'],
  'ML-C03-3':['macro_f1','accuracy'],
  'ML-C14-1':['leaf','label'],
  'ML-N05-1':['iterations_used','iteration_limit'],
  'ML-N06-1':['layers','alpha'],
  'ML-U02-2':['raw_distance','scaled_distance'],
  'ML-U03-2':['cluster','distance'],
  'ML-U08-2':['sizes_2','sizes_4'],
  'ML-P04-2':['retained_80','retained_95'],
  'ML-P-R1-1':['retained_80','retained_95'],
  'ML-P06-2':['retained_scores','view_2d'],
})){
  const e=all.find(ex=>ex.id===id);
  assert.deepEqual(e.outputs,names,id+' named results');
  for(const name of names)assert(e.task.includes(name),id+' hides '+name);
  assert(e.checks.every(check=>!check.test.includes("answer[")),id+' retains a hidden dictionary contract');
}

const evidenceTable=all.find(e=>e.id==='ML-M03-1');
assert(evidenceTable.task.includes('4.2')&&evidenceTable.task.includes('0.8'));
assert(!evidenceTable.solution.includes("'role'"),'The report exercise should not invent a role column.');
const hierarchy=c.challenges.find(ch=>ch.id==='ML-X18');
assert(hierarchy.exercise.checks.some(check=>check.name==='Cut comparison'));
for(const ch of c.challenges.filter(ch=>ch.family!=='clustering'&&ch.family!=='pca')){
  assert(!ch.reference.includes('training_summary='),ch.id+' should omit unrequested table summaries');
  assert(!/\n(?:preprocessor|pipeline)\n/.test(ch.reference),ch.id+' should omit Playground display expressions');
}

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

for(const card of c.cards.filter(c=>c.kind==='teaching')){
  if(card.exercises.at(-1).modelBridge){
    assert.equal(card.exercises.at(-1).label,'Apply',card.id);
    assert.equal(card.exercises.at(-2).label,'Transfer',card.id);
  }else assert.equal(card.exercises.at(-1).label,'Transfer',card.id);
}
