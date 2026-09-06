"""Independent acceptance checks for the ML workflow edit.

The existing route tests exercise broad application behaviour.  This checker
keeps a separate audit of the edited workflow: generated-route coverage,
visible-cell dependencies, and the semantic contracts called out in the
workflow findings.  Its runtime mode executes only ``cell.code`` in order;
hidden setup/evidence fields are never part of that primary path.  Optional
interpretation bundles can be exercised explicitly with ``--optional``.

Examples::

    python tests/test_ml_workflow_edit.py
    python tests/test_ml_workflow_edit.py --runtime unsupervised
    python tests/test_ml_workflow_edit.py --runtime representative --optional
    python tests/test_ml_workflow_edit.py --runtime all
"""

from __future__ import annotations

import argparse
import ast
import contextlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import traceback
import warnings


ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "tests" / "generate_ml_routes.mjs"
FOLDS = ("5", "10")

EXPECTED_TOTALS = {
    "breast": 23,
    "penguins": 30,
    "car": 7,
    "candy_class": 11,
    "wine": 14,
    "seoul": 20,
    "gapminder": 9,
    "candy": 13,
}

SUPERVISED_REQUIRED_IDS = ("frame", "split", "explore", "prepare", "model", "baseline", "reference", "diagnose", "final")
KMEANS_IDS = ("frame", "explore", "prepare", "compare", "fit", "diagnose", "profile", "visualise")
HIERARCHICAL_IDS = ("frame", "explore", "prepare", "dendrogram", "compare", "fit", "profile", "visualise")
PCA_IDS = ("frame", "explore", "prepare", "variance", "select", "loadings", "project")

# Names that a learner can reasonably rely on before the first visible cell.
# One-R's public adapter is deliberately included so the dependency audit can
# distinguish the named preloaded helper from a private diagnostic variable.
VISIBLE_PRELOADS = {
    "pd",
    "np",
    "plt",
    "sns",
    "display",
    "df",
    "OneRClassifier",
    "OneRPreprocessor",
    "_OneRFeaturePreprocessor",  # compatibility alias, accepted only for dependency analysis
    "_OneRFeatureMatrix",
    "one_r_rule_table",
}

PYTHON_BUILTINS = set(
    """
    __import__ abs all any ascii bin bool breakpoint bytearray bytes callable
    chr classmethod compile complex delattr dict dir divmod enumerate eval exec
    filter float format frozenset getattr globals hasattr hash help hex id input
    int isinstance issubclass iter len list locals map max memoryview min next
    object oct open ord pow print property range repr reversed round set setattr
    slice sorted staticmethod str sum super tuple type vars zip
    Exception BaseException ValueError TypeError RuntimeError IndexError KeyError
    AttributeError AssertionError FileNotFoundError
    """.split()
)


def load_payload() -> dict:
    result = subprocess.run(
        ["node", str(GENERATOR)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        raise AssertionError("Route generator failed:\n" + result.stdout + "\n" + result.stderr)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise AssertionError(f"Route generator did not return JSON: {error}") from error


def route_key(route: dict) -> tuple[str, str, str]:
    return (route["datasetId"], route["scenarioId"], route["modelId"])


def cell_map(route: dict) -> dict[str, dict]:
    return {cell["id"]: cell for cell in route["cells"]}


def route_code(route: dict, cell_id: str) -> str:
    return str(cell_map(route).get(cell_id, {}).get("code", ""))


def _valid_supervised_ids(ids: tuple[str, ...]) -> bool:
    """Allow the route's optional tuning step while requiring its core story."""
    if not all(cell_id in ids for cell_id in SUPERVISED_REQUIRED_IDS):
        return False
    positions = {cell_id: ids.index(cell_id) for cell_id in SUPERVISED_REQUIRED_IDS}
    if any(positions[left] >= positions[right] for left, right in zip(SUPERVISED_REQUIRED_IDS, SUPERVISED_REQUIRED_IDS[1:])):
        return False
    tune_position = ids.index("tune") if "tune" in ids else None
    return tune_position is None or positions["reference"] < tune_position < positions["diagnose"]


def _stored_names(tree: ast.AST) -> set[str]:
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, (ast.Store, ast.Del)):
            names.add(node.id)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names.add(node.name)
        elif isinstance(node, ast.alias):
            names.add(node.asname or node.name.split(".")[0])
        elif isinstance(node, ast.ExceptHandler) and node.name:
            names.add(node.name)
    return names


def _loaded_names(tree: ast.AST) -> set[str]:
    return {node.id for node in ast.walk(tree) if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load)}


