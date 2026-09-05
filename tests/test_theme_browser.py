from playwright.sync_api import sync_playwright
import re,json
from pathlib import Path

def luminance(rgb):
 channels=[v/255 for v in rgb]
 channels=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in channels]
 return sum(a*b for a,b in zip(channels,[.2126,.7152,.0722]))
def ratio(a,b):
 lo,hi=sorted([luminance(a),luminance(b)]);return (hi+.05)/(lo+.05)
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page();page.goto('http://127.0.0.1:8001/index.html');page.evaluate("AppAppearance.apply('dark')");results=[]
 for name in ['index','about','help','privacy','acknowledgements','tutorial']:
  page.goto('http://127.0.0.1:8001/'+name+'.html');assert page.locator('body').get_attribute('data-theme')=='dark'
  colors=page.locator('main p').evaluate_all("nodes=>nodes.slice(0,4).map(e=>getComputedStyle(e).color)")
  for color in colors:
   rgb=[float(v) for v in re.findall(r'[\d.]+',color)[:3]];contrast=ratio(rgb,[25,29,41]);assert contrast>=4.5,(name,color,contrast)
   results.append([name,color,round(contrast,2)])
 Path('tests/evidence/theme-contrast.json').write_text(json.dumps(results,indent=2));print('Dark preference survives public navigation; sampled core paragraph contrast ≥4.5:1.');b.close()
