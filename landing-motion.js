/* Animate independent sprites over an always-visible image; no GPU swap. */
(() => {
  'use strict';
  const scene = document.querySelector('[data-scene]');
  if (!scene) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let away = false;
  function sync() {
    const paused = away || document.hidden || reduced.matches;
    scene.dataset.paused = String(paused);
    scene.dataset.motion = reduced.matches ? 'static' : 'ready';
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { away = true; sync(); });
  window.addEventListener('pageshow', () => { away = false; sync(); });
  sync();
})();
