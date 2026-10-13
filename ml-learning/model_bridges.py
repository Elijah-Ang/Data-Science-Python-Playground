"""Guided end-to-end practice between model fragments and independent briefs."""
from authoring import py
from packages import required

LEGACY_IDS={'R09','C10','C15','N03','U07','P02'}
# One guided application per model family; existing short rounds are retained.
COVERAGE_IDS={'R01','R04','R07','C06','C08','C12','C14','C17','C18','N04','U03'}
IDS=LEGACY_IDS|COVERAGE_IDS

def _finish(card, exercise):
    exercise.update(id=card['id']+'-'+str(len(card['exercises'])+1),version=1,label='Apply',demand='Build a guided full workflow',modelBridge=True)
    exercise['packages']=required(exercise)
    card['exercises'].append(exercise)
    card['minutes']='25–40'

def _supervised(card, dataset, task, model_name, *, tree=False, estimator=None, import_line=None, passthrough=False, prepare=None, expansion=None, extra_imports=''):
    from mastery import exercise
    e=exercise(dataset,task,support='guided',tree=tree)
    if estimator:
        original='LogisticRegression(max_iter=1000)' if e['assessment']['classification'] else 'LinearRegression()'
        original_import='from sklearn.linear_model import '+('LogisticRegression' if e['assessment']['classification'] else 'LinearRegression')
        assert original in e['solution']
        e['solution']=e['solution'].replace(original,estimator)
        e['solution']=e['solution'].replace(original_import,import_line)
        e['starter']=e['starter'].replace(original_import,import_line)
    if passthrough:
        e['solution']=e['solution'].replace("('prepare', StandardScaler())","('prepare', 'passthrough')")
        e['solution']=e['solution'].replace('from sklearn.preprocessing import StandardScaler\n','')
        e['starter']=e['starter'].replace('from sklearn.preprocessing import StandardScaler\n','')
    if prepare:
        original='StandardScaler()' if e['assessment']['classification'] else "'passthrough'"
        e['solution']=e['solution'].replace("('prepare', "+original+")", "('prepare', "+prepare+")")
    if extra_imports:
        e['solution']=extra_imports+'\n'+e['solution']
        e['starter']=extra_imports+'\n'+e['starter']
    if expansion:
        e['solution']=e['solution'].replace("Pipeline([('prepare',", "Pipeline([('polynomial', "+expansion+"), ('prepare',")
    # This authored list extends the open-choice grader only for this model's
    # bridge. Readiness checkpoints continue accepting their existing families.
    e['assessment']['allowedModels']=[model_name]
    e['task']+=' Features: '+', '.join(e['assessment']['available'])+'; target: '+e['assessment']['target']+'.'
    e['hints']=dict(think=task+' Which inputs and error matter at prediction time?',tools=f'Build a named Pipeline ending in {model_name}; use the matching folds, dummy and scoring string shown by the earlier complete workflow.',approach=f'Fill the eight numbered sections in order. Validate {model_name} and its dummy on training rows before fitting the final copy and opening reserved rows once.')
    e['checks'].insert(-1,dict(name='Model in the full workflow',test=f"type(candidates[chosen_name].steps[-1][1]).__name__ == {model_name!r}",message=f'Put {model_name} in the named Pipeline and validate that same recipe before its final fit.',success=f'The validated Pipeline uses {model_name}.'))
    e['checks'].insert(-1,dict(name='Declared workflow measurements',test='set(feature_names)==set('+repr(e['assessment']['available'])+') and len(feature_names)=='+str(len(e['assessment']['available'])),message='Use the declared feature measurements for this guided comparison. Independent challenges support justified feature choices.'))
    # Model-specific methodology remains observable rather than being inferred
    # from a familiar final-estimator name or coincidental predictions.
    if model_name in ('LogisticRegression','KNeighborsClassifier','SVC','MLPClassifier','TransformedTargetRegressor'):
        e['checks'].insert(-1,dict(name='Fold-local input scaling',test="trace.preparation_matches(final_model,[{'columns':list(X_train.columns),'operation':'scale'}])",message='Keep a fitted input StandardScaler inside the candidate Pipeline, so each training fold learns its own coordinates.'))
    if tree:
        e['checks'].insert(-1,dict(name='Declared tree depth',test='candidates[chosen_name].steps[-1][1].max_depth==3',message='Use the requested depth-three tree in the same validated and final recipe.'))
    if model_name=='KNeighborsClassifier':
        e['checks'].insert(-1,dict(name='Declared neighbourhood',test='candidates[chosen_name].steps[-1][1].n_neighbors==3',message='Keep the requested three-neighbour vote when validating and fitting the selected recipe.'))
    if model_name=='QuadraticDiscriminantAnalysis':
        e['checks'].insert(-1,dict(name='Regularised covariance',test='0<candidates[chosen_name].steps[-1][1].reg_param<=1',message='Use positive covariance regularisation in this QDA application.'))
    if model_name=='TransformedTargetRegressor':
        e['checks'].insert(-1,dict(name='Neural target transformation',test="type(final_model.steps[-1][1].regressor_).__name__=='MLPRegressor' and type(final_model.steps[-1][1].transformer_).__name__=='StandardScaler' and final_model.steps[-1][1].transformer_.with_mean and final_model.steps[-1][1].transformer_.with_std",message='Fit an MLPRegressor with its separate training-fitted target StandardScaler. The outer predict reverses that target scale before RMSE in kWh.'))
    if expansion:
        e['checks'].insert(-1,dict(name='Fold-local feature expansion',test='trace.preparation_matches(final_model,[],polynomial=True) and final_model.steps[0][1].degree==2',message='Keep degree-two expansion, no bias column and StandardScaler before Ridge, fitted separately within each fold.'))
    if model_name=='OneRClassifier':
        e['checks'].insert(-1,dict(name='Declared numeric rule inputs',test="type(final_model.steps[0][1]).__name__=='OneRPreprocessor' and set(final_model.steps[0][1].numeric_features)==set(X_train.columns) and not final_model.steps[0][1].categorical_features",message='Declare length and width as numeric measurements and learn their interval preparation inside each fold.'))
    e['reasoningPrompt']='Quote the dummy and candidate fold scores, defend the candidate chosen for this question, and name one model-specific failure mode. Explain why a good training score alone would not settle the choice.'
    _finish(card,e)

