/* ML content on the existing Foundations shell. All learning state is transient. */
(async function(){
  'use strict';
  const main=document.getElementById('foundationsMain');
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const code=x=>`<pre><code>${esc(x)}</code></pre>`;
  const [C,datasets,challengeInputs]=await Promise.all(['ml-learning/curriculum.json','ml-learning/datasets.json','ml-learning/inputs.json'].map(async url=>{
    const r=await fetch(url);if(!r.ok)throw Error('Could not load '+url);return r.json();
  })).catch(error=>{main.innerHTML=`<h2>Learning content could not load</h2><p>${esc(error.message)}</p><p>Reload this page to try again.</p>`;throw error;});
  const byId=new Map(C.cards.map(c=>[c.id,c]));
  const receipts=MLLearningReceipts.createReceiptStore();
  let view=null,bridge=null,workerSource=null,busy=false,generation=0;
  const downloadURLs=new Set();
  const url=(c,i=0)=>`#${c.deck}/${c.id}/${i}`;
  const range=(prefix,start,end)=>Array.from({length:end-start+1},(_,i)=>'ML-'+prefix+String(start+i).padStart(2,'0'));
  const order={
    foundations:[...range('F',1,5),'ML-F-R1',...range('F',6,10),'ML-F-R2','ML-F11','ML-F12','ML-F-K1'],
    workflow:[...range('W',1,7),'ML-W-R1',...range('W',8,14),'ML-W-R2','ML-W15','ML-W16','ML-W-K1','ML-W-K2','ML-W-K3'],
    regression:[...range('R',1,5),'ML-R-R1','ML-R06',...range('R',7,10),'ML-R-R2','ML-R11','ML-R-K1'],
    classification:[...range('C',1,6),'ML-C-R1',...range('C',7,13),'ML-C-R2',...range('C',14,18),'ML-C-R3','ML-C19','ML-C-K1'],
    networks:['ML-N01','ML-N02','ML-N05','ML-N-R1','ML-N03','ML-N-K2','ML-N04','ML-N-K1','ML-N06'],
    clustering:[...range('U',1,5),'ML-U-R1',...range('U',6,10),'ML-U-R2','ML-U-K1'],
    pca:[...range('P',1,6),'ML-P-R1','ML-P07','ML-P-K1'],
    comparison:[...range('M',1,3),'ML-M-R1','ML-M04','ML-M-K1']
  };
  // A writing field earns its space only when this activity asks for a specific
  // interpretation. Routine syntax and retrieval prompts stay in the lesson.
  const reflectionQuestions=Object.freeze({
    'ML-R-R1-1':"What does a two-unit weight difference imply for the fitted prediction when distance stays fixed?",
    'ML-R-R1-2':"Why is the evaluation-row mean an unsafe reference for a model fitted on training rows?",
    'ML-R-R2-3':"Which minimum-leaf setting has the strongest training-fold evidence for these data?",
    'ML-C-R1-3':"What does the majority reference reveal about the classifier's macro F1 on matching folds?",
    'ML-U-R1-3':"What do the original-unit profiles reveal about these clusters without treating them as known classes?",
    'ML-P-R1-1':"What changes when you retain 95% rather than 80% of the measured variation?",
    'ML-F-K1-1':"What does the held-out delivery error support about predictions for new rows?",
    'ML-W-K1-1':"Does the mixed-input line beat the mean reference on matching training folds?",
    'ML-R-K1-1':"Which Candy model earned selection from common-fold evidence?",
    'ML-C-K1-1':"Which Penguin classes remain hardest to distinguish in the out-of-fold confusion table?",
    'ML-N-K1-1':"Do original-unit errors and convergence evidence justify the chosen Wine network?",
    'ML-N-K2-1':"What class errors does the Penguin network's aggregate macro F1 conceal?",
    'ML-U-K1-1':"What do original-unit profiles support about these groups without claiming known classes?",
    'ML-P-K1-1':"What does the two-dimensional Penguin view omit from the retained PCA representation?",
    'ML-W-K2-1':"What repair-time claim is supported by the dummy, training-fold scores and reserved-test result?",
    'ML-W-K3-1':"What next-week fault claim is supported by class-balanced validation and reserved-test evidence?",
    'ML-F11-1':"Does the line earn an improvement claim over the dummy on matching delivery folds?",
    'ML-F11-2':"What does this delivery model's final MAE mean in minutes?",
    'ML-F11-3':"Do training-fold scores support the household model over the dummy without using the later bill?",
    'ML-F12-1':"Which specimen class is most often missed in the out-of-fold predictions?",
    'ML-F12-2':"Which specimen class has the weakest recall under the balanced-accuracy workflow?",
    'ML-F12-3':"Does the late-ticket classifier find enough late cases to justify its false alerts?",
    'ML-W15-1':"Why would the later bill make the household validation score unusable at prediction time?",
    'ML-W15-2':"How would fitting the scaler before the folds contaminate the specimen validation score?",
    'ML-W15-3':"What new evidence is needed after a colleague chose a model using final-test scores?",
    'ML-W16-1':"How many late tickets does an always-on-time reference miss despite its accuracy?",
    'ML-W16-2':"Does the deep household tree's validation error justify its better training fit?",
    'ML-W16-3':"Which class errors in training-only predictions matter most for the late-ticket decision?",
    'ML-R09-4':"Where could the fitted delivery tree fail beyond its observed distance range?",
    'ML-C10-4':"Do matching-fold scores support the scaled SVC over a majority reference for these specimens?",
    'ML-C15-4':"How does the Gaussian feature assumption limit the meaning of this classifier's validation score?",
    'ML-N03-4':"Do validation and convergence evidence justify the neural classifier over the majority reference?",
    'ML-U07-4':"What makes your chosen Ward cut defensible for this sampled measurement population?",
    'ML-P02-4':"Why is the smallest 90% variance prefix useful here without being a prediction score?",
    'ML-X01':"What population-specific life-expectancy claim can this GDP model's errors support?",
    'ML-X02':"Did the polynomial earn its extra flexibility over the line on matching Candy folds?",
    'ML-X03':"Which Candy model is better supported by matched folds and residuals?",
    'ML-X04':"How well do forward folds support predicting later Seoul demand with the available inputs?",
    'ML-X05':"What changes when Penguin context variables are removed from the species classifier?",
    'ML-X06':"Which Car classes does the selected tree confuse most despite its aggregate score?",
    'ML-X07':"Does the selected k improve Penguin classification over the reference on matched folds?",
    'ML-X08':"What can SVM margin scores tell you without treating them as class probabilities?",
    'ML-X09':"Which Car errors reveal the limits of using one feature for One-R?",
    'ML-X10':"How would including winpercent in X invalidate the Candy popularity claim?",
    'ML-X11':"Do Gaussian NB probabilities warrant confident class claims for correlated Breast measurements?",
    'ML-X12':"Which minority Candy errors does macro F1 reveal that accuracy could obscure?",
    'ML-X13':"Which Car classes does the fitted one-hot Bernoulli NB model confuse most?",
    'ML-X14':"Does QDA's covariance flexibility earn an advantage over LDA on matching Penguin folds?",
    'ML-X15':"What does final RMSE in original Wine quality units imply about the selected network?",
    'ML-X16':"Does the neural classifier justify its runtime and instability compared with logistic regression?",
    'ML-X17':"Which Penguin groups are supported by k evidence and original-unit profiles without species labels?",
    'ML-X18':"What claim about sampled Breast measurements can the chosen Ward cut support?",
    'ML-X19':"Why does a two-axis PCA plot omit information even when the retained representation reaches 90% variance?"
  });
  const ordered=deck=>(order[deck]||[]).map(id=>byId.get(id));
  function table(columns,rows,caption){
    return `<div class="foundation-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}; scroll for more columns"><table><caption>${esc(caption)}</caption><thead><tr>${columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==='number'?Number(v.toPrecision(6)):v===null?'missing':v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function datasetPreview(name,challengeInput=null){
    const d=challengeInput?challengeInputs[view.challenge.id]:datasets[name];
    if(!d)return '<p>Use the input file named in the brief.</p>';
    const dictionary=DatasetDictionary[d.sourceFile||d.file]||{};
    if(view?.exercise?.dictionary)return `<section><h3>Your inputs · ${esc(name)}</h3><p>${d.rows} synthetic independent observations. The dataframe df is supplied afresh on each Run. Column availability is described in the question’s dictionary above.</p>${table(d.columns,d.preview,`${name} · first ${d.preview.length} rows`)}</section>`;
    const discovery=['clustering','pca'].includes(view?.card?.deck)||['ML-X17','ML-X18','ML-X19'].includes(view?.challenge?.id);
    const columns=discovery?d.columns.filter(c=>!['species','diagnosis'].includes(c)):d.columns;
    const preview=d.preview.map(row=>columns.map(c=>row[d.columns.indexOf(c)]));
    return `<section><h3>${challengeInput?'Challenge input':'Given data'} · ${esc(name)}</h3><p>${d.rows} observations. ${esc(dictionary.row||'Deterministic teaching observations; values illustrate the concept rather than a real population claim.')} ${challengeInput?'Load the CSV file yourself.':'The dataframe df is supplied afresh for each Run.'}</p>${d.file?`<p><a href="${esc(d.file)}" download>${challengeInput?'Download challenge input CSV':'Download source CSV'}</a>${challengeInput?` · <a href="${esc(d.sourceFile)}">Original source dataset</a>`:''}${dictionary.source?` · <a href="${esc(dictionary.source)}" target="_blank" rel="noopener">Source and original dictionary</a>`:''}</p>`:''}${challengeInput?`<p class="ml-input-contract">${esc(d.description)}</p>`:discovery?'<p>Reference labels are omitted from this preview and must remain outside fitting.</p>':''}${table(columns,preview,`${name} · ${d.preview.length===d.rows?'all rows':'first '+d.preview.length+' prepared rows'}`)}<section class="ml-column-guide"><h4>Column meanings and units</h4><p>${esc(dictionary.units||'Column names describe the supplied features and target. Keep the stated units and row identities when making comparisons.')}</p><p>${esc(dictionary.assumptions||'Synthetic data are deliberately small and reproducible. Their patterns illustrate an idea; they are not evidence about a real population.')}</p>${challengeInput?`<p>${esc(challengeInput.description)}</p>`:''}${table(['Column','Stored type'],columns.map(c=>[c,d.dtypes[c]]),'Input schema')}</section>${validationDesign(view?.exercise)}</section>`;
  }
  function validationDesign(ex){
    const p=ex?.protect;if(!p)return '';
    const split=p.time?'Order the declared population by time. Reserve the final 20% of rows; use the earlier 80% for development.':'Reserve 20% of the declared population for the final test using split seed 42. '+(p.stratified?'Keep class proportions with a stratified split.':'Use a random split.');
    const folds=ex.checks.some(c=>c.name==='Matching folds');
    const validation=!folds?'':p.time?'Use five forward validation folds without shuffling. Diagnose the last training-validation block.':'Use the same five '+(p.stratified?'stratified ':'')+'training folds, shuffled with seed 42, for reference comparison, candidates and selection. Use out-of-fold training predictions for diagnosis.';
    const scoring=!folds?'':p.stratified?'Select with macro F1 and compare with a most-frequent-class reference. Accuracy is supplementary.':'Select with negative RMSE (larger is better) and compare with a training-mean reference. Report final RMSE in original target units.';
    return `<section class="ml-validation-design"><h4>Declared validation design</h4><p>${esc(split)}</p>${folds?`<p>${esc(validation)} ${esc(scoring)} Open final-test evidence after selection and diagnosis.</p>`:''}</section>`;
  }
  const collectionRegistry={collection:{id:'workflow',title:'Workflow Challenges',rootTitle:'Machine Learning',omitDeckCrumb:true,rootHref:'#',lessonsHref:'#',lessonsLabel:'Learning decks',contractNote:'These conditions describe a complete workflow. Use the declared Python variables beside the editor; Check inspects evidence from your Run.',briefLabel:'Independent ML briefs',introduction:'Assemble a complete workflow from a realistic question and inspectable evidence.',inputNote:'Choose any brief. Each runs independently with its supplied inputs. Prerequisites and time estimates are guidance.'},families:{regression:'Regression',classification:'Classification',neural:'Neural networks',time:'Time-ordered prediction',clustering:'Clustering',pca:'PCA'},challenges:C.challenges};
  const challengeExperience=createChallengeExperience(collectionRegistry,{
    illustration:family=>MLLearningVisuals.illustration(family),
    deliverables:ch=>`<ol class="ml-deliverable-groups">${ch.deliverableGroups.map(g=>`<li><h4>${esc(g.title)}</h4><p>${esc(g.summary)}</p></li>`).join('')}</ol>${workflowMap(ch)}${evidenceContract(ch.exercise)}`,
    inputPreview:input=>{
    const ch=view?.challenge;return datasetPreview(ch?.exercise.dataset,input);
  }});
  const deckIcon=FoundationLearning.deckIcon;
  const deckLabel=(deck,index)=>deck==='regression'?'ROUTE 3A':deck==='classification'?'ROUTE 3B':`DECK ${index>=4?index:index+1}`;
  function landing(){
    return `<section class="foundation-hero"><div><span class="foundation-eyebrow">A learning space for Machine Learning Playground</span><h2>Machine Learning</h2><p>Start with a question. Learn the Python. Build a model.<br>Begin with Foundations and Supervised Workflow. Then choose Regression or Classification; both lead to the later model families and independent challenges.</p></div></section><div class="foundation-decks">${C.decks.map((d,i)=>`<a class="foundation-deck" data-deck="${d.id}" href="#${d.id}"><div class="deck-top"><span>${deckLabel(d.id,i)}</span>${deckIcon}</div><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><div class="deck-bottom"><span>${ordered(d.id).filter(c=>c.kind==='teaching').length} lessons · ${ordered(d.id).filter(c=>c.kind!=='teaching').length} reviews</span><span aria-hidden="true">↗</span></div></a>`).join('')}<a class="foundation-deck" data-deck="challenges" href="#workflows/challenges"><div class="deck-top"><span>APPLY YOUR SKILLS</span>${deckIcon}</div><h3>Workflow Challenges</h3><p>Bring the steps together. Load data, build each model, inspect evidence and explain the result.</p><div class="deck-bottom"><span>${C.challenges.length} independent workflows · ${C.models.length} models</span><span aria-hidden="true">↗</span></div></a></div>`;
  }
  function cardTile(c){
    return `<a class="lesson-card ${c.kind!=='teaching'?'is-review':''}" href="${url(c)}"><div class="card-meta"><span class="card-id">${esc(c.id.replace('ML-',''))}</span><span class="card-level">${c.tier==='core'?'Core':'Go Further'} · ${esc(c.kind)}</span></div>${MLLearningVisuals.thumbnail(c)}<h4>${esc(c.title)}</h4><p>${esc(c.goal)}</p><small>${esc(c.minutes)} min · ${c.exercises.length} practices</small></a>`;
  }
  function deckPage(deck){
    const list=ordered(deck.id);
    const chapters=[...new Set(list.map(c=>c.chapter))];
    return `<header class="foundation-deck-heading"><span class="foundation-eyebrow">${deckLabel(deck.id,C.decks.indexOf(deck))}</span><h2>${esc(deck.title)}</h2><p>${esc(deck.description)}</p><nav class="chapter-jumps" aria-label="Jump to chapter">${chapters.map((chapter,i)=>`<span class="chapter-step">${i?'<span class="chapter-flow-arrow" aria-hidden="true">→</span>':''}<a href="#${deck.id}/chapter/${i}">${esc(chapter)}</a></span>`).join('')}</nav></header>`+chapters.map((chapter,i)=>`<section class="foundation-chapter" id="chapter-${i}" tabindex="-1"><h3>${String(i+1).padStart(2,'0')} / ${esc(chapter)}</h3><div class="lesson-library">${list.filter(c=>c.chapter===chapter).map(cardTile).join('')}</div></section>`).join('');
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
    return `<nav class="foundation-navigation" aria-label="Lesson progression">${previous==='#'+card.deck?'<span class="deck-boundary">Start of deck</span>':`<a href="${previous}">← ${index?'Previous practice':'Previous lesson'}</a>`}${next==='#'+card.deck?(card.deck==='networks'?`<a href="${next}">Choose a neural route →</a>`:'<span class="deck-boundary">End of deck</span>'):`<a href="${next}">${index<card.exercises.length-1?'Next practice':'Next lesson'} →</a>`}</nav>`;
  }
  function learningContext(card,index){
    const list=pathList(card),position=list.indexOf(card);
    const next=index+1<card.exercises.length?card.exercises[index+1].label+' · '+card.title:list[position+1]?.title;
    if(!next&&card.deck==='workflow')return '<p class="teaching-note"><strong>This practice:</strong> '+esc(card.exercises[index].demand||card.goal)+'. <strong>Next:</strong> choose <a href="#regression">Regression</a> or <a href="#classification">Classification</a>. Both routes build on the shared supervised workflow.</p>';
    if(!next&&['regression','classification'].includes(card.deck)){
      const other=card.deck==='regression'?'classification':'regression';
      return `<p class="teaching-note"><strong>This practice:</strong> ${esc(card.exercises[index].demand||card.goal)}. <strong>Next:</strong> explore <a href="#${other}">${other==='regression'?'Regression':'Classification'}</a> or <a href="#">choose another model family</a>.</p>`;
    }
    const nextDeck=C.decks[C.decks.findIndex(d=>d.id===card.deck)+1];
    return `<p class="teaching-note"><strong>This practice:</strong> ${esc(card.exercises[index].demand||card.goal)}. <strong>Next:</strong> ${esc(next||nextDeck?.title||'Apply the workflow in an independent challenge')}.${!next&&nextDeck?` <a href="#${esc(nextDeck.id)}">Continue to ${esc(nextDeck.title)} →</a>`:''}</p>`;
  }
  function masterySupport(ex){
    if(!ex.rubric)return '';
    return `<section class="teaching-reference"><h3>The question and data dictionary</h3><p>${esc(ex.question)}</p><p>${esc(ex.context)}</p>${table(['Column','Meaning and availability'],ex.dictionary,'Decide what can be known at prediction time')}</section>${workflowMap(ex)}${ex.bug?`<section class="teaching-reference"><h3>Find the fault</h3><p>Identify the failed decision, explain its consequence, then repair the workflow in the editor.</p>${code(ex.bug)}</section>`:''}<section class="teaching-reference"><h3>${ex.readiness?'Readiness rubric':'Explain your decisions'} · self-review</h3><p>${ex.readiness?'For each criterion: 0 = missing or unsafe; 1 = plausible but unsupported; 2 = correct and supported by your actual evidence. Aim for 2 on every criterion. A target leak, test-driven selection or test-row fit means the boundary must be repaired before a readiness claim.':'Before Run, write your prediction. After Run, explain what the evidence supports and what it cannot establish.'} Code checks cannot award these reasoning scores.</p><ol class="ml-rubric">${ex.rubric.map(r=>`<li><strong>${esc(r.title)}</strong><span>${esc(r.description)}</span></li>`).join('')}</ol><p>Use the interpretation field beside your output. After an attempt, Check identifies code evidence and shows reasoning guidance. The optional explained solution is one defensible approach, not the only acceptable answer.</p></section>`;
  }
  function modelSupport(card,ex){
    if(!card.modelGuide?.length)return '';
    const bridge=card.exercises.findIndex(e=>e.modelBridge);
    const discovery=['clustering','pca'].includes(card.deck);
    const bridgeText=card.deck==='clustering'?'Build a sampled hierarchy, compare cuts and describe groups in original units':card.deck==='pca'?'Scale measurements, fit PCA, retain dimensions and interpret component weights':'Apply this model with a baseline, training validation and one final evaluation';
    const prior=discovery?'Use the <a href="#clustering/ML-U01/0">Discovery route</a> to frame a question without a prediction target.':'First practise complete regression and classification in <a href="#foundations/ML-F11/0">F11–F12</a>; check readiness in <a href="#workflow/ML-W-K2/0">W-K2–W-K3</a>.';
    return card.modelGuide.map(g=>`<section class="teaching-reference"><h3>${esc(g.name)} · from idea to workflow</h3><p><strong>Question:</strong> ${esc(g.question)}</p><p><strong>Mechanism:</strong> ${esc(g.mechanism)}</p><p><strong>Watch for:</strong> ${esc(g.failure)}</p><p><strong>Interpret or debug · self-review:</strong> ${esc(g.debug)}</p>${bridge>=0?`<p><strong>Guided full workflow:</strong> <a href="${url(card,bridge)}">${bridgeText} →</a></p>`:''}<p><strong>Independent full workflow:</strong> ${g.challenges.map(id=>`<a href="#workflows/challenges/${esc(id)}">${esc(id)}</a>`).join(' · ')}. ${prior}</p></section>`).join('');
  }
  function syntaxSupport(card,ex){
    if(card.kind!=='teaching')return '';
    const parts=Array.isArray(card.syntaxBreakdown)?card.syntaxBreakdown:[];
    return `<section class="teaching-reference ml-syntax"><h3>Meet the syntax</h3>${code(card.syntax)}<dl class="foundation-syntax teaching-syntax-parts ml-syntax-parts">${parts.map(p=>`<div><dt><code>${esc(p.code)}</code></dt><dd>${esc(p.meaning)}</dd></div>`).join('')}</dl></section>${card.example&&ex.label==='Follow'?`<section class="teaching-worked"><h3>Follow the code</h3><p>Use the numbered comments to connect each Python block to the workflow above.</p>${code(card.example)}</section>`:''}`;
  }
  function lessonPage(card,index){
    const ex=card.exercises[index];
    const follow=card.kind==='teaching'&&index===0;
    return `<div class="ml-lesson"><nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Machine Learning</a><span>/</span><a href="#${card.deck}">${esc(C.decks.find(d=>d.id===card.deck).title)}</a><span>/</span><span>${esc(card.id)}</span></nav><header class="foundation-lesson-heading"><div class="foundation-lesson-copy"><span class="foundation-eyebrow">${esc(card.chapter)} · ${esc(card.id)} · ${esc(card.minutes)} MIN</span><h2>${esc(card.title)}</h2><p>${esc(follow?card.goal:ex.label+' · '+(ex.demand||card.goal))}</p>${ex.kind==='python'?'<button class="foundation-editor-jump" type="button">Go to editor ↓</button>':''}</div>${FoundationLearning.stages(card.exercises,index)}</header><div class="foundation-split"><article class="foundation-content" aria-label="Lesson content">${follow?`<section class="teaching-overview"><h3>Understand the idea</h3><p class="teaching-summary">${esc(card.explanation)}</p>${MLLearningVisuals.render(ex.visual||card.visual)}${card.pythonSkill?`<p class="teaching-note"><strong>Python skill:</strong> ${esc(card.pythonSkill)}</p>`:''}</section>`:`<section class="foundation-practice-brief"><span class="foundation-eyebrow">${esc(ex.label)} · ${esc(ex.dataset||card.dataset||'Reasoning practice')}</span><h3 class="practice-question">${esc(ex.question||ex.task.split(/(?<=[.!?])\s/)[0])}</h3><p>${esc(ex.task)}</p>${!ex.dictionary?`<p class="practice-context">${esc(ex.context||card.goal)}</p>`:''}</section>`}${follow?syntaxSupport(card,ex):''}${learningContext(card,index)}${masterySupport(ex)}${modelSupport(card,ex)}${ex.kind==='python'?datasetPreview(ex.dataset):''}${ex.setup?`<section class="teaching-worked"><h3>Supplied setup</h3><p>This code runs before your editor on every Run. These are the objects your exercise uses.</p>${code(ex.setup)}</section>`:''}${!follow?`<p class="foundation-revisit"><a href="${url(card)}">Revisit the concept lesson →</a></p><section class="teaching-reference"><h3>Remember the idea</h3><p>${esc(card.explanation)}</p>${MLLearningVisuals.render(ex.visual||card.visual)}${syntaxSupport(card,ex)}</section>`:''}${follow||ex.reasoningPrompt||ex.evidence?`<section class="foundation-task"><h3>${follow?'Your task · '+esc(ex.label):'Reasoning and evidence'}</h3>${follow?`<p>${esc(ex.task)}</p>`:''}${ex.reasoningPrompt?`<p><strong>Reasoning · self-review:</strong> ${esc(ex.reasoningPrompt)} A useful explanation names the decision, its consequence and evidence for a repair; code checks cannot assess this reasoning.</p>`:''}${ex.evidence?`<p>${esc(ex.evidence)}</p>`:''}</section>`:''}${evidenceContract(ex)}${help(ex)}${prerequisites(card)}<details class="ml-sources"><summary>Sources and API context</summary><p>Examples run with this Playground’s scikit-learn 1.4.2 / Pyodide 0.26.4 runtime.</p><ul>${card.sources.map(([title,href])=>`<li><a href="${esc(href)}" target="_blank" rel="noopener">${esc(title)}</a></li>`).join('')}</ul></details></article>${ex.kind==='python'?pythonPane(ex):conceptPane(ex)}</div>${navigation(card,index)}</div>`;
  }
  function evidenceContract(ex){
    return ex.contract?`<section class="ml-contract"><h3>Required Python variables and evidence</h3><p>Use these names so Check can inspect your workflow. Each meaning is shown beside its name.</p>${table(['Variable','Meaning'],ex.contract.map(c=>[c.name,c.description]),'Workflow evidence contract')}</section>`:'';
  }
  function workflowMap(ch){
    const discovery=['clustering','pca'].includes(view?.card?.deck)||['ML-X17','ML-X18','ML-X19'].includes(ch?.id);
    const introduction=discovery?'Use the ML → Workflow discovery route: define the observations and measurements, explore and prepare them, fit the grouping or representation, inspect its evidence and explain what the result can support. There is no prediction target or reserved final test in this workflow.':'Use the same data boundary as ML → Workflow: frame, split, explore, prepare, validate against a reference, diagnose, then make the final evaluation. Each step answers one question.';
    return `<section class="ml-workflow-map"><h3>The playground workflow</h3><p>${introduction}</p><ol>${ch.workflowSteps.map(step=>`<li><strong>${esc(step.title)}</strong><span>${esc(step.question)}</span></li>`).join('')}</ol></section>`;
  }
  function editorReference(ex){
    if(!ex.dictionary)return '';
    const terms=view?.card?.syntaxBreakdown?.slice(0,3)||[];
    const route=view?.card?.deck==='clustering'?'Choose measurements → sample → scale → build hierarchy → compare cuts → describe original-unit groups.':view?.card?.deck==='pca'?'Choose measurements → scale → fit PCA → inspect variance → retain dimensions → interpret weights.':'Frame → reserve final rows → compare dummy and candidate on training folds → diagnose → fit the fixed recipe → evaluate once.';
    return `<section class="ml-editor-reference" aria-label="Workflow reference beside your Python"><div class="ml-editor-reference-head"><strong>Keep beside your code</strong><button type="button" id="mlReviewLesson">Review lesson ↑</button></div><p>${esc(ex.question)}</p><div class="ml-editor-dictionary">${ex.dictionary.map(([name,meaning])=>`<div><code>${esc(name)}</code><span>${esc(meaning)}</span></div>`).join('')}</div>${terms.length?`<p class="ml-editor-terms">${terms.map(term=>`<span><code>${esc(term.code)}</code> ${esc(term.meaning)}</span>`).join('')}</p>`:''}<p class="ml-editor-route">${route}</p></section>`;
  }
  function pythonPane(ex){
    ex=view?.exercise||ex;
    const question=reflectionQuestions[ex.id];
    return `<section class="foundation-code-pane ml-code-pane" aria-label="Python practice"><div class="foundation-task-reminder"><strong>Your task · ${esc(ex.label||"Workflow challenge")}</strong><p>${esc(ex.task||view?.challenge?.question)}</p><div class="ml-output-names" aria-label="Requested output variables">${ex.outputs.map(name=>`<code>${esc(name)}</code>`).join('')}</div></div>${editorReference(ex)}<div class="foundation-editor-head"><label for="mlEditor">YOUR PYTHON</label><div class="ml-editor-head-actions"><button type="button" id="mlBriefJump">Brief ↑</button><button type="button" id="jumpToWork">Jump to your work ↓</button></div></div><p class="foundation-editor-shortcuts" id="mlEditorHelp">Ctrl/⌘+Enter: Run · Tab: indent · Esc then Tab: leave editor</p><div class="foundation-editor-wrap"><div class="foundation-line-numbers" aria-hidden="true"></div><pre id="mlHighlight" aria-hidden="true"></pre><textarea id="mlEditor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-describedby="mlEditorHelp"></textarea></div><div class="foundation-actions"><button class="primary" id="mlRun" type="button">▶ Run code</button><button id="mlCheck" type="button">✓ Check answer</button><button id="mlReset" type="button">Reset code</button><button id="mlStop" type="button">Stop / restart</button></div><p class="foundation-runtime" id="mlStatus" role="status">Python loads when you run. Code and results stay in this activity only.</p><p class="foundation-feedback" id="mlFeedback" role="status"></p><div class="foundation-output ml-output" id="mlOutput" role="region" aria-label="Python output"><p class="ml-empty">Run your code to inspect its output. Check uses that same run.</p></div><div class="ml-output ml-results" id="mlResults" aria-live="polite"></div>${question?`<div class="ml-output"><label for="mlReflection">Your interpretation · self-review</label><p id="mlReflectionQuestion"><strong>${esc(question)}</strong></p><textarea class="ml-reflection" id="mlReflection" aria-describedby="mlReflectionQuestion mlReflectionHelp"></textarea><p class="ml-data-note" id="mlReflectionHelp">Use your Run output as evidence. This response is optional, not machine-graded or saved.</p></div>`:''}</section>`;
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
    const checks=items=>`<ul>${items.map(c=>`<li class="${esc(c.status)}"><h4>${esc({'correct':'✓ Consistent','needs-attention':'△ Needs attention','unavailable':'○ Unable to check','self-review':'◇ Self-review'}[c.status])} · ${esc(c.name)}</h4><p>${esc(c.message)}</p></li>`).join('')}</ul>`;
    document.getElementById('mlResults').innerHTML=`<h3>Check results · this run only</h3><p>Checks establish observable code evidence, not scientific understanding. Review your explanation separately.</p>`+(view.challenge?view.challenge.deliverableGroups.map(g=>`<section><h3>${esc(g.title)}</h3>${checks(r.checks.filter(c=>g.checks.includes(c.name)))}</section>`).join(''):checks(r.checks));
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
      const d=exercise.inputFile?{file:exercise.inputFile}:datasets[exercise.dataset],files={};
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
    const highlight=document.getElementById('mlHighlight'),numbers=document.querySelector('.foundation-line-numbers');
    function syncScroll(){highlight.scrollTop=editor.scrollTop;highlight.scrollLeft=editor.scrollLeft;numbers.scrollTop=editor.scrollTop;}
    function paint(){highlight.innerHTML=FoundationLearning.highlightPython(editor.value)+'\n';numbers.textContent=editor.value.split('\n').map((_,i)=>i+1).join('\n');syncScroll();}
    editor.addEventListener('input',paint);editor.addEventListener('scroll',syncScroll);paint();
    document.getElementById('jumpToWork').onclick=()=>{editor.focus();editor.setSelectionRange(0,0);editor.scrollTop=0;};
    FoundationEditor.attach(editor,run,backward=>(backward?document.querySelector('.foundation-task-reminder'):document.getElementById('mlRun')).focus());
    document.querySelector('.foundation-task-reminder').tabIndex=0;
    editor.addEventListener('input',()=>{receipts.edit();document.getElementById('mlResults').replaceChildren();document.getElementById('mlFeedback').textContent='Code changed. Run it to produce current evidence.';});
    document.getElementById('mlRun').addEventListener('click',run);
    document.getElementById('mlCheck').addEventListener('click',showChecks);
    document.getElementById('mlReset').addEventListener('click',()=>{editor.value=ex.starter;paint();receipts.edit();clearResources();document.getElementById('mlOutput').innerHTML='<p class="ml-empty">Code reset. Run to produce new output.</p>';document.getElementById('mlResults').replaceChildren();editor.focus();});
    document.getElementById('mlStop').addEventListener('click',()=>{generation++;bridge?.restart();receipts.edit();busy=false;document.getElementById('mlRun').disabled=false;document.getElementById('mlStatus').textContent='Execution stopped. Python will start fresh on the next Run.';});
    document.querySelector('.foundation-editor-jump')?.addEventListener('click',()=>{document.querySelector('.ml-code-pane .foundation-editor-head').scrollIntoView({block:'start',behavior:'instant'});editor.focus({preventScroll:true});});
    document.getElementById('mlBriefJump')?.addEventListener('click',()=>{(document.querySelector('.ml-editor-reference')||document.querySelector('.foundation-task-reminder')).scrollIntoView({block:'start',behavior:'instant'});});
    document.getElementById('mlReviewLesson')?.addEventListener('click',()=>{const content=document.querySelector('.foundation-content');content.scrollTop=0;content.scrollIntoView({block:'start',behavior:'instant'});});
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
    FoundationLearning.highlightContent(main);
    const exit=document.querySelector('.back-playground');
    exit.href=view?.challenge?'#workflows/challenges':view?.card?'#'+view.card.deck:deck||deckId==='workflows'?'#':'learn.html';
    exit.textContent=view?.challenge?'← All challenges':view?.card?'← '+deck.title+' lessons':deck||deckId==='workflows'?'← Choose a deck':'← Learn / Refresh';
    bind();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
    if(deck&&id==='chapter'){const chapter=document.getElementById('chapter-'+position);chapter?.focus({preventScroll:true});chapter?.scrollIntoView({block:'start'});}
  }
  document.getElementById('themeButton').addEventListener('click',()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light'));
  window.addEventListener('hashchange',render);
  window.addEventListener('pagehide',clearResources);
  // Inspectable content/read-only state for real-browser audits; no persistence API.
  window.MLLearning={curriculum:C,datasets,get activity(){return view?.exercise;},get retainedReceipts(){return receipts.retainedReceipts;}};
  render();
})();
