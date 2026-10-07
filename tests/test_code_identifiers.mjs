import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../code-identifiers.js',import.meta.url),'utf8'),context);
const format=context.window.CodeIdentifiers.format;
const count=s=>(s.match(/<code class="code-identifier">/g)||[]).length;
const axes=format('Chart: title "Board games"; x "minutes"; y "Count".');
assert(axes.includes('<code class="code-identifier">x</code>'));
assert(axes.includes('<code class="code-identifier">y</code>'));
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