def visible_dependency_issues(route: dict) -> list[str]:
    """Find names that a visible primary cell borrows from a hidden cell.

    The check is intentionally conservative about names defined inside a
    cell: code in one visible cell may use a name defined earlier in the same
    cell, while names from later or hidden cells remain failures.
    """

    scope = set(VISIBLE_PRELOADS)
    issues: list[str] = []
    for cell in route["cells"]:
        code = str(cell.get("code", ""))
        try:
            tree = ast.parse(code, filename=f"{route_key(route)}/{cell['id']}")
        except SyntaxError as error:
            issues.append(f"{cell['id']}: Python syntax error: {error.msg} at line {error.lineno}")
            continue
        defined = _stored_names(tree)
        unknown = sorted(_loaded_names(tree) - scope - defined - PYTHON_BUILTINS)
        if unknown:
            issues.append(f"{cell['id']}: undefined before visible use: {', '.join(unknown)}")
        scope.update(defined)
    return issues


def _target_literal(target: str) -> tuple[str, str]:
    return (f'"{target}"', f"'{target}'")


def _has_fit_call(code: str) -> bool:
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return True
    return any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "fit"
        for node in ast.walk(tree)
    )


def _semantic_issues(payload: dict, route: dict) -> list[str]:
    """Check the intent of the edited workflow without copying old tests."""

    issues: list[str] = []
    ids = tuple(cell["id"] for cell in route["cells"])
    expected = {
        "unsupervised": {
            "kmeans": KMEANS_IDS,
            "hierarchical": HIERARCHICAL_IDS,
            "pca": PCA_IDS,
        }
    }
    model_id = route["modelId"]
    if route["modelTask"] == "unsupervised":
        expected_ids = expected["unsupervised"].get(model_id)
        if ids != expected_ids:
            issues.append(f"route cells are {ids}, expected {expected_ids}")
        dataset_label = str(route["dataset"].get("name", "")).split(" · ")[0]
        final_cell = route["cells"][-1]
        story_text = " ".join(str(final_cell.get(field, "")) for field in ("question", "action", "readingCue"))
        if dataset_label and dataset_label not in story_text:
            issues.append("unsupervised closing guidance does not name the selected dataset")
        if model_id in {"kmeans", "hierarchical"}:
            if "Describe two" not in str(final_cell.get("question", "")) or "useful" not in story_text.lower():
                issues.append(f"{model_id} route does not close with a concrete group interpretation prompt")
        elif model_id == "pca":
            if not all(token in story_text.lower() for token in ("coordinates", "variation")):
                issues.append("PCA route does not close with a retained-coordinate and variation prompt")
        if any("Why is there no target used for fitting" in str(cell.get("question", "")) for cell in route["cells"]):
            issues.append("unsupervised route still uses the generic no-target question")
        for cell in route["cells"]:
            teaching = cell.get("modelTeaching") or {}
            see = str(teaching.get("see", ""))
            if model_id == "kmeans" and len(route["scenario"].get("continuous", [])) == 2 and "PCA map" in see:
                issues.append("two-input KMeans teaching still promises a PCA map that is not in the primary route")
            if model_id == "hierarchical" and len(route["scenario"].get("continuous", [])) == 2 and "PCA map" in see:
                issues.append("two-input hierarchical teaching still promises a PCA map that is not in the primary route")
            if model_id == "pca" and "strongest feature loadings" in see.lower():
                issues.append("PCA teaching promises strongest loadings while the visible table is unranked")
        target = route["dataset"]["target"]
        target_tokens = _target_literal(target)
        pre_project = "\n".join(
            str(cell.get("code", ""))
            for cell in route["cells"]
            if cell["id"] != "project"
        )
        if any(token in pre_project for token in target_tokens):
            issues.append(f"reference target {target!r} appears before post-fit interpretation")
        all_code = "\n".join(str(cell.get("code", "")) for cell in route["cells"])
        if "X_test" in all_code or "y_test" in all_code:
            issues.append("unsupervised route contains supervised holdout variables")

        if model_id == "kmeans":
            compare = route_code(route, "compare")
            fit = route_code(route, "fit")
            diagnose = route_code(route, "diagnose")
            profile = route_code(route, "profile")
            visualise = route_code(route, "visualise")
            if not all(token in compare for token in ("candidate_rows", "inertia", "silhouette", "candidate_scores")):
                issues.append("KMeans comparison does not expose candidate inertia and silhouette evidence")
            if any(token in all_code for token in ("silhouette_suggestion", ".idxmax(", "Mechanical silhouette suggestion")):
                issues.append("KMeans still turns a metric argmax into an automatic k suggestion")
            if not re.search(r"selected_k\s*=", fit):
                issues.append("KMeans fit does not expose an editable selected_k")
            if "clusters" not in fit or "KMeans" not in fit:
                issues.append("KMeans fit does not create one visible cluster label per row")
            if "global_silhouette" not in diagnose or "cluster_sizes" not in diagnose:
                issues.append("KMeans diagnosis does not show both separation and cluster sizes")
            compare_cell = cell_map(route)["compare"]
            if "plt.subplots" in compare or "sns.lineplot" in compare:
                issues.append("KMeans primary comparison is not the compact candidate table")
            if "plt.subplots" not in _field_text(compare_cell, ("optionalCode", "advancedCode")):
                issues.append("KMeans candidate charts are not available as optional depth")
            if "groupby(" not in profile or "feature_names" not in profile or "inverse_transform(kmeans.cluster_centers_)" in profile:
                issues.append("KMeans profile is not one original-unit grouped summary")
            if "centroid_profile" in all_code:
                issues.append("KMeans keeps a duplicate centroid profile table")
            pair_selection = "X[feature_names]" if len(route["scenario"].get("continuous", [])) == 2 else "X[feature_names[:2]]"
            if not all(token in visualise for token in (pair_selection, "feature_names[0]", "feature_names[1]")):
                issues.append("KMeans visualisation lacks a direct two-input map")
            if len(route["scenario"].get("continuous", [])) > 2:
                optional_visual = _field_text(cell_map(route)["visualise"], ("optionalCode", "advancedCode"))
                if "PCA(n_components=2).fit_transform(X_scaled)" not in optional_visual:
                    issues.append("KMeans multi-input route lacks an optional PCA map")

        elif model_id == "hierarchical":
            prepare = route_code(route, "prepare")
            dendrogram = route_code(route, "dendrogram")
            compare = route_code(route, "compare")
            fit = route_code(route, "fit")
            profile = route_code(route, "profile")
            visualise = route_code(route, "visualise")
            if "X_sample" not in prepare or ".sample(" not in prepare or "X_sample_scaled" not in prepare:
                issues.append("hierarchical preparation does not create a named reproducible X_sample")
            if "analysis_Z" in "\n".join(str(cell.get("code", "")) for cell in route["cells"]) or "analysis_rows" in "\n".join(str(cell.get("code", "")) for cell in route["cells"]):
                issues.append("hierarchical route keeps obsolete analysis_Z/analysis_rows aliases")
            if not re.search(r"hierarchy\s*=\s*linkage\(", dendrogram) or "dendrogram(hierarchy" not in dendrogram:
                issues.append("hierarchical route does not build and display one named hierarchy")
            if "linkage_matrix" in dendrogram:
                issues.append("hierarchical dendrogram uses the stale linkage_matrix name")
            if "cut_tree(hierarchy" not in compare or "cut_tree(hierarchy" not in fit:
                issues.append("hierarchical compare and fit do not reuse cut_tree on the same hierarchy")
            if "AgglomerativeClustering" in "\n".join((dendrogram, compare, fit)):
                issues.append("hierarchical route refits AgglomerativeClustering instead of cutting the dendrogram")
            if any(token in "\n".join((compare, fit)) for token in ("silhouette_suggestion", ".idxmax(", "Mechanical silhouette suggestion")):
                issues.append("hierarchical route still makes an automatic silhouette cut")
            if "X_sample" not in profile or "groupby(" not in profile:
                issues.append("hierarchical profile is not aligned to the named sample")
            pair_selection = "X_sample[feature_names]" if len(route["scenario"].get("continuous", [])) == 2 else "X_sample[feature_names[:2]]"
            if not all(token in visualise for token in (pair_selection, "feature_names[0]", "feature_names[1]")):
                issues.append("hierarchical visualisation lacks a direct two-input map")
            if len(route["scenario"].get("continuous", [])) > 2:
                optional_visual = _field_text(cell_map(route)["visualise"], ("optionalCode", "advancedCode"))
                if "PCA(n_components=2).fit_transform(X_sample_scaled)" not in optional_visual:
                    issues.append("hierarchical multi-input route lacks an optional PCA map")

        elif model_id == "pca":
            variance = route_code(route, "variance")
            select = route_code(route, "select")
            loadings = route_code(route, "loadings")
            project = route_code(route, "project")
            explore = route_code(route, "explore")
            if "pca = PCA" not in variance or "component_scores = pca.fit_transform(X_scaled)" not in variance:
                issues.append("PCA does not fit one named object while creating component_scores")
            if variance.count("component_scores =") != 1:
                issues.append("PCA component_scores is assigned more than once")
            if not all(token in select for token in ("variance_target", "variance_table", "components_for_target", "variance_retained")):
                issues.append("PCA selection does not expose one active variance target and retained amount")
            if "full_pca.transform" in project or "pca.transform" in project or "fit_transform" in project:
                issues.append("PCA project step refits or transforms again instead of reusing component_scores")
            if "loadings" not in loadings or "index.name = \"feature\"" not in loadings:
                issues.append("PCA loadings are not labelled by the original feature names")
            if len(route["scenario"].get("continuous", [])) > 12:
                explore_cell = cell_map(route)["explore"]
                if "pair_summary" not in explore or "left_feature" not in explore or "right_feature" not in explore:
                    issues.append("high-dimensional PCA redundancy is missing the named primary pair")
                if "combinations" in explore:
                    issues.append("high-dimensional PCA pair enumeration is compulsory in the primary cell")
                if "combinations" not in _field_text(explore_cell, ("optionalCode", "advancedCode")):
                    issues.append("high-dimensional PCA redundancy has no optional all-pairs exploration")

        return issues

    # Supervised route contracts.  These checks deliberately look for
    # visible workflow landmarks and leave model-specific interpretation to
    # the optional bundles.
    if not _valid_supervised_ids(ids):
        issues.append(f"supervised route cells do not contain the ordered core story: {ids}")
    model = route_code(route, "model")
    baseline = route_code(route, "baseline")
    reference = route_code(route, "reference")
    tune = route_code(route, "tune")
    diagnose = route_code(route, "diagnose")
    final = route_code(route, "final")
    final_surface = cell_map(route).get("final", {})
    final_guidance = " ".join(
        str(final_surface.get(field, ""))
        for field in ("question", "action", "readingCue")
    ).lower()
    if "initial-model cv" not in final_guidance or "saved final test" not in final_guidance:
        issues.append("final guidance does not distinguish initial-model CV from the saved final test")
    if "selected-setting cv" not in final_guidance:
        issues.append("final guidance does not identify selected-setting CV when tuning is used")
    if route["dataset"]["task"] == "classification":
        if "training-only diagnostic" not in final_guidance or "optional final confusion" not in final_guidance:
            issues.append("classification close asks for a class pattern without pointing to diagnostic/confusion evidence")
    elif "residual" not in final_guidance and route["dataset"].get("split") != "time":
        issues.append("regression close does not point to training-only residual evidence")
    if "Pipeline([" not in model:
        issues.append("model cell does not show one sklearn Pipeline")
    if _has_fit_call(model):
        issues.append("model cell fits before the validation evidence")
    split = route_code(route, "split")
    if not all(token in split for token in ("X_train", "X_test", "y_train", "y_test")):
        issues.append("split cell does not visibly create training and saved-test variables")
    if "cross_validate" not in baseline:
        issues.append("baseline lacks visible training-only cross-validation")
    if not re.search(r"Dummy(Classifier|Regressor)", reference):
        issues.append("reference step lacks a visible simple Dummy predictor")
    folds = str(next((int(match.group(1)) for match in re.finditer(r"n_splits\s*=\s*(\d+)", baseline)), ""))
    if not folds:
        folds = str(next((int(match.group(1)) for match in re.finditer(r"n_splits\s*=?(\d+)", baseline)), ""))
    if f"n_splits={route.get('_folds', '')}" not in baseline:
        # The route object does not carry folds in the generator.  The caller
        # attaches it before this function, keeping the check fold-aware.
        issues.append("baseline fold count is not the generated route fold count")
    if route["dataset"]["task"] == "classification":
        if "f1_macro" not in baseline:
            issues.append("classification baseline does not expose macro F1 CV evidence")
    else:
        # scikit-learn reports the negated scorer; the generated route makes
        # the learner-facing RMSE positive when it builds fold_scores.  Match
        # the actual public variable rather than the old generic ``-scores``
        # spelling, which produced false failures after the route edit.
        positive_rmse = any(
            marker in baseline
            for marker in (
                '-cv_results["test_score"]',
                "-cv_results['test_score']",
                "-cv_results[\"train_score\"]",
                "-cv_results['train_score']",
            )
        )
        if "neg_root_mean_squared_error" not in baseline or not positive_rmse or "validation_rmse" not in baseline:
            issues.append("regression baseline does not show negative RMSE scoring converted to positive error")
    if not any(pattern in "\n".join((model, reference, tune)) for pattern in ("chosen_pipeline =", "best_pipeline =", "pipeline")):
        issues.append("tuning/default cell does not hand off a chosen pipeline")
    if any(token in tune for token in ("RandomizedSearchCV", "ParameterSampler", "HalvingGridSearchCV")):
        issues.append("tuning cell exposes an extra search strategy outside the one workflow question")
    if "X_test" in diagnose or "y_test" in diagnose:
        issues.append("diagnostic cell opens the saved holdout before the final cell")
    if not any(token in diagnose for token in ("cross_val", "validation")):
        issues.append("diagnostic cell has no visible training-only validation result")
    if not re.search(r"(?:test_prediction|test_predictions|final_prediction)\s*=", final):
        issues.append("final cell does not visibly create a test prediction")
    if "X_test" not in final or "y_test" not in final:
        issues.append("final cell does not visibly evaluate the saved test set")
    return issues


