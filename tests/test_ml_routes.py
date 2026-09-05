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
import re
import subprocess
import sys
import traceback
import warnings

ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "tests" / "generate_ml_routes.mjs"


# Final closure audit: the primary learner surface is cell.code; hidden setup,
# evidence, and optional advanced code are measured separately.  Baseline
# counts are retained only to make the required reduction explicit.
STEP8_CODE_SURFACE_AUDIT = {
    "simple_linear": {
        "route": ("gapminder", "simple"), "model_id": "simple_linear",
        "baseline_lines": 50, "required": (("predict(",), ("coef_",), ("intercept_",)),
    },
    "multiple_linear": {
        "route": ("wine", "continuous"), "model_id": "multiple_linear",
        "baseline_lines": 34, "required": (("coef_",),),
    },
    "polynomial_simple": {
        "route": ("gapminder", "simple"), "model_id": "polynomial",
        "scenario_kind": "simple", "baseline_lines": 37,
        "required": (("predict(",), ("degree", "PolynomialFeatures")),
    },
    "polynomial_multiple": {
        "route": ("wine", "continuous"), "model_id": "polynomial",
        "scenario_kind": "multiple", "baseline_lines": 26,
        "required": (("coef_",), ("PolynomialFeatures", "degree")),
    },
    "regression_tree": {
        "route": ("wine", "simple"), "model_id": "regression_tree",
        "baseline_lines": 58, "required": (("plot_tree",), ("feature_importances_",)),
    },
    "logistic": {
        "route": ("breast", "continuous5"), "model_id": "logistic",
        "baseline_lines": 36, "required": (("coef_",),),
    },
    "classification_tree": {
        "route": ("breast", "continuous5"), "model_id": "classification_tree",
        "baseline_lines": 58, "required": (("plot_tree",), ("feature_importances_",)),
    },
    "knn_cls": {
        "route": ("breast", "continuous5"), "model_id": "knn_cls",
        "baseline_lines": 55, "required": (("kneighbors(",),),
    },
    "one_r": {
        "route": ("breast", "continuous5"), "model_id": "one_r",
        "baseline_lines": 34, "required": (("OneRClassifier",),),
    },
    "svm_cls": {
        "route": ("breast", "continuous5"), "model_id": "svm_cls",
        "baseline_lines": 49, "required": (("decision_function(", "support_vectors_", "n_support_"),),
    },
    "lda": {
        "route": ("breast", "continuous5"), "model_id": "lda",
        "baseline_lines": 52, "required": (("predict_proba(",), ("means_",)),
    },
    "qda": {
        "route": ("breast", "continuous5"), "model_id": "qda",
        "baseline_lines": 54, "required": (("predict_proba(",), ("means_",), ("reg_param",)),
    },
    "naive_bayes_gaussian": {
        "route": ("breast", "continuous5"), "model_id": "naive_bayes",
        "scenario_kind": "gaussian", "baseline_lines": 70,
        "required": (("predict_proba(",), ("class_prior_", "class_log_prior_"), ("theta_",)),
    },
    "naive_bayes_categorical": {
        "route": ("car", "categorical"), "model_id": "naive_bayes",
        "scenario_kind": "categorical", "baseline_lines": 62,
        "required": (("predict_proba(",), ("class_log_prior_", "class_prior_"), ("feature_log_prob_",)),
    },
    "mlp_cls": {
        "route": ("breast", "continuous5"), "model_id": "mlp_cls",
        "baseline_lines": 53,
        "required": (("predict_proba(",), ("hidden_layer_sizes",), ("loss_curve_",), ("n_iter_",)),
    },
    "mlp_reg": {
        "route": ("wine", "continuous"), "model_id": "mlp_reg",
        "baseline_lines": 51,
        "required": (("predict(",), ("hidden_layer_sizes",), ("loss_curve_",), ("n_iter_",)),
    },
}

STEP8_COMPLEXITY_CEILINGS = {
    "simple_linear": 30, "multiple_linear": 30,
    "polynomial_simple": 30, "polynomial_multiple": 30,
    "regression_tree": 35, "logistic": 30,
    "classification_tree": 35, "knn_cls": 30,
    "one_r": 30, "svm_cls": 30, "lda": 30, "qda": 30,
    "naive_bayes_gaussian": 30, "naive_bayes_categorical": 30,
    "mlp_cls": 30, "mlp_reg": 30,
}

STEP8_PRIMARY_FORBIDDEN = {
    "simple_linear": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "np.atleast_", "np.ravel("),
    "multiple_linear": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices"),
    "polynomial_simple": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "np.asarray("),
    "polynomial_multiple": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices"),
    "regression_tree": ("named_steps", "get_feature_names_out", "tree_.", "children_left", "children_right", "tree_transformed", "fit_indices"),
    "classification_tree": ("named_steps", "get_feature_names_out", "tree_.", "children_left", "children_right", "tree_transformed", "fit_indices"),
    "logistic": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "np.atleast_"),
    "knn_cls": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "self_neighbour", "vote_weights", "vote_scores", "row_values"),
    "one_r": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices"),
    "svm_cls": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "meshgrid", "grid_points", "grid_predictions", "region_codes", "np.asarray", "reshape("),
    "lda": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "meshgrid", "grid_points", "grid_predictions", "region_codes"),
    "qda": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "meshgrid", "grid_points", "grid_predictions", "region_codes"),
    "naive_bayes_gaussian": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "nb_quantity_rows", "nb_evidence_indices", "row_values", "feature_labels", "hasattr", "np.asarray"),
    "naive_bayes_categorical": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "nb_quantity_rows", "nb_evidence_indices", "row_values", "feature_labels", "hasattr", "np.asarray"),
    "mlp_cls": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "coefs_", "intercept_", "np.matmul", "np.dot", "hasattr", "oof_model"),
    "mlp_reg": ("named_steps", "get_feature_names_out", "fit_indices", "validation_indices", "coefs_", "intercept_", "np.matmul", "np.dot", "hasattr", "oof_model", "transformer_", "inverse_transform"),
}

STEP8_HIDDEN_FIELDS = {
    "setup": ("setupCode", "hiddenSetupCode", "evidenceSetupCode", "teachingSetupCode"),
    "evidence": ("evidenceCode", "hiddenEvidenceCode", "teachingEvidenceCode", "diagnosticEvidenceCode"),
    "advanced": ("advancedCode", "advancedEvidenceCode", "diagnosticAdvancedCode"),
}


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


def _cell_field_text(cell: dict, field_group: str) -> str:
    """Return the first non-empty hidden Python field for a route cell."""

    for field in STEP8_HIDDEN_FIELDS[field_group]:
        value = cell.get(field)
        if isinstance(value, str) and value.strip():
            return value
    return ""


def _cell_surface(cell: dict) -> dict:
    primary = str(cell.get("code", ""))
    setup = _cell_field_text(cell, "setup")
    evidence = _cell_field_text(cell, "evidence")
    advanced = _cell_field_text(cell, "advanced")
    return {
        "primary": primary,
        "setup": setup,
        "evidence": evidence,
        "advanced": advanced,
        "hidden": "\n".join(part for part in (setup, evidence) if part),
        "application": "\n".join(part for part in (setup, evidence, advanced) if part),
        "primaryLineCount": len(primary.splitlines()),
        "setupLineCount": len(setup.splitlines()),
        "evidenceLineCount": len(evidence.splitlines()),
        "advancedLineCount": len(advanced.splitlines()),
    }


def route_cell(route: dict, cell_id: str) -> dict:
    return next(cell for cell in route["cells"] if cell["id"] == cell_id)


def route_python(route: dict, include_hidden: bool = True) -> str:
    """Join primary and application-side Python without changing cell.code."""

    sources = []
    for cell in route["cells"]:
        surface = _cell_surface(cell)
        sources.append(surface["primary"])
        if include_hidden and surface["application"]:
            sources.append(surface["application"])
    return "\n".join(sources)


def diagnostic_python(route: dict, include_hidden: bool = True) -> str:
    cell = route_cell(route, "diagnose")
    surface = _cell_surface(cell)
    if not include_hidden:
        return surface["primary"]
    return "\n".join(part for part in (surface["primary"], surface["application"]) if part)


def _cell_execution_sources(cell: dict, include_optional: bool = False) -> list[tuple[str, str]]:
    """Return visible code, with optional evidence only when requested.

    The application worker executes ``cell.code`` as the primary route.  The
    model-specific evidence bundle remains testable, but it must be opted
    into explicitly so this suite catches hidden dependencies in the learner
    path instead of accidentally recreating them.
    """

    sources = [("primary", str(cell.get("code", "")))]
    if include_optional:
        optional_parts = [
            _cell_field_text(cell, "setup"),
            _cell_field_text(cell, "evidence"),
            str(cell.get("optionalCode", "")),
        ]
        seen: set[str] = set()
        for part in optional_parts:
            if part and part not in seen:
                sources.append(("optional", part))
                seen.add(part)
    return sources


def run_target_free_validator_regression(payload: dict) -> dict:
    """Exercise the exported Practice target guard against false positives."""

    source = payload.get("practiceValidatorSource")
    if not isinstance(source, str) or not source.strip():
        raise AssertionError(
            "Route generator does not expose PRACTICE_VALIDATOR_SOURCE; "
            "target-free AST regression cannot execute the production validator."
        )
    namespace = {"ast": ast, "__builtins__": __builtins__}
    exec(source, namespace, namespace)
    check = namespace["_practice_forbidden_source"]
    should_pass = {
        "harmless_comment": "# inspect cluster quality\ncluster_quality = silhouette_score(...)",
        "harmless_name": "cluster_quality = 0.8",
        "harmless_prose": "print('cluster quality')",
    }
    should_fail = {
        "direct_target": 'df["quality"]',
        "target_list_selection": 'model_df[["feature", "quality"]]',
        "target_loc_selection": 'analysis_rows.loc[:, "quality"]',
    }
    for label, code in should_pass.items():
        namespace["__cell_code"] = code
        result = check({"target": "quality"})
        if result is not None:
            raise AssertionError(f"Target-free validator rejected harmless {label}: {result}")
    for label, code in should_fail.items():
        namespace["__cell_code"] = code
        result = check({"target": "quality"})
        if not isinstance(result, dict) or result.get("ok") is not False:
            raise AssertionError(f"Target-free validator accepted genuine target access {label}: {result}")
    return {
        "ast_validator_exported": True,
        "harmless_comment_name_prose_pass": True,
        "direct_target_indexing_rejected": True,
        "target_list_selection_rejected": True,
        "target_loc_selection_rejected": True,
    }


MATPLOTLIB_DEPRECATION_PATTERNS = (
    re.compile(r"\.get_cmap\s*\("),
    re.compile(r"\bregister_cmap\s*\("),
    re.compile(r"\bmatplotlib\.cm\.get_cmap\s*\("),
)


def run_warning_regression(payload: dict, warnings_seen: list[str] | None = None) -> dict:
    """Reject the known Matplotlib deprecation while allowing fold warnings."""

    sources = [
        (ROOT / "ml-app.js").read_text(encoding="utf-8"),
        str(payload.get("workerSource", "")),
    ]
    for routes in payload["routes"].values():
        for route in routes:
            sources.append(route_python(route))
    deprecated_calls = [
        pattern.pattern
        for source in sources
        for pattern in MATPLOTLIB_DEPRECATION_PATTERNS
        if pattern.search(source)
    ]
    if deprecated_calls:
        raise AssertionError(f"Known Matplotlib deprecated plotting calls remain: {sorted(set(deprecated_calls))}")

    runtime_warnings = [str(item) for item in (warnings_seen or [])]
    runtime_deprecations = [
        warning for warning in runtime_warnings
        if "matplotlib" in warning.lower()
        and ("deprecated" in warning.lower() or "get_cmap" in warning.lower() or "register_cmap" in warning.lower())
    ]
    if runtime_deprecations:
        raise AssertionError(f"Matplotlib emitted a known deprecation warning: {runtime_deprecations[:3]}")
    allowed_unknown_categories = [
        warning for warning in runtime_warnings
        if re.search(r"OneHotEncoder|unknown categor", warning, re.IGNORECASE)
    ]
    return {
        "matplotlib_deprecation_calls": 0,
        "matplotlib_runtime_deprecations": 0,
        "onehot_unknown_category_warnings_allowed": True,
        "onehot_unknown_category_warning_count": len(allowed_unknown_categories),
    }


