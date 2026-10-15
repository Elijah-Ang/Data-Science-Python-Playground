"""Final curriculum teaching contracts shared by Learn and Refresh.

Authored origins describe progression; source inspection associates that declared
meaning with the activity that actually uses it. Inspect setup and learner code
separately: the presence of an API in supplied state does not introduce it.
"""
import ast
import copy
import re

# Explicit concept origins, rather than sorting IDs or scanning prose for first use.
# Purpose, accepted forms, useful values and a concrete example accompany each
# first introduction. Later activities receive the same full reference on demand.
CONCEPTS = {}
def concept(key, origin, label, match, code, meaning, choices, example):
    CONCEPTS[key] = dict(id=key, lesson='ML-'+origin, title=label, match=match,
        code=code, meaning=meaning, choices=choices, example=example)

concept('assignment','F01','Names, assignment and exact column labels',r'\btarget_name\b',
    "target_name = 'duration'", 'Assignment stores a value under a Python name. Quotes identify a literal string, while df[target_name] selects the column whose exact name the string contains.',
    'Choose a descriptive variable name. A column label must match its spelling and case; a label string is different from the column values.', "target_name = 'duration'\nanswer = df[target_name].head()")
concept('features-target','F02','Features and target',r'\bX\b|\by\b', "X = df[['distance']]\ny = df['duration']",
    'X is a two-dimensional feature table and y is one aligned target value per row. Include inputs available at prediction time; the later outcome belongs in y.',
    'A list of column labels preserves a DataFrame even for one feature. One target label selects a Series. Preserve row indices and feature order.', "X = df[['distance', 'weight']]\ny = df['duration']")
concept('fit','F03','Construct, fit, then predict',r'\.fit\(', 'model = LinearRegression()\nmodel.fit(X, y)',
    'The constructor creates an unfitted recipe. fit learns parameters from feature rows and aligned known outcomes; it changes the fitted object.',
    'Use a two-dimensional X and one target per row. Call fit only on the declared fitting population; a successful fit is not generalisation evidence.', 'model.fit(X_train, y_train)')
concept('predict','F04','Predict without fitting again',r'\.predict\(', 'predictions = model.predict(X_test)',
    'predict uses already learned parameters to return one output per input row. It does not learn from incoming rows.',
    'Keep the fitting feature names, order and measurement units. Classification returns labels; regression returns quantities.', "new_rows = pd.DataFrame({'distance': [4, 7]})\npredictions = model.predict(new_rows)")
concept('rmse','F05','Root mean squared error',r'root_mean_squared_error|mean_squared_error', 'root_mean_squared_error(actual, predicted)',
    'RMSE squares each aligned error, averages the squares and takes the square root. Larger misses have more influence and the result retains the target unit.',
    'Inputs are matching actual/predicted rows. RMSE is nonnegative; smaller means less error. A single error summary can hide systematic failures.', 'actual = np.array([10, 20])\npredicted = np.array([12, 18])\n# RMSE is 2 minutes if actual measures minutes.')
concept('split','F07','Reserve the final test',r'train_test_split', 'X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)',
    'Split features and targets together before model decisions. Training rows support inspection, validation and fitting; reserved final rows evaluate the fixed recipe once.',
    'test_size accepts a fraction or row count. random_state fixes reproducible random choices, not representativeness. Independent rows permit shuffling; times or repeated entities need a different boundary.', '# On 24 independent rows, test_size=0.2 reserves 5 rows.\n# A reproducible split can still be inappropriate for a forecasting question.')
concept('stratify','F09','Preserve class representation',r'stratify\s*=|StratifiedKFold', 'train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)',
    'stratify uses the aligned labels to approximately preserve class proportions in random partitions. StratifiedKFold applies the same principle within training validation.',
    'Supply one class label per input row. Rare classes still need enough independent examples for every requested partition; stratification cannot create observations.', '# 63 routine, 18 watch, 9 urgent rows yield roughly proportional holdouts.\n# Inspect absolute minority counts as well as percentages.')
concept('pipeline','F11','Keep preparation and model together',r'\bPipeline\(', "Pipeline([('prepare', 'passthrough'), ('model', LinearRegression())])",
    'Pipeline applies named steps in order and keeps learned preparation attached to the estimator. Each validation fit learns preparation only from that fold’s fitting rows.',
    'Use a list of (name, step) pairs. All intermediate steps transform; the last predicts. The string passthrough leaves values unchanged. Names also form step__parameter paths.', "model = Pipeline([('prepare', 'passthrough'), ('model', LinearRegression())])\nmodel.fit(X_train, y_train)")
concept('baseline','F11','Compare a reference that ignores features',r'DummyRegressor|DummyClassifier', "DummyRegressor(strategy='mean')",
    'A dummy shows what can be achieved without using X. Fit and score the reference on the same training folds and metric as the candidate before claiming useful improvement.',
    'For a quantity, strategy=mean predicts the fitting-target mean. For labels, strategy=most_frequent predicts the fitting population’s majority class. Each fold learns its own reference.', "reference = DummyRegressor(strategy='mean')\nreference_results = cross_validate(reference, X_train, y_train, cv=folds, scoring=metric)")
concept('folds','F11','Training folds, separate from the final test',r'\bKFold\(|\bStratifiedKFold\(', 'KFold(n_splits=3, shuffle=True, random_state=42)',
    'Each fold holds away training rows while a fresh copy fits the rest. Every row contributes held-away validation evidence; the reserved final test stays outside all folds.',
    'n_splits is an integer at least 2 and no larger than the fitting population. These small complete workflows use 3 folds; parameter investigations use 5. Reuse the same folds across comparisons, and stratify class tasks.', 'folds = KFold(n_splits=3, shuffle=True, random_state=42)')
concept('cross-validation','F11','Observe comparable validation scores',r'cross_validate\(', 'cross_validate(model, X_train, y_train, cv=folds, scoring=metric)',
    'cross_validate fits independent copies within each training fold and returns score arrays. The result key test_score means fold-validation scores, not the reserved final test.',
    'cv accepts a splitter or explicit index pairs. scoring names the question: neg_root_mean_squared_error is larger nearer zero; f1_macro is larger nearer one. Negate negative-error scores to describe positive errors.', "cv_results = cross_validate(model, X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')\nprint(-cv_results['test_score'])")
