/* First-party preference only. No advertising or consent SDK is loaded here. */
(() => {
  'use strict';
  const key = 'dspp-ad-free';
  const params = new URLSearchParams(location.search);
  const choice = params.get('ads');
  let adFree = choice === 'off';
  try {
    if (choice === 'off') sessionStorage.setItem(key, '1');
    else if (choice === 'on') sessionStorage.removeItem(key);
    else adFree = sessionStorage.getItem(key) === '1';
  } catch { /* URL propagation still works when storage is unavailable. */ }
  const native = !/^https?:$/.test(location.protocol) || location.hostname === 'localhost' || Boolean(window.Capacitor?.isNativePlatform?.());
  // Keep this false until site approval, consent, and placement review are complete.
  const advertisingEnabled = false;
  window.DataPlaygroundAds = Object.freeze({
    adFree,
    native,
    canLoadAdvertising: () => advertisingEnabled && !adFree && !native,
  });
  document.documentElement.dataset.adMode = adFree ? 'off' : 'standard';
  function preservePreference() {
    if (!adFree) return;
    document.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || link.hasAttribute('download')) return;
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) return;
      if (url.searchParams.has('ads')) return;
      url.searchParams.set('ads', 'off');
      link.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }
  function start() {
    preservePreference();
    new MutationObserver(preservePreference).observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
