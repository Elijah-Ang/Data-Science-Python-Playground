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
    assert(model.summary.split(/\s+/).length<=30,round.id+' summary is concise');
    assert.equal(model.route.length,3);
    assert(model.route.every(part=>part&&part.length<=65),round.id);
    assert(model.rule&&model.source.explanation,round.id);
    const html=teaching.intro(curriculum,lesson,round);
    assert(html.includes('role="img"')&&html.includes('How the operation works'),round.id);
    assert(html.includes('More detail')&&!html.includes('undefined'),round.id);
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
assert(teaching.model(curriculum,lesson,lesson.rounds[1]).route.includes('Last rows'));
assert(teaching.model(curriculum,lesson,lesson.rounds[2]).route.includes('A repeatable preview'));
const choices=curriculum.lessons.find(l=>l.id==='V35');
for(const round of choices.rounds){
  assert.equal((teaching.intro(curriculum,choices,round).match(/role="img"/g)||[]).length,4);
}
console.log(`Visual teaching: all ${count} exercises, retrieval links, concise summaries, syntax coverage and chart alternatives verified.`);
