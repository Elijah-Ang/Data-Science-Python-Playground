"""Run replacements and high-risk fitted-state workflows in production Pyodide."""
import argparse,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8015');p.add_argument('--ids',default='');p.add_argument('--output',default='docs/curriculum-evidence/review-refinement/python-browser.json');a=p.parse_args()
records=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'));page=b.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(a.base_url+'/ml-learn.html?runtime=local');page.wait_for_function('!!window.MLLearning')
 cases=page.evaluate("MLLearning.curriculum.cards.flatMap(c=>c.exercises.map((e,i)=>({deck:c.deck,lesson:c.id,index:i,id:e.id,replacement:!!e.replacement,selected:!!e.modelBridge||['ML-N02-1','ML-N03-1','ML-N03-2','ML-N05-1','ML-N-K2-1','ML-F11-1','ML-F12-1'].includes(e.id)}))).filter(e=>e.replacement||e.selected)")
 if a.ids:cases=[c for c in cases if c['id'] in a.ids.split(',')]
 for case in cases:
  page.evaluate('(c)=>location.hash=`#${c.deck}/${c.lesson}/${c.index}`',case);page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=case['id'])
  page.locator('#mlEditor').fill(page.evaluate('MLLearning.activity.solution'));page.locator('#mlRun').click();page.wait_for_function('!document.getElementById("mlRun").disabled',timeout=180000)
  assert page.locator('#mlStatus').inner_text().startswith('Run finished'),(case,page.locator('#mlOutput').inner_text())
  page.locator('#mlCheck').click();failures=page.locator('#mlResults .needs-attention,#mlResults .unavailable');assert not failures.count(),(case,failures.all_inner_texts())
  assert page.evaluate('MLLearning.retainedReceipts')==1
  records.append(dict(id=case['id'],replacement=case['replacement'],passed=True));print('PASS',case['id'],flush=True)
 b.close()
assert not errors,errors
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'runtime':'Pyodide 0.26.4 / sklearn 1.4.2','records':records,'pageErrors':errors},separators=(',',':'))+'\n')
print(len(records),'production-browser Python solutions and graders passed.')
