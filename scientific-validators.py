"""Semantic checks for the optional ML practice tasks.

The worker records real validation results for one cell and releases that record
at the next run. Checks never refit a reference estimator or inspect the holdout.
"""

def _practice_result(ok, message):
    return {"ok": bool(ok), "message": str(message)}


def _practice_source():
    return str(globals().get("__cell_code", ""))


def _practice_forbidden_source(spec):
    try:
        tree = ast.parse(_practice_source(), mode="exec")
    except SyntaxError:
        return _practice_result(False, "Fix the Python syntax before checking this task.")
    # Comments and explanatory strings are harmless. Actual holdout names and
    # selectors remain prohibited, including aliases created from those names.
    forbidden = {"X_test", "y_test", "test_prediction", "test_predictions", "test_result"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and node.id in forbidden:
            return _practice_result(False, "Keep final-test variables out of this practice task; use the declared training or discovery inputs.")
    target = str(spec.get("target", "")).strip()
    if target:
        selector_methods = {"drop", "filter", "get", "pop", "reindex", "rename", "set_axis"}
        def strings(node):
            return [value.value for value in ast.walk(node)
                    if isinstance(value, ast.Constant) and isinstance(value.value, str)]
        for node in ast.walk(tree):
            found = ((isinstance(node, ast.Name) and node.id == target)
                or (isinstance(node, ast.Attribute) and node.attr == target)
                or (isinstance(node, ast.Subscript) and target in strings(node.slice)))
            if isinstance(node, ast.Call):
                method = node.func.attr if isinstance(node.func, ast.Attribute) else ""
                found = found or (method in selector_methods and target in strings(node)) or any(k.arg == target for k in node.keywords)
            if found:
                return _practice_result(False, "Keep the reference target out of this target-free practice task.")
    return None


def _practice_assigned(name):
    try:
        return any(isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store) and node.id == name
                   for node in ast.walk(ast.parse(_practice_source(), mode="exec")))
    except SyntaxError:
        return False


def _practice_same_partition(left, right):
    left, right = np.asarray(left).ravel(), np.asarray(right).ravel()
    if left.shape != right.shape or not len(left):
        return False
    pairs = set(zip(left.tolist(), right.tolist()))
    return len(pairs) == len(np.unique(left)) == len(np.unique(right))


def _practice_array_equal(left, right):
    a, b = np.asarray(left), np.asarray(right)
    if a.shape != b.shape:
        return False
    try:
        return bool(np.allclose(a.astype(float), b.astype(float), rtol=1e-8, atol=1e-10, equal_nan=True))
    except (TypeError, ValueError):
        return bool(np.array_equal(a, b))


def _practice_model_family(model_id):
    return {"simple_linear":"LinearRegression", "multiple_linear":"LinearRegression",
        "polynomial":"Ridge", "regression_tree":"DecisionTreeRegressor",
        "logistic":"LogisticRegression", "svm_cls":"SVC", "one_r":"OneRClassifier",
        "classification_tree":"DecisionTreeClassifier", "knn_cls":"KNeighborsClassifier",
        "qda":"QuadraticDiscriminantAnalysis", "lda":"LinearDiscriminantAnalysis",
        "naive_bayes":("GaussianNB","BernoulliNB","CategoricalNB"), "mlp_cls":"MLPClassifier", "mlp_reg":"TransformedTargetRegressor"}.get(model_id)


