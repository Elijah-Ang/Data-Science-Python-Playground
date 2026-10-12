"""Readable instructions, name roles and prerequisites in static/enhanced pages."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8773')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
args = parser.parse_args()
base = args.base_url.rstrip('/')
out = Path('tests/evidence/learning-language')
out.mkdir(parents=True, exist_ok=True)
report = dict(engine=args.engine, views=[], static=[], inventory={})

with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
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
    assert report['inventory']['ml'] == dict(count=327, failures=[])
    page.goto(base+'/ml-learn-ML-C-K1.html')
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-C-K1-1'")
    assert page.locator('.foundation-practice-brief code').filter(has_text='logistic').count()==0,'Model-family prose is not a table column'
    page.goto(base+'/ml-learn-ML-F01.html')
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-F01-1'")
    assert page.locator('.foundation-task code[data-code-role="variable"]').filter(has_text='answer').count()>0
    data_routes = [(f'data-foundations-{id}.html?practice={i}', id, i) for id in ['I06S','I13L','I19S','I19A'] for i in range(3)]
    data_routes += [('data-foundations-V13.html?practice=2','V13',2), ('data-foundations-WC02.html','WC02',0)]
    ml_routes = [('ml-learn-'+id+'.html'+(f'?practice={i}' if i else ''),id,i) for id,i in [('ML-F02',0),('ML-F02',2),('ML-F-K1',0),('ML-M03',0),('ML-M03',1),('ML-M03',2),('ML-M-K1',0),('ML-X01',0),('ML-X19',0)]]
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
                        assert codes.first.evaluate('(e)=>getComputedStyle(e).textDecorationLine.includes("underline")')
                    assert brief.locator('code[data-code-role="variable"]').filter(has_text='eligible').count()>0
                    text=brief.inner_text()
                    assert 'original order' in text and 'original text' in text and 'Do not replace it' in text
                    assert 'no value was supplied' in text
                    assert not brief.locator('code').filter(has_text='unchanged').count()
                    page.locator('button[data-brief-target="case-deliverables"]').first.click()
                if id=='V13':
                    panel=page.locator('.teaching-transition')
                    assert panel.is_visible() and panel.locator('pre').is_visible()
                    assert panel.locator('a[href="data-foundations-I19S.html"]').count()==1
                if id in ['I06S','I13L','I19S','I19A']:
                    assert page.locator('.teaching-example-output').count()>0
                if id=='ML-M03':
                    text=page.locator('.foundation-content').inner_text()
                    assert all(value in text for value in ['4.4','0.7','4.2','0.6','4.3','0.8','hours'])
                if id=='ML-M-K1':
                    text=page.locator('.foundation-practice-brief').inner_text()
                    assert all(value in text for value in ['0.81','0.1','.95','.2','.51','.52','500','569','90%','seven','two'])
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
    for file in ['data-foundations-I06S.html','data-foundations-I19S.html','data-foundations-I19A.html','data-foundations-WC02.html','ml-learn-ML-F02.html','ml-learn-ML-X01.html']:
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
print(json.dumps(dict(engine=args.engine,authored_states=665,views=len(report['views']),static_pages=len(report['static']),errors=errors)))
