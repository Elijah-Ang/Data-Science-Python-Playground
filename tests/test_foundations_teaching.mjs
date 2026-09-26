import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const curriculum=require('../foundations/curriculum.js');
const teaching=require('../foundations/teaching.js');
const workspace=require('../foundations/workspace.js');
globalThis.FoundationVisuals=require('../foundations/visuals.js');
let count=0;
for(const lesson of curriculum.lessons){
  for(const round of lesson.rounds){
    const supplied=workspace.setup(curriculum,round);
    const editor=workspace.code(curriculum,round);
    assert(editor.endsWith(round.starter),round.id);
    if(round.setup)assert(supplied.includes(round.setup),round.id);
    if(round.files)assert(!supplied.includes('df ='),round.id+' leaves importing to learner');
    const model=teaching.model(curriculum,lesson,round);
    assert.equal(model.source.id,round.retrieves||lesson.id,round.id);
    assert(model.guide.note&&model.source.explanation,round.id);
    const html=teaching.intro(curriculum,lesson,round);
    assert(model.source.guide,round.id+' has an authored guide');
    assert(html.includes('A small example')&&html.includes('What each choice does'),round.id);
    assert(!html.includes('<details')&&!html.includes('>undefined<'),round.id+' essential explanations are visible');
    assert(!html.includes('teaching-route')&&!html.includes('teaching-tools'),round.id+' one reading path');
    assert(model.source.guide.choices.length>=2 && model.source.guide.choices.length<=4,round.id);
    assert(model.source.guide.idea.split(/\s+/).length<=50,round.id+' concise idea');
    if(!lesson.review){
      const syntax=teaching.syntax(lesson);
      assert.equal((syntax.match(/<dt>/g)||[]).length,lesson.syntax.length,round.id);
    }
    count++;
  }
}
const lesson=curriculum.lessons.find(l=>l.id==='I02');
assert(!workspace.setup(curriculum,curriculum.lessons.find(l=>l.id==='I01').rounds[1]),'Construction starts without a completed setup');
assert(workspace.setup(curriculum,lesson.rounds[0]).includes('df = pd.DataFrame(data)'));
assert(teaching.model(curriculum,lesson,lesson.rounds[1]).guide.choices.some(([code])=>code.includes('tail')));
assert(teaching.model(curriculum,lesson,lesson.rounds[2]).guide.choices.some(([code])=>code.includes('random_state')));
const choices=curriculum.lessons.find(l=>l.id==='V35');
for(const round of choices.rounds){
  assert.equal((teaching.intro(curriculum,choices,round).match(/role="img"/g)||[]).length,4);
}
console.log(`Visual teaching: all ${count} exercises, retrieval links, authored guides, syntax coverage and chart alternatives verified.`);

const duplicates=curriculum.lessons.find(l=>l.id==='I17');
const html=teaching.intro(curriculum,duplicates,duplicates.rounds[0]);
assert(html.includes('Same rows, different keep choices'));
assert(html.includes('B · unique') && html.includes('flag-false'));
assert(html.includes('including the first') && html.includes('without quotes'));
for(const l of curriculum.lessons) for(const r of l.rounds) {
  if(r.retrieves) {
    const source=curriculum.lessons.find(item=>item.id===r.retrieves).rounds[2];
    assert.equal(r.task,source.task,r.id+' retrieval uses the current brief');
    assert.equal(r.unorderedIndex,source.unorderedIndex,r.id+' retrieval uses the same checking rules');
    assert.equal(r.unorderedColumns,source.unorderedColumns,r.id+' retrieval uses the same column rules');
    assert.equal(r.unorderedRowsBy,source.unorderedRowsBy,r.id+' retrieval uses the same group rules');
    assert.deepEqual(r.plot,source.plot,r.id+' retrieval uses the same plot rules');
  }
  assert(!/largest.*first/.test(r.task)||!r.unorderedIndex,r.id+' no redundant summary sort contract');
  assert((r.task.match(/Display the chart with plt.show/g)||[]).length<=1,r.id);
}
assert(curriculum.lessons.find(l=>l.id==='I15').rounds.every(r=>r.unorderedIndex));
console.log('Authored choices, visible essential teaching, duplicate flags and retrieval contracts verified.');