def _field_text(cell: dict, names: tuple[str, ...]) -> str:
    for name in names:
        value = cell.get(name)
        if isinstance(value, str) and value.strip():
            return value
    return ""


def structural_audit(payload: dict) -> dict:
    issues: list[dict] = []

    def add(kind: str, route: dict | None, detail: str) -> None:
        record = {"kind": kind, "detail": detail}
        if route is not None:
            record["route"] = "/".join(route_key(route))
        issues.append(record)

    routes_by_fold = payload.get("routes", {})
    if set(routes_by_fold) != set(FOLDS):
        add("coverage", None, f"generated folds are {sorted(routes_by_fold)}, expected {list(FOLDS)}")
    keys_by_fold: dict[str, set[tuple[str, str, str]]] = {}
    for folds in FOLDS:
        routes = routes_by_fold.get(folds, [])
        if len(routes) != 127:
            add("coverage", None, f"fold {folds} has {len(routes)} routes, expected 127")
        counts: dict[str, int] = {}
        scenarios: set[tuple[str, str]] = set()
        keys: set[tuple[str, str, str]] = set()
        for route in routes:
            counts[route["datasetId"]] = counts.get(route["datasetId"], 0) + 1
            scenarios.add((route["datasetId"], route["scenarioId"]))
            keys.add(route_key(route))
            if route["datasetId"] not in EXPECTED_TOTALS:
                add("coverage", route, "unexpected dataset in generated route")
        keys_by_fold[folds] = keys
        if counts != EXPECTED_TOTALS:
            add("coverage", None, f"fold {folds} dataset counts are {counts}, expected {EXPECTED_TOTALS}")
        if len(scenarios) != 23:
            add("coverage", None, f"fold {folds} has {len(scenarios)} dataset/scenario pairs, expected 23")
    if keys_by_fold.get("5") != keys_by_fold.get("10"):
        add("coverage", None, "the 5-fold and 10-fold route key sets differ")

    # Attach the fold to each route for the fold-aware CV check.  This is a
    # transient audit annotation and never gets written to generated output.
    for folds in FOLDS:
        for route in routes_by_fold.get(folds, []):
            route["_folds"] = int(folds)
            cells = route["cells"]
            actual_ids = tuple(cell["id"] for cell in cells)
            if route["modelTask"] != "unsupervised":
                # Tuning is an optional route step between the reference and
                # diagnosis.  Keep the structural check aligned with that
                # public workflow contract rather than rejecting every tuned
                # route as a false positive.
                if not _valid_supervised_ids(actual_ids):
                    add("structure", route, f"cell ids {actual_ids} do not contain the ordered supervised core story")
            else:
                expected_ids = (
                    KMEANS_IDS
                    if route["modelId"] == "kmeans"
                    else HIERARCHICAL_IDS
                    if route["modelId"] == "hierarchical"
                    else PCA_IDS
                )
                if actual_ids != expected_ids:
                    add("structure", route, f"cell ids {actual_ids} do not match {expected_ids}")
            for cell in cells:
                for field in ("title", "caption", "question", "action", "readingCue"):
                    if not str(cell.get(field, "")).strip():
                        add("surface", route, f"{cell['id']} has empty {field}")
                try:
                    ast.parse(str(cell.get("code", "")), filename=f"{route_key(route)}/{cell['id']}")
                except SyntaxError as error:
                    add("syntax", route, f"{cell['id']}: {error.msg} at line {error.lineno}")
            for detail in visible_dependency_issues(route):
                add("visible-dependency", route, detail)
            for detail in _semantic_issues(payload, route):
                add("semantic", route, detail)

    helper = str(payload.get("oneRHelperSource", ""))
    if not re.search(r"^class OneRPreprocessor\b", helper, re.MULTILINE):
        add("MW07", None, "oneRHelperSource does not export the public OneRPreprocessor adapter")
    one_r_routes = [route for route in routes_by_fold.get("5", []) if route["modelId"] == "one_r"]
    if one_r_routes and not all("OneRPreprocessor" in route_code(route, "prepare") for route in one_r_routes):
        add("MW07", None, "a generated One-R prepare cell still uses only the private preprocessor name")

    # Explicit intent markers map the independent checks to the audit IDs.
    # These are reported so a failure tells the reviewer which finding needs
    # attention instead of merely naming a missing token.
    audit_markers = {
        "MW16/MW17": any(item["kind"] == "visible-dependency" for item in issues),
        "MW20": any(item["kind"] == "semantic" and "/kmeans" in item.get("route", "") for item in issues),
        "MW21/MW22": any(item["kind"] == "semantic" and "/hierarchical" in item.get("route", "") for item in issues),
        "MW23/MW24/MW25": any(item["kind"] == "semantic" and "/pca" in item.get("route", "") for item in issues),
        "MW26": any(
            item["kind"] == "semantic"
            and any(f"/{model}" in item.get("route", "") for model in ("kmeans", "hierarchical", "pca"))
            and any(marker in item.get("detail", "") for marker in ("closing", "generic no-target", "teaching"))
            for item in issues
        ),
    }
    unaddressed = sorted(key for key, value in audit_markers.items() if value)
    return {
        "routes_per_fold": {folds: len(routes_by_fold.get(folds, [])) for folds in FOLDS},
        "dataset_counts": {
            folds: {
                dataset: sum(route["datasetId"] == dataset for route in routes_by_fold.get(folds, []))
                for dataset in EXPECTED_TOTALS
            }
            for folds in FOLDS
        },
        "scenario_pairs_per_fold": {
            folds: len({(route["datasetId"], route["scenarioId"]) for route in routes_by_fold.get(folds, [])})
            for folds in FOLDS
        },
        "public_one_r_adapter": bool(re.search(r"^class OneRPreprocessor\b", helper, re.MULTILINE)),
        "issues": issues,
        "unaddressed_audit_ids": unaddressed,
    }


