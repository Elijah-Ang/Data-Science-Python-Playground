"""Runnable difficult slices; shared authoring fragments never appear as hidden learner APIs."""
IMPORTS = """from sklearn.base import clone
from sklearn.model_selection import train_test_split, KFold, StratifiedKFold, cross_validate, cross_val_predict, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.metrics import root_mean_squared_error, f1_score, accuracy_score, confusion_matrix
"""

def check(name, test, message):
    return dict(name=name, test=test, message=message)

SUPERVISED_CHECKS = [
    check('Aligned split inputs and targets','X_train.equals(X.loc[X_train.index]) and X_test.equals(X.loc[X_test.index]) and y_train.equals(y.loc[X_train.index]) and y_test.equals(y.loc[X_test.index])','Preserve the feature rows, target values and row order together through the split.'),
    check('Protected final rows','trace.no_test_fit()','Fit preprocessing, candidates and references on training rows only.'),
    check('Observable training provenance','trace.verified_fits()','Keep row identity through dataframe/pipeline APIs so fitting can be verified.'),
    check('Cross-validation','trace.phase_present("cv")','Compare training-only validation folds before final evaluation.'),
    check('Matching folds','trace.matching_folds()','Use the declared five seed-42 folds consistently for references, candidates, searches and diagnostic predictions.'),
    check('Fold-local preparation','trace.preparation_inside_folds()','Keep learned preparation inside the candidate pipeline, not fitted once before CV.'),
    check('Training-only diagnosis','trace.phase_present("oof")','Create out-of-fold diagnostic predictions from training data.'),
    check('Final-test discipline','trace.final_after_selection()','Finish selection and diagnosis before predicting final-test rows.'),
    check('Reference evidence','len(reference_results["test_score"]) == 5 and np.isfinite(reference_results["test_score"]).all()','Evaluate a dummy reference on five training folds.'),
    check('Predictions match the chosen fit','np.array_equal(final_predictions,final_model.predict(X_test))','Use predictions from the fitted chosen model without altering their values.'),
]
REGRESSION_CHECKS = SUPERVISED_CHECKS + [check('Original-unit RMSE','np.isclose(final_rmse, np.sqrt(np.mean((np.asarray(y_test)-final_predictions)**2)))','Compute RMSE from final predictions in the target’s original units.')]
CLASSIFICATION_CHECKS = SUPERVISED_CHECKS + [
    check('Class predictions','len(final_predictions)==len(y_test) and set(final_predictions).issubset(set(y_train))','Predict one known class label per final-test row.'),
    check('Macro F1','np.isclose(final_f1, __import__("sklearn.metrics",fromlist=["f1_score"]).f1_score(y_test,final_predictions,average="macro"))','Compute macro F1 with equal weight for each class.'),
]
LINEAR = dict(id='ML-W-K1-1', dataset='MIX60', protect=dict(target='duration'),
    outputs=['cv_results','reference_results','residuals','final_predictions','final_rmse'], checks=REGRESSION_CHECKS+[check('Shared estimator','type(final_model.named_steps["model"]).__name__=="LinearRegression"','Use LinearRegression; no later model-family tuning is required.')],
    solution=IMPORTS+"""
from sklearn.linear_model import LinearRegression
X = df[['distance', 'weight', 'service', 'weekend']]
y = df['duration']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
prepare = ColumnTransformer([
    ('numeric', 'passthrough', ['distance', 'weight']),
    ('category', OneHotEncoder(handle_unknown='ignore', sparse_output=False, drop='first'), ['service']),
    ('flags', 'passthrough', ['weekend'])
])
model = Pipeline([('prepare', prepare), ('model', LinearRegression())])
folds = KFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(model, X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')
reference_results = cross_validate(DummyRegressor(strategy='mean'), X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')
# LinearRegression has no parameter search here: keep its defaults.
oof_predictions = cross_val_predict(model, X_train, y_train, cv=folds)
residuals = pd.DataFrame({'actual': y_train, 'predicted': oof_predictions, 'residual': y_train-oof_predictions})
final_model = clone(model).fit(X_train, y_train)
final_predictions = final_model.predict(X_test)
final_rmse = root_mean_squared_error(y_test, final_predictions)
print('Final RMSE:', final_rmse)
""")

