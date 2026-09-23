"""Gate the difficult mechanisms before bulk curriculum authoring."""
import gc
import json
import runpy
import subprocess
import sys
import types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs'; console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
ns={}
exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
activities=runpy.run_path(str(ROOT/'ml-learning/verticals.py'))['ACTIVITIES']
for activity in activities:
    result=ns['run_learning']({'exercise':activity,'code':activity['solution']})
    failures=[c for c in result['checks'] if c['status'] not in ('correct','self-review')]
    assert not result['error'],(activity['id'],result['error'])
    assert not failures,(activity['id'],failures)
    assert result['retainedPythonObjects']==0
    json.dumps(result,allow_nan=False)
    print(activity['id'],'passed',flush=True)
linear=activities[0]
bad=linear['solution'].replace("model = Pipeline", "leaking_scaler = StandardScaler().fit(X[['distance', 'weight']])\nmodel = Pipeline")
result=ns['run_learning']({'exercise':linear,'code':bad})
assert any(c['name']=='Protected final rows' and c['status']=='needs-attention' for c in result['checks'])
from sklearn.linear_model import LinearRegression
original=LinearRegression.fit
for _ in range(12):
    result=ns['run_learning']({'exercise':linear,'code':linear['solution']})
    assert LinearRegression.fit is original
    assert result['retainedPythonObjects']==0
    del result
gc.collect()
print('Leakage negative and repeated-run cleanup passed.')
