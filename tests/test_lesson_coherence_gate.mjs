/* Public learner-facing coherence invariants, run after all source overlays. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const require=createRequire(import.meta.url);
const curriculum=require('../foundations/curriculum.js');
const teaching=require('../foundations/teaching.js');
const byId=new Map(curriculum.lessons.map(lesson=>[lesson.id,lesson]));
const all=curriculum.lessons.flatMap(lesson=>lesson.rounds);
assert.equal(all.length,338,'The 338 reviewed Foundations exercises are preserved');

for(const lesson of curriculum.lessons){
  assert(lesson.id&&lesson.title&&lesson.goal,lesson.id+' needs purpose and title');
  for(const round of lesson.rounds){
    assert(round.id&&round.dataset&&curriculum.datasets[round.dataset],round.id+' must use a real dataset');
    assert(round.task&&round.hint&&round.solution&&round.starter,round.id+' needs task, hint, reference and starter');
    assert(!round.solution.includes('____'),round.id+' reference contains a learner blank');
    assert(Array.isArray(round.steps)&&round.steps.length,round.id+' has no action');
    if(round.brief){
      assert(round.brief.question&&round.brief.rows&&round.brief.result,round.id+' incomplete objective');
      for(const instruction of round.brief.preparation||[]){
        assert(instruction.length>18,round.id+' preparation instruction too vague');
        assert(!/these data are useful because/i.test(instruction),round.id+' contains authoring rationale');
      }
    }
  }
}
// Test the actual display-only transformations against assembled exercises,
// while requiring the underlying reviewed curriculum to remain unchanged.
const appSource=readFileSync(new URL('../foundations/app.js',import.meta.url),'utf8');
const start=appSource.indexOf('// Display-only lesson corrections.');
const end=appSource.indexOf('function taskMarkup(round){',start);
assert(start>=0&&end>start,'Presentation transformations must be testable');
const {coherencePreparation,coachedStarter}=runInNewContext(
  appSource.slice(start,end)+'\n({coherencePreparation,coachedStarter})'
);
const workspace=require('../foundations/workspace.js');
const follow=byId.get('V03').rounds[0];
const followCode=coachedStarter(follow,workspace.code(curriculum,follow));
assert(/hue\s*=\s*____/.test(followCode),'V03 Follow must ask learners to choose hue');
assert(!/sns\.____\s*\(/.test(followCode),'V03 Follow must not only test the function name');
assert(/hue\s*=\s*"habitat"/.test(follow.solution),'V03 reference maps the correct category');
const syntax=teaching.syntax(byId.get('V03'),follow);
assert(syntax.includes('hue='),'The main V03 syntax must teach hue');
assert(!syntax.includes('color='),'Fixed color must not displace the central hue explanation');
const redundant=byId.get('V17').rounds[0];
assert(/style\s*=\s*____/.test(coachedStarter(redundant,workspace.code(curriculum,redundant))),'V17 Follow must test marker-shape mapping');
const prep=(coherencePreparation['V17-3']||[]).join(' ');
for(const word of ['plotted','copy','speed_kmh','distance_km','minutes','60']){
  assert(prep.includes(word),'V17 preparation must explicitly name '+word);
}
for(const id of ['V18-3','V13-3','V29-3']){
  assert(coherencePreparation[id]?.length>=2,id+' needs ordered preparation');
}

// Inspect, Wrangle and Visualise remain the published path with no design,
// dataset or grading-contract replacements.
for(const deck of ['inspect','wrangle','visualise']){
  assert(curriculum.lessons.filter(l=>l.deck===deck).length>20,deck+' card coverage');
}
const ml=JSON.parse(execFileSync('python3',['ml-learning/authoring.py'],{
  encoding:'utf8',maxBuffer:64*1024*1024,
}));
const mlItems=[
  ...ml.cards.flatMap(card=>card.exercises),
  ...ml.challenges.map(challenge=>challenge.exercise),
];
assert(mlItems.length>200,'Review the full Machine Learning lesson inventory');
for(const item of mlItems){
  assert(item.task&&item.kind&&item.id,item.id+' has no concrete prompt');
  if(item.kind!=='python')continue;
  assert(item.solution&&item.starter,item.id+' needs executable Python and a starter');
  assert(item.outputs?.length,item.id+' has no named outputs');
  assert(item.checks?.length,item.id+' has no grader checks');
  if(item.id.startsWith('ML-X')){
    assert(item.taskBrief?.result&&item.taskBrief.result.length>15,item.id+' challenge brief needs an explicit outcome');
  } else assert(item.taskBrief?.result===item.task,item.id+' task and task brief disagree');
  if(item.label==='Follow'){
    assert.equal(item.starter,item.solution,item.id+' worked example must be identified as prefilled');
  }
}
const mlApp=readFileSync(new URL('../ml-learning/app.js',import.meta.url),'utf8');
assert(mlApp.includes('editor.value=ex.starter'),'ML checked starter must come from the authored learning activity');
const worked=ml.cards.filter(card=>card.kind==='teaching').flatMap(card=>card.exercises.filter(ex=>ex.kind==='python'&&ex.label==='Follow'&&ex.starter===ex.solution));
console.log('ML review note: '+worked.length+' teaching Follow activities still begin with the complete answer; these are guided demonstrations, not independent skills checks.');
console.log('Learning coherence gate: '+curriculum.lessons.length+' Foundations cards / '+all.length+
  ' exercises; '+ml.cards.length+' ML cards / '+mlItems.length+' ML activities scanned.');
