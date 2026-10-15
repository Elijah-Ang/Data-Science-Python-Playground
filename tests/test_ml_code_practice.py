"""Execute every replacement and reject missing or fabricated output evidence."""
import json
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
registry=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
activities=[e for card in registry['cards'] for e in card['exercises']]
assert len(activities)==338 and all(e['kind']=='python' for e in activities)
for card in registry['cards']:
    assert len({e['solution'] for e in card['exercises']})==len(card['exercises']),card['id']+' repeats a computation instead of extending practice'
replacements=[e for e in activities if e.get('replacement')]
assert len(replacements)==112
namespace={}
exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+(ROOT/'ml-learning/runtime.py').read_text(),namespace)
results=[]
for e in replacements:
    good=namespace['run_learning']({'exercise':e,'code':e['solution']})
    assert not good['error'],(e['id'],good['error'])
    assert all(c['status']=='correct' for c in good['checks']),(e['id'],good['checks'])
    assert good['retainedPythonObjects']==0
    if e['id']=='ML-W04-3':
        alternative=namespace['run_learning']({'exercise':e,'code':e['solution'].replace("pd.get_dummies(df['service'])","pd.get_dummies(df['service'],dtype=int)[['standard','express','economy']]")})
        assert not alternative['error'] and all(c['status']=='correct' for c in alternative['checks']),'equivalent labelled integer encoding rejected'
    if e['id'] in ('ML-U04-4','ML-U-R1-2'):
        alternative=namespace['run_learning']({'exercise':e,'code':e['solution'].replace('selected_k = 3','selected_k = 2')})
        assert not alternative['error'] and all(c['status']=='correct' for c in alternative['checks']),(e['id'],'valid alternative k rejected')
    if e['id'] in ('ML-P01-2','ML-P01-3'):
        for change in ['\npca.fit(df)\n','\nanswer[0,0] *= -1\n']:
            invalid=namespace['run_learning']({'exercise':e,'code':e['solution']+change})
            assert any(c['status']!='correct' for c in invalid['checks']),(e['id'],'refit or inconsistent score sign accepted')
    # Check the result, not source spelling: valid solutions plus a fabricated
    # primary output must fail even if the rest of the computation was executed.
    for name in e['outputs']:
        bad=namespace['run_learning']({'exercise':e,'code':e['solution']+'\n'+name+' = None\n'})
        assert any(c['status']!='correct' for c in bad['checks']),(e['id'],name,'fabricated evidence accepted')
    results.append(dict(id=e['id'],previousKind=e['replacement']['previousKind'],referencePassed=True,fabricatedRejected=True))
print(json.dumps(dict(activities=len(activities),replacements=len(replacements),results=results),indent=2))
