"""Keep useful entry-page content available before and after lesson JavaScript runs."""
import argparse

from playwright.sync_api import sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--engine', default='chromium')
args = parser.parse_args()

pages = {
    'index.html': ('.welcome-value', 'missing'),
    'learn.html': ('.learn-method', 'synthetic'),
    'data-foundations.html': ('#dataOverview', 'unknown'),
    'ml-learn.html': ('#mlOverview', 'baseline'),
}

with sync_playwright() as playwright:
    browser = getattr(playwright, args.engine).launch()
    static = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    for path, (selector, idea) in pages.items():
        page = static.new_page()
        page.goto(f'{args.base_url}/{path}')
        assert page.locator('main').is_visible(), path
        assert page.locator(selector).is_visible(), path
        assert idea in page.locator(selector).inner_text().lower(), path
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), path
        page.close()
    static.close()

    dynamic = browser.new_context(viewport={'width': 390, 'height': 844})
    for path, selector, route in [
        ('data-foundations.html', '#dataOverview', '#inspect'),
        ('ml-learn.html', '#mlOverview', '#foundations'),
    ]:
        page = dynamic.new_page()
        page.goto(f'{args.base_url}/{path}')
        page.locator('.foundation-deck').first.wait_for()
        assert page.locator(selector).is_visible(), path
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), path
        page.goto(f'{args.base_url}/{path}{route}')
        page.locator('.lesson-card').first.wait_for()
        assert page.locator(selector).count() == 0, path
        page.goto(f'{args.base_url}/{path}')
        page.locator('.foundation-deck').first.wait_for()
        assert page.locator(selector).is_visible(), path
        page.close()
    dynamic.close()
    browser.close()

print('Public learning content is readable without scripts and stays visible on both interactive landing pages.')
