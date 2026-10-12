/* Short, readable action steps shared by Learn / Refresh. No learner state. */
(function(root){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // These substitutions change prose only. Quoted labels, code, numbers,
  // operators and scientific conditions are kept exactly as authored.
  const phrases=[
    [/\bretain\b/gi,'keep'],[/\bpreserve\b/gi,'keep'],
    [/\bretaining\b/gi,'keeping'],[/\bpreserving\b/gi,'keeping'],
    [/\bconstruct\b/gi,'make'],[/\bproduce\b/gi,'make'],
    [/\butilise\b/gi,'use'],[/\butilize\b/gi,'use'],
    [/\bchronological order\b/gi,'time order, earliest first'],
    [/\bin source order\b/gi,'in their original row order'],
    [/\bunparseable\b/gi,'unable to be read in the required format'],
    [/\bparses as numeric\b/gi,'can be read as a number'],
    [/\braw price text\b/gi,'original price text'],
    [/\bnominate\b/gi,'choose'],[/\bnomination\b/gi,'model choice'],
    [/\bprior to\b/gi,'before'],[/\bsubsequently\b/gi,'then'],
    [/\brespectively\b/gi,'in that same order']
  ];
  function plain(text){
    return String(text??'').split(/(`[^`]*`|"[^"\n]*"|(?<!\w)'[^'\n]*'|\b(?:[A-Za-z_]\w*\.)*[A-Za-z_]\w*\([^\n]*?\))/g).map((part,i)=>{
      if(i%2)return part;
      for(const [pattern,value] of phrases)part=part.replace(pattern,value);
      return part;
    }).join('');
  }
  function split(text){
    // Split outside quotes/brackets only: decimal points, Python calls, chart
    // titles, tuple literals and dictionary examples must remain intact.
    const result=[];let start=0,quote='',depth=0;
    text=plain(text).trim();
    for(let i=0;i<text.length;i++){
      const char=text[i];
      if(quote){if(char===quote&&text[i-1]!=='\\')quote='';continue;}
      if('"\'`'.includes(char)){
        if(char==="'"&&/[A-Za-z0-9_]$/.test(text.slice(0,i)))continue;
        quote=char;continue;
      }
      if('([{'.includes(char)){depth++;continue;}
      if(')]}'.includes(char)){depth=Math.max(0,depth-1);continue;}
      if(depth)continue;
      const tail=text.slice(i+1);
      const sentence=/[.!?]/.test(char)&&(/^\s+[A-Z]/.test(tail)||/^\s+(?:choose|keep|make|create|return|display|use|add|save|sort|fit|compare|report|evaluate|explain|plot|calculate|draw|filter|write|avoid)\b/.test(tail));
      const action=char===';'&&/^\s*(?:then\s+)?(?:keep|make|create|return|display|use|add|save|sort|label|do|leave|fit|compare|report|evaluate|choose|explain|plot|calculate|draw|set|filter|count|write|avoid)\b/i.test(tail);
      const commaAction=char===','&&!/\b(?:if|unless|when|until)\b/i.test(text.slice(start,i))&&/^\s*(?:and\s+|then\s+)?(?:keep|make|create|return|display|add|save|sort|fit|compare|report|evaluate|choose|plot|calculate|draw|filter|write|avoid)\b/i.test(tail);
      if(sentence||action||commaAction){
        const value=text.slice(start,i+(sentence?1:0)).trim();
        if(value)result.push(value);
        start=i+1;
        if(commaAction){const connective=text.slice(start).match(/^\s*(?:and|then)\s+/);if(connective)start+=connective[0].length;}
      }
    }
    if(text.slice(start).trim())result.push(text.slice(start).trim());
    return result.map(s=>s.replace(/^(keep|make|create|return|display|use|add|save|sort|label|do|leave|fit|compare|report|evaluate|choose|explain|plot|calculate|draw|set|filter|count|write|avoid)\b/,word=>word[0].toUpperCase()+word.slice(1)));
  }
  function context(id){return root.LearningIdentifiers?.[id]||{};}
  function text(value,id,instruction=false,local){return root.CodeIdentifiers?.format(plain(value),{...(local||context(id)),instruction})||esc(plain(value));}
  function steps(value,id){
    const items=(Array.isArray(value)?value:[value]).flatMap(split);
    let local=context(id);
    return '<ol class="learning-instructions">'+items.map(s=>{
      local=root.CodeIdentifiers.columnContext(s,local);
      return '<li>'+text(s,id,true,local)+'</li>';
    }).join('')+'</ol>';
  }
  const taskSteps={
    'ML-M-K1-1':[
      'Check the five cases below. Write a short report for each case.',
      'Wine: candidate A has CV RMSE 0.8. Candidate B has CV RMSE 0.81. Fold variation is 0.1.',
      'Penguins: classifier accuracy is .95. Recall for the minority class is .2.',
      'K-Means: k=3 has silhouette .51. k=4 has silhouette .52. Their group sizes are very different.',
      'Ward: the profiles use a 500-row sample. The report claims they describe all 569 rows.',
      'PCA: seven axes retain 90% of the variance. The picture shows only two axes.',
      'For each case, name the task. Explain what the evidence supports. State one limitation.'
    ]
  };
  const activity=ex=>steps(taskSteps[ex.id]||ex.steps||ex.task,ex.id);
  function key(){return '<p class="learning-name-key"><span>Boxed names are used in Python.</span> <span>Underlined names are table columns.</span> Use each name exactly as shown.</p>';}
  const meanings={
    DataFrame:'a table with rows and columns',Series:'one labelled set of values',
    numeric:'a number, rather than text',missing:'no value was supplied',
    baseline:'a simple reference model used for comparison',
    dummy:'a simple reference model used for comparison',
    folds:'training-data groups used to compare models on the same held-out rows',
    'out-of-fold':'predictions made for training rows by models that did not fit those rows',
    'reserved rows':'rows kept aside for one final evaluation',
    'original-unit':'shown in the measurement’s original units',
    'aligned':'matched by row or category identity, rather than guessed position',
    'uncertainty':'how much the result could change with different observations'
    ,provenance:'where the data or fitted result came from'
    ,ablation:'a comparison that removes one input or part of a model'
    ,stratified:'split so each group keeps similar class proportions'
    ,residuals:'observed values minus predicted values'
    ,MAE:'mean absolute error: the average size of prediction errors'
    ,RMSE:'root mean squared error: an error measure that gives larger errors more weight'
    ,median:'the middle value after sorting; with two middle values, their average'
    ,eligible:'rows that meet this task’s stated conditions'
    ,scalar:'one value, rather than a table or list'
    ,dtype:'the type used to store a column’s values'
    ,index:'the labels attached to rows or to Series values'
  };
  function glossary(values){
    const joined=(Array.isArray(values)?values:[values]).join(' ');
    const found=Object.entries(meanings).filter(([term])=>new RegExp('\\b'+term+'\\b','i').test(joined));
    return found.length?'<details class="learning-word-help"><summary>Words in this task</summary><dl>'+found.map(([term,meaning])=>'<div><dt>'+esc(term)+'</dt><dd>'+esc(meaning)+'</dd></div>').join('')+'</dl></details>':'';
  }
  const render=(html,id)=>root.CodeIdentifiers.decorateHTML(html,context(id));
  root.LearningLanguage={plain,split,text,steps,activity,key,glossary,context,render};
})(typeof window!=='undefined'?window:globalThis);
