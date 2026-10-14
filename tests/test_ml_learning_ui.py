"""Rendered route, responsive, keyboard, receipt and no-persistence acceptance checks."""
import argparse
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8128')
parser.add_argument('--engine',default='chromium',choices=['chromium','webkit'])
parser.add_argument('--runtime',choices=['local','remote'],default='local')
parser.add_argument('--executable-path',help='Optional local browser binary; CI uses Playwright engines by default.')
args=parser.parse_args()
out=Path('tests/evidence/ml-learning');out.mkdir(parents=True,exist_ok=True)
errors=[]
error_details=[]
worker_urls=[]
phase='route and layout checks'
with sync_playwright() as p:
    browser=getattr(p,args.engine).launch(**({'executable_path':args.executable_path} if args.executable_path else {}))
    page=browser.new_page(viewport={'width':1440,'height':1000})
    def record_error(error):
        errors.append(str(error))
        detail={'message':str(error),'stack':error.stack,'phase':phase,'url':page.url,'workers':list(worker_urls)}
        error_details.append(detail)
        (out/(args.engine+'-ui-page-errors.json')).write_text(json.dumps(error_details,indent=2))
        print(json.dumps({'engine':args.engine,'pageError':detail}),flush=True)
    page.on('pageerror',record_error)
    page.on('worker',lambda worker:worker_urls.append({'url':worker.url,'phase':phase}))
    def file_name(address):return urlsplit(address).path.rsplit('/',1)[-1]
    def open_details(selector):
        details=page.locator(selector)
        assert details.count()==1,selector
        if details.get_attribute('open') is None:details.locator(':scope > summary').click()
        return details
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
    ml_link=page.locator('a[data-path="ml"]').get_attribute('href')
    assert file_name(ml_link)=='ml-learn.html' and parse_qs(urlsplit(ml_link).query)['from']==['learn']
    planned=page.locator('button[data-path="statistics"]')
    assert planned.count()==1 and planned.get_attribute('data-coming-soon')=='Statistics'
    assert 'coming soon' in planned.inner_text().lower()
    hub_url=page.url;planned.click()
    assert page.url==hub_url and page.locator('#pathAnnouncement').inner_text()=='Statistics lessons are coming soon.'
    # The existing Statistics workspace remains reachable separately from planned lessons.
    page.goto(args.base_url+'/statistics.html')
    assert page.locator('.mode-link[aria-current="page"]').get_attribute('aria-label')=='Statistics Playground'
    page.goto(args.base_url+'/ml-learn.html'+('?runtime=local' if args.runtime=='local' else ''))
    page.wait_for_function('!!window.MLLearning')
    assert page.locator('section[aria-labelledby="ml-start"] .foundation-deck').count()==2
    assert page.locator('section[aria-labelledby="ml-start"] .foundation-deck').evaluate_all('(cards)=>cards.map(card=>card.dataset.deck)')==['foundations','workflow']
    assert page.locator('.foundation-deck[data-collection]').count()==len(page.evaluate('MLLearning.curriculum.collections'))==23
    assert page.locator('[data-collection-group]').evaluate_all('(groups)=>groups.map(group=>group.dataset.collectionGroup)')==['quantity','classes','neural','discovery','capstone']
    assert [file_name(href) for href in page.locator('.ml-subject-libraries a').evaluate_all('(links)=>links.map(link=>link.href)')]==['ml-learn-'+deck+'.html' for deck in ['foundations','workflow','regression','classification','networks','clustering','pca','comparison']]
    assert page.locator('.ml-orientation,.ml-index,.ml-concepts-nav').count()==0
    assert page.get_by_role('link',name='Workflow Challenges',exact=False).count()==1
    assert page.locator('[aria-current="location"]').inner_text().strip()=='ML'
    registry=page.evaluate('MLLearning.curriculum')
    assert len(registry['cards'])==110 and sum(len(c['exercises']) for c in registry['cards'])==338
    assert sum(bool(e.get('modelBridge')) for c in registry['cards'] for e in c['exercises'])==17
    # Concept-only routes must not even instantiate a Python worker.
    assert page.evaluate('__mlRunPosts')==0
    assert page.evaluate('__mlWorkerCount')==0
    for index,label in enumerate(['Follow','Change','Transfer']):
        page.evaluate('(hash)=>location.hash=hash',f'#foundations/ML-F04/{index}')
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=f'ML-F04-{index+1}')
        assert page.locator('.foundation-task-reminder').is_visible()
        assert page.locator('.foundation-task-reminder').count()==1
        assert page.locator('.foundation-practice-brief').count()==0
        assert page.locator('.teaching-overview').count()==1
        guidance=page.evaluate('MLLearning.activity.syntaxGuidance')
        if guidance['current']:
            syntax=page.locator('section.ml-syntax')
            assert syntax.locator('.ml-syntax-parts').is_visible()
            assert syntax.locator('.ml-syntax-parts code span').evaluate_all('(nodes)=>nodes.every(e=>getComputedStyle(e).display!=="none")')
        else:assert not page.locator('.ml-syntax').count()
        assert page.locator('.foundation-practices li').count()==3
        assert page.locator('.foundation-practices a').count()==0
        assert page.locator('.foundation-practices button,.ml-exercise-tabs').count()==0
        assert page.locator('.foundation-lesson-heading .foundation-practices [aria-current="step"] strong').inner_text()==label
        assert page.locator('.ml-reference').count()==0
        assert not page.locator('details details,.learning-depth,.teaching-orientation').count()
        assert page.locator('.foundation-reference-content > details > summary').all_text_contents()==['Hints','Explained solution']
        assert page.locator('#mlHighlight .py-comment,#mlHighlight .py-function').count()>0

    # A practice sentence appears once; long generated setup stays available on demand.
    page.evaluate("location.hash='#regression/ML-R02/2'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-R02-3'")
    prompt=page.locator('.foundation-task-reminder')
    assert prompt.count()==1 and prompt.is_visible()
    assert not page.locator('.foundation-practice-brief').count()
    assert 'evaluation_mean' in prompt.inner_text() and 'training_mean' in prompt.inner_text()
    setup_case=next((card,ex) for card in registry['cards'] for ex in card['exercises'] if ex.get('setup') and not (card['kind']=='teaching' and ex is card['exercises'][0]))
    card,ex=setup_case
    page.evaluate('(hash)=>location.hash=hash',f"#{card['deck']}/{card['id']}/{card['exercises'].index(ex)}")
    page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=ex['id'])
    assert page.locator('.ml-provided-state').count()==0
    assert page.evaluate('MLLearning.activity.setup')==ex['setup']

    page.evaluate("location.hash='#foundations/ML-F08/1'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-F08-2'")
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
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=card['exercises'][0]['id'])
        assert page.get_by_role('heading',name=card['title'],exact=True).is_visible()
        if card['kind']=='teaching':
            visual=page.locator('.teaching-overview > .ml-concept,.teaching-overview > .teaching-explorer').first
            assert visual.is_visible() and visual.locator('svg').count()==1
            assert visual.locator('svg').get_attribute('aria-label')
            assert page.locator('.ml-schematic-reference').count()==0
            clipped=visual.locator('svg text').evaluate_all('(nodes)=>nodes.filter(n=>{const b=n.getBBox(),v=n.ownerSVGElement.viewBox.baseVal;return b.x<0||b.y<0||b.x+b.width>v.width+.5||b.y+b.height>v.height+.5}).map(n=>n.textContent)')
            assert not clipped,(card['id'],clipped)
        if card['id']=='ML-F-K1':
            # Both redesigned retrievals expose the full workflow and supported
            # choices, rather than the former fixed single-fit validation panel.
            for index,checkpoint in enumerate(card['exercises']):
                page.evaluate('(hash)=>location.hash=hash',f"#{card['deck']}/{card['id']}/{index}")
                page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=checkpoint['id'])
                assert page.locator('.foundation-task-reminder').is_visible()
                assert page.locator('.ml-reference,.ml-contract,.ml-workflow-help').count()==0
                assert page.locator('.foundation-content > .foundation-task-reminder').count()==1
                assert page.locator('.foundation-code-pane .foundation-task-reminder').count()==0
                assert page.locator('.ml-output-names code').all_text_contents()==checkpoint['outputs']
                assert page.locator('#mlEditor').input_value()==checkpoint['starter']
    for challenge in registry['challenges']:
        page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+challenge['id'])
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=challenge['id'])
        assert page.get_by_role('heading',name=challenge['title'],exact=True).is_visible()
        assert page.locator('.case-input-flow img[data-challenge-icon]').get_attribute('data-challenge-icon')==challenge['id']
        assert page.locator('#case-help').get_attribute('open') is None
        assert page.locator('.foundation-breadcrumb').inner_text().split()==['Machine','Learning','/','Workflow','Challenges','/',challenge['id']]
        assert page.locator('.ml-deliverable-groups > li').count()==4
        assert page.get_by_role('link',name='Download challenge input CSV',exact=True).get_attribute('href')==challenge['exercise']['inputFile']
        assert page.get_by_role('link',name='Original source dataset',exact=True).count()==1
        assert 'fit(' not in page.locator('#mlEditor').input_value()
        page.locator('#case-help > summary').click()
        page.locator('#case-help > details').last.locator(':scope > summary').click()
        assert page.locator('.case-solution-code').inner_text().strip()==challenge['reference'].strip(),challenge['id']
        assert 'complete script replaces the editor contents' in page.locator('.case-solution-intro').inner_text().lower()
        page.locator('.case-solution-setup > summary').click()
        assert page.locator('.case-solution-setup pre').inner_text().strip()=="\n".join(challenge['reference'].splitlines()[:3]),challenge['id']
        assert challenge['exercise']['inputFile'] in page.locator('.case-solution-setup pre').inner_text()
        if challenge['exercise'].get('protect'):
            design=page.locator('.ml-validation-design').inner_text()
            assert '20%' in design and 'five' in design
            assert ('forward' if challenge['exercise']['protect'].get('time') else '42') in design
    # Discovery workflows have no prediction target, dummy or reserved final test.
    for route,activity,expected,application in [
        ('#clustering/ML-U07/3','ML-U07-4',['original measurements','standardised values','raw_linkage','scaled_linkage','raw_height','scaled_height','cannot by themselves rank'],'raw and scaled Ward merge geometry'),
        ('#pca/ML-P02/3','ML-P02-4',['reusable scale and full PCA','training_scores','incoming_scores','original observation IDs','Keep the fitted-population scale and axes'],'fitted scale and PCA representation on incoming rows'),
    ]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=activity)
        brief=page.locator('.foundation-task-reminder')
        assert brief.is_visible() and all(step in brief.inner_text() for step in expected)
        assert 'reserved final test' not in brief.inner_text()
        exercise=page.evaluate('MLLearning.activity')
        assert page.locator('.ml-output-names code').all_text_contents()==exercise['outputs']
        assert page.locator('.ml-reference,.ml-contract,.ml-model-guide,.teaching-reference').count()==0
        assert page.locator('.foundation-content > .foundation-task-reminder').count()==1
    for id in ['ML-X17','ML-X18','ML-X19']:
        page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+id)
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=id)
        assert 'no prediction target or reserved final test' in page.locator('.ml-workflow-map > p').inner_text()
    page.evaluate("location.hash='#workflow/ML-W-K3/0'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K3-1'")
    assert not page.locator('.teaching-note,.teaching-orientation,.learning-depth').count()
    assert page.locator('.foundation-navigation .deck-boundary').inner_text()=='End of deck'
    assert 'ML-W-K2' in page.locator('.foundation-navigation a').last.get_attribute('href')
    for route,id,question in [
        ('#regression/ML-R01/0','ML-R01-1',False),
        ('#regression/ML-R02/2','ML-R02-3',False),
        ('#foundations/ML-F-R1/0','ML-F-R1-1',True),
        ('#regression/ML-R-R2/2','ML-R-R2-3',True),
        ('#foundations/ML-F-K1/0','ML-F-K1-1',True),
        ('#foundations/ML-F11/0','ML-F11-1',True),
        ('#pca/ML-P02/3','ML-P02-4',True),
        ('#workflows/challenges/ML-X19','ML-X19',True),
    ]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(activity)=>window.MLLearning?.activity?.id===activity',arg=id)
        assert bool(page.locator('#mlReflection').count())==question,id
        if question:
            assert page.locator('#mlReflectionQuestion').inner_text().strip().endswith('?'),id
            authored=page.evaluate('MLLearning.activity.interpretationQuestion')
            if authored:assert page.locator('#mlReflectionQuestion').inner_text().strip()==authored,id
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
                    stages=page.locator('.foundation-practices li')
                    assert stages.count()==4
                    geometry=stages.evaluate_all('(links)=>links.map(link=>{const r=link.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,width:r.width};})')
                    assert all(-1<=r['left'] and r['right']<=width+1 and r['height']>0 and r['width']>0 for r in geometry),(width,route,geometry)
                    assert not page.locator('.foundation-practices a,.foundation-practices button').count()
                if width in [1440,390] and theme=='light':
                    name=(route or 'landing').replace('#','').replace('/','-')
                    page.screenshot(path=str(out/(args.engine+'-'+str(width)+'-'+name+'.png')),full_page=True)
    # Faded support and readiness: essential content visible, explanation never auto-graded.
    for route,id in [('#foundations/ML-F11/0','ML-F11-1'),('#foundations/ML-F11/1','ML-F11-2'),('#foundations/ML-F12/2','ML-F12-3'),('#workflow/ML-W15/1','ML-W15-2'),('#workflow/ML-W-K2/0','ML-W-K2-1'),('#workflow/ML-W-K3/0','ML-W-K3-1')]:
        page.evaluate('(hash)=>location.hash=hash',route)
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=id)
        assert page.locator('.ml-reference,.ml-workflow-help,.ml-rubric').count()==0
        assert page.locator('.foundation-content > .foundation-task-reminder').count()==1
        assert page.locator('#mlReflection').count()==1
        assert 'not machine-graded' in page.locator('#mlReflection + p').inner_text()
        assert page.locator('.teaching-overview svg').count()==1
        assert page.locator('.foundation-practices button').count()==0
        assert page.locator('.foundation-practices li').count()==len(next(c for c in registry['cards'] if any(e['id']==id for e in c['exercises']))['exercises'])
        if '-K' in id:assert 'fit(' not in page.locator('#mlEditor').input_value()
    # Desktop restores two bounded, independent scrolling panes. Reference
    # belongs to the left reading pane; Python and output belong to the right.
    for width in [1440,801]:
        page.set_viewport_size({'width':width,'height':900})
        page.evaluate("location.hash='#foundations/ML-F11/0'")
        page.wait_for_function("window.MLLearning?.activity?.id==='ML-F11-1'")
        geometry=page.evaluate('''() => {
          const content=document.querySelector('.foundation-content');
          const editor=document.querySelector('.ml-code-pane');
          content.scrollTop=120;editor.scrollTop=0;
          const leftOnly=content.scrollTop>0&&editor.scrollTop===0;
          const priorLeft=content.scrollTop;editor.scrollTop=180;
          return {contentLeft:content.getBoundingClientRect().left,
            editorLeft:editor.getBoundingClientRect().left,
            contentTop:content.getBoundingClientRect().top,
            editorTop:editor.getBoundingClientRect().top,
            columns:document.querySelector('.foundation-split').children.length,
            referenceInContent:content.contains(document.querySelector('.foundation-reference-content')),
            contentOverflow:content.scrollHeight-content.clientHeight,
            contentScroll:getComputedStyle(content).overflowY,
            editorScroll:getComputedStyle(editor).overflowY,
            independent:leftOnly&&editor.scrollTop>0&&content.scrollTop===priorLeft};
        }''')
        assert geometry['editorLeft']>geometry['contentLeft'] and abs(geometry['contentTop']-geometry['editorTop'])<2,(width,geometry)
        assert geometry['columns']==2 and geometry['referenceInContent'],(width,geometry)
        assert geometry['contentScroll']=='auto' and geometry['editorScroll']=='auto' and geometry['contentOverflow']>0,(width,geometry)
        assert geometry['independent'],(width,geometry)
    # Shared neural Next ends at a fork; task-specific paths do not cross branches.
    for cid in ('ML-C14','ML-C18','ML-N04'):
        card=next(c for c in registry['cards'] if c['id']==cid)
        page.set_viewport_size({'width':320,'height':844})
        page.evaluate('(hash)=>location.hash=hash',f"#{card['deck']}/{cid}/4")
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id',arg=cid+'-5')
        stages=page.locator('.foundation-practices li')
        assert stages.count()==5 and stages.last.locator('strong').inner_text()=='Apply'
        bounds=stages.evaluate_all('(links)=>links.map(link=>{const r=link.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,width:r.width};})')
        assert all(-1<=r['left'] and r['right']<=321 and r['height']>0 and r['width']>0 for r in bounds),(cid,bounds)
        assert not page.locator('.foundation-practices a,.foundation-practices button').count()
        assert page.locator('.foundation-practices [aria-current="step"] strong').inner_text()=='Apply'
    page.set_viewport_size({'width':1280,'height':1000})
    page.emulate_media(forced_colors='active',reduced_motion='reduce')
    page.evaluate("location.hash='#workflows/challenges/ML-X19'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-X19'")
    assert page.locator('#mlRun').is_visible()
    assert page.locator('.ml-contract').is_visible()
    assert 'weights' in page.locator('.ml-contract').inner_text()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.emulate_media(forced_colors='none',reduced_motion='no-preference')
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("document.documentElement.style.zoom='2'")
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.evaluate("document.documentElement.style.zoom=''")
    page.evaluate("location.hash='#networks/ML-N-R1/2'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-N-R1-3'")
    assert file_name(page.locator('.foundation-navigation a').last.get_attribute('href'))=='ml-learn-collection-neural-foundations.html'
    page.evaluate("location.hash='#networks/ML-N04/4'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-N04-5'")
    assert 'ML-N-K1' in page.locator('.foundation-navigation a').last.get_attribute('href')
    # Real UI Run + repeated Check must not make additional worker run requests.
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("location.hash='#workflow/ML-W-K1/0'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K1-1'")
    solution=page.evaluate('MLLearning.activity.solution')
    page.locator('#mlEditor').fill(solution)
    phase='Run and repeated Check'
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
    starter=page.evaluate('MLLearning.activity.starter')
    phase='Reset'
    page.locator('#mlReset').click()
    assert page.locator('#mlEditor').input_value()==starter
    assert page.evaluate('MLLearning.retainedReceipts')==0
    assert page.locator('#mlResults').inner_text()==''
    reset_output=page.locator('#mlOutput')
    reset_output_text=reset_output.inner_text()
    reset_output_dom=reset_output.evaluate("""el=>({
        innerText:el.innerText,innerHTML:el.innerHTML,textContent:el.textContent,
        childElementCount:el.childElementCount,
        emptyParagraphCount:el.querySelectorAll(':scope > p.ml-empty').length
    })""")
    reset_output_dom['emptyParagraphVisible']=reset_output.locator(':scope > p.ml-empty').is_visible()
    expected_reset_text='Code reset. Run to produce new output.'
    print(json.dumps({'engine':args.engine,'phase':'reset-output','expectedText':expected_reset_text,'actualText':reset_output_text,'dom':reset_output_dom}),flush=True)
    assert reset_output_text.removesuffix('\n\n')==expected_reset_text,(repr(reset_output_text),reset_output_dom)
    assert reset_output_dom['textContent']==expected_reset_text,reset_output_dom
    assert reset_output_dom['childElementCount']==1,reset_output_dom
    assert reset_output_dom['emptyParagraphCount']==1,reset_output_dom
    assert reset_output_dom['emptyParagraphVisible'],reset_output_dom
    assert reset_output.locator(':scope > p.ml-empty').text_content()==expected_reset_text,reset_output_dom
    phase='Stop / restart'
    page.locator('#mlStop').click()
    assert not page.locator('#mlRun').is_disabled()
    assert page.locator('#mlStatus').inner_text()=='Execution stopped. Python will start fresh on the next Run.'
    assert page.evaluate('MLLearning.retainedReceipts')==0
    # Keyboard escape exits the editor; navigation/reload discards the draft.
    page.locator('#mlEditor').focus();page.keyboard.press('Escape');page.keyboard.press('Tab')
    assert page.locator('#mlRun').evaluate('(e)=>e===document.activeElement')
    phase='Reload after Stop'
    page.reload();page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K1-1'")
    assert page.locator('#mlEditor').input_value()!=solution
    page.evaluate("location.hash='#workflow/ML-W-K2/0'")
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K2-1'")
    readiness=page.evaluate('MLLearning.activity.solution')
    page.locator('#mlEditor').fill(readiness)
    phase='Readiness Run'
    page.locator('#mlRun').click()
    page.wait_for_function("!document.getElementById('mlRun').disabled",timeout=180000)
    page.locator('#mlCheck').click()
    assert page.locator('#mlResults .needs-attention,#mlResults .unavailable').count()==0
    assert page.locator('#mlResults .self-review').count()==1
    assert 'not automatically verified' in page.locator('#mlResults .self-review').inner_text()
    page.locator('#mlReflection').fill('My interpretation is self-review, not an automatic pass.')
    page.locator('#mlEditor').fill(readiness.replace("['jobs_waiting', 'device_age_years']", "['jobs_waiting', 'invoice_labor_hours']"))
    phase='Boundary negative Run'
    page.locator('#mlRun').click()
    page.wait_for_function("!document.getElementById('mlRun').disabled",timeout=180000)
    page.locator('#mlCheck').click()
    assert 'Critical boundary' in page.locator('#mlResults .needs-attention').inner_text()
    phase='Final reload'
    page.reload();page.wait_for_function("window.MLLearning?.activity?.id==='ML-W-K2-1'")
    page.locator('#mlReflection').wait_for()
    assert page.locator('#mlReflection').input_value()==''
    writes=page.evaluate('__mlWrites')
    assert not any(any(term in key.lower() for term in ['learning','foundation','progress','completion','draft','resume']) for key in writes),writes
    assert page.locator('progress,[role="progressbar"],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue').count()==0
    assert not errors,errors
    browser.close()
print(args.engine,'all card/challenge routes, six widths, themes, task forks, real Run/Check, keyboard and no learning persistence passed.')
