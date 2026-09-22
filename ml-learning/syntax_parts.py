"""Reviewed API pieces introduced/retrieved by each Python teaching card.

Pieces are literal excerpts of the displayed syntax, not repeated concept copy.
Later cards explain their new arguments/attributes rather than Python punctuation.
"""
PARTS={
'F02':[("df[['distance']]",'Selects a list of feature columns and keeps a two-dimensional dataframe.'),("df['duration']",'Selects one aligned target column as a series.'),('X','Names the feature table.'),('y','Names the target values aligned to X.')],
'F03':[('LinearRegression()','Creates an unfitted linear regression estimator.'),('model.fit(X, y)','Learns coefficients and an intercept from aligned feature rows and targets.'),('model.coef_','Reads the coefficients learned during fitting; the trailing underscore marks a fitted attribute.')],
'F04':[('model.predict','Uses the fitted model without learning new parameters.'),("pd.DataFrame({'distance':[4,7]})",'Builds two new rows with the same feature name and two-dimensional shape used in fitting.')],
'F05':[('root_mean_squared_error(actual, predicted)','Compares aligned actual values and predictions, returning one error summary in the target units.'),('actual','The observed outcomes for these evaluation rows.'),('predicted','The model outputs for those same rows, in the same order.')],
'F07':[('train_test_split(X, y','Splits features and targets together so row alignment is preserved.'),('test_size=0.2','Reserves 20% of rows for the test partition.'),('random_state=42','Makes this random partition reproducible; it does not guarantee a representative sample.')],
'F08':[('classifier.fit(X, y)','Learns the supplied classification recipe from feature rows and class labels.'),('classifier.predict(new_rows)','Returns one predicted class label for each new feature row.')],
'F09':[('stratify=y','Uses the target labels to approximately preserve class proportions in each split.'),('random_state=42','Keeps the comparison of split strategies reproducible.')],
'F10':[('available_predictors','A list of columns that would be known when making the prediction.'),('df[available_predictors]','Selects only those legitimate inputs; a target-derived column must stay out.')],
'W01':[('X_train.describe()','Summarises numeric training columns without inspecting the reserved test population.'),('X_train.plot(...)','Starts a plot from the training table; choose the variables and labels for the question.')],
'W02':[("DummyRegressor(strategy='mean')",'Creates a reference that learns only the training-target mean.'),("DummyClassifier(strategy='most_frequent')",'Creates a reference that always predicts the most common training class.')],
'W03':[('scaler.fit(X_train)','Learns a mean and scale from each training feature column.'),('scaler.transform(X_new)','Applies the already learned scale; it does not refit on the new rows.')],
'W04':[("handle_unknown='ignore'",'An unseen category produces zeros in that feature’s learned indicator columns instead of refitting the schema.'),('sparse_output=False','Returns a dense array for these small examples.'),('OneHotEncoder','Learns named category indicators without assigning a numeric ordering.')],
'W05':[('ColumnTransformer','Combines different preparation steps for selected column groups.'),("'numeric'",'Names this transformer step for later inspection and parameter paths.'),('numeric_columns','Lists the columns sent to StandardScaler; other types need their own declared routes.')],
'W06':[("('prepare', prepare)",'Names the preprocessing step placed before the estimator.'),("('model', estimator)",'Names the final prediction step; pipeline fitting trains both steps in order.'),('Pipeline','Keeps fitting and later prediction on the same reusable preparation path.')],
'W07':[('SimpleImputer','Learns replacement values from the fitting rows.'),("strategy='median'",'Uses each numeric column’s median; categorical values need a different strategy.')],
'W08':[('KFold','Produces positional training/validation index pairs; it does not fit a model.'),('n_splits=5','Divides the supplied training population into five validation folds.'),('shuffle=True','Shuffles ordinary unordered observations before partitioning.'),('random_state=42','Makes the shuffled folds repeatable.')],
'W09':[('cross_validate','Fits independent copies on the training part of each fold and returns timing/score arrays.'),('cv=folds','Reuses the declared fold design across comparisons.'),("scoring='neg_root_mean_squared_error'",'Uses negative RMSE so larger scores are better; negate test_score to report positive RMSE.')],
'W11':[('GridSearchCV','Evaluates candidate settings within training folds and can refit the chosen setting on all supplied training rows.'),('parameter_grid','Maps parameter names to candidate values; pipeline paths use step__parameter.'),('cv=folds','Keeps candidate comparisons on the same declared partitions.'),('scoring=scorer','Defines the training-validation criterion used to nominate a setting.')],
'W12':[('cross_val_predict','Returns one held-out prediction for each training row, restoring the original row order.'),('cv=folds','Ensures each prediction comes from a fit that excluded that row.')],
'W13':[('clone(chosen)','Copies the chosen estimator configuration without carrying fitted state.'),('fit(X_train, y_train)','Refits that fixed choice on all training rows before the final evaluation.')],
'W14':[('TimeSeriesSplit','Produces expanding earlier training blocks followed by later validation blocks.'),('n_splits=5','Requests five forward validation blocks; no shuffling is used.')],
'R01':[('model.coef_','Contains one learned slope for each feature, in feature order.'),('model.intercept_','Contains the fitted prediction when all numeric inputs are zero, which may lie outside the observed range.')],
'R02':[('root_mean_squared_error','Summarises error in original target units.'),('r2_score','Compares squared prediction error with variation around the evaluation-target mean; the result can be negative.')],
'R03':[('actual - predicted','Defines signed residuals: positive values mean underprediction.'),('residual','Keeps row-level errors so a plot can reveal patterns hidden by a single summary.')],
'R04':[("X_train[['distance','weight']]",'Passes two feature columns in a fixed order.'),('LinearRegression().fit','Learns both slopes together, making each coefficient conditional on the other supplied inputs.')],
'R05':[("drop='first'",'Omits one category indicator so coefficients compare other categories with that reference.'),('prepare.get_feature_names_out()','Returns names in the transformed-column order so coefficients can be labelled correctly.')],
'R06':[('rng.normal(0, .001, len(df))','Creates a small reproducible perturbation for each observation.'),('pd.Series(model.coef_, index=X.columns)','Labels the jointly fitted coefficients, including the near-duplicate input.')],
'R07':[('PolynomialFeatures','Builds powers and interactions from the original feature columns.'),('degree=2','Includes terms up to degree two.'),('include_bias=False','Omits the all-ones column because the later estimator can fit its own intercept.')],
'R08':[("'polynomial__degree'",'Addresses degree inside the pipeline step named polynomial.'),('[2,3]','Declares the candidate degrees; cross-validation chooses using training evidence.'),('cv=folds','Uses the same folds for both candidate feature expansions.')],
'R09':[('DecisionTreeRegressor','Creates a regression tree whose terminal leaves predict fitted target averages.'),('random_state=42','Makes the tree-building choices reproducible.'),('plot_tree(model)','Draws the fitted split structure, leaf values and sample counts.')],
'R10':[("'max_depth'",'Names the tree parameter that limits the number of splits along a path.'),('[3,5,None]','Compares two explicit depth limits with no depth cap; validation must judge flexibility.')],
'C01':[('confusion_matrix','Counts actual/predicted class pairs; rows are actual classes and columns are predicted classes.'),("labels=['A','B']",'Fixes both axis orders, including a class with zero predictions.')],
'C02':[('precision_score','Measures how often the predicted positive label is correct.'),("pos_label='B'",'Declares which label is treated as the positive class in this binary calculation.')],
'C03':[('f1_score','Combines precision and recall for each class.'),("average='macro'",'Averages class F1 values with equal class weight, rather than weighting by class size.')],
'C04':[('model.classes_','Gives the fitted class order used by probability columns.'),('model.predict_proba(X_test)','Returns a row-by-class array of probabilities, not one label per row.')],
'C05':[('LogisticRegression','Creates a classification estimator despite the word regression in its name.'),('max_iter=2000','Sets an optimisation iteration limit; it does not guarantee convergence.'),('random_state=42','Makes supported stochastic fitting choices repeatable.')],
'C06':[("'model__C'",'Addresses inverse regularisation strength in the pipeline’s model step.'),('[.1,1,10]','Declares stronger through weaker regularisation candidates.'),("scoring='f1_macro'",'Chooses the candidate using equally weighted class F1 on training folds.')],
'C07':[("method='predict_proba'",'Requests held-out probability vectors rather than class labels from cross_val_predict.'),('cv=folds','Keeps threshold investigation inside the training population.')],
'C08':[('KNeighborsClassifier','Predicts a class by votes from fitted training neighbours.'),('n_neighbors=3','Uses the three nearest training observations for each prediction.')],
'C09':[("('scale',StandardScaler())",'Fits the distance scale within each pipeline fit, including each validation fold.'),("('model',KNeighborsClassifier())",'Places neighbour voting after scaling; model__n_neighbors can address its k setting.')],
'C10':[('SVC','Creates a support-vector classifier; its default kernel is RBF.'),('model.decision_function(X_test)','Returns signed margin-based decision values; these are not probabilities.')],
'C11':[("'model__C'",'Controls the penalty for training margin violations in the pipeline SVM.'),("scoring='f1_macro'",'Judges settings by class-balanced validation evidence, not by margin magnitude.')],
'C12':[('OneRPreprocessor','Preserves declared categorical values and learns bins only for declared numeric inputs.'),('OneRClassifier(bins=5)','Creates the production one-feature rule learner; bins matters when numeric inputs need discretisation.')],
'C13':[("'model__bins'",'Addresses the One-R learner’s numeric-bin setting through the pipeline.'),('[3,5,8]','Compares discretisation choices inside training-fold fits, not on the entire population.')],
'C14':[('DecisionTreeClassifier','Creates a tree that splits feature space and predicts from each leaf’s class distribution.'),('random_state=42','Makes fitted split choices reproducible.'),('plot_tree(model)','Displays thresholds, class counts and leaf predictions of a fitted tree.')],
'C15':[('GaussianNB()','Creates Naive Bayes for continuous features with class-conditional Gaussian likelihoods.'),('model.class_prior_','Reads the fitted probability assigned to each class before feature evidence.'),('model.predict_proba(X_test)','Returns class-aligned probabilities under the model’s likelihood assumptions.')],
'C16':[('GaussianNB()','Uses continuous measurement likelihoods.'),('BernoulliNB()','Uses presence and absence of binary indicators.'),('OneHotEncoder(...)','Turns named categories into indicators before the production Bernoulli path; learn its schema inside fitting.')],
'C17':[("solver='lsqr'",'Uses the least-squares LDA solver, which supports shrinkage.'),("shrinkage='auto'",'Estimates covariance shrinkage from the fitting rows.'),('LinearDiscriminantAnalysis','Fits class means with a shared covariance structure.')],
'C18':[('QuadraticDiscriminantAnalysis','Fits separate class covariance structures.'),('reg_param=0.1','Regularises those covariance estimates toward a diagonal identity contribution to improve stability.')],
'N03':[('hidden_layer_sizes=(24,)','Creates one hidden layer with 24 units; the trailing comma makes a one-element tuple.'),('max_iter=500','Caps optimisation iterations.'),('early_stopping=True','Reserves an internal portion of each fitting population for stopping; outer validation still serves a separate role.')],
'N04':[('TransformedTargetRegressor','Fits the target transformation inside each regressor fit and reverses it during prediction.'),('regressor=MLPRegressor(...)','Places neural regression inside the target wrapper.'),('transformer=StandardScaler()','Scales y within that wrapper; feature scaling belongs in the outer input pipeline.')],
'U01':[('measurement_columns','Contains only the measurements chosen to define similarity.'),('df[measurement_columns]','Creates X without a supervised target or hidden reference label.')],
'U02':[('StandardScaler().fit_transform(X)','Learns a scale from the declared discovery population and transforms those same rows.'),('scaled','Contains comparable-unit coordinates for distance calculations; retain X for original-unit descriptions.')],
'U03':[('n_clusters=3','Requests three fitted centroids.'),('n_init=20','Tries 20 initialisations and retains the lowest-inertia fit.'),('random_state=42','Makes those initialisation choices repeatable.')],
'U04':[('model.inertia_','Reads the fitted sum of squared distances to assigned centroids; it tends to decrease as k grows.'),('silhouette_score(scaled, labels)','Summarises separation relative to within-group distances for this scaled geometry.')],
'U05':[('X.groupby(labels)','Groups original-unit rows by their aligned fitted assignments.'),('.mean()','Computes each group’s mean per measurement; it does not change or refit the groups.')],
'U06':[('n_init=1','Uses a single initialisation so seed sensitivity is visible in this exercise.'),('random_state=seed','Changes the starting random choices for each repeated fit.'),('model.inertia_','Records each fit’s compactness so instability can be compared.')],
'U07':[("linkage(scaled, method='ward')",'Builds hierarchical merges that minimise increases in within-group squared distance.'),('dendrogram(linkage_matrix)','Draws the stored merge structure; leaf ordering is not an independent measurement axis.')],
'U08':[('cut_tree(linkage_matrix, n_clusters=3)','Cuts the same stored hierarchy into three groups.'),('.ravel()','Turns the one-column assignment array into a one-dimensional label vector aligned to the fitted rows.')],
'U09':[('X.sample','Selects rows while preserving their original index labels.'),('min(500,len(X))','Caps the sample size at the smaller of 500 and the available row count.'),('random_state=42','Makes the selected sample reproducible.')],
'P02':[('PCA().fit(scaled)','Learns component axes from the supplied scaled population.'),('pca.transform(scaled)','Projects rows onto the already fitted axes without learning new axes.')],
'P03':[('pca.explained_variance_ratio_','Reads each component’s share of input variance in fitted order; these values are not prediction scores.')],
'P04':[('np.searchsorted(cumulative, 0.9)','Finds the first zero-based position reaching the variance threshold.'),('+ 1','Converts that position into a component count for the retained prefix.')],
'P05':[('pca.components_.T','Transposes component-by-feature weights into feature-by-component columns.'),('index=X.columns','Labels each weight row with its original measurement name.')],
'P06':[('scores[:, :2]','Selects the first two component coordinates for every row.'),('ratios[:2].sum()','Reports how much input variance those two plotted axes display, independently of the retained dimension.')],
'P07':[('pca.inverse_transform(scores)','Maps component coordinates back into the scaled feature space; a truncated representation loses information.')],
'M03':[('pd.DataFrame','Organises the supplied comparison evidence into a report table.'),("'cv_rmse'",'Names the training-validation error summary; the supplied values are illustrative, not newly fitted results.'),("'fold_sd'",'Names variation across folds, not an uncertainty guarantee or an independent final-test result.')],
}
EXTRA={'F03':'model.coef_',
 'R06':"rng.normal(0, .001, len(df))\npd.Series(model.coef_, index=X.columns)",
 'U06':'KMeans(n_clusters=4, n_init=1, random_state=seed)\nmodel.inertia_',
 'M03':"pd.DataFrame({'model': names, 'cv_rmse': errors, 'fold_sd': variation})"}

