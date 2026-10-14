"""Final-assembly contracts for progression, provenance and model application.

Execution is covered by test_ml_learning_runtime.py; this suite catches the
teaching mistakes that runnable scripts alone cannot establish.
"""
import ast
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
registry = json.loads(subprocess.check_output([sys.executable, 'ml-learning/authoring.py'], cwd=ROOT))
cards = {card['id']: card for card in registry['cards']}
activities = {e['id']: e for c in registry['cards'] for e in c['exercises']}
manifest = json.loads((ROOT/'ml-learning/manifest.json').read_text())
assert len(cards) == 110 and len(activities) == 338
assert len(registry['challenges']) == 19
assert registry['teachingPolicy']['sharedModes'] == ['learn', 'refresh']
for spec in manifest['cards']:
    card = cards['ML-'+spec['id']]
    assert [e['id'] for e in card['exercises']] == ['ML-'+eid for eid in spec['exercises']], card['id']
    assert set(card['teaching']) == {'introduces', 'reuses', 'extends', 'prerequisites'}
    assert card['teaching']['prerequisites'] == card['prerequisites']
    for exercise in card['exercises']:
        assert set(exercise['syntaxGuidance']) == {'current', 'reminders', 'reference'}, exercise['id']
        assert exercise['teaching']['prerequisites'] == card['prerequisites']
        # Diagnostic syntax must not leak into the default concept introduction.
        if exercise['kind'] == 'python':
            assert {item['name'] for item in exercise['learnerOutputs']} == set(exercise['outputs'])
            if not exercise.get('assessment'):
                assert {item['name'] for item in exercise['contract']} == set(exercise['outputs'])
            assert exercise['taskBrief']['result'] == exercise['task']
            assert 'Validation design:' not in exercise['task'], exercise['id']+' duplicated generated validation text'
            assert all(set(item) >= {'name','description','fitted','training','code'} for item in exercise['suppliedState'])
            if exercise['label'] == 'Follow':
                assert exercise['starter'] == exercise['solution']
        if exercise.get('workflowSections'):
            assert len(exercise['workflowSections']) == 8
            for number, section in enumerate(exercise['workflowSections'], 1):
                assert section['number'] == number and section['question'] and section['meaning']
            assert all(f'# {number}.' in exercise['solution'] for number in range(1,9))

# Compare every supervised family at the same milestone, while retaining its
# specialised short rounds and distinct independent transfer dataset.
models = {'simple_linear','multiple_linear','polynomial','regression_tree','logistic','knn_cls','svm_cls','one_r','classification_tree','naive_bayes','lda','qda','mlp_cls','mlp_reg'}
for model in models:
    bridges = [e for c in cards.values() if model in c['models'] for e in c['exercises'] if e.get('modelBridge')]
    assert bridges and all(e['workflowKind']=='supervised' for e in bridges), model
    assert any(model in challenge['models'] for challenge in registry['challenges']), model
    for e in bridges:
        assert e['label'] == 'Apply' and len(e['workflowSections']) == 8
        assert e['setup'] == '' and e['providedObjects'] == ['df'], e['id']
        for variable in ('X_train','X_test','y_train','y_test','final_model','final_predictions'):
            assert variable in e['solution'], (e['id'], variable)
        assert e['workflowDifference']['changedLines']
        assert len(e['workflowDifference']['solutionLines']) == 1
        assert e['assessment']['allowedModels'], e['id']
for card in ('ML-C10','ML-C14'):
    comparison = cards[card]['modelComparison']
    assert comparison['dataset'] == 'CLASS180'
    assert cards[card]['exercises'][-1]['dataset'] == 'CLASS180'
    assert len(comparison['examples']) == 2
    for example in comparison['examples']:
        lines = example['code'].splitlines()
        assert len(example['changedLines']) == 3
        assert all(1 <= line <= len(lines) for line in example['changedLines'])

# New concepts are rich at their authored introduction and compact on reuse.
for e in cards['ML-F11']['exercises'] + cards['ML-F12']['exercises']:
    assert len(e['workflowSections']) == 8
first = activities['ML-F11-1']['syntaxGuidance']['current']
assert {'pipeline','baseline','folds','cross-validation','oof','clone'} <= {part.get('id') for part in first}
for part in first:
    if part.get('id'):
        assert len(part['meaning']) > 80 and part['choices'] and part['example']
assert not {'pipeline','baseline','folds','cross-validation','oof','clone'} & {part.get('id') for part in activities['ML-F12-1']['syntaxGuidance']['current']}
assert {'scale','macro-f1','logistic'} <= {part.get('id') for part in activities['ML-F12-1']['syntaxGuidance']['current']}

knn = activities['ML-C08-1']
assert '.fit(' in knn['solution'] and '.predict(' in knn['solution']
assert not any(word in knn['solution'] for word in ('kneighbors','named_steps','reindex'))
assert not any(word in cards['ML-C08']['explanation'] for word in ('kneighbors','named_steps','reindex'))
assert {'pipeline-internals','neighbours'} <= {part.get('id') for part in activities['ML-C08-2']['syntaxGuidance']['current']}
assert 'midpoint' not in cards['ML-C17']['syntax']
assert activities['ML-C17-3']['depth'] == 'deeper'
assert 'lda-deeper' in {part.get('id') for part in activities['ML-C17-3']['syntaxGuidance']['current']}
assert cards['ML-C06']['title'] == 'Tune logistic regularisation'
assert 'RBF decision boundary' in cards['ML-C10']['visual']['caption']
assert activities['ML-C11-2']['visual']['id']=='C11-gamma'
assert activities['ML-R10-2']['visual']['id']=='R10-leaf'

# A prefit inspection labels the fitted training population; checks may read its
# state but must not present that provided model as a learner-created result.
for eid in ('ML-C10-1','ML-C17-1','ML-C17-3','ML-N02-1'):
    e=activities[eid]
    model=next(item for item in e['suppliedState'] if item['name']=='model')
    assert model['fitted'] is True and model['training']=='X_train, y_train', eid
    assert 'model' not in {item['name'] for item in e['contract']}, eid
network=next(item for item in activities['ML-N02-1']['suppliedState'] if item['name']=='network')
assert network['fitted'] and network['training']=='X_train, y_train'
assert next(item for item in activities['ML-N04-1']['suppliedState'] if item['name']=='model')['fitted'] is False
assert 'quality-score points' in cards['ML-N04']['explanation']
assert 'kWh' in activities['ML-N04-5']['task']
assert 'TransformedTargetRegressor' in activities['ML-N04-5']['solution']

for cid in ('ML-U03','ML-U07','ML-P02'):
    e=cards[cid]['exercises'][-1]
    assert e['modelBridge'] and e['workflowKind']=='unsupervised'
    assert e['workflowOrder']==['Select measurements','Prepare','Fit representation or grouping','Inspect results','Interpret limitations']
    assert 'train_test_split' not in e['solution'] and 'y_test' not in e['solution']

print('110 cards, 338 activities, 19 challenges: teaching levels, 14 supervised model milestones, unsupervised sequences, supplied fitted-state provenance and named repairs passed.')
