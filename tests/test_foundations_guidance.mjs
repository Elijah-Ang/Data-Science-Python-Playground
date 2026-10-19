import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const c=require('../foundations/curriculum.js');
const parameters=require('../foundations/parameter-guide.js');
const byId=Object.fromEntries(c.lessons.map(l=>[l.id,l]));
const position=new Map(c.lessons.map((l,i)=>[l.id,i]));
const visualise=c.lessons.filter(l=>l.deck==='visualise');
assert.equal(visualise.length,43);
assert.equal(visualise.filter(l=>l.review).length,7);
assert.equal(visualise.filter(l=>!l.review&&l.path==='core').length,20);
assert.equal(visualise.filter(l=>!l.review&&l.path==='extension').length,16);
assert.equal(visualise.flatMap(l=>l.rounds).length,132);
assert.equal(new Set(visualise.flatMap(l=>l.rounds.map(r=>r.dataset))).size>=50,true,'Purposeful dataset variety survives the teaching overlays');
let rounds=0;
for(const l of c.lessons){
 assert(l.concepts,l.id+' authors concept progression');
 for(const field of ['introduces','reuses','extends','prerequisites'])assert(Array.isArray(l.concepts[field]),l.id+' '+field);
 for(const prerequisite of l.concepts.prerequisites){
  assert(byId[prerequisite],l.id+' links a real prerequisite '+prerequisite);
  assert(position.get(prerequisite)<position.get(l.id),l.id+' prerequisite comes before use '+prerequisite);
 }
 for(const r of l.rounds){
  assert(r.concepts&&r.brief&&r.provenance,r.id+' teaching and object origins');
  assert(r.brief.question&&r.brief.rows&&r.brief.result,r.id+' question → rows → result');
  assert(Array.isArray(r.brief.constraints),r.id+' essential constraints');
  assert(!r.task.includes('These data are useful because'),r.id+' no authoring rationale in the task');
  assert(r.stageSummary&&r.stageSummary.split(/\s+/).length<=12,r.id+' concise stage selector');
  assert(r.provenance.supplied.every(o=>o.name&&o.description),r.id+' supplied state');
  assert(r.provenance.created.every(o=>o.name&&o.description),r.id+' learner-created state');
  if(l.deck==='visualise'){
   assert(r.syntaxGuidance&&r.parameterTeaching&&r.workflow,r.id+' explicit current teaching');
   assert(!parameters.renderReference(c,l,r).includes('<details open'),r.id+' optional help collapsed');
  }
  rounds++;
 }
}
const histogram=byId.V04;
assert.equal(histogram.rounds[0].dataset,histogram.rounds[1].dataset);
assert(histogram.rounds[0].solution.includes('bins=4'));
assert(histogram.rounds[1].solution.includes('bins=2'));
assert(!JSON.stringify(histogram.rounds[1].teaching).includes('ax.hist'),'Change focuses on the same API');
assert(histogram.rounds[1].alternativeTeaching.code.includes('ax.hist'),'The alternate API remains optional');
assert.deepEqual(histogram.rounds.map(r=>r.stageSummary),['Count values in bins.','Compare fewer bins.','Use specified bin edges.']);
assert(byId.V13.rounds[2].solution.includes('medians = df.groupby'));
assert(byId.V13.rounds[2].solution.includes('ranked = medians.sort_values()'));
assert(byId.V13.rounds[2].solution.includes('order = ranked.index'));
assert(byId.V13.rounds[2].teaching.referenceCode.includes('.median().sort_values().index'),'Equivalent chain waits in reference');
assert(!byId.V17.rounds[0].solution.includes('size="area_cm2"'),'Follow adds shape only');
assert(byId.V17.rounds[0].solution.includes('style="instrument"'));
assert(byId.V17.rounds[1].solution.includes('size="area_cm2"'),'Change adds one size mapping');
assert.equal(byId.V17.rounds[0].dataset,byId.V17.rounds[1].dataset);
assert(byId.V17.rounds[2].teaching.code.includes('/ plotted["minutes"] * 60'));
assert(/mean.*typical size/i.test(byId.V29.guide.note)&&/sum.*total boxes/i.test(byId.V29.guide.note));
assert(!JSON.stringify(byId.V29.guide).match(/catalogue|revenue|flavour|price/));
assert(byId.V33.rounds[2].teaching.code.includes('sns.relplot'));
assert(byId.V33.rounds[2].teaching.referenceCode.includes('sns.displot'));
assert(/one row per day/i.test(byId.V18.guide.example));
assert(byId.V19.explanation.includes('replicate'));
const canvas=byId.V01.rounds[0];
assert.equal(canvas.brief.question,'Create an empty chart canvas.');
assert(!canvas.task.includes('pedagogical')&&!canvas.task.includes('isolates'));
assert.deepEqual(canvas.provenance.created.map(o=>o.name),['fig','ax']);
for(const id of ['V31','V32','V33'])for(const r of byId[id].rounds)assert(r.workflow.changed.includes('g.figure'),r.id+' respects grid-owned figures');
for(const [id,operation]of [['V22','sns.heatmap'],['V28','ax.annotate'],['V29','ax.bar']]){
 const lesson=byId[id],round=lesson.rounds[0];
 assert(round.workflow.changedSyntaxLines.some(line=>lesson.syntaxCode.split('\n')[line-1].includes(operation)),id+' emphasises the new plotting operation');
 assert(!round.workflow.changedSyntaxLines.includes(1),id+' familiar preparation stays neutral');
}
assert.deepEqual(byId.V27.rounds[0].workflow.changedSyntaxLines,[1,2],'Both new benchmark calls are emphasised');
assert(byId.V17.rounds[2].workflow.changedTeachingLines.some(line=>byId.V17.rounds[2].teaching.code.split('\n')[line-1].includes('["speed_kmh"] =')),'Speed preparation is connected to its teaching code');
console.log(`Authored guidance: ${c.lessons.length} cards, ${rounds} practices; inventory, prerequisite order, distinct stages, concise briefs, parameter disclosure, provenance and named corrections verified.`);
