"""Place illustrative teaching where its operation is actually introduced.

Pictures belong to Follow. Two later parameter/diagnostic extensions warrant a
new, focused picture; ordinary practice, retrieval and transfer use their own
visible inputs and Python outputs instead of inheriting an introduction.
"""

EXCEPTIONS = {
    'ML-C08-2': dict(
        concept='Inspect the five-neighbour vote',
        reason='This task retrieves fitted neighbour positions and counts their labels. The visual keeps k at five while a changed prediction input updates those neighbours and votes.'),
    'ML-R10-2': dict(
        concept='Constrain the number of fitting rows in each leaf',
        reason='The preceding task changes maximum depth. This task introduces minimum leaf support, so its control changes only min_samples_leaf on the same observations.'),
}

# Familiar operations retain their local Python explanation, without claiming
# another conceptual introduction. These decisions are checked against both
# the Data Foundations sequence and the relevant ML model route.
REUSED_TASK_GUIDANCE = {
    'ML-C08-3': 'Counting observations and distinct IDs reuses Inspect I14 and group aggregation in I19/W19; the new dataset is not a new operation.',
    'ML-U07-3': 'Follow already explains linkage columns 2 and 3; selecting them together reuses those same merge values.',
    'ML-P01-2': 'The Follow PCA guide already explains projection through fitted axes; reusing fit/transform also follows StandardScaler in W03.',
}

# A named step is local to its authored recipe. Generic preparation examples
# must not imply that every pipeline has a step called prepare.
CURRENT_STEP_GUIDES = {
    "ML-R08-1": {
        "step": "polynomial",
        "meaning": "named_steps selects a Pipeline step by its declared name. Here polynomial expands x into power columns. Calling its fit_transform prepares those columns; the scale and prediction model steps have not been fitted."
    },
    "ML-C05-3": {
        "step": "model",
        "meaning": "Read the fitted classifier inside the pipeline. Its coef_ rows follow class order; columns follow input feature order. Reading them does not fit again."
    },
    "ML-C10-2": {
        "step": "model",
        "meaning": "The model step is the fitted SVM. Its n_support_ counts the support vectors for each class in model.classes_ order. Reading these counts does not fit the pipeline again."
    },
    "ML-C12-1": {
        "step": "model",
        "meaning": "The model step is the fitted One-R classifier. Its rules_ dictionary stores the learned rules; the preparation step has already supplied the feature representation. Reading rules does not fit again."
    },
    "ML-N04-1": {
        "step": "model",
        "meaning": "The model step is the target wrapper. After model.fit, transformer_ is its fitted target scaler; mean_ records the fitting target mean. This is separate from the outer input scaler."
    }
}


def apply(registry):
    for card in registry['cards']:
        for index, exercise in enumerate(card['exercises']):
            exercise.pop('visualTeaching', None)
            exercise['newInTask'] = []
            if card['kind'] != 'teaching':
                continue
            if index and exercise['id'] not in REUSED_TASK_GUIDANCE:
                # These guides are explicit author-origin introductions, not
                # inferred from mentions or from code prepared in setup.
                exercise['newInTask'] = [
                    dict(code=part.get('code', part.get('title')), title=part.get('title', part.get('code')),
                         meaning=part['meaning'])
                    for part in exercise.get('syntaxGuidance', {}).get('current', [])
                ]
            if exercise['id'] in EXCEPTIONS:
                exercise['visualTeaching'] = EXCEPTIONS[exercise['id']]
    cards = {card['id']: card for card in registry['cards']}
    # The Follow operation expands columns; fitting a Ridge curve and judging
    # validation errors is a later activity, not this introductory operation.
    cards['ML-R08']['exercises'][0]['visual'] = {
        **cards['ML-R08']['visual'], 'id': 'R08-expansion', 'choice': '2'}
    cards['ML-C08']['exercises'][1]['visual'] = {
        **cards['ML-C08']['visual'], 'id': 'C08-neighbours', 'choice': '0,0'}
    for guide in cards['ML-C08']['exercises'][1]['syntaxGuidance']['current']:
        if guide.get('id') == 'pipeline-internals':
            guide['code'] = "model.named_steps['scale']"
            guide['meaning'] = 'named_steps accesses the fitted steps by their authored names: scale standardises the query; model contains the five-neighbour classifier. Ordinary Pipeline.predict performs these steps automatically.'
            guide['example'] = guide['example'].replace("named_steps['prepare']", "named_steps['scale']")
    cards['ML-C08']['exercises'][1]['newInTask'] = [
        dict(code=part.get('code', part.get('title')), title=part.get('title', part.get('code')), meaning=part['meaning'])
        for part in cards['ML-C08']['exercises'][1]['syntaxGuidance']['current']]
    # The new part is the quantity-output estimator, rather than tuple notation
    # and unfitted/fitted state, which the Follow lesson has just explained.
    neural = cards['ML-N01']['exercises'][1]
    for guide in neural['syntaxGuidance']['current']:
        if guide.get('id') == 'practice-ML-N01-2':
            guide['meaning'] = 'MLPRegressor configures a network for a numerical outcome. hidden_layer_sizes=(8,) keeps one eight-unit hidden layer; constructing the recipe does not fit its weights.'
    neural['newInTask'] = [dict(code=part.get('code'), title=part.get('title'), meaning=part['meaning'])
                           for part in neural['syntaxGuidance']['current']]
    leaf = cards['ML-R10']['exercises'][1]
    guide = dict(code="{'min_samples_leaf': [1, 5, 10]}", title='Minimum leaf support',
                 meaning='min_samples_leaf requires each terminal leaf to contain at least this many fitting observations. Compare 1, 5 and 10 using the same training folds; larger values prevent tiny leaves.')
    leaf['syntaxGuidance']['current'].append(guide)
    leaf['newInTask'] = [guide]
    for card in registry['cards']:
        for exercise in card['exercises']:
            if exercise['id'] not in CURRENT_STEP_GUIDES:
                continue
            spec = CURRENT_STEP_GUIDES[exercise['id']]
            for part in exercise['syntaxGuidance']['current']:
                if part.get('id') == 'pipeline-internals':
                    part['code'] = "model.named_steps[" + repr(spec['step']) + "]"
                    part['meaning'] = spec['meaning']
            if exercise['newInTask']:
                exercise['newInTask'] = [
                    dict(code=part.get('code', part.get('title')), title=part.get('title', part.get('code')), meaning=part['meaning'])
                    for part in exercise['syntaxGuidance']['current']]
    return registry
