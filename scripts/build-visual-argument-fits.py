"""Pinned sklearn fits for independently editable illustration arguments.

Run with the site's Python 3.10/scikit-learn 1.4.2 environment. This only changes
illustrative fixtures; learner datasets, solutions and graders are untouched.
"""

import json, re, warnings
from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import silhouette_score
from sklearn.svm import SVC

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "ml-learning/visuals.js"
source = p.read_text()
base = json.loads(re.search(r"const teachingFits=(.*);", source)[1])
initial = json.loads(re.search(r"const initialisationFits=(.*);", source)[1])
tree_rows = np.array(
    json.loads(re.search(r"const treeComplexityRows=(.*);", source)[1])
)
fits = {"kmeans": {}, "tree": {}}
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for context, rows in [("U03", base["U03"]["rows"]), ("U06", initial["rows"])]:
        prepared = StandardScaler().fit_transform(rows)
        for k in [2, 3, 4] if context == "U03" else [4]:
            for seed in [42, 7] if context == "U03" else [1, 2, 3]:
                for starts in [1, 20]:
                    m = KMeans(n_clusters=k, n_init=starts, random_state=seed).fit(
                        prepared
                    )
                    fits["kmeans"][f"{context}/{k}/{seed}/{starts}"] = dict(
                        labels=m.labels_.tolist(),
                        centers=m.cluster_centers_.tolist(),
                        inertia=m.inertia_,
                        silhouette=silhouette_score(prepared, m.labels_),
                    )
    for depth in [3, 5, None]:
        for leaf in [1, 5, 10]:
            m = DecisionTreeRegressor(
                max_depth=depth, min_samples_leaf=leaf, random_state=42
            ).fit(tree_rows[:, :1], tree_rows[:, 1])
            bounds = sorted(
                {0.0, 15.0, *[float(t) for t in m.tree_.threshold if t >= 0]}
            )
            segments = [
                [a, b, float(m.predict([[(a + b) / 2]])[0])]
                for a, b in zip(bounds, bounds[1:])
            ]
            points = [
                [float(x), float(m.predict([[x]])[0])] for x in np.linspace(0, 15, 61)
            ]
            fits["tree"][f"{depth}/{leaf}"] = dict(
                segments=segments, points=points, leaves=int(m.get_n_leaves())
            )
block = (
    "  // BEGIN GENERATED ARGUMENT FITS\n  const argumentFits="
    + json.dumps(fits, separators=(",", ":"))
    + ";\n  // END GENERATED ARGUMENT FITS\n"
)
if "// BEGIN GENERATED ARGUMENT FITS" in source:
    source = re.sub(
        r"  // BEGIN GENERATED ARGUMENT FITS.*?  // END GENERATED ARGUMENT FITS\n",
        lambda _: block,
        source,
        flags=re.S,
    )
else:
    source = source.replace(
        "  const mlExplorerSpecs={", block + "  const mlExplorerSpecs={"
    )
rbf_rows = json.loads(re.search(r"const rbfRows=(.*);", source)[1])
rbf_fits = {}
for penalty in [0.5, 1, 2, 10]:
    for gamma in [0.1, 1, 10]:
        model = SVC(kernel="rbf", C=penalty, gamma=gamma).fit(
            [[r["x"], r["y"]] for r in rbf_rows], [r["group"] for r in rbf_rows]
        )
        rbf_fits[f"{penalty:g}/{gamma:g}"] = dict(
            C=penalty,
            gamma=gamma,
            support=model.support_.tolist(),
            dual=model.dual_coef_[0].tolist(),
            intercept=model.intercept_[0],
            supportCounts=model.n_support_.tolist(),
        )
source = re.sub(
    r"const rbfFits=.*;",
    lambda _: "const rbfFits=" + json.dumps(rbf_fits, separators=(",", ":")) + ";",
    source,
)
p.write_text(source)
