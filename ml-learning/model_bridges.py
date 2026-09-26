"""Guided end-to-end practice between model fragments and independent briefs."""
from authoring import py
from packages import required

IDS={'R09','C10','C15','N03','U07','P02'}

def _finish(card, exercise):
    exercise.update(id=card['id']+'-4',version=1,label='Apply',demand='Build a guided full workflow',modelBridge=True)
    exercise['packages']=required(exercise)
    card['exercises'].append(exercise)
    card['minutes']='25–40'

def _supervised(card, dataset, task, model_name, *, tree=False, estimator=None, import_line=None, passthrough=False):
    from mastery import exercise
    e=exercise(dataset,task,support='guided',tree=tree)
    if estimator:
        assert 'LogisticRegression(max_iter=1000)' in e['solution']
        e['solution']=e['solution'].replace('LogisticRegression(max_iter=1000)',estimator)
        e['solution']=e['solution'].replace('from sklearn.linear_model import LogisticRegression',import_line)
        e['starter']=e['starter'].replace('from sklearn.linear_model import LogisticRegression',import_line)
    if passthrough:
        e['solution']=e['solution'].replace("('prepare', StandardScaler())","('prepare', 'passthrough')")
        e['solution']=e['solution'].replace('from sklearn.preprocessing import StandardScaler\n','')
        e['starter']=e['starter'].replace('from sklearn.preprocessing import StandardScaler\n','')
    e['hints']=dict(think=task+' Which inputs and error matter at prediction time?',tools=f'Build a named Pipeline ending in {model_name}; use the matching folds, dummy and scoring string shown by the earlier complete workflow.',approach=f'Fill the eight numbered sections in order. Validate {model_name} and its dummy on training rows before fitting the final copy and opening reserved rows once.')
    e['checks'].insert(-1,dict(name='Model in the full workflow',test=f"type(candidates[chosen_name].steps[-1][1]).__name__ == {model_name!r}",message=f'Put {model_name} in the named Pipeline and validate that same recipe before its final fit.',success=f'The validated Pipeline uses {model_name}.'))
    e['reasoningPrompt']='Quote the dummy and candidate fold scores, defend the candidate chosen for this question, and name one model-specific failure mode. Explain why a good training score alone would not settle the choice.'
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
      dict(name='Declared sample',test="sample.index.equals(X.sample(24, random_state=42).index) and X.equals(df[['length_mm', 'width_cm']])",message='Keep the two named measurements and the reproducible sampled row indices together.'),
      dict(name='Fitted scale and linkage',test="scaled_sample.shape == sample.shape and np.allclose(scaled_sample.mean(axis=0), 0, atol=1e-7) and linkage_matrix.shape == (len(sample)-1, 4)",message='Fit the scaler to sampled measurements, then build one Ward linkage matrix from the scaled rows.'),
      dict(name='Comparable cut evidence',test="set(cut_scores)=={2,3,4} and all(np.isclose(cut_scores[k],silhouette_score(scaled_sample,cut_tree(linkage_matrix,n_clusters=k).ravel())) for k in (2,3,4))",message='Score each candidate cut on the same scaled sample and the same Ward hierarchy.'),
      dict(name='Chosen groups and original units',test="chosen_k in (2,3,4) and np.array_equal(labels,cut_tree(linkage_matrix,n_clusters=chosen_k).ravel()) and np.allclose(profiles.values,sample.groupby(labels).mean().values)",message='Use the selected cut for labels and describe those same rows in original units.'),
    ]
    e=py('Build a sampled Ward workflow from the length and width measurements. Store silhouette scores for cuts of 2, 3 and 4 groups in cut_scores; choose one cut in chosen_k; store original-unit group means in profiles.',HIERARCHY_SOLUTION,checks,dataset='CLUSTER36',outputs=['cut_scores','chosen_k','profiles'])
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
