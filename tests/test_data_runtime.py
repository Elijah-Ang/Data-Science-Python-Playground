"""Data result identity, recovery, schema and declared-scope regression tests."""
import json, subprocess, warnings
from pathlib import Path
Path("tests/evidence").mkdir(parents=True, exist_ok=True)
subprocess.run(['node','tests/extract_data_tasks.mjs'],check=True)
payload=json.loads(Path('/tmp/dspp-data-tasks.json').read_text())
ns={}; exec(payload['setup'],ns)
csv='name,group,value\na,x,1\nb,x,2\nc,y,3\n'
ns['initialize'](csv,',')
for code, labels in [('df.describe().T',['value']),('df.dtypes',['name','group','value']),('df.isna().sum()',['name','group','value']),('df["group"].value_counts()',['x','y']),('df.groupby(["group","name"]).size()',['x','a'])]:
 out=ns['execute_cell'](code); assert out['status']=='ok',out
 flat=str(out['table']['rows']); assert all(label in flat for label in labels),(code,out)
for alias in ['pd','np','plt','df','original_df']:
 ns['execute_cell'](f'{alias} = None\nsaved_marker = 123')
 ns['reset_frame'](); out=ns['execute_cell']('df.head()')
 assert out['status']=='ok' and out['state']['rows']==3
 assert 'saved_marker' not in ns['user_namespace']
ns['execute_cell']('df = df.head(2).copy()\ndf["new"] = "yes"')
out=ns['profile_payload'](); assert out['state']['changed'] and out['state']['rows']==2 and out['dtypes']['new'] in ['str','object']
ns['initialize'](csv,','); out=ns['execute_cell']('display(df.head(1)); display(df.tail(1))\nfig, ax = plt.subplots(); ax.set_title("First")\nfig2, ax2 = plt.subplots(); ax2.set_title("Second")')
assert len(out['events'])>=2 and len(out['charts'])==2,out
out=ns['execute_cell']('print("a"*100000)'); assert len(out['stdout'])<20100 and 'truncated' in out['stdout']
results=[]
for dataset, data in payload['datasets'].items():
 for mode in ['fresh','after_route']:
  for task in data['tasks']:
   ns['initialize'](Path(data['config']['file']).read_text(),data['config']['sep'])
   # Sequential tasks require their declared upstream route; optional tasks are independent.
   required=data['tasks'][:6] if mode=='after_route' else [item for item in data['tasks'] if item['id'] in task['prerequisites']]
   for route in required: assert ns['execute_cell'](route['code'])['status']=='ok',route['id']
   with warnings.catch_warnings():
    warnings.simplefilter('ignore'); out=ns['execute_cell'](task['code'])
   assert out['status']=='ok',(dataset,mode,task['id'],out.get('error'))
   if task['optional']:
    view=ns['user_namespace']['view']; assert len(ns['user_namespace']['original_df'])==len(ns['original_df'])
   results.append([dataset,mode,task['id'],'passed'])
Path('tests/evidence/data-runtime.json').write_text(json.dumps(results,indent=2))
print(f'Data: {len(results)} task scenarios plus index, alias reset, schema, display and stream regressions passed.')
