(function (root) {
  'use strict';
  // Rendering only: authored teaching lives with the curriculum in clarity.js.
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function model(curriculum, lesson, round) {
    const source = round.retrieves ? curriculum.lessons.find(item => item.id === round.retrieves) : lesson;
    if (!source?.guide) throw new Error('Missing concept guide: ' + lesson.id);
    return {source, guide:source.guide};
  }
  function duplicateExample() {
    const flags = [
      ['A · first', false, true, true],
      ['B · unique', false, false, false],
      ['A · second', true, true, true],
      ['A · third', true, false, true]
    ];
    return '<table class="teaching-flags"><caption>Same rows, different keep choices</caption><thead><tr><th scope="col">Row</th><th scope="col"><code>"first"</code></th><th scope="col"><code>"last"</code></th><th scope="col"><code>False</code></th></tr></thead><tbody>' + flags.map(row => '<tr><th scope="row">' + row[0] + '</th>' + row.slice(1).map(flag=>'<td class="'+(flag?'flag-true':'flag-false')+'">'+(flag?'True':'False')+'</td>').join('') + '</tr>').join('') + '</tbody></table>';
  }
  function comparison(guide, id) {
    return '<table class="teaching-comparison" data-code-table="teaching"><caption>What each choice does</caption><thead><tr><th scope="col">Code or choice</th><th scope="col">Meaning</th></tr></thead><tbody>' + guide.choices.map(([code,meaning]) => '<tr><th scope="row"><code>' + esc(code) + '</code></th><td>' + esc(id==='I17' ? meaning.replace(/ Flags:.*$/, '') : meaning) + '</td></tr>').join('') + '</tbody></table>';
  }
  function callout(guide,id,follow=false) {
    const title=id==='W19'?(follow?'Why <code>size</code> here?':'<code>size</code> or <code>count</code>?'):esc(guide.noteTitle);
    const note=follow&&guide.followNote?guide.followNote:guide.note;
    return '<aside class="syntax-choice-callout'+(id==='W19'&&follow?' is-linked':'')+'"><strong>'+title+'</strong><p>'+esc(note)+'</p></aside>';
  }
  function reference(curriculum, lesson, round, {includeExample=true}={}) {
    const {source}=model(curriculum,lesson,round), g=source.guide;
    return '<div class="teaching-recall">'+(includeExample?example(g,source.id):'')+comparison(g,source.id)+callout(g,source.id)+earlier(g.prerequisiteLessons)+'</div>';
  }
  function earlier(lessons) {
    if(!lessons?.length)return '';
    return '<p class="teaching-prerequisites">Earlier teaching: '+lessons.map(l=>'<a href="data-foundations-'+esc(l.id)+'.html">'+esc(l.title)+'</a>').join(' · ')+'</p>';
  }
  function exampleOutput(output) {
    const kind=output?.kind||(output?.headers?.[0]==='Object'?'objects':output?.headers?.[0]==='Column'?'dictionary':'teaching');
    return output?'<div class="teaching-example-table-scroll"><table class="teaching-example-output" data-code-table="'+kind+'"><caption>'+esc(output.caption)+'</caption><thead><tr>'+output.headers.map(header=>'<th scope="col">'+esc(header)+'</th>').join('')+'</tr></thead><tbody>'+output.rows.map(row=>'<tr><th scope="row">'+esc(row[0])+'</th>'+row.slice(1).map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'';
  }
  function example(guide, id) {
    return '<div class="teaching-example"><h4>A small example</h4><p>'+esc(guide.example)+'</p>'+exampleOutput(guide.exampleOutput)+(id==='I17'?duplicateExample():'')+'</div>';
  }
  function transition(round) {
    const g=round.teaching;
    if(!g)return '';
    const parts=g.parts.map(([code,meaning])=>'<div><dt><code>'+esc(code)+'</code></dt><dd>'+esc(meaning)+'</dd></div>').join('');
    const code=round.workflow?.changedTeachingLines?.length&&root.FoundationLearning?.changedCode
      ?root.FoundationLearning.changedCode(g.code,round.workflow.changedTeachingLines):esc(g.code);
    return '<section class="teaching-transition" data-code-context="teaching" aria-label="New method for this practice"><span class="foundation-eyebrow">New in this practice</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.idea)+'</p><div class="teaching-example"><h4>A small example</h4><p>'+esc(g.example)+'</p><pre><code>'+code+'</code></pre>'+(g.excerpt?'<p class="teaching-excerpt-note">Uses the imports already shown in the editor.</p>':'')+exampleOutput(g.output)+(g.result?'<p class="teaching-example-result"><strong>Result:</strong> '+esc(g.result)+'</p>':'')+'</div><h4>What each part does</h4><dl class="foundation-syntax teaching-syntax-parts">'+parts+'</dl><aside class="syntax-choice-callout"><strong>'+esc(g.noteTitle)+'</strong><p>'+esc(g.note)+'</p></aside>'+earlier(g.lessons)+'</section>';
  }
  function intro(curriculum, lesson, round) {
    const m = model(curriculum, lesson, round), g=m.source.guide;
    const visuals = root.FoundationVisuals;
    const operation = root.FoundationOperationVisuals?.render(curriculum,lesson,round)||'';
    const explorer=m.source.id==='V35'?'':visuals.interactive?.(round.visual);
    const chartChoices = [['scatter','Two numeric variables'],['histogram','One numeric distribution'],['count-bars','Category frequencies'],['line','Change over time']];
    // One explanatory visual: charts for visual concepts, a concrete worked
    // miniature for table concepts. No second abstract Input/Operation/Result strip.
    const diagram = operation || (m.source.id === 'V35'
      ? '<div class="teaching-chart-choices">' + chartChoices.map(([id,label]) => '<figure>' + visuals.diagram(visuals.spec(id)) + '<figcaption>' + esc(label) + '</figcaption></figure>').join('') + '</div>'
      : (explorer||'<figure class="teaching-illustration"><div class="foundation-concept-scroll" tabindex="0" role="region" aria-label="Illustration; scroll if needed">'+visuals.diagram(round.visual)+'</div><figcaption>'+esc(visuals.sceneLabel(round.visual))+'</figcaption>'+visuals.scientificEvidence(round.visual)+'</figure>'));
    const plottingIntro=m.source.id==='V02'?'<aside class="syntax-choice-callout"><strong>Two plotting tools, one Figure</strong><p>Matplotlib creates fig and ax and handles labels and layout. Seaborn draws on ax. Equivalent Matplotlib code is welcome.</p></aside>':'';
    const detailedExample=operation||explorer||m.source.id==='I17'||m.source.deck==='visualise'&&m.source.id!=='V35';
    return '<section class="teaching-overview" data-teaching-source="'+esc(m.source.id)+'">'+plottingIntro+'<h3>Understand the idea</h3><p class="teaching-summary">'+esc(g.idea)+'</p>'+diagram+(detailedExample?'':example(g,m.source.id))+'</section>';
  }
  function newInTask(curriculum,lesson,round){
    const g=round.stageTeaching;
    if(!g||lesson.review||round.retrieves||round===lesson.rounds[0])return '';
    return '<section class="teaching-transition teaching-stage-addition" data-code-context="teaching" data-teaching-stage="'+esc(round.id)+'" aria-label="What is new in this task"><h3>What’s new in this task</h3><p>'+esc(g.idea)+'</p>'+(g.code?'<pre><code>'+esc(g.code)+'</code></pre>':'')+(g.parts?.length?'<dl class="foundation-syntax teaching-syntax-parts">'+syntaxRows(lesson,g.parts)+'</dl>':'')+(g.note?'<p class="teaching-excerpt-note">'+esc(g.note)+'</p>':'')+'</section>';
  }
  function syntaxRows(lesson,items){
    return items.map((entry,i)=>{
      const [code,meaning]=Array.isArray(entry)?entry:[entry.code||entry.title,entry.meaning];
      return '<div><dt><span aria-hidden="true">'+(i+1)+'</span><code>'+esc(code)+'</code></dt><dd>'+esc(meaning)+'</dd></div>';
    }).join('');
  }
  function syntax(lesson,round){
    const params=new Set([...(round?.parameterTeaching?.introduces||[]),...(round?.parameterTeaching?.extends||[])].map(name=>name.split('.').at(-1)));
    const current=round?.syntaxGuidance?.current || (lesson.syntax||[]).filter(([code])=>!(lesson.syntaxLater||[]).includes(code));
    const essential=current.filter(p=>!params.has((Array.isArray(p)?p[0]:p.code||'').match(/^\s*([A-Za-z_]\w*)\s*=/)?.[1]));
    return essential.length?'<h3 class="teaching-syntax-heading">What the syntax does</h3><dl class="foundation-syntax teaching-syntax-parts">'+syntaxRows(lesson,essential)+'</dl>':'';
  }
  function syntaxReference(lesson,round){
    const guidance=round?.syntaxGuidance;
    const entries=guidance?[...guidance.reminders,...guidance.reference]:(lesson.syntax||[]).filter(([code])=>(lesson.syntaxLater||[]).includes(code));
    return entries.length?'<section><h3>Related syntax</h3><dl class="foundation-syntax teaching-syntax-parts">'+syntaxRows(lesson,entries)+'</dl></section>':'';
  }
  const api = {model, intro, newInTask, syntax, syntaxReference, reference, transition, example};
  root.FoundationTeaching = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
