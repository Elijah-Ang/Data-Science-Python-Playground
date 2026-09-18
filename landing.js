(() => {
  "use strict";

  const frame = document.querySelector("[data-scene]");
  const gate = frame?.querySelector(".gate-hitbox");
  if (!frame || !gate) return;

  // Wayfinding only: native fragment navigation focuses the destination link
  // in some browsers, which adds an unwanted arrival outline.
  document.querySelectorAll('.blimp-choice[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches) {
        const bounds = target.getBoundingClientRect();
        const desired = window.scrollY + bounds.top + bounds.height / 2 - window.innerHeight / 2;
        const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: Math.max(0, Math.min(desired, maximum)), behavior: "instant" });
      } else {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    });
  });

  const blimp=document.querySelector('.welcome-blimp');
  const rigging=blimp?.querySelector('.blimp-rigging');
  function alignRigging(){
    if(!rigging || !window.matchMedia('(max-width:700px)').matches)return;
    const box=blimp.getBoundingClientRect(),flag=blimp.querySelector('.blimp-flag').getBoundingClientRect();
    const ends=[flag.left-box.left+flag.width*.044,flag.right-box.left-flag.width*.044];
    const y=flag.top-box.top+flag.height*.067-134;
    rigging.style.height=Math.max(60,y+5)+'px';
    rigging.querySelectorAll('line').forEach((line,i)=>{
      const side=i%2;
      line.setAttribute('x1',box.width-(side?85:130));line.setAttribute('y1','0');
      line.setAttribute('x2',ends[side]);line.setAttribute('y2',y);
    });
  }
  if(blimp){new ResizeObserver(alignRigging).observe(blimp);alignRigging();}

  gate.addEventListener("click", event => {
    // Preserve normal new-tab, download, and assistive-technology behaviour.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (frame.classList.contains("is-entering")) return;
    frame.classList.add("is-entering");
    gate.setAttribute("aria-busy", "true");
    window.setTimeout(() => { window.location.assign(gate.href); }, 220);
  });

  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    frame.classList.remove("is-entering");
    gate.removeAttribute("aria-busy");
    window.location.reload();
  });
})();
