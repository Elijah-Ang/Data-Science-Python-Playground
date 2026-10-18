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
    return output?'<div class="teaching-example-table-scroll"><table class="teaching-example-output" data-code-table="'+kind+'"><caption>'+esc(output.caption)+'</caption><thead><tr>'+output.headers.map(header=>'<th scope="col">'+(output.columnHeaders?.includes(header)?'<code data-code-role="column">'+esc(header)+'</code>':esc(header))+'</th>').join('')+'</tr></thead><tbody>'+output.rows.map(row=>'<tr><th scope="row">'+esc(row[0])+'</th>'+row.slice(1).map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'';
  }
  function example(guide, id) {
    return '<div class="teaching-example"><h4>A small example</h4><p>'+esc(guide.example)+'</p>'+exampleOutput(guide.exampleOutput)+(id==='I17'?duplicateExample():'')+'</div>';
  }
  // Table concepts use real table layout at reading size, rather than shrinking
  // a whole before/after diagram into a small fixed SVG canvas.
  function staticIllustration(id){
    const simple={headers:['name','age'],rows:[['A',2],['B',4]]};
    const prices={headers:['name','price'],rows:[['A',2],['B',4]]};
    const repeated={headers:['name','price'],rows:[['A',2],['B',4],['A',2],['A',2]]};
    const illustrations={
      I01:{code:'data = {"name": ["A", "B"], "age": [2, 4]}\ndf = pd.DataFrame(data)',tables:[{...simple,caption:'DataFrame'}]},
      I01CSV:{code:'df = pd.read_csv("tiny.csv")',file:'name,price\nA,2\nB,4',tables:[{...prices,caption:'DataFrame'}]},
      I03:{code:'df.shape',tables:[{caption:'DataFrame',headers:['name','age','price','group','score'],rows:[['A',2,4,'X',7],['B',4,3,'Y',5],['C',3,6,'X',8],['D',5,2,'Y',6],['E',1,5,'X',9],['F',6,1,'Y',4]]}],result:'(6, 5)'},
      I04:{code:'list(df.columns)',tables:[{...simple,caption:'DataFrame'}],result:'["name", "age"]'},
      I05:{code:'df.dtypes',tables:[{...prices,caption:'DataFrame'},{caption:'Column types',headers:['Column','Type'],rows:[['name','object'],['price','int64']]}]},
      I06S:{code:'list(readings.index)',tables:[{caption:'Series',headers:['Position','Index label','Reading'],rows:[[0,101,12],[1,109,4],[2,103,19]]}],result:'[101, 109, 103]'},
      I17:{code:'df.duplicated()',tables:[{...repeated,caption:'DataFrame'},{caption:'Duplicate flags',headers:['Row','Duplicate'],rows:[[0,'False'],[1,'False'],[2,'True'],[3,'True']]}]},
      I19A:{code:'pd.DataFrame({"mean": means, "records": counts})',inputCount:2,tables:[{caption:'means',headers:['Label','Mean'],rows:[['A',4],['B',9]]},{caption:'counts',headers:['Label','Records'],rows:[['B',3],['A',2]]},{caption:'Aligned result',headers:['Label','mean','records'],rows:[['A',4,2],['B',9,3]]}]},
      W13:{code:'df["flavour"] = df["flavour"].astype("category")',tables:[{caption:'Before · object',headers:['flavour'],rows:[['A'],['B'],['A']]},{caption:'After · category',headers:['flavour'],rows:[['A'],['B'],['A']]}]},
      W18:{code:'df.drop_duplicates()',tables:[{...repeated,rows:repeated.rows.slice(0,3),caption:'Before'},{...prices,caption:'After'}]}
    };
    const item=illustrations[id];if(!item)return '';
    const tables=item.tables.map((data,i)=>
      (i===(item.inputCount||1)?'<span class="operation-arrow" role="img" aria-label="produces">&rarr;</span>':'')+
      exampleOutput({...data,columnHeaders:data.headers.filter(name=>['name','age','price','group','score','flavour','mean','records'].includes(name))}).replace('class="teaching-example-table-scroll"','class="operation-table-scroll" tabindex="0" role="region" aria-label="'+esc(data.caption)+'"').replace('class="teaching-example-output"','class="teaching-example-output operation-table"')).join('');
    return '<figure class="teaching-illustration teaching-table-illustration" aria-label="Illustrative example"><p class="operation-example-label">Illustrative data</p><pre><code>'+esc(item.code)+'</code></pre>'+(item.file?'<div class="illustration-file"><strong>tiny.csv</strong><pre><samp>'+esc(item.file)+'</samp></pre></div>':'')+'<div class="operation-tables">'+tables+(item.result?'<span class="operation-arrow" aria-hidden="true">&rarr;</span><div class="operation-scalar"><span>Result</span><output><code>'+esc(item.result)+'</code></output></div>':'')+'</div></figure>';
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
    const operation = root.FoundationOperationVisuals?.render(curriculum,lesson,round)||(round===m.source.rounds[0]?staticIllustration(m.source.id):'');
    const explorer=m.source.id==='V35'?'':visuals.interactive?.(round.visual);
    const chartChoices = [['scatter','Two numeric variables'],['histogram','One numeric distribution'],['count-bars','Category frequencies'],['line','Change over time']];
    // One explanatory visual: charts for visual concepts, a concrete worked
    // miniature for table concepts. No second abstract Input/Operation/Result strip.
    const diagram = operation || (m.source.id === 'V35'
      ? '<div class="teaching-chart-choices">' + chartChoices.map(([id,label]) => '<figure>' + visuals.diagram(visuals.spec(id)) + '<figcaption>' + esc(label) + '</figcaption></figure>').join('') + '</div>'
      : (explorer||'<figure class="teaching-illustration"><div class="foundation-concept-scroll" tabindex="0" role="region" aria-label="Illustration; scroll if needed">'+visuals.diagram(round.visual)+'</div><figcaption>'+esc(visuals.sceneLabel(round.visual))+'</figcaption>'+(m.source.deck==='visualise'?'':visuals.scientificEvidence(round.visual))+'</figure>'));
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
      return '<div><dt><span aria-hidden="true">'+(i+1)+'</span><code>'+esc(code)+'</code></dt><dd>'+esc(root.FoundationLearning?.syntaxMeaning(code,meaning)||meaning)+'</dd></div>';
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