concept('oof','F11','Inspect held-away training predictions',r'cross_val_predict\(', 'cross_val_predict(model, X_train, y_train, cv=folds)',
    'cross_val_predict restores one held-away prediction per training row. Each prediction comes from a fit that excluded that row, so residuals and class errors can guide diagnosis without opening final rows.',
    'Use partitioning folds with exactly one validation prediction per row. method defaults to predict; predict_proba needs a classifier supporting probabilities. Forward time blocks require explicit last-block diagnosis instead.', 'diagnostic_predictions = cross_val_predict(model, X_train, y_train, cv=folds)\nresiduals = y_train - diagnostic_predictions')
concept('clone','F11','Fit the fixed recipe after selection',r'clone\(', 'final_model = clone(chosen).fit(X_train, y_train)',
    'clone copies estimator settings and discards fitted state. Once validation and diagnosis settle the recipe, fit that fresh copy on all training rows and evaluate saved predictions once.',
    'Pass an sklearn estimator or Pipeline. Cloning does not improve the model or create independent data; avoid tuning after final evidence is exposed.', 'final_model = clone(candidates[chosen_name]).fit(X_train, y_train)\nfinal_predictions = final_model.predict(X_test)')
concept('scale','F12','Learn an input coordinate system',r'StandardScaler\(', 'StandardScaler()',
    'A feature scaler learns each fitting column’s mean and standard deviation, then expresses values relative to that fitted coordinate system. Put it inside the Pipeline so folds learn independent statistics.',
    'StandardScaler defaults to centring and unit variance. fit learns; transform reuses. A test row must not change the scale. Scaling changes coordinates, not scientific measurement compatibility.', "model = Pipeline([('prepare', StandardScaler()), ('model', LogisticRegression())])")
concept('macro-f1','F12','Equal class weight in evaluation',r'f1_score|f1_macro', "f1_score(y_test, predictions, average='macro')",
    'F1 combines precision and recall within each class; macro averages class F1 values equally. It keeps rare-class failures visible even when overall accuracy appears high.',
    'average=macro gives each class equal weight; micro pools decisions and weighted uses class support. Macro F1 ranges from 0 to 1; report the class errors alongside it.', "metric = 'f1_macro'\n# cross_validate reports one macro F1 per held-away training fold.")
concept('mae','F11','Typical absolute error',r'mean_absolute_error|neg_mean_absolute_error', 'mean_absolute_error(actual, predicted)',
    'MAE averages the magnitude of aligned errors, giving each extra target-unit miss the same weight. It answers a different error-cost question from RMSE.',
    'MAE is nonnegative and retains the target unit. The sklearn scorer is neg_mean_absolute_error so larger validation scores mean smaller error.', '# Errors of 1 and 3 minutes have MAE 2 minutes; RMSE is about 2.24 minutes.')
concept('balanced-accuracy','F12','Average recall across classes',r'balanced_accuracy', 'balanced_accuracy_score(actual, predicted)',
    'Balanced accuracy averages the fraction of each class correctly recovered. Every class has equal weight; precision of an alert is a separate question.',
    'The sklearn scoring string is balanced_accuracy. Higher is better; an always-majority classifier does not earn a high score merely from a large majority class.', '# Per-class recalls 1.0 and 0.0 have balanced accuracy 0.5.')
concept('encoding','W04','Learn indicator columns',r'OneHotEncoder\(', "OneHotEncoder(handle_unknown='ignore', sparse_output=False)",
    'OneHotEncoder learns category indicators from fitting rows. Named categories receive separate columns, without an invented numeric ordering.',
    'handle_unknown=ignore creates a zero block for unseen categories. sparse_output=False returns a dense array for these small lessons. drop=first omits a reference category when needed for coefficient interpretation.', "encoder.fit(training_categories)\nnames = encoder.get_feature_names_out()")
concept('columns','W05','Prepare column groups',r'ColumnTransformer\(', 'ColumnTransformer([...])',
    'ColumnTransformer sends explicitly selected column groups through different preparation recipes, then joins their transformed columns in declared order.',
    'Each item is (name, transformer, columns). A string selects one column; a list selects a table. passthrough retains declared flags. Unlisted columns are dropped unless remainder is configured.', "prepare = ColumnTransformer([('numeric', StandardScaler(), ['length']), ('flags', 'passthrough', ['fragile'])])")
concept('impute','W07','Learn replacement values',r'SimpleImputer\(', "SimpleImputer(strategy='median')",
    'An imputer learns replacement values from fitting rows, then applies that learned rule where incoming values are missing. It does not recover the unobserved truth.',
    'median is suitable for numeric examples; most_frequent can serve categorical values and constant uses a declared fill_value. Keep this learning inside each validation fit.', "Pipeline([('impute', SimpleImputer(strategy='median')), ('model', LinearRegression())])")
concept('search','W11','Compare settings on training evidence',r'GridSearchCV\(', 'GridSearchCV(model, parameter_grid, cv=folds, scoring=metric)',
    'GridSearchCV fits each candidate setting within training folds, compares the observed validation scores and, by default, refits the best setting on the supplied training population.',
    'The grid maps exact parameter names to lists of candidates. Pipeline paths use step__parameter. cv and scoring must match the comparison; cv_results_ stores evidence and best_estimator_ the refitted choice.', "parameter_grid = {'model__C': [0.1, 1, 10]}\nsearch.fit(X_train, y_train)")
concept('pipeline-internals','C08','Inspect fitted pipeline steps',r'named_steps', "model.named_steps['prepare']",
    'named_steps maps the authored step names to their fitted objects. Ordinary Pipeline.predict runs preparation automatically; a diagnostic method on a contained estimator may require a manually prepared query.',
    'Use the actual step keys. Access does not refit. Transform a query with the already fitted preparation before asking the contained distance model to inspect it.', "prepared_query = model.named_steps['prepare'].transform(query)\npositions = model.named_steps['model'].kneighbors(prepared_query, return_distance=False)")
