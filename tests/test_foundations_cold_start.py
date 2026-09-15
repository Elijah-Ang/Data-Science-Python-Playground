"""Fresh worker package boundaries and real transitions; no timing threshold tied to a CDN."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8010');parser.add_argument('--engine',default='chromium');args=parser.parse_args()
with sync_playwright() as p:
 browser=getattr(p,args.engine).launch();page=browser.new_page();page.goto(args.base_url+'/data-foundations.html')
 result=page.evaluate('''async()=>{
  const source=await(await fetch('foundations/worker.js')).text(), bridge=createPythonBridge(source);
  const config={indexURL:AppPlatform.pyodideIndexUrl,seaborn:AppPlatform.seabornRequirement,source:FoundationsRuntimeSource};
  const start=performance.now(), first=await bridge.send('init',{config}),seconds=(performance.now()-start)/1000;
  const stages=[];
  for(const id of ['I02','I01CSV','W28','V04','I02']){
   const exercise=FoundationsCurriculum.lessons.find(l=>l.id===id).rounds[0];
   const run=await bridge.send('run',{config,request:{exercise,columns:FoundationsCurriculum.datasets[exercise.dataset].columns,code:exercise.solution,check:true}});
   const state=await bridge.send('init',{config});stages.push({id,passed:run.result.passed,packages:state.packages});
  }
  return {seconds,initial:first.packages,stages};
 }''')
 assert 'pandas' in result['initial']
 assert not set(result['initial'])&{'matplotlib','scipy','scikit-learn'}
 assert all(stage['passed'] for stage in result['stages'])
 assert 'matplotlib' not in result['stages'][1]['packages']
 assert 'scikit-learn' in result['stages'][2]['packages']
 assert 'matplotlib' in result['stages'][3]['packages']
 browser.close()
out=Path('tests/evidence/foundations');out.mkdir(parents=True,exist_ok=True);(out/(args.engine+'-cold-start.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result))
