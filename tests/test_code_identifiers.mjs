import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../code-identifiers.js',import.meta.url),'utf8'),context);
const format=context.window.CodeIdentifiers.format;
const count=s=>(s.match(/<code class="code-identifier"(?: [^>]*)?>/g)||[]).length;
const axes=format('Chart: title "Board games"; x "minutes"; y "Count".');
assert(axes.includes('>x</code>'));
assert(axes.includes('>y</code>'));
assert.equal(count(axes),2);assert(!axes.includes('<code class="code-identifier">minutes'));
assert.equal(count(format('A 6 x 4 inch chart shows counts. Explain why the pattern differs.')),0);
assert.equal(count(format('Set x="minutes" and y="score".')),2);
assert.equal(count(format('The x axis and the y-axis show the measurements.')),2);
assert.equal(count(format('Keep x and y from the same row. Category counts use x alone.')),3);
assert.equal(count(format('A 6 x 4 chart and an x-ray are ordinary prose.')),0);
assert.equal(count(format('Select X_train and y_train, then call model.predict(X_test).')),3);
assert.equal(format('<img src=x onerror=alert(1)>').includes('<img'),false);
for(const file of ['data-foundations.html','ml-learn.html','foundations/learning-ui.js']){
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert(!source.includes('TINY TABLES · REAL PYTHON · YOUR PACE'));
 assert(!source.includes('Exercises within this concept'));
 assert(!source.includes('A little practice goes a long way.'));
}
console.log('Axis identifiers align; ordinary prose and labels remain plain; filler removed.');

const identifiers=context.window.CodeIdentifiers;
const semanticCount=s=>(s.match(/data-code-role="(?:column|variable|function|parameter|operation|syntax|literal|key|file)"/g)||[]).length;
const column=s=>s.includes('data-code-role="column"');
const variable=s=>s.includes('data-code-role="variable"');
const authored={
 columns:['fare','route','value','order','mean_amount','records'],variables:['medians','ranked','order'],
 inputColumns:['fare','route'],outputColumns:['value','mean_amount','records'],exampleVariables:['medians','ranked','order'],
 functions:['sns.barplot'],parameters:['estimator'],operations:['mean','size'],
 semantics:{value:{role:'column',kind:'output'}},
 scopes:{example:{semantics:{order:{role:'variable',kind:'example'}}},task:{semantics:{order:{role:'column',kind:'output'}}}}
};
assert(column(format('Return `mean_amount` and `records`.',authored)));
assert(variable(format('Store `medians` in `ranked`; use `order` for the labels.',authored)));
assert.equal(semanticCount(format('Each fare contributes to the route average.',authored)),0,'Explanatory prose needs an identifier cue');
assert.equal(semanticCount(format('The combined evidence is useful.'))+count(format('The combined evidence is useful.')),0,'A common adjective is not a global variable exception');
assert.equal(semanticCount(format('Title: "Bus fare receipts". Label: "Mean fare".',{...authored,instruction:true})),0,'Display text remains an indivisible literal');
assert.equal(semanticCount(format('Show "value" and \'order\' as display text.',{...authored,instruction:true})),0,'Quoted values are not field references');
assert(column(format('The column "fare" contains ticket prices.',authored)),'An explicit field cue still works');
assert(format('[[column:value]] stores each measurement; [[prose:value]] is ordinary English.',authored).includes('>value</code> stores each measurement; <span data-code-role="prose">value</span> is ordinary English.'));
for(const role of ['function','parameter','operation','literal'])assert(format(`[[${role}:mean]]`,authored).includes(`data-code-role="${role}"`),role+' explicit role preserved');
for(const [name,role] of [['sns.barplot()','function'],['sns.barplot(data=df, x="route")','syntax'],['estimator="mean"','parameter'],['df["fare"]','syntax'],['ranked.index','syntax']])assert(format('Use `'+name+'`.',authored).includes('data-code-role="'+role+'"'),name+' authored syntax has an explicit semantic role');
assert(identifiers.decorateHTML('<p><code data-code-role="parameter">estimator</code></p>',authored).includes('class="code-identifier"'),'Explicit inline roles receive their shared styling class before JavaScript');
assert.equal(semanticCount(format('Keep mean and size as operation names.',authored)),0,'Aggregation operation prose does not become a column');
assert(format('[[literal:<unsafe>]]',authored).includes('&lt;unsafe&gt;'),'Explicit markup still escapes content');
assert(!format('[[invalid:<unsafe>]]',authored).includes('<unsafe>'),'Unknown role cannot create unsafe HTML');
assert.deepEqual(JSON.parse(JSON.stringify(identifiers.meaning('value',authored))),{role:'column',kind:'output'});
assert.deepEqual(JSON.parse(JSON.stringify(identifiers.meaning('medians',authored))),{role:'variable',kind:'example'});
assert(variable(format('`order`',{...authored,scope:'example'})));
assert(column(format('`order`',{...authored,scope:'task'})));
const occurrence={...authored,occurrences:[{text:'value',role:'column',occurrence:0},{text:'value',role:'prose',occurrence:1}]};
assert.equal(semanticCount(format('value is an output; its value may be missing.',occurrence)),1,'Same ambiguous word may have different occurrence roles');
assert.equal(semanticCount(format('order is important.',{...authored,occurrences:[{text:'order',role:'prose'}]})),0,'Occurrence prose overrides variable inference');
assert(column(format('Return value.',{...authored,occurrences:[{text:'value',role:'column',before:'Return ',after:'.'}]})));
assert.equal(semanticCount(format('A value later.',{...authored,occurrences:[{text:'value',role:'column',before:'Return ',after:'.'}]})),0,'Occurrence constraints avoid unrelated prose');
const collision=format('Use Series `order`; display the output `order`.',{...authored,occurrences:[{text:'order',role:'column',before:'output `'}]});
assert(!collision.includes('`'),'An occurrence override consumes authored backticks');
assert(collision.includes('data-code-role="variable"')&&collision.includes('data-code-role="column"'));
const protectedHTML='<p><code data-code-role="literal">fare</code> <code data-code-role="prose">order</code></p><pre><code>fare = "route"</code></pre>';
assert.equal(identifiers.decorateHTML(protectedHTML,authored),protectedHTML,'Explicit role attributes and Python blocks are untouched');
const scopedHTML=identifiers.decorateHTML('<section data-code-context="example"><code>order</code></section><section data-code-context="task"><code>order</code></section>',authored);
assert(scopedHTML.includes('data-code-role="variable"')&&scopedHTML.includes('data-code-role="column"'),'HTML scopes preserve different meanings for the same name');
assert.equal(identifiers.decorateHTML('<p data-code-role="literal">Bus fare receipts</p>',{...authored,instruction:true}),'<p data-code-role="literal">Bus fare receipts</p>');
const teachingTable=identifiers.decorateHTML('<table class="teaching-comparison"><tr><td>Use `fare` with `estimator="mean"`; store the result in `ranked`.</td></tr></table>',authored);
assert(column(teachingTable)&&variable(teachingTable)&&teachingTable.includes('data-code-role="parameter"'),'Teaching-table prose preserves column, object and argument roles');
const dictionary=identifiers.decorateHTML('<table data-code-table="dictionary"><tr><td>value</td><td>A value may be missing.</td></tr></table>',authored);
assert.equal(semanticCount(dictionary),1,'Dictionary field cell is a column; the ordinary noun in its meaning stays prose');
const objects=identifiers.decorateHTML('<table data-code-table="objects"><tr><th scope="row">order</th><td>ranked</td></tr></table>',authored);
assert.equal(semanticCount(objects),1);assert(variable(objects),'Object table names are variables; literal output cells stay untouched');
assert.equal(semanticCount(identifiers.decorateHTML('<table><tr><td>fare</td><td>order</td></tr></table>',authored)),0,'Unmarked data-table cells remain literal values');
execFileSync(process.env.PYTHON||'python3',['tests/test_identifier_registry.py'],{cwd:new URL('..',import.meta.url),stdio:'inherit'});
console.log('Explicit occurrence roles, scoped ambiguous names, literal strings, output columns and worked-example objects verified.');

