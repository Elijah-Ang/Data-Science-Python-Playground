"""CI regression: real page rendering, focus, isolated notebooks and slow camera."""
import argparse
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=('chromium', 'webkit'), default='chromium')
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--evidence-dir', default='tests/evidence')
args = parser.parse_args()
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    page = browser.new_page(reduced_motion='reduce')
    for width, height in [(390,844),(1440,1000)]:
        page.set_viewport_size({'width':width,'height':height})
        page.goto(f'{args.base_url}/tutorial.html')
        chapters = page.evaluate('window.TOUR_CONTENT.chapters')
        assert len(chapters) == 25
        for i,c in enumerate(chapters):
            if i:
                page.get_by_role('button',name='Next →',exact=True).click()
            expect(page.locator('#headline')).to_have_text(c['title'])
            page.wait_for_function("document.querySelector('.viewport').dataset.state !== 'moving'",timeout=180000)
            expect(page.locator('.viewport')).to_have_attribute('data-state','ready')
            frame = page.frame_locator('#siteFrame')
            actual = page.frames[1]
            assert actual.locator('script').count() == 0
            assert page.locator('#siteFrame').get_attribute('sandbox') == 'allow-same-origin'
            expect(page.locator('#tourStatus')).to_be_hidden()
            assert page.locator('#camera iframe').count() == 1
            expect(page.locator('#siteFrame')).to_be_visible()
            expect(page.locator('#actionCue')).to_be_hidden()
            if c['scene'] in ['data-guide', 'ml-guide']:
                expect(frame.locator('#guideButton')).to_have_attribute('aria-expanded','true')
                expect(frame.locator('#guideWindow')).to_be_visible()
            if c['scene']=='stats-study' and c['focus']=='study':
                expect(frame.locator('#studyButton')).to_have_attribute('aria-expanded','true')
                expect(frame.locator('#studyPanel')).to_be_visible()
            assert page.evaluate("document.querySelector('.viewport').scrollTop===0")
            spot=page.locator('#spotlight').bounding_box()
            box=page.locator('.viewport').bounding_box()
            assert spot['width']>10 and spot['height']>10
            assert spot['x']>=box['x']-2 and spot['y']>=box['y']-2
            assert spot['x']+spot['width']<=box['x']+box['width']+2
            assert spot['y']+spot['height']<=box['y']+box['height']+2
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
            if c['scene'] in ['ml-guide','ml-validate','ml-tune','home','lesson-result']:
                page.get_by_role('button',name='Enlarge preview ↗').click()
                expect(page.locator('#previewDialog')).to_be_visible()
                assert page.locator('#previewDetail iframe').count()==1
                page.get_by_role('button',name='Close preview ×').click()
        page.get_by_role('button',name='Replay ↺').click()
        expect(page.locator('#headline')).to_have_text('Enter through the garden.')
        expect(page.locator('#back')).to_be_disabled()
    browser.close()
print('Passed: 25 script-free actual-interface stops, desktop/mobile, spotlight and enlargement.')
