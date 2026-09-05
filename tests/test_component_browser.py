"""Readable components at three widths and both themes; records visual evidence."""
import json,re
from pathlib import Path
Path("tests/evidence").mkdir(parents=True, exist_ok=True)
from playwright.sync_api import sync_playwright
results=[]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1440,'height':1000});page.goto('http://127.0.0.1:8001/playground.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent==='Python ready'",timeout=120000)
 page.locator('#runAllButton').click();page.wait_for_function("document.querySelectorAll('article.cell').length===6 && [...document.querySelectorAll('article.cell')].every(c=>c.dataset.status==='done')",timeout=120000)
 page.evaluate('''() => {
   const sheet=document.createElement('main');sheet.className='component-contact-sheet';sheet.style.cssText='display:grid;gap:16px;padding:16px;max-width:1200px;margin:auto';
   for(const selector of ['.notebook-actions','.data-card','.route-strip','article.cell','.output-item','.privacy-note']) {
     const original=document.querySelector(selector);if(!original)continue;const node=original.cloneNode(true);node.style.position='static';node.style.maxHeight='none';node.style.height='auto';sheet.append(node);
   }
   document.body.replaceChildren(sheet);
 }''')
 for theme in ['light','dark']:
  page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
  for width in [390,834,1440]:
   page.set_viewport_size({'width':width,'height':1000});page.evaluate('scrollTo(0,0)');page.wait_for_timeout(100)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(theme,width)
   page.screenshot(path=f'tests/evidence/components-{theme}-{width}.png',full_page=True)
   styles=page.locator('.privacy-note').evaluate('(e)=>({color:getComputedStyle(e).color,size:getComputedStyle(e).fontSize})')
   assert float(styles['size'].replace('px',''))>=14
   results.append({'theme':theme,'width':width,'privacy':styles})
 Path('tests/evidence/components.json').write_text(json.dumps(results,indent=2));b.close();print('Component geometry, reading scale and six theme/width contact sheets passed.')
