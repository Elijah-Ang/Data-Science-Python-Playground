"""Regenerate deterministic K-Means, Ward and network teaching evidence.

Run with tests/requirements-pyodide-parity.txt (sklearn 1.4.2). The initial page
must not boot Python merely to explain a picture; its controls select these
fitted results while keeping their observations, preparation and seed fixed.
"""
import argparse
import json
import warnings
from pathlib import Path
import numpy as np
from scipy.cluster.hierarchy import linkage, cut_tree
from sklearn.cluster import KMeans
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, f1_score
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parents[1]
result={}
cluster=np.array([[1,1],[1.3,.7],[.7,1.2],[1.2,1.4],[5,1],[5.3,.7],[4.7,1.3],[5.2,1.4],[3,5],[3.4,4.8],[2.6,5.3],[3.1,5.5]])
continuum=np.array([[i,.15*i*i+(.1 if i%2 else -.1)] for i in range(12)])
for key,raw in [('U03',cluster),('U06',continuum)]:
    scaler=StandardScaler().fit(raw);prepared=scaler.transform(raw);fits={}
    for k in [2,3,4]:
        m=KMeans(n_clusters=k,n_init=20,random_state=42).fit(prepared)
        fits[str(k)]=dict(labels=m.labels_.tolist(),centers=m.cluster_centers_.tolist(),inertia=float(m.inertia_),silhouette=float(silhouette_score(prepared,m.labels_)))
    result[key]=dict(rows=raw.tolist(),prepared=prepared.tolist(),mean=scaler.mean_.tolist(),scale=scaler.scale_.tolist(),fits=fits)
ward=np.array([[10,1],[11,1.3],[12,.7],[25,6],[26,6.2],[40,2],[41,2.4],[42,1.7]])
scaler=StandardScaler().fit(ward);fits={}
for key,prepared in [('raw',ward),('scaled',scaler.transform(ward))]:
    z=linkage(prepared,method='ward');fits[key]=dict(prepared=prepared.tolist(),linkage=z.tolist(),cuts={str(k):cut_tree(z,n_clusters=k).ravel().tolist() for k in [2,3,4]})
result['ward']=dict(rows=ward.tolist(),mean=scaler.mean_.tolist(),scale=scaler.scale_.tolist(),fits=fits)
training=np.array([[-1,-1],[-1.2,-.8],[-.8,-1.2],[1,1],[1.2,.8],[.8,1.2],[-1,1],[-1.2,.8],[-.8,1.2],[1,-1],[1.2,-.8],[.8,-1.2]])
y=np.array(['same']*6+['opposite']*6)
validation=np.array([[-.9,-.9],[.9,.9],[-.9,.9],[.9,-.9]]);yv=np.array(['same','same','opposite','opposite'])
scaler=StandardScaler().fit(training);fits={}
for budget in [20,100,300,600]:
    m=MLPClassifier(hidden_layer_sizes=(8,),max_iter=budget,random_state=42)
    with warnings.catch_warnings():warnings.simplefilter('ignore');m.fit(scaler.transform(training),y)
    fits[str(budget)]=dict(loss=m.loss_curve_,iterations=int(m.n_iter_),validationF1=float(f1_score(yv,m.predict(scaler.transform(validation)),average='macro')),predictions=m.predict(scaler.transform(validation)).tolist())
result['network']=dict(training=training.tolist(),labels=y.tolist(),validation=validation.tolist(),validationLabels=yv.tolist(),fits=fits)
path=root/'ml-learning/visuals.js';source=path.read_text();start='  // BEGIN GENERATED TEACHING FITS\n';end='  // END GENERATED TEACHING FITS\n'
block=start+'  const teachingFits='+json.dumps(result,separators=(',',':'))+';\n'+end
if start in source:
    lo=source.index(start);hi=source.index(end,lo)+len(end);updated=source[:lo]+block+source[hi:]
else:updated=source.replace('  const mlExplorerSpecs={',block+'  const mlExplorerSpecs={')
if a.check:
    stored=json.loads(source.split(start+'  const teachingFits=',1)[1].split(';\n'+end,1)[0])
    def compare(actual,expected):
        if isinstance(expected,dict):
            assert set(actual)==set(expected)
            for key in expected:compare(actual[key],expected[key])
        elif isinstance(expected,list):
            assert len(actual)==len(expected)
            for x,y in zip(actual,expected):compare(x,y)
        elif isinstance(expected,(int,float)):np.testing.assert_allclose(actual,expected,rtol=1e-9,atol=1e-10)
        else:assert actual==expected
    compare(stored,result)
else:path.write_text(updated)
print('Validated fitted K-Means assignments/centroids, Ward merges/cuts and network losses/validation for every control state.')