def _practice_pipeline(candidate, spec, require_unfitted=False):
    from sklearn.pipeline import Pipeline
    from sklearn.utils.validation import check_is_fitted
    from sklearn.exceptions import NotFittedError
    if not isinstance(candidate, Pipeline) or len(candidate.steps) < 2:
        return "Connect preparation and the estimator in a sklearn Pipeline."
    names = [name for name, _ in candidate.steps]
    model_id = str(spec.get("modelId", ""))
    polynomial_route = model_id == "polynomial" or names[0] == "polynomial"
    checkpoint = spec.get('kind')=='checkpoint_supervised'
    if polynomial_route:
        if len(names)!=3 or (not checkpoint and names != ["polynomial", "scale", "model"]):
            return 'Use the named polynomial → scale → model steps in that order.'
        from sklearn.preprocessing import PolynomialFeatures, StandardScaler
        if not isinstance(candidate.steps[0][1], PolynomialFeatures) or not isinstance(candidate.steps[1][1], StandardScaler):
            return "Expand polynomial terms before scaling them inside each validation fold."
        if checkpoint and any(_practice_input(name) is not None and repr(step)!=repr(_practice_input(name)) for name,step in zip(('polynomial','scale'),(candidate.steps[0][1],candidate.steps[1][1]))):
            return "Keep the supplied polynomial expansion and scaling settings inside the checkpoint Pipeline."
    else:
        if len(names)!=2 or (not checkpoint and names != ["prepare", "model"]):
            return 'Use the named prepare → model steps in that order.'
        expected = _practice_input("preprocessor")
        actual = candidate.steps[0][1]
        if repr(actual) != repr(expected):
            return "Use the route's existing preprocessor, including its feature selection and missing-value handling."
    family = _practice_model_family(model_id)
    terminal = candidate.steps[-1][1]
    families=(family,) if isinstance(family,str) else family
    if families and type(terminal).__name__ not in families:
        return "Use the selected route estimator (" + ", ".join(families) + ") in the model step."
    if model_id=='mlp_reg' and type(getattr(terminal,'regressor',None)).__name__!='MLPRegressor':
        return "Keep the target-transformed MLPRegressor so predictions return to the original target units."
    supplied=_practice_input('model')
    if model_id=='naive_bayes' and supplied is not None and type(terminal) is not type(supplied):
        return "Keep the route's continuous, binary, or categorical Naive Bayes variant."
    if checkpoint and supplied is not None and repr(terminal)!=repr(supplied):
        return "Use the supplied estimator and its selected settings in the checkpoint; an equivalent clone is accepted."
    if require_unfitted:
        if terminal is not globals().get("model"):
            return 'Keep the estimator assigned to model in the Pipeline "model" step.'
        for _, step in candidate.steps:
            if step is None or isinstance(step, str):
                continue
            try:
                check_is_fitted(step)
            except NotFittedError:
                continue
            except TypeError:
                continue
            return "Build an unfitted Pipeline here; validation will fit separate copies on its training folds."
    return None


def _practice_expected_folds(spec, x, y):
    from sklearn.model_selection import KFold, StratifiedKFold, TimeSeriesSplit
    count = int(spec.get("folds", 5))
    if spec.get('kind')=='checkpoint_supervised':
        supplied=_practice_input('cv')
        if supplied is not None:
            folds=[(a.tolist(),b.tolist()) for a,b in supplied.split(x,y)]
            if len(folds)!=count:raise ValueError('The supplied cv must have the route fold count.')
            return folds
    split = str(spec.get("split", ""))
    if split == "time":
        splitter = TimeSeriesSplit(n_splits=count)
    elif split == "stratified" or (not split and spec.get("task") == "classification"):
        splitter = StratifiedKFold(n_splits=count, shuffle=True, random_state=42)
    else:
        splitter = KFold(n_splits=count, shuffle=True, random_state=42)
    return [(a.tolist(), b.tolist()) for a,b in splitter.split(x,y)]


class _PracticeObservation:
    """Temporary observation of actual sklearn validation calls in this cell."""
    def __init__(self, spec):
        import copy
        self.spec = spec
        self.runs = []
        self.fits = []
        self.patches = []
        self.aliases = []
        # Snapshot protected values before editable code can rebind or mutate
        # the route's names. This is transient evidence for this one run.
        self.inputs = {name:copy.deepcopy(globals()[name]) for name in
            ("X_train","y_train","X_scaled","X_sample_scaled","X","X_sample","feature_names","preprocessor","model","cv","polynomial","scale") if name in globals()}
        if spec.get('kind') in ('kmeans','checkpoint_kmeans'):
            from sklearn.cluster import KMeans
            original=KMeans.fit
            observer=self
            def observed_fit(estimator,*args,**kwargs):
                x=args[0] if args else kwargs.get('X')
                result=original(estimator,*args,**kwargs)
                observer.fits.append(dict(model_id=id(estimator),x=np.asarray(x).copy(),
                    centers=estimator.cluster_centers_.copy(),labels=estimator.labels_.copy(),inertia=float(estimator.inertia_)))
                return result
            self.patches.append((KMeans,'fit',original))
            KMeans.fit=observed_fit
            return
        if spec.get("kind") not in ("cv", "checkpoint_supervised"):
            return
        import sklearn.model_selection as selection
        import sklearn.model_selection._validation as validation
        original = validation.cross_validate
        observer = self
        def observed(*args, **kwargs):
            estimator = args[0] if args else kwargs.get("estimator")
            x = args[1] if len(args)>1 else kwargs.get("X")
            y = args[2] if len(args)>2 else kwargs.get("y")
            cv = kwargs.get("cv")
            from sklearn.model_selection import check_cv
            from sklearn.base import is_classifier
            checked = check_cv(cv, y, classifier=is_classifier(estimator))
            folds = [(np.asarray(a,dtype=int).tolist(), np.asarray(b,dtype=int).tolist()) for a,b in checked.split(x,y)]
            result = original(*args, **kwargs)
            observer.runs.append({"x":np.asarray(x).copy(), "y":np.asarray(y).copy(),
                "folds":folds, "scoring":kwargs.get("scoring"), "recipe":repr(estimator),
                "test":np.asarray(result["test_score"]).copy(),
                "train":np.asarray(result["train_score"]).copy() if "train_score" in result else None})
            return result
        for owner in (selection, validation):
            self.patches.append((owner, "cross_validate", getattr(owner,"cross_validate")))
            setattr(owner,"cross_validate",observed)
        for name, value in list(globals().items()):
            if value is original:
                self.aliases.append((name,original,observed))
                globals()[name]=observed

    def finish(self):
        for owner,name,original in reversed(self.patches):
            setattr(owner,name,original)
        for name,original,observed in self.aliases:
            if globals().get(name) is observed:
                globals()[name]=original
        # An import in the learner cell may have created a new alias.
        if self.patches:
            observed_names = {value for _,_,value in self.aliases}
            for name,value in list(globals().items()):
                if getattr(value,"__name__",None)=="observed" and getattr(value,"__closure__",None):
                    # Only this observer's wrapper has this closure.
                    if any(cell.cell_contents is self for cell in value.__closure__):
                        globals()[name]=self.patches[0][2]
        self.patches=[]
        self.aliases=[]


