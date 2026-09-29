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
    assert(model.guide.noteTitle,round.id+' has a named teaching callout');
    const html=teaching.intro(curriculum,lesson,round);
    assert(model.source.guide,round.id+' has an authored guide');
    assert(html.includes('A small example')&&!html.includes('What each choice does'),round.id);
    assert(!html.includes('<details')&&!html.includes('>undefined<'),round.id+' essential explanations are visible');
    assert(!html.includes('teaching-route')&&!html.includes('teaching-tools'),round.id+' one reading path');
    assert(model.source.guide.choices.length>=2 && model.source.guide.choices.length<=4,round.id);
    assert(model.source.guide.idea.split(/\s+/).length<=50,round.id+' concise idea');
    if(!lesson.review){
      const syntax=teaching.syntax(lesson);
      assert.equal((syntax.match(/<dt>/g)||[]).length,lesson.syntax.length,round.id);
      assert.equal((syntax.match(/<details/g)||[]).length,lesson.syntaxLater?.length?1:0,round.id);
      assert(syntax.includes('syntax-choice-callout'),round.id);
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
assert(teaching.syntax(duplicates).includes('without quotes'));
assert(teaching.reference(curriculum,duplicates,duplicates.rounds[1]).includes('including the first'));
const bridge=curriculum.lessons.find(l=>l.id==='WR2');
assert.match(bridge.title,/Bridge review · Sections 02 \+ 03/);
assert.deepEqual(bridge.rounds.map(r=>r.retrieves),['W07','W10','W12']);
assert.deepEqual(bridge.rounds.map(r=>r.demand.split(' · ')[0]),['Section 02','Section 02','Section 03']);
const grouped=curriculum.lessons.find(l=>l.id==='W19');
assert.deepEqual(grouped.guide.choices.map(([code])=>code),['df.groupby("flavour", as_index=False)','.agg(...)','mean_amount=("price", "mean")','records=("price", "size")']);
assert.deepEqual(grouped.guide.exampleOutput.rows,[['fruity',3,2],['mint',8,1]]);
assert(teaching.intro(curriculum,grouped,grouped.rounds[0]).includes('Result after .agg(...)'));
assert(!teaching.intro(curriculum,grouped,grouped.rounds[0]).includes('syntax-choice-callout'));
assert.deepEqual(grouped.syntax.map(([code])=>code),['df.groupby("flavour", as_index=False)','.agg(...)','mean_amount=','("price", "mean")','records=','("price", "size")']);
assert(grouped.syntax.every(([,meaning])=>!/output name, source, operation/i.test(meaning)));
assert(grouped.syntaxCode.includes('mean_amount=("price", "mean"),\n    records=("price", "size")'));
assert(!teaching.syntax(grouped).includes('isolated-syntax'));
assert(teaching.syntax(grouped).includes('data-focus="size"'));
assert(teaching.syntax(grouped).includes('Why <code>size</code> here?'));
assert(teaching.reference(curriculum,grouped,grouped.rounds[1]).includes('Use size for a row count and count for known values.'));
assert(!teaching.reference(curriculum,grouped,grouped.rounds[1]).includes('This exercise asks for records'));
const bins=curriculum.lessons.find(l=>l.id==='W26');
const qcut=teaching.transition(bins.rounds[1]);
assert(!teaching.intro(curriculum,bins,bins.rounds[0]).includes('qcut'),'Follow teaches fixed cut boundaries');
assert(!teaching.syntax(bins).includes('qcut'),'Follow syntax stays on cut');
assert(qcut.includes('pd.qcut')&&qcut.includes('q=2')&&qcut.includes('labels=[&quot;lower&quot;, &quot;upper&quot;]'));
assert(qcut.includes('sample = pd.DataFrame')&&qcut.includes('Result of the four-price example'));
assert(qcut.includes('Tied values at a boundary')&&qcut.includes('qcut chooses boundaries'));
assert(bins.rounds[1].solution.includes('pd.qcut')&&bins.rounds[1].task.includes('sample-quantile'));
assert.equal(teaching.transition(bins.rounds[0]),'');
const transitions=curriculum.lessons.flatMap(l=>l.rounds.filter(r=>r.teaching));
assert.deepEqual(transitions.map(r=>r.id),['I02-3','I10-2','I10-3','I12-3','I14-2','I16-2','I16-3','W08-2','W09-2','W10-2','W15-3','W26-2','W28-2','W28-3','V08-2','V18-3','V32-2','V33-2','V33-3']);
for(const round of transitions){
  const panel=teaching.transition(round);
  assert(panel.includes('A small example')&&panel.includes('What each part does'),round.id);
  assert(panel.includes('syntax-choice-callout')&&panel.includes('<pre><code>'),round.id);
  assert.equal((panel.match(/<dt>/g)||[]).length,round.teaching.parts.length,round.id);
  assert(round.teaching.output||round.teaching.result,round.id+' shows a result');
}
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='V08')).includes('Other choices for later exercises'));
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='V33')).includes('Other choices for later exercises'));
for(const id of ['I10','I12','I14','I16','W09','W10','V08','V32','V33']){
  const follow=curriculum.lessons.find(l=>l.id===id);
  const stageCode=follow.rounds.slice(1).filter(r=>r.teaching).map(r=>r.teaching.title.toLowerCase());
  assert(stageCode.length,id+' has its new operation taught at the later practice');
  assert(!teaching.syntax(follow).includes('Other choices for later exercises')||!['I12','I14','I16','W09','W10','V08','V32','V33'].includes(id),id+' Follow is not a duplicate of the later panel');
}
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='V33')).includes('catplot'));
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='V33')).includes('displot'));
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='I10')).includes('isin'));
assert(!teaching.syntax(curriculum.lessons.find(l=>l.id==='I10')).includes('between'));
assert(curriculum.lessons.find(l=>l.id==='W28').rounds[1].hint.includes('MinMaxScaler'));
for(const l of curriculum.lessons) for(const r of l.rounds) {
  if(r.retrieves) {
    const source=curriculum.lessons.find(item=>item.id===r.retrieves).rounds[2];
    assert.equal(r.task,source.task,r.id+' retrieval uses the current brief');
    assert.equal(r.unorderedIndex,source.unorderedIndex,r.id+' retrieval uses the same checking rules');
    assert.equal(r.unorderedColumns,source.unorderedColumns,r.id+' retrieval uses the same column rules');
    assert.equal(r.unorderedRowsBy,source.unorderedRowsBy,r.id+' retrieval uses the same group rules');
    assert.deepEqual(r.plot,source.plot,r.id+' retrieval uses the same plot rules');
    assert(!r.teaching,r.id+' review does not repeat a Change or Transfer teaching panel');
  }
  assert(!/largest.*first/.test(r.task)||!r.unorderedIndex,r.id+' no redundant summary sort contract');
  assert((r.task.match(/Display the chart with plt.show/g)||[]).length<=1,r.id);
}
assert(curriculum.lessons.find(l=>l.id==='I15').rounds.every(r=>r.unorderedIndex));
console.log('Authored choices, visible essential teaching, duplicate flags and retrieval contracts verified.');
