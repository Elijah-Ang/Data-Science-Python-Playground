"""Observed challenge evidence: populations, ablation, probabilities and plots."""
import json,subprocess,sys,types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
helper=types.ModuleType('ml_helpers');source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
r=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')],cwd=ROOT));ex={c['id']:c['exercise'] for c in r['challenges']}
runtime={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),runtime)
rows=[]
def probe(id,code,expected,label):
 out=runtime['run_learning']({'exercise':ex[id],'code':code})
 good=not out['error'] and all(c['status'] in ('correct','self-review') for c in out['checks'])
 rows.append(dict(id=id,label=label,expected=expected,accepted=good,error=out['error'],checks=out['checks'],code=code,retainedPythonObjects=out['retainedPythonObjects']))
 assert good==expected,(id,label,out['error'],out['checks'])
 assert out['retainedPythonObjects']==0
 print(('Accepted' if good else 'Rejected')+': '+id+' '+label,flush=True)
for id in ('ML-X05','ML-X09','ML-X10','ML-X11','ML-X12','ML-X13','ML-X17','ML-X18','ML-X19'):
 probe(id,ex[id]['solution'],True,'reference')
probe('ML-X05',ex['ML-X05']['solution']+"\nablation_results['test_score'][:]=0.5",False,'fabricated ablation evidence')
probe('ML-X05',ex['ML-X05']['solution'].replace('X_train[measurement_columns],y_train','X_train,y_train'),False,'context retained in ablation')
for id in ('ML-X11','ML-X12','ML-X13'):
 s=ex[id]['solution']
 probe(id,s+"\nprobabilities.iloc[:,:]=1/probabilities.shape[1]",False,'uniform invented probability table')
 probe(id,s+'\nprobabilities.index=probabilities.index[::-1]',False,'probabilities assigned to other rows')
 probe(id,s+'\nprobabilities=probabilities.iloc[:,::-1]',True,'consistent reordered class-labelled columns')
probe('ML-X09',ex['ML-X09']['solution'].replace("categories = ['buying', 'maintenance', 'doors', 'persons', 'luggage_boot', 'safety']","categories = ['buying', 'maintenance', 'doors', 'persons', 'luggage_boot', 'safety', 'acceptability']"),False,'One-R target leakage')
probe('ML-X10',ex['ML-X10']['solution'].replace("numeric = ['sugarpercent', 'pricepercent']","numeric = ['sugarpercent', 'pricepercent', 'winpercent']"),False,'One-R outcome-derived feature')
probe('ML-X17',ex['ML-X17']['solution'].replace('hue=labels,style=labels','hue=labels'),True,'group colour mapping with a common marker')
for id in ('ML-X17','ML-X18','ML-X19'):
 probe(id,ex[id]['solution']+'\nfor axis in fig.axes: axis.set_visible(False)',False,'required figure hidden')
probe('ML-X19',ex['ML-X19']['solution'].replace("X = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]", "X = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]].assign(radius_mean=df['radius_mean']*0)"),False,'substituted measurement values')
probe('ML-X19',ex['ML-X19']['solution'].replace("X = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]", "df['radius_mean']=0\nX = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]"),False,'redefined source population')
output=ROOT/'work/audit/challenge-semantic-evidence.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(rows,indent=2))
print(len(rows),'challenge semantic cases passed.')
