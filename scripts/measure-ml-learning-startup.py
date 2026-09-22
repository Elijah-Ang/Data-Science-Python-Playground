"""Fresh browser/worker contexts, no service worker; record loading and first-result medians."""
import argparse,json,statistics,subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8128');p.add_argument('--label',required=True);p.add_argument('--runs',type=int,default=3);p.add_argument('--remote',action='store_true');a=p.parse_args()
r=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')]))
all={e['id']:e for c in r['cards'] for e in c['exercises']};all.update({c['id']:c['exercise'] for c in r['challenges']})
one=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log('import numpy as np\\n'+productionInventory().ONE_R_HELPER_SOURCE)"],text=True)
config=dict(indexURL='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' if a.remote else a.base_url+'/pyodide/',oneR=one,source=(ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text())
files={str(p.relative_to(ROOT)):p.read_text() for p in (ROOT/'data').rglob('*.csv')}
rows=[]
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  browser=getattr(pw,engine).launch()
  for id in ['ML-F02-1','ML-F03-1','ML-W01-1','ML-X01']:
   for repeat in range(a.runs):
    context=browser.new_context(service_workers='block');page=context.new_page();page.goto(a.base_url+'/learn.html');page.add_script_tag(url=a.base_url+'/worker-bridge.js')
    result=page.evaluate("""async ({config,exercise,files})=>{
      const bridge=createPythonBridge(await(await fetch('ml-learning/worker.js')).text());
      const start=performance.now();
      const response=await bridge.send('run',{config,files,request:{exercise,code:exercise.solution}});
      const elapsed=performance.now()-start;
      if(!response.ok||response.result.error||response.result.checks.some(c=>!['correct','self-review'].includes(c.status)))throw Error(JSON.stringify(response));
      const loaded=await bridge.send('init',{config});
      return {elapsedMs:elapsed,packages:loaded.packages,phases:response.timings||null};
    }""",dict(config=config,exercise=all[id],files=files))
    rows.append(dict(engine=engine,activity=id,repeat=repeat+1,**result));print(a.label,engine,id,round(result['elapsedMs']),flush=True);context.close()
  browser.close()
summary=[]
for engine in ['chromium','webkit']:
 for id in ['ML-F02-1','ML-F03-1','ML-W01-1','ML-X01']:
  subset=[r for r in rows if r['engine']==engine and r['activity']==id]
  summary.append(dict(engine=engine,activity=id,medianMs=statistics.median(r['elapsedMs'] for r in subset),packages=subset[0]['packages']))
record=dict(label=a.label,network='jsDelivr production CDN' if a.remote else 'local production Pyodide assets; fresh HTTP browser cache; warm OS cache',runs=a.runs,rows=rows,medians=summary)
(ROOT/f'docs/ml-learning-startup-{a.label}.json').write_text(json.dumps(record,indent=2)+'\n')
