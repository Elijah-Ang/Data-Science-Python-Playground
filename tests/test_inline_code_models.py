"""Execute editable illustrative Python and compare native artist observations.

Programs use the same fixed source rows. The oracle is pandas/Seaborn/sklearn,
not a second copy of the JavaScript plotting formulas.
"""

import json
import subprocess
from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import root_mean_squared_error
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.cluster import KMeans
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from scipy.cluster.hierarchy import linkage, cut_tree

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = r"""
const fs=require('fs'),vm=require('vm'),v=require('./foundations/visuals.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync('ml-learning/visuals.js','utf8'),context);const ml=context.window.MLLearningVisuals;
function expand(fields,state={},at=0){if(at===fields.length)return [state];return fields[at].options.flatMap(([value])=>expand(fields,{...state,[fields[at].key]:String(value)},at+1));}
const chartIds=['scatter','line','line-band','mean-bars','exact-bars','point-interval','histogram','density','boxplot','violin','facets'];
const charts=chartIds.flatMap(id=>expand(v.plotArguments(id)).map(state=>({id,state,...v.plotArgumentModel(id,state)})));
const models=['F07','W07','C08','C09','C08-neighbours','C11','C11-gamma','R08','C14','U03','U06','U08','R10-leaf'].flatMap(id=>expand(ml.modelArguments(id)).flatMap(state=>{
 const fields=ml.modelArguments(id,state);return expand(fields.filter(f=>!(f.key in state)),state).map(s=>({id,state:s,...ml.modelArgumentModel(id,s)}));
}));
console.log(JSON.stringify({charts,models,rows:ml.exampleRows}));
"""
states = json.loads(subprocess.check_output(["node", "-e", SCRIPT], cwd=ROOT))
counts = {}
for state in states["charts"]:
    identifier, data = state["id"], state["data"]
    example = pd.DataFrame(data["rows"])
    fig, ax = plt.subplots()
    namespace = dict(sns=sns, ax=ax, example=example)
    exec(state["code"], namespace)
    if identifier in ("line", "line-band"):
        np.testing.assert_allclose(
            ax.lines[0].get_xydata(),
            data["points"],
            rtol=1e-12,
            atol=1e-12,
            err_msg=str(state["state"]),
        )
        assert ax.lines[0].get_marker() == state["state"]["marker"]
        if data["intervals"]:
            for group in data["intervals"]:
                assert (
                    group["value"] - group["sd"] >= data["yDomain"][0]
                    and group["value"] + group["sd"] <= data["yDomain"][1]
                )
            native_paths = ax.collections[0].get_paths()
            assert len(native_paths) == len(data["bands"])
            for native, band in zip(native_paths, data["bands"]):
                expected = {
                    (g["x"], round(g["value"] + sign * g["sd"], 10))
                    for g in band
                    for sign in [-1, 1]
                }
                actual = {(float(x), round(float(y), 10)) for x, y in native.vertices}
                assert expected == actual, (state["state"], expected, actual)
    elif identifier == "scatter":
        np.testing.assert_allclose(
            ax.collections[0].get_offsets(), [[r["x"], r["y"]] for r in data["marks"]]
        )
    elif identifier in ("mean-bars", "exact-bars"):
        np.testing.assert_allclose(
            [p.get_height() for p in ax.patches], [g["value"] for g in data["groups"]]
        )
    elif identifier == "point-interval":
        np.testing.assert_allclose(
            ax.lines[0].get_ydata(), [g["value"] for g in data["groups"]]
        )
        if state["state"]["errorbar"] == "sd":
            for group in data["groups"]:
                assert group["value"] - group["sd"] >= data["yDomain"][0]
                assert group["value"] + group["sd"] <= data["yDomain"][1]
    elif identifier == "histogram":
        np.testing.assert_allclose(
            [p.get_height() for p in ax.patches], [len(b["rows"]) for b in data["bins"]]
        )
        np.testing.assert_allclose([p.get_x() for p in ax.patches], data["edges"][:-1])
        np.testing.assert_allclose(
            [p.get_width() for p in ax.patches], np.diff(data["edges"])
        )
    elif identifier == "facets":
        native = namespace["g"]
        for axis, panel in zip(native.axes.flat, data["panels"]):
            np.testing.assert_allclose(
                axis.collections[0].get_offsets(),
                [[row[data["xKey"]], row[data["yKey"]]] for row in panel["rows"]],
            )
        plt.close(native.figure)
    elif identifier == "density":
        np.testing.assert_allclose(
            ax.lines[0].get_xdata()[[0, -1]], [min(data["values"]), max(data["values"])]
        )
        assert max(y for _, y in data["curve"]) <= data["yDomain"][1]
        from scipy.stats import gaussian_kde

        kde = gaussian_kde(data["values"])
        kde.set_bandwidth(kde.factor * float(state["state"]["bw_adjust"]))
        np.testing.assert_allclose(
            [y for _, y in data["curve"]],
            kde([x for x, _ in data["curve"]]),
            rtol=1e-12,
        )
    elif identifier == "boxplot":
        from matplotlib.cbook import boxplot_stats

        native = boxplot_stats(example[state["state"]["column"]])[0]
        np.testing.assert_allclose(
            [data["q1"], data["median"], data["q3"], *data["whiskers"]],
            [
                native["q1"],
                native["med"],
                native["q3"],
                native["whislo"],
                native["whishi"],
            ],
        )
    assert not any(
        not np.isfinite(p.get_height()) for p in ax.patches if hasattr(p, "get_height")
    )
    plt.close(fig)
    if "marks" in data:
        for mark in data["marks"]:
            assert np.isfinite([mark["cx"], mark["cy"]]).all()
    counts[identifier] = counts.get(identifier, 0) + 1
