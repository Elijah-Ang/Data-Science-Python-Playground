(() => {
  'use strict';
  const $=s=>document.querySelector(s),{chapters}=window.TOUR_CONTENT,pages=window.TOUR_PAGES;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),last=chapters.length-1;
  const requested=new URLSearchParams(location.search).get('view');
  let index=-1,profile='',page='',token=0,ready=false;
  let width=1440,height=960,current={x:0,y:0,scale:1},focus=null;
  const frame=$('#siteFrame'),camera=$('#camera'),viewport=$('.viewport');
  const groups=[...new Set(chapters.map(c=>c.group))];
  $('#journey').style.height='100svh';
  const buttons=chapters.map((c,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`${c.group}: ${c.label}`);b.onclick=()=>go(i);$('.steps').append(b);return b;});
  const groupButtons=groups.map(g=>{const b=document.createElement('button');b.type='button';b.textContent=g==='Stats'?'Statistics':g;b.setAttribute('aria-label',`Tour ${g}`);b.onclick=()=>go(chapters.findIndex(c=>c.group===g));$('.tour-sections').append(b);return b;});
  function status(message){$('#tourStatus').textContent=message;$('#tourStatus').hidden=!message;}
  function overview(){const scale=Math.min(viewport.clientWidth/width,viewport.clientHeight/height);return {scale,x:(viewport.clientWidth-width*scale)/2,y:(viewport.clientHeight-height*scale)/2};}
  function pose(f){const scale=Math.min(1.65,(viewport.clientWidth-32)/(f.w+12),(viewport.clientHeight-40)/(f.h+12));return {scale,x:(viewport.clientWidth-f.w*scale)/2-f.x*scale,y:(viewport.clientHeight-f.h*scale)/2-f.y*scale};}
  function paint(p){current=p;viewport.scrollTop=0;viewport.scrollLeft=0;Object.assign(camera.style,{left:`${p.x}px`,top:`${p.y}px`,transform:`scale(${p.scale})`});if(focus)Object.assign($('#spotlight').style,{left:`${p.x+focus.x*p.scale-6}px`,top:`${p.y+focus.y*p.scale-6}px`,width:`${focus.w*p.scale+12}px`,height:`${focus.h*p.scale+12}px`});}
  function animate(to,duration,alive){
    const from={...current},start=performance.now();
    return new Promise(resolve=>{function tick(now){if(!alive())return resolve();const t=reduced.matches?1:Math.min(1,(now-start)/duration),e=t*t*(3-2*t);paint(Object.fromEntries(['x','y','scale'].map(k=>[k,from[k]+(to[k]-from[k])*e])));if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
  }
  function copy(i){
    const c=chapters[i];$('#count').textContent=`${c.group.toUpperCase()} · ${i+1} / ${chapters.length}`;
    $('#headline').textContent=c.title;$('#description').textContent=profile==='mobile'&&c.mobile?c.mobile:c.description;
    $('#context').textContent=c.context;$('#focusLabel').textContent=c.label.toUpperCase();$('#pin').textContent=i+1;
    $('#pageCount').textContent=`${i+1} / ${chapters.length}`;$('#back').disabled=i===0;$('#next').textContent=i===last?'Replay ↺':'Next →';
    $('#openSection').href={Data:'playground.html',Stats:'statistics.html',ML:'ml.html',Learn:'learn.html'}[c.group];$('#openSection').textContent=`Open ${c.group==='Learn'?'Learn / Refresh':c.group} ↗`;
    buttons.forEach((b,n)=>{b.hidden=chapters[n].group!==c.group;b.classList.toggle('active',n===i);if(n===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    groupButtons.forEach((b,n)=>b.setAttribute('aria-pressed',String(groups[n]===c.group)));$('#progress').style.width=`${(i+1)/chapters.length*100}%`;
  }
  async function load(url,alive,chapter){
    const snapshot=`assets/tour-snapshots/${profile}-${chapter.scene}-${chapter.focus}.html`;
    if(frame.contentDocument?.URL.endsWith(snapshot) && frame.contentDocument.readyState==='complete'){camera.style.visibility='visible';return;}
    const previous=page===url?frame.contentDocument:null;
    const scrolls=previous?[...previous.querySelectorAll('[id]')].filter(n=>n.scrollTop||n.scrollLeft).map(n=>({id:n.id,top:n.scrollTop,left:n.scrollLeft})):[];
    const rootTop=previous?.scrollingElement.scrollTop||0;
    camera.style.visibility='hidden';page=url;frame.src=snapshot;
    await pages.until(()=>frame.contentDocument?.URL.endsWith(snapshot) && frame.contentDocument.readyState==='complete',alive);
    await frame.contentDocument.fonts.ready;if(!alive())return;
    for(const s of scrolls){const n=frame.contentDocument.getElementById(s.id);if(n){n.style.scrollBehavior='auto';n.scrollTop=s.top;n.scrollLeft=s.left;}}
    frame.contentDocument.scrollingElement.style.scrollBehavior='auto';frame.contentDocument.scrollingElement.scrollTop=rootTop;
    paint(overview());camera.style.visibility='visible';
  }
  function bounds(element){
    const r=element.getBoundingClientRect();let left=Math.max(0,r.left),top=Math.max(0,r.top),right=Math.min(width,r.right),bottom=Math.min(height,r.bottom);
    for(let p=element.parentElement;p && p!==frame.contentDocument.body;p=p.parentElement){const s=frame.contentWindow.getComputedStyle(p),b=p.getBoundingClientRect();if(s.display==='contents')continue;if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);}}
    return {x:left,y:top,w:Math.max(1,right-left),h:Math.max(1,bottom-top)};
  }
  async function reveal(element,alive){
    for(let p=element.parentElement;p;p=p.parentElement){if(p===frame.contentDocument.body)break;const style=frame.contentWindow.getComputedStyle(p);if(/auto|scroll/.test(style.overflowY)&&p.scrollHeight>p.clientHeight+1){const r=element.getBoundingClientRect(),b=p.getBoundingClientRect();if(r.top<b.top||r.bottom>b.bottom)await pages.scroll(p,p.scrollTop+r.top-b.top-24,alive);}}
    const root=frame.contentDocument.scrollingElement,r=element.getBoundingClientRect();if(r.top<0||r.bottom>height)await pages.scroll(root,root.scrollTop+r.top-70,alive);
  }
  async function show(i){
    const run=++token,alive=()=>run===token;index=i;ready=false;copy(i);status('');viewport.dataset.state='moving';viewport.dataset.phase='overview';$('#actionCue').hidden=true;$('#spotlight').style.opacity='0';$('#enlargePreview').disabled=true;
    try{
      if(page)await animate(overview(),750,alive);if(!alive())return;
      const c=chapters[i],loc=pages.locations[c.scene];await load(loc.page,alive,c);if(!alive())return;
      const d=frame.contentDocument,opening=pages.opening(c);
      // The actual gate sign, not its deliberately generous clickable hit area.
      if(c.focus==='gate')for(const n of d.querySelectorAll('.gate-glow,.gate-glow img')){n.style.animation='none';n.style.transform='none';}
      const panel=opening&&d.querySelector(opening.panel),button=opening&&d.querySelector(opening.button);
      const panelDisplay=panel?.dataset.tourDisplay??panel?.style.display;
      if(panel)panel.dataset.tourDisplay=panelDisplay;
      if(panel&&button){panel.style.display='none';button.setAttribute('aria-expanded','false');}
      viewport.dataset.page=loc.page;viewport.dataset.scene=c.scene;if(!reduced.matches)await pages.pause(350);if(!alive())return;
      if(panel&&button){
        await reveal(button,alive);if(!alive())return;focus=bounds(button);viewport.dataset.phase='button';
        $('#actionCue').textContent=`${profile==='mobile'?'Tap':'Click'} ${opening.label}`;$('#actionCue').hidden=false;
        $('#spotlight').style.opacity='1';await animate(pose(focus),650,alive);if(!alive())return;
        if(!reduced.matches)await pages.pause(750);if(!alive())return;
        $('#actionCue').hidden=true;$('#spotlight').style.opacity='0';
        await animate(overview(),550,alive);if(!alive())return;
        panel.style.display=panelDisplay;button.setAttribute('aria-expanded','true');viewport.dataset.phase='panel';
      }
      const element=await pages.prepare(frame,c,alive,status);if(!alive())return;
      status('');await reveal(element,alive);if(!alive())return;focus=bounds(element);
      if(focus.w<2||focus.h<2)throw Error('This section is not visible yet. Select this step to retry.');
      if(!reduced.matches)await pages.pause(250);$('#spotlight').style.opacity='1';await animate(pose(focus),1450,alive);if(!alive())return;
      camera.style.visibility='visible';ready=true;viewport.dataset.state='ready';$('#enlargePreview').disabled=false;
    }catch(error){if(alive()){status(error.message==='cancelled'?'':error.message);viewport.dataset.state='error';}}
  }
  function go(i){show(Math.max(0,Math.min(last,i)));}
  $('#back').onclick=()=>go(index-1);$('#next').onclick=()=>go(index===last?0:index+1);
  $('#showOverview').onclick=async()=>{if(!ready)return;const run=++token;$('#spotlight').style.opacity='0';await animate(overview(),900,()=>run===token);};
  document.addEventListener('keydown',e=>{if($('#previewDialog').open||e.altKey||e.ctrlKey||e.metaKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}});
  // Use intentional scroll gestures, not scroll events caused by a child page
  // focusing an editor. One gesture advances one stop and allows the camera to finish.
  let wheel=0,gestureAt=0,touchY=null;
  addEventListener('wheel',e=>{if($('#previewDialog').open||e.ctrlKey)return;e.preventDefault();if(!ready)return;const now=performance.now();if(now-gestureAt>300)wheel=0;gestureAt=now;wheel+=e.deltaY;if(Math.abs(wheel)>70){go(index+(wheel>0?1:-1));wheel=0;}},{passive:false});
  addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY;},{passive:true});
  addEventListener('touchend',e=>{if($('#previewDialog').open||!ready||touchY===null)return;const delta=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(delta)>65)go(index+(delta>0?1:-1));},{passive:true});
  // Preserve actual markup, all ancestors, selected values and original styles.
  // The enlarged snapshot has no scripts and starts no second Python runtime.
  $('#enlargePreview').onclick=()=>{
    if(!ready)return;const d=frame.contentDocument,clone=d.documentElement.cloneNode(true);
    const originals=[...d.querySelectorAll('*')],clones=[...clone.querySelectorAll('*')];
    const scrolls=originals.slice(1).map((n,i)=>({i,top:n.scrollTop,left:n.scrollLeft})).filter(s=>s.top||s.left);
    clone.querySelectorAll('script,base').forEach(n=>n.remove());
    const original=[...d.querySelectorAll('input,textarea,select')];
    clone.querySelectorAll('input,textarea,select').forEach((n,i)=>{const source=original[i];if(n.tagName==='SELECT')[...n.options].forEach(o=>o.toggleAttribute('selected',o.value===source.value));else if(n.tagName==='TEXTAREA')n.textContent=source.value;else n.setAttribute('value',source.value);});
    scrolls.forEach(s=>clones[s.i]?.setAttribute('data-tour-scroll',`${s.top},${s.left}`));
    const base=document.createElement('base');base.href=d.baseURI;clone.querySelector('head').prepend(base);
    clone.querySelectorAll('a,button,input,textarea,select').forEach(n=>n.setAttribute('inert',''));
    const snapshot=document.createElement('iframe');snapshot.title='Enlarged actual interface';snapshot.setAttribute('sandbox','allow-same-origin');snapshot.tabIndex=-1;snapshot.style.cssText=`width:${width}px;height:${height}px;border:0`;
    snapshot.onload=async()=>{if(!snapshot.isConnected)return;await snapshot.contentDocument.fonts.ready;if(!snapshot.isConnected)return;snapshot.contentDocument.querySelectorAll('[data-tour-scroll]').forEach(n=>{const [top,left]=n.dataset.tourScroll.split(',').map(Number);n.scrollTop=top;n.scrollLeft=left;});snapshot.contentWindow.scrollTo(frame.contentWindow.scrollX,frame.contentWindow.scrollY);$('#previewDetail').scrollLeft=Math.max(0,focus.x-20);$('#previewDetail').scrollTop=Math.max(0,focus.y-20);};
    snapshot.srcdoc='<!doctype html>'+clone.outerHTML;
    $('#previewTitle').textContent=`${chapters[index].group} · ${chapters[index].label}`;$('#previewDetail').replaceChildren(snapshot);$('#previewDialog').showModal();
  };
  $('#closePreview').onclick=()=>$('#previewDialog').close();$('#previewDialog').addEventListener('close',()=>$('#previewDetail').replaceChildren());
  function layout(){profile=requested==='mobile'||requested!=='wide'&&innerWidth<=1000?'mobile':'wide';document.body.dataset.layout=profile;width=profile==='mobile'?390:1440;height=profile==='mobile'?844:960;frame.style.width=`${width}px`;frame.style.height=`${height}px`;paint(overview());go(Math.max(0,index));}
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(layout,180);});layout();
})();
