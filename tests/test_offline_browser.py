"""The shell works offline; unrelated origin caches are preserved."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(); context=b.new_context();page=context.new_page();page.goto('http://127.0.0.1:8001/index.html')
 page.evaluate("caches.open('unrelated-user-app').then(c=>c.put('/unrelated',new Response('keep'))) ")
 page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_function('navigator.serviceWorker.controller!==null',timeout=30000)
 context.set_offline(True)
 for file in ['playground.html','ml.html','help.html']:
  page.goto('http://127.0.0.1:8001/'+file);assert page.locator('body').is_visible();assert 'You are offline' not in page.title()
 assert page.evaluate("caches.has('unrelated-user-app')")
 print('Landing-only visit → offline: Data, ML and Help shells available; unrelated cache retained. Web Python offline availability is not promised.')
 b.close()
