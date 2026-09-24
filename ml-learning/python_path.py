"""Python-first introductions and explicit practice fading for the learning decks.

Apply after the per-activity editorial layer so new tasks carry their own help.
Existing IDs and prerequisite routes remain stable.
"""
import copy
from authoring import py
from packages import required

INTRODUCTIONS = {}

def introduce(card, task, solution, test, skill, parts, why, *, dataset='LINE24', setup=''):
    exercise = py(task, solution, test, dataset=dataset, setup=setup)
    exercise['explanation'] = why
    exercise['hints'] = dict(
        think=skill,
        tools='Use '+', '.join(code for code, _ in parts)+'. Read the visible syntax meanings before editing.',
        approach=task+' Keep the supplied row order and inspect the named output after running.')
    INTRODUCTIONS[card] = dict(exercise=exercise, skill=skill, parts=parts)

introduce('F01',
    'Store the target column name duration in target_name. Select its first five values into answer.',
    "target_name = 'duration'\nanswer = df[target_name].head()",
    "target_name == 'duration' and answer.equals(df.duration.head())",
    'Use assignment, a string and a dataframe column to turn a prediction question into Python.',
    [('target_name', 'A variable is a name for a value; = assigns the string on its right.'),
     ("'duration'", 'Quotes make a string: the exact column name holding the quantity to predict.'),
     ('df[target_name]', 'Square brackets select the column named by this variable.'),
     ('.head()', 'A dot accesses a method; parentheses call it. head shows the first five rows.')],
    'The question is to predict delivery duration. target_name stores the column label, not the values. Selecting df[target_name] returns the observed outcomes. Duration is a quantity, so this is regression. A species label would instead make it classification. Clustering and PCA do not use a prediction target.')

introduce('F06',
    'Using the supplied illustrative errors, store each model’s validation-minus-training gap in answer.',
    "errors = pd.DataFrame({'train_rmse': [1, 4], 'validation_rmse': [8, 5]}, index=['A', 'B'])\nanswer = errors['validation_rmse'] - errors['train_rmse']",
    "isinstance(answer,pd.Series) and answer.to_dict()=={'A':7,'B':1}",
    'Subtract aligned pandas columns and distinguish training error from validation error.',
    [('pd.DataFrame', 'Builds a small table from named columns and lists of their values.'),
     ("errors['validation_rmse'] - errors['train_rmse']", 'Subtracts row by row using matching model labels; a positive gap means larger validation error.')],
    'A has a gap of 7 and B a gap of 1. B also has the lower validation RMSE in this example. Training rows taught the model; validation rows ask about new examples. A gap alone does not select a model: compare the validation error itself on the same rows.')

introduce('W10',
    'Inspect the supplied fitted line. Store its fit_intercept setting and learned distance coefficient in answer.',
    "answer = {'fit_intercept': model.get_params()['fit_intercept'], 'distance_coefficient': float(model.coef_[0])}",
    "answer['fit_intercept'] is True and np.isclose(answer['distance_coefficient'], model.coef_[0])",
    'Read a dictionary setting with get_params() and a learned attribute with a trailing underscore.',
    [('model.get_params()', 'Returns constructor settings chosen before fitting; these are not learned coefficients.'),
     ("['fit_intercept']", 'Looks up the named setting in that dictionary.'),
     ('model.coef_[0]', 'Reads the first learned coefficient. The trailing underscore identifies fitted state.')],
    'fit_intercept is a setting, while coef_ is estimated from training examples. Choosing a setting, learning coefficients and evaluating fit quality are separate actions. A fitted attribute proves a fit happened, not that predictions generalise.',
    setup="from sklearn.linear_model import LinearRegression\nmodel = LinearRegression().fit(df[['distance']], df['duration'])")

