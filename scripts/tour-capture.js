// Maintainer-only capture UI. Python runs here, never in the published tour.
document.querySelector('#start').onclick=async()=>{
  const frame=document.querySelector('#frame'),status=document.querySelector('#status');
  document.querySelector('#start').disabled=true;
  try {
    for(const profile of ['wide','mobile']) {
      frame.style.width=(profile==='wide'?1440:390)+'px';frame.style.height=(profile==='wide'?960:844)+'px';
      let page='';
      for(const [index,chapter] of window.TOUR_CONTENT.chapters.entries()) {
        const loc=window.TOUR_PAGES.locations[chapter.scene];
        status.textContent=`${profile} ${index+1}: ${chapter.title}`;
        if(page!==loc.page){page=loc.page;frame.src=page+'?tour=1';await window.TOUR_PAGES.until(()=>frame.contentDocument?.URL.includes(page+'?tour=1')&&frame.contentDocument.readyState==='complete',()=>true);}
        await window.TOUR_PAGES.prepare(frame,chapter,()=>true,()=>{});
        const d=frame.contentDocument,clone=d.documentElement.cloneNode(true);
        // Freeze values and canvas output using actual rendered application nodes.
        const originals=[...d.querySelectorAll('input,textarea,select')];
        clone.querySelectorAll('input,textarea,select').forEach((n,i)=>{const s=originals[i];if(n.tagName==='SELECT')[...n.options].forEach((o,j)=>o.toggleAttribute('selected',s.options[j].selected));else if(n.tagName==='TEXTAREA')n.textContent=s.value;else{n.setAttribute('value',s.value);n.toggleAttribute('checked',s.checked);}});
        const canvases=[...d.querySelectorAll('canvas')];
        clone.querySelectorAll('canvas').forEach((n,i)=>{const img=d.createElement('img');for(const a of [...n.attributes])img.setAttribute(a.name,a.value);img.src=canvases[i].toDataURL();img.width=canvases[i].width;img.height=canvases[i].height;n.replaceWith(img);});
        clone.querySelectorAll('[src],[href]').forEach(n=>{for(const key of ['src','href']){const value=n.getAttribute(key);if(value?.startsWith(location.origin+'/'))n.setAttribute(key,value.slice(location.origin.length+1));}});
        clone.querySelectorAll('script,base,link[rel="modulepreload"],link[rel="preload"][as="script"]').forEach(n=>n.remove());
        clone.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])if(/^on/i.test(a.name)||/^javascript:/i.test(a.value))n.removeAttribute(a.name);});
        const base=d.createElement('base');base.href='../../';clone.querySelector('head').prepend(base);
        const robots=d.createElement('meta');robots.name='robots';robots.content='noindex';clone.querySelector('head').append(robots);
        clone.querySelectorAll('a,button,input,textarea,select,form').forEach(n=>n.setAttribute('inert',''));
        const result=await fetch('/__capture/'+profile+'-'+chapter.scene+'-'+chapter.focus+'.html',{method:'POST',headers:{'Content-Type':'text/html'},body:'<!doctype html>'+clone.outerHTML});
        if(!result.ok)throw Error('Saving snapshot failed');
      }
    }
    status.textContent='Complete: 50 exact snapshots saved.';
  }catch(e){status.textContent='Error: '+e.message;}finally{document.querySelector('#start').disabled=false;}
};
