/* Two decoded pose layers, one anchored character. No tracking or stored state. */
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
    let active=0,index=0,timer=null,transition=null,token=0,engaged=false,away=false,pending=null;
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
      token++;transition?.forEach(a=>a.cancel());transition=null;
      layers.forEach((layer,i)=>{layer.style.opacity=i===active?'1':'0';layer.style.transform='none';});
      host.dataset.transition='idle';
    }
    function schedule(){clear();if(!stopped()&&!engaged)timer=setTimeout(()=>{index=(index+1)%sequence.length;show(sequence[index][0]);},sequence[index][1]);}
    async function show(name){
      clear();if(stopped())return;
      if(transition){pending=name;return;}
      if(layers[active].dataset.pose===name){schedule();return;}
      settle();const request=token;const image=await load(name);
      if(!image||request!==token||stopped()){schedule();return;}
      const outgoing=layers[active],incoming=layers[1-active],pose=poses[name];apply(incoming,name);
      // The image inside each layer carries its alignment; the layer itself only moves a few pixels.
      const options={duration:300,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'};
      host.dataset.transition='blending';host.dataset.pose=name;
      const fadeOut=outgoing.animate([{opacity:1,transform:'translate(0,0) rotate(0) scale(1)'},{opacity:0,transform:`translate(0,${-pose.lift*.5}px) rotate(${-pose.lean*.5}deg) scale(.996)`}],options);
      const fadeIn=incoming.animate([{opacity:0,transform:`translate(.5px,${pose.lift*.5}px) rotate(${pose.lean*.5}deg) scale(.996)`},{opacity:1,transform:'translate(0,0) rotate(0) scale(1)'}],options);
      transition=[fadeOut,fadeIn];
      await Promise.all(transition.map(a=>a.finished.catch(()=>{})));
      if(request!==token)return;
      active=1-active;settle();
      if(pending){const next=pending;pending=null;show(next);}else schedule();
    }
    function sync(){
      clear();pending=null;settle();host.dataset.paused=String(stopped());
      if(reduced.matches){active=0;apply(layers[0],'book');layers[0].style.opacity='1';layers[1].style.opacity='0';host.dataset.pose='book';}
      else if(!stopped())schedule();
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
