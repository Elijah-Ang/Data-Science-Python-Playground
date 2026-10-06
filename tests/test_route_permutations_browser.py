"""Actual route setup inventory in Chromium/WebKit; one real first-step run.

All 254 ML variants and the 45 Statistics family/dataset/confidence surfaces
are selected. Later stops stay blocked, so this never trains every ML model.
Full model-family execution is covered by test_committed_routes_browser.py.
"""
import argparse, json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--engine',choices=['chromium','webkit'],required=True);p.add_argument('--output',required=True);a=p.parse_args()
report={'engine':a.engine,'ml':[],'statistics':[],'errors':[]}
output=Path(a.output);output.parent.mkdir(parents=True,exist_ok=True)
blueprints=json.loads(subprocess.check_output(['node',str(ROOT/'tests/generate_ml_routes.mjs')],text=True))
def ready(page):
    page.wait_for_function("document.querySelector('#runtimeDot').classList.contains('ready') && Number(document.querySelector('.step-route-range').max)>0 && (typeof StatisticsPlayground==='undefined'||StatisticsPlayground.ready) && (!document.querySelector('#holdoutState') || !document.querySelector('#runAllButton').disabled)",timeout=180000)
def choose(page,n):
    page.locator('.step-route-range').evaluate('(n,v)=>{n.value=v;n.dispatchEvent(new Event("input"));n.dispatchEvent(new Event("change"))}',n)
def ids(page):return page.locator('.step-route-stop[data-task-id]:not([data-task-id=""])').evaluate_all('(ns)=>ns.map(n=>n.dataset.taskId)')
def run_first_and_block_last(page,expected):
    assert page.locator('.step-route-range').input_value()=='0'
    assert ids(page)==expected
    choose(page,1)
    assert page.locator('article.cell').count()==1
    page.wait_for_function("id=>document.querySelector('.step-route-stop[data-task-id=\"'+id+'\"]').dataset.state==='done'",arg=expected[0],timeout=180000)
    before=page.evaluate('__runCount')
    for n in [len(expected),len(expected),0,1,len(expected),0]:choose(page,n)
    assert page.locator('article.cell').count()==2
    assert page.locator('article.cell').last.get_attribute('data-status')=='ready'
    assert page.locator('article.cell .run').last.is_disabled() if page.locator('article.cell .run').count() else page.locator('[data-run]').last.is_disabled()
    assert page.evaluate('__runCount')==before==1

try:
    with sync_playwright() as pw:
        browser=getattr(pw,a.engine).launch();report['browser']=browser.version
        context=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block')
        context.add_init_script("window.__runCount=0;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...args){if(typeof m.code==='string')__runCount++;return post.call(this,m,...args)}")
        page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
        page.goto(a.base_url+'/statistics.html?runtime=local');ready(page)
        domain=json.loads((ROOT/'statistics/controls.json').read_text())
        for family,datasets in domain['families'].items():
            page.select_option('#familySelect',family);ready(page)
            for dataset in datasets:
                page.select_option('#datasetSelect',dataset);ready(page)
                for confidence in domain['confidence']:
                    page.select_option('#confidence',str(confidence));ready(page);page.locator('#resetButton').click();ready(page);page.evaluate('__runCount=0')
                    plan=page.evaluate('StatisticsPlayground.plan');expected=[s['id'] for s in plan['route']]
                    run_first_and_block_last(page,expected)
                    report['statistics'].append({'family':family,'dataset':dataset,'confidence':confidence,'method':plan['method'],'ids':expected,'first_step_executed':True,'later_prerequisites_blocked':True})
        assert len(report['statistics'])==45
        page.goto(a.base_url+'/ml.html?runtime=local');ready(page)
        for folds,routes in blueprints['routes'].items():
            page.select_option('#foldSelect',folds);ready(page)
            for route in routes:
                # Hundreds of test drafts would exceed browser storage. Isolate only this scratch context.
                page.evaluate('localStorage.clear();sessionStorage.clear()')
                for selector,value in [('#datasetSelect',route['datasetId']),('#scenarioSelect',route['scenarioId']),('#modelSelect',route['modelId'])]:
                    if page.locator(selector).input_value()!=value:
                        page.select_option(selector,value);ready(page)
                        assert page.locator('.step-route-range').input_value()=='0'
                page.locator('#resetButton').click();ready(page);page.evaluate('__runCount=0')
                expected=[s['id'] for s in route['cells']]
                page.wait_for_function("expected=>JSON.stringify([...document.querySelectorAll('.step-route-stop[data-task-id]')].map(n=>n.dataset.taskId).filter(Boolean))===JSON.stringify(expected)",arg=expected)
                # Reset retains code by design; clear only this scratch notebook through its normal UI.
                while page.locator('article.cell .delete').count():page.locator('article.cell .delete').last.click()
                assert page.locator('article.cell').count()==0
                run_first_and_block_last(page,expected)
                assert page.locator('#holdoutState').inner_text()==('not applicable' if route['modelTask']=='unsupervised' else 'sealed')
                report['ml'].append({'folds':folds,'dataset':route['datasetId'],'scenario':route['scenarioId'],'model':route['modelId'],'ids':expected,'first_step_executed':True,'later_prerequisites_blocked':True,'holdout_sealed':route['modelTask']!='unsupervised'})
            print(a.engine,'PASS',folds,len(routes),'ML setup variants',flush=True)
        assert len(report['ml'])==254 and not report['errors'],report['errors']
        context.close();browser.close();report['all_pass']=True
except Exception as error:
    report['all_pass']=False;report['failure']=repr(error);raise
finally:output.write_text(json.dumps(report,indent=2)+'\n')
print(a.engine,'PASS 254 ML and 45 Statistics setup surfaces; real first-step execution',flush=True)
