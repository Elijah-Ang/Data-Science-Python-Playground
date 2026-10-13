/* Authored code-name semantics; Python blocks keep ordinary syntax highlighting.
 * Contexts contain role arrays, `semantics` maps and `scopes`. Authored
 * `occurrences`: [{text,role,occurrence?,before?,after?,scope?}] override inference.
 * Inline [[column:value]], [[variable:order]], [[literal:title]] and explicit
 * <code data-code-role="..."> markup also override inference. Never learner state.
 */
(function(root){
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const namePattern=/^[A-Za-z_]\w*$/;
  const filenamePattern=/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:csv|tsv|png|svg|webp|jpe?g|json|py|html)$/i;
  const titles={column:'Table column',variable:'Python object',key:'Dictionary key',file:'Filename',function:'Python function',parameter:'Python parameter',operation:'Aggregation operation',literal:'Literal text',prose:'Ordinary prose'};
  const fields={inputColumns:['column','input'],derivedColumns:['column','derived'],outputColumns:['column','output'],exampleVariables:['variable','example'],variables:['variable'],columns:['column'],keys:['key'],files:['file'],functions:['function'],parameters:['parameter'],operations:['operation'],literals:['literal'],prose:['prose']};
  function contextFor(context={},scope=context?.scope){
    const scoped=context?.scopes?.[scope]||{};
    const result={...context,...scoped,scope,semantics:{...context?.semantics,...scoped.semantics},occurrences:[...(context?.occurrences||[]),...(scoped.occurrences||[])]};
    // Scoped declarations also supply local table headings and exact names.
    // They never overwrite the role of this word in another teaching field.
    for(const [name,entry] of Object.entries(result.semantics)){
      const kind=typeof entry==='string'?entry:entry.role;
      const field=kind==='column'?'columns':kind==='variable'?'variables':'';
      if(field&&!result[field]?.includes(name))result[field]=[...(result[field]||[]),name];
    }
    return result;
  }
  function meaning(name,context={}){
    const explicit=context.semantics?.[name];
    if(explicit){const entry=typeof explicit==='string'?{role:explicit}:explicit;if(Object.hasOwn(titles,entry.role))return entry;}
    const kind=role(name,context);
    if(kind){
      const origin=kind==='column'?['outputColumns','derivedColumns','inputColumns'].find(field=>context[field]?.includes(name)):kind==='variable'&&context.exampleVariables?.includes(name)?'exampleVariables':'';
      return {role:kind,...(origin?{kind:fields[origin][1]}:{})};
    }
    for(const [field,[role,kind]] of Object.entries(fields))if(context[field]?.includes(name))return {role,...(kind?{kind}:{})};
    return {};
  }
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
    const kind=explicit||meaning(name,context).role;
    // Preserve the override through prerendering and a later DOM decoration.
    if(kind==='prose')return '<span data-code-role="prose">'+escape(name)+'</span>';
    return '<code class="code-identifier"'+(Object.hasOwn(titles,kind)?' data-code-role="'+kind+'" title="'+titles[kind]+'"':'')+'>'+escape(name)+'</code>';
  }
  function contextual(name,text,at,context){
    const kind=meaning(name,context).role;
    if(!kind||['literal','prose','operation','function','parameter'].includes(kind))return false;
    const before=text.slice(0,at),after=text.slice(at+name.length);
    // Exact field/object cues are a conservative fallback. Quotes alone do not
    // make display text or ordinary English an identifier reference.
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
    if(context?.semantics?.[name])return meaning(name,context).role;
    const before=text.slice(0,at),after=text.slice(at+name.length);
    if(context?.variables?.includes(name)&&/\b(?:Series|array|table|DataFrame|variable|object|dictionary)\s+(?:named\s+)?[`"']?$/i.test(before))return 'variable';
    if(context?.columns?.includes(name)&&(/\b(?:column|field)\s+(?:named\s+)?[`"']?$/i.test(before)||/^\s+(?:column|field)\b/.test(after)))return 'column';
    return meaning(name,context).role;
  }
  function occurrenceRanges(text,context){
    const ranges=[];
    for(const occurrence of context.occurrences||[]){
      const value=String(occurrence.text??occurrence.name??'');
      if(!value||!Object.hasOwn(titles,occurrence.role)||occurrence.scope&&occurrence.scope!==context.scope)continue;
      let at=0,index=0;
      while((at=text.indexOf(value,at))>=0){
        const end=at+value.length;
        const boundary=(!/^\w/.test(value)||!/[\w]/.test(text[at-1]||''))&&(!/\w$/.test(value)||!/[\w]/.test(text[end]||''));
        const before=text.slice(0,at),after=text.slice(end);
        const beforeMatches=occurrence.before===undefined||before.endsWith(occurrence.before)||before.replace(/`$/,'').endsWith(occurrence.before);
        const afterMatches=occurrence.after===undefined||after.startsWith(occurrence.after)||after.replace(/^`/,'').startsWith(occurrence.after);
        if(boundary&&beforeMatches&&afterMatches&&(occurrence.occurrence===undefined||occurrence.occurrence===index)){
          const backticks=text[at-1]==='`'&&text[end]==='`';
          ranges.push({start:backticks?at-1:at,end:backticks?end+1:end,value,role:occurrence.role});
        }
        at=end;index++;
      }
    }
    const accepted=[];
    for(const range of ranges.reverse())if(!accepted.some(other=>range.start<other.end&&range.end>other.start))accepted.push(range);
    return accepted.sort((a,b)=>a.start-b.start);
  }
  function format(value,context={}){
    const text=String(value??'');context=columnContext(text,contextFor(context));
    let html='',start=0;
    for(const range of occurrenceRanges(text,context)){html+=formatTokens(text.slice(start,range.start),context)+markup(range.value,context,range.role);start=range.end;}
    return html+formatTokens(text.slice(start),context);
  }
  function formatTokens(value,context) {
    const text = String(value ?? '');
    context=columnContext(text,context);
    // Treat both coordinate names alike, including "x and y" explanations.
    // Numeric dimensions and ordinary hyphenated words remain prose.
    const labels=(context?.columns||[]).filter(name=>!namePattern.test(name)).sort((a,b)=>b.length-a.length).map(name=>'(?<![\\w])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w])');
    const pattern = new RegExp('\\[\\[([a-z]+):([^\\]\\n]+)\\]\\]|`([^`]+)`|"(?:\\\\.|[^"\\\\\\n])*"|(?<![\\w])\'(?:\\\\.|[^\'\\\\\\n])*\'|\\b(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+\\.(?:csv|tsv|png|svg|webp|jpe?g|json|py|html)\\b|\\b(?:[A-Za-z_]\\w*\\.)*[A-Za-z_]\\w*\\([^\\n()]*\\)|'+(labels.length?labels.join('|')+'|':'')+'\\.[A-Za-z_]\\w*\\b|\\b[A-Za-z_]\\w*\\b','g');
    const familiar=/^(?:df|pd|np|sns|plt|fig|ax|X_train|X_test|y_train|y_test|X|x|y)$/;
    let html = '', start = 0;
    for (const m of text.matchAll(pattern)) {
      if(m[1]&&Object.hasOwn(titles,m[1])){html+=escape(text.slice(start,m.index))+markup(m[2],context,m[1]);start=m.index+m[0].length;continue;}
      if(/^["']/.test(m[0])){
        const name=m[0].slice(1,-1),kind=meaning(name,context).role,before=text.slice(0,m.index);
        const subscript=/\b[A-Za-z_]\w*(?:\.(?:loc|iloc))?\[\s*$/.test(before)&&/^\s*\]/.test(text.slice(m.index+m[0].length));
        const columnCue=kind==='column'&&/\b(?:columns?|fields?)\s+(?:named\s+)?$/i.test(before);
        if(columnCue||kind==='file'||subscript&&['column','key'].includes(kind)){html+=escape(text.slice(start,m.index))+escape(m[0][0])+markup(name,context,kind)+escape(m[0].at(-1));start=m.index+m[0].length;}
        continue;
      }
      if (m[0] === 'x' && ((/\d\s*$/.test(text.slice(0,m.index)) && /^\s*\d/.test(text.slice(m.index+1))) || /^-(?!axis\b)[a-z]/i.test(text.slice(m.index+1)))) continue;
      if(!m[3]&&!filenamePattern.test(m[0])&&!m[0].includes('(')&&!/^\.[A-Za-z_]/.test(m[0])&&!familiar.test(m[0])&&!contextual(m[0],text,m.index,context))continue;
      html += escape(text.slice(start,m.index)) + markup(m[3] || m[0],context,semanticRole(m[3]||m[0],text,m.index,context));
      start = m.index + m[0].length;
    }
    return html + escape(text.slice(start));
  }
  function decorate(element,context) {
    if (!element) return;
    const local=node=>contextFor(context,node.closest('[data-code-context]')?.dataset.codeContext||context?.scope);
    element.querySelectorAll('code').forEach(code => {
      if (!code.closest('pre')) {
        code.classList.add('code-identifier');
        const kind=meaning(code.textContent,local(code)).role;
        if(kind&&(namePattern.test(code.textContent)||filenamePattern.test(code.textContent)||local(code).columns?.includes(code.textContent))&&!code.hasAttribute('data-code-role')){code.dataset.codeRole=kind;code.title=titles[kind];}
      }
    });
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('svg,math,code,kbd,pre,textarea,script,style,button,select,option,td,[data-code-role="literal"],[data-code-role="prose"]')) nodes.push(node);
    }
    for (const text of nodes) {
      const instruction=!!text.parentElement.closest('.learning-instructions,.foundation-task-steps');
      const html = format(text.textContent,{...local(text.parentElement),instruction});
      if (html===escape(text.textContent)) continue;
      const template = document.createElement('template'); template.innerHTML = html;
      text.replaceWith(template.content);
    }
  }
  function decorateHTML(html,context){
    // The same decoration is applied to prerendered HTML before JavaScript is
    // available. Only text tokens change; attributes and code blocks stay put.
    const stack=[];
    const local=()=>contextFor(context,stack.findLast(s=>s.scope)?.scope||context?.scope);
    const decode=text=>text.replace(/&(?:amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity]));
    return String(html).replace(/<[^>]*>|[^<]+/g,(token,offset,input)=>{
      if(token.startsWith('<')){
        const tag=token.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();
        if(!tag)return token;
        if(tag==='code'&&!token.startsWith('</')&&!stack.some(s=>s.tag==='pre')){
          const value=decode(input.slice(offset+token.length).match(/^([^<]*)<\/code>/)?.[1]||'');
          const scoped=local(),kind=namePattern.test(value)||filenamePattern.test(value)||scoped?.columns?.includes(value)?meaning(value,scoped).role:'';
          if(kind&&!/\bdata-code-role=/.test(token)){
            token=token.replace(/\sdata-code-role="[^"]*"|\stitle="[^"]*"/g,'');
            if(!/\bclass=/.test(token))token=token.replace(/>$/,' class="code-identifier">');
            token=token.replace(/>$/,' data-code-role="'+kind+'" title="'+titles[kind]+'">');
          }
        }
        if(token.startsWith('</')){const at=stack.map(s=>s.tag).lastIndexOf(tag);if(at>=0)stack.splice(at);}
        else if(!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)){
          const instruction=/learning-instructions|foundation-task-steps/.test(token);
          stack.push({tag,instruction,scope:token.match(/\bdata-code-context=["']([^"']*)["']/)?.[1],literal:/\bdata-code-role=["'](?:literal|prose)["']/.test(token)});
        }
        return token;
      }
      if(stack.some(s=>s.literal||/^(?:svg|math|code|kbd|pre|textarea|script|style|button|select|option|td)$/.test(s.tag)))return token;
      const decoded=decode(token);
      const scoped=local();
      if(stack.at(-1)?.tag==='th'&&scoped?.columns?.includes(decoded))return markup(decoded,scoped,'column');
      const formatted=format(decoded,{...scoped,instruction:stack.some(s=>s.instruction)});
      return formatted!==escape(decoded)?formatted:token;
    });
  }
  root.CodeIdentifiers = {format,decorate,decorateHTML,columnContext,contextFor,meaning};
})(typeof window!=='undefined'?window:globalThis);