concept('neighbours','C08','Retrieve and count neighbour votes',r'kneighbors|vote_counts|reindex', 'kneighbors(prepared_query, return_distance=False)',
    'kneighbors returns positions in the fitted training table. Those positions select training labels whose votes determine the prediction; they are not positions in the test table.',
    'n_neighbors is a positive integer no larger than the fitted row count. return_distance=False returns positions only. value_counts counts labels; reindex(classes_, fill_value=0) retains zero-vote classes.', "positions = model.named_steps['model'].kneighbors(prepared_query, return_distance=False)[0]\nvote_counts = y_train.iloc[positions].value_counts().reindex(model.classes_, fill_value=0)")
concept('lda-deeper','C17','Deeper investigation: affine LDA scores',r'midpoint|endpoint_scores|to_frame', 'midpoint = (probe.iloc[0] + probe.iloc[1]) / 2',
    'For binary LDA with shared covariance, the signed log-odds score is affine: a feature midpoint has the average endpoint score. This identity does not apply to the nonlinear conversion into probabilities.',
    'Average each input coordinate, then score the new row. iloc returns a feature-labelled Series; to_frame().T creates a one-row DataFrame with the original feature names.', 'midpoint_score = model.decision_function(midpoint.to_frame().T)[0]\ngap = midpoint_score - np.mean(endpoint_scores)')
concept('target-transform','N04','Separate input and target transformations',r'TransformedTargetRegressor|transformer_', 'TransformedTargetRegressor(regressor=MLPRegressor(...), transformer=StandardScaler())',
    'The outer feature scaler transforms X. The target wrapper learns a separate scale from fitting y, trains the regressor in that target space, and automatically reverses the target transformation during predict.',
    'transformer acts on the target; regressor names the prediction recipe. Keep both transformations within every fit. Wine predictions return quality-score points; household predictions return kWh. Compare actual and predicted values in the same named unit.', "predictions = model.predict(X_test)\n# The full Pipeline has already restored the target unit.\n# Do not standardise y_test before calculating original-unit RMSE.")
concept('clusters','U03','Fit groups without an outcome',r'KMeans\(|fit_predict', 'KMeans(n_clusters=3, n_init=20, random_state=42)',
    'K-Means learns centres from a declared measurement population and assigns each row to its nearest centre in prepared coordinates. There is no known outcome y to predict.',
    'n_clusters sets a positive group count; n_init=20 tries twenty initialisations. Scaling defines the distance. Group IDs are arbitrary and silhouette measures geometry, not truth.', 'labels = model.fit_predict(scaled)\nprofiles = X.groupby(labels).mean()')
concept('pca','P01','Learn new coordinates without a target',r'PCA\(', 'PCA(n_components=2)',
    'PCA learns orthogonal weighted combinations of measurements. transform projects each row onto the fitted axes; the resulting columns are new coordinates rather than selected original features.',
    'An integer n_components requests that many axes; no argument retains all available axes. Fit scale and axes on the declared discovery population. Explained variance describes retained variation, not prediction accuracy.', 'pca = PCA(n_components=2)\nscores = pca.fit_transform(scaled)')

concept('knn','C08','Choose the neighbourhood size',r'KNeighborsClassifier\(', 'KNeighborsClassifier(n_neighbors=3)',
    'KNN stores fitted training examples. For an incoming row, it finds nearby training measurements and lets their labels vote. Changing k changes how local and sensitive that decision is.',
    'n_neighbors is a positive integer no larger than the fitting-row count; the sklearn default is 5. The first example deliberately uses 3. Small k can follow noise; larger k pools a wider region. Choose using training validation with fold-local scaling.',
    "model = Pipeline([('prepare', StandardScaler()), ('model', KNeighborsClassifier(n_neighbors=3))])\nmodel.fit(X_train, y_train)\nanswer = model.predict(X_test.iloc[:1])")
concept('tree','C14','Limit classification-tree complexity',r'DecisionTreeClassifier\(', 'DecisionTreeClassifier(max_depth=3, random_state=42)',
    'A classification tree learns threshold questions that separate training class counts. A leaf predicts a class from the observations reaching it; the same fit/predict interface is retained.',
    'max_depth is a positive integer or None (the default, without this cap). min_samples_leaf is a positive count or a fitting-row fraction. More depth or smaller leaves permits finer fits and can overfit; validate before opening final rows. Scaling is unnecessary for these thresholds.',
    "model = Pipeline([('prepare', 'passthrough'), ('model', DecisionTreeClassifier(max_depth=3, random_state=42))])")
concept('svm','C10','Margins and nonlinear kernels',r'SVC\(|n_support_|decision_function', "SVC(kernel='rbf', C=1.0, gamma='scale')",
    'Support vectors influence the fitted margin. A linear kernel gives a straight boundary; an RBF kernel allows a curved boundary in the original measurements. Decision scores are not probabilities.',
    'kernel accepts named choices such as linear and rbf (the default). C must be positive; larger values penalise margin violations more strongly. gamma=scale uses fitted feature variation; a positive numeric gamma sets locality explicitly. Keep scaling and parameter selection within training folds.',
    "model = Pipeline([('prepare', StandardScaler()), ('model', SVC(kernel='rbf', C=1.0))])\n# Only preparation and estimator definition change from the tree workflow.")
concept('logistic','F12','A scaled linear classifier',r'LogisticRegression\(', 'LogisticRegression(max_iter=1000)',
    'Logistic regression predicts class labels from a linear score and associated class probabilities. It is a classifier despite its name; input scaling makes regularisation comparable across measurement units.',
    'C is a positive inverse regularisation strength, default 1.0; smaller values penalise coefficients more strongly. max_iter is a positive optimisation limit, not a convergence guarantee. Choose settings on training folds and inspect class-specific errors.',
    "model = Pipeline([('prepare', StandardScaler()), ('model', LogisticRegression(max_iter=1000))])")
