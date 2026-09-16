/* Locations in the actual application. No duplicate markup or styling. */
window.TOUR_PAGES = (() => {
  const locations = {
    data: {page:'playground.html', targets:{nav:'.top-actions',dataset:'.dataset-picker',route:'#suggestedRoute'}},
    'data-run': {page:'playground.html', targets:{cell:'#notebookPanel .cell'}},
    'data-guide': {page:'playground.html', targets:{guide:'#guideWindow'}},
    stats: {page:'statistics.html', targets:{setup:'.control-strip',route:'#routeStrip'}},
    'stats-study': {page:'statistics.html', targets:{study:'#studyPanel',confidence:'#confidence'}},
    'stats-results': {page:'statistics.html', targets:{output:'.output-panel'}},
    ml: {page:'ml.html', targets:{dataset:'.control.dataset',model:'.control-group',route:'#routeStrip'}},
    'ml-guide': {page:'ml.html', targets:{guide:'#guideWindow'}},
    'ml-validate': {page:'ml.html', targets:{guide:'#workflow-step-5 .workflow-step-concepts'}},
    'ml-tune': {page:'ml.html', targets:{guide:'#workflow-step-7 .workflow-step-concepts'}},
    'ml-results': {page:'ml.html', targets:{result:'.output-panel'}},
    home: {page:'index.html', targets:{robot:'.mascot-cta',gate:'.gate-hitbox'}},
    learn: {page:'learn.html', targets:{pathways:'.learn-pathways'}},
    decks: {page:'data-foundations.html', hash:'', targets:{decks:'.foundation-decks'}},
    chapters: {page:'data-foundations.html', hash:'#inspect', targets:{chapters:'.chapter-jumps'}},
    lesson: {page:'data-foundations.html', hash:'#inspect/I01/0', targets:{exercise:'.foundation-practices',practice:'.foundation-code-pane'}},
    'lesson-result': {page:'data-foundations.html', hash:'#inspect/I01/0', targets:{progression:'.foundation-navigation'}},
  };
  const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
  async function until(test, alive, timeout=60000) {
    const start=performance.now();
    while(alive()) {
      const result=test(); if(result)return result;
      if(performance.now()-start>timeout)throw Error('The example is taking longer to load. Check your connection, then select this step to retry.');
      await pause(120);
    }
    throw Error('cancelled');
  }
  async function prepare(frame, chapter, alive, status) {
    const d=frame.contentDocument, w=frame.contentWindow, q=s=>d.querySelector(s);
    const scene=chapter.scene, loc=locations[scene];
    if(loc.hash!==undefined && w.location.hash!==loc.hash) {w.location.hash=loc.hash;await pause(100);}
    if(['playground.html','ml.html','statistics.html'].includes(loc.page)) {
      if(!(scene==='data' && chapter.focus==='nav')) {
        status('Preparing the real playground…');
        await until(()=>q('#runAllButton') && !q('#runAllButton').disabled && !/loading|starting|preparing/i.test(q('#runtimeStatus')?.textContent||''),alive);
      }
      if(!['data-guide','ml-guide','ml-validate','ml-tune'].includes(scene) && q('#guideWindow') && !q('#guideWindow').hidden)q('#guideClose')?.click();
      if(loc.page==='statistics.html') {const open=scene==='stats-study' && chapter.focus==='study';if(q('#studyPanel').hidden===open)q('#studyButton').click();}
    }
    if(scene==='data-run' && !q('#notebookPanel .cell')) {
      q('#suggestedRoute button').click();await until(()=>q('#notebookPanel .cell'),alive);
    }
    if(scene==='data-run')await until(()=>q('#notebookPanel .cell')?.dataset.status==='done',alive);
    if(['data-guide','ml-guide','ml-validate','ml-tune'].includes(scene)) {
      if(q('#guideWindow').hidden)q('#guideButton').click();
      const step=scene==='ml-validate'?5:scene==='ml-tune'?7:0,article=q(`#workflow-step-${step}`);
      if(article){const body=q('#guideBody');await scroll(body,article.getBoundingClientRect().top-body.getBoundingClientRect().top+body.scrollTop-85,alive);}
    }
    if(scene==='stats-results' || scene==='ml-results') {
      const done=()=>scene==='stats-results'?q('#routeStrip button:last-child')?.dataset.state==='done':/open|used/i.test(q('#holdoutState')?.textContent||'');
      if(!done()) {status('Running the demonstration’s suggested route…');q('#runAllButton').click();await until(done,alive,120000);}
      const output=q('#outputBody');if(output)await scroll(output,output.scrollHeight,alive);
    }
    if(scene==='lesson-result') {
      const editor=await until(()=>q('#foundationEditor'),alive);
      editor.value=q('#foundationSolution code').textContent;editor.dispatchEvent(new w.Event('input',{bubbles:true}));q('#checkExercise').click();
      status('Running the lesson example…');await until(()=>q('#foundationFeedback')?.dataset.state==='pass',alive,60000);
    }
    await d.fonts.ready;
    let selector=loc.targets[chapter.focus];
    if(w.innerWidth<=1120 && scene==='stats-results')selector='#notebookPanel .cell-stack:last-child .statistics-evidence';
    if(w.innerWidth<=1120 && scene==='ml-results')selector='#notebookPanel .cell-stack:last-child .cell-inline-output .result-table-wrap';
    return until(()=>q(selector),alive,5000);
  }
  async function scroll(element,to,alive) {
    const start=element.scrollTop,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,began=performance.now();
    // The app may set scroll-behavior:smooth. Our timed pan must not start a new
    // browser smooth-scroll on every animation frame or measure before it settles.
    const behavior=element.style.scrollBehavior;
    element.style.scrollBehavior='auto';
    await new Promise(resolve=>{function tick(now){if(!alive())return resolve();const t=reduced?1:Math.min(1,(now-began)/1400),e=t*t*(3-2*t);element.scrollTop=start+(to-start)*e;if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
    element.style.scrollBehavior=behavior;
  }
  return {locations,prepare,scroll,until,pause};
})();
