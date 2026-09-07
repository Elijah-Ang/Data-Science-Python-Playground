// Cloudflare Worker-level Access must protect ALL production and preview traffic.
// ctx.access is populated by Cloudflare, not by client-supplied headers.
const OWNER = 'elijahang77@gmail.com';
const ORIGIN = 'https://dataplayground.science';
const HOSTS = new Set(['private.dataplayground.science', 'data-playground-private.elijahang77.workers.dev']);
const PRIVATE_AD_MODE = `(() => {
  window.DataPlaygroundAds = Object.freeze({adFree:true,native:false,canLoadAdvertising:()=>false});
  document.documentElement.dataset.adMode = 'off';
})();`;

function response(body, status = 200, type = 'text/plain; charset=utf-8') {
  return new Response(body, {status, headers: {
    'content-type': type, 'cache-control': 'private, no-store',
    'x-robots-tag': 'noindex, nofollow, noarchive',
    'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff',
  }});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!HOSTS.has(url.hostname)) return response('Not found', 404);
    // Fail closed if Access is removed, unavailable, or the caller is not the owner.
    try {
      if (!ctx?.access || (await ctx.access.getIdentity())?.email?.toLowerCase() !== OWNER) {
        return response('Please sign in with the owner email.', 403);
      }
    } catch { return response('Authentication unavailable. Please try again.', 503); }
    if (!['GET', 'HEAD'].includes(request.method)) return response('Method not allowed', 405);
    if (url.pathname === '/robots.txt') return response('User-agent: *\nDisallow: /\n');
    if (url.pathname === '/ads.txt') return response('', 404);
    if (url.pathname === '/ad-mode.js') return response(PRIVATE_AD_MODE, 200, 'text/javascript; charset=utf-8');
    // Do not cache a protected copy for offline access after the login expires.
    if (url.pathname === '/service-worker.js') return response(
      "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));",
      200, 'text/javascript; charset=utf-8');
    const target = new URL(ORIGIN);
    target.pathname = url.pathname;
    target.search = url.search;
    target.searchParams.delete('ads');
    target.searchParams.delete('adpreview');
    // Never forward login cookies, JWTs, user email, or incoming arbitrary headers.
    let upstream;
    try {
      upstream = await fetch(target, {method: request.method, redirect:'manual',
        headers: {'accept': request.headers.get('accept') || '*/*'}});
    } catch { return response('The public site is temporarily unavailable.', 502); }
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (!location) return response('Invalid origin redirect', 502);
      const redirect = new URL(location, target);
      if (redirect.origin !== ORIGIN) return response('Unexpected origin redirect', 502);
      redirect.host = url.host;
      const result = response(null, upstream.status);
      result.headers.set('location', redirect.href);
      return result;
    }
    const result = response(upstream.body, upstream.status,
      upstream.headers.get('content-type') || 'application/octet-stream');
    if (request.method === 'HEAD' || !result.headers.get('content-type').includes('text/html')) return result;
    // Strip ad integrations in addition to the hard-disabled first-party ad module.
    return new HTMLRewriter()
      .on('script[src*="googlesyndication.com"], script[src*="doubleclick.net"], script[src*="fundingchoicesmessages.google.com"], .footer-ad, ins.adsbygoogle', {element(el) { el.remove(); }})
      .on('head', {element(el) { el.append('<meta name="robots" content="noindex,nofollow,noarchive">', {html:true}); }})
      .transform(result);
  },
};