introduce('W11',
    'Compare fitting a line with and without an intercept using five training folds. Store the candidate parameters and mean validation scores in answer.',
    "from sklearn.model_selection import GridSearchCV, KFold\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.pipeline import Pipeline\nmodel = Pipeline([('model', LinearRegression())])\nfolds = KFold(n_splits=5, shuffle=True, random_state=42)\nsearch = GridSearchCV(model, {'model__fit_intercept': [True, False]}, cv=folds, scoring='neg_root_mean_squared_error')\nsearch.fit(X_train, y_train)\nanswer = pd.DataFrame(search.cv_results_)[['params', 'mean_test_score']]",
    "len(answer)==2 and len(search.cv_results_['params'])==2 and set(search.param_grid['model__fit_intercept'])=={True,False} and np.allclose(answer.mean_test_score,search.cv_results_['mean_test_score'])",
    'Use a parameter dictionary and GridSearchCV to compare settings inside training folds.',
    [('GridSearchCV', 'Fits each candidate setting on the training side of each fold, compares validation scores and refits the selected candidate.'),
     ("'model__fit_intercept'", 'The double underscore addresses the setting inside the pipeline step named model.'),
     ('[True, False]', 'The two candidate values for this teaching experiment. Production linear workflows keep their defaults.'),
     ('search.cv_results_', 'The fitted search’s result dictionary; mean_test_score is validation evidence, not the sealed final test.')],
    'Each intercept choice is evaluated on identical training folds. Negative RMSE is larger when the error is smaller. The search never receives X_test or y_test. This small experiment teaches search mechanics; the playground’s linear workflow keeps its defaults.',
    setup="from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(df[['distance']], df['duration'], test_size=0.2, random_state=42)")

introduce('R11',
    'Summarise the fitted slope for distance and training R² in answer. Explain why neither establishes a causal effect.',
    "answer = pd.Series({'slope': model.coef_[0], 'training_r2': model.score(X, y)})",
    "np.isclose(answer['slope'],model.coef_[0]) and np.isclose(answer['training_r2'],model.score(X,y))",
    'Name fitted summaries in a Series and distinguish a model coefficient from a causal claim.',
    [('model.coef_[0]', 'The fitted change in prediction per one-unit increase in distance for this line.'),
     ('model.score(X, y)', 'For LinearRegression this returns R² on the supplied rows; these are training rows here.')],
    'A coefficient describes the fitted line for this dataset. Training R² describes how that line fits these seen rows. Neither controls confounders or shows what an intervention would do. Report the population and validation evidence separately from causal claims.',
    setup="from sklearn.linear_model import LinearRegression\nX = df[['distance']]\ny = df['duration']\nmodel = LinearRegression().fit(X, y)")

introduce('C19',
    'Count observations in each class and calculate the covariance of the two input measurements within class A. Store the covariance in answer.',
    "counts = df['label'].value_counts()\nclass_a = df.loc[df['label'].eq('A'), ['length', 'width']]\nanswer = class_a.cov()",
    "answer.equals(df.loc[df.label.eq('A'),['length','width']].cov())",
    'Filter by class and use cov() to inspect the covariance information available to QDA.',
    [("df['label'].eq('A')", 'Creates a Boolean mask selecting examples from one class.'),
     ('class_a.cov()', 'Returns feature-by-feature sample covariance. Its values depend on the measurement units.')],
    'QDA estimates a separate covariance structure for each class. A small class or nearly redundant measurements can make that estimate unstable. This table shows what is being estimated, not proof of stability. Use regularisation and validation; adding a parameter does not create new observations.', dataset='CLASS180')

introduce('N01',
    'Create an unfitted network with one hidden layer of 24 units. Store the hidden_layer_sizes setting in answer.',
    "from sklearn.neural_network import MLPClassifier\nmodel = MLPClassifier(hidden_layer_sizes=(24,), max_iter=500, random_state=42)\nanswer = model.get_params()['hidden_layer_sizes']",
    "answer==(24,) and not hasattr(model,'coefs_')",
    'Use a one-item tuple and keyword arguments to describe a neural-network architecture.',
    [('(24,)', 'A tuple with one item: one hidden layer containing 24 units. The comma makes it a tuple.'),
     ('MLPClassifier', 'Constructs a classifier; weights are learned only when fit is called.'),
     ("model.get_params()['hidden_layer_sizes']", 'Reads the architecture setting without fitting a network.')],
    'The tuple (24,) means one hidden layer, not 24 layers. Constructing the estimator does not train weights or produce predictions. Regression uses MLPRegressor but shares this architecture notation.')

NETWORK_SETUP="""from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(df[['length', 'width']], df['label'], test_size=0.2, random_state=42, stratify=df['label'])
model = Pipeline([('scale', StandardScaler()), ('model', MLPClassifier(hidden_layer_sizes=(8,), max_iter=150, early_stopping=True, random_state=42))])
model.fit(X_train, y_train)
network = model.named_steps['model']
"""
introduce('N02',
    'Convert the fitted network’s loss history to a Series named answer, with its index called iteration.',
    "answer = pd.Series(network.loss_curve_, name='training_loss')\nanswer.index = answer.index + 1\nanswer.index.name = 'iteration'",
    "np.allclose(answer.to_numpy(),network.loss_curve_) and answer.index.name=='iteration' and answer.index[0]==1",
    'Turn loss_curve_ into an indexed Series to inspect how optimisation changed training loss.',
    [('network.loss_curve_', 'The training objective after each optimisation iteration; these values are not final-test errors.'),
     ("pd.Series(network.loss_curve_, name='training_loss')", 'Labels the recorded sequence so its meaning is clear in the output.')],
    'Each loss value describes the training objective at one iteration. Reducing this objective guides weight updates. Falling training loss does not prove good predictions on new rows; validation evidence answers that separate question.', dataset='CLASS180', setup=NETWORK_SETUP)

