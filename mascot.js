/* Decode offscreen, then swap one visible pose on the anchored character. */
(() => {
  'use strict';
  const poses = {
    book: {src:'assets/mascot/robot-book.png',x:8,y:0,scale:1,lean:0,lift:0},
    wave: {src:'assets/mascot/robot-wave.png',x:3.5,y:-3.7,scale:1.098,lean:-.8,lift:-2},
    teach: {src:'assets/mascot/robot-teach.png',x:1.8,y:-2.95,scale:.907,lean:.6,lift:-1},
    think: {src:'assets/mascot/robot-think.png',x:-.4,y:-2.54,scale:1.093,lean:1.2,lift:1},
    code: {src:'assets/mascot/robot-code.png',x:0,y:4.23,scale:.989,lean:-.5,lift:2},
    celebrate: {src:'assets/mascot/robot-celebrate.png',x:-2.2,y:-1.62,scale:1.073,lean:0,lift:-3}
  };
  // Return to the book between gestures. Special poses occur once per long cycle.
  const sequence = [['book',1800],['wave',1200],['book',2100],['think',1500],['book',1900],['teach',1300],['book',2200],['code',1600],['book',2100],['celebrate',1100]];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function mount(host) {
    const layers=[...host.querySelectorAll('.mascot-layer')], target=host.closest('a')||host;
    if(layers.length!==2)return;
    let active=0,index=0,timer=null,transition=null,token=0,engaged=false,away=false;
    const decoded=new Map();
    function load(name){
      if(!decoded.has(name)){
        const image=new Image();image.src=poses[name].src;
        decoded.set(name,image.decode().then(()=>image).catch(()=>{decoded.delete(name);return null;}));
      }
      return decoded.get(name);
    }
    function apply(layer,name){
      const p=poses[name];layer.src=p.src;layer.dataset.pose=name;
      layer.style.setProperty('--pose-x',p.x+'%');layer.style.setProperty('--pose-y',p.y+'%');layer.style.setProperty('--pose-scale',p.scale);
    }
    function stopped(){return away||document.hidden||reduced.matches;}
    function clear(){clearTimeout(timer);timer=null;}
    function settle(){
      token++;transition?.cancel();transition=null;
      layers.forEach((layer,i)=>{layer.style.opacity=i===active?'1':'0';layer.style.zIndex=i===active?'1':'0';layer.style.transform='none';});
      host.dataset.transition='idle';
      host.dataset.pose=layers[active].dataset.pose;
    }
    function schedule(){clear();if(!stopped()&&!engaged)timer=setTimeout(()=>{index=(index+1)%sequence.length;show(sequence[index][0]);},sequence[index][1]);}
    async function show(name,stationary=false){
      clear();settle();
      const interrupted=()=>away||document.hidden||(reduced.matches&&!stationary);
      if(interrupted())return;
      if(layers[active].dataset.pose===name){schedule();return;}
      const request=token;const image=await load(name);
      if(request!==token||interrupted())return;
      if(!image){schedule();return;}
      const outgoing=layers[active],incoming=layers[1-active],pose=poses[name];apply(incoming,name);
      // Decoding a preload does not guarantee that the displayed layer is ready.
      // Keep the current pose intact if decoding is delayed or fails.
      try { await incoming.decode(); } catch { if(request===token&&!interrupted())schedule();return; }
      if(request!==token||interrupted())return;
      // Swap decoded artwork atomically. Motion belongs only to the new pose;
      // a crossfade would draw two robots and queue stale interaction requests.
      outgoing.style.opacity='0';outgoing.style.zIndex='0';
      incoming.style.opacity='1';incoming.style.zIndex='1';active=1-active;
      host.dataset.transition='moving';host.dataset.pose=name;
      if(stationary){settle();return;}
      transition=incoming.animate([
        {transform:`translate(.5px,${pose.lift*.5}px) rotate(${pose.lean*.5}deg) scale(.996)`},
        {transform:'none'}
      ],{duration:180,easing:'cubic-bezier(.4,0,.2,1)'});
      await transition.finished.catch(()=>{});
      if(request!==token)return;
      settle();schedule();
    }
    function sync(){
      clear();settle();host.dataset.paused=String(stopped());
      engaged=target.matches(':hover,:focus-within');
      if(reduced.matches)show('book',true);
      else if(!stopped()){if(engaged)show('teach');else schedule();}
    }
    function react(){if(stopped()||engaged)return;engaged=true;show('teach');}
    function relax(){if(target.matches(':hover,:focus-within'))return;engaged=false;if(!stopped())show('book');}
    apply(layers[0],'book');apply(layers[1],'book');layers[0].style.opacity='1';layers[1].style.opacity='0';
    target.addEventListener('pointerenter',react);target.addEventListener('pointerleave',relax);
    target.addEventListener('focusin',react);target.addEventListener('focusout',()=>queueMicrotask(relax));
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
    window.addEventListener('pagehide',()=>{away=true;sync();});
    window.addEventListener('pageshow',()=>{away=false;sync();});
    // Predecode during the first dwell. Failed poses leave the current robot intact.
    if(!reduced.matches)Object.keys(poses).forEach(load);
    sync();
  }
  document.querySelectorAll('[data-mascot]').forEach(mount);
})();
