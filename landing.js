(() => {
  'use strict';
  const frame = document.querySelector('[data-scene]');
  const gate = frame?.querySelector('.gate-hitbox');
  if (!frame || !gate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const isPlainClick = event => !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  document.querySelectorAll('.blimp-choice[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (!isPlainClick(event)) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block: 'center'});
      target.focus({preventScroll: true});
      target.classList.add('is-wayfinding');
      setTimeout(() => target.classList.remove('is-wayfinding'), 2400);
    });
  });
  gate.addEventListener('click', event => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    if (frame.classList.contains('is-entering')) return;
    frame.classList.add('is-entering');
    gate.setAttribute('aria-busy', 'true');
    setTimeout(() => location.assign(gate.href), reduced.matches ? 0 : 220);
  });
  window.addEventListener('pageshow', () => {
    frame.classList.remove('is-entering');
    gate.removeAttribute('aria-busy');
  });
})();
