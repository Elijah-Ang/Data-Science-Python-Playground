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
  function highlightContent(element){
    root.CodeIdentifiers?.decorate(element);
    element.querySelectorAll('.foundation-content code, .ml-contract code, .ml-output-names code').forEach(code=>{
      const value=code.textContent, token=code.dataset.focus?`"${code.dataset.focus}"`:null;
      const at=token?value.indexOf(token):-1;
      code.innerHTML=at<0?highlightPython(value):highlightPython(value.slice(0,at))+'<mark class="syntax-focus">'+highlightPython(token)+'</mark>'+highlightPython(value.slice(at+token.length));
    });
  }
  const deckIcon='<svg class="deck-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h25v5H7zM10 9h25v5H10zM5 14h26v22H5zM10 21h16M10 27h10"/></svg>';
  root.FoundationLearning={esc,highlightPython,highlightContent,stages,deckIcon};
})(window);