concept('lda','C17','Class means and shared covariance',r'LinearDiscriminantAnalysis|means_', "LinearDiscriminantAnalysis(solver='lsqr', shrinkage='auto')",
    'LDA estimates a mean for each class and one shared within-class covariance shape. This gives linear class boundaries; compare the class spreads before assuming the simplification suits the data.',
    'solver=svd is the sklearn default. The authored lsqr path supports shrinkage: None uses the covariance estimate directly, auto estimates shrinkage, and a number from 0 to 1 sets its strength. Use matching training folds to investigate choices.',
    'answer = pd.DataFrame(model.means_, index=model.classes_, columns=X_train.columns)')
concept('qda','C18','Separate class covariance',r'QuadraticDiscriminantAnalysis', 'QuadraticDiscriminantAnalysis(reg_param=0.1)',
    'QDA fits a separate covariance shape for each class, allowing curved boundaries. More flexible covariance estimates need sufficient class observations and can become unstable with redundant measurements.',
    'reg_param is between 0 and 1, default 0. A positive value regularises the covariance toward a diagonal identity contribution. This lesson requires positive regularisation; judge it using training validation, not final-test performance.',
    'model = QuadraticDiscriminantAnalysis(reg_param=0.1)\nmodel.fit(X_train, y_train)')
concept('neural','N01','Describe hidden layers before fitting',r'MLPClassifier|MLPRegressor|hidden_layer_sizes', 'MLPClassifier(hidden_layer_sizes=(24,), max_iter=500, random_state=42)',
    'A hidden-layer tuple gives the number of units in each successive layer. Constructing the network configures its architecture; fit learns its weights from scaled fitting measurements.',
    'The one-item tuple (24,) means one layer of 24 units; (16, 8) means two layers. max_iter caps optimisation. alpha is a nonnegative weight penalty; convergence and validation evidence both matter. Classification and regression share architecture notation but use different outputs and metrics.',
    'model = MLPClassifier(hidden_layer_sizes=(24,), max_iter=500, random_state=42)\n# The constructor has not learned weights yet.')
concept('polynomial','R07','Add powers and interactions',r'PolynomialFeatures', 'PolynomialFeatures(degree=2, include_bias=False)',
    'PolynomialFeatures transforms the existing measurements into powers and interactions, while the prediction recipe still uses the familiar fitting and validation workflow.',
    'degree is a nonnegative integer; the default is 2. include_bias=False omits the all-ones feature when the later estimator supplies an intercept. Greater degree adds flexibility and terms; use matching training folds and inspect extrapolation risk.',
    "model = Pipeline([('polynomial', PolynomialFeatures(degree=2, include_bias=False)), ('prepare', StandardScaler()), ('model', Ridge(alpha=1.0))])")
concept('ridge','R07','Regularise the expanded model',r'\bRidge\(', 'Ridge(alpha=1.0)',
    'Ridge fits a linear prediction rule with a penalty on squared coefficients. PolynomialFeatures supplies its curved input terms; scaling those terms makes their penalties comparable.',
    'alpha is a nonnegative number, with default 1.0. Try 0.1, 1.0 or 10.0: larger values penalise large coefficients more strongly. Choose using training validation, not the final test.',
    "model = Pipeline([('powers', PolynomialFeatures(degree=2, include_bias=False)), ('prepare', StandardScaler()), ('model', Ridge(alpha=1.0))])")
concept('ward','U07','Build a Ward hierarchy',r'linkage\(', "linkage(scaled, method='ward')",
    'Ward linkage repeatedly merges groups to minimise the increase in within-group squared distance. The stored hierarchy records the merge order and heights; it does not predict a target.',
    'Use Euclidean measurement geometry for Ward. method=ward chooses this merge rule; other methods use different distances between groups. Sampling and scale change the represented population and merges.',
    "linkage_matrix = linkage(scaled, method='ward')")
concept('hierarchy-cut','U08','Read groups from a stored hierarchy',r'cut_tree|\.ravel\(', 'cut_tree(linkage_matrix, n_clusters=3).ravel()',
    'cut_tree reads group assignments from the previously fitted hierarchy. It returns one label per observation in the original input order; changing the cut does not refit the merges.',
    'n_clusters is a positive integer no larger than the number of observations. cut_tree returns a one-column array; ravel turns it into the one-dimensional label array used to group the original rows.',
    'labels = cut_tree(linkage_matrix, n_clusters=3).ravel()')
concept('candidate-comparison','W16','Repeat a comparison across named candidates',r'for name, candidate in candidates\.items\(\)|key=lambda',
    "cv_results = {name: cross_validate(candidate, X_train, y_train, cv=folds, scoring=metric) for name, candidate in candidates.items()}",
    'The dictionary comprehension repeats the same validation operation for each named recipe. items() supplies each name and estimator together; the result keeps the scores under that name.',
    'max(cv_results, key=lambda name: cv_results[name]["test_score"].mean()) returns the name with the largest mean score. lambda defines this small scoring rule. Negative-error scorers also use larger-is-better; close scores still need judgement.',
    "chosen_name = max(cv_results, key=lambda name: cv_results[name]['test_score'].mean())")

# Explicit extensions retain the first introduction on each intended pathway.
AUTHORED_EXTENDS={'W03':['Input scaling and training boundaries'],'W08':['Stratified training folds'],'W09':['Score direction and returned evidence'],'W12':['Training-only class-error diagnosis'],'W14':['Forward validation for chronological observations'],'C05':['Class-labelled coefficients and probabilities'],'C08':['Distance queries through fitted pipeline steps'],'C17':['Affine scores and midpoint identities'],'N04':['Input versus target transformations'],'P04':['Variance-based dimension retention']}
FAMILIAR_PARTS={'Pipeline':'pipeline','cross_validate':'cross-validation','cross_val_predict':'oof','clone':'clone','test_score':'cross-validation','neg_root_mean_squared_error':'cross-validation','neg_mean_absolute_error':'mae','f1_macro':'macro-f1','balanced_accuracy':'balanced-accuracy','StandardScaler':'scale','KNeighborsClassifier':'knn','n_neighbors':'knn','DecisionTreeClassifier':'tree','SVC':'svm','LinearDiscriminantAnalysis':'lda','QuadraticDiscriminantAnalysis':'qda','PolynomialFeatures':'polynomial','TransformedTargetRegressor':'target-transform'}
FAMILIAR_PARTS.update({'DummyRegressor':'baseline','DummyClassifier':'baseline','random_state':'split','train_test_split':'split','test_size':'split','stratify':'stratify','n_splits':'folds','shuffle':'folds','scoring':'cross-validation','model.predict':'predict','model.fit':'fit','mean_absolute_error':'mae','root_mean_squared_error':'rmse','named_steps':'pipeline-internals'})

