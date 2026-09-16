import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{}};
for(const file of ['tour-content.js','tour-pages.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox);
const {chapters}=sandbox.window.TOUR_CONTENT,{locations}=sandbox.window.TOUR_PAGES;
assert.equal(chapters.length,25);
assert.equal(chapters[0].focus,'gate');
for(const group of ['Data','Stats','ML','Learn'])assert.ok(chapters.filter(c=>c.group===group).length>=5);
for(const c of chapters){const loc=locations[c.scene];assert.ok(c.title&&c.description&&c.context);assert.ok(loc?.targets[c.focus],`${c.scene}/${c.focus}`);assert.ok(fs.existsSync(loc.page));}
const controller=fs.readFileSync('tutorial.js','utf8'),html=fs.readFileSync('tutorial.html','utf8');
assert.match(html,/<iframe id="siteFrame"/);
assert.doesNotMatch(html,/tour-previews|tour-captures|scenePreview/);
assert.match(controller,/animate\(overview\(\),750/);
assert.match(controller,/animate\(pose\(focus\),1450/);
assert.doesNotMatch(controller,/Opening the preview/);
assert.equal(locations.home.targets.gate,'.gate-glow');
for(const [scene,focus] of [['data-guide','guide'],['ml-guide','guide'],['stats-study','study']])assert.ok(sandbox.window.TOUR_PAGES.opening({scene,focus}));
assert.match(controller,/page===url\?frame.contentDocument/,'Scroll context is retained between same-page stops');
assert.match(html,/sandbox="allow-same-origin"/);
assert.doesNotMatch(html,/allow-scripts/);
for(const profile of ['wide','mobile'])for(const c of chapters){
  const snapshot=fs.readFileSync(`assets/tour-snapshots/${profile}-${c.scene}-${c.focus}.html`,'utf8');
  assert.doesNotMatch(snapshot,/<script\b|\son\w+=|javascript:/i);
  assert.doesNotMatch(snapshot,/https?:\/\/(?:127\.0\.0\.1|localhost)/);
  assert.match(snapshot,/<meta name="robots" content="noindex">/);
  assert.match(snapshot,/<base href="\.\.\/\.\.\/">/);
}
assert.match(controller,/getBoundingClientRect/);
assert.match(fs.readFileSync('notebook-session.js','utf8'),/persist:false,confirmLeave:false/);
assert.match(fs.readFileSync('ad-mode.js','utf8'),/!tourEmbed/);
assert.match(fs.readFileSync('mascot.css','utf8'),/right:calc\(50% \+ min\(25vw,370px\)\);left:auto/);
// Opening/running a tour must not read, overwrite or restore a visitor's drafts.
const storageCalls=[];
const sessionSandbox={window:{DataPlaygroundTourEmbed:true,addEventListener(){}},document:{querySelector(){return null;},addEventListener(){}},setInterval(){},setTimeout(){},clearTimeout(){},localStorage:{getItem(k){storageCalls.push(['get',k]);},setItem(k,v){storageCalls.push(['set',k,v]);}}};
vm.runInNewContext(fs.readFileSync('notebook-session.js','utf8'),sessionSandbox);
const session=sessionSandbox.window.NotebookSession;
session.install({persist:true,confirmLeave:true,key:()=> 'ml:demo',get:()=>({cells:[]}),set(){throw Error('Tour must not restore a draft');}});
session.restore();session.save();session.last('ml');assert.equal(storageCalls.length,0);
console.log('Tour: 25 exact-interface targets, script-free desktop/mobile snapshots, slow movement and garden entry.');
