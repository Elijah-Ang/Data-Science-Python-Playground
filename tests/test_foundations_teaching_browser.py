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
    rounds = page.evaluate('FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map((r,i)=>({id:l.id,deck:l.deck,index:i,follow:!l.review&&i===0,source:r.retrieves||l.id})))')
    for width in (1440, 320):
        page.set_viewport_size({'width': width, 'height': 1000})
        for item in rounds:
            page.evaluate('(r)=>location.hash=`#${r.deck}/${r.id}/${r.index}`', item)
            page.wait_for_function('(r)=>document.querySelector(".foundation-breadcrumb")?.textContent.includes(r.id)&&Array.from(document.querySelectorAll(".foundation-practices li")).findIndex(e=>e.hasAttribute("aria-current"))===r.index', arg=item)
            panel = page.locator('.teaching-overview' if item['follow'] else '.foundation-practice-brief')
            if item['follow']:
                assert panel.locator('.teaching-route li').count() == 3, item
                assert panel.locator('svg[role="img"]').count() >= 1, item
                assert panel.locator('.teaching-summary').is_visible(), item
            else:
                assert page.locator('.foundation-content>.foundation-practice-brief').count() == 1, item
                assert page.locator('.teaching-overview, .foundation-syntax').count() == 0, item
                assert panel.locator('.practice-question').is_visible(), item
            assert page.locator('summary', has_text='View setup code').count() == 0, item
            expected = page.evaluate('(r)=>FoundationWorkspace.code(FoundationsCurriculum,FoundationsCurriculum.lessons.find(l=>l.id===r.id).rounds[r.index])', item)
            assert page.locator('#foundationEditor').input_value() == expected, item
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), item
            assert panel.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), item
    page.evaluate('location.hash="#inspect/I02/1"')
    page.wait_for_function('document.querySelector(".foundation-breadcrumb")?.textContent.includes("I02")')
    editor = page.locator('#foundationEditor')
    starter = editor.input_value()
    page.locator('#jumpToWork').click()
    assert editor.evaluate('(e)=>e.selectionStart') == starter.index('# Your work\n') + len('# Your work\n')
    editor.fill('# Changed setup and work')
    page.locator('#resetExercise').click()
    assert editor.input_value() == starter
    assert not errors, errors
    print(f'All {len(rounds)} teaching panels rendered at 1440px and 320px without overflow or page errors.')
    browser.close()
