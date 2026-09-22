import assert from 'node:assert/strict';
import fs from 'node:fs';
import {productionInventory} from '../scripts/ml-production.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../ml-learning/manifest.json',import.meta.url),'utf8'));
const nodes=new Map([...manifest.cards,...manifest.challenges].map(c=>[c.id,c]));
assert.equal(nodes.size,manifest.cards.length+manifest.challenges.length,'IDs must be unique');
function ancestors(id,path=[]) {
  assert(!path.includes(id),'Cycle: '+[...path,id].join(' → '));
  const item=nodes.get(id);assert(item,'Missing prerequisite '+id);
  return new Set(item.deps.flatMap(d=>[d,...ancestors(d,[...path,id])]));
}
for(const c of manifest.cards) {
  const deps=ancestors(c.id);
  if(c.tier==='core')for(const id of deps)assert.equal(nodes.get(id).tier,'core',c.id+' depends on optional '+id);
  if(c.kind==='teaching')assert(c.exercises.length>=2&&c.exercises.length<=4,c.id+': choose 2–4 meaningful exercises');
}
function excludes(id,pattern) {
  for(const a of ancestors(id))assert(!pattern.test(a),id+' has an unintended prerequisite: '+a);
}
excludes('R-K1',/^(C|N|U|P|M)/);
excludes('C-K1',/^(R|N|U|P|M)/);
excludes('N-R1',/^(R|C|U|P|M)/);
excludes('N-K1',/^(C|U|P|M)/);
excludes('N-K2',/^(R|U|P|M)/);
excludes('U-K1',/^(R|C|N|P|M)|^W(?!03$)/);
excludes('P-K1',/^(R|C|N|M)|^W(?!03$)|^U(0[3-9]|10)$/);
assert.deepEqual(nodes.get('W03').deps,['F-K1']);
assert(ancestors('W-K1').has('W02'),'Supervised checkpoint still needs dummy-reference knowledge');
assert.deepEqual(nodes.get('M01').deps,['R-K1','C-K1','N-K1','N-K2','U-K1','P-K1']);
const production=productionInventory();
const coverage=new Set();
for(const [i,c] of manifest.challenges.entries()) {
  assert.equal(c.id,'X'+String(i+1).padStart(2,'0'));
  for(const model of c.models){assert(production.MODELS[model],'Unknown model '+model);coverage.add(model);}
  excludes(c.id,/^M/);
  if(c.models.every(m=>production.MODELS[m].task==='classification'))excludes(c.id,/^R/);
  if(c.models.includes('mlp_reg'))excludes(c.id,/^C/);
}
assert.deepEqual([...coverage].sort(),Object.keys(production.MODELS).sort());
const totals=Object.fromEntries(['teaching','review','checkpoint'].map(kind=>{
  const cards=manifest.cards.filter(c=>c.kind===kind);
  return [kind,{cards:cards.length,exercises:cards.reduce((s,c)=>s+c.exercises.length,0)}];
}));
console.log(JSON.stringify({acyclic:true,independentRoutes:true,models:coverage.size,challenges:manifest.challenges.length,...totals},null,2));
