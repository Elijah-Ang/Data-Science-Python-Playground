"""Exercise every assembled curriculum route at phone and desktop widths.

This suite checks reading order, native editor alignment and keyboard escape.
Python execution is covered by the separate runtime/browser suites.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--output', default='docs/curriculum-evidence/responsive-coverage.json')
parser.add_argument('--screenshots-dir', default='docs/curriculum-evidence/ui-revision-after')
parser.add_argument('--focused-only', action='store_true', help='Recheck the five screenshot lessons and all shared interaction checks.')
args = parser.parse_args()
records, errors, identifier_styles, pane_scroll_checks, touch_checks = [], [], [], [], []
snapshots = Path(args.screenshots_dir)
snapshots.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'))
    context = browser.new_context(service_workers='block')
    manifest = context.request.get(args.base_url+'/asset-manifest.json')
    build_content_id = manifest.json().get('contentId') if manifest.ok else None
    style_hashes = {path:hashlib.sha256(context.request.get(args.base_url+'/'+path).body()).hexdigest()
        for path in ['foundations/foundations.css','ml-learning/learning.css','route-slider.css']}
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append({'url': page.url, 'message': str(error)}))
    page.goto(args.base_url+'/data-foundations.html#inspect/I01/0')
    page.locator('#foundationEditor').wait_for()
    foundations = page.evaluate('''FoundationsCurriculum.lessons.flatMap(lesson =>
      lesson.rounds.map((round, index) => ({family:'data', deck:lesson.deck,
        lesson:lesson.id, title:lesson.title, index, id:round.id, kind:'python'})))''')
    page.goto(args.base_url+'/ml-learn.html#foundations/ML-F01/0')
    page.wait_for_function('!!window.MLLearning?.activity')
    machine_learning = page.evaluate('''MLLearning.curriculum.cards.flatMap(card =>
      card.exercises.map((exercise, index) => ({family:'ml', deck:card.deck,
        lesson:card.id, title:card.title, index, id:exercise.id, kind:exercise.kind})))''')
    if args.focused_only:
        foundations = [item for item in foundations if item['index'] == 0 and item['lesson'] in ['I19S','W19','V04']]
        machine_learning = [item for item in machine_learning if item['index'] == 0 and item['lesson'] in ['ML-F11','ML-C14']]

    viewports = [(320,844),(390,844),(1440,1000)] if args.focused_only else [(390,844),(1440,1000)]
    for width, height in viewports:
        page.set_viewport_size({'width': width, 'height': height})
        for family, inventory in [('data', foundations), ('ml', machine_learning)]:
            prefix = 'data-foundations' if family == 'data' else 'ml-learn'
            page.goto(args.base_url+'/'+prefix+'.html')
            page.wait_for_function('!!window.FoundationsCurriculum' if family == 'data' else '!!window.MLLearning')
            page.evaluate("AppAppearance.apply('light')")
            for item in inventory:
                page.evaluate('(item)=>location.hash=`#${item.deck}/${item.lesson}/${item.index}`', item)
                if family == 'data':
                    try:
                        page.wait_for_function('''item =>
                          document.querySelector('.foundation-lesson-heading h2')?.textContent === item.title &&
                          [...document.querySelectorAll('.foundation-practices li')].findIndex(li=>li.hasAttribute('aria-current')) === item.index''', arg=item)
                    except Exception:
                        print({'route':item,'title':page.locator('.foundation-lesson-heading h2').all_text_contents(),'pageErrors':errors},flush=True)
                        raise
                else:
                    page.wait_for_function('id => MLLearning.activity?.id === id', arg=item['id'])
                record = page.evaluate('''()=>{
                  const content=document.querySelector('.foundation-split>.foundation-content'),
                    code=document.querySelector('.foundation-split>.foundation-code-pane, .foundation-split>.ml-choice'),
                    reference=document.querySelector('.foundation-reference-content'),
                    split=content?.parentElement,
                    indicators=[...document.querySelectorAll('.foundation-practices li')],
                    editor=document.querySelector('#foundationEditor,#mlEditor'),
                    layer=document.querySelector('#foundationHighlight,#mlHighlight'),
                    style=editor&&getComputedStyle(editor), layerStyle=layer&&getComputedStyle(layer);
                  return {
                    overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1,
                    order:!!(content&&code&&reference&&split.children.length===2&&content.nextElementSibling===code&&content.contains(reference)),
                    stageLinks:document.querySelectorAll('.foundation-practices a,.foundation-practices button').length,
                    modeControls:document.querySelectorAll('[data-learning-mode]').length,
                    stageDescriptions:indicators.every(li=>!!li.querySelector('span')?.textContent.trim()&&getComputedStyle(li.querySelector('span')).display!=='none'),
                    currentIndicators:indicators.filter(li=>li.hasAttribute('aria-current')).length,
                    currentIndicatorText:document.querySelector('.foundation-practices [aria-current] em')?.textContent,
                    codeScroll:getComputedStyle(code).overflowY,
                    codeHeight:code.clientHeight,
                    codeScrollHeight:code.scrollHeight,
                    paneHeight:split.clientHeight,
                    paneBottom:split.getBoundingClientRect().bottom,
                    contentScroll:getComputedStyle(content).overflowY,
                    contentHeight:content.clientHeight,
                    contentScrollHeight:content.scrollHeight,
                    referenceOpen:reference.querySelectorAll('details[open]').length,
                    supportingControls:[...reference.querySelectorAll(':scope>details>summary')].map(summary=>summary.textContent.trim()),
                    nestedSupportingControls:reference.querySelectorAll('details details').length,
                    mobileOrder:innerWidth>800||content.getBoundingClientRect().bottom<=code.getBoundingClientRect().top+1,
                    editor:editor&&{
                      top:Math.round(editor.getBoundingClientRect().top+scrollY),height:editor.clientHeight,
                      fontSize:style.fontSize,lineHeight:style.lineHeight,paddingTop:style.paddingTop,
                      layerLineHeight:layerStyle.lineHeight,layerFontSize:layerStyle.fontSize,
                      layerPaddingTop:layerStyle.paddingTop,whiteSpace:style.whiteSpace,
                      layerWhiteSpace:layerStyle.whiteSpace,scrollTop:editor.scrollTop,
                      layerScrollTop:layer.scrollTop,selection:editor.selectionStart,
                      marker:editor.value.indexOf('# Your work\\n'),sourceLines:editor.value.split('\\n').length,
                      hasLabel:!!document.querySelector(`label[for="${editor.id}"]`),
                      described:!!editor.getAttribute('aria-describedby')
                    }
                  };
                }''')
                record.update(id=item['id'], family=family, width=width)
                assert not record['overflow'], record
                assert record['order'] and record['mobileOrder'], record
                assert record['stageLinks'] == record['modeControls'] == 0, record
                assert record['stageDescriptions'] and record['currentIndicators'] == 1, record
                assert record['currentIndicatorText'] == 'Current exercise', record
                assert record['referenceOpen'] == record['nestedSupportingControls'] == 0, record
                assert record['supportingControls'][0] in ['Hint','Hints'], record
                assert len(record['supportingControls']) == 2, record
                assert page.locator('.foundation-reference,.ml-reference,.foundation-reference-body').count()==0
                assert page.locator('.foundation-content > .foundation-task-reminder').count()==1
                assert page.locator('.foundation-code-pane .foundation-task-reminder').count()==0
                assert page.locator('.teaching-worked mark').count()==0
                snippet_sizes=page.locator('.teaching-syntax-parts dt > code,.foundation-parameter-parts dt > code').evaluate_all('nodes=>nodes.map(n=>getComputedStyle(n).fontSize)')
                assert all(size=='16px' for size in snippet_sizes),(item,snippet_sizes)
                dataframe=page.locator('.foundation-data-preview')
                if dataframe.count():assert dataframe.evaluate('(e)=>e.nextElementSibling.matches(".foundation-task-reminder")'),item
                if width <= 800:
                    assert record['contentScroll'] == record['codeScroll'] == 'visible', record
                else:
                    assert record['contentScroll'] == record['codeScroll'] == 'auto', record
                    assert abs(record['contentHeight'] - record['paneHeight']) <= 2, record
                    assert abs(record['codeHeight'] - record['paneHeight']) <= 2, record
                    assert record['paneBottom'] <= height - 30, record
                if record['editor']:
                    editor_record = record['editor']
                    assert editor_record['height'] >= 220, record
                    assert editor_record['fontSize'] == editor_record['layerFontSize'], record
                    assert editor_record['lineHeight'] == editor_record['layerLineHeight'], record
                    assert editor_record['paddingTop'] == editor_record['layerPaddingTop'], record
                    assert editor_record['whiteSpace'] == editor_record['layerWhiteSpace'] == 'pre', record
                    assert abs(editor_record['scrollTop']-editor_record['layerScrollTop']) <= 1, record
                    assert editor_record['hasLabel'] and editor_record['described'], record
                    if width <= 800:
                        assert float(editor_record['fontSize'].removesuffix('px')) >= 16, record
                    if editor_record['marker'] >= 0:
                        assert editor_record['selection'] == editor_record['marker']+len('# Your work\n'), record
                records.append(record)
                if args.focused_only and item['lesson'] == 'W19':
                    headers = page.locator('.teaching-example-table-scroll .teaching-example-output thead code')
                    assert headers.count() == 3
                    assert all(header.evaluate('(element)=>element.getClientRects().length') == 1 for header in headers.all())
                    assert all(header.evaluate('(element)=>getComputedStyle(element).whiteSpace') == 'nowrap' for header in headers.all())
                if item['index'] == 0 and item['lesson'] in ['I19S','W19','V04','ML-F11','ML-C14']:
                    page.screenshot(path=str(snapshots/f"{item['lesson']}-{width}-light.png"), full_page=True)
                    if item['lesson'] == 'W19':
                        page.evaluate("AppAppearance.apply('dark')")
                        page.screenshot(path=str(snapshots/f"{item['lesson']}-{width}-dark.png"), full_page=True)
                        page.evaluate("AppAppearance.apply('light')")
            print(f'{width}px: rendered {len(inventory)} {family} activities', flush=True)

    # Interact with the shared editor and disclosure controls on both renderers.
    for prefix, route, editor_id, run_id, reset_id in [
        ('data-foundations','visualise/V04/0','foundationEditor','runExercise','resetExercise'),
        ('ml-learn','classification/ML-C14/0','mlEditor','mlRun','mlReset')
    ]:
        page.set_viewport_size({'width':390,'height':844})
        page.goto(f'{args.base_url}/{prefix}.html#{route}')
        editor=page.locator('#'+editor_id)
        editor.wait_for()
        starter=editor.input_value()
        assert page.locator('[data-learning-mode]').count()==0
        assert page.locator('.foundation-practices a,.foundation-practices button').count()==0
        page.locator('#jumpToWork').click()
        editor.press('Tab')
        assert editor.input_value()!=starter
        editor.press('Control+z')
        assert editor.input_value()==starter
        editor.press('Escape')
        editor.press('Tab')
        assert page.locator('#'+run_id).evaluate('(element)=>document.activeElement===element')
        editor.fill('# Temporary edit for reset verification')
        page.locator('#'+reset_id).click()
        assert editor.input_value()==starter
        reference=page.locator('.foundation-reference-content details').first
        reference.locator(':scope>summary').click()
        assert reference.evaluate('(element)=>element.open')
        assert editor.input_value()==starter
        page.evaluate('(route)=>location.hash=route.replace(/0$/,"1")',route)
        page.wait_for_function('document.querySelectorAll(".foundation-practices li")[1].hasAttribute("aria-current")')
        if prefix=='data-foundations':
            assert '# Your work' in page.locator('#'+editor_id).input_value()

    page.goto(args.base_url+'/data-foundations.html#wrangle/W19/0')
    page.locator('#foundationEditor').wait_for()
    for theme in ['light','dark']:
        page.evaluate('theme=>AppAppearance.apply(theme)',theme)
        styles=page.evaluate('''()=>{
          const rgb=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
            const context=canvas.getContext('2d');context.fillStyle=color;context.fillRect(0,0,1,1);
            return [...context.getImageData(0,0,1,1).data].slice(0,3);};
          const luminance=color=>rgb(color).map(channel=>{const v=channel/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
          return ['column','variable','syntax'].map(role=>{
            const selector=role==='syntax'?'code:is([data-code-role="syntax"],[data-code-role="function"],[data-code-role="parameter"],[data-code-role="operation"])':`code[data-code-role="${role}"]`;
            const element=[...document.querySelectorAll(selector)].find(e=>!e.closest('pre')&&e.dataset.codeFocus!=='true'),
              style=getComputedStyle(element),foreground=luminance(style.color),background=luminance(style.backgroundColor);
            return {role,name:element.textContent,contrast:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05),
              underline:style.textDecorationLine,borderStyle:style.borderLeftStyle,
              borderWidth:style.borderLeftWidth,topBorderStyle:style.borderTopStyle,
              bottomBorderStyle:style.borderBottomStyle,shadow:style.boxShadow,cursor:style.cursor};
          });
        }''')
        for style in styles:
            assert style['contrast']>=4.5, (theme,style)
            assert style['underline']=='none' and style['shadow']=='none', (theme,style)
        assert styles[0]['borderStyle']=='solid' and styles[1]['borderStyle']=='double', (theme,styles)
        assert styles[2]['topBorderStyle']==styles[2]['bottomBorderStyle']=='dotted', (theme,styles)
        assert all(style['cursor']!='pointer' for style in styles), (theme,styles)
        identifier_styles.append({'theme':theme,'roles':styles})

    # Real wheel input must scroll only the hovered desktop pane. This also
    # verifies that the editor's own scrollbar does not replace pane scrolling.
    page.set_viewport_size({'width':1440,'height':768})
    for prefix, route in [('data-foundations','visualise/V04/0'),('ml-learn','foundations/ML-F11/0')]:
        page.goto(f'{args.base_url}/{prefix}.html#{route}')
        page.locator('.foundation-code-pane').wait_for()
        page.evaluate('document.fonts.ready')
        page.wait_for_function('document.querySelector(".foundation-split").style.getPropertyValue("--lesson-pane-height")')
        panes=page.locator('.foundation-split>.foundation-content,.foundation-split>.foundation-code-pane')
        for pane_index in [0,1]:
            page.evaluate('''()=>{scrollTo(0,0);document.querySelectorAll('.foundation-split>*').forEach(e=>e.scrollTop=0)}''')
            before=page.evaluate('''()=>({body:scrollY,panes:[...document.querySelectorAll('.foundation-split>*')].map(e=>e.scrollTop)})''')
            bounds=panes.nth(pane_index).bounding_box()
            page.mouse.move(bounds['x']+bounds['width']/2,bounds['y']+20)
            page.mouse.wheel(0,400)
            page.wait_for_function('index=>document.querySelectorAll(".foundation-split>*")[index].scrollTop>0',arg=pane_index)
            after=page.evaluate('''()=>({body:scrollY,panes:[...document.querySelectorAll('.foundation-split>*')].map(e=>e.scrollTop)})''')
            assert after['body']==before['body'],(prefix,pane_index,before,after)
            assert after['panes'][1-pane_index]==before['panes'][1-pane_index],(prefix,pane_index,before,after)
            panes.nth(pane_index).evaluate('(element)=>element.scrollTop=element.scrollHeight')
            edge_before=page.evaluate('''()=>({body:scrollY,panes:[...document.querySelectorAll('.foundation-split>*')].map(e=>e.scrollTop)})''')
            page.mouse.wheel(0,400)
            page.wait_for_timeout(100)
            edge_after=page.evaluate('''()=>({body:scrollY,panes:[...document.querySelectorAll('.foundation-split>*')].map(e=>e.scrollTop)})''')
            assert edge_after==edge_before,(prefix,pane_index,edge_before,edge_after)
            pane_scroll_checks.append({'family':prefix,'pane':'lesson' if pane_index==0 else 'python',
                'before':before,'after':after,'atBottomBefore':edge_before,'atBottomAfter':edge_after})

    # A coarse pointer above the phone breakpoint must retain 16px native input
    # and matching overlay metrics; desktop geometry still uses two panes.
    touch=context.browser.new_context(viewport={'width':820,'height':1180},has_touch=True,service_workers='block')
    touch_page=touch.new_page()
    touch_page.on('pageerror',lambda error:errors.append({'url':touch_page.url,'message':str(error)}))
    for prefix,route in [('data-foundations','visualise/V04/0'),('ml-learn','foundations/ML-F11/0')]:
        touch_page.goto(f'{args.base_url}/{prefix}.html#{route}')
        touch_page.locator('#foundationEditor,#mlEditor').wait_for()
        metrics=touch_page.evaluate('''()=>{
          const editor=document.querySelector('#foundationEditor,#mlEditor'),layer=document.querySelector('#foundationHighlight,#mlHighlight');
          const e=getComputedStyle(editor),l=getComputedStyle(layer);
          return {touch:matchMedia('(pointer:coarse)').matches,fontSize:e.fontSize,lineHeight:e.lineHeight,
            layerFontSize:l.fontSize,layerLineHeight:l.lineHeight,
            controls:[...document.querySelectorAll('.teaching-visual-controls select')].map(s=>({height:s.getBoundingClientRect().height,fontSize:getComputedStyle(s).fontSize}))};
        }''')
        assert metrics['touch'] and float(metrics['fontSize'].removesuffix('px'))>=16,metrics
        assert metrics['fontSize']==metrics['layerFontSize'] and metrics['lineHeight']==metrics['layerLineHeight'],metrics
        assert all(control['height']>=44 and float(control['fontSize'].removesuffix('px'))>=16 for control in metrics['controls']),metrics
        touch_checks.append({'family':prefix,'width':820,**metrics})
    touch.close()
    assert not errors, errors
    browser.close()

out=Path(args.output)
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'buildContentId':build_content_id,'observedStyleHashes':style_hashes,'focusedOnly':args.focused_only,
    'records':records,'pageErrors':errors,'identifierStyles':identifier_styles,
    'independentPaneWheelChecks':pane_scroll_checks,'touchChecks':touch_checks,'interactionChecks':[
    'original non-interactive exercise indicators','indent and undo','Escape/Tab leaves editor',
    'reset restores starter','reference disclosure keeps code','route navigation updates current exercise',
    'independent desktop lesson/Python wheel scrolling','coarse-pointer native editor alignment'
]},indent=2)+'\n')
print(f'{len(records)} assembled responsive renders and both editor interaction checks passed.')
