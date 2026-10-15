/* Shared learning presentation. Stage labels describe an exercise, never saved progress. */
(function(root){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function highlightPython(code){
    const tokens=/(#[^\n]*|(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|(?:[frbu]|rf|fr)?"(?:\\.|[^"\\\n])*"?|(?:[frbu]|rf|fr)?'(?:\\.|[^'\\\n])*'?)|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b|\b(?:print|len|range|list|dict|str|int|float|sum|min|max|set|tuple|sorted|enumerate|zip|round|bool|isinstance)\b|\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b|\b[A-Za-z_]\w*(?=\s*\()|[+*/%=<>!&|~^-]+)/g;
    let result='',start=0;
    for(const match of String(code).matchAll(tokens)){
      const token=match[0];
      const kind=token[0]==='#'?'comment':/^(?:[frbu]|rf|fr)?["']/.test(token)?'string':/^\d/.test(token)?'number':/^[+*/%=<>!&|~^-]/.test(token)?'operator':/^(print|len|range|list|dict|str|int|float|sum|min|max|set|tuple|sorted|enumerate|zip|round|bool|isinstance)$/.test(token)?'builtin':/^\s*\(/.test(code.slice(match.index+token.length))?'function':'keyword';
      result+=esc(code.slice(start,match.index))+`<span class="py-${kind}">${esc(token)}</span>`;start=match.index+token.length;
    }
    return result+esc(code.slice(start));
  }
  function stages(exercises,index){
    const meaning={Follow:'Read and try the Python',Change:'Adapt one part',Transfer:'Apply to a new question',Practise:'Reinforce the skill',Observe:'Inspect the evidence',Decide:'Use the evidence',Explain:'Interpret the result'};
    return `<section class="foundation-practices" aria-label="Exercise type"><ol>${exercises.map((e,i)=>`<li ${i===index?'aria-current="step"':''}><strong>${esc(e.label)}</strong><span>${esc(e.demand||meaning[e.label]||'Retrieve and apply')}</span>${i===index?'<em>Current exercise</em>':''}</li>`).join('')}</ol></section>`;
  }
  const conceptTitles={
    'figure-axes':'Figure and Axes','labels':'Chart titles and axis labels','reference-lines':'Calculated reference lines','subplots-panels':'Several Axes in one Figure','scales':'Axis limits and measurement scales',
    'data-mapping':'Map table columns to chart coordinates','figure-grid':'Seaborn creates the Figure or grid','hue':'Colour by group','style':'Marker shape by group','palette':'Choose a colour palette',
    'choice':'Choose a chart for the question','fair-comparison':'Compare charts on fair scales','repeated-measurements':'Repeated observations at the same time','report':'Explain a chart with evidence','sample-detail':'Balance individual observations and summaries','stacked-bars':'Stack category totals',
    'assignment':'Store a value under a Python name','import':'Import a Python library','dictionary':'Named dictionary entries','list-conversion':'Turn labels into a list','method-call':'Call an object’s method','slice':'Select a range of positions',
    'dataframe-construction':'Build a DataFrame','dataframe-selection':'Select a table of columns','series-selection':'Select a column as a Series','attribute-column-selection':'Column selection with dot notation','series-values':'Series values and labels','series-labels':'Labels attached to a Series','grouped-series-order':'Sort a grouped summary and extract its labels','group-summary':'Summarise groups','named-aggregation':'Name new summary columns','column-assignment':'Create a derived column','boolean-mask':'Select rows with a condition','boolean-combination':'Combine row conditions','series-alignment':'Align values by row labels','csv-separator':'Choose the CSV separator','random-state':'Repeat a random selection','join-validation':'Check the join relationship','nullable-dtype':'Types that allow missing values','coerce-invalid':'Mark invalid values as missing','vector-arithmetic':'Calculate with whole columns','vectorisation':'Apply an operation to a whole column','dtype-as-text':'Read a stored type as text','normalized-counts':'Turn category counts into proportions',
    'iqr-fences':'Quartiles and unusual values','linear-association':'Read a linear association','numeric-summary':'Summarise numeric measurements','standard-scaler':'Standardise measurements','minmax-scaler':'Rescale to a fixed range'
  };
  function conceptTitle(value){
    if(typeof value!=='string')return value.title||value.name||value.id;
    if(!/^(python|pandas|numpy|matplotlib|seaborn|sklearn|statistics|chart)\./.test(value))return value;
    const [library,name]=value.split('.');
    if(conceptTitles[name])return conceptTitles[name];
    if(library==='seaborn'&&name.endsWith('plot'))return '`sns.'+name+'()`';
    return name.replace(/[-_]/g,' ').replace(/^./,c=>c.toUpperCase());
  }
  function orientation(metadata,id){
    if(!metadata)return '';
    const names=items=>(items||[]).map(conceptTitle).filter(Boolean).join(', ');
    const known=names(metadata.reuses),introduced=names(metadata.introduces),extended=names(metadata.extends);
    return `<section class="teaching-orientation" data-code-context="guide" aria-label="What this lesson builds on">${known?`<p><strong>You already know:</strong> ${root.LearningLanguage.text(known,id)}</p>`:''}${introduced?`<p><strong>New here:</strong> ${root.LearningLanguage.text(introduced,id)}</p>`:''}${extended?`<p><strong>Extend:</strong> ${root.LearningLanguage.text(extended,id)}</p>`:''}</section>`;
  }
  function changedCode(source,lines=[]){
    const changed=new Set(lines);
    return String(source||'').split('\n').map((line,i)=>changed.has(i+1)?`<mark class="workflow-code-change">${highlightPython(line)}</mark>`:highlightPython(line)).join('\n');
  }
  let panelObserver, updatePanels;
  root.addEventListener?.('resize',()=>updatePanels?.());
  function bindPanels(element){
    panelObserver?.disconnect();
    updatePanels=()=>{
      const split=element.querySelector('.foundation-split');
      if(!split?.isConnected)return;
      if(root.innerWidth<=800){split.style.removeProperty('--lesson-pane-height');return;}
      split.style.setProperty('--lesson-pane-height',Math.max(240,root.innerHeight-split.getBoundingClientRect().top-32)+'px');
    };
    updatePanels();
    root.requestAnimationFrame?.(()=>updatePanels?.());
    root.document.fonts?.ready.then(()=>updatePanels?.());
    if(root.ResizeObserver){
      panelObserver=new root.ResizeObserver(()=>updatePanels?.());
      [element.querySelector('.foundation-lesson-heading'),root.document.querySelector('.topbar'),root.document.querySelector('.foundation-strip')].filter(Boolean).forEach(node=>panelObserver.observe(node));
    }
  }
  function highlightContent(element,context){
    root.CodeIdentifiers?.decorate(element,context);
    element.querySelectorAll('.foundation-content code, .foundation-reference-content code, .ml-contract code, .ml-output-names code').forEach(code=>{
      if(code.matches('.inline-code-source')||code.querySelector('.workflow-code-change'))return;
      const value=code.textContent, token=code.dataset.focus?`"${code.dataset.focus}"`:null;
      const at=token?value.indexOf(token):-1;
      if(code.closest('pre'))code.innerHTML=highlightPython(value);
      else if(at>=0)code.innerHTML=esc(value.slice(0,at))+'<mark class="syntax-focus">'+esc(token)+'</mark>'+esc(value.slice(at+token.length));
    });
  }
  const deckIcon='<svg class="deck-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h25v5H7zM10 9h25v5H10zM5 14h26v22H5zM10 21h16M10 27h10"/></svg>';
  root.FoundationLearning={esc,highlightPython,highlightContent,stages,deckIcon,orientation,changedCode,bindPanels};
})(window);