def one_r(numeric):
    target = 'popular' if numeric else 'acceptability'
    columns = ['chocolate','fruity','caramel','peanutyalmondy','nougat','crispedricewafer','hard','bar','pluribus'] if numeric else ['buying','maintenance','doors','persons','luggage_boot','safety']
    numbers = ['sugarpercent','pricepercent'] if numeric else []
    search = """search = GridSearchCV(model, {'model__bins':[3,5,8]}, cv=folds, scoring='f1_macro')
search.fit(X_train, y_train)
chosen = search.best_estimator_
""" if numeric else "chosen = model\n"
    solution=IMPORTS+f"""
from ml_helpers import OneRClassifier, OneRPreprocessor
numeric = {numbers!r}
categories = {columns!r}
X = df[numeric + categories]
y = df[{target!r}]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
model = Pipeline([('prepare', OneRPreprocessor(numeric_features=numeric, categorical_features=categories)), ('model', OneRClassifier(bins=5))])
folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(model, X_train, y_train, cv=folds, scoring='f1_macro')
reference_results = cross_validate(DummyClassifier(strategy='most_frequent'), X_train, y_train, cv=folds, scoring='f1_macro')
"""+search+"""
oof_predictions = cross_val_predict(chosen, X_train, y_train, cv=folds)
matrix = confusion_matrix(y_train, oof_predictions, labels=sorted(y_train.unique()))
final_model = clone(chosen).fit(X_train, y_train)
final_predictions = final_model.predict(X_test)
final_f1 = f1_score(y_test, final_predictions, average='macro')
final_accuracy = accuracy_score(y_test, final_predictions)
print(final_model.named_steps['model'].rules_)
"""
    return dict(id='ML-X10' if numeric else 'ML-X09',dataset='candy_class' if numeric else 'car',protect=dict(target=target,stratified=True),outputs=['model','cv_results','reference_results','matrix','final_f1','final_accuracy'],checks=CLASSIFICATION_CHECKS+[check('Production One-R','type(final_model.named_steps["model"]).__name__=="OneRClassifier"','Use the production One-R helper.')],solution=solution)

