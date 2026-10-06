"""Readiness, named lesson contracts and actual KMeans supplement.
The complete gesture and Data execution audit is test_committed_routes_browser.py.
Only bundled demonstrations run; no lesson/challenge answers are submitted.
"""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8152');p.add_argument('--engine',choices=['chromium','webkit'],default='chromium');p.add_argument('--evidence-dir',default='../evidence');a=p.parse_args()
out=Path(a.evidence_dir);out.mkdir(parents=True,exist_ok=True);results=[];errors=[]
def ready(page,kind='data'):
 page.wait_for_function("document.querySelector('#runtimeDot')?.classList.contains('ready') && Number(document.querySelector('.step-route-range')?.max)>0",timeout=180000)
def state(page):
 return page.locator('article.cell').evaluate_all('(ns)=>ns.map(n=>({id:n.dataset.cellId,status:n.dataset.status,code:n.querySelector("textarea").value}))')
def choose(page,n):
 page.locator('.step-route-range').evaluate('(s,n)=>{s.value=n;s.dispatchEvent(new Event("input"));s.dispatchEvent(new Event("change"))}',n)
with sync_playwright() as pw:
 browser=getattr(pw,a.engine).launch();ctx=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block',accept_downloads=True);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(a.base_url+'/index.html');choices=page.locator('.blimp-choice');assert choices.nth(0).get_attribute('href')=='learn.html';assert choices.nth(1).get_attribute('href')=='playground.html';assert page.locator('#learning-robot').get_attribute('href')=='learn.html';assert page.locator('#playground-gate').get_attribute('href')=='playground.html';results.append(['home','direct text entries and preserved art hotspots'])
 page.goto(a.base_url+'/playground.html?runtime=local',wait_until='domcontentloaded');assert 'is ready' not in page.locator('#dataframeNoteStatus').inner_text();ready(page);assert 'is ready' in page.locator('#dataframeNoteStatus').inner_text();assert page.locator('#dataframeNoteCopy code').count()>=2;assert page.get_by_role('button',name='Browse data tasks',exact=True).count()==1
 page.goto(a.base_url+'/ml.html?runtime=local');ready(page,'ml');page.select_option('#modelSelect','kmeans');ready(page,'ml');assert page.locator('.step-route-range').get_attribute('max')=='8';route=page.locator('.step-route-stop[data-task-id]:not([data-task-id=""])').evaluate_all('(ns)=>ns.map(n=>n.dataset.taskId)')
 for n in range(1,9):
  choose(page,n);cell=page.locator('article.cell').nth(n-1);page.wait_for_function('(n)=>["done","error"].includes(document.querySelectorAll("article.cell")[n-1].dataset.status)',arg=n,timeout=240000);assert cell.get_attribute('data-status')=='done',cell.inner_text()
 assert page.locator('#holdoutState').inner_text()=='not applicable';snapshot=state(page)
 for n in [0,1,8,8,2,1]:choose(page,n)
 assert state(page)==snapshot
 with page.expect_download() as dl:page.locator('#downloadChartButton').click()
 dl.value.save_as(str(out/('ml-kmeans-'+a.engine+'.png')));assert Path(dl.value.path()).read_bytes().startswith(b'\x89PNG')
 page.locator('#addCellButton').click();count=page.locator('article.cell').count();page.locator('article.cell').last.locator('.delete').click();page.get_by_role('button',name='Undo delete',exact=True).click();assert page.locator('article.cell').count()==count;page.locator('#resetButton').click();ready(page,'ml');assert page.locator('article.cell').count()==count and page.locator('.step-route-range').input_value()=='0';assert state(page)[0]['code']==snapshot[0]['code'];results.append(['kmeans',route,'8 normal runs; chart export; harmless revisits; add/delete/undo/reset'])
 # Read the representative contracts without executing lesson/challenge answers.
 page.goto(a.base_url+'/data-foundations.html?runtime=local#wrangle/challenges/WC08');page.wait_for_selector('#case-deliverables');copy=page.locator('#case-deliverables').inner_text();assert 'Store the finished table in combined' in copy;assert 'record_count' in copy;assert 'same columns in the same order as df' in copy;assert 'Keep both inputs unchanged' in copy
 assert page.locator('#case-deliverables code.code-identifier').filter(has_text='combined').count()>0
 page.goto(a.base_url+'/data-foundations.html?runtime=local#wrangle/W25/0');page.wait_for_selector('#foundationEditor');task=page.locator('.foundation-task').inner_text();assert 'first' in task and 'second' in task and 'Its name is your choice' in task;assert 'combined' not in task
 assert page.locator('.task-recall summary').is_visible();assert page.locator('.task-recall').get_attribute('open') is None
 results.append(['WC08/W25','distinct named-output/display contracts; full task remains beside editor; no answers run'])
 page.goto(a.base_url+'/ml-learn.html?runtime=local#foundations/ML-F02/0');page.wait_for_selector('.ml-concept svg');assert page.locator('svg code').count()==0;svg=page.locator('.ml-concept svg').text_content();assert 'X' in svg and 'y' in svg
 results.append(['diagrams','code chips leave original SVG feature/target names visible'])
 # A real failed import in fresh contexts must never claim data is ready or run.
 for name in ['playground','statistics','ml']:
  failure=browser.new_context(service_workers='block');failure.route('**/pyodide/pyodide.js',lambda r:r.abort());bad=failure.new_page();bad.goto(a.base_url+'/'+name+'.html?runtime=local');bad.wait_for_function("document.querySelector('#runtimeDot').classList.contains('error')",timeout=30000)
  if name=='playground':
   assert 'is ready' not in bad.locator('#dataframeNoteStatus').inner_text();assert 'unavailable' in bad.locator('#dataframeNoteStatus').inner_text();expect(bad.locator('.step-route-range')).to_be_disabled()
  if name=='ml':
   choose(bad,1);expect(bad.locator('article.cell .run')).to_be_disabled();assert bad.locator('article.cell').get_attribute('data-status')=='ready'
  if name=='statistics':expect(bad.locator('#runAllButton')).to_be_disabled()
  results.append([name,'actual local Python import failure blocks normal execution and preserves accurate readiness']);failure.close()
 assert not errors,errors
 (out/('clarity-browser-'+a.engine+'.json')).write_text(json.dumps({'engine':a.engine,'browser':browser.version,'results':results,'errors':errors},indent=2)+'\n');browser.close();print(a.engine,'PASS contracts, readiness, actual KMeans and controls',flush=True)
