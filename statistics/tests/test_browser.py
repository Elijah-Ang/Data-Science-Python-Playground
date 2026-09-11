"""Production-style progressive notebook: real Chromium/WebKit + Pyodide.
Run against review_server.py (default port 8012).
"""
import argparse
import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import numpy as np
from numpy.testing import assert_allclose
from playwright.sync_api import sync_playwright
from test_engine import source
from test_notebook import Session, complete

ARTIFACTS=Path(__file__).parent/'artifacts'


def ready(page):
    page.wait_for_function('StatisticsPrototype.ready || !document.querySelector("#error").hidden',timeout=180000)
    assert page.locator('#error').is_hidden(),page.locator('#error').inner_text()


def select(page,id,value):
    if id not in ('familySelect','datasetSelect','confidence') and page.locator('#studyPanel').is_hidden():page.locator('#studyButton').click()
    control=page.locator('#'+id)
    if control.evaluate('e=>e.tagName')=='INPUT':
        control.fill(str(value));control.dispatch_event('change')
    else:control.select_option(str(value))
    ready(page)


def family(page,value):select(page,'familySelect',value)


def run_all(page):
    if page.locator('#studyPanel').is_visible():page.locator('#applyStudy').click()
    page.locator('#runAllButton').click()
    page.wait_for_function('StatisticsPrototype.cells.some(c=>c.status==="error") || StatisticsPrototype.cells.filter(c=>c.status==="done").length===StatisticsPrototype.activeRouteLength',timeout=180000)
    state=page.evaluate('({plan:StatisticsPrototype.plan,cells:StatisticsPrototype.cells})')
    assert all(c['status']=='done' for c in state['cells']),[(c['index'],c['error']) for c in state['cells']]
    ready(page);return state


def verify(page,method):
    assert page.locator('article.cell').count()==0,'Configuration preloaded route cells'
    state=run_all(page);assert state['plan']['method']==method,state['plan']['method']
    expected=complete(Session(source(state['plan']['config']),state['plan']['config']))
    for cell,reference in zip(state['cells'],expected):
        output=cell['output']
        assert output['stage']==reference['stage']
        assert output['scalars'].keys()==reference['scalars'].keys()
        for key,value in reference['scalars'].items():
            if isinstance(value,str) or value is None:assert output['scalars'][key]==value
            else:assert_allclose(output['scalars'][key],value,rtol=3e-7,atol=1e-9,err_msg=method+'/'+key)
        assert output['tables'].keys()==reference['tables'].keys()
        for table,rows in reference['tables'].items():
            actual=output['tables'][table];assert len(actual)==len(rows)
            for a,e in zip(actual,rows):
                for key,value in e.items():
                    if isinstance(value,(int,float)):assert_allclose(a[key],value,rtol=3e-7,atol=1e-9,err_msg=method+'/'+table+'/'+key)
                    else:assert a[key]==value
    for i,cell in enumerate(state['cells']):
        stack=page.locator(f'[data-cell-index="{i}"]')
        assert stack.locator(':scope > article.cell').count()==1
        assert page.locator(f'#outputList > [data-output-for="{cell["output"]["stage"]}"]').count()==1
        assert stack.locator('.cell-inline-output .output-item').count()==0
        assert stack.locator('article.cell .output-item').count()==0
    print('PASS real Pyodide:',method,flush=True)
    return state


def export_and_execute(page):
    with page.expect_download() as event:page.locator('#downloadNotebook').click()
    notebook=json.loads(Path(event.value.path()).read_text())
    with page.expect_download() as data_event:page.locator('#downloadData').click()
    env={};old=os.getcwd()
    with tempfile.TemporaryDirectory() as directory:
        Path(directory,data_event.value.suggested_filename).write_bytes(Path(data_event.value.path()).read_bytes())
        try:
            os.chdir(directory)
            with contextlib.redirect_stdout(io.StringIO()):
                for cell in notebook['cells']:
                    if cell['cell_type']=='code':exec(''.join(cell['source']),env)
        finally:os.chdir(old)
    actual=page.evaluate('StatisticsPrototype.cells.at(-1).output.scalars')
    if 'p_value' in actual:assert_allclose(env['p_value'],actual['p_value'],rtol=1e-7,atol=1e-12)
    assert len({c['id'] for c in notebook['cells']})==len(notebook['cells'])
    return notebook