def complete_coverage(registry):
    """Append applications after historical repairs have reviewed their rounds."""
    cards={c['id']:c for c in registry['cards']}
    cards['ML-C06']['models']=['logistic']
    _supervised(cards['ML-R01'],'LINE24','Estimate delivery duration in minutes with a complete line workflow. Compare a mean dummy and inspect training-only residuals before one final evaluation.','LinearRegression')
    _supervised(cards['ML-R04'],'ENERGY72','Estimate monthly household electricity use in kWh from area and planned occupants. Exclude the later invoice; interpret the two-input model and residuals.','LinearRegression')
    _supervised(cards['ML-R07'],'LINE24','Compare a degree-two feature recipe with a mean dummy for duration in minutes. Keep expansion and scaling inside training folds; inspect validation error and state the danger of extrapolating a curved fit.','Ridge',estimator='Ridge(alpha=1.0)',import_line='from sklearn.linear_model import Ridge',prepare='StandardScaler()',expansion='PolynomialFeatures(degree=2, include_bias=False)',extra_imports='from sklearn.preprocessing import PolynomialFeatures, StandardScaler')
    _supervised(cards['ML-C06'],'CLASS180','Build and validate the complete scaled logistic classifier for measured specimens. Compare a majority dummy, inspect training-only class errors and evaluate the reserved rows once.','LogisticRegression')
    _supervised(cards['ML-C08'],'CLASS180','Build a complete three-neighbour classifier for measured specimens. Keep scaling inside training folds, compare a majority dummy and inspect class errors before one final evaluation.','KNeighborsClassifier',estimator='KNeighborsClassifier(n_neighbors=3)',import_line='from sklearn.neighbors import KNeighborsClassifier')
    _supervised(cards['ML-C12'],'CLASS180','Build a complete One-R workflow for measured specimens. Learn numeric bins inside each fold; compare its single-feature rule with a majority dummy before one final evaluation.','OneRClassifier',estimator='OneRClassifier(bins=5)',import_line='from ml_helpers import OneRClassifier, OneRPreprocessor',prepare="OneRPreprocessor(numeric_features=['length', 'width'], categorical_features=[])")
    _supervised(cards['ML-C14'],'CLASS180','Build a depth-three classification tree for measured specimens. Compare a majority dummy and training-only class errors before evaluating the reserved rows once.','DecisionTreeClassifier',tree=True)
    _supervised(cards['ML-C17'],'CLASS180','Build an LDA classifier for measured specimens. Inspect the shared-covariance assumption and training-only class errors; compare a majority dummy before one final evaluation.','LinearDiscriminantAnalysis',estimator="LinearDiscriminantAnalysis(solver='lsqr', shrinkage='auto')",import_line='from sklearn.discriminant_analysis import LinearDiscriminantAnalysis',passthrough=True)
    _supervised(cards['ML-C18'],'CLASS180','Build a regularised QDA classifier for measured specimens. Compare a majority dummy and inspect class support before one final evaluation; discuss the extra class-covariance parameters.','QuadraticDiscriminantAnalysis',estimator='QuadraticDiscriminantAnalysis(reg_param=0.1)',import_line='from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis',passthrough=True)
    _supervised(cards['ML-N04'],'ENERGY72','Estimate monthly electricity use in kWh with a neural regressor. Scale inputs and target separately inside each fit, compare a mean dummy and inspect residuals before one final RMSE in kWh.','TransformedTargetRegressor',estimator='TransformedTargetRegressor(regressor=MLPRegressor(hidden_layer_sizes=(8,), max_iter=500, random_state=42), transformer=StandardScaler())',import_line='from sklearn.compose import TransformedTargetRegressor\nfrom sklearn.neural_network import MLPRegressor',prepare='StandardScaler()',extra_imports='from sklearn.preprocessing import StandardScaler')
    _kmeans(cards['ML-U03'])
    from model_guides import apply
    return apply(registry)

