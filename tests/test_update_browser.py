"""Service-worker interrupted install/update and failed-storage preservation."""
from playwright.sync_api import sync_playwright
from pathlib import Path
with sync_playwright() as p:
 b=p.chromium.launch();context=b.new_context();page=context.new_page();base='http://127.0.0.1:8001'
 # A failed required precache asset prevents activation, rather than promoting a partial shell.
 context.route('**/ml-app.js',lambda route:route.abort())
 page.goto(base+'/index.html');page.wait_for_function("navigator.serviceWorker.getRegistration().then(r=>r && !r.installing)",timeout=30000)
 assert page.evaluate("navigator.serviceWorker.getRegistration().then(r=>!r.active)")
 context.unroute('**/ml-app.js');page.evaluate("navigator.serviceWorker.register('/service-worker.js')");page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_function('!!navigator.serviceWorker.controller',timeout=30000)
 page.goto(base+'/ml.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Pyodide 0.26.4 ready')",timeout=120000)
 page.locator('#addCellButton').click();page.locator('article.cell textarea').fill('important_unsaved_edit = 42')
 # Block local persistence, cancel the explicit discard decision, and retain the original setup/code.
 page.evaluate("() => {window.savedStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('test quota failure')};}")
 page.on('dialog',lambda dialog:dialog.dismiss())
 page.select_option('#datasetSelect','wine');assert page.locator('#datasetSelect').input_value()=='breast';assert page.locator('article.cell textarea').input_value()=='important_unsaved_edit = 42'
 page.evaluate('Storage.prototype.setItem=window.savedStorageSet;NotebookSession.save()')
 # Serve a new scoped worker version. The app exposes an explicit save/reload action.
 worker=Path('dist/service-worker.js');original=worker.read_text()
 try:
  worker.write_text(original.replace('dspp-app-shell-','dspp-app-shell-update-test-'))
  page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())')
  page.wait_for_function('navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)',timeout=30000)
 finally:
  worker.write_text(original)
 page.locator('.app-update').wait_for(timeout=30000)
 page.evaluate("() => {Storage.prototype.setItem=()=>{throw new Error('test update quota failure')};}")
 page.locator('.app-update').click()
 assert page.evaluate('navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)')
 assert page.locator('article.cell textarea').input_value()=='important_unsaved_edit = 42'
 page.evaluate('Storage.prototype.setItem=window.savedStorageSet;NotebookSession.save()')
 page.locator('.app-update').click();page.wait_for_load_state('load');page.wait_for_function("document.querySelector('article.cell textarea')?.value==='important_unsaved_edit = 42'",timeout=120000)
 assert page.locator('.output-item').count()==0
 print('Interrupted precache prevented activation; retry recovered; failed storage/setup and update cancellation retained code; explicit update restored the edited draft.');b.close()