MODEL_DIFFERENCES={
 'simple_linear':('A straight-line estimator','A line uses slopes and an intercept; original numeric units can pass through.'),
 'multiple_linear':('Several available input columns','Each slope is conditional on the other declared measurements.'),
 'polynomial':('PolynomialFeatures and fold-local scaling before a regularised linear estimator','The feature expansion changes flexibility; scaling makes the regularisation comparable. Choose using training-validation evidence.'),
 'regression_tree':('A regression tree and passthrough preparation','Threshold comparisons do not require input scaling; leaves predict target averages.'),
 'logistic':('StandardScaler and LogisticRegression','Scaling keeps coefficient regularisation comparable across units; outputs are class labels.'),
 'knn_cls':('StandardScaler and KNeighborsClassifier','The fitted coordinate system determines which training rows are nearby.'),
 'svm_cls':('StandardScaler and SVC(kernel="rbf")','Kernel geometry requires comparable feature units and can produce a curved boundary.'),
 'one_r':('OneRPreprocessor and OneRClassifier','Numeric bins and category roles belong inside each fit; one winning feature defines the rule.'),
 'classification_tree':('DecisionTreeClassifier and passthrough preparation','Threshold splits require no numeric scaling; a leaf chooses from its class evidence.'),
 'naive_bayes':('GaussianNB with passthrough for continuous measurements','The likelihood assumption must match continuous measurements; binary flags require a different recipe.'),
 'lda':('LinearDiscriminantAnalysis with shared covariance','Classes share within-class shape, yielding linear boundaries.'),
 'qda':('QuadraticDiscriminantAnalysis with positive regularisation','Separate class covariance adds flexibility and estimation demands.'),
 'mlp_cls':('StandardScaler and MLPClassifier','Hidden layers learn nonlinear class evidence; inspect convergence as well as validation.'),
 'mlp_reg':('Input scaling and a separate target wrapper around MLPRegressor','Target scaling belongs inside each fit, and predict restores the named target unit.'),
}

TREE_SVM_COMPARISON=dict(dataset='CLASS180',same='Use the same measured specimens, X/y, protected split, training folds, baseline and final prediction sequence.',why='The tree compares thresholds in original coordinates. SVM learns a scaled distance geometry and an RBF kernel; the surrounding validation boundaries stay familiar.',examples=[
    dict(name='Classification tree',code="model = Pipeline([\n    ('prepare', 'passthrough'),\n    ('model', DecisionTreeClassifier(\n        max_depth=3, random_state=42\n    )),\n])",changedLines=[2,3,4]),
    dict(name='Support vector classifier',code="model = Pipeline([\n    ('prepare', StandardScaler()),\n    ('model', SVC(\n        kernel='rbf', C=1.0\n    )),\n])",changedLines=[2,3,4]),
])

WORKFLOW = [
 ('Define the question and X/y','What must be known when a prediction is made?','Select available input measurements and an aligned later outcome.'),
 ('Reserve the final test','Which rows will evaluate the fixed recipe?','Split X and y together; keep reserved rows outside decisions and fitting.'),
 ('Inspect training rows','What quality and feature structure do the fitting rows contain?','Inspect training summaries, missingness and class counts without using final rows.'),
 ('Define preparation and model','What changes in this model recipe?','Keep learned preparation with the estimator in a named Pipeline; passthrough makes no transformation.'),
 ('Validate against a baseline','Does the candidate improve on ignoring features?','Compare observed scores on the same training folds and metric.'),
 ('Select and diagnose','What do held-away training errors reveal?','Use training validation to select; inspect out-of-fold residuals or class errors.'),
 ('Fit and evaluate once','How does the fixed recipe perform on reserved rows?','Fit all training rows, save final predictions once, and calculate the matching metric.'),
 ('Explain the result','What does this evidence support and limit?','Name the target unit or classes, error costs, comparison and population limits.'),
]
DISCOVERY = ['Select measurements','Prepare','Fit representation or grouping','Inspect results','Interpret limitations']

MODEL_NEW = {
 'R01':['A fitted slope and intercept'], 'R04':['Several conditional slopes'], 'R07':['Polynomial powers and interactions'], 'R09':['Thresholds and leaf-average predictions'],
 'C05':['Linear scores and class probabilities'], 'C06':['Logistic regularisation choices'], 'C08':['Nearby training labels vote'], 'C10':['Margins and support vectors'],
 'C12':['One-feature rules and unknown-value fallback'], 'C14':['Threshold conditions and class-count leaves'], 'C15':['Class likelihoods and conditional independence'],
 'C17':['Class means with shared covariance'], 'C18':['Separate class covariance and regularisation'], 'N01':['Hidden-layer architecture'], 'N03':['Neural class outputs and convergence'],
 'N04':['Separate input and target scaling with inverse-transformed predictions'], 'U03':['Centroid assignments without a target'], 'U07':['Ward merge geometry and cuts'], 'P01':['New continuous component coordinates'],
}

ACTIVITY_TEACHING = {
 'ML-C08-2': ['pipeline-internals','neighbours'],
 'ML-C17-3': ['lda-deeper'],
}
MODEL_FIRST={'C10':'svm','C17':'lda','N04':'target-transform','U07':'ward'}


