"""Real browser/Pyodide learning journeys, semantic audit, and responsive evidence."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8010');parser.add_argument('--engine',default='chromium');parser.add_argument('--all-solutions',action='store_true');args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1];evidence=ROOT/'tests/evidence/foundations';evidence.mkdir(parents=True,exist_ok=True)
report={'engine':args.engine,'checks':[],'screenshots':[]};start=time.time()
with sync_playwright() as p:
 browser=getattr(p,args.engine).launch();context=browser.new_context();page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(args.base_url+'/playground.html?runtime=local')
 assert page.locator('.route-tools .learn-refresh').count()==1
 assert page.locator('.data-route-actions #moreTasksToggle').count()==1
 page.locator('.learn-refresh').click();page.wait_for_url('**/data-foundations.html')
 assert page.locator('.foundation-deck').count()==3
 assert page.locator('.mode-switch a').count()==4
 assert page.locator('.mode-switch a[href="data-foundations.html"]').count()==0
 page.locator('.back-playground').click();page.wait_for_url('**/playground.html')
 report['checks'].append('Data-only CTA and round-trip navigation')
 base=args.base_url+'/data-foundations.html?runtime=local'
 page.goto(base)
 page.locator('.foundation-deck[data-deck="inspect"]').click()
 assert page.locator('.lesson-card').count()==25
 page.locator('.lesson-card[href="#inspect/I01/0"]').click()
 page.wait_for_function("document.querySelector('#foundationRuntime').textContent.includes('Python ready')",timeout=120000)
 def open_lesson(id,index=0):
  deck={'I':'inspect','W':'wrangle','V':'visualise'}[id[0]]
  page.evaluate('(hash)=>{location.hash=hash}',f'#{deck}/{id}/{index}')
  page.wait_for_function('(id)=>document.querySelector(".foundation-lesson-heading")?.textContent.includes(id)',arg=id)
  page.wait_for_function('!document.querySelector("#runExercise").disabled')
 def solution(id,index=0):return page.evaluate('([id,i])=>FoundationsCurriculum.lessons.find(l=>l.id===id).rounds[i].solution',[id,index])
 def run(code,check=True):
  page.locator('#foundationEditor').fill(code)
  page.locator('#checkExercise' if check else '#runExercise').click()
  page.wait_for_function('!document.querySelector("#runExercise").disabled',timeout=120000)
  return page.locator('#foundationFeedback').inner_text()
 assert not page.locator('#foundationSolution').get_attribute('open')
 page.locator('#foundationHint summary').click();assert page.locator('#foundationHint').get_attribute('open') is not None
 page.locator('#foundationSolution summary').click();assert 'pd.DataFrame' in page.locator('#foundationSolution pre').inner_text()
 assert 'matches' in run(solution('I01'))
 assert page.locator('#foundationOutput table tbody tr').count()==4
 page.locator('.foundation-navigation a').last.click();assert page.url.endswith('/1')
 page.locator('#foundationEditor').fill('# saved draft\ndf')
 page.reload();assert page.locator('#foundationEditor').input_value()=='# saved draft\ndf'
 assert page.evaluate('JSON.parse(localStorage.getItem("dspp-foundations-v1")).passed["I01-1"]')
 page.locator('#resetExercise').click();assert '# saved draft' not in page.locator('#foundationEditor').input_value()
 assert 'fresh given data' in page.locator('#foundationFeedback').inner_text()
 report['checks'].append('Deck, round progression, hints/solutions, drafts, completion persistence and exercise reset')
 open_lesson('I02')
 assert 'matches' in run('df.iloc[:2]')
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
 # Production worker, full curriculum, no mock interpreter or result substitution.
 if args.all_solutions:
  result=page.evaluate('''async () => {
   const source=await (await fetch('foundations/worker.js')).text();
   const bridge=createPythonBridge(source);
   const config={indexURL:AppPlatform.pyodideIndexUrl,seaborn:AppPlatform.seabornRequirement,source:FoundationsRuntimeSource};
   const failures=[];let count=0;
   for(const lesson of FoundationsCurriculum.lessons){
    for(const exercise of lesson.rounds){
     try{const response=await bridge.send('run',{config,request:{code:exercise.solution,check:true,exercise,columns:FoundationsCurriculum.datasets[exercise.dataset].columns}});
      if(!response.result.passed)failures.push({id:exercise.id,error:response.result.error||response.result.feedback});else count++;
     }catch(error){failures.push({id:exercise.id,error:String(error)});}
    }
   }
   return {count,failures};
  }''')
  report['pyodide_solutions']=result;assert not result['failures'],result
 # Content, output and controls stay within their columns in both themes.
 for width,height,label in [(1440,1000,'desktop'),(834,1112,'tablet'),(390,844,'mobile')]:
  page.set_viewport_size({'width':width,'height':height})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for route,view in [('#','decks'),('#wrangle','library'),('#inspect/I02/0','lesson')]:
    page.evaluate('(route)=>{location.hash=route}',route);page.wait_for_timeout(100)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(label,theme,view)
    assert page.evaluate('Array.from(document.querySelectorAll(".foundation-deck,.lesson-card,.foundation-code-pane,.foundation-content,.foundation-actions")).every(e=>{const b=e.getBoundingClientRect();return b.left>=-1&&b.right<=innerWidth+1})'),(label,theme,view)
    if view=='lesson':
     geometry=page.evaluate('''()=>{const a=document.querySelector('.foundation-content').getBoundingClientRect(),b=document.querySelector('.foundation-code-pane').getBoundingClientRect();return {stacked:b.top>=a.bottom-1,split:b.left>=a.right-1}}''')
     assert geometry['stacked' if width<=800 else 'split'],geometry
    path=evidence/f'{args.engine}-{label}-{theme}-{view}.png';page.screenshot(path=str(path),full_page=True)
    report['screenshots'].append(str(path.relative_to(ROOT)))
   # Real plot output is also reviewed in every viewport/theme.
   open_lesson('V16');assert 'matches' in run(solution('V16'))
   assert page.locator('.figure-links a').first.evaluate('(e)=>getComputedStyle(e).color')=='rgb(29, 42, 66)'
   path=evidence/f'{args.engine}-{label}-{theme}-plot.png';page.screenshot(path=str(path),full_page=True)
   report['screenshots'].append(str(path.relative_to(ROOT)))
 # Narrow-phone boundary and fading scaffold stay usable.
 page.set_viewport_size({'width':320,'height':740});open_lesson('I02',2)
 assert page.locator('summary',has_text='Recall the syntax').is_visible()
 assert not page.locator('.foundation-syntax').is_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.locator('.foundation-skip').focus();page.locator('.foundation-skip').click()
 assert page.url.endswith('/2')
 report['checks'].append('Desktop/tablet/mobile layouts, 320px boundary, fading scaffold, skip link and light/dark themes; 24 screenshots')
 page.goto(base);assert page.locator('.foundation-continue').count()==1
 page.locator('#forgetProgress').click();page.locator('#confirmForget').click()
 assert page.locator('.foundation-continue').count()==0
 saved=page.evaluate('JSON.parse(localStorage.getItem("dspp-foundations-v1"))');assert not saved['passed'] and not saved['drafts'] and saved['last'] is None
 # Persist the shared appearance independently from reset learning.
 page.reload();assert page.locator('body').get_attribute('data-theme')=='dark'
 assert not errors,errors
 report['checks'].append('Reset all learning, reload, independent appearance persistence; no JS page errors')
 browser.close()
report['seconds']=round(time.time()-start,1)
(evidence/f'{args.engine}-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
