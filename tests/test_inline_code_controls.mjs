import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),inline=require('../foundations/inline-code.js'),plot=require('../foundations/visuals.js'),operations=require('../foundations/operation-visuals.js');
const context={window:{InlineCode:inline}};vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),context);const ml=context.window.MLLearningVisuals;
function expand(fields,state={},index=0){return index===fields.length?[state]:fields[index].options.flatMap(([value])=>expand(fields,{...state,[fields[index].key]:String(value)},index+1));}
let states=0;
for(const [ids,fields,code]of [
 [operations.ids,(id,state)=>operations.operationArguments(id,state),(id,state)=>operations.codeControls(id,state)],
 [Object.keys(plot.explorerSpecs),(id,state)=>plot.plotArguments(id,state),(id,state)=>plot.plotCode(id,state,{})],
 [Object.keys(ml.explorerSpecs).filter(id=>!ml.explorerSpecs[id].static&&id!=='P06'),(id,state)=>ml.modelArguments(id,state),(id,state)=>ml.modelCode(id,state)]
])for(const id of ids)for(const state of expand(fields(id,{}))){
 const actualFields=fields(id,state);
 // Some arguments are applicable only after another argument changes.
 for(const current of expand(actualFields.filter(f=>!(f.key in state)),state)){
  const html=code(id,current);
  for(const field of actualFields)assert(html.includes('data-code-key="'+field.key+'"'),id+': '+field.key+' must remain independently clickable in '+JSON.stringify(current));
  assert(!html.includes('<select'),'No separate form above the illustration');
  assert(html.includes('aria-haspopup="listbox"')&&html.includes('inline-code-cue'));
  states++;
 }
}
assert(operations.evaluate('W17','price',{method:'mean'}).result.rows[1][0]!==operations.evaluate('W17','price',{method:'median'}).result.rows[1][0],'Fill strategies have a visible effect on these skewed observations');
const authored=require('../foundations/curriculum.js').lessons.find(l=>l.id==='V11').rounds[0].visual;
assert(plot.interactive(authored).includes('data-code-key="axis"')&&plot.interactive(authored).includes('data-code-value="y"'),'Keep the lesson’s authored box orientation');
const countHTML=plot.interactive(plot.spec('count-bars'));
assert(!countHTML.includes('data-code-role="column">cost</code>'),'Count examples omit unused numeric measurements');
assert(!ml.modelArgumentModel('R10').code.includes('min_samples_leaf'),'Minimum leaf support waits for its later introduction');
assert(!inline.changedTokens('f(x=0) # output 2','f(x=1) # output 4').some(t=>t.text.startsWith('#')));
console.log(`${states} illustrative programs retain independently clickable code values and labelled menus, including conditional arguments.`);