def _bindings(source):
    result={}
    if not source.strip(): return result
    for statement in ast.parse(source).body:
        for node in ast.walk(statement):
            if isinstance(node,(ast.Assign,ast.AnnAssign)):
                targets=node.targets if isinstance(node,ast.Assign) else [node.target]
                for target in targets:
                    for name in ast.walk(target):
                        if isinstance(name,ast.Name) and isinstance(name.ctx,ast.Store):result[name.id]=statement
    return result


def _used(source, item):
    # Import declarations are not required use; the activity's operations are.
    source='\n'.join(line for line in source.splitlines() if not line.startswith(('from ','import ','#')))
    return bool(re.search(item['match'],source))


def _guide(item):
    return {k:item[k] for k in ('id','lesson','title','code','meaning','choices','example')}


def _sections(exercise):
    source=exercise.get('solution','')
    marks=list(re.finditer(r'^# ([1-8])\. (.*)$',source,re.M))
    if len(marks)==8 and [int(m.group(1)) for m in marks]==list(range(1,9)):
        return [dict(number=i+1,title=WORKFLOW[i][0],question=WORKFLOW[i][1],meaning=WORKFLOW[i][2],
                     code=source[m.end()+1:(marks[i+1].start() if i+1<len(marks) else len(source))].strip()) for i,m in enumerate(marks)]
    return []


def _supply(exercise, meanings):
    setup=exercise.get('setup',''); bindings=_bindings(setup)
    supplied=[dict(name='df',description='The '+str(exercise.get('dataset','declared'))+' input DataFrame, supplied afresh for each Run.',fitted=False,training=None,code=None)] if exercise.get('preload',True) else []
    state={}
    for name,statement in bindings.items():
        calls=[n for n in ast.walk(statement) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='fit']
        # A fit_transform/fit_predict result is data, not a fitted estimator.
        # Their receiver still learns state, including when the call's result is
        # assigned to another variable rather than discarded as an expression.
        calls.extend(n for n in ast.walk(ast.parse(setup)) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and isinstance(n.func.value,ast.Name) and n.func.value.id==name and n.func.attr in ('fit','fit_transform','fit_predict'))
        fit=next((c for c in calls if isinstance(c.func,ast.Attribute) and c.func.attr=='fit'),calls[0] if calls else None)
        training=', '.join(ast.unparse(arg) for arg in fit.args[:2]) if fit else None
        # A fitted step retrieved from a supplied fitted pipeline carries that
        # same fitting provenance. It is not an unfitted constructor.
        value=statement.value if isinstance(statement,(ast.Assign,ast.AnnAssign)) else None
        # Propagate fitted state through object/step aliases, not through new
        # constructors, clone() or numerical calculations using a fitted object.
        alias=value is not None and isinstance(value,(ast.Name,ast.Attribute,ast.Subscript))
        inherited=next((state[n.id] for n in ast.walk(value) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Load) and n.id in state and state[n.id]['fitted']),None) if alias else None
        fitted=bool(fit) or bool(inherited)
        if inherited and not training:training=inherited['training']
        description=meanings.get(name,'Supplied '+name+'; its definition below specifies the values and role.')
        if fitted:description='Already fitted on '+str(training)+'. '+description
        # A declared constructor is an unfitted recipe, not a trained model.
        if name in ('model','network','classifier','pca','scaler') and not fitted:description='An unfitted recipe is supplied; construction has not learned parameters. Fit it here only when the task requests fitting.'
        if name=='scaler' and fitted:description='Already fitted coordinate system learned from '+str(training)+'; transform reuses its statistics without fitting again.'
        entry=dict(name=name,description=description,fitted=fitted,training=training,code=ast.unparse(statement))
        supplied.append(entry);state[name]=entry
    # Pipeline.fit operates on its supplied step objects. A separately named
    # transformer passed as a step therefore receives the parent's fitted state,
    # even when no standalone prepare.fit(...) call appears in authored setup.
    # Searches and target wrappers clone their estimators; do not apply this
    # propagation to arbitrary constructors containing a fitted object.
    for parent,statement in bindings.items():
        parent_state=state[parent]
        if not parent_state['fitted']:continue
        pipelines=[node for node in ast.walk(statement) if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=='Pipeline']
        for pipeline in pipelines:
            if not pipeline.args or not isinstance(pipeline.args[0],(ast.List,ast.Tuple)):continue
            for step in pipeline.args[0].elts:
                if not isinstance(step,(ast.List,ast.Tuple)) or len(step.elts)!=2:continue
                transformer=step.elts[1]
                if isinstance(transformer,ast.Name) and transformer.id in state:
                    item=state[transformer.id]
                    if not item['fitted']:
                        item.update(fitted=True,training=parent_state['training'])
                        item['description']='Already fitted on '+str(item['training'])+' as part of '+parent+'. '+item['description']
    exercise['suppliedState']=supplied
    exercise['providedObjects']=[s['name'] for s in supplied]
    familiar=set(['X','y','X_train','X_test','y_train','y_test','model','network','scaler','pca','scaled','folds','prepare'])
    lines=[]
    for statement in ast.parse(setup).body:
        names={n.id for n in ast.walk(statement) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Store)}
        if names&familiar or (isinstance(statement,ast.Expr) and isinstance(statement.value,ast.Call) and isinstance(statement.value.func,ast.Attribute) and statement.value.func.attr=='fit'):
            lines.append(ast.unparse(statement))
    exercise['familiarSetup']='\n'.join(lines)
    outputs=exercise.get('outputs',[])
    prior={item['name']:item['description'] for item in exercise.get('contract',[])}
    exercise['learnerOutputs']=[dict(name=name,description=prior.get(name,meanings.get(name,'The result requested by this activity.'))) for name in outputs]
    # Small-activity graders may read supplied state, but it is not a deliverable.
    # Complete-workflow contracts retain their decision names and specifications.
    if not exercise.get('assessment'):
        exercise['contract']=copy.deepcopy(exercise['learnerOutputs'])
    exercise['learnerActions'] = ['Create '+', '.join(outputs)]
    if any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='fit' for n in ast.walk(ast.parse(exercise.get('solution','')))):
        exercise['learnerActions'].insert(0,'Fit the declared recipe on the stated training rows')


