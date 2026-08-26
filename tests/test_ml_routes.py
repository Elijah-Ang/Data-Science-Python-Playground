"""Structural and optional runtime audits for every generated ML route.

Examples:
    python tests/test_ml_routes.py
    python tests/test_ml_routes.py --runtime representative
    python tests/test_ml_routes.py --runtime full
"""

from __future__ import annotations

import argparse
import ast
import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import traceback
import warnings

ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "tests" / "generate_ml_routes.mjs"


def load_routes() -> dict:
    result = subprocess.run(
        ["node", str(GENERATOR)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        raise AssertionError(
            "Route generator failed:\n" + result.stdout + "\n" + result.stderr
        )
    return json.loads(result.stdout)


def route_code(route: dict, cell_id: str) -> str:
    return next(cell["code"] for cell in route["cells"] if cell["id"] == cell_id)


def cell_ids(route: dict) -> list[str]:
    return [cell["id"] for cell in route["cells"]]


def assert_exact_namespace(namespace: dict, expected_names: set[str], label: str) -> None:
    expected = set(expected_names)
    actual = set(namespace)
    unexpected = sorted(actual - expected)
    missing = sorted(expected - actual)
    if unexpected or missing:
        raise AssertionError(f"{label} namespace mismatch; unexpected={unexpected}, missing={missing}")


def run_reset_regression(payload: dict) -> dict:
    class ResetTestFrame:
        """Small dependency-free dataframe double for the structural reset test."""

        def __init__(self, columns, rows, dtypes):
            self.columns = list(columns)
            self.rows = [list(row) for row in rows]
            self.dtypes = dict(dtypes)

        def copy(self, deep=True):
            return ResetTestFrame(self.columns, self.rows, self.dtypes)

        def drop(self, columns, inplace=False):
            keep = [column for column in self.columns if column not in columns]
            positions = [self.columns.index(column) for column in keep]
            reduced = ResetTestFrame(
                keep,
                [[row[index] for index in positions] for row in self.rows],
                {column: self.dtypes[column] for column in keep},
            )
            if inplace:
                self.columns, self.rows, self.dtypes = reduced.columns, reduced.rows, reduced.dtypes
                return None
            return reduced

        def signature(self):
            return (self.columns, self.rows, self.dtypes)

    baseline_values = {
        "pd": object(),
        "np": object(),
        "sns": object(),
        "plt": object(),
        "display": object(),
        "OneRClassifier": object(),
        "one_r_rule_table": object(),
    }
    generated_names = {
        "X",
        "y",
        "X_train",
        "X_test",
        "Z",
        "pipeline",
        "best_pipeline",
        "search",
        "diagnostic_model",
        "final_model",
        "test_prediction",
        "macro_f1",
        "accuracy",
        "rmse",
        "mae",
        "r2",
        "clusters",
        "selected_k",
        "full_pca",
        "Z_reduced",
    }
    original = ResetTestFrame(
        ["category", "value"],
        [["a", 1], ["b", 2], ["a", 3]],
        {"category": "string", "value": "int64"},
    )

    def make_namespace(keep_data):
        namespace = dict(baseline_values)
        namespace["__builtins__"] = __builtins__
        namespace["BASE_GLOBAL_NAMES"] = frozenset(namespace) | {"BASE_GLOBAL_NAMES"}
        baseline_snapshot = dict(namespace)
        namespace["__baseline_values_from_worker"] = baseline_snapshot
        namespace["df"] = original.copy(deep=True)
        namespace["__raw_df_snapshot_from_worker"] = original.copy(deep=True)
        namespace["__keep_data"] = keep_data
        return namespace, baseline_snapshot

    namespace, baseline_snapshot = make_namespace(True)
    namespace["df"].drop(columns=["value"], inplace=True)
    namespace["pd"] = None
    namespace["np"] = "broken"
    namespace.pop("sns")
    namespace["some_random_variable"] = 123
    namespace.update({name: object() for name in generated_names})
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    assert_exact_namespace(namespace, set(baseline_snapshot) | {"df"}, "keepData=True reset")
    if any(name in namespace for name in generated_names) or "some_random_variable" in namespace:
        raise AssertionError("Reset left generated or custom globals after restoring the workspace.")
    for name in baseline_values:
        if namespace.get(name) is not baseline_snapshot[name]:
            raise AssertionError(f"Reset did not restore baseline binding {name!r}.")
    if "df" not in namespace or namespace["df"].signature() != original.signature():
        raise AssertionError("Reset did not restore the original raw dataframe state.")

    namespace, baseline_snapshot = make_namespace(False)
    namespace["df"].drop(columns=["category"], inplace=True)
    namespace["pd"] = None
    namespace.pop("sns")
    namespace.update({name: object() for name in generated_names})
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    assert_exact_namespace(namespace, set(baseline_snapshot), "keepData=False reset")
    if "df" in namespace or any(name in namespace for name in generated_names):
        raise AssertionError("Reset did not clear raw df and modelling globals when keepData=False.")
    for name in baseline_values:
        if namespace.get(name) is not baseline_snapshot[name]:
            raise AssertionError(f"keepData=False reset did not restore baseline binding {name!r}.")

    return {
        "keep_data_true_namespace_exact": True,
        "keep_data_false_namespace_exact": True,
        "baseline_aliases_restored": True,
        "raw_df_restored": True,
        "generated_globals_removed": True,
        "keep_data_false_clears_df": True,
    }


def assert_route_structure(payload: dict) -> dict:
    source = (ROOT / "ml-app.js").read_text(encoding="utf-8")
    if "serialize_dataframe_result" not in payload.get("dataFrameSerializerSource", ""):
        raise AssertionError("The general DataFrame serializer source was not exported for regression testing.")
    if "len(np.unique(values)) <= self.bins" in payload["oneRHelperSource"]:
        raise AssertionError("One-R still infers categorical features from numeric uniqueness.")
    if "_OneRFeaturePreprocessor" not in payload["oneRHelperSource"]:
        raise AssertionError("One-R preprocessing does not retain explicit feature-type metadata.")
    if "BASE_GLOBAL_NAMES = frozenset(globals())" not in source or 'globals().pop("__name", None)' not in source:
        raise AssertionError("Reset does not use automatic baseline-global cleanup.")
    if "async function resetNotebook()" not in source or "await resetWorkerWorkspace(true);" not in source:
        raise AssertionError("Reset button is not wired to the Python workspace reset.")
    if "$(\"#resetButton\").addEventListener(\"click\", () => { void resetNotebook(); });" not in source:
        raise AssertionError("Reset button does not call resetNotebook().")
    if "Custom cells are unrestricted" not in source or "walkthrough/setup" not in source:
        raise AssertionError("Holdout wording does not describe the actual reset/custom-cell behaviour.")

    reset_result = run_reset_regression(payload)

    expected_counts = {"5": 127, "10": 127}
    route_sets = payload["routes"]
    if {key: len(value) for key, value in route_sets.items()} != expected_counts:
        raise AssertionError(
            f"Expected 127 compatible routes at both fold settings; got "
            f"{ {key: len(value) for key, value in route_sets.items()} }"
        )

    supervised_ids = [
        "frame",
        "split",
        "explore",
        "prepare",
        "model",
        "baseline",
        "tune",
        "diagnose",
        "final",
    ]
    kmeans_ids = ["frame", "explore", "prepare", "compare", "fit", "diagnose", "profile", "visualise"]
    hierarchical_ids = ["frame", "explore", "prepare", "dendrogram", "compare", "fit", "profile", "visualise"]
    pca_ids = ["frame", "explore", "prepare", "variance", "select", "loadings", "project"]
    phase2a_model_ids = {
        "simple_linear",
        "multiple_linear",
        "polynomial",
        "regression_tree",
        "logistic",
        "classification_tree",
        "knn_cls",
        "one_r",
    }
    phase2b1_model_ids = {"svm_cls", "lda", "qda", "naive_bayes"}
    phase2_model_ids = phase2a_model_ids | phase2b1_model_ids
    phase2a_required_tokens = {
        "simple_linear": ("simple_grid", "simple_curve", "simple_oof_x", "simple_slope", "intercept_at_feature_0", "fitted line"),
        "multiple_linear": ("linear_interpretation", "meaningful_unit", "direction", "plain_english"),
        "regression_tree": ("tree_path", "tree_example_position", "tree_prediction", "tree_importance", "max_depth=2", "Training-only example row"),
        "classification_tree": ("tree_path", "tree_example_position", "tree_prediction", "tree_importance", "max_depth=2", "Training-only example row"),
        "logistic": ("logistic_coefficients", "logistic_interpretation", "pushes_model_toward", "logistic_positive_class", "weight_toward_"),
        "knn_cls": ("knn_fit_indices", "knn_neighbor_positions", "knn_self_neighbour_check", "kneighbors", "knn_neighbor_table"),
        "one_r": ("one_r_rules", "one_r_comparison", "one_r_majority_prediction"),
    }
    phase2b1_required_tokens = {
        "svm_cls": ("svm_fit_indices", "svm_support_positions", "svm_decision_values", "svm_prediction_story", "Support vectors per class"),
        "lda": ("lda_class_centres", "lda_fit_indices", "lda_probability_table", "lda_prediction_story", "shared"),
        "qda": ("qda_class_centres", "qda_spread_summary", "qda_fit_indices", "qda_probability_table", "regularisation"),
        "naive_bayes": ("nb_fit_indices", "nb_probability_evidence", "nb_prediction_story", "Prior P(class)", "Predicted P(class | features)"),
    }

    preprocessing_counts = {
        "direct_passthrough": 0,
        "direct_scaler": 0,
        "direct_encoder": 0,
        "simple_pipeline": 0,
        "column_transformer": 0,
    }
    removed_naive_bayes = []
    total_cells = 0
    teaching_checks = {
        "supervised_routes_with_step_guidance": 0,
        "supervised_baseline_metric_help": 0,
        "supervised_final_comparison_metadata": 0,
        "supervised_concept_metadata": 0,
        "phase2a_model_specific_routes": 0,
        "phase2a_model_ids": [],
        "phase2b1_model_specific_routes": 0,
        "phase2b1_model_ids": [],
    }
    phase2a_models_seen = set()
    phase2b1_models_seen = set()

    required_concepts = {
        "frame": {"feature", "target", "X", "y", "row"},
        "split": {"training-data", "final-test-set", "80-20-split"},
        "prepare": {"preprocessing"},
        "model": {"pipeline", "fit", "predict"},
        "baseline": {"cross-validation", "fold", "cv-purpose", "final-test-exclusion"},
        "tune": {"hyperparameter", "learned-parameter"},
    }

    for folds, routes in route_sets.items():
        for route in routes:
            ids = cell_ids(route)
            model_id = route["modelId"]
            task_type = route["modelTask"]
            if task_type == "unsupervised":
                if model_id == "kmeans":
                    expected = kmeans_ids
                elif model_id == "hierarchical":
                    expected = hierarchical_ids
                else:
                    expected = pca_ids
            else:
                expected = supervised_ids
            if ids != expected:
                raise AssertionError(
                    f"{folds}-fold {route['datasetId']}/{route['scenarioId']}/{model_id}: "
                    f"unexpected route order {ids}"
                )

            for cell in route["cells"]:
                total_cells += 1
                try:
                    ast.parse(cell["code"], filename=f"{route['datasetId']}:{cell['id']}")
                except SyntaxError as error:
                    raise AssertionError(
                        f"Python syntax error in {folds}-fold "
                        f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{cell['id']}: {error}"
                    ) from error
                if not cell["question"].strip() or not cell["caption"].strip():
                    raise AssertionError(f"Missing beginner explanation in {route}")
                if task_type != "unsupervised" and not cell.get("readingCue", "").strip():
                    raise AssertionError(
                        f"Missing Phase 1A reading cue for supervised step: "
                        f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{cell['id']}"
                    )

            if task_type != "unsupervised":
                teaching_checks["supervised_routes_with_step_guidance"] += 1
                for step_id, expected_keys in required_concepts.items():
                    metadata = next(cell for cell in route["cells"] if cell["id"] == step_id)
                    actual_keys = set(metadata.get("conceptKeys", []))
                    missing_keys = expected_keys - actual_keys
                    if missing_keys:
                        raise AssertionError(
                            f"Missing Phase 1B concepts {sorted(missing_keys)} for "
                            f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{step_id}"
                        )
                split_metadata = next(cell for cell in route["cells"] if cell["id"] == "split")
                split_keys = set(split_metadata["conceptKeys"])
                if route["dataset"]["split"] == "time":
                    if "chronological-split" not in split_keys or "random-split" in split_keys or "random-state" in split_keys:
                        raise AssertionError(f"Chronological split metadata is inaccurate: {route}")
                else:
                    if not {"random-split", "random-state"}.issubset(split_keys):
                        raise AssertionError(f"Random split metadata is incomplete: {route}")
                    if route["dataset"]["task"] == "classification" and "stratification" not in split_keys:
                        raise AssertionError(f"Classification stratification metadata is missing: {route}")

                prepare_metadata = next(cell for cell in route["cells"] if cell["id"] == "prepare")
                prepare_code = route_code(route, "prepare")
                prepare_keys = set(prepare_metadata["conceptKeys"])
                if "ColumnTransformer" in prepare_code and "column-transformer" not in prepare_keys:
                    raise AssertionError(f"ColumnTransformer concept is missing: {route}")
                if "StandardScaler" in prepare_code and "scaling" not in prepare_keys:
                    raise AssertionError(f"Scaling concept is missing: {route}")
                if any(token in prepare_code for token in ("OneHotEncoder", "OrdinalEncoder")) and "categorical-encoding" not in prepare_keys:
                    raise AssertionError(f"Categorical encoding concept is missing: {route}")
                if "handle_unknown" in prepare_code and "unknown-categories" not in prepare_keys:
                    raise AssertionError(f"Unknown-category safety concept is missing: {route}")
                numeric_binary = set(route["scenario"]["binary"]) & set(route["dataset"]["binaryNumeric"])
                if numeric_binary and "binary-features" not in prepare_keys:
                    raise AssertionError(f"Binary-feature concept is missing: {route}")

                baseline_code = route_code(route, "baseline")
                baseline_metadata = next(cell for cell in route["cells"] if cell["id"] == "baseline")
                baseline_keys = set(baseline_metadata["conceptKeys"])
                if route["dataset"]["split"] == "time":
                    if not {"time-series-split", "ordered-validation"}.issubset(baseline_keys) or "shuffle" in baseline_keys:
                        raise AssertionError(f"Time-series CV metadata is inaccurate: {route}")
                else:
                    if "shuffle" not in baseline_keys or "shuffle=True" not in baseline_code:
                        raise AssertionError(f"Standard CV shuffle metadata is incomplete: {route}")
                    if route["dataset"]["task"] == "classification" and "stratified-folds" not in baseline_keys:
                        raise AssertionError(f"Stratified-fold metadata is missing: {route}")

                baseline_metadata = next(cell for cell in route["cells"] if cell["id"] == "baseline")
                if not baseline_metadata.get("metricHelp") or not baseline_metadata.get("metricMeta"):
                    raise AssertionError(f"Baseline CV teaching metadata is incomplete: {route}")
                if not any(metric.get("key") == "macro_f1" if route["dataset"]["task"] == "classification" else metric.get("key") == "rmse" for metric in baseline_metadata["metricHelp"]):
                    raise AssertionError(f"Baseline teaching metadata does not define the primary metric: {route}")
                teaching_checks["supervised_baseline_metric_help"] += 1
                tune_metadata = next(cell for cell in route["cells"] if cell["id"] == "tune")
                if not tune_metadata.get("metricHelp") or not tune_metadata.get("metricMeta"):
                    raise AssertionError(f"Tuning metric reminder metadata is incomplete: {route}")
                tune_keys = set(tune_metadata.get("conceptKeys", []))
                tune_code = route_code(route, "tune")
                if "GridSearchCV" in tune_code:
                    if not {"model-hyperparameter", "GridSearchCV", "tuning", "final-test-exclusion"}.issubset(tune_keys):
                        raise AssertionError(f"GridSearchCV teaching metadata is incomplete: {route}")
                    if "model__" in tune_code and "pipeline-parameter-routing" not in tune_keys:
                        raise AssertionError(f"Pipeline parameter-routing explanation is missing: {route}")
                elif "keep-defaults" not in tune_keys:
                    raise AssertionError(f"Keep-defaults teaching metadata is missing: {route}")
                final_metadata = next(cell for cell in route["cells"] if cell["id"] == "final")
                if not final_metadata.get("comparison") or not final_metadata.get("metricMeta"):
                    raise AssertionError(f"Final-test comparison metadata is incomplete: {route}")
                if route["dataset"]["target"] == "popular":
                    frame_metadata = next(cell for cell in route["cells"] if cell["id"] == "frame")
                    if "derived from winpercent" not in " ".join(item["text"] for item in frame_metadata["concepts"]):
                        raise AssertionError(f"Derived Candy target is not grounded in Step 1 teaching: {route}")
                if route["dataset"]["prepare"] != "df":
                    frame_metadata = next(cell for cell in route["cells"] if cell["id"] == "frame")
                    if "modelling frame" not in " ".join(item["text"] for item in frame_metadata["concepts"]):
                        raise AssertionError(f"Derived modelling frame is not explained: {route}")
                teaching_checks["supervised_concept_metadata"] += 1
                teaching_checks["supervised_final_comparison_metadata"] += 1

            frame = route_code(route, "frame")
            if any(token in frame for token in ("continuous_features = []", "binary_features = []", "categorical_features = []", "target_name")):
                raise AssertionError(f"Frame rediscovered or declared empty feature groups: {route}")
            if "pd.DataFrame" in frame:
                raise AssertionError(f"Frame duplicates UI metadata instead of showing X.head(): {route}")
            route_source = "\n".join(cell["code"] for cell in route["cells"])
            if route["dataset"]["prepare"] == "df":
                if "model_df" in route_source or "X = df[feature_names].copy()" not in frame:
                    raise AssertionError(f"Direct dataset route still creates model_df: {route['datasetId']}/{route['scenarioId']}/{route['modelId']}")
            elif "model_df = " not in frame:
                raise AssertionError(f"Transformed dataset route does not expose its modelling dataframe: {route}")

            if task_type != "unsupervised":
                split_index = ids.index("split")
                final_index = ids.index("final")
                for index, cell in enumerate(route["cells"]):
                    code = cell["code"]
                    if index < final_index and index != split_index and any(
                        token in code for token in (
                            "X_test", "y_test", "test_prediction", "test_result", "macro_f1 =", "accuracy =",
                            "rmse =", "mae =", "r2 =", "final_model ="
                        )
                    ):
                        raise AssertionError(
                            f"Final test variable used before the final cell: {route['datasetId']}/{route['scenarioId']}/{model_id}/{cell['id']}"
                        )

                baseline = route_code(route, "baseline")
                if "cross_validate(" not in baseline or any(
                    token in baseline for token in ("fold_plan", "n_jobs=1", 'error_score="raise"')
                ):
                    raise AssertionError(f"Baseline is not the direct cross_validate workflow: {route}")
                expected_splitter = (
                    "TimeSeriesSplit"
                    if route["dataset"]["split"] == "time"
                    else "StratifiedKFold"
                    if route["dataset"]["task"] == "classification"
                    else "KFold"
                )
                if expected_splitter not in baseline:
                    raise AssertionError(f"Wrong splitter in baseline: {route}")
                if f"n_splits={folds}" not in baseline:
                    raise AssertionError(f"Fold setting did not reach the generated splitter: {route}")

                split = route_code(route, "split")
                if route["dataset"]["split"] == "time":
                    if "split_at = int(len(X) * 0.80)" not in split or "X.iloc[:split_at]" not in split:
                        raise AssertionError(f"Chronological 80/20 split was not generated: {route}")
                else:
                    if "test_size=0.20" not in split or "random_state=42" not in split:
                        raise AssertionError(f"Deterministic 80/20 split was not generated: {route}")
                    if route["dataset"]["task"] == "classification" and "stratify=y" not in split:
                        raise AssertionError(f"Classification split is not stratified: {route}")

                prepare = route_code(route, "prepare")
                if "feature_type" in prepare or "treatment" in prepare:
                    raise AssertionError(f"Preparation cell duplicates UI metadata: {route}")
                if not route["dataset"]["missing"] and "SimpleImputer" in prepare:
                    raise AssertionError(f"Complete bundled route still imputes: {route}")
                preparation_comments = [
                    line for line in prepare.splitlines()
                    if line.lstrip().startswith("#") and not line.lstrip().startswith("# 4 ·")
                ]
                if len(preparation_comments) > 3:
                    raise AssertionError(f"Preparation cell has too many learner comments: {route}")
                if "selected scenario already supplies" in prepare:
                    raise AssertionError(f"Preparation cell exposes generator-internal commentary: {route}")
                if "pd.DataFrame" in route_code(route, "model"):
                    raise AssertionError(f"Model cell duplicates UI metadata instead of showing pipeline: {route}")

                explore = route_code(route, "explore")
                if "X_train" not in explore or "y_train" not in explore:
                    raise AssertionError(f"Supervised exploration does not use training-only inputs: {route}")
                if any(token in explore for token in ("X_test", "y_test", "test_prediction")):
                    raise AssertionError(f"Supervised exploration consults the saved test set: {route}")
                if route["dataset"]["task"] == "regression":
                    mixed = bool(route["scenario"]["binary"] or route["scenario"]["categorical"])
                    expected_summary = 'describe(include="all").T' if mixed else "describe().T"
                    if expected_summary not in explore:
                        raise AssertionError(f"Regression exploration summary does not match the feature mix: {route}")

                scenario = route["scenario"]
                numeric_binary = set(scenario["binary"]) & set(route["dataset"]["binaryNumeric"])
                encoded = list(scenario["categorical"]) + [
                    name for name in scenario["binary"] if name not in numeric_binary
                ]
                all_numeric = not encoded
                mixed_treatment = bool(scenario["continuous"]) and (
                    bool(encoded)
                    or (bool(numeric_binary) and bool(payload["models"][model_id].get("scale")))
                )
                if "ColumnTransformer" in prepare and not mixed_treatment:
                    raise AssertionError(f"Unnecessary ColumnTransformer: {route}")
                if numeric_binary and "OrdinalEncoder" in prepare:
                    raise AssertionError(f"Numeric binary input was ordinal-encoded: {route}")
                if all_numeric and not mixed_treatment and "ColumnTransformer" in prepare:
                    raise AssertionError(f"All-numeric route used a ColumnTransformer: {route}")
                if "preprocessor = \"passthrough\"" in prepare:
                    preprocessing_counts["direct_passthrough"] += 1
                elif "preprocessor = StandardScaler()" in prepare:
                    preprocessing_counts["direct_scaler"] += 1
                elif "preprocessor = OrdinalEncoder" in prepare or "preprocessor = OneHotEncoder" in prepare:
                    preprocessing_counts["direct_encoder"] += 1
                elif "ColumnTransformer" in prepare:
                    preprocessing_counts["column_transformer"] += 1
                elif "preprocessor = Pipeline" in prepare:
                    preprocessing_counts["simple_pipeline"] += 1

                tune = route_code(route, "tune")
                model_grid = payload["models"][model_id]
                has_grid = model_grid.get("name") not in {
                    "Simple Linear Regression",
                    "Multiple Linear Regression",
                }
                if model_id == "one_r" and not scenario["continuous"]:
                    has_grid = False
                if has_grid and "GridSearchCV" not in tune:
                    raise AssertionError(f"Expected a readable grid for {route}")
                if not has_grid and "GridSearchCV" in tune:
                    raise AssertionError(f"Default model unexpectedly uses GridSearchCV: {route}")
                if "best_pipeline" not in tune:
                    raise AssertionError(f"Tuning/default cell does not define best_pipeline: {route}")
                if any(token in tune for token in ("return_train_score", "refit=", "tuning_results", "rank_test_", "n_jobs=1", 'error_score="raise"')):
                    raise AssertionError(f"Tuning cell still contains multi-metric or low-level clutter: {route}")

                diagnostic = route_code(route, "diagnose")
                if any(
                    token in diagnostic
                    for token in ("classification_report", "diagnostic_rmse", "diagnostic_r2", "root_mean_squared_error", "r2_score", "X_test", "y_test", "test_prediction", "test_result")
                ):
                    raise AssertionError(f"Diagnostic cell contains an aggregate score/report: {route}")
                if ids.index("tune") >= ids.index("diagnose") or "best_pipeline" not in diagnostic:
                    raise AssertionError(f"Diagnostic does not follow tuning/default selection: {route}")
                if "best_pipeline" not in route_code(route, "final"):
                    raise AssertionError(f"Final cell does not use best_pipeline: {route}")

                diagnose_metadata = next(cell for cell in route["cells"] if cell["id"] == "diagnose")
                model_teaching = diagnose_metadata.get("modelTeaching")
                if model_id in phase2_model_ids:
                    if model_id in phase2a_model_ids:
                        phase2a_models_seen.add(model_id)
                        teaching_checks["phase2a_model_specific_routes"] += 1
                    if model_id in phase2b1_model_ids:
                        phase2b1_models_seen.add(model_id)
                        teaching_checks["phase2b1_model_specific_routes"] += 1
                    if not isinstance(model_teaching, dict) or model_teaching.get("modelId") != model_id:
                        raise AssertionError(f"Model-specific teaching metadata is missing: {route}")
                    if any(not str(model_teaching.get(key, "")).strip() for key in ("learned", "see", "read", "watchOut")):
                        raise AssertionError(f"Model-specific teaching metadata is incomplete: {route}")
                    required_tokens = phase2a_required_tokens.get(model_id, ()) if model_id in phase2a_model_ids else phase2b1_required_tokens.get(model_id, ())
                    missing_tokens = [token for token in required_tokens if token not in diagnostic]
                    if model_id == "polynomial":
                        expected_polynomial_tokens = ("poly_grid", "poly_curve", "polynomial_degree") if len(route["scenario"]["continuous"]) == 1 else ("polynomial_terms", "no single 2D fitted curve")
                        missing_tokens.extend(token for token in expected_polynomial_tokens if token not in diagnostic)
                    if missing_tokens:
                        raise AssertionError(f"{model_id} diagnostic is missing {missing_tokens}: {route}")
                    if model_id == "multiple_linear" and "sort_values" in diagnostic:
                        raise AssertionError(f"Multiple linear coefficients are being ranked by raw magnitude: {route}")
                elif model_teaching:
                    raise AssertionError(f"A Phase 2 model-specific diagnostic leaked into an out-of-scope model: {route}")

                if model_id == "one_r":
                    full_code = "\n".join(cell["code"] for cell in route["cells"])
                    if "class OneRClassifier" in full_code or ".rules_" in full_code:
                        raise AssertionError(f"Full One-R implementation leaked into the normal route: {route}")
                    if "OneRClassifier(bins=5)" not in route_code(route, "model"):
                        raise AssertionError(f"Visible One-R cell is not the simple estimator: {route}")
                    if "one_r_rule_table" not in diagnostic:
                        raise AssertionError(f"One-R interpretation is not a readable rule table: {route}")

                if model_id == "polynomial":
                    model_code = route_code(route, "model")
                    positions = [
                        model_code.index('("poly"'),
                        model_code.index('("scale"'),
                        model_code.index('("regression"'),
                    ]
                    if positions != sorted(positions):
                        raise AssertionError(f"Polynomial pipeline order is wrong: {route}")

                if model_id == "qda" and "small amount of regularisation" not in route_code(route, "model"):
                    raise AssertionError(f"QDA regularisation is not explained for beginners: {route}")

                if model_id == "naive_bayes":
                    kind = (
                        "continuous" if route["scenario"]["continuous"] else
                        "binary" if route["scenario"]["binary"] else
                        "categorical"
                    )
                    model_code = route_code(route, "model")
                    diagnostic = route_code(route, "diagnose")
                    if '"probability":' in diagnostic or '"score":' in diagnostic or '"value":' in diagnostic:
                        raise AssertionError(f"Naive Bayes probability output has an ambiguous generic heading: {route}")
                    for label in ("Prior P(class)", "Likelihood P(feature", "Predicted P(class | features)"):
                        if label not in diagnostic:
                            raise AssertionError(f"Naive Bayes probability output is missing an explicit {label} label: {route}")
                    if kind == "categorical":
                        if "OneHotEncoder" not in prepare or "OrdinalEncoder" in prepare or "BernoulliNB" not in model_code:
                            raise AssertionError(f"Categorical Naive Bayes is not the unseen-category-safe Bernoulli route: {route}")
                        if "nb_one_probabilities" not in diagnostic or "nb_feature_labels" not in diagnostic:
                            raise AssertionError(f"Categorical Naive Bayes interpretation is not original-category likelihood evidence: {route}")
                    elif kind == "binary":
                        if "BernoulliNB" not in model_code or "nb_one_probabilities" not in diagnostic:
                            raise AssertionError(f"Binary Naive Bayes interpretation is incomplete: {route}")
                    elif "GaussianNB" not in model_code or "nb_gaussian_means" not in diagnostic or "nb_gaussian_stds" not in diagnostic:
                        raise AssertionError(f"Gaussian Naive Bayes interpretation is incomplete: {route}")

            else:
                unsupervised_code = "\n".join(cell["code"] for cell in route["cells"])
                if any(token in unsupervised_code for token in ("y_train", "y_test", "X_test", "test_prediction")):
                    raise AssertionError(f"Unsupervised route contains supervised target/test fitting: {route}")
                if model_id in {"kmeans", "hierarchical"}:
                    if "suggested_k" not in unsupervised_code or "selected_k" not in unsupervised_code or "best_k" in unsupervised_code:
                        raise AssertionError(f"Cluster route does not separate suggestion from selection: {route}")
                    if "sample_size = min(2000" not in unsupervised_code and "silhouette_size = min(2000" not in unsupervised_code:
                        raise AssertionError(f"Cluster silhouette is not bounded by a reproducible sample: {route}")
                    if "random_state=42" not in unsupervised_code:
                        raise AssertionError(f"Cluster sampling is not reproducible: {route}")
                if model_id == "pca":
                    if "full_pca = PCA().fit(Z)" not in unsupervised_code:
                        raise AssertionError(f"PCA does not fit one full model: {route}")
                    if "Z_reduced = full_pca.transform(Z)[:, :n_components_90]" not in unsupervised_code:
                        raise AssertionError(f"PCA does not derive Z_reduced from full_pca: {route}")
                    if "\npca = PCA(" in unsupervised_code:
                        raise AssertionError(f"PCA refits a second selected model: {route}")

    for config in payload["datasets"].values():
        for scenario in config["scenarios"]:
            for model_id, model in payload["models"].items():
                if model_id != "naive_bayes" or model["task"] != config["task"]:
                    continue
                pure = (
                    (bool(scenario["continuous"]) and not scenario["binary"] and not scenario["categorical"])
                    or (bool(scenario["binary"]) and not scenario["continuous"] and not scenario["categorical"])
                    or (bool(scenario["categorical"]) and not scenario["continuous"] and not scenario["binary"])
                )
                if not pure:
                    removed_naive_bayes.append(f"{config['name']} / {scenario['name']}")
                elif not any(
                    route["datasetId"] == next(key for key, item in payload["datasets"].items() if item is config)
                    and route["scenarioId"] == scenario["id"]
                    and route["modelId"] == "naive_bayes"
                    for route in route_sets["5"]
                ):
                    raise AssertionError(f"Pure Naive Bayes route is missing: {config['name']} / {scenario['name']}")

    for route in route_sets["5"]:
        if route["modelId"] == "naive_bayes":
            source = route["scenario"]
            pure_kind = sum(bool(source[key]) for key in ("continuous", "binary", "categorical"))
            if pure_kind != 1:
                raise AssertionError(f"Mixed Naive Bayes route was generated: {route}")

    expected_phase2a_routes = sum(
        route["modelId"] in phase2a_model_ids
        for routes in route_sets.values()
        for route in routes
    )
    if phase2a_models_seen != phase2a_model_ids:
        raise AssertionError(
            f"Phase 2A model-specific coverage is incomplete; expected {sorted(phase2a_model_ids)}, "
            f"saw {sorted(phase2a_models_seen)}"
        )
    if teaching_checks["phase2a_model_specific_routes"] != expected_phase2a_routes:
        raise AssertionError(
            f"Phase 2A model-specific metadata count mismatch; expected {expected_phase2a_routes}, "
            f"saw {teaching_checks['phase2a_model_specific_routes']}"
        )
    teaching_checks["phase2a_model_ids"] = sorted(phase2a_models_seen)
    expected_phase2b1_routes = sum(
        route["modelId"] in phase2b1_model_ids
        for routes in route_sets.values()
        for route in routes
    )
    if phase2b1_models_seen != phase2b1_model_ids:
        raise AssertionError(
            f"Phase 2B-1 model-specific coverage is incomplete; expected {sorted(phase2b1_model_ids)}, "
            f"saw {sorted(phase2b1_models_seen)}"
        )
    if teaching_checks["phase2b1_model_specific_routes"] != expected_phase2b1_routes:
        raise AssertionError(
            f"Phase 2B-1 model-specific metadata count mismatch; expected {expected_phase2b1_routes}, "
            f"saw {teaching_checks['phase2b1_model_specific_routes']}"
        )
    teaching_checks["phase2b1_model_ids"] = sorted(phase2b1_models_seen)

    boundary_fixtures = payload.get("phase2bFixtures", {})
    if set(boundary_fixtures) != {"svm_cls", "lda", "qda"}:
        raise AssertionError("Phase 2B-1 boundary fixtures are incomplete.")
    for model_id, fixture in boundary_fixtures.items():
        if cell_ids(fixture) != supervised_ids:
            raise AssertionError(f"Phase 2B-1 boundary fixture has the wrong guided steps: {model_id}")
        fixture_diagnostic = route_code(fixture, "diagnose")
        if any(token in fixture_diagnostic for token in ("X_test", "y_test", "test_prediction", "test_result")):
            raise AssertionError(f"Phase 2B-1 boundary fixture accesses final-test data: {model_id}")
        fixture_tokens = {
            "svm_cls": ("svm_grid_points", "svm_grid_predictions", "support vectors"),
            "lda": ("lda_grid_points", "lda_grid_predictions", "class centres"),
            "qda": ("qda_grid_points", "qda_grid_predictions", "class-specific spread"),
        }[model_id]
        fixture_diagnostic_lower = fixture_diagnostic.lower()
        if any(token.lower() not in fixture_diagnostic_lower for token in fixture_tokens):
            raise AssertionError(f"Phase 2B-1 {model_id} boundary fixture is not model-faithful: {fixture_tokens}")

    model_df_sources = {
        dataset_id: config["prepare"]
        for dataset_id, config in payload["datasets"].items()
        if config["prepare"] != "df"
    }

    return {
        "route_counts": {key: len(value) for key, value in route_sets.items()},
        "total_cells_per_fold": total_cells // len(route_sets),
        "supervised_routes": sum(route["modelTask"] != "unsupervised" for route in route_sets["5"]),
        "unsupervised_routes": sum(route["modelTask"] == "unsupervised" for route in route_sets["5"]),
        "removed_naive_bayes_combinations": removed_naive_bayes,
        "preprocessing_structures": preprocessing_counts,
        "preprocessing_structures_per_fold": {
            key: value // len(route_sets) for key, value in preprocessing_counts.items()
        },
        "model_df_sources": model_df_sources,
        "reset_state": reset_result,
        "teaching_metadata": teaching_checks,
    }


def run_categorical_nb_unseen_test(payload: dict) -> dict:
    import numpy as np
    import pandas as pd

    route = next(
        route for route in payload["routes"]["5"]
        if route["datasetId"] == "car" and route["modelId"] == "naive_bayes"
    )
    feature_names = route["scenario"]["categorical"]
    namespace = {"pd": pd, "np": np, "__builtins__": __builtins__}
    namespace["X_train"] = pd.DataFrame(
        {name: ["low", "medium", "high", "low"] for name in feature_names}
    )
    namespace["y_train"] = pd.Series(["unacc", "acc", "good", "unacc"])
    namespace["X_test"] = namespace["X_train"].iloc[[0]].copy()
    namespace["X_test"].loc[namespace["X_test"].index[0], feature_names[0]] = "category-never-seen-in-training"
    exec(route_code(route, "prepare"), namespace, namespace)
    exec(route_code(route, "model"), namespace, namespace)
    namespace["pipeline"].fit(namespace["X_train"], namespace["y_train"])
    prediction = namespace["pipeline"].predict(namespace["X_test"])
    if len(prediction) != 1:
        raise AssertionError("Categorical Naive Bayes did not predict the unseen-category row.")
    return {"route": "car/categorical/naive_bayes", "unseen_category_prediction": str(prediction[0])}


def run_dataframe_serializer_regression(payload: dict, pd, np) -> dict:
    """Exercise the same Python DataFrame payload serializer used by the worker."""

    namespace = {"pd": pd, "np": np, "__builtins__": __builtins__}
    exec(payload["dataFrameSerializerSource"], namespace, namespace)
    serialize = namespace["serialize_dataframe_result"]

    default_index = serialize(pd.DataFrame({"a": [1, 2]}))
    if default_index["columns"] != ["a"] or default_index["rows"] != [[1], [2]]:
        raise AssertionError(f"Default RangeIndex was rendered as an unnecessary or incorrect column: {default_index}")

    unnamed_index = serialize(pd.DataFrame({"mean": [1.2, 3.4]}, index=["height", "weight"]))
    if unnamed_index["columns"][:2] != ["index", "mean"] or [row[0] for row in unnamed_index["rows"]] != ["height", "weight"]:
        raise AssertionError(f"Unnamed semantic index was not preserved: {unnamed_index}")

    named_index_frame = pd.DataFrame({"mean": [1.2, 3.4]}, index=["height", "weight"])
    named_index_frame.index.name = "feature"
    named_index = serialize(named_index_frame)
    if named_index["columns"][:2] != ["feature", "mean"]:
        raise AssertionError(f"Named index was not rendered as the first visible column: {named_index}")

    describe_frame = pd.DataFrame(
        {"radius_mean": [10.0, 11.0, 12.0], "texture_mean": [8.0, 9.0, 10.0]}
    ).describe().T
    describe_result = serialize(describe_frame)
    if {row[0] for row in describe_result["rows"]} != {"radius_mean", "texture_mean"}:
        raise AssertionError(f"describe().T lost its feature-name index: {describe_result}")

    loading_frame = pd.DataFrame(
        {"PC1": [0.4, -0.2], "PC2": [0.1, 0.7]},
        index=["radius_mean", "texture_mean"],
    )
    loading_result = serialize(loading_frame)
    if {row[0] for row in loading_result["rows"]} != {"radius_mean", "texture_mean"}:
        raise AssertionError(f"PCA-style loadings lost their source-feature index: {loading_result}")

    multi_index_frame = pd.DataFrame(
        {"value": [1, 2]},
        index=pd.MultiIndex.from_tuples(
            [("train", "a"), ("test", "b")], names=["split", "row"]
        ),
    )
    multi_index = serialize(multi_index_frame)
    if multi_index["columns"][:2] != ["split", "row"] or multi_index["rows"][:2] != [["train", "a", 1], ["test", "b", 2]]:
        raise AssertionError(f"MultiIndex levels were not preserved: {multi_index}")

    truncated_frame = pd.DataFrame(
        {f"column_{index}": range(55) for index in range(21)},
        index=[f"row-{index}" for index in range(55)],
    )
    truncated = serialize(truncated_frame)
    if (
        len(truncated["rows"]) != 50
        or len(truncated["columns"]) != 21
        or truncated["rowCount"] != 55
        or truncated["columnCount"] != 21
        or truncated["rows"][49][0] != "row-49"
        or truncated["rows"][49][20] != 49
    ):
        raise AssertionError(f"Index columns were not aligned with the truncated visible rows: {truncated}")

    return {
        "default_range_index_clean": True,
        "unnamed_index_preserved": True,
        "named_index_first": True,
        "describe_transpose_feature_names": True,
        "pca_loading_feature_names": True,
        "multiindex_levels_preserved": True,
        "truncation_alignment_preserved": True,
    }


def run_one_r_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Guard categorical, mixed, and continuous One-R semantics, including bins=3."""

    def base_namespace():
        namespace = {
            "pd": pd,
            "np": np,
            "plt": plt,
            "sns": sns,
            "__builtins__": __builtins__,
        }
        exec(payload["oneRHelperSource"], namespace, namespace)
        return namespace

    car_route = next(
        route
        for route in payload["routes"]["5"]
        if route["datasetId"] == "car"
        and route["scenarioId"] == "categorical"
        and route["modelId"] == "one_r"
    )
    fixture = base_namespace()
    exec(route_code(car_route, "prepare"), fixture, fixture)
    exec(route_code(car_route, "model"), fixture, fixture)
    fixture_features = {
        "buying": ["low", "med", "high", "vhigh"] * 3,
        "maintenance": ["low"] * 12,
        "doors": ["2"] * 12,
        "persons": ["2"] * 12,
        "luggage_boot": ["small"] * 12,
        "safety": ["low"] * 12,
    }
    fixture_X = pd.DataFrame(fixture_features)
    fixture_y = pd.Series(["low-class", "med-class", "high-class", "vhigh-class"] * 3)
    fixture["pipeline"].fit(fixture_X, fixture_y)
    fixture_model = fixture["pipeline"].named_steps["model"]
    fixture_table = fixture["one_r_rule_table"](
        fixture_model, fixture["pipeline"].named_steps["prepare"], list(fixture_X.columns)
    )
    expected_buying = {"low", "med", "high", "vhigh"}
    if (
        fixture_model.best_feature_ != 0
        or not fixture_model.is_discrete_
        or set(fixture_table["interval"]) != expected_buying
        or len(fixture_table) != 4
        or int(fixture_table["training_rows"].sum()) != len(fixture_X)
    ):
        raise AssertionError(f"The bins=3 four-category buying fixture was merged or mislabeled: {fixture_table}")
    fixture_counts = dict(zip(fixture_table["interval"], fixture_table["training_rows"]))
    if any(int(fixture_counts[category]) != int((fixture_X["buying"] == category).sum()) for category in expected_buying):
        raise AssertionError(f"Buying rule counts do not match the original category membership: {fixture_table}")

    actual = base_namespace()
    actual["df"] = pd.read_csv(ROOT / car_route["dataset"]["file"], sep=car_route["dataset"]["sep"])
    for cell_id in ("frame", "split", "prepare", "model", "baseline", "tune", "diagnose"):
        exec(route_code(car_route, cell_id), actual, actual)
    actual_table = actual["one_r_rules"]
    actual_feature = str(actual_table["feature"].iloc[0])
    actual_values = actual["X_train"][actual_feature].astype(str)
    actual_counts = dict(actual_values.value_counts())
    actual_rule_counts = dict(zip(actual_table["interval"], actual_table["training_rows"]))
    if set(actual_rule_counts) != set(actual_counts) or int(actual_table["training_rows"].sum()) != len(actual_values):
        raise AssertionError(f"Car One-R displayed categories or total row counts are inconsistent: {actual_table}")
    if any(int(actual_rule_counts[label]) != int(actual_counts[label]) for label in actual_counts):
        raise AssertionError(f"Car One-R displayed row counts do not match original category membership: {actual_table}")

    mixed_route = next(
        route
        for route in payload["routes"]["5"]
        if route["datasetId"] == "penguins"
        and route["scenarioId"] == "continuous_category"
        and route["modelId"] == "one_r"
    )
    mixed = base_namespace()
    mixed["df"] = pd.read_csv(ROOT / mixed_route["dataset"]["file"], sep=mixed_route["dataset"]["sep"])
    for cell_id in ("frame", "split", "prepare"):
        exec(route_code(mixed_route, cell_id), mixed, mixed)
    mixed["preprocessor"].fit(mixed["X_train"], mixed["y_train"])
    mixed_values = mixed["preprocessor"].transform(mixed["X_train"])
    mixed_mask = np.asarray(mixed_values.categorical_mask, dtype=bool)
    if mixed_mask.tolist() != [False, False, False, False, True]:
        raise AssertionError(f"Mixed One-R preprocessing exposed the wrong feature-type mask: {mixed_mask}")
    continuous_candidate = mixed["OneRClassifier"](bins=3).fit(
        mixed["_OneRFeatureMatrix"](mixed_values[:, [0]], [False]), mixed["y_train"]
    )
    categorical_candidate = mixed["OneRClassifier"](bins=3).fit(
        mixed["_OneRFeatureMatrix"](mixed_values[:, [4]], [True]), mixed["y_train"]
    )
    if continuous_candidate.edges_ is None or not any(str(row["interval"]).startswith("[") for row in continuous_candidate.rule_rows_):
        raise AssertionError("Mixed-route continuous One-R candidates no longer use numeric intervals.")
    if categorical_candidate.edges_ is not None:
        raise AssertionError("Mixed-route categorical One-R candidates were quantile-binned.")
    if len(categorical_candidate.rule_rows_) != mixed["X_train"]["island"].nunique():
        raise AssertionError("Mixed-route categorical One-R did not retain one rule per original category.")

    continuous_route = next(
        route
        for route in payload["routes"]["5"]
        if route["datasetId"] == "breast"
        and route["scenarioId"] == "continuous5"
        and route["modelId"] == "one_r"
    )
    continuous = base_namespace()
    continuous["df"] = pd.read_csv(ROOT / continuous_route["dataset"]["file"], sep=continuous_route["dataset"]["sep"])
    for cell_id in ("frame", "prepare"):
        exec(route_code(continuous_route, cell_id), continuous, continuous)
    continuous["preprocessor"].fit(continuous["X"], continuous["y"])
    continuous_values = continuous["preprocessor"].transform(continuous["X"])
    pure_continuous = continuous["OneRClassifier"](bins=3).fit(
        continuous["_OneRFeatureMatrix"](continuous_values[:, [0]], [False]), continuous["y"]
    )
    if pure_continuous.edges_ is None or pure_continuous.is_discrete_:
        raise AssertionError("Pure-continuous One-R binning was disabled.")

    return {
        "car_bins_3_buying_categories_distinct": sorted(expected_buying),
        "car_fixture_rule_counts_exact": True,
        "car_actual_route_rule_counts_exact": True,
        "mixed_mask_explicit": mixed_mask.tolist(),
        "mixed_continuous_intervals": True,
        "mixed_categorical_values": True,
        "pure_continuous_intervals": True,
    }


def run_pandas_reset_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Exercise the reset source with real pandas objects and mutated aliases/data."""

    generated_names = {
        "X", "X_train", "X_test", "Z", "pipeline", "best_pipeline", "search",
        "diagnostic_model", "final_model", "test_prediction", "macro_f1", "accuracy",
        "rmse", "mae", "r2", "clusters", "selected_k", "full_pca", "Z_reduced",
    }
    original = pd.DataFrame({
        "category": pd.Series(["a", "b", "a"], dtype="string"),
        "value": pd.Series([1, 2, 3], dtype="int64"),
    })

    def make_namespace(keep_data):
        namespace = {
            "pd": pd,
            "np": np,
            "plt": plt,
            "sns": sns,
            "display": lambda value: None,
            "__builtins__": __builtins__,
        }
        exec(payload["oneRHelperSource"], namespace, namespace)
        namespace["BASE_GLOBAL_NAMES"] = frozenset(namespace) | {"BASE_GLOBAL_NAMES"}
        baseline_snapshot = dict(namespace)
        namespace["__baseline_values_from_worker"] = baseline_snapshot
        namespace["df"] = original.copy(deep=True)
        namespace["__raw_df_snapshot_from_worker"] = original.copy(deep=True)
        namespace["__keep_data"] = keep_data
        return namespace, baseline_snapshot

    namespace, baseline_snapshot = make_namespace(True)
    namespace["df"].drop(columns=["value"], inplace=True)
    namespace["pd"] = None
    namespace["np"] = "broken"
    namespace.pop("sns")
    namespace["some_random_variable"] = 123
    namespace.update({name: object() for name in generated_names})
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    assert_exact_namespace(namespace, set(baseline_snapshot) | {"df"}, "real-data keepData=True reset")
    for name in ("pd", "np", "plt", "sns", "display", "OneRClassifier", "one_r_rule_table"):
        if namespace.get(name) is not baseline_snapshot[name]:
            raise AssertionError(f"Real-data reset did not restore baseline binding {name!r}.")
    if "some_random_variable" in namespace or any(name in namespace for name in generated_names):
        raise AssertionError("Real-data reset left a generated or custom global.")
    pd.testing.assert_frame_equal(namespace["df"], original, check_exact=True, check_dtype=True)

    namespace, baseline_snapshot = make_namespace(False)
    namespace["df"].drop(columns=["category"], inplace=True)
    namespace["pd"] = None
    namespace.pop("sns")
    namespace.update({name: object() for name in generated_names})
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    assert_exact_namespace(namespace, set(baseline_snapshot), "real-data keepData=False reset")
    if "df" in namespace or any(name in namespace for name in generated_names):
        raise AssertionError("Real-data keepData=False reset did not clear the dataset and modelling globals.")
    for name in ("pd", "np", "plt", "sns", "display"):
        if namespace.get(name) is not baseline_snapshot[name]:
            raise AssertionError(f"keepData=False reset did not restore baseline binding {name!r}.")

    return {
        "keep_data_true_namespace_exact": True,
        "keep_data_false_namespace_exact": True,
        "baseline_aliases_restored": True,
        "raw_df_columns_rows_values_dtypes_order_restored": True,
        "generated_globals_removed": True,
        "keep_data_false_clears_df": True,
    }


def choose_runtime_routes(routes: list[dict], mode: str) -> list[dict]:
    if mode == "full":
        return routes
    selected = []
    seen = set()
    for route in routes:
        key = (route["modelId"], route["modelTask"], route["dataset"]["split"])
        if key not in seen:
            selected.append(route)
            seen.add(key)
    return selected


def _route_for_teaching_runtime(payload: dict, dataset_id: str, scenario_id: str, model_id: str) -> dict:
    for route in payload["routes"]["5"]:
        if (
            route["datasetId"] == dataset_id
            and route["scenarioId"] == scenario_id
            and route["modelId"] == model_id
        ):
            return route
    raise AssertionError(f"Teaching runtime fixture route is missing: {dataset_id}/{scenario_id}/{model_id}")


def _execute_route_to_cell(payload: dict, route: dict, pd, np, plt, sns, stop_at: str, before_cell=None) -> dict:
    namespace = {
        "pd": pd,
        "np": np,
        "plt": plt,
        "sns": sns,
        "__builtins__": __builtins__,
    }
    dataset = route["dataset"]
    namespace["df"] = pd.read_csv(ROOT / dataset["file"], sep=dataset["sep"])
    exec(payload["oneRHelperSource"], namespace, namespace)
    for cell in route["cells"]:
        if before_cell:
            before_cell(namespace, cell)
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            exec(cell["code"], namespace, namespace)
        plt.close("all")
        if cell["id"] == stop_at:
            return namespace
    raise AssertionError(f"Route did not contain requested teaching runtime cell {stop_at!r}.")


def _same_value(left, right, np) -> bool:
    try:
        return bool(np.asarray(left == right).all())
    except Exception:  # noqa: BLE001
        return str(left) == str(right)


def _assert_tree_path_fidelity(namespace: dict, classification: bool, np) -> None:
    if namespace.get("tree_example_position") != 0:
        raise AssertionError("Tree diagnostic did not use its deterministic first training row.")
    fitted = namespace["fitted"]
    tree_row = namespace["tree_row"]
    preparer = namespace["tree_preparer"]
    transformed = tree_row.to_numpy() if isinstance(preparer, str) else preparer.transform(tree_row)
    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()
    encoded_names = [str(name) for name in namespace["encoded_names"]]
    expected_rows = []
    node = 0
    while fitted.tree_.children_left[node] != fitted.tree_.children_right[node]:
        feature_index = int(fitted.tree_.feature[node])
        threshold = float(fitted.tree_.threshold[node])
        observed = float(transformed[0, feature_index])
        go_left = observed <= threshold
        expected_rows.append({
            "step": len(expected_rows) + 1,
            "condition": f"{encoded_names[feature_index]} <= {threshold:.3g}" if go_left else f"{encoded_names[feature_index]} > {threshold:.3g}",
            "observed_value": observed,
            "next_branch": "left" if go_left else "right",
        })
        node = int(fitted.tree_.children_left[node] if go_left else fitted.tree_.children_right[node])
    actual_path = namespace["tree_path"]
    if len(actual_path) != len(expected_rows):
        raise AssertionError(f"Displayed tree path length does not match the fitted tree: {actual_path}")
    for actual, expected in zip(actual_path.to_dict("records"), expected_rows):
        if actual["step"] != expected["step"] or actual["condition"] != expected["condition"] or actual["next_branch"] != expected["next_branch"]:
            raise AssertionError(f"Displayed tree path does not match the fitted split sequence: {actual_path}")
        if not np.isclose(float(actual["observed_value"]), expected["observed_value"]):
            raise AssertionError(f"Displayed tree path value does not match the fitted row: {actual_path}")
    applied_input = namespace["pd"].DataFrame(transformed, columns=encoded_names) if hasattr(fitted, "feature_names_in_") else transformed
    applied_node = int(fitted.apply(applied_input)[0])
    if node != applied_node or int(namespace["tree_node"]) != applied_node:
        raise AssertionError("Displayed tree path did not end at the fitted row's leaf.")
    expected_prediction = namespace["diagnostic_model"].predict(tree_row)[0]
    if not _same_value(namespace["tree_prediction"], expected_prediction, np):
        raise AssertionError("Displayed tree prediction does not match the fitted tree leaf.")
    if not _same_value(namespace["tree_actual"], namespace["y_train"].iloc[0], np):
        raise AssertionError("Tree diagnostic did not display the selected training row's actual value.")
    importance = namespace["tree_importance"]
    importance_by_feature = dict(zip(importance["feature"].astype(str), importance["importance"].astype(float)))
    for feature, expected in zip(encoded_names, fitted.feature_importances_):
        if feature not in importance_by_feature or not np.isclose(importance_by_feature[feature], expected):
            raise AssertionError("Displayed tree feature usage does not match the fitted estimator.")
    if classification and "tree_class_labels" not in namespace:
        raise AssertionError("Classification-tree diagnostic did not retain class labels.")


def run_phase2a_model_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check that each Phase 2A interpretation is derived from its fitted model."""

    def run(dataset_id, scenario_id, model_id, before_cell=None):
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        diagnostic = route_code(route, "diagnose")
        forbidden = ("X_test", "y_test", "test_prediction", "test_result")
        if any(token in diagnostic for token in forbidden):
            raise AssertionError(f"Phase 2A diagnostic accesses final-test data: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "diagnose", before_cell)

    simple_route, simple = run("gapminder", "simple", "simple_linear")
    simple_model = simple["diagnostic_model"].named_steps["model"]
    if not np.isclose(simple["simple_slope"], float(np.ravel(simple_model.coef_)[0])) or not np.isclose(simple["simple_intercept"], float(np.ravel(np.atleast_1d(simple_model.intercept_))[0])):
        raise AssertionError("Simple linear interpretation does not match the fitted slope/intercept.")
    if len(simple["simple_grid"]) != 160 or not np.isclose(simple["simple_grid"][0], simple["X_train"][simple["simple_feature"]].min()) or not np.isclose(simple["simple_grid"][-1], simple["X_train"][simple["simple_feature"]].max()):
        raise AssertionError("Simple linear fitted line does not span the observed training feature range.")
    if not np.allclose(simple["simple_curve"], simple["diagnostic_model"].predict(simple["simple_grid_frame"])) or not np.allclose(simple["simple_oof_x"], simple["X_train"].loc[simple["diagnostic_actual"].index, simple["simple_feature"]].astype(float).to_numpy()):
        raise AssertionError("Simple linear chart evidence is not aligned with the fitted line/OOF rows.")

    polynomial_route, polynomial = run("gapminder", "simple", "polynomial")
    polynomial_model = polynomial["diagnostic_model"].named_steps["model"]
    polynomial_feature = polynomial["poly_feature"]
    if polynomial["polynomial_degree"] != polynomial_model.named_steps["poly"].degree or len(polynomial["poly_grid"]) != 160:
        raise AssertionError("Polynomial interpretation does not report the fitted degree/grid.")
    if not np.isclose(polynomial["poly_grid"][0], polynomial["X_train"][polynomial_feature].min()) or not np.isclose(polynomial["poly_grid"][-1], polynomial["X_train"][polynomial_feature].max()):
        raise AssertionError("Polynomial fitted curve does not span the observed training feature range.")
    if not np.allclose(polynomial["poly_curve"], polynomial["diagnostic_model"].predict(polynomial["poly_grid_frame"])):
        raise AssertionError("Polynomial fitted curve does not match the fitted pipeline predictions.")

    multiple_route, multiple = run("wine", "continuous", "multiple_linear")
    multiple_model = multiple["diagnostic_model"].named_steps["model"]
    multiple_table = multiple["linear_interpretation"]
    if list(multiple_table.columns) != ["feature", "coefficient", "meaningful_unit", "direction", "plain_english"]:
        raise AssertionError("Multiple linear interpretation table is missing its teaching columns.")
    if [str(name) for name in multiple_table["feature"]] != [str(name) for name in multiple["encoded_names"]] or not np.allclose(multiple_table["coefficient"].to_numpy(dtype=float), np.ravel(multiple_model.coef_)):
        raise AssertionError("Multiple linear coefficients or feature order do not match the fitted estimator.")
    if "sort_values" in route_code(multiple_route, "diagnose") or not all("associated with" in text for text in multiple_table["plain_english"]):
        raise AssertionError("Multiple linear interpretation ranks raw coefficient magnitudes or omits association wording.")

    seoul_multiple_route, seoul_multiple = run("seoul", "continuous", "multiple_linear")
    if seoul_multiple_route["dataset"]["split"] != "time":
        raise AssertionError("Seoul multiple-linear fixture lost its time-series split metadata.")
    seoul_folds = list(seoul_multiple["cv"].split(seoul_multiple["X_train"], seoul_multiple["y_train"]))
    if not all(max(train) < min(validation) for train, validation in seoul_folds):
        raise AssertionError("Seoul Phase 2A diagnostics changed forward-only validation ordering.")

    regression_tree_results = {}
    for dataset_id, scenario_id in (("wine", "continuous"), ("seoul", "continuous")):
        route, namespace = run(dataset_id, scenario_id, "regression_tree")
        _assert_tree_path_fidelity(namespace, False, np)
        regression_tree_results[dataset_id] = int(len(namespace["tree_path"]))

    classification_tree_results = {}
    for dataset_id, scenario_id in (("breast", "continuous5"), ("penguins", "all_types")):
        route, namespace = run(dataset_id, scenario_id, "classification_tree")
        _assert_tree_path_fidelity(namespace, True, np)
        classification_tree_results[dataset_id] = int(len(namespace["tree_path"]))

    binary_logistic_route, binary_logistic = run("breast", "continuous5", "logistic")
    binary_fitted = binary_logistic["diagnostic_model"].named_steps["model"]
    binary_table = binary_logistic["logistic_interpretation"]
    if not np.allclose(binary_logistic["logistic_coefficients"], np.atleast_2d(binary_fitted.coef_)):
        raise AssertionError("Binary logistic interpretation does not match the fitted coefficients.")
    expected_directions = [
        binary_logistic["logistic_class_labels"].get(str(binary_fitted.classes_[1]), str(binary_fitted.classes_[1]))
        if weight >= 0 else binary_logistic["logistic_class_labels"].get(str(binary_fitted.classes_[0]), str(binary_fitted.classes_[0]))
        for weight in binary_fitted.coef_[0]
    ]
    if list(binary_table["pushes_model_toward"]) != expected_directions or binary_logistic["logistic_positive_class"] != binary_fitted.classes_[1] or binary_logistic["logistic_negative_class"] != binary_fitted.classes_[0]:
        raise AssertionError("Binary logistic class-direction mapping is incorrect.")

    multiclass_route, multiclass = run("penguins", "all_types", "logistic")
    multiclass_fitted = multiclass["diagnostic_model"].named_steps["model"]
    multiclass_table = multiclass["logistic_interpretation"]
    expected_class_columns = [
        f"weight_toward_{multiclass['logistic_class_labels'].get(str(label), str(label))}"
        for label in multiclass_fitted.classes_
    ]
    if list(multiclass_table.columns) != ["feature", *expected_class_columns] or not np.allclose(multiclass_table[expected_class_columns].to_numpy(dtype=float), multiclass_fitted.coef_.T):
        raise AssertionError("Multiclass logistic class-labelled weights are incorrect.")
    if "X_test" in route_code(binary_logistic_route, "diagnose") or "X_test" in route_code(multiclass_route, "diagnose"):
        raise AssertionError("Logistic interpretation references the sealed test set.")

    knn_route, knn = run("breast", "continuous5", "knn_cls")
    knn_neighbors = np.asarray(knn["knn_neighbor_positions"])
    knn_fit = set(int(index) for index in np.asarray(knn["knn_fit_indices"]).tolist())
    if not knn["knn_self_neighbour_check"] or int(knn["knn_example_position"]) in knn_fit or int(knn["knn_example_position"]) in set(int(index) for index in knn_neighbors.tolist()) or not set(int(index) for index in knn_neighbors.tolist()).issubset(knn_fit):
        raise AssertionError("KNN diagnostic row leaked into its own or non-fold neighbour set.")
    if len(knn_neighbors) != knn["knn_fitted"].n_neighbors or not np.all(np.diff(knn["knn_neighbor_distances"]) >= -1e-12):
        raise AssertionError("KNN neighbour evidence is not the fitted fold's ordered neighbour set.")
    expected_labels = knn["y_train"].iloc[knn_neighbors].to_numpy()
    if not np.array_equal(knn["knn_neighbor_labels"], expected_labels) or not _same_value(knn["knn_prediction"], knn["knn_fold_model"].predict(knn["knn_row"])[0], np):
        raise AssertionError("KNN neighbour labels or prediction do not match the fold-fitted model.")

    def force_distance_weights(namespace, cell):
        if cell["id"] == "diagnose":
            namespace["best_pipeline"] = namespace["best_pipeline"].set_params(model__n_neighbors=3, model__weights="distance")

    weighted_route, weighted = run("breast", "continuous5", "knn_cls", force_distance_weights)
    if not weighted["knn_is_distance_weighted"] or not np.allclose(weighted["knn_vote_weights"], 1 / np.maximum(weighted["knn_neighbor_distances"], np.finfo(float).eps)) or np.allclose(weighted["knn_vote_weights"], 1):
        raise AssertionError("Distance-weighted KNN evidence does not reflect the fitted weights setting.")
    if "X_test" in route_code(knn_route, "diagnose") or "X_test" in route_code(weighted_route, "diagnose"):
        raise AssertionError("KNN interpretation references the sealed test set.")

    car_route, car = run("car", "categorical", "one_r")
    car_fitted = car["diagnostic_model"].named_steps["model"]
    selected_feature = car["feature_names"][car_fitted.best_feature_]
    car_rules = car["one_r_rules"]
    original_values = car["X_train"][selected_feature].astype(str)
    if set(car_rules["interval"]) != set(original_values.unique()) or int(car_rules["training_rows"].sum()) != len(original_values):
        raise AssertionError("Car One-R rules do not preserve the selected feature's exact categories.")
    if any(int(row.training_rows) != int((original_values == row.interval).sum()) for row in car_rules.itertuples()):
        raise AssertionError("Car One-R training-row counts do not match original category membership.")
    from sklearn.metrics import accuracy_score, f1_score
    comparison = car["one_r_comparison"].set_index("baseline")
    expected_majority = np.repeat(car_fitted.default_, len(car["y_train"]))
    if not np.array_equal(car["one_r_majority_prediction"], expected_majority):
        raise AssertionError("One-R majority baseline is not the fitted default class.")
    for label, prediction in (("Majority class", expected_majority), ("One-R", car["one_r_prediction"])):
        if not np.isclose(comparison.loc[label, "accuracy"], accuracy_score(car["y_train"], prediction)) or not np.isclose(comparison.loc[label, "macro_f1"], f1_score(car["y_train"], prediction, average="macro", zero_division=0)):
            raise AssertionError("One-R comparison does not use the displayed training-only predictions.")

    continuous_one_r_route, continuous_one_r = run("breast", "continuous5", "one_r")
    if continuous_one_r["diagnostic_model"].named_steps["model"].edges_ is None or not all(str(interval).startswith("[") for interval in continuous_one_r["one_r_rules"]["interval"]):
        raise AssertionError("Continuous One-R lost its numeric interval rules.")

    return {
        "simple_line_matches_fitted_model": True,
        "polynomial_curve_matches_fitted_model": True,
        "multiple_coefficients_match_fitted_model": True,
        "seoul_forward_cv_unchanged": True,
        "regression_tree_paths": regression_tree_results,
        "classification_tree_paths": classification_tree_results,
        "binary_logistic_class_mapping": True,
        "multiclass_logistic_labels": True,
        "knn_oof_self_neighbour_guard": True,
        "knn_weighted_vote_fixture": True,
        "car_one_r_rules_and_baseline": True,
        "continuous_one_r_intervals": True,
    }


def run_phase2b1_model_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check that Phase 2B-1 explanations match fitted classifiers and labels."""

    def run(dataset_id, scenario_id, model_id, fixture=False):
        route = payload["phase2bFixtures"][model_id] if fixture else _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        diagnostic = route_code(route, "diagnose")
        forbidden = ("X_test", "y_test", "test_prediction", "test_result")
        if any(token in diagnostic for token in forbidden):
            raise AssertionError(f"Phase 2B-1 diagnostic accesses final-test data: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "diagnose")

    def friendly(namespace, label, key="svm_class_labels"):
        return namespace[key].get(str(label), str(label))

    def assert_oof_is_external(namespace, prefix):
        position = int(namespace[f"{prefix}_example_position"])
        validation = set(int(index) for index in np.asarray(namespace[f"{prefix}_validation_indices"]).tolist())
        fit = set(int(index) for index in np.asarray(namespace[f"{prefix}_fit_indices"]).tolist())
        if position not in validation or position in fit:
            raise AssertionError(f"{prefix.upper()} explanation row was not held out from its fitted fold.")

    def assert_region_fidelity(namespace, prefix):
        grid_points = namespace[f"{prefix}_grid_points"]
        model_predictions = namespace["diagnostic_model"].predict(grid_points)
        displayed_predictions = namespace[f"{prefix}_grid_predictions"]
        if not np.array_equal(np.asarray(displayed_predictions), np.asarray(model_predictions)):
            raise AssertionError(f"{prefix.upper()} decision-region predictions drifted from the fitted model.")
        fitted = namespace["diagnostic_model"].named_steps["model"]
        codes = {str(label): index for index, label in enumerate(fitted.classes_)}
        expected_codes = np.asarray([codes[str(label)] for label in model_predictions]).reshape(namespace[f"{prefix}_grid_x"].shape)
        if not np.array_equal(namespace[f"{prefix}_region_codes"], expected_codes):
            raise AssertionError(f"{prefix.upper()} displayed region classes do not match fitted predictions.")

    svm_route, svm = run("breast", "continuous5", "svm_cls")
    svm_fitted = svm["svm_fold_model"].named_steps["model"]
    assert_oof_is_external(svm, "svm")
    expected_support_positions = np.asarray(svm["svm_fit_indices"])[svm_fitted.support_]
    if not np.array_equal(np.asarray(svm["svm_support_positions"]), expected_support_positions):
        raise AssertionError("SVM support-vector positions do not match the fitted fold estimator.")
    if not np.array_equal(np.asarray(svm["svm_support_counts"]["support_vectors"]), np.asarray(svm_fitted.n_support_)):
        raise AssertionError("SVM support-vector counts do not match the fitted estimator.")
    expected_svm_classes = [friendly(svm, label) for label in svm_fitted.classes_]
    if list(svm["svm_support_counts"]["class"]) != expected_svm_classes:
        raise AssertionError("SVM support-vector class labels are not aligned with fitted classes.")
    if not _same_value(svm["svm_prediction"], svm["svm_fold_model"].predict(svm["svm_row"])[0], np):
        raise AssertionError("SVM out-of-fold prediction story does not match the fitted fold model.")
    if len(svm_fitted.classes_) != 2:
        raise AssertionError("Breast SVM fixture is not binary.")
    expected_score_class = svm_fitted.classes_[1] if float(svm["svm_decision_score"]) >= 0 else svm_fitted.classes_[0]
    if not _same_value(svm["svm_score_class"], expected_score_class, np):
        raise AssertionError("SVM decision-score sign is mapped to the wrong class.")
    if "support vectors" not in route_code(svm_route, "diagnose").lower():
        raise AssertionError("SVM diagnostic does not explain support vectors.")

    multiclass_svm_route, multiclass_svm = run("penguins", "continuous", "svm_cls")
    multiclass_svm_fitted = multiclass_svm["svm_fold_model"].named_steps["model"]
    assert_oof_is_external(multiclass_svm, "svm")
    if len(multiclass_svm_fitted.classes_) < 3 or multiclass_svm["svm_score_class"] is not None:
        raise AssertionError("Multiclass SVM was presented as one binary boundary.")
    if len(np.asarray(multiclass_svm["svm_decision_values"])) != len(multiclass_svm_fitted.classes_):
        raise AssertionError("Multiclass SVM decision evidence is not class-aligned.")
    if "no single universal boundary" not in route_code(multiclass_svm_route, "diagnose").lower():
        raise AssertionError("Multiclass SVM is missing safe multi-boundary wording.")

    svm_boundary_route, svm_boundary = run(None, None, "svm_cls", fixture=True)
    assert_region_fidelity(svm_boundary, "svm")

    lda_route, lda = run("breast", "continuous5", "lda")
    lda_fitted = lda["diagnostic_model"].named_steps["model"]
    lda_fold_fitted = lda["lda_fold_model"].named_steps["model"]
    assert_oof_is_external(lda, "lda")
    if not np.array_equal(lda_fitted.classes_, lda_fold_fitted.classes_):
        raise AssertionError("LDA fitted class ordering changed between full and out-of-fold models.")
    if list(lda["lda_class_centres"]["class"]) != [friendly(lda, label, "lda_class_labels") for label in lda_fitted.classes_]:
        raise AssertionError("LDA class-centre labels are not aligned with fitted classes.")
    if not np.allclose(lda["lda_class_centres"].drop(columns=["class"]).to_numpy(dtype=float), lda_fitted.means_):
        raise AssertionError("LDA class centres do not match fitted prepared-space means.")
    if not np.array_equal(lda["lda_probability_table"]["class"], [friendly(lda, label, "lda_class_labels") for label in lda_fold_fitted.classes_]):
        raise AssertionError("LDA probability rows are not class-aligned.")
    if not np.allclose(lda["lda_probability_table"]["predicted_probability"].to_numpy(dtype=float), lda["lda_fold_model"].predict_proba(lda["lda_row"])[0]):
        raise AssertionError("LDA predicted probabilities do not match the fitted fold model.")
    if not _same_value(lda["lda_prediction"], lda["lda_fold_model"].predict(lda["lda_row"])[0], np):
        raise AssertionError("LDA out-of-fold prediction story does not match the fitted fold model.")
    if "shared spread/shape" not in route_code(lda_route, "diagnose").lower():
        raise AssertionError("LDA diagnostic does not connect shared spread/shape to a straight boundary.")

    multiclass_lda_route, multiclass_lda = run("penguins", "continuous", "lda")
    multiclass_lda_fitted = multiclass_lda["lda_fold_model"].named_steps["model"]
    assert_oof_is_external(multiclass_lda, "lda")
    if len(multiclass_lda_fitted.classes_) < 3 or list(multiclass_lda["lda_probability_table"]["class"]) != [friendly(multiclass_lda, label, "lda_class_labels") for label in multiclass_lda_fitted.classes_]:
        raise AssertionError("Multiclass LDA class ordering or labels are incorrect.")
    lda_boundary_route, lda_boundary = run(None, None, "lda", fixture=True)
    assert_region_fidelity(lda_boundary, "lda")

    qda_route, qda = run("breast", "continuous5", "qda")
    qda_fitted = qda["diagnostic_model"].named_steps["model"]
    qda_fold_fitted = qda["qda_fold_model"].named_steps["model"]
    assert_oof_is_external(qda, "qda")
    if not np.array_equal(qda_fitted.classes_, qda_fold_fitted.classes_) or not np.isclose(float(qda["qda_regularization"]), float(qda_fitted.reg_param)):
        raise AssertionError("QDA class ordering or regularisation changed unexpectedly.")
    if not np.array_equal(qda["qda_class_centres"]["class"], [friendly(qda, label, "qda_class_labels") for label in qda_fitted.classes_]):
        raise AssertionError("QDA class-centre labels are not aligned with fitted classes.")
    if not np.allclose(qda["qda_class_centres"].drop(columns=["class"]).to_numpy(dtype=float), qda_fitted.means_):
        raise AssertionError("QDA class centres do not match fitted means.")
    raw_spread = qda["X_train"].assign(__class=qda["y_train"].to_numpy()).groupby("__class")[qda["feature_names"]].std().reindex(qda_fitted.classes_)
    displayed_spread = qda["qda_spread_summary"].drop(columns=["class"]).to_numpy(dtype=float)
    if not np.allclose(displayed_spread, raw_spread.to_numpy(dtype=float), equal_nan=True):
        raise AssertionError("QDA class-specific spread summary does not match the training data.")
    if not np.allclose(qda["qda_probability_table"]["predicted_probability"].to_numpy(dtype=float), qda["qda_fold_model"].predict_proba(qda["qda_row"])[0]):
        raise AssertionError("QDA predicted probabilities do not match the fitted fold model.")
    if not _same_value(qda["qda_prediction"], qda["qda_fold_model"].predict(qda["qda_row"])[0], np):
        raise AssertionError("QDA out-of-fold prediction story does not match the fitted fold model.")
    if "separate spread/shape" not in route_code(qda_route, "diagnose").lower() or "curve" not in route_code(qda_route, "diagnose").lower():
        raise AssertionError("QDA diagnostic does not explain separate spread/shape and curved boundaries.")

    multiclass_qda_route, multiclass_qda = run("penguins", "continuous", "qda")
    multiclass_qda_fitted = multiclass_qda["qda_fold_model"].named_steps["model"]
    assert_oof_is_external(multiclass_qda, "qda")
    if len(multiclass_qda_fitted.classes_) < 3 or list(multiclass_qda["qda_probability_table"]["class"]) != [friendly(multiclass_qda, label, "qda_class_labels") for label in multiclass_qda_fitted.classes_]:
        raise AssertionError("Multiclass QDA class ordering or labels are incorrect.")
    qda_boundary_route, qda_boundary = run(None, None, "qda", fixture=True)
    assert_region_fidelity(qda_boundary, "qda")

    def probability_row(table, probability_type, class_label, feature):
        rows = table.loc[
            table["probability_type"].eq(probability_type)
            & table["class"].eq(class_label)
            & table["feature"].eq(feature)
        ]
        if len(rows) != 1:
            raise AssertionError(f"Expected one labelled Naive Bayes probability row, got {len(rows)} for {class_label}/{feature}.")
        return rows.iloc[0]

    def assert_probability_columns(namespace):
        expected = ["probability_type", "class", "feature", "probability_label", "estimated_probability"]
        if list(namespace["nb_probability_evidence"].columns) != expected:
            raise AssertionError("Naive Bayes probability evidence has unexpected columns.")
        if any(value in {"probability", "score", "value"} for value in namespace["nb_probability_evidence"].columns):
            raise AssertionError("Naive Bayes probability evidence contains an ambiguous heading.")

    gaussian_route, gaussian = run("breast", "continuous5", "naive_bayes")
    gaussian_fitted = gaussian["nb_fold_model"].named_steps["model"]
    assert_oof_is_external(gaussian, "nb")
    assert_probability_columns(gaussian)
    gaussian_table = gaussian["nb_probability_evidence"]
    gaussian_classes = [friendly(gaussian, label, "nb_class_labels") for label in gaussian_fitted.classes_]
    prior_rows = gaussian_table.loc[gaussian_table["probability_type"].eq("Prior P(class)")]
    posterior_rows = gaussian_table.loc[gaussian_table["probability_type"].eq("Predicted P(class | features)")]
    if list(prior_rows["class"]) != gaussian_classes or list(posterior_rows["class"]) != gaussian_classes:
        raise AssertionError("Gaussian Naive Bayes prior/posterior rows are not class-aligned.")
    if not np.allclose(prior_rows["estimated_probability"].to_numpy(dtype=float), np.asarray(gaussian_fitted.class_prior_)):
        raise AssertionError("Gaussian Naive Bayes priors do not match the fitted estimator.")
    if not np.allclose(posterior_rows["estimated_probability"].to_numpy(dtype=float), gaussian["nb_fold_model"].predict_proba(gaussian["nb_row"])[0]):
        raise AssertionError("Gaussian Naive Bayes posterior rows do not match fitted probabilities.")
    gaussian_features = [str(name) for name in gaussian["encoded_names"][:3]]
    for class_index, class_value in enumerate(gaussian_fitted.classes_):
        class_label = friendly(gaussian, class_value, "nb_class_labels")
        for feature_index, feature_name in enumerate(gaussian_features):
            observed = float(gaussian["nb_row_values"][0, feature_index])
            variance = max(float(gaussian_fitted.var_[class_index, feature_index]), np.finfo(float).eps)
            expected_likelihood = np.exp(-0.5 * ((observed - gaussian_fitted.theta_[class_index, feature_index]) ** 2) / variance) / np.sqrt(2 * np.pi * variance)
            row = probability_row(gaussian_table, "Likelihood P(feature ≈ value | class)", class_label, feature_name)
            if not np.isclose(float(row["estimated_probability"]), expected_likelihood):
                raise AssertionError("Gaussian Naive Bayes likelihood does not match the fitted mean/spread.")
            if "| class=" not in row["probability_label"] or "≈" not in row["probability_label"]:
                raise AssertionError("Gaussian Naive Bayes likelihood label is ambiguous.")
    if "independence assumption" not in route_code(gaussian_route, "diagnose").lower():
        raise AssertionError("Naive Bayes independence teaching is missing from the diagnostic.")

    categorical_route, categorical = run("car", "categorical", "naive_bayes")
    categorical_fitted = categorical["nb_fold_model"].named_steps["model"]
    assert_oof_is_external(categorical, "nb")
    assert_probability_columns(categorical)
    if not {"buying=low", "buying=med", "buying=high", "buying=vhigh"}.issubset(set(categorical["nb_feature_labels"])):
        raise AssertionError("Categorical Naive Bayes did not retain original category labels.")
    categorical_table = categorical["nb_probability_evidence"]
    for class_index, class_value in enumerate(categorical_fitted.classes_):
        class_label = friendly(categorical, class_value, "nb_class_labels")
        for feature_index, feature_label in enumerate(categorical["nb_feature_labels"][:6]):
            row = probability_row(categorical_table, "Likelihood P(feature = 1 | class)", class_label, feature_label)
            if not np.isclose(float(row["estimated_probability"]), np.exp(categorical_fitted.feature_log_prob_[class_index, feature_index])):
                raise AssertionError("Categorical Naive Bayes category likelihood does not match the fitted encoder/model.")
            if f"P({feature_label} | class={class_label})" not in row["probability_label"]:
                raise AssertionError("Categorical Naive Bayes likelihood label does not identify the original category.")

    binary_route, binary = run("candy_class", "binary", "naive_bayes")
    binary_fitted = binary["nb_fold_model"].named_steps["model"]
    assert_oof_is_external(binary, "nb")
    assert_probability_columns(binary)
    if binary["nb_feature_labels"] != [f"{name}=1" for name in binary["feature_names"]]:
        raise AssertionError("Binary Naive Bayes feature labels do not identify 1-valued indicators.")
    binary_likelihoods = binary["nb_probability_evidence"].loc[binary["nb_probability_evidence"]["probability_type"].eq("Likelihood P(feature = 1 | class)")]
    if len(binary_likelihoods) != len(binary_fitted.classes_) * min(6, len(binary["nb_feature_labels"])):
        raise AssertionError("Binary Naive Bayes likelihood evidence has the wrong shape.")

    return {
        "svm_binary_class_mapping": True,
        "svm_multiclass_wording": True,
        "svm_support_vectors_match_fitted": True,
        "svm_boundary_fidelity": True,
        "lda_class_centres_and_labels": True,
        "lda_shared_spread_wording": True,
        "lda_boundary_fidelity": True,
        "qda_spread_and_regularization": True,
        "qda_lda_contrast": True,
        "qda_boundary_fidelity": True,
        "naive_bayes_gaussian_probabilities": True,
        "naive_bayes_categorical_probabilities": True,
        "naive_bayes_binary_probabilities": True,
        "naive_bayes_probability_labels": True,
        "naive_bayes_oof_prediction_stories": True,
    }


def run_teaching_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    fixtures = [
        ("classification", "breast", "continuous5", "logistic"),
        ("regression", "gapminder", "simple", "simple_linear"),
        ("time_series", "seoul", "simple", "simple_linear"),
    ]
    results = {}
    for kind, dataset_id, scenario_id, model_id in fixtures:
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        baseline_namespace = _execute_route_to_cell(payload, route, pd, np, plt, sns, "baseline")
        cv_scores = baseline_namespace["cv_scores"].copy()
        if kind == "classification":
            validation = cv_scores["validation_macro_f1"].to_numpy(dtype=float)
            training = cv_scores["train_macro_f1"].to_numpy(dtype=float)
            gap = float(training.mean() - validation.mean())
            metric = "macro_f1"
        else:
            validation = cv_scores["validation_rmse"].to_numpy(dtype=float)
            training = cv_scores["train_rmse"].to_numpy(dtype=float)
            if np.any(validation < 0) or np.any(training < 0):
                raise AssertionError(f"{dataset_id} generated a negative learner-facing RMSE.")
            gap = float(validation.mean() - training.mean())
            metric = "rmse"
        if not np.isclose(validation.mean(), validation.sum() / len(validation)):
            raise AssertionError(f"{dataset_id} validation mean is not calculated from the fold values.")
        if not np.isclose(validation.min(), min(validation)) or not np.isclose(validation.max(), max(validation)):
            raise AssertionError(f"{dataset_id} validation range is not calculated from the fold values.")
        if not np.isclose(training.mean(), training.sum() / len(training)):
            raise AssertionError(f"{dataset_id} training mean is not calculated from the fold values.")

        final_namespace = _execute_route_to_cell(payload, route, pd, np, plt, sns, "final")
        if not np.allclose(cv_scores.to_numpy(dtype=float), final_namespace["cv_scores"].to_numpy(dtype=float)):
            raise AssertionError(f"{dataset_id} final evaluation changed the prior CV evidence.")
        final_result = final_namespace["test_result"]
        final_metric_row = final_result.loc[final_result["metric"].astype(str).str.lower().eq(metric.replace("_", " "))]
        if final_metric_row.empty:
            label = "macro F1" if metric == "macro_f1" else "RMSE"
            final_metric_row = final_result.loc[final_result["metric"].eq(label)]
        if final_metric_row.empty or not np.isfinite(float(final_metric_row.iloc[0]["value"])):
            raise AssertionError(f"{dataset_id} final result did not contain a finite {metric} value.")
        results[dataset_id] = {
            "fold_count": int(len(validation)),
            "validation_mean": float(validation.mean()),
            "validation_min": float(validation.min()),
            "validation_max": float(validation.max()),
            "training_mean": float(training.mean()),
            "gap": gap,
            "primary_metric": metric,
            "final_test_value": float(final_metric_row.iloc[0]["value"]),
            "cv_unchanged_after_final": True,
            "time_series": route["dataset"]["split"] == "time",
        }
    if not results["seoul"]["time_series"]:
        raise AssertionError("Seoul teaching fixture did not retain the chronological split metadata.")
    return results


def run_python_routes(payload: dict, mode: str) -> dict:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import seaborn as sns

    warnings_seen: list[str] = []
    failures: list[dict] = []
    attempted = 0
    reset_runtime = run_pandas_reset_regression(payload, pd, np, plt, sns)
    categorical_nb_test = run_categorical_nb_unseen_test(payload)
    dataframe_serializer_test = run_dataframe_serializer_regression(payload, pd, np)
    one_r_test = run_one_r_regression(payload, pd, np, plt, sns)
    teaching_runtime_test = run_teaching_runtime_regression(payload, pd, np, plt, sns)
    phase2a_model_runtime_test = run_phase2a_model_runtime_regression(payload, pd, np, plt, sns)
    phase2b1_model_runtime_test = run_phase2b1_model_runtime_regression(payload, pd, np, plt, sns)

    for folds, routes in payload["routes"].items():
        for route in choose_runtime_routes(routes, mode):
            attempted += 1
            namespace = {
                "pd": pd,
                "np": np,
                "plt": plt,
                "sns": sns,
                "__builtins__": __builtins__,
            }
            dataset = route["dataset"]
            try:
                raw = pd.read_csv(ROOT / dataset["file"], sep=dataset["sep"])
                namespace["df"] = raw
                exec(payload["oneRHelperSource"], namespace, namespace)
                for cell in route["cells"]:
                    with warnings.catch_warnings(record=True) as caught:
                        warnings.simplefilter("always")
                        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                            exec(cell["code"], namespace, namespace)
                    warnings_seen.extend(str(item.message) for item in caught)
                    plt.close("all")
            except Exception as error:  # noqa: BLE001
                failures.append(
                    {
                        "folds": folds,
                        "route": f"{route['datasetId']}/{route['scenarioId']}/{route['modelId']}",
                        "cell": cell.get("id", "unknown") if "cell" in locals() else "unknown",
                        "error": "".join(traceback.format_exception_only(type(error), error)).strip(),
                    }
                )
                if mode == "representative":
                    continue

    if failures:
        raise AssertionError(
            f"{len(failures)} runtime route(s) failed; first failures:\n"
            + json.dumps(failures[:10], indent=2)
        )
    if mode == "full" and attempted != 254:
        raise AssertionError(f"Full runtime mode executed {attempted} routes; expected all 254 routes.")
    unique_warnings = sorted(set(warnings_seen))
    return {
        "runtime_mode": mode,
        "runtime_routes": attempted,
        "runtime_failures": failures,
        "runtime_versions": {
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": __import__("sklearn").__version__,
            "scipy": __import__("scipy").__version__,
            "matplotlib": matplotlib.__version__,
            "seaborn": sns.__version__,
        },
        "reset_runtime": reset_runtime,
        "categorical_nb_unseen_test": categorical_nb_test,
        "dataframe_serializer": dataframe_serializer_test,
        "one_r_regression": one_r_test,
        "teaching_runtime": teaching_runtime_test,
        "phase2a_model_runtime": phase2a_model_runtime_test,
        "phase2b1_model_runtime": phase2b1_model_runtime_test,
        "warnings": unique_warnings[:25],
        "warning_count": len(warnings_seen),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--runtime",
        choices=("none", "representative", "full"),
        default="none",
        help="Run Python route execution after structural checks.",
    )
    args = parser.parse_args()

    payload = load_routes()
    summary = assert_route_structure(payload)
    if args.runtime != "none":
        summary.update(run_python_routes(payload, args.runtime))
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