def _kmeans(card):
    code='''from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
# 1. Select measurements; there is no prediction target y.
X = df[['length_mm', 'width_cm']]
# 2. Prepare the declared discovery population.
scaler = StandardScaler()
scaled = scaler.fit_transform(X)
# 3. Fit a grouping in the same prepared geometry.
model = KMeans(n_clusters=3, n_init=20, random_state=42)
labels = model.fit_predict(scaled)
# 4. Inspect group separation and original-unit profiles.
separation = silhouette_score(scaled, labels)
profiles = X.groupby(labels).mean()
print('Silhouette:', separation)
print('Original-unit profiles:', profiles)
# 5. Interpret the scale, chosen k and population limits.
'''
    e=py('Scale length_mm and width_cm on the declared measurement population, then fit three clusters. Store labels, their silhouette separation and original-unit profiles. Explain why the groups are not known classes.',code,[
        dict(name='Declared measurements and scale',test="X.equals(df[['length_mm','width_cm']]) and np.allclose(scaled,_prepared_values(X,numeric=list(X.columns)))",message='Use these two original measurements and fit a common scale to the declared discovery population.'),
        dict(name='Fitted grouping',test="model.n_clusters==3 and model.n_init==20 and np.array_equal(labels,model.labels_) and trace.fit_matches(scaled,None,'KMeans')",message='Fit the three-centroid recipe to the scaled measurements and retain one fitted assignment per row.'),
        dict(name='Separation and original units',test="np.isclose(separation,silhouette_score(scaled,labels)) and profiles.equals(X.groupby(labels).mean())",message='Describe the same labels in scaled silhouette geometry and original measurement units.'),
    ],dataset='CLUSTER36',outputs=['labels','separation','profiles'])
    e.update(starter=code.replace('scaled = scaler.fit_transform(X)','scaled = ...').replace('labels = model.fit_predict(scaled)','labels = ...').replace('separation = silhouette_score(scaled, labels)','separation = ...').replace('profiles = X.groupby(labels).mean()','profiles = ...'),hints=dict(think='Select measurements without y; the group IDs do not mean known classes.',tools='Use StandardScaler, KMeans(n_clusters=3, n_init=20, random_state=42), silhouette_score and groupby.',approach='Select measurements, prepare, fit groups, inspect separation and describe profiles in original units.'),explanation='The declared population supplies measurements without outcomes. Scaling defines distance, K-Means learns three centres, and silhouette describes separation under this geometry. Profiles retain millimetres and centimetres; neither a score nor a cluster number proves a natural category.',reasoningPrompt='Quote separation and profiles. Explain how the measurement choice, scale and k limit the interpretation.')
    _finish(card,e)

