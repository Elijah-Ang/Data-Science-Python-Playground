"""The production worker ignores hosting metadata, while required assets stay strict."""
import json
import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urljoin
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
worker = (DIST / 'service-worker.js').read_text()
precache = json.loads(re.search(r'const APP_SHELL = (\[[^;]+\]);', worker)[1])
manifest = json.loads((DIST / 'asset-manifest.json').read_text())
assert (DIST / '.nojekyll').is_file()
assert './.nojekyll' not in precache
assert all(row['path'] != '.nojekyll' for row in manifest['files'])

def scenario(browser, missing_public_asset):
    blocked = {'/.nojekyll'} | ({'/ml-app.js'} if missing_public_asset else set())
    requests = []
    cancelled = []
    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            path = urlsplit(self.path).path
            requests.append(path)
            try:
                if path in blocked:
                    self.send_error(404)
                else:
                    super().do_GET()
            except (BrokenPipeError, ConnectionResetError):
                # Failed installs/context cleanup can cancel outstanding fetches.
                cancelled.append(path)
        def log_message(self, *args):
            pass
    # A localhost subdomain is trustworthy and exercises the unchanged production
    # worker branch rather than the intentionally uncached local-preview branch.
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(DIST)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://cache-test.localhost:{server.server_port}'
    context = browser.new_context(service_workers='allow')
    try:
        page = context.new_page()
        page.goto(base + '/offline.html', wait_until='domcontentloaded')
        assert page.evaluate('isSecureContext')
        assert context.request.get(f'http://127.0.0.1:{server.server_port}/.nojekyll').status == 404
        result = page.evaluate('''async () => {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            const worker = registration.installing || registration.waiting || registration.active;
            const state = await Promise.race([
                new Promise(resolve => {
                    const check = () => ['activated', 'redundant'].includes(worker.state) && resolve(worker.state);
                    worker.addEventListener('statechange', check); check();
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Worker installation timed out')), 60000))
            ]);
            return {state, active: !!registration.active};
        }''')
        metadata_requests = requests.count('/.nojekyll')
        assert metadata_requests == 1, 'Worker must not fetch the nonserved metadata marker'
        if missing_public_asset:
            assert result == {'state': 'redundant', 'active': False}, result
            assert page.evaluate('navigator.serviceWorker.controller === null')
            assert '/ml-app.js' in requests
            return {'missing_public_asset': True, 'state': result['state'], 'metadata_requests': metadata_requests, 'cancelled_server_requests': cancelled}
        assert result == {'state': 'activated', 'active': True}, result
        page.wait_for_function('!!navigator.serviceWorker.controller')
        cached = page.evaluate('''async () => {
            const names = (await caches.keys()).filter(name => name.startsWith('dspp-app-shell-'));
            return (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))).flat();
        }''')
        expected = {urljoin(base + '/', url) for url in precache}
        assert set(cached) == expected, (len(cached), len(expected), sorted(expected - set(cached)))
        context.set_offline(True)
        for name, selector in [('help.html', 'body'), ('data-foundations-I02.html', '.foundation-lesson-heading h2')]:
            page.goto(base + '/' + name, wait_until='domcontentloaded')
            assert page.locator(selector).is_visible()
            assert 'You are offline' not in page.title()
        return {'missing_public_asset': False, 'state': result['state'], 'cached_urls': len(cached), 'metadata_requests': metadata_requests, 'offline_shells': 2, 'cancelled_server_requests': cancelled}
    finally:
        context.close()
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    results = [scenario(browser, False), scenario(browser, True)]
    browser.close()
print(json.dumps({'all_pass': True, 'contentId': manifest['contentId'], 'cases': results}, indent=2))
