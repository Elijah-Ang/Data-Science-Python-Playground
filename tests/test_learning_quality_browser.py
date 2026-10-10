"""Focused production QA: inference labels, supplied report evidence and static briefs."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8000')
parser.add_argument('--engine',choices=['chromium','webkit'],default='chromium')
parser.add_argument('--runtime',choices=['remote','local'],default='remote')
parser.add_argument('--screenshots',default='tests/evidence/learning-quality')
args=parser.parse_args();base=args.base_url.rstrip('/');out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True)
errors=[];proof=[]

def snapshot(page,name):
    assert not page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1'),name
    page.screenshot(path=str(out/(name+'.png')),full_page=True)

with sync_playwright() as pw:
    browser=getattr(pw,args.engine).launch()
    # Reading the actual authored brief must work before any client application runs.
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page()
    for width in (1440,390):
        page.set_viewport_size({'width':width,'height':1000})
        for file in ('ml-learn-ML-X01.html','ml-learn-ML-X19.html','data-foundations-IC01.html','data-foundations-VC01.html'):
            response=page.goto(base+'/'+file);assert response.status==200
            brief=page.locator('[aria-label="Challenge brief"]');assert brief.is_visible()
            assert brief.locator('#case-inputs').count()==1 and brief.locator('#case-deliverables').count()==1
            assert brief.locator('#case-help').count()==1 and len(brief.inner_text())>700
            assert page.locator('link[rel="canonical"]').get_attribute('href')=='https://dataplayground.science/'+file
            assert page.locator('.back-playground').get_attribute('href').endswith('-challenges.html')
            snapshot(page,'static-'+file.removesuffix('.html')+'-'+str(width))
        page.goto(base+'/ml-learn-workflows-challenges.html')
        link=page.locator('a.case-file[href="ml-learn-ML-X01.html"]');assert link.count()==1
        link.click();assert page.url.endswith('/ml-learn-ML-X01.html')
    page.goto(base+'/learn.html')
    planned=page.locator('[data-coming-soon="Statistics"]')
    assert planned.evaluate('e=>e.tagName')=='BUTTON' and 'Coming soon' in planned.text_content()
    assert planned.get_attribute('href') is None
    context.close();proof.append('Static authored briefs, collections, canonical identity and unchanged Statistics Coming soon entry')

    context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/ml-learn-ML-M03.html?runtime='+args.runtime)
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-M03-1'")
    for width in (1440,390,320):
        page.set_viewport_size({'width':width,'height':1000})
        for index in range(3):
            page.evaluate('(index)=>location.hash="#comparison/ML-M03/"+index',index)
            page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=f'ML-M03-{index+1}')
            article=page.locator('[aria-label="Lesson content"]').inner_text()
            for text in ('Illustrative reporting evidence','hours','dummy 4.4 / 0.7','linear 4.2 / 0.6','tree 4.3 / 0.8','same five','no final-test result','not confidence intervals'):
                assert text in article,(width,index,text)
            assert page.locator('.ml-data-preview').count()==0
            assert 'Given data' not in article
            snapshot(page,'M03-'+str(index+1)+'-'+str(width))
            page.locator('[aria-label="Lesson content"]').screenshot(path=str(out/('M03-evidence-'+str(index+1)+'-'+str(width)+'.png')))
    page.evaluate('location.hash="#comparison/ML-M03/0"');page.wait_for_function("window.MLLearning?.activity?.id==='ML-M03-1'")
    solution=page.evaluate('MLLearning.activity.solution')
    def run(code):
        page.locator('#mlEditor').fill(code);page.locator('#mlRun').click()
        page.wait_for_function("!document.querySelector('#mlRun').disabled",timeout=180000)
        assert page.locator('#mlStatus').inner_text().startswith('Run finished'),page.locator('#mlStatus').inner_text()
        page.locator('#mlCheck').click()
    run(solution);assert page.locator('#mlResults .needs-attention,#mlResults .unavailable').count()==0
    assert 'dummy' in page.locator('#mlOutput').inner_text()
    run(solution+"\nanswer.loc[0,'cv_rmse']=5.4")
    assert page.locator('#mlResults .needs-attention').count()>0
    page.get_by_role('link',name='Next practice →',exact=True).click()
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-M03-2'")
    page.locator('input[name="mlChoice"][value="0"]').check();page.locator('#mlConceptCheck').click()
    assert 'Reconsider' in page.locator('#mlConceptResult').inner_text()
    page.locator('input[name="mlChoice"][value="1"]').check();page.locator('#mlConceptCheck').click()
    assert 'Consistent reasoning' in page.locator('#mlConceptResult').inner_text()
    page.get_by_role('link',name='Next practice →',exact=True).click()
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-M03-3'")
    page.locator('#mlExplain').fill('The gain is small on matching development folds; no final-test result yet.')
    page.locator('#mlConceptCheck').click();assert '12 minutes' in page.locator('#mlConceptResult').inner_text()
    context.close();proof.append('All M03 states, real Python solution, wrong baseline rejection, decision and self-review')

    context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    for family,deck,id in [('ml','workflows','ML-X01'),('ml','workflows','ML-X19'),('data','inspect','IC01'),('data','wrangle','WC01'),('data','visualise','VC01')]:
        prefix='ml-learn' if family=='ml' else 'data-foundations';file=prefix+'-'+id+'.html'
        page.goto(base+'/'+file+'?runtime='+args.runtime+'&from=learn')
        page.wait_for_selector('[aria-label="Challenge brief"]')
        if family=='ml':page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=id)
        editor=page.locator('#mlEditor' if family=='ml' else '#foundationEditor')
        starter=editor.input_value();assert starter.strip()
        editor.fill(starter+'\n# transient QA edit')
        page.get_by_role('link',name='All challenges',exact=True).click();page.wait_for_selector('.case-file')
        assert page.url.split('?')[0].endswith(prefix+'-'+deck+'-challenges.html')
        page.locator('a.case-file[href^="'+file+'"]').click();page.wait_for_selector('[aria-label="Challenge brief"]')
        assert editor.input_value()==starter,'Navigation must start from this brief starter'
        page.go_back();page.wait_for_selector('.case-file');page.go_forward();page.wait_for_selector('[aria-label="Challenge brief"]')
        page.reload();page.wait_for_selector('[aria-label="Challenge brief"]');assert editor.input_value()==starter
        page.goto(base+'/'+prefix+'.html#'+deck+'/challenges/'+id);page.wait_for_selector('[aria-label="Challenge brief"]')
        assert page.locator('link[rel="canonical"]').get_attribute('href')=='https://dataplayground.science/'+file
        assert editor.input_value()==starter
        for width in (1440,390):
            page.set_viewport_size({'width':width,'height':1000})
            page.locator('[data-brief-target="case-deliverables"]').first.click()
            snapshot(page,'enhanced-'+id+'-'+str(width))
    context.close();proof.append('Direct, collection, legacy, reload and back/forward brief identity; no retained practice edits')

    context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/statistics.html?runtime='+args.runtime)
    page.wait_for_function('window.StatisticsPlayground?.ready',timeout=180000)
    page.locator('#runAllButton').click()
    page.wait_for_function('window.StatisticsPlayground?.cells.filter(c=>c.status==="done").length===window.StatisticsPlayground?.activeRouteLength',timeout=180000)
    state=page.evaluate('({plan:StatisticsPlayground.plan,output:StatisticsPlayground.cells.at(-1).output})')
    assert state['plan']['method']=='welch' and not state['output']['edited']
    assert state['output']['scalars']['p_value']>=state['plan']['config']['alpha']
    assert state['output']['null_hypothesis']==state['plan']['hypotheses']['null']
    assert state['output']['null_hypothesis'] not in state['output']['interpretation']
    final=page.locator('[data-output-for="conclude"]')
    assert 'does not establish equality' in final.inner_text()
    assert final.locator('p').filter(has_text='Null hypothesis tested (not a conclusion):').count()==1
    for width in (1440,390):
        page.set_viewport_size({'width':width,'height':1000})
        # Crossing the real responsive breakpoint replaces output nodes. Wait
        # for the conclusion to move into its final host before resolving it.
        page.wait_for_function('''()=>{
            const output=document.querySelector('[data-output-for="conclude"]');
            return !!output && (matchMedia('(max-width:1120px)').matches
                ? !!output.closest('.cell-inline-output') : !!output.closest('#outputList'));
        }''')
        final.scroll_into_view_if_needed();snapshot(page,'statistics-conclusion-'+str(width))
        final.screenshot(path=str(out/('statistics-interpretation-'+str(width)+'.png')))
    context.close();proof.append('Real default Penguin computation with separate evidence and labelled null at desktop/mobile')
    browser.close()

assert not errors,errors
(out/'focused-results.json').write_text(json.dumps({'engine':args.engine,'runtime':args.runtime,'passed':proof,'pageErrors':errors},indent=2)+'\n')
print(json.dumps({'engine':args.engine,'passed':proof,'pageErrors':errors},indent=2))
