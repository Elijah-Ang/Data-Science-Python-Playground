import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const ctx={};ctx.window=ctx;
for(const file of ['code-identifiers.js','learning-identifiers.js','learning-language.js'])vm.runInNewContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),ctx);
const L=ctx.LearningLanguage,F=ctx.CodeIdentifiers.format;
const codeCount=html=>(html.match(/<code\b/g)||[]).length;
const names=L.context('WC02');
assert(names.columns.includes('price')&&names.columns.includes('numeric_price'));
assert(names.variables.includes('eligible')&&names.variables.includes('invalid'));
for(const name of ['price','numeric_price'])assert(F('`'+name+'`',names).includes('data-code-role="column"'));
assert(F('`eligible`',names).includes('data-code-role="variable"'));
assert.equal(codeCount(F('The price of clarity is time. Explain the result.',names)),0);
assert.equal(codeCount(F('Count the observations and explain the mean.',{columns:['count','mean'],instruction:true})),0);
assert(F('Keep raw price text in both outputs.',{...names,instruction:true}).includes('>price</code>'));
assert.equal(F('Ordinary prose stays readable.'),'Ordinary prose stays readable.');
assert(!L.text('<img src=x onerror=alert(1)>','WC02',true).includes('<img'));
const text='Use df, create eligible, and display eligible. Keep price >= 4.5; return "Retain original Price" unchanged.';
const split=Array.from(L.split(text));
assert.equal(split.length,5);
assert(split.includes('Keep price >= 4.5'));
assert(split.some(s=>s.includes('"Retain original Price"')),'Do not rewrite labels');
assert(L.plain('Keep df.rename(columns={"retain": "preserve"}) unchanged.').includes('"retain": "preserve"'));
assert.equal(L.split('If price is missing, return invalid.').length,1,'Keep conditions attached to their actions');
assert.equal(L.split('Use (1, 2); x "Time; hour"; y "Count".').length,1,'Keep quoted punctuation and tuple literals intact');
assert(L.glossary('Keep missing prices in a DataFrame.').includes('no value was supplied'));
assert(L.glossary('Compare a dummy baseline on matching folds.').includes('held-out rows'));
const html=ctx.CodeIdentifiers.decorateHTML('<p>Create eligible with numeric_price.</p><pre><code>df.price</code></pre><p>Explain the result.</p>',{...names,instruction:true});
assert(html.includes('data-code-role="column"')&&html.includes('<pre><code>df.price</code></pre>'));
assert(html.includes('<p>Explain the result.</p>'));
const require=createRequire(import.meta.url),data=require('../foundations/curriculum.js');
let count=0;
for(const lesson of data.lessons)for(const round of lesson.rounds){
  assert(L.context(round.id).columns,round.id+' has its own authored context');
  assert(L.activity(round).includes('class="learning-instructions"'),round.id);
  for(const step of round.steps){
    for(const token of step.match(/\d+(?:\.\d+)?%?|"[^"\n]*"|'[^'\n]*'/g)||[]){
      assert(L.split(step).join(' ').includes(token),round.id+' retains literal '+token);
    }
  }
  count++;
}
const challengeContext={};challengeContext.window=challengeContext;vm.runInNewContext(fs.readFileSync(new URL('../challenges/registry.js',import.meta.url),'utf8'),challengeContext);
const prices=challengeContext.DataWorkflowChallenges.challenges.find(c=>c.id==='WC02');
for(const d of prices.deliverables){
  assert(d.instructions?.length>=5);
  const rendered=L.steps(d.instructions,'WC02');
  assert(rendered.includes('>price</code>')&&rendered.includes('>numeric_price</code>'));
  assert(rendered.includes('original')&&rendered.includes('order'),'Raw text and row order remain explicit');
  for(const step of d.instructions)assert(step.split(/\s+/).length<=20,'Price steps remain short');
}
assert(L.activity({id:'ML-M-K1-1'}).includes('569')&&L.activity({id:'ML-M-K1-1'}).includes('90%'));
const ml=JSON.parse(execFileSync(process.env.PYTHON||'python3',['ml-learning/authoring.py'],{cwd:path.resolve(import.meta.dirname,'..'),encoding:'utf8',maxBuffer:20*1024*1024}));
for(const card of ml.cards)for(const ex of card.exercises){
  assert(L.context(ex.id).columns,ex.id+' has an authored context');
  const output=L.activity(ex);
  for(const number of ex.task.match(/\d+(?:\.\d+)?%?/g)||[])assert(output.includes(number),ex.id+' preserves numerical evidence '+number);
  for(const name of ex.outputs||[])assert(L.context(ex.id).variables.includes(name)||L.context(ex.id).columns.includes(name),ex.id+' declares output name '+name);
  count++;
}
assert.equal(count,665);
console.log(`${count} Foundations/ML activities have readable action steps and literal-preserving contexts; price columns, Python objects, prose, conditions, glossary and report evidence verified.`);
