/* Public learner-facing coherence invariants, run after all source overlays. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

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
const follow=byId.get('V03').rounds[0];
assert(/hue\s*=\s*____/.test(follow.starter),'V03 Follow must ask learners to choose hue');
assert(!/sns\.____\s*\(/.test(follow.starter),'V03 Follow must not only test the function name');
assert(/hue\s*=\s*"habitat"/.test(follow.solution),'V03 reference maps the correct category');
const syntax=teaching.syntax(byId.get('V03'),follow);
assert(syntax.includes('hue='),'The main V03 syntax must teach hue');
assert(!syntax.includes('color='),'Fixed color must not displace the central hue explanation');
const redundant=byId.get('V17').rounds[0];
assert(/style\s*=\s*____/.test(redundant.starter),'V17 Follow must test the new shape mapping');
const speed=byId.get('V17').rounds[2];
const instructions=(speed.brief.preparation||[]).join(' ');
for(const word of ['plotted','copy','speed_kmh','distance_km','minutes','60','data']){
  if(word==='data')assert(/Draw from/.test(instructions),'V17 must use the derived table');
  else assert(instructions.includes(word),'V17 preparation must explicitly name '+word);
}
for(const id of ['V18-3','V13-3','V29-3']){
  assert(byId.get(id.slice(0,3)).rounds[2].brief.preparation?.length>=2,id+' needs a logical preparation sequence');
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
  assert(item.taskBrief?.result===item.task,item.id+' task and task brief disagree');
  if(item.label==='Follow'){
    assert.equal(item.starter,item.solution,item.id+' worked example must be identified as prefilled');
  }
}
const mlApp=readFileSync(new URL('../ml-learning/app.js',import.meta.url),'utf8');
assert(mlApp.includes('Worked example: run the supplied code'),'ML Follow must be presented as demonstration, not implied proof of mastery');
console.log('Learning coherence gate: '+curriculum.lessons.length+' Foundations cards / '+all.length+
  ' exercises; '+ml.cards.length+' ML cards / '+mlItems.length+' ML activities scanned.');
