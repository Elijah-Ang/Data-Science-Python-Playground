/* Exact code names in prose are rendered as code; keyboard shortcuts use kbd. */
(function(root){
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const namePattern=/^[A-Za-z_]\w*$/;
  const ambiguous=new Set(['mean','sum','count','size','value','values','name','group','time','date','index','order','sample','train','test','model','score','scores','target','features','result','answer','missing','label','labels','data','work','first','last','selected','prediction','predictions']);
  function role(name,context){
    if(context?.columns?.includes(name))return 'column';
    if(context?.variables?.includes(name))return 'variable';
    return '';
  }
  function markup(name,context){
    const kind=role(name,context);
    return '<code class="code-identifier"'+(kind?' data-code-role="'+kind+'" title="'+(kind==='column'?'Table column':'Python object')+'"':'')+'>'+escape(name)+'</code>';
  }
  function contextual(name,text,at,context){
    if(!role(name,context))return false;
    const before=text.slice(0,at),after=text.slice(at+name.length);
    // Authored quotes and explicit naming cues disambiguate common English words.
    if(/["'`]$/.test(before)&&/^["'`]/.test(after))return true;
    if(/(?:column|field|variable|table|series|array|dictionary|key|named|called|store|save|create|make|return|display|using|use|convert|raw|whose)\s+(?:named\s+)?$/i.test(before))return true;
    if(/^(?:\s+(?:column|field|variable|table|series|array|dictionary|is missing|parses|as numeric))\b/i.test(after))return true;
    if(/(?:columns|fields|keys|variables)\s+(?:named\s+)?[\w\s,`"']*$/i.test(before))return true;
    if(ambiguous.has(name))return false;
    // Distinct identifiers from this activity, including derived columns, are
    // safe inside instructions. General explanatory prose requires a cue.
    return context?.instruction===true || name.includes('_');
  }
  function format(value,context) {
    const text = String(value ?? '');
    // Treat both coordinate names alike, including "x and y" explanations.
    // Numeric dimensions and ordinary hyphenated words remain prose.
    const pattern = /`([^`]+)`|\b(?:[A-Za-z_]\w*\.)*[A-Za-z_]\w*\([^\n()]*\)|\.[A-Za-z_]\w*\b|\b[A-Za-z_]\w*\b/g;
    const familiar=/^(?:df|pd|np|sns|plt|fig|ax|combined|record_count|X_train|X_test|y_train|y_test|X|x|y)$/;
    let html = '', start = 0;
    for (const m of text.matchAll(pattern)) {
      if (m[0] === 'x' && ((/\d\s*$/.test(text.slice(0,m.index)) && /^\s*\d/.test(text.slice(m.index+1))) || /^-(?!axis\b)[a-z]/i.test(text.slice(m.index+1)))) continue;
      if(!m[1]&&!m[0].includes('(')&&!/^\.[A-Za-z_]/.test(m[0])&&!familiar.test(m[0])&&!contextual(m[0],text,m.index,context))continue;
      html += escape(text.slice(start,m.index)) + markup(m[1] || m[0],context);
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
        if(kind&&namePattern.test(code.textContent)){code.dataset.codeRole=kind;code.title=kind==='column'?'Table column':'Python object';}
      }
    });
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('svg,math,code,kbd,pre,textarea,script,style,button,select,option')) nodes.push(node);
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
    return String(html).replace(/<[^>]*>|[^<]+/g,token=>{
      if(token.startsWith('<')){
        const tag=token.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();
        if(!tag)return token;
        if(token.startsWith('</')){const at=stack.map(s=>s.tag).lastIndexOf(tag);if(at>=0)stack.splice(at);}
        else if(!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)){
          const instruction=/learning-instructions|foundation-task|foundation-practice-brief|case-requirements|ml-contract/.test(token);
          stack.push({tag,instruction});
        }
        return token;
      }
      if(stack.some(s=>/^(?:svg|math|code|kbd|pre|textarea|script|style|button|select|option|td)$/.test(s.tag)))return token;
      const decoded=decode(token);
      if(stack.at(-1)?.tag==='th'&&role(decoded,context)==='column')return markup(decoded,context);
      const formatted=format(decoded,{...context,instruction:stack.some(s=>s.instruction)});
      return formatted.includes('<code')?formatted:token;
    });
  }
  root.CodeIdentifiers = {format,decorate,decorateHTML};
})(window);
