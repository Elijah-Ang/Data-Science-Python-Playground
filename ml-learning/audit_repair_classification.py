"""Late, source-reviewed repairs for Classification and Neural Networks.

Stable card/exercise IDs and prerequisites are preserved. New Python rounds
use authoring.py's semantic fit/prediction checks before the final contract pass.
"""
from authoring import py, decide, reflect
from packages import required


def _replace(card, number, exercise, **metadata):
    old = card['exercises'][number - 1]
    exercise.update(id=old['id'], version=old.get('version', 1) + 1,
                    label=old['label'], demand=old.get('demand', 'Apply the taught distinction'))
    exercise.update(metadata)
    if exercise['kind'] == 'python':
        exercise['packages'] = required(exercise)
    card['exercises'][number - 1] = exercise
    return exercise


def _check(exercise, name, test, message):
    exercise['checks'].append(dict(name=name, test=test, message=message))
    exercise['version'] = exercise.get('version', 1) + 1


def _teach(card, code, meaning):
    card['syntax'] += '\n' + code
    card['syntaxBreakdown'].append(dict(code=code, meaning=meaning))
    card['explanation'] += ' ' + meaning


def apply(registry):
    cards = {c['id']: c for c in registry['cards']}

    # Actual members of the never-predicted class make the omission consequential.
    e = _replace(cards['ML-C01'], 3, py(
        'Build the A/B/C confusion matrix for ERROR15 in that order. Actual C cases are present, but none is predicted C. Then explain which C errors would disappear if the matrix dropped C.',
        "from sklearn.metrics import confusion_matrix\nanswer=confusion_matrix(df.actual,df.predicted,labels=['A','B','C'])",
        "np.array_equal(answer,[[5,2,0],[1,3,0],[2,2,0]])", dataset='ERROR15'),
        reasoningPrompt='Use the C row and C column to distinguish missed actual C cases from an absent predicted class.')
    e.update(hints=dict(think='An empty predicted-class column can coexist with nonempty actual-class rows.',
        tools='confusion_matrix with an explicit complete labels list.',
        approach='Keep A, B and C on both axes; inspect the C row before interpreting its empty prediction column.'),
        explanation='The four actual C cases are misclassified as A or B. Keeping C exposes these misses; an omitted C row would conceal them.')

    # The explicit preparation requirement must survive output coincidences.
    scale_groups = "[{'columns':['length','width'],'operation':'scale'}]"
    for id, number in [('ML-C05', 1), ('ML-C09', 1), ('ML-C11', 1)]:
        e = cards[id]['exercises'][number - 1]
        fitted = 'search.best_estimator_' if id in ('ML-C09', 'ML-C11') else 'model'
        _check(e, 'Declared feature scaling',
               f'trace.preparation_matches({fitted},{scale_groups})',
               'Keep a training-fitted StandardScaler in the classifier pipeline. Equivalent pipeline step names are accepted.')

    e = cards['ML-C08']['exercises'][0]
    _check(e, 'Three-neighbour geometry',
        "model.n_neighbors==3 and np.allclose(scaler.mean_,X_train.mean()) and np.allclose(scaler.scale_,X_train.std(ddof=0)) and np.array_equal(answer,model.kneighbors(scaler.transform(X_test.iloc[:1]),n_neighbors=3,return_distance=False))",
        'Fit the scaler to training rows and retrieve exactly three neighbours in that same fitted coordinate system.')
    _teach(cards['ML-C08'],
        "pd.Series(['red','blue','red']).value_counts().reindex(['red','blue','green'],fill_value=0)",
        'Count the labels of retrieved neighbours, then reindex to the complete class list with zero counts for absent voters. Neighbour positions select rows from the fitted training table, not from the test table.')
    _teach(cards['ML-C08'], 'model.classes_',
        'A fitted classifier stores its class names in classes_. Use those names to label vote counts rather than assuming a class order.')
    _teach(cards['ML-C08'], "model.named_steps['scale'].transform(query)\nmodel.named_steps['model'].kneighbors(prepared_query,return_distance=False)",
        'Pipeline named_steps gives access to its contained fitted objects by their chosen names. Pipeline.predict applies every preparation step automatically. Calling the contained KNN kneighbors directly requires first transforming the query with that pipeline’s fitted scaler, so training neighbours and query use the same coordinates.')
    e = _replace(cards['ML-C08'], 2, py(
        'Use a scaled five-neighbour classifier for the last test row. Store its predicted class in answer and its class-labelled neighbour counts in vote_counts, including classes with zero votes. Explain the disagreement in this local neighbourhood.',
        "from sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nmodel=Pipeline([('scale',StandardScaler()),('model',KNeighborsClassifier(n_neighbors=5))]).fit(X_train,y_train)\nquery=X_test.iloc[[-1]]\nanswer=model.predict(X_test.iloc[[-1]])\npositions=model.named_steps['model'].kneighbors(model.named_steps['scale'].transform(query),return_distance=False)[0]\nvote_counts=y_train.iloc[positions].value_counts().reindex(model.classes_,fill_value=0)",
        [
          dict(name='Five-neighbour recipe',test="trace.neighbour_vote_matches(answer,None,X_train,y_train,X_test.iloc[[-1]],k=5)",message='Use five neighbours and training-fitted scaling on the declared rows; equivalent estimator and pipeline step names are accepted.'),
          dict(name='Local votes',test="trace.neighbour_vote_matches(answer,vote_counts,X_train,y_train,X_test.iloc[[-1]],k=5)",message='Count the five actual retrieved training labels, preserving their class names and zero-vote classes. Equivalent count ordering or labelled mappings are accepted.'),
        ], dataset='CLASS18', setup=cards['ML-C08']['exercises'][0]['setup'],
        outputs=['answer','vote_counts']),
        reasoningPrompt='Quote the votes. Why does a majority label leave local ambiguity rather than establish a perfectly separated class region?')
    # The task requires one predicted class; a scalar, one-item array or list
    # has the same meaning. The query-bound helper above supplies this evidence.
    e['checks']=[check for check in e['checks'] if check['name']!='Fitted prediction evidence']
    e.update(starter='# Build the five-neighbour recipe, then inspect the last test row.\n',
        hints=dict(think='The last test row has competing nearby labels. A label alone conceals the vote distribution.',
            tools='Pipeline, StandardScaler, KNeighborsClassifier(n_neighbors=5), kneighbors, iloc and value_counts.',
            approach='Fit on training rows; transform the query with the fitted scaler; use neighbour positions to count the corresponding training labels.'),
        explanation='The last held-away row has three C votes and two B votes. Five-neighbour majority voting returns C, while the competing B votes expose local uncertainty. Neither three-neighbour output coincidence nor raw-unit distances supplies the requested evidence.')
    e = _replace(cards['ML-C08'], 3, reflect(
        'An inspection system reports four votes for pass and one for fail among five nearby rows. Four rows are repeat measurements of the same machine; deployment concerns unfamiliar machines. Explain why a four-to-one row vote is weaker evidence than five independent machines, and propose a validation boundary that tests the intended use.',
        'The configured KNN counts rows, so repeated measurements can dominate its local vote without supplying four independent sources of support. Keep measurements from each machine together when forming training and validation populations for new-machine evaluation; learn the scale within each training population. A majority label describes the configured vote, while reliable transfer to unfamiliar machines requires that appropriate evaluation.'))
    e['hints'] = dict(think='Counting nearby rows is not the same as counting independent machines.',
        tools='Observation units, repeated measurements and held-away machine identities.',
        approach='Separate the row-voting rule from independent support, then explain which machine identities must be excluded together during evaluation.')

    # Enforce legitimate feature roles even if the learner changes a list used
    # by both their fit and the old generated check.
    flags = ['chocolate','fruity','caramel','peanutyalmondy','nougat','crispedricewafer','hard','bar','pluribus']
    _check(cards['ML-C16']['exercises'][0], 'Binary inputs without the target source',
        f"set(flags)==set({flags!r}) and len(flags)==9 and trace.fit_matches(train[flags],train.popular,'BernoulliNB')",
        'Use the nine declared binary flags. winpercent defines the target and cannot be a predictor.')
    columns = ['buying','maintenance','doors','persons','luggage_boot','safety']
    _check(cards['ML-C16']['exercises'][2], 'Declared category predictors',
        f"set(columns)==set({columns!r}) and len(columns)==6 and trace.fit_matches(train[columns],train.acceptability,'BernoulliNB')",
        'Use exactly the six Car attributes consistently through fitting and prediction; acceptability is the outcome, never an encoded input.')

    _check(cards['ML-C14']['exercises'][0], 'Declared maximum depth',
        'model.max_depth==3', 'Configure max_depth=3 as requested, even if a smaller tree could predict the same test label.')

    # An LDA-specific linearity experiment replaces repeated probability-table work.
    _teach(cards['ML-C17'], 'model.decision_function(rows)',
        'For binary LDA, decision_function returns a signed log-odds score in fitted class order. Shared covariance gives an affine score: a midpoint score equals the mean endpoint score. This is a score identity, not an arithmetic identity for probabilities.')
    _teach(cards['ML-C17'], "midpoint=(left+right)/2",
        'A feature-space midpoint averages each coordinate. For example, endpoints (0,2) and (4,6) have midpoint (2,4); averaging model scores is a separate operation.')
    _teach(cards['ML-C17'], 'row.to_frame().T',
        'iloc selects a row as a Series; to_frame().T turns that feature-labelled Series into a one-row dataframe with the original feature names as columns.')
    setup = cards['ML-C17']['exercises'][0]['setup'] + "\nprobe=pd.DataFrame({'x1':[-2.,2.],'x2':[1.,-1.]},index=['left','right'])\n"
    e = _replace(cards['ML-C17'], 3, py(
        'Use the supplied already-fitted binary LDA without refitting to score the two probe endpoints and their feature-space midpoint. Store the endpoint scores in endpoint_scores, the midpoint score in midpoint_score and its difference from the mean endpoint score in gap. Then explain why a near-zero gap follows from shared covariance and why averaging probabilities is a different claim.',
        "endpoint_scores=model.decision_function(probe)\nmidpoint=(probe.iloc[0]+probe.iloc[1])/2\nmidpoint_score=float(model.decision_function(midpoint.to_frame().T)[0])\ngap=float(midpoint_score-np.mean(endpoint_scores))",
        [
          dict(name='LDA endpoint scores',test="np.asarray(endpoint_scores).shape==(2,) and np.allclose(endpoint_scores,model.decision_function(probe)) and trace.prediction_matches(endpoint_scores,probe,'decision_function')",message='Return the supplied LDA decision scores for the two probe rows in their given order.'),
          dict(name='Feature midpoint and affine score',test="np.isclose(midpoint_score,model.decision_function(((probe.iloc[0]+probe.iloc[1])/2).to_frame().T)[0]) and np.isclose(gap,midpoint_score-np.mean(endpoint_scores)) and np.isclose(gap,0,atol=1e-10)",message='Average feature coordinates before scoring; report the observed midpoint-minus-mean-endpoint score difference, not a probability average.'),
          dict(name='Supplied LDA recipe',test="type(model).__name__=='LinearDiscriminantAnalysis' and not any(event['kind'] in ('fit','fit_transform','fit_predict') for event in trace.events) and all(event['estimator']=='LinearDiscriminantAnalysis' for event in trace.events if event['kind']=='decision_function' and event['depth']==0)",message='Use the already-fitted supplied LDA without replacing its family or refitting on another population.'),
        ], dataset='COV90_SHARED',setup=setup,
        outputs=['endpoint_scores','midpoint_score','gap']),
        reasoningPrompt='Explain the connection between shared covariance and a linear decision boundary. Why need not the same midpoint identity hold for predict_proba?')
    e.update(hints=dict(think='A midpoint in feature space and a mean of model scores are two separate calculations.',
        tools='decision_function, iloc, to_frame().T and np.mean.',
        approach='Score both endpoints; average their input coordinates and score that new row; compare the midpoint score with the mean endpoint score.'),
        explanation='Binary LDA has an affine log-odds score, so the midpoint score equals the mean endpoint score up to roundoff. Its logistic conversion to probability is nonlinear, so averaging probabilities is a different claim.')

    e = cards['ML-C19']['exercises'][0]
    e['checks'][0]['test'] = "_labelled_counts_match(counts,df.label.value_counts()) and isinstance(answer,pd.DataFrame) and list(answer.index)==['length','width'] and list(answer.columns)==['length','width'] and np.allclose(answer,df.loc[df.label.eq('A'),['length','width']].cov())"
    e['checks'][0]['message'] = 'Return the correct counts under their class labels and the class-A sample covariance under its feature labels. The count presentation order may vary.'
    e['version'] += 1
    _check(cards['ML-C18']['exercises'][0], 'Regularised class covariance',
        "type(model).__name__=='QuadraticDiscriminantAnalysis' and 0<model.reg_param<=1",
        'Use a supported positive covariance regularisation strength for the requested regularised QDA. A different positive strength is accepted; zero removes this regularisation.')

    # The visible bug now exists, and every scored prediction must be observed.
    n04 = cards['ML-N04']
    e = n04['exercises'][2]
    e['task'] = e['task'].replace('Search widths through the nested regressor parameter.',
        'Compare hidden widths 16 and 24 through the nested regressor parameter. Store positive mean validation RMSE values in answer, in that candidate order; negate the negative-error scorer results.')
    e['version'] += 1
    e = _replace(n04, 4, py(
        'Repair the supplied scoring code so predictions and actual values both use Wine quality-score units. Store original-unit predictions in predictions and their RMSE against untransformed y_test in answer. Then explain why an RMSE in standardised target units cannot be quoted as quality-score points.',
        "from sklearn.metrics import root_mean_squared_error\nmodel.fit(X_train,y_train)\npredictions=model.predict(X_test)\nanswer=root_mean_squared_error(y_test,predictions)",
        "np.isclose(answer,np.sqrt(np.mean((np.asarray(y_test)-np.asarray(predictions))**2)))",
        dataset='Wine600',setup=n04['exercises'][0]['setup'],outputs=['predictions','answer']),
        reasoningPrompt='Name the target unit before and after transformation. Explain which outer API reverses the target scale and why the final error is measured in quality-score points.')
    e.update(starter="from sklearn.metrics import root_mean_squared_error\nmodel.fit(X_train,y_train)\npredictions=model.predict(X_test)\n# Bug: the predictions are already inverse-transformed, but the actual values are scaled.\nscaled_actual=model.named_steps['model'].transformer_.transform(y_test.to_numpy().reshape(-1,1)).ravel()\nanswer=root_mean_squared_error(scaled_actual,predictions)\n",
        hints=dict(think='The outer wrapper already returns original-unit predictions; scaling actual values again mixes two unit systems.',
            tools='The full Pipeline.predict and root_mean_squared_error.',
            approach='Keep y_test in its original units, predict through the wrapper and calculate RMSE from those aligned original-unit values.'),
        explanation='Wine quality is a score, so original-unit RMSE is measured in quality-score points. The target transformer is fitted on training outcomes, and the outer prediction method reverses that transformation.')
    for number, exercise in enumerate(n04['exercises'], 1):
        fitted = 'search.best_estimator_' if number == 3 else 'model'
        _check(exercise, 'Neural feature and target preparation',
            f"type({fitted}.steps[-1][1]).__name__=='TransformedTargetRegressor' and type({fitted}.steps[-1][1].regressor_).__name__=='MLPRegressor' and type({fitted}.steps[-1][1].transformer_).__name__=='StandardScaler' and {fitted}.steps[-1][1].transformer_.with_mean and {fitted}.steps[-1][1].transformer_.with_std and trace.preparation_matches({fitted},[{{'columns':list(X_train.columns),'operation':'scale'}}])",
            'Use the taught neural regressor inside the target-scaling wrapper, with feature scaling in the outer pipeline. A dummy inside the same wrapper does not supply a neural workflow.')

    # Reviews retrieve concepts through diagnosis/comparison, with independently
    # designed populations rather than a cloned task with jittered values.
    cr1 = cards['ML-C-R1']
    e = _replace(cr1, 1, py(
        'The inspection review compares policies predicted and alternative on the same clear/inspect/urgent cases. Build scores with those policy names as rows and columns clear, inspect, urgent, macro_f1, accuracy. The first three columns hold each class F1. Store the higher-macro-F1 policy name in chosen_policy and explain why equal accuracy does not settle this choice.',
        "from sklearn.metrics import f1_score,accuracy_score\nlabels=['clear','inspect','urgent']\nrows=[]\nfor policy in ['predicted','alternative']:\n    class_scores=f1_score(df.actual,df[policy],labels=labels,average=None,zero_division=0)\n    rows.append([*class_scores,f1_score(df.actual,df[policy],labels=labels,average='macro',zero_division=0),accuracy_score(df.actual,df[policy])])\nscores=pd.DataFrame(rows,index=['predicted','alternative'],columns=labels+['macro_f1','accuracy'])\nchosen_policy=scores.macro_f1.idxmax()",
        [
          dict(name='Class and policy evidence',test="isinstance(scores,pd.DataFrame) and list(scores.index)==['predicted','alternative'] and list(scores.columns)==['clear','inspect','urgent','macro_f1','accuracy'] and all(np.allclose(scores.loc[p,['clear','inspect','urgent']],__import__('sklearn.metrics',fromlist=['f1_score']).f1_score(df.actual,df[p],labels=['clear','inspect','urgent'],average=None,zero_division=0)) and np.isclose(scores.loc[p,'macro_f1'],scores.loc[p,['clear','inspect','urgent']].mean()) and np.isclose(scores.loc[p,'accuracy'],np.mean(df.actual==df[p])) for p in ['predicted','alternative'])",message='Score both policies on the same actual cases, preserving class names and the equal-class F1 average.'),
          dict(name='Macro-F1 nomination',test="chosen_policy==scores.macro_f1.idxmax() and chosen_policy=='alternative'",message='Select the policy supported by macro F1; equal accuracy hides different urgent-class errors.'),
        ],dataset='ERROR12_REVIEW',outputs=['scores','chosen_policy']),
        reasoningPrompt='Quote the urgent-class F1, macro F1 and accuracy for both policies. Explain which error pattern the equal-class summary reveals.')
    e.update(context='Independent synthetic inspection cases with unequal class frequencies. Both policies are already recorded; this round compares their errors on the same cases rather than fitting a new model.',
        dictionary=[['actual','Confirmed clear, inspect or urgent outcome.'],['predicted','First recorded policy; it never predicts urgent.'],['alternative','Second recorded policy; it redistributes errors across the classes.']],
        hints=dict(think='Equal numbers of correct cases can hide very different errors in the rare urgent class.',
        tools='f1_score with labels and average=None or macro; accuracy_score; a labelled dataframe and idxmax.',
        approach='Score each policy using the same actual rows; compare per-class contributions before choosing by macro F1.'),
        explanation='Both policies classify 22 of 27 cases correctly. The first never predicts urgent, while the alternative recovers two of its three cases. Their macro F1 values differ because each class receives equal weight.')
    _teach(cr1, "f1_score(actual,predicted,labels=class_names,average=None,zero_division=0)",
        'Use the declared class list for comparable per-class F1; zero_division=0 assigns zero when a class has no correct positive evidence. idxmax() returns the row label of the largest score.')

    setup = """from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
X=df[['density_g_cm3','conductivity_ms']]
y=df.material
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
model=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))]).fit(X_train,y_train)
broken=pd.DataFrame(model.predict_proba(X_test),columns=np.roll(model.classes_,1))
"""
    e = _replace(cr1, 2, py(
        'Repair the supplied broken material-probability table using the already-fitted classifier without refitting: it lost observation IDs and rotated class names. Store the corrected table in answer with X_test indices and fitted class columns. Recover its winning class labels in predicted, in the same row order, and explain why the plausible-looking broken table can misassign evidence.',
        "answer=pd.DataFrame(model.predict_proba(X_test),index=X_test.index,columns=model.classes_)\npredicted=model.classes_[np.argmax(answer.to_numpy(),axis=1)]",
        "isinstance(answer,pd.DataFrame) and answer.index.equals(X_test.index) and list(answer.columns)==list(model.classes_) and np.allclose(answer,model.predict_proba(X_test)) and np.array_equal(predicted,model.predict(X_test))",
        dataset='MATERIAL96',setup=setup,outputs=['answer','predicted']),
        reasoningPrompt='Identify both broken alignments. Why can summing probabilities to one fail to detect swapped class names or lost observation IDs?')
    e.update(context='Independent synthetic material samples. The classes have different supports and correlated measurements; row IDs are nonconsecutive and must survive the split.',
        dictionary=[['density_g_cm3','Measured density in grams per cubic centimetre, available before identification.'],['conductivity_ms','Measured electrical conductivity in millisiemens, available before identification.'],['material','Confirmed glass, metal or polymer class.']],
        starter='# Inspect broken, then repair both row and class alignment.\n',
        hints=dict(think='Probability arithmetic can be right while its row and column labels are wrong.',
            tools='predict_proba, classes_, X_test.index and class-aligned argmax.',
            approach='Rebuild from the fitted API with the original test indices and fitted classes, then map winning column positions back to those classes.'),
        explanation='Each probability row belongs to a specific material sample and each column to a fitted class. The corrected schema recovers these meanings; class-aligned argmax then gives the corresponding prediction.')
    _check(e, 'Supplied classification recipe',
        "type(model.steps[-1][1]).__name__=='LogisticRegression' and not any(event['kind'] in ('fit','fit_transform','fit_predict') for event in trace.events) and trace.prediction_matches(answer.to_numpy(),X_test,'predict_proba')",
        'Use the supplied fitted classifier and its recorded probability call; fitting on held-away rows or inventing a probability table does not repair alignment.')

    setup = """from sklearn.model_selection import train_test_split,StratifiedKFold,cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
X=df[['queue_at_open','age_hours_at_open']]
y=df.resolution
X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
folds=StratifiedKFold(5,shuffle=True,random_state=42)
candidate=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=2000,random_state=42))])
candidate_scores=cross_validate(candidate,X_train,y_train,cv=folds,scoring='f1_macro')['test_score']
"""
    e = _replace(cr1, 3, py(
        'Repair the support-ticket reference comparison. The starter uses a random reference, three different folds and accuracy, so it cannot be paired with candidate_scores. Evaluate a most-frequent dummy using the supplied five folds and macro F1. Store its fold scores in answer and candidate-minus-reference scores in paired_gain; explain what this matched comparison establishes.',
        "answer=cross_validate(DummyClassifier(strategy='most_frequent'),X_train,y_train,cv=folds,scoring='f1_macro')['test_score']\npaired_gain=candidate_scores-answer",
        [
          dict(name='Matching observed reference scores',test="trace.validation_matches(answer,X_train,y_train,'f1_macro','DummyClassifier',folds,'most_frequent')",message='Use the most-frequent reference, supplied training population, matching five folds and macro-F1 scorer.'),
          dict(name='Paired validation improvement',test='np.asarray(paired_gain).shape==(5,) and np.allclose(paired_gain,candidate_scores-np.asarray(answer))',message='Subtract each matching reference fold score from its candidate score; do not compare unpaired summaries or final-test results.'),
        ],dataset='SUPPORT120',setup=setup,outputs=['answer','paired_gain']),
        reasoningPrompt='Quote the paired fold gains and their mean. Explain why changing the reference, folds or scorer would confound a claim about model improvement.')
    e.update(context='Independent synthetic support tickets. Opening-time queue and age predict a later late/on_time outcome; the outcome-derived flag is unavailable when the prediction must be made.',
        dictionary=[['queue_at_open','Number of waiting tickets when this ticket opens.'],['age_hours_at_open','Age in hours at the opening-time snapshot.'],['resolution','Later late or on_time classification.'],['closed_late_flag','Outcome-derived field; excluded from model inputs.']],
        starter="answer=cross_validate(DummyClassifier(strategy='stratified',random_state=42),X_train,y_train,cv=StratifiedKFold(3,shuffle=True,random_state=9),scoring='accuracy')['test_score']\npaired_gain=...\n",
        hints=dict(think='A useful comparison changes the estimator while holding the evaluation question and rows fixed.',
            tools='DummyClassifier(strategy="most_frequent"), cross_validate, the supplied folds and f1_macro.',
            approach='Repair all three differences, retain the observed five reference scores, then subtract them from candidate_scores in fold order.'),
        explanation='The training folds compare opening-time predictors against majority guessing under the same metric. closed_late_flag records the later outcome and is deliberately excluded from prediction inputs.')

    cr2 = cards['ML-C-R2']
    e = _replace(cr2, 1, decide(
        'Validation case ID 117 appears among its own nearest training neighbours: [117,81,96]. The scaler also used all rows before splitting. Which repair restores a held-away KNN evaluation?',
        ['Fit the scaler/KNN pipeline only on each training fold and query ID 117 from its validation fold',
         'Remove ID 117 from the reported neighbour list while retaining the fitted full-table scaler and KNN',
         'Keep ID 117 because its zero distance confirms a confident prediction'],0,
        'Both the fitted neighbour population and the learned scale must exclude that validation case. Removing a self-match from a report after fitting leaves the original leakage in place.'))
    e['hints']=dict(think='There are two leaked inputs: candidate neighbours and scaler statistics.',
        tools='Fold-local Pipeline fitting, row IDs and kneighbors.',
        approach='Trace which rows fitted every learned step, then distinguish a real refit from editing the reported neighbour list.')
    e = _replace(cr2, 2, decide(
        'Two separately configured binary models produce signed margins [-1.4,0.2,2.8] from decision_function and class-B probabilities [0.2,0.7,0.8] from predict_proba. Which report labels and interpretation are justified?',
        ['Label both arrays probabilities because larger values favour B',
         'Label the first decision scores and the second class-B probabilities; neither API alone establishes reliable probability estimates',
         'Convert the margins to percentages by multiplying by 100'],1,
        'A signed decision score is not a probability, as its range already shows. predict_proba has class-aligned probability semantics, while predictive performance alone does not establish the reliability of probability estimates.'))
    e['hints']=dict(think='API names and numeric ranges supply different evidence about what the arrays mean.',
        tools='decision_function, predict_proba and fitted class labels.',
        approach='Give each array its own valid heading; separate output semantics from an unsupported claim about probability reliability.')
    _teach(cr2, 'predict_proba(...) versus decision_function(...)',
        'A probability output is distinct from a signed decision score. Reliability of estimated probabilities requires comparing estimates with observed held-away outcomes; the API or a row sum of one cannot establish it.')
    setup = "from ml_helpers import OneRClassifier,OneRPreprocessor\nfrom sklearn.pipeline import Pipeline\nX=df[['distance','fragile','service_code']]\ny=df.label\n"
    e = _replace(cr2, 3, py(
        'In the stock-check review, distance is continuous, fragile is a binary category and service_code is an unordered integer category. Build and fit the One-R pipeline using those declared meanings. Return its fitted type mask in answer in distance/fragile/service_code order and its selected feature name in selected_feature. Explain why making every integer column numeric would change the model question.',
        "model=Pipeline([('prepare',OneRPreprocessor(numeric_features=['distance'],categorical_features=['fragile','service_code'])),('model',OneRClassifier(bins=5))]).fit(X,y)\nanswer=model.named_steps['model'].categorical_mask_\nselected_feature=model.named_steps['prepare'].get_feature_names_out()[model.named_steps['model'].best_feature_]",
        [
          dict(name='Declared numeric and categorical roles',test="np.array_equal(answer,[False,True,True]) and set(model.steps[0][1].numeric_features)=={'distance'} and set(model.steps[0][1].categorical_features)=={'fragile','service_code'}",message='Preserve distance as a measurement and both integer-coded fields as categories; dtype alone cannot supply these roles.'),
          dict(name='Selected rule feature',test="selected_feature==model.steps[0][1].get_feature_names_out()[model.steps[-1][1].best_feature_] and selected_feature in X.columns",message='Map the fitted selected feature position through the prepared feature-name order.'),
        ],dataset='RULE24_REVIEW',setup=setup,outputs=['answer','selected_feature']),
        reasoningPrompt='Explain why values 2, 4 and 7 do not justify service-code intervals; quote the feature selected by the fitted single-feature rule.')
    e.update(context='Independent synthetic stock checks, with unequal service-code frequencies and imperfect rules. Codes 2, 4 and 7 name services; their numeric differences have no ordered measurement meaning.',
        dictionary=[['distance','Continuous travel distance in kilometres.'],['fragile','Binary unordered flag: 0 or 1.'],['service_code','Unordered category ID: 2, 4 or 7.'],['label','Recorded audit or release outcome.']],
        hints=dict(think='A stored integer can be a measurement, a flag or an unordered category code.',
        tools='OneRPreprocessor feature declarations, Pipeline, categorical_mask_, best_feature_ and get_feature_names_out.',
        approach='Declare roles before fitting, inspect the final mask and map the selected rule position through the prepared names.'),
        explanation='The new stock-check table has unequal code frequencies and errors tied to category meanings. The metadata keeps discrete rules separate from distance intervals; One-R still selects only one feature.')
    _teach(cr2, "preprocessor.get_feature_names_out()[rule.best_feature_]",
        'best_feature_ is the selected One-R input position. get_feature_names_out() maps prepared positions back to feature names, so the rule remains interpretable when numeric columns precede encoded categories.')

    cr3 = cards['ML-C-R3']
    e = _replace(cr3, 1, decide(
        'A review has continuous lab measurements, binary ingredient-presence flags and named product attributes in three separate tables. Which set of production Naive Bayes recipes matches these meanings?',
        ['GaussianNB for measurements; BernoulliNB for flags; one-hot encoding then BernoulliNB for named attributes',
         'One GaussianNB model on arbitrary integer codes from every table',
         'BernoulliNB on unencoded names and continuous readings because all are stored in tables'],0,
        'Continuous measurements, binary evidence and encoded categories require their respective supported paths. Combining unlike likelihood meanings without a separate modelling design is unsupported.'))
    e['hints']=dict(think='Match each input meaning independently rather than treating all numeric storage alike.',
        tools='GaussianNB, BernoulliNB and fold-compatible OneHotEncoder.',
        approach='Assign the supported likelihood/encoding path to each pure-type table and check which proposed recipe violates those meanings.')
    e = _replace(cr3, 2, decide(
        'Study A has 12 observations in a rare class and 20 correlated features; its class covariance is unstable. Study B has 150 observations per class and clearly different within-class orientations. Which next experiments are defensible using training folds?',
        ['Use QDA for both because flexible models always win',
         'Try a simpler shared-shape or linear classifier for A; compare QDA for B while checking class support and validation',
         'Choose from the final-test scores because covariance assumptions cannot be validated'],1,
        'Different class shapes motivate QDA when class-specific covariance has support. A rare class with fewer observations than correlated dimensions gives unstable shape estimates; a supported simpler family is a sensible training-only experiment, with no automatic winner.'))
    e['hints']=dict(think='Geometry and available observations place different constraints on covariance modelling.',
        tools='Shared covariance, class-specific covariance, per-class support and matched training folds.',
        approach='Use each study’s shape and sample-support evidence before proposing a model comparison; reserve final-test rows.')
    e = _replace(cr3, 3, reflect(
        'A ticket tree comparison uses matching training folds: unrestricted depth train/validation macro F1=.99/.60; depth 5=.94/.75; depth 3=.85/.78. The report says, "Queue length has the largest impurity importance, so lowering queue length causes late tickets to disappear." Nominate a depth from this evidence and repair the report claim. No final-test results have been opened.',
        'Depth 3 has the best supplied validation score despite a lower training fit, so it is the evidence-supported nomination among these candidates. Queue-length importance describes impurity reductions in this fitted tree and can share credit with correlated inputs; it does not establish an intervention effect. Fit the fixed chosen recipe on training rows before one final evaluation.'))
    e['hints']=dict(think='A candidate comparison can support a complexity choice while its importance table cannot establish causation.',
        tools='Matching validation scores, training/validation gaps and impurity importance.',
        approach='Nominate from training-only validation, quote the contrasting training scores and rewrite the causal assertion as a limited model description.')

    nr1 = cards['ML-N-R1']
    e = _replace(nr1, 1, decide(
        'A diagram has three measured inputs, hidden layers of 16 then 8 units and four material classes at the output. Which sklearn configuration describes its hidden representation and task?',
        ['MLPClassifier(hidden_layer_sizes=(16,8)); output classes are learned separately',
         'MLPClassifier(hidden_layer_sizes=(3,16,8,4)); input and output counts must be hidden layers',
         'MLPRegressor(hidden_layer_sizes=(16,8)); material codes 0–3 are a continuous target'],0,
        'The tuple lists only hidden-layer widths. Classification output classes follow the fitted material labels; numeric category codes do not turn those labels into a regression quantity.'))
    e['hints']=dict(think='Input count, hidden representation and output task are separate parts of a diagram.',
        tools='hidden_layer_sizes, MLPClassifier and MLPRegressor.',
        approach='Extract only internal widths, then choose the estimator from the outcome meaning rather than its code dtype.')
    e = _replace(nr1, 2, reflect(
        'At budgets 100/200/400, run A has training loss 2.0/1.4/1.1 and validation error 2.4/1.8/1.5; run B has loss .8/.5/.3 and validation error 1.1/1.4/1.9. Which run gives evidence for testing a larger budget, and which calls for a training-only experiment that limits overfitting? Explain why the two falling loss histories need different responses.',
        'A improves both the training objective and validation evidence, so testing a larger budget on the same training validation design is defensible while inspecting convergence. B fits training rows more closely as validation error worsens, so more iterations alone have no supplied generalisation support; test an earlier stopping budget or smaller architecture on training evidence. Neither trend authorises selecting from final-test errors.'))
    e['hints']=dict(think='The direction of held-away error changes the meaning of a falling training loss.',
        tools='Loss histories, matching validation evidence, iteration budgets and hidden-layer capacity.',
        approach='Compare both sequences for each run; propose a different development experiment from the observed generalisation trend.')
    e = _replace(nr1, 3, decide(
        'A run log contains an internal stopping score, outer-fold macro F1 for two widths and one untouched final-test macro F1. Which use of the records preserves their roles?',
        ['Use internal scores to nominate a width, then search more widths if final-test macro F1 disappoints',
         'Use internal evidence to stop individual fits, outer-fold evidence to nominate a width and the final score to report the fixed choice once',
         'Pool all three score types into one mean and choose the highest'],1,
        'Stopping, candidate nomination and final reporting answer different questions. A disappointing final result can qualify the report, but reusing it to tune turns that population into development data.'))
    e['hints']=dict(think='Each evidence record authorises a particular decision, not every later action.',
        tools='Internal early stopping, outer validation and the reserved final test.',
        approach='Assign each record to its intended role, then check whether any proposed tuning follows final exposure.')

    # The checkpoint promised a context ablation but previously supplied none.
    checkpoint = cards['ML-C-K1']
    e = checkpoint['exercises'][0]
    marker = 'oof_predictions=cross_val_predict(chosen,X_train,y_train,cv=folds)'
    addition = """# Training-only measurements ablation at the selected regularisation strength.
measurement_columns=['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g']
measurement_model=Pipeline([('scale',StandardScaler()),('model',LogisticRegression(C=chosen.named_steps['model'].C,max_iter=2000,random_state=42))])
ablation_results=cross_validate(measurement_model,X_train[measurement_columns],y_train,cv=folds,scoring='f1_macro')
"""
    assert marker in e['solution']
    e['solution'] = e['solution'].replace(marker, addition + marker)
    e['outputs'].append('ablation_results')
    _check(e, 'Matching measurements-only ablation',
        "set(measurement_columns)=={'bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g'} and len(measurement_columns)==4 and trace.validation_matches(ablation_results,X_train[measurement_columns],y_train,'f1_macro','LogisticRegression',folds) and np.isfinite(ablation_results['test_score']).all() and trace.preparation_matches(measurement_model,[{'columns':['bill_length_mm','bill_depth_mm','flipper_length_mm','body_mass_g'],'operation':'scale'}]) and measurement_model.steps[-1][1].C==chosen.steps[-1][1].C",
        'Evaluate a scaled measurements-only logistic pipeline at the selected C, using identical training folds and macro F1. Report its actual fold scores before final testing.')
    e['task'] = e['task'].replace('tuning and confusion evidence.',
        'tuning, a measurements-only ablation at the selected C on identical folds, and confusion evidence. Report the ablation fold scores in ablation_results and use them to qualify reliance on island/year/sex context.')
    checkpoint['goal'] = e['task'].split(' Reserve 20%')[0]
    e['reasoningPrompt'] = 'Quote mixed-input and measurements-only training evidence. Explain whether context would be available in the intended deployment, then qualify the final-test result without revising the recipe.'
    e['packages'] = required(e)

    return registry
