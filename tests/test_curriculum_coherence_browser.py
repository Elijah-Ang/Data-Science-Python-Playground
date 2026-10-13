"""Reproducible before/after evidence from the actual enhanced lesson renderers."""
import argparse
import json
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--phase', choices=['before', 'after'], default='after')
parser.add_argument('--output', default='docs/curriculum-evidence')
parser.add_argument('--engine', choices=['chromium', 'webkit'], default='chromium')
parser.add_argument('--executable-path', help='Use an installed Chromium executable.')
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
cases = [('data', 'inspect', 'I19S'), ('data', 'wrangle', 'W19'),
         ('data', 'wrangle', 'W22'), ('data', 'visualise', 'V01'),
         ('data', 'visualise', 'V04'), ('data', 'visualise', 'V09'),
         ('data', 'visualise', 'V13'), ('data', 'visualise', 'V17'),
         ('data', 'visualise', 'V29'), ('data', 'visualise', 'V33'),
         ('ml', 'foundations', 'ML-F11'), ('ml', 'foundations', 'ML-F12'),
         ('ml', 'classification', 'ML-C08'), ('ml', 'classification', 'ML-C10'),
         ('ml', 'classification', 'ML-C14'), ('ml', 'classification', 'ML-C17'),
         ('ml', 'networks', 'ML-N04'), ('ml', 'pca', 'ML-P02')]
captures = {'V04', 'V09', 'ML-F11', 'ML-C14'}
records, errors, focus_records = [], [], []
with sync_playwright() as pw:
    launch = {}
    if args.engine == 'chromium' and (args.executable_path or shutil.which('chromium')):
        launch['executable_path'] = args.executable_path or shutil.which('chromium')
    browser = getattr(pw, args.engine).launch(**launch)
    context = browser.new_context()
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width, height in [(390, 844), (1440, 1000)]:
        page.set_viewport_size({'width': width, 'height': height})
        for family, deck, lesson in cases:
            prefix = 'data-foundations' if family == 'data' else 'ml-learn'
            editor_id = 'foundationEditor' if family == 'data' else 'mlEditor'
            page.goto(f'{args.base_url}/{prefix}.html#{deck}/{lesson}/0')
            page.wait_for_selector(f'#{editor_id}')
            if family == 'ml':
                page.wait_for_function('(id)=>MLLearning.activity?.id===id+"-1"', arg=lesson)
            page.wait_for_timeout(100)
            record = page.evaluate('''(editorId)=>{
                const e=document.getElementById(editorId), content=document.querySelector('.foundation-content');
                return {editorTop:Math.round(e.getBoundingClientRect().top+scrollY),
                  editorScrollTop:e.scrollTop, editorHeight:e.clientHeight,
                  sourceLines:e.value.split('\\n').length,
                  visibleTeachingWords:content.innerText.split(/\\s+/).length,
                  documentHeight:document.documentElement.scrollHeight,
                  overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+2,
                  expandedReferences:document.querySelectorAll('.foundation-reference-content details[open]').length};
            }''', editor_id)
            record.update(phase=args.phase, family=family, lesson=lesson, width=width)
            if lesson in captures:
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(out/f'{args.phase}-{lesson}-{width}.png'), full_page=True)
            if args.phase == 'after':
                assert not record['overflow'], record
                assert page.locator('.foundation-practices [aria-current="step"]').count() == 1
                assert page.locator('.foundation-reference-content').count() == 1
                if width == 390:
                    assert record['editorTop'] < 4200, record
                    assert page.locator('.foundation-split > .foundation-content .foundation-reference-content').count() == 1
                assert page.locator('.foundation-split > *').count() == 2
                assert page.locator('.foundation-reference-content details').count() == 3
                assert page.locator('.foundation-reference-content details details').count() == 0
                starter = page.locator('#'+editor_id).input_value()
                page.locator('#'+editor_id).fill(starter+'\n# Temporary browser check')
                page.locator('#resetExercise' if family == 'data' else '#mlReset').click()
                assert page.locator('#'+editor_id).input_value() == starter
                details = page.locator('#foundationHint' if family == 'data' else '.ml-explained-solution')
                details.locator('summary').click()
                assert details.get_attribute('open') is not None
                details.locator('summary').click()
                assert page.locator('#'+editor_id).input_value() == starter
                controls = page.locator('[data-visual-choice], [data-ml-visual-choice]')
                for control in controls.all():
                    options = control.locator('option').evaluate_all('(items)=>items.map(x=>x.value)')
                    if len(options) > 1:
                        control.select_option(options[-1])
            records.append(record)
    if args.phase == 'after':
        focus_cases = [
            ('V22', 0, '.teaching-worked', ['sns.heatmap'], ['.corr(']),
            ('V27', 0, '.teaching-worked', ['ax.axhline', 'ax.axvline'], []),
            ('V28', 0, '.teaching-worked', ['ax.annotate'], ['.idxmax(']),
            ('V29', 0, '.teaching-worked', ['ax.bar'], ['.groupby(']),
            ('V17', 1, '.teaching-transition', ['size='], []),
            ('V17', 2, '.teaching-transition', ['["speed_kmh"] =', 'sns.scatterplot'], []),
        ]
        for width in [390, 1440]:
            page.set_viewport_size({'width': width, 'height': 844 if width == 390 else 1000})
            for lesson, index, selector, required, familiar in focus_cases:
                page.goto(f'{args.base_url}/data-foundations.html#visualise/{lesson}/{index}')
                page.wait_for_selector('#foundationEditor')
                marked = '\n'.join(page.locator(selector+' .workflow-code-change').all_inner_texts())
                assert all(part in marked for part in required), (lesson, index, marked)
                assert all(part not in marked for part in familiar), (lesson, index, marked)
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
                focus_records.append({'activity': f'{lesson}-{index+1}', 'width': width, 'emphasised': marked})
    browser.close()
assert not errors, errors
(out/f'{args.phase}-layout.json').write_text(json.dumps({'records': records, 'focusedCode': focus_records, 'pageErrors': errors}, indent=2)+'\n')
print(json.dumps({'phase': args.phase, 'rendered': len(records), 'focusedCodeChecks': len(focus_records), 'pageErrors': errors, 'mobile': [r for r in records if r['width']==390]}, indent=2))
