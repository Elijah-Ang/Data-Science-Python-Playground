(() => {
'use strict';
const C=window.FoundationsCurriculum;
const main=document.getElementById('foundationsMain');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const highlightPython=FoundationLearning.highlightPython;
const taskText=value=>LearningLanguage.text(value,view?.round?.id,true);
let shownControlHelp=false;
let view=null, generation=0, bridge=null, bridgePromise=null, busy=false;
let runtimeStatus='Python starts when you open a lesson.';
// Product policy: no saved learning, drafts, resume, completion records, progress
// bars or tracking unless the user explicitly requests them in a future change.
// Remove legacy drafts; current code exists only in the active editor.
try { if(!window.DataPlaygroundTourEmbed)localStorage.removeItem('dspp-foundations-v1'); } catch {}
function url(lesson,round=0){return `#${lesson.deck}/${lesson.id}/${round}`;}
function lessonSequence(lesson){return lesson.review?(lesson.rounds.some(r=>r.retrieves)?'Spaced practice':'Checkpoint'):'Lesson '+String(C.lessons.filter(l=>l.deck===lesson.deck&&!l.review).indexOf(lesson)+1).padStart(2,'0');}
function table(columns,rows,caption){return `<div class="foundation-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${columns.map(x=>`<th scope="col">${x==='row'?esc(x):`<code data-code-role="column">${esc(x)}</code>`}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${value===null?'<span title="Missing value">None</span>':typeof value==='string'&&value.trim()!==value?`&quot;${esc(value)}&quot;`:esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function datasetTable(dataset){const columns=Object.keys(dataset.columns);return table(dataset.index?['row',...columns]:columns,dataset.columns[columns[0]].map((_,i)=>[...(dataset.index?[dataset.index[i]]:[]),...columns.map(c=>dataset.columns[c][i])]),dataset.name);}
const icon=`<svg class="deck-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h25v5H7zM10 9h25v5H10zM5 14h26v22H5zM10 21h16M10 27h10"/></svg>`;
function landing(){
 document.body.dataset.deck='';
 return `<section class="foundation-hero"><div><h2>Data Foundations</h2><p>Choose Inspect to read tables, Wrangle to prepare data, or Visualise to build and interpret charts.</p></div></section>

 <div class="foundation-decks">${C.decks.map(d=>{const items=C.lessons.filter(l=>l.deck===d.id);return `<a class="foundation-deck" data-deck="${d.id}" href="#${d.id}"><div class="deck-top"><span>DECK ${d.number}</span>${icon}</div><h3>${esc(d.title)}</h3><p>${esc(d.tagline)}</p><div class="deck-bottom"><span>${items.filter(l=>!l.review).length} lessons · ${items.filter(l=>l.review).length} reviews · ${ChallengeExperience.all.filter(c=>c.deck===d.id).length} challenges</span><span aria-hidden="true">↗</span></div></a>`;}).join('')}</div>

 `;
}
function deckPage(deck){
 document.body.dataset.deck=deck.id;
 return `<header class="foundation-deck-heading"><span class="foundation-eyebrow">Deck ${deck.number}</span><h2>${esc(deck.title)}</h2><p>${esc(deck.description)}</p>${deck.id==='visualise'?'<p class="visualise-path-key"><strong>Core path:</strong> Build and explain useful charts. <strong>Optional extensions:</strong> Explore additional chart types and techniques.</p>':''}${ChallengeExperience.tabs(deck,'lessons')}<p class="recommended-start"><a href="${url(C.lessons.find(l=>l.deck===deck.id&&!l.review&&l.level==='Core'))}">Start the core path →</a></p><nav class="chapter-jumps" aria-label="Jump to chapter">${deck.chapters.map((chapter,i)=>`<span class="chapter-step">${i?'<span class="chapter-flow-arrow" aria-hidden="true">→</span>':''}<a href="#${deck.id}/chapter/${i}">${esc(chapter)}</a></span>`).join('')}</nav></header>`+deck.chapters.map((chapter,i)=>{const items=C.lessons.filter(l=>l.deck===deck.id&&l.chapter===i);return items.length?`<section class="foundation-chapter" id="chapter-${i}" tabindex="-1"><h3>${String(i+1).padStart(2,'0')} / ${esc(chapter)}</h3><div class="lesson-library">${items.map(l=>`<a class="lesson-card ${l.review?'is-review':''}" href="${url(l)}"><div class="card-meta"><span class="card-id">${esc(lessonSequence(l))}</span><span class="card-level">${esc(l.level)}</span></div>${FoundationVisuals.diagram(l.visual)}<h4>${esc(l.title)}</h4><p>${esc(l.goal)}</p><small>${l.minutes} min · ${l.rounds.length} ${l.review?'retrieval tasks':'practices'}</small></a>`).join('')}</div></section>`:'';}).join('');
}
function lessonPage(lesson,roundIndex){
 const round=lesson.rounds[roundIndex],deck=C.decks.find(x=>x.id===lesson.deck),dataset=C.datasets[round.dataset];
 const follow=!lesson.review&&roundIndex===0;
 const controlHelp=!lesson.review&&roundIndex===0&&!shownControlHelp; if(controlHelp)shownControlHelp=true;
 view={lesson,round,roundIndex};document.body.dataset.deck=lesson.deck;
 const previous=roundIndex?url(lesson,roundIndex-1):previousLesson(lesson),next=roundIndex<lesson.rounds.length-1?url(lesson,roundIndex+1):nextLesson(lesson);
 const workSource=lesson.deck==='visualise'?lesson.syntaxCode:lesson.example;
 const work=follow?`<section class="teaching-worked" data-code-context="example"><h3>Follow the code</h3><pre><code>${highlightPython(workSource)}</code></pre>${FoundationTeaching.syntax(lesson,round)}</section>`:'';
 return LearningLanguage.render(`<nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Data Foundations</a><span aria-hidden="true">/</span><span>${esc(deck.title)}</span><span aria-hidden="true">/</span><span>${esc(lessonSequence(lesson))}</span></nav>
 <header class="foundation-lesson-heading"><div class="foundation-lesson-copy"><span class="foundation-eyebrow">${esc(deck.chapters[lesson.chapter])} · ${esc(lessonSequence(lesson))} · ${lesson.minutes} MIN</span><h2>${esc(lesson.title)}</h2><p>${esc(follow?lesson.goal:round.label+' · '+(round.stageSummary||round.demand||'Apply what you learned'))}</p><button class="foundation-editor-jump" type="button">Go to editor ↓</button></div>${FoundationLearning.stages(lesson.rounds,roundIndex,i=>url(lesson,i))}</header>
 <div class="foundation-split"><article class="foundation-content" data-code-context="guide" data-learning-stage="${lesson.review?'review':roundIndex===0?'follow':roundIndex===1?'change':'transfer'}" aria-label="Lesson content">

 ${follow?FoundationTeaching.intro(C,lesson,round):FoundationTeaching.newInTask(C,lesson,round)}
 ${work}
 ${FoundationParameters.render(C,lesson,round,{level:'current'})}
 ${round.id==='V01-1'?'':`<section class="foundation-data-preview" aria-label="Dataframe preview">${datasetTable(dataset)}${round.setup?auxiliaryTables(round,dataset):''}</section>`}
 ${taskDescriptor(round)}
 <section class="foundation-reference-content" data-code-context="guide" aria-label="Hints and solution">
 <details id="foundationHint" data-code-context="task"><summary>Hint</summary><p>${esc(round.hint)}</p></details>
 <details id="foundationSolution"><summary>Reveal solution</summary><p>Keep the supplied setup and replace the Your work section with this example.</p><pre><code>${esc(round.solution)}</code></pre></details>
 </section></article>${pythonPane(round,controlHelp)}</div>
 ${['I22','W31','V37'].includes(lesson.id)&&roundIndex===lesson.rounds.length-1?`<a class="challenge-checkpoint-link" href="#${lesson.deck}/challenges">Try the workflow challenges →</a>`:''}<nav class="foundation-navigation" aria-label="Lesson progression">${previous==='#'+lesson.deck?'<span class="deck-boundary">Start of deck</span>':`<a href="${previous}">← ${roundIndex?'Previous practice':'Previous lesson'}</a>`}${next==='#'+lesson.deck?'<span class="deck-boundary">End of deck</span>':`<a href="${next}">${roundIndex<lesson.rounds.length-1?'Next practice':'Next lesson'} →</a>`}</nav>`,round.id);
}
function taskDescriptor(round,challenge=false){
 return `<div class="foundation-task-reminder" data-code-context="task" tabindex="0" role="region" aria-label="Current task"><strong>Your task · ${esc(challenge?round.title:round.label)}</strong>${challenge?`<p class="case-reminder-question">${esc(round.task)}</p><div class="case-output-chips" aria-label="Requested outputs">${round.deliverables.map(d=>`<span><code>${esc(d.fileName || d.name)}</code><small>${esc(d.format)}</small></span>`).join('')}</div><button class="case-read-brief" type="button" data-brief-target="case-deliverables">Read deliverables ↗</button>`:`${taskMarkup(round)}<p class="practice-context">Setup is included in the editor.</p>${round.reflection?`<p class="foundation-reflection"><strong>Read the result:</strong> ${esc(round.reflection)}</p>`:''}`}</div>`;
}
function pythonPane(round,controlHelp,challenge=false){
 const runNote=challenge?'Named outputs appear below when you run.':round.target==='plot'?'Display charts with plt.show().':'Display a value by leaving it on the final line.';
 return `<section class="foundation-code-pane" aria-label="Python practice"><div class="foundation-editor-head"><label for="foundationEditor">YOUR PYTHON</label><button type="button" id="jumpToWork">Jump to your work ↓</button></div><p class="foundation-editor-shortcuts">Tab: indent · Shift+Tab: outdent · Esc, then Tab: leave editor</p><div class="foundation-editor-wrap"><div class="foundation-line-numbers" aria-hidden="true"></div><pre id="foundationHighlight" aria-hidden="true"></pre><textarea id="foundationEditor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-describedby="editorHelp"></textarea></div>
 <span id="editorHelp" class="sr-only">Edit Python. Control or Command plus Enter runs it. Tab indents by four spaces. Shift plus Tab outdents. Press Escape, then Tab or Shift plus Tab to leave the editor.</span>
 <div class="foundation-actions"><button id="runExercise" class="primary" type="button">▶ Run code</button><button id="checkExercise" type="button">✓ Check answer</button><button id="resetExercise" type="button">Reset code</button><button id="stopPython" type="button" hidden>Stop / restart</button></div>
 ${controlHelp?'<p class="control-help"><strong>Run code</strong> shows what Python produces. <strong>Check answer</strong> also checks whether your result satisfies the task.</p>':''}<p class="foundation-run-note">Each run executes all editor code in a fresh Python session. ${runNote}${challenge&&round.target==='plot'?' Display charts with plt.show().':''}</p>
 <div class="foundation-runtime" id="foundationRuntime" role="status">${esc(runtimeStatus)}</div><p class="foundation-feedback" id="foundationFeedback" role="status"></p>
 ${challenge?'<section id="challengeResults" class="challenge-results" aria-label="Check results" aria-live="polite"></section>':''}<div class="foundation-output" id="foundationOutput" role="region" aria-label="Python output"><h3>Output</h3><p class="empty-output">Run your code to see what Python returns.</p></div></section>`;
}
function taskMarkup(round){
 const brief=round.brief;
 return (brief?`<h3 class="practice-question">${LearningLanguage.text(brief.question,round.id,true)}</h3>`+LearningLanguage.steps([brief.rows,...(brief.preparation||[]),brief.result,...brief.constraints],round.id):LearningLanguage.steps(round.steps?.length?round.steps:round.task,round.id));
}
function csvPreview(round){
 return Object.entries(round.files).map(([name,columns])=>{
  if(typeof columns==='string')return `<section><h3>File · ${esc(name)}</h3><p>This file is available in the lesson folder.</p><pre>${esc(columns)}</pre></section>`;
  const keys=Object.keys(columns),cell=value=>typeof value==='string'?'"'+value.replaceAll('"','""')+'"':String(value??'');
  const csv=[keys.join(','),...columns[keys[0]].map((_,i)=>keys.map(key=>cell(columns[key][i])).join(','))].join('\n');
  return `<section><h3>File · ${esc(name)}</h3><p>This file is available in the lesson folder. Load it to create df.</p><pre>${esc(csv)}</pre></section>`;
 }).join('');
}
function auxiliaryTables(round,dataset){
 if(round.auxiliary)return table(Object.keys(round.auxiliary.columns),Object.values(round.auxiliary.columns)[0].map((_,i)=>Object.values(round.auxiliary.columns).map(values=>values[i])),round.auxiliary.name+' · given lookup');
 const columns=Object.keys(dataset.columns), rows=dataset.columns[columns[0]].map((_,i)=>columns.map(c=>dataset.columns[c][i]));
 if(round.setup.startsWith('lookup')){const keys=[...new Set(dataset.columns[dataset.c])];return table([dataset.c,'priority'],keys.map((x,i)=>[x,i+1]),'lookup · category lookup');}
 if(round.setup.startsWith('long'))return table([dataset.id,'measure','value'],[dataset.a,dataset.b].flatMap(c=>dataset.columns[c].map((x,i)=>[dataset.columns[dataset.id][i],c,x])),'long · prepared measurement table');
 if(round.setup.startsWith('first'))return table(columns,rows.slice(0,3),'first · first three rows')+table(columns,rows.slice(3),'second · remaining rows');
 return '';
}
function pathLessons(lesson){return C.lessons.filter(l=>l.deck===lesson.deck&&(!lesson.path||l.path===lesson.path));}
function previousLesson(lesson){const list=pathLessons(lesson),i=list.indexOf(lesson);return i?url(list[i-1],list[i-1].rounds.length-1):'#'+lesson.deck;}
function nextLesson(lesson){const list=pathLessons(lesson),i=list.indexOf(lesson);return i<list.length-1?url(list[i+1]):'#'+lesson.deck;}
function challengePage(challenge,deck){
 view={challenge,lesson:{id:challenge.id,title:challenge.title,deck:deck.id},round:{...challenge,target:challenge.chart?'plot':'value'}};
 document.body.dataset.deck=deck.id;
 return ChallengeExperience.page(challenge,deck,{table,pythonPane,taskDescriptor:round=>taskDescriptor(round,true),curriculum:C});
}
function render(){
 generation++; if(busy&&bridge){bridge.restart();busy=false;runtimeStatus='Python will restart for this exercise.';}
 view=null;
 const currentRoute=LearningRoutes.route('data',location,document.body);
 const [deckId,id,roundValue]=currentRoute.split('/');
 const deck=C.decks.find(d=>d.id===deckId),lesson=C.lessons.find(l=>l.id===id&&l.deck===deckId);
 if(deck&&id==='challenges'){document.body.dataset.deck=deck.id;const challenge=ChallengeExperience.all.find(c=>c.deck===deck.id&&c.id===roundValue);if(challenge){main.innerHTML=challengePage(challenge,deck);bindEditor();ChallengeExperience.bind();ensureRuntime();}else main.innerHTML=ChallengeExperience.collection(deck);}
 else if(lesson){const index=/^\d+$/.test(roundValue||'0')?Number(roundValue||0):0;main.innerHTML=lessonPage(lesson,Math.min(index,lesson.rounds.length-1));bindEditor();ensureRuntime();}
 else main.innerHTML=deck?deckPage(deck):landing();
 // A URL-only entry hint survives deck/lesson hashes and reloads, without stored learning state.
 const fromHub=new URLSearchParams(location.search).get('from')==='learn';
 const exit=document.querySelector('.back-playground');exit.href=view?.challenge?'#'+view.lesson.deck+'/challenges':view?'#'+view.lesson.deck:deck?'#':fromHub?'learn.html':'playground.html';exit.textContent=view?.challenge?'← All challenges':view?'← '+({inspect:'Inspect',wrangle:'Wrangle',visualise:'Visualise'}[view.lesson.deck])+' lessons':deck?'← Choose a deck':fromHub?'← Learn / Refresh':'← Data Playground';
 LearningRoutes.enhance('data',main);LearningRoutes.canonical('data',currentRoute);
 FoundationLearning.highlightContent(main,LearningLanguage.context(view?.round?.id));
 FoundationVisuals.mount?.(main);
 window.FoundationOperationVisuals?.mount(main);
 document.title=view?`${view.challenge?"Workflow challenge "+view.challenge.id:lessonSequence(view.lesson)} · ${view.lesson.title} · Data Foundations`:'Data Foundations · Data Playground';
 main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});FoundationLearning.bindPanels(main);
 if(deck&&id==='chapter'){const chapter=document.getElementById('chapter-'+roundValue);chapter?.focus({preventScroll:true});chapter?.scrollIntoView({block:'start'});}
}
function bindEditor(){
 const editor=document.getElementById('foundationEditor'),{round}=view;
 const lineNumbers=document.querySelector('.foundation-line-numbers'),highlight=document.getElementById('foundationHighlight');
 document.querySelector('.foundation-editor-jump')?.addEventListener('click',()=>{editor.scrollIntoView({block:'start',behavior:'instant'});editor.focus({preventScroll:true});});
 editor.value=view.challenge?view.challenge.starter:FoundationWorkspace.code(C,round);
 document.getElementById('jumpToWork').onclick=()=>{const marker=editor.value.indexOf('# Your work\n');const position=marker<0?0:marker+'# Your work\n'.length;editor.focus();editor.setSelectionRange(position,position);editor.scrollTop=editor.value.slice(0,position).split('\n').length*parseFloat(getComputedStyle(editor).lineHeight)-40;editor.dispatchEvent(new Event('scroll'));};
 function numbers(){lineNumbers.textContent=editor.value.split('\n').map((_,i)=>i+1).join('\n');highlight.innerHTML=highlightPython(editor.value)+'\n';syncScroll();}
 function syncScroll(){if(!editor.isConnected)return;lineNumbers.scrollTop=editor.scrollTop;highlight.scrollTop=editor.scrollTop;highlight.scrollLeft=editor.scrollLeft;}
 editor.addEventListener('input',()=>{numbers();if(view?.challenge&&view.lastCheck){document.getElementById('challengeResults').innerHTML=ChallengeExperience.results(view.lastCheck,true);}const feedback=document.getElementById('foundationFeedback');feedback.textContent='Code changed. Run or Check to see the new result.';feedback.dataset.state='';});
 editor.addEventListener('scroll',syncScroll);
 FoundationEditor.attach(editor,()=>execute(false),backwards=>{
  const target=backwards?document.querySelector('.foundation-task-reminder'):document.querySelector('.foundation-actions button:not(:disabled)');
  target?.focus();
 });
 document.getElementById('runExercise').onclick=()=>execute(false);
 document.getElementById('checkExercise').onclick=()=>execute(true);
 document.getElementById('resetExercise').onclick=()=>{cancelRun();render();document.getElementById('foundationFeedback').textContent='Setup and starter restored. Run executes everything in the editor.';};
 document.getElementById('stopPython').onclick=()=>{cancelRun();document.getElementById('foundationFeedback').textContent='Python stopped. Your code is preserved; Run to try again.';};
 numbers();
 editor.closest('.foundation-editor-wrap').style.setProperty('--editor-lines',Math.min(14,Math.max(8,round.starter.split('\n').length)));
 const marker=editor.value.indexOf('# Your work\n');
 if(marker>=0){const position=marker+'# Your work\n'.length;editor.setSelectionRange(position,position);editor.scrollTop=Math.max(0,(editor.value.slice(0,position).split('\n').length-3)*parseFloat(getComputedStyle(editor).lineHeight));syncScroll();}
}
function updateRuntime(message){runtimeStatus=message;const element=document.getElementById('foundationRuntime');if(element)element.textContent=message;}
async function getBridge(){
 if(!bridgePromise)bridgePromise=fetch('foundations/worker.js').then(r=>{if(!r.ok)throw Error('Could not load Python worker.');return r.text();}).then(source=>{bridge=createPythonBridge(source,{onStatus:data=>updateRuntime(data.message),onError:error=>updateRuntime(error.message)});return bridge;}).catch(error=>{bridgePromise=null;throw error;});
 return bridgePromise;
}
function config(){return {plotting:view?.round.target==='plot',scaling:view?.lesson.id==='W28',indexURL:window.AppPlatform?.pyodideIndexUrl||'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',seaborn:window.AppPlatform?.seabornRequirement||'seaborn==0.13.2',source:window.FoundationsRuntimeSource};}
async function ensureRuntime(){try{const b=await getBridge();await b.send('init',{config:config()});}catch(error){updateRuntime('Python could not start. Run to retry. '+error.message.slice(0,180));}}
function setBusy(value){busy=value;for(const id of ['runExercise','checkExercise']){const button=document.getElementById(id);if(button)button.disabled=value;}const stop=document.getElementById('stopPython');if(stop)stop.hidden=!value;}
function cancelRun(){generation++;if(view?.challenge){view.lastCheck=null;const checks=document.getElementById('challengeResults');if(checks){checks.innerHTML='';checks.removeAttribute('aria-busy');}}bridge?.restart();setBusy(false);updateRuntime('Python restarts on your next run.');}
async function execute(check){
 if(busy||!view)return;
 const token=generation,{round}=view,editor=document.getElementById('foundationEditor'),code=editor.value;
 setBusy(true);
 if(view.challenge){view.lastCheck=null;const checks=document.getElementById('challengeResults');checks.setAttribute('aria-busy','true');checks.innerHTML=check?'<h3>Check results</h3><p>Checking this run…</p>':'';}
 const feedback=document.getElementById('foundationFeedback');feedback.dataset.state='';feedback.textContent=check?'Running and checking…':'Running Python…';
 const timer=setTimeout(()=>{if(token===generation&&busy){cancelRun();feedback.textContent='Python took too long and was stopped. Your code is preserved. Try a smaller operation or Run again.';}},90000);
 try{
  const b=await getBridge();if(token!==generation)return;
  const response=await b.send('run',{config:config(),request:view.challenge?{code,check,challenge:view.challenge}:{code,check,explicitSetup:true,exercise:round,columns:C.datasets[round.dataset].columns}});
  if(token!==generation)return;
  const result=response.result;
  const edited=editor.value!==code;
  renderOutput(result);
  if(view.challenge){view.lastCheck=result.checked?result:null;document.getElementById('challengeResults').innerHTML=ChallengeExperience.results(result,edited);if(result.checked&&!edited)document.getElementById('challengeResults').scrollIntoView({block:'nearest',behavior:'instant'});}
  feedback.textContent=edited?'Code changed while Python ran. This output belongs to the earlier code. Check again to validate your edit.':result.feedback||(result.error?'Fix the error and try again.':'Run finished. Inspect the output, then Check your answer.');
  feedback.dataset.state=edited?'':result.error?'error':result.passed?'pass':'';

 }catch(error){if(token===generation){if(view?.challenge)document.getElementById('challengeResults').innerHTML='';feedback.dataset.state='error';feedback.textContent='Python could not run. Your code is preserved. Run to retry.';updateRuntime(error.message.slice(0,240));}}
 finally{clearTimeout(timer);if(token===generation){setBusy(false);document.getElementById('challengeResults')?.removeAttribute('aria-busy');}}
}
function renderOutput(result){
 const output=document.getElementById('foundationOutput');output.innerHTML='<h3>Output</h3>';
 if(result.stdout)output.innerHTML+=`<pre>${esc(result.stdout)}</pre>`;
 for(const item of result.outputs||[]){
  if(item.label)output.innerHTML+=`<h4>${esc(item.label)}</h4>`;
  if(item.kind==='table')output.innerHTML+=table(item.value.columns,item.value.rows,'Python result');
  else if(item.kind==='text')output.innerHTML+=`<pre>${esc(item.value)}</pre>`;
  else if(item.kind==='figure')output.innerHTML+=`<div class="chart-wrap"><img src="${item.value}" alt="${esc(item.alt)}"><div class="figure-links"><a href="${item.value}">Open figure larger</a><a href="${item.value}" download="practice-figure.png">Download PNG</a></div></div>`;
  else if(item.kind==='download')output.innerHTML+=`<p><a href="${item.value}" download="${esc(item.name)}">Download ${esc(item.name)}</a></p>`;
 }
 if(result.error)output.innerHTML+=`<pre class="error">${esc(result.error)}</pre>`;
 if(!result.stdout&&!result.error&&!result.outputs?.length)output.innerHTML+='<p class="empty-output">Python finished with no displayed value. Put the value on the last line, use print(...), or use plt.show() for a figure.</p>';
}
// Build-time rendering uses the same authored lessons and presentation as the app.
if(window.DataPlaygroundPrerender){window.DataPlaygroundPrerender={curriculum:C,challenges:ChallengeExperience.all,landing,deckPage,lessonPage,challengePage,challengeCollection:ChallengeExperience.collection};return;}
document.getElementById('themeButton').onclick=()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light');
document.querySelector('.foundation-skip').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
LearningRoutes.installRouter('data',C,render,ChallengeExperience.all);
})();
