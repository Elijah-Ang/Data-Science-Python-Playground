"""Rebuild fixture previews with the pinned environment; normal web builds copy them."""
import hashlib
import json
import runpy
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ns=runpy.run_path(str(ROOT/'ml-learning/fixtures.py'))
names=['ENERGY72','SUPPORT120','REPAIR96','SENSOR150','LINE12','LINE24','LINE24B','MIX60','MISSING60','CLASS18','CLASS180','ERROR12','CURVE48','STEP60','RULE24','COV90','COV90_SHARED','CLUSTER36','CLUSTER36B','PCA48','TIME240','breast','penguins','car','candy','candy_class','wine','Wine600','gapminder','seoul']
files={'breast':'data/breast-cancer.csv','penguins':'data/palmer-penguins.csv','car':'data/car-evaluation.csv','candy':'data/candy-power-ranking.csv','candy_class':'data/candy-power-ranking.csv','wine':'data/wine-quality.csv','Wine600':'data/wine-quality.csv','gapminder':'data/gapminder.csv','seoul':'data/seoul-bike.csv'}
registry=json.loads(subprocess.check_output([sys.executable,str(ROOT/'ml-learning/authoring.py')]))
names+=sorted({e['dataset'] for c in registry['cards'] for e in c['exercises'] if e.get('dataset','').endswith('_REVIEW')})
for name in names:
    if name.endswith('_REVIEW') and name.removesuffix('_REVIEW') in files:files[name]=files[name.removesuffix('_REVIEW')]
result={}
for name in names:
    df=ns['learning_fixture'](name)
    count=len(df) if len(df)<=18 else 8
    preview=json.loads(df.head(count).to_json(orient='split',date_format='iso'))
    result[name]={'name':name,'rows':len(df),'columns':list(df.columns),'preview':preview['data'],'index':preview['index'],'file':files.get(name),'dtypes':{c:str(t) for c,t in df.dtypes.items()}}
    if name in files:result[name]['sourceHash']=hashlib.sha256((ROOT/files[name]).read_bytes()).hexdigest()
(ROOT/'ml-learning/datasets.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
