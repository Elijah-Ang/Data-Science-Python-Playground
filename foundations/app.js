(() => {
'use strict';
const C=window.FoundationsCurriculum, KEY='dspp-foundations-v1';
const main=document.getElementById('foundationsMain');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// One token pass keeps strings/comments intact and escapes all learner text.
function highlightPython(code){
 const tokens=/(#[^\n]*|(?:"""[\s\S]*?(?:"""|$)|\x27\x27\x27[\s\S]*?(?:\x27\x27\x27|$)|"(?:\\.|[^"\\\n])*"?|\x27(?:\\.|[^\x27\\\n])*\x27?)|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b|\b(?:print|len|range|list|dict|str|int|float|sum|min|max|set|tuple|sorted)\b|\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b|[+*/%=<>!&|~^-]+)/g;
 let result='',start=0;
 for(const match of code.matchAll(tokens)){const token=match[0];let kind=token[0]==='#'?'comment':/^["\x27]/.test(token)?'string':/^\d/.test(token)?'number':/^[+*/%=<>!&|~^-]/.test(token)?'operator':/^(print|len|range|list|dict|str|int|float|sum|min|max|set|tuple|sorted)$/.test(token)?'builtin':'keyword';result+=esc(code.slice(start,match.index))+`<span class="py-${kind}">${esc(token)}</span>`;start=match.index+token.length;}
 return result+esc(code.slice(start));
}
let shownControlHelp=false;
let state={version:1,drafts:{}}, view=null, generation=0, bridge=null, bridgePromise=null, busy=false;
let runtimeStatus='Python starts when you open a lesson.';
try {const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.version===1){state.drafts=saved.drafts&&typeof saved.drafts==='object'?saved.drafts:{};}} catch {}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{document.getElementById('storageStatus').textContent='Browser storage is unavailable or full. You can keep practising; changes may not survive closing this page.';}}
function url(lesson,round=0){return `#${lesson.deck}/${lesson.id}/${round}`;}
function table(columns,rows,caption){return `<div class="foundation-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${columns.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${value===null?'<span title="Missing value">None</span>':typeof value==='string'&&value.trim()!==value?`&quot;${esc(value)}&quot;`:esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function datasetTable(dataset){const columns=Object.keys(dataset.columns);return table(dataset.index?['row',...columns]:columns,dataset.columns[columns[0]].map((_,i)=>[...(dataset.index?[dataset.index[i]]:[]),...columns.map(c=>dataset.columns[c][i])]),`${dataset.name} · ${dataset.columns[columns[0]].length} synthetic rows`);}
const icon=`<svg class="deck-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h25v5H7zM10 9h25v5H10zM5 14h26v22H5zM10 21h16M10 27h10"/></svg>`;
function landing(){
 document.body.dataset.deck='';
 return `<section class="foundation-hero"><div><span class="foundation-eyebrow">A learning space for Data Playground</span><h2>Data Foundations</h2><p>New to pandas, a little rusty, or ready for a recap?<br>Pick a deck. Try a tiny table. Make the skill yours.</p></div><div class="hero-note">Read a little.<br>Write some Python.<br>See what happens.</div></section>

 <div class="foundation-decks">${C.decks.map(d=>{const items=C.lessons.filter(l=>l.deck===d.id);return `<a class="foundation-deck" data-deck="${d.id}" href="#${d.id}"><div class="deck-top"><span>DECK ${d.number}</span>${icon}</div><h3>${esc(d.title)}</h3><p>${esc(d.tagline)}</p><div class="deck-bottom"><span>${items.filter(l=>!l.review).length} lessons · ${items.filter(l=>l.review).length} reviews</span><span aria-hidden="true">↗</span></div></a>`;}).join('')}</div>
 <p class="foundation-guidance"><strong>New or very rusty?</strong> Follow Core in order. <strong>Refreshing one skill?</strong> Jump directly to a chapter or card. Go Further adds optional depth; every lesson is open.</p>
 <section class="foundation-note" aria-label="How to practise"><div><h3>01 · Follow</h3><p>Meet the syntax one piece at a time. Fill the gap with a worked example nearby.</p></div><div><h3>02 · Change</h3><p>Use the same idea in another setting. Different data, one familiar tool.</p></div><div><h3>03 · Transfer</h3><p>Try a fresh question with less help. Return to earlier skills in review challenges.</p></div></section>`;
}
function deckPage(deck){
 document.body.dataset.deck=deck.id;
 return `<header class="foundation-deck-heading"><span class="foundation-eyebrow">Deck ${deck.number}</span><h2>${esc(deck.title)}</h2><p>${esc(deck.description)}</p><p class="foundation-guidance">New or very rusty? Follow <strong>Core</strong> in order. Refreshing one skill? Jump to a chapter or card. <strong>Go Further</strong> adds optional depth.</p><nav class="chapter-jumps" aria-label="Jump to chapter">${deck.chapters.map((chapter,i)=>`<a href="#${deck.id}/chapter/${i}">${esc(chapter)}</a>`).join('')}</nav></header>`+deck.chapters.map((chapter,i)=>{const items=C.lessons.filter(l=>l.deck===deck.id&&l.chapter===i);return items.length?`<section class="foundation-chapter" id="chapter-${i}" tabindex="-1"><h3>${String(i+1).padStart(2,'0')} / ${esc(chapter)}</h3><div class="lesson-library">${items.map(l=>`<a class="lesson-card ${l.review?'is-review':''}" href="${url(l)}"><div class="card-meta"><span class="card-id">${l.id}</span><span class="card-level">${esc(l.level)}</span></div>${FoundationVisuals.diagram(l.visual)}<h4>${esc(l.title)}</h4><p>${esc(l.goal)}</p><small>${l.minutes} min · ${l.rounds.length} ${l.review?'retrieval tasks':'practices'}</small></a>`).join('')}</div></section>`:'';}).join('');
}
function lessonPage(lesson,roundIndex){
 const round=lesson.rounds[roundIndex],deck=C.decks.find(x=>x.id===lesson.deck),dataset=C.datasets[round.dataset];
 const controlHelp=!lesson.review&&roundIndex===0&&!shownControlHelp; if(controlHelp)shownControlHelp=true;
 view={lesson,round,roundIndex};save();document.body.dataset.deck=lesson.deck;
 const previous=roundIndex?url(lesson,roundIndex-1):previousLesson(lesson),next=roundIndex<lesson.rounds.length-1?url(lesson,roundIndex+1):nextLesson(lesson);
 return `<nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Data Foundations</a><span aria-hidden="true">/</span><span>${esc(deck.title)}</span><span aria-hidden="true">/</span><span>${lesson.id}</span></nav>
 <header class="foundation-lesson-heading"><div><span class="foundation-eyebrow">${esc(deck.chapters[lesson.chapter])} · ${lesson.id}</span><h2>${esc(lesson.title)}</h2><p>${esc(lesson.goal)}</p></div><span class="foundation-eyebrow">${lesson.minutes} MIN</span></header>
 <section class="foundation-practices" aria-label="Exercise type"><p>Exercises within this concept</p><ol>${lesson.rounds.map((r,i)=>`<li ${i===roundIndex?'aria-current="step"':''}><strong>${esc(r.label)}</strong><span>${lesson.review?'Retrieval practice':i===0?'Guided practice':i===1?'A different context':'Try it independently'}</span>${i===roundIndex?'<em>Current exercise</em>':''}</li>`).join('')}</ol></section>
 <div class="foundation-split"><article class="foundation-content" aria-label="Lesson content">
 <section><h3>${lesson.review?'Bring it together':'What this does'}</h3>${FoundationVisuals.diagram(lesson.visual)}<p>${esc(lesson.explanation)}</p></section>
 <section><h3>Given data</h3>${datasetTable(dataset)}${round.files?csvPreview(round):`<details><summary>View setup code</summary><pre><code>${esc(C.setupCode(round.dataset)+(round.setup?'\n\n'+round.setup:''))}</code></pre></details>`}${round.setup?auxiliaryTables(round,dataset):''}</section>
 ${!lesson.review?`<${roundIndex===0?'section':'details'}>${roundIndex===0?'<h3>Meet the syntax</h3>':'<summary>Recall the syntax</summary>'}<pre class="isolated-syntax"><code>${esc(lesson.syntaxCode)}</code></pre><dl class="foundation-syntax">${lesson.syntax.map(([code,meaning])=>`<dt>${esc(code)}</dt><dd>${esc(meaning)}</dd>`).join('')}</dl></${roundIndex===0?'section':'details'}><${roundIndex===0?'section':'details'}>${roundIndex===0?'<h3>See it once</h3>':'<summary>Revisit the worked example</summary>'}<pre><code>${esc(lesson.example)}</code></pre></${roundIndex===0?'section':'details'}>`:''}
 <section class="foundation-task"><h3>Your task · ${esc(round.label)}</h3><p>${esc(round.task)}</p></section>
 <details id="foundationHint"><summary>Hint</summary><p>${esc(round.hint)}</p></details>
 <details id="foundationSolution"><summary>Reveal solution</summary><p>One way to do it. Try explaining each step before moving on.</p><pre><code>${esc(round.solution)}</code></pre></details>
 ${lesson.stretch?`<details><summary>Optional stretch</summary><p>${esc(lesson.stretch)}</p></details>`:''}
 </article><section class="foundation-code-pane" aria-label="Python practice"><div class="foundation-task-reminder" tabindex="0" role="region" aria-label="Current task"><strong>Your task · ${esc(round.label)}</strong><p>${esc(round.task)}</p></div><div class="foundation-editor-head"><label for="foundationEditor">YOUR PYTHON</label><span>practice.py</span></div><div class="foundation-editor-wrap"><div class="foundation-line-numbers" aria-hidden="true"></div><pre id="foundationHighlight" aria-hidden="true"></pre><textarea id="foundationEditor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-describedby="editorHelp"></textarea></div>
 <span id="editorHelp" class="sr-only">Edit Python. Control or Command plus Enter runs it. Tab moves to the next control; use spaces to indent.</span>
 <div class="foundation-actions"><button id="runExercise" class="primary" type="button">▶ Run code</button><button id="checkExercise" type="button">✓ Check answer</button><button id="resetExercise" type="button">Reset code</button><button id="stopPython" type="button" hidden>Stop / restart</button></div>
 ${controlHelp?'<p class="control-help"><strong>Run code</strong> shows what Python produces. <strong>Check answer</strong> also checks whether your result satisfies the task.</p>':''}
 <div class="foundation-runtime" id="foundationRuntime" role="status">${esc(runtimeStatus)}</div><p class="foundation-feedback" id="foundationFeedback" role="status"></p>
 <div class="foundation-output" id="foundationOutput" role="region" aria-label="Python output"><h3>Output</h3><p class="empty-output">Run your code to see what Python returns.</p></div></section></div>
 <nav class="foundation-navigation" aria-label="Lesson progression"><a href="${previous}">← ${roundIndex?'Previous practice':'Previous lesson'}</a><a href="${next}">${roundIndex<lesson.rounds.length-1?'Next practice':next.startsWith('#'+lesson.deck+'/')?'Next lesson':'Back to deck'} →</a></nav>`;
}
function csvPreview(round){
 return Object.entries(round.files).map(([name,columns])=>{
  const keys=Object.keys(columns),cell=value=>typeof value==='string'?'"'+value.replaceAll('"','""')+'"':String(value??'');
  const csv=[keys.join(','),...columns[keys[0]].map((_,i)=>keys.map(key=>cell(columns[key][i])).join(','))].join('\n');
  return `<details><summary>View ${esc(name)}</summary><p>This file is available in the lesson folder. Load it to create df.</p><pre>${esc(csv)}</pre></details>`;
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
function previousLesson(lesson){const list=C.lessons.filter(l=>l.deck===lesson.deck),i=list.indexOf(lesson);return i?url(list[i-1],list[i-1].rounds.length-1):'#'+lesson.deck;}
function nextLesson(lesson){const list=C.lessons.filter(l=>l.deck===lesson.deck),i=list.indexOf(lesson);return i<list.length-1?url(list[i+1]):'#'+lesson.deck;}
function render(){
 generation++; if(busy&&bridge){bridge.restart();busy=false;runtimeStatus='Python will restart for this exercise.';}
 view=null;
 const [deckId,id,roundValue]=location.hash.slice(1).split('/');
 const deck=C.decks.find(d=>d.id===deckId),lesson=C.lessons.find(l=>l.id===id&&l.deck===deckId);
 if(lesson){const index=/^\d+$/.test(roundValue||'0')?Number(roundValue||0):0;main.innerHTML=lessonPage(lesson,Math.min(index,lesson.rounds.length-1));bindEditor();ensureRuntime();}
 else main.innerHTML=deck?deckPage(deck):landing();
 const exit=document.querySelector('.back-playground');exit.href=view?'#'+view.lesson.deck:deck?'#':'playground.html';exit.textContent=view?'← '+({inspect:'Inspect',wrangle:'Wrangle',visualise:'Visualise'}[view.lesson.deck])+' lessons':deck?'← Choose a deck':'← Data Playground';
 main.querySelectorAll('.foundation-content pre code').forEach(code=>{code.innerHTML=highlightPython(code.textContent);});
 document.title=view?`${view.lesson.id} · ${view.lesson.title} · Data Foundations`:'Data Foundations · Data Playground';
 main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
 if(deck&&id==='chapter'){const chapter=document.getElementById('chapter-'+roundValue);chapter?.focus({preventScroll:true});chapter?.scrollIntoView({block:'start'});}
}
function bindEditor(){
 const editor=document.getElementById('foundationEditor'),{round}=view;
 editor.value=typeof state.drafts[round.id]==='string'?state.drafts[round.id]:round.starter;
 function numbers(){document.querySelector('.foundation-line-numbers').textContent=editor.value.split('\n').map((_,i)=>i+1).join('\n');document.getElementById('foundationHighlight').innerHTML=highlightPython(editor.value)+'\n';syncScroll();}
 function syncScroll(){document.querySelector('.foundation-line-numbers').scrollTop=editor.scrollTop;const layer=document.getElementById('foundationHighlight');layer.scrollTop=editor.scrollTop;layer.scrollLeft=editor.scrollLeft;}
 editor.addEventListener('input',()=>{state.drafts[round.id]=editor.value.slice(0,50000);save();numbers();const feedback=document.getElementById('foundationFeedback');feedback.textContent='Code changed. Run or Check to see the new result.';feedback.dataset.state='';});
 editor.addEventListener('scroll',syncScroll);
 editor.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();execute(false);}});
 document.getElementById('runExercise').onclick=()=>execute(false);
 document.getElementById('checkExercise').onclick=()=>execute(true);
 document.getElementById('resetExercise').onclick=()=>{cancelRun();delete state.drafts[round.id];save();render();document.getElementById('foundationFeedback').textContent='Starter restored. Your next run begins with fresh given data.';};
 document.getElementById('stopPython').onclick=()=>{cancelRun();document.getElementById('foundationFeedback').textContent='Python stopped. Your code is preserved; Run to try again.';};
 numbers();
}
function updateRuntime(message){runtimeStatus=message;const element=document.getElementById('foundationRuntime');if(element)element.textContent=message;}
async function getBridge(){
 if(!bridgePromise)bridgePromise=fetch('foundations/worker.js').then(r=>{if(!r.ok)throw Error('Could not load Python worker.');return r.text();}).then(source=>{bridge=createPythonBridge(source,{onStatus:data=>updateRuntime(data.message),onError:error=>updateRuntime(error.message)});return bridge;}).catch(error=>{bridgePromise=null;throw error;});
 return bridgePromise;
}
function config(){return {plotting:view?.round.target==='plot',scaling:view?.lesson.id==='W28',indexURL:window.AppPlatform?.pyodideIndexUrl||'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',seaborn:window.AppPlatform?.seabornRequirement||'seaborn==0.13.2',source:window.FoundationsRuntimeSource};}
async function ensureRuntime(){try{const b=await getBridge();await b.send('init',{config:config()});}catch(error){updateRuntime('Python could not start. Run to retry. '+error.message.slice(0,180));}}
function setBusy(value){busy=value;for(const id of ['runExercise','checkExercise']){const button=document.getElementById(id);if(button)button.disabled=value;}const stop=document.getElementById('stopPython');if(stop)stop.hidden=!value;}
function cancelRun(){generation++;bridge?.restart();setBusy(false);updateRuntime('Python restarts on your next run.');}
async function execute(check){
 if(busy||!view)return;
 const token=generation,{round}=view,editor=document.getElementById('foundationEditor'),code=editor.value;
 state.drafts[round.id]=code;save();setBusy(true);
 const feedback=document.getElementById('foundationFeedback');feedback.dataset.state='';feedback.textContent=check?'Running and checking…':'Running Python…';
 const timer=setTimeout(()=>{if(token===generation&&busy){cancelRun();feedback.textContent='Python took too long and was stopped. Your code is preserved. Try a smaller operation or Run again.';}},90000);
 try{
  const b=await getBridge();if(token!==generation)return;
  const response=await b.send('run',{config:config(),request:{code,check,exercise:round,columns:C.datasets[round.dataset].columns}});
  if(token!==generation)return;
  const result=response.result;
  const edited=editor.value!==code;
  renderOutput(result);
  feedback.textContent=edited?'Code changed while Python ran. This output belongs to the earlier code. Check again to validate your edit.':result.feedback||(result.error?'Fix the error and try again.':'Run finished. Inspect the output, then Check your answer.');
  feedback.dataset.state=edited?'':result.error?'error':result.passed?'pass':'';

 }catch(error){if(token===generation){feedback.dataset.state='error';feedback.textContent='Python could not run. Your code is preserved. Run to retry.';updateRuntime(error.message.slice(0,240));}}
 finally{clearTimeout(timer);if(token===generation)setBusy(false);}
}
function renderOutput(result){
 const output=document.getElementById('foundationOutput');output.innerHTML='<h3>Output</h3>';
 if(result.stdout)output.innerHTML+=`<pre>${esc(result.stdout)}</pre>`;
 for(const item of result.outputs||[]){
  if(item.kind==='table')output.innerHTML+=table(item.value.columns,item.value.rows,'Python result');
  else if(item.kind==='text')output.innerHTML+=`<pre>${esc(item.value)}</pre>`;
  else if(item.kind==='figure')output.innerHTML+=`<div class="chart-wrap"><img src="${item.value}" alt="${esc(item.alt)}"><div class="figure-links"><a href="${item.value}">Open figure larger</a><a href="${item.value}" download="practice-figure.png">Download PNG</a></div></div>`;
  else if(item.kind==='download')output.innerHTML+=`<p><a href="${item.value}" download="${esc(item.name)}">Download ${esc(item.name)}</a></p>`;
 }
 if(result.error)output.innerHTML+=`<pre class="error">${esc(result.error)}</pre>`;
 if(!result.stdout&&!result.error&&!result.outputs?.length)output.innerHTML+='<p class="empty-output">Python finished with no displayed value. Put the value on the last line, use print(...), or use plt.show() for a figure.</p>';
}
document.getElementById('themeButton').onclick=()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light');
const dialog=document.getElementById('resetLearningDialog');
document.getElementById('forgetProgress').onclick=()=>dialog.showModal();
document.getElementById('cancelForget').onclick=()=>dialog.close();
document.getElementById('confirmForget').onclick=()=>{cancelRun();state={version:1,drafts:{}};save();dialog.close();location.hash='';render();document.getElementById('storageStatus').textContent='Saved learning has been reset.';};
document.querySelector('.foundation-skip').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
window.addEventListener('hashchange',render);
render();
})();