HIERARCHY_SOLUTION='''from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage, cut_tree
from sklearn.metrics import silhouette_score
# 1. Frame discovery without a prediction target.
X = df[['length_mm', 'width_cm']]
# 2. Keep row identities while taking a reproducible sample.
sample = X.sample(24, random_state=42)
# 3. Learn one scale from the sampled measurements.
scaler = StandardScaler()
scaled_sample = scaler.fit_transform(sample)
# 4. Build the Ward hierarchy in scaled space.
linkage_matrix = linkage(scaled_sample, method='ward')
# 5. Compare possible cuts on the same sampled rows.
cut_scores = {}
for k in (2, 3, 4):
    trial_labels = cut_tree(linkage_matrix, n_clusters=k).ravel()
    cut_scores[k] = silhouette_score(scaled_sample, trial_labels)
# 6. Choose a cut to describe; no score proves natural classes.
chosen_k = max(cut_scores, key=cut_scores.get)
labels = cut_tree(linkage_matrix, n_clusters=chosen_k).ravel()
# 7. Describe fitted groups in original measurement units.
profiles = sample.groupby(labels).mean()
print('Cut evidence:', cut_scores)
print('Original-unit profiles:', profiles)
# 8. Explain sampling, scale and cut limits in the interpretation field.
'''
HIERARCHY_STARTER='''from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage, cut_tree
from sklearn.metrics import silhouette_score
# 1. No y: select the measurements that define similarity.
X = df[['length_mm', 'width_cm']]
# 2. Preserve indices in a reproducible sample.
sample = X.sample(24, random_state=42)
# 3. Fit a common scale to this declared discovery sample.
scaler = StandardScaler()
scaled_sample = ...
# 4. Build a Ward hierarchy of those same scaled rows.
linkage_matrix = ...
# 5. Score cuts of two, three and four groups.
cut_scores = {}
for k in (2, 3, 4):
    trial_labels = ...
    cut_scores[k] = ...
# 6. Choose a defensible cut using that evidence.
chosen_k = ...
labels = ...
# 7. Describe groups using the unscaled sampled measurements.
profiles = ...
print('Cut evidence:', cut_scores)
print('Original-unit profiles:', profiles)
# 8. Explain what this sample and cut cannot establish.
'''

