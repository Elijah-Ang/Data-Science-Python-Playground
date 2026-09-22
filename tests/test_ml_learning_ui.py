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
    page.add_init_script("""window.__mlRunPosts=0;window.__mlWrites=[];
      const NativeWorker=Worker;
      window.Worker=class extends NativeWorker{
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
    assert page.get_by_role('heading',name='New to machine learning?').is_visible()
    assert page.get_by_role('heading',name='Refreshing something?').is_visible()
    assert 'within the relevant pathway' in page.locator('.ml-core-note').inner_text()
    assert page.locator('.ml-index-item').count()==17
    registry=page.evaluate('MLLearning.curriculum')
    # Every card and every challenge must render from its canonical route.
    for card in registry['cards']:
        page.evaluate('(hash)=>location.hash=hash','#'+card['deck']+'/'+card['id']+'/0')
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=card['exercises'][0]['id'])
        assert page.get_by_role('heading',name=card['title'],exact=True).is_visible()
        if card['kind']=='teaching':assert page.locator('.ml-concept svg').count()==1
    for challenge in registry['challenges']:
        page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+challenge['id'])
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=challenge['id'])
        assert page.get_by_role('heading',name=challenge['title'],exact=True).is_visible()
        assert page.locator('#case-help').get_attribute('open') is None
        assert 'fit(' not in page.locator('#mlEditor').input_value()
    for width in [1440,1280,1024,768,390,320]:
        page.set_viewport_size({'width':width,'height':960})
        for theme in ['light','dark']:
            page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
            for route in ['','#classification/ML-C14/0','#networks','#workflows/challenges/ML-X15']:
                page.evaluate('(hash)=>location.hash=hash',route)
                page.wait_for_timeout(70)
                overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
                assert not overflow,(width,theme,route,'horizontal page overflow')
                if width in [1440,390] and theme=='light':
                    name=(route or 'landing').replace('#','').replace('/','-')
                    page.screenshot(path=str(out/(args.engine+'-'+str(width)+'-'+name+'.png')),full_page=True)
    # Shared neural Next ends at a fork; task-specific paths do not cross branches.
    page.emulate_media(forced_colors='active',reduced_motion='reduce')
    page.evaluate("location.hash='#workflows/challenges/ML-X19'")
    page.wait_for_function("MLLearning.activity?.id==='ML-X19'")
    assert page.locator('#mlRun').is_visible()
    assert page.locator('.ml-contract summary').is_visible()
    page.locator('.ml-contract summary').click()
    assert 'weights' in page.locator('.ml-contract').inner_text()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.emulate_media(forced_colors='none',reduced_motion='no-preference')
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("document.documentElement.style.zoom='2'")
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    page.evaluate("document.documentElement.style.zoom=''")
    page.evaluate("location.hash='#networks/ML-N-R1/2'")
    page.wait_for_function("MLLearning.activity?.id==='ML-N-R1-3'")
    assert page.locator('.foundation-navigation a').last.get_attribute('href')=='#networks'
    page.evaluate("location.hash='#networks/ML-N04/3'")
    page.wait_for_function("MLLearning.activity?.id==='ML-N04-4'")
    assert 'ML-N-K1' in page.locator('.foundation-navigation a').last.get_attribute('href')
    # Real UI Run + repeated Check must not make additional worker run requests.
    page.set_viewport_size({'width':1280,'height':1000})
    page.evaluate("location.hash='#workflow/ML-W-K1/0'")
    page.wait_for_function("MLLearning.activity?.id==='ML-W-K1-1'")
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
    page.reload();page.wait_for_function("MLLearning.activity?.id==='ML-W-K1-1'")
    assert page.locator('#mlEditor').input_value()!=solution
    writes=page.evaluate('__mlWrites')
    assert not any('learning' in key.lower() or 'foundation' in key.lower() for key in writes),writes
    assert not errors,errors
    browser.close()
print(args.engine,'all card/challenge routes, six widths, themes, task forks, real Run/Check, keyboard and no learning persistence passed.')
