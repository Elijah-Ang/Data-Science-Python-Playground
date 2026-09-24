"""Real Pyodide vertical gate and, once authored, complete registry execution."""
import argparse
import json
import runpy
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8127')
parser.add_argument('--engine',default='chromium',choices=['chromium','webkit'])
parser.add_argument('--all-solutions',action='store_true')
parser.add_argument('--runtime',default='source-local',choices=['source-local','local','remote'])
parser.add_argument('--start-at',help='Resume a local audit at an activity ID; CI always runs the full list.')
args=parser.parse_args()
activities=runpy.run_path(str(ROOT/'ml-learning/verticals.py'))['ACTIVITIES']
if args.all_solutions:
    registry=json.loads(subprocess.check_output(['python3',str(ROOT/'ml-learning/authoring.py')],cwd=ROOT))
    activities=[e for c in registry['cards'] for e in c['exercises'] if e['kind']=='python']+[c['exercise'] for c in registry['challenges']]
if args.start_at:
    activities=activities[next(i for i,e in enumerate(activities) if e['id']==args.start_at):]
one_r=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log('import numpy as np\\n'+productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
index_url='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' if args.runtime=='remote' else args.base_url+('/vendor/pyodide/' if args.runtime=='source-local' else '/pyodide/')
config=dict(indexURL=index_url,oneR=one_r,source=(ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text())
files={str(p.relative_to(ROOT)):p.read_text() for p in (ROOT/'data').rglob('*.csv')}
with sync_playwright() as p:
    browser=getattr(p,args.engine).launch()
    page=browser.new_page()
    page.goto(args.base_url+'/learn.html')
    page.add_script_tag(url=args.base_url+'/worker-bridge.js')
    page.evaluate("""async config=>{
      window.learningGateConfig=config;
      window.learningGateBridge=createPythonBridge(await(await fetch('ml-learning/worker.js')).text());
    }""",config)
    for i,exercise in enumerate(activities):
        result=page.evaluate("""async ({exercise,files})=>{
          const response=await learningGateBridge.send('run',{config:learningGateConfig,files,request:{exercise,code:exercise.solution}});
          const r=response.result;
          return {id:r.exerciseId,error:r.error,failed:r.checks.filter(c=>!['correct','self-review'].includes(c.status)),retained:r.retainedPythonObjects,bytes:JSON.stringify(r).length};
        }""",dict(exercise=exercise,files=files if i==0 else {}))
        assert not result['error'],result
        assert not result['failed'],result
        assert result['retained']==0,result
        if i==0 and exercise['id']=='ML-F02-1':
            packages=page.evaluate('async()=> (await learningGateBridge.send("init",{config:learningGateConfig})).packages')
            assert 'numpy' in packages and 'pandas' in packages and 'scikit-learn' not in packages and 'matplotlib' not in packages,packages
        print(args.engine,exercise['id'],'passed',result['bytes'],'serialized bytes',flush=True)
    # Exercise meaningful negatives and equivalent answers in the actual WASM runtime.
    by_id={e['id']:e for e in activities}
    linear=by_id.get('ML-W-K1-1')
    pca=by_id.get('ML-X19')
    alternatives=[]
    if linear:
        code=linear['solution']
        alternatives+=[
          (linear,code.replace('model = Pipeline',"leaking=StandardScaler().fit(X[['distance','weight']])\nmodel = Pipeline"),False,'leakage'),
          (linear,code.replace('random_state=42)\ncv_results','random_state=43)\ncv_results'),False,'mismatched folds'),
          (linear,code.replace('final_rmse = root_mean_squared_error(y_test, final_predictions)','final_rmse = np.sqrt(np.mean((y_test-final_predictions)**2))'),True,'equivalent RMSE'),
        ]
        alternatives += [
          (linear,code+"\nother=clone(model).fit(X_train,y_train)\nfinal_predictions=other.predict(X_test)",False,'fit another candidate after final exposure'),
          (linear,code+"\nextra=StandardScaler().fit_transform(X_train[['distance','weight']])\nfinal_predictions=final_model.predict(X_test)",False,'prepare after final exposure'),
          (linear,code+"\nother=clone(model)\nother.set_params(model__fit_intercept=False)\nfinal_predictions=final_model.predict(X_test)",False,'change parameters after final exposure'),
          (linear,code+"\nmodel=clone(model)\nfinal_predictions=final_model.predict(X_test)",False,'replace candidate after final exposure'),
          (linear,code.replace('final_predictions = final_model.predict(X_test)',"other=clone(model).fit(X_train,y_train)\nfinal_predictions = final_model.predict(X_test)")+"\nfinal_predictions=other.predict(X_test)",False,'switch fitted candidate after exposure'),
          (linear,code+"\nextra_search=GridSearchCV(model,{'model__fit_intercept':[True,False]},cv=folds,scoring='neg_root_mean_squared_error').fit(X_train,y_train)\nfinal_predictions=final_model.predict(X_test)",False,'new search after final exposure'),
          (linear,code+"\nextra_mae=float(np.abs(y_test-final_predictions).mean())\nreport=pd.DataFrame({'actual':y_test,'predicted':final_predictions})\nreport.to_csv('final-report.csv',index=False)",True,'report saved final predictions'),
        ]
    readiness=by_id.get('ML-W-K2-1')
    if readiness:
        code=readiness['solution']
        alternatives += [
          (readiness,code.replace("['jobs_waiting', 'device_age_years']", "['jobs_waiting', 'invoice_labor_hours']"),False,'readiness post-outcome feature'),
          (readiness,code.replace('cv_results = {', 'from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(X_train)\ncv_results = {'),False,'readiness preprocessing outside folds'),
          (readiness,code.replace("print('Reference validation:'", "reference_results['test_score'][:] = 0\nprint('Reference validation:'"),False,'readiness invented reference scores'),
          (readiness,code.replace('final_predictions = final_model.predict(X_test)', 'probe = final_model.predict(X_test)\nchosen_name = "simple"\nfinal_predictions = final_model.predict(X_test)'),False,'readiness final-test selection'),
          (readiness,code.replace("['jobs_waiting', 'device_age_years']", "['jobs_waiting']").replace('random_state=42','random_state=91').replace('test_size=.2','test_size=.25').replace('from sklearn.linear_model import LinearRegression','from sklearn.linear_model import LinearRegression, Ridge').replace('LinearRegression()','Ridge(alpha=1)'),True,'readiness legitimate alternative choices'),
        ]
    if pca:
        alternatives+=[
          (pca,pca['solution']+"\nweights.iloc[:,0]*=-1\nscores2[:,0]*=-1",True,'paired PCA sign'),
          (pca,pca['solution']+"\nweights.iloc[:,0]*=-1",False,'unpaired PCA sign'),
          (pca,pca['solution']+"\nweights.iloc[:,:]=np.eye(X.shape[1])[:,:2]\nscores2=scaled@weights.values",False,'incorrect PCA axes'),
        ]
    for exercise,code,expected,label in alternatives:
        result=page.evaluate("""async ({exercise,code})=>{
          const response=await learningGateBridge.send('run',{config:learningGateConfig,request:{exercise,code}});
          const r=response.result;return {error:r.error,checks:r.checks,passed:!r.error&&r.checks.every(c=>['correct','self-review'].includes(c.status)),retained:r.retainedPythonObjects};
        }""",dict(exercise=exercise,code=code))
        assert not result['error'],(label,result)
        if 'after' in label and not expected:
            assert next(c for c in result['checks'] if c['name']=='Final-test discipline')['status']=='needs-attention',result
        assert result['passed']==expected and result['retained']==0,(label,result)
        print(args.engine,label,'accepted' if expected else 'rejected',flush=True)
    if args.all_solutions:
        simple=next(e for c in registry['cards'] for e in c['exercises'] if e['id']=='ML-F02-1')
        extra=page.evaluate("""async exercise=>{
          const bridge=createPythonBridge(await(await fetch('ml-learning/worker.js')).text());
          const code=exercise.solution+'\\nfrom sklearn.linear_model import LinearRegression\\nimport matplotlib.pyplot as plt\\nfig,ax=plt.subplots(); ax.plot([0,1],[0,1]); ax.set(xlabel="x",ylabel="y")';
          const response=await bridge.send('run',{config:learningGateConfig,request:{exercise,code}});
          const loaded=await bridge.send('init',{config:learningGateConfig});
          return {error:response.result.error,figures:response.result.figures.length,packages:loaded.packages};
        }""",simple)
        assert not extra['error'] and extra['figures']==1 and 'scikit-learn' in extra['packages'] and 'matplotlib' in extra['packages'],extra
        print(args.engine,'learner imports extend activity packages',flush=True)
    # Repeated runs must not accumulate live Python references; only a bounded
    # worker allocator high-water mark is expected, not a shrinking WASM heap.
    repeats=page.evaluate("""async exercise=>{
      let last;
      for(let i=0;i<12;i++){
        const r=await learningGateBridge.send('run',{config:learningGateConfig,request:{exercise,code:exercise.solution}});
        if(r.result.retainedPythonObjects!==0||r.result.error)throw Error('Retained model or execution error');
        last=r.result.id;
      }
      return last;
    }""",activities[0])
    assert repeats
    browser.close()
print(args.engine,len(activities),'solutions and repeated-run cleanup passed.')
