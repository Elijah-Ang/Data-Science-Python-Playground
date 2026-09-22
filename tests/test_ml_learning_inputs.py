"""The downloadable challenge input is exactly the population shown in the brief."""
import hashlib,io,json,subprocess,sys
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,'scripts/ml-learning-inputs.py','--check'],cwd=ROOT,check=True)
r=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
inputs=json.loads((ROOT/'ml-learning/inputs.json').read_text())
assert set(inputs)=={c['id'] for c in r['challenges']}
for c in r['challenges']:
 m=inputs[c['id']];raw=(ROOT/m['file']).read_bytes();df=pd.read_csv(io.BytesIO(raw),sep=m['delimiter'])
 assert hashlib.sha256(raw).hexdigest()==m['sha256']
 assert len(df)==m['rows'] and list(df)==m['columns']
 assert {c:str(t) for c,t in df.dtypes.items()}==m['dtypes']
 assert json.loads(df.head(8).to_json(orient='split'))['data']==m['preview']
 assert c['inputs'][0]['preview']==m['preview'] and c['inputs'][0]['rows']==len(df)
 assert c['exercise']['inputFile']==m['file'] and repr(m['file']) in c['reference']
 if m['target']:assert m['target'] in df and not df[m['target']].isna().any()
 if c['id'] in ['ML-X17','ML-X18','ML-X19']:assert not {'species','diagnosis','target','label'}&set(df)
 print(c['id'],len(df),'rows;',len(df.columns),'columns;',m['sha256'][:12])
assert inputs['ML-X15']['rows']==600
assert pd.read_csv(ROOT/inputs['ML-X15']['file']).duplicated().sum()==0
assert set(pd.read_csv(ROOT/inputs['ML-X01']['file']).year)=={2007}
candy=pd.read_csv(ROOT/inputs['ML-X10']['file'])
assert ((candy.winpercent>=50)==candy.popular.eq('50% or above')).all()
assert 'winpercent' not in inputs['ML-X12']['columns']
assert inputs['ML-X18']['rows']==569 and len(inputs['ML-X18']['columns'])==5
assert len(inputs['ML-X19']['columns'])==30
print('All 19 exact prepared population/schema/preview/target contracts passed.')
