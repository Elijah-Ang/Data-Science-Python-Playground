"""Execute every authored Python activity, with semantic negative/alternative cases."""
import json
import subprocess
import sys
import types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
registry=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')],cwd=ROOT))
ns={}
exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),ns)
activities=[e for c in registry['cards'] for e in c['exercises'] if e['kind']=='python']+[c['exercise'] for c in registry['challenges']]
failures=[]
for i,exercise in enumerate(activities):
    result=ns['run_learning']({'exercise':exercise,'code':exercise['solution']})
    failed=[c for c in result['checks'] if c['status'] not in ('correct','self-review')]
    if result['error'] or failed or result['retainedPythonObjects']:
        failures.append(dict(id=exercise['id'],error=result['error'],failed=failed,retained=result['retainedPythonObjects']))
        print('FAIL',exercise['id'],json.dumps(failures[-1]),flush=True)
    else:print('PASS',exercise['id'],flush=True)
assert not failures,json.dumps(failures,indent=2)
print(len(activities),'Python activities passed; other exercises are accessible decisions/self-review.')
