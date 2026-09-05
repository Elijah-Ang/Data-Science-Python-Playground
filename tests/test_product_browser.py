"""Rendered public navigation, notebook trust, recovery and responsive regressions."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--engine',default='chromium');parser.add_argument('--base-url',default='http://127.0.0.1:8001');args=parser.parse_args()
results=[]
with sync_playwright() as p:
 browser=getattr(p,args.engine).launch(); context=browser.new_context();page=context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [390,834,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for name in ['help','about','privacy','acknowledgements','tutorial']:
   page.goto(f'{args.base_url}/{name}.html');page.wait_for_timeout(100)
   if name == 'tutorial':
    home = page.locator('a.home-link')
    assert home.count() == 1 and home.is_visible()
    assert home.get_attribute('href') == 'index.html'
    assert page.locator('.steps button').count() == 7
    page.wait_for_function("document.querySelector('#siteCapture')?.naturalWidth > 0", timeout=10000)
    assert page.locator('#next').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), (width, name)
    results.append([width, name, 'guided tour navigation and seven chapters passed'])
    continue
   links=page.locator('.home-nav a'); assert links.count()>=3
   for link in links.all():
    assert link.is_visible(); assert float(link.evaluate('(e)=>getComputedStyle(e).fontSize').replace('px',''))>=12
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'),(width,name)
   results.append([width,name,'navigation passed'])
 page.set_viewport_size({'width':390,'height':844});page.goto(args.base_url+'/playground.html')
 page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')",timeout=120000)
 def run_data(code):
  page.locator('#addCellButton').click(); cell=page.locator('article.cell').last;cell.locator('textarea').fill(code);cell.locator('.run').click()
  page.wait_for_function("['done','error'].includes([...document.querySelectorAll('article.cell')].at(-1).dataset.status)",timeout=120000)
  return page.locator('article.cell').last
 run_data('df.describe().T')
 assert 'Rented Bike Count' in page.locator('.cell-inline-output').last.inner_text()
 cell=page.locator('article.cell').last;cell.locator('textarea').fill('df.head(2)'); page.locator('.cell-inline-output').last.scroll_into_view_if_needed(); assert 'Previous result' in page.locator('.cell-inline-output').last.inner_text()
 run_data('saved_marker=42\npd=None\nnp=None\nplt=None\ndf=None\noriginal_df=None')
 page.locator('#resetButton').click();page.wait_for_function("document.querySelector('#outputStatus').textContent==='Reset complete'")
 assert page.locator('article.cell').count()==2
 run_data("assert 'saved_marker' not in globals()\nassert len(df)==8760\ndf.head(1)")
 assert page.locator('article.cell').last.get_attribute('data-status')=='done'
 # Terminating an actual nonterminating cell must recover without losing code.
 page.locator('#addCellButton').click();page.locator('article.cell').last.locator('textarea').fill('while True:\n    pass');page.locator('article.cell').last.locator('.run').click();page.wait_for_timeout(300)
 page.locator('#restartPythonButton').click();page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')",timeout=120000)
 assert page.locator('article.cell').count()==4
 run_data('df.head(1)'); assert page.locator('article.cell').last.get_attribute('data-status')=='done'
 page.locator('article.cell').last.locator('.delete').click();page.get_by_role('button',name='Undo delete',exact=True).click();assert page.locator('article.cell').count()==5
 page.evaluate('NotebookSession.save()');page.reload();page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')",timeout=120000);assert page.locator('article.cell').count()==0
 assert page.locator('.output-item').count()==0
 for width in [320,390,820,834,1024]:
  page.set_viewport_size({'width':width,'height':900});page.evaluate('scrollTo(0,0)');page.wait_for_timeout(100)
  route=page.locator('#suggestedRoute').bounding_box(); actions=page.locator('.notebook-actions').bounding_box(); assert route and actions and route['y']>=actions['y']+actions['height']-1,(width,route,actions)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),width
 results.append(['data','trust, restart, empty reopening, undo and route layout passed'])
 page.set_viewport_size({'width':1440,'height':1000});page.goto(args.base_url+'/ml.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Pyodide 0.26.4 ready')",timeout=120000)
 page.locator('#runAllButton').click();page.wait_for_function("document.querySelectorAll('article.cell').length>=9 && [...document.querySelectorAll('article.cell')].every(e=>e.dataset.status==='done')",timeout=180000)
 first=page.locator('article.cell').first; first.locator('textarea').fill(first.locator('textarea').input_value()+'\n# upstream edit')
 downstream=page.locator('article.cell').nth(5);downstream.locator('.run').dispatch_event('click');page.wait_for_timeout(200);assert downstream.get_attribute('data-status')!='done'
 downstream.locator('textarea').press('Control+Enter');page.wait_for_timeout(200);assert downstream.get_attribute('data-status')!='done'
 assert not errors,errors
 results.append(['ml','cell button and shortcut prerequisite enforcement passed'])
 Path('tests/evidence').mkdir(exist_ok=True);Path(f'tests/evidence/product-{args.engine}.json').write_text(json.dumps({'engine':args.engine,'browser':browser.version,'results':results},indent=2));browser.close()
 print(json.dumps(results))
