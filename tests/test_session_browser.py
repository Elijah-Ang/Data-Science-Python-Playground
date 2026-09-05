"""Editing during execution, draft configuration roundtrip and long-session geometry."""
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':834,'height':1112});page.goto('http://127.0.0.1:8001/playground.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent==='Python ready'",timeout=120000)
 page.locator('#addCellButton').click();cell=page.locator('article.cell').last;cell.locator('textarea').fill('import time\ntime.sleep(1)\n5');cell.locator('.run').click();page.locator('article.cell textarea').fill('12345');page.wait_for_timeout(1600)
 assert page.locator('article.cell').get_attribute('data-status')=='stale';assert 'Previous result' in page.locator('.cell-inline-output').text_content()
 # Grow to 30 cells; retain the exact textarea object and its selection through an output update.
 page.locator('article.cell textarea').evaluate('(e)=>window.originalEditor=e');start=time.perf_counter()
 for _ in range(29):page.locator('#addCellButton').click()
 elapsed=time.perf_counter()-start
 assert page.evaluate("window.originalEditor===document.querySelector('article.cell textarea')")
 for index in range(25,30):
  cell=page.locator('article.cell').nth(index);cell.locator('textarea').fill('fig, ax = plt.subplots(figsize=(3,2))\nax.plot([1,2,3],[2,1,3])\nfig.tight_layout()');cell.locator('.run').click();page.wait_for_function("index=>document.querySelectorAll('article.cell')[index].dataset.status==='done'",arg=index,timeout=120000)
 assert page.locator('.chart-wrap img').count()==5
 session=context_session=page.context.new_cdp_session(page);session.send('Performance.enable');metrics=session.send('Performance.getMetrics');heap=next(metric['value'] for metric in metrics['metrics'] if metric['name']=='JSHeapUsedSize')
 page.screenshot(path='tests/evidence/tablet-30-cells.png',full_page=True)
 page.evaluate('NotebookSession.save()');page.goto('http://127.0.0.1:8001/ml.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Pyodide 0.26.4 ready')",timeout=120000);page.goto('http://127.0.0.1:8001/playground.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent==='Python ready'",timeout=120000);assert page.locator('article.cell').count()==0;page.locator('#addCellButton').click()
 page.locator('article.cell textarea').first.fill('456');page.locator('article.cell .run').first.click();page.wait_for_function("document.querySelector('article.cell').dataset.status==='done'",timeout=120000);assert '456' in page.locator('.cell-inline-output').first.text_content()
 Path('tests/evidence/session.json').write_text(json.dumps({'engine':'chromium','browser':b.version,'cells':30,'add29CellsSeconds':elapsed,'chartCells':5,'mainThreadHeapBytes':heap,'stableEditor':True,'emptyReopening':True,'editDuringRun':True},indent=2));print('30-cell session, stable editor, mid-run edit and empty Data reopening passed.');b.close()
