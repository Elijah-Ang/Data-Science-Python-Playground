"""Real browser/Pyodide learning journeys, semantic audit, and responsive evidence."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8010');parser.add_argument('--engine',default='chromium');parser.add_argument('--runtime',choices=['local','remote'],default='local');parser.add_argument('--all-solutions',action='store_true');args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1];evidence=ROOT/'tests/evidence/foundations';evidence.mkdir(parents=True,exist_ok=True)
report={'engine':args.engine,'checks':[],'screenshots':[]};start=time.time()
with sync_playwright() as p:
 browser=getattr(p,args.engine).launch();context=browser.new_context();page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda message:print(message.text,flush=True) if message.text.startswith('Audit:') else None)
 runtime_query='?runtime=local' if args.runtime=='local' else ''
 page.goto(args.base_url+'/playground.html'+runtime_query)
 assert page.locator('.route-tools .learn-refresh').count()==1
 assert page.locator('.data-route-actions #moreTasksToggle').count()==1
 page.wait_for_function("getComputedStyle(document.querySelector('.learn-refresh')).backgroundImage!=='none'")
 learn_style=page.locator('.learn-refresh').evaluate('(e)=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {background:s.backgroundImage,radius:s.borderRadius,width:b.width,height:b.height}}')
 assert 'linear-gradient' in learn_style['background'] and 'url(' not in learn_style['background']
 assert float(learn_style['radius'].replace('px',''))>=18 and learn_style['width']>=162 and learn_style['height']>=36
 assert page.locator('.learn-refresh img').count()==0
 assert page.locator('.learn-refresh-icon svg, .learn-refresh-rays svg').count()==2
 page.locator('.learn-refresh').click();page.wait_for_url('**/data-foundations.html')
 page.wait_for_selector('.foundation-deck')
 assert page.locator('.foundation-deck').count()==3
 assert page.locator('.mode-switch a').count()==4
 assert page.locator('.mode-switch a[href="data-foundations.html"]').count()==0
 page.locator('.back-playground').click();page.wait_for_url('**/playground.html')
 report['checks'].append('Data-only CTA and round-trip navigation')
 base=args.base_url+'/data-foundations.html'+runtime_query
 page.goto(base)
 page.locator('.foundation-deck[data-deck="inspect"]').click()
 assert page.locator('.lesson-card').count()==27
 assert page.locator('.foundation-breadcrumb').count()==0
 page.locator('.chapter-jumps a').last.click()
 assert page.locator('#chapter-3').evaluate('(e)=>e.getBoundingClientRect().top')>=0
 assert page.locator('.lesson-card svg').count()==27
 page.locator('.back-playground').click();assert page.locator('.foundation-deck').count()==3
 page.locator('.foundation-deck[data-deck="inspect"]').click()
 page.locator('.lesson-card[href="#inspect/I01/0"], .lesson-card[href="data-foundations-I01.html"]').click()
 page.wait_for_function("document.querySelector('#foundationRuntime').textContent.includes('Python ready')",timeout=120000)
 def open_lesson(id,index=0):
  deck={'I':'inspect','W':'wrangle','V':'visualise'}[id[0]]
  page.evaluate('(hash)=>{location.hash=hash}',f'#{deck}/{id}/{index}')
  page.wait_for_function('([id,index])=>LearningRoutes.route("data",location,document.body).split("/")[1] === id && document.querySelector(".foundation-practices [aria-current=step] strong")?.textContent === FoundationsCurriculum.lessons.find(l=>l.id===id).rounds[index].label',arg=[id,index])
  page.wait_for_function('!document.querySelector("#runExercise").disabled')
 def solution(id,index=0):return page.evaluate('([id,i])=>FoundationsCurriculum.lessons.find(l=>l.id===id).rounds[i].solution',[id,index])
 def current_route():return page.evaluate('LearningRoutes.route("data",location,document.body)')
 def route_link(deck,id=None):
  fragment=f'#{deck}/{id}/0' if id else '#'+deck
  file=f'data-foundations-{id or deck}.html'
  return f'a[href="{fragment}"], a[href="{file}"]'
 def go_route(route):
  # This helper intentionally writes native history directly. Pace scripted
  # card sweeps below WebKit's 100 history operations per 10-second limit.
  page.wait_for_timeout(220)
  page.evaluate('''(route)=>{if(window.LearningRoutes){history.pushState(null,'',LearningRoutes.url('data',route));dispatchEvent(new PopStateEvent('popstate'));}else location.hash=route;}''',route)
 def run(code,check=True):
  if '# Supplied setup' not in code:
   code=page.evaluate('(code)=>{const [deck,id,index]=LearningRoutes.route("data",location,document.body).split("/");const r=FoundationsCurriculum.lessons.find(l=>l.id===id).rounds[Number(index)||0];return FoundationWorkspace.code(FoundationsCurriculum,r,code)}',code)
  page.locator('#foundationEditor').fill(code)
  page.locator('#checkExercise' if check else '#runExercise').click()
  page.wait_for_function('!document.querySelector("#runExercise").disabled',timeout=120000)
  return page.locator('#foundationFeedback').inner_text()
 assert page.locator('.foundation-practices a, .foundation-practices button').count()==0
 assert page.locator('.foundation-practices [aria-current="step"]').inner_text().startswith('Follow')
 assert page.locator('.back-playground').get_attribute('href') in ('#inspect','data-foundations-inspect.html')
 assert not page.locator('#foundationSolution').get_attribute('open')
 page.locator('#foundationHint summary').click();assert page.locator('#foundationHint').get_attribute('open') is not None
 page.locator('#foundationSolution summary').click();assert 'pd.DataFrame' in page.locator('#foundationSolution pre').inner_text()
 assert 'matches' in run(solution('I01'))
 assert page.locator('#foundationHighlight .py-keyword').count()>0
 assert page.locator('#foundationHighlight .py-string').count()>0
 assert page.locator('#foundationHighlight .py-number').count()>0
 assert page.locator('#foundationOutput table tbody tr').count()==4
 page.locator('.foundation-navigation a').last.click();assert current_route()=='inspect/I01/1'
 page.wait_for_function('document.querySelector(".foundation-practices [aria-current=step] strong")?.textContent === FoundationsCurriculum.lessons.find(l=>l.id==="I01").rounds[1].label')
 starter=page.locator('#foundationEditor').input_value()
 page.locator('#foundationEditor').fill('# unsaved edit\ndf')
 page.locator('.foundation-navigation a').last.click()
 page.wait_for_function('document.querySelector(".foundation-practices [aria-current=step] strong")?.textContent === FoundationsCurriculum.lessons.find(l=>l.id==="I01").rounds[2].label')
 page.go_back()
 page.wait_for_function('(starter)=>document.querySelector("#foundationEditor")?.value===starter',arg=starter)
 assert page.locator('#foundationEditor').input_value()==starter
 page.locator('#foundationEditor').fill('# unsaved edit\ndf')
 page.evaluate('localStorage.setItem("dspp-foundations-v1", JSON.stringify({version:1,drafts:{"I01-1":"legacy draft"},passed:{"I01":true},last:"I01"}))')
 page.reload();assert page.locator('#foundationEditor').input_value()==starter
 assert page.evaluate('localStorage.getItem("dspp-foundations-v1")') is None
 page.locator('#foundationEditor').fill('# unsaved edit\ndf')
 page.locator('#resetExercise').click();assert page.locator('#foundationEditor').input_value()==starter
 assert 'Setup and starter restored' in page.locator('#foundationFeedback').inner_text()
 assert page.locator('#runExercise').inner_text()=='▶ Run code'
 assert page.locator('#checkExercise').inner_text()=='✓ Check answer'
 assert page.locator('#resetExercise').inner_text()=='Reset code'
 # Real editor keys: indentation must edit code, while Escape keeps focus escapable.
 editor=page.locator('#foundationEditor')
 editor.fill('df = {\n"price": [1, 2],\n"drink": ["Tea", "Latte"],\n}')
 editor.evaluate('(e)=>{const s=e.value.indexOf("\\n")+1;const end=e.value.lastIndexOf("\\n");e.setSelectionRange(s,end);e.focus();}')
 page.keyboard.press('Tab')
 assert '\n    "price"' in editor.input_value() and '\n    "drink"' in editor.input_value()
 page.keyboard.press('Shift+Tab')
 assert '\n"price"' in editor.input_value() and '\n"drink"' in editor.input_value()
 editor.fill('ab');editor.evaluate('(e)=>e.setSelectionRange(2,2)');page.keyboard.press('Tab')
 assert editor.input_value()=='ab  '
 # Native engines coalesce edit groups differently; both must support undo/redo.
 page.keyboard.press('ControlOrMeta+z');assert editor.input_value()!='ab  '
 page.keyboard.press('ControlOrMeta+Shift+z');assert editor.input_value()=='ab  '
 # Exercise the documented setRangeText fallback, including consecutive indents.
 page.evaluate('()=>{window.originalEditorCommand=document.execCommand;document.execCommand=()=>false;}')
 editor.fill('ab');editor.focus();editor.press('End');editor.press('Tab');editor.press('Tab')
 assert editor.input_value()=='ab      '
 page.keyboard.press('ControlOrMeta+z');assert editor.input_value()=='ab  '
 page.keyboard.press('ControlOrMeta+z');assert editor.input_value()=='ab'
 page.keyboard.press('ControlOrMeta+Shift+z');assert editor.input_value()=='ab  '
 page.keyboard.press('ControlOrMeta+Shift+z');assert editor.input_value()=='ab      '
 page.evaluate('()=>{document.execCommand=originalEditorCommand;}')
 editor.fill('');page.keyboard.press('Tab');assert editor.input_value()=='    '
 page.keyboard.press('Shift+Tab');assert editor.input_value()==''
 page.keyboard.press('Escape');page.keyboard.press('Tab');assert page.locator('#runExercise').evaluate('(e)=>document.activeElement===e')
 editor.focus();page.keyboard.press('Escape');page.keyboard.press('Shift+Tab');assert not editor.evaluate('(e)=>document.activeElement===e')
 open_lesson('I01',1)
 example=solution('I01',1)
 assert '\n    "price":' in example and '\n    "drink":' in example
 open_lesson('I01CSV',1)
 assert ';' in page.get_by_role('heading',name='File · cafe.csv',exact=True).locator('..').inner_text()
 assert 'matches' in run(solution('I01CSV',1))
 assert 'Not yet' in run('pd.read_csv("cafe.csv")')
 open_lesson('I01CSV',2);assert 'matches' in run(solution('I01CSV',2))
 assert page.locator('#foundationOutput table tbody tr').count()==5
 report['checks'].append('Tab/Shift+Tab selection indentation, tab stops, undo, Escape focus exit, multiline solutions and CSV import/preview')
 report['checks'].append('Deck, round progression, hints/solutions, no draft persistence, legacy storage removal and exercise reset')
 open_lesson('I02')
 assert 'Not yet' in run('df.iloc[:2]')
 open_lesson('I02',2);assert 'matches' in run('df.sample(n=3, random_state=1)');open_lesson('I02')
 assert 'Not yet' in run('df.tail(2)')
 assert 'could not finish' in run('df[')
 assert 'SyntaxError' in page.locator('#foundationOutput').inner_text()
 assert 'could not finish' in run('df["unknown"]')
 run('df.drop(df.index, inplace=True)\npd=None\nnp=None\nplt=None',False)
 assert 'matches' in run('df.head(2)')
 # A real infinite loop is terminated by the shared worker bridge.
 page.locator('#foundationEditor').fill('while True:\n    pass');page.locator('#runExercise').click()
 page.locator('#stopPython').click()
 assert page.locator('#foundationEditor').input_value().startswith('while True')
 assert 'matches' in run('df.head(2)')
 report['checks'].append('Semantic equivalence, wrong values, syntax/KeyError recovery, fresh data, real infinite-loop restart')
 open_lesson('I01CSV');assert 'could not finish' in run('df');assert 'matches' in run(solution('I01CSV'))
 open_lesson('I09');assert page.locator('.foundation-table-scroll table th').first.inner_text()=='row'
 assert 'B' in page.locator('.foundation-table-scroll table').inner_text()
 open_lesson('W28');assert 'matches' in run(solution('W28'))
 open_lesson('W31');assert 'matches' in run(solution('W31'))
 open_lesson('V16');assert 'matches' in run(solution('V16'))
 assert page.locator('#foundationOutput img').count()==1
 wrong=solution('V16').replace('data=df,','data=df.head(2),')
 assert 'Not yet' in run(wrong)
 assert 'matches' in run(solution('V16'))
 page.get_by_role('link',name='Open figure larger',exact=True).click()
 assert page.get_by_role('dialog',name='Inspect figure').is_visible()
 page.get_by_role('button',name='Close figure',exact=True).click()
 open_lesson('V34');assert 'matches' in run(solution('V34'))
 assert page.get_by_role('link',name='Download chart.png',exact=True).is_visible()
 open_lesson('V37');assert 'matches' in run(solution('V37'))
 assert page.locator('#foundationOutput img').count()==3
 report['checks'].append('End-to-end cleaning, chart data validation, figure zoom, actual savefig export and three-chart report')
 report['visibility_cases']=[]
 for id in ['V02','V04','V16']:
  open_lesson(id)
  model=solution(id)
  for name,fragment,expected in [
   ('invisible axes','for _axis in plt.gcf().axes:\n    _axis.set_visible(False)',False),
   ('transparent data','for _axis in plt.gcf().axes:\n    for _mark in [*_axis.lines, *_axis.patches, *_axis.collections]:\n        _mark.set_alpha(0)',False),
   ('off-viewport data','for _axis in plt.gcf().axes:\n    _axis.set_xlim(10000, 20000)',False),
   ('visible styling','for _axis in plt.gcf().axes:\n    for _mark in [*_axis.lines, *_axis.patches, *_axis.collections]:\n        _mark.set_alpha(0.5)\n    for _spine in _axis.spines.values():\n        _spine.set_visible(False)',True),
  ]:
   code=model.replace('plt.show()',fragment+'\nplt.show()')
   feedback=run(code)
   assert ('matches' in feedback)==expected,(id,name,feedback)
   report['visibility_cases'].append({'id':id+'-1','case':name,'expected':expected,'feedback':feedback,'code':code,'status':'passed'})
 report['checks'].append('Real Pyodide hidden/transparent/off-viewport rejection and visible opacity/frame alternatives')
 report['annotation_cases']=[]
 for index in range(3):
  open_lesson('V22',index)
  model=solution('V22',index)
  for name,code,expected in [
   ('equivalent decimal precision',model.replace('annot=True,','annot=True, fmt=".3f",'),True),
   ('wrong numeric annotation',model.replace('plt.show()','for _axis in plt.gcf().axes:\n    for _text in _axis.texts:\n        _text.set_text("999.000")\nplt.show()'),False),
   ('nonnumeric annotation',model.replace('plt.show()','for _axis in plt.gcf().axes:\n    for _text in _axis.texts:\n        _text.set_text("unknown")\nplt.show()'),False),
  ]:
   feedback=run(code)
   assert ('matches' in feedback)==expected,(index,name,feedback)
   report['annotation_cases'].append({'id':f'V22-{index+1}','case':name,'expected':expected,'feedback':feedback,'code':code,'status':'passed'})
 for index in range(3):
  open_lesson('V23',index)
  model=solution('V23',index)
  code=model.replace('fmt="d"','fmt=".1f"') if index<2 else model.replace('fmt=".1f"','fmt=".3f"')
  feedback=run(code)
  assert 'Not yet' in feedback,(index,feedback)
  report['annotation_cases'].append({'id':f'V23-{index+1}','case':'wrong explicitly requested cell format','expected':False,'feedback':feedback,'code':code,'status':'passed'})
 report['checks'].append('Real Pyodide flexible numeric annotation precision, wrong-cell rejection and explicit integer/.1f formatting')
 # Core/extension routes remain separate, and chart-choice and inspection tasks run in real Python.
 open_lesson('V35');assert 'matches' in run('"scatter"')
 open_lesson('I05',1);assert 'Not yet' in run('# no answer');assert 'Not yet' in run('None');assert 'matches' in run('df.head(3).dtypes')
 assert page.locator('#foundationOutput table tbody tr').count()==5
 assert page.locator('#foundationOutput .empty-output').count()==0
 open_lesson('V08',1);assert 'matches' in run(solution('V08',1))
 open_lesson('V37',1);assert 'matches' in run(solution('V37',1))
 assert page.locator('.foundation-practice-brief ol > li').count()==4
 assert page.locator('.foundation-practice-brief .practice-question').count()==1
 page.locator('#foundationHint summary').click()
 assert 'worked example' not in page.locator('#foundationHint').inner_text()
 open_lesson('V37',2)
 assert page.locator('.foundation-navigation .deck-boundary').inner_text().strip()=='End of deck'
 assert page.locator('.foundation-navigation a[href*="V05"]').count()==0
 open_lesson('V05');assert page.locator('.foundation-navigation .deck-boundary').inner_text().strip()=='Start of deck'
 page.set_viewport_size({'width':390,'height':844});open_lesson('V37',1)
 page.get_by_role('button',name='Go to editor ↓').click()
 assert page.locator('#foundationEditor').evaluate('(e)=>document.activeElement===e')
 editor_box=page.locator('#foundationEditor').bounding_box()
 assert editor_box['y']>=-1,editor_box
 report['checks'].append('Distinct round demands, inspection checks, numbered checkpoint, editor jump and separate core/extension sequences')
 # Production worker, full curriculum, no mock interpreter or result substitution.
 if args.all_solutions:
  result=page.evaluate('''async () => {
   const source=await (await fetch('foundations/worker.js')).text();
   const bridge=createPythonBridge(source,{onStatus:data=>console.info('Audit: '+data.message)});
   const config={indexURL:AppPlatform.pyodideIndexUrl,seaborn:AppPlatform.seabornRequirement,source:FoundationsRuntimeSource};
   const failures=[];let count=0;
   for(const lesson of FoundationsCurriculum.lessons){
    console.info('Audit: '+lesson.id);
    for(const exercise of lesson.rounds){
     try{const response=await bridge.send('run',{config,request:{code:FoundationWorkspace.code(FoundationsCurriculum,exercise,exercise.solution),explicitSetup:true,check:true,exercise,columns:FoundationsCurriculum.datasets[exercise.dataset].columns}});
      if(!response.result.passed)failures.push({id:exercise.id,error:response.result.error||response.result.feedback});else count++;
     }catch(error){failures.push({id:exercise.id,error:String(error)});}
    }
   }
   return {count,failures};
  }''')
  report['pyodide_solutions']=result
  (evidence/f'{args.engine}-pyodide-solutions.json').write_text(json.dumps(result,indent=2))
  assert not result['failures'],result
 # Content, output and controls stay within their columns in both themes.
 for id,deck in [('I22','inspect'),('W31','wrangle'),('V37','visualise')]:
  open_lesson(id,2);assert page.locator(route_link(deck)).count()==1
 for width,height,label in [(1440,1000,'desktop'),(834,1112,'tablet'),(390,844,'mobile')]:
  page.set_viewport_size({'width':width,'height':height})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for route,view in [('#','decks'),('#wrangle','library'),('#inspect/I02/0','lesson')]:
    go_route(route);page.wait_for_timeout(100)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(label,theme,view)
    assert page.evaluate('Array.from(document.querySelectorAll(".foundation-deck,.lesson-card,.foundation-code-pane,.foundation-content,.foundation-actions")).every(e=>{const b=e.getBoundingClientRect();return b.left>=-1&&b.right<=innerWidth+1})'),(label,theme,view)
    if view=='lesson':
     assert page.locator('.foundation-lesson-heading > .foundation-practices').count()==1
     assert page.locator('.foundation-practices a, .foundation-practices button').count()==0
     geometry=page.evaluate('''()=>{const a=document.querySelector('.foundation-content').getBoundingClientRect(),b=document.querySelector('.foundation-code-pane').getBoundingClientRect(),copy=document.querySelector('.foundation-lesson-copy').getBoundingClientRect(),types=document.querySelector('.foundation-practices').getBoundingClientRect(),split=document.querySelector('.foundation-split').getBoundingClientRect();return {stacked:b.top>=a.bottom-1,split:b.left>=a.right-1,typesRight:types.left>=copy.right-1,typesBelow:types.top>=copy.bottom-1,workspace:split.height}}''')
     assert geometry['stacked' if width<=800 else 'split'],geometry
     editor_height=page.locator('.foundation-editor-wrap').bounding_box()['height']
     expected_editor_height=max(220,min(320,height*.3)) if width>800 else 380
     assert editor_height>=expected_editor_height-1,(label,editor_height)
     if width>800:
      assert geometry['typesRight'],geometry
      # The approved header shows the teaching order; stable IDs remain in routes.
      assert 'Lesson 02' in page.locator('.foundation-lesson-copy .foundation-eyebrow').inner_text()
      assert page.locator('.foundation-reference').count()==0
      assert 'I02' in page.url
      assert geometry['workspace']>=height-400,geometry
      before=page.locator('.foundation-code-pane').bounding_box()
      moved=page.locator('.foundation-content').evaluate('(e)=>{e.scrollTop=400;return e.scrollTop;}')
      assert moved>0
      assert page.locator('.foundation-code-pane').bounding_box()==before
      page.locator('.foundation-content').evaluate('(e)=>{e.scrollTop=0;}')
     else:
      assert geometry['typesBelow'],geometry
    path=evidence/f'{args.engine}-{label}-{theme}-{view}.png';page.screenshot(path=str(path),full_page=True)
    report['screenshots'].append(str(path.relative_to(ROOT)))
   # Real plot output is also reviewed in every viewport/theme.
   open_lesson('V16');assert 'matches' in run(solution('V16'))
   assert page.locator('.figure-links a').first.evaluate('(e)=>getComputedStyle(e).color')=='rgb(29, 42, 66)'
   path=evidence/f'{args.engine}-{label}-{theme}-plot.png';page.screenshot(path=str(path),full_page=True)
   report['screenshots'].append(str(path.relative_to(ROOT)))
 # Every card link resolves, and representative concept visuals have evidence at all widths.
 for deck in ['inspect','wrangle','visualise']:
  page.evaluate('(deck)=>{location.hash="#"+deck}',deck);page.wait_for_timeout(50)
  ids=page.evaluate('(deck)=>FoundationsCurriculum.lessons.filter(l=>l.deck===deck).map(l=>l.id)',deck)
  for id in ids:
   go_route(f'{deck}/{id}/0')
   page.wait_for_function('(id)=>LearningRoutes.route("data",location,document.body).split("/")[1] === id',arg=id)
   assert page.locator('.foundation-task-reminder').inner_text().startswith('Your task')
   assert page.locator('.back-playground').get_attribute('href') in ('#'+deck,'data-foundations-'+deck+'.html')
   assert page.locator(route_link(deck)).count()==1
 for width,height,label in [(1440,1000,'desktop'),(834,1112,'tablet'),(390,844,'mobile')]:
  page.set_viewport_size({'width':width,'height':height})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for deck,ids in [('inspect',['I03','I10']),('wrangle',['W10','W24','W22']),('visualise',['V04','V11','V18','V22','V30','V31'])]:
    page.evaluate('(deck)=>{location.hash="#"+deck}',deck);page.wait_for_timeout(50)
    for id in ids:
     card=page.locator(route_link(deck,id))
     card.scroll_into_view_if_needed()
     path=evidence/f'{args.engine}-{label}-{theme}-visual-{id}.png';card.screenshot(path=str(path));report['screenshots'].append(str(path.relative_to(ROOT)))
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 report['checks'].append('All cards reachable; chapter jumps, one-level Back, and 66 concept-visual screenshots')
 # On short laptops, the stationary panel must allow access to every control.
 page.set_viewport_size({'width':1280,'height':720});open_lesson('W31')
 panel=page.locator('.foundation-code-pane')
 assert panel.evaluate('(e)=>getComputedStyle(e).overflowY')=='auto'
 page.locator('#checkExercise').scroll_into_view_if_needed()
 bounds=panel.bounding_box();button=page.locator('#checkExercise').bounding_box()
 assert button['y']>=bounds['y'] and button['y']+button['height']<=bounds['y']+bounds['height']
 position=panel.bounding_box();page.locator('.foundation-content').evaluate('(e)=>{e.scrollTop=300}')
 assert panel.bounding_box()==position
 report['checks'].append('Short laptop: long checkpoint task cannot clip Run/Check/Reset; Python panel stays fixed')
 # Narrow-phone boundary and fading scaffold stay usable.
 page.set_viewport_size({'width':320,'height':740});open_lesson('I02',2)
 assert page.locator('.foundation-practice-brief').is_visible()
 assert page.locator('.teaching-overview').count()==0
 # This Transfer introduces reproducible sample syntax. The Follow overview
 # fades, while the authored transition remains available beside the task.
 assert page.locator('.teaching-transition').is_visible()
 assert page.locator('.teaching-transition .foundation-syntax').count()==1
 assert page.locator('.foundation-revisit a').is_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.locator('.foundation-skip').focus();page.locator('.foundation-skip').click()
 assert current_route()=='inspect/I02/2'
 report['checks'].append('Desktop/tablet/mobile layouts, 320px boundary, fading scaffold, skip link and light/dark themes; 24 screenshots')
 page.goto(base);assert page.locator('.foundation-continue').count()==0
 assert page.locator('#forgetProgress, #resetLearningDialog, #storageStatus, progress, [role="progressbar"]').count()==0
 assert not page.get_by_text('Resume practice',exact=False).count()
 assert not page.get_by_text('saved learning',exact=False).count()
 assert 'drafts stay' not in page.locator('.foundation-footer').inner_text()
 assert 'save draft' not in page.locator('body').inner_text().lower()
 assert page.evaluate('localStorage.getItem("dspp-foundations-v1")') is None
 # Shared appearance preference is independent of learning state.
 page.reload();assert page.locator('body').get_attribute('data-theme')=='dark'
 assert not errors,errors
 report['checks'].append('No saved-learning/resume/progress UI, reload, independent appearance persistence; no JS page errors')
 browser.close()
report['seconds']=round(time.time()-start,1)
(evidence/f'{args.engine}-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
