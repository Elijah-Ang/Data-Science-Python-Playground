"""Model collection journeys preserve real lesson identity, history and transient practice."""
import argparse
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8765')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
parser.add_argument('--evidence', default='work/four-improvements/ml-collections-browser')
parser.add_argument('--executable-path',help='Optional local browser binary; CI uses Playwright engines by default.')
args = parser.parse_args()
out = Path(args.evidence)
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as playwright:
    browser = getattr(playwright, args.engine).launch(**({'executable_path':args.executable_path} if args.executable_path else {}))
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script("""window.__collectionWorkers=0;window.__collectionWrites=[];
      const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);window.__collectionWorkers++;}};
      const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){window.__collectionWrites.push(key);return write.call(this,key,value);};""")

    def activity(identifier):
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id===id', arg=identifier)

    def file_name(address):
        return urlsplit(address).path.rsplit('/',1)[-1]

    def route_state(file, **expected):
        assert file_name(page.url)==file,page.url
        actual=parse_qs(urlsplit(page.url).query)
        assert all(actual.get(key)==[str(value)] for key,value in expected.items()),(page.url,expected)

    def collection(slug, title, prefix=''):
        page.goto(args.base_url+'/ml-learn-collection-'+slug+'.html'+prefix)
        page.get_by_role('heading', name=title, level=2, exact=True).wait_for()
        page.wait_for_function('!!window.MLLearning && !window.MLLearning.activity')

    page.goto(args.base_url+'/ml-learn.html?from=learn')
    page.wait_for_function('!!window.MLLearning')
    assert page.locator('section[aria-labelledby="ml-start"] .foundation-deck').evaluate_all('(nodes)=>nodes.map(node=>node.dataset.deck)') == ['foundations', 'workflow']
    assert page.locator('.foundation-deck[data-collection]').count() == 23
    page.locator('[data-collection="simple-linear"]').click()
    page.get_by_role('heading', name='Simple linear regression', exact=True).wait_for()
    route_state('ml-learn-collection-simple-linear.html',**{'from':'learn'})
    page.locator('.lesson-card').first.click()
    activity('ML-R01-1')
    route_state('ml-learn-ML-R01.html',**{'from':'learn','collection':'simple-linear'})
    assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://dataplayground.science/ml-learn-ML-R01.html'
    assert 'Simple linear regression' in page.locator('.foundation-breadcrumb').inner_text()
    back=page.locator('.back-playground').get_attribute('href')
    assert file_name(back)=='ml-learn-collection-simple-linear.html'
    assert parse_qs(urlsplit(back).query).get('from')==['learn']
    starter = page.evaluate('MLLearning.activity.starter')
    page.locator('#mlEditor').fill('# transient collection edit\n')
    page.get_by_role('link', name='Next practice →', exact=True).click()
    activity('ML-R01-2')
    route_state('ml-learn-ML-R01.html',**{'from':'learn','practice':1,'collection':'simple-linear'})
    page.go_back()
    activity('ML-R01-1')
    assert page.locator('#mlEditor').input_value() == starter
    page.go_forward()
    activity('ML-R01-2')
    change_starter = page.evaluate('MLLearning.activity.starter')
    page.locator('#mlEditor').fill('# do not restore this edit\n')
    page.reload()
    activity('ML-R01-2')
    assert page.locator('#mlEditor').input_value() == change_starter
    page.locator('.back-playground').click()
    page.get_by_role('heading', name='Simple linear regression', exact=True).wait_for()
    page.go_back()
    activity('ML-R01-2')
    assert page.locator('#mlEditor').input_value() == change_starter

    # A canonical or legacy card still belongs to its authored deck.
    for entry in ['ml-learn-ML-R01.html', 'ml-learn.html#regression/ML-R01/0', 'ml-learn-ML-R01.html?collection=neural-quantity', 'ml-learn-ML-R01.html?collection=missing']:
        page.goto(args.base_url+'/'+entry)
        activity('ML-R01-1')
        assert file_name(page.locator('.back-playground').get_attribute('href')) == 'ml-learn-regression.html'
        assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://dataplayground.science/ml-learn-ML-R01.html'
    # Keep the lesson.deck requirement: a card under the wrong legacy deck is not a lesson.
    page.goto(args.base_url+'/ml-learn.html#classification/ML-R01/0')
    page.wait_for_function('!!window.MLLearning && !window.MLLearning.activity')
    assert page.get_by_role('heading', name='Classification', exact=True).is_visible()

    for slug, identifier, checkpoint in [('neural-classification', 'ML-N03', 'ML-N-K2'), ('neural-quantity', 'ML-N04', 'ML-N-K1')]:
        page.goto(args.base_url+'/ml-learn-'+identifier+'.html?practice=3&collection='+slug)
        page.wait_for_function('(id)=>window.MLLearning?.activity?.id.startsWith(id)', arg=identifier+'-')
        count = page.evaluate('(id)=>MLLearning.curriculum.cards.find(card=>card.id===id).exercises.length', identifier)
        page.goto(args.base_url+'/ml-learn-'+identifier+'.html?practice='+str(count-1)+'&collection='+slug)
        activity(identifier+'-'+str(count))
        page.get_by_role('link', name='Next lesson →', exact=True).click()
        activity(checkpoint+'-1')
        assert ('collection='+slug) in page.url
    page.goto(args.base_url+'/ml-learn-ML-N-R1.html?practice=2')
    page.wait_for_function("window.MLLearning?.activity?.id.startsWith('ML-N-R1-')")
    page.get_by_role('link', name='Choose a neural route →', exact=True).click()
    page.get_by_role('heading', name='Shared neural foundations', exact=True).wait_for()
    assert page.locator('a[href*="ml-learn-collection-neural-classification.html"]').count() == 1
    assert page.locator('a[href*="ml-learn-collection-neural-quantity.html"]').count() == 1

    inventory = page.evaluate('MLLearning.curriculum.collections')
    for width in [1440, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        for item in inventory:
            collection(item['id'], item['title'], '?practice=2')
            assert page.locator('.lesson-card').count() == len(item['ids'])
            assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://dataplayground.science/ml-learn-collection-'+item['id']+'.html'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'), (width, item['id'])
        page.goto(args.base_url+'/ml-learn.html')
        page.wait_for_function('!!window.MLLearning')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'), (width, 'landing')
        page.screenshot(path=str(out/f'{args.engine}-{width}-collections.png'), full_page=True)
    assert page.evaluate('__collectionWorkers') == 0, 'Reading collection pages must not start Python'
    assert not page.locator('progress,[role="progressbar"],#forgetProgress,#resetLearningDialog,#storageStatus,.foundation-continue').count()
    assert not page.evaluate('__collectionWrites.filter(key=>/learning|foundation|progress|completion|draft|resume/i.test(key))')

    readonly_context = browser.new_context(java_script_enabled=False, viewport={'width': 320, 'height': 844})
    readonly = readonly_context.new_page()
    for slug, title in [('simple-linear', 'Simple linear regression'), ('neural-classification', 'Neural classification'), ('discovery-foundations', 'Discovery foundations'), ('pca', 'Principal component analysis')]:
        readonly.goto(args.base_url+'/ml-learn-collection-'+slug+'.html')
        assert readonly.get_by_role('heading', name=title, level=2, exact=True).is_visible()
        readonly.locator('.lesson-card').first.click()
        assert len(readonly.locator('article[aria-label="Lesson content"]').inner_text()) > 100
        assert readonly.locator('.teaching-overview').count()==1
        # First-use code, complete scripts and reference remain available with
        # semantic HTML disclosure even without browser enhancement.
        assert readonly.locator('article pre, #mlEditor').count() > 0
        reference=readonly.locator('section[aria-label="Reference and help"]')
        assert reference.count()==1 and reference.locator(':scope > details').count()==3
        assert reference.locator(':scope > details > summary').all_text_contents()==['Reference','Hints','Explained solution']
        assert not reference.locator(':scope > details[open]').count()
        assert not reference.locator('details details').count()
        reference.locator('.ml-reference > summary').click()
        assert reference.locator('.ml-reference').get_attribute('open') is not None
        readonly.locator('.foundation-navigation a').last.click()
        assert '.html' in readonly.url
        assert readonly.locator('article[aria-label="Lesson content"]').count() == 1
        readonly.locator('.foundation-breadcrumb a').nth(2).click()
        assert readonly.url.endswith('/ml-learn-collection-'+slug+'.html')
        assert readonly.get_by_role('heading', name=title, level=2, exact=True).is_visible()
        assert readonly.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    assert not errors, errors
    (out/f'{args.engine}-results.json').write_text(json.dumps({'engine': args.engine, 'collections': len(inventory), 'widths': [1440, 390, 320], 'passed': ['foundations first', 'collection references', 'canonical lesson identity', 'legacy deck requirement', 'practice/from/collection state', 'Back/Forward/reload', 'transient edits', 'independent neural branches', 'all collection direct pages', 'no-JavaScript navigation', 'no learner storage', 'no Python while reading'], 'pageErrors': errors}, indent=2))
    browser.close()
print(args.engine, 'ML collection journeys passed')
