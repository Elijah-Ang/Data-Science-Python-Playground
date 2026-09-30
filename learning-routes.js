/* Shared static lesson URLs. Legacy fragment routes remain valid entry points. */
(function(root){
  'use strict';
  const prefixes={data:'data-foundations',ml:'ml-learn'};
  function url(family,route='',from=''){
    const prefix=prefixes[family], [deck,id,position]=route.replace(/^#/,'').split('/');
    const query=new URLSearchParams();
    if(from==='learn')query.set('from','learn');
    if(id&&id!=='chapter'&&id!=='challenges'&&Number(position)>0)query.set('practice',position);
    const file=!deck?prefix+'.html':id==='challenges'?prefix+'.html':prefix+'-'+(id&&id!=='chapter'?id:deck)+'.html';
    const hash=id==='chapter'?'#chapter-'+position:id==='challenges'?'#'+route.replace(/^#/,''):'';
    return file+(query.size?'?'+query.toString():'')+hash;
  }
  function route(family,location,body){
    const hash=location.hash.slice(1);
    if(hash&&!/^(?:foundationsMain|chapter-\d+)$/.test(hash))return hash;
    const authored=body.dataset.learningRoute||'';
    if(/^chapter-\d+$/.test(hash)&&authored&&!authored.includes('/'))return authored+'/chapter/'+hash.slice(8);
    const practice=new URLSearchParams(location.search).get('practice');
    return authored&&authored.includes('/')?authored.split('/').slice(0,2).join('/')+'/'+(/^\d+$/.test(practice||'')?practice:'0'):authored;
  }
  function rewriteHTML(family,html,from=''){
    return html.replace(/href="#([^"]*)"/g,(tag,fragment)=>/^(?:foundationsMain|chapter-\d+)$/.test(fragment)?tag:'href="'+url(family,fragment,from).replaceAll('&','&amp;')+'"');
  }
  function enhance(family,main){
    const from=new URLSearchParams(root.location.search).get('from');
    for(const anchor of main.querySelectorAll('a[href^="#"]')){
      const fragment=anchor.getAttribute('href').slice(1);
      if(!/^(?:foundationsMain|chapter-\d+)$/.test(fragment))anchor.setAttribute('href',url(family,fragment,from));
    }
    const exit=root.document.querySelector('.back-playground');
    if(exit?.getAttribute('href').startsWith('#'))exit.href=url(family,exit.getAttribute('href').slice(1),from);
  }
  function canonical(family,current){
    const link=root.document.querySelector('link[rel="canonical"]');
    if(link)link.href='https://dataplayground.science/'+url(family,current).split(/[?#]/)[0];
  }
  function installRouter(family,curriculum,render){
    const registry=new Map([[prefixes[family]+'.html',''],
      ...curriculum.decks.map(deck=>[url(family,deck.id),deck.id]),
      ...(curriculum.lessons||curriculum.cards).map(lesson=>[url(family,lesson.deck+'/'+lesson.id+'/0'),lesson.deck+'/'+lesson.id+'/0'])]);
    let previousURL=root.location.href;
    function sync(){const entry=registry.get(root.location.pathname.split('/').pop());if(entry!==undefined)root.document.body.dataset.learningRoute=entry;}
    function changed(){if(previousURL===root.location.href)return;previousURL=root.location.href;sync();render();}
    root.document.addEventListener('click',event=>{
      const anchor=event.target.closest?.('a[href]');
      if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.hasAttribute('download')||anchor.target)return;
      const target=new URL(anchor.href,root.location.href);
      if(target.origin!==root.location.origin||!registry.has(target.pathname.split('/').pop()))return;
      // Ordinary anchor URLs work without JS; enhancement keeps the Python worker
      // and existing interaction model alive across lessons and browser history.
      if(target.href===root.location.href)return;
      // Browsers can throttle very rapid history mutations. The ordinary
      // link remains a working fallback if enhancement cannot update history.
      try { root.history.pushState(null,'',target.href); } catch { return; }
      event.preventDefault();changed();
    });
    root.addEventListener('popstate',changed);root.addEventListener('hashchange',changed);
    sync();render();
  }
  root.LearningRoutes={url,route,rewriteHTML,enhance,canonical,installRouter};
})(typeof window!=='undefined'?window:globalThis);