def begin_practice_observation(spec):
    observation = _PracticeObservation(spec)
    globals()["__practice_observation"] = observation
    return observation


def _practice_input(name, default=None):
    observation=globals().get("__practice_observation")
    return getattr(observation,"inputs",{}).get(name,globals().get(name,default))


def _practice_validation_table(spec, candidate, table, train_required):
    name = "fold_scores" if train_required else "checkpoint_scores"
    if not isinstance(table,pd.DataFrame):
        return _practice_result(False, name + " must be a pandas DataFrame with one row per route fold.")
    count = int(spec.get("folds",5))
    classification = spec.get("task") == "classification"
    columns = (("train_macro_f1","validation_macro_f1") if classification else ("train_rmse","validation_rmse")) if train_required else ("validation_score",)
    if len(table)!=count or any(c not in table.columns for c in columns):
        return _practice_result(False, name + " needs " + str(count) + " rows and columns " + ", ".join(columns) + ".")
    values = table[list(columns)].to_numpy(dtype=float)
    if not np.isfinite(values).all() or (values<0).any() or (classification and (values>1).any()):
        return _practice_result(False,"Use finite macro F1 scores from 0 to 1, or positive RMSE errors, as appropriate for the route.")
    x,y=_practice_input("X_train"),_practice_input("y_train")
    folds=_practice_expected_folds(spec,x,y)
    scorer="f1_macro" if classification else "neg_root_mean_squared_error"
    observation=globals().get("__practice_observation")
    for run in getattr(observation,"runs",[]):
        if not (_practice_array_equal(run["x"],x) and _practice_array_equal(run["y"],y)
                and run["folds"]==folds and run["scoring"]==scorer and run["recipe"]==repr(candidate)):
            continue
        actual = run["test"] if classification else -run["test"]
        if train_required:
            if run["train"] is None:continue
            train = run["train"] if classification else -run["train"]
            actual=np.column_stack((train,actual))
        else:actual=actual.reshape(-1,1)
        if _practice_array_equal(values,actual):
            return _practice_result(True,"The table contains observed training-only validation scores on the declared route folds.")
    return _practice_result(False,"Run cross_validate on X_train and y_train with the route splitter and scorer, then copy its actual fold scores into " + name + "; invented scores or another population do not supply this evidence.")


def _practice_kmeans(fitted, labels, matrix, selected=None, maximum=8):
    from sklearn.cluster import KMeans
    x=np.asarray(matrix,dtype=float)
    labels=np.asarray(labels).ravel()
    if not isinstance(fitted,KMeans) or not hasattr(fitted,"cluster_centers_") or x.ndim!=2 or len(labels)!=len(x):
        return "Fit KMeans on X_scaled and keep one cluster label per prepared row."
    k=int(fitted.n_clusters)
    if not 2<=k<=min(maximum,len(x)-1) or (selected is not None and k!=int(selected)):
        return "Use the selected number of groups within the available candidate range."
    if len(np.unique(labels))!=k or not _practice_same_partition(labels,fitted.labels_) or not _practice_same_partition(labels,fitted.predict(x)):
        return "Keep labels aligned with the fitted K-Means assignments; arbitrary cluster-ID renaming is accepted."
    observation=globals().get('__practice_observation')
    if not any(run['model_id']==id(fitted) and _practice_array_equal(run['x'],x)
        and _practice_array_equal(run['centers'],fitted.cluster_centers_) and _practice_same_partition(run['labels'],fitted.labels_)
        and np.isclose(run['inertia'],fitted.inertia_,rtol=1e-12,atol=1e-12) for run in getattr(observation,'fits',[])):
        return "Fit KMeans on the actual X_scaled values in this task, preserving row and feature order; keep its observed centers and inertia."
    return None


