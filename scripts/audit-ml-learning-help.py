"""Fingerprint reviewed task/help inputs. --record is an explicit editorial sign-off."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
r=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')]))
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
shared={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['ml-learning/fixtures.py','ml-learning/datasets.json','ml-learning/inputs.json']}
entries=[]
for c in r['cards']+r['challenges']:
    for e in c.get('exercises',[c.get('exercise')]):
        inputs={k:v for k,v in e.items() if k not in ('version',)}
        inputs['context']={k:c.get(k) for k in ['title','goal','explanation','syntax','syntaxBreakdown','example','prerequisites','question','inputs','deliverableGroups','policies','planning','explanationSteps']}
        entries.append(dict(id=e['id'],kind=e['kind'],fingerprint=digest(inputs),review='Task/population/output alignment; Think→Tools→Approach fading; runnable solution and step rationale; no answer code in hints.'))
record=dict(version=1,scope='All teaching, retrieval, checkpoint and independent challenge activities',sharedInputs=shared,activities=entries)
p=ROOT/'docs/ml-learning-help-review.json'
if '--record' in sys.argv:p.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
else:assert json.loads(p.read_text())==record,'Task/help inputs changed: review affected activities and explicitly record the editorial audit.'
print(f'{len(entries)} task/help fingerprints verified; {sum(e["kind"]=="python" for e in entries)} runnable Python answers.')
