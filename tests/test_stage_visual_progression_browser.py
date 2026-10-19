"""Audit stage-specific visuals in every actual Data Foundations and ML activity.

Production lesson pages and CSS are used. This complements the numerical visual
oracles: it checks that a correct visual is shown at the correct learning stage,
and that native controls preserve their illustrative observations and baseline.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://127.0.0.1:8015')
parser.add_argument('--output', default='docs/curriculum-evidence/stage-visuals')
parser.add_argument('--executable-path', default=shutil.which('chromium'))
parser.add_argument('--focused', action='store_true')
parser.add_argument('--lessons',nargs='+',help='Limit a documented final delta to these lesson IDs.')
parser.add_argument('--layout-only',action='store_true',help='Inspect every final layout without repeating unchanged menu choices.')
args = parser.parse_args()
out = ROOT / args.output
out.mkdir(parents=True, exist_ok=True)
shots = out / 'screenshots'
shots.mkdir(exist_ok=True)

records, interactions, issues, page_errors, screenshots = [], [], [], [], []
selected = {'I09', 'W02', 'W06', 'W19', 'V08', 'V16', 'V18', 'V19', 'ML-P01', 'ML-C08', 'ML-C11', 'ML-U03'}

INSPECT = r'''item => {
  const content = document.querySelector('.foundation-content');
  const preview = content.querySelector('.foundation-data-preview');
  const task = content.querySelector('.foundation-task-reminder');
  const visualNodes = [...content.querySelectorAll(
    '.teaching-overview svg,.teaching-overview .teaching-explorer,' +
    '.teaching-task-visual svg,.teaching-task-visual .teaching-explorer')];
  const clipped = [...content.querySelectorAll('svg text')].flatMap(n => {
    const b = n.getBBox(), svg = n.ownerSVGElement, v = svg.viewBox.baseVal;
    if (!v.width || !b.width) return [];
    const m = svg.getScreenCTM().inverse().multiply(n.getScreenCTM());
    const corners = [[b.x,b.y],[b.x+b.width,b.y],
      [b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]
      .map(([x,y]) => new DOMPoint(x,y).matrixTransform(m));
    return corners.some(p => p.x < -.75 || p.y < -.75 ||
      p.x > v.width+.75 || p.y > v.height+.75) ? [n.textContent] : [];
  });
  const precedesTask = [...content.querySelectorAll(
    '.teaching-worked,.teaching-transition,.foundation-arguments,' +
    '.ml-syntax,.ml-progressive-workflow')].every(n =>
    !!(n.compareDocumentPosition(task) & Node.DOCUMENT_POSITION_FOLLOWING));
  const headings = [...content.querySelectorAll('h3')].map(n=>n.textContent.trim());
  const seen = new Set();
  const controls = [...content.querySelectorAll('[data-code-key]')].filter(n=>{
    const identity=n.closest('.teaching-explorer').dataset.foundationExplorer||n.closest('.teaching-explorer').dataset.mlExplorer||n.closest('.teaching-explorer').dataset.operationExplorer;
    const key=identity+'/'+n.dataset.codeKey;if(seen.has(key))return false;seen.add(key);return true;
  }).map(n=>({key:n.dataset.codeKey,labelled:!!n.getAttribute('aria-label'),
    height:n.getBoundingClientRect().height,
    options:JSON.parse(n.dataset.codeOptions).map(o=>o.value)}));
  return {stage:content.dataset.learningStage, visualCount:visualNodes.length,
    overview:content.querySelectorAll('.teaching-overview').length,
    transitions:content.querySelectorAll('.teaching-transition').length,
    headings, controls, clipped, precedesTask,
    previewBeforeTask:!preview||preview.nextElementSibling===task,
    taskOnLeft:!!task&&!document.querySelector('.foundation-code-pane .foundation-task-reminder'),
    editor:!!document.querySelector('#foundationEditor,#mlEditor'),
    overflow:Math.max(document.documentElement.scrollWidth,
      document.body.scrollWidth)>innerWidth+1,
    disclosures:[...content.querySelectorAll('details>summary')].map(n=>n.textContent.trim()),
    reference:!!content.querySelector('.foundation-reference-body,.ml-reference'),
    words:content.innerText.trim().split(/\s+/).length};
}'''


def issue(item, width, theme, reason, **detail):
    issues.append({'id': item['id'], 'width': width, 'theme': theme,
                   'reason': reason, **detail})


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.executable_path)
    context = browser.new_context(service_workers='block', reduced_motion='reduce')
    page = context.new_page()
    page.on('pageerror', lambda e: page_errors.append({'url': page.url, 'error': str(e)}))
    page.goto(args.base_url + '/data-foundations.html')
    page.wait_for_function('!!window.FoundationsCurriculum')
    data = page.evaluate('''FoundationsCurriculum.lessons.flatMap(l=>
      l.rounds.map((r,index)=>({family:'data',id:r.id,lesson:l.id,deck:l.deck,
        index,title:l.title,follow:!l.review&&index===0,review:!!l.review,
        teaching:!!r.stageTeaching,visual:r.visual})))''')
    page.goto(args.base_url + '/ml-learn.html')
    page.wait_for_function('!!window.MLLearning')
    ml = page.evaluate('''MLLearning.curriculum.cards.flatMap(c=>
      c.exercises.map((e,index)=>({family:'ml',id:e.id,lesson:c.id,deck:c.deck,
        index,title:c.title,follow:c.kind==='teaching'&&index===0,
        review:c.kind!=='teaching',visualTeaching:e.visualTeaching||null,
        newInTask:e.newInTask||[],visual:e.visual||c.visual})))''')
    inventory = data + ml
    if args.lessons:
        inventory=[x for x in inventory if x['lesson'] in args.lessons]
    if args.focused:
        inventory = [x for x in inventory if x['lesson'] in selected]
    manifest = context.request.get(args.base_url+'/asset-manifest.json').json()
    files = ['foundations/app.js','foundations/teaching.js','foundations/visuals.js',
             'foundations/operation-visuals.js','foundations/inline-code.js','assets/teaching/pixel-pointer.png',
             'ml-learning/app.js','ml-learning/visuals.js','ml-learning/curriculum.json']
    hashes = {name: hashlib.sha256(context.request.get(args.base_url+'/'+name).body())
              .hexdigest() for name in files}
    for width in [1440, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        for theme in ['light', 'dark']:
            for family in ['data', 'ml']:
                prefix = 'data-foundations' if family == 'data' else 'ml-learn'
                page.goto(args.base_url + '/' + prefix + '.html')
                page.wait_for_function('!!window.FoundationsCurriculum' if family=='data'
                                       else '!!window.MLLearning')
                page.evaluate('(t)=>AppAppearance.apply(t)', theme)
                items = [x for x in inventory if x['family'] == family]
                for item in items:
                    page.evaluate('(x)=>location.hash=`#${x.deck}/${x.lesson}/${x.index}`', item)
                    if family == 'ml':
                        page.wait_for_function('(id)=>MLLearning.activity?.id===id', arg=item['id'])
                    else:
                        page.wait_for_function('''x=>document.querySelector(
                          '.foundation-lesson-heading h2')?.textContent===x.title&&
                          [...document.querySelectorAll('.foundation-practices li')]
                          .findIndex(n=>n.hasAttribute('aria-current'))===x.index''', arg=item)
                    page.evaluate('document.fonts.ready')
                    result = page.evaluate(INSPECT, item)
                    if not item['follow'] and not item.get('visualTeaching'):
                        if result['visualCount']:
                            issue(item, width, theme, 'Inherited introductory visual on later stage', **result)
                        if 'Understand the idea' in result['headings']:
                            issue(item, width, theme, 'Follow introduction repeated on later stage')
                    if item['review'] and result['transitions']:
                        issue(item, width, theme, 'Review introduces new teaching')
                    if family == 'data' and bool(result['transitions']) != item['teaching']:
                        issue(item, width, theme, 'Stage teaching does not match authored addition')
                    for key in ['editor','precedesTask','previewBeforeTask','taskOnLeft']:
                        if not result[key]:
                            issue(item, width, theme, key)
                    if result['overflow'] or result['clipped'] or result['reference']:
                        issue(item, width, theme, 'Layout or removed reference', **result)
                    if len(result['disclosures']) > 2:
                        issue(item, width, theme, 'Too many essential-content disclosures',
                              disclosures=result['disclosures'])
                    for ci, control in enumerate(result['controls']):
                        if not control['labelled'] or control['height'] < 43.5:
                            issue(item, width, theme, 'Inaccessible visual control', control=control)
                        if args.layout_only:
                            continue
                        locator = page.locator('[data-code-key="'+control['key']+'"]').first
                        locator.focus()
                        if not locator.evaluate('n=>n===document.activeElement'):
                            issue(item, width, theme, 'Control cannot receive keyboard focus')
                        section = locator.locator('xpath=ancestor::section[1]')
                        fixed = section.evaluate('''n=>[...n.querySelectorAll(
                          '.teaching-example-output')]
                          .filter(t=>!t.closest('.teaching-visual-result')&&
                            (!t.closest('.operation-result')||t.closest('.operation-inputs')))
                          .map(t=>t.textContent).join('|')''')
                        original = locator.get_attribute('data-code-value')
                        distinct, distinct_code = set(), set()
                        for value in control['options']:
                            locator.click()
                            menu=page.get_by_role('listbox')
                            menu.locator('[data-value="'+value+'"]').click()
                            rendered = section.evaluate('''n=>{
                              const live=n.querySelector('[aria-live="polite"]');
                              return {live:!!live,html:live?.innerHTML||'',
                                fixed:[...n.querySelectorAll('.teaching-example-output')]
                                  .filter(t=>!t.closest('.teaching-visual-result')&&
                                    (!t.closest('.operation-result')||t.closest('.operation-inputs')))
                                  .map(t=>t.textContent).join('|'),
                                code:[...n.querySelectorAll('pre code')].map(t=>t.textContent)};
                            }''')
                            if not rendered['live'] or rendered['fixed'] != fixed:
                                issue(item, width, theme, 'Visual feedback or fixed observations', value=value)
                            distinct.add(rendered['html'])
                            distinct_code.add('\n'.join(rendered['code']))
                            if section.get_attribute('data-foundation-explorer') == 'count-bars':
                                counts = section.evaluate('''n=>{
                                  const column=n.querySelector('[data-code-key="x"]').dataset.codeValue;
                                  const counts={};
                                  for(const row of FoundationVisuals.exampleRows){const key=row[column];counts[key]=(counts[key]||0)+1;}
                                  const bars=[...n.querySelectorAll('svg rect')].map(r=>({
                                    h:r.height.baseVal.value,y:r.y.baseVal.value,
                                    visible:getComputedStyle(r).display!=='none'&&getComputedStyle(r).fill!=='none'
                                  }));
                                  return {values:Object.values(counts),bars};
                                }''')
                                bars, expected = counts['bars'], counts['values']
                                if len(bars) != len(expected) or not all(b['visible'] for b in bars):
                                    issue(item, width, theme, 'Count plot has missing/extra filled shapes', value=value, geometry=counts)
                                else:
                                    unit = sum(b['h'] for b in bars) / sum(expected)
                                    if any(abs(b['h'] - count * unit) > .001 for b, count in zip(bars, expected)):
                                        issue(item, width, theme, 'Rendered count height disagrees with visible observations', value=value, geometry=counts)
                            interactions.append([item['id'],width,theme,ci,value])
                        if len(distinct_code) != len(control['options']):
                            issue(item, width, theme, 'Control does not change Python for every option')
                        locator.focus();locator.press('Enter')
                        menu=page.get_by_role('listbox');page.keyboard.press('Home');page.keyboard.press('End')
                        focused=page.locator('.inline-code-options :focus')
                        if focused.get_attribute('data-value')!=control['options'][-1]:
                            issue(item,width,theme,'Keyboard cannot select last choice')
                        page.keyboard.press('Escape')
                        if not locator.evaluate('n=>n===document.activeElement'):
                            issue(item,width,theme,'Escape does not return focus to the code')
                        locator.press('Tab')
                        if locator.evaluate('n=>n===document.activeElement'):
                            issue(item,width,theme,'Keyboard focus trapped')
                        locator.click();page.get_by_role('listbox').locator('[data-value="'+original+'"]').click()
                    if width in [1440,390] and theme=='light' and item['lesson'] in selected:
                        page.evaluate('''()=>{
                          window.scrollTo(0,0);
                          document.querySelector('.foundation-content').scrollTop=0;
                        }''')
                        path = shots / f'{item["id"]}-{width}.png'
                        page.screenshot(path=str(path))
                        screenshots.append({'id':item['id'],'width':width,
                                            'path':str(path.relative_to(out))})
                    records.append({'id':item['id'],'family':family,'width':width,
                                    'theme':theme,'follow':item['follow'],
                                    'explicitVisual':bool(item.get('visualTeaching')),**result})
                print(f'{width}px {theme} {family}: {len(items)} stage contexts', flush=True)
    browser.close()

receipt = {'layoutOnly':args.layout_only,'engine':'Chromium','activities':len(inventory),'renders':len(records),
           'interactiveStates':len(interactions),'records':records,
           'interactions':interactions,'issues':issues,'pageErrors':page_errors,
           'screenshots':screenshots,'buildContentId':manifest.get('contentId'),
           'servedHashes':hashes}
(out/('focused-rendering.json' if args.focused else 'rendering.json')).write_text(
    json.dumps(receipt, separators=(',',':'))+'\n')
if not args.focused:
    lines = ['# Stage visual screenshots', '',
             'Actual lesson pages from the same build as `rendering.json`. '
             'The desktop view uses 1440 pixels and the phone view uses 390 pixels.', '',
             '| Lesson | Activity | Desktop | Phone |',
             '| --- | --- | --- | --- |']
    for item in inventory:
        if item['lesson'] in selected:
            lines.append(f'| {item["lesson"]} | {item["id"]} | '
                         f'[Open](screenshots/{item["id"]}-1440.png) | '
                         f'[Open](screenshots/{item["id"]}-390.png) |')
    (out/'screenshots.md').write_text('\n'.join(lines)+'\n')
assert not issues and not page_errors, json.dumps({'issues':issues[:20],
                                                 'pageErrors':page_errors[:10]},indent=2)
print(f'{len(records)} actual lesson renders; {len(interactions)} interactive states; '
      f'{len(screenshots)} screenshots; no stage or rendering discrepancies.')
