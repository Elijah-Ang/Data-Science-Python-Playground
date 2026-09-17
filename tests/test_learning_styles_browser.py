"""Guard the shared learning theme in direct-file previews and built HTTP pages."""
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8027')
parser.add_argument('--engine', default='chromium')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
evidence = root / 'tests/evidence/learning-styles'
evidence.mkdir(parents=True, exist_ok=True)
routes = [
    ('learn.html', '.learn-path', 'learn'),
    ('data-foundations.html', '.foundation-deck', 'decks'),
    ('data-foundations.html#inspect', '.lesson-card', 'library'),
    ('data-foundations.html#inspect/I01/1', '.foundation-code-pane', 'exercise'),
]
with sync_playwright() as pw:
    browser = getattr(pw, args.engine).launch()
    # Isolate every origin from any previously installed service worker.
    context = browser.new_context(service_workers='block')
    page = context.new_page()
    for origin, base in [('file', root.as_uri()), ('built', args.base_url.rstrip('/'))]:
        for width in [1440, 390]:
            page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
            for route, card, name in routes:
                page.goto(base + '/' + route)
                page.locator(card).first.wait_for()
                for theme in ['light', 'dark']:
                    page.evaluate('(theme) => AppAppearance.apply(theme)', theme)
                    styles = page.evaluate('''(card) => {
                      const style = selector => getComputedStyle(document.querySelector(selector));
                      const body = style('body');
                      return {
                        panel: body.getPropertyValue('--panel').trim(),
                        ink: body.getPropertyValue('--ink').trim(),
                        code: body.getPropertyValue('--code').trim(),
                        bodyMargin: body.margin,
                        headerLayout: style('.topbar').display,
                        cardBackground: style(card).backgroundColor,
                        cardImage: style(card).backgroundImage,
                        cardBorder: style(card).borderTopStyle,
                        overflow: document.documentElement.scrollWidth > innerWidth + 1
                      };
                    }''', card)
                    assert all(styles[key] for key in ['panel', 'ink', 'code']), (origin, route, styles)
                    assert styles['bodyMargin'] == '0px', styles
                    assert styles['headerLayout'] == 'flex', styles
                    assert styles['cardBackground'] != 'rgba(0, 0, 0, 0)' or styles['cardImage'] != 'none', (origin, route, styles)
                    assert styles['cardBorder'] == 'solid', styles
                    assert not styles['overflow'], (origin, route, width)
                    if name == 'exercise':
                        assert page.locator('.foundation-editor-wrap').evaluate('(e)=>getComputedStyle(e).backgroundColor') == 'rgb(39, 40, 43)'
                        help_style = page.locator('#editorHelp').evaluate('(e)=>({position:getComputedStyle(e).position,width:e.getBoundingClientRect().width})')
                        assert help_style == {'position': 'absolute', 'width': 1}, help_style
                    page.screenshot(path=str(evidence / f'{args.engine}-{origin}-{width}-{theme}-{name}.png'))
    browser.close()
print(f'{args.engine}: four learning screens retain styling in file and built previews, desktop/mobile, light/dark.')
