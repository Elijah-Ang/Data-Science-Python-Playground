"""Independent Python oracles for the focused ML Follow operations."""
import json
import subprocess
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, PolynomialFeatures, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
script = '''const fs=require('fs'),vm=require('vm'),c={window:{}};
vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),c);
const v=c.window.MLLearningVisuals,states=[];
for(const id of ['F02','F03','F04','F07','W03','U02','W04','W07','R08-expansion','C08-neighbours'])
 for(const [choice] of v.explorerSpecs[id].options)states.push({id,choice,...v.exploration(id,choice)});
console.log(JSON.stringify(states));'''
states = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))
for state in states:
    id, d, choice = state['id'], state['data'], state['choice']
    if id == 'F02':
        frame = pd.DataFrame(d['rows'], columns=['distance', 'weight', 'duration'])
        assert frame[[choice]].values.tolist() == d['features']
        assert frame[['duration']].values.tolist() == d['target']
    elif id in ('F03', 'F04'):
        frame = pd.DataFrame(d['rows'], columns=['distance', 'weight', 'duration']) if id == 'F04' else pd.DataFrame(d['rows'], columns=['distance', 'duration'])
        model = LinearRegression().fit(frame[['distance']], frame['duration'])
        if id == 'F03' and not d['fitted']:
            assert d['slope'] is None and '.fit(' not in state['code']
            assert 'accent-stroke' not in state['svg']
        else:
            np.testing.assert_allclose(model.coef_, [d['slope']])
            np.testing.assert_allclose(model.intercept_, d['intercept'])
            if id == 'F04':
                np.testing.assert_allclose(model.predict(pd.DataFrame({'distance': [d['distance']]})), [d['prediction']])
    elif id == 'F07':
        frame = pd.DataFrame(d['rows'], columns=['index', 'distance', 'duration', 'partition'])
        X_train, X_test, y_train, y_test = train_test_split(frame[['distance']], frame['duration'], test_size=d['testSize'], random_state=42)
        assert X_train.index.tolist() == d['train'] and X_test.index.tolist() == d['test']
        assert X_train.index.equals(y_train.index) and X_test.index.equals(y_test.index)
    elif id in ('W03', 'U02'):
        fitted = StandardScaler().fit(d['original'])
        np.testing.assert_allclose(d['mean'], fitted.mean_)
        np.testing.assert_allclose(d['scale'], fitted.scale_)
        np.testing.assert_allclose(d['rows'], fitted.transform(d['original']) if d['scaled'] else d['original'])
    elif id == 'W04':
        encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False).fit(pd.DataFrame({'service': d['categories']}))
        np.testing.assert_array_equal(encoder.transform(pd.DataFrame({'service': [choice]}))[0], d['row'])
        assert encoder.categories_[0].tolist() == d['categories']
    elif id == 'W07':
        raw = np.array([[np.nan if row[0] is None else row[0]] for row in d['rows']])
        imputer = SimpleImputer(strategy=choice).fit(raw)
        np.testing.assert_allclose(imputer.statistics_, [d['fillValue']])
        np.testing.assert_allclose(imputer.transform(raw), d['filled'])
        namespace = {'SimpleImputer': SimpleImputer,
                     'example_train': pd.DataFrame(raw, columns=['distance'])}
        exec(state['code'], namespace)
        np.testing.assert_allclose(namespace['answer'], d['filled'])
    elif id == 'R08-expansion':
        raw = np.array(d['rows'])[:, :1]
        expanded = PolynomialFeatures(degree=d['degree'], include_bias=False).fit_transform(raw)
        np.testing.assert_allclose(expanded, np.array(d['rows'])[:, 1:])
        assert '.fit(example_X' not in state['code'] and 'root_mean_squared_error' not in state['code']
    elif id == 'C08-neighbours':
        assert d['k'] == 5 and d['query'] == [int(v) for v in choice.split(',')]
        assert 'kneighbors' in state['code']
        assert 'named_steps["scale"]' in state['code']
        raw = np.array([[row['x'], row['y']] for row in d['rows']])
        scaler = StandardScaler().fit(raw)
        model = KNeighborsClassifier(n_neighbors=5).fit(scaler.transform(raw), [row['group'] for row in d['rows']])
        query = scaler.transform([d['query']])
        distances, positions = model.kneighbors(query)
        assert [d['rows'][i]['id'] for i in positions[0]] == [row['id'] for row in d['neighbours']]
        np.testing.assert_allclose(distances[0], [row['distance'] for row in d['neighbours']])
        assert model.predict(query)[0] == d['prediction']
        example_X = pd.DataFrame(raw, columns=['x', 'y'])
        example_y = pd.Series([row['group'] for row in d['rows']])
        fitted = Pipeline([('scale', StandardScaler()),
                           ('model', KNeighborsClassifier(n_neighbors=5))]).fit(example_X, example_y)
        namespace = {'pd': pd, 'model': fitted, 'example_y': example_y}
        exec(state['code'], namespace)
        np.testing.assert_array_equal(namespace['positions'][0], positions[0])
        assert namespace['votes'].to_dict() == d['votes']

registry = json.loads(subprocess.check_output(['python3', 'ml-learning/authoring.py'], cwd=ROOT))
exceptions, transitions = [], []
for card in registry['cards']:
    for index, exercise in enumerate(card['exercises']):
        for guide in exercise['syntaxGuidance']['current']:
            if guide.get('id') == 'pipeline-internals':
                assert guide['code'] in exercise['solution'], (exercise['id'], guide['code'], 'Teaching must access an actual named step in this task')
        if exercise.get('visualTeaching'):
            assert index and card['kind'] == 'teaching'
            assert exercise['visualTeaching']['reason'] and exercise['visualTeaching']['concept']
            exceptions.append(exercise['id'])
        if exercise['newInTask']:
            assert index and card['kind'] == 'teaching'
            assert exercise['syntaxGuidance']['current']
            transitions.append(exercise['id'])
assert set(exceptions) == {'ML-C08-2', 'ML-R10-2'}
assert not next(c for c in registry['cards'] if c['id'] == 'ML-U07')['exercises'][3]['newInTask'], 'Ward is introduced in its Follow lesson'
print(json.dumps({'operationStates': len(states), 'cards': len(registry['cards']), 'explicitLaterVisuals': exceptions, 'newTaskIntroductions': len(transitions), 'passed': True}, indent=2))
