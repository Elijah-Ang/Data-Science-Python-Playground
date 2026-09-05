def _practice_result(ok, message):
    return {"ok": bool(ok), "message": str(message)}

def _practice_source():
    return str(globals().get("__cell_code", ""))

def _practice_forbidden_source(spec):
    source = _practice_source()
    holdout_tokens = ("X_" + "test", "y_" + "test", "test_" + "prediction", "test_" + "result")
    if any(token in source for token in holdout_tokens):
        return _practice_result(False, "Keep final-test variables out of this practice task.")
    target = str(spec.get("target", "")).strip()
    if target:
        try:
            tree = ast.parse(source, mode="exec")
        except Exception:
            tree = None
        if tree is not None:
            target_names = {target}
            selector_methods = {"drop", "filter", "get", "pop", "reindex", "rename", "set_axis"}

            def _string_values(node):
                return [value.value for value in ast.walk(node)
                        if isinstance(value, ast.Constant) and isinstance(value.value, str)]

            class _TargetReferenceVisitor(ast.NodeVisitor):
                def __init__(self):
                    self.found = False

                def visit_Name(self, node):
                    if node.id in target_names:
                        self.found = True
                    self.generic_visit(node)

                def visit_Attribute(self, node):
                    if node.attr in target_names:
                        self.found = True
                    self.generic_visit(node)

                def visit_Subscript(self, node):
                    # A target string is meaningful here because it is being
                    # used as a dataframe/dictionary/list selector.  Nested
                    # lists and tuples cover df[[...]], df.loc[..., ...], and
                    # equivalent selections without inspecting comments or
                    # unrelated prose strings.
                    if target in _string_values(node.slice):
                        self.found = True
                    self.generic_visit(node)

                def visit_Call(self, node):
                    function = node.func
                    method = function.attr if isinstance(function, ast.Attribute) else ""
                    if method in selector_methods and target in _string_values(node):
                        self.found = True
                    if any(keyword.arg == target for keyword in node.keywords if keyword.arg):
                        self.found = True
                    self.generic_visit(node)

            visitor = _TargetReferenceVisitor()
            visitor.visit(tree)
            if visitor.found:
                return _practice_result(False, "Keep the reference target out of this target-free practice task.")
    return None

def _practice_assigned(name):
    try:
        tree = ast.parse(_practice_source(), mode="exec")
        return any(
            isinstance(node, (ast.Assign, ast.AnnAssign)) and any(
                isinstance(target, ast.Name) and target.id == name
                for target in (node.targets if isinstance(node, ast.Assign) else [node.target])
            )
            for node in tree.body
        )
    except Exception:
        return False

def _practice_frame(value, name):
    if not isinstance(value, pd.DataFrame):
        return _practice_result(False, f"{name} must be a pandas DataFrame.")
    if len(value.index) < 1:
        return _practice_result(False, f"{name} is empty.")
    return None

