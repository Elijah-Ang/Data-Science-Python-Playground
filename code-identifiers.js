/* Exact code names in prose are rendered as code; keyboard shortcuts use kbd. */
(function(root){
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const namePattern=/^[A-Za-z_]\w*$/;
  const filenamePattern=/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:csv|tsv|png|svg|webp|jpe?g|json|py|html)$/i;
  const ambiguous=new Set(['mean','sum','count','size','value','values','name','group','time','date','index','order','sample','train','test','model','score','scores','target','features','result','answer','missing','label','labels','data','work','first','last','selected','prediction','predictions','clear','inspect','urgent','chosen','rows']);
  function role(name,context){
    if(filenamePattern.test(name))return 'file';
    if(context?.columnReferences?.includes(name))return 'column';
    if(context?.variables?.includes(name))return 'variable';
    if(context?.columns?.includes(name))return 'column';
    if(context?.keys?.includes(name))return 'key';
    return '';
  }
  function markup(name,context,explicit){
    const kind=explicit||role(name,context);
    return '<code class="code-identifier"'+(kind?' data-code-role="'+kind+'" title="'+({column:'Table column',variable:'Python object',key:'Dictionary key',file:'Filename'}[kind])+'"':'')+'>'+escape(name)+'</code>';
  }
  function contextual(name,text,at,context){
    if(!role(name,context))return false;
    const before=text.slice(0,at),after=text.slice(at+name.length);
    // Authored quotes and explicit naming cues disambiguate common English words.
    if(/["'`]$/.test(before)&&/^["'`]/.test(after))return true;
    if(/(?:column|field|variable|table|dataframe|series|array|dictionary|key|named|called|store|save|create|make|build|form|return|display|using|use|convert|raw|whose|into)\s+(?:named\s+)?$/i.test(before))return true;
    if(context?.instructionObjects?.includes(name)&&/\b(?:store|save|put|select|keep|return|collect|build|form|make|create|summari[sz]e|display|report|write)\s+[^.;]*\b(?:in|as)\s+$/i.test(before))return true;
    if(context?.instructionObjects?.includes(name)&&/^\s+as\s+(?:a\s+)?(?:labelled\s+|labeled\s+)?(?:dataframe|table|series|array|dictionary)\b/i.test(after))return true;
    if(context?.instructionObjects?.includes(name)&&/\bsupplies\s+[^.;]*$/i.test(before))return true;
    if(context?.instructionObjects?.includes(name)&&/\b(?:store|save|return|create|build)\s+[^.;]*(?:,|\band)\s*$/i.test(before))return true;
    if(context?.instructionObjects?.includes(name)&&/\b(?:replace|overwrite)\s+[^.;]*\bwith\s+$/i.test(before))return true;
    if(/^(?:\s+(?:column|field|variable|table|series|array|dictionary|is missing|parses|as numeric))\b/i.test(after))return true;
    if(/(?:columns|fields|keys|variables)\s+(?:named\s+)?[\w\s,`"']*$/i.test(before))return true;
    if(context?.columnReferences?.includes(name))return true;
    if(context?.columns?.includes(name)&&/^\s+as\b/.test(after)&&/\b(?:with|and|columns?|fields?)\s*$/i.test(before))return true;
    if(role(name,context)==='key')return false;
    if(ambiguous.has(name))return false;
    // Distinct identifiers from this activity, including derived columns, are
    // safe inside instructions. General explanatory prose requires a cue.
    return context?.instruction===true || name.includes('_');
  }
  function columnContext(value,context){
    const names=new Set(context?.columnReferences||[]),text=String(value??'');
    const item='[`"\']?[A-Za-z_]\\w*[`"\']?';
    const list=item+'(?:(?:\\s*,\\s*(?:and\\s+)?|\\s+and\\s+)'+item+')*';
    for(const pattern of [new RegExp('\\b(?:columns|fields)\\s+(?:named\\s+)?('+list+')','gi'),new RegExp('('+list+')\\s+(?:columns|fields)\\b','gi')]){
      for(const match of text.matchAll(pattern))for(const name of match[1].match(/[A-Za-z_]\w*/g)||[])if(context?.columns?.includes(name))names.add(name);
    }
    return {...context,columnReferences:[...names]};
  }
  function semanticRole(name,text,at,context){
    const before=text.slice(0,at),after=text.slice(at+name.length);
    if(context?.variables?.includes(name)&&/\b(?:Series|array|table|DataFrame|variable|object|dictionary)\s+(?:named\s+)?[`"']?$/i.test(before))return 'variable';
    if(context?.columns?.includes(name)&&(/\b(?:column|field)\s+(?:named\s+)?[`"']?$/i.test(before)||/^\s+(?:column|field)\b/.test(after)))return 'column';
    return role(name,context);
  }
  function format(value,context) {
    const text = String(value ?? '');
    context=columnContext(text,context);
    // Treat both coordinate names alike, including "x and y" explanations.
    // Numeric dimensions and ordinary hyphenated words remain prose.
    const labels=(context?.columns||[]).filter(name=>!namePattern.test(name)).sort((a,b)=>b.length-a.length).map(name=>'(?<![\\w])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w])');
    const pattern = new RegExp('`([^`]+)`|\\b(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+\\.(?:csv|tsv|png|svg|webp|jpe?g|json|py|html)\\b|\\b(?:[A-Za-z_]\\w*\\.)*[A-Za-z_]\\w*\\([^\\n()]*\\)|'+(labels.length?labels.join('|')+'|':'')+'\\.[A-Za-z_]\\w*\\b|\\b[A-Za-z_]\\w*\\b','g');
    const familiar=/^(?:df|pd|np|sns|plt|fig|ax|combined|record_count|X_train|X_test|y_train|y_test|X|x|y)$/;
    let html = '', start = 0;
    for (const m of text.matchAll(pattern)) {
      if (m[0] === 'x' && ((/\d\s*$/.test(text.slice(0,m.index)) && /^\s*\d/.test(text.slice(m.index+1))) || /^-(?!axis\b)[a-z]/i.test(text.slice(m.index+1)))) continue;
      if(!m[1]&&!filenamePattern.test(m[0])&&!m[0].includes('(')&&!/^\.[A-Za-z_]/.test(m[0])&&!familiar.test(m[0])&&!contextual(m[0],text,m.index,context))continue;
      html += escape(text.slice(start,m.index)) + markup(m[1] || m[0],context,semanticRole(m[1]||m[0],text,m.index,context));
      start = m.index + m[0].length;
    }
    return html + escape(text.slice(start));
  }
  function decorate(element,context) {
    if (!element) return;
    element.querySelectorAll('code').forEach(code => {
      if (!code.closest('pre')) {
        code.classList.add('code-identifier');
        const kind=role(code.textContent,context);
        if(kind&&(namePattern.test(code.textContent)||filenamePattern.test(code.textContent)||context?.columns?.includes(code.textContent))&&!code.dataset.codeRole){code.dataset.codeRole=kind;code.title={column:'Table column',variable:'Python object',key:'Dictionary key',file:'Filename'}[kind];}
      }
    });
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('svg,math,code,kbd,pre,textarea,script,style,button,select,option,td')) nodes.push(node);
    }
    for (const text of nodes) {
      const instruction=!!text.parentElement.closest('.learning-instructions,.foundation-task,.foundation-practice-brief,.foundation-task-reminder,.case-requirements,.ml-contract');
      const html = format(text.textContent,{...context,instruction});
      if (!html.includes('<code')) continue;
      const template = document.createElement('template'); template.innerHTML = html;
      text.replaceWith(template.content);
    }
  }
  function decorateHTML(html,context){
    // The same decoration is applied to prerendered HTML before JavaScript is
    // available. Only text tokens change; attributes and code blocks stay put.
    const stack=[];
    const decode=text=>text.replace(/&(?:amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity]));
    return String(html).replace(/<[^>]*>|[^<]+/g,(token,offset,input)=>{
      if(token.startsWith('<')){
        const tag=token.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();
        if(!tag)return token;
        if(tag==='code'&&!token.startsWith('</')&&!stack.some(s=>s.tag==='pre')){
          const value=decode(input.slice(offset+token.length).match(/^([^<]*)<\/code>/)?.[1]||'');
          const kind=namePattern.test(value)||filenamePattern.test(value)||context?.columns?.includes(value)?role(value,context):'';
          if(kind&&!/\bdata-code-role=/.test(token)){
            token=token.replace(/\sdata-code-role="[^"]*"|\stitle="[^"]*"/g,'');
            if(!/\bclass=/.test(token))token=token.replace(/>$/,' class="code-identifier">');
            token=token.replace(/>$/,' data-code-role="'+kind+'" title="'+({column:'Table column',variable:'Python object',key:'Dictionary key',file:'Filename'}[kind])+'">');
          }
        }
        if(token.startsWith('</')){const at=stack.map(s=>s.tag).lastIndexOf(tag);if(at>=0)stack.splice(at);}
        else if(!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)){
          const instruction=/learning-instructions|foundation-task|foundation-practice-brief|case-requirements|ml-contract/.test(token);
          stack.push({tag,instruction});
        }
        return token;
      }
      if(stack.some(s=>/^(?:svg|math|code|kbd|pre|textarea|script|style|button|select|option|td)$/.test(s.tag)))return token;
      const decoded=decode(token);
      if(stack.at(-1)?.tag==='th'&&context?.columns?.includes(decoded))return markup(decoded,context,'column');
      const formatted=format(decoded,{...context,instruction:stack.some(s=>s.instruction)});
      return formatted.includes('<code')?formatted:token;
    });
  }
  root.CodeIdentifiers = {format,decorate,decorateHTML,columnContext};
})(window);