def _hierarchy(card):
    checks=[
      dict(name='Declared sample',test="sample.equals(X.sample(24, random_state=42)) and X.equals(df[['length_mm', 'width_cm']])",message='Keep the two named measurements, original values and seed-42 sampled row indices together.'),
      dict(name='Fitted scale and linkage',test="scaled_sample.shape == sample.shape and np.allclose(scaled_sample,_prepared_values(sample,numeric=list(sample.columns))) and linkage_matrix.shape == (len(sample)-1, 4) and np.allclose(linkage_matrix,__import__('scipy.cluster.hierarchy',fromlist=['linkage']).linkage(scaled_sample,method='ward'))",message='Fit the scaler to sampled measurements, then build one Ward linkage matrix from those same scaled rows.'),
      dict(name='Comparable cut evidence',test="set(cut_scores)=={2,3,4} and all(np.isclose(cut_scores[k],silhouette_score(scaled_sample,cut_tree(linkage_matrix,n_clusters=k).ravel())) for k in (2,3,4))",message='Score each candidate cut on the same scaled sample and the same Ward hierarchy.'),
      dict(name='Chosen groups and original units',test="chosen_k in (2,3,4) and _same_partition(labels,cut_tree(linkage_matrix,n_clusters=chosen_k).ravel()) and profiles.index.equals(sample.groupby(labels).mean().index) and list(profiles.columns)==list(sample.columns) and np.allclose(profiles.values,sample.groupby(labels).mean().values)",message='Use the selected cut for labels and describe those same rows in original units. Consistent group renaming is accepted.'),
    ]
    e=py('Build a sampled Ward workflow from length_mm and width_cm, using a 24-row sample with seed 42. Fit the scale to that sample. Store silhouette scores for cuts of 2, 3 and 4 groups in cut_scores; choose one cut in chosen_k; store original-unit group means in profiles.',HIERARCHY_SOLUTION,checks,dataset='CLUSTER36',outputs=['cut_scores','chosen_k','profiles'])
    e.update(starter=HIERARCHY_STARTER,question='Which groups describe this measurement sample at a defensible Ward cut?',context='One independent synthetic item per row. Length is recorded in millimetres; width is recorded in centimetres. Group IDs are arbitrary, and the sampled hierarchy does not claim universal types.',dictionary=[['length_mm','Observed length in millimetres; an input to discovery.'],['width_cm','Observed width in centimetres; an input to discovery.']],reasoningPrompt='Quote the cut evidence and original-unit profiles. Explain why changing the sample or scale might change the hierarchy, and why silhouette does not prove true classes.',hints=dict(think='There is no y. Preserve sample indices and compare cuts on the same scaled rows.',tools='Use StandardScaler, linkage(method="ward"), cut_tree and silhouette_score.',approach='Fit the scale to the declared sample, build one hierarchy, compare cuts, then group the unscaled sample by aligned labels.'),explanation='A sampled Ward hierarchy describes merge structure under chosen measurements and scaling. Silhouette compares geometric separation for candidate cuts. The resulting group profiles describe only these sampled observations and are not known class labels.')
    _finish(card,e)

PCA_SOLUTION='''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
# 1. Select measurements. PCA has no prediction target y.
X = df[['a', 'b', 'c', 'd', 'e']]
# 2. Learn one scale from the declared discovery population.
scaler = StandardScaler().fit(X)
scaled = scaler.transform(X)
# 3. Fit PCA and transform the same rows into new coordinates.
pca = PCA().fit(scaled)
scores = pca.transform(scaled)
# 4. Read variance in order and select the smallest 90% prefix.
ratios = pca.explained_variance_ratio_
cumulative = np.cumsum(ratios)
retained = int(np.searchsorted(cumulative, .9) + 1)
reduced = scores[:, :retained]
# 5. Label the first two component weights for interpretation.
weights = pd.DataFrame(pca.components_[:2].T, index=X.columns, columns=['PC1', 'PC2'])
print('Retained dimensions:', retained)
print('Variance retained:', cumulative[retained-1])
print(weights)
# 6. Explain the new axes and the limits of variance retention.
'''
PCA_STARTER='''from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
# 1. No y: select the measured columns.
X = df[['a', 'b', 'c', 'd', 'e']]
# 2. Fit one scale and transform the same rows.
scaler = StandardScaler().fit(X)
scaled = ...
# 3. Fit PCA and produce new coordinates.
pca = ...
scores = ...
# 4. Keep the smallest component prefix reaching 90% variance.
ratios = ...
cumulative = ...
retained = ...
reduced = ...
# 5. Label the first two weight vectors by original feature.
weights = ...
print('Retained dimensions:', retained)
print('Variance retained:', cumulative[retained-1])
print(weights)
# 6. Explain why a high-variance view is not a prediction score.
'''