def _named_repairs(registry):
    from authoring import py
    from packages import required
    cards={c['id']:c for c in registry['cards']}
    # Fit and predict first. Neighbour positions and pipeline internals belong to
    # the later vote investigation and receive activity-specific teaching there.
    card=cards['ML-C08'];old=card['exercises'][0]
    e=py('Fit a scaled three-neighbour classifier on X_train and y_train. Store its predicted class for the first test row in answer.',
        "from sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nmodel=Pipeline([('prepare',StandardScaler()),('model',KNeighborsClassifier(n_neighbors=3))])\nmodel.fit(X_train,y_train)\nanswer=model.predict(X_test.iloc[:1])",
        [dict(name='Three-neighbour prediction',test='trace.neighbour_vote_matches(answer,None,X_train,y_train,X_test.iloc[:1],k=3)',message='Fit three-neighbour voting with training-fitted scaling, then predict the first test row through that same recipe.')],
        dataset=old['dataset'],setup=old['setup'])
    e.update(id=old['id'],version=old.get('version',1)+1,label='Follow',demand='Fit and predict before inspecting neighbours',hints=dict(think='Nearby fitted training labels vote; scaling makes the two measurement units comparable.',tools='Pipeline, StandardScaler, KNeighborsClassifier(n_neighbors=3), fit and predict.',approach='Build the named preparation/model recipe, fit only training rows and predict the first held-away row.'),explanation='Three nearby training examples vote for a class. The Pipeline learns the distance scale on fitting rows and reuses it when predicting. This introductory round needs only fit and predict; the next round retrieves the actual neighbours and counts their labels.')
    e['starter']=e['solution'];e['packages']=required(e);card['exercises'][0]=e;card['example']=e['solution']
    card['explanation']='KNN stores training examples. To predict, find nearby examples and let their labels vote. k changes how local that vote is. Distance depends on measurement units, so the familiar Pipeline learns an input scale from training rows.'
    card['syntaxBreakdown']=card['syntaxBreakdown'][:2]
    card['syntax']='\n'.join(p['code'] for p in card['syntaxBreakdown'])
    card['exercises'][1]['activityExplanation']='Retrieve the neighbours only after ordinary prediction is familiar. named_steps accesses the fitted scaler and KNN; transform the query before calling the contained kneighbors method. Its positions select training labels. Count those labels, then reindex to fitted classes with zero counts for absent voters.'
    # The activity teaches tuning; its title should say that, while Apply is the
    # recognisable complete logistic workflow in the same collection.
    cards['ML-C06']['title']='Tune logistic regularisation'
    cards['ML-C06']['goal']='Compare regularisation choices using training-validation evidence.'
    lda=cards['ML-C17']
    lda['explanation']='LDA fits different class means with a shared within-class covariance shape, producing linear decision boundaries. Start by reading those means and comparing a shrinkage choice on training folds. The midpoint score identity is an optional deeper investigation, introduced beside its own code.'
    lda['syntaxBreakdown']=lda['syntaxBreakdown'][:4]
    lda['syntax']='\n'.join(p['code'] for p in lda['syntaxBreakdown'])
    lda['exercises'][2].update(depth='deeper',demand='Deeper investigation · affine decision scores',activityExplanation=CONCEPTS['lda-deeper']['meaning']+' '+CONCEPTS['lda-deeper']['choices'])
    svm=cards['ML-C10']
    svm['explanation']+=' An RBF kernel allows a curved boundary in measurement space. This activity inspects a supplied fitted classifier; Apply builds and evaluates the complete recipe.'
    svm['visual']['caption']='Trace a fitted RBF decision boundary and its class-aligned support vectors.'
    n04=cards['ML-N04']
    n04['explanation']='Two different transformations serve two different roles. The outer StandardScaler prepares input measurements X. TransformedTargetRegressor learns a separate scale for y within each fitting population, then reverses that target scale automatically when predict returns. Wine quality predictions and RMSE use quality-score points; the Apply electricity workflow uses kWh.'
    # The old task-specific transfer reminder named minutes for a Wine target.
    n04['exercises'][3]['reasoningPrompt']='Name Wine quality-score points before transformation and standardised target coordinates during fitting. Explain why Pipeline.predict restores quality-score points and why the same-unit RMSE uses untransformed y_test.'
    return registry


