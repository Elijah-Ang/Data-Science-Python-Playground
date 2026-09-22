/* ML content on the existing Foundations shell. All learning state is transient. */
(async function(){
  'use strict';
  const main=document.getElementById('foundationsMain');
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const code=x=>`<pre><code>${esc(x)}</code></pre>`;
  const [C,datasets]=await Promise.all(['ml-learning/curriculum.json','ml-learning/datasets.json'].map(async url=>{
    const r=await fetch(url);if(!r.ok)throw Error('Could not load '+url);return r.json();
  })).catch(error=>{main.innerHTML=`<h2>Learning content could not load</h2><p>${esc(error.message)}</p><p>Reload this page to try again.</p>`;throw error;});
  const byId=new Map(C.cards.map(c=>[c.id,c]));
  const receipts=MLLearningReceipts.createReceiptStore();
  let view=null,bridge=null,workerSource=null,busy=false,generation=0;
  const downloadURLs=new Set();
  const url=(c,i=0)=>`#${c.deck}/${c.id}/${i}`;
  const range=(prefix,start,end)=>Array.from({length:end-start+1},(_,i)=>'ML-'+prefix+String(start+i).padStart(2,'0'));
  const order={
    foundations:[...range('F',1,5),'ML-F-R1',...range('F',6,10),'ML-F-R2','ML-F-K1'],
    workflow:[...range('W',1,7),'ML-W-R1',...range('W',8,14),'ML-W-R2','ML-W-K1'],
    regression:[...range('R',1,5),'ML-R-R1','ML-R06',...range('R',7,10),'ML-R-R2','ML-R11','ML-R-K1'],
    classification:[...range('C',1,6),'ML-C-R1',...range('C',7,13),'ML-C-R2',...range('C',14,18),'ML-C-R3','ML-C19','ML-C-K1'],
    networks:['ML-N01','ML-N02','ML-N05','ML-N-R1','ML-N03','ML-N-K2','ML-N04','ML-N-K1','ML-N06'],
    clustering:[...range('U',1,5),'ML-U-R1',...range('U',6,10),'ML-U-R2','ML-U-K1'],
    pca:[...range('P',1,6),'ML-P-R1','ML-P07','ML-P-K1'],
    comparison:[...range('M',1,3),'ML-M-R1','ML-M04','ML-M-K1']
  };
  const ordered=deck=>(order[deck]||[]).map(id=>byId.get(id));
  function table(columns,rows,caption){
    return `<div class="foundation-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}; scroll for more columns"><table><caption>${esc(caption)}</caption><thead><tr>${columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==='number'?Number(v.toPrecision(6)):v===null?'missing':v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function datasetPreview(name,challengeInput=null){
    const d=datasets[name];
    if(!d)return '<p>Use the input file named in the brief.</p>';
    const dictionary=DatasetDictionary[d.file]||{};
    const discovery=['clustering','pca'].includes(view?.card?.deck)||['ML-X17','ML-X18','ML-X19'].includes(view?.challenge?.id);
    const columns=discovery?d.columns.filter(c=>!['species','diagnosis'].includes(c)):d.columns;
    const preview=d.preview.map(row=>columns.map(c=>row[d.columns.indexOf(c)]));
    return `<section><h3>${challengeInput?'Your input file':'Given data'} · ${esc(name)}</h3><p>${d.rows} observations. ${esc(dictionary.row||'Deterministic teaching observations; values illustrate the concept rather than a real population claim.')} ${challengeInput?'Load the CSV file yourself.':'The dataframe df is supplied afresh for each Run.'}</p>${d.file?`<p><a href="${esc(d.file)}" download>Download source CSV</a>${dictionary.source?` · <a href="${esc(dictionary.source)}" target="_blank" rel="noopener">Source and original dictionary</a>`:''}</p>`:''}${discovery?'<p>Reference labels are omitted from this preview and must remain outside fitting.</p>':''}${table(columns,preview,`${name} · ${d.preview.length===d.rows?'all rows':'first '+d.preview.length+' prepared rows'}`)}<details><summary>Column meanings, units and population</summary><p>${esc(dictionary.units||'Column names describe the supplied features and target. Keep the stated units and row identities when making comparisons.')}</p><p>${esc(dictionary.assumptions||'Synthetic data are deliberately small and reproducible. Their patterns illustrate an idea; they are not evidence about a real population.')}</p>${challengeInput?`<p>${esc(challengeInput.description)}</p>`:''}${table(['Column','Stored type'],columns.map(c=>[c,d.dtypes[c]]),'Input schema')}</details>${validationDesign(view?.exercise)}</section>`;
  }
  function validationDesign(ex){
    const p=ex?.protect;if(!p)return '';
    const split=p.time?'Order the declared population by time. Reserve the final 20% of rows; use the earlier 80% for development.':'Reserve 20% of the declared population for the final test using split seed 42. '+(p.stratified?'Keep class proportions with a stratified split.':'Use a random split.');
    const folds=ex.checks.some(c=>c.name==='Matching folds');
    const validation=!folds?'':p.time?'Use five forward validation folds without shuffling. Diagnose the last training-validation block.':'Use the same five '+(p.stratified?'stratified ':'')+'training folds, shuffled with seed 42, for reference comparison, candidates and selection. Use out-of-fold training predictions for diagnosis.';
    const scoring=!folds?'':p.stratified?'Select with macro F1 and compare with a most-frequent-class reference. Accuracy is supplementary.':'Select with negative RMSE (larger is better) and compare with a training-mean reference. Report final RMSE in original target units.';
    return `<section class="ml-validation-design"><h4>Declared validation design</h4><p>${esc(split)}</p>${folds?`<p>${esc(validation)} ${esc(scoring)} Open final-test evidence after selection and diagnosis.</p>`:''}</section>`;
  }
  const collectionRegistry={collection:{id:'workflow',title:'Workflow Challenges',rootTitle:'Machine Learning',rootHref:'#',lessonsHref:'#',lessonsLabel:'Learning decks',contractNote:'These conditions describe a complete workflow. Use the declared Python variables beside the editor; Check inspects evidence from your Run.',briefLabel:'Independent ML briefs',introduction:'Assemble a complete workflow from a realistic question and inspectable evidence.',inputNote:'Choose any brief. Each runs independently with its supplied inputs. Prerequisites and time estimates are guidance.'},families:{activity:'Machine Learning'},challenges:C.challenges};
  const challengeExperience=createChallengeExperience(collectionRegistry,{inputPreview:input=>{
    const ch=view?.challenge;return datasetPreview(ch?.exercise.dataset,input);
  }});
  function coreNote(){return '<p class="ml-core-note"><strong>Core means essential within the relevant pathway or model family.</strong> You do not need to complete all '+C.counts.core+' Core cards before using a particular model or entering the Playground. Every lesson and challenge is freely accessible.</p>';}
  function landing(){
    return `<header class="foundation-hero"><div><span class="foundation-eyebrow">LEARN / REFRESH</span><h2>Machine Learning</h2><p>Understand the workflow behind the model.<br>Small examples, real Python and evidence you can explain.</p></div></header><div class="ml-orientation"><article><h3>New to machine learning?</h3><p>Follow the recommended route from ML Foundations. Learn what fitting and prediction mean before combining the workflow.</p><a class="ml-primary-link" href="#foundations">Start with ML Foundations →</a></article><article><h3>Refreshing something?</h3><p>Jump directly to a workflow, model or concept. Use the same complete curriculum at the point you need it.</p><a href="#models">Browse the model index →</a> · <a href="#workflows/challenges">Choose a workflow</a></article></div>${coreNote()}<section class="ml-route-map" aria-label="Recommended branching routes"><h3>Find your route</h3><p><a href="#foundations">ML Foundations</a> → <a href="#workflow">Supervised Workflow</a> → <a href="#regression">Regression</a>, <a href="#classification">Classification</a> or <a href="#networks">Neural Networks</a>.</p><p>For discovery: Foundations → <a href="${url(byId.get('ML-W03'))}">shared scaling</a> → <a href="${url(byId.get('ML-U01'))}">unsupervised introduction</a> → <a href="#clustering">clustering</a> or <a href="#pca">PCA</a>.</p><p>Bring the families together in <a href="#comparison">Choose and Explain Models</a>, or enter <a href="ml.html">the Playground</a> whenever you like.</p></section><nav class="ml-concepts-nav" aria-label="Refresh a concept">${[['X and y','ML-F02'],['Scaling','ML-W03'],['Pipelines','ML-W06'],['Cross-validation','ML-W08'],['Macro F1','ML-C03'],['Time splits','ML-W14'],['Convergence','ML-N05'],['Cluster choice','ML-U04'],['Variance retention','ML-P04']].map(([t,id])=>`<a href="${url(byId.get(id))}">${t}</a>`).join('')}</nav><section class="foundation-decks ml-deck-grid" aria-label="Learning decks">${C.decks.map(d=>`<a class="foundation-deck" href="#${d.id}"><span class="deck-top">${esc(d.key)} · LEARNING DECK</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><span class="deck-bottom">${ordered(d.id).length} cards <span aria-hidden="true">→</span></span></a>`).join('')}</section><section class="ml-route-map"><h3>Workflow Challenges</h3><p>${C.counts.challenges} independent briefs. Assemble the workflow yourself, then use progressive help when needed.</p><a href="#workflows/challenges">Open the challenge collection →</a></section>${modelIndex()}`;
  }
  function modelIndex(){
    return `<section class="ml-index" id="modelIndex" tabindex="-1"><h3>Model index</h3><p>Choose a model’s Core teaching or an independent retrieval workflow. No lesson completion is required.</p><div class="ml-index-grid">${C.models.map(m=>`<article class="ml-index-item"><span class="foundation-eyebrow">${esc(m.family)}</span><h4>${esc(m.name)}</h4><p>${m.teaching.map(id=>`<a href="${url(byId.get(id))}">${esc(byId.get(id).title)}</a>`).join('<br>')}</p><p>${m.challenges.map(id=>`<a href="#workflows/challenges/${id}">${esc(id)} · Workflow</a>`).join('<br>')}</p><a href="ml.html" title="Open the Playground and select ${esc(m.name)}">Open Playground →</a></article>`).join('')}</div></section>`;
  }
  function cardTile(c){
    return `<a class="lesson-card ${c.kind!=='teaching'?'is-review':''}" href="${url(c)}"><span class="card-id">${esc(c.id.replace('ML-',''))}</span><h4>${esc(c.title)}</h4><p>${esc(c.goal)}</p><small>${c.tier==='core'?'Core':'Go Further'} · ${c.kind} · ${c.exercises.length} exercises · ${esc(c.minutes)} min</small></a>`;
  }
  function neuralFork(){
    return '<div class="ml-network-fork" id="neuralPaths"><a href="#networks/ML-N03/0"><strong>Neural classification →</strong><p>Use classification foundations through C06. Regression is not required.</p></a><a href="#networks/ML-N04/0"><strong>Neural regression →</strong><p>Use regression foundations through R03. Classification is not required.</p></a></div>';
  }
  function deckPage(deck){
    const list=ordered(deck.id);
    let groups;
    if(deck.id==='networks'){
      groups=`<section class="foundation-chapter"><h3>Shared network concepts</h3><div class="lesson-library">${list.slice(0,4).map(cardTile).join('')}</div></section>${neuralFork()}<section class="foundation-chapter"><h3>Task workflows and checkpoints</h3><div class="lesson-library">${list.slice(4,8).map(cardTile).join('')}</div></section><section class="foundation-chapter"><h3>Go Further</h3><div class="lesson-library">${cardTile(byId.get('ML-N06'))}</div></section>`;
    }else{
      // Preserve review insertion points; headings follow the ordered card sequence.
      groups='';let chapter=null;
      for(const c of list){
        if(c.chapter!==chapter){if(chapter!==null)groups+='</div></section>';chapter=c.chapter;groups+=`<section class="foundation-chapter"><h3>${esc(chapter)}</h3><div class="lesson-library">`;}
        groups+=cardTile(c);
      }
      groups+='</div></section>';
    }
    return `<nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Machine Learning</a><span>/</span><span>${esc(deck.title)}</span></nav><header class="foundation-deck-heading"><span class="foundation-eyebrow">LEARNING DECK</span><h2>${esc(deck.title)}</h2><p>${esc(deck.description)}</p></header>${coreNote()}${groups}<p><a href="#workflows/challenges">Independent Workflow Challenges →</a></p>`;
  }
  function prerequisites(card){
    return `<p class="ml-prerequisites"><strong>Helpful prior knowledge:</strong> ${card.prerequisites.length?card.prerequisites.map(id=>`<a href="${url(byId.get(id))}">${esc(byId.get(id).title)}</a>`).join(' · '):'Data Foundations: inspecting, preparing and plotting tables.'} These links are guidance, not locks.</p>`;
  }
  function help(ex){
    return `<details><summary>Hint 1 — Think</summary><p>${esc(ex.hints.think)}</p></details><details><summary>Hint 2 — Tools</summary><p>${esc(ex.hints.tools)}</p></details><details><summary>Hint 3 — Approach</summary><p>${esc(ex.hints.approach)}</p></details><details><summary>Explained solution</summary>${ex.kind==='python'?code(ex.solution):`<p>${esc(ex.solution)}</p>`}<p>${esc(ex.explanation)}</p></details>`;
  }
  function pathList(card){
    if(card.deck==='networks'){
      if(['ML-N03','ML-N-K2'].includes(card.id))return ['ML-N03','ML-N-K2'].map(id=>byId.get(id));
      if(['ML-N04','ML-N-K1'].includes(card.id))return ['ML-N04','ML-N-K1'].map(id=>byId.get(id));
      return ['ML-N01','ML-N02','ML-N05','ML-N-R1'].map(id=>byId.get(id));
    }
    return ordered(card.deck).filter(c=>c.tier==='core'||c.id===card.id);
  }
  function navigation(card,index){
    const list=pathList(card),position=list.indexOf(card);
    const previous=index?url(card,index-1):position>0?url(list[position-1],list[position-1].exercises.length-1):'#'+card.deck;
    const next=index<card.exercises.length-1?url(card,index+1):position>=0&&position<list.length-1?url(list[position+1]):'#'+card.deck;
    return `<nav class="foundation-navigation" aria-label="Lesson navigation"><a href="${previous}">← Previous</a><a href="#${card.deck}">Deck overview</a><a href="${next}">${next==='#networks'?'Choose a neural route':'Next'} →</a></nav>`;
  }
  function lessonPage(card,index){
    const ex=card.exercises[index];
    const teaching=card.kind==='teaching';
    return `<div class="ml-lesson"><nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Machine Learning</a><span>/</span><a href="#${card.deck}">${esc(C.decks.find(d=>d.id===card.deck).title)}</a><span>/</span><span>${esc(card.id)}</span></nav><header class="foundation-lesson-heading"><span class="foundation-eyebrow">${esc(card.id)} · ${card.tier==='core'?'CORE':'GO FURTHER'} · ${esc(card.minutes)} MIN</span><h2>${esc(card.title)}</h2><p>${esc(card.goal)}</p></header>${prerequisites(card)}<nav class="ml-exercise-tabs" aria-label="Exercises">${card.exercises.map((e,i)=>`<a href="${url(card,i)}" ${index===i?'aria-current="page"':''}>${i+1}. ${esc(e.label)}</a>`).join('')}</nav><div class="foundation-split"><article class="foundation-content"><section><h3>What this does</h3><p>${esc(card.explanation)}</p></section>${teaching?MLLearningVisuals.render(card.visual):''}${ex.kind==='python'?datasetPreview(ex.dataset):''}${ex.setup?`<details><summary>Supplied setup · runs before your code</summary><p>These previously introduced objects are supplied for this exercise. Your editor runs afterward.</p>${code(ex.setup)}</details>`:''}${teaching&&(ex.kind==='python'||card.id==='ML-W11')?`<section><h3>Meet the syntax</h3>${code(card.syntax)}<p>${esc(card.syntaxBreakdown)}</p></section>${card.example&&index===0&&ex.kind==='python'?`<details class="teaching-example" open><summary>See it once</summary>${code(card.example)}</details>`:''}`:''}<section class="foundation-task"><h3>Your task · ${esc(ex.label)}</h3><p>${esc(ex.task)}</p>${ex.evidence?`<p>${esc(ex.evidence)}</p>`:''}</section>${help(ex)}<details class="ml-sources"><summary>Sources and API context</summary><p>Concepts follow these references. Runnable Python is compatible with this Playground’s scikit-learn 1.4.2 / Pyodide 0.26.4 runtime.</p><ul>${card.sources.map(([title,href])=>`<li><a href="${esc(href)}" target="_blank" rel="noopener">${esc(title)}</a></li>`).join('')}</ul></details></article>${ex.kind==='python'?pythonPane(ex):conceptPane(ex)}</div>${card.id==='ML-N-R1'?neuralFork():''}${navigation(card,index)}</div>`;
  }
  function pythonPane(ex){
    ex=view?.exercise||ex;
    return `<section class="foundation-code-pane ml-code-pane" aria-label="Python practice"><div class="foundation-task-reminder"><strong>Your task</strong><p>${esc(ex.task||view?.challenge?.question)}</p><p>Requested output variables:</p><div class="ml-output-names">${ex.outputs.map(name=>`<code>${esc(name)}</code>`).join('')}</div></div>${ex.contract?`<details class="ml-contract"><summary>Required Python variables and evidence</summary><p>These names let Check inspect your workflow. Use ordinary Python to produce them; the algorithm and interpretation remain yours.</p>${table(["Variable","Meaning"],ex.contract.map(c=>[c.name,c.description]),"Workflow evidence contract")}</details>`:''}<div class="ml-editor-head"><label for="mlEditor">YOUR PYTHON</label></div><p class="foundation-editor-shortcuts" id="mlEditorHelp">Ctrl/⌘+Enter: Run · Tab: indent · Esc then Tab: leave editor</p><textarea class="ml-editor" id="mlEditor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-describedby="mlEditorHelp"></textarea><div class="foundation-actions"><button class="primary" id="mlRun" type="button">Run code</button><button id="mlCheck" type="button">Check answer</button><button id="mlReset" type="button">Reset code</button><button id="mlStop" type="button">Stop / restart</button></div><p class="foundation-runtime" id="mlStatus" role="status">Python loads when you run. Code and results stay in this activity only.</p><p class="foundation-feedback" id="mlFeedback" role="status"></p><div class="ml-output" id="mlOutput" role="region" aria-label="Python output"><p class="ml-empty">Run your code to inspect its output. Check uses that same run.</p></div><div class="ml-output ml-results" id="mlResults" aria-live="polite"></div>${view?.challenge?'<div class="ml-output"><label for="mlReflection">Your interpretation · self-review</label><textarea class="ml-reflection" id="mlReflection"></textarea><p class="ml-data-note">State the evidence and its limitations. This explanation is not machine-graded or saved.</p></div>':''}</section>`;
  }
  function conceptPane(ex){
    return `<section class="ml-choice" aria-label="Concept practice">${ex.kind==='decision'?`<fieldset><legend>${esc(ex.task)}</legend>${ex.options.map((option,i)=>`<label><input type="${ex.correct.length>1?'checkbox':'radio'}" name="mlChoice" value="${i}"><span>${esc(option)}</span></label>`).join('')}</fieldset>`:`<label for="mlExplain"><strong>Your explanation</strong></label><p>Use the evidence and state a limitation. This is self-review, not a keyword test.</p><textarea id="mlExplain" aria-label="Your explanation"></textarea>`}<button type="button" id="mlConceptCheck">${ex.kind==='decision'?'Check reasoning':'Show self-review guidance'}</button><div id="mlConceptResult" role="status" class="ml-results"></div></section>`;
  }
  function serialOutput(value,name){
    if(value?.type==='table')return table(value.columns,value.rows,name+' · '+value.shape[0]+' rows');
    if(value?.type==='series')return table(['Index',value.name],value.index.slice(0,100).map((id,i)=>[id,value.values[i]]),name+' · first '+Math.min(100,value.index.length)+' rows');
    return code(JSON.stringify(value,null,2));
  }
  function clearResources(){for(const u of downloadURLs)URL.revokeObjectURL(u);downloadURLs.clear();}
  function renderOutput(r){
    clearResources();
    const output=document.getElementById('mlOutput');
    output.innerHTML=`<h3>Output · this run</h3>${r.error?`<pre class="ml-error">${esc(r.error)}</pre>`:''}${r.stdout?code(r.stdout):''}${r.stderr?code(r.stderr):''}${Object.entries(r.outputs).map(([name,value])=>`<section><h4>${esc(name)}</h4>${serialOutput(value,name)}</section>`).join('')}${(r.warnings||[]).map(w=>`<details><summary>Runtime warning</summary><p>${esc(w)}</p></details>`).join('')}${r.figures.map((f,i)=>f.image?`<figure class="chart-wrap"><img src="data:image/png;base64,${f.image}" alt="${esc(f.axes.map(a=>a.title+'; '+a.xLabel+' versus '+a.yLabel).join('. '))}"><figcaption>Figure ${i+1} from this run</figcaption><a href="data:image/png;base64,${f.image}">Open figure ${i+1} larger</a></figure>`:'').join('')}`;
    for(const item of r.downloads||[]){
      const bytes=Uint8Array.from(atob(item.data),c=>c.charCodeAt(0));
      const href=URL.createObjectURL(new Blob([bytes]));
      downloadURLs.add(href);
      const link=document.createElement('a');link.href=href;link.download=item.name;link.textContent='Download '+item.name;output.append(link,document.createElement('br'));
    }
    if(receipts.exposed)document.getElementById('mlFeedback').textContent='Final-test evidence has been shown in this activity. Treat further model selection as exploratory.';
  }
  function showChecks(){
    const editor=document.getElementById('mlEditor'),r=receipts.check(editor.value);
    if(!r){document.getElementById('mlFeedback').textContent='Run the current code first. Check does not execute or refit a model.';return;}
    document.getElementById('mlResults').innerHTML=`<h3>Check results · this run only</h3><ul>${r.checks.map(c=>`<li class="${esc(c.status)}"><h4>${esc({'correct':'✓ Consistent','needs-attention':'△ Needs attention','unavailable':'○ Unable to check','self-review':'◇ Self-review'}[c.status])} · ${esc(c.name)}</h4><p>${esc(c.message)}</p></li>`).join('')}</ul>`;
  }
  async function run(){
    if(busy||!view)return;
    const editor=document.getElementById('mlEditor'),submitted=editor.value,exercise=view.exercise,screen=generation;
    const token=receipts.begin(submitted);busy=true;
    document.getElementById('mlRun').disabled=true;
    document.getElementById('mlResults').replaceChildren();
    clearResources();
    const status=message=>{if(screen===generation)document.getElementById('mlStatus').textContent=message;};
    status('Preparing this run…');
    try{
      if(!bridge){
        workerSource=workerSource||await(await fetch('ml-learning/worker.js')).text();
        bridge=createPythonBridge(workerSource,{onStatus:r=>{if(view&&busy)document.getElementById('mlStatus').textContent=r.message;}});
      }
      const d=datasets[exercise.dataset],files={};
      if(d?.file){const response=await fetch(d.file);if(!response.ok)throw Error('Input file could not load.');files[d.file]=await response.text();}
      const response=await bridge.send('run',{config:{indexURL:AppPlatform.pyodideIndexUrl,...MLLearningRuntime},files,request:{exercise,code:submitted}});
      if(screen!==generation)return;
      if(receipts.accept(token,editor.value,response.result)){
        renderOutput(response.result);
        status(response.result.error?'Python stopped with an error. Edit and run again.':'Run finished. Check inspects this evidence without fitting again.');
      }else status('Code changed during execution. Run the current code before checking.');
    }catch(error){if(screen===generation)status(String(error.message||error));}
    finally{if(screen===generation){busy=false;document.getElementById('mlRun').disabled=false;}}
  }
  function bind(){
    if(!view)return;
    const ex=view.exercise;
    if(ex.kind!=='python'){
      document.getElementById('mlConceptCheck').addEventListener('click',()=>{
        const result=document.getElementById('mlConceptResult');
        if(ex.kind==='reflection'){result.innerHTML=`<p>◇ Self-review: ${esc(ex.explanation)}</p>`;return;}
        const selected=[...document.querySelectorAll('input[name="mlChoice"]:checked')].map(x=>Number(x.value)).sort((a,b)=>a-b);
        if(!selected.length){result.textContent='Select a response first.';return;}
        const correct=JSON.stringify(selected)===JSON.stringify([...ex.correct].sort((a,b)=>a-b));
        result.innerHTML=`<p>${correct?'✓ Consistent reasoning':'△ Reconsider the evidence'}</p><p>${esc(ex.explanation)}</p>`;
      });return;
    }
    const editor=document.getElementById('mlEditor');editor.value=ex.starter;
    FoundationEditor.attach(editor,run,backward=>(backward?document.querySelector('.foundation-task-reminder'):document.getElementById('mlRun')).focus());
    document.querySelector('.foundation-task-reminder').tabIndex=0;
    editor.addEventListener('input',()=>{receipts.edit();document.getElementById('mlResults').replaceChildren();document.getElementById('mlFeedback').textContent='Code changed. Run it to produce current evidence.';});
    document.getElementById('mlRun').addEventListener('click',run);
    document.getElementById('mlCheck').addEventListener('click',showChecks);
    document.getElementById('mlReset').addEventListener('click',()=>{editor.value=ex.starter;receipts.edit();clearResources();document.getElementById('mlOutput').innerHTML='<p class="ml-empty">Code reset. Run to produce new output.</p>';document.getElementById('mlResults').replaceChildren();editor.focus();});
    document.getElementById('mlStop').addEventListener('click',()=>{generation++;bridge?.restart();receipts.edit();busy=false;document.getElementById('mlRun').disabled=false;document.getElementById('mlStatus').textContent='Execution stopped. Python will start fresh on the next Run.';});
    document.querySelector('.foundation-editor-jump')?.addEventListener('click',()=>{editor.scrollIntoView({block:'center'});editor.focus();});
  }
  function render(){
    generation++;clearResources();
    if(busy){bridge?.restart();busy=false;}
    view=null;
    const [deckId,id,position]=location.hash.slice(1).split('/');
    const deck=C.decks.find(d=>d.id===deckId),card=byId.get(id);
    receipts.enter(null);
    document.body.dataset.deck=deckId||'';
    main.classList.add('ml-learning');
    if(deckId==='workflows'){
      const challenge=C.challenges.find(c=>c.id===position);
      if(id==='challenges'&&challenge){
        view={challenge,exercise:challenge.exercise};receipts.enter(challenge.exercise.id);
        main.innerHTML=challengeExperience.page(challenge,{id:'workflows',title:'Machine Learning'},{table,pythonPane,curriculum:{lessons:C.cards}});
        challengeExperience.bind();
      }else main.innerHTML=challengeExperience.collection({id:'workflows',title:'Machine Learning'});
    }else if(card&&deck&&card.deck===deckId){
      const index=Math.max(0,Math.min(/^\d+$/.test(position||'0')?Number(position||0):0,card.exercises.length-1));
      view={card,index,exercise:card.exercises[index]};receipts.enter(view.exercise.id);
      main.innerHTML=lessonPage(card,index);
    }else main.innerHTML=deck?deckPage(deck):landing();
    document.title=(view?.card?.title||view?.challenge?.title||deck?.title||'Machine Learning')+' · Learn / Refresh';
    bind();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
    if(deckId==='models')document.getElementById('modelIndex')?.scrollIntoView({block:'start'});
  }
  document.getElementById('themeButton').addEventListener('click',()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light'));
  window.addEventListener('hashchange',render);
  window.addEventListener('pagehide',clearResources);
  // Inspectable content/read-only state for real-browser audits; no persistence API.
  window.MLLearning={curriculum:C,datasets,get activity(){return view?.exercise;},get retainedReceipts(){return receipts.retainedReceipts;}};
  render();
})();