// Assert the named regressions against the final assembled source, rather than
// substituting test-only metadata for the lessons students actually receive.
for(const file of ['learning-identifiers.js','learning-language.js'])vm.runInNewContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
const require=createRequire(import.meta.url),curriculum=require('../foundations/curriculum.js');
const byId=Object.fromEntries(curriculum.lessons.map(lesson=>[lesson.id,lesson]));
const language=context.window.LearningLanguage;
const ordering=language.context('I19S-1');
const orderingNote=identifiers.decorateHTML('<p>'+byId.I19S.guide.example+'</p>',ordering);
for(const name of ['means']){
 assert(ordering.exampleVariables.includes(name),'I19S worked-example object '+name+' is registered');
 assert(orderingNote.includes('data-code-role="variable" title="Python object">'+name+'</code>'),'I19S explanatory object '+name+' is correctly rendered');
}
const changedOrdering=language.context('I19S-2');
for(const name of ['medians','ranked'])assert(changedOrdering.exampleVariables.includes(name),'I19S later sorting object '+name+' stays registered in its teaching stage');
for(const [id,names] of [['W19',['mean_amount','records']],['W22',['measure','value']]]){
 const authored=language.context(id+'-1'),activity=language.activity(byId[id].rounds[0]);
 for(const name of names){
  assert(authored.outputColumns.includes(name),id+' output '+name+' retained as an authored output column');
  assert(activity.includes('data-code-role="column" title="Table column">'+name+'</code>'),id+' output '+name+' rendered with column semantics');
 }
}
const cafeGrouping=language.context('W19-2');
assert(column(format('`size`',{...cafeGrouping,scope:'task'})),'The café size input remains a task column');
assert(identifiers.decorateHTML('<section data-code-context="guide"><code>size</code></section>',cafeGrouping).includes('data-code-role="operation"'),'The same word in the W19 aggregation guide remains an operation');
const averages=language.activity(byId.V09.rounds[0]);
assert(averages.includes('data-code-role="column" title="Table column">fare</code>'));
assert(averages.includes('data-code-role="column" title="Table column">route</code>'));
assert(averages.includes('Title: &quot;Bus fare receipts&quot;'),'V09 chart title remains literal display text');
assert(averages.includes('&quot;Mean fare&quot;'),'V09 axis display text remains literal');
const histogramTask=language.activity(byId.V04.rounds[0]);
assert(!histogramTask.includes('title="Table column">stone</code>'),'V04 measured/largest stone descriptions remain ordinary entity nouns');
assert(column(format('Plot `diameter_mm`.',{...language.context('V04-1'),scope:'task'})),'V04 actual measurement references remain columns');
for(const lesson of Object.values(byId)){
 const pre='<pre><code>'+String(lesson.example??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</code></pre>';
 assert.equal(identifiers.decorateHTML(pre,language.context(lesson.rounds[0].id)),pre,lesson.id+' Python block alignment and source retained');
}
console.log('Final I19S, W19, W22 and V09 semantics verified; every Foundations worked Python block remains undecorated.');
