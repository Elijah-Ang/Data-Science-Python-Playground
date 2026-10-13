"""Real execution and model-specific near misses for complete applications."""
import json
import subprocess
import sys
import time
import types
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
registry=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
runtime={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),runtime)
bridges={c['id']:e for c in registry['cards'] for e in c['exercises'] if e.get('modelBridge')}
start=time.perf_counter();rows=[]
def run(cid,code,accepted,label):
    e=bridges[cid];result=runtime['run_learning']({'exercise':e,'code':code})
    actual=not result['error'] and all(check['status'] in ('correct','self-review') for check in result['checks'])
    assert result['retainedPythonObjects']==0
    assert actual==accepted,(cid,label,result['error'],result['checks'])
    rows.append(dict(exercise=e['id'],case=label,accepted=actual))
for cid,e in bridges.items():run(cid,e['solution'],True,'reference')
mutations={
 'ML-C14': [(lambda code:code.replace('max_depth=3','max_depth=None'),'unrequested tree depth')],
 'ML-C08': [(lambda code:code.replace('n_neighbors=3','n_neighbors=5'),'unrequested neighbour count'),(lambda code:code.replace("('prepare', StandardScaler())","('prepare', 'passthrough')"),'unscaled neighbour geometry')],
 'ML-C18': [(lambda code:code.replace('reg_param=0.1','reg_param=0.0'),'unregularised class covariance')],
 'ML-N04': [(lambda code:code.replace('MLPRegressor(hidden_layer_sizes=(8,), max_iter=500, random_state=42)','DummyRegressor()'),'dummy substituted inside neural target wrapper'),(lambda code:code.replace("('prepare', StandardScaler())","('prepare', 'passthrough')"),'missing input scale'),(lambda code:code.replace('transformer=StandardScaler()','transformer=FunctionTransformer()')+'\n','missing target scale')],
 'ML-R07': [(lambda code:code.replace('degree=2','degree=3'),'unrequested feature degree'),(lambda code:code.replace("('prepare', StandardScaler())","('prepare', 'passthrough')"),'unscaled regularised expansion')],
 'ML-C12': [(lambda code:code.replace("numeric_features=['length', 'width'], categorical_features=[]","numeric_features=[], categorical_features=['length', 'width']"),'continuous measurements recast as categories')],
}
for cid,cases in mutations.items():
    for mutate,label in cases:
        source=bridges[cid]['solution'];code=mutate(source)
        if label=='missing target scale':code='from sklearn.preprocessing import FunctionTransformer\n'+code
        assert source!=code
        run(cid,code,False,label)
report=dict(bridges=len(bridges),cases=rows,elapsedSeconds=round(time.perf_counter()-start,3))
print(json.dumps(report,indent=2))