# New inspection/diagnostic APIs used by later rounds of the same card.
ADDITIONAL={
 'F05':[('residual = actual - predicted','Keeps signed row-level errors; positive residuals mean the model predicted too little.')],
 'W01':[('fig, ax = plt.subplots()','Creates a figure and axes for the training-data view.'),('ax.scatter(x, y)','Plots paired values; supply training inputs and their aligned outcomes.'),('ax.set(xlabel="Feature", ylabel="Outcome")','Labels the plotted quantities so the figure can be interpreted.')],
 'W03':[('StandardScaler()','Creates an unfitted scaler; it learns statistics only when fit is called.')],
 'W04':[('encoder.get_feature_names_out()','Reads indicator names in the learned output-column order.')],
 'W05':[("'passthrough'",'Keeps declared binary flags unchanged while other branches transform their columns.')],
 'W06':[('model.set_params(model=estimator)','Replaces the named final pipeline step; fit the resulting recipe before predicting.')],
 'W08':[('folds.split(X_train)','Yields positional training and validation indices for the supplied development table.')],
 'R09':[('model.apply(row)','Returns the terminal leaf index reached by each feature row.')],
 'R10':[("{'min_samples_leaf': [1, 5, 10]}",'Compares minimum observations allowed in a fitted leaf, a separate constraint from maximum depth.')],
 'C02':[('recall_score(actual, predicted, pos_label="B")','Measures the fraction of actual B observations correctly recovered.'),('average=None','Returns one score per class rather than combining classes into a single summary.')],
 'C08':[('model.kneighbors(row, return_distance=False)','Returns positions of the nearest fitted training observations in the prepared feature space.')],
 'C10':[('model.named_steps["model"].n_support_','Reads the fitted SVC support-vector count per class from the final pipeline step.')],
 'C12':[('model.named_steps["model"].rules_','Reads the learned value-to-label mapping for the selected One-R feature.')],
 'C13':[('model.named_steps["model"].categorical_mask_','Identifies which prepared feature positions are treated as categorical rather than numeric.')],
 'C14':[('model.apply(row)','Finds the leaf reached by a row; predict returns the class selected at that leaf.')],
 'C17':[('model.means_','Reads the fitted class-by-feature mean matrix; label its axes with classes_ and feature names.')],
 'N04':[('model__regressor__hidden_layer_sizes','Addresses neural hidden widths through the pipeline’s target-wrapper step during search.')],
 'U03':[('model.cluster_centers_','Stores fitted centroids in the scaled coordinate system.'),('model.labels_','Stores one cluster assignment per fitted observation, in input order.')],
 'U05':[('pd.Series(labels).value_counts()','Counts how many fitted observations belong to each named group.')],
 'P04':[('np.cumsum(ratios)','Accumulates explained variance in component order before applying the retention threshold.')],
}
for key,parts in ADDITIONAL.items():PARTS[key].extend(parts)

def apply(card,id):
    if id in EXTRA:
        card['syntax']=card['syntax']+'\n'+EXTRA[id] if id=='F03' else EXTRA[id]
    if id in ADDITIONAL:card['syntax']+='\n'+'\n'.join(code for code,_ in ADDITIONAL[id])
    card['syntaxBreakdown']=[dict(code=code,meaning=meaning) for code,meaning in PARTS.get(id,[])]
    for part in card['syntaxBreakdown']:
        assert part['code'] in card['syntax'],(id,part['code'])
    if any(e['kind']=='python' for e in card['exercises']):assert id in PARTS,'Unreviewed Python syntax: '+id
