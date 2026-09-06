import json, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8004')
parser.add_argument('--engine',choices=['chromium','webkit','both'],default='both')
args=parser.parse_args()
out=Path('tests/evidence/compact-switcher');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 for engine in (('chromium','webkit') if args.engine=='both' else (args.engine,)):
  browser=getattr(p,engine).launch()
  page=browser.new_page(viewport={'width':390,'height':844},service_workers='block')
  base=args.base_url.rstrip('/')
  page.goto(base+'/index.html')
  old=json.dumps({'cells':[{'number':1,'label':'Old draft','code':'print("old draft")'}]})
  page.evaluate('(draft)=>localStorage.setItem("dspp-notebook-v1:data:seoul",draft)',old)
  page.goto(base+'/playground.html')
  page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')",timeout=120000)
  assert page.locator('article.cell').count()==0
  page.locator('#addCellButton').click()
  page.locator('article.cell textarea').fill('print("new session")')
  page.reload()
  page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')",timeout=120000)
  assert page.locator('article.cell').count()==0
  assert page.evaluate('localStorage.getItem("dspp-notebook-v1:data:seoul")')==old
  page.goto(base+'/ml.html')
  page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Pyodide 0.26.4 ready')",timeout=120000)
  assert page.locator('.inspector .privacy-note').count()==0
  assert page.locator('.brand-mark').is_visible()
  assert page.locator('.brand h1').is_visible()
  for width in (320,390,834,1440):
   page.set_viewport_size({'width':width,'height':900})
   page.evaluate('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))')
   data=page.locator('.mode-link--data').bounding_box();ml=page.locator('.mode-link--ml').bounding_box()
   nav=page.locator('.mode-switch').bounding_box()
   assert nav['width']<=214 and nav['height']<=41,nav
   assert page.locator('.mode-icon').count()==3
   assert page.locator('.mode-link--ml').get_attribute('aria-current')=='page'
   assert page.locator('.mode-label').all_text_contents()==['HOME','DATA','ML']
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'), (engine,width,page.evaluate('document.documentElement.scrollWidth'))
   for link in page.locator('.mode-link').all():
    link.focus();assert link.evaluate('(e)=>e===document.activeElement')
   page.screenshot(path=str(out/f'{engine}-ml-{width}.png'))
  print(engine,'PASS: seeded drafts ignored, reopen empty, old draft preserved, ML note removed, title and symbol visible, compact pixel switcher, visible labels, focus and no overflow',flush=True)
  browser.close()
