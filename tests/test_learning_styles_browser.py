"""Guard the shared learning theme in direct-file previews and built HTTP pages."""
import argparse
import json
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8027')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
parser.add_argument('--executable-path', help='Optional installed browser executable; bundled browsers remain the default.')
parser.add_argument('--source-url', help='Optional unbundled-source HTTP origin when the browser blocks file URLs; CI retains file previews by default.')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
evidence = root / 'tests/evidence/learning-styles'
evidence.mkdir(parents=True, exist_ok=True)
records=[]
routes = [
    ('learn.html', '.learn-path', 'learn'),
    ('data-foundations.html', '.foundation-deck', 'decks'),
    ('data-foundations.html#inspect', '.lesson-card', 'library'),
    ('data-foundations.html#inspect/I01/1', '.foundation-code-pane', 'exercise'),
    ('data-foundations.html#wrangle/W19/0', '.foundation-code-pane', 'identifiers'),
]
with sync_playwright() as pw:
    browser_type = getattr(pw, args.engine)
    executable = args.executable_path
    if not executable and args.engine == 'chromium' and not Path(browser_type.executable_path).exists():
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
    browser = browser_type.launch(**({'executable_path': executable} if executable else {}))
    # Isolate every origin from any previously installed service worker.
    context = browser.new_context(service_workers='block')
    page = context.new_page()
    source_origin=('source-http',args.source_url.rstrip('/')) if args.source_url else ('file',root.as_uri())
    for origin, base in [source_origin, ('built', args.base_url.rstrip('/'))]:
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
                    record=dict(origin=origin,route=route,width=width,theme=theme,styles=styles)
                    if name in ['exercise', 'identifiers']:
                        assert page.locator('.foundation-editor-wrap').evaluate('(e)=>getComputedStyle(e).backgroundColor') == 'rgb(39, 40, 43)'
                        help_style = page.locator('#editorHelp').evaluate('(e)=>({position:getComputedStyle(e).position,width:e.getBoundingClientRect().width})')
                        assert help_style == {'position': 'absolute', 'width': 1}, help_style
                    if name == 'identifiers':
                        columns=page.locator('.foundation-task-reminder code[data-code-role="column"]').filter(has_text=re.compile('^mean_amount$'))
                        objects=page.locator('.foundation-task-reminder code[data-code-role="variable"]').filter(has_text=re.compile('^df$'))
                        syntax=page.locator('.foundation-content code[data-code-role="function"]:not(pre code)').filter(has_text=re.compile('^agg\\(\\)$'))
                        assert columns.count()>0 and objects.count()>0,(origin,theme,'explicit semantic roles')
                        assert syntax.count()>0,(origin,theme,'authored syntax in teaching prose')
                        def identifier_style(locator):
                            return locator.first.evaluate('''(node)=>{
                              const s=getComputedStyle(node), canvas=document.createElement('canvas');
                              canvas.width=canvas.height=1;
                              const c=canvas.getContext('2d');
                              const rgba=color=>{c.clearRect(0,0,1,1);c.fillStyle=color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].map(v=>v/255)};
                              const foreground=rgba(s.color),background=rgba(s.backgroundColor);
                              const luminance=rgb=>rgb.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
                              const a=luminance(foreground),b=luminance(background);
                              return {background:s.backgroundColor,border:s.borderLeftStyle,top:s.borderTopStyle,bottom:s.borderBottomStyle,display:s.display,shadow:s.boxShadow,underline:s.textDecorationLine.includes('underline'),weight:Number(s.fontWeight),font:s.fontFamily,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),opaque:background[3]===1};
                            }''')
                        column_style=identifier_style(columns)
                        object_style=identifier_style(objects)
                        syntax_style=identifier_style(syntax)
                        record['identifiers']=dict(column=column_style,variable=object_style,syntax=syntax_style)
                        assert column_style['border']=='solid' and object_style['border']=='double',(column_style,object_style)
                        assert syntax_style['top']=='dotted' and syntax_style['bottom']=='dotted',syntax_style
                        assert column_style['background']!=object_style['background'],'Shape and tint both distinguish column/object roles'
                        for role in [column_style,object_style,syntax_style]:
                            assert role['display']=='inline' and role['shadow']=='none' and not role['underline'],role
                            assert role['weight']>=600 and 'monospace' in role['font'],role
                            assert role['opaque'] and role['contrast']>=4.5,(origin,width,theme,role)
                        assert page.locator('pre code.code-identifier[data-code-role],.foundation-editor-wrap code.code-identifier').count()==0
                        header=page.locator('.teaching-example-output thead code[data-code-role="column"]').filter(has_text=re.compile('^mean_amount$'))
                        assert header.count()>0,(origin,'worked output header')
                        header_lines=header.first.evaluate('''(node)=>{
                          const range=document.createRange();range.selectNodeContents(node);
                          return {whiteSpace:getComputedStyle(node).whiteSpace,lines:new Set([...range.getClientRects()].map(rect=>rect.y.toFixed(1))).size};
                        }''')
                        assert header_lines==dict(whiteSpace='nowrap',lines=1),(origin,width,theme,'intact column name in worked table',header_lines)
                        assert page.locator('.foundation-reference,.learning-name-key').count()==0
                    page.screenshot(path=str(evidence / f'{args.engine}-{origin}-{width}-{theme}-{name}.png'))
                    records.append(record)
    browser.close()
(evidence/f'{args.engine}-report.json').write_text(json.dumps(dict(engine=args.engine,source_preview=source_origin[0],views=records),indent=2)+'\n')
print(f'{args.engine}: five learning screens retain styling in {source_origin[0]} and built previews, desktop/mobile, light/dark; semantic tint/shape, 4.5:1 text contrast, optional key and code alignment passed.')
