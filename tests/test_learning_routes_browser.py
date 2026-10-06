"""Static reading, old/new URLs, browser history, repeated navigation and responsive QA."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8765');parser.add_argument('--engine',default='chromium',choices=['chromium','webkit']);parser.add_argument('--screenshots',default='tests/evidence/review-learning');args=parser.parse_args()
base=args.base_url;out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=getattr(p,args.engine).launch()
    errors=[];page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:errors.append(str(e)))
    # Python starts separately from reading. Count workers without changing any runtime API.
    page.add_init_script("window.__workers=0; const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);window.__workers++;}};")
    def visit(file,title):
        page.goto(base+'/'+file);page.get_by_role('heading',name=title,exact=True).wait_for();page.wait_for_function("document.querySelector('#foundationsMain')?.dataset.ready==='1' || !!window.MLLearning || !!document.querySelector('#foundationEditor') || location.pathname.includes('learn.html') || location.pathname.includes('privacy.html')")
    visit('ml-learn.html?from=learn#workflow/ML-W-K1/0','Supervised Workflow checkpoint')
    page.wait_for_function("MLLearning.activity?.id==='ML-W-K1-1'")
    assert page.locator('.ml-concept').inner_text().find('Final RMSE')>=0
    assert 'Final MAE' not in page.locator('.ml-concept').inner_text()
    assert 'physical unit unspecified' in page.locator('.ml-column-guide').inner_text()
    assert '..' not in page.locator('.teaching-note').inner_text()
    # The approved checkpoint retains its concrete task briefing.
    briefing=page.locator('.practice-context')
    assert briefing.count()==1
    assert 'five-fold CV' in briefing.inner_text() and 'final RMSE' in briefing.inner_text()
    assert 'No tree tuning is required' in briefing.inner_text()
    assert page.locator('.foundation-revisit a').count()==3
    canonical=page.locator('link[rel="canonical"]').get_attribute('href')
    assert canonical=='https://dataplayground.science/ml-learn-ML-W-K1.html'
    page.get_by_role('link',name='Keep preparation with the estimator →',exact=True).click()
    page.wait_for_function("MLLearning.activity?.id==='ML-W06-1'")
    assert 'ml-learn-ML-W06.html?from=learn' in page.url
    assert page.evaluate('__workers')==0
    page.go_back();page.wait_for_function("MLLearning.activity?.id==='ML-W-K1-1'")
    page.go_forward();page.wait_for_function("MLLearning.activity?.id==='ML-W06-1'")
    page.get_by_role('link',name='Next practice →',exact=True).click();page.wait_for_function("MLLearning.activity?.id==='ML-W06-2'")
    assert '?from=learn&practice=1' in page.url
    page.reload();page.wait_for_function("MLLearning.activity?.id==='ML-W06-2'")
    # Reload reads the selected practice; browser back/forward use the same renderer.
    for _ in range(3):
        page.get_by_role('link',name='← Previous practice',exact=True).click();page.wait_for_function("MLLearning.activity?.id==='ML-W06-1'")
        page.get_by_role('link',name='Next practice →',exact=True).click();page.wait_for_function("MLLearning.activity?.id==='ML-W06-2'")
    page.go_back();page.wait_for_function("MLLearning.activity?.id==='ML-W06-1'");page.go_forward();page.wait_for_function("MLLearning.activity?.id==='ML-W06-2'")
    assert page.evaluate('__workers')==0
    # Legacy Data entry and new links retain a single Python bridge across practices.
    page.goto(base+'/data-foundations.html?from=learn#inspect/I17/0')
    page.wait_for_selector('#foundationEditor');page.wait_for_function('!!window.FoundationsCurriculum')
    assert 'data-foundations-I17.html' in page.locator('link[rel="canonical"]').get_attribute('href')
    assert page.locator('.teaching-flags').count()==1
    page.get_by_role('link',name='Next practice →',exact=True).click();page.wait_for_selector('.foundation-practice-brief')
    assert 'data-foundations-I17.html?from=learn&practice=1' in page.url
    page.go_back();page.wait_for_selector('.teaching-flags');page.go_forward();page.wait_for_selector('.foundation-practice-brief')
    assert page.evaluate('__workers')==1
    page.locator('.back-playground').click();page.wait_for_selector('.foundation-deck-heading')
    assert 'data-foundations-inspect.html?from=learn' in page.url
    page.locator('.chapter-jumps a').last.click()
    assert '#chapter-' in page.url
    assert page.locator('.foundation-chapter:focus').count()==1
    for width in [1440,390,320]:
        page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
        for file,title,label in [('learn.html','Learn / Refresh','learn-hub'),('data-foundations-I17.html','Duplicate rows','data-lesson'),('ml-learn-ML-W-K1.html','Supervised Workflow checkpoint','ml-checkpoint'),('privacy.html','Privacy policy','privacy')]:
            page.goto(base+'/'+file)
            if label=='data-lesson':page.wait_for_selector('#foundationEditor')
            elif label=='ml-checkpoint':page.wait_for_function("MLLearning.activity?.id==='ML-W-K1-1'")
            else:page.get_by_role('heading',name=title,exact=True).wait_for()
            page.evaluate('document.fonts.ready')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,file,'page overflow')
            if label=='learn-hub':
                assert page.locator('button[data-path="statistics"]').get_attribute('data-coming-soon')=='Statistics'
                assert 'coming soon' in page.locator('button[data-path="statistics"]').inner_text().lower()
            if width!=320:
                page.screenshot(path=str(out/f'{args.engine}-{width}-{label}.png'),full_page=True)
                page.screenshot(path=str(out/f'{args.engine}-{width}-{label}-top.png'))
                if label=='privacy':
                    page.get_by_role('heading',name='6. Advertising now and possible future changes',exact=True).scroll_into_view_if_needed()
                    page.screenshot(path=str(out/f'{args.engine}-{width}-privacy-advertising.png'))
                if label=='ml-checkpoint':
                    # These regions capture scrollable content hidden by the existing desktop panes.
                    page.locator('.ml-column-guide').screenshot(path=str(out/f'{args.engine}-{width}-column-dictionary.png'))
                    page.locator('.foundation-revisit').screenshot(path=str(out/f'{args.engine}-{width}-concept-links.png'))
                    page.locator('.teaching-reference').filter(has=page.locator('.ml-concept')).screenshot(path=str(out/f'{args.engine}-{width}-rmse-sketch.png'))
    # The planned lesson tile stays on Learn; the mode navigation opens the working workspace.
    page.goto(base+'/learn.html');page.locator('button[data-path="statistics"]').click()
    assert page.url==base+'/learn.html'
    assert page.locator('#pathAnnouncement').inner_text()=='Statistics lessons are coming soon.'
    page.get_by_role('link',name='Statistics Playground',exact=True).click();page.wait_for_selector('#notebookPanel');assert '/statistics.html' in page.url
    readonly=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844}).new_page()
    for file in ['data-foundations-I17.html','ml-learn-ML-W-K1.html']:
        readonly.goto(base+'/'+file)
        assert len(readonly.locator('article[aria-label="Lesson content"]').inner_text())>1200
        assert readonly.locator('article table').count()>0
        assert readonly.locator('article pre').count()>0
        readonly.locator('.foundation-navigation a').last.click();assert '.html' in readonly.url
    readonly.goto(base+'/data-foundations-I17.html');readonly.screenshot(path=str(out/f'{args.engine}-390-data-no-javascript.png'),full_page=True)
    page.goto(base+'/ml-learn-ML-W06.html');page.wait_for_function("MLLearning.activity?.id==='ML-W06-1'")
    page.evaluate("(()=>{history.pushState=()=>{throw new DOMException('History rate limit','SecurityError')};})()")
    page.get_by_role('link',name='Next practice →',exact=True).click()
    page.wait_for_function("window.MLLearning?.activity?.id==='ML-W06-2'")
    assert 'practice=1' in page.url, 'Native link must work when history enhancement is unavailable'
    assert not errors,errors
    (out/f'{args.engine}-results.json').write_text(json.dumps({'engine':args.engine,'passed':['static rich content without JavaScript','old fragment entries','canonical lesson URLs','ordinary supporting links','new practice reload','back/forward','repeated navigation','retained Data worker','chapter navigation','320/390/1440 widths','Statistics workspace access','native link fallback when history is unavailable'],'pageErrors':errors},indent=2))
    browser.close()
print(args.engine,'learning route and responsive tests passed; screenshots:',out)