introduce('N05',
    'Read the fitted iteration count and the configured iteration limit into answer.',
    "answer = {'iterations_used': network.n_iter_, 'iteration_limit': network.max_iter, 'early_stopping': network.early_stopping}",
    "answer=={'iterations_used':network.n_iter_,'iteration_limit':network.max_iter,'early_stopping':network.early_stopping}",
    'Distinguish n_iter_ (observed iterations) from max_iter (the configured upper limit).',
    [('network.n_iter_', 'The number of iterations actually performed during this fit.'),
     ('network.max_iter', 'The configured ceiling, not a guarantee that optimisation converged.'),
     ('network.early_stopping', 'Whether fitting can stop using an internal validation subset of its training rows.')],
    'Reaching the iteration limit calls for inspecting warnings and loss. Stopping earlier may reflect the stopping rule; it does not establish useful performance. Internal early stopping remains inside each training fit and cannot replace the outer validation comparison.', dataset='CLASS180', setup=NETWORK_SETUP)

introduce('N06',
    'Read the original network settings, change its hidden layers to (16, 8) and alpha to 0.01, then store the changed settings in answer.',
    "from sklearn.neural_network import MLPClassifier\nmodel = MLPClassifier(hidden_layer_sizes=(24,), alpha=0.0001, random_state=42)\nmodel.set_params(hidden_layer_sizes=(16, 8), alpha=0.01)\nanswer = {'layers': model.hidden_layer_sizes, 'alpha': model.alpha}",
    "answer=={'layers':(16,8),'alpha':0.01}",
    'Use set_params(), tuples and a float to describe capacity and regularisation before fitting.',
    [('hidden_layer_sizes=(16, 8)', 'Requests two hidden layers, with 16 units and then 8 units.'),
     ('alpha=0.01', 'Sets the L2 weight penalty; its useful value needs validation evidence.'),
     ('model.set_params', 'Changes estimator settings. Refit before evaluating the changed model.')],
    'The new tuple changes the network capacity and alpha changes the penalty on large weights. These are candidate settings, not automatic improvements. Compare candidates on the same training folds and consider convergence and cost.')

introduce('U10',
    'Join the supplied fitted group assignments back to the original measurements and store the group means in answer.',
    "labelled = X.assign(cluster=labels)\nanswer = labelled.groupby('cluster')[['length', 'width']].mean()",
    "np.allclose(answer.values,X.groupby(labels).mean().values)",
    'Use assign() and groupby() to interpret clusters in original units after fitting.',
    [('X.assign(cluster=labels)', 'Attaches the assignments to the same observations; order must stay aligned.'),
     ("groupby('cluster')", 'Groups the original measurements by their fitted assignment.'),
     ('.mean()', 'Summarises each group using the original measurement units.')],
    'The fit used measurements alone. These means describe its groups, whose numeric IDs are arbitrary. External labels may be compared afterwards, but cannot turn discovered groups into proven natural classes.', dataset='CLASS180',
    setup="from sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nX = df[['length', 'width']]\nscaled = StandardScaler().fit_transform(X)\nlabels = KMeans(n_clusters=3, n_init=20, random_state=42).fit_predict(scaled)")

introduce('P01',
    'Standardise the supplied measurements, create two PCA coordinates for every row, and store the coordinates in answer.',
    "from sklearn.preprocessing import StandardScaler\nfrom sklearn.decomposition import PCA\nX = df.select_dtypes(include='number')\nscaled = StandardScaler().fit_transform(X)\npca = PCA(n_components=2)\nanswer = pca.fit_transform(scaled)",
    "answer.shape==(len(df),2) and np.allclose(answer,pca.transform(scaled))",
    'Call fit_transform() to learn a representation and return coordinates in the new feature space.',
    [('StandardScaler().fit_transform(X)', 'Learns a common scale from the declared discovery population and transforms it.'),
     ('PCA(n_components=2)', 'Requests two new axes, each combining the original measurements.'),
     ('pca.fit_transform(scaled)', 'Learns these axes and returns two coordinates per input row; it does not select two original columns.')],
    'The output has one row per observation and two new coordinate columns. Each coordinate combines original measurements. This first two-axis picture introduces the API; later lessons use explained variance to decide how many components to retain.', dataset='PCA48')