def choose_runtime_routes(routes: list[dict], mode: str) -> list[dict]:
    if mode == "all":
        return list(routes)
    if mode == "unsupervised":
        return [route for route in routes if route["modelTask"] == "unsupervised"]
    selected: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for route in routes:
        key = (route["modelId"], route["modelTask"], route["dataset"]["split"])
        # Keep one two-input unsupervised route as well as one general route.
        if route["modelTask"] == "unsupervised":
            feature_count = len(route["scenario"].get("continuous", []))
            key = (*key, "two" if feature_count == 2 else "many")  # type: ignore[assignment]
        if key not in seen:
            selected.append(route)
            seen.add(key)
    return selected


def _runtime_namespace(pd, np, plt, sns) -> dict:
    return {
        "pd": pd,
        "np": np,
        "plt": plt,
        "sns": sns,
        "display": lambda value: None,
        "__builtins__": __builtins__,
    }


def _run_visible_route(payload: dict, route: dict, pd, np, plt, sns, include_optional: bool = False) -> dict:
    namespace = _runtime_namespace(pd, np, plt, sns)
    dataset = route["dataset"]
    namespace["df"] = pd.read_csv(ROOT / dataset["file"], sep=dataset["sep"])
    # The helper is a preloaded public application dependency, not a hidden
    # route setup/evidence cell.  No route cell's hidden field is executed.
    exec(str(payload.get("oneRHelperSource", "")), namespace, namespace)
    for cell in route["cells"]:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            exec(str(cell.get("code", "")), namespace, namespace)
        plt.close("all")
    optional_errors: list[str] = []
    if include_optional:
        for cell in route["cells"]:
            optional = _field_text(cell, ("optionalCode", "advancedCode", "advancedEvidenceCode", "diagnosticAdvancedCode"))
            if not optional:
                continue
            try:
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    exec(optional, namespace, namespace)
            except Exception as error:  # noqa: BLE001
                optional_errors.append(f"{cell['id']}: {type(error).__name__}: {error}")
            finally:
                plt.close("all")

    if route["modelTask"] == "unsupervised":
        if route["modelId"] == "kmeans":
            if len(namespace.get("clusters", [])) != len(namespace.get("X_scaled", [])):
                raise AssertionError("KMeans clusters are not aligned to X_scaled")
            if "cluster_means" not in namespace or "candidate_scores" not in namespace:
                raise AssertionError("KMeans visible path did not leave candidate and profile tables")
        elif route["modelId"] == "hierarchical":
            if len(namespace.get("clusters", [])) != len(namespace.get("X_sample", [])):
                raise AssertionError("hierarchical clusters are not aligned to X_sample")
            if "hierarchy" not in namespace or "cluster_profile" not in namespace:
                raise AssertionError("hierarchical visible path did not leave hierarchy and profile objects")
        else:
            scores = namespace.get("component_scores")
            if scores is None or len(scores) != len(namespace.get("X_scaled", [])):
                raise AssertionError("PCA component_scores are not aligned to X_scaled")
            if "loadings" not in namespace or "variance_table" not in namespace:
                raise AssertionError("PCA visible path did not leave variance and loading objects")
    else:
        prediction_name = next((name for name in ("test_predictions", "test_prediction", "final_prediction") if name in namespace), None)
        if prediction_name is None or len(namespace[prediction_name]) != len(namespace.get("y_test", [])):
            raise AssertionError("final visible path did not produce one prediction per saved test row")
    return {"optional_errors": optional_errors}


