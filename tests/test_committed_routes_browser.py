"""Actual native-runtime committed-selection and drag regression, both engines.

Only bundled demonstration routes run. Synthetic worker holds isolate queue
behavior; ordinary routes below execute the real pinned Python runtime.
"""
import argparse, json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--engine',choices=['chromium','webkit'],required=True);p.add_argument('--output',required=True);a=p.parse_args()
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
report={'engine':a.engine,'interactions':[],'queues':[],'batches':[],'invalidation':[],'conditional_statistics':[],'data':[],'ml':[],'errors':[]}
PROBE="""try{localStorage.clear();sessionStorage.clear()}catch{};window.__runs=[];window.__holdNext=false;const nativePost=Worker.prototype.postMessage;Worker.prototype.postMessage=function(message,...args){if(typeof message.code==='string'){if(__holdNext){__holdNext=false;window.__held={worker:this,message,args};return;}__runs.push({code:message.code,type:message.type||message.action});}return nativePost.call(this,message,...args)};window.__release=()=>{const h=__held;window.__held=null;__runs.push({code:h.message.code,type:h.message.type||h.message.action});nativePost.call(h.worker,h.message,...h.args)};"""
def ready(page):
    page.wait_for_function("document.querySelector('#runtimeDot')?.classList.contains('ready') && Number(document.querySelector('.step-route-range')?.max)>0 && (typeof StatisticsPlayground==='undefined'||StatisticsPlayground.ready)",timeout=180000)
def count(page):return page.evaluate('__runs.length')
def snap(page):return page.locator('article.cell').evaluate_all('(ns)=>ns.map(n=>({id:n.dataset.cellId||n.parentElement.dataset.cellIndex,status:n.dataset.status,code:n.querySelector("textarea").value}))')
def choose(page,n,touch=False):
    slider=page.locator('.step-route-range');slider.scroll_into_view_if_needed();box=slider.bounding_box();x=box['x']+9.5+(box['width']-19)*n/int(slider.get_attribute('max'));y=box['y']+box['height']/2
    if touch:page.touchscreen.tap(x,y)
    else:page.mouse.click(x,y)
    assert slider.input_value()==str(n),(n,slider.input_value())
def finished(page,task_id,status='done'):
    page.wait_for_function("([id,s])=>document.querySelector('.step-route-stop[data-task-id=\"'+id+'\"]')?.dataset.state===s",arg=[task_id,status],timeout=180000)
def ids(page):return page.locator('.step-route-stop[data-task-id]:not([data-task-id=""])').evaluate_all('(ns)=>ns.map(n=>n.dataset.taskId)')
def new_page(context,path):
    page=context.new_page();page.on('pageerror',lambda error:report['errors'].append(str(error)));page.goto(a.base_url+'/'+path+'.html?runtime=local');ready(page);return page
