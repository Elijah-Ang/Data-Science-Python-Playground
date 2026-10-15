"""Exercise native visual controls with production CSS at desktop and phone widths."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8137')
parser.add_argument('--executable-path', default='/usr/bin/chromium')
parser.add_argument('--family', choices=['all', 'foundation', 'ml'], default='all')
args = parser.parse_args()
out = ROOT / 'tests/evidence/teaching-explorers'
out.mkdir(parents=True, exist_ok=True)
styles = '\n'.join((ROOT / file).read_text() for file in [
    'foundations/playground-base.css', 'playground-shared.css',
    'foundations/foundations.css', 'ml-learning/learning.css'])
variants = [
    ('foundation', key) for key in ['scatter', 'histogram', 'count-bars', 'mean-bars',
                                  'summary-order', 'boxplot', 'references', 'facets',
                                  'encoding', 'scatter-dimensions', 'density', 'strip',
                                  'swarm', 'line', 'line-band', 'point-interval', 'violin', 'stacked',
                                  'log-scale', 'exact-bars']
] + [('ml', key) for key in ['F02', 'F03', 'F04', 'F07', 'W03', 'U02', 'W04', 'W07',
                            'C08-neighbours', 'R08-expansion', 'C08', 'C09', 'C14', 'R09', 'R10', 'C10', 'C11',
                            'C11-gamma', 'R10-leaf', 'R07', 'R08', 'P01', 'U03', 'U06', 'U07', 'U08', 'U09', 'U07-scale', 'N02', 'N05']]
if args.family != 'all':
    variants = [item for item in variants if item[0] == args.family]
checks = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.executable_path, args=['--no-sandbox'])
    page = browser.new_page(reduced_motion='reduce')
    page.set_content(f'''<!doctype html><html><head><base href="{args.base_url}/">
        <link rel="stylesheet" href="assets/fonts/fonts.css"><style>{styles}</style>
        <style>body{{padding:12px;margin:0}}main{{max-width:620px;margin:auto}}
        .foundation-content{{height:auto;overflow:visible;padding:0}}
        pre{{white-space:pre-wrap;overflow-wrap:anywhere}}</style></head>
        <body data-foundations data-playground data-deck="visualise" data-theme="light">
        <main class="foundation-content" id="explorer"></main></body></html>''')
    page.add_script_tag(path=str(ROOT / 'foundations/visuals.js'))
    page.add_script_tag(path=str(ROOT / 'ml-learning/visuals.js'))
    page.evaluate('FoundationVisuals.mount(document);MLLearningVisuals.mount(document)')
    for width in [1440, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 1000})
        for theme in ['light', 'dark']:
            page.evaluate('(theme)=>document.body.dataset.theme=theme', theme)
            for kind, key in variants:
                page.evaluate('''([kind,key])=>{
                  const api=kind==='foundation'?FoundationVisuals:MLLearningVisuals;
                  const visual=kind==='foundation'?api.spec(key):{id:key};
                  document.getElementById('explorer').innerHTML=api.interactive(visual);
                }''', [kind, key])
                select = page.locator('select')
                if key == 'N02':
                    assert not select.count(), 'Loss-history reading is a static explanation'
                    assert page.locator('.teaching-static-example svg').count() == 1
                    checks.append({'kind': kind, 'concept': key, 'theme': theme, 'width': width, 'static': True})
                    continue
                assert select.evaluate('e=>e.labels.length') == 1, (kind, key, 'label')
                assert select.evaluate('e=>e.getBoundingClientRect().height') >= 44, (kind, key, 'touch size')
                select.select_option(select.locator('option').first.get_attribute('value'))
                fixed = ((page.locator('.ml-example-observations').first
                          if page.locator('.ml-example-observations').count()
                          else page.locator('.teaching-explorer > p').first) if kind == 'ml'
                         else page.locator('.teaching-visual-data').first)
                baseline = fixed.inner_text()
                before = page.locator('.teaching-visual-result').inner_text()
                before_code = page.locator('.teaching-visual-result pre').inner_text()
                value = select.locator('option').last.get_attribute('value')
                select.select_option(value)
                assert page.locator('.teaching-visual-result').inner_text() != before, (kind, key, 'result changed')
                assert page.locator('.teaching-visual-result pre').inner_text() != before_code, (kind, key, 'Python changed')
                assert fixed.inner_text() == baseline, (kind, key, 'observations or comparison retained')
                assert page.locator('.teaching-visual-result').get_attribute('aria-live') == 'polite'
                overflow = page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1')
                assert not overflow, (kind, key, width, 'page overflow')
                clipped = page.locator('.data-teaching-visual').evaluate_all('''svgs=>svgs.flatMap(svg=>{
                    const v=svg.viewBox.baseVal;
                    return [...svg.querySelectorAll('text')].filter(n=>{
                       const b=n.getBBox();return b.x<0||b.y<0||b.x+b.width>v.width+.5||b.y+b.height>v.height+.5;
                    }).map(n=>n.textContent);
                })''')
                assert not clipped, (kind, key, width, clipped)
                if key in ['C14', 'R09']:
                    assert page.locator('.teaching-visual-scroll').evaluate('e=>e.scrollWidth<=e.clientWidth+1'), (key, width, 'tree panning')
                select.focus()
                assert select.evaluate('e=>e===document.activeElement')
                if key in ['histogram', 'C14', 'C08', 'R07', 'P01', 'F03', 'W03', 'U06', 'U09', 'N02', 'R08-expansion']:
                    page.locator('#explorer').screenshot(path=str(out / f'{kind}-{key}-{theme}-{width}.png'))
                checks.append({'kind': kind, 'concept': key, 'theme': theme, 'width': width})
    browser.close()
(out / 'checks.json').write_text(json.dumps(checks, indent=2) + '\n')
print(f'{len(checks)} responsive visual interactions passed: native controls, updated marks/code, fixed observations, reduced motion, unclipped labels, and compact trees.')
