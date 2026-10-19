"""Independent native fits for every new clustering, hierarchy and neural state."""
import json
import subprocess
import warnings
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, cut_tree, fcluster
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, f1_score
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
ROOT=Path(__file__).resolve().parents[1]
source="""const fs=require('fs'),vm=require('vm'),c={window:{}};vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),c);const v=c.window.MLLearningVisuals,states=[];for(const id of ['U03','U06','U07','U08','U09','U07-scale','N02','N05'])for(const [choice] of v.explorerSpecs[id].options)states.push({id,choice,...v.exploration(id,choice)});console.log(JSON.stringify({states,fixtures:v.fixtures}));"""
r=json.loads(subprocess.check_output(['node','-e',source],cwd=ROOT));f=r['fixtures']
for state in r['states']:
    id=state['id'];d=state['data']
    if id in ['U03','U06']:
        raw=np.array(d['rows']);prepared=StandardScaler().fit_transform(raw);m=KMeans(n_clusters=d['k'],n_init=d['n_init'],random_state=d['seed']).fit(prepared)
        np.testing.assert_allclose(d['prepared'],prepared);np.testing.assert_allclose(d['centers'],m.cluster_centers_);np.testing.assert_array_equal(d['labels'],m.labels_)
        np.testing.assert_allclose(d['inertia'],np.sum((prepared-np.array(d['centers'])[d['labels']])**2))
        if id=='U03':np.testing.assert_allclose(d['silhouette'],silhouette_score(prepared,d['labels']))
        else:
            assert d['k']==4 and d['n_init']==1 and d['seed']==int(state['choice'])
            assert 'random_state='+state['choice'] in state['code'] and 'n_init=1' in state['code']
        assert 'KMeans' in state['code'] and 'n_clusters='+str(d['k']) in state['code']
    elif id=='U09':
        sample=pd.DataFrame(d['rows']).sample(d['count'],random_state=42)
        assert sample.index.tolist()==d['indices']
        assert 'sample('+str(d['count'])+', random_state=42)' in state['code']
        assert 'cut_tree' not in state['code'] and 'linkage' not in state['code']
    elif id in ['U07','U08','U07-scale']:
        raw=np.array(d['rows']);prepared=StandardScaler().fit_transform(raw) if d['geometry']=='scaled' else raw
        z=linkage(prepared,method='ward');np.testing.assert_allclose(d['linkage'],z);np.testing.assert_allclose(d['prepared'],prepared)
        np.testing.assert_array_equal(d['labels'],cut_tree(z,n_clusters=d['k']).ravel())
        assert len(np.unique(fcluster(z,d['cut'],criterion='distance')))==d['k']
        assert 'linkage(' in state['code'] and "method=\"ward\"" in state['code']
    else:
        raw=np.array(d['training']);scale=StandardScaler().fit(raw)
        m=MLPClassifier(hidden_layer_sizes=(8,),max_iter=d['budget'],random_state=42)
        with warnings.catch_warnings():warnings.simplefilter('ignore');m.fit(scale.transform(raw),d['labels'])
        np.testing.assert_allclose(d['loss'],m.loss_curve_,rtol=1e-10)
        if id=='N02':
            assert d['budget']==300 and d['iteration']==int(state['choice'])
            np.testing.assert_allclose(d['selectedLoss'],m.loss_curve_[d['iteration']-1])
            assert '.fit(' not in state['code'] and 'network.loss_curve_' in state['code']
        else:
            validation=np.array(d['validation'])
            np.testing.assert_allclose(d['validationF1'],f1_score(d['validationLabels'],m.predict(scale.transform(validation)),average='macro'))
            assert 'max_iter='+str(d['budget']) in state['code'] and '.fit(example_X_train)' in state['code']
print(json.dumps({'states':len(r['states']),'families':8,'passed':True,'checks':['native fitted coordinates/centroids','actual Ward heights and horizontal cuts','fixed observation identities','training-only neural scale','real loss curves and held-away macro F1','code/figure settings']},indent=2))
