"""Readable instructions, name roles and prerequisites in static/enhanced pages."""
import argparse
import json
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8773')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
parser.add_argument('--executable-path', help='Optional installed browser executable; bundled browsers remain the default.')
args = parser.parse_args()
base = args.base_url.rstrip('/')
out = Path('tests/evidence/learning-language')
out.mkdir(parents=True, exist_ok=True)
report = dict(engine=args.engine, views=[], static=[], inventory={})

with sync_playwright() as p:
    browser_type = getattr(p, args.engine)
    executable = args.executable_path
    if not executable and args.engine == 'chromium' and not Path(browser_type.executable_path).exists():
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
    browser = browser_type.launch(**({'executable_path': executable} if executable else {}))
    context = browser.new_context(service_workers='block')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/data-foundations.html')
    page.wait_for_function('!!window.FoundationsCurriculum')
    report['inventory']['foundations'] = page.evaluate('''()=>{
      const rounds=FoundationsCurriculum.lessons.flatMap(l=>l.rounds);
      const failures=rounds.filter(r=>!LearningLanguage.context(r.id).columns || !LearningLanguage.activity(r).includes('learning-instructions')).map(r=>r.id);
      return {count:rounds.length,failures};
    }''')
    assert report['inventory']['foundations'] == dict(count=338, failures=[])
    page.goto(base + '/ml-learn.html')
    page.wait_for_function('!!window.MLLearning')
    report['inventory']['ml'] = page.evaluate('''()=>{
      const rounds=MLLearning.curriculum.cards.flatMap(c=>c.exercises);
      return {count:rounds.length,failures:rounds.filter(r=>!LearningLanguage.context(r.id).columns || !LearningLanguage.activity(r).includes('learning-instructions')).map(r=>r.id)};
    }''')
    assert report['inventory']['ml'] == dict(count=338, failures=[])
    page.goto(base+'/ml-learn-ML-C-K1.html')
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-C-K1-1'")
    assert page.locator('.foundation-task-reminder code').filter(has_text='logistic').count()==0,'Model-family prose remains ordinary text'
    page.goto(base+'/ml-learn-ML-F01.html')
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-F01-1'")
    assert page.locator('.foundation-task-reminder code[data-code-role="variable"]').filter(has_text='answer').count()>0
    data_routes = [(f'data-foundations-{id}.html?practice={i}', id, i) for id in ['I06S','I13L','I19S','I19A'] for i in range(3)]
    data_routes += [('data-foundations-V13.html?practice=2','V13',2), ('data-foundations-WC02.html','WC02',0)]
    data_routes += [(f'data-foundations-{id}.html'+(f'?practice={i}' if i else ''),id,i) for id,i in [('W19',0),('W19',1),('W22',0),('V09',0),('V04',0)]]
    ml_routes = [('ml-learn-'+id+'.html'+(f'?practice={i}' if i else ''),id,i) for id,i in [('ML-F02',0),('ML-F02',2),('ML-F-K1',0),('ML-M03',0),('ML-M03',1),('ML-M03',2),('ML-M-K1',0),('ML-X01',0),('ML-X19',0),('ML-F11',0),('ML-F12',0),('ML-R01',0),('ML-R01',3)]]
    for width in [1440,320]:
        page.set_viewport_size(dict(width=width,height=1000))
        for theme in ['light','dark']:
            for file,id,index in data_routes+ml_routes:
                page.goto(base+'/'+file)
                if id.startswith('ML-'):
                    page.wait_for_function('(id)=>!!window.MLLearning && MLLearning.activity?.id.startsWith(id)',arg=id)
                else:
                    page.locator('#foundationEditor').wait_for()
                page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
                page.evaluate('document.fonts.ready')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(file,width,theme)
                assert page.locator('.learning-instructions').count()>0,(file,'visible steps')
                assert page.locator('progress,[role="progressbar"],.foundation-continue').count()==0
                if id=='WC02':
                    brief=page.locator('#case-deliverables')
                    for name in ['price','numeric_price']:
                        codes=brief.locator('code[data-code-role="column"]').filter(has_text=name)
                        assert codes.count()>0
                        style=codes.first.evaluate('(e)=>({underline:getComputedStyle(e).textDecorationLine.includes("underline"),border:getComputedStyle(e).borderTopStyle,width:parseFloat(getComputedStyle(e).borderTopWidth),background:getComputedStyle(e).backgroundColor})')
                        assert not style['underline'] and style['border']=='solid' and style['width']>=1 and style['background']!='rgba(0, 0, 0, 0)',style
                    assert brief.locator('code[data-code-role="variable"]').filter(has_text='eligible').count()>0
                    text=brief.inner_text()
                    assert 'original order' in text and 'original text' in text and 'Do not replace it' in text
                    assert 'no value was supplied' in text
                    assert not brief.locator('code').filter(has_text='unchanged').count()
                    page.locator('button[data-brief-target="case-deliverables"]').first.click()
                if id=='V13':
                    panel=page.locator('.teaching-transition')
                    assert panel.is_visible() and panel.locator('pre').is_visible()
                    assert panel.locator('a[href*="data-foundations-I19S.html"]').count()==1
                if id in ['I06S','I13L','I19S','I19A']:
                    assert page.locator('.teaching-example-output').count()>0,(file,width,theme,'worked-example table remains available')
                    if index:
                        brief=page.locator('.foundation-task-reminder')
                        assert brief.is_visible() and brief.get_attribute('aria-label')=='Current task'
                        assert brief.locator('.learning-instructions > li').count()>=2
                        assert brief.locator('.foundation-eyebrow code').count()==0,'Dataset metadata remains prose'
                        reference=page.locator('.foundation-reference')
                        assert reference.count()==1 and reference.locator(':scope > summary').inner_text()=='Reference'
                        reference.locator(':scope > summary').click()
                        assert reference.get_by_role('heading',name='Related syntax',exact=True).is_visible(),(file,'flat syntax reference')
                        assert reference.locator('details').count()==0,'Reference has flat support sections'
                        reference.locator(':scope > summary').click()
                if id=='ML-M03':
                    evidence=page.locator('.ml-provided-evidence')
                    assert evidence.count()==1 and evidence.is_visible(),'Required reporting inputs appear beside the current task'
                    assert evidence.locator('h3').inner_text()=='Evidence to use'
                    text=evidence.inner_text()
                    assert all(value in text for value in ['4.4','0.7','4.2','0.6','4.3','0.8','hours'])
                    assert page.locator('[data-learning-mode]').count()==0,'The unrequested explanation-mode controls are removed'
                    if not index:
                        for name in ['cv_rmse','fold_sd']:
                            column=page.locator('.ml-syntax code[data-code-role="column"]').filter(has_text=re.compile("^['\"]?"+name+"['\"]?$"))
                            assert column.count()>0 and column.first.is_visible(),(file,name,'explicit column definition')
                if id in ['ML-F11','ML-F12','ML-R01']:
                    reference=page.locator('.ml-reference')
                    assert reference.count()==1 and reference.locator(':scope > summary').inner_text()=='Reference'
                    reference.locator(':scope > summary').click()
                    assert reference.locator('details').count()==0,'Machine Learning Reference also has flat support sections'
                    for name in ['X','y']:
                        assert reference.locator('code[data-code-role="variable"]').filter(has_text=re.compile('^'+name+'$')).count()>0,(file,name,'aligned feature/target objects')
                    if id in ['ML-F11','ML-F12'] or index==3:
                        for name in ['candidates','cv_results']:
                            objects=reference.locator('.ml-contract code[data-code-role="variable"]').filter(has_text=re.compile('^'+name+'$'))
                            assert objects.count()>0 and objects.first.is_visible(),(file,name,'structured output inventory objects')
                        assert reference.locator('code[data-code-role="parameter"]').filter(has_text=re.compile('^n_splits$')).count()>0,(file,'n_splits parameter explanation')
                        dictionaries=reference.locator('[data-code-table="dictionary"]')
                        assert dictionaries.count()>0 and dictionaries.locator('td:first-child code[data-code-role="column"]').count()>0,(file,'schema names in explanatory table')
                    else:
                        assert page.locator('.ml-provided-note code[data-code-role="variable"]').filter(has_text=re.compile('^model$')).is_visible(),(file,'supplied fitted model object')
                    reference.locator(':scope > summary').click()
                if id=='ML-M-K1':
                    text=page.locator('.ml-choice').inner_text()
                    assert all(value in text for value in ['0.81','0.1','.95','.2','.51','.52','500','569','90%','seven','two'])
                if id=='I19S':
                    if not index:
                        for name in ['medians','ranked','order']:
                            assert page.locator('.foundation-content code[data-code-role="variable"]').filter(has_text=name).count()>0,(id,name)
                            assert page.locator('.teaching-example-output code[data-code-role="variable"]').filter(has_text=name).count()>0,(id,'object table',name)
                if id=='I19A' and index==1:
                    task=page.locator('.foundation-task-reminder')
                    assert task.locator('code[data-code-role="variable"]').filter(has_text='checks').count()>0
                    assert task.locator('code[data-code-role="column"]').filter(has_text='checks').count()>0
                if id in ['W19','W22'] and not index:
                    for name in (['mean_amount','records'] if id=='W19' else ['measure','value']):
                        assert page.locator('.foundation-task-reminder code[data-code-role="column"]').filter(has_text=name).count()>0,(id,name)
                if id=='W19' and index==1:
                    assert page.locator('.foundation-task-reminder code[data-code-role="column"]').filter(has_text='size').count()>0
                    reference=page.locator('.foundation-reference')
                    reference.locator(':scope > summary').click()
                    reminder=page.locator('.foundation-reference-content')
                    assert reminder.locator('code[data-code-role="operation"]').filter(has_text='size').count()>0
                if id=='V09':
                    task=page.locator('.foundation-task-reminder')
                    assert task.locator('code[data-code-role="column"]').filter(has_text='fare').count()>0
                    assert 'Bus fare receipts' in task.inner_text()
                    assert task.locator('li').filter(has_text='Title:').locator('code[data-code-role="column"]').count()==0,'Display title is literal'
                if id=='V04':
                    assert page.locator('.foundation-task-reminder code[data-code-role="column"]').filter(has_text='stone').count()==0,'Ordinary entity noun remains prose'
                    illustrative=page.locator('.teaching-visual-data th[scope="row"] code[data-code-role="column"]').filter(has_text=re.compile('^value$'))
                    assert illustrative.count()>0,(file,'illustrative dictionary declares its own value column')
                assert page.locator('.foundation-editor-wrap code.code-identifier,pre code.code-identifier[data-code-role="column"],pre code.code-identifier[data-code-role="variable"]').count()==0,'Python blocks retain syntax highlighting'
                report['views'].append(dict(id=id,index=index,width=width,theme=theme))
                if id in ['I19S','WC02','ML-F-K1','ML-M-K1'] and index==0:
                    page.screenshot(path=str(out/f'{args.engine}-{id}-{width}-{theme}.png'))
    page.goto(base+'/learn.html')
    planned=page.locator('button[data-path="statistics"]')
    assert planned.count()==1 and planned.get_attribute('data-coming-soon')=='Statistics'
    previous=page.url
    planned.click()
    assert page.url==previous and page.locator('#pathAnnouncement').inner_text()=='Statistics lessons are coming soon.'
    # Static reading has the same names/steps and ordinary crawlable links.
    static=browser.new_context(java_script_enabled=False,service_workers='block',viewport=dict(width=320,height=1000))
    nojs=static.new_page()
    for file in ['data-foundations-I06S.html','data-foundations-I19S.html','data-foundations-I19A.html','data-foundations-W19.html','data-foundations-W22.html','data-foundations-V09.html','data-foundations-WC02.html','ml-learn-ML-F02.html','ml-learn-ML-X01.html']:
        nojs.goto(base+'/'+file)
        assert nojs.locator('.learning-instructions').count()>0,file
        canonical=nojs.locator('link[rel="canonical"]').get_attribute('href')
        assert canonical=='https://dataplayground.science/'+file
        assert nojs.locator('main a[href^="#"]').count()==0,file
        assert nojs.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),file
        if file.endswith('WC02.html'):
            assert nojs.locator('#case-deliverables code[data-code-role="column"]').filter(has_text='numeric_price').count()>0
            assert nojs.locator('.case-fields dt code[data-code-role="column"]').filter(has_text='price').count()>0
        report['static'].append(file)
    assert not errors,errors
    browser.close()
(out/f'{args.engine}-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(dict(engine=args.engine,authored_states=sum(item['count'] for item in report['inventory'].values()),views=len(report['views']),static_pages=len(report['static']),errors=errors)))