def _practice_hierarchy(matrix, labels, sample, selected):
    from scipy.cluster.hierarchy import linkage,cut_tree,is_valid_linkage
    x=np.asarray(sample,dtype=float)
    h=np.asarray(matrix,dtype=float)
    labels=np.asarray(labels).ravel()
    k=int(selected)
    if x.ndim!=2 or len(labels)!=len(x) or not 2<=k<=min(8,len(x)-1) or not is_valid_linkage(h):
        return "Use a valid Ward hierarchy of X_sample_scaled and one label per sampled row."
    expected=linkage(x,method="ward")
    if h.shape!=expected.shape or not np.allclose(np.sort(h[:,2]),np.sort(expected[:,2])):
        return "The Ward hierarchy must describe the actual X_sample_scaled distances."
    if not _practice_same_partition(labels,cut_tree(h,n_clusters=k).ravel()) or not _practice_same_partition(labels,cut_tree(expected,n_clusters=k).ravel()):
        return "Cut the displayed Ward hierarchy at selected_k; cluster IDs may be renamed while preserving membership."
    return None


def _practice_profile(profile, original, labels):
    if not isinstance(profile,pd.DataFrame) or not isinstance(original,pd.DataFrame) or "cluster" not in profile.columns:
        return "checkpoint_profile must retain the original-unit feature rows and a cluster column."
    if not profile.index.equals(original.index) or any(c not in profile for c in original.columns):
        return "Keep the original feature columns, row indices, and row order in checkpoint_profile."
    if not _practice_array_equal(profile[original.columns],original) or not np.array_equal(profile["cluster"].to_numpy(),np.asarray(labels).ravel()):
        return "Preserve original feature values and attach each row's matching checkpoint_labels."
    return None


def _practice_pca_fit(fitted,matrix):
    from sklearn.decomposition import PCA
    x=np.asarray(matrix,dtype=float)
    if not isinstance(fitted,PCA) or not hasattr(fitted,"components_") or x.ndim!=2:
        return "Fit PCA on the declared X_scaled feature matrix."
    axes=np.asarray(fitted.components_)
    if axes.ndim!=2 or axes.shape[1]!=x.shape[1] or not _practice_array_equal(fitted.mean_,x.mean(axis=0)):
        return "The fitted PCA axes and mean must describe the actual prepared features."
    # Numerical evidence ties the fitted axes to the input without fitting a
    # second PCA, and accepts consistent sign flips of an axis and its scores.
    cov=np.atleast_2d(np.cov(x,rowvar=False))
    variances=np.asarray(fitted.explained_variance_)
    if not np.allclose(axes@axes.T,np.eye(len(axes)),rtol=1e-7,atol=1e-8) or not np.allclose(cov@axes.T,axes.T*variances,rtol=1e-6,atol=1e-7):
        return "PCA must use the variance axes learned from the actual X_scaled values."
    ratios=variances/np.trace(cov)
    if not _practice_array_equal(ratios,fitted.explained_variance_ratio_):
        return "Use the fitted explained-variance ratios for the declared input matrix."
    return None