def validate_practice_exercise(spec):
    kind = str(spec.get("kind", ""))
    if kind == "model":
        if not _practice_assigned("model") or not _practice_assigned("pipeline"):
            return _practice_result(False, "Assign the estimator to model and connect it with preprocessor in pipeline.")
        candidate = globals().get("pipeline")
        if not hasattr(candidate, "steps") or len(candidate.steps) < 2:
            return _practice_result(False, "pipeline should contain preparation followed by the model.")
        names = [name for name, _ in candidate.steps]
        if names[-1] != "model" or names[0] != "prepare":
            return _practice_result(False, "Use a prepare step followed by a model step.")
        if globals().get("model") is not candidate.named_steps.get("model"):
            return _practice_result(False, "The pipeline model step should be the estimator assigned to model.")
        return _practice_result(True, "The estimator is connected to the preparation in one Pipeline.")

    if kind == "cv":
        if not _practice_assigned("cv"):
            return _practice_result(False, "Create the route's cv splitter before building the fold table.")
        candidate = globals().get("cv")
        expected = int(spec.get("folds", 0))
        try:
            actual = int(candidate.get_n_splits())
        except Exception:
            actual = int(getattr(candidate, "n_splits", -1))
        if actual != expected:
            return _practice_result(False, f"The route expects {expected} folds, but cv has {actual}.")
        frame_check = _practice_frame(globals().get("cv_scores"), "cv_scores")
        if frame_check:
            return frame_check
        table = globals().get("cv_scores")
        required = ("train_macro_f1", "validation_macro_f1") if spec.get("task") == "classification" else ("train_rmse", "validation_rmse")
        missing = [column for column in required if column not in table.columns]
        if missing:
            return _practice_result(False, "cv_scores is missing: " + ", ".join(missing) + ".")
        if len(table.index) != expected:
            return _practice_result(False, "cv_scores must contain one row for each validation fold.")
        numeric = table[list(required)].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=float)
        if not np.isfinite(numeric).all() or (spec.get("task") == "regression" and (numeric < 0).any()):
            return _practice_result(False, "Fold scores must be finite, with RMSE shown as a positive error.")
        return _practice_result(True, "The splitter and fold table match the route's training-only validation setup.")

    if kind == "kmeans":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        if not _practice_assigned("kmeans"):
            return _practice_result(False, "Fit a KMeans estimator on the prepared feature matrix Z.")
        candidate = globals().get("kmeans")
        labels = np.asarray(globals().get("clusters", []))
        selected = int(globals().get("selected_k", -1))
        if not hasattr(candidate, "cluster_centers_") or not hasattr(candidate, "labels_") or len(labels) != len(np.asarray(globals().get("Z", []))):
            return _practice_result(False, "The fitted KMeans object and one cluster label per row are required.")
        if not np.array_equal(labels, np.asarray(candidate.labels_)):
            return _practice_result(False, "Use the fitted K-Means labels for the cluster assignments.")
        if selected < 2 or selected > int(spec.get("maxK", 8)) or len(np.unique(labels)) != selected:
            return _practice_result(False, "The cluster labels must match the selected number of groups.")
        return _practice_result(True, "K-Means is fitted and every prepared row has one of the selected cluster labels.")

    if kind == "hierarchical":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        if not _practice_assigned("hierarchical"):
            return _practice_result(False, "Create the Ward-linkage estimator using selected_k.")
        candidate = globals().get("hierarchical")
        labels = np.asarray(globals().get("clusters", []))
        sample = np.asarray(globals().get("analysis_Z", []))
        selected = int(globals().get("selected_k", -1))
        if not hasattr(candidate, "n_clusters") or not hasattr(candidate, "labels_") or len(labels) != len(sample):
            return _practice_result(False, "The hierarchy and its sampled cluster labels must stay aligned.")
        if not np.array_equal(labels, np.asarray(candidate.labels_)):
            return _practice_result(False, "Use the fitted hierarchy labels for the sampled assignments.")
        if selected < 2 or selected > int(spec.get("maxK", 8)) or len(np.unique(labels)) != selected:
            return _practice_result(False, "The sampled cluster labels must match the selected cut.")
        return _practice_result(True, "The Ward hierarchy and sampled cluster labels match the selected cut.")

    if kind == "pca_selection":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        if not _practice_assigned("components_for_target"):
            return _practice_result(False, "Find the first cumulative-variance position that reaches variance_target.")
        target = float(globals().get("variance_target", np.nan))
        cumulative = np.asarray(globals().get("cumulative_explained_variance", []), dtype=float)
        try:
            selected = int(globals().get("components_for_target", -1))
            expected = int(np.flatnonzero(cumulative >= target)[0] + 1)
            retained = float(globals().get("variance_retained", np.nan))
        except Exception:
            return _practice_result(False, "Use the cumulative explained variance to calculate the component count.")
        if not (0 < target <= 1) or selected != expected or not np.isfinite(retained) or not np.isclose(retained, cumulative[selected - 1]):
            return _practice_result(False, "The selected component count and retained variance do not match variance_target.")
        reduced = np.asarray(globals().get("Z_reduced", []))
        if reduced.ndim != 2 or reduced.shape[1] != selected:
            return _practice_result(False, "Z_reduced must contain exactly the selected number of components.")
        fitted = globals().get("full_pca")
        if not hasattr(fitted, "transform") or not np.allclose(reduced, np.asarray(fitted.transform(np.asarray(globals().get("Z", []))))[:, :selected]):
            return _practice_result(False, "Z_reduced must come from the fitted PCA transformation.")
        return _practice_result(True, "The selected component count is the first one reaching the active variance target.")

    if kind == "checkpoint_supervised":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        candidate = globals().get("checkpoint_pipeline")
        table = globals().get("checkpoint_scores")
        if "X_train" not in _practice_source() or "y_train" not in _practice_source():
            return _practice_result(False, "Use the training rows X_train and y_train for this checkpoint.")
        if not hasattr(candidate, "steps") or not isinstance(table, pd.DataFrame) or "validation_score" not in table.columns or len(table.index) < 2:
            return _practice_result(False, "Build a compact training-only pipeline and a validation_score column with multiple folds.")
        names = [name for name, _ in candidate.steps]
        expected = int(spec.get("folds", 0))
        values = pd.to_numeric(table["validation_score"], errors="coerce").to_numpy(dtype=float)
        if names[0] != "prepare" or names[-1] != "model" or len(table.index) != expected or not np.isfinite(values).all():
            return _practice_result(False, "Use prepare → model steps and one finite validation score per route fold.")
        if spec.get("task") == "regression" and (values < 0).any():
            return _practice_result(False, "Show RMSE as a positive error in original target units.")
        return _practice_result(True, "The compact workflow produced multiple training-only validation results.")

    if kind == "checkpoint_kmeans":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        fitted = globals().get("checkpoint_model")
        labels = np.asarray(globals().get("checkpoint_labels", []))
        profile = globals().get("checkpoint_profile")
        if not hasattr(fitted, "cluster_centers_") or len(labels) < 1 or len(labels) != len(np.asarray(globals().get("Z", []))) or not isinstance(profile, pd.DataFrame) or "cluster" not in profile.columns or len(profile.index) != len(labels):
            return _practice_result(False, "Fit the selected K-Means solution and profile every row by cluster.")
        if not np.array_equal(labels, np.asarray(fitted.labels_)):
            return _practice_result(False, "Use the fitted K-Means labels for the profile rather than a separate label array.")
        return _practice_result(True, "The checkpoint produced one cluster label and a matching original-unit profile per row.")

    if kind == "checkpoint_hierarchical":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        fitted = globals().get("checkpoint_model")
        labels = np.asarray(globals().get("checkpoint_labels", []))
        profile = globals().get("checkpoint_profile")
        sample = np.asarray(globals().get("analysis_Z", []))
        if not hasattr(fitted, "labels_") or len(labels) < 1 or len(labels) != len(sample) or not isinstance(profile, pd.DataFrame) or "cluster" not in profile.columns or len(profile.index) != len(labels):
            return _practice_result(False, "Fit the hierarchy on analysis_Z and profile the same sampled rows.")
        if not np.array_equal(labels, np.asarray(fitted.labels_)):
            return _practice_result(False, "Use the fitted hierarchy labels for the sampled profile.")
        return _practice_result(True, "The checkpoint hierarchy and sampled profile remain aligned.")

    if kind == "checkpoint_pca":
        source_check = _practice_forbidden_source(spec)
        if source_check:
            return source_check
        fitted = globals().get("checkpoint_pca")
        projection = np.asarray(globals().get("checkpoint_projection", []))
        loadings = globals().get("checkpoint_loadings")
        if not hasattr(fitted, "components_") or projection.ndim != 2 or projection.shape[0] != len(np.asarray(globals().get("Z", []))) or projection.shape[1] < 1 or not isinstance(loadings, pd.DataFrame) or len(loadings.index) != len(fitted.components_[0]):
            return _practice_result(False, "Fit PCA on Z and show matching projected rows and loading values.")
        return _practice_result(True, "The checkpoint includes fitted PCA axes, row coordinates, and feature-labelled loadings.")

    return _practice_result(False, "No semantic validator is registered for this exercise.")
