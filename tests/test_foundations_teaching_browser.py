"""Render every teaching panel, including retrieval, at desktop and narrow widths."""
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
args = parser.parse_args()
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.base_url + '/data-foundations.html#inspect/I01/0')
    page.wait_for_selector('.teaching-overview')
    rounds = page.evaluate('FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map((r,i)=>({id:l.id,deck:l.deck,index:i,follow:!l.review&&i===0,teaching:!!r.teaching,teachingOutput:!!r.teaching?.output,source:r.retrieves||l.id})))')
    def wait_for_round(item):
        # Stable lesson IDs belong to routing; the breadcrumb shows teaching order.
        page.wait_for_function('''(r)=>LearningRoutes.route('data',location,document.body)===`${r.deck}/${r.id}/${r.index}`
            && document.querySelector('.foundation-lesson-heading h2')?.textContent===FoundationsCurriculum.lessons.find(l=>l.id===r.id).title
            && Array.from(document.querySelectorAll('.foundation-practices li')).findIndex(e=>e.hasAttribute('aria-current'))===r.index
            && document.querySelector('.foundation-practices [aria-current=step] strong')?.textContent===FoundationsCurriculum.lessons.find(l=>l.id===r.id).rounds[r.index].label''', arg=item)
    for width in (1440, 320):
        page.set_viewport_size({'width': width, 'height': 1000})
        for item in rounds:
            page.evaluate('(r)=>location.hash=`#${r.deck}/${r.id}/${r.index}`', item)
            wait_for_round(item)
            panel = page.locator('.teaching-overview' if item['follow'] else '.foundation-practice-brief')
            if item['follow']:
                assert panel.locator('.teaching-comparison').count() == 0, item
                assert panel.locator('.teaching-example').is_visible(), item
                assert panel.locator('.teaching-route, .teaching-tools').count() == 0, item
                assert panel.locator('details').count() == 0, item
                assert panel.locator('svg[role="img"]').count() >= 1, item
                assert panel.locator('.teaching-summary').is_visible(), item
                assert page.locator('.teaching-syntax-parts code span').evaluate_all('(nodes)=>nodes.every(e=>getComputedStyle(e).display!=="none")'), item
                assert page.locator('.teaching-worked pre').count() == 1, item
                assert page.locator('.teaching-worked > .teaching-syntax-parts').count() == 1, item
                assert page.locator('.teaching-worked > .syntax-choice-callout').count() == 1, item
            else:
                assert page.locator('.foundation-content>.foundation-practice-brief').count() == 1, item
                assert page.locator('.teaching-overview').count() == 0, item
                assert page.locator('.foundation-syntax').count() == (1 if item['teaching'] else 0), item
                assert panel.locator('.practice-question').is_visible(), item
                if item['teaching']:
                    assert page.locator('.teaching-transition').is_visible(), item
                    assert page.locator('.teaching-transition pre').count() == 1, item
                    if item['teachingOutput']:
                        assert page.locator('.teaching-transition .teaching-example-output').is_visible(), item
                    else:
                        assert page.locator('.teaching-transition .teaching-example-result').is_visible(), item
                    assert page.locator('.teaching-transition .teaching-syntax-parts dt').count() >= 2, item
                    assert page.locator('.teaching-reference').count() == 0, item
                else:
                    assert page.locator('.teaching-reference .teaching-comparison').is_visible(), item
                    assert page.locator('.teaching-reference .syntax-choice-callout').is_visible(), item
            assert page.locator('summary', has_text='View setup code').count() == 0, item
            expected = page.evaluate('(r)=>FoundationWorkspace.code(FoundationsCurriculum,FoundationsCurriculum.lessons.find(l=>l.id===r.id).rounds[r.index])', item)
            assert page.locator('#foundationEditor').input_value() == expected, item
            assert page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) <= innerWidth + 1'), item
            assert panel.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), item
    page.evaluate('location.hash="#inspect/I02/1"')
    wait_for_round({'deck':'inspect','id':'I02','index':1})
    editor = page.locator('#foundationEditor')
    starter = editor.input_value()
    page.locator('#jumpToWork').click()
    assert editor.evaluate('(e)=>e.selectionStart') == starter.index('# Your work\n') + len('# Your work\n')
    editor.fill('# Changed setup and work')
    page.locator('#resetExercise').click()
    assert editor.input_value() == starter
    # Transfer keeps the complete concept reference at hand, including the
    # concrete duplicate example; opening it must not replace the active code.
    page.evaluate('location.hash="#inspect/I17/2"')
    wait_for_round({'deck':'inspect','id':'I17','index':2})
    page.locator('#foundationEditor').fill('# Keep this work while checking the concept')
    assert page.locator('.teaching-reference').evaluate('(e)=>e.tagName==="SECTION"')
    assert page.locator('.teaching-reference .teaching-flags').is_visible()
    assert 'B · unique' in page.locator('.teaching-reference').inner_text()
    assert page.locator('#foundationEditor').input_value() == '# Keep this work while checking the concept'
    assert page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) <= innerWidth + 1')
    assert not errors, errors
    print(f'All {len(rounds)} teaching panels rendered at 1440px and 320px without overflow or page errors.')
    browser.close()