seen = set()
for state in states["models"]:
    identifier, data, args = state["id"], state["data"], state["state"]
    key = (identifier, json.dumps(args, sort_keys=True))
    if key in seen:
        continue
    seen.add(key)
    if identifier == "F07":
        example = pd.DataFrame(
            {"distance": np.arange(1, 11), "duration": 2 * np.arange(1, 11) + 1}
        )
        ns = dict(example=example, train_test_split=train_test_split)
        exec(state["code"], ns)
        assert ns["X_train"].index.tolist() == data["train"]
        assert ns["X_test"].index.tolist() == data["test"]
    elif identifier == "W07":
        ns = dict(
            example_train=pd.DataFrame(data["rows"], columns=["distance"]),
            SimpleImputer=SimpleImputer,
        )
        exec(state["code"], ns)
        np.testing.assert_allclose(ns["answer"], data["filled"])
    elif identifier.startswith("C0"):
        rows = states["rows"]["knn"]
        X = pd.DataFrame([[r["x"], r["y"]] for r in rows], columns=["x", "y"])
        y = pd.Series([r["group"] for r in rows])
        ns = dict(
            Pipeline=Pipeline,
            StandardScaler=StandardScaler,
            KNeighborsClassifier=KNeighborsClassifier,
            pd=pd,
            example_X=X,
            example_y=y,
        )
        if identifier == "C08-neighbours":
            ns["model"] = Pipeline(
                [
                    ("scale", StandardScaler()),
                    ("model", KNeighborsClassifier(n_neighbors=5)),
                ]
            ).fit(X, y)
        exec(state["code"], ns)
        if identifier == "C08-neighbours":
            actual = ns["positions"][0].tolist()
            votes = ns["votes"].to_dict()
        else:
            fitted = ns["example_model"]
            query = pd.DataFrame([data["query"]], columns=["x", "y"])
            positions = fitted.named_steps["model"].kneighbors(
                fitted.named_steps["prepare"].transform(query), return_distance=False
            )[0]
            actual = positions.tolist()
            votes = y.iloc[positions].value_counts().to_dict()
            assert fitted.predict(query)[0] == data["prediction"]
        assert [rows[i]["id"] for i in actual] == [r["id"] for r in data["neighbours"]]
        assert votes == {k: v for k, v in data["votes"].items() if v}
    elif identifier == "C14":
        rows = states["rows"]["tree"]
        example = pd.DataFrame(
            [[r["width"], r["length"], r["group"]] for r in rows],
            columns=["width", "length", "class"],
        )
        ns = dict(pd=pd, DecisionTreeClassifier=DecisionTreeClassifier, example=example)
        exec(state["code"], ns)
        assert ns["example_model"].predict(ns["row"])[0] == data["prediction"]
    elif identifier.startswith("C11"):
        rows = states["rows"]["rbf"]
        X = [[r["x"], r["y"]] for r in rows]
        y = [r["group"] for r in rows]
        ns = dict(SVC=SVC, example_X_prepared=X, example_y=y)
        exec(state["code"], ns)
        m = ns["example_model"]
        assert m.support_.tolist() == data["support"]
        np.testing.assert_allclose(m.dual_coef_[0], data["dual"])
        np.testing.assert_allclose(
            m.decision_function([[p["x"], p["y"]] for p in data["probes"]]),
            [p["score"] for p in data["probes"]],
            rtol=1e-12,
            atol=1e-12,
        )
    elif identifier == "R08":
        train = np.array(states["rows"]["polynomialTrain"])
        valid = np.array(states["rows"]["polynomialValidation"])
        ns = dict(
            Pipeline=Pipeline,
            PolynomialFeatures=PolynomialFeatures,
            StandardScaler=StandardScaler,
            Ridge=Ridge,
            root_mean_squared_error=root_mean_squared_error,
            example_X_train=train[:, :1],
            example_y_train=train[:, 1],
            example_X_validation=valid[:, :1],
            example_y_validation=valid[:, 1],
        )
        exec(state["code"], ns)
        np.testing.assert_allclose(
            ns["validation_rmse"], data["validationRMSE"], rtol=1e-10
        )
    elif identifier in ("U03", "U06"):
        example = pd.DataFrame(data["rows"], columns=["x", "y"])
        ns = dict(StandardScaler=StandardScaler, KMeans=KMeans, example=example)
        exec(state["code"], ns)
        m = ns["example_model"]
        assert m.labels_.tolist() == data["labels"]
        np.testing.assert_allclose(
            m.cluster_centers_, data["centers"], rtol=1e-12, atol=1e-12
        )
        np.testing.assert_allclose(m.inertia_, data["inertia"])
    elif identifier == "U08":
        ns = dict(
            StandardScaler=StandardScaler,
            linkage=linkage,
            cut_tree=cut_tree,
            example=pd.DataFrame(data["rows"], columns=["length_mm", "width_cm"]),
        )
        exec(state["code"], ns)
        np.testing.assert_allclose(ns["linkage_matrix"], data["linkage"])
        assert ns["labels"].tolist() == data["labels"]
    elif identifier == "R10-leaf":
        rows = np.array(data["rows"])
        ns = dict(
            DecisionTreeRegressor=DecisionTreeRegressor,
            example_X_train=rows[:, :1],
            example_y_train=rows[:, 1],
        )
        exec(state["code"], ns)
        m = ns["example_model"]
        assert m.get_n_leaves() == data["leaves"]
        np.testing.assert_allclose(
            m.predict(np.array(data["points"])[:, :1]), np.array(data["points"])[:, 1]
        )
    counts[identifier] = counts.get(identifier, 0) + 1
print(
    json.dumps(
        dict(
            passed=True,
            chart_states=len(states["charts"]),
            model_states=len(seen),
            by_visual=counts,
            oracles=[
                "Seaborn artist coordinates and heights",
                "pandas grouped operations",
                "SciPy density",
                "sklearn fitted estimators",
            ],
        ),
        indent=2,
    )
)
