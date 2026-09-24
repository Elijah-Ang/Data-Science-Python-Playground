"""Rendered route, responsive, keyboard, receipt and no-persistence acceptance checks."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8128')
parser.add_argument('--engine',default='chromium',choices=['chromium','webkit'])
parser.add_argument('--runtime',choices=['local','remote'],default='local')
args=parser.parse_args()
out=Path('tests/evidence/ml-learning');out.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as p:
    browser=getattr(p,args.engine).launch()
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script("""window.__mlRunPosts=0;window.__mlWorkerCount=0;window.__mlWrites=[];
      const NativeWorker=Worker;
      window.Worker=class extends NativeWorker{
        constructor(...args){super(...args);window.__mlWorkerCount++;}
        postMessage(message,...rest){if(message.type==='run')window.__mlRunPosts++;return super.postMessage(message,...rest);}
      };
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){window.__mlWrites.push(key);return original.call(this,key,value);};
    """)
    page.goto(args.base_url+'/learn.html')
    assert page.locator('a[data-path="ml"]').get_attribute('href')=='ml-learn.html?from=learn'
    assert page.locator('button[data-path="statistics"]').count()==1
    page.goto(args.base_url+'/ml-learn.html'+('?runtime=local' if args.runtime=='local' else ''))
    page.wait_for_function('!!window.MLLearning')
    assert page.locator('.foundation-decks .foundation-deck').count()==9
    assert page.locator('.ml-orientation,.ml-index,.ml-concepts-nav').count()==0
    assert page.get_by_role('link',name='Workflow Challenges',exact=False).count()==1
    assert page.locator('[aria-current="location"]').inner_text().strip()=='ML'
    registry=page.evaluate('MLLearning.curriculum')
    # Concept-only routes must not even instantiate a Python worker.
    assert page.evaluate('__mlRunPosts')==0
    assert page.evaluate('__mlWorkerCount')==0
    for index,label in enumerate(['Follow','Change','Transfer']):
        page.evaluate('(hash)=>location.hash=hash',f'#foundations/ML-F04/{index}')
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=f'ML-F04-{index+1}')
        if index==0:assert page.locator('.foundation-task').is_visible()
        assert page.locator('.foundation-practice-brief').count()==(0 if index==0 else 1)
        assert page.locator('.teaching-overview').count()==(1 if index==0 else 0)
        assert page.locator('section.ml-syntax .ml-syntax-parts').is_visible()
        assert page.locator('.foundation-practices a,.foundation-practices button,.ml-exercise-tabs').count()==0
        assert page.locator('.foundation-lesson-heading .foundation-practices [aria-current="step"] strong').inner_text()==label
        assert page.locator('.ml-syntax').evaluate('(e)=>!e.closest("details")')
        assert page.locator('.ml-syntax-parts code span').evaluate_all('(nodes)=>nodes.every(e=>getComputedStyle(e).display!=="none")')
        assert page.locator('#mlHighlight .py-comment,#mlHighlight .py-function').count()>0

    page.evaluate("location.hash='#foundations/ML-F08/1'")
    page.wait_for_function("MLLearning.activity?.id==='ML-F08-2'")
    page.locator('input[name="mlChoice"]').first.check()
    page.locator('#mlConceptCheck').click()
    assert page.locator('#mlConceptResult').inner_text()
    assert page.evaluate('__mlWorkerCount')==0
    for deck in registry['decks']:
        page.evaluate('(hash)=>location.hash=hash','#'+deck['id'])
        page.wait_for_selector('.lesson-library')
        assert page.locator('.lesson-card .concept-visual').count()==len([c for c in registry['cards'] if c['deck']==deck['id']])
        assert page.locator('.chapter-jumps a').count()>0

    # Every card and every challenge must render from its canonical route.
    for card in registry['cards']:
        page.evaluate('(hash)=>location.hash=hash','#'+card['deck']+'/'+card['id']+'/0')
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=card['exercises'][0]['id'])
        assert page.get_by_role('heading',name=card['title'],exact=True).is_visible()
        if card['kind']=='teaching':
            assert page.locator('.ml-concept svg').count()==1
            assert page.locator('.ml-concept figcaption').inner_text().startswith('Schematic')
            clipped=page.locator('.ml-concept svg text').evaluate_all('(nodes)=>nodes.filter(n=>{const b=n.getBBox();return b.x<0||b.y<0||b.x+b.width>560.5||b.y+b.height>235.5}).map(n=>n.textContent)')
            assert not clipped,(card['id'],clipped)
        if card['id']=='ML-F-K1':
            design=page.locator('.ml-validation-design').inner_text()
            assert '20%' in design and '42' in design and 'folds' not in design
    for challenge in registry['challenges']:
        page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+challenge['id'])
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=challenge['id'])
        assert page.get_by_role('heading',name=challenge['title'],exact=True).is_visible()
        assert page.locator('#case-help').get_attribute('open') is None
        assert page.locator('.foundation-breadcrumb').inner_text().split()==['Machine','Learning','/','Workflow','Challenges','/',challenge['id']]
        assert page.locator('.ml-deliverable-groups > li').count()==4
        assert page.get_by_role('link',name='Download challenge input CSV',exact=True).get_attribute('href')==challenge['exercise']['inputFile']
        assert page.get_by_role('link',name='Original source dataset',exact=True).count()==1
        assert 'fit(' not in page.locator('#mlEditor').input_value()
        if challenge['exercise'].get('protect'):
            design=page.locator('.ml-validation-design').inner_text()
            assert '20%' in design and 'five' in design
            assert ('forward' if challenge['exercise']['protect'].get('time') else '42') in design
    # Discovery workflows have no prediction target, dummy or reserved final test.
    for route,activity,expected in [
        ('#clustering/ML-U07/3','ML-U07-4','build hierarchy'),
        ('#pca/ML-P02/3','ML-P02-4','fit PCA'),
    ]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=activity)
        assert expected in page.locator('.ml-editor-route').inner_text()
        assert 'reserved final test' not in page.locator('.ml-editor-route').inner_text()
        assert 'baseline, training validation' not in page.locator('.teaching-reference').filter(has_text='Guided full workflow:').first.inner_text()
    for id in ['ML-X17','ML-X18','ML-X19']:
        page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+id)
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=id)
        assert 'no prediction target or reserved final test' in page.locator('.ml-workflow-map > p').inner_text()
    page.evaluate("location.hash='#workflow/ML-W-K3/0'")
    page.wait_for_function("MLLearning.activity?.id==='ML-W-K3-1'")
    assert 'choose Regression or Classification' in page.locator('.teaching-note').inner_text()
    for route,id,question in [
        ('#regression/ML-R01/0','ML-R01-1',False),
        ('#regression/ML-R02/2','ML-R02-3',False),
        ('#foundations/ML-F-R1/0','ML-F-R1-1',False),
        ('#regression/ML-R-R2/2','ML-R-R2-3',True),
        ('#foundations/ML-F-K1/0','ML-F-K1-1',True),
        ('#foundations/ML-F11/0','ML-F11-1',True),
        ('#pca/ML-P02/3','ML-P02-4',True),
        ('#workflows/challenges/ML-X19','ML-X19',True),
    ]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(activity)=>MLLearning.activity?.id===activity',arg=id)
        assert bool(page.locator('#mlReflection').count())==question,id
        if question:
            assert page.locator('#mlReflectionQuestion').inner_text().strip().endswith('?'),id
            assert 'not machine-graded or saved' in page.locator('#mlReflectionHelp').inner_text(),id
    for width in [1440,1280,1024,768,390,320]:
        page.set_viewport_size({'width':width,'height':960})
        for theme in ['light','dark']:
            page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
            for route in ['','#classification/ML-C14/0','#networks','#workflows/challenges/ML-X15','#foundations/ML-F11/0','#foundations/ML-F12/1','#workflow/ML-W15/2','#workflow/ML-W-K2/0','#workflow/ML-W-K3/0','#clustering/ML-U07/3','#pca/ML-P02/3']:
                page.evaluate('(hash)=>location.hash=hash',route)
                page.wait_for_timeout(70)
                overflow=page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1')
                assert not overflow,(width,theme,route,'horizontal page overflow')
                if width in [320,390] and route in ['#clustering/ML-U07/3','#pca/ML-P02/3']:
                    columns=page.locator('.foundation-practices ol').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
                    assert columns==2,(width,route,columns)
                if width in [1440,390] and theme=='light':
                    name=(route or 'landing').replace('#','').replace('/','-')
                    page.screenshot(path=str(out/(args.engine+'-'+str(width)+'-'+name+'.png')),full_page=True)
    # Faded support and readiness: essential content visible, explanation never auto-graded.
    for route,id in [('#foundations/ML-F11/0','ML-F11-1'),('#foundations/ML-F11/1','ML-F11-2'),('#foundations/ML-F12/2','ML-F12-3'),('#workflow/ML-W15/1','ML-W15-2'),('#workflow/ML-W-K2/0','ML-W-K2-1'),('#workflow/ML-W-K3/0','ML-W-K3-1')]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=id)
        assert page.get_by_role('heading',name='The question and data dictionary').count()==1
        assert page.locator('.ml-workflow-map li').count()==8
        assert page.locator('.ml-workflow-map').evaluate('(e)=>!e.closest("details")')
        assert page.locator('.ml-rubric > li').count()==5
        assert page.locator('.ml-rubric > li').evaluate_all('(rows)=>rows.every(row=>row.querySelector("strong")?.textContent&&row.querySelector("span")?.textContent)')
        assert page.locator('#mlReflection').count()==1
        assert 'not machine-graded' in page.locator('#mlReflection + p').inner_text()
        assert page.locator('.ml-concept svg').count()==1
        assert page.locator('.foundation-practices button,.foundation-practices a').count()==0
        if '-K' in id:assert 'fit(' not in page.locator('#mlEditor').input_value()
    # Desktop lessons must keep both long panes and navigation inside the viewport.
    for width in [1440,801]:
        page.set_viewport_size({'width':width,'height':900})
        page.evaluate("location.hash='#foundations/ML-F03/0'")
        page.wait_for_function("window.MLLearning?.activity?.id==='ML-F03-1'")
        geometry=page.evaluate('''() => {
          const lesson=document.querySelector('.ml-lesson');
          const content=document.querySelector('.foundation-content');
          const editor=document.querySelector('.ml-code-pane');
          const next=document.querySelector('.foundation-navigation');
          return {lessonBottom:lesson.getBoundingClientRect().bottom,
            nextBottom:next.getBoundingClientRect().bottom,
            contentOverflow:content.scrollHeight-content.clientHeight,
            editorOverflow:editor.scrollHeight-editor.clientHeight};
        }''')
        assert geometry['lessonBottom']<=901 and geometry['nextBottom']<=901,(width,geometry)
        assert geometry['contentOverflow']>100 and geometry['editorOverflow']>100,(width,geometry)
    # Shared neural Next ends at a fork; task-specific paths do not cross branches.
    page.emulate_media(forced_colors='active',reduced_motion='reduce')
    page.evaluate("location.hash='#workflows/challenges/ML-X19'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-X19'")
    assert page.locator('#mlRun').is_visible()
    assert page.locator('.ml-contract').evaluate('(e)=>!e.closest("details")')
    assert 'weights' in page.locator('.ml-contract').inner_text()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.emulate_media(forced_colors='none',reduced_motion='no-preference')
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("document.documentElement.style.zoom='2'")
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.evaluate("document.documentElement.style.zoom=''")
    page.evaluate("location.hash='#networks/ML-N-R1/2'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-N-R1-3'")
    assert page.locator('.foundation-navigation a').last.get_attribute('href')=='#networks'
    page.evaluate("location.hash='#networks/ML-N04/3'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-N04-4'")
    assert 'ML-N-K1' in page.locator('.foundation-navigation a').last.get_attribute('href')
    # Real UI Run + repeated Check must not make additional worker run requests.
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("location.hash='#workflow/ML-W-K1/0'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K1-1'")
    solution=page.evaluate('MLLearning.activity.solution')
    page.locator('#mlEditor').fill(solution)
    page.locator('#mlRun').click()
    page.wait_for_function("document.getElementById('mlStatus').textContent.startsWith('Run finished')",timeout=180000)
    calls=page.evaluate('__mlRunPosts')
    for _ in range(5):page.locator('#mlCheck').click()
    assert page.evaluate('__mlRunPosts')==calls
    assert page.locator('#mlResults .needs-attention,#mlResults .unavailable').count()==0
    assert page.evaluate('MLLearning.retainedReceipts')==1
    page.locator('#mlEditor').fill(solution+'\n# Edited')
    page.locator('#mlCheck').click()
    assert 'Run the current code first' in page.locator('#mlFeedback').inner_text()
    assert page.evaluate('MLLearning.retainedReceipts')==0
    # Keyboard escape exits the editor; navigation/reload discards the draft.
    page.locator('#mlEditor').focus();page.keyboard.press('Escape');page.keyboard.press('Tab')
    assert page.locator('#mlRun').evaluate('(e)=>e===document.activeElement')
    page.reload();page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K1-1'")
    assert page.locator('#mlEditor').input_value()!=solution
    page.evaluate("location.hash='#workflow/ML-W-K2/0'")
    page.wait_for_function("MLLearning.activity?.id==='ML-W-K2-1'")
    readiness=page.evaluate('MLLearning.activity.solution')
    page.locator('#mlEditor').fill(readiness)
    page.locator('#mlRun').click()
    page.wait_for_function("!document.getElementById('mlRun').disabled",timeout=180000)
    page.locator('#mlCheck').click()
    assert page.locator('#mlResults .needs-attention,#mlResults .unavailable').count()==0
    assert page.locator('#mlResults .self-review').count()==1
    assert 'not automatically verified' in page.locator('#mlResults .self-review').inner_text()
    page.locator('#mlReflection').fill('My interpretation is self-review, not an automatic pass.')
    page.locator('#mlEditor').fill(readiness.replace("['jobs_waiting', 'device_age_years']", "['jobs_waiting', 'invoice_labor_hours']"))
    page.locator('#mlRun').click()
    page.wait_for_function("!document.getElementById('mlRun').disabled",timeout=180000)
    page.locator('#mlCheck').click()
    assert 'Critical boundary' in page.locator('#mlResults .needs-attention').inner_text()
    page.reload();page.wait_for_function("MLLearning.activity?.id==='ML-W-K2-1'")
    page.locator('#mlReflection').wait_for()
    assert page.locator('#mlReflection').input_value()==''
    writes=page.evaluate('__mlWrites')
    assert not any('learning' in key.lower() or 'foundation' in key.lower() for key in writes),writes
    assert not errors,errors
    browser.close()
print(args.engine,'all card/challenge routes, six widths, themes, task forks, real Run/Check, keyboard and no learning persistence passed.')
