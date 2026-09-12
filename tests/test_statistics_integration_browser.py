"""Production Statistics runtime, navigation and shared responsive UI regression."""
import argparse
import csv
import io
import json
import math
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright
from statistics_visual_contract import install_probes, compare


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8020');parser.add_argument('--engine',default='chromium',choices=['chromium','webkit']);parser.add_argument('--local',action='store_true');args=parser.parse_args()
    out=Path('tests/evidence/statistics');out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=getattr(pw,args.engine).launch();context=browser.new_context(viewport={'width':1512,'height':1050},service_workers='block',accept_downloads=True)
        errors=[];context.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))))
        pages={};desktop={}
        for name,path in [('data','playground.html'),('statistics','statistics.html'),('ml','ml.html')]:
            page=context.new_page();page.goto(args.base_url+'/'+path+('?runtime=local' if args.local else ''));pages[name]=page
            page.wait_for_function('document.querySelector("#runtimeStatus").textContent.toLowerCase().includes("ready")',timeout=180000)
            if name=='statistics':
                page.wait_for_function('StatisticsPlayground.ready',timeout=180000)
                assert page.locator('.cell').count()==0
                page.locator('.route-card').first.click();page.wait_for_function('StatisticsPlayground.cells[0]?.status==="done"',timeout=60000)
                assert page.locator('#outputList .output-item').count()==1
                page.locator('#runAllButton').click();page.wait_for_function('StatisticsPlayground.cells.every(c=>c.status==="done") && StatisticsPlayground.cells.length===StatisticsPlayground.activeRouteLength',timeout=120000)
                assert 0<page.evaluate('StatisticsPlayground.cells.at(-1).output.scalars.p_value')<1
                with page.expect_download() as ev:page.locator('#downloadNotebook').click()
                assert json.loads(Path(ev.value.path()).read_text())['nbformat']==4
            else:
                page.locator('.route-card, .route-task').first.click(timeout=180000)
                page.wait_for_selector('.code-input',timeout=60000)
            print('Ready:',name,flush=True)
            desktop[name]=page.locator('#runAllButton').evaluate('(e)=>{const s=getComputedStyle(e);return [e.getBoundingClientRect().height,s.fontSize,s.paddingTop,s.paddingBottom]}')
        install_probes(pages);visual=[]
        for theme in ['light','dark']:
            for width in [1512,1121,1120,834,390,320]:
                shared=[]
                for name,page in pages.items():
                    page.set_viewport_size({'width':width,'height':1050 if width>1120 else 900});page.evaluate('t=>AppAppearance.apply(t)',theme)
                    assert page.locator('.mode-label').all_text_contents()==['HOME','DATA','STATS','ML']
                    assert page.locator('.mode-link[aria-current="page"]').get_attribute('href')=={'data':'playground.html','ml':'ml.html','statistics':'statistics.html'}[name]
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(name,width)
                    size=page.locator('#runAllButton').evaluate('(e)=>{const s=getComputedStyle(e);return [e.getBoundingClientRect().height,s.fontSize,s.paddingTop,s.paddingBottom]}')
                    assert size==desktop[name],(name,width,size,desktop[name])
                    if name=='statistics':
                        if width>1120:
                            n=page.locator('#notebookPanel').bounding_box();o=page.locator('.output-panel').bounding_box();assert n['x']+n['width']<=o['x']
                            scroll=page.evaluate('()=>{const n=document.querySelector("#notebookPanel"),o=document.querySelector("#outputBody");n.scrollTop=100;o.scrollTop=0;return [n.scrollTop,o.scrollTop]}');assert scroll==[100,0]
                        else:
                            assert page.locator('#outputList .output-item').count()==0
                            assert page.locator('.cell-inline-output .output-item').count()==page.locator('.cell').count()
                    shared.append(page.evaluate('''()=>['.mode-link','.code-input','.brand h1'].map(q=>{const s=getComputedStyle(document.querySelector(q));return [s.fontFamily,s.fontSize,s.lineHeight]})'''))
                    page.screenshot(path=str(out/f'{args.engine}-{name}-{width}-{theme}.png'))
                assert shared[0]==shared[1]==shared[2],(width,theme,shared)
                visual.append({'width':width,'theme':theme,'styles':compare(pages,width,theme)})
        (out/f'{args.engine}-visual-contract.json').write_text(json.dumps(visual,indent=2))
        # Independent exact-binomial oracle using Python's standard library.
        page=pages['statistics'];page.set_viewport_size({'width':1512,'height':1050})
        page.select_option('#familySelect','proportions');page.wait_for_function('StatisticsPlayground.ready')
        page.locator('#reference').fill('0.01');page.locator('#reference').dispatch_event('change');page.wait_for_function('StatisticsPlayground.ready')
        page.locator('#applyStudy').click();page.locator('#runAllButton').click();page.wait_for_function('StatisticsPlayground.cells.length===StatisticsPlayground.activeRouteLength && StatisticsPlayground.cells.every(c=>c.status==="done")',timeout=120000)
        state=page.evaluate('({plan:StatisticsPlayground.plan,result:StatisticsPlayground.cells.at(-1).output})');assert state['plan']['method']=='prop_one_exact'
        cfg=state['plan']['config'];rows=list(csv.DictReader(io.StringIO(urlopen(args.base_url+'/data/palmer-penguins.csv').read().decode())))
        values=[r[cfg['outcome']] for r in rows if r[cfg['outcome']]];n=len(values);k=values.count(cfg['success']);p=.01
        probabilities=[math.exp(math.lgamma(n+1)-math.lgamma(i+1)-math.lgamma(n-i+1)+i*math.log(p)+(n-i)*math.log1p(-p)) for i in range(n+1)];expected=sum(x for x in probabilities if x<=probabilities[k]*(1+1e-7))
        actual=state['result']['scalars']['p_value'];assert math.isclose(actual,expected,rel_tol=1e-8,abs_tol=1e-300),(actual,expected)
        assert not errors,errors
        print(f'PASS {args.engine}: production Pyodide, numerical oracle, export, four-link navigation, desktop-sized actions and shared responsive layout',flush=True)
        browser.close()

if __name__=='__main__':main()
