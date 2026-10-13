"""Exercise every assembled curriculum route at phone and desktop widths.

This suite checks reading order, native editor alignment and keyboard escape.
Python execution is covered by the separate runtime/browser suites.
"""
import argparse
import json
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--output', default='docs/curriculum-evidence/responsive-coverage.json')
args = parser.parse_args()
records, errors, identifier_styles = [], [], []

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'))
    context = browser.new_context(service_workers='block')
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

    for width, height in [(390, 844), (1440, 1000)]:
        page.set_viewport_size({'width': width, 'height': height})
        for family, inventory in [('data', foundations), ('ml', machine_learning)]:
            prefix = 'data-foundations' if family == 'data' else 'ml-learn'
            page.goto(args.base_url+'/'+prefix+'.html')
            page.wait_for_function('!!window.FoundationsCurriculum' if family == 'data' else '!!window.MLLearning')
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
                    editor=document.querySelector('#foundationEditor,#mlEditor'),
                    layer=document.querySelector('#foundationHighlight,#mlHighlight'),
                    style=editor&&getComputedStyle(editor), layerStyle=layer&&getComputedStyle(layer);
                  return {
                    overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1,
                    order:!!(content&&code&&reference&&content.nextElementSibling===code&&code.nextElementSibling===reference),
                    contentScroll:getComputedStyle(content).overflowY,
                    contentHeight:content.clientHeight,
                    contentScrollHeight:content.scrollHeight,
                    referenceOpen:reference.querySelectorAll('details[open]').length,
                    mobileOrder:innerWidth>800||(content.getBoundingClientRect().bottom<=code.getBoundingClientRect().top+1&&code.getBoundingClientRect().bottom<=reference.getBoundingClientRect().top+1),
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
                assert record['contentScroll'] == 'visible', record
                assert record['referenceOpen'] == 0, record
                if record['editor']:
                    editor_record = record['editor']
                    assert editor_record['height'] >= 220, record
                    assert editor_record['fontSize'] == editor_record['layerFontSize'], record
                    assert editor_record['lineHeight'] == editor_record['layerLineHeight'], record
                    assert editor_record['paddingTop'] == editor_record['layerPaddingTop'], record
                    assert editor_record['whiteSpace'] == editor_record['layerWhiteSpace'] == 'pre', record
                    assert abs(editor_record['scrollTop']-editor_record['layerScrollTop']) <= 1, record
                    assert editor_record['hasLabel'] and editor_record['described'], record
                    if width == 390:
                        assert float(editor_record['fontSize'].removesuffix('px')) >= 16, record
                    if editor_record['marker'] >= 0:
                        assert editor_record['selection'] == editor_record['marker']+len('# Your work\n'), record
                records.append(record)
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
        page.locator('[data-learning-mode="refresh"]').click()
        assert page.locator('[data-learning-depth][open]').count()==0
        assert editor.input_value()==starter
        page.locator('[data-learning-mode="learn"]').click()
        assert editor.input_value()==starter
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
        page.locator('.foundation-practices a').nth(1).click()
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
          return ['column','variable'].map(role=>{
            const element=[...document.querySelectorAll(`code[data-code-role="${role}"]`)].find(e=>!e.closest('pre')),
              style=getComputedStyle(element),foreground=luminance(style.color),background=luminance(style.backgroundColor);
            return {role,name:element.textContent,contrast:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05),
              underline:style.textDecorationLine,borderStyle:style.borderLeftStyle,
              borderWidth:style.borderLeftWidth,shadow:style.boxShadow};
          });
        }''')
        for style in styles:
            assert style['contrast']>=4.5, (theme,style)
            assert style['underline']=='none' and style['shadow']=='none', (theme,style)
        assert styles[0]['borderStyle']!=styles[1]['borderStyle'], (theme,styles)
        identifier_styles.append({'theme':theme,'roles':styles})

    assert not errors, errors
    browser.close()

out=Path(args.output)
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'records':records,'pageErrors':errors,'identifierStyles':identifier_styles,'interactionChecks':[
    'Learn/Refresh keeps active code','indent and undo','Escape/Tab leaves editor',
    'reset restores starter','reference disclosure keeps code','stage navigation'
]},indent=2)+'\n')
print(f'{len(records)} assembled responsive renders and both editor interaction checks passed.')
