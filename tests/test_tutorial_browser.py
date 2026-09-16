"""CI browser regression: all 24 tour stops, live focus geometry and navigation."""
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
                expect(page.locator('#scenePreview')).to_have_attribute('data-scene',c['scene'])
                expect(page.locator('#scenePreview')).to_have_attribute('data-profile',profile)
                assert page.locator('#scenePreview img').count() == (1 if c['scene'] == 'home' else 0)
                focus = page.locator(f'#scenePreview [data-tour-focus="{c["focus"]}"]').bounding_box()
                spotlight = page.locator('#spotlight').bounding_box()
                assert abs(focus['x'] - spotlight['x'] - 6) < 3
                assert abs(focus['y'] - spotlight['y'] - 6) < 3
                assert abs(focus['width'] - spotlight['width'] + 12) < 3
                assert abs(focus['height'] - spotlight['height'] + 12) < 3
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                assert page.locator('.steps button:visible').count() <= 7
                page.get_by_role('button',name='Enlarge preview ↗',exact=True).click()
                expect(page.locator('#previewDialog')).to_be_visible()
                assert page.locator('#previewDetail [data-tour-focus]').count() == 1
                page.get_by_role('button',name='Close preview ×',exact=True).click()
                expect(page.locator('#previewDialog')).not_to_be_visible()
        page.get_by_role('button',name='Replay ↺',exact=True).click()
        expect(page.locator('#headline')).to_have_text('Four places to explore.')
        expect(page.locator('#back')).to_be_disabled()
        page.get_by_role('button',name='Next →',exact=True).click()
        expect(page.locator('#headline')).to_have_text('Start with a dataset.')
        page.locator('#back').click()
        expect(page.locator('#headline')).to_have_text('Four places to explore.')
    browser.close()
print('Passed: 24 stops, four viewports, section navigation, Back/Next/Replay.')
