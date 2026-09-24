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
  function reference(curriculum, lesson, round) {
    const {source}=model(curriculum,lesson,round), g=source.guide;
    return '<div class="teaching-recall"><figure class="teaching-illustration">'+root.FoundationVisuals.diagram(round.visual)+'</figure><p>'+esc(g.idea)+'</p>'+example(g,source.id)+comparison(g,source.id)+'<p>'+esc(g.note)+'</p></div>';
  }
  function example(guide, id) {
    return '<div class="teaching-example"><h4>A small example</h4><p>'+esc(guide.example)+'</p>'+(id==='I17'?duplicateExample():'')+'</div>';
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
    return '<section class="teaching-overview" data-teaching-source="'+esc(m.source.id)+'"><h3>Understand the idea</h3><p class="teaching-summary">'+esc(g.idea)+'</p>'+diagram+example(g,m.source.id)+comparison(g,m.source.id)+'<p class="teaching-note">'+esc(g.note)+'</p></section>';
  }
  function syntax(lesson) {
    return '<pre class="isolated-syntax"><code>' + esc(lesson.syntaxCode) + '</code></pre><dl class="foundation-syntax teaching-syntax-parts">' + lesson.syntax.map(([code,meaning],i) => '<div><dt><span aria-hidden="true">' + (i+1) + '</span><code>' + esc(code) + '</code></dt><dd>' + esc(meaning) + '</dd></div>').join('') + '</dl>';
  }
  const api = {model, intro, syntax, reference};
  root.FoundationTeaching = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
