"""Verify preserved identifiers, data, homepage and scientific safeguards.

Approved content/grader corrections intentionally differ from the baseline.
The complete execution audit ledgers establish those reviewed semantics; this
check catches accidental ID migrations, data edits and unrelated source drift.
"""
import argparse,json,subprocess,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--output',required=True);a=p.parse_args();base=Path(a.baseline).resolve();root=Path(__file__).resolve().parents[1]
def load(path):return json.loads(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(require(process.argv[1])))',str(path)],text=True))
old=load(base/'foundations/curriculum.js');new=load(root/'foundations/curriculum.js')
assert old['datasets']==new['datasets'],'Foundation teaching input data changed'
assert {d['id'] for d in old['decks']}=={d['id'] for d in new['decks']}
old_lessons={l['id']:l for l in old['lessons']};new_lessons={l['id']:l for l in new['lessons']}
assert old_lessons.keys()==new_lessons.keys()
rounds=0
for key,before in old_lessons.items():
 after=new_lessons[key];assert before['deck']==after['deck'];assert before['review']==after['review']
 assert [r['id'] for r in before['rounds']]==[r['id'] for r in after['rounds']]
 assert [r['dataset'] for r in before['rounds']]==[r['dataset'] for r in after['rounds']]
 rounds+=len(after['rounds'])
old_ch=load(base/'challenges/registry.js');new_ch=load(root/'challenges/registry.js')
assert [c['id'] for c in old_ch['challenges']]==[c['id'] for c in new_ch['challenges']]
old_routes=json.loads(subprocess.check_output(['node',str(base/'tests/generate_ml_routes.mjs')],text=True))['routes']
new_routes=json.loads(subprocess.check_output(['node',str(root/'tests/generate_ml_routes.mjs')],text=True))['routes']
route_count=0
for folds,before_list in old_routes.items():
 after_list=new_routes[folds];assert len(before_list)==len(after_list)
 for before,after in zip(before_list,after_list):
  for field in ['datasetId','scenarioId','modelId','dataset','scenario']:assert before[field]==after[field],(folds,field)
  assert [c['id'] for c in before['cells']]==[c['id'] for c in after['cells']]
  # Actual guided workflow Python and its held-out test boundary remain stable.
  assert [c['code'] for c in before['cells']]==[c['code'] for c in after['cells']],(folds,after['datasetId'],after['modelId'])
  route_count+=1
protected=['index.html','landing.css','landing.js','landing-motion.js','mascot.css','mascot.js','learn.html','learn.css','learn.js','learning-routes.js','data-runtime.py','table-serialization.py','worker-bridge.js','notebook-session.js','statistics/engine.py','statistics/notebook.py','statistics/proportions.py','statistics/recipes.py']
protected=[f for f in protected if (base/f).exists()]
for f in protected:assert (base/f).read_bytes()==(root/f).read_bytes(),f
files=0
for source in (base/'data').rglob('*'):
 if source.is_file():assert source.read_bytes()==(root/source.relative_to(base)).read_bytes(),str(source);files+=1
record={'baseline':str(base),'foundation_cards':len(new_lessons),'foundation_round_ids_and_data_preserved':rounds,'challenge_ids_preserved':len(new_ch['challenges']),'actual_guided_ML_route_code_and_data_preserved':route_count,'protected_files':protected,'unchanged_data_files':files,'scope':'Stable IDs, fixtures, actual guided model Python, homepage, core Data/Stats calculation and existing session policies. Approved content and grading corrections are verified by complete per-unit execution ledgers.'}
Path(a.output).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
