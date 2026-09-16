(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const {chapters, scenes} = window.TOUR_CONTENT;
  const last = chapters.length - 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const requestedMode = new URLSearchParams(location.search).get('view');
  const mode = ['mobile','wide'].includes(requestedMode) ? requestedMode : null;
  let profile = 'wide', index = -1, pending = false, imageKey = '', loadId = 0;
  let progressAt = 0, hasLayout = false;
  const groups = [...new Set(chapters.map(c => c.group))];
  $('#journey').style.height = `${(chapters.length + 1) * 100}vh`;
  const stepButtons = chapters.map((chapter, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(i + 1).padStart(2, '0');
    button.setAttribute('aria-label', `${chapter.group}: ${chapter.label}`);
    button.addEventListener('click', () => go(i));
    $('.steps').append(button);
    return button;
  });
  const groupButtons = groups.map(group => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = group === 'Stats' ? 'Statistics' : group;
    button.setAttribute('aria-label', `Tour ${group}`);
    button.addEventListener('click', () => go(chapters.findIndex(c => c.group === group)));
    $('.tour-sections').append(button);
    return button;
  });
  function scrollHeight() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  function go(i) {
    window.scrollTo({top: Math.max(0,Math.min(last,i)) / last * scrollHeight(), behavior: reduced.matches ? 'instant' : 'smooth'});
  }
  $('#back').addEventListener('click', () => go(index - 1));
  $('#next').addEventListener('click', () => go(index === last ? 0 : index + 1));
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
  });
  function target(i) { const c = chapters[i]; return scenes[c.scene][profile].targets[c.focus]; }
  function pose(f) {
    const v = $('.viewport');
    const scale = Math.min(profile === 'mobile' ? 1.12 : 1.6, (v.clientWidth-32)/(f.w+12), (v.clientHeight-40)/(f.h+12));
    return {scale, x: (v.clientWidth-f.w*scale)/2-f.x*scale, y: (v.clientHeight-f.h*scale)/2-f.y*scale};
  }
  function setImage(chapter) {
    const nextKey = `${profile}-${chapter.scene}`;
    if (nextKey === imageKey) return;
    imageKey = nextKey;
    const request = ++loadId;
    const image = $('#siteCapture');
    const dimensions = scenes[chapter.scene][profile];
    const preload = new Image();
    $('#camera').style.opacity = '0';
    $('#spotlight').style.opacity = '0';
    preload.onload = () => {
      if (request !== loadId) return;
      image.src = preload.src;
      image.style.width = `${dimensions.width}px`;
      image.width = dimensions.width;
      image.height = dimensions.height;
      const current = chapters[Math.max(0,index)];
      image.alt = `${current.group} guide: ${current.title} — captured ${profile === 'mobile' ? 'phone' : 'desktop'} interface`;
      $('#camera').style.opacity = '1';
      $('#spotlight').style.opacity = '1';
    };
    preload.onerror = () => { if (request === loadId) $('#context').textContent = 'Preview could not load. The instructions and section links still work.'; };
    preload.src = `assets/tour-captures/v2-${nextKey}.jpg`;
  }
  function render() {
    pending = false;
    const progress = Math.max(0,Math.min(last,scrollY/scrollHeight()*last));
    progressAt = progress;
    const next = Math.round(progress), c = chapters[next];
    if (next !== index) {
      index = next;
      $('#count').textContent = `${c.group.toUpperCase()} · ${next+1} / ${chapters.length}`;
      $('#headline').textContent = c.title;
      $('#siteCapture').alt = `${c.group} guide: ${c.title} — captured ${profile === 'mobile' ? 'phone' : 'desktop'} interface`;
      $('#description').textContent = profile === 'mobile' && c.mobile ? c.mobile : c.description;
      $('#context').textContent = c.context;
      $('#focusLabel').textContent = c.label.toUpperCase();
      $('#pageCount').textContent = `${next+1} / ${chapters.length}`;
      $('#pin').textContent = next+1;
      $('#back').disabled = next === 0;
      $('#next').textContent = next === last ? 'Replay ↺' : 'Next →';
      $('#openSection').href = {Data:'playground.html',Stats:'statistics.html',ML:'ml.html',Learn:'learn.html'}[c.group];
      $('#openSection').textContent = `Open ${c.group === 'Learn' ? 'Learn / Refresh' : c.group} ↗`;
      stepButtons.forEach((b,i) => {
        b.hidden = chapters[i].group !== c.group;
        b.classList.toggle('active',i === next);
        if (i === next) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current');
      });
      groupButtons.forEach((b,i) => b.setAttribute('aria-pressed',String(groups[i] === c.group)));
    }
    setImage(c);
    let focus = target(next), position = pose(focus);
    const lower = Math.floor(progress), upper = Math.min(last,lower+1);
    // Never pan between unrelated coordinate systems on different pages.
    if (!reduced.matches && chapters[lower].scene === chapters[upper].scene) {
      const t = progress-lower, blend = t*t*(3-2*t);
      const a = target(lower), b = target(upper), pa = pose(a), pb = pose(b);
      focus = Object.fromEntries(['x','y','w','h'].map(k => [k,a[k]+(b[k]-a[k])*blend]));
      position = Object.fromEntries(['x','y','scale'].map(k => [k,pa[k]+(pb[k]-pa[k])*blend]));
    }
    $('#camera').style.transform = `translate(${position.x}px,${position.y}px) scale(${position.scale})`;
    Object.assign($('#spotlight').style,{left:`${position.x+focus.x*position.scale-6}px`,top:`${position.y+focus.y*position.scale-6}px`,width:`${focus.w*position.scale+12}px`,height:`${focus.h*position.scale+12}px`});
    $('#progress').style.width = `${(progress+1)/chapters.length*100}%`;
  }
  function layout() {
    const previousProgress = progressAt;
    profile = mode === 'mobile' || (!mode && innerWidth <= 1000) ? 'mobile' : 'wide';
    document.body.dataset.layout = profile;
    if (hasLayout) window.scrollTo({top:previousProgress/last*scrollHeight(),behavior:'instant'});
    hasLayout = true;
    index = -1;
    render();
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(render); } },{passive:true});
  addEventListener('resize',layout);
  reduced.addEventListener('change',render);
  layout();
})();
