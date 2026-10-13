"""Check the computed teaching examples against fitted scikit-learn operations."""
import json
import subprocess
from pathlib import Path
import numpy as np
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

ROOT = Path(__file__).resolve().parents[1]
script = '''const fs=require('fs'),vm=require('vm'),context={window:{}};
vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),context);
const v=context.window.MLLearningVisuals;
console.log(JSON.stringify({rows:v.exampleRows,
  knn:['1','3','5'].map(n=>v.exploration('C08',n).data),
  trees:v.exampleRows.tree.map(r=>v.exploration('C14',r.id).data),
  regression:v.exampleRows.regression.map(r=>v.exploration('R09',r.id).data),
  svm:['0.05','0.2','1'].map(n=>v.exploration('C10',n).data),
  polynomial:['1','2','4'].map(n=>v.exploration('R07',n).data),
  pca:v.exploration('P01','p1').data}));'''
examples = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))

rows = examples['rows']['knn']
X = np.array([[r['x'], r['y']] for r in rows])
y = [r['group'] for r in rows]
for example in examples['knn']:
    model = KNeighborsClassifier(n_neighbors=example['k']).fit(X, y)
    assert model.predict([[0, 0]])[0] == example['prediction']
    distances, indices = model.kneighbors([[0, 0]])
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
    model = make_pipeline(PolynomialFeatures(degree=example['degree'], include_bias=False), LinearRegression())
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
