"""Run real learner solutions and graders in the pinned browser Python runtime."""
import argparse
import json
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser()
p.add_argument('--base-url',default='http://127.0.0.1:8000')
p.add_argument('--output',default='docs/curriculum-evidence/runtime-browser.json')
a=p.parse_args()
records,errors=[],[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'))
    page=browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(a.base_url+'/data-foundations.html?runtime=local#inspect/I19S/0')
    page.wait_for_function('!!window.FoundationsCurriculum')
    cases=[('inspect','I19S',0),('wrangle','W19',0),('wrangle','W22',0),
           ('visualise','V01',0),('visualise','V04',1),('visualise','V09',0),
           ('visualise','V13',2),('visualise','V17',0),('visualise','V17',1),
           ('visualise','V17',2),('visualise','V29',1),('visualise','V33',2)]
    for deck,id,index in cases:
        page.evaluate('(r)=>location.hash=`#${r[0]}/${r[1]}/${r[2]}`',[deck,id,index])
        page.wait_for_function('(r)=>LearningRoutes.route("data",location,document.body)===`${r[0]}/${r[1]}/${r[2]}`',arg=[deck,id,index])
        source=page.evaluate('''r=>{
          const ex=FoundationsCurriculum.lessons.find(l=>l.id===r[0]).rounds[r[1]];
          return FoundationWorkspace.code(FoundationsCurriculum,ex,ex.solution);
        }''',[id,index])
        page.locator('#foundationEditor').fill(source)
        page.locator('#checkExercise').click()
        page.wait_for_function('!document.getElementById("checkExercise").disabled',timeout=180000)
        feedback=page.locator('#foundationFeedback')
        assert feedback.get_attribute('data-state')=='pass',(id,index,feedback.inner_text(),page.locator('#foundationOutput').inner_text())
        records.append({'activity':f'{id}-{index+1}','status':'passed','engine':'Chromium / Pyodide 0.26.4'})
        print('PASS',records[-1]['activity'],flush=True)
    page.goto(a.base_url+'/ml-learn.html?runtime=local#foundations/ML-F11/0')
    page.wait_for_function('!!window.MLLearning')
    ml_cases=page.evaluate('''()=>[
      ...MLLearning.curriculum.cards.flatMap(c=>c.exercises.map((e,i)=>({c,e,i})))
        .filter(({c,e})=>e.modelBridge).map(({c,e,i})=>({deck:c.deck,id:c.id,index:i,activity:e.id})),
      ...[['foundations','ML-F11',0],['foundations','ML-F12',0],['classification','ML-C08',0],['classification','ML-C17',2]]
        .map(([deck,id,index])=>({deck,id,index,activity:id+'-'+(index+1)}))
    ]''')
    for case in ml_cases:
        page.evaluate('(r)=>location.hash=`#${r.deck}/${r.id}/${r.index}`',case)
        page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=case['activity'])
        page.locator('#mlEditor').fill(page.evaluate('MLLearning.activity.solution'))
        page.locator('#mlRun').click()
        page.wait_for_function('!document.getElementById("mlRun").disabled',timeout=180000)
        status=page.locator('#mlStatus').inner_text()
        assert status.startswith('Run finished'),(case,status,page.locator('#mlOutput').inner_text())
        page.locator('#mlCheck').click()
        failures=page.locator('#mlResults .needs-attention,#mlResults .unavailable')
        assert not failures.count(),(case,failures.all_inner_texts())
        records.append({'activity':case['activity'],'status':'passed','engine':'Chromium / Pyodide 0.26.4'})
        print('PASS',case['activity'],flush=True)
    browser.close()
assert not errors,errors
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'records':records,'pageErrors':errors},indent=2)+'\n')
print(len(records),'actual browser Python runs and graders passed.')
