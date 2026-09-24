"""New workflow acceptance, boundary failures and honest self-review coverage."""
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
r=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
ns={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
activities={e['id']:e for c in r['cards'] for e in c['exercises'] if e.get('assessment')}
def run(id,code):
 out=ns['run_learning']({'exercise':activities[id],'code':code})
 assert out['retainedPythonObjects']==0
 return out
def good(id,code,label):
 out=run(id,code)
 assert not out['error'],(label,out['error'])
 assert all(c['status'] in ('correct','self-review') for c in out['checks']),(label,out['checks'])
 assert out['checks'][-1]['status']=='self-review'
 print('Accepted:',label,flush=True)
def bad(id,code,criterion,label):
 out=run(id,code)
 assert not out['error'],(label,out['error'])
 c=next(c for c in out['checks'] if c['name']==criterion)
 assert c['status']=='needs-attention',(label,c)
 print('Rejected:',label,flush=True)
for id,e in activities.items():good(id,e['solution'],id+' reference')
id='ML-C10-4';code=activities[id]['solution']
bad(id,code.replace('from sklearn.svm import SVC','from sklearn.linear_model import LogisticRegression').replace("SVC(kernel='rbf', C=1, gamma='scale')",'LogisticRegression(max_iter=1000)'),'Model in the full workflow','a different classifier substituted in the SVC bridge')
id='ML-W-K2-1';code=activities[id]['solution']
good(id,code.replace("['jobs_waiting', 'device_age_years']","['jobs_waiting']").replace('random_state=42','random_state=91').replace('test_size=.2','test_size=.25').replace('n_splits=3','n_splits=4').replace('from sklearn.linear_model import LinearRegression','from sklearn.linear_model import LinearRegression, Ridge').replace('LinearRegression()','Ridge(alpha=1)'), 'different legitimate feature subset, seed, holdout size, folds and model')
good(id,code.replace('import mean_squared_error','import mean_squared_error, mean_absolute_error').replace("'neg_root_mean_squared_error'","'neg_mean_absolute_error'").replace('np.sqrt(mean_squared_error(y_test, final_predictions))','mean_absolute_error(y_test, final_predictions)'), 'MAE instead of RMSE')
bad(id,code.replace("['jobs_waiting', 'device_age_years']","['jobs_waiting', 'invoice_labor_hours']"),'Question and available inputs','post-outcome predictor')
bad(id,code.replace("['jobs_waiting', 'device_age_years']","['jobs_waiting', 'repair_hours']"),'Question and available inputs','target included in X')
bad(id,code.replace('reference = DummyRegressor', 'from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(X)\nreference = DummyRegressor'),'Leakage prevention','preparation fitted to all rows')
bad(id,code.replace('reference = DummyRegressor', 'from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(X_train)\nreference = DummyRegressor'),'Leakage prevention','preparation fitted before training CV')
bad(id,code.replace('cv_results = {', 'from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler().fit(X_train)\ncv_results = {'),'Leakage prevention','preparation fitted after baseline CV but before candidate CV')
bad(id,code.replace("print('Reference validation:'", "reference_results['test_score'][:] = 0\nprint('Reference validation:'"),'Observed dummy reference','fabricated dummy scores')
bad(id,code.replace("print('Candidate validation:'", "cv_results['simple']['test_score'][:] = 0\nprint('Candidate validation:'"),'Observed candidate comparison','fabricated candidate scores')
bad(id,code.replace('final_predictions = final_model.predict(X_test)', 'leaked = final_model.predict(X_test)\nchosen_name = "simple"\nfinal_predictions = final_model.predict(X_test)'),'Final-test discipline','test-driven choice and repeated exposure')
bad(id,code+'\nextra = cross_validate(candidates[chosen_name], X_train, y_train, cv=folds, scoring=metric)\n','Final-test discipline','CV after final exposure')
bad(id,code.replace('final_score = np.sqrt', 'final_predictions = final_predictions + 1\nfinal_score = np.sqrt'),'Final-test discipline','changed final predictions with recomputed metric')
bad(id,code.replace("print(pd.DataFrame", "diagnostic_predictions = diagnostic_predictions + 1\nprint(pd.DataFrame"),'Training-only diagnosis','fabricated diagnostic predictions')
good(id,code+'\nfrom sklearn.metrics import mean_absolute_error\nadditional_mae = mean_absolute_error(y_test, final_predictions)\n','additional metric from same saved final predictions')
id='ML-W-K3-1';code=activities[id]['solution']
good(id,code.replace('import f1_score','import f1_score, balanced_accuracy_score').replace("'f1_macro'","'balanced_accuracy'").replace('f1_score(y_test, final_predictions, average="macro")','balanced_accuracy_score(y_test, final_predictions)').replace('random_state=42','random_state=13'), 'balanced accuracy with another stratified split')
bad(id,code.replace("'f1_macro'","'accuracy'"),'Metric choice','raw accuracy used as sole imbalance criterion')
bad(id,code.replace("['vibration_mm_s', 'temperature_c']","['vibration_mm_s', 'replacement_authorized']"),'Question and available inputs','later replacement decision in classifier')
# Genuine novel scenarios; faded editors; no automatic prose score.
assert {activities[id]['dataset'] for id in ['ML-W-K2-1','ML-W-K3-1']}=={'REPAIR96','SENSOR150'}
for card in [c for c in r['cards'] if c['id'] in ('ML-F11','ML-F12')]:
 a,b,c=card['exercises']
 assert a['starter']==a['solution'] and b['starter'].count('...')>=7
 assert c['support']=='guided' and c['starter'].count('...')>=10 and "candidates = {'simple'" not in c['starter']
 assert all(f'# {step}.' in c['starter'] for step in range(1,9))
 assert a['workflowSteps']==b['workflowSteps']==c['workflowSteps']
for id in ('ML-U07-4','ML-P02-4'):
 e=next(e for c in r['cards'] for e in c['exercises'] if e['id']==id)
 result=ns['run_learning']({'exercise':e,'code':e['solution']})
 assert not result['error'],(id,result['error'])
 assert all(c['status']=='correct' for c in result['checks']),(id,result['checks'])
 print('Accepted:',id,'reference',flush=True)
 wrong=e['solution'].replace('scaled_sample = scaler.fit_transform(sample)','scaled_sample = sample.to_numpy()') if id=='ML-U07-4' else e['solution'].replace('pca.components_[:2].T, index=', 'pca.components_[:2].T * 0, index=')
 assert wrong!=e['solution'],id
 result=ns['run_learning']({'exercise':e,'code':wrong})
 assert not result['error'],(id,result['error'])
 assert any(c['status']=='needs-attention' for c in result['checks']),(id,result['checks'])
 print('Rejected:',id,'invalid fitted evidence',flush=True)
assert not any(check.get('message','').startswith('Inspect the task, output values') for c in r['cards'] for e in c['exercises'] for check in e.get('checks',[]))
print('Guided bridges, faded workflows, boundary failures, alternatives and self-review contracts passed.')
