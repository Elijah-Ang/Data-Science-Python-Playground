import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{}};
for (const file of ['tour-content.js','tour-previews.js']) vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox);
const {chapters}=sandbox.window.TOUR_CONTENT;
const {scenes}=sandbox.window.TOUR_PREVIEWS;
assert.equal(chapters.length,24);
for (const group of ['Data','Stats','ML','Learn']) assert.ok(chapters.filter(c=>c.group===group).length>=5,group);
for (const c of chapters) {
  assert.ok(c.title && c.description && c.context);
  assert.ok(scenes[c.scene]?.includes(`data-tour-focus="${c.focus}"`),`${c.scene}/${c.focus}`);
  assert.doesNotMatch(scenes[c.scene],/<script|<iframe|<input|<button|on\w+=|tour-captures/i);
  if(c.scene!=='home') assert.doesNotMatch(scenes[c.scene],/<img/);
}
const sources={
  ml:fs.readFileSync('ml-app.js','utf8')+fs.readFileSync('ml.html','utf8'),
  data:fs.readFileSync('playground.html','utf8'),
  learn:fs.readFileSync('learn.html','utf8')
};
for(const phrase of ['Choose what to predict','Validate the initial model','Tune the model','Logistic Regression','Cross-validation gives several training-only validation results']) {
  assert.ok(sources.ml.includes(phrase),phrase);
  assert.ok(Object.values(scenes).some(html=>html.includes(phrase)),phrase);
}
for(const phrase of ['Preview rows','Summary stats','Questions to chase']) assert.ok(sources.data.includes(phrase),phrase);
for(const phrase of ['Data Foundations','Coming soon']) assert.ok(sources.learn.includes(phrase),phrase);
assert.ok(scenes['ml-results'].includes('0.916') && scenes['ml-results'].includes('114'));
assert.ok(scenes['stats-results'].includes('−145.665 to 91.8172'));
assert.ok(fs.existsSync('assets/mascot/robot-book.png'));
assert.doesNotMatch(fs.readFileSync('tutorial.html','utf8'),/tour-captures|siteCapture/);
assert.doesNotMatch(fs.readFileSync('tutorial.js','utf8'),/new Image|captures\[/);
console.log('Tour: 24 source-labelled native previews, matching focus targets, no raster text or live controls.');
