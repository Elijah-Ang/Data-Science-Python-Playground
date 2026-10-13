"""Compare authored provided-estimator metadata with actual supplied state.

The curriculum builder remains stdlib-only. This parity test executes each
unique setup once, then checks every supplied estimator, including aliases.
"""
import json
import subprocess
import sys
import types
import warnings
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.utils.validation import check_is_fitted
from sklearn.exceptions import NotFittedError

ROOT=Path(__file__).resolve().parents[1]
registry=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
fixtures={};exec((ROOT/'ml-learning/fixtures.py').read_text(),fixtures)
helper=types.ModuleType('ml_helpers')
source=subprocess.check_output(['node','--input-type=module','-e',"import {productionInventory} from './scripts/ml-production.mjs';console.log(productionInventory().ONE_R_HELPER_SOURCE)"],cwd=ROOT,text=True)
exec('import numpy as np\n'+source,helper.__dict__);sys.modules['ml_helpers']=helper
cache={};checked=[]
for exercise in [e for c in registry['cards'] for e in c['exercises'] if e['kind']=='python']+[c['exercise'] for c in registry['challenges']]:
    if not exercise.get('setup'):continue
    key=(exercise['dataset'],exercise['setup'])
    if key not in cache:
        ns={'np':np,'pd':pd,'df':fixtures['learning_fixture'](exercise['dataset'])}
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            exec(exercise['setup'],ns)
        cache[key]=ns
    ns=cache[key]
    for item in exercise['suppliedState']:
        value=ns.get(item['name'])
        if not hasattr(value,'get_params'):continue
        try:
            check_is_fitted(value)
            fitted=True
        except NotFittedError:fitted=False
        except TypeError:continue # Splitters are configurations, not estimators.
        assert item['fitted']==fitted,(exercise['id'],item['name'],item['fitted'],fitted,item['code'])
        if fitted:assert item['training'],(exercise['id'],item['name'],'missing training provenance')
        checked.append((exercise['id'],item['name'],fitted))
print(len(checked),'supplied estimator states agree with native check_is_fitted across',len(cache),'unique setups; fitted aliases preserve training provenance.')
