/* ML content on the existing Foundations shell. All learning state is transient. */
(async function(){
  'use strict';
  const main=document.getElementById('foundationsMain');
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sentence=x=>/[.!?]$/.test(String(x).trim())?String(x).trim():String(x).trim()+'.';
  const code=x=>`<pre><code>${esc(x)}</code></pre>`;
  const [C,datasets,challengeInputs]=await Promise.all(['ml-learning/curriculum.json','ml-learning/datasets.json','ml-learning/inputs.json'].map(async url=>{
    const r=await fetch(url);if(!r.ok)throw Error('Could not load '+url);return r.json();
  })).catch(error=>{main.innerHTML=`<h2>Learning content could not load</h2><p>${esc(error.message)}</p><p>Reload this page to try again.</p>`;throw error;});
  const byId=new Map(C.cards.map(c=>[c.id,c]));
  const receipts=MLLearningReceipts.createReceiptStore();
  let view=null,bridge=null,workerSource=null,busy=false,generation=0;
  const downloadURLs=new Set();
  const collections=MLLearningCollections;
  C.collections=collections.collections;
  const url=(c,i=0,collection='')=>LearningRoutes.url('ml',`${c.deck}/${c.id}/${i}`,new URLSearchParams(location.search).get('from'),collection);
  // A writing field earns its space only when this activity asks for a specific
  // interpretation. Routine syntax and retrieval prompts stay in the lesson.
  const reflectionQuestions=Object.freeze({
    'ML-R-R1-1':"What does a two-unit weight difference imply for the fitted prediction when distance stays fixed?",
    'ML-R-R1-2':"Why is the evaluation-row mean an unsafe reference for a model fitted on training rows?",
    'ML-R-R2-3':"Which minimum-leaf setting has the strongest training-fold evidence for these data?",
    'ML-C-R1-3':"What does the majority reference reveal about the classifier's macro F1 on matching folds?",
    'ML-U-R1-3':"What do the original-unit profiles reveal about these clusters without treating them as known classes?",
    'ML-P-R1-1':"What changes when you retain 95% rather than 80% of the measured variation?",
    'ML-F-K1-1':"What does the held-out completion-time error support about predictions for new intake cases?",
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
    'ML-U07-4':"How does standardising the measurements change the raw-versus-scaled Ward merge geometry?",
    'ML-P02-4':"Why must incoming rows reuse the previously fitted scale and PCA axes?",
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
  const ordered=deck=>(collections.legacyOrder[deck]||[]).map(id=>byId.get(id));
  function table(columns,rows,caption){
    return `<div class="foundation-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}; scroll for more columns"><table${columns[0]==='Column'?' data-code-table="dictionary"':''}><caption>${esc(caption)}</caption><thead><tr>${columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==='number'?Number(v.toPrecision(6)):v===null?'missing':v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function datasetPreview(name,challengeInput=null){
    const d=challengeInput?challengeInputs[view.challenge.id]:datasets[name];
    if(!d)return '<p>Use the input file named in the brief.</p>';
    const dictionary=DatasetDictionary[name]||DatasetDictionary[d.sourceFile||d.file]||{};
    if(view?.exercise?.dictionary)return `<section><h3>Your inputs · ${esc(name)}</h3><p>${d.rows} synthetic independent observations. The dataframe df is supplied afresh on each Run. Column availability is described in the question’s dictionary above.</p>${table(d.columns,d.preview,`${name} · first ${d.preview.length} rows`)}</section>`;
    const discovery=['clustering','pca'].includes(view?.card?.deck)||['ML-X17','ML-X18','ML-X19'].includes(view?.challenge?.id);
    const columns=discovery?d.columns.filter(c=>!['species','diagnosis'].includes(c)):d.columns;
    const preview=d.preview.map(row=>columns.map(c=>row[d.columns.indexOf(c)]));
    return `<section><h3>${challengeInput?'Challenge input':'Given data'} · ${esc(name)}</h3><p>${d.rows} observations. ${esc(dictionary.row||'Deterministic teaching observations; values illustrate the concept rather than a real population claim.')} ${challengeInput?'Load the CSV file yourself.':'The dataframe df is supplied afresh for each Run.'}</p>${d.file?`<p><a href="${esc(d.file)}" download>${challengeInput?'Download challenge input CSV':'Download source CSV'}</a>${challengeInput?` · <a href="${esc(d.sourceFile)}">Original source dataset</a>`:''}${dictionary.source?` · <a href="${esc(dictionary.source)}" target="_blank" rel="noopener">Source and original dictionary</a>`:''}</p>`:''}${challengeInput?`<p class="ml-input-contract">${esc(d.description)}</p>`:discovery?'<p>Reference labels are omitted from this preview and must remain outside fitting.</p>':''}${table(columns,preview,`${name} · ${d.preview.length===d.rows?'all rows':'first '+d.preview.length+' prepared rows'}`)}<section class="ml-column-guide"><h4>Column meanings and units</h4><p>${esc(dictionary.units||'Column names describe the supplied features and target. Keep the stated units and row identities when making comparisons.')}</p><p>${esc(dictionary.assumptions||'Synthetic data are deliberately small and reproducible. Their patterns illustrate an idea; they are not evidence about a real population.')}</p>${challengeInput?`<p>${esc(challengeInput.description)}</p>`:''}${dictionary.columns?`<dl class="ml-column-definitions">${columns.map(c=>`<div><dt><code>${esc(c)}</code><small>${esc(d.dtypes[c])}</small></dt><dd>${esc(dictionary.columns[c]?.[0]||'Not specified')}<small>Unit / values: ${esc(dictionary.columns[c]?.[1]||'Not specified')}</small></dd></div>`).join('')}</dl>`:table(['Column','Stored type'],columns.map(c=>[c,d.dtypes[c]]),'Input schema')}</section>${validationDesign(view?.exercise)}</section>`;
  }
  function validationDesign(ex){
    const p=ex?.protect;if(!p)return '';
    const split=p.time?'Order the declared population by time. Reserve the final 20% of rows; use the earlier 80% for development.':'Reserve 20% of the declared population for the final test using split seed 42. '+(p.stratified?'Keep class proportions with a stratified split.':'Use a random split.');
    const folds=ex.checks.some(c=>c.name==='Matching folds');
    const validation=!folds?'':p.time?'Use five forward validation folds without shuffling. Diagnose the last training-validation block.':'Use the same five '+(p.stratified?'stratified ':'')+'training folds, shuffled with seed 42, for reference comparison, candidates and selection. Use out-of-fold training predictions for diagnosis.';
    const scoring=!folds?'':p.stratified?'Select with macro F1 and compare with a most-frequent-class reference. Accuracy is supplementary.':'Select with negative RMSE (larger is better) and compare with a training-mean reference. Report final RMSE in original target units.';
    return `<section class="ml-validation-design"><h4>How we validate this model</h4><p>${esc(split)}</p>${folds?`<p>${esc(validation)} ${esc(scoring)} Open final-test evidence after selection and diagnosis.</p>`:''}</section>`;
  }
  const collectionRegistry={collection:{id:'workflow',title:'Workflow Challenges',rootTitle:'Machine Learning',omitDeckCrumb:true,rootHref:'#',lessonsHref:'#',lessonsLabel:'Learning decks',contractNote:'These conditions describe a complete workflow. Use the declared Python variables beside the editor; Check inspects evidence from your Run.',briefLabel:'Independent ML briefs',introduction:'Assemble a complete workflow from a realistic question and inspectable evidence.',inputNote:'Choose any brief. Each runs independently with its supplied inputs. Prerequisites and time estimates are guidance.'},families:{regression:'Regression',classification:'Classification',neural:'Neural networks',time:'Time-ordered prediction',clustering:'Clustering',pca:'PCA'},challenges:C.challenges};
  const challengeExperience=createChallengeExperience(collectionRegistry,{
    deliverables:ch=>`<ol class="ml-deliverable-groups">${ch.deliverableGroups.map(g=>`<li><h4>${esc(g.title)}</h4>${LearningLanguage.steps(g.instructions||g.summary,ch.id)}</li>`).join('')}</ol>${workflowMap(ch)}`,
    inputPreview:input=>{
    const ch=view?.challenge;return datasetPreview(ch?.exercise.dataset,input);
  }});
  const deckIcon=FoundationLearning.deckIcon;
  const deckLabel=deck=>deck==='foundations'?'START HERE':deck==='workflow'?'SHARED SUPERVISED WORKFLOW':'SUBJECT LIBRARY';
  function deckTile(d){
    return `<a class="foundation-deck" data-deck="${d.id}" href="#${d.id}"><div class="deck-top"><span>${deckLabel(d.id)}</span>${deckIcon}</div><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><div class="deck-bottom"><span>${ordered(d.id).filter(c=>c.kind==='teaching').length} lessons · ${ordered(d.id).filter(c=>c.kind!=='teaching').length} reviews</span><span aria-hidden="true">↗</span></div></a>`;
  }
  function collectionTile(c){
    const cards=c.ids.map(id=>byId.get(id));
    return `<a class="foundation-deck" data-collection="${c.id}" data-deck="${c.deck}" href="#${collections.route(c)}"><div class="deck-top"><span>${c.group==='capstone'?'CAPSTONE':'MODEL DECK'}</span>${deckIcon}</div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="deck-bottom"><span>${cards.filter(card=>card.kind==='teaching').length} lessons · ${cards.filter(card=>card.kind!=='teaching').length} reviews / checkpoints</span><span aria-hidden="true">↗</span></div></a>`;
  }
  function landing(){
    return `<section class="foundation-hero"><div><h2>Machine Learning</h2><p>Begin with ML Foundations. For prediction, practise the shared Supervised Workflow, then choose a model deck for your task. For discovery or PCA, take Discovery foundations and the relevant preparation ideas. Helpful prior knowledge guides your choice; every lesson and workflow remains open.</p></div></section><section aria-labelledby="ml-start"><h3 id="ml-start">Start with the foundations</h3><p class="recommended-start"><a href="#foundations/ML-F01/0">Start with features and a target →</a></p><div class="foundation-decks">${C.decks.filter(d=>['foundations','workflow'].includes(d.id)).map(deckTile).join('')}</div></section>${collections.groups.map(group=>`<section aria-labelledby="ml-group-${group.id}" data-collection-group="${group.id}"><h3 id="ml-group-${group.id}">${esc(group.title)}</h3><p>${esc(group.description)}</p><div class="foundation-decks">${collections.collections.filter(c=>c.group===group.id).map(collectionTile).join('')}</div></section>`).join('')}<section aria-labelledby="ml-workflows"><h3 id="ml-workflows">Independent workflow challenges</h3><div class="foundation-decks"><a class="foundation-deck" data-deck="challenges" href="#workflows/challenges"><div class="deck-top"><span>WORKFLOWS</span>${deckIcon}</div><h3>Workflow Challenges</h3><p>Bring the steps together. Load data, build each model, inspect evidence and explain the result.</p><div class="deck-bottom"><span>${C.challenges.length} independent workflows · ${C.models.length} models</span><span aria-hidden="true">↗</span></div></a></div></section><details class="ml-subject-libraries"><summary>Browse the original subject libraries</summary><p>These links retain the complete subject lists, including shared reviews and checkpoints.</p><p>${C.decks.map(d=>`<a href="#${d.id}">${esc(d.title)}</a>`).join(' · ')}</p></details>`;
  }
  function cardTile(c,collection=''){
    return `<a class="lesson-card ${c.kind!=='teaching'?'is-review':''}" href="${url(c,0,collection)}"><div class="card-meta"><span class="card-id">${esc(c.id.replace('ML-',''))}</span><span class="card-level">${c.tier==='core'?'Core':'Go Further'} · ${esc(c.kind)}</span></div>${MLLearningVisuals.thumbnail(c)}<h4>${esc(c.title)}</h4><p>${esc(c.goal)}</p><small>${esc(c.minutes)} min · ${c.exercises.length} practices</small></a>`;
  }
  function deckPage(deck){
    const list=ordered(deck.id);
    const chapters=[...new Set(list.map(c=>c.chapter))];
    return `<header class="foundation-deck-heading"><span class="foundation-eyebrow">${deckLabel(deck.id)}</span><h2>${esc(deck.title)}</h2><p>${esc(deck.description)}</p>${collections.collections.some(c=>c.deck===deck.id)?`<p>Choose a model deck from <a href="#">Machine Learning</a>, or browse the complete subject below.</p>`:''}<nav class="chapter-jumps" aria-label="Jump to chapter">${chapters.map((chapter,i)=>`<span class="chapter-step">${i?'<span class="chapter-flow-arrow" aria-hidden="true">→</span>':''}<a href="#${deck.id}/chapter/${i}">${esc(chapter)}</a></span>`).join('')}</nav></header>`+chapters.map((chapter,i)=>`<section class="foundation-chapter" id="chapter-${i}" tabindex="-1"><h3>${String(i+1).padStart(2,'0')} / ${esc(chapter)}</h3><div class="lesson-library">${list.filter(c=>c.chapter===chapter).map(c=>cardTile(c)).join('')}</div></section>`).join('');
  }
  function collectionPage(collection){
    const deck=C.decks.find(d=>d.id===collection.deck);
    const prior=collection.prior.map(id=>byId.get(id));
    const list=collection.ids.map(id=>byId.get(id));
    const next=collection.id==='neural-foundations'?['neural-classification','neural-quantity']:collection.id==='classification-evidence'?collections.collections.filter(c=>c.group==='classes'&&c.id!==collection.id).map(c=>c.id):collection.id==='discovery-foundations'?['k-means','hierarchical','pca']:[];
    return `<nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Machine Learning</a><span>/</span><a href="#${deck.id}">${esc(deck.title)}</a><span>/</span><span>${esc(collection.title)}</span></nav><header class="foundation-deck-heading"><span class="foundation-eyebrow">${collection.group==='capstone'?'CAPSTONE':'TEACHING COLLECTION'}</span><h2>${esc(collection.title)}</h2><p>${esc(collection.description)}</p><p class="ml-prerequisites"><strong>Helpful prior knowledge:</strong> ${prior.map(c=>`<a href="${url(c)}">${esc(c.title)}</a>`).join(' · ')}. These links are guidance, not locks.</p><p>Follow teaches the idea; Change asks you to make a choice; Transfer changes the context. Apply, reviews and checkpoints appear where the existing lessons provide them. Go Further lessons are optional.</p></header><section class="foundation-chapter"><h3>Lessons in this model deck</h3><p class="recommended-start"><a href="${url(list.find(c=>c.kind==='teaching'&&c.tier==='core')||list[0],0,collection.id)}">Start with the first core lesson →</a></p><div class="lesson-library">${list.map(c=>cardTile(c,collection.id)).join('')}</div></section>${next.length?`<section><h3>Choose your next model deck</h3><p>${next.map(id=>collections.get(id)).map(c=>`<a href="#${collections.route(c)}">${esc(c.title)}</a>`).join(' · ')}</p></section>`:''}<p><a href="#${deck.id}">Browse all ${esc(deck.title)} lessons, reviews and checkpoints →</a></p><p><a href="#workflows/challenges">Choose an independent workflow challenge →</a></p>`;
  }
  function prerequisites(card){
    return `<p class="ml-prerequisites"><strong>Helpful prior knowledge:</strong> ${card.prerequisites.length?card.prerequisites.map(id=>`<a href="${url(byId.get(id))}">${esc(byId.get(id).title)}</a>`).join(' · '):'Data Foundations: inspecting, preparing and plotting tables.'} These links are guidance, not locks.</p>`;
  }
  function help(ex){
    return `<details class="ml-hints"><summary>Hints</summary><p><strong>Think:</strong> ${esc(ex.hints.think)}</p><p><strong>Tools:</strong> ${esc(ex.hints.tools)}</p><p><strong>Approach:</strong> ${esc(ex.hints.approach)}</p></details><details class="ml-explained-solution"><summary>Explained solution</summary>${ex.kind==='python'?code(ex.solution):`<p>${esc(ex.solution)}</p>`}<p>${esc(ex.explanation)}</p></details>`;
  }
  function pathList(card){
    const collection=collections.selected(card,location.search)||collections.primary(card);
    return (collection?collection.ids.map(id=>byId.get(id)):ordered(card.deck)).filter(c=>c.tier==='core'||c.id===card.id);
  }
  function navigation(card,index){
    const list=pathList(card),position=list.indexOf(card);
    const collection=collections.primary(card),context=collection?.id||'';
    const boundary=collection?'#'+collections.route(collection):'#'+card.deck;
    const previous=index?url(card,index-1,context):position>0?url(list[position-1],list[position-1].exercises.length-1,context):boundary;
    const next=index<card.exercises.length-1?url(card,index+1,context):position>=0&&position<list.length-1?url(list[position+1],0,context):boundary;
    return `<nav class="foundation-navigation" aria-label="Lesson progression">${previous===boundary?'<span class="deck-boundary">Start of deck</span>':`<a href="${previous}">← ${index?'Previous practice':'Previous lesson'}</a>`}${next===boundary?(collection?`<a href="${next}">${card.deck==='networks'?'Choose a neural route':'Return to model deck'} →</a>`:'<span class="deck-boundary">End of deck</span>'):`<a href="${next}">${index<card.exercises.length-1?'Next practice':'Next lesson'} →</a>`}</nav>`;
  }
  function branchNavigation(card,index){
    if(index!==card.exercises.length-1)return '';
    const ids=card.id==='ML-N-R1'?['neural-classification','neural-quantity']:card.id==='ML-U02'?['k-means','hierarchical','pca']:[];
    return ids.length?`<p class="ml-branch-links"><strong>Continue with:</strong> ${ids.map(id=>collections.get(id)).map(c=>`<a href="#${collections.route(c)}">${esc(c.title)}</a>`).join(' · ')}</p>`:'';
  }
  function learningContext(card,index){
    const list=pathList(card),position=list.indexOf(card);
    const next=index+1<card.exercises.length?card.exercises[index+1].label+' · '+card.title:list[position+1]?.title;
    if(card.kind==='checkpoint'&&next)return `<p class="teaching-note"><strong>Next:</strong> ${esc(sentence(next))}</p>`;
    let guidance=next?esc(sentence(next)):'';
    if(!next){
      if(card.deck==='foundations')guidance='choose <a href="#workflow">Supervised Workflow</a> for prediction, or <a href="#collections/discovery-foundations">Discovery foundations</a> for clustering and PCA.';
      else if(card.deck==='workflow')guidance='choose <a href="#collections/simple-linear">a quantity model</a> or begin with <a href="#collections/classification-evidence">classification evidence</a>. Both prediction branches build on the shared supervised workflow.';
      else if(card.deck==='networks')guidance='choose <a href="#collections/neural-classification">Neural classification</a> or <a href="#collections/neural-quantity">Neural quantity prediction</a>. These task routes are independent.';
      else if(card.id==='ML-U02')guidance='choose <a href="#collections/k-means">K-Means</a>, <a href="#collections/hierarchical">Hierarchical clustering</a> or <a href="#collections/pca">PCA</a> for your discovery question.';
      else if(card.id==='ML-C04')guidance='<a href="#">choose a classifier</a> using the shared class-evidence ideas.';
      else if(card.deck==='comparison')guidance='apply your choices in an <a href="#workflows/challenges">independent workflow challenge</a>.';
      else guidance='<a href="#">choose another model deck</a> or apply this family in an <a href="#workflows/challenges">independent workflow challenge</a>.';
    }
    return `<p class="teaching-note"><strong>This practice:</strong> ${esc(sentence(card.exercises[index].demand||card.goal))} <strong>Next:</strong> ${guidance}</p>`;
  }
  function conceptSupport(card){
    if(card.kind==='teaching')return `<a href="${url(card)}">Revisit the first example →</a>`;
    const seen=new Set([card.id]), sources=[];
    function visit(id){if(seen.has(id))return;seen.add(id);const prior=byId.get(id);if(!prior)return;if(prior.kind==='teaching')sources.push(prior);else prior.prerequisites.forEach(visit);}
    (card.id==='ML-W-K1'?['ML-W06','ML-W09','ML-W13']:card.prerequisites).forEach(visit);
    return sources.length?'Supporting concepts: '+sources.map(c=>`<a href="${url(c)}">${esc(c.title)} →</a>`).join(' · '):'Use the helpful prior knowledge links below.';
  }
  function masterySupport(ex){
    if(!ex.rubric)return '';
    return `<section class="teaching-reference"><h3>The question and data dictionary</h3><p>${esc(ex.question)}</p><p>${esc(ex.context)}</p>${table(['Column','Meaning and availability'],ex.dictionary,'Decide what can be known at prediction time')}</section>${workflowMap(ex)}${ex.bug?`<section class="teaching-reference"><h3>Find the fault</h3><p>Identify the failed decision, explain its consequence, then repair the workflow in the editor.</p>${code(ex.bug)}</section>`:''}<section class="teaching-reference"><h3>${ex.readiness?'Readiness rubric':'Explain your decisions'} · self-review</h3><p>${ex.readiness?'For each criterion: 0 = missing or unsafe; 1 = plausible but unsupported; 2 = correct and supported by your actual evidence. Aim for 2 on every criterion. A target leak, test-driven selection or test-row fit means the boundary must be repaired before a readiness claim.':'Before Run, write your prediction. After Run, explain what the evidence supports and what it cannot establish.'} Code checks cannot award these reasoning scores.</p><ol class="ml-rubric">${ex.rubric.map(r=>`<li><strong>${esc(r.title)}</strong><span>${esc(r.description)}</span></li>`).join('')}</ol><p>Use the interpretation field beside your output. After an attempt, Check identifies code evidence and shows reasoning guidance. The optional explained solution is one defensible approach, not the only acceptable answer.</p></section>`;
  }
  function modelSupport(card,ex){
    if(!card.modelGuide?.length)return '';
    const bridge=card.exercises.findIndex(e=>e.modelBridge);
    const discovery=['clustering','pca'].includes(card.deck);
    const bridgeText=card.deck==='clustering'?'Construct and compare raw and scaled Ward merge geometry':card.deck==='pca'?'Reuse a fitted scale and PCA representation on incoming rows':'Apply this model with a baseline, training validation and one final evaluation';
    const classification=card.deck==='classification'||card.id==='ML-N03';
    const regression=card.deck==='regression'||card.id==='ML-N04';
    const prior=discovery?'Use <a href="#collections/discovery-foundations">Discovery foundations</a> to frame a question without a prediction target.':classification?'First practise the complete classification workflow in <a href="#foundations/ML-F12/0">F12</a>; check classification readiness in <a href="#workflow/ML-W-K3/0">W-K3</a>.':regression?'First practise the complete regression workflow in <a href="#foundations/ML-F11/0">F11</a>; check regression readiness in <a href="#workflow/ML-W-K2/0">W-K2</a>.':'Choose the complete foundations workflow for your task, then practise <a href="#workflow">Supervised Workflow</a> before a task-specific network route.';
    return card.modelGuide.map(g=>`<section class="teaching-reference"><h3>${esc(g.name)} · from idea to workflow</h3><p><strong>Question:</strong> ${esc(g.question)}</p><p><strong>Mechanism:</strong> ${esc(g.mechanism)}</p><p><strong>Watch for:</strong> ${esc(g.failure)}</p><p><strong>Interpret or debug · self-review:</strong> ${esc(g.debug)}</p>${bridge>=0?`<p><strong>Guided application:</strong> <a href="${url(card,bridge)}">${bridgeText} →</a></p>`:''}<p><strong>Independent full workflow:</strong> ${g.challenges.map(id=>`<a href="#workflows/challenges/${esc(id)}">${esc(id)}</a>`).join(' · ')}. ${prior}</p></section>`).join('');
  }
  function syntaxProse(value,part){
    // Parameter occurrences come from this concept's existing call signature.
    // Common English names are marked only in an assignment or a parameter
    // definition; quoted examples and ordinary model prose retain their roles.
    const parameters=new Set([...String(part.code||'').matchAll(/[(,]\s*([A-Za-z_]\w*)\s*=/g)].map(m=>m[1]));
    const source=String(value||'');
    const tokens=/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b[A-Za-z_]\w*\b/g;
    let html='',start=0;
    for(const match of source.matchAll(tokens)){
      const name=match[0],before=source.slice(0,match.index),after=source.slice(match.index+name.length);
      const definition=/(?:^|[.!?]\s+)$/.test(before)&&/^\s+(?:accepts|defaults|controls|is|names|must)\b/.test(after);
      const parameter=parameters.has(name)&&(name.includes('_')||/^\s*=/.test(after)||definition);
      html+=esc(source.slice(start,match.index))+(parameter?`<code data-code-role="parameter">${esc(name)}</code>`:esc(name));
      start=match.index+name.length;
    }
    return html+esc(source.slice(start));
  }
  const argumentValues={
    n_neighbors:['1','3','5','9'], max_depth:['3','5','None'], min_samples_leaf:['1','5','10'],
    C:['0.5','1','2','10'], gamma:['"scale"','"auto"','0.1','1','10'],
    kernel:['"linear"','"rbf"','"poly"','"sigmoid"','"precomputed"','kernel_function'],
    random_state:['42','None'], shuffle:['True','False'], stratify:['y','None'],
    test_size:['0.2','0.25','6'], n_splits:['3','5'], n_components:['2','None','0.9'],
    average:['"binary"','"micro"','"macro"','"weighted"','None'],
    scoring:['"neg_root_mean_squared_error"','"neg_mean_absolute_error"','"f1_macro"','"balanced_accuracy"','score_function'],
    cv:['5','folds','list_of_index_pairs'], method:['"predict"','"predict_proba"','"decision_function"'],
    max_iter:['100','500','1000'], hidden_layer_sizes:['(24,)','(16, 8)'], alpha:['0.0001','0.01'],
    early_stopping:['False','True'], fit_intercept:['True','False'], include_bias:['False','True'],
    degree:['1','2','4'], reg_param:['0','0.1','0.5','1'], shrinkage:['None','"auto"','0.1'],
    handle_unknown:['"error"','"ignore"','"infrequent_if_exist"'],
    return_distance:['True','False'], fill_value:['0','None'],
    bins:['3','5','8'], q:['2','4','[0, 0.25, 0.5, 1]']
  };
  function syntaxValues(part){
    const source=part.code||'',names=Object.keys(argumentValues).filter(name=>new RegExp('\\b'+name+'\\s*=').test(source)||new RegExp("['\"](?:model__)?"+name+"['\"]").test(source));
    const choices=names.map(name=>[name,argumentValues[name]]);
    if(/strategy\s*=/.test(source))choices.push(['strategy',source.includes('DummyClassifier')?['"most_frequent"','"prior"','"stratified"','"uniform"','"constant"']:source.includes('SimpleImputer')?['"mean"','"median"','"most_frequent"','"constant"']:['"mean"','"median"','"quantile"','"constant"']]);
    return choices.length?'<p class="foundation-argument-values"><strong>Accepts:</strong> '+choices.map(([name,values])=>'<code data-code-role="parameter">'+esc(name)+'</code>: '+values.map(value=>'<code data-code-role="'+(['y','folds','list_of_index_pairs'].includes(value)?'variable':'syntax')+'">'+esc(value)+'</code>').join(', ')).join('; ')+'.</p>':'';
  }
  function syntaxParts(parts,full=true){
    return `<dl class="foundation-syntax teaching-syntax-parts ml-syntax-parts">${parts.map(p=>{
      const columnHead=view?.card?.id==='ML-M03'&&/^(['"])(cv_rmse|fold_sd)\1$/.test(p.code||'');
      return `<div><dt><code${columnHead?' data-code-role="column"':''}>${esc(p.code||p.title)}</code></dt><dd>${syntaxProse(p.meaning,p)}${syntaxValues(p)}${(p.forms||p.choices)?`<p><strong>Values and choices:</strong> ${syntaxProse(p.forms||p.choices,p)}</p>`:''}${full&&p.example?code(p.example):''}</dd></div>`;
    }).join('')}</dl>`;
  }
  function syntaxSupport(card,ex,level='current'){
    if(card.kind!=='teaching'&&level==='current')return '';
    const guidance=ex.syntaxGuidance;
    if(guidance){
      if(level==='reference'){
        const current=guidance.current||[];
        const reference=(guidance.reference||[]).filter(p=>!current.some(c=>JSON.stringify(c)===JSON.stringify(p)));
        return `${!ex.workflowSections?.length&&current.length?`<section class="ml-syntax-detail"><h3>Current syntax: choices and examples</h3>${syntaxParts(current)}</section>`:''}${guidance.reminders?.length?`<section class="ml-syntax-reminder"><h3>Familiar syntax</h3>${syntaxParts(guidance.reminders)}</section>`:''}${reference.length?`<section class="ml-syntax-reference"><h3>Syntax reference</h3>${syntaxParts(reference)}</section>`:''}${card.example&&ex.label==='Follow'&&String(card.example).trim()!==String(ex.starter).trim()?`<section class="teaching-worked"><h3>Worked example</h3>${code(card.example)}</section>`:''}`;
      }
      const current=guidance.current||[];
      return current.length?`<section class="teaching-essential ml-syntax"><h3>Python for this practice</h3>${syntaxParts(current,false)}</section>`:'';
    }
    const parts=Array.isArray(card.syntaxBreakdown)?card.syntaxBreakdown:[];
    return `<section class="teaching-essential ml-syntax"><h3>Python for this practice</h3>${code(card.syntax)}${syntaxParts(parts,level==='reference')}</section>`;
  }
  function suppliedState(ex,full=false){
    if(!ex.suppliedState?.length&&!ex.setup)return '';
    if(!full){
      const fitted=(ex.suppliedState||[]).filter(p=>p.fitted);
      return fitted.length?`<p class="ml-provided-note"><strong>Supplied fitted objects:</strong> ${fitted.map(p=>`<code data-code-role="variable">${esc(p.name)}</code>${p.training?' (fitted on '+esc(p.training)+')':''}`).join('; ')}.</p>`:'';
    }
    return `<section class="ml-provided-state" aria-label="Provided objects"><h3>Supplied objects and preparation</h3>${ex.suppliedState?.length?`<dl>${ex.suppliedState.map(p=>`<div><dt><code data-code-role="variable">${esc(p.name)}</code></dt><dd>${esc(p.fitted?p.description.replace('Already fitted on '+p.training+'. ' ,''):p.description)}${p.fitted?` <strong>Already fitted${p.training?' on '+esc(p.training):''}.</strong>`:''}</dd></div>`).join('')}</dl>`:''}${ex.familiarSetup&&!ex.setup?code(ex.familiarSetup):''}${ex.setup?`<p>This setup runs before your editor on each Run.</p>${code(ex.setup)}`:''}</section>`;
  }
  function workflowSections(ex,full=false){
    if(!ex.workflowSections?.length)return '';
    if(!full)return `<section class="ml-progressive-workflow" aria-label="Complete workflow outline"><h3>The workflow</h3><ol class="ml-workflow-outline">${ex.workflowSections.map(s=>`<li><strong>${esc(s.title)}</strong><p>${esc(s.question)}</p></li>`).join('')}</ol></section>`;
    const stepFor={assignment:1,'features-target':1,split:2,stratify:2,pipeline:4,scale:4,logistic:4,knn:4,tree:4,svm:4,lda:4,qda:4,neural:4,polynomial:4,'target-transform':4,'balanced-accuracy':7,baseline:5,folds:5,'cross-validation':5,oof:6,clone:7,mae:7,rmse:7,'macro-f1':7};
    return `<section class="ml-workflow-detail" aria-label="Complete workflow explained in sections"><h3>Workflow explained</h3>${ex.workflowSections.map((s,i)=>{
      const current=(ex.syntaxGuidance?.current||[]).filter(p=>(stepFor[p.id]||8)===(s.number||i+1));
      return `<section class="ml-workflow-section"><h4>${esc(s.number||i+1)} · ${esc(s.title)}</h4><p><strong>${esc(s.question)}</strong></p><p>${esc(s.meaning)}</p>${s.code?code(s.code):''}${current.length?syntaxParts(current):''}</section>`;
    }).join('')}</section>`;
  }
  function modelComparison(card){
    const comparison=card.modelComparison;if(!comparison)return '';
    return `<section class="ml-model-comparison"><h3>Compare the model definitions</h3><p><strong>Same:</strong> ${esc(comparison.same)}</p><p><strong>Why the change:</strong> ${esc(comparison.why||comparison.reason)}</p><p>${esc(comparison.dataset||'The same illustrative observations support this direct comparison.')}</p>${comparison.examples.map(e=>`<h4>${esc(e.name)}</h4><pre><code>${FoundationLearning.changedCode(e.code,e.changedLines)}</code></pre>`).join('')}</section>`;
  }
  function practicePrompt(ex){
    const task=String(ex.task||'').trim();
    const heading=ex.question||'Your task';
    const detail=ex.question?(task.startsWith(ex.question)?task.slice(ex.question.length).trim():task):task;
    return `<h3 class="practice-question">${LearningLanguage.text(heading,ex.id,true)}</h3>${detail?LearningLanguage.activity({...ex,task:detail}):''}`;
  }
  function visualPresentation(visual){
    const rendered=MLLearningVisuals.render(visual);
    const schematic=rendered.match(/<details class="ml-schematic-reference"><summary>Concept schematic<\/summary>([\s\S]*?)<\/details>$/);
    let primary=schematic?rendered.slice(0,schematic.index):rendered;
    const observations=primary.match(/<details><summary>Example observations<\/summary>([\s\S]*?)<\/details>/);
    if(observations)primary=primary.replace(observations[0],'');
    return {primary};
  }
  function lessonDataPreview(ex){
    if(ex.showDatasetPreview===false)return '';
    const d=datasets[ex.dataset];if(!d)return '';
    const discovery=['clustering','pca'].includes(view?.card?.deck);
    const columns=discovery?d.columns.filter(c=>!['species','diagnosis'].includes(c)):d.columns;
    const rows=d.preview.map(row=>columns.map(c=>row[d.columns.indexOf(c)]));
    return `<section class="foundation-data-preview ml-inputs" aria-label="Dataframe preview">${table(columns,rows,`${ex.dataset} · ${d.preview.length===d.rows?'all rows':'first '+d.preview.length+' rows'}`)}</section>`;
  }
  function lessonPage(card,index){
    const ex=card.exercises[index],follow=card.kind==='teaching'&&index===0;
    const collection=collections.primary(card);
    const activityVisual={...(ex.visual||card.visual)};
    const visual=visualPresentation(activityVisual);
    const idea=follow?`<section class="teaching-overview"><h3>Understand the idea</h3><p class="teaching-summary">${esc(card.explanation)}</p>${visual.primary}</section>`:`<section class="teaching-overview"><h3>${esc(ex.milestone||ex.label)}</h3><p>${esc(ex.activityExplanation||ex.focusExplanation||ex.context||card.goal)}</p>${visual.primary}</section>`;
    return LearningLanguage.render(`<div class="ml-lesson"><nav class="foundation-breadcrumb" aria-label="Learning breadcrumb"><a href="#">Machine Learning</a><span>/</span><a href="#${card.deck}">${esc(C.decks.find(d=>d.id===card.deck).title)}</a>${collection?`<span>/</span><a href="#${collections.route(collection)}">${esc(collection.title)}</a>`:''}<span>/</span><span>${esc(card.id)}</span></nav><header class="foundation-lesson-heading"><div class="foundation-lesson-copy"><span class="foundation-eyebrow">${esc(card.chapter)} · ${esc(card.id)} · ${esc(card.minutes)} MIN</span><h2>${esc(card.title)}</h2>${follow?`<p>${esc(card.goal)}</p>`:''}${ex.kind==='python'?'<button class="foundation-editor-jump" type="button">Go to editor ↓</button>':''}</div>${FoundationLearning.stages(card.exercises,index)}</header><div class="foundation-split"><article class="foundation-content" data-code-context="guide" aria-label="Lesson content">${idea}${workflowSections(ex)}${ex.workflowSections?.length?'':syntaxSupport(card,ex)}${suppliedState(ex)}${ex.evidence?`<section class="ml-provided-evidence"><h3>Evidence to use</h3>${LearningLanguage.steps(ex.evidence,ex.id)}</section>`:''}${lessonDataPreview(ex)}${taskDescriptor(ex)}<section class="foundation-reference-content" data-code-context="guide" aria-label="Hints and solution">${help(ex)}</section></article>${ex.kind==='python'?pythonPane(ex):conceptPane(ex)}</div>${branchNavigation(card,index)}${navigation(card,index)}</div>`,ex.id);
  }
  function evidenceContract(ex){
    const outputs=ex.assessment?ex.contract:ex.learnerOutputs||ex.contract;
    const context=CodeIdentifiers.contextFor(LearningLanguage.context(ex.id),'guide');
    const nameMarkup=name=>{
      const names=name.split(/\s+\/\s+/);
      if(names.length>1&&names.every(n=>/^[A-Za-z_]\w*$/.test(n)&&context.variables?.includes(n)))return names.map(n=>`<code data-code-role="variable">${esc(n)}</code>`).join(' / ');
      return LearningLanguage.text('`'+name+'`',ex.id,true);
    };
    return outputs?.length?`<section class="ml-contract"><h3>Outputs you create</h3><dl class="ml-evidence-names">${outputs.map(c=>`<div><dt>${nameMarkup(c.name)}</dt><dd>${LearningLanguage.steps(c.description,ex.id)}</dd></div>`).join('')}</dl></section>`:'';
  }
  function workflowMap(ch){
    const discovery=['clustering','pca'].includes(view?.card?.deck)||['ML-X17','ML-X18','ML-X19'].includes(ch?.id);
    const introduction=discovery?'Use the ML → Workflow discovery route: define the observations and measurements, explore and prepare them, fit the grouping or representation, inspect its evidence and explain what the result can support. There is no prediction target or reserved final test in this workflow.':'Use the same data boundary as ML → Workflow: frame, split, explore, prepare, validate against a reference, diagnose, then make the final evaluation. Each step answers one question.';
    return `<section class="ml-workflow-map"><h3>The playground workflow</h3><p>${introduction}</p><ol>${ch.workflowSteps.map(step=>`<li><strong>${esc(step.title)}</strong><span>${esc(step.question)}</span></li>`).join('')}</ol></section>`;
  }
  function editorReference(ex){
    if(!ex.dictionary)return '';
    const terms=view?.card?.syntaxBreakdown?.slice(0,3)||[];
    const route=ex.id==='ML-U07-4'?'Choose measurements → compare raw and scaled geometry → build Ward hierarchies → inspect merge evidence.':ex.id==='ML-P02-4'?'Keep feature meanings and order → reuse the fitted scale → reuse PCA axes → compare incoming-row coordinates.':view?.card?.deck==='clustering'?'Choose measurements → sample → scale → build hierarchy → compare cuts → describe original-unit groups.':view?.card?.deck==='pca'?'Choose measurements → scale → fit PCA → inspect variance → retain dimensions → interpret weights.':'Frame → reserve final rows → compare dummy and candidate on training folds → diagnose → fit the fixed recipe → evaluate once.';
    return `<section class="ml-editor-reference" aria-label="Workflow reference beside your Python"><div class="ml-editor-reference-head"><strong>Keep beside your code</strong><button type="button" id="mlReviewLesson">Review lesson ↑</button></div><p>${esc(ex.question)}</p><div class="ml-editor-dictionary">${ex.dictionary.map(([name,meaning])=>`<div><code>${esc(name)}</code><span>${esc(meaning)}</span></div>`).join('')}</div>${terms.length?`<p class="ml-editor-terms">${terms.map(term=>`<span><code>${esc(term.code)}</code> ${esc(term.meaning)}</span>`).join('')}</p>`:''}<p class="ml-editor-route">${route}</p></section>`;
  }
  function taskDescriptor(ex){
    return `<div class="foundation-task-reminder" data-code-context="task" tabindex="0" role="region" aria-label="Current task"><strong>Your task${ex.depth==='deeper'?' · Deeper investigation':''}</strong>${LearningLanguage.activity({...ex,task:ex.task||view?.challenge?.question})}<div class="ml-output-names" aria-label="Requested output variables">${(ex.outputs||[]).map(name=>`<code>${esc(name)}</code>`).join('')}</div></div>`;
  }
  function pythonPane(ex){
    ex=view?.exercise||ex;
    const question=ex.interpretationQuestion||reflectionQuestions[ex.id];
    return `<section class="foundation-code-pane ml-code-pane" aria-label="Python practice"><div class="foundation-editor-head"><label for="mlEditor">YOUR PYTHON</label><div class="ml-editor-head-actions"><button type="button" id="mlBriefJump">Brief ↑</button><button type="button" id="jumpToWork">Jump to your work ↓</button></div></div><p class="foundation-editor-shortcuts" id="mlEditorHelp">Ctrl/⌘+Enter: Run · Tab: indent · Esc then Tab: leave editor</p><div class="foundation-editor-wrap"><div class="foundation-line-numbers" aria-hidden="true"></div><pre id="mlHighlight" aria-hidden="true"></pre><textarea id="mlEditor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-describedby="mlEditorHelp"></textarea></div><div class="foundation-actions"><button class="primary" id="mlRun" type="button">▶ Run code</button><button id="mlCheck" type="button">✓ Check answer</button><button id="mlReset" type="button">Reset code</button><button id="mlStop" type="button">Stop / restart</button></div><p class="foundation-runtime" id="mlStatus" role="status">Python loads when you run. Code and results stay in this activity only.</p><p class="foundation-feedback" id="mlFeedback" role="status"></p><div class="foundation-output ml-output" id="mlOutput" role="region" aria-label="Python output"><p class="ml-empty">Run your code to inspect its output. Check uses that same run.</p></div><div class="ml-output ml-results" id="mlResults" aria-live="polite"></div>${question?`<div class="ml-output"><label for="mlReflection">Your interpretation · self-review</label><p id="mlReflectionQuestion"><strong>${esc(question)}</strong></p><textarea class="ml-reflection" id="mlReflection" aria-describedby="mlReflectionQuestion mlReflectionHelp"></textarea><p class="ml-data-note" id="mlReflectionHelp">Use your Run output as evidence. This response is optional, not machine-graded or saved.</p></div>`:''}</section>`;
  }
  function conceptPane(ex){
    return `<section class="ml-choice foundation-code-pane" data-code-context="task" aria-label="Concept practice">${ex.kind==='decision'?`<fieldset><legend class="sr-only">${esc(ex.task)}</legend>${ex.options.map((option,i)=>`<label><input type="${ex.correct.length>1?'checkbox':'radio'}" name="mlChoice" value="${i}"><span>${esc(option)}</span></label>`).join('')}</fieldset>`:`<label for="mlExplain"><strong>Your explanation</strong></label><p>Use the evidence and state a limitation. This is self-review, not a keyword test.</p><textarea id="mlExplain" aria-label="Your explanation"></textarea>`}<button type="button" id="mlConceptCheck">${ex.kind==='decision'?'Check reasoning':'Show self-review guidance'}</button><div id="mlConceptResult" role="status" class="ml-results"></div></section>`;
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
      const response=await bridge.send('run',{config:{indexURL:AppPlatform.pyodideIndexUrl,seaborn:AppPlatform.seabornRequirement,...MLLearningRuntime},files,request:{exercise,code:submitted}});
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
    function paint(){highlight.innerHTML=FoundationLearning.changedCode(editor.value,editor.value===ex.starter?ex.workflowDifference?.changedLines:[])+'\n';numbers.textContent=editor.value.split('\n').map((_,i)=>i+1).join('\n');syncScroll();}
    editor.addEventListener('input',paint);editor.addEventListener('scroll',syncScroll);paint();
    function focusWork(focus=false){
      const marker=editor.value.indexOf('# Your work\n'),position=marker>=0?marker+'# Your work\n'.length:0;
      if(focus)editor.focus({preventScroll:true});editor.setSelectionRange(position,position);
      editor.scrollTop=Math.max(0,(editor.value.slice(0,position).split('\n').length-3)*parseFloat(getComputedStyle(editor).lineHeight));syncScroll();
    }
    editor.closest('.foundation-editor-wrap').style.setProperty('--editor-lines',Math.min(14,Math.max(8,ex.starter.split('\n').length)));
    focusWork();
    document.getElementById('jumpToWork').onclick=()=>focusWork(true);
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
  function challengePage(challenge,deck){
    view={challenge,exercise:challenge.exercise};
    return challengeExperience.page(challenge,deck,{table,pythonPane,taskDescriptor:()=>taskDescriptor(view.exercise)+evidenceContract(view.exercise),curriculum:{lessons:C.cards}});
  }
  function render(){
    generation++;clearResources();
    if(busy){bridge?.restart();busy=false;}
    view=null;
    const currentRoute=LearningRoutes.route('ml',location,document.body);
    const [deckId,id,position]=currentRoute.split('/');
    const deck=C.decks.find(d=>d.id===deckId),card=byId.get(id);
    const collection=deckId==='collections'?collections.get(id):null;
    receipts.enter(null);
    document.body.dataset.deck=collection?.deck||deckId||'';
    main.classList.add('ml-learning');
    if(collection)main.innerHTML=collectionPage(collection);
    else if(deckId==='workflows'){
      const challenge=C.challenges.find(c=>c.id===position);
      if(id==='challenges'&&challenge){
        receipts.enter(challenge.exercise.id);
        main.innerHTML=challengePage(challenge,{id:'workflows',title:'Machine Learning'});
        challengeExperience.bind();
      }else main.innerHTML=challengeExperience.collection({id:'workflows',title:'Machine Learning'});
    }else if(card&&deck&&card.deck===deckId){
      const index=Math.max(0,Math.min(/^\d+$/.test(position||'0')?Number(position||0):0,card.exercises.length-1));
      view={card,index,exercise:card.exercises[index]};receipts.enter(view.exercise.id);
      main.innerHTML=lessonPage(card,index);
    }else main.innerHTML=deck?deckPage(deck):landing();
    document.title=(view?.card?.title||view?.challenge?.title||collection?.title||deck?.title||'Machine Learning')+' · Learn / Refresh';
    FoundationLearning.highlightContent(main,LearningLanguage.context(view?.challenge?.id||view?.exercise?.id));
    MLLearningVisuals.mount?.(main);
    const exit=document.querySelector('.back-playground');
    const selected=view?.card?collections.selected(view.card,location.search):null;
    exit.href=selected?'#'+collections.route(selected):view?.challenge?'#workflows/challenges':view?.card?'#'+view.card.deck:deck||collection||deckId==='workflows'?'#':'learn.html';
    exit.textContent=selected?'← '+selected.title+' lessons':view?.challenge?'← All challenges':view?.card?'← '+deck.title+' lessons':collection?'← Choose a model deck':deck||deckId==='workflows'?'← Choose a deck':'← Learn / Refresh';
    LearningRoutes.enhance('ml',main);LearningRoutes.canonical('ml',currentRoute);
    bind();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
    FoundationLearning.bindPanels?.(main);
    if(deck&&id==='chapter'){const chapter=document.getElementById('chapter-'+position);chapter?.focus({preventScroll:true});chapter?.scrollIntoView({block:'start'});}
  }
  // The static build renders through these same functions, without Python or DOM bindings.
  if(window.DataPlaygroundPrerender){window.DataPlaygroundPrerender={curriculum:C,challenges:C.challenges,collections:C.collections,landing,deckPage,collectionPage,challengePage,challengeCollection:challengeExperience.collection,lessonPage:(card,index)=>{view={card,index,exercise:card.exercises[index]};return lessonPage(card,index);}};return;}
  document.getElementById('themeButton').addEventListener('click',()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light'));
  window.addEventListener('pagehide',clearResources);
  // Inspectable content/read-only state for real-browser audits; no persistence API.
  window.MLLearning={curriculum:C,datasets,get activity(){return view?.exercise;},get retainedReceipts(){return receipts.retainedReceipts;}};
  LearningRoutes.installRouter('ml',C,render);
})();