def step8_family_key(route: dict) -> str | None:
    model_id = route["modelId"]
    scenario = route.get("scenario", {})
    if model_id == "polynomial":
        return "polynomial_simple" if len(scenario.get("continuous", [])) == 1 else "polynomial_multiple"
    if model_id == "naive_bayes":
        return "naive_bayes_gaussian" if scenario.get("continuous") else "naive_bayes_categorical"
    return model_id if model_id in STEP8_CODE_SURFACE_AUDIT else None


def _required_step8_tokens(code: str, groups: tuple[tuple[str, ...], ...]) -> list[tuple[str, ...]]:
    return [group for group in groups if not any(token in code for token in group)]


def run_step8_code_surface_audit(payload: dict) -> dict:
    """Audit every generated route's primary Step 8 surface.

    The previous audit measured one representative string and allowed a
    written reason to justify oversized code.  This audit hard-fails primary
    cells over their family ceiling, checks all generated routes, and records
    hidden evidence/application code separately.
    """

    route_sets = payload["routes"]
    total_routes = sum(len(routes) for routes in route_sets.values())
    if total_routes != 254:
        raise AssertionError(f"Step 8 audit expected 254 generated routes; found {total_routes}.")

    route_reports = []
    family_reports: dict[str, list[dict]] = {key: [] for key in STEP8_CODE_SURFACE_AUDIT}
    missing_evidence = []
    failures = []
    for folds, routes in route_sets.items():
        for route in routes:
            try:
                diagnose = route_cell(route, "diagnose")
            except StopIteration:
                continue
            surface = _cell_surface(diagnose)
            family = step8_family_key(route)
            report = {
                "folds": int(folds),
                "dataset": route["datasetId"],
                "scenario": route["scenarioId"],
                "model": route["modelId"],
                "datasetId": route["datasetId"],
                "scenarioId": route["scenarioId"],
                "modelId": route["modelId"],
                "step": "diagnose",
                "family": family,
                "primaryLineCount": surface["primaryLineCount"],
                "primary_line_count": surface["primaryLineCount"],
                "setupLineCount": surface["setupLineCount"],
                "evidenceLineCount": surface["evidenceLineCount"],
                "advancedLineCount": surface["advancedLineCount"],
                "hasSeparateEvidence": bool(surface["evidence"].strip()),
            }
            route_reports.append(report)
            if family is None:
                continue
            family_reports[family].append(report)
            metadata = STEP8_CODE_SURFACE_AUDIT[family]
            primary = surface["primary"]
            # Model-specific interpretation is intentionally optional.  The
            # short primary cell owns validation errors; check the analytical
            # operation in the separately surfaced evidence bundle.
            evidence_surface = surface["application"]
            missing_required = _required_step8_tokens(evidence_surface, metadata["required"])
            forbidden = [token for token in STEP8_PRIMARY_FORBIDDEN[family] if token in primary]
            if family == "svm_cls" and re.search(r"\.support_(?!vectors_)", primary):
                forbidden.append(".support_ (support-index remapping)")
            if missing_required:
                failures.append({
                    **report,
                    "error": "missing primary analytical operation",
                    "missing": missing_required,
                })
            if forbidden:
                failures.append({
                    **report,
                    "error": "primary contains diagnostic-only plumbing",
                    "forbidden": forbidden,
                })
            if not surface["evidence"].strip():
                missing_evidence.append(report)

    if missing_evidence:
        raise AssertionError(
            "Known supervised Step 8 families must emit hidden evidence separately; "
            f"missing evidence in {len(missing_evidence)} route(s), first={missing_evidence[:3]}"
        )
    if failures:
        raise AssertionError(f"Step 8 primary surface contract failed: {failures[:8]}")

    family_summary = {}
    representative_lines = {}
    for family, metadata in STEP8_CODE_SURFACE_AUDIT.items():
        reports = family_reports[family]
        if not reports:
            raise AssertionError(f"Step 8 family has no generated routes: {family}")
        ceiling = STEP8_COMPLEXITY_CEILINGS[family]
        over_ceiling = [item for item in reports if item["primaryLineCount"] > ceiling]
        if over_ceiling:
            raise AssertionError(
                f"{family} primary Step 8 code exceeded the hard {ceiling}-line ceiling: "
                f"{over_ceiling[:4]}"
            )
        # A long baseline must show material reduction, not merely move a few
        # lines around.  The <=30/35 ceilings are the primary acceptance bar;
        # this explicit delta prevents a future 50-line regression if a ceiling
        # is accidentally loosened.
        if metadata["baseline_lines"] >= 40:
            minimum_reduction = 10
            max_allowed = metadata["baseline_lines"] - minimum_reduction
            if max(item["primaryLineCount"] for item in reports) > max_allowed:
                raise AssertionError(
                    f"{family} did not materially reduce its primary surface: "
                    f"baseline={metadata['baseline_lines']} max={max(item['primaryLineCount'] for item in reports)}"
                )
        route_key = (*metadata["route"], metadata["model_id"])
        representative = next(
            (
                item for item in reports
                if item["dataset"] == route_key[0]
                and item["scenario"] == route_key[1]
                and item["model"] == route_key[2]
            ),
            None,
        )
        if representative is None:
            raise AssertionError(f"Missing representative route for Step 8 family {family}: {route_key}")
        representative_lines[family] = representative["primaryLineCount"]
        primary_values = [item["primaryLineCount"] for item in reports]
        family_summary[family] = {
            "modelId": metadata["model_id"],
            "routeCount": len(reports),
            "baselineLines": metadata["baseline_lines"],
            "minPrimaryLines": min(primary_values),
            "maxPrimaryLines": max(primary_values),
            "averagePrimaryLines": round(sum(primary_values) / len(primary_values), 2),
            "primaryCeiling": ceiling,
            "maxSetupLines": max(item["setupLineCount"] for item in reports),
            "maxEvidenceLines": max(item["evidenceLineCount"] for item in reports),
            "maxAdvancedLines": max(item["advancedLineCount"] for item in reports),
        }

    return {
        "baseline_lines": {key: value["baseline_lines"] for key, value in STEP8_CODE_SURFACE_AUDIT.items()},
        "current_lines": representative_lines,
        "ceilings": STEP8_COMPLEXITY_CEILINGS,
        "review_threshold": 30,
        "hard_maximum": 35,
        "all_route_count": total_routes,
        "step8_diagnose_route_count": len(route_reports),
        "primary_line_report": route_reports,
        "family_summary": family_summary,
        "audit": {
            key: {
                "route": list(value["route"]),
                "model_id": value["model_id"],
                "baseline_lines": value["baseline_lines"],
                "required": [list(group) for group in value["required"]],
                "forbidden_primary_tokens": list(STEP8_PRIMARY_FORBIDDEN[key]),
            }
            for key, value in STEP8_CODE_SURFACE_AUDIT.items()
        },
    }


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
    target_free_validator_result = run_target_free_validator_regression(payload)
    warning_regression_result = run_warning_regression(payload)

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
        "reference",
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
    phase2b2_model_ids = {"mlp_cls", "mlp_reg"}
    phase2_model_ids = phase2a_model_ids | phase2b1_model_ids | phase2b2_model_ids
    # The short primary Diagnose cell now owns validation errors.  The
    # model-specific evidence is an explicit optional bundle, so these
    # requirements describe the public names in that bundle rather than the
    # retired hidden setup/evidence implementation.
    phase2a_required_tokens = {
        "simple_linear": ("simple_grid", "simple_curve", "simple_interpretation", "fitted line"),
        "multiple_linear": ("linear_interpretation", "coefficient"),
        "regression_tree": ("tree_summary", "feature_importances_", "plot_tree", "max_depth=2"),
        "classification_tree": ("tree_summary", "feature_importances_", "plot_tree", "max_depth=2"),
        "logistic": ("logistic_coefficients", "logistic_interpretation", "relative_weight"),
        "knn_cls": ("knn_training_rows", "kneighbors", "knn_neighbor_table"),
        "one_r": ("one_r_rules", "one_r_rule_table"),
    }
    phase2b1_required_tokens = {
        "svm_cls": ("support_vectors", "svm_decision_values", "n_support_"),
        "lda": ("class_centres", "means_"),
        "qda": ("class_centres", "means_", "reg_param"),
        "naive_bayes": ("class_evidence", "class_prior_"),
    }
    phase2b2_required_tokens = {
        "mlp_cls": ("mlp_summary", "mlp_loss_curve", "predict_proba", "loss_curve_", "n_iter_", "hidden_layer_sizes"),
        "mlp_reg": ("mlp_summary", "mlp_loss_curve", "original_units", "loss_curve_", "regressor_", "hidden_layer_sizes"),
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
        "phase2b2_model_specific_routes": 0,
        "phase2b2_model_ids": [],
        "unsupervised_routes_with_teaching": 0,
        "unsupervised_model_ids": [],
        "pca_routes_with_teaching": 0,
        "pca_model_ids": [],
    }
    phase2a_models_seen = set()
    phase2b1_models_seen = set()
    phase2b2_models_seen = set()
    unsupervised_models_seen = set()

    required_concepts = {
        "frame": {"feature", "target", "X", "y", "row"},
        "split": {"training-data", "final-test-set", "80-20-split"},
        "prepare": {"preprocessing"},
        "model": {"pipeline", "fit", "predict"},
        "baseline": {"cross-validation", "fold", "cv-purpose", "final-test-exclusion"},
        "reference": {"reference-predictor", "baseline-comparison"},
        "tune": {"hyperparameter", "learned-parameter"},
    }
    supervised_practice_steps = {"split", "prepare", "baseline", "reference", "diagnose", "final"}
    unsupervised_practice_steps = {
        "kmeans": {"compare", "fit", "profile"},
        "hierarchical": {"compare", "fit", "profile"},
        "pca": {"variance", "select", "loadings", "project"},
    }
    practice_routes_checked = 0
    practice_interactions_checked = 0

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
                expected = list(supervised_ids)
                if any(cell_id == "tune" for cell_id in ids):
                    expected.insert(expected.index("diagnose"), "tune")
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
                for field_group in ("setup", "evidence", "advanced"):
                    hidden_code = _cell_field_text(cell, field_group)
                    if not hidden_code:
                        continue
                    try:
                        ast.parse(
                            hidden_code,
                            filename=f"{route['datasetId']}:{cell['id']}:{field_group}",
                        )
                    except SyntaxError as error:
                        raise AssertionError(
                            f"Python syntax error in hidden {field_group} for "
                            f"{folds}-fold {route['datasetId']}/{route['scenarioId']}/{model_id}/{cell['id']}: {error}"
                        ) from error
                if not cell["question"].strip() or not cell["caption"].strip():
                    raise AssertionError(f"Missing beginner explanation in {route}")
                if (task_type != "unsupervised" or model_id in {"kmeans", "hierarchical", "pca"}) and not cell.get("readingCue", "").strip():
                    raise AssertionError(
                        f"Missing reading cue for guided step: "
                        f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{cell['id']}"
                    )

            if task_type != "unsupervised":
                required_practice = set(supervised_practice_steps)
                if "tune" in ids:
                    required_practice.add("tune")
            else:
                required_practice = unsupervised_practice_steps[model_id]
            for step_id in required_practice:
                metadata = next(cell for cell in route["cells"] if cell["id"] == step_id)
                practice = metadata.get("practice")
                if not isinstance(practice, dict):
                    raise AssertionError(
                        f"Missing Practice metadata for {route['datasetId']}/{route['scenarioId']}/{model_id}/{step_id}"
                    )
                practice_routes_checked += 1
                practice_text = json.dumps(practice, sort_keys=True)
                # The final reading exercise is intentionally attached to the
                # legal final-test step.  All pre-final Practice metadata must
                # remain holdout-free; the final exercise may name the result
                # that has just been revealed.
                if step_id != "final":
                    for forbidden in ("X_test", "y_test", "test_prediction", "test_result"):
                        if forbidden in practice_text:
                            raise AssertionError(f"Practice metadata exposes holdout plumbing: {route}/{step_id}")
                exercise = practice.get("exercise")
                if exercise is not None:
                    if not isinstance(exercise, dict):
                        raise AssertionError(f"Practice exercise metadata is not an object: {route}/{step_id}")
                    for key in ("id", "type", "title", "prompt", "goal", "hint", "expectedOutput", "solution", "validation", "modelId", "taskId"):
                        if key not in exercise or not str(exercise[key]).strip():
                            raise AssertionError(f"Practice exercise is missing {key}: {route}/{step_id}")
                    if exercise["modelId"] != model_id or exercise["taskId"] != step_id:
                        raise AssertionError(f"Practice exercise identity does not match its route cell: {route}/{step_id}")
                    if not isinstance(exercise["validation"], dict) or not exercise["validation"].get("kind"):
                        raise AssertionError(f"Practice exercise validator metadata is incomplete: {route}/{step_id}")
                    if not isinstance(exercise.get("required"), list) or not all(str(item).strip() for item in exercise["required"]):
                        raise AssertionError(f"Practice exercise requirements are not usable: {route}/{step_id}")
                if task_type == "unsupervised" and route["dataset"]["target"] in practice_text:
                    raise AssertionError(f"Unsupervised Practice metadata exposes the hidden reference label: {route}/{step_id}")
                for interaction_key in ("beforeRun", "decision"):
                    interaction = practice.get(interaction_key)
                    if not interaction:
                        continue
                    practice_interactions_checked += 1
                    if not str(interaction.get("prompt", "")).strip() or not isinstance(interaction.get("options"), list):
                        raise AssertionError(f"Practice {interaction_key} is incomplete: {route}/{step_id}")
                    values = [option.get("value") for option in interaction["options"]]
                    if "not_sure" not in values or len(values) != len(set(values)):
                        raise AssertionError(f"Practice {interaction_key} lacks a unique Not sure option: {route}/{step_id}")
                experiment = practice.get("experiment")
                if experiment:
                    for key in ("id", "title", "instruction", "find", "replace", "change", "targetTaskId", "evidenceTaskId"):
                        if not str(experiment.get(key, "")).strip():
                            raise AssertionError(f"Practice experiment is missing {key}: {route}/{step_id}")
                    route_positions = {cell["id"]: index for index, cell in enumerate(route["cells"])}
                    target_task = experiment["targetTaskId"]
                    evidence_task = experiment["evidenceTaskId"]
                    if target_task not in route_positions or evidence_task not in route_positions:
                        raise AssertionError(f"Practice experiment points outside its route: {route}/{step_id}")
                    if route_positions[evidence_task] < route_positions[target_task]:
                        raise AssertionError(f"Practice experiment asks for evidence before its mutation can run: {route}/{step_id}")
                    if experiment["find"] not in route["cells"][route_positions[target_task]]["code"]:
                        raise AssertionError(f"Practice experiment does not match its target cell: {route}/{step_id}")

            if task_type != "unsupervised":
                teaching_checks["supervised_routes_with_step_guidance"] += 1
                for step_id, expected_keys in required_concepts.items():
                    if step_id == "tune" and step_id not in ids:
                        continue
                    metadata = next(cell for cell in route["cells"] if cell["id"] == step_id)
                    actual_keys = set(metadata.get("conceptKeys", []))
                    expected_for_route = set(expected_keys)
                    if step_id == "baseline" and route["dataset"]["split"] == "time":
                        # TimeSeriesSplit uses ordered windows instead of
                        # interchangeable folds, while retaining the same CV
                        # purpose and sealed-test boundary.
                        expected_for_route -= {"cross-validation", "fold"}
                    missing_keys = expected_for_route - actual_keys
                    if missing_keys:
                        raise AssertionError(
                            f"Missing Phase 1B concepts {sorted(missing_keys)} for "
                            f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{step_id}"
                        )
                if model_id in {"mlp_cls", "mlp_reg"}:
                    model_metadata = next(cell for cell in route["cells"] if cell["id"] == "model")
                    expected_mlp_concepts = {
                        "hidden-layer",
                        "hidden-layer-sizes",
                        "early-stopping",
                    }
                    if model_id == "mlp_reg":
                        expected_mlp_concepts.update({"target-scaling", "TransformedTargetRegressor", "nested-parameter-routing"})
                    missing_mlp_concepts = expected_mlp_concepts - set(model_metadata.get("conceptKeys", []))
                    if missing_mlp_concepts:
                        raise AssertionError(f"Neural Network build teaching is incomplete: {sorted(missing_mlp_concepts)}")
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
                if "tune" in ids:
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
            route_source = route_python(route)
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

                model_grid = payload["models"][model_id]
                has_grid = "tune" in ids
                if has_grid:
                    tune = route_code(route, "tune")
                    if "GridSearchCV" not in tune:
                        raise AssertionError(f"Expected a readable grid for {route}")
                    if any(token in tune for token in ("return_train_score", "refit=", "tuning_results", "n_jobs=1", 'error_score="raise"')):
                        raise AssertionError(f"Tuning cell still contains multi-metric or low-level clutter: {route}")
                    if "chosen_pipeline" not in tune:
                        raise AssertionError(f"Tuning cell does not define chosen_pipeline: {route}")
                reference = route_code(route, "reference")
                if "cross_val_score" not in reference or not re.search(r"Dummy(Classifier|Regressor)", reference):
                    raise AssertionError(f"Reference cell does not expose one simple same-fold predictor: {route}")
                if "chosen_pipeline = pipeline" not in reference:
                    raise AssertionError(f"Reference cell does not hand off the initial pipeline: {route}")

                diagnostic_primary = diagnostic_python(route, include_hidden=False)
                diagnostic = diagnostic_python(route)
                if any(
                    token in diagnostic
                    for token in ("classification_report", "diagnostic_rmse", "diagnostic_r2", "root_mean_squared_error", "r2_score", "X_test", "y_test", "test_prediction", "test_result")
                ):
                    raise AssertionError(f"Diagnostic cell contains an aggregate score/report: {route}")
                if "tune" in ids and ids.index("tune") >= ids.index("diagnose"):
                    raise AssertionError(f"Diagnostic does not follow tuning selection: {route}")
                if "chosen_pipeline" not in diagnostic:
                    raise AssertionError(f"Diagnostic does not use the selected pipeline: {route}")
                if "chosen_pipeline" not in route_code(route, "final"):
                    raise AssertionError(f"Final cell does not use chosen_pipeline: {route}")

                diagnose_metadata = next(cell for cell in route["cells"] if cell["id"] == "diagnose")
                model_teaching = diagnose_metadata.get("modelTeaching")
                if model_id in phase2_model_ids:
                    if model_id in phase2a_model_ids:
                        phase2a_models_seen.add(model_id)
                        teaching_checks["phase2a_model_specific_routes"] += 1
                    if model_id in phase2b1_model_ids:
                        phase2b1_models_seen.add(model_id)
                        teaching_checks["phase2b1_model_specific_routes"] += 1
                    if model_id in phase2b2_model_ids:
                        phase2b2_models_seen.add(model_id)
                        teaching_checks["phase2b2_model_specific_routes"] += 1
                    if not isinstance(model_teaching, dict) or model_teaching.get("modelId") != model_id:
                        raise AssertionError(f"Model-specific teaching metadata is missing: {route}")
                    if any(not str(model_teaching.get(key, "")).strip() for key in ("learned", "see", "read", "watchOut")):
                        raise AssertionError(f"Model-specific teaching metadata is incomplete: {route}")
                    required_tokens = (
                        phase2a_required_tokens.get(model_id, ())
                        if model_id in phase2a_model_ids
                        else phase2b1_required_tokens.get(model_id, ())
                        if model_id in phase2b1_model_ids
                        else phase2b2_required_tokens.get(model_id, ())
                    )
                    missing_tokens = [token for token in required_tokens if token not in diagnostic]
                    if model_id == "polynomial":
                        expected_polynomial_tokens = ("poly_grid", "poly_curve", "polynomial_degree") if len(route["scenario"]["continuous"]) == 1 else ("polynomial_names", "no single 2D fitted curve")
                        missing_tokens.extend(token for token in expected_polynomial_tokens if token not in diagnostic)
                    if missing_tokens:
                        raise AssertionError(f"{model_id} diagnostic is missing {missing_tokens}: {route}")
                    if model_id == "multiple_linear" and "sort_values" in diagnostic:
                        raise AssertionError(f"Multiple linear coefficients are being ranked by raw magnitude: {route}")
                    if model_id in phase2b2_model_ids:
                        forbidden = ("X_test", "y_test", "test_prediction", "test_result", "coefs_", "intercept_", "np.matmul", "np.dot")
                        if any(token in diagnostic for token in forbidden):
                            raise AssertionError(f"Neural Network Step 8 exposes forbidden test/weight plumbing: {route}")
                        if model_id == "mlp_reg" and any(token in diagnostic for token in ("transformer_", "inverse_transform", "hasattr")):
                            raise AssertionError(f"Neural Network regression Step 8 exposes target-wrapper internals: {route}")
                        model_code = route_code(route, "model")
                        expected_early_stopping = "early_stopping=False" if route["dataset"]["split"] == "time" and model_id == "mlp_reg" else "early_stopping=True"
                        if expected_early_stopping not in model_code:
                            raise AssertionError(f"Neural Network route has the wrong built-in early-stopping setting: {route}")
                        if model_id == "mlp_reg" and route["dataset"]["split"] == "time":
                            build_text = " ".join(
                                f'{item.get("label", "")} {item.get("text", "")}'
                                for item in next(cell for cell in route["cells"] if cell["id"] == "model").get("concepts", [])
                            ).lower()
                            for token in ("disabled", "not time-aware", "outer timeseriessplit", "normal convergence criterion"):
                                if token not in build_text:
                                    raise AssertionError(f"Seoul MLP route is missing route-specific early-stopping teaching {token!r}: {route}")
                elif model_teaching:
                    raise AssertionError(f"A Phase 2 model-specific diagnostic leaked into an out-of-scope model: {route}")

                if model_id == "one_r":
                    full_code = route_python(route)
                    if "class OneRClassifier" in full_code or ".rules_" in full_code:
                        raise AssertionError(f"Full One-R implementation leaked into the normal route: {route}")
                    if "OneRClassifier(bins=5)" not in route_code(route, "model"):
                        raise AssertionError(f"Visible One-R cell is not the simple estimator: {route}")
                    if "one_r_rule_table" not in diagnostic:
                        raise AssertionError(f"One-R interpretation is not a readable rule table: {route}")

                if model_id == "polynomial":
                    model_code = route_code(route, "model")
                    positions = [
                        model_code.index('("polynomial"'),
                        model_code.index('("scale"'),
                        model_code.index('("model"'),
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
                    diagnostic = diagnostic_python(route)
                    if '"probability":' in diagnostic or '"score":' in diagnostic or '"value":' in diagnostic:
                        raise AssertionError(f"Naive Bayes quantity output has an ambiguous generic heading: {route}")
                    for label in ("Prior probability", "Posterior probability"):
                        if label not in diagnostic:
                            raise AssertionError(f"Naive Bayes quantity output is missing an explicit {label} label: {route}")
                    expected_quantity = "Class-conditional density" if kind == "continuous" else "Class-conditional probability"
                    if expected_quantity not in diagnostic:
                        raise AssertionError(f"Naive Bayes output is missing its typed class-conditional quantity: {route}")
                    if kind == "continuous" and any(token in diagnostic for token in ("Likelihood P(feature", "estimated_probability", "probability_label")):
                        raise AssertionError(f"Gaussian Naive Bayes still labels density evidence as probability: {route}")
                    if kind == "continuous":
                        preparation_and_model = prepare + "\n" + model_code
                        if "feature probabilities" in preparation_and_model.lower():
                            raise AssertionError(f"Gaussian Naive Bayes preparation still calls continuous density evidence feature probabilities: {route}")
                        if "class-conditional feature evidence/distributions" not in preparation_and_model:
                            raise AssertionError(f"Gaussian Naive Bayes preparation is missing variant-safe evidence wording: {route}")
                    if kind != "continuous" and "Likelihood P(feature" in diagnostic:
                        raise AssertionError(f"Bernoulli Naive Bayes still uses an untyped likelihood heading: {route}")
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
                unsupervised_code = route_python(route)
                if any(token in unsupervised_code for token in ("y_train", "y_test", "X_test", "test_prediction")):
                    raise AssertionError(f"Unsupervised route contains supervised target/test fitting: {route}")
                if model_id in {"kmeans", "hierarchical"}:
                    unsupervised_models_seen.add(model_id)
                    teaching_checks["unsupervised_routes_with_teaching"] += 1
                    required_unsupervised_concepts = {
                        "kmeans": {
                            "frame": {"cluster", "no_target_score", "cluster_label"},
                            "prepare": {"distance", "scaling"},
                            "compare": {"k", "inertia", "silhouette", "choice_not_truth"},
                            "fit": {"centroid", "k", "choice_not_truth"},
                            "diagnose": {"silhouette"},
                            "profile": {"profile", "centroid"},
                            "visualise": {"pca_projection"},
                        },
                        "hierarchical": {
                            "frame": {"cluster", "no_target_score", "cluster_label"},
                            "prepare": {"distance", "scaling", "sampling"},
                            "dendrogram": {"agglomerative", "ward", "leaves", "join", "merge_height", "horizontal_cut"},
                            "compare": {"silhouette", "horizontal_cut", "choice_not_truth"},
                            "fit": {"agglomerative", "horizontal_cut", "choice_not_truth"},
                            "profile": {"profile", "sampling"},
                            "visualise": {"pca_projection", "sampling"},
                        },
                    }[model_id]
                    for step_id, expected_keys in required_unsupervised_concepts.items():
                        metadata = next(cell for cell in route["cells"] if cell["id"] == step_id)
                        missing_keys = expected_keys - set(metadata.get("conceptKeys", []))
                        if missing_keys:
                            raise AssertionError(
                                f"Missing Phase 3A concepts {sorted(missing_keys)} for "
                                f"{route['datasetId']}/{route['scenarioId']}/{model_id}/{step_id}"
                            )
                    interpretation_step_id = "diagnose" if model_id == "kmeans" else "profile"
                    model_metadata = next(cell for cell in route["cells"] if cell["id"] == interpretation_step_id)
                    model_teaching = model_metadata.get("modelTeaching")
                    if not isinstance(model_teaching, dict) or model_teaching.get("modelId") != model_id:
                        raise AssertionError(f"Unsupervised model-specific teaching metadata is missing: {route}")
                    if any(not str(model_teaching.get(key, "")).strip() for key in ("learned", "see", "read", "watchOut")):
                        raise AssertionError(f"Unsupervised model-specific teaching is incomplete: {route}")
                    target = route["dataset"]["target"]
                    target_literal = re.compile(rf"['\"]{re.escape(target)}['\"]")
                    if target_literal.search(unsupervised_code):
                        raise AssertionError(f"{model_id} discovery code references the hidden reference target: {route}")
                    if any(token in unsupervised_code for token in ("silhouette_suggestion", "suggested_k", "selected_k = suggested_k", "best_k", ".idxmax(", "Mechanical silhouette suggestion")):
                        raise AssertionError(f"{model_id} still turns a metric argmax into an automatic grouping choice: {route}")
                    if "no single score makes that decision automatically" not in unsupervised_code:
                        raise AssertionError(f"{model_id} does not explain that silhouette is supporting evidence: {route}")
                    if "selected_k = min(3, max_k)" not in unsupervised_code:
                        raise AssertionError(f"{model_id} does not use a neutral runnable selected_k default: {route}")
                    if "sample_size = min(2000" not in unsupervised_code and "silhouette_size = min(2000" not in unsupervised_code:
                        raise AssertionError(f"Cluster silhouette is not bounded by a reproducible sample: {route}")
                    if "random_state=42" not in unsupervised_code:
                        raise AssertionError(f"Cluster sampling is not reproducible: {route}")
                    if model_id == "kmeans":
                        for token in ("inertia", "cluster_means"):
                            if token not in unsupervised_code:
                                raise AssertionError(f"K-Means teaching evidence is incomplete: {token}")
                        if any(token in unsupervised_code for token in ("centroid_profile", "inverse_transform(kmeans.cluster_centers_)")):
                            raise AssertionError(f"K-Means keeps a duplicate or misleading centroid profile: {route}")
                    else:
                        for token in ("sampled_rows", "hierarchy", "method=\"ward\"", "merge_height", "Ward merge height", "pairwise comparisons"):
                            if token not in unsupervised_code:
                                raise AssertionError(f"Hierarchical teaching evidence is incomplete: {token}")
                if model_id == "pca":
                    teaching_checks["pca_routes_with_teaching"] += 1
                    pca_cells = {cell["id"]: cell for cell in route["cells"]}
                    if any(not pca_cells[cell_id]["question"].strip() or not pca_cells[cell_id]["readingCue"].strip() for cell_id in pca_ids):
                        raise AssertionError(f"PCA route is missing question/reading guidance: {route}")
                    pca_required_concepts = {
                        "frame": {"principal_component", "pc1", "pc2", "not_clustering"},
                        "explore": {"redundancy", "principal_component"},
                        "prepare": {"pca_scaling"},
                        "variance": {"explained_variance", "cumulative_variance", "scree", "ninety_rule"},
                        "select": {"ninety_rule", "reduced_representation", "cumulative_variance"},
                        "loadings": {"loading", "loading_magnitude", "loading_sign", "loading_sign_arbitrary", "score", "loading_vs_score"},
                        "project": {"score", "loading_vs_score", "projection", "pca_limitations"},
                    }
                    for step_id, expected_keys in pca_required_concepts.items():
                        missing_keys = expected_keys - set(pca_cells[step_id].get("conceptKeys", []))
                        if missing_keys:
                            raise AssertionError(f"Missing PCA concepts {sorted(missing_keys)} for {route['datasetId']}/{route['scenarioId']}/{step_id}")
                    project_teaching = pca_cells["project"].get("modelTeaching")
                    if not isinstance(project_teaching, dict) or project_teaching.get("modelId") != "pca" or any(
                        not str(project_teaching.get(key, "")).strip() for key in ("learned", "see", "read", "watchOut")
                    ):
                        raise AssertionError(f"PCA model-specific teaching is incomplete: {route}")
                    if "information concentrate" in source.lower():
                        raise AssertionError("The vague PCA information-concentrate wording has returned.")
                    if "pca = PCA()" not in pca_cells["variance"]["code"] or "component_scores = pca.fit_transform(X_scaled)" not in pca_cells["variance"]["code"]:
                        raise AssertionError(f"PCA does not fit one named model while creating component scores: {route}")
                    if "explained_variance_ratio_" not in unsupervised_code or "cumulative_explained_variance" not in unsupervised_code:
                        raise AssertionError(f"PCA variance terminology/evidence is incomplete: {route}")
                    if "variance_target = 0.90" not in unsupervised_code or "components_for_target" not in unsupervised_code or "variance_retained" not in unsupervised_code:
                        raise AssertionError(f"PCA selection does not use one active variance target: {route}")
                    if "components_for_90pct" in unsupervised_code or "variance_retained_at_90pct" in unsupervised_code:
                        raise AssertionError(f"PCA still uses fixed 90%-specific variable names: {route}")
                    if "The {variance_target:.0%} target is a chosen rule of thumb" not in unsupervised_code:
                        raise AssertionError(f"PCA active target is not taught as a chosen criterion: {route}")
                    if "X_reduced = component_scores" not in unsupervised_code:
                        raise AssertionError(f"PCA does not expose the selected reduced representation: {route}")
                    pre_project_code = "\n".join(pca_cells[cell_id]["code"] for cell_id in pca_ids[:-1])
                    project_code = pca_cells["project"]["code"]
                    target = route["dataset"]["target"]
                    target_literal = re.compile(rf"['\"]{re.escape(target)}['\"]")
                    if target_literal.search(pre_project_code):
                        raise AssertionError(f"PCA accesses its reference target before the interpretation step: {route}")
                    project_optional_code = pca_cells["project"].get("optionalCode", "")
                    if target_literal.search(project_optional_code) is None or "added only after PCA is fitted" not in project_optional_code:
                        raise AssertionError(f"PCA interpretation does not explicitly add the reference label after fitting: {route}")
                    if "components_[:2].T" not in pca_cells["loadings"]["code"] or "index.name = \"feature\"" not in pca_cells["loadings"]["code"]:
                        raise AssertionError(f"PCA loadings are not feature-labelled: {route}")
                    if route["scenarioId"] == "continuous30":
                        explore_code = pca_cells["explore"]["code"]
                        explore_optional = pca_cells["explore"].get("optionalCode", "")
                        if "pair_summary" not in explore_code or "left_feature" not in explore_code or "right_feature" not in explore_code:
                            raise AssertionError(f"High-dimensional PCA redundancy evidence is not compact: {route}")
                        if "combinations" in explore_code or "combinations" not in explore_optional:
                            raise AssertionError(f"High-dimensional PCA all-pairs evidence is not separated as optional depth: {route}")

    expected_pca_routes = sum(
        route["modelId"] == "pca"
        for routes in route_sets.values()
        for route in routes
    )
    if teaching_checks["pca_routes_with_teaching"] != expected_pca_routes:
        raise AssertionError(
            f"PCA model-specific metadata count mismatch; expected {expected_pca_routes}, "
            f"saw {teaching_checks['pca_routes_with_teaching']}"
        )
    teaching_checks["pca_model_ids"] = ["pca"] if expected_pca_routes else []

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
    expected_phase2b2_routes = sum(
        route["modelId"] in phase2b2_model_ids
        for routes in route_sets.values()
        for route in routes
    )
    if phase2b2_models_seen != phase2b2_model_ids:
        raise AssertionError(
            f"Phase 2B-2 model-specific coverage is incomplete; expected {sorted(phase2b2_model_ids)}, "
            f"saw {sorted(phase2b2_models_seen)}"
        )
    if teaching_checks["phase2b2_model_specific_routes"] != expected_phase2b2_routes:
        raise AssertionError(
            f"Phase 2B-2 model-specific metadata count mismatch; expected {expected_phase2b2_routes}, "
            f"saw {teaching_checks['phase2b2_model_specific_routes']}"
    )
    teaching_checks["phase2b2_model_ids"] = sorted(phase2b2_models_seen)
    expected_unsupervised_routes = sum(
        route["modelId"] in {"kmeans", "hierarchical"}
        for routes in route_sets.values()
        for route in routes
    )
    if unsupervised_models_seen != {"kmeans", "hierarchical"}:
        raise AssertionError(
            f"Phase 3A model-specific coverage is incomplete; saw {sorted(unsupervised_models_seen)}"
        )
    if teaching_checks["unsupervised_routes_with_teaching"] != expected_unsupervised_routes:
        raise AssertionError(
            f"Phase 3A model-specific metadata count mismatch; expected {expected_unsupervised_routes}, "
            f"saw {teaching_checks['unsupervised_routes_with_teaching']}"
        )
    teaching_checks["unsupervised_model_ids"] = sorted(unsupervised_models_seen)

    boundary_fixtures = payload.get("phase2bFixtures", {})
    if set(boundary_fixtures) != {"svm_cls", "lda", "qda"}:
        raise AssertionError("Phase 2B-1 boundary fixtures are incomplete.")
    for model_id, fixture in boundary_fixtures.items():
        fixture_ids = list(supervised_ids)
        if "tune" in cell_ids(fixture):
            fixture_ids.insert(fixture_ids.index("diagnose"), "tune")
        if cell_ids(fixture) != fixture_ids:
            raise AssertionError(f"Phase 2B-1 boundary fixture has the wrong guided steps: {model_id}")
        fixture_diagnostic = diagnostic_python(fixture)
        if any(token in fixture_diagnostic for token in ("X_test", "y_test", "test_prediction", "test_result")):
            raise AssertionError(f"Phase 2B-1 boundary fixture accesses final-test data: {model_id}")
        fixture_tokens = {
            "svm_cls": ("support_vectors", "svm_decision_values", "n_support_"),
            "lda": ("class_centres", "means_"),
            "qda": ("class_centres", "means_", "reg_param"),
        }[model_id]
        fixture_diagnostic_lower = fixture_diagnostic.lower()
        if any(token.lower() not in fixture_diagnostic_lower for token in fixture_tokens):
            raise AssertionError(f"Phase 2B-1 {model_id} boundary fixture is not model-faithful: {fixture_tokens}")

    density_fixture = payload.get("phase2bGaussianDensityFixture")
    if (
        not isinstance(density_fixture, dict)
        or density_fixture.get("observed") != density_fixture.get("mean")
        or density_fixture.get("variance") != 0.001
        or float(density_fixture.get("expected_density", 0)) <= 1
    ):
        raise AssertionError("The deterministic Gaussian density-above-one fixture is missing or invalid.")

    model_df_sources = {
        dataset_id: config["prepare"]
        for dataset_id, config in payload["datasets"].items()
        if config["prepare"] != "df"
    }

    code_surface = run_step8_code_surface_audit(payload)

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
        "target_free_validator": target_free_validator_result,
        "warning_regression": warning_regression_result,
        "teaching_metadata": teaching_checks,
        "practice_metadata": {
            "route_step_requirements_checked": practice_routes_checked,
            "interactions_checked": practice_interactions_checked,
            "holdout_and_target_safeguards": True,
        },
        "step8_code_surface": code_surface,
        "gaussian_density_fixture": True,
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
    fixture["df"] = pd.read_csv(ROOT / car_route["dataset"]["file"], sep=car_route["dataset"]["sep"])
    exec(route_code(car_route, "frame"), fixture, fixture)
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
    car_cell_ids = ["frame", "split", "prepare", "model", "baseline", "reference"]
    if "tune" in cell_ids(car_route):
        car_cell_ids.append("tune")
    car_cell_ids.append("diagnose")
    for cell_id in car_cell_ids:
        for _source_name, source in _cell_execution_sources(route_cell(car_route, cell_id), include_optional=cell_id == "diagnose"):
            exec(source, actual, actual)
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
        for source_name, source in _cell_execution_sources(cell, include_optional=True):
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                exec(
                    source,
                    namespace,
                    namespace,
                )
        plt.close("all")
        if cell["id"] == stop_at:
            return namespace
    raise AssertionError(f"Route did not contain requested teaching runtime cell {stop_at!r}.")


def _execute_route_to_cell_with_stdout(payload: dict, route: dict, pd, np, plt, sns, stop_at: str) -> tuple[dict, str]:
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
    captured = io.StringIO()
    for cell in route["cells"]:
        for source_name, source in _cell_execution_sources(cell, include_optional=True):
            with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(io.StringIO()):
                exec(source, namespace, namespace)
        plt.close("all")
        if cell["id"] == stop_at:
            return namespace, captured.getvalue()
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
        diagnostic = diagnostic_python(route)
        forbidden = ("X_test", "y_test", "test_prediction", "test_result")
        if any(token in diagnostic for token in forbidden):
            raise AssertionError(f"Phase 2A diagnostic accesses final-test data: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "diagnose", before_cell)

    simple_route, simple = run("gapminder", "simple", "simple_linear")
    simple_model = simple["fitted_model"]
    simple_interpretation = simple["simple_interpretation"].iloc[0]
    if not np.isclose(float(simple_interpretation["slope"]), float(np.ravel(simple_model.coef_)[0])) or not np.isclose(float(simple_interpretation["intercept"]), float(np.ravel(np.atleast_1d(simple_model.intercept_))[0])):
        raise AssertionError("Simple linear interpretation does not match the fitted slope/intercept.")
    if len(simple["simple_grid"]) < 2 or not np.isclose(simple["simple_grid"][0], simple["X_train"][simple["simple_feature"]].min()) or not np.isclose(simple["simple_grid"][-1], simple["X_train"][simple["simple_feature"]].max()):
        raise AssertionError("Simple linear fitted line does not span the observed training feature range.")
    simple_grid_frame = pd.DataFrame({simple["simple_feature"]: simple["simple_grid"]})
    if not np.allclose(simple["simple_curve"], simple["fitted_pipeline"].predict(simple_grid_frame)):
        raise AssertionError("Simple linear chart evidence is not aligned with the fitted line/OOF rows.")

    polynomial_route, polynomial = run("gapminder", "simple", "polynomial")
    polynomial_model = polynomial["fitted_model"]
    polynomial_feature = polynomial["poly_feature"]
    if polynomial["polynomial_degree"] != polynomial["fitted_pipeline"].named_steps["polynomial"].degree or len(polynomial["poly_grid"]) < 2:
        raise AssertionError("Polynomial interpretation does not report the fitted degree/grid.")
    if not np.isclose(polynomial["poly_grid"][0], polynomial["X_train"][polynomial_feature].min()) or not np.isclose(polynomial["poly_grid"][-1], polynomial["X_train"][polynomial_feature].max()):
        raise AssertionError("Polynomial fitted curve does not span the observed training feature range.")
    polynomial_grid_frame = pd.DataFrame({polynomial_feature: polynomial["poly_grid"]})
    if not np.allclose(polynomial["poly_curve"], polynomial["fitted_pipeline"].predict(polynomial_grid_frame)):
        raise AssertionError("Polynomial fitted curve does not match the fitted pipeline predictions.")
    polynomial_multiple_route, polynomial_multiple = run("wine", "continuous", "polynomial")
    polynomial_step = polynomial_multiple["fitted_pipeline"].named_steps["polynomial"]
    if len(polynomial_multiple["polynomial_names"]) != len(polynomial_multiple["fitted_model"].coef_):
        raise AssertionError("Multiple-input polynomial terms are not aligned with the fitted model coefficients.")
    if list(polynomial_multiple["polynomial_summary"].columns) != ["term", "weight"] or "single 2D fitted curve" not in diagnostic_python(polynomial_multiple_route):
        raise AssertionError("Multiple-input polynomial evidence does not expose a flat term summary or explain its plotting limit.")
    if int(polynomial_multiple["polynomial_degree"]) != int(polynomial_step.degree):
        raise AssertionError("Multiple-input polynomial summary does not report the fitted degree.")

    multiple_route, multiple = run("wine", "continuous", "multiple_linear")
    multiple_model = multiple["fitted_model"]
    multiple_table = multiple["linear_interpretation"]
    if list(multiple_table.columns) != ["feature", "coefficient"]:
        raise AssertionError("Multiple linear interpretation table is missing its teaching columns.")
    if [str(name) for name in multiple_table["feature"]] != [str(name) for name in multiple["prepared_names"]] or not np.allclose(multiple_table["coefficient"].to_numpy(dtype=float), np.ravel(multiple_model.coef_)):
        raise AssertionError("Multiple linear coefficients or feature order do not match the fitted estimator.")
    if "sort_values" in diagnostic_python(multiple_route):
        raise AssertionError("Multiple linear interpretation ranks raw coefficient magnitudes.")

    seoul_multiple_route, seoul_multiple = run("seoul", "continuous", "multiple_linear")
    if seoul_multiple_route["dataset"]["split"] != "time":
        raise AssertionError("Seoul multiple-linear fixture lost its time-series split metadata.")
    seoul_folds = list(seoul_multiple["cv"].split(seoul_multiple["X_train"], seoul_multiple["y_train"]))
    if not all(max(train) < min(validation) for train, validation in seoul_folds):
        raise AssertionError("Seoul Phase 2A diagnostics changed forward-only validation ordering.")

    regression_tree_results = {}
    for dataset_id, scenario_id in (("wine", "continuous"), ("seoul", "continuous")):
        route, namespace = run(dataset_id, scenario_id, "regression_tree")
        fitted = namespace["fitted_model"]
        summary = namespace["tree_summary"]
        by_feature = dict(zip(summary["feature"].astype(str), summary["importance"].astype(float)))
        expected_names = [str(name) for name in namespace["prepared_names"]]
        if set(by_feature) != set(expected_names) or not np.allclose([by_feature[name] for name in expected_names], fitted.feature_importances_):
            raise AssertionError("Regression-tree feature-importance table does not match the fitted estimator.")
        regression_tree_results[dataset_id] = int(len(summary))

    classification_tree_results = {}
    for dataset_id, scenario_id in (("breast", "continuous5"), ("penguins", "all_types")):
        route, namespace = run(dataset_id, scenario_id, "classification_tree")
        fitted = namespace["fitted_model"]
        summary = namespace["tree_summary"]
        by_feature = dict(zip(summary["feature"].astype(str), summary["importance"].astype(float)))
        expected_names = [str(name) for name in namespace["prepared_names"]]
        if set(by_feature) != set(expected_names) or not np.allclose([by_feature[name] for name in expected_names], fitted.feature_importances_):
            raise AssertionError("Classification-tree feature-importance table does not match the fitted estimator.")
        classification_tree_results[dataset_id] = int(len(summary))

    binary_logistic_route, binary_logistic = run("breast", "continuous5", "logistic")
    binary_fitted = binary_logistic["fitted_model"]
    binary_table = binary_logistic["logistic_interpretation"]
    if not np.allclose(binary_logistic["logistic_coefficients"], np.ravel(binary_fitted.coef_)):
        raise AssertionError("Binary logistic interpretation does not match the fitted coefficients.")
    if [str(name) for name in binary_table["feature"]] != [str(name) for name in binary_logistic["prepared_names"]] or not np.allclose(binary_table["relative_weight"], binary_fitted.coef_[0]):
        raise AssertionError("Binary logistic feature labels or relative weights are incorrect.")

    multiclass_route, multiclass = run("penguins", "all_types", "logistic")
    multiclass_fitted = multiclass["fitted_model"]
    multiclass_table = multiclass["logistic_interpretation"]
    if [str(name) for name in multiclass_table["feature"]] != [str(name) for name in multiclass["prepared_names"]] or not np.allclose(multiclass["logistic_coefficients"], multiclass_fitted.coef_[0]):
        raise AssertionError("Multiclass logistic feature labels or weights are incorrect.")
    if "X_test" in diagnostic_python(binary_logistic_route) or "X_test" in diagnostic_python(multiclass_route):
        raise AssertionError("Logistic interpretation references the sealed test set.")

    knn_route, knn = run("breast", "continuous5", "knn_cls")
    knn_positions = np.asarray(knn["knn_positions"])[0]
    knn_distances = np.asarray(knn["knn_distances"])[0]
    knn_fit_rows = np.asarray(knn["knn_fit_rows"])
    knn_validation_rows = np.asarray(knn["knn_validation_rows"])
    knn_training_rows = knn_fit_rows[knn_positions]
    if int(knn_validation_rows[0]) in set(int(index) for index in knn_fit_rows) or len(knn_training_rows) != knn["knn_model"].n_neighbors or not np.all(np.diff(knn_distances) >= -1e-12):
        raise AssertionError("KNN neighbour evidence is not the fitted fold's ordered neighbour set.")
    table = knn["knn_neighbor_table"]
    if not np.array_equal(table["training_row"].to_numpy(), knn_training_rows) or not np.array_equal(table["neighbor_class"].to_numpy(), knn["y_train"].iloc[knn_training_rows].to_numpy()) or not _same_value(table["prediction"].iloc[0], knn["knn_pipeline"].predict(knn["knn_row"])[0], np):
        raise AssertionError("KNN neighbour labels or prediction do not match the fold-fitted model.")

    def force_distance_weights(namespace, cell):
        if cell["id"] == "diagnose":
            namespace["chosen_pipeline"] = namespace["chosen_pipeline"].set_params(model__n_neighbors=3, model__weights="distance")

    weighted_route, weighted = run("breast", "continuous5", "knn_cls", force_distance_weights)
    if weighted["knn_model"].weights != "distance" or weighted["knn_model"].n_neighbors != 3:
        raise AssertionError("The KNN distance-weighted experiment did not reach the fitted estimator.")
    if "X_test" in diagnostic_python(knn_route) or "X_test" in diagnostic_python(weighted_route):
        raise AssertionError("KNN interpretation references the sealed test set.")

    car_route, car = run("car", "categorical", "one_r")
    car_fitted = car["fitted_model"]
    selected_feature = car["feature_names"][car_fitted.best_feature_]
    car_rules = car["one_r_rules"]
    original_values = car["X_train"][selected_feature].astype(str)
    if set(car_rules["interval"]) != set(original_values.unique()) or int(car_rules["training_rows"].sum()) != len(original_values):
        raise AssertionError("Car One-R rules do not preserve the selected feature's exact categories.")
    if any(int(row.training_rows) != int((original_values == row.interval).sum()) for row in car_rules.itertuples()):
        raise AssertionError("Car One-R training-row counts do not match original category membership.")

    continuous_one_r_route, continuous_one_r = run("breast", "continuous5", "one_r")
    if continuous_one_r["fitted_model"].edges_ is None or not all(str(interval).startswith("[") for interval in continuous_one_r["one_r_rules"]["interval"]):
        raise AssertionError("Continuous One-R lost its numeric interval rules.")

    return {
        "simple_line_matches_fitted_model": True,
        "polynomial_curve_matches_fitted_model": True,
        "polynomial_flat_term_summary": True,
        "multiple_coefficients_match_fitted_model": True,
        "seoul_forward_cv_unchanged": True,
        "regression_tree_paths": regression_tree_results,
        "classification_tree_paths": classification_tree_results,
        "binary_logistic_class_mapping": True,
        "multiclass_logistic_labels": True,
        "knn_oof_self_neighbour_guard": True,
        "knn_weighted_vote_fixture": True,
        "car_one_r_rules": True,
        "continuous_one_r_intervals": True,
    }


def run_neural_network_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check that the MLP teaching evidence is fitted, held out, and unit-safe."""

    def run(dataset_id, scenario_id, model_id):
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        diagnostic = diagnostic_python(route)
        forbidden = ("X_test", "y_test", "test_prediction", "test_result")
        if any(token in diagnostic for token in forbidden):
            raise AssertionError(f"Neural Network Step 8 accesses final-test data: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "diagnose")

    def assert_common(route, namespace, model_id):
        diagnostic = diagnostic_python(route)
        forbidden = ("coefs_", "intercept_", "np.matmul", "np.dot")
        if any(token in diagnostic for token in forbidden):
            raise AssertionError(f"Neural Network Step 8 exposes raw-weight or manual-forward plumbing: {route}")
        fitted_pipeline = namespace["fitted_pipeline"]
        fitted = namespace["fitted_model"]
        inner = fitted.regressor_ if model_id == "mlp_reg" else fitted
        if namespace["mlp_model"] is not inner:
            raise AssertionError(f"{model_id} loss evidence is not from the named fitted estimator.")
        loss_curve = np.asarray(namespace["mlp_loss_curve"], dtype=float)
        if not np.all(np.isfinite(loss_curve)):
            raise AssertionError(f"{model_id} loss curve contains non-finite values.")
        if len(loss_curve) != int(inner.n_iter_):
            raise AssertionError(f"{model_id} loss curve length does not match n_iter_.")
        if not np.allclose(loss_curve, np.asarray(inner.loss_curve_, dtype=float)):
            raise AssertionError(f"{model_id} teaching loss curve does not come from the fitted estimator.")
        position = int(namespace["interpret_validation_position"])
        validation = set(int(index) for index in np.asarray(namespace["interpret_validation_rows"]).tolist())
        fit = set(int(index) for index in np.asarray(namespace["interpret_fit_rows"]).tolist())
        if position not in validation or position in fit:
            raise AssertionError(f"{model_id} example row was not held out from its fitted fold.")
        if namespace["fitted_pipeline"].predict(namespace["interpret_row"])[0] != namespace["interpret_prediction"]:
            raise AssertionError(f"{model_id} held-out prediction does not match the fitted fold pipeline.")
        return fitted_pipeline, fitted, inner, position, fit

    classification_route, classification = run("breast", "continuous5", "mlp_cls")
    classification_pipeline, classification_fitted, classification_inner, _, _ = assert_common(classification_route, classification, "mlp_cls")
    if not classification_inner.early_stopping:
        raise AssertionError("Ordinary MLP classification unexpectedly disabled built-in early stopping.")
    classification_build_copy = " ".join(f'{item["label"]} {item["text"]}' for item in next(cell for cell in classification_route["cells"] if cell["id"] == "model")["concepts"])
    if "early stopping" not in classification_build_copy.lower() and "early_stopping" not in classification_build_copy.lower():
        raise AssertionError("MLP classification build teaching does not explain early stopping.")
    probabilities = np.asarray(classification_pipeline.predict_proba(classification["interpret_row"])[0], dtype=float)
    if not np.isclose(float(probabilities.sum()), 1.0):
        raise AssertionError("MLP classification probabilities do not sum to one.")
    if not np.allclose(probabilities, np.asarray(ast.literal_eval(classification["mlp_summary"].iloc[0]["held_out_probabilities"]), dtype=float)):
        raise AssertionError("MLP classification probabilities do not match the fitted OOF pipeline.")
    summary_row = classification["mlp_summary"].iloc[0]
    if not _same_value(summary_row["held_out_actual"], classification["interpret_actual"], np) or not _same_value(summary_row["held_out_prediction"], classification["interpret_prediction"], np):
        raise AssertionError("MLP classification held-out summary is not aligned with the fitted fold row.")
    if str(summary_row["hidden_layer_sizes"]) != str(classification_inner.hidden_layer_sizes):
        raise AssertionError("MLP classification summary does not report the fitted hidden-layer size.")

    mixed_route, mixed = run("penguins", "all_types", "mlp_cls")
    assert_common(mixed_route, mixed, "mlp_cls")
    if int(mixed["mlp_model"].n_features_in_) <= len(mixed["feature_names"]):
        raise AssertionError("Mixed-feature MLP did not expose the expanded prepared input count.")

    regression_route, regression = run("wine", "continuous", "mlp_reg")
    regression_pipeline, _, regression_inner, regression_position, _ = assert_common(regression_route, regression, "mlp_reg")
    if not regression_inner.early_stopping:
        raise AssertionError("Ordinary MLP regression unexpectedly disabled built-in early stopping.")
    regression_build_copy = " ".join(f'{item["label"]} {item["text"]}' for item in next(cell for cell in regression_route["cells"] if cell["id"] == "model")["concepts"])
    if "target scaling" not in regression_build_copy.lower() and "scales y" not in regression_build_copy.lower():
        raise AssertionError("MLP regression build teaching does not explain target scaling.")
    expected_prediction = float(regression_pipeline.predict(regression["interpret_row"])[0])
    if not np.isclose(float(regression["interpret_prediction"]), expected_prediction):
        raise AssertionError("MLP regression OOF prediction does not match the fitted pipeline.")
    expected_actual = float(regression["y_train"].iloc[regression_position])
    if not np.isclose(float(regression["interpret_actual"]), expected_actual):
        raise AssertionError("MLP regression actual value is not in original target units.")
    summary_row = regression["mlp_summary"].iloc[0]
    if not np.isclose(float(summary_row["absolute_error_original_units"]), abs(expected_actual - expected_prediction)):
        raise AssertionError("MLP regression absolute error is incorrect.")
    if list(regression["mlp_summary"].columns) != [
        "held_out_actual",
        "held_out_prediction_original_units",
        "hidden_layer_sizes",
        "iterations",
        "absolute_error_original_units",
    ]:
        raise AssertionError("MLP regression prediction story does not identify original target units.")
    if not np.isclose(float(summary_row["held_out_prediction_original_units"]), expected_prediction):
        raise AssertionError("TransformedTargetRegressor conversion does not match the public pipeline prediction.")
    # The random wine split deliberately does not promise temporal ordering;
    # chronology is asserted separately for the Seoul TimeSeriesSplit route.

    seoul_route, seoul = run("seoul", "continuous", "mlp_reg")
    _, seoul_pipeline, seoul_inner, seoul_position, seoul_fit = assert_common(seoul_route, seoul, "mlp_reg")
    if seoul_inner.early_stopping:
        raise AssertionError("Seoul MLP regression still enables sklearn's non-time-aware built-in early stopping.")
    if "early_stopping=False" not in route_code(seoul_route, "model"):
        raise AssertionError("Seoul MLP regression model code does not disable built-in early stopping.")
    seoul_build_copy = " ".join(
        f'{item["label"]} {item["text"]}'
        for item in next(cell for cell in seoul_route["cells"] if cell["id"] == "model")["concepts"]
    ).lower()
    for token in ("disabled", "not time-aware", "outer timeseriessplit", "normal convergence criterion"):
        if token not in seoul_build_copy:
            raise AssertionError(f"Seoul MLP teaching does not explain route-specific early stopping: {token}")
    if not np.all(int(index) < seoul_position for index in seoul_fit):
        raise AssertionError("Seoul MLP regression OOF row is not after its chronological fitting rows.")
    if not np.isfinite(float(seoul_pipeline.predict(seoul["interpret_row"])[0])):
        raise AssertionError("Seoul MLP regression held-out prediction is not finite.")
    if "last validation window" not in diagnostic_python(seoul_route).lower():
        raise AssertionError("Seoul MLP regression did not retain its forward-only diagnostic window.")

    return {
        "classification_oof_and_probabilities": True,
        "mixed_feature_classification": True,
        "regression_oof_original_units": True,
        "transformed_target_fidelity": True,
        "loss_curve_fidelity": True,
        "named_estimator_and_summary_fidelity": True,
        "early_stopping_concept": True,
        "seoul_forward_oof": True,
    }


def run_unsupervised_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check target-free clustering, neutral choices, and aligned evidence."""

    def run(dataset_id: str, scenario_id: str, model_id: str) -> tuple[dict, dict]:
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        code = "\n".join(cell["code"] for cell in route["cells"])
        target = route["dataset"]["target"]
        if re.search(rf"['\"]{re.escape(target)}['\"]", code):
            raise AssertionError(f"{model_id} runtime route references its target column: {route}")
        stop_at = "visualise"
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, stop_at)

    kmeans_route, kmeans = run("breast", "continuous5", "kmeans")
    candidate_scores = kmeans["candidate_scores"]
    if list(candidate_scores.columns) != ["k", "inertia", "silhouette"] or not np.isfinite(candidate_scores[["inertia", "silhouette"]].to_numpy(dtype=float)).all():
        raise AssertionError("K-Means candidate evidence is missing or non-finite.")
    if not ((candidate_scores["silhouette"] >= -1).all() and (candidate_scores["silhouette"] <= 1).all()):
        raise AssertionError("K-Means silhouette evidence is outside its valid range.")
    expected_k = min(3, int(kmeans["max_k"]))
    if int(kmeans["selected_k"]) != expected_k:
        raise AssertionError("K-Means selected_k is not the neutral runnable default.")
    if len(kmeans["clusters"]) != len(kmeans["X_scaled"]) or int(kmeans["selected_k"]) != len(np.unique(kmeans["clusters"])):
        raise AssertionError("K-Means labels do not represent exactly one cluster for every row.")
    profile = kmeans["cluster_means"]
    if list(profile.columns)[0] != "cluster" or not set(profile["cluster"].astype(int)).issuperset(set(np.unique(kmeans["clusters"]).astype(int))):
        raise AssertionError("K-Means original-unit profiles are not aligned with fitted cluster IDs.")
    expected_profile = kmeans["clustered_data"].groupby("cluster")[kmeans["feature_names"]].mean().reset_index()
    expected_profile = expected_profile.sort_values("cluster").reset_index(drop=True)
    actual_profile = profile.sort_values("cluster").reset_index(drop=True)
    if not np.allclose(actual_profile[kmeans["feature_names"]].to_numpy(dtype=float), expected_profile[kmeans["feature_names"]].to_numpy(dtype=float), atol=0.01):
        raise AssertionError("K-Means profile values do not match the clustered rows in original units.")
    if "silhouette_suggestion" in kmeans or "silhouette_suggestion" in route_code(kmeans_route, "compare"):
        raise AssertionError("K-Means still makes an automatic best-k suggestion.")
    if "no single score makes that decision automatically" not in "\n".join(cell["code"] for cell in kmeans_route["cells"]).lower():
        raise AssertionError("K-Means route does not explain that the learner chooses k.")

    hierarchical_route, hierarchical = run("breast", "continuous5", "hierarchical")
    sample = hierarchical["X_sample"]
    sample_index = np.asarray(sample.index)
    if len(sample_index) != len(np.unique(sample_index)) or len(sample_index) != int(hierarchical["sample_size"]):
        raise AssertionError("Hierarchical sample is not unique or does not respect its declared size.")
    if hierarchical["hierarchy"].shape != (len(sample_index) - 1, 4):
        raise AssertionError("Hierarchical linkage matrix shape is inconsistent with the sampled rows.")
    if list(hierarchical["candidate_scores"].columns) != ["clusters", "silhouette"] or not np.isfinite(hierarchical["candidate_scores"]["silhouette"].to_numpy(dtype=float)).all():
        raise AssertionError("Hierarchical candidate evidence is missing or non-finite.")
    expected_hierarchical_k = min(3, int(hierarchical["max_k"]))
    if int(hierarchical["selected_k"]) != expected_hierarchical_k:
        raise AssertionError("Hierarchical selected_k is not the neutral runnable default.")
    if len(hierarchical["clusters"]) != len(sample_index) or int(hierarchical["selected_k"]) != len(np.unique(hierarchical["clusters"])):
        raise AssertionError("Hierarchical labels do not represent exactly one cluster for every sampled row.")
    profile = hierarchical["cluster_profile"]
    if set(profile.index.astype(int)) != set(np.unique(hierarchical["clusters"]).astype(int)):
        raise AssertionError("Hierarchical cluster profiles are not aligned with sampled cluster IDs.")
    if "silhouette_suggestion" in hierarchical or "silhouette_suggestion" in route_code(hierarchical_route, "compare"):
        raise AssertionError("Hierarchical clustering still makes an automatic best-k suggestion.")
    _, hierarchical_repeat = run("breast", "continuous5", "hierarchical")
    if not np.array_equal(sample_index, np.asarray(hierarchical_repeat["X_sample"].index)):
        raise AssertionError("Hierarchical reproducible sampling changed between identical runs.")

    wine_route, wine = run("wine", "continuous", "hierarchical")
    if re.search(r"['\"]quality['\"]", "\n".join(cell["code"] for cell in wine_route["cells"])):
        raise AssertionError("Wine hierarchical discovery code consumed the numeric reference target.")
    if not len(wine["X_sample"]):
        raise AssertionError("Wine hierarchical route did not retain its sampled analysis rows.")

    return {
        "kmeans_candidate_evidence": True,
        "kmeans_neutral_selection": True,
        "kmeans_labels_and_profiles": True,
        "kmeans_original_unit_profiles": True,
        "kmeans_no_automatic_suggestion": True,
        "hierarchical_sample_alignment": True,
        "hierarchical_neutral_selection": True,
        "hierarchical_profiles": True,
        "hierarchical_reproducible_sample": True,
        "target_free_discovery": True,
    }

def run_pca_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check PCA variance, loading, score, and post-fit reference-label fidelity."""

    def run(dataset_id: str, scenario_id: str) -> tuple[dict, dict]:
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, "pca")
        code_by_id = {cell["id"]: cell["code"] for cell in route["cells"]}
        target = route["dataset"]["target"]
        pre_project_code = "\n".join(code_by_id[step_id] for step_id in ("frame", "explore", "prepare", "variance", "select", "loadings"))
        if re.search(rf"['\"]{re.escape(target)}['\"]", pre_project_code):
            raise AssertionError(f"PCA runtime accessed the reference target before fitting: {route}")
        project_code = code_by_id["project"]
        optional_reference = route_cell(route, "project").get("optionalCode", "")
        if target not in optional_reference or "reference_label" not in optional_reference:
            raise AssertionError("PCA optional reference view does not identify the target label.")
        if "projection" not in project_code or "component_scores" not in project_code:
            raise AssertionError("PCA project code does not reuse the saved component scores.")
        forbidden = ("X_test", "y_test", "test_prediction", "test_result", "y_train", "cv_scores")
        if any(token in "\n".join(code_by_id.values()) for token in forbidden):
            raise AssertionError(f"PCA route introduced supervised evaluation plumbing: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "project")

    route, namespace = run("breast", "continuous5")
    X_scaled = np.asarray(namespace["X_scaled"], dtype=float)
    pca = namespace["pca"]
    ratios = np.asarray(namespace["explained_variance_ratio"], dtype=float)
    cumulative = np.asarray(namespace["cumulative_explained_variance"], dtype=float)
    scores = np.asarray(namespace["component_scores"], dtype=float)
    if X_scaled.shape[0] != len(namespace["X"]) or not np.isfinite(X_scaled).all():
        raise AssertionError("PCA preprocessing changed row alignment or produced non-finite values.")
    if scores.shape != (len(namespace["X"]), pca.n_components_) or not np.isfinite(ratios).all() or (ratios < 0).any():
        raise AssertionError("PCA fitted-component or explained-variance evidence is invalid.")
    if not np.all(np.diff(cumulative) >= -1e-12) or not np.isclose(cumulative[-1], 1.0, atol=1e-6):
        raise AssertionError("PCA cumulative explained variance is not monotonic or approximately complete.")
    variance_table = namespace["variance_table"]
    if list(variance_table.columns) != ["component", "explained_variance_ratio", "cumulative_explained_variance"]:
        raise AssertionError("PCA variance table does not use precise ratio terminology.")
    if not np.allclose(variance_table["explained_variance_ratio"].to_numpy(dtype=float), ratios) or not np.allclose(variance_table["cumulative_explained_variance"].to_numpy(dtype=float), cumulative):
        raise AssertionError("PCA variance table does not match the fitted estimator.")
    variance_target = float(namespace["variance_target"])
    expected_components = int(np.flatnonzero(cumulative >= variance_target)[0] + 1)
    if not np.isclose(variance_target, 0.90) or int(namespace["components_for_target"]) != expected_components:
        raise AssertionError("PCA component selection did not choose the first count qualifying for the active variance target.")
    if namespace["X_reduced"].shape != (len(namespace["X"]), expected_components) or float(namespace["variance_retained"]) < variance_target:
        raise AssertionError("PCA reduced representation does not retain the selected variance.")

    loadings = namespace["loadings"]
    expected_loadings = pd.DataFrame(np.asarray(pca.components_)[:2].T, index=namespace["feature_names"], columns=["PC1", "PC2"])
    expected_loadings.index.name = "feature"
    if not np.allclose(loadings.to_numpy(dtype=float), expected_loadings.to_numpy(dtype=float)) or list(loadings.index.astype(str)) != list(expected_loadings.index.astype(str)):
        raise AssertionError("PCA loading matrix does not equal the fitted component directions.")
    if list(namespace["loading_view"].columns) != ["PC1", "PC2"] or not np.allclose(namespace["loading_view"].to_numpy(dtype=float), expected_loadings.to_numpy(dtype=float)):
        raise AssertionError("PCA loading view does not preserve the named PC1/PC2 table.")

    expected_scores = pca.transform(X_scaled)
    if not np.allclose(scores, expected_scores) or not np.allclose(namespace["projection"], expected_scores[:, :2]):
        raise AssertionError("PCA row scores or PC1/PC2 projection do not match the fitted PCA.")
    if not np.isclose(float(namespace["pc1_variance"]), ratios[0]) or not np.isclose(float(namespace["pc2_variance"]), ratios[1]):
        raise AssertionError("PCA projection axis labels do not use fitted explained-variance ratios.")
    plot_df = namespace["plot_df"]
    if not np.allclose(plot_df[["PC1", "PC2"]].to_numpy(dtype=float), expected_scores[:, :2]):
        raise AssertionError("PCA plotted coordinates do not match the fitted scores.")
    frame_name = "df" if route["dataset"]["prepare"] == "df" else "model_df"
    reference_frame = namespace[frame_name]
    reference_plot = namespace["plot_df_with_reference"]
    if not np.array_equal(reference_plot[["PC1", "PC2"]].to_numpy(dtype=float), expected_scores[:, :2]):
        raise AssertionError("PCA reference view changed the fitted coordinates.")
    if not np.array_equal(reference_plot["reference"].to_numpy().astype(str), reference_frame[route["dataset"]["target"]].to_numpy().astype(str)):
        raise AssertionError("PCA interpretation reference labels are not aligned after fitting.")

    high_route, high_namespace = run("breast", "continuous30")
    high_explore = _execute_route_to_cell(payload, high_route, pd, np, plt, sns, "explore")
    high_summary = high_explore["pair_summary"]
    if list(high_summary.columns) != ["feature_a", "feature_b", "correlation", "absolute_correlation"] or len(high_summary) != 1:
        raise AssertionError("Breast Cancer continuous30 PCA did not produce one compact named pair summary.")
    if high_summary.iloc[0]["feature_a"] == high_summary.iloc[0]["feature_b"] or not np.isfinite(high_summary[["correlation", "absolute_correlation"]].to_numpy(dtype=float)).all():
        raise AssertionError("PCA named redundancy pair is invalid.")
    high_optional = route_cell(high_route, "explore").get("optionalCode", "")
    if "combinations" not in high_optional or "pair_table" not in high_optional or "sns.heatmap" in route_code(high_route, "explore"):
        raise AssertionError("Breast Cancer continuous30 PCA does not keep compact primary and optional pair evidence.")
    if int(high_namespace["pca"].n_components_) != 30 or len(high_namespace["loadings"]) != 30:
        raise AssertionError("Breast Cancer continuous30 PCA did not use and label all 30 selected inputs.")

    penguins_route, penguins = run("penguins", "continuous")
    penguins_frame = penguins["df"] if penguins_route["dataset"]["prepare"] == "df" else penguins["model_df"]
    if not np.array_equal(penguins["plot_df_with_reference"]["reference"].to_numpy().astype(str), penguins_frame["species"].to_numpy().astype(str)):
        raise AssertionError("Penguins PCA reference colouring is not aligned after fitting.")
    wine_route, wine = run("wine", "continuous")
    if not np.array_equal(wine["plot_df_with_reference"]["reference"].to_numpy().astype(str), wine["model_df"]["quality"].to_numpy().astype(str)):
        raise AssertionError("Wine PCA numeric reference colouring is not aligned after fitting.")

    return {
        "preprocessing_alignment": True,
        "variance_fidelity": True,
        "ninety_percent_selection": True,
        "loading_fidelity": True,
        "score_projection_fidelity": True,
        "post_fit_reference_labels": True,
        "large_feature_redundancy_summary": True,
        "no_target_based_pca_selection": True,
    }

def run_pca_practice_experiment_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Ensure the PCA practice mutation changes one active criterion everywhere it is used."""

    route = _route_for_teaching_runtime(payload, "breast", "continuous5", "pca")
    select_cell = next(cell for cell in route["cells"] if cell["id"] == "select")
    experiment = select_cell["practice"]["experiment"]
    if experiment["find"] != "variance_target = 0.90" or experiment["replace"] != "variance_target = 0.80":
        raise AssertionError("PCA Practice experiment does not edit the active variance target.")
    edited_cells = []
    for cell in route["cells"]:
        edited = dict(cell)
        if cell["id"] == "select":
            edited["code"] = cell["code"].replace(experiment["find"], experiment["replace"])
        edited_cells.append(edited)
    edited_route = dict(route)
    edited_route["cells"] = edited_cells
    namespace, output = _execute_route_to_cell_with_stdout(payload, edited_route, pd, np, plt, sns, "project")
    cumulative = np.asarray(namespace["cumulative_explained_variance"], dtype=float)
    expected_components = int(np.flatnonzero(cumulative >= 0.80)[0] + 1)
    if not np.isclose(float(namespace["variance_target"]), 0.80):
        raise AssertionError("PCA Practice mutation did not set variance_target to 0.80 at runtime.")
    if int(namespace["components_for_target"]) != expected_components:
        raise AssertionError("PCA Practice mutation did not select the first component count reaching 80%.")
    if float(namespace["variance_retained"]) < 0.80 or namespace["X_reduced"].shape[1] != expected_components:
        raise AssertionError("PCA Practice mutation produced an incoherent reduced representation.")
    if "80% target is a chosen rule of thumb" not in output or "80% criterion" not in output:
        raise AssertionError("PCA Practice mutation did not update learner-facing criterion copy to 80%.")
    if "90%" in output:
        raise AssertionError("PCA Practice mutation left stale 90% criterion narration in the edited run.")

    normal_namespace, normal_output = _execute_route_to_cell_with_stdout(payload, route, pd, np, plt, sns, "project")
    if not np.isclose(float(normal_namespace["variance_target"]), 0.90) or "90% criterion" not in normal_output:
        raise AssertionError("The unmodified Guided PCA route did not retain its 90% default and narration.")

    return {
        "edited_target": 0.80,
        "edited_component_count": expected_components,
        "edited_copy_consistent": True,
        "guided_default": 0.90,
    }


def run_phase2b1_model_runtime_regression(payload: dict, pd, np, plt, sns) -> dict:
    """Check current named SVM, discriminant, and Naive Bayes evidence."""

    def run(dataset_id, scenario_id, model_id):
        route = _route_for_teaching_runtime(payload, dataset_id, scenario_id, model_id)
        primary = diagnostic_python(route, include_hidden=False)
        if any(token in primary for token in ("X_test", "y_test", "test_prediction", "test_result")):
            raise AssertionError(f"Phase 2B-1 primary diagnostic accesses final-test data: {route}")
        return route, _execute_route_to_cell(payload, route, pd, np, plt, sns, "diagnose")

    def assert_excluded(namespace, model_id):
        fit_rows = set(int(index) for index in np.asarray(namespace["interpret_fit_rows"]).tolist())
        validation_rows = set(int(index) for index in np.asarray(namespace["interpret_validation_rows"]).tolist())
        position = int(namespace["interpret_validation_position"])
        if position not in validation_rows or position in fit_rows:
            raise AssertionError(f"{model_id} explanation row was not held out from its fitted fold.")
        if not _same_value(namespace["fitted_pipeline"].predict(namespace["interpret_row"])[0], namespace["interpret_prediction"], np):
            raise AssertionError(f"{model_id} held-out prediction does not match the fitted pipeline.")
        return namespace["fitted_pipeline"], namespace["fitted_model"], position, fit_rows

    def teaching(route):
        return route_cell(route, "diagnose").get("modelTeaching") or {}

    svm_route, svm = run("breast", "continuous5", "svm_cls")
    svm_pipeline, svm_fitted, _, _ = assert_excluded(svm, "SVM")
    if not np.allclose(np.asarray(svm["support_vectors"]), np.asarray(svm_fitted.support_vectors_)):
        raise AssertionError("SVM support-vector coordinates do not match the fitted estimator.")
    svm_summary = svm["svm_summary"].iloc[0]
    support_counts = svm_summary["support_vectors_by_class"]
    if isinstance(support_counts, str):
        support_counts = ast.literal_eval(support_counts)
    if not np.array_equal(np.asarray(support_counts, dtype=int), np.asarray(svm_fitted.n_support_, dtype=int)):
        raise AssertionError("SVM support-vector counts do not match the fitted estimator.")
    if int(svm_summary["support_vectors"]) != len(svm_fitted.support_vectors_):
        raise AssertionError("SVM support-vector total is not derived from the fitted estimator.")
    if not np.allclose(np.asarray(svm["svm_decision_values"], dtype=float), np.asarray(svm_pipeline.decision_function(svm["interpret_row"]), dtype=float)):
        raise AssertionError("SVM held-out decision evidence does not match the fitted pipeline.")
    if len(svm_fitted.classes_) != 2 and len(np.asarray(svm["svm_decision_values"]).ravel()) != len(svm_fitted.classes_) * (len(svm_fitted.classes_) - 1) // 2:
        raise AssertionError("Multiclass SVM decision evidence is not class-pair aligned.")
    if "support vectors" not in str(teaching(svm_route).get("see", "")).lower():
        raise AssertionError("SVM model teaching does not identify support vectors.")
    if "decision region" in str(teaching(svm_route).get("see", "")).lower():
        raise AssertionError("SVM teaching promises a decision-region view that the optional cell does not emit.")

    multiclass_svm_route, multiclass_svm = run("penguins", "continuous", "svm_cls")
    _, multiclass_svm_fitted, _, _ = assert_excluded(multiclass_svm, "multiclass SVM")
    if len(multiclass_svm_fitted.classes_) < 3:
        raise AssertionError("Penguins SVM fixture is not multiclass.")
    multiclass_decisions = np.asarray(multiclass_svm["svm_decision_values"]).ravel()
    if len(multiclass_decisions) != len(multiclass_svm_fitted.classes_) * (len(multiclass_svm_fitted.classes_) - 1) // 2:
        raise AssertionError("Multiclass SVM decisions are not one value per class pair.")
    if "no single universal boundary" not in str(teaching(multiclass_svm_route).get("see", "")).lower():
        raise AssertionError("Multiclass SVM teaching is missing the multiple-boundary explanation.")

    lda_route, lda = run("breast", "continuous5", "lda")
    lda_pipeline, lda_fitted, _, _ = assert_excluded(lda, "LDA")
    lda_centres = lda["class_centres"]
    if not np.array_equal(np.asarray(lda_centres["class"]), np.asarray(lda_fitted.classes_)):
        raise AssertionError("LDA class-centre labels are not aligned with fitted classes.")
    if not np.allclose(lda_centres.drop(columns=["class"]).to_numpy(dtype=float), lda_fitted.means_):
        raise AssertionError("LDA class centres do not match the fitted estimator.")
    lda_table = lda["probability_table"]
    if not np.array_equal(np.asarray(lda_table["class"]), np.asarray(lda_fitted.classes_)):
        raise AssertionError("LDA probability rows are not class-aligned.")
    if not np.allclose(lda_table["posterior_probability"].to_numpy(dtype=float), lda_pipeline.predict_proba(lda["interpret_row"])[0]):
        raise AssertionError("LDA posterior probabilities do not match the fitted pipeline.")
    if not all(_same_value(value, lda["interpret_actual"], np) for value in lda_table["held_out_actual"]) or not all(_same_value(value, lda["interpret_prediction"], np) for value in lda_table["held_out_prediction"]):
        raise AssertionError("LDA probability table does not identify its excluded validation row.")
    if "shared spread/shape" not in str(teaching(lda_route).get("read", "")).lower():
        raise AssertionError("LDA teaching does not explain its shared class shape.")

    multiclass_lda_route, multiclass_lda = run("penguins", "continuous", "lda")
    _, multiclass_lda_fitted, _, _ = assert_excluded(multiclass_lda, "multiclass LDA")
    if len(multiclass_lda_fitted.classes_) < 3 or len(multiclass_lda["probability_table"]) != len(multiclass_lda_fitted.classes_):
        raise AssertionError("Multiclass LDA probability evidence is not class-aligned.")

    qda_route, qda = run("breast", "continuous5", "qda")
    qda_pipeline, qda_fitted, _, _ = assert_excluded(qda, "QDA")
    if not np.isclose(float(qda_fitted.reg_param), 0.1):
        raise AssertionError("QDA regularisation evidence does not match the configured estimator.")
    if not np.array_equal(np.asarray(qda["class_centres"]["class"]), np.asarray(qda_fitted.classes_)) or not np.allclose(qda["class_centres"].drop(columns=["class"]).to_numpy(dtype=float), qda_fitted.means_):
        raise AssertionError("QDA class centres do not match the fitted estimator.")
    if not np.allclose(qda["probability_table"]["posterior_probability"].to_numpy(dtype=float), qda_pipeline.predict_proba(qda["interpret_row"])[0]):
        raise AssertionError("QDA posterior probabilities do not match the fitted pipeline.")
    qda_teaching = teaching(qda_route)
    if any(token not in f"{qda_teaching.get('read', '')} {qda_teaching.get('see', '')}".lower() for token in ("per-feature spread", "covariance/shape", "class-specific")):
        raise AssertionError("QDA teaching does not explain separate class shapes.")
    if "decision region" in str(qda_teaching.get("see", "")).lower():
        raise AssertionError("QDA teaching promises a decision-region view that the optional cell does not emit.")

    multiclass_qda_route, multiclass_qda = run("penguins", "continuous", "qda")
    _, multiclass_qda_fitted, _, _ = assert_excluded(multiclass_qda, "multiclass QDA")
    if len(multiclass_qda_fitted.classes_) < 3 or len(multiclass_qda["probability_table"]) != len(multiclass_qda_fitted.classes_):
        raise AssertionError("Multiclass QDA probability evidence is not class-aligned.")

    def assert_nb_common(namespace, name):
        pipeline, fitted, _, _ = assert_excluded(namespace, name)
        posterior = namespace["nb_posterior"]
        if not np.array_equal(np.asarray(posterior["class"]), np.asarray(fitted.classes_)):
            raise AssertionError(f"{name} posterior rows are not class-aligned.")
        if not np.allclose(posterior["posterior_probability"].to_numpy(dtype=float), pipeline.predict_proba(namespace["first_row"])[0]):
            raise AssertionError(f"{name} posterior probabilities do not match the fitted pipeline.")
        if not np.allclose(posterior["prior_probability"].to_numpy(dtype=float), np.asarray(namespace["prior_values"], dtype=float)):
            raise AssertionError(f"{name} prior probabilities do not match the fitted estimator.")
        if not all(_same_value(value, namespace["interpret_actual"], np) for value in posterior["held_out_actual"]) or not all(_same_value(value, namespace["nb_prediction"], np) for value in posterior["held_out_prediction"]):
            raise AssertionError(f"{name} posterior table does not identify the displayed row.")
        return pipeline, fitted

    gaussian_route, gaussian = run("breast", "continuous5", "naive_bayes")
    gaussian_pipeline, gaussian_fitted = assert_nb_common(gaussian, "Gaussian Naive Bayes")
    gaussian_table = gaussian["nb_quantity_evidence"]
    if list(gaussian_table.columns) != ["class", "feature", "observed_value", "quantity", "density"] or not gaussian_table["quantity"].eq("Class-conditional density").all():
        raise AssertionError("Gaussian Naive Bayes evidence does not label densities precisely.")
    if not np.allclose(gaussian["nb_gaussian_means"].drop(columns=["class"]).to_numpy(dtype=float), gaussian_fitted.theta_) or not np.allclose(gaussian["nb_gaussian_stds"].drop(columns=["class"]).to_numpy(dtype=float), np.sqrt(gaussian_fitted.var_)):
        raise AssertionError("Gaussian Naive Bayes means or spreads do not match the fitted estimator.")
    labels = [str(name) for name in gaussian["nb_feature_labels"]]
    classes = list(gaussian_fitted.classes_)
    for _, row in gaussian_table.head(min(6, len(gaussian_table))).iterrows():
        ci = classes.index(row["class"])
        fi = labels.index(str(row["feature"]))
        observed = float(row["observed_value"])
        variance = max(float(gaussian_fitted.var_[ci, fi]), np.finfo(float).eps)
        expected_density = np.exp(-0.5 * ((observed - gaussian_fitted.theta_[ci, fi]) ** 2) / variance) / np.sqrt(2 * np.pi * variance)
        if not np.isclose(float(row["density"]), expected_density):
            raise AssertionError("Gaussian Naive Bayes density does not match fitted means and variance.")
    density_fixture = payload["phase2bGaussianDensityFixture"]
    fixture_density = np.exp(-0.5 * ((density_fixture["observed"] - density_fixture["mean"]) ** 2) / density_fixture["variance"]) / np.sqrt(2 * np.pi * density_fixture["variance"])
    if not np.isclose(fixture_density, density_fixture["expected_density"]) or fixture_density <= 1:
        raise AssertionError("The deterministic Gaussian density fixture does not demonstrate a density above 1.")
    gaussian_teaching = teaching(gaussian_route)
    gaussian_watch_out = str(gaussian_teaching.get("watchOut", "")).lower()
    if "feature independence" not in gaussian_watch_out or "simplifying assumption" not in gaussian_watch_out:
        raise AssertionError("Naive Bayes independence teaching is missing from the diagnostic.")

    categorical_route, categorical = run("car", "categorical", "naive_bayes")
    categorical_pipeline, categorical_fitted = assert_nb_common(categorical, "Categorical Naive Bayes")
    categorical_labels = [str(label) for label in categorical["nb_feature_labels"]]
    if not any(label.startswith("buying_") for label in categorical_labels) or not any(label.startswith("safety_") for label in categorical_labels):
        raise AssertionError("Categorical Naive Bayes did not retain readable one-hot category names.")
    categorical_table = categorical["nb_quantity_evidence"]
    for class_index, class_value in enumerate(categorical_fitted.classes_):
        for feature_index, feature_label in enumerate(categorical_labels):
            rows = categorical_table.loc[(categorical_table["class"] == class_value) & (categorical_table["feature"] == feature_label)]
            if len(rows) != 1 or not np.isclose(float(rows.iloc[0]["class_conditional_probability"]), np.exp(categorical_fitted.feature_log_prob_[class_index, feature_index])):
                raise AssertionError("Categorical Naive Bayes likelihood evidence does not match the fitted estimator.")

    binary_route, binary = run("candy_class", "binary", "naive_bayes")
    binary_pipeline, binary_fitted = assert_nb_common(binary, "Binary Naive Bayes")
    binary_labels = [str(label) for label in binary["nb_feature_labels"]]
    if binary_labels != [f"{name}=1" for name in binary["feature_names"]]:
        raise AssertionError("Binary Naive Bayes labels do not state the 1-valued indicator event.")
    binary_table = binary["nb_quantity_evidence"]
    if list(binary_table.columns) != ["class", "feature", "class_conditional_probability"]:
        raise AssertionError("Binary Naive Bayes evidence has ambiguous columns.")
    for class_index, class_value in enumerate(binary_fitted.classes_):
        for feature_index, feature_label in enumerate(binary_labels):
            rows = binary_table.loc[(binary_table["class"] == class_value) & (binary_table["feature"] == feature_label)]
            if len(rows) != 1 or not np.isclose(float(rows.iloc[0]["class_conditional_probability"]), np.exp(binary_fitted.feature_log_prob_[class_index, feature_index])):
                raise AssertionError("Binary Naive Bayes likelihood evidence does not match the fitted estimator.")

    return {
        "svm_support_vector_counts_and_decisions": True,
        "svm_multiclass_interpretation": True,
        "lda_named_centres_and_probabilities": True,
        "qda_named_centres_and_regularisation": True,
        "naive_bayes_gaussian_densities": True,
        "naive_bayes_categorical_probabilities": True,
        "naive_bayes_binary_probabilities": True,
        "naive_bayes_excluded_row": True,
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
        cv_scores = baseline_namespace["fold_scores"].copy()
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
        if not np.allclose(cv_scores.to_numpy(dtype=float), final_namespace["fold_scores"].to_numpy(dtype=float)):
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
    phase2b2_model_runtime_test = run_neural_network_runtime_regression(payload, pd, np, plt, sns)
    unsupervised_runtime_test = run_unsupervised_runtime_regression(payload, pd, np, plt, sns)
    pca_runtime_test = run_pca_runtime_regression(payload, pd, np, plt, sns)
    pca_practice_experiment_test = run_pca_practice_experiment_regression(payload, pd, np, plt, sns)

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
                        for source_name, source in _cell_execution_sources(cell):
                            warnings.simplefilter("always")
                            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                                exec(source, namespace, namespace)
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
    warning_regression = run_warning_regression(payload, warnings_seen)
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
        "phase2b2_model_runtime": phase2b2_model_runtime_test,
        "phase3a_unsupervised_runtime": unsupervised_runtime_test,
        "phase3b_pca_runtime": pca_runtime_test,
        "phase4a1_pca_experiment": pca_practice_experiment_test,
        "warnings": unique_warnings[:25],
        "warning_count": len(warnings_seen),
        "warning_regression": warning_regression,
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
