"""CI browser regression: all 24 tour stops, responsive images and navigation."""
import argparse
import re
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=('chromium', 'webkit'), default='chromium')
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--evidence-dir', default='tests/evidence')
args = parser.parse_args()
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    page = browser.new_page(reduced_motion='reduce')
    for width, height in [(390,844),(834,900),(1440,1000),(375,667)]:
        page.set_viewport_size({'width':width,'height':height})
        page.goto(f'{args.base_url}/tutorial.html')
        chapters = page.evaluate('window.TOUR_CONTENT.chapters')
        assert len(chapters) == 24
        for group in ['Data','Stats','ML','Learn']:
            page.get_by_role('button',name=f'Tour {group}',exact=True).click()
            for i,c in enumerate(chapters):
                if c['group'] != group:
                    continue
                page.get_by_role('button',name=f'{group}: {c["label"]}',exact=True).click()
                expect(page.locator('#headline')).to_have_text(c['title'])
                profile = 'mobile' if width <= 1000 else 'wide'
                expect(page.locator('#siteCapture')).to_have_attribute('src',re.compile(f'/assets/tour-captures/v2-{profile}-{c["scene"]}\\.jpg$'))
                page.wait_for_function('document.querySelector("#siteCapture").complete && document.querySelector("#siteCapture").naturalWidth > 0')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                assert page.locator('.steps button:visible').count() <= 7
        page.get_by_role('button',name='Replay ↺',exact=True).click()
        expect(page.locator('#headline')).to_have_text('Four places to explore.')
        expect(page.locator('#back')).to_be_disabled()
        page.get_by_role('button',name='Next →',exact=True).click()
        expect(page.locator('#headline')).to_have_text('Start with a dataset.')
        page.locator('#back').click()
        expect(page.locator('#headline')).to_have_text('Four places to explore.')
    browser.close()
print('Passed: 24 stops, four viewports, section navigation, Back/Next/Replay.')