def _validate_practice_exercise(spec):
    kind=str(spec.get("kind",""))
    forbidden=_practice_forbidden_source(spec)
    if forbidden:return forbidden
    if kind=="model":
        if not all(_practice_assigned(n) for n in ("model","pipeline")):
            return _practice_result(False,"Assign the estimator to model and connect its preparation in pipeline.")
        error=_practice_pipeline(globals().get("pipeline"),spec,require_unfitted=True)
        return _practice_result(not error,error or "The unfitted selected estimator is connected to its preparation in one Pipeline.")
    if kind in ("cv","checkpoint_supervised"):
        candidate=globals().get("pipeline" if kind=="cv" else "checkpoint_pipeline")
        error=_practice_pipeline(candidate,spec)
        if error:return _practice_result(False,error)
        if kind=="cv":
            if not _practice_assigned("cv"):
                return _practice_result(False,"Assign the route splitter to cv before creating fold_scores.")
            actual=[(np.asarray(a,dtype=int).tolist(),np.asarray(b,dtype=int).tolist()) for a,b in globals()["cv"].split(_practice_input("X_train"),_practice_input("y_train"))]
            if actual!=_practice_expected_folds(spec,_practice_input("X_train"),_practice_input("y_train")):
                return _practice_result(False,"Use the route's exact fold count and splitter: shuffled KFold/StratifiedKFold with seed 42, or forward TimeSeriesSplit for time data.")
        table=globals().get("fold_scores" if kind=="cv" else "checkpoint_scores")
        return _practice_validation_table(spec,candidate,table,kind=="cv")
    if kind in ("kmeans","checkpoint_kmeans"):
        checkpoint=kind.startswith("checkpoint")
        fitted=globals().get("checkpoint_model" if checkpoint else "kmeans")
        labels=globals().get("checkpoint_labels" if checkpoint else "clusters",[])
        selected=getattr(fitted,"n_clusters",None) if checkpoint else globals().get("selected_k")
        error=_practice_kmeans(fitted,labels,_practice_input("X_scaled",[]),selected,int(spec.get("maxK",8)))
        if not error and checkpoint:error=_practice_profile(globals().get("checkpoint_profile"),_practice_input("X"),labels)
        return _practice_result(not error,error or "K-Means assignments match the prepared rows and the original-unit profile remains aligned.")
    if kind in ("hierarchical","checkpoint_hierarchical"):
        checkpoint=kind.startswith("checkpoint")
        matrix=globals().get("checkpoint_hierarchy" if checkpoint else "hierarchy",[])
        labels=globals().get("checkpoint_labels" if checkpoint else "clusters",[])
        selected=len(np.unique(labels)) if checkpoint else globals().get("selected_k")
        error=_practice_hierarchy(matrix,labels,_practice_input("X_sample_scaled",[]),selected)
        if not error and checkpoint:error=_practice_profile(globals().get("checkpoint_profile"),_practice_input("X_sample"),labels)
        return _practice_result(not error,error or "The Ward cut and original-unit sample rows remain aligned.")
    if kind in ("pca_selection","checkpoint_pca"):
        checkpoint=kind.startswith("checkpoint")
        fitted=globals().get("checkpoint_pca" if checkpoint else "pca")
        matrix=_practice_input("X_scaled",[])
        error=_practice_pca_fit(fitted,matrix)
        if error:return _practice_result(False,error)
        target=float(globals().get("checkpoint_variance_target" if checkpoint else "variance_target",np.nan))
        cumulative=np.cumsum(fitted.explained_variance_ratio_)
        if not 0<target<=1 or not np.any(cumulative>=target):
            return _practice_result(False,"Choose a visible variance target from 0 to 1 that the fitted components can reach.")
        expected=int(np.flatnonzero(cumulative>=target)[0]+1)
        selected=int(globals().get("checkpoint_components" if checkpoint else "components_for_target",-1))
        if selected!=expected:
            return _practice_result(False,"Select the smallest component count whose fitted cumulative variance reaches the active target.")
        reduced=globals().get("checkpoint_projection" if checkpoint else "X_reduced",[])
        if not _practice_array_equal(reduced,fitted.transform(matrix)[:,:selected]):
            return _practice_result(False,"Use the selected PCA coordinates in the original row order, with scores and axis signs kept consistent.")
        if checkpoint:
            loadings=globals().get("checkpoint_loadings")
            features=_practice_input("feature_names",[])
            if not isinstance(loadings,pd.DataFrame) or list(loadings.index)!=list(features) or not _practice_array_equal(loadings,fitted.components_.T):
                return _practice_result(False,"checkpoint_loadings must contain the fitted component weights, indexed by the original feature_names in their feature order.")
        else:
            retained=float(globals().get("variance_retained",np.nan))
            table=globals().get("variance_table")
            if not np.isclose(retained,cumulative[selected-1]) or not isinstance(table,pd.DataFrame) or not _practice_array_equal(table["cumulative_explained_variance"],cumulative) or not _practice_array_equal(table["explained_variance_ratio"],fitted.explained_variance_ratio_):
                return _practice_result(False,"Keep variance_table and variance_retained consistent with the fitted PCA ratios and active component count.")
        return _practice_result(True,"The component count, coordinates, and feature weights agree with the fitted PCA and active variance criterion.")
    return _practice_result(False,"No semantic validator is registered for this exercise.")


def validate_practice_exercise(spec):
    try:
        return _validate_practice_exercise(spec)
    except (KeyError,NameError,TypeError,ValueError,AttributeError,IndexError) as error:
        return _practice_result(False,"Create the named task evidence with compatible rows, features, and values before checking: " + str(error))
