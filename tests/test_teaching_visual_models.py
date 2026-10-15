"""Check the computed teaching examples against fitted scikit-learn operations."""
import json
import subprocess
from pathlib import Path
import numpy as np
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

ROOT = Path(__file__).resolve().parents[1]
script = '''const fs=require('fs'),vm=require('vm'),context={window:{}};
vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),context);
const v=context.window.MLLearningVisuals;
console.log(JSON.stringify({rows:v.exampleRows,
  knn:['1','3','5'].map(n=>v.exploration('C08',n).data).concat([v.exploration('C09','9').data]),
  trees:v.exampleRows.tree.map(r=>v.exploration('C14',r.id).data),
  regression:v.exampleRows.regression.map(r=>v.exploration('R09',r.id).data),
  svm:['0.05','0.2','1'].map(n=>v.exploration('C10',n,{kernel:'linear'}).data),
  polynomial:['1','2','3','4'].map(n=>v.exploration('R08',n).data),
  rbf:[v.exploration('C10','1').data].concat(['0.5','2','10'].map(n=>v.exploration('C11',n).data)).concat(['0.1','1','10'].map(n=>v.exploration('C11-gamma',n).data)),
  complexity:['3','5','None'].map(n=>v.exploration('R10',n).data).concat(['1','5','10'].map(n=>v.exploration('R10-leaf',n).data)),
  pca:v.exploration('P01','p1').data}));'''
examples = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))

scaling = examples['rows']['scaling']
scaler = StandardScaler().fit(scaling['rows'])
np.testing.assert_allclose(scaling['mean'], scaler.mean_)
np.testing.assert_allclose(scaling['scale'], scaler.scale_)
np.testing.assert_allclose(scaling['prepared'], scaler.transform(scaling['rows']))
residual_line = examples['rows']['residualLine']
line_rows = np.array(residual_line['rows'])
line_model = LinearRegression().fit(line_rows[:, :1], line_rows[:, 1])
np.testing.assert_allclose(residual_line['coefficients'], [line_model.intercept_, line_model.coef_[0]])

rows = examples['rows']['knn']
X = np.array([[r['x'], r['y']] for r in rows])
y = [r['group'] for r in rows]
for example in examples['knn']:
    prepared = StandardScaler().fit(X)
    model = KNeighborsClassifier(n_neighbors=example['k']).fit(prepared.transform(X), y)
    assert model.predict(prepared.transform([[0, 0]]))[0] == example['prediction']
    distances, indices = model.kneighbors(prepared.transform([[0, 0]]))
    assert [rows[i]['id'] for i in indices[0]] == [r['id'] for r in example['neighbours']]
    np.testing.assert_allclose(distances[0], [r['distance'] for r in example['neighbours']])

rows = examples['rows']['tree']
model = DecisionTreeClassifier(max_depth=2, random_state=42).fit(
    [[r['width'], r['length']] for r in rows], [r['group'] for r in rows])
np.testing.assert_allclose(model.tree_.threshold[model.tree_.feature >= 0], [5, 7])
for example in examples['trees']:
    row = example['row']
    assert model.predict([[row['width'], row['length']]])[0] == example['prediction']

rows = examples['rows']['regression']
model = DecisionTreeRegressor(max_depth=1, random_state=42).fit(
    [[r['x']] for r in rows], [r['y'] for r in rows])
for example in examples['regression']:
    np.testing.assert_allclose(model.predict([[example['row']['x']]]), [example['prediction']])

for example in examples['svm']:
    rows = example['rows']
    model = SVC(kernel='linear', C=example['C']).fit(
        [[r['x'], r['y']] for r in rows], [r['group'] for r in rows])
    np.testing.assert_allclose(model.coef_[0], [example['weight'], 0], atol=1e-8)
    np.testing.assert_allclose(model.intercept_, [0], atol=1e-8)
    assert {rows[i]['id'] for i in model.support_} <= set(example['support'])

