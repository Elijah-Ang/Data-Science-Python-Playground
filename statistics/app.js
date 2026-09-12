/* Question-first configuration, progressive notebook state, canonical Playground UI. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=new URL('./',location.href),assets=new URL('./statistics/',root);
  const labels={reference:'Average vs target? (t / z / bootstrap)',independent:'Do two groups differ? (t-test / ranks)',paired:'Before vs after? (Paired t / Wilcoxon)',groups:'Do several groups differ? (ANOVA / ranks)',factorial:'Do factors work together? (Factorial ANOVA)',categorical:'Are categories linked? (χ² / Fisher)',association:'Do two measures move together? (Correlation)',proportions:'Do percentages differ? (Proportion tests)',goodness:'Do category shares match? (χ² fit / exact)'};
  const mobileLayoutQuery=matchMedia('(max-width:1120px)');
  const short={frame:'State the question',select:'Choose observations',assumptions:'Read the diagnostics',analysis:'Test the question',uncertainty:'Measure size & precision',followup:'Compare carefully',conclude:'Explain what it means'};
  const escape=value=>String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const fmt=value=>value==null?'Undefined':typeof value==='number'?(value===0?'0':Math.abs(value)<.001?value.toExponential(4):Number(value.toPrecision(6)).toLocaleString('en-US',{maximumFractionDigits:6})):Array.isArray(value)?value.map(fmt).join(' to '):String(value);
  const highlight=code=>code.split('\n').map(line=>(line.match(/#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:import|from|as|if|else|for|in|def|return|True|False|None|and|or)\b|[^#"'\w]+|\w+|./g)||[]).map(t=>`<span class="${t[0]==='#'?'py-comment':/^['"]/.test(t)?'py-string':/^(import|from|as|if|else|for|in|def|return|True|False|None|and|or)$/.test(t)?'py-keyword':''}">${escape(t)}</span>`).join('')).join('\n');
  let domain,meta,bridge,plan=null,csv='',cells=[],config={family:'independent',dataset:'penguins'},revision=0,busy=false,configuring=true,timer;
  const cache=new Map();
  const table=rows=>{
    if(!rows?.length)return '';
    const keys=[...new Set(rows.flatMap(Object.keys))];
    return `<div class="result-table-wrap" tabindex="0" aria-label="Scrollable evidence"><table class="result-table"><thead><tr>${keys.map(k=>`<th scope="col">${escape(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${escape(fmt(r[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  function field(id,label,options,selected){return `<div class="study-field"><label for="${id}">${escape(label)}</label><select id="${id}">${options.map(o=>{const [v,t,disabled]=Array.isArray(o)?o:[o,o];return `<option ${disabled?'disabled':''} value="${escape(v)}" ${String(v)===String(selected)?'selected':''}>${escape(t)}</option>`;}).join('')}</select></div>`;}
  function input(id,label,value){return `<div class="study-field"><label for="${id}">${escape(label)}</label><input id="${id}" type="number" step="any" value="${escape(value)}"></div>`;}
  function check(id,label,checked,note){return `<div class="study-field"><label class="check-label"><input id="${id}" type="checkbox" ${checked?'checked':''}>${escape(label)}</label><p>${escape(note)}</p></div>`;}
  const categoryValues=column=>domain.categories[config.dataset][column]||[];
  function studyOpen(open){$('studyPanel').hidden=!open;$('studyButton').setAttribute('aria-expanded',String(open));}
  function renderChoices(){
    const f=config.family;
    const available=domain.families[f];
    if(!available.includes(config.dataset))config.dataset=available[0];
    $('familySelect').innerHTML=Object.entries(labels).map(([k,v])=>`<option value="${k}" ${k===f?'selected':''}>${v}</option>`).join('');
    $('datasetSelect').innerHTML=available.map(k=>`<option value="${k}" ${k===config.dataset?'selected':''}>${meta.sources[k].name}</option>`).join('');
    document.body.dataset.dataset=config.dataset;
    const nums=domain.numeric[config.dataset],cats=domain.categorical[config.dataset];let html='';
    if(f==='goodness'){
      config.outcome??=cats[0];config.expected_mode??='equal';
      html+=field('outcome','Which categories are being counted?',cats,config.outcome);
      html+=field('expected_mode','Expected shares chosen beforehand',domain.expectedModes.map(v=>[v,v==='equal'?'Equal shares (illustrative null)':'Enter prespecified shares']),config.expected_mode);
      const categories=categoryValues(config.outcome);config.expected??=categories.map(()=>1/categories.length);
      if(config.expected_mode==='specified')categories.forEach((v,i)=>html+=input('expected'+i,`Expected share · ${v}`,config.expected[i]));
      html+='<p class="inspector-note">Shares must add to 1. Use a hypothesis chosen before viewing the counts; equal shares are a teaching example.</p>';
    }else if(f==='proportions'){
      config.structure??='one';config.outcome??=config.dataset==='candy'?'chocolate':'sex';config.success??=categoryValues(config.outcome)[0];
      html+=field('structure','Question structure',domain.structures.map(v=>[v,v==='one'?'One proportion vs reference':'Two independent proportions']),config.structure);
      html+=field('outcome','Which categorical outcome?',cats,config.outcome)+field('success','Which category counts as success?',categoryValues(config.outcome),config.success);
      if(config.structure==='one'){config.reference??=.5;html+=input('reference','Reference proportion (0–1)',config.reference);}
      else{
        config.group??=config.dataset==='candy'?'fruity':'species';if(config.group===config.outcome)config.group=cats.find(v=>v!==config.outcome);config.levels??=categoryValues(config.group).slice(0,2);
        html+=field('group','Independent grouping variable',cats.filter(x=>x!==config.outcome),config.group)+field('levelA','Group A',categoryValues(config.group),config.levels[0])+field('levelB','Group B',categoryValues(config.group).map(v=>[v,v,v===config.levels[0]]),config.levels[1]);
      }
    }else if(f==='categorical'){
      config.x??=cats[0];config.y??=cats[1];if(config.x===config.y)config.y=cats.find(v=>v!==config.x);html+=field('x','First categorical variable',cats,config.x)+field('y','Second categorical variable',cats.map(v=>[v,v,v===config.x]),config.y);
    }else{
      config.y??=nums[0];html+=field('y','Numeric outcome',nums,config.y);
      if(f==='association'){config.x??=nums.at(-1);if(config.x===config.y)config.x=nums.find(v=>v!==config.y);html+=field('x','Other numeric variable',nums.map(v=>[v,v,v===config.y]),config.x);}
    }
    if(['independent','groups'].includes(f)){
      const opts=f==='groups'?domain.groupChoices:cats;config.group??=opts[0];html+=field('group','Grouping variable',opts,config.group);
      if(f==='independent'){config.levels??=categoryValues(config.group).slice(0,2);html+=field('levelA','Group A',categoryValues(config.group),config.levels[0])+field('levelB','Group B',categoryValues(config.group).map(v=>[v,v,v===config.levels[0]]),config.levels[1]);}
    }
    if(f==='paired'){
      config.before??=1952;config.after??=2007;const years=domain.years;if(config.after<=config.before)config.after=years.find(v=>v>config.before);
      html+=field('before','First year · earlier',years.slice(0,-1),config.before)+field('after','Second year · later',years.map(v=>[v,v,v<=config.before]),config.after);
    }
    if(f==='factorial'){
      config.factors??=['species','sex'];html+=field('factorCount','Number of factors',domain.factorCounts.map(v=>[v,v===2?'Two factors · standard':'Three factors · Advanced']),config.factors.length);
      config.factors.forEach((v,i)=>html+=field('factor'+i,`Factor ${i+1}${i===0?' · compare within context':''}`,cats.map(candidate=>{const fs=config.factors.map((old,j)=>j===i?candidate:old);const ok=domain.validFactors[config.y].some(valid=>valid.join('|')===fs.join('|'));return [candidate,candidate+(ok?'':' · unavailable'),!ok];}),v));
      const orders=domain.validFactors[config.y].filter(fs=>fs.length===config.factors.length&&[...fs].sort().join('|')===[...config.factors].sort().join('|'));
      html+=field('factorOrder','Comparison order',orders.map(fs=>[fs.join('|'),fs.join(' → ')]),config.factors.join('|'));
      html+='<p class="inspector-note">Unavailable factors repeat a factor or create empty, confounded or under-replicated cells in these data. The first factor sets the simple-comparison question.</p>';
    }
    if(!['factorial','categorical','proportions','goodness'].includes(f)){
      config.goal??='mean';const goals=f==='association'?[['mean','Linear association'],['rank','Monotonic association (ranks)']]:[['mean','Compare averages (means)'],...(f==='reference'?[['estimate','Estimate the mean (bootstrap)']]:[['rank','Compare distributions (ranks)']])];html+=field('goal','What aspect matters?',goals.filter(([v])=>domain.goals[f].includes(v)),config.goal);
    }
    if(['independent','groups'].includes(f)&&config.goal!=='rank')html+=check('equalVariance','A common population variance is justified',config.equal_variance,'Leave unchecked for Welch. A nonsignificant diagnostic alone does not justify pooling variances.');
    if(f==='reference'){
      config.reference??=config.dataset==='penguins'?4000:50;html+=input('reference','Reference value chosen beforehand',config.reference);
      if(config.goal!=='estimate'){
        html+=check('knownSigma','Population SD is independently known',config.known_sigma,'The sample SD is not a known population SD.');
        if(config.known_sigma)html+=input('sigma','Known population SD',config.sigma??800);
      }
    }
    $('variables').innerHTML=html;
    $('variables').querySelectorAll('select,input').forEach(control=>control.addEventListener('change',()=>{
      const id=control.id,v=control.value;
      if(id.startsWith('expected')&&id!=='expected_mode')config.expected[Number(id.slice(8))]=Number(v);
      else if(id==='equalVariance')config.equal_variance=control.checked;
      else if(id==='knownSigma'){config.known_sigma=control.checked;if(control.checked)config.sigma=800;else delete config.sigma;}
      else if(id==='levelA'||id==='levelB')config.levels[id==='levelA'?0:1]=v;
      else if(id==='factorOrder')config.factors=v.split('|');
      else if(id==='factorCount')config.factors=v==='3'?['species','sex','year']:['species','sex'];
      else if(id.startsWith('factor'))config.factors[Number(id.slice(-1))]=v;
      else config[id]=['reference','sigma','before','after'].includes(id)?Number(v):v;
      if(id==='group')delete config.levels;
      if(id==='levelA'&&config.levels[0]===config.levels[1])config.levels[1]=categoryValues(config.group).find(x=>x!==v);
      if(id==='outcome'){delete config.expected;delete config.success;if(config.group===v)delete config.group;delete config.levels;}
      renderChoices();schedule();
    }));
  }
  function updateActions(){
    $('runAllButton').disabled=!plan||busy||configuring;
    $('downloadNotebook').disabled=!plan||busy;
    $('downloadData').disabled=!plan;
    $('taskProgress').textContent=`${cells.filter(c=>c.status==='done').length} / ${plan?plan.route.filter((_,i)=>!isSkipped(i)).length:0} steps run`;
  }
  function invalidStudy(){revision++;plan=null;cells=[];configuring=true;$('error').hidden=true;$('routeStrip').replaceChildren();$('preview').replaceChildren();$('methodName').textContent='Updating study…';$('methodNote').textContent='';renderNotebook();updateActions();return revision;}
  function errorText(error){const s=String(error.message||error);return s.match(/(?:ValueError|NameError|SyntaxError|TypeError): ([^\n]+)/)?.[0]||s;}
  function showError(error){$('error').textContent=errorText(error);$('error').hidden=false;}
  function schedule(){const token=invalidStudy();clearTimeout(timer);timer=setTimeout(()=>configure(token),90);}
  async function configure(token=revision){
    try{
      const c={...config,confidence:Number($('confidence').value)};
      if(!cache.has(c.dataset)){const r=await fetch(new URL('data/'+meta.sources[c.dataset].file,root));if(!r.ok)throw Error('Teaching dataset could not be loaded.');cache.set(c.dataset,await r.text());}
      const data=cache.get(c.dataset);if(token!==revision)return;
      const response=await bridge.send('configure',{csv:data,config:c});if(token!==revision)return;
      csv=data;plan=response.plan;configuring=false;renderInspector();renderRoute();renderNotebook();updateActions();
    }catch(error){if(token===revision){configuring=false;showError(error);$('methodName').textContent='Review this design';updateActions();}}
  }
  function renderInspector(){
    const c=plan.config,d=window.DatasetDictionary['data/'+plan.source.file];
    $('datasetName').textContent=plan.source.name;$('datasetDescription').textContent=`One row represents one ${plan.source.unit}${c.family==='paired'?' at a recorded year':''}.`;
    $('datasetQuestion').textContent=plan.hypotheses.question;
    $('problemTags').innerHTML=[c.family==='paired'?'Matched by country':'Independent units',c.family==='factorial'&&c.factors.length===3?'Advanced · three factors':labels[c.family],`${c.omitted} incomplete omitted`].map(x=>`<span class="tag">${escape(x)}</span>`).join('');
    $('rowMetric').textContent=c.n;$('confidenceMetric').textContent=`${c.confidence*100}%`;
    const rows=[['Outcome',c.outcome||c.y],...(c.x?[['Other variable',c.x]]:[]),...(c.group?[['Grouping',c.group]]:[]),...(c.labels?.length?[['Groups / order',c.labels.join(' → ')]]:[]),...(c.factors?[['Factors',c.factors.join(' × ')]]:[]),...(c.reference!=null?[['Reference',c.reference]]:[]),...(c.success?[['Success',c.success]]:[])];
    $('featureList').innerHTML=rows.map(([k,v])=>`<div class="feature-row"><b>${escape(k)}</b><span>${escape(v)}</span></div>`).join('');
    $('methodName').textContent=plan.name;$('methodNote').textContent=plan.explanation.split('. ')[0]+'.';$('preview').innerHTML=table(plan.preview);
    $('sourceLink').href=d.source;$('sourceLink').textContent=plan.source.name;$('sourceNote').textContent=({penguins:'Observed penguins; sampling context may confound comparisons. Complete-case teaching extract.',candy:'Product-level rankings share a voting process. Ingredient comparisons are observational.',gapminder:'Historical country aggregates, paired by identity; shared regional trends can limit independence.'})[c.dataset];
  }
  function isSkipped(i){
    if(!plan||plan.route[i]?.id!=='followup'||!['anova','welch_anova','kruskal'].includes(plan.method))return false;
    const analysis=cells.find(c=>plan.route[c.index].id==='analysis'&&c.status==='done');
    return analysis?.output?.scalars.p_value>=plan.config.alpha;
  }
  const stepNumber=i=>plan.route.slice(0,i+1).filter((_,j)=>!isSkipped(j)).length;
  function allowed(i){return Boolean(plan)&&!configuring&&plan.route.slice(0,i).every((_,j)=>isSkipped(j)||cells.find(c=>c.index===j)?.status==='done');}
  function renderRoute(){
    if(!plan)return;
    $('routeStrip').innerHTML=plan.route.map((s,i)=>{if(isSkipped(i))return '';const c=cells.find(c=>c.index===i),state=c?.status||'ready';return `<button class="route-card" data-index="${i}" data-task-id="${s.id}" data-state="${state}" ${!allowed(i)||busy?'disabled':''} title="${escape(allowed(i)?'Add and run this step':'Complete the preceding step first')}"><span class="route-number">${String(stepNumber(i)).padStart(2,'0')}</span><span><span class="route-title">${escape(s.label)}</span><span class="route-caption">${short[s.id]}</span></span><span class="route-arrow">${state==='done'?'✓':state==='stale'?'↻':'→'}</span></button>`;}).join('');
    $('routeStrip').querySelectorAll('button').forEach(button=>button.onclick=async()=>{const cell=insertCell(Number(button.dataset.index),true);if(cell)await runCell(cell);});updateActions();
  }
  function insertCell(index,scroll=false){
    if(!allowed(index)||busy)return null;
    let cell=cells.find(c=>c.index===index);
    if(!cell){const s=plan.route[index];cell={index,code:s.code,advanced:s.advanced||'',status:'ready',output:null,error:null};cells.push(cell);cells.sort((a,b)=>a.index-b.index);renderNotebook();renderRoute();}
    if(scroll)document.querySelector(`[data-cell-index="${index}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'});
    return cell;
  }
  function invalidateFrom(index){
    revision++;
    for(const c of cells.filter(c=>c.index>=index)){
      c.status=c.status==='ready'?'ready':'stale';c.output=null;c.error=null;
      const stack=document.querySelector(`[data-cell-index="${c.index}"]`);
      if(stack){stack.classList.remove('has-output');stack.querySelector('.cell').dataset.status=c.status;stack.querySelector('.cell-inline-output').replaceChildren();stack.querySelector('.cell-status').textContent=c.status==='stale'?'Edited / upstream changed · rerun this step':'Ready';}
    }
    renderOutputs();renderRoute();refreshRunButtons();
  }
  function refreshRunButtons(){document.querySelectorAll('[data-run]').forEach(b=>b.disabled=busy||!allowed(Number(b.dataset.run)));}
  function editor(cell,advanced=false){
    const host=document.createElement('div');host.className='code-editor';
    const rail=document.createElement('div');rail.className='line-rail';const pre=document.createElement('pre');pre.className='code-highlight';pre.setAttribute('aria-hidden','true');
    const text=document.createElement('textarea');text.className='code-input';text.spellcheck=false;text.value=advanced?cell.advanced:cell.code;text.readOnly=busy;
    text.setAttribute('aria-label',`Editable ${advanced?'advanced ':''}Python for ${plan.route[cell.index].title}`);
    function sync(){rail.textContent=text.value.split('\n').map((_,i)=>i+1).join('\n');pre.innerHTML=highlight(text.value);text.style.height=Math.min(430,Math.max(76,text.value.split('\n').length*19+24))+'px';pre.style.height=text.style.height;host.classList.toggle('has-highlight',document.activeElement!==text);}
    text.onfocus=()=>host.classList.remove('has-highlight');text.onblur=sync;text.onscroll=()=>{pre.style.transform=`translate(${-text.scrollLeft}px, ${-text.scrollTop}px)`;rail.style.transform=`translateY(${-text.scrollTop}px)`;};
    text.oninput=()=>{if(advanced)cell.advanced=text.value;else cell.code=text.value;invalidateFrom(cell.index);sync();};
    text.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCell(cell);}if(e.key==='Tab'){e.preventDefault();text.setRangeText('    ',text.selectionStart,text.selectionEnd,'end');text.dispatchEvent(new Event('input'));}};
    host.append(rail,pre,text);sync();return host;
  }
  function renderNotebook(){
    const panel=$('notebookPanel'),scrollTop=panel.scrollTop;panel.replaceChildren();
    if(!cells.length){panel.innerHTML='<div class="empty-notebook"><div><strong>Start with your question.</strong><p>Click <b>01 Frame</b> in Suggested Route to insert one editable cell. It runs automatically and unlocks the next step. On desktop, results appear in the Output panel; on smaller screens, below each cell.</p></div></div>';renderOutputs();return;}
    for(const c of cells){
      if(isSkipped(c.index))continue;
      const s=plan.route[c.index],stack=document.createElement('div');stack.className='cell-stack';stack.dataset.cellIndex=c.index;
      const article=document.createElement('article');article.className='cell';article.dataset.status=c.status;
      article.innerHTML=`<div class="cell-head"><span class="cell-number">[${stepNumber(c.index)}]</span><span class="cell-label">${escape(s.title)}</span><span class="cell-stage">${escape(s.label)}</span><span class="cell-spacer"></span><button class="cell-action run" data-run="${c.index}" ${busy||!allowed(c.index)?'disabled':''}>▶ Run</button></div><div class="teaching-block"><p class="teaching-line teaching-question"><span class="teaching-label">QUESTION</span><span>${escape(plan.hypotheses.question)}</span></p><p class="teaching-line teaching-cue"><span class="teaching-label">WHY</span><span>${escape(s.explanation)}</span></p></div>`;
      article.querySelector('[data-run]').onclick=()=>runCell(c);
      if(s.advanced){const advanced=document.createElement('details');advanced.className='advanced-calculation';advanced.innerHTML=`<summary>Advanced · ${escape(s.advanced_label)}</summary><p>This exact calculation runs before the main code below. It uses your current model and retains all multiplicity corrections.</p>`;advanced.append(editor(c,true));article.append(advanced);}
      article.append(editor(c));
      const foot=document.createElement('div');foot.className='cell-footer';foot.innerHTML=`<span class="cell-status" role="status">${c.status==='done'?'Complete':c.status==='running'?'Running…':c.status==='stale'?'Edited / upstream changed · rerun':c.status==='error'?'Error · fix code and rerun':'Ready'}</span><span>Python · Ctrl / ⌘ Enter to run</span>`;article.append(foot);
      const output=document.createElement('div');output.className='cell-inline-output';output.dataset.inlineFor=s.id;
      stack.append(article,output);panel.append(stack);
    }
    panel.scrollTop=scrollTop;renderOutputs();
  }
  function renderOutputs(){
    const body=$('outputBody'),list=$('outputList'),position=body.scrollTop;
    list.replaceChildren();
    document.querySelectorAll('.cell-inline-output').forEach(host=>{host.replaceChildren();host.closest('.cell-stack').classList.remove('has-output');});
    const completed=cells.filter(c=>(c.output||c.error)&&!isSkipped(c.index));
    $('outputConfidence').textContent=plan?`${plan.config.confidence*100}%`:'—';
    $('outputAlpha').textContent=plan?fmt(plan.config.alpha):'—';
    const running=cells.find(c=>c.status==='running'),last=completed.at(-1);
    $('outputStatus').textContent=running?`${plan.route[running.index].label} · running…`:last?`${plan.route[last.index].label} · ${last.error?'error':'ready'}`:'No cell run yet';
    $('downloadChartButton').disabled=!cells.some(c=>c.output?.figures?.length);
    if(!completed.length){list.innerHTML='<div class="output-empty"><div><div class="output-glyph">↗</div><b>Pick a step to begin.</b><p>Results collect here in cell order. Output scrolls independently from the notebook.</p></div></div>';return;}
    for(const c of completed){
      const step=plan.route[c.index];
      const host=mobileLayoutQuery.matches?document.querySelector(`[data-cell-index="${c.index}"] .cell-inline-output`):list;
      const item=document.createElement('div');item.dataset.outputFor=step.id;
      item.innerHTML=c.error?`<div class="output-item" data-status="error"><div class="output-item-head"><strong>Output · ${escape(step.title)}</strong><span>Error</span></div><pre class="console-output error">${escape(c.error)}</pre><p class="output-caveat">The last successful state is preserved. Fix this cell and rerun; downstream steps remain locked.</p></div>`:renderOutput(c.output,step);
      const evidence=item.firstElementChild;evidence.dataset.outputFor=step.id;host.append(evidence);if(mobileLayoutQuery.matches)host.closest('.cell-stack').classList.add('has-output');
    }
    body.scrollTop=position;
  }
  function renderOutput(o,s){
    const m=plan.method;
    const effects={one_t:'Cohen d',welch:'Cohen d · pooled SD',student:'Cohen d · pooled SD',paired_t:'Cohen d · SD of differences',one_z:'Difference / population SD',bootstrap:'Mean − reference',mannwhitney:'Rank-biserial effect',wilcoxon:'Matched rank-biserial effect',anova:'Descriptive eta-squared',welch_anova:'Descriptive eta-squared',kruskal:'Rank epsilon-squared',chi2:'Cramér V',fisher:'Cramér V',pearson:'Pearson r',spearman:'Spearman rho',gof_chi2:'Cohen w · descriptive departure',gof_exact:'Cohen w · descriptive departure'};
    const target=m.startsWith('prop_one')?'population proportion':m.startsWith('prop_two')?'proportion difference A − B':m==='bootstrap'?'population mean':['pearson','spearman'].includes(m)?'correlation':['mannwhitney','wilcoxon'].includes(m)?'rank effect':['chi2','fisher'].includes(m)?'conditional odds ratio':'mean difference';
    const name={p_value:'p-value',statistic:'Test statistic',estimate:target,effect_size:effects[m]||(m.startsWith('prop_')?'Proportion difference':'Effect size'),interval:`${plan.config.confidence*100}% CI · ${target}`,exact_odds_interval:'Exact odds-ratio interval'};
    let content=`<div class="output-item"><div class="output-number">${stepNumber(plan.route.findIndex(step=>step.id===s.id))}</div><div class="output-item-head"><strong>Output · ${escape(s.title)}</strong><span>${o.seconds}s · ${o.edited?'edited Python':'complete'}</span></div>`;
    const scalarEntries=Object.entries(o.scalars||{});if(scalarEntries.length)content+=`<div class="statistics-evidence">${scalarEntries.map(([k,v])=>`<div class="metric"><b>${escape(fmt(v))}</b><span>${name[k]||escape(k)}</span></div>`).join('')}</div>`;
    if(o.stdout){const pre=`<pre class="console-output">${escape(o.stdout)}</pre>`;content+=scalarEntries.length||Object.keys(o.tables||{}).length?`<details><summary>Printed Python output</summary>${pre}</details>`:pre;}
    if(o.sizes&&Object.keys(o.sizes).length)content+=`<p class="result-note">Actual selected sample sizes: ${Object.entries(o.sizes).map(([k,v])=>`${escape(k)} = ${v}`).join(' · ')}</p>`;
    for(const [key,rows] of Object.entries(o.tables||{}))content+=`<h4 class="output-title">${escape(key.replaceAll('_',' '))}</h4>${table(rows)}`;
    content+=(o.figures||[]).map(f=>`<figure class="chart-wrap"><img src="${f.src}" alt="${escape(f.title)}"><figcaption><strong>${escape(f.title)}</strong> · ${escape(f.caption)}</figcaption></figure>`).join('');
    if(s.id==='uncertainty'&&plan.route.some((_,i)=>isSkipped(i)))content+='<p class="output-caveat">The omnibus result did not meet the chosen α. Post-hoc comparisons are not opened; continue to your conclusion. This does not establish equality.</p>';
    content+=`<p class="output-cue"><strong>What to look for:</strong> ${escape(o.cue)}</p>`;
    if(o.interpretation)content+=`<p class="output-cue"><strong>Interpretation:</strong> ${escape(o.interpretation)}</p>`;
    if(o.edited&&s.id!=='conclude')content+='<p class="output-caveat">Your code differs from the suggested recipe. This evidence is from your actual execution; check that its method and units still answer the configured question.</p>';
    if(o.caveat)content+=`<p class="output-caveat">${escape(o.caveat)}</p>`;
    if(o.warnings?.length)content+=`<details><summary>Numerical cautions</summary><p class="output-caveat">${o.warnings.map(escape).join('<br>')}</p></details>`;
    return content+'</div>';
  }
  async function runCell(cell){
    if(busy||!allowed(cell.index)||!cell.code.trim())return false;
    invalidateFrom(cell.index);const token=revision;busy=true;cell.status='running';renderNotebook();renderRoute();updateActions();
    try{
      const response=await bridge.send('cell',{index:cell.index,code:cell.code,advanced:cell.advanced});
      if(token!==revision)return false;
      cell.output=response.output;cell.status='done';cell.error=null;return true;
    }catch(error){if(token===revision){cell.error=errorText(error);cell.status='error';}return false;}
    finally{busy=false;if(token===revision){renderNotebook();renderRoute();if(!mobileLayoutQuery.matches)$('outputBody').scrollTop=$('outputBody').scrollHeight;}updateActions();}
  }
  async function runAll(){
    if(busy||!plan)return;const originalPlan=plan;
    for(let i=0;i<originalPlan.route.length;i++){
      if(plan!==originalPlan)return;
      if(isSkipped(i))continue;
      let c=cells.find(c=>c.index===i);if(c?.status==='done')continue;
      c=insertCell(i);if(!c||!await runCell(c))return;
    }
  }
  function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportNotebook(){
    const out=[],md=s=>out.push({cell_type:'markdown',metadata:{},source:[s]}),code=s=>out.push({cell_type:'code',execution_count:null,metadata:{},outputs:[],source:[s+'\n']});
    md(`# Statistics Playground\n\n${plan.hypotheses.question}\n\n${$('questionNote').value}\n\n${plan.source.note}\n\nPlace the downloaded ${plan.source.file} beside this notebook. Python dependencies: numpy, pandas, scipy, statsmodels, matplotlib.`);
    code(`import pandas as pd\ndf = pd.read_csv(${JSON.stringify(plan.source.file)})`);
    for(let i=0;i<plan.route.length;i++){if(isSkipped(i))continue;const s=plan.route[i],c=cells.find(c=>c.index===i);md(`## ${s.title}\n\n${s.explanation}`);if(c?.advanced||s.advanced){md('### Advanced prerequisite\n\n'+s.advanced_label+' — this creates the variables used by the next cell.');code(c?.advanced??s.advanced);}code(c?.code??s.code);}
    md('Interpret p-values alongside uncertainty and practical importance. Changing a question or method after seeing results is exploratory.');
    return JSON.stringify({nbformat:4,nbformat_minor:5,metadata:{kernelspec:{name:'python3',display_name:'Python 3',language:'python'},statistics_config:plan.config},cells:out.map((c,i)=>({...c,id:'statistics-'+i}))},null,2);
  }
  async function reset(restart=false){
    const token=invalidStudy();clearTimeout(timer);busy=false;
    try{if(restart){bridge.restart();$('runtimeDot').className='runtime-dot';const r=await bridge.send('init');meta=r.metadata;}await configure(token);}catch(e){showError(e);}updateActions();
  }
  function showGuide(){
    if(!plan)return;$('guideBody').innerHTML=plan.route.map((s,i)=>`<article><h3>${String(i+1).padStart(2,'0')} · ${escape(s.title)}</h3><p>${escape(s.explanation)}</p></article>`).join('');$('guideWindow').showModal();$('guideButton').setAttribute('aria-expanded','true');
  }
  async function start(){
    try{
      domain=await (await fetch(new URL('controls.json',assets))).json();
      const names=['engine.py','proportions.py','notebook.py','worker.js'];const responses=await Promise.all(names.map(n=>fetch(new URL(n,assets))));if(responses.some(r=>!r.ok))throw Error('Statistics assets could not load. Refresh the page or check your connection.');
      const [engine,proportions,notebook,worker]=await Promise.all(responses.map(r=>r.text()));
      const source=`const RUNTIME=${JSON.stringify(window.AppPlatform?.pyodideIndexUrl || 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/')};const ENGINE=${JSON.stringify(engine)};const PROPORTIONS=${JSON.stringify(proportions)};const NOTEBOOK=${JSON.stringify(notebook)};\n${worker}`;
      bridge=window.createPythonBridge(source,{onStatus:data=>{$('runtimeStatus').textContent=data.message;$('runtimeDot').className='runtime-dot'+(data.message.includes('ready')?' ready':'');},onError:error=>{$('runtimeDot').className='runtime-dot error';showError(error);}});
      meta=(await bridge.send('init')).metadata;renderChoices();await configure();
    }catch(e){showError(e);$('runtimeStatus').textContent='Python could not start';$('runtimeDot').className='runtime-dot error';}
  }
  $('familySelect').onchange=()=>{config={family:$('familySelect').value,dataset:config.dataset};renderChoices();studyOpen(true);schedule();};
  $('datasetSelect').onchange=()=>{config={family:config.family,dataset:$('datasetSelect').value};renderChoices();schedule();};
  $('confidence').onchange=schedule;$('studyButton').onclick=()=>studyOpen($('studyPanel').hidden);$('applyStudy').onclick=()=>studyOpen(false);
  $('runAllButton').onclick=runAll;$('resetButton').onclick=()=>reset();$('restartPythonButton').onclick=()=>reset(true);
  $('downloadNotebook').onclick=()=>download('statistics-'+plan.method+'.ipynb',exportNotebook(),'application/x-ipynb+json');$('downloadData').onclick=()=>download(plan.source.file,csv,'text/csv');
  mobileLayoutQuery.addEventListener('change',renderOutputs);
  $('downloadChartButton').onclick=()=>{const figure=cells.flatMap(c=>c.output?.figures||[]).at(-1);if(figure){const a=document.createElement('a');a.href=figure.src;a.download='statistics-chart.png';a.click();}};
  $('themeButton').onclick=()=>window.AppAppearance.apply(document.body.dataset.theme==='dark'?'light':'dark');$('guideButton').onclick=showGuide;$('guideClose').onclick=()=>$('guideWindow').close();$('guideWindow').onclose=()=>$('guideButton').setAttribute('aria-expanded','false');
  window.StatisticsPlayground={get plan(){return structuredClone(plan);},get activeRouteLength(){return plan?plan.route.filter((_,i)=>!isSkipped(i)).length:0;},get cells(){return structuredClone(cells);},get config(){return structuredClone(config);},get ready(){return !!plan&&!busy&&!configuring;}};
  renderNotebook();start();
})();
