import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const visuals=require('../foundations/operation-visuals.js');
const curriculum=require('../foundations/curriculum.js');
let states=0;
for(const id of visuals.ids){
  const lesson=curriculum.lessons.find(item=>item.id===id);
  assert(lesson&&!lesson.review,id+' is a taught lesson');
  const initial=visuals.evaluate(id), fixed=JSON.stringify(initial.inputs);
  const results=new Set(),codes=new Set();
  for(const [choice] of initial.choices){
    const example=visuals.evaluate(id,choice);
    assert.equal(JSON.stringify(example.inputs),fixed,id+' keeps the source observations fixed');
    assert(example.code&&example.summary,id+' connects code and output');
    assert(!/undefined|<details/.test(visuals.render(curriculum,lesson,lesson.rounds[0])),id+' has a visible valid example');
    codes.add(example.code);
    results.add(JSON.stringify(example.result));
    for(const table of [...example.inputs,...(example.result.rows?[example.result]:[])]){
      assert.equal(table.index.length,table.rows.length,id+' has one label per row');
      assert(table.rows.every(row=>row.length===table.columns.length),id+' has rectangular tables');
    }
    assert(visuals.pythonSetup(id,choice).startsWith('import pandas as pd'),id+' is reproducible');
    states++;
  }
  assert.equal(codes.size,initial.choices.length,id+' each control changes the Python');
  assert.equal(results.size,initial.choices.length,id+' each control changes the relevant result');
  assert.throws(()=>visuals.evaluate(id,'invalid choice'));
  for(const later of lesson.rounds.slice(1)) assert.equal(visuals.render(curriculum,lesson,later),'',later.id+' does not repeat the Follow illustration');
  assert.equal(visuals.render(curriculum,{...lesson,review:true},lesson.rounds[0]),'');
}
// No later-stage APIs are smuggled into Follow controls.
assert.equal(visuals.evaluate('I04'),null);
assert.equal(visuals.evaluate('I06S'),null);
for(const [id,forbidden] of [['I02',/tail|sample/],['I10',/isin|between/],['I19S',/median|sort_values|to_numpy/],['W09',/\.map\(/],['W26',/qcut/],['W28',/MinMax/]]){
  for(const [choice] of visuals.evaluate(id).choices) assert(!forbidden.test(visuals.evaluate(id,choice).code),id+' stays on its Follow concept');
}
// The important row/column semantics are visible without decorative duplicates.
assert.deepEqual(visuals.evaluate('W02','cost').result.rows,visuals.evaluate('W02').inputs[0].rows);
assert.deepEqual(visuals.evaluate('I09','C').result.index,['B','C']);
assert.deepEqual(visuals.evaluate('W16','price').result.index,[0,2,3]);
assert.deepEqual(visuals.evaluate('W24','priority').result.rows.at(-1),['Cocoa','chocolate',null]);
assert.deepEqual(visuals.evaluate('W26','3').result.rows,[[0,'lower'],[2,'lower'],[3,'lower'],[4,'upper'],[5,'upper'],[7,'upper']]);
assert.deepEqual(visuals.evaluate('W29','price').result.rows.map(row=>row[2]),[false,false,false,false,false,true]);
assert.deepEqual(visuals.evaluate('W27','flavour').result.columns,['shelf','price','flavour_fruity','flavour_mint']);
const htmlFor=id=>{const lesson=curriculum.lessons.find(item=>item.id===id);return visuals.render(curriculum,lesson,lesson.rounds[0]);};
const renamed=htmlFor('W02');
assert(renamed.includes('<th scope="col" class="operation-changed"><code data-code-role="column">amount</code>'));
assert(!renamed.includes('<td class="operation-changed">'),'rename highlights the heading, not unchanged values');
assert(!htmlFor('W06').includes('<td class="operation-changed">'),'sort/reset preserves each observation rather than inventing value changes');
assert(renamed.includes('data-code-role="variable">df</code>'),'source object has explicit variable semantics');
assert(renamed.includes('data-code-role="column">price</code>'),'summary column references have explicit semantics');
assert(htmlFor('W12').includes('&quot;2.5&quot;'),'numeric text remains visibly text before conversion');
assert(!/data-code-role="column">mean<\/code>/.test(htmlFor('W17')),'ordinary mean does not become an invented column');
assert.equal(visuals.evaluate('unknown'),null);
console.log(`Operation visual contracts: ${visuals.ids.length} Follow lessons, ${states} meaningful fixed-data states.`);