train = np.array(examples['rows']['polynomialTrain'])
validation = np.array(examples['rows']['polynomialValidation'])
for example in examples['polynomial']:
    model = make_pipeline(PolynomialFeatures(degree=example['degree'], include_bias=False), StandardScaler(), Ridge(alpha=1))
    model.fit(train[:, :1], train[:, 1])
    curve = np.array(example['points'])
    np.testing.assert_allclose(model.predict(curve[:, :1]), curve[:, 1], atol=1e-7)
    np.testing.assert_allclose(mean_squared_error(train[:, 1], model.predict(train[:, :1])) ** .5, example['trainRMSE'], atol=1e-8)
    np.testing.assert_allclose(mean_squared_error(validation[:, 1], model.predict(validation[:, :1])) ** .5, example['validationRMSE'], atol=1e-8)

rows = examples['rows']['pca']
X = np.array([[r['x'], r['y']] for r in rows])
model = PCA(n_components=2).fit(X)
example = examples['pca']
weights = np.array(example['weights'])
# SVD sign conventions differ across sklearn versions; the basis and scores
# must reverse together. The example matches the product's 1.4.2 convention.
signs = np.sign(np.sum(model.components_ * weights, axis=1))
np.testing.assert_allclose(model.components_ * signs[:, None], weights, atol=1e-8)
np.testing.assert_allclose(model.transform(X) * signs, [[r['pc1'], r['pc2']] for r in example['scores']], atol=1e-8)
np.testing.assert_allclose(model.explained_variance_ratio_[0], example['varianceShare'])
print('Computed KNN votes, tree paths, linear SVM weights, training-only polynomial curves and every PCA score agree with scikit-learn fits.')

for example in examples['rbf']:
    rows=example['rows']
    model=SVC(kernel='rbf',C=example['C'],gamma=example['gamma']).fit([[r['x'],r['y']] for r in rows],[r['group'] for r in rows])
    assert model.support_.tolist()==example['support']
    assert model.n_support_.tolist()==example['supportCounts']
    np.testing.assert_allclose(model.decision_function([[r['x'],r['y']] for r in example['probes']]),[r['score'] for r in example['probes']],atol=1e-8)
for example in examples['complexity']:
    value=None if example['value']=='None' else int(example['value'])
    model=DecisionTreeRegressor(random_state=42,**{example['parameter']:value}).fit([[r[0]] for r in example['rows']],[r[1] for r in example['rows']])
    points=np.array(example['points'])
    assert model.get_n_leaves()==example['leaves']
    np.testing.assert_allclose(model.predict(points[:,:1]),points[:,1],atol=1e-8)
print('Every RBF decision probe/support vector and tree-complexity prediction agrees with an independent sklearn fit.')

# Values shown in the visible argument guidance must produce their stated statistics.
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
values=np.array([2,4,6,3,7,1,2,3,18])
for count in [2,4,8]:
    fig,ax=plt.subplots()
    sns.histplot(x=values,bins=count,ax=ax)
    expected,edges=np.histogram(values,bins=count)
    np.testing.assert_allclose([p.get_height() for p in ax.patches],expected)
    np.testing.assert_allclose([p.get_x() for p in ax.patches],edges[:-1])
    plt.close(fig)
for edges in [[0,2,4,6],[0,2,5,20]]:
    fig,ax=plt.subplots()
    sns.histplot(x=values,bins=edges,ax=ax)
    np.testing.assert_allclose([p.get_width() for p in ax.patches],np.diff(edges))
    plt.close(fig)
def mode_value(v):
    return pd.Series(v).mode().iloc[0]
for estimator in ['mean','median','sum','min','max','std',mode_value]:
    fig,ax=plt.subplots()
    sns.barplot(x=['A']*3,y=[2,2,8],estimator=estimator,errorbar=None,ax=ax)
    expected=mode_value([2,2,8]) if callable(estimator) else pd.Series([2,2,8]).agg(estimator)
    np.testing.assert_allclose(ax.patches[0].get_height(),expected)
    plt.close(fig)
print('Integer bins, explicit interval widths and all seven listed estimators produce the stated Python results.')