introduce('M01',
    'Create a dictionary of candidate estimators for a numeric target: a line and a regression tree. Store their class names in answer.',
    "from sklearn.linear_model import LinearRegression\nfrom sklearn.tree import DecisionTreeRegressor\ncandidates = {'line': LinearRegression(), 'tree': DecisionTreeRegressor(random_state=42)}\nanswer = {name: type(model).__name__ for name, model in candidates.items()}",
    "answer=={'line':'LinearRegression','tree':'DecisionTreeRegressor'}",
    'Use a dictionary and comprehension to organise estimators that answer the same prediction question.',
    [('candidates.items()', 'Iterates over each candidate name and estimator together.'),
     ('type(model).__name__', 'Reads the estimator class name for the comparison inventory.')],
    'Both candidates predict a numeric outcome. The dictionary keeps their names attached to their estimator objects. Neither has been fitted or judged. Frame the task first, then compare plausible candidates using common folds and a suitable metric.')

introduce('M02',
    'Using the supplied illustrative paired fold errors, calculate tree-minus-line RMSE in each fold and store it in answer.',
    "fold_errors = pd.DataFrame({'line': [4.0, 5.0, 4.5, 5.5, 4.0], 'tree': [3.5, 4.8, 5.0, 4.9, 3.8]})\nanswer = fold_errors['tree'] - fold_errors['line']",
    "np.allclose(answer,[-.5,-.2,.5,-.6,-.2])",
    'Compare aligned fold-score columns before summarising candidate performance.',
    [("fold_errors['tree'] - fold_errors['line']", 'Subtracts errors on matching folds. A negative value favours the tree on that fold.')],
    'The tree has smaller RMSE in four of these illustrative folds but larger error in one. Pairing the evidence preserves the common evaluation population. The mean difference alone is not a universal ranking or proof of statistical significance.')

introduce('M04',
    'Compare the required feature names with a proposed incoming dataframe. Store the missing feature names in answer.',
    "required = {'distance', 'weight'}\nincoming = pd.DataFrame({'distance': [4, 7]})\nanswer = sorted(required - set(incoming.columns))",
    "answer==['weight']",
    'Use sets to check an incoming schema before calling predict().',
    [('set(incoming.columns)', 'Collects the available feature names into a set.'),
     ('required - set(incoming.columns)', 'Finds required names missing from the incoming table.'),
     ('sorted', 'Returns a reproducibly ordered list of the missing names.')],
    'The incoming table is missing weight, so it cannot support this two-feature workflow as specified. Matching names is only the first check: units, availability at prediction time and the population must also match the intended use.')

def apply(registry):
    for card in registry['cards']:
        if card['kind'] != 'teaching':
            continue
        short = card['id'].removeprefix('ML-')
        intro = INTRODUCTIONS.get(short)
        if intro:
            old = card['exercises'][0]
            exercise = copy.deepcopy(intro['exercise'])
            exercise.update(id=old['id'], version=old.get('version', 1)+1)
            card['exercises'][0] = exercise
            card['syntaxBreakdown'] = [dict(code=code, meaning=meaning) for code, meaning in intro['parts']]
            card['syntax'] = '\n'.join(code for code, _ in intro['parts'])
            card['pythonSkill'] = intro['skill']
            card['example'] = exercise['solution']
        elif card['exercises'][0]['kind'] != 'python':
            # Introduce the API before asking the learner to interpret it.
            first_python = next(i for i, e in enumerate(card['exercises']) if e['kind'] == 'python')
            card['exercises'][0], card['exercises'][first_python] = card['exercises'][first_python], card['exercises'][0]
        for i, exercise in enumerate(card['exercises']):
            exercise['id'] = card['id']+'-'+str(i+1)
            exercise['label'] = 'Follow' if i == 0 else 'Change' if i == 1 else 'Transfer' if i == len(card['exercises'])-1 else 'Practise'
            exercise['demand'] = ('Read and run the Python' if i == 0 else 'Adapt the Python' if exercise['kind'] == 'python' else 'Explain the Python result' if exercise['kind'] == 'reflection' else 'Reason about the Python')
            if exercise['kind'] == 'python':
                exercise['packages'] = required(exercise)
                if i == 0:
                    exercise['starter'] = exercise['solution']
        card.setdefault('pythonSkill', card['syntaxBreakdown'][0]['meaning'])
    return registry