def interactions(context,path):
    page=new_page(context,path);slider=page.locator('.step-route-range');route=ids(page);assert slider.input_value()=='0' and snap(page)==[]
    assert page.locator('#routeDescription').inner_text()=='Move the slider below'
    assert page.locator('.step-route-detail,.step-route-action').count()==0
    choose(page,1,touch=True);assert len(snap(page))==1;finished(page,route[0]);assert count(page)==1
    original=page.locator('article.cell textarea').first.input_value()
    for n in [0,1,1,0,1]:choose(page,n,touch=True)
    slider.press('Home');slider.press('ArrowRight');slider.press('ArrowLeft');slider.press('ArrowRight');page.wait_for_timeout(80)
    assert count(page)==1 and len(snap(page))==1
    page.locator('article.cell textarea').first.fill(original+'\n# Retain the learner edit')
    choose(page,1);finished(page,route[0]);assert count(page)==2 and snap(page)[0]['code']==original+'\n# Retain the learner edit'
    page.locator('article.cell textarea').first.fill('raise ValueError("committed route error probe")')
    choose(page,1);finished(page,route[0],'error');assert count(page)==3
    assert page.locator('.step-route-stop[data-state="done"]').count()==0
    choose(page,1);choose(page,1,touch=True);page.wait_for_timeout(80);assert count(page)==3
    page.locator('article.cell .run').first.click();finished(page,route[0],'error');assert count(page)==4
    page.locator('article.cell textarea').first.fill(original+'\n# Retain the learner edit')
    choose(page,1);finished(page,route[0]);assert count(page)==5
    choose(page,0);before=snap(page);slider.scroll_into_view_if_needed();box=slider.bounding_box();y=box['y']+box['height']/2
    page.mouse.move(box['x']+9.5,y);page.mouse.down()
    for n in range(1,21):
        page.mouse.move(box['x']+9.5+(box['width']-19)*n/20,y)
        assert snap(page)==before and count(page)==5,'Transient drag inserted or ran code'
    page.mouse.move(box['x']+box['width']+20,y);page.mouse.up()
    assert slider.input_value()==str(len(route)) and len(snap(page))==2
    assert count(page)==5 and page.locator('.step-route-label').inner_text().endswith('run earlier steps')
    assert page.locator('.step-route-stop[data-state="done"]').count()==1
    choose(page,0);saved=slider.input_value();slider.dispatch_event('pointerdown',{'pointerId':91});slider.evaluate('(n)=>{n.value=2;n.dispatchEvent(new Event("input"))}');slider.dispatch_event('pointercancel',{'pointerId':91});assert slider.input_value()==saved and count(page)==5
    slider.dispatch_event('pointerdown',{'pointerId':92,'pointerType':'touch'});slider.evaluate('(n)=>{n.value=2;n.dispatchEvent(new Event("input"))}');slider.dispatch_event('touchcancel');assert slider.input_value()==saved and count(page)==5
    if a.engine=='chromium':
        page.set_viewport_size({'width':390,'height':1000});slider.scroll_into_view_if_needed();box=slider.bounding_box();y=box['y']+box['height']/2;cdp=page.context.new_cdp_session(page)
        def touch(kind,x):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y,'id':1}]})
        touch('touchStart',box['x']+9.5)
        for n in range(1,13):
            touch('touchMove',box['x']+9.5+(box['width']-19)*n/12);assert count(page)==5
        touch('touchEnd',0);assert slider.input_value()==str(len(route)) and count(page)==5;cdp.detach()
    choose(page,0)
    for theme in ['light','dark']:
        page.evaluate('(t)=>AppAppearance.apply(t)',theme)
        for width,scale in [(1440,1),(390,1),(320,1),(320,2),(720,2)]:
            page.set_viewport_size({'width':width,'height':1000});page.evaluate('(s)=>document.documentElement.style.fontSize=(s*100)+"%"',scale);slider.scroll_into_view_if_needed()
            page.evaluate('()=>document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(path,theme,width,scale,'overflow')
            dots=page.locator('.step-route-stop').evaluate_all('(ns)=>ns.map(n=>n.getBoundingClientRect().toJSON())')
            assert all(dots[i]['right']<dots[i+1]['left'] for i in range(len(dots)-1)),(path,width,scale,'markers overlap')
            assert all(d['width']>=12 for d in dots)
            page.locator('.step-route-label').evaluate('(n)=>n.textContent="Explore training data and inspect validation errors"')
            assert page.locator('.step-route-label').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
            slider.press('Home');expect(slider).to_be_focused()
            assert slider.evaluate('(n)=>getComputedStyle(n).outlineWidth')=='0px'
            assert slider.evaluate('(n)=>getComputedStyle(n).transitionDuration.split(",").every(x=>parseFloat(x)<=.0001)')
        page.evaluate('document.documentElement.style.fontSize=""');page.set_viewport_size({'width':720,'height':1000});page.evaluate('document.documentElement.style.zoom="2"');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.evaluate('document.documentElement.style.zoom=""')
    page.set_viewport_size({'width':1440,'height':1000})
    page.locator('#restartPythonButton').click();ready(page);assert slider.input_value()=='0'
    if path!='statistics':assert snap(page)[0]['code']==original+'\n# Retain the learner edit'
    old=count(page);choose(page,1);finished(page,ids(page)[0]);assert count(page)==old+1,'Restart must permit unchanged retained code to execute'
    report['interactions'].append({'page':path,'first_commit_immediate_insertion_and_one_run':True,'repeat_and_backward_reuse':True,'edited_code_runs_once':True,'failure_never_green':True,'unchanged_failure_no_duplicate_retry':True,'manual_retry':True,'mouse_drag_no_intermediate_execution':True,'native_touch_taps':True,'native_touch_drag':a.engine=='chromium','app_cancel':True,'restart':True,'widths':[320,390,720,1440],'text_200_percent':True,'css_zoom_200_percent':True,'both_themes':True})
    page.close();print(a.engine,path,'PASS committed gestures/errors/repeats/restart/layout',flush=True)
def queue_checks(context,path):
    page=new_page(context,path);route=ids(page)
    page.evaluate('__holdNext=true');choose(page,1);page.wait_for_function('Boolean(window.__held)')
    assert snap(page)[0]['status']=='running' and count(page)==0
    choose(page,2);choose(page,3);choose(page,2);choose(page,2,touch=True)
    assert len(snap(page))==3 and count(page)==0,(path,snap(page),count(page),page.locator('.step-route-range').input_value())
    assert page.locator('.step-route-label').inner_text().endswith('waiting')
    page.evaluate('__release()');finished(page,route[1]);assert count(page)==2
    assert page.locator('.step-route-stop[data-task-id="'+route[2]+'"]').get_attribute('data-state')=='ready'
    page.locator('article.cell textarea').first.fill(page.locator('article.cell textarea').first.input_value()+'\n# Upstream edit retained')
    page.evaluate('__holdNext=true');choose(page,1);page.wait_for_function('Boolean(window.__held)');choose(page,2);choose(page,0);old=count(page);page.evaluate('__release()');finished(page,route[0]);page.wait_for_timeout(100);assert count(page)==old+1
    assert page.locator('.step-route-range').input_value()=='0'
    report['queues'].append({'page':path,'actual_worker_message_hold':True,'busy_commits_coalesce_to_latest':True,'only_two_actual_cells_run':True,'zero_cancels_waiting_choice':True,'prerequisite_state_truthful':True})
    page.close();print(a.engine,path,'PASS latest-choice queue and zero cancellation',flush=True)
def data_routes(context):
    for dataset in ['seoul','candy','gapminder','wine']:
        page=new_page(context,'playground');page.select_option('#datasetSelect',dataset);ready(page);route=ids(page)
        for n,task in enumerate(route,1):choose(page,n);finished(page,task)
        assert count(page)==len(route) and len(snap(page))==len(route)
        previous=snap(page)
        for n in [0,1,len(route),3,3,1]:choose(page,n)
        assert snap(page)==previous and count(page)==len(route)
        for button in ['#downloadCsvButton','#downloadChartButton']:
            with page.expect_download() as event:page.locator(button).click()
            assert Path(event.value.path()).stat().st_size>50
        page.locator('#addCellButton').click();n=len(snap(page));page.locator('article.cell .delete').last.click();assert len(snap(page))==n-1;page.get_by_role('button',name='Undo delete',exact=True).click();assert len(snap(page))==n
        page.locator('#resetButton').click();ready(page);assert len(snap(page))==n and page.locator('.step-route-range').input_value()=='0'
        report['data'].append({'dataset':dataset,'route':route,'all_steps_auto_executed':True,'unchanged_revisits_no_runs':True,'csv_chart_exports':True,'add_delete_undo_reset':True})
        page.close();print(a.engine,dataset,'PASS all Data automatic route steps and controls',flush=True)
def route_cell(page,task):
    cell_id=page.locator('#notebookPanel .cell-stack').evaluate_all('(ns,id)=>ns.find(n=>n.cellModel?.taskId===id)?.dataset.cellId',task)
    assert cell_id,task
    return page.locator('.cell-stack[data-cell-id="'+cell_id+'"] article.cell')
def invalidation_checks(context,path):
    page=new_page(context,path);task=ids(page)[0];choose(page,1);finished(page,task)
    page.locator('#addCellButton').click();custom=page.locator('article.cell').last;custom.locator('textarea').fill('print("Shared context changed")');custom.locator('.run').click()
    page.wait_for_function('[...document.querySelectorAll("article.cell")].at(-1).dataset.status==="done"',timeout=180000)
    before=count(page);assert route_cell(page,task).get_attribute('data-status')=='stale'
    choose(page,1);finished(page,task);assert count(page)==before+1
    retained=route_cell(page,task).locator('textarea').input_value();old_id=route_cell(page,task).get_attribute('data-cell-id')
    route_cell(page,task).locator('.delete').click();before=count(page);choose(page,1);finished(page,task);assert count(page)==before+1
    route_cell(page,task).locator('textarea').fill(retained+'\n# Retain undo edit');choose(page,1);finished(page,task)
    old_id=route_cell(page,task).get_attribute('data-cell-id');route_cell(page,task).locator('.delete').click();page.get_by_role('button',name='Undo delete',exact=True).click()
    assert route_cell(page,task).locator('textarea').input_value()==retained+'\n# Retain undo edit'
    assert route_cell(page,task).get_attribute('data-cell-id')==old_id
    before=count(page);choose(page,1);finished(page,task);assert count(page)==before+1
    report['invalidation'].append({'page':path,'custom_context_stale_reruns_once':True,'delete_reinsert_runs_once':True,'undo_preserves_exact_code_id_and_allows_retry':True})
    page.close();print(a.engine,path,'PASS stale/delete/undo identity regression',flush=True)
def conditional_statistics(context):
    page=new_page(context,'statistics');page.select_option('#familySelect','groups');ready(page);page.select_option('#group','year');ready(page);page.locator('#applyStudy').click();ready(page)
    plan=page.evaluate('StatisticsPlayground.plan');route=ids(page);analysis=next(i for i,s in enumerate(plan['route']) if s['id']=='analysis');conclusion=route[-1]
    for i in range(analysis):choose(page,i+1);finished(page,route[i])
    page.evaluate('__holdNext=true');choose(page,analysis+1);page.wait_for_function('Boolean(window.__held)')
    for i in range(analysis+1,len(route)-1):
        if route[i]!='followup':choose(page,i+1)
    choose(page,len(route));assert page.locator('.step-route').get_attribute('data-pending')==conclusion
    page.evaluate('__release()');finished(page,'analysis')
    page.wait_for_function('!document.querySelector(".step-route-stop[data-task-id=followup]")')
    assert page.locator('.step-route-range').input_value()==str(len(route)-1)
    assert page.locator('.step-route').get_attribute('data-pending')==conclusion
    for i in range(analysis+1,len(plan['route'])-1):
        if plan['route'][i]['id']=='followup':continue
        page.locator('.cell-stack[data-cell-index="'+str(i)+'"] .run').click();finished(page,plan['route'][i]['id'])
    finished(page,conclusion)
    assert count(page)==len(route)-1
    report['conditional_statistics'].append({'method':plan['method'],'group':'year','p_value':page.evaluate('StatisticsPlayground.cells.find(c=>c.index==='+str(analysis)+').output.scalars.p_value'),'queued_conclusion_survives_omitted_followup':True,'actual_runs':count(page)})
    page.close();print(a.engine,'PASS conditional Statistics queue retains conclusion',flush=True)
def ml_routes(context):
    selections=[('breast','continuous5','logistic'),('car','categorical','one_r'),('wine','continuous','polynomial'),('seoul','simple','simple_linear'),('penguins','continuous4','kmeans'),('penguins','continuous4','hierarchical'),('penguins','continuous4','pca')]
    blueprints=json.loads(subprocess.check_output(['node',str(ROOT/'tests/generate_ml_routes.mjs')],text=True))
    all_routes=blueprints['routes']['5']
    # Match representative model families to configurations actually present;
    # IDs above are hints, with exact dataset/scenario IDs from the generator.
    for dataset,scenario,model in selections:
        compatible=[r for r in all_routes if r['datasetId']==dataset and r['modelId']==model]
        if not compatible:compatible=[r for r in all_routes if r['modelId']==model]
        assert compatible,(dataset,model)
        route_data=next((r for r in compatible if r['scenarioId']==scenario),compatible[0])
        page=new_page(context,'ml');page.select_option('#datasetSelect',route_data['datasetId']);ready(page);page.select_option('#scenarioSelect',route_data['scenarioId']);ready(page);page.select_option('#modelSelect',route_data['modelId']);ready(page)
        route=ids(page)
        for n,task in enumerate(route,1):choose(page,n);finished(page,task)
        assert count(page)==len(route) and len(snap(page))==len(route)
        old=count(page)
        for n in [0,1,len(route),len(route),2]:choose(page,n)
        assert count(page)==old
        if 'final' in route:
            assert 'USED' in page.locator('#holdoutState').inner_text().upper() or 'OPEN' in page.locator('#holdoutState').inner_text().upper()
            assert page.locator('article.cell .run').last.is_disabled()
        report['ml'].append({'dataset':route_data['datasetId'],'scenario':route_data['scenarioId'],'model':model,'route':route,'all_steps_auto_executed':True,'unchanged_revisits_no_runs':True,'protected_once_only_final': 'final' in route})
        page.close();print(a.engine,route_data['datasetId'],model,'PASS full automatic ML route',flush=True)
def batch_queue(context,path):
    page=new_page(context,path);route=ids(page)
    for n in [1,2]:choose(page,n);finished(page,route[n-1])
    cell=page.locator('article.cell').nth(1);code=cell.locator('textarea').input_value()
    cell.locator('textarea').fill('raise ValueError("Batch queue regression")');cell.locator('.run').click();finished(page,route[1],'error')
    choose(page,3);assert len(snap(page))==3 and page.locator('article.cell').nth(2).get_attribute('data-status')=='ready'
    queued_code=page.locator('article.cell').nth(2).locator('textarea').input_value();before=count(page)
    page.locator('article.cell').nth(1).locator('textarea').fill(code)
    page.locator('#runAllButton').click()
    page.wait_for_function("[...document.querySelectorAll('.step-route-stop[data-task-id]')].filter(n=>n.dataset.taskId).every(n=>n.dataset.state==='done')",timeout=180000)
    requests=page.evaluate('__runs')[before:]
    assert sum(r['code']==queued_code for r in requests)==1,requests
    assert page.locator('article.cell').count()==len(route)
    assert page.locator('article.cell').nth(1).locator('textarea').input_value()==code
    page.wait_for_function("!document.querySelector('.step-route').dataset.pending")
    report['batches'].append({'page':path,'queued_step_executed_once':True,'normal_batch_completed':True,'learner_code_preserved':True,'route':route})
    page.close();print(a.engine,path,'PASS queued selection plus normal Run suggested route',flush=True)
    page=new_page(context,path);route=ids(page);choose(page,1);finished(page,route[0]);choose(page,2);finished(page,route[1])
    page.locator('article.cell').nth(1).locator('textarea').fill('raise ValueError("Coalesced manual error")');page.evaluate('__holdNext=true');page.locator('article.cell').nth(1).locator('.run').click()
    before=count(page);choose(page,2);page.evaluate('__release()');finished(page,route[1],'error')
    page.wait_for_function("!document.querySelector('.step-route').dataset.pending")
    assert count(page)==before+1
    report['batches'].append({'page':path,'queued_identical_manual_failure_executed_once':True})
    page.close()

try:
    with sync_playwright() as pw:
        browser=getattr(pw,a.engine).launch();report['browser']=browser.version
        context=browser.new_context(viewport={'width':1440,'height':1000},has_touch=True,service_workers='block',reduced_motion='reduce',accept_downloads=True);context.add_init_script(PROBE)
        for path in ['playground','statistics','ml']:interactions(context,path);queue_checks(context,path);batch_queue(context,path)
        for path in ['playground','ml']:invalidation_checks(context,path)
        conditional_statistics(context);data_routes(context);ml_routes(context)
        assert not report['errors'],report['errors'];context.close();browser.close()
    report['all_pass']=True
except Exception as error:report.update(all_pass=False,failure=repr(error));raise
finally:out.write_text(json.dumps(report,indent=2)+'\n')
print(a.engine,'PASS complete committed-selection browser regression',flush=True)
