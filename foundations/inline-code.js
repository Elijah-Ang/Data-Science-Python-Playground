/* Editable illustrative Python. Choices live only in the current illustration. */
(function(root){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tokens=code=>[...code.matchAll(/#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|-?\b\d+(?:\.\d+)?\b|[A-Za-z_]\w*|\s+|./g)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));
  // Compare real alternative programs: only source tokens changed by this
  // choice become buttons. Repeated column references share one control.
  function changedTokens(source,alternative){
    const a=tokens(source),b=tokens(alternative),n=a.length,m=b.length;
    const lengths=Array.from({length:n+1},()=>new Uint16Array(m+1));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)lengths[i][j]=a[i].text===b[j].text?1+lengths[i+1][j+1]:Math.max(lengths[i+1][j],lengths[i][j+1]);
    const changed=new Set();let i=0,j=0;
    while(i<n&&j<m){if(a[i].text===b[j].text){i++;j++;}else if(lengths[i+1][j]>=lengths[i][j+1])changed.add(i++);else j++;}
    while(i<n)changed.add(i++);
    if(!changed.size&&source!==alternative){let at=a.length-1;while(at>0&&!/\w/.test(a[at].text))at--;changed.add(at);}
    return [...changed].filter(k=>a[k]&&(/[\w"']/.test(a[k].text)&&!a[k].text.startsWith('#')&&!/^\s*=/.test(source.slice(a[k].end)))).map(k=>a[k]);
  }
  function render(code,controls,kind='result'){
    const spans=[];
    controls.map((control,index)=>({control,index})).reverse().forEach(({control,index})=>{
      const ranges=(control.ranges||control.options.flatMap(option=>changedTokens(code,option.code))).sort((a,b)=>a.start-b.start);
      const merged=[];for(const range of ranges){const previous=merged.at(-1);if(previous&&range.start<=previous.end)previous.end=Math.max(previous.end,range.end);else merged.push({...range});}
      for(const range of merged)if(!spans.some(s=>range.start<s.end&&range.end>s.start))spans.push({...range,control,index});
    });
    spans.sort((a,b)=>a.start-b.start);
    let html='',start=0;
    const highlight=value=>root.FoundationLearning?.highlightPython?.(value)||esc(value);
    for(const span of spans){
      html+=highlight(code.slice(start,span.start));
      html+='<button type="button" class="inline-code-value code-slot-'+span.index%6+'" data-code-key="'+esc(span.control.key)+'" data-code-options="'+esc(JSON.stringify(span.control.options.map(o=>({value:String(o.value),label:o.label}))))+'" data-code-value="'+esc(span.control.value)+'" aria-label="Change '+esc(span.control.label)+'; current value '+esc(code.slice(span.start,span.end))+'" aria-haspopup="listbox" aria-expanded="false">'+esc(code.slice(span.start,span.end))+'</button>';
      start=span.end;
    }
    html+=highlight(code.slice(start));
    return '<div class="inline-code-editor"><p class="inline-code-cue"><span class="inline-code-mouse" aria-hidden="true"></span>Click the highlighted code to change the '+esc(kind)+'.</p><pre class="inline-code-program"><code class="inline-code-source">'+html+'</code></pre></div>';
  }
  function choices(key,label,value,options,evaluate){return {key,label,value:String(value),options:options.map(([v,title])=>({value:String(v),label:title,code:evaluate(String(v)).code}))};}
  let popup,owner;
  function close(focus=false){
    if(!popup)return;
    const previous=owner;popup.remove();popup=null;owner=null;
    previous?.setAttribute('aria-expanded','false');
    if(focus)previous?.focus();
  }
  function position(){
    if(!popup||!owner?.isConnected){close();return;}
    const rect=owner.getBoundingClientRect(),width=Math.min(320,root.innerWidth-24);
    popup.style.width=width+'px';popup.style.left=Math.min(Math.max(12,rect.left),root.innerWidth-width-12)+'px';
    popup.style.maxHeight=Math.min(320,root.innerHeight-24)+'px';
    const height=popup.getBoundingClientRect().height;
    popup.style.top=Math.max(12,Math.min(rect.bottom+6,root.innerHeight-height-12))+'px';
  }
  function open(button){
    close();owner=button;button.setAttribute('aria-expanded','true');
    popup=root.document.createElement('div');popup.className='inline-code-options';popup.setAttribute('role','listbox');popup.setAttribute('aria-label',button.getAttribute('aria-label').split(';')[0]);
    const theme=root.document.documentElement.dataset.theme||root.document.body.dataset.theme;
    if(theme)popup.dataset.theme=theme;
    const options=JSON.parse(button.dataset.codeOptions);
    popup.innerHTML=options.map(o=>'<button type="button" role="option" tabindex="-1" data-value="'+esc(o.value)+'" aria-selected="'+(o.value===button.dataset.codeValue)+'">'+esc(o.label)+'</button>').join('');
    // Popover puts the menu above independently scrolling lesson panes.
    popup.style.setProperty('--lesson-accent',root.getComputedStyle(button).getPropertyValue('--lesson-accent')||'#167d64');
    popup.setAttribute('popover','manual');root.document.body.append(popup);
    popup.showPopover?.();
    position();
    popup.querySelector('[aria-selected="true"]')?.focus();
  }
  function mount(){
    if(!root.document?.addEventListener)return;
    root.document.addEventListener('click',event=>{
      const option=event.target.closest?.('.inline-code-options [role="option"]');
      if(option&&owner){
        const section=owner.closest('.teaching-explorer'),key=owner.dataset.codeKey,value=option.dataset.value;
        close();section.dispatchEvent(new CustomEvent('illustrative-code-change',{bubbles:true,detail:{key,value}}));
        section.querySelector('[data-code-key="'+key+'"]')?.focus();return;
      }
      const button=event.target.closest?.('[data-code-key]');
      if(button){if(button===owner)close(true);else open(button);return;}
      if(popup&&!popup.contains(event.target))close();
    });
    root.document.addEventListener('keydown',event=>{
      if(!popup)return;
      if(event.key==='Escape'){event.preventDefault();close(true);return;}
      if(event.key==='Tab'){close(true);return;}
      const options=[...popup.querySelectorAll('[role="option"]')],at=options.indexOf(root.document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?(at+1)%options.length:event.key==='ArrowUp'?(at+options.length-1)%options.length:-1;
      if(next>=0){event.preventDefault();options[next].focus();}
    });
    root.addEventListener?.('resize',()=>close());
    root.addEventListener?.('hashchange',()=>close());
    root.document.addEventListener('scroll',event=>{if(popup&&!popup.contains(event.target))position();},true);
  }
  const api={render,choices,changedTokens,close};root.InlineCode=api;
  if(typeof module!=='undefined')module.exports=api;
  mount();
})(typeof window!=='undefined'?window:globalThis);