NEURAL = dict(id='ML-N-K1-1',dataset='Wine600',protect=dict(target='quality'),
    outputs=['search','cv_results','reference_results','loss_curve','residuals','final_rmse'],
    checks=REGRESSION_CHECKS+[
        check('Target transformation','type(final_model.named_steps["model"]).__name__=="TransformedTargetRegressor"','Scale y inside TransformedTargetRegressor so predictions are inverse-transformed.'),
        check('Nested width search','"model__regressor__hidden_layer_sizes" in search.param_grid','Address the regressor inside the target wrapper when searching width.')],
    solution=IMPORTS+"""
from sklearn.neural_network import MLPRegressor
X = df.drop(columns=['quality', 'wine_type'])
y = df['quality']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = Pipeline([('prepare', StandardScaler()), ('model', TransformedTargetRegressor(regressor=MLPRegressor(hidden_layer_sizes=(24,), max_iter=800, early_stopping=True, tol=1e-3, random_state=42), transformer=StandardScaler()))])
folds = KFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(model, X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')
reference_results = cross_validate(DummyRegressor(strategy='mean'), X_train, y_train, cv=folds, scoring='neg_root_mean_squared_error')
search = GridSearchCV(model, {'model__regressor__hidden_layer_sizes':[(16,), (24,)]}, cv=folds, scoring='neg_root_mean_squared_error')
search.fit(X_train, y_train)
oof_predictions = cross_val_predict(search.best_estimator_, X_train, y_train, cv=folds)
residuals = y_train - oof_predictions
loss_curve = search.best_estimator_.named_steps['model'].regressor_.loss_curve_
final_model = clone(search.best_estimator_).fit(X_train, y_train)
final_predictions = final_model.predict(X_test)
final_rmse = root_mean_squared_error(y_test, final_predictions)
print('Final RMSE in quality-score units:', final_rmse)
""")
HIERARCHY = dict(id='ML-X18',dataset='breast',outputs=['sample','linkage_matrix','labels','profiles','cut_evidence'],
    checks=[
        check('Sampled population','len(sample)==min(500,len(X)) and sample.index.equals(X.sample(min(500,len(X)), random_state=42).index)','Keep the reproducible sample index.'),
        check('Ward hierarchy','linkage_matrix.shape==(len(sample)-1,4) and np.allclose(linkage_matrix, __import__("scipy.cluster.hierarchy",fromlist=["linkage"]).linkage(scaled_sample,method="ward"))','Construct Ward linkage from scaled sampled rows.'),
        check('Aligned profiles','profiles.index.equals(pd.Index(np.unique(labels))) and np.allclose(profiles.values, sample.groupby(labels).mean().values)','Profile sampled rows with their own cluster assignments.'),
        check('Hierarchy cut','2<=len(np.unique(labels))<=8 and _same_partition(labels,__import__("scipy.cluster.hierarchy",fromlist=["cut_tree"]).cut_tree(linkage_matrix,n_clusters=len(np.unique(labels))).ravel())','Use a coherent cut of the fitted hierarchy; renamed cluster IDs are welcome.'),
        check('Population scaler','np.allclose(scaler.mean_,X.mean())','Fit the exploratory scaler on the declared population before sampling.')],
    solution="""from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import linkage, dendrogram, cut_tree
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
X = df[['radius_mean','texture_mean','smoothness_mean','concavity_mean','symmetry_mean']]
scaler = StandardScaler().fit(X)
sample = X.sample(min(500,len(X)), random_state=42)
scaled_sample = scaler.transform(sample)
linkage_matrix = linkage(scaled_sample, method='ward')
cut_evidence = []
for k in range(2,9):
    assignments = cut_tree(linkage_matrix, n_clusters=k).ravel()
    cut_evidence.append({'k':k, 'silhouette':silhouette_score(scaled_sample, assignments)})
labels = cut_tree(linkage_matrix, n_clusters=3).ravel()
profiles = sample.groupby(labels).mean()
fig, ax = plt.subplots(figsize=(7,4))
dendrogram(linkage_matrix, truncate_mode='lastp', p=20, ax=ax)
ax.set(title='Ward hierarchy of sampled measurements', xlabel='Sample groups', ylabel='Ward merge distance')
print(pd.DataFrame(cut_evidence))
""")
PCA = dict(id='ML-X19',dataset='breast',outputs=['ratios','cumulative','retained','reduced','weights','scores2'],
    checks=[
        check('Target-free inputs','"diagnosis" not in X.columns and X.shape[1]==30','Use the 30 measurement columns; exclude diagnosis and identifiers.'),
        check('Minimum retained dimension','retained==int(np.searchsorted(cumulative,.9)+1) and reduced.shape==(len(X),retained) and np.allclose(reduced,pca.transform(scaled)[:,:retained])','Choose the smallest component prefix reaching 90%.'),
        check('Variance evidence','np.allclose(ratios,pca.explained_variance_ratio_) and np.allclose(cumulative,np.cumsum(ratios))','Use PCA explained variance and its cumulative sum.'),
        check('Weights and scores','weights.shape==(X.shape[1],2) and np.allclose(scores2,scaled @ weights.values) and trace.pca_axes(pca,weights.values)','Keep PCA axes, scores and sign choices consistent.'),
        check('Two-dimensional view','scores2.shape==(len(X),2)','Draw a separate two-axis view of the full reduced representation.')],
    solution="""from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
X = df[[c for c in df.columns if c.endswith(('_mean','_se','_worst'))]]
scaler = StandardScaler()
scaled = scaler.fit_transform(X)
pca = PCA().fit(scaled)
scores = pca.transform(scaled)
ratios = pca.explained_variance_ratio_
cumulative = np.cumsum(ratios)
retained = int(np.searchsorted(cumulative,0.9)+1)
reduced = scores[:,:retained]
weights = pd.DataFrame(pca.components_[:2].T.copy(),index=X.columns,columns=['PC1','PC2'])
scores2 = scores[:,:2].copy()
fig, ax = plt.subplots(figsize=(6,4))
ax.scatter(scores2[:,0],scores2[:,1],s=12)
ax.set(title='Two-component view of measurements',xlabel='PC1 score',ylabel='PC2 score')
print('Retained dimensions:',retained,'; variance visible in 2D:',ratios[:2].sum())
""")
ACTIVITIES=[LINEAR,one_r(False),one_r(True),NEURAL,HIERARCHY,PCA]