def _pca(card):
    checks=[
      dict(name='Fitted representation',test="X.equals(df[['a','b','c','d','e']]) and np.allclose(scaler.mean_,X.mean()) and np.allclose(scaled,scaler.transform(X)) and scores.shape==(len(X),len(X.columns)) and np.allclose(scores,pca.transform(scaled))",message='Fit the scale and PCA on these measurements, then transform the same rows without selecting a target.'),
      dict(name='Variance criterion',test="np.allclose(ratios,pca.explained_variance_ratio_) and np.allclose(cumulative,np.cumsum(ratios)) and retained==int(np.searchsorted(cumulative,.9)+1)",message='Use the ordered explained-variance ratios and choose the smallest prefix reaching 90%.'),
      dict(name='Reduced rows and labelled weights',test="reduced.shape==(len(X),retained) and np.allclose(reduced,scores[:,:retained]) and list(weights.index)==list(X.columns) and list(weights.columns)==['PC1','PC2'] and np.allclose(weights,pca.components_[:2].T)",message='Keep all row coordinates for the retained prefix and label component weights by original feature names.'),
    ]
    e=py('Scale the five measurements and fit PCA. Store explained-variance ratios in ratios, the smallest component count reaching 90% in retained, those row scores in reduced, and labelled PC1/PC2 feature weights in weights.',PCA_SOLUTION,checks,dataset='PCA48',outputs=['ratios','retained','reduced','weights'])
    e.update(starter=PCA_STARTER,question='How many new coordinates retain at least 90% of variation in these measurements?',context='Five synthetic numeric measurements, one independent item per row. No outcome column or class label is supplied.',dictionary=[[name,'Numeric measurement; PCA combines it with the other four into new axes.'] for name in ['a','b','c','d','e']],reasoningPrompt='Quote the retained dimension count and variance. Explain what the first two weight vectors combine, and why retained variance is not predictive accuracy.',hints=dict(think='PCA uses X without y. Keep the row order and compare cumulative variance with the 90% threshold.',tools='Use StandardScaler, PCA, explained_variance_ratio_, np.cumsum and np.searchsorted.',approach='Fit the scale, fit PCA, transform rows, choose a prefix and label the first two weight vectors.'),explanation='PCA produces new continuous coordinates by combining measurements. The smallest prefix reaching 90% retains variation in this sample; it does not establish good prediction or meaningful clusters.')
    _finish(card,e)

def extend(registry):
    by_id={card['id']:card for card in registry['cards']}
    _supervised(by_id['ML-R09'],'LINE24','Use the eight-step outline to compare a depth-three regression tree with a mean dummy on delivery duration. Explain where a tree may fail outside its observed distance range.','DecisionTreeRegressor',tree=True)
    _supervised(by_id['ML-C10'],'CLASS180','Use the eight-step outline to evaluate a scaled support-vector classifier against a majority dummy on independent specimens. Explain what a margin does and why scaling stays inside folds.','SVC',estimator="SVC(kernel='rbf', C=1, gamma='scale')",import_line='from sklearn.svm import SVC')
    _supervised(by_id['ML-C15'],'CLASS180','Use the eight-step outline to evaluate Gaussian Naive Bayes against a majority dummy. Explain the class-conditional feature assumption and why a validated score does not prove calibrated probabilities.','GaussianNB',estimator='GaussianNB()',import_line='from sklearn.naive_bayes import GaussianNB',passthrough=True)
    _supervised(by_id['ML-N03'],'CLASS180','Use the eight-step outline to evaluate a small scaled neural classifier against a majority dummy. Explain convergence and the gap between training fit and validation evidence.','MLPClassifier',estimator='MLPClassifier(hidden_layer_sizes=(8,), max_iter=500, random_state=42)',import_line='from sklearn.neural_network import MLPClassifier')
    _hierarchy(by_id['ML-U07'])
    _pca(by_id['ML-P02'])
    return registry
