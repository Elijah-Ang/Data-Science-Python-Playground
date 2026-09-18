import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url), curriculum=require('../foundations/curriculum.js'), registry=require('../challenges/registry.js'), baseline=require('../challenges/foundations-baseline.json');
assert.equal(createHash('sha256').update(JSON.stringify(curriculum)).digest('hex'),baseline.sha256,'Existing curriculum definitions must remain unchanged');
const all=registry.challenges;
assert.equal(all.length,30);
assert.equal(new Set(all.map(c=>c.id)).size,all.length);
for(const [deck,prefix] of [['inspect','IC'],['wrangle','WC'],['visualise','VC']]){
 const items=all.filter(c=>c.deck===deck);assert.equal(items.length,10);
 assert.deepEqual(items.map(c=>c.id),Array.from({length:10},(_,i)=>prefix+String(i+1).padStart(2,'0')));
}
for(const c of all){
 assert(registry.families[c.family]);assert(c.question&&c.title&&c.reference&&c.solution);
 assert(c.deliverables.length>=2&&c.deliverables.length<=4,c.id);
 assert.equal(new Set(c.deliverables.map(d=>d.id)).size,c.deliverables.length);
 assert(c.starter.endsWith('# Your work\n\n')&&!c.starter.includes('____'),c.id);
 assert(c.tags.length<=3&&c.tags.every(t=>!/[()]/.test(t)),c.id);
 assert(!('difficulty' in c)&&!('score' in c)&&!('locked' in c),c.id);
 assert.equal(new Set(Object.values(c.hints)).size,3,c.id);
 assert(!/\w+\(\)|\b(?:groupby|dropna|merge|iloc|loc)\b/.test(c.hints.think),c.id);
 assert(c.explanationSteps.length>=2&&c.alternative,c.id);
 assert(c.planning.length<=2,c.id);
 for(const d of c.deliverables){assert.equal(typeof d.checkIndex,'boolean',c.id);assert(d.format,c.id);if(d.kind==='export')assert(d.fileName&&d.requirement.includes(d.fileName),c.id);}
 assert(c.setup.split('\n').length<60,c.id+' setup should remain scannable');
 assert(!c.explanationSteps.some(s=>s.includes('checked independently')),c.id+' must explain the actual workflow');
 for(const id of c.prerequisites){const l=curriculum.lessons.find(l=>l.id===id);assert(l,id);assert.equal(l.level,'Core',c.id+' requires optional '+id);}
 for(const [i,input] of c.inputs.entries()){
  const sizes=Object.values(input.columns).map(v=>v.length);assert(sizes.every(n=>n===sizes[0]),c.id);
  if(i===0)assert(sizes[0]>=12&&sizes[0]<=30,c.id);
  assert.deepEqual(Object.keys(input.fields),Object.keys(input.columns),c.id);
 }
}
console.log(JSON.stringify({existingFoundationsExercises:curriculum.lessons.flatMap(l=>l.rounds).length,existingCards:curriculum.lessons.length,newWorkflowChallenges:all.length,byDeck:Object.fromEntries(curriculum.decks.map(d=>[d.id,all.filter(c=>c.deck===d.id).length])),totalExecutableActivities:curriculum.lessons.flatMap(l=>l.rounds).length+all.length,baselineUnchanged:true},null,2));
