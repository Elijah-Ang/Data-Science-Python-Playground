"""Bounded visual-evidence semantics for required ML plots."""
import argparse,json,subprocess,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);args=parser.parse_args()
r=json.loads(subprocess.check_output([sys.executable,'ml-learning/authoring.py'],cwd=ROOT))
units={e['id']:e for c in r['cards'] for e in c['exercises']}
source=(ROOT/'ml-learning/runtime.py').read_text();n={};exec((ROOT/'ml-learning/fixtures.py').read_text()+'\n'+source,n)
rows=[]
def check(id,name,code,expected):
 e=units[id];result=n['run_learning']({'exercise':e,'code':code})
 actual=not result['error'] and not result['retainedPythonObjects'] and all(c['status'] in ('correct','self-review') for c in result['checks'])
 row=dict(id=id,case=name,expected=expected,accepted=actual,passed=actual==expected,checks=result['checks'],error=result['error']);rows.append(row)
 print(id,name,'passed' if row['passed'] else 'FAILED',flush=True)
for id in ('ML-W01-1','ML-P03-2','ML-R09-1','ML-U07-2'):
 code=units[id]['solution']
 check(id,'reference',code,True)
 check(id,'faint visible opacity',code+'\nfor axis in plt.gcf().axes:\n for artist in list(axis.collections)+list(axis.patches)+list(axis.texts): artist.set_alpha(.15)\n',True)
 check(id,'hidden required figure',code+'\nplt.gcf().set_visible(False)\n',False)
 check(id,'hidden required axes',code+'\nfor axis in plt.gcf().axes: axis.set_visible(False)\n',False)
 check(id,'zero alpha required glyphs',code+'\nfor axis in plt.gcf().axes:\n for artist in list(axis.collections)+list(axis.patches)+list(axis.texts): artist.set_alpha(0)\n',False)
 check(id,'changed data bounds',code+'\nfor axis in plt.gcf().axes: axis.set_xlim(10000,20000)\n',id=='ML-R09-1')
 if id!='ML-R09-1':check(id,'hidden required labels',code+'\nfor axis in plt.gcf().axes:\n axis.xaxis.label.set_visible(False)\n axis.yaxis.label.set_visible(False)\n',False)
 if id=='ML-W01-1':
  check(id,'valid Matplotlib alternative',code.replace('sns.scatterplot(x=X_train.distance,y=y_train,ax=ax)','ax.scatter(X_train.distance,y_train,s=24,c="purple")'),True)
  for name,suffix in [('all zero marker sizes','collection.set_sizes(np.zeros(len(collection.get_offsets())))'),('one zero marker size','sizes=np.full(len(collection.get_offsets()),24.);sizes[0]=0;collection.set_sizes(sizes)'),('one invisible face and edge','colors=np.tile([.3,.2,.7,1.],(len(collection.get_offsets()),1));colors[0,3]=0;collection.set_facecolors(colors);collection.set_edgecolors(colors)')]:
   check(id,name,code+'\nfor axis in plt.gcf().axes:\n for collection in axis.collections:\n  '+suffix+'\n',False)
 if id=='ML-P03-2':check(id,'valid Matplotlib bars',code.replace('sns.barplot(x=np.arange(1,len(answer)+1),y=answer,ax=ax)','ax.bar(np.arange(1,len(answer)+1),answer,color="purple")'),True)
 if id=='ML-U07-2':check(id,'horizontal labelled dendrogram',code.replace("p=10,ax=ax)","p=10,orientation='right',ax=ax)").replace("xlabel='Merged observations/groups',ylabel='Ward merge distance'","xlabel='Ward merge distance',ylabel='Merged observations/groups'"),True)
# Heatmaps use the same public helper for either Matplotlib images or Seaborn.
import numpy as np,matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt,seaborn as sns
matrix=np.array([[4,1],[2,3]])
for api in ('Matplotlib','Seaborn'):
 for case in ('reference','hidden figure','hidden axes','zero alpha','cropped','hidden labels'):
  plt.close('all');fig,axis=plt.subplots()
  if api=='Matplotlib':axis.imshow(matrix)
  else:sns.heatmap(matrix,annot=True,ax=axis)
  axis.set(xlabel='Predicted class',ylabel='Actual class');fig.tight_layout()
  if case=='hidden figure':fig.set_visible(False)
  if case=='hidden axes':axis.set_visible(False)
  if case=='zero alpha':
   for artist in list(axis.images)+list(axis.collections):artist.set_alpha(0)
  if case=='cropped':axis.set_xlim(10000,20000)
  if case=='hidden labels':axis.xaxis.label.set_visible(False)
  actual=n['_heatmap_matches'](matrix);expected=case=='reference'
  rows.append(dict(id='heatmap-helper',case=api+' '+case,expected=expected,accepted=actual,passed=actual==expected))
plt.close('all')
result=dict(runtime_sha256=hashlib.sha256(source.encode()).hexdigest(),cases=len(rows),failed=sum(not row['passed'] for row in rows),rows=rows)
if args.output:args.output.write_text(json.dumps(result,indent=2))
print(json.dumps({'cases':result['cases'],'failed':result['failed']}))
assert not result['failed']
