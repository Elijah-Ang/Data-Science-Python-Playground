"""Literal three-page visual review; source served read-only by review_server.py."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

HERE=Path(__file__).parent/'artifacts';HERE.mkdir(exist_ok=True)
URL='http://127.0.0.1:8012/'
with sync_playwright() as p:
    browser=p.chromium.launch()
    pages={}
    for name,path in [('data','playground.html?runtime=local'),('ml','ml.html?runtime=local'),('statistics','statistics.html?runtime=local')]:
        page=browser.new_page(viewport={'width':1512,'height':1050});page.goto(URL+path);pages[name]=page
        if name=='statistics':page.wait_for_function('StatisticsPrototype.ready',timeout=180000)
        else:
            page.wait_for_function('document.querySelector("#runtimeStatus")?.textContent.toLowerCase().includes("ready")',timeout=180000)
        # Place one real route cell in each notebook to inspect the code surface.
        if name=='statistics':page.locator('.route-card').first.click();page.wait_for_function('StatisticsPrototype.cells[0].status==="done"',timeout=120000)
        else:
            selector='.route-card' if name=='ml' else '.route-chip'
            if not page.locator(selector).count():selector='.route-card' if page.locator('.route-card').count() else '#suggestedRoute button'
            page.locator(selector).first.click(timeout=180000);page.wait_for_selector('.code-input',timeout=120000)
    metrics=[]
    for width,height in [(1512,1050),(980,1000),(390,844)]:
        for theme in ['light','dark']:
            shots=[]
            for name,page in pages.items():
                page.set_viewport_size({'width':width,'height':height});page.evaluate('t=>AppAppearance.apply(t)',theme)
                page.screenshot(path=str(HERE/f'compare-{name}-{width}-{theme}.png'))
                metrics.append({'page':name,'width':width,'theme':theme,**page.evaluate('''()=>{const q=s=>document.querySelector(s);const box=s=>{let r=q(s)?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};const css=(s,k)=>q(s)?getComputedStyle(q(s))[k]:null;return {topbar:box('.topbar'),controls:box('.control-strip'),inspector:box('.inspector'),route:box('.route-card, .route-chip'),cell:box('.cell'),editorFont:['fontFamily','fontSize','fontWeight','lineHeight'].map(k=>css('.code-input',k)),cellRadius:css('.cell','borderTopLeftRadius'),topFont:['fontFamily','fontSize','fontWeight','lineHeight'].map(k=>css('.brand h1',k)),pageOverflow:document.documentElement.scrollWidth>innerWidth+1}}''')})
                shots.append(Image.open(HERE/f'compare-{name}-{width}-{theme}.png').convert('RGB'))
            # All three views at the same actual CSS dimensions, labeled above.
            collage=Image.new('RGB',(3*width,height+36),'#f6f1e5');draw=ImageDraw.Draw(collage)
            for i,(name,img) in enumerate(zip(pages,shots)):
                draw.text((i*width+12,10),f'{name.upper()} | {width}px | {theme}',fill='#202535');collage.paste(img,(i*width,36))
            collage.save(HERE/f'side-by-side-{width}-{theme}.png')
    (HERE/'visual-metrics.json').write_text(json.dumps(metrics,indent=2))
    for width in [1512,980,390]:
        for theme in ['light','dark']:
            rows=[r for r in metrics if r['width']==width and r['theme']==theme]
            stat=next(r for r in rows if r['page']=='statistics');ml=next(r for r in rows if r['page']=='ml')
            assert abs(stat['topbar']['height']-ml['topbar']['height'])<=2,(width,theme,'topbar')
            assert stat['cellRadius']==ml['cellRadius'],(width,theme,'cell radius')
            assert stat['editorFont']==ml['editorFont'],(width,theme,'editor font')
            assert stat['topFont']==ml['topFont'],(width,theme,'brand font')
            assert not stat['pageOverflow'],(width,theme,'overflow')
            if width==1512:assert stat['inspector']['width']==ml['inspector']['width']
            if width>=980:assert abs(stat['controls']['height']-ml['controls']['height'])<=2,(width,theme,'control-strip density')
    print('PASS six side-by-side reviews; topbar, inspector width, brand/editor fonts and cell radius match canonical ML.',flush=True)
    browser.close()
