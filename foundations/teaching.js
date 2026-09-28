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
    return '<table class="teaching-comparison"><caption>What each choice does</caption><thead><tr><th scope="col">Code or choice</th><th scope="col">Meaning</th></tr></thead><tbody>' + guide.choices.map(([code,meaning]) => '<tr><th scope="row"><code>' + esc(code) + '</code></th><td>' + esc(id==='I17' ? meaning.replace(/ Flags:.*$/, '') : meaning) + '</td></tr>').join('') + '</tbody></table>';
  }
  function callout(guide,id,follow=false) {
    const title=id==='W19'?(follow?'Why <code>size</code> here?':'<code>size</code> or <code>count</code>?'):esc(guide.noteTitle);
    const note=follow&&guide.followNote?guide.followNote:guide.note;
    return '<aside class="syntax-choice-callout'+(id==='W19'&&follow?' is-linked':'')+'"><strong>'+title+'</strong><p>'+esc(note)+'</p></aside>';
  }
  function reference(curriculum, lesson, round) {
    const {source}=model(curriculum,lesson,round), g=source.guide;
    return '<div class="teaching-recall"><figure class="teaching-illustration">'+root.FoundationVisuals.diagram(round.visual)+'</figure><p>'+esc(g.idea)+'</p>'+example(g,source.id)+comparison(g,source.id)+callout(g,source.id)+'</div>';
  }
  function example(guide, id) {
    const output=guide.exampleOutput;
    const result=output?'<table class="teaching-example-output"><caption>'+esc(output.caption)+'</caption><thead><tr>'+output.headers.map(header=>'<th scope="col">'+esc(header)+'</th>').join('')+'</tr></thead><tbody>'+output.rows.map(row=>'<tr><th scope="row">'+esc(row[0])+'</th>'+row.slice(1).map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'';
    return '<div class="teaching-example"><h4>A small example</h4><p>'+esc(guide.example)+'</p>'+result+(id==='I17'?duplicateExample():'')+'</div>';
  }
  function intro(curriculum, lesson, round) {
    const m = model(curriculum, lesson, round), g=m.source.guide;
    const visuals = root.FoundationVisuals;
    const chartChoices = [['scatter','Two numeric variables'],['histogram','One numeric distribution'],['count-bars','Category frequencies'],['line','Change over time']];
    // One explanatory visual: charts for visual concepts, a concrete worked
    // miniature for table concepts. No second abstract Input/Operation/Result strip.
    const diagram = m.source.id === 'V35'
      ? '<div class="teaching-chart-choices">' + chartChoices.map(([id,label]) => '<figure>' + visuals.diagram(visuals.spec(id)) + '<figcaption>' + esc(label) + '</figcaption></figure>').join('') + '</div>'
      : '<figure class="teaching-illustration">'+visuals.diagram(round.visual)+'<figcaption>Illustration · not the exercise output</figcaption></figure>';
    return '<section class="teaching-overview" data-teaching-source="'+esc(m.source.id)+'"><h3>Understand the idea</h3><p class="teaching-summary">'+esc(g.idea)+'</p>'+diagram+example(g,m.source.id)+'</section>';
  }
  function syntax(lesson) {
    const row=([code,meaning],i) => {
      const size=lesson.id==='W19'&&code==='("price", "size")';
      return '<div'+(size?' class="syntax-size-row"':'')+'><dt><span aria-hidden="true">' + (i+1) + '</span><code'+(size?' data-focus="size"':'')+'>' + esc(code) + '</code></dt><dd>' + esc(meaning) + '</dd></div>';
    };
    const later=new Set(lesson.syntaxLater||[]);
    const worked=lesson.syntax.filter(([code])=>!later.has(code));
    const alternatives=lesson.syntax.filter(([code])=>later.has(code));
    const related=alternatives.length?'<details class="teaching-more"><summary>Other choices for later exercises</summary><dl class="foundation-syntax teaching-syntax-parts">'+alternatives.map(row).join('')+'</dl></details>':'';
    return '<dl class="foundation-syntax teaching-syntax-parts">'+worked.map(row).join('')+'</dl>'+related+callout(lesson.guide,lesson.id,true);
  }
  const api = {model, intro, syntax, reference};
  root.FoundationTeaching = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