def workflow_regressions(page):
    assert page.locator('article.cell').count()==0
    assert page.locator('.route-card:enabled').count()==1
    assert page.locator('.output-item').count()==0
    page.locator('.route-card').first.click()
    assert page.locator('article.cell').count()==1
    page.wait_for_function('StatisticsPrototype.cells[0].status==="done"',timeout=60000)
    assert page.locator('#outputList .output-item').count()==1
    editor=page.locator('.code-input').first
    editor.fill(editor.input_value()+'\nmy_note = "persistent variable"')
    page.locator('[data-run="0"]').click();page.wait_for_function('StatisticsPrototype.cells[0].status==="done"',timeout=60000)
    assert page.locator('.route-card:enabled').count()==2
    page.locator('.route-card').nth(1).click()
    page.wait_for_function('StatisticsPrototype.cells[1].status==="done"',timeout=60000)
    assert page.locator('article.cell').count()==2
    editor=page.locator('[data-cell-index="1"] .code-input')
    editor.fill(editor.input_value()+'\nprint(my_note)')
    page.locator('[data-run="1"]').click();page.wait_for_function('StatisticsPrototype.cells[1].status==="done"',timeout=60000)
    assert 'persistent variable' in page.locator('[data-output-for="select"] pre').text_content()
    run_all(page)
    # Upstream edit immediately clears its evidence and every dependent result.
    editor=page.locator('[data-cell-index="1"] .code-input');editor.fill(editor.input_value()+'\na = a[:20]')
    state=page.evaluate('StatisticsPrototype.cells')
    assert state[0]['status']=='done'
    assert all(c['status']=='stale' and c['output'] is None for c in state[1:])
    assert page.locator('.output-item').count()==1
    assert page.locator('.route-card:enabled').count()==2
    run_all(page)
    p=page.evaluate('StatisticsPrototype.cells.at(-1).output.scalars.p_value')
    from scipy import stats
    raw=source({'dataset':'penguins'});a=raw.loc[raw.species=='Adelie','body_mass_g'].to_numpy()[:20];b=raw.loc[raw.species=='Chinstrap','body_mass_g'].to_numpy()
    assert_allclose(p,stats.ttest_ind(a,b,equal_var=False).pvalue)
    assert 'exploratory' in page.locator('[data-output-for="conclude"]').inner_text()
    export_and_execute(page)
    # A failed cell gets its own error output, no downstream unlocking.
    editor=page.locator('[data-cell-index="3"] .code-input');old=editor.input_value();editor.fill('raise ValueError("intentional cell error")')
    page.locator('[data-run="3"]').click();page.wait_for_function('StatisticsPrototype.cells[3].status==="error"',timeout=60000)
    assert 'intentional cell error' in page.locator('[data-output-for="analysis"]').inner_text()
    assert page.locator('.route-card').nth(4).is_disabled()
    page.locator('[data-cell-index="3"] .code-input').fill(old);run_all(page)
    # Changing confidence/configuration clears all incompatible code and evidence.
    select(page,'confidence','0.99');assert page.locator('article.cell').count()==0
    select(page,'confidence','0.95')
    print('PASS editable cells, persistence, ordered unlocking, invalidation, rollback, edited export and configuration clearing',flush=True)


