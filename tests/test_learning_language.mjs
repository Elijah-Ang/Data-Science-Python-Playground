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
const checkpoint=L.context('ML-C-K1-1');
assert(!checkpoint.columns.includes('logistic')&&checkpoint.keys.includes('logistic'));
assert.equal(codeCount(L.text('Complete a stratified mixed Penguin logistic workflow.','ML-C-K1-1',true)),0);
assert(L.text("Store candidates['logistic'] as the model.",'ML-C-K1-1',true).includes('title="Dictionary key"'));
assert(L.text('Select its first five values into answer.','ML-F01-1',true).includes('>answer</code>'));
assert(!L.text('Build scores with policy names as rows.','ML-C-R1-1',true).includes('>rows</code>'),'Table rows are not a temporary Python rows variable');
for(const [id,names] of [['ML-R-K1-1',['multiple_linear','regression_tree']],['ML-N-K2-1',['mlp_cls']]])for(const name of names)assert(!L.context(id).columns.includes(name),id+' model dictionary key is not a column');
for(const id of ['ML-R-K1-1','ML-C-K1-1']){
 const ctx=L.context(id);
 for(const name of ['initial_score','selected_score','settings'])assert(ctx.columns.includes(name),id+' authored output column '+name);
 const html=L.steps('Dataframe with initial_score, selected_score and settings columns. settings describes the chosen recipe.',id);
 for(const name of ['initial_score','selected_score','settings'])assert(html.includes('title="Table column">'+name+'</code>'));
 assert(!html.includes('>chosen</code>'),'Ordinary adjective remains prose');
}
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
assert.equal(L.split("Keep df's original order. Draw the chart. Label both axes.").length,3,'A possessive apostrophe is not a quoted string');
assert.equal(L.split('Read the evidence. choose a model.').length,2,'A lowercase action starts its own step');
assert.equal(L.split('Use (1, 2); x "Time; hour"; y "Count".').length,1,'Keep quoted punctuation and tuple literals intact');
assert(L.glossary('Keep missing prices in a DataFrame.').includes('no value was supplied'));
assert(L.glossary('Compare a dummy baseline on matching folds.').includes('held-out rows'));
const html=ctx.CodeIdentifiers.decorateHTML('<p>Create eligible with numeric_price.</p><pre><code>df.price</code></pre><p>Explain the result.</p>',{...names,instruction:true});
assert(html.includes('data-code-role="column"')&&html.includes('<pre><code>df.price</code></pre>'));
assert(html.includes('<p>Explain the result.</p>'));
assert(ctx.CodeIdentifiers.decorateHTML('<dt><code>price</code></dt><pre><code>price</code></pre>',names).includes('<dt><code class="code-identifier" data-code-role="column" title="Table column">price</code></dt>'));
const require=createRequire(import.meta.url),data=require('../foundations/curriculum.js');
const allRounds=data.lessons.flatMap(l=>l.rounds);
assert(L.activity(allRounds.find(r=>r.id==='I19A-1')).includes('title="Python object">means</code>'));
assert(L.activity(allRounds.find(r=>r.id==='I19A-1')).includes('title="Python object">counts</code>'));
const checks=L.activity(allRounds.find(r=>r.id==='I19A-2'));
assert(checks.includes('title="Python object">checks</code>'),'The supplied checks Series remains a Python object');
assert(checks.includes('title="Table column">checks</code>'));
assert(L.activity(allRounds.find(r=>r.id==='I19A-3')).includes('title="Table column">missing</code>'));
for(const [id,name] of [['I01CSV-1','candy.csv'],['I01CSV-2','cafe.csv'],['I01CSV-3','pets.csv']])assert(L.activity(allRounds.find(r=>r.id===id)).includes('title="Filename">'+name+'</code>'),id+' entire filename is one literal');
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
const exercises=ml.cards.flatMap(c=>c.exercises);
for(const id of ['ML-M03-1','ML-C02-3','ML-C05-3','ML-C17-1','ML-P05-1','ML-W01-1','ML-W14-3','ML-U09-2','ML-P07-2','ML-F-R2-1','ML-W-R1-1','ML-P-R1-2'])assert(L.activity(exercises.find(e=>e.id===id)).includes('>answer</code>'),id+' explicit answer object is styled');
for(const [id,names] of [['ML-R02-1',['rmse','r2']],['ML-C03-2',['macro_f1','accuracy']],['ML-N06-1',['alpha']]])for(const name of names)assert(L.activity(exercises.find(e=>e.id===id)).includes('>'+name+'</code>'),id+' exact output/setting '+name);
const hierarchy=L.activity(exercises.find(e=>e.id==='ML-U09-2'));assert(hierarchy.includes('title="Python object">sample</code>'));
const policy=L.activity(exercises.find(e=>e.id==='ML-C-R1-1'));assert(policy.includes('>scores</code>'));assert(!policy.split('</li>')[0].includes('>clear</code>'),'A class value preceding the output-column declaration stays prose');
assert(L.activity(exercises.find(e=>e.id==='ML-U-K1-1')).includes('title="Python object">labels</code>'));
assert(L.activity(allRounds.find(r=>r.id==='V30-1')).includes('title="Table column">Two players</code>'),'A multiword column is styled as one exact name');
assert.equal(codeCount(F('Two players are talking.',{columns:['Two players']})),0,'Ordinary multiword prose is not a column reference');
for(const card of ml.cards)for(const ex of card.exercises){
  assert(L.context(ex.id).columns,ex.id+' has an authored context');
  const output=L.activity(ex);
  for(const number of ex.task.match(/\d+(?:\.\d+)?%?/g)||[])assert(output.includes(number),ex.id+' preserves numerical evidence '+number);
  for(const name of ex.outputs||[])assert(L.context(ex.id).variables.includes(name)||L.context(ex.id).columns.includes(name),ex.id+' declares output name '+name);
  count++;
}
assert.equal(count,676);
console.log(`${count} Foundations/ML activities have readable action steps and literal-preserving contexts; price columns, Python objects, prose, conditions, glossary and report evidence verified.`);
