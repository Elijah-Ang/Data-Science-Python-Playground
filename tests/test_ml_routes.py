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


def run_reset_regression(payload: dict) -> dict:
    baseline_names = {
        "pd",
        "np",
        "sns",
        "plt",
        "display",
        "OneRClassifier",
        "one_r_rule_table",
        "BASE_GLOBAL_NAMES",
        "__builtins__",
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
    namespace = {name: object() for name in baseline_names if name != "__builtins__"}
    namespace["__builtins__"] = __builtins__
    namespace["BASE_GLOBAL_NAMES"] = frozenset(namespace) | {"BASE_GLOBAL_NAMES"}
    namespace["df"] = object()
    namespace.update({name: object() for name in generated_names})
    namespace["__keep_data"] = True
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    if any(name in namespace for name in generated_names):
        remaining = sorted(name for name in generated_names if name in namespace)
        raise AssertionError(f"Reset left generated modelling globals: {remaining}")
    if "df" not in namespace or any(name not in namespace for name in baseline_names):
        raise AssertionError("Reset did not retain the baseline runtime and raw df.")

    namespace = {name: object() for name in baseline_names if name != "__builtins__"}
    namespace["__builtins__"] = __builtins__
    namespace["BASE_GLOBAL_NAMES"] = frozenset(namespace) | {"BASE_GLOBAL_NAMES"}
    namespace["df"] = object()
    namespace.update({name: object() for name in generated_names})
    namespace["__keep_data"] = False
    exec(payload["resetWorkspaceSource"], namespace, namespace)
    if "df" in namespace or any(name in namespace for name in generated_names):
        raise AssertionError("Reset did not clear raw df when keepData=False.")
    return {"keep_data": "generated globals removed; df retained", "drop_data": "generated globals and df removed"}


def assert_route_structure(payload: dict) -> dict:
    source = (ROOT / "ml-app.js").read_text(encoding="utf-8")
    if "BASE_GLOBAL_NAMES = frozenset(globals())" not in source or "globals().pop(__name, None)" not in source:
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

    preprocessing_counts = {
        "direct_passthrough": 0,
        "direct_scaler": 0,
        "direct_encoder": 0,
        "simple_pipeline": 0,
        "column_transformer": 0,
    }
    removed_naive_bayes = []
    total_cells = 0

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

            frame = route_code(route, "frame")
            if any(token in frame for token in ("continuous_features = []", "binary_features = []", "categorical_features = []", "target_name")):
                raise AssertionError(f"Frame rediscovered or declared empty feature groups: {route}")
            if "pd.DataFrame" in frame:
                raise AssertionError(f"Frame duplicates UI metadata instead of showing X.head(): {route}")

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
                    for token in ("classification_report", "diagnostic_rmse", "diagnostic_r2", "root_mean_squared_error", "r2_score", "test_result")
                ):
                    raise AssertionError(f"Diagnostic cell contains an aggregate score/report: {route}")
                if ids.index("tune") >= ids.index("diagnose") or "best_pipeline" not in diagnostic:
                    raise AssertionError(f"Diagnostic does not follow tuning/default selection: {route}")
                if "best_pipeline" not in route_code(route, "final"):
                    raise AssertionError(f"Final cell does not use best_pipeline: {route}")

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
                    if kind == "categorical":
                        if "OneHotEncoder" not in prepare or "OrdinalEncoder" in prepare or "BernoulliNB" not in model_code:
                            raise AssertionError(f"Categorical Naive Bayes is not the unseen-category-safe Bernoulli route: {route}")
                        if "bernoulli_probabilities" not in diagnostic:
                            raise AssertionError(f"Categorical Naive Bayes interpretation is not feature likelihoods: {route}")
                    elif kind == "binary":
                        if "BernoulliNB" not in model_code or "bernoulli_probabilities" not in diagnostic:
                            raise AssertionError(f"Binary Naive Bayes interpretation is incomplete: {route}")
                    elif "GaussianNB" not in model_code or "gaussian_means" not in diagnostic:
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
        "reset_state": reset_result,
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
    categorical_nb_test = run_categorical_nb_unseen_test(payload)

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
        "categorical_nb_unseen_test": categorical_nb_test,
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