def verify_layout(page,width):
    page.wait_for_function("document.querySelectorAll('#outputList .output-item').length > 0" if width>1120 else "document.querySelectorAll('.cell-inline-output .output-item').length > 0")
    if width>1120:
        boxes=page.evaluate("""()=>{const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();return [box('#notebookPanel'),box('.output-panel')]}""")
        assert boxes[0]['right']<=boxes[1]['left'] and abs(boxes[0]['top']-boxes[1]['top'])<2,boxes
        assert page.locator('.cell-inline-output .output-item').count()==0
        # Both genuine scroll regions overflow after the full route. Scrolling one
        # must leave the other and the outer document where they were.
        scroll=page.evaluate("""()=>{const n=document.querySelector('#notebookPanel'),o=document.querySelector('#outputBody');n.scrollTop=0;o.scrollTop=0;const y=scrollY;n.scrollTop=140;const first=[n.scrollTop,o.scrollTop,scrollY];o.scrollTop=160;return {first,second:[n.scrollTop,o.scrollTop,scrollY],y,n:[n.scrollHeight,n.clientHeight],o:[o.scrollHeight,o.clientHeight]}}""")
        assert scroll['first']==[140,0,scroll['y']],scroll
        assert scroll['second']==[140,160,scroll['y']],scroll
    else:
        assert page.locator('#outputList .output-item').count()==0
        for stack in page.locator('.cell-stack').all():
            cell=stack.locator('article.cell').bounding_box();out=stack.locator('.cell-inline-output').bounding_box()
            assert out and out['y']>=cell['y']+cell['height']-1,(cell,out)
    confidence=page.locator('#confidence').evaluate("""e=>{const c=document.createElement('canvas').getContext('2d'),s=getComputedStyle(e);c.font=s.font;return {space:e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),text:c.measureText(e.selectedOptions[0].text).width}}""")
    assert confidence['space']>=confidence['text'],confidence


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--engine',choices=['chromium','webkit'],default='chromium');parser.add_argument('--url',default='http://127.0.0.1:8012/statistics.html?runtime=local');args=parser.parse_args()
    ARTIFACTS.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        browser=getattr(pw,args.engine).launch();context=browser.new_context(viewport={'width':1512,'height':1050},accept_downloads=True)
        errors=[];remote=[];origin=args.url.split('/statistics.html')[0]+'/'
        def request(r):
            if not r.url.startswith((origin,'blob:','data:')):remote.append(r.url)
        context.on('request',request)
        # WebKit request interception breaks Blob workers; observe the same local-only traffic.
        if args.engine=='chromium':context.route('**/*',lambda r:r.continue_() if r.request.url.startswith((origin,'blob:','data:')) else r.abort())
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(args.url);ready(page)
        workflow_regressions(page)
        verify(page,'welch');page.locator('#studyButton').click();page.locator('#equalVariance').check();ready(page);verify(page,'student')
        select(page,'goal','rank');verify(page,'mannwhitney')
        family(page,'reference');verify(page,'one_t');page.locator('#studyButton').click();page.locator('#knownSigma').check();ready(page);verify(page,'one_z')
        select(page,'goal','estimate');verify(page,'bootstrap')
        family(page,'paired');verify(page,'paired_t');select(page,'goal','rank');verify(page,'wilcoxon')
        family(page,'groups');verify(page,'welch_anova');page.locator('#studyButton').click();page.locator('#equalVariance').check();ready(page);verify(page,'anova')
        select(page,'goal','rank');verify(page,'kruskal')
        family(page,'groups')
        page.locator('.route-card').first.click();page.wait_for_function('StatisticsPrototype.cells[0].status==="done"',timeout=60000)
        page.locator('.route-card').nth(1).click();page.wait_for_function('StatisticsPrototype.cells[1].status==="done"',timeout=60000);ed=page.locator('[data-cell-index="1"] .code-input');ed.fill(ed.input_value()+'\ngroups = [np.array([1.,2.,3.,4.,5.,6.]) for _ in groups]')
        run_all(page)
        assert page.locator('.route-card[data-task-id="followup"]').count()==0
        assert page.locator('[data-output-for="followup"]').count()==0
        assert 'Post-hoc comparisons are not opened' in page.locator('[data-output-for="uncertainty"]').inner_text()
        family(page,'factorial');verify(page,'factorial');select(page,'factorCount','3');verify(page,'factorial');export_and_execute(page)
        assert page.locator('.advanced-calculation').count()==1
        page.locator('#studyButton').click();page.select_option('#factor1','island');page.wait_for_selector('#error:not([hidden])')
        assert 'Empty factorial cells' in page.locator('#error').inner_text();assert page.locator('article.cell').count()==0
        select(page,'factor1','sex')
        family(page,'categorical');verify(page,'chi2');select(page,'datasetSelect','candy');select(page,'x','caramel');select(page,'y','peanutyalmondy');verify(page,'fisher')
        family(page,'association');select(page,'datasetSelect','penguins');verify(page,'pearson');select(page,'goal','rank');verify(page,'spearman')
        family(page,'proportions');verify(page,'prop_one_z');select(page,'reference','.01');verify(page,'prop_one_exact')
        select(page,'structure','two');verify(page,'prop_two_z')
        select(page,'datasetSelect','candy');select(page,'structure','two');select(page,'outcome','peanutyalmondy');select(page,'success','1');select(page,'group','caramel');verify(page,'prop_two_exact');export_and_execute(page)
        # Reset and restart both create a fresh namespace/empty notebook with same configuration.
        page.locator('#resetButton').click();ready(page);assert page.locator('article.cell').count()==0
        page.locator('#restartPythonButton').click();ready(page);assert page.locator('article.cell').count()==0
        # Cancel a long-running real Python cell, then recover.
        page.locator('.route-card').first.click();page.wait_for_function('StatisticsPrototype.cells[0].status==="done"',timeout=60000);page.locator('.code-input').fill('while True:\n    pass');page.locator('[data-run="0"]').click();page.locator('#restartPythonButton').click();ready(page)
        assert page.locator('article.cell').count()==0
        family(page,'independent');run_all(page)
        # Responsive and theme checks include real populated cells and their inline outputs.
        for theme in ['light','dark']:
            page.evaluate('theme=>AppAppearance.apply(theme)',theme)
            for width in [1512,1121,1120,980,390]:
                page.set_viewport_size({'width':width,'height':1050 if width==1512 else 844})
                page.wait_for_function('document.documentElement.scrollWidth<=innerWidth+1')
                assert page.locator('.code-input').first.is_editable()
                verify_layout(page,width)
                color=page.locator('.output-item .console-output').first.evaluate('e=>getComputedStyle(e).color')
                assert color=='rgb(217, 222, 234)',color
                page.screenshot(path=str(ARTIFACTS/f'notebook-{args.engine}-{width}-{theme}.png'))
        assert not errors,errors;assert not remote,remote
        print(f'PASS {args.engine}: 21 method/design routes; editable notebook, exports, restart/cancellation, responsive themes and local-only Pyodide',flush=True)
        browser.close()

if __name__=='__main__':main()
