/* Fail-closed advertising policy. No advertising or consent SDK loads here. */
(() => {
  'use strict';
  const key = 'dspp-ad-free';
  const params = new URLSearchParams(location.search);
  // A same-origin tour frame is a disposable demonstration, never a user notebook.
  let tourEmbed = false;
  try { tourEmbed = window.parent !== window && params.get('tour') === '1' && /\/tutorial\.html$/.test(window.parent.location.pathname); } catch {}
  window.DataPlaygroundTourEmbed = tourEmbed;
  // Cloudflare enforces private access; a URL parameter is not authentication.
  const adFree = location.hostname === 'private.dataplayground.science';
  try { sessionStorage.removeItem(key); } catch { /* Storage is optional. */ }
  const native = !/^https?:$/.test(location.protocol) || location.hostname === 'localhost' || Boolean(window.Capacitor?.isNativePlatform?.());
  // Keep this false until site approval, consent, and placement review are complete.
  const advertisingEnabled = false;
  window.DataPlaygroundAds = Object.freeze({
    adFree,
    native,
    canLoadAdvertising: () => advertisingEnabled && !adFree && !native && !tourEmbed,
  });
  document.documentElement.dataset.adMode = adFree ? 'off' : 'standard';
  function start() {
    // Opt-in visual draft only: no SDK, impressions, or third-party requests.
    if (params.get('adpreview') === 'footer' && !adFree && !native) {
      const footer = document.querySelector('.footer');
      const slot = footer?.querySelector('.footer-ad');
      if (slot) {
        footer.dataset.adPreview = 'footer';
        slot.hidden = false;
        new ResizeObserver(() => {
          document.body.style.setProperty('--footer-preview-height', `${footer.getBoundingClientRect().height}px`);
        }).observe(footer);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
