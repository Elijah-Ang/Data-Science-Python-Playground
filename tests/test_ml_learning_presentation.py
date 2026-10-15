"""Check every ML lesson after the requested removal of reference material."""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
parser.add_argument('--executable-path')
parser.add_argument('--evidence', default='tests/evidence/ml-learning/presentation.json')
args = parser.parse_args()
normalize = lambda value: re.sub(r'\s+', ' ', value or '').strip()
records, errors = [], []
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch(**({'executable_path': args.executable_path} if args.executable_path else {}))
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.base_url+'/ml-learn.html')
    page.wait_for_function('!!window.MLLearning')
    registry = page.evaluate('MLLearning.curriculum')
    datasets = page.request.get(args.base_url+'/ml-learning/datasets.json').json()
    for width in [390, 1440]:
        page.set_viewport_size({'width': width, 'height': 844})
        for card in registry['cards']:
            for index, exercise in enumerate(card['exercises']):
                page.evaluate('(hash)=>location.hash=hash', f"#{card['deck']}/{card['id']}/{index}")
                page.wait_for_function('(id)=>MLLearning.activity.id===id', arg=exercise['id'])
                lesson = page.locator('.ml-lesson')
                assert lesson.locator('details > summary').all_text_contents() == ['Hints', 'Explained solution'], exercise['id']
                assert not lesson.locator('details details,.ml-reference,.foundation-reference-body,.ml-workflow-detail,.ml-model-guide,.ml-syntax-reference,.ml-sources,.learning-depth,[data-learning-mode],.teaching-orientation').count(), exercise['id']
                assert lesson.locator('.foundation-split > *').count() == 2, exercise['id']
                task = lesson.locator('.foundation-content > .foundation-task-reminder')
                assert task.count() == 1 and task.is_visible(), exercise['id']
                assert task.evaluate('(task)=>[...task.parentElement.querySelectorAll(":scope>.ml-syntax,:scope>.ml-progressive-workflow,:scope>.ml-provided-note,:scope>.ml-provided-evidence")].every(e=>!!(e.compareDocumentPosition(task)&Node.DOCUMENT_POSITION_FOLLOWING))'), exercise['id']
                assert not lesson.locator('.foundation-code-pane .foundation-task-reminder').count(), exercise['id']
                expected_preview = bool(exercise.get('inputPreview')) or (exercise.get('showDatasetPreview') is not False and exercise.get('dataset') in datasets)
                preview = lesson.locator('.foundation-data-preview')
                assert bool(preview.count()) == expected_preview, exercise['id']
                if expected_preview:
                    assert preview.is_visible() and preview.locator('table').count() == 1
                    assert preview.evaluate('(e)=>e.nextElementSibling.matches(".foundation-task-reminder")'), exercise['id']
                    d = exercise.get('inputPreview') or datasets[exercise['dataset']]
                    columns = d['columns'] if exercise.get('inputPreview') else [c for c in d['columns'] if card['deck'] not in ['clustering', 'pca'] or c not in ['species', 'diagnosis']]
                    assert preview.locator('thead th').all_text_contents() == columns, exercise['id']
                    assert preview.locator('tbody tr').count() == len(d.get('preview',d.get('rows',[]))), exercise['id']
                stages = lesson.locator('.foundation-practices li')
                assert stages.count() == len(card['exercises'])
                assert not lesson.locator('.foundation-practices a,.foundation-practices button').count()
                assert lesson.locator('.foundation-practices [aria-current="step"] strong').inner_text() == exercise['label'], (exercise['id'],exercise['label'],lesson.locator('.foundation-practices [aria-current="step"] strong').inner_text())
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'), (exercise['id'], width)
                expected_task=page.evaluate('(e)=>{const d=document.createElement("div");d.innerHTML=LearningLanguage.activity(e);return d.textContent}',exercise)
                assert normalize(task.locator('.learning-instructions').text_content())==normalize(expected_task),exercise['id']
                assert normalize(exercise['explanation']) in normalize(lesson.locator('.ml-explained-solution').text_content()), exercise['id']
                supplied = [item for item in exercise.get('suppliedState', []) if item['name']!='df']
                note = lesson.locator('.ml-provided-state')
                assert bool(note.count()) == bool(supplied), exercise['id']
                for item in supplied:
                    assert item['name'] in note.locator('dt code').all_text_contents(), (exercise['id'],item['name'])
                    if item.get('fitted'):assert 'Fitted' in note.inner_text()
                if exercise.get('dictionary'):
                    assert lesson.locator('.ml-activity-context table tbody tr').count()==len(exercise['dictionary']),exercise['id']
                if exercise.get('bug'):
                    assert lesson.locator('.ml-fault pre code').text_content()==exercise['bug'],exercise['id']
                if exercise.get('readiness'):
                    assert lesson.locator('.ml-rubric li').count()==len(exercise['rubric']),exercise['id']
                if exercise.get('modelBridge') and card.get('modelComparison'):
                    assert lesson.locator('.ml-model-comparison').count()==1,exercise['id']
                    assert not lesson.locator('.ml-model-comparison mark').count(),exercise['id']
                contract=exercise['contract'] if exercise.get('assessment') else exercise.get('learnerOutputs') or exercise.get('contract',[])
                assert lesson.locator('.ml-contract .ml-evidence-names>div').count()==len(contract),exercise['id']
                current=exercise.get('syntaxGuidance',{}).get('current',[])
                visible_codes=lesson.locator('.ml-syntax-parts dt>code').all_text_contents()
                assert all(p.get('code',p.get('title')) in visible_codes for p in current),(exercise['id'],current,visible_codes)
                if exercise.get('workflowSections'):
                    outline = lesson.locator('.ml-workflow-outline')
                    assert outline.is_visible() and outline.locator('li').count() == len(exercise['workflowSections'])
                if exercise['kind'] == 'python':
                    assert page.locator('#mlEditor').input_value() == exercise['starter']
                    assert task.locator('.ml-output-names code').all_text_contents() == exercise['outputs']
                fonts = lesson.locator('.teaching-syntax-parts dt > code').evaluate_all('nodes=>nodes.map(n=>getComputedStyle(n).fontSize)')
                assert all(font == '16px' for font in fonts), (exercise['id'], fonts)
                assert lesson.locator('.foundation-argument-values code').evaluate_all('nodes=>nodes.every(e=>getComputedStyle(e).fontSize==="16px")'), exercise['id']
                records.append({'id': exercise['id'], 'width': width, 'dataframeVisible': expected_preview, 'taskOnLeft': True, 'disclosures': 2, 'referenceRemoved': True})
        print(f'{width}px: all 338 ML lesson layouts passed.', flush=True)
    assert len(records) == 676 and not errors, errors
    output = Path(args.evidence)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'engine': args.engine, 'activities': 338, 'renders': len(records), 'widths': [390, 1440], 'pageErrors': errors, 'records': records}, indent=2)+'\n')
    browser.close()
