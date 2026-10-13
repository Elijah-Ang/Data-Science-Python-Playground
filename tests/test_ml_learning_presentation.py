"""Audit the simplified ML reading order and preserved teaching for every activity."""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
parser.add_argument('--executable-path', help='Optional local browser; CI keeps its Playwright Chromium.')
parser.add_argument('--evidence', default='tests/evidence/ml-learning/presentation.json')
args = parser.parse_args()
normalize = lambda value: re.sub(r'\s+', ' ', value or '').strip()
records = []
errors = []
with sync_playwright() as p:
    browser = getattr(p, args.engine).launch(**({'executable_path': args.executable_path} if args.executable_path else {}))
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.base_url+'/ml-learn.html')
    page.wait_for_function('!!window.MLLearning')
    registry = page.evaluate('MLLearning.curriculum')
    for width in [390, 1440]:
        page.set_viewport_size({'width': width, 'height': 844})
        for card in registry['cards']:
            for index, exercise in enumerate(card['exercises']):
                page.evaluate('(hash)=>location.hash=hash', f"#{card['deck']}/{card['id']}/{index}")
                page.wait_for_function('(id)=>MLLearning.activity.id===id', arg=exercise['id'])
                lesson = page.locator('.ml-lesson')
                reference = page.locator('.ml-reference')
                assert reference.count() == 1 and reference.get_attribute('open') is None, exercise['id']
                assert lesson.locator('details > summary').all_text_contents() == ['Reference', 'Hints', 'Explained solution'], exercise['id']
                assert not lesson.locator('details details,.learning-depth,[data-learning-mode],.teaching-orientation').count(), exercise['id']
                assert lesson.locator('.foundation-split > *').count() == 2, exercise['id']
                assert lesson.locator('.foundation-split > article.foundation-content > section.foundation-reference-content').count() == 1, exercise['id']
                stages = lesson.locator('.foundation-practices li')
                assert stages.count() == len(card['exercises']), exercise['id']
                assert not lesson.locator('.foundation-practices a,.foundation-practices button').count(), exercise['id']
                assert lesson.locator('.foundation-practices [aria-current="step"] strong').inner_text() == exercise['label']
                assert page.locator('.foundation-navigation a').count() > 0
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'), (exercise['id'], width)
                whole_text = normalize(lesson.text_content())
                for level in ['current', 'reminders', 'reference']:
                    for concept in exercise.get('syntaxGuidance', {}).get(level, []):
                        for field in ['code', 'meaning', 'choices', 'forms', 'example']:
                            if concept.get(field):
                                assert normalize(concept[field]) in whole_text, (exercise['id'], level, field, concept.get('id'))
                assert normalize(exercise['explanation']) in whole_text, exercise['id']
                assert normalize(card['explanation']) in whole_text, exercise['id']
                if exercise.get('setup'):
                    assert page.locator('.ml-provided-state pre').last.text_content() == exercise['setup'], exercise['id']
                supplied = exercise.get('suppliedState', [])
                assert reference.locator('.ml-provided-state dt').all_text_contents() == [item['name'] for item in supplied], exercise['id']
                fitted = [item for item in supplied if item.get('fitted')]
                note = page.locator('.ml-provided-note')
                assert bool(note.count()) == bool(fitted), exercise['id']
                if fitted:
                    assert note.is_visible()
                    assert all(item['name'] in note.locator('code').all_text_contents() for item in fitted), exercise['id']
                    for item in fitted:
                        if item.get('training'):
                            assert item['training'] in note.inner_text(), exercise['id']
                if exercise.get('workflowSections'):
                    outline = page.locator('.ml-workflow-outline')
                    assert outline.locator('li').count() == len(exercise['workflowSections'])
                    assert outline.is_visible()
                    assert not outline.locator('details').count()
                    for step in exercise['workflowSections']:
                        for field in ['title', 'question', 'meaning', 'code']:
                            assert normalize(step[field]) in whole_text, (exercise['id'], field)
                    assert reference.locator('.ml-workflow-section').count() == len(exercise['workflowSections'])
                if exercise.get('evidence'):
                    evidence = page.locator('.ml-provided-evidence')
                    assert evidence.is_visible()
                    for number in re.findall(r'\d+(?:\.\d+)?%?', exercise['evidence']):
                        assert number in evidence.inner_text(), (exercise['id'], number)
                if exercise['kind'] == 'python':
                    assert page.locator('.foundation-task-reminder').is_visible()
                    assert page.locator('#mlEditor').input_value() == exercise['starter']
                    assert page.locator('.ml-output-names code').all_text_contents() == exercise['outputs']
                    expected_contract = exercise['contract'] if exercise.get('assessment') else exercise.get('learnerOutputs', exercise.get('contract', []))
                    assert reference.locator('.ml-evidence-names dt').all_text_contents() == [item['name'] for item in expected_contract]
                metrics = lesson.evaluate('''element=>{
                  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),texts=[];
                  let node;while(node=walker.nextNode())if(node.parentElement.getClientRects().length&&!node.parentElement.closest('details:not([open]) > :not(summary)'))texts.push(node.textContent);
                  const editor=element.querySelector('.foundation-editor-head');
                  return {id:MLLearning.activity.id,visibleWords:texts.join(' ').trim().split(/\\s+/).length,
                    disclosures:element.querySelectorAll('details').length,
                    visibleDisclosures:[...element.querySelectorAll('details > summary')].filter(n=>n.getClientRects().length).length,
                    editorTop:editor?editor.getBoundingClientRect().top+scrollY:null};
                }''')
                metrics['width'] = width
                records.append(metrics)
        print(f'{width}px: all 338 ML activities passed presentation and teaching-preservation checks.', flush=True)
    assert len(records) == 676 and not errors, errors
    for lesson_id in ['ML-C10', 'ML-C14']:
        card = next(card for card in registry['cards'] if card['id'] == lesson_id)
        page.evaluate('(hash)=>location.hash=hash', f"#{card['deck']}/{lesson_id}/0")
        page.wait_for_function('(id)=>MLLearning.activity.id===id', arg=card['exercises'][0]['id'])
        page.locator('.ml-reference > summary').click()
        assert page.locator('.ml-model-comparison').is_visible()
        assert page.locator('.ml-model-comparison pre code').evaluate_all('(nodes)=>nodes.map(n=>n.querySelectorAll(".workflow-code-change").length)') == [3, 3]
        page.locator('.ml-reference > summary').click()
    output = Path(args.evidence)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'engine': args.engine, 'activities': 338, 'renders': len(records), 'widths': [390, 1440], 'pageErrors': errors, 'records': records}, indent=2))
    browser.close()
print('One Reference, Hints and solution; no nested toggles or depth buttons; authored teaching and code preserved.')