def runtime_audit(payload: dict, mode: str, include_optional: bool) -> dict:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np
        import pandas as pd
        import seaborn as sns
    except ImportError as error:
        raise AssertionError(f"Python runtime dependencies are unavailable: {error}") from error

    failures: list[dict] = []
    optional_failures: list[dict] = []
    attempted = 0
    for folds in FOLDS:
        for route in choose_runtime_routes(payload["routes"].get(folds, []), mode):
            attempted += 1
            try:
                result = _run_visible_route(payload, route, pd, np, plt, sns, include_optional)
                if result["optional_errors"]:
                    optional_failures.append({"folds": folds, "route": "/".join(route_key(route)), "errors": result["optional_errors"]})
            except Exception as error:  # noqa: BLE001
                failures.append(
                    {
                        "folds": folds,
                        "route": "/".join(route_key(route)),
                        "error": "".join(traceback.format_exception_only(type(error), error)).strip(),
                    }
                )
    if failures:
        raise AssertionError(f"{len(failures)} visible route(s) failed:\n" + json.dumps(failures[:12], indent=2))
    return {
        "runtime_mode": mode,
        "runtime_routes": attempted,
        "visible_runtime_failures": failures,
        "optional_runtime_failures": optional_failures,
        "runtime_versions": {
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": __import__("sklearn").__version__,
            "scipy": __import__("scipy").__version__,
            "matplotlib": matplotlib.__version__,
            "seaborn": sns.__version__,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--runtime",
        choices=("none", "representative", "unsupervised", "all"),
        default="none",
        help="Execute visible primary cells after structural checks.",
    )
    parser.add_argument(
        "--optional",
        action="store_true",
        help="Also execute separate advanced interpretation bundles after the visible path.",
    )
    args = parser.parse_args()

    payload = load_payload()
    summary = structural_audit(payload)
    if summary["issues"]:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        return 1
    if args.runtime != "none":
        summary["runtime"] = runtime_audit(payload, args.runtime, args.optional)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