def apply(registry):
    from authoring import CONTRACT_MEANINGS
    registry=_named_repairs(registry)
    registry['teachingPolicy']={'sequence':['Introduce','Explain','Demonstrate','Practise','Reuse','Extend'],'referenceLevels':['current','reminders','reference'],'sharedModes':['learn','refresh']}
    registry['concepts']={key:_guide(value) for key,value in CONCEPTS.items()}
    for card in registry['cards']:
        introduced=[];reused=[];extended=[];seen=set()
        short=card['id'].removeprefix('ML-')
        for i,e in enumerate(card['exercises']):
            current=[];reminders=[]
            source=e.get('solution','') if e['kind']=='python' else ''
            for key,item in CONCEPTS.items():
                forced=i==0 and MODEL_FIRST.get(short)==key
                if not _used(source,item) and not forced:continue
                specific=key in ACTIVITY_TEACHING.get(e['id'],[])
                # Diagnostics can use named_steps in earlier known recipes; the
                # authored C08 origin teaches distance-model manual preparation.
                first=item['lesson']==card['id'] and key not in seen
                if key in ('pipeline-internals','neighbours','lda-deeper'):first=specific or (key=='pipeline-internals' and short in ('R05','R08','C05','C10','C12','N04') and key not in seen)
                guide=_guide(item)
                if first:
                    if key=='pipeline-internals' and short in ('R05','R08','C05','C10','C12','N04'):
                        guide.update(lesson=card['id'],meaning='named_steps maps the authored pipeline names to their fitted objects. Reading a contained estimator’s fitted coefficients or preparation schema does not fit again. Use the exact step names from the supplied recipe.',choices='The prepare step contains fitted preparation; model contains the prediction estimator. A ColumnTransformer also exposes its named_transformers_ when inspecting encoded categories.',example="estimator = model.named_steps['model']\nprint(estimator.coef_)")
                    current.append(guide);introduced.append(guide['title']);seen.add(key)
                else:
                    reminders.append(dict(id=key,title=item['title'],lesson=card['id'] if key in seen else item['lesson'],meaning=item['meaning'].split('. ')[0]+'.'))
                    reused.append(item['title'])
            # Model APIs and parameter choices are authored syntax explanations,
            # attached to their relevant activity rather than its main introduction.
            parts=card.get('syntaxBreakdown',[])
            for part in parts:
                anchor=re.sub(r'[^A-Za-z0-9_].*','',part['code'].lstrip("'\""))
                familiar=next((key for token,key in FAMILIAR_PARTS.items() if token in part['code']),None)
                if i==0 and not familiar and anchor and anchor in source and not any(anchor in p['code'] for p in current):
                    current.append(dict(code=part['code'],meaning=part['meaning'],title=part['code'],lesson=card['id']))
            sections=_sections(e)
            if sections:e['workflowSections']=sections
            e['teaching']=dict(introduces=list(dict.fromkeys(p['title'] for p in current)),reuses=list(dict.fromkeys(p['title'] for p in reminders)),extends=ACTIVITY_TEACHING.get(e['id'],[]),prerequisites=card['prerequisites'])
            current.extend(e.get('practiceSyntax',[]))
            e['syntaxGuidance']=dict(current=current,reminders=reminders,reference=[dict(code=p['code'],meaning=p['meaning'],title=p['code'],lesson=card['id']) for p in parts]+[_guide(item) for key,item in CONCEPTS.items() if _used(source,item) or (i==0 and MODEL_FIRST.get(short)==key)])
            if card['kind']!='teaching':
                # Retrieval/checkpoint evidence is the visual. A generic mixed-
                # input or comparison picture can imply steps absent from its
                # actual recipe, especially for clustering and PCA.
                e['visual']=dict(type='exercise-data',id=e['id'],caption='Inspect the supplied exercise evidence below.')
            e['milestone']='Apply' if e.get('modelBridge') else 'Fit' if i==0 and '.fit(' in source else 'Inspect' if i==0 else 'Experiment' if e.get('label')=='Change' else 'Apply independently' if e.get('label')=='Transfer' else e.get('label','Practise')
            if short in ('R07','R08') and not e.get('replacement'):
                degrees=re.findall(r'PolynomialFeatures\(degree=(\d+)',e.get('solution',''))
                if degrees:e['visual']={**card['visual'],'choice':degrees[0]}
            if e['kind']=='python':
                _supply(e,{**CONTRACT_MEANINGS,**e.get('inputMeanings',{})})
                if e.get('protect') and not e.get('validationDesign'):
                    p=e['protect'];e['validationDesign']='Reserve the final 20% '+('in chronological order' if p.get('time') else 'with random_state=42'+(', stratified by '+p['target'] if p.get('stratified') else ''))+'; use training rows for all model decisions.'
                e['taskBrief']=dict(question=e.get('question') or card['goal'],rows='Use '+str(e.get('dataset') or card.get('dataset'))+' and the population named in the task.',result=e['task'],constraints=[e['validationDesign']] if e.get('validationDesign') else [])
                if e.get('label')=='Follow':e['starter']=e['solution']
            if e.get('modelBridge'):
                e['workflowKind']='unsupervised' if card['deck'] in ('clustering','pca') else 'supervised'
                if e['workflowKind']=='unsupervised':e['workflowOrder']=DISCOVERY
                elif card['models']:
                    model=card['models'][0];changed,why=MODEL_DIFFERENCES[model]
                    e['workflowDifference']=dict(same='The question, X/y names, protected split, training-only validation, baseline, diagnosis and final prediction sequence.',changed=changed,why=why,
                        changedLines=[n for n,line in enumerate(e['starter'].splitlines(),1) if line.startswith('candidates =')],
                        solutionLines=[n for n,line in enumerate(e['solution'].splitlines(),1) if line.startswith('candidates =')])
        new=MODEL_NEW.get(short,[])
        card['teaching']=dict(introduces=list(dict.fromkeys(new+introduced)),reuses=list(dict.fromkeys(reused)),extends=AUTHORED_EXTENDS.get(short,list(dict.fromkeys(extended))),prerequisites=card['prerequisites'])
        card['orientation']=dict(known=card['teaching']['reuses'][:4],new=new or card['teaching']['introduces'][:3])
        card['progression']=['Understand','Fit','Inspect','Experiment','Apply independently'] if card['models'] and card['deck'] not in ('clustering','pca') else DISCOVERY if card['deck'] in ('clustering','pca') else ['Follow','Change','Transfer']
        card['workflowBridge']=next((e['id'] for e in card['exercises'] if e.get('modelBridge')),None)
        if card['id'] in ('ML-C10','ML-C14'):card['modelComparison']=copy.deepcopy(TREE_SVM_COMPARISON)
    for ch in registry['challenges']:
        e=ch['exercise']
        _supply(e,{**CONTRACT_MEANINGS,**e.get('inputMeanings',{})})
        e['teaching']=dict(introduces=[],reuses=['Features and target','Training-only validation','Final evaluation'] if ch['family'] not in ('clustering','pca') else DISCOVERY,extends=['Independent application'],prerequisites=ch['prerequisites'])
        e['syntaxGuidance']=dict(current=[],reminders=[],reference=[_guide(item) for item in CONCEPTS.values() if _used(e['solution'],item)])
    cards={card['id']:card for card in registry['cards']}
    for card_id,index,visual_id,choice in [
        ('ML-U07',3,'U07-scale','scaled'),('ML-C11',1,'C11-gamma','1'),('ML-R10',1,'R10-leaf','5'),
        ('ML-C08',0,'C08','3'),('ML-C08',1,'C08','5'),('ML-C09',0,'C09','3')]:
        card=cards[card_id]
        card['exercises'][index]['visual']={**card['visual'],'id':visual_id,'choice':choice}
    return registry
