"""Every reference answer must work using only its visible, editable setup."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
curriculum = json.loads(subprocess.check_output(['node', '-e', '''
const c=require('./foundations/curriculum.js'),w=require('./foundations/workspace.js');
console.log(JSON.stringify({datasets:c.datasets,rounds:c.lessons.flatMap(l=>l.rounds.map(r=>({...r,code:w.code(c,r,r.solution)})))}));
'''], cwd=ROOT))
namespace = {}
exec((ROOT/'table-serialization.py').read_text()+'\n'+(ROOT/'foundations/runtime.py').read_text(), namespace)
failures = []
def run(round, code, check=True):
    return namespace['run_foundation'](dict(exercise=round,columns=curriculum['datasets'][round['dataset']]['columns'],code=code,check=check,explicitSetup=True))
with tempfile.TemporaryDirectory() as directory:
    previous = os.getcwd()
    try:
        os.chdir(directory)
        for round in curriculum['rounds']:
            response = run(round, round['code'])
            if not response['passed']:
                failures.append((round['id'],response['error'] or response['feedback']))
        assert not failures, failures
        sample = next(r for r in curriculum['rounds'] if r['id']=='I02-1')
        assert 'NameError' in run(sample, 'df.head(2)')['error']
        assert 'NameError' in run(sample, 'pd.DataFrame()')['error']
        changed = 'import pandas as pd\ndf = pd.DataFrame({"edited": [99]})\ndf'
        response = run(sample, changed, False)
        assert not response['error'] and 'edited' in json.dumps(response['outputs'])
        assert run(sample, sample['code'])['passed']
        indexed = next(r for r in curriculum['rounds'] if r['id']=='I09-1')
        assert run(indexed, indexed['code'].replace('df.index = ["A", "B", "C", "D", "E", "F"]',''))['error']
    finally:
        os.chdir(previous)
print(f"All {len(curriculum['rounds'])} solutions passed with visible setup; missing/edited setup and fresh runs verified.")
