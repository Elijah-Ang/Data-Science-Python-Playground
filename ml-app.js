/* Machine Learning Playground v2 — one honest, editable workflow per model. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const py = value => JSON.stringify(value);
  const ALL_BREAST = [
    "radius_mean","texture_mean","perimeter_mean","area_mean","smoothness_mean","compactness_mean","concavity_mean","concave_points_mean","symmetry_mean","fractal_dimension_mean",
    "radius_se","texture_se","perimeter_se","area_se","smoothness_se","compactness_se","concavity_se","concave_points_se","symmetry_se","fractal_dimension_se",
    "radius_worst","texture_worst","perimeter_worst","area_worst","smoothness_worst","compactness_worst","concavity_worst","concave_points_worst","symmetry_worst","fractal_dimension_worst"
  ];
  const CHEMISTRY = ["fixed acidity","volatile acidity","citric acid","residual sugar","chlorides","free sulfur dioxide","total sulfur dioxide","density","pH","sulphates","alcohol"];
  const WEATHER = ["Temperature(°C)","Humidity(%)","Wind speed (m/s)","Visibility (10m)","Solar Radiation (MJ/m2)","Rainfall(mm)","Snowfall (cm)"];
  const CANDY_BINARY = ["chocolate","fruity","caramel","peanutyalmondy","nougat","crispedricewafer","hard","bar","pluribus"];
  const mobileLayoutQuery = window.matchMedia("(max-width:820px)");
  const TEST_MODE = Boolean(window.__ML_TEST_MODE__);

  const scenario = (id, name, continuous = [], binary = [], categorical = []) => ({id, name, continuous, binary, categorical});
  const DATASETS = {
    breast: {
      name:"Breast Cancer Wisconsin (Diagnostic)", file:"data/breast-cancer.csv", embedded:"breast", sep:",", rows:569, task:"classification", target:"diagnosis", split:"stratified", missing:false, binaryNumeric:[],
      description:"Clean cell-nucleus measurements with a malignant/benign target.", question:"Can continuous measurements separate the two diagnoses?",
      source:"https://archive.ics.uci.edu/dataset/17/breast-cancer-wisconsin-diagnostic", sourceLabel:"UCI Breast Cancer Wisconsin", sourceNote:"569 rows · 30 continuous predictors · no missing values", prepare:"df",
      scenarios:[
        scenario("continuous5","All features continuous · 5 less-redundant measures",["radius_mean","texture_mean","smoothness_mean","concavity_mean","symmetry_mean"]),
        scenario("continuous30","All features continuous · all 30",ALL_BREAST)
      ]
    },
    penguins: {
      name:"Palmer Penguins · cleaned", file:"data/palmer-penguins.csv", embedded:"penguins", sep:",", rows:333, task:"classification", target:"species", split:"stratified", missing:false, binaryNumeric:[],
      description:"Complete measurements and context for three penguin species.", question:"How does preprocessing change as feature types are combined?",
      source:"https://allisonhorst.github.io/palmerpenguins/", sourceLabel:"Palmer Penguins", sourceNote:"333 official complete cases · island can be a strong geography shortcut", prepare:"df",
      scenarios:[
        scenario("continuous","All features continuous",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"]),
        scenario("continuous_binary","Continuous + binary",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],["sex"]),
        scenario("continuous_category","Continuous + categorical geography",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],[],["island"]),
        scenario("all_types","Continuous + binary + categorical context",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],["sex"],["island","year"])
      ]
    },
    car: {
      name:"Car Evaluation", file:"data/car-evaluation.csv", embedded:"car", sep:",", rows:1728, task:"classification", target:"acceptability", split:"stratified", missing:false, binaryNumeric:[],
      description:"Six fully categorical car attributes with four acceptability classes.", question:"What changes when every predictor is categorical?",
      source:"https://archive.ics.uci.edu/dataset/19/car+evaluation", sourceLabel:"UCI Car Evaluation", sourceNote:"1,728 rows · all categorical · no missing values", prepare:"df",
      scenarios:[scenario("categorical","All features categorical",[],[],["buying","maintenance","doors","persons","luggage_boot","safety"])]
    },
    candy_class: {
      name:"Candy Popularity · binary target", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"classification", target:"popular", split:"stratified", missing:false, binaryNumeric:CANDY_BINARY, theme:"candy",
      description:"Ingredient flags and dataset-relative percentiles with a fixed majority-win target.", question:"Can binary ingredients classify a candy as winning at least half its matchups?",
      source:"https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking", sourceLabel:"FiveThirtyEight Candy Power Ranking", sourceNote:"85 rows · clean · target fixed at a 50% win rate", prepare:"df.assign(popular=np.where(df['winpercent'] >= 50, '50% or above', 'below 50%'))",
      scenarios:[
        scenario("binary","All features binary",[],CANDY_BINARY),
        scenario("continuous_binary","Continuous + binary",["sugarpercent","pricepercent"],CANDY_BINARY)
      ]
    },
    wine: {
      name:"Wine Quality", file:"data/wine-quality.csv", embedded:"wine", sep:";", rows:5320, task:"regression", target:"quality", split:"random", missing:false, binaryNumeric:[],
      description:"Wine chemistry and type with an ordered 0–10 sensory score treated as regression.", question:"Can chemistry estimate quality, and does the relationship curve?",
      source:"https://archive.ics.uci.edu/dataset/186/wine+quality", sourceLabel:"UCI Wine Quality", sourceNote:"5,320 distinct rows · exact duplicates removed before splitting", prepare:"df.drop_duplicates().reset_index(drop=True)",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["alcohol"]),
        scenario("continuous","Multiple continuous features",CHEMISTRY),
        scenario("continuous_binary","Continuous + binary",CHEMISTRY,["wine_type"])
      ]
    },
    seoul: {
      name:"Seoul Bike Sharing Demand", file:"data/seoul-bike.csv", embedded:"seoul", sep:",", rows:8760, task:"regression", target:"Rented Bike Count", split:"time", missing:false, binaryNumeric:[],
      description:"Hourly demand, weather and calendar context in chronological order.", question:"Can we predict later demand without leaking future rows backward?",
      source:"https://archive.ics.uci.edu/dataset/560/seoul+bike+sharing+demand", sourceLabel:"UCI Seoul Bike Sharing", sourceNote:"8,760 hourly rows · chronological 80/20 holdout", prepare:"df.assign(_date=pd.to_datetime(df['Date'], dayfirst=True)).sort_values(['_date','Hour']).reset_index(drop=True)",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["Temperature(°C)"]),
        scenario("continuous","Multiple continuous features",WEATHER),
        scenario("continuous_binary","Continuous + binary",WEATHER,["Holiday"]),
        scenario("continuous_category","Continuous + categorical",WEATHER,[],["Hour","Seasons"]),
        scenario("all_types","Continuous + binary + categorical",WEATHER,["Holiday"],["Hour","Seasons"])
      ]
    },
    gapminder: {
      name:"Gapminder · 2007 snapshot", file:"data/gapminder.csv", embedded:"gapminder", sep:",", rows:142, task:"regression", target:"lifeExp", split:"random", missing:false, binaryNumeric:[],
      description:"A 2007 snapshot from the archived five-year Gapminder teaching extract.", question:"Is the wealth–longevity relationship straight or curved?",
      source:"https://raw.githubusercontent.com/plotly/datasets/master/gapminderDataFiveYear.csv", sourceLabel:"Plotly Gapminder CSV", sourceNote:"142 countries in 2007 · one leakage-safe snapshot", prepare:"df[df['year'].eq(2007)].copy()",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["gdpPercap"]),
        scenario("continuous","Multiple continuous features",["gdpPercap","pop"])
      ]
    },
    candy: {
      name:"Candy Power Ranking", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"regression", target:"winpercent", split:"random", missing:false, binaryNumeric:CANDY_BINARY,
      description:"Ingredient flags, dataset-relative sugar/price percentiles and head-to-head win rate.", question:"How do percentile measures and binary ingredients relate to popularity?",
      source:"https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking", sourceLabel:"FiveThirtyEight Candy Power Ranking", sourceNote:"85 rows · clean numeric and binary predictors", prepare:"df",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["sugarpercent"]),
        scenario("continuous","Multiple continuous features",["sugarpercent","pricepercent"]),
        scenario("binary","All features binary",[],CANDY_BINARY),
        scenario("continuous_binary","Continuous + binary",["sugarpercent","pricepercent"],CANDY_BINARY)
      ]
    }
  };

  const MODELS = {
    simple_linear:{name:"Simple Linear Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"single", scale:false, preprocessNote:"Scaling is optional here; original units keep the coefficient easy to interpret."},
    multiple_linear:{name:"Multiple Linear Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"multiple", scale:false, preprocessNote:"Scaling is optional here; original units keep the coefficients easy to interpret."},
    polynomial:{name:"Polynomial Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"continuous", scale:false, preprocessNote:"The model scales after polynomial expansion so Ridge regularisation treats terms comparably."},
    regression_tree:{name:"Regression Tree", family:"Regression", task:"regression", metric:"RMSE · R²", scale:false, preprocessNote:"Scaling is unnecessary because tree splits depend on thresholds and order, not distance."},
    logistic:{name:"Logistic Regression", family:"Classification", task:"classification", metric:"macro F1 · accuracy", scale:true, preprocessNote:"Scaling helps optimisation and makes regularisation act more evenly across features."},
    svm_cls:{name:"Support Vector Machine", family:"Classification", task:"classification", metric:"macro F1 · accuracy", scale:true, preprocessNote:"Scaling prevents large-unit features from dominating the boundary and kernel."},
    one_r:{name:"One-R", family:"Classification", task:"classification", metric:"macro F1 · accuracy", scale:false, preprocessNote:"Scaling is unnecessary because One-R learns rules one feature at a time."},
    classification_tree:{name:"Classification Tree", family:"Classification", task:"classification", metric:"macro F1 · accuracy", scale:false, preprocessNote:"Scaling is unnecessary because tree splits depend on thresholds and order, not distance."},
    knn_cls:{name:"K-Nearest Neighbours (KNN)", family:"Classification", task:"classification", metric:"macro F1 · accuracy", scale:true, preprocessNote:"Scaling matters because neighbour selection is based on distance."},
    qda:{name:"Quadratic Discriminant Analysis", family:"Classification", task:"classification", metric:"macro F1 · accuracy", requires:"continuous", maxFeatures:10, scale:false, preprocessNote:"Scaling is not required here because each class estimates its own feature relationships."},
    lda:{name:"Linear Discriminant Analysis", family:"Classification", task:"classification", metric:"macro F1 · accuracy", requires:"continuous", scale:false, preprocessNote:"Scaling is not required here because the class boundaries use each feature's estimated relationships."},
    naive_bayes:{name:"Naive Bayes", family:"Classification", task:"classification", metric:"macro F1 · accuracy", pureInput:true, scale:false, preprocessNote:"Scaling is not required because the selected Naive Bayes family estimates its own feature probabilities."},
    mlp_cls:{name:"Neural Network · classification", family:"Neural Networks", task:"classification", metric:"macro F1 · accuracy", minRows:150, scale:true, preprocessNote:"Comparable feature scales make neural-network optimisation easier."},
    mlp_reg:{name:"Neural Network · regression", family:"Neural Networks", task:"regression", metric:"RMSE · R²", minRows:150, scale:true, preprocessNote:"Comparable feature scales make neural-network optimisation easier."},
    kmeans:{name:"K-Means Clustering", family:"Unsupervised", task:"unsupervised", metric:"silhouette", requires:"continuous", minFeatures:2},
    hierarchical:{name:"Hierarchical Clustering", family:"Unsupervised", task:"unsupervised", metric:"silhouette", requires:"continuous", minFeatures:2},
    pca:{name:"Principal Component Analysis (PCA)", family:"Dimensionality reduction", task:"unsupervised", metric:"variance explained", requires:"continuous", minFeatures:2}
  };

  const ONE_R_HELPER_SOURCE = String.raw`
from sklearn.base import BaseEstimator, ClassifierMixin, TransformerMixin, clone


class OneRClassifier(ClassifierMixin, BaseEstimator):
    """Small preloaded helper; the normal route only shows the model idea."""
    def __init__(self, bins=5):
        self.bins = bins

    def fit(self, X, y):
        categorical_mask = getattr(X, "categorical_mask", None)
        if categorical_mask is None:
            raise ValueError("One-R requires explicit feature-type metadata.")
        X, y = np.asarray(X, dtype=float), np.asarray(y)
        categorical_mask = np.asarray(categorical_mask, dtype=bool)
        if categorical_mask.shape != (X.shape[1],):
            raise ValueError("One-R feature-type metadata does not match the transformed features.")
        self.categorical_mask_ = categorical_mask.copy()
        self.classes_, counts = np.unique(y, return_counts=True)
        self.default_ = self.classes_[np.argmax(counts)]
        best = None
        for feature_index in range(X.shape[1]):
            values = X[:, feature_index]
            is_discrete = bool(self.categorical_mask_[feature_index])
            edges = None if is_discrete else np.unique(np.quantile(values, np.linspace(0, 1, self.bins + 1))[1:-1])
            encoded = values if is_discrete else np.digitize(values, edges)
            rules, rows = {}, []
            for bucket in np.unique(encoded):
                covered = encoded == bucket
                labels, label_counts = np.unique(y[covered], return_counts=True)
                prediction = labels[np.argmax(label_counts)]
                rules[bucket] = prediction
                if edges is None:
                    interval = f"category/value = {bucket:g}"
                else:
                    lower = "−∞" if bucket == 0 else f"{edges[bucket - 1]:.3g}"
                    upper = "∞" if bucket == len(edges) else f"{edges[bucket]:.3g}"
                    interval = f"[{lower}, {upper})"
                rows.append({"encoded_value":float(bucket), "interval":interval, "predicted_class":prediction, "training_rows":int(covered.sum())})
            prediction = np.array([rules.get(bucket, self.default_) for bucket in encoded])
            errors = int(np.sum(prediction != y))
            candidate = (errors, feature_index, edges, rules, rows, is_discrete)
            if best is None or errors < best[0]:
                best = candidate
        self.errors_, self.best_feature_, self.edges_, self.rules_, self.rule_rows_, self.is_discrete_ = best
        return self

    def predict(self, X):
        values = np.asarray(X, dtype=float)[:, self.best_feature_]
        encoded = values if self.edges_ is None else np.digitize(values, self.edges_)
        return np.array([self.rules_.get(bucket, self.default_) for bucket in encoded])


class _OneRFeatureMatrix(np.ndarray):
    """Keep preprocessing feature-type metadata attached to the transformed matrix."""
    def __new__(cls, values, categorical_mask):
        result = np.asarray(values, dtype=float).view(cls)
        result.categorical_mask = np.asarray(categorical_mask, dtype=bool)
        return result

    def __array_finalize__(self, source):
        if source is not None:
            self.categorical_mask = getattr(source, "categorical_mask", None)


class _OneRFeaturePreprocessor(BaseEstimator, TransformerMixin):
    """Wrap the generated preprocessor without exposing metadata in the model cell."""
    def __init__(self, transformer, categorical_mask):
        self.transformer = transformer
        self.categorical_mask = categorical_mask

    def fit(self, X, y=None):
        if isinstance(self.transformer, str) and self.transformer == "passthrough":
            self.transformer_ = "passthrough"
        else:
            self.transformer_ = clone(self.transformer)
            self.transformer_.fit(X, y)
        return self

    def transform(self, X):
        values = X if self.transformer_ == "passthrough" else self.transformer_.transform(X)
        return _OneRFeatureMatrix(values, self.categorical_mask)

    def get_feature_names_out(self, input_features=None):
        transformer = getattr(self, "transformer_", self.transformer)
        if hasattr(transformer, "get_feature_names_out"):
            return transformer.get_feature_names_out(input_features)
        if input_features is None:
            return np.arange(len(self.categorical_mask), dtype=object)
        return np.asarray(input_features, dtype=object)


def _one_r_base_preprocessor(preprocessor):
    return getattr(preprocessor, "transformer_", preprocessor)


def _one_r_categories(preprocessor, feature_index):
    preprocessor = _one_r_base_preprocessor(preprocessor)
    if isinstance(preprocessor, str):
        return None
    if hasattr(preprocessor, "categories_"):
        return preprocessor.categories_[feature_index]
    position = 0
    for _, transformer, columns in preprocessor.transformers_:
        if transformer == "drop":
            continue
        columns = list(columns)
        encoder = transformer
        if hasattr(transformer, "named_steps"):
            encoder = next((step for step in transformer.named_steps.values() if hasattr(step, "categories_")), None)
        if encoder is not None and hasattr(encoder, "categories_"):
            for offset, categories in enumerate(encoder.categories_):
                if position + offset == feature_index:
                    return categories
            position += len(encoder.categories_)
        else:
            position += len(columns)
    return None


def _one_r_feature_name(preprocessor, feature_names, feature_index):
    preprocessor = _one_r_base_preprocessor(preprocessor)
    if isinstance(preprocessor, str) or hasattr(preprocessor, "categories_"):
        return feature_names[feature_index]
    position = 0
    for _, transformer, columns in preprocessor.transformers_:
        if transformer == "drop":
            continue
        columns = list(columns)
        encoder = transformer
        if hasattr(transformer, "named_steps"):
            encoder = next((step for step in transformer.named_steps.values() if hasattr(step, "categories_")), None)
        output_count = len(encoder.categories_) if encoder is not None and hasattr(encoder, "categories_") else len(columns)
        if position <= feature_index < position + output_count:
            offset = feature_index - position
            original = columns[offset] if offset < len(columns) else columns[0]
            return original if isinstance(original, str) else feature_names[int(original)]
        position += output_count
    return feature_names[feature_index]


def one_r_rule_table(fitted, preprocessor, feature_names):
    table = pd.DataFrame(fitted.rule_rows_).copy()
    categories = _one_r_categories(preprocessor, fitted.best_feature_) if fitted.is_discrete_ else None
    if categories is not None:
        labels = {float(index):str(value) for index, value in enumerate(categories)}
        table["interval"] = table["encoded_value"].map(labels).fillna(table["interval"])
    table.insert(0, "feature", _one_r_feature_name(preprocessor, feature_names, fitted.best_feature_))
    return table[["feature", "interval", "predicted_class", "training_rows"]]
`;

  const DATAFRAME_SERIALIZER_SOURCE = String.raw`
def _serialize_table_cell(value):
    missing = pd.isna(value)
    if isinstance(missing, (bool, np.bool_)) and missing:
        return None
    return value.item() if hasattr(value, "item") else value


def serialize_dataframe_result(frame, max_rows=50, max_columns=20):
    shown = frame.head(max_rows).iloc[:, :max_columns]
    index = shown.index
    is_default_range = (
        isinstance(index, pd.RangeIndex)
        and index.name is None
        and index.start == 0
        and index.step == 1
    )
    if is_default_range:
        display = shown.reset_index(drop=True)
    else:
        index_frame = index.to_frame(index=False)
        index_names = list(index.names) if isinstance(index, pd.MultiIndex) else [index.name]
        index_columns = [
            str(name) if name is not None else ("index" if position == 0 else f"index_{position}")
            for position, name in enumerate(index_names)
        ]
        index_frame.columns = index_columns
        display = pd.concat(
            [index_frame.reset_index(drop=True), shown.reset_index(drop=True)],
            axis=1,
        )
    return {
        "columns": [str(column) for column in display.columns],
        "rows": [[_serialize_table_cell(value) for value in row] for row in display.to_numpy().tolist()],
        "rowCount": int(len(frame)),
        "columnCount": int(len(frame.columns)),
    }
`;

  const RESET_WORKSPACE_SOURCE = String.raw`
__keep_data_flag = bool(__keep_data)
__baseline_values = globals().get("__baseline_values_from_worker")
if __baseline_values is None:
    __baseline_values = globals().get("BASE_GLOBAL_VALUES")
if not __baseline_values:
    __baseline_values = {__name:globals()[__name] for __name in globals().get("BASE_GLOBAL_NAMES", ()) if __name in globals()}
__baseline_names = set(__baseline_values)
__protected_names = {"df", "__baseline_values_from_worker", "__raw_df_snapshot_from_worker"}
__reset_helpers = {"__keep_data_flag", "__baseline_values", "__baseline_names", "__protected_names", "__reset_helpers"}
for __name in list(globals()):
    if __name not in __baseline_names and __name not in __protected_names and __name not in __reset_helpers:
        globals().pop(__name, None)
globals().update(__baseline_values)
if __keep_data_flag and "__raw_df_snapshot_from_worker" in globals():
    globals()["df"] = __raw_df_snapshot_from_worker.copy(deep=True)
elif not __keep_data_flag:
    globals().pop("df", None)
globals().pop("__baseline_values_from_worker", None)
globals().pop("__raw_df_snapshot_from_worker", None)
for __name in __reset_helpers:
    globals().pop(__name, None)
globals().pop("__name", None)
`;

  const WORKER_SOURCE = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
let pyodide, ready = false, bootPromise = null;
let baselineValues = null;
let rawDataSnapshot = null;
let queue = Promise.resolve();
async function boot() {
  if (ready) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    pyodide = await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"});
    await pyodide.loadPackage(["pandas","numpy","matplotlib","scipy","scikit-learn","micropip"]);
    await pyodide.runPythonAsync("import micropip; await micropip.install('seaborn==0.13.2')");
    await pyodide.runPythonAsync(\`
import io, json, base64, contextlib, ast, traceback, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
sns.set_theme(style="whitegrid", palette="muted")
def display(value):
    global __last_display
    __last_display = value
\`);
    await pyodide.runPythonAsync(${py(DATAFRAME_SERIALIZER_SOURCE)});
    await pyodide.runPythonAsync(${py(ONE_R_HELPER_SOURCE)});
    await pyodide.runPythonAsync("BASE_GLOBAL_NAMES = frozenset(globals()) | {'BASE_GLOBAL_NAMES'}");
    baselineValues = await pyodide.runPythonAsync("dict(globals())");
    ready = true;
  })().catch(error => { bootPromise = null; throw error; });
  return bootPromise;
}
function post(id, payload) { self.postMessage({id, ...payload}); }
async function handle(data) {
  const {id, type} = data;
  try {
    await boot();
    if (type === "reset") {
      const keepData = Boolean(data.keepData);
      pyodide.globals.set("__keep_data", keepData);
      if (baselineValues) pyodide.globals.set("__baseline_values_from_worker", baselineValues);
      if (keepData && rawDataSnapshot) pyodide.globals.set("__raw_df_snapshot_from_worker", rawDataSnapshot);
      await pyodide.runPythonAsync(${py(RESET_WORKSPACE_SOURCE)});
      if (!keepData) rawDataSnapshot = null;
      post(id, {ok:true});
      return;
    }
    if (type === "init") {
      pyodide.globals.set("__csv_text", data.csv);
      pyodide.globals.set("__csv_sep", data.sep);
      pyodide.globals.set("__profile_prepare", data.prepare);
      const raw = await pyodide.runPythonAsync(\`
df = pd.read_csv(io.StringIO(__csv_text), sep=__csv_sep)
__raw_df_snapshot_from_worker = df.copy(deep=True)
profile_df = eval(__profile_prepare, globals())
preview = profile_df.head(5).copy()
preview_payload = serialize_dataframe_result(profile_df, max_rows=5)
json.dumps({
  "rows": int(len(profile_df)), "columns": [str(c) for c in profile_df.columns],
  "preview": {"columns":preview_payload["columns"], "rows":preview_payload["rows"]},
  "missing": int(profile_df.isna().sum().sum())
}, default=str)
\`);
      rawDataSnapshot = pyodide.globals.get("__raw_df_snapshot_from_worker");
      pyodide.globals.delete("__raw_df_snapshot_from_worker");
      post(id, {ok:true, profile:JSON.parse(raw)});
      return;
    }
    if (type === "run") {
      pyodide.globals.set("__cell_code", data.code);
      const raw = await pyodide.runPythonAsync(\`
__io_from_worker = io
__json_from_worker = json
__base64_from_worker = base64
__contextlib_from_worker = contextlib
__ast_from_worker = ast
__traceback_from_worker = traceback
__pd_from_worker = pd
__plt_from_worker = plt
__warnings_from_worker = warnings
__stdout, __stderr = __io_from_worker.StringIO(), __io_from_worker.StringIO()
__result, __error, __last_display = None, None, None
__caught_warnings = []
if __plt_from_worker is not None:
    __plt_from_worker.close("all")
try:
    with __warnings_from_worker.catch_warnings(record=True) as __warning_records:
        __caught_warnings = __warning_records
        __warnings_from_worker.simplefilter("always")
        __tree = __ast_from_worker.parse(__cell_code, mode="exec")
        with __contextlib_from_worker.redirect_stdout(__stdout), __contextlib_from_worker.redirect_stderr(__stderr):
            if __tree.body and isinstance(__tree.body[-1], __ast_from_worker.Expr):
                __last = __tree.body.pop()
                exec(compile(__tree, "<cell>", "exec"), globals())
                __result = eval(compile(__ast_from_worker.Expression(__last.value), "<cell>", "eval"), globals())
            else:
                exec(compile(__tree, "<cell>", "exec"), globals())
                __result = __last_display
except Exception:
    __error = __traceback_from_worker.format_exc()
__warnings = [{"category":__warning.category.__name__, "message":str(__warning.message)} for __warning in __caught_warnings]
__table = None
if __error is None and __pd_from_worker is not None and isinstance(__result, __pd_from_worker.Series):
    __result = __result.to_frame()
if __error is None and __pd_from_worker is not None and isinstance(__result, __pd_from_worker.DataFrame):
    __table = serialize_dataframe_result(__result)
__charts = []
if __plt_from_worker is not None:
    for __number in __plt_from_worker.get_fignums():
        __fig = __plt_from_worker.figure(__number)
        __buffer = __io_from_worker.BytesIO()
        __fig.savefig(__buffer, format="png", dpi=125, bbox_inches="tight", facecolor="#fffaf0")
        __charts.append("data:image/png;base64," + __base64_from_worker.b64encode(__buffer.getvalue()).decode("ascii"))
    __plt_from_worker.close("all")
__value = None
if __error is None and __table is None and __result is not None and not hasattr(__result, "figure"):
    try: __value = str(__result)
    except Exception: pass
__json_from_worker.dumps({"status":"error" if __error else "ok", "error":__error, "warnings":__warnings, "stdout":__stdout.getvalue(), "stderr":__stderr.getvalue(), "table":__table, "charts":__charts, "value":__value}, default=str)
\`);
      post(id, {ok:true, output:JSON.parse(raw)});
      return;
    }
    throw new Error("Unknown worker message");
  } catch (error) { post(id, {ok:false, error:error?.message || String(error)}); }
}
self.onmessage = event => { queue = queue.then(() => handle(event.data)); };
`;

  const worker = TEST_MODE
    ? {postMessage() {}}
    : new Worker(URL.createObjectURL(new Blob([WORKER_SOURCE], {type:"text/javascript"})));
  const pending = new Map();
  let messageId = 0;
  if (!TEST_MODE) worker.onmessage = ({data}) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      data.ok ? request.resolve(data) : request.reject(new Error(data.error));
    };
  const sendWorker = (type, payload = {}) => new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, {resolve, reject});
    worker.postMessage({id, type, ...payload});
  });

  let currentDatasetId = "breast";
  let cells = [];
  let routeTasks = [];
  let cellSequence = 0;
  let workspaceToken = 0;
  let runtimeReady = false;
  let testSetOpened = false;
  let latestChart = null;
  let guideDragState = null;
  let guideResizeState = null;
  let guideViewportSized = false;

  const selectedConfig = () => DATASETS[currentDatasetId];
  const selectedScenario = () => selectedConfig().scenarios.find(item => item.id === $("#scenarioSelect").value) || selectedConfig().scenarios[0];
  const selectedModelId = () => $("#modelSelect").value;
  const selectedModel = () => MODELS[selectedModelId()];
  const featureNames = value => [...value.continuous, ...value.binary, ...value.categorical];
  const featureCount = value => featureNames(value).length;
  const typeMix = value => [
    value.continuous.length ? `${value.continuous.length} continuous` : "",
    value.binary.length ? `${value.binary.length} binary` : "",
    value.categorical.length ? `${value.categorical.length} categorical` : ""
  ].filter(Boolean).join(" · ");

  function invalidateCellsFrom(routeItems, cellList, taskId) {
    const start = routeItems.findIndex(item => item.id === taskId);
    if (start < 0) return {changed:false, start:-1};
    cellList.forEach(cell => {
      const routeIndex = routeItems.findIndex(item => item.id === cell.taskId);
      if (routeIndex < start) return;
      if (cell.output || ["done", "error", "running", "stale"].includes(cell.status)) cell.status = "stale";
      cell.output = null;
    });
    return {changed:true, start};
  }

  function firstIncompleteRouteIndex(routeItems, cellList) {
    return routeItems.findIndex(item => cellList.find(cell => cell.taskId === item.id)?.status !== "done");
  }

  function routeButtonState(routeItems, cellList, index, {runtimeReady = true, testSetOpened = false} = {}) {
    const item = routeItems[index];
    const existing = cellList.find(cell => cell.taskId === item.id);
    const previousIncomplete = routeItems.slice(0, index).some(previous => cellList.find(cell => cell.taskId === previous.id)?.status !== "done");
    const staleEarlier = routeItems.slice(0, index).some(previous => cellList.find(cell => cell.taskId === previous.id)?.status === "stale");
    const finalAlreadyUsed = item.id === "final" && testSetOpened;
    const blocked = !runtimeReady || previousIncomplete || finalAlreadyUsed;
    const message = !runtimeReady
      ? "Wait for the Python workspace to finish loading."
      : previousIncomplete
        ? staleEarlier
          ? "Workflow changed — rerun the earlier route step first."
          : "Run the earlier route steps first."
        : finalAlreadyUsed
          ? "The final test has already been used. Select Reset to start a new teaching run."
          : existing?.status === "stale"
            ? "Workflow changed — rerun from this step."
          : `${item.title} — ${item.caption}`;
    return {status:existing?.status || "ready", previousIncomplete, finalAlreadyUsed, blocked, message};
  }

  function pureNaiveBayesInput(value) {
    if (value.continuous.length && !value.binary.length && !value.categorical.length) return "continuous";
    if (!value.continuous.length && value.binary.length && !value.categorical.length) return "binary";
    if (!value.continuous.length && !value.binary.length && value.categorical.length) return "categorical";
    return null;
  }

  function compatible(modelId, config, value) {
    const model = MODELS[modelId];
    const count = featureCount(value);
    const hasNonContinuous = value.binary.length > 0 || value.categorical.length > 0;
    if (!model || (model.task !== "unsupervised" && model.task !== config.task)) return false;
    if (model.minRows && config.rows < model.minRows) return false;
    if (model.minFeatures && count < model.minFeatures) return false;
    if (model.maxFeatures && count > model.maxFeatures) return false;
    if (model.requires === "single" && !(count === 1 && value.continuous.length === 1)) return false;
    if (model.requires === "multiple" && count <= 1) return false;
    if (model.requires === "continuous" && (value.continuous.length === 0 || hasNonContinuous)) return false;
    if (model.pureInput && !pureNaiveBayesInput(value)) return false;
    return true;
  }

  function decodeEmbedded(encoded) {
    if (!encoded) throw new Error("No embedded teaching copy is available.");
    if (!("DecompressionStream" in window)) throw new Error("This browser cannot unpack the embedded dataset.");
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function getDatasetText(config) {
    try {
      const response = await fetch(config.file, {cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (fetchError) {
      const encoded = window.EMBEDDED_DATASETS?.[config.embedded];
      try { return await decodeEmbedded(encoded); }
      catch (fallbackError) {
        throw new Error(`Dataset unavailable (${fetchError.message}); fallback failed (${fallbackError.message})`);
      }
    }
  }

  function parsePreview(text, separator, limit = 5) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let index = 0; index < text.length && rows.length <= limit; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === separator && !quoted) { row.push(field); field = ""; }
      else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field); field = "";
        if (row.some(value => value !== "")) rows.push(row);
        row = [];
      } else field += character;
    }
    if (!rows.length) return {columns:[], rows:[]};
    return {columns:rows[0], rows:rows.slice(1, limit + 1)};
  }

  function staticSetup() {
    const config = selectedConfig(), value = selectedScenario(), model = selectedModel();
    document.body.dataset.dataset = config.theme || currentDatasetId;
    $("#datasetName").textContent = config.name;
    $("#datasetDescription").textContent = config.description;
    $("#datasetQuestion").textContent = config.question;
    $("#sourceLink").href = config.source;
    $("#sourceLink").textContent = config.sourceLabel;
    $("#sourceNote").textContent = config.sourceNote;
    $("#rowMetric").textContent = config.rows.toLocaleString();
    $("#featureMetric").textContent = featureCount(value);
    $("#featureMix").textContent = typeMix(value);
    $("#metricLabel").textContent = model?.metric || "—";
    const tags = $("#problemTags");
    tags.replaceChildren();
    [model?.task === "unsupervised" ? "unsupervised" : config.task, config.target, value.name, model?.task === "unsupervised" ? "no target for fitting" : (config.split === "time" ? "chronological saved 80 / 20" : "saved 80 / 20")].forEach(label => {
      const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = label; tags.append(tag);
    });
    const list = $("#featureList"); list.replaceChildren();
    const typed = [...value.continuous.map(name => [name,"continuous"]), ...value.binary.map(name => [name,"binary"]), ...value.categorical.map(name => [name,"categorical"])];
    typed.slice(0, 12).forEach(([name, kind]) => {
      const line = document.createElement("div"); line.className = "feature-row"; line.innerHTML = "<b></b><span></span>";
      line.children[0].textContent = name; line.children[1].textContent = kind; list.append(line);
    });
    if (typed.length > 12) {
      const line = document.createElement("div"); line.className = "feature-row"; line.innerHTML = "<b></b><span>selected</span>";
      line.children[0].textContent = `+ ${typed.length - 12} more`; list.append(line);
    }
    const unsupervised = model?.task === "unsupervised";
    $(".route-tools-label").textContent = "SUGGESTED ROUTE";
    $("#routeDescription").textContent = unsupervised
      ? "Discovery workflow · run in order; reference labels stay out of fitting and appear only for interpretation."
      : "Prediction workflow · each step answers one question; the saved test set is used only at the end.";
    $("#foldSelect").disabled = unsupervised;
    $("#foldLabel").textContent = unsupervised ? "Cross-validation · not used" : "Cross-validation";
    $("#runAllButton").textContent = unsupervised ? "▶ Run complete walkthrough" : `▶ Run complete ${$("#foldSelect").value}-fold walkthrough`;
    $("#runAllButton").disabled = !runtimeReady;
  }

  function tablePayload(container, payload, compact = false) {
    container.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = compact ? "" : "result-table-wrap";
    const table = document.createElement("table"); table.className = compact ? "" : "result-table";
    const head = document.createElement("thead"), headRow = document.createElement("tr");
    payload.columns.forEach(column => { const th = document.createElement("th"); th.textContent = column; headRow.append(th); });
    head.append(headRow);
    const body = document.createElement("tbody");
    payload.rows.forEach(values => {
      const row = document.createElement("tr");
      values.forEach(value => { const cell = document.createElement("td"); cell.textContent = value == null ? "—" : String(value); row.append(cell); });
      body.append(row);
    });
    table.append(head, body); wrap.append(table); container.append(wrap);
  }

  function populateDatasets() {
    const select = $("#datasetSelect"); select.replaceChildren();
    const groups = [["Classification",["breast","penguins","car","candy_class"]],["Regression",["wine","seoul","gapminder","candy"]]];
    groups.forEach(([label, ids]) => {
      const group = document.createElement("optgroup"); group.label = label;
      ids.forEach(id => { const option = document.createElement("option"); option.value = id; option.textContent = DATASETS[id].name; group.append(option); });
      select.append(group);
    });
    select.value = currentDatasetId;
  }

  function populateScenarios() {
    const select = $("#scenarioSelect"); select.replaceChildren();
    selectedConfig().scenarios.forEach(value => { const option = document.createElement("option"); option.value = value.id; option.textContent = value.name; select.append(option); });
  }

  function populateModels(preferred) {
    const select = $("#modelSelect"), config = selectedConfig(), value = selectedScenario();
    const available = Object.entries(MODELS).filter(([id]) => compatible(id, config, value));
    select.replaceChildren();
    [...new Set(available.map(([, model]) => model.family))].forEach(family => {
      const group = document.createElement("optgroup"); group.label = family;
      available.filter(([, model]) => model.family === family).forEach(([id, model]) => {
        const option = document.createElement("option"); option.value = id; option.textContent = model.name; group.append(option);
      });
      select.append(group);
    });
    const defaults = {classification:"logistic", regression:featureCount(value) === 1 ? "simple_linear" : "multiple_linear"};
    select.value = available.some(([id]) => id === preferred) ? preferred : defaults[config.task];
    if (!select.value) select.value = available[0]?.[0] || "kmeans";
  }

  const colorFor = index => ["#48d5ff","#f5c518","#c08aff","#58e0b5","#f97316","#ff7c87"][index % 6];
  const clean = code => code.replace(/^\n/, "").replace(/\s+$/, "");
  function formatRouteCode(rawCode) {
    const source = clean(String(rawCode || "")).replace(/\r\n/g, "\n");
    const lines = source.split("\n");
    const spaced = [];
    lines.forEach((line, index) => {
      spaced.push(line);
      const next = lines[index + 1] || "";
      const isImport = /^(?:from\s+\S+\s+import\s+|import\s+)/.test(line);
      const nextIsImport = /^(?:from\s+\S+\s+import\s+|import\s+)/.test(next);
      if (isImport && next.trim() && !nextIsImport) spaced.push("");
    });
    return spaced.join("\n")
      .replace(/\n(?=[ \t]*fig, (?:ax|axes) = plt\.subplots)/g, "\n\n")
      .replace(/\n(?=[ \t]*fig\.tight_layout\(\))/g, "\n\n")
      .replace(/fig\.tight_layout\(\)\n(?=\S)/g, "fig.tight_layout()\n\n")
      .replace(/\n{3,}/g, "\n\n");
  }
  const task = (id, title, caption, code, question) => ({id, title, caption, question, code:formatRouteCode(code)});
  const PYTHON_KEYWORDS = new Set(["and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","not","or","pass","raise","return","try","while","with","yield"]);
  const PYTHON_BUILTINS = new Set(["bool","dict","display","enumerate","float","int","len","list","map","max","min","print","range","set","sorted","str","sum","tuple","zip"]);
  const escapeCodeHtml = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  function highlightPython(code) {
    const source = String(code || "");
    let html = "", index = 0;
    const add = (className, value) => { html += `<span class="${className}">${escapeCodeHtml(value)}</span>`; };
    while (index < source.length) {
      const character = source[index];
      if (character === "#") {
        const end = source.indexOf("\n", index), value = end === -1 ? source.slice(index) : source.slice(index, end);
        add("py-comment", value); index += value.length; continue;
      }
      if (character === '"' || character === "'") {
        const triple = source.slice(index, index + 3) === character.repeat(3), marker = triple ? character.repeat(3) : character;
        let end = index + marker.length;
        while (end < source.length) {
          if (source[end] === "\\") { end += 2; continue; }
          if (source.slice(end, end + marker.length) === marker) { end += marker.length; break; }
          end += 1;
        }
        add("py-string", source.slice(index, end)); index = end; continue;
      }
      if (/\d/.test(character) && (index === 0 || !/[A-Za-z_]/.test(source[index - 1]))) {
        const match = source.slice(index).match(/^(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
        if (match) { add("py-number", match[0]); index += match[0].length; continue; }
      }
      if (/[A-Za-z_]/.test(character)) {
        const word = source.slice(index).match(/^[A-Za-z_]\w*/)[0];
        const called = source.slice(index + word.length).match(/^\s*\(/), before = source[index - 1];
        add(PYTHON_KEYWORDS.has(word) ? "py-keyword" : PYTHON_BUILTINS.has(word) ? "py-builtin" : called ? "py-fn" : before === "." ? "py-attr" : "py-name", word);
        index += word.length; continue;
      }
      if (/[+\-*\/%=<>!&|^~]/.test(character)) {
        const match = source.slice(index).match(/^(?:\*\*|\/\/|==|!=|<=|>=|->|\+=|-=|\*=|\/=|%=|[+\-*\/%=<>!&|^~])/), value = match ? match[0] : character;
        add("py-operator", value); index += value.length; continue;
      }
      if (/[()[\]{}:,.;]/.test(character)) { add("py-punct", character); index += 1; continue; }
      html += escapeCodeHtml(character); index += 1;
    }
    return html || " ";
  }

  function modelFrameName(config) {
    return config.prepare === "df" ? "df" : "model_df";
  }

  function modelFrameSetup(config) {
    return config.prepare === "df" ? "" : `model_df = ${config.prepare}`;
  }

  function frameCode(config, value, unsupervised = false) {
    const frameName = modelFrameName(config);
    const targetLine = unsupervised ? "" : `y = ${frameName}[${py(config.target)}].copy()`;
    return `# 1 · Frame the ${unsupervised ? "unsupervised question" : "prediction problem"}
feature_names = ${py(featureNames(value))}

${modelFrameSetup(config)}
X = ${frameName}[feature_names].copy()
${targetLine}

X.head()`;
  }

  function exploreCode(config, value, unsupervised = false) {
    if (unsupervised) {
      const frameName = modelFrameName(config);
      const first = featureNames(value)[0], second = featureNames(value)[1] || featureNames(value)[0];
      return `# 2 · Explore inputs without consulting the reference target
summary = ${frameName}[feature_names].describe(include="all").T
fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
${value.continuous.includes(first) ? `sns.histplot(data=${frameName}, x=${py(first)}, kde=True, ax=axes[0], color="#137c9c")` : `${frameName}[${py(first)}].value_counts().head(10).plot.bar(ax=axes[0], color="#137c9c")`}
axes[0].set_title(${py(first)})
${value.continuous.includes(second) ? `sns.histplot(data=${frameName}, x=${py(second)}, kde=True, ax=axes[1], color="#7651a6")` : `${frameName}[${py(second)}].value_counts().head(10).plot.bar(ax=axes[1], color="#7651a6")`}
axes[1].set_title(${py(second)})
fig.tight_layout()
summary`;
    }
    const views = [
      ...value.continuous.slice(0, 2).map((name, index) => ({name, kind:"continuous", color:index === 0 ? "#137c9c" : "#7651a6"})),
      ...value.binary.slice(0, 1).map(name => ({name, kind:"category", color:"#f97316"})),
      ...value.categorical.slice(0, 1).map(name => ({name, kind:"category", color:"#c08aff"}))
    ];
    const viewCode = views.map((view, index) => {
      const plot = config.task === "regression"
        ? view.kind === "continuous"
          ? `sns.scatterplot(data=training_view, x=${py(view.name)}, y="target", ax=axes[${index}], color=${py(view.color)})`
          : `sns.boxplot(data=training_view, x=${py(view.name)}, y="target", ax=axes[${index}], color=${py(view.color)})`
        : view.kind === "continuous"
          ? `sns.histplot(data=training_view, x=${py(view.name)}, hue="target", kde=True, element="step", ax=axes[${index}])`
          : `sns.countplot(data=training_view, x=${py(view.name)}, hue="target", ax=axes[${index}])`;
      return `${plot}
axes[${index}].set_title(${py(view.name)})`;
    }).join("\n");
    const summary = config.task === "classification"
      ? `summary = y_train.value_counts().rename_axis("target").reset_index(name="rows")`
      : (value.binary.length || value.categorical.length)
        ? `summary = X_train.describe(include="all").T`
        : `summary = X_train.describe().T`;
    return `# 3 · Explore the training data only
training_view = X_train.copy()
training_view["target"] = y_train.to_numpy()
${summary}

fig, axes = plt.subplots(1, ${views.length}, figsize=(${Math.max(6.2, views.length * 4.2)}, 3.8), squeeze=False)
axes = axes.ravel()
${viewCode}
fig.tight_layout()
summary`;
  }

  function splitCode(config) {
    if (config.split === "time") return `# 2 · Split the data and save the latest 20% for the final test
split_at = int(len(X) * 0.80)
X_train, X_test = X.iloc[:split_at].copy(), X.iloc[split_at:].copy()
y_train, y_test = y.iloc[:split_at].copy(), y.iloc[split_at:].copy()
pd.DataFrame({"partition":["training + CV", "saved final test"], "rows":[len(X_train), len(X_test)], "order":["earlier", "later"]})`;
    return `# 2 · Split the data and save 20% for the final test
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42${config.task === "classification" ? ", stratify=y" : ""}
)
pd.DataFrame({"partition":["training + CV", "saved final test"], "rows":[len(X_train), len(X_test)]})`;
  }

  function baselineCode(config, folds) {
    const splitterName = config.split === "time" ? "TimeSeriesSplit" : config.task === "classification" ? "StratifiedKFold" : "KFold";
    const splitter = config.split === "time"
      ? `${splitterName}(n_splits=${folds})`
      : `${splitterName}(n_splits=${folds}, shuffle=True, random_state=42)`;
    return `# 6 · Check whether the baseline model works consistently
from sklearn.model_selection import ${splitterName}, cross_validate

# ${config.split === "time" ? "TimeSeriesSplit expands the training window forward, so validation rows always come later." : "Each fold fits on its training rows and checks different validation rows."}
cv = ${splitter}
${config.task === "classification" ? `scoring = {"macro_f1":"f1_macro", "accuracy":"accuracy"}
scores = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, return_train_score=True)
cv_scores = pd.DataFrame({
    "fold":np.arange(1, len(scores["test_macro_f1"]) + 1),
    "train_macro_f1":scores["train_macro_f1"],
    "validation_macro_f1":scores["test_macro_f1"],
    "validation_accuracy":scores["test_accuracy"]
})` : `scoring = {"rmse":"neg_root_mean_squared_error", "r2":"r2"}
scores = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, return_train_score=True)
cv_scores = pd.DataFrame({
    "fold":np.arange(1, len(scores["test_rmse"]) + 1),
    "train_rmse":-scores["train_rmse"],
    "validation_rmse":-scores["test_rmse"],
    "validation_r2":scores["test_r2"]
})`}
cv_scores.round(3)`;
  }

  function preprocessingCode(config, value, modelId) {
    const model = MODELS[modelId];
    const numericBinary = value.binary.filter(name => (config.binaryNumeric || []).includes(name));
    const encodedBinary = value.binary.filter(name => !numericBinary.includes(name));
    const encodedFeatures = [...encodedBinary, ...value.categorical];
    const oneRCategoricalMask = [
      ...value.continuous.map(() => false),
      ...numericBinary.map(() => true),
      ...encodedFeatures.map(() => true)
    ];
    const oneRCategoricalMaskSource = "[" + oneRCategoricalMask.map(flag => flag ? "True" : "False").join(",") + "]";
    const allNumeric = value.continuous.length + numericBinary.length === featureCount(value) && !encodedFeatures.length;
    const allEncoded = !value.continuous.length && !numericBinary.length && encodedFeatures.length > 0;
    const allContinuous = value.continuous.length > 0 && !numericBinary.length && !encodedFeatures.length;
    const categoricalNB = modelId === "naive_bayes" && allEncoded && !value.binary.length;
    const useOrdinal = modelId === "one_r";
    const needsScale = Boolean(model.scale);
    const hasMissing = Boolean(config.missing);
    const keepOriginalUnits = ["simple_linear","multiple_linear"].includes(modelId);
    const imports = [];
    const addImport = line => { if (!imports.includes(line)) imports.push(line); };
    const encoder = useOrdinal
      ? "OrdinalEncoder(handle_unknown=\"use_encoded_value\", unknown_value=-1)"
      : "OneHotEncoder(handle_unknown=\"ignore\", sparse_output=False, drop=" + (keepOriginalUnits ? "'first'" : "None") + ")";
    if (encodedFeatures.length) addImport("from sklearn.preprocessing import " + (useOrdinal ? "OrdinalEncoder" : "OneHotEncoder"));

    const transformerFor = (kind, encode = null) => {
      const scale = kind === "continuous" && needsScale;
      if (!hasMissing && !scale && !encode) return "\"passthrough\"";
      if (!hasMissing && scale && !encode) {
        addImport("from sklearn.preprocessing import StandardScaler");
        return "StandardScaler()";
      }
      if (!hasMissing && encode) return encode;
      addImport("from sklearn.pipeline import Pipeline");
      addImport("from sklearn.impute import SimpleImputer");
      const steps = ["    (\"impute\", SimpleImputer(strategy=" + (kind === "continuous" ? "\"median\"" : "\"most_frequent\"") + "))"];
      if (scale) {
        addImport("from sklearn.preprocessing import StandardScaler");
        steps.push("    (\"scale\", StandardScaler())");
      }
      if (encode) steps.push("    (\"encode\", " + encode + ")");
      return "Pipeline([\n" + steps.join(",\n") + "\n])";
    };

    const declarations = [];
    const branches = [];
    const addGroup = (name, columns, kind, encode = null) => {
      if (!columns.length) return;
      const variable = name + "_features";
      declarations.push(variable + " = " + py(columns));
      branches.push("    (\"" + name + "\", " + transformerFor(kind, encode) + ", " + variable + ")");
    };

    let expression;
    const needsSeparateNumericBinary = value.continuous.length && numericBinary.length && (needsScale || hasMissing);
    if (allNumeric && !needsSeparateNumericBinary) {
      if (hasMissing) {
        addImport("from sklearn.pipeline import Pipeline");
        addImport("from sklearn.impute import SimpleImputer");
        const steps = ["    (\"impute\", SimpleImputer(strategy=" + (value.continuous.length ? "\"median\"" : "\"most_frequent\"") + "))"];
        if (needsScale && allContinuous) {
          addImport("from sklearn.preprocessing import StandardScaler");
          steps.push("    (\"scale\", StandardScaler())");
        }
        expression = "Pipeline([\n" + steps.join(",\n") + "\n])";
      } else if (needsScale && allContinuous) {
        addImport("from sklearn.preprocessing import StandardScaler");
        expression = "StandardScaler()";
      } else {
        expression = "\"passthrough\"";
      }
    } else if (allEncoded) {
      if (hasMissing) addImport("from sklearn.impute import SimpleImputer");
      expression = transformerFor("categorical", encoder);
      if (hasMissing && !imports.includes("from sklearn.pipeline import Pipeline")) addImport("from sklearn.pipeline import Pipeline");
    } else {
      addImport("from sklearn.compose import ColumnTransformer");
      if (value.continuous.length) addGroup("continuous", value.continuous, "continuous");
      if (numericBinary.length) addGroup("numeric_binary", numericBinary, "binary");
      if (encodedFeatures.length) addGroup("encoded", encodedFeatures, "categorical", encoder);
      expression = declarations.join("\n") + "\npreprocessor = ColumnTransformer([\n" + branches.join(",\n") + "\n], verbose_feature_names_out=False)";
    }

    const comments = ["# Keep preprocessing inside the pipeline so each CV training fold learns it from its own rows."];
    if (hasMissing) comments.push("# Missing values are filled inside the pipeline using training rows only.");
    if (categoricalNB) comments.push("# Each category becomes a yes/no feature, so Bernoulli Naive Bayes can learn category likelihoods safely.");
    else if (encodedFeatures.length) comments.push(useOrdinal
      ? "# Categories use one stable code per original feature so One-R can learn one-feature rules."
      : "# Categories are one-hot encoded so the estimator receives numeric inputs.");
    if (comments.length < 3) {
      if (needsScale) comments.push("# " + model.preprocessNote);
      else if (["regression_tree","classification_tree"].includes(modelId)) comments.push("# Trees split on thresholds, so scaling is unnecessary.");
      else if (modelId === "one_r") comments.push("# One-R learns one-feature rules, so scaling is unnecessary.");
      else if (modelId === "naive_bayes") comments.push("# This Naive Bayes family estimates feature probabilities directly, so scaling is unnecessary.");
      else if (keepOriginalUnits) comments.push("# Original numeric units stay visible so linear coefficients are easier to interpret.");
      else if (model.preprocessNote) comments.push("# " + model.preprocessNote);
    }

    const assignment = expression.includes("preprocessor =") ? expression : "preprocessor = " + expression;
    const wrappedAssignment = modelId === "one_r"
      ? assignment + "\npreprocessor = _OneRFeaturePreprocessor(preprocessor, " + oneRCategoricalMaskSource + ")"
      : assignment;
    return "# 4 · Prepare the selected data\n" + comments.join("\n") + "\n" + imports.join("\n") + "\n\n" + wrappedAssignment + "\n\npreprocessor";
  }

  function modelSpec(modelId, value) {
    const allBinary = value.continuous.length === 0 && value.categorical.length === 0 && value.binary.length > 0;
    const allCategorical = value.continuous.length === 0 && value.binary.length === 0 && value.categorical.length > 0;
    const allContinuous = value.continuous.length > 0 && value.binary.length === 0 && value.categorical.length === 0;
    const readable = (text) => text;
    const specs = {
      simple_linear:{concept:"Fit one straight-line relationship", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      multiple_linear:{concept:"Estimate one adjusted linear effect per encoded predictor", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      polynomial:{concept:"Expand continuous inputs into curved terms, then scale and regularise", imports:"from sklearn.preprocessing import PolynomialFeatures, StandardScaler\nfrom sklearn.linear_model import Ridge", estimator:"Pipeline([\n    (\"poly\", PolynomialFeatures(include_bias=False)),\n    (\"scale\", StandardScaler()),\n    (\"regression\", Ridge())\n])", grid:readable("{\n    'model__poly__degree': [2, 3],\n    'model__regression__alpha': [0.1, 1.0, 10.0]\n}")},
      regression_tree:{concept:"Learn if/then splits for nonlinear numeric predictions", imports:"from sklearn.tree import DecisionTreeRegressor", estimator:"DecisionTreeRegressor(random_state=42)", grid:readable("{\n    'model__max_depth': [3, 5, None],\n    'model__min_samples_leaf': [1, 5, 15]\n}")},
      logistic:{concept:"Model class log-odds with a regularised linear boundary", imports:"from sklearn.linear_model import LogisticRegression", estimator:"LogisticRegression(max_iter=2000, random_state=42)", grid:readable("{\n    'model__C': [0.1, 1.0, 10.0],\n    'model__class_weight': [None, 'balanced']\n}")},
      svm_cls:{concept:"Find a maximum-margin boundary; RBF allows curvature", imports:"from sklearn.svm import SVC", estimator:"SVC(random_state=42)", grid:readable("{\n    'model__C': [0.5, 2, 10],\n    'model__gamma': ['scale', 0.1]\n}")},
      one_r: !value.continuous.length
        ? {concept:"Use the single feature whose simple rules make the fewest errors", imports:"# One-R is preloaded as a small beginner-friendly helper.", estimator:"OneRClassifier(bins=5)", grid:"{}"}
        : {concept:"Use the single feature whose simple rules make the fewest errors", imports:"# One-R is preloaded as a small beginner-friendly helper.", estimator:"OneRClassifier(bins=5)", grid:readable("{\n    'model__bins': [3, 5, 8]\n}")},
      classification_tree:{concept:"Learn interpretable if/then splits for class labels", imports:"from sklearn.tree import DecisionTreeClassifier", estimator:"DecisionTreeClassifier(random_state=42)", grid:readable("{\n    'model__max_depth': [3, 5, None],\n    'model__min_samples_leaf': [1, 5, 15],\n    'model__criterion': ['gini', 'entropy']\n}")},
      knn_cls:{concept:"Vote using nearby training examples; distance makes scaling essential", imports:"from sklearn.neighbors import KNeighborsClassifier", estimator:"KNeighborsClassifier()", grid:readable("{\n    'model__n_neighbors': [3, 5, 9, 15],\n    'model__weights': ['uniform', 'distance']\n}")},
      qda:{concept:"Give each class its own covariance shape and curved boundary", note:"A small amount of regularisation keeps class covariance estimates stable.", imports:"from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis", estimator:"QuadraticDiscriminantAnalysis(reg_param=0.1)", grid:readable("{\n    'model__reg_param': [0.1, 0.2, 0.5, 0.9]\n}")},
      lda:{concept:"Share one covariance shape and learn linear class boundaries", imports:"from sklearn.discriminant_analysis import LinearDiscriminantAnalysis", estimator:"LinearDiscriminantAnalysis(solver='lsqr')", grid:readable("{\n    'model__shrinkage': [None, 'auto']\n}")},
      naive_bayes: allBinary
        ? {concept:"Estimate independent Bernoulli probabilities for binary inputs", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:readable("{\n    'model__alpha': [0.1, 1.0, 5.0]\n}")}
        : allCategorical
          ? {concept:"Turn categories into yes/no features and estimate their likelihood within each class", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:readable("{\n    'model__alpha': [0.1, 1.0, 5.0]\n}")}
          : allContinuous
            ? {concept:"Estimate class probabilities with a Gaussian distribution per feature", imports:"from sklearn.naive_bayes import GaussianNB", estimator:"GaussianNB()", grid:readable("{\n    'model__var_smoothing': [1e-11, 1e-9, 1e-7]\n}")}
            : null,
      mlp_cls:{concept:"Learn nonlinear layers of weighted features with backpropagation", imports:"from sklearn.neural_network import MLPClassifier", estimator:"MLPClassifier(\n    max_iter=500,\n    early_stopping=True,\n    random_state=42\n)", grid:readable("{\n    'model__hidden_layer_sizes': [(24,), (32, 16)],\n    'model__alpha': [0.0001, 0.01]\n}")},
      mlp_reg:{concept:"Learn nonlinear layers while scaling the target inside the model", imports:"from sklearn.neural_network import MLPRegressor\nfrom sklearn.compose import TransformedTargetRegressor\nfrom sklearn.preprocessing import StandardScaler", estimator:"TransformedTargetRegressor(\n    regressor=MLPRegressor(\n        max_iter=800,\n        early_stopping=True,\n        tol=1e-3,\n        random_state=42\n    ),\n    transformer=StandardScaler()\n)", grid:readable("{\n    'model__regressor__hidden_layer_sizes': [(24,), (32, 16)],\n    'model__regressor__alpha': [0.0001, 0.01]\n}")}
    };
    return specs[modelId];
  }

  function modelCode(modelId, value) {
    const spec = modelSpec(modelId, value);
    return [
      "# 5 · Build the model pipeline",
      "# " + spec.concept,
      spec.note ? "# " + spec.note : "",
      "from sklearn.pipeline import Pipeline",
      spec.imports,
      "",
      "model = " + spec.estimator,
      "pipeline = Pipeline([",
      "    (\"prepare\", preprocessor),",
      "    (\"model\", model)",
      "])",
      "pipeline"
    ].join("\n");
  }

  function tuningCode(config, modelId, value) {
    const spec = modelSpec(modelId, value);
    const hasHyperparameters = spec.grid !== "{}";
    const scoring = config.task === "classification" ? "f1_macro" : "neg_root_mean_squared_error";
    const displayedMetric = config.task === "classification" ? "macro F1" : "RMSE";
    if (!hasHyperparameters) return [
      "# 7 · Keep the model defaults",
      "best_pipeline = pipeline",
      "best_params = {}",
      "print(\"No meaningful hyperparameters to tune; using the model defaults.\")",
      "best_pipeline"
    ].join("\n");
    const displayedScore = config.task === "classification" ? "best_score" : "-best_score";
    return [
      "# 7 · Tune the model inside the same training folds",
      "from sklearn.model_selection import GridSearchCV",
      "parameter_grid = " + spec.grid,
      "search = GridSearchCV(",
      "    pipeline,",
      "    parameter_grid,",
      "    cv=cv,",
      "    scoring=" + py(scoring),
      ")",
      "search.fit(X_train, y_train)",
      "best_pipeline = search.best_estimator_",
      "best_params = search.best_params_",
      "best_score = search.best_score_",
      "print(\"Best settings:\", best_params)",
      "print(\"Best CV " + displayedMetric + ":\", round(" + displayedScore + ", 3))",
      "best_params"
    ].join("\n");
  }
  function interpretationCode(modelId, value) {
    const preparedNames = [
      "prepare = diagnostic_model.named_steps[\"prepare\"]",
      "encoded_names = prepare.get_feature_names_out() if hasattr(prepare, \"get_feature_names_out\") else np.array(feature_names)"
    ].join("\n");
    if (["simple_linear","multiple_linear"].includes(modelId)) return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "interpretation = pd.DataFrame({\"feature\":encoded_names, \"coefficient\":np.ravel(fitted.coef_)})",
      "interpretation.reindex(interpretation.coefficient.abs().sort_values(ascending=False).index).head(15)"
    ].join("\n");
    if (modelId === "polynomial") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "term_names = fitted.named_steps[\"poly\"].get_feature_names_out(encoded_names)",
      "interpretation = pd.DataFrame({\"term\":term_names, \"coefficient\":np.ravel(fitted.named_steps[\"regression\"].coef_)})",
      "interpretation.reindex(interpretation.coefficient.abs().sort_values(ascending=False).index).head(15)"
    ].join("\n");
    if (["regression_tree","classification_tree"].includes(modelId)) return [
      "from sklearn.tree import plot_tree",
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "importance = pd.DataFrame({\"feature\":encoded_names, \"importance\":fitted.feature_importances_}).sort_values(\"importance\", ascending=False)",
      "fig, ax = plt.subplots(figsize=(12, 5))",
      "plot_tree(fitted, max_depth=3, feature_names=encoded_names, filled=True, rounded=True, fontsize=6, ax=ax)",
      "ax.set_title(\"Top of the fitted tree (training data only)\")",
      "fig.tight_layout()",
      "importance.head(15)"
    ].join("\n");
    if (modelId === "logistic") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "coef = np.atleast_2d(fitted.coef_)",
      "coefficient_labels = [fitted.classes_[1]] if coef.shape[0] == 1 else fitted.classes_",
      "interpretation = pd.DataFrame(coef.T, index=encoded_names, columns=[f\"weight_{label}\" for label in coefficient_labels]).reset_index(names=\"feature\")",
      "interpretation.head(15)"
    ].join("\n");
    if (modelId === "svm_cls") return [
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "pd.DataFrame({\"class\":fitted.classes_, \"support_vectors\":fitted.n_support_})"
    ].join("\n");
    if (modelId === "one_r") return [
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "one_r_rules = one_r_rule_table(fitted, diagnostic_model.named_steps[\"prepare\"], feature_names)",
      "one_r_rules"
    ].join("\n");
    if (modelId === "knn_cls") return [
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "pd.DataFrame({\"n_neighbors\":[fitted.n_neighbors], \"weights\":[fitted.weights]})"
    ].join("\n");
    if (modelId === "qda") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "pd.DataFrame(fitted.means_, index=fitted.classes_, columns=encoded_names).reset_index(names=\"class\")"
    ].join("\n");
    if (modelId === "lda") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "lda_coef = np.atleast_2d(fitted.coef_)",
      "lda_rows = fitted.classes_ if len(fitted.classes_) == lda_coef.shape[0] else [f\"boundary_{i+1}\" for i in range(lda_coef.shape[0])]",
      "pd.DataFrame(lda_coef, index=lda_rows, columns=encoded_names).reset_index(names=\"class_or_boundary\")"
    ].join("\n");
    if (modelId === "naive_bayes") {
      const kind = pureNaiveBayesInput(value);
      if (kind === "continuous") return [
        preparedNames,
        "fitted = diagnostic_model.named_steps[\"model\"]",
        "gaussian_means = pd.DataFrame(fitted.theta_, index=fitted.classes_, columns=encoded_names)",
        "gaussian_means.index.name = \"class\"",
        "gaussian_means.reset_index().iloc[:, :min(9, len(encoded_names) + 1)].round(3)"
      ].join("\n");
      return [
        preparedNames,
        "fitted = diagnostic_model.named_steps[\"model\"]",
        "bernoulli_probabilities = pd.DataFrame(np.exp(fitted.feature_log_prob_), index=fitted.classes_, columns=encoded_names)",
        "bernoulli_probabilities.index.name = \"class\"",
        "bernoulli_probabilities.reset_index().iloc[:, :min(9, len(encoded_names) + 1)].round(3)"
      ].join("\n");
    }
    if (["mlp_cls","mlp_reg"].includes(modelId)) return [
      "wrapped_model = diagnostic_model.named_steps[\"model\"]",
      "fitted = wrapped_model.regressor_ if hasattr(wrapped_model, \"regressor_\") else wrapped_model",
      "fig, ax = plt.subplots(figsize=(6.2, 3.4))",
      "ax.plot(fitted.loss_curve_, color=\"#7651a6\")",
      "ax.set(title=\"Neural-network training loss\", xlabel=\"iteration\", ylabel=\"loss\")",
      "fig.tight_layout()",
      "pd.DataFrame({\"layers\":[fitted.hidden_layer_sizes], \"iterations\":[fitted.n_iter_], \"final_loss\":[fitted.loss_]})"
    ].join("\n");
    return "";
  }
  function diagnosticsCode(config, modelId, value) {
    const interpretation = interpretationCode(modelId, value);
    if (config.task === "classification") return [
      "# 8 · Diagnose and understand the chosen model",
      "# These diagnostics explain behaviour; they are not another headline performance score.",
      "from sklearn.base import clone",
      "from sklearn.model_selection import cross_val_predict",
      "from sklearn.metrics import confusion_matrix",
      "diagnostic_prediction = cross_val_predict(best_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
      "diagnostic_model = clone(best_pipeline).fit(X_train, y_train)",
      "",
      "fig, ax = plt.subplots(figsize=(5.4, 4.2))",
      "sns.heatmap(confusion_matrix(y_train, diagnostic_prediction), annot=True, fmt=\"d\", cmap=\"Purples\", ax=ax,",
      "            xticklabels=np.unique(y_train), yticklabels=np.unique(y_train))",
      "ax.set(title=\"Training-only diagnostic confusion matrix\", xlabel=\"Predicted\", ylabel=\"Actual\")",
      "fig.tight_layout()",
      interpretation
    ].join("\n");
    const diagnosticSetup = config.split === "time"
      ? [
          "last_fit, last_validation = list(cv.split(X_train, y_train))[-1]",
          "diagnostic_model = clone(best_pipeline).fit(X_train.iloc[last_fit], y_train.iloc[last_fit])",
          "diagnostic_actual = y_train.iloc[last_validation]",
          "diagnostic_prediction = diagnostic_model.predict(X_train.iloc[last_validation])"
        ].join("\n")
      : [
          "diagnostic_prediction = cross_val_predict(best_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
          "diagnostic_actual = y_train",
          "diagnostic_model = clone(best_pipeline).fit(X_train, y_train)"
        ].join("\n");
    const predictionImport = config.split === "time" ? "" : "from sklearn.model_selection import cross_val_predict";
    const diagnosticLabel = config.split === "time" ? "training-only diagnostic residuals from the last validation window" : "training-only diagnostic residuals";
    return [
      "# 8 · Diagnose and understand the chosen model",
      "# Residuals describe model behaviour; the final test remains the only final evaluation.",
      "from sklearn.base import clone",
      predictionImport,
      diagnosticSetup,
      "residuals = diagnostic_actual.to_numpy() - diagnostic_prediction",
      "fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))",
      "sns.scatterplot(x=diagnostic_prediction, y=residuals, ax=axes[0], color=\"#7651a6\")",
      "axes[0].axhline(0, color=\"#c75b20\", linestyle=\"--\")",
      "axes[0].set(title=" + py(diagnosticLabel) + ", xlabel=\"prediction\", ylabel=\"actual − prediction\")",
      "sns.histplot(residuals, kde=True, ax=axes[1], color=\"#137c9c\")",
      "axes[1].set_title(\"Residual distribution\")",
      "fig.tight_layout()",
      interpretation
    ].filter(Boolean).join("\n");
  }
  function finalCode(config) {
    if (config.task === "classification") return `# 9 · Refit on all training rows, then run the final test once
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
final_model = best_pipeline.fit(X_train, y_train)
test_prediction = final_model.predict(X_test)

fig, ax = plt.subplots(figsize=(5.4, 4.2))
labels = np.unique(y_test)
sns.heatmap(confusion_matrix(y_test, test_prediction, labels=labels), annot=True, fmt="d", cmap="Blues", ax=ax, xticklabels=labels, yticklabels=labels)
ax.set(title="Final sealed-test confusion matrix", xlabel="Predicted", ylabel="Actual")
fig.tight_layout()
macro_f1 = f1_score(y_test, test_prediction, average="macro")
accuracy = accuracy_score(y_test, test_prediction)
test_result = pd.DataFrame({
    "metric":["macro F1", "accuracy", "test rows"],
    "value":[macro_f1, accuracy, len(y_test)]
})
test_result.round(3)`;
    return `# 9 · Refit on all training rows, then run the final test once
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
final_model = best_pipeline.fit(X_train, y_train)
test_prediction = final_model.predict(X_test)

fig, ax = plt.subplots(figsize=(6.2, 4))
sns.scatterplot(x=y_test, y=test_prediction, ax=ax, color="#137c9c")
limits = [min(y_test.min(), test_prediction.min()), max(y_test.max(), test_prediction.max())]
ax.plot(limits, limits, "--", color="#c75b20")
ax.set(title="Final sealed test: actual vs predicted", xlabel="actual", ylabel="predicted")
fig.tight_layout()
rmse = root_mean_squared_error(y_test, test_prediction)
mae = mean_absolute_error(y_test, test_prediction)
r2 = r2_score(y_test, test_prediction)
test_result = pd.DataFrame({
    "metric":["RMSE", "MAE", "R²", "test rows"],
    "value":[rmse, mae, r2, len(y_test)]
})
test_result.round(3)`;
  }

  function supervisedRoute(config, value, modelId, folds) {
    const hasHyperparameters = modelSpec(modelId, value).grid !== "{}";
    return [
      task("frame","Choose what to predict","define X and y",frameCode(config, value),"What am I trying to predict?"),
      task("split","Split data and save the test set",config.split === "time" ? "latest 20%" : "stratified / random 20%",splitCode(config),"What will I train on, and what will I save until the end?"),
      task("explore","Explore training data","training inputs + plots",exploreCode(config, value),"What does the training data look like?"),
      task("prepare","Prepare the data","only selected feature types",preprocessingCode(config, value, modelId),"What needs to be cleaned or transformed?"),
      task("model","Build the model pipeline",modelSpec(modelId, value).concept,modelCode(modelId, value),"What algorithm am I using?"),
      task("baseline","Check the baseline with cross-validation",`${folds}-fold training-only CV`,baselineCode(config, folds),"Does the baseline model work consistently?"),
      task("tune",hasHyperparameters ? "Tune the model" : "Keep the model defaults",hasHyperparameters ? `GridSearchCV · ${folds} folds` : "no meaningful settings to search",tuningCode(config, modelId, value),"Can better settings improve it?"),
      task("diagnose","Diagnose and understand the chosen model","training-only diagnostics",diagnosticsCode(config, modelId, value),"What does the chosen model get right, get wrong, and how does it behave?"),
      task("final","Final test","saved test set · one walkthrough",finalCode(config),"How well does it perform on genuinely unseen data?")
    ];
  }

  function unsupervisedFrameCode(config, value) {
    return frameCode(config, value, true);
  }

  function clusterPreprocessing(config) {
    const imports = ["from sklearn.preprocessing import StandardScaler"];
    const expression = config.missing
      ? (() => {
          imports.unshift("from sklearn.impute import SimpleImputer", "from sklearn.pipeline import Pipeline");
          return "Pipeline([\n    (\"impute\", SimpleImputer(strategy=\"median\")),\n    (\"scale\", StandardScaler())\n])";
        })()
      : "StandardScaler()";
    return "# 3 · Prepare the numeric inputs\n# Scaling makes feature magnitudes comparable for distance-based methods and PCA.\n"
      + (config.missing ? "# Imputation is included only because the selected data can contain missing values.\n" : "# The bundled selected data is complete, so no imputation is needed.\n")
      + imports.join("\n") + "\n\npreprocessor = " + expression + "\nZ = preprocessor.fit_transform(X)\n\nZ[:5]";
  }

  function kmeansRoute(config, value) {
    const frameName = modelFrameName(config);
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","inputs + plots",exploreCode(config, value, true),"What does my data look like?"),
      task("prepare","Prepare the data","scaled numeric inputs",clusterPreprocessing(config),"What needs to be cleaned or transformed?"),
      task("compare","Compare possible group counts","exploratory inertia + silhouette",`# 4 · Compare possible group counts; this is exploratory, not a test score
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
candidate_rows = []
max_k = min(8, len(Z) - 1)
sample_size = min(2000, len(Z))
for k in range(2, max_k + 1):
    candidate = KMeans(n_clusters=k, n_init=20, random_state=42).fit(Z)
    candidate_rows.append({"k":k, "inertia":candidate.inertia_, "silhouette":silhouette_score(Z, candidate.labels_, sample_size=sample_size, random_state=42)})
candidate_scores = pd.DataFrame(candidate_rows)
fig, axes = plt.subplots(1, 2, figsize=(9, 3.4))
sns.lineplot(data=candidate_scores, x="k", y="inertia", marker="o", ax=axes[0])
sns.lineplot(data=candidate_scores, x="k", y="silhouette", marker="o", ax=axes[1], color="#7651a6")
axes[0].set_title("Elbow: within-cluster inertia")
axes[1].set_title("Higher silhouette is better")
fig.tight_layout()
candidate_scores.round(3)`,"Which group count looks most useful?"),
      task("fit","Fit K-means","suggested silhouette k",`# 5 · Fit the selected K-means solution
suggested_k = int(candidate_scores.loc[candidate_scores["silhouette"].idxmax(), "k"])
selected_k = suggested_k  # Edit this if another solution is more useful.
kmeans = KMeans(n_clusters=selected_k, n_init=30, random_state=42).fit(Z)
clusters = kmeans.labels_
pd.DataFrame({"selected_k":[selected_k], "silhouette":[silhouette_score(Z, clusters, sample_size=sample_size, random_state=42)], "inertia":[kmeans.inertia_]}).round(3)`,"What does the selected solution look like?"),
      task("diagnose","Check the clusters","size + separation",`# 6 · Check whether the solution is balanced and separated
from sklearn.metrics import silhouette_samples
quality_index = np.random.default_rng(42).choice(len(Z), size=sample_size, replace=False)
quality_Z = Z[quality_index]
quality_clusters = clusters[quality_index]
sample_silhouette = silhouette_samples(quality_Z, quality_clusters)
cluster_quality = pd.DataFrame({"cluster":quality_clusters, "silhouette":sample_silhouette}).groupby("cluster").agg(rows=("silhouette","size"), mean_silhouette=("silhouette","mean"), weakest=("silhouette","min")).reset_index()
cluster_quality.round(3)`,"Are the groups balanced and well separated?"),
      task("profile","Explain the clusters","original feature units",`# 7 · Translate cluster IDs back into the original features
profile_df = ${frameName}[feature_names].copy()
profile_df["cluster"] = clusters
cluster_profile = profile_df.groupby("cluster")[feature_names].mean().round(2)
cluster_profile.reset_index()`,"What does each group mean in the original features?"),
      task("visualise","Map the clusters","PCA view only",`# 8 · Project to two dimensions for a visual map (the model used all dimensions)
from sklearn.decomposition import PCA
projection = PCA(n_components=2).fit_transform(Z)
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "cluster":clusters.astype(str)})
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x="PC1", y="PC2", hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"K-means clusters (k={selected_k}) in a PCA view")
fig.tight_layout()
plot_df.head(12)`,"Can I see the discovered groups clearly in two dimensions?")
    ];
  }

  function hierarchicalRoute(config, value) {
    const frameName = modelFrameName(config);
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","inputs + plots",exploreCode(config, value, true),"What does my data look like?"),
      task("prepare","Prepare the data","scaled numeric sample",clusterPreprocessing(config) + `
# Hierarchical clustering is quadratic in memory, so every later step uses one reproducible sample.
sample_size = min(500, len(Z))
sample_index = np.random.default_rng(42).choice(len(Z), size=sample_size, replace=False)
analysis_Z = Z[sample_index]
analysis_rows = ${frameName}.iloc[sample_index].copy()`,"What needs to be cleaned or transformed before measuring distances?"),
      task("dendrogram","Build the dendrogram","Ward linkage sample",`# 4 · Inspect the hierarchy before choosing a cut
from scipy.cluster.hierarchy import linkage, dendrogram
linkage_matrix = linkage(analysis_Z, method="ward")
fig, ax = plt.subplots(figsize=(10, 4))
dendrogram(linkage_matrix, truncate_mode="level", p=5, no_labels=True, color_threshold=None, ax=ax)
ax.set(title="Ward-linkage dendrogram", xlabel="merged groups", ylabel="distance")
fig.tight_layout()
pd.DataFrame(linkage_matrix[-10:], columns=["left_group","right_group","merge_distance","members"]).round(2)`,"What patterns of merging appear before I choose a cut?"),
      task("compare","Compare possible cuts","exploratory silhouette",`# 5 · Compare cuts on the same sample; this is exploratory, not a test score
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
candidate_rows = []
max_k = min(8, len(analysis_Z) - 1)
silhouette_size = min(2000, len(analysis_Z))
for k in range(2, max_k + 1):
    labels = AgglomerativeClustering(n_clusters=k, linkage="ward").fit_predict(analysis_Z)
    candidate_rows.append({"clusters":k, "silhouette":silhouette_score(analysis_Z, labels, sample_size=silhouette_size, random_state=42)})
candidate_scores = pd.DataFrame(candidate_rows)
fig, ax = plt.subplots(figsize=(6, 3.4))
sns.lineplot(data=candidate_scores, x="clusters", y="silhouette", marker="o", color="#7651a6", ax=ax)
ax.set_title("Choose a defensible dendrogram cut")
fig.tight_layout()
candidate_scores.round(3)`,"Which cut looks most useful for describing the sample?"),
      task("fit","Fit the hierarchy","suggested silhouette cut",`# 6 · Fit the selected hierarchy
suggested_k = int(candidate_scores.loc[candidate_scores["silhouette"].idxmax(), "clusters"])
selected_k = suggested_k  # Edit this if another cut is more useful.
hierarchical = AgglomerativeClustering(n_clusters=selected_k, linkage="ward")
clusters = hierarchical.fit_predict(analysis_Z)
pd.Series(clusters).value_counts().sort_index().rename_axis("cluster").reset_index(name="rows")`,"What does the selected hierarchy produce?"),
      task("profile","Explain the groups","original feature units",`# 7 · Describe the discovered groups in original units
profile_df = analysis_rows[feature_names].copy()
profile_df["cluster"] = clusters
cluster_profile = profile_df.groupby("cluster")[feature_names].mean().round(2)
cluster_profile.reset_index()`,"What does each group mean in the original features?"),
      task("visualise","Map the hierarchy","PCA teaching view",`# 8 · Visualise the sampled hierarchy in two dimensions
from sklearn.decomposition import PCA
projection = PCA(n_components=2).fit_transform(analysis_Z)
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "cluster":clusters.astype(str)})
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x="PC1", y="PC2", hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"Hierarchical groups (k={selected_k})")
fig.tight_layout()
plot_df.head(12)`,"Can I see the sampled groups clearly in two dimensions?")
    ];
  }

  function pcaRoute(config, value) {
    const frameName = modelFrameName(config);
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","correlation + scale",`# 2 · Inspect redundancy before PCA
correlation = ${frameName}[feature_names].corr()
fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(correlation, cmap="vlag", center=0, ax=ax)
ax.set_title("Correlation among continuous inputs")
fig.tight_layout()
${frameName}[feature_names].describe().T`,"What does my data look like, and which inputs overlap?"),
      task("prepare","Prepare the data","scaled numeric inputs",clusterPreprocessing(config),"What needs to be cleaned or transformed?"),
      task("variance","Fit PCA and inspect explained variance","scree + cumulative variance",`# 4 · Fit PCA and inspect how much variance each component explains
# Retaining 90% is a common rule of thumb, not a universal requirement.
from sklearn.decomposition import PCA
full_pca = PCA().fit(Z)
variance_table = pd.DataFrame({
    "component":np.arange(1, len(full_pca.explained_variance_ratio_) + 1),
    "explained_variance":full_pca.explained_variance_ratio_,
    "cumulative_variance":np.cumsum(full_pca.explained_variance_ratio_)
})
fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
sns.lineplot(data=variance_table, x="component", y="explained_variance", marker="o", ax=axes[0])
sns.lineplot(data=variance_table, x="component", y="cumulative_variance", marker="o", color="#7651a6", ax=axes[1])
axes[1].axhline(.90, color="#c75b20", linestyle="--", label="90%")
axes[0].set_title("Scree plot")
axes[1].set_title("Cumulative variance")
axes[1].legend()
fig.tight_layout()
variance_table.round(4)`,"How quickly does information concentrate into fewer components?"),
      task("select","Select components","retain at least 90%",`# 5 · Select the smallest representation retaining at least 90% variance
n_components_90 = int(np.argmax(variance_table["cumulative_variance"].to_numpy() >= .90) + 1)
Z_reduced = full_pca.transform(Z)[:, :n_components_90]
pd.DataFrame({"original_dimensions":[Z.shape[1]], "selected_components":[n_components_90], "variance_retained":[variance_table.loc[n_components_90 - 1, "cumulative_variance"]]}).round(4)`,"How many components should I keep while retaining at least 90% of the variance?"),
      task("loadings","Understand the component loadings","which inputs shape each axis",`# 6 · Connect the components back to the original inputs
loadings = pd.DataFrame(full_pca.components_.T, index=feature_names, columns=[f"PC{i}" for i in range(1, len(full_pca.components_) + 1)])
loading_view = loadings[["PC1", "PC2"]].copy()
loading_view["largest_absolute_loading"] = loading_view.abs().max(axis=1)
loading_view.sort_values("largest_absolute_loading", ascending=False).head(20).round(3)`,"Which original inputs contribute most to each principal component?"),
      task("project","Project the rows","labels only for interpretation",`# 7 · Project rows, then add labels only for interpretation
projection = full_pca.transform(Z)[:, :2]
reference_label = ${frameName}[${py(config.target)}].copy()
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "reference":reference_label.to_numpy()})
fig, ax = plt.subplots(figsize=(6.6, 4.5), layout="constrained")
${config.task === "classification" ? `plot_df["reference"] = plot_df["reference"].astype(str)
sns.scatterplot(data=plot_df, x="PC1", y="PC2", hue="reference", alpha=.7, ax=ax)` : `points = ax.scatter(plot_df["PC1"], plot_df["PC2"], c=plot_df["reference"], cmap="viridis", alpha=.7)
fig.colorbar(points, ax=ax, label=${py(config.target)})`}
ax.set_title("PCA projection; labels added only after fitting")
plot_df.head(12)`,"What does the two-dimensional representation look like when labels are added only for interpretation?")
    ];
  }

  function routeForSelection(config, value, modelId, folds) {
    if (modelId === "kmeans") return kmeansRoute(config, value);
    if (modelId === "hierarchical") return hierarchicalRoute(config, value);
    if (modelId === "pca") return pcaRoute(config, value);
    return supervisedRoute(config, value, modelId, folds);
  }

  function buildRoute() {
    const config = selectedConfig(), value = selectedScenario(), modelId = selectedModelId(), folds = Number($("#foldSelect").value);
    routeTasks = Object.freeze(routeForSelection(config, value, modelId, folds).map(Object.freeze));
    renderRoute();
    if (!$("#guideWindow").hidden) renderWorkflow();
  }

  function setRuntimeReady(value, status = null) {
    runtimeReady = value;
    $("#runAllButton").disabled = !value;
    if (status) $("#runtimeStatus").textContent = status;
    renderRoute();
  }

  function renderRoute() {
    const strip = $("#routeStrip"); strip.replaceChildren();
    routeTasks.forEach((item, index) => {
      const state = routeButtonState(routeTasks, cells, index, {runtimeReady, testSetOpened});
      const button = document.createElement("button"); button.type = "button"; button.className = "route-card";
      button.style.setProperty("--stage-color", colorFor(index));
      button.dataset.state = state.status;
      button.disabled = state.blocked;
      button.title = state.message;
      button.innerHTML = `<span class="route-number">${String(index + 1).padStart(2,"0")}</span><span><span class="route-title"></span><span class="route-caption"></span></span><span class="route-arrow">${state.status === "done" ? "✓" : state.status === "stale" ? "↻" : "→"}</span>`;
      $(".route-title", button).textContent = item.title;
      $(".route-caption", button).textContent = item.caption;
      button.addEventListener("click", async () => {
        let cell = cells.find(value => value.taskId === item.id);
        if (!cell) cell = addRouteCell(item, false);
        await runCell(cell);
      });
      strip.append(button);
    });
  }

  function addCell(code = "# pandas, NumPy, Seaborn and Matplotlib are ready as pd, np, sns and plt\n", label = "Custom Python", taskId = null, render = true) {
    const cell = {id:`cell-${++cellSequence}`, number:cellSequence, taskId, label, stage:taskId || "custom", code, status:"ready", output:null, lastRunCode:null};
    cells.push(cell);
    if (render) { renderNotebookView(); renderRoute(); }
    return cell;
  }

  function addRouteCell(item, render = true) {
    return addCell(item.code, item.title, item.id, render);
  }

  function syncNotebookStatusLabels() {
    $$(".cell", $("#notebookPanel")).forEach(article => {
      const cell = cells.find(value => value.id === article.dataset.cellId);
      if (!cell) return;
      article.dataset.status = cell.status;
      const statusLabel = $(".cell-footer span:last-child", article);
      if (statusLabel) statusLabel.textContent = cell.status;
    });
  }

  function invalidateRouteFrom(taskId, {renderNotebook = false, message = "Workflow changed — rerun from this step."} = {}) {
    const result = invalidateCellsFrom(routeTasks, cells, taskId);
    if (!result.changed) return false;
    workspaceToken += 1;
    if (renderNotebook) renderNotebookView();
    else {
      syncNotebookStatusLabels();
      renderOutputs();
    }
    renderRoute();
    updateSeal();
    showToast(message);
    return true;
  }

  function removeCell(cell) {
    const routeTaskId = cell.taskId;
    cells = cells.filter(value => value.id !== cell.id);
    if (routeTaskId) invalidateRouteFrom(routeTaskId);
    renderNotebookView(); renderRoute(); updateSeal();
  }

  function addExplorationCell() {
    const code = `# Free exploration · edit anything below
# Available aliases: pandas=pd, NumPy=np, Seaborn=sns, Matplotlib=plt
explore_df = globals().get("model_df", df).copy()
numeric_columns = explore_df.select_dtypes(include=np.number).columns.tolist()
print("Shape:", explore_df.shape)
if numeric_columns:
    fig, ax = plt.subplots(figsize=(7, 3.8))
    sns.histplot(data=explore_df, x=numeric_columns[0], kde=True, ax=ax, color="#7651a6")
    ax.set_title(f"Explore {numeric_columns[0]}")
    fig.tight_layout()
explore_df.head(10)`;
    const cell = addCell(code, "Free data exploration", null, true);
    $("#notebookPanel").scrollTop = $("#notebookPanel").scrollHeight;
    return cell;
  }

  function renderNotebook() {
    const panel = $("#notebookPanel"); panel.replaceChildren();
    if (!cells.length) {
      const empty = document.createElement("div"); empty.className = "empty-notebook";
      empty.innerHTML = "<div><strong>CLICK STEP 01 TO BEGIN</strong><p>Each route block inserts an editable Python cell and immediately runs it. Follow the single route left to right, then delete cells and take over.</p></div>";
      panel.append(empty); return;
    }
    cells.forEach(cell => {
      const stack = document.createElement("div");
      stack.className = "cell-stack";
      stack.dataset.cellId = cell.id;
      const article = document.createElement("article"); article.className = "cell"; article.dataset.status = cell.status;
      article.dataset.cellId = cell.id;
      const head = document.createElement("div"); head.className = "cell-head";
      head.innerHTML = `<span class="cell-number">In [${cell.number}]</span><span class="cell-label"></span><span class="cell-stage"></span><span class="cell-spacer"></span>`;
      $(".cell-label", head).textContent = cell.label; $(".cell-stage", head).textContent = cell.stage;
      const finalLocked = cell.stage === "final" && testSetOpened;
      const run = document.createElement("button"); run.type = "button"; run.className = "cell-action run"; run.textContent = cell.status === "running" ? "running…" : finalLocked ? "used once" : "▶ run"; run.disabled = cell.status === "running" || finalLocked; run.addEventListener("click", () => runCell(cell));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "cell-action delete"; remove.textContent = "delete"; remove.addEventListener("click", () => removeCell(cell));
      head.append(run, remove);
      const editor = document.createElement("div"); editor.className = "code-editor";
      const rail = document.createElement("div"); rail.className = "line-rail";
      const highlight = document.createElement("pre"); highlight.className = "code-highlight"; highlight.setAttribute("aria-hidden", "true");
      const input = document.createElement("textarea"); input.className = "code-input"; input.spellcheck = false; input.value = cell.code;
      input.setAttribute("aria-label", `Editable Python code for ${cell.label}`);
      const syncHighlight = () => {
        try {
          highlight.innerHTML = highlightPython(cell.code);
          editor.classList.toggle("has-highlight", Boolean(cell.code && highlight.textContent));
        } catch {
          highlight.replaceChildren();
          editor.classList.remove("has-highlight");
        }
        highlight.style.height = input.style.height;
        highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
        rail.style.transform = `translateY(${-input.scrollTop}px)`;
      };
      const updateLines = () => {
        rail.textContent = input.value.split("\n").map((_, index) => index + 1).join("\n");
        input.style.height = "auto";
        input.style.height = `${Math.min(430, Math.max(76, input.scrollHeight))}px`;
        rail.style.height = input.style.height;
        syncHighlight();
      };
      input.addEventListener("input", () => {
        const changedAfterRun = Boolean(cell.taskId && cell.lastRunCode !== null && cell.lastRunCode !== input.value);
        cell.code = input.value;
        if (changedAfterRun && cell.status !== "stale") invalidateRouteFrom(cell.taskId);
        updateLines();
      });
      input.addEventListener("scroll", syncHighlight);
      input.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); runCell(cell); } });
      editor.append(rail, highlight, input);
      const foot = document.createElement("div"); foot.className = "cell-footer"; foot.innerHTML = `<span>editable Python · ⌘/Ctrl + Enter</span><span>${cell.status}</span>`;
      const inlineOutput = document.createElement("div");
      inlineOutput.className = "cell-inline-output";
      inlineOutput.dataset.outputFor = cell.id;
      article.append(head, editor, foot);
      stack.append(article, inlineOutput);
      panel.append(stack);
      updateLines();
    });
  }

  async function runCell(cell) {
    if (!runtimeReady) { showToast("The Python workspace is still loading.", true); return; }
    if (cell.stage === "final" && testSetOpened) { showToast("The final test has already been used in this walkthrough. Select Reset to start again.", true); return; }
    if (!cell.code.trim() || cell.status === "running") return;
    const token = workspaceToken;
    cell.status = "running"; renderNotebookView(); renderRoute();
    $("#outputStatus").textContent = `${cell.label} · running`;
    try {
      const response = await sendWorker("run", {code:cell.code});
      if (token !== workspaceToken) return;
      cell.output = response.output; cell.status = response.output.status === "ok" ? "done" : "error"; cell.lastRunCode = cell.code;
      if (cell.stage === "final" && cell.status === "done") testSetOpened = true;
      if (response.output.charts?.length) latestChart = response.output.charts.at(-1);
      $("#outputStatus").textContent = `${cell.label} · ${cell.status === "done" ? "ready" : "Python error"}`;
    } catch (error) {
      if (token !== workspaceToken) return;
      cell.status = "error"; cell.output = {status:"error", error:error.message, charts:[]}; cell.lastRunCode = cell.code;
      $("#outputStatus").textContent = `${cell.label} · Python error`;
      showToast(error.message, true);
    }
    renderNotebookView(); renderRoute(); updateSeal();
  }

  async function runAll() {
    if (!runtimeReady) { showToast("Wait for the Python workspace to finish loading.", true); return; }
    const token = workspaceToken;
    const firstIncomplete = firstIncompleteRouteIndex(routeTasks, cells);
    if (firstIncomplete < 0) return;
    for (const item of routeTasks.slice(firstIncomplete)) {
      if (token !== workspaceToken) return;
      let cell = cells.find(value => value.taskId === item.id);
      if (!cell) cell = addRouteCell(item, false);
      if (cell.status !== "done") await runCell(cell);
      if (token !== workspaceToken) return;
      if (cell.status !== "done") break;
    }
  }

  function outputTitle(label, meta) {
    const row = document.createElement("div"); row.className = "output-title"; row.innerHTML = "<span></span><span></span>";
    row.children[0].textContent = label; row.children[1].textContent = meta; return row;
  }

  function renderOutputItem(cell) {
    const result = cell.output, warnings = Array.isArray(result.warnings) ? result.warnings : [], item = document.createElement("article"); item.className = "output-item"; item.dataset.status = result.status; item.dataset.warnings = warnings.length ? "true" : "false";
    const statusLabel = result.status === "ok" ? warnings.length ? "WARNING" : "OK" : "ERROR";
    item.innerHTML = `<span class="output-number">${String(cell.number).padStart(2,"0")}</span><div class="output-item-head"><strong></strong><span>${statusLabel}</span></div>`;
    $("strong", item).textContent = cell.label;
    if (result.status !== "ok") {
      item.append(outputTitle("Python needs a repair", "traceback"));
      const pre = document.createElement("pre"); pre.className = "console-output error"; pre.textContent = result.error || result.stderr || "Unknown Python error"; item.append(pre); return item;
    }
    if (result.table) { item.append(outputTitle("Table result", `${result.table.rowCount} rows · ${result.table.columnCount} cols`)); const table = document.createElement("div"); tablePayload(table, result.table); item.append(table); }
    result.charts?.forEach((chart, index) => {
      item.append(outputTitle(`Chart ${index + 1}`, "PNG preview"));
      const wrap = document.createElement("div"); wrap.className = "chart-wrap"; const image = document.createElement("img"); image.src = chart; image.alt = `Chart ${index + 1} generated by ${cell.label}`; wrap.append(image); item.append(wrap);
    });
    if (warnings.length) {
      item.append(outputTitle("Python warning", `${warnings.length} captured · cell succeeded`));
      const pre = document.createElement("pre"); pre.className = "console-output warning"; pre.textContent = warnings.map(warning => `${warning.category || "Warning"}: ${warning.message || warning}`).join("\n"); item.append(pre);
    }
    if (result.value) { item.append(outputTitle("Value", "Python expression")); const pre = document.createElement("pre"); pre.className = "console-output"; pre.textContent = result.value; item.append(pre); }
    if (result.stdout || result.stderr) { item.append(outputTitle("Console", result.stdout && result.stderr ? "stdout + stderr" : result.stderr ? "stderr" : "stdout")); const pre = document.createElement("pre"); pre.className = "console-output"; pre.textContent = [result.stdout, result.stderr].filter(Boolean).join("\n"); item.append(pre); }
    if (!result.table && !result.charts?.length && !result.value && !warnings.length && !result.stdout && !result.stderr) { const note = document.createElement("p"); note.className = "result-note"; note.textContent = "Cell ran successfully and updated the shared Python workspace."; item.append(note); }
    return item;
  }

  function renderOutputs() {
    const list = $("#outputList"), complete = cells.filter(cell => cell.output);
    latestChart = [...complete].reverse().find(cell => cell.output?.status === "ok" && cell.output.charts?.length)?.output.charts.at(-1) || null;
    list.replaceChildren();
    $$(".cell-inline-output", $("#notebookPanel")).forEach(host => {
      host.replaceChildren();
      host.closest(".cell-stack")?.classList.remove("has-output");
    });
    if (!complete.length) {
      const empty = document.createElement("div"); empty.className = "output-empty";
      empty.innerHTML = "<div><div class='output-glyph'>↗</div><b>Your walkthrough report appears here.</b><p>Tables, plots, validation scores, tuning evidence and the one-time final result stay attached to their cells.</p></div>";
      list.append(empty); $("#downloadChartButton").disabled = true; $("#outputStatus").textContent = "No cell run yet"; return;
    }
    if (mobileLayoutQuery.matches) {
      const hosts = new Map($$(".cell-inline-output", $("#notebookPanel")).map(host => [host.dataset.outputFor, host]));
      complete.forEach(cell => {
        const host = hosts.get(cell.id);
        if (!host) return;
        host.append(renderOutputItem(cell));
        host.closest(".cell-stack")?.classList.add("has-output");
      });
      const note = document.createElement("div");
      note.className = "output-mobile-note";
      note.textContent = "Results are attached below each cell on this screen.";
      list.append(note);
    } else {
      complete.forEach(cell => list.append(renderOutputItem(cell)));
    }
    $("#downloadChartButton").disabled = !latestChart;
    $("#outputBody").scrollTop = $("#outputBody").scrollHeight;
  }

  function renderNotebookView() {
    renderNotebook();
    renderOutputs();
  }

  function updateSeal() {
    const unsupervised = selectedModel()?.task === "unsupervised", used = testSetOpened;
    const badge = $("#sealBadge");
    badge.textContent = unsupervised ? "TARGET NOT USED" : used ? "TEST SET USED ONCE" : "TEST SET SEALED";
    badge.classList.toggle("used", used);
    $("#holdoutState").textContent = unsupervised ? "not applicable" : used ? "opened once" : "sealed";
    $(".privacy-note").textContent = unsupervised
      ? "Unsupervised models discover structure without fitting to the reference target."
      : "The saved 20% test set stays untouched until the final step of this walkthrough. Changing the model or using editable cells can reuse the deterministic holdout; the one-use rule protects one setup from repeated checking.";
  }

  function clearNotebook(message = "Notebook cleared; the test set is sealed again.") {
    cells = []; cellSequence = 0; latestChart = null; testSetOpened = false;
    $("#outputStatus").textContent = "No cell run yet";
    renderNotebookView(); renderRoute(); updateSeal();
    if (message) showToast(message);
  }

  async function resetWorkerWorkspace(keepData = true) {
    await sendWorker("reset", {keepData});
  }

  async function resetNotebook() {
    const token = ++workspaceToken;
    clearNotebook("Resetting the modelling workspace; the loaded raw data will stay available.");
    setRuntimeReady(false, "Resetting the modelling workspace…");
    $("#runtimeDot").className = "runtime-dot";
    try {
      await resetWorkerWorkspace(true);
      if (token !== workspaceToken) return;
      $("#runtimeDot").className = "runtime-dot ready";
      setRuntimeReady(true, "Pyodide 0.26.4 ready · raw data retained · modelling state reset");
    } catch (error) {
      if (token !== workspaceToken) return;
      $("#runtimeDot").className = "runtime-dot error";
      setRuntimeReady(false, "Python workspace unavailable · reload to retry");
      showToast("Workspace reset failed: " + error.message, true);
    }
  }

  async function rebuildSetup({scenarioChanged = false} = {}) {
    const token = ++workspaceToken;
    const oldModel = selectedModelId();
    if (scenarioChanged) populateModels(oldModel);
    staticSetup(); buildRoute(); clearNotebook("");
    setRuntimeReady(false, "Resetting the Python workspace…");
    $("#runtimeDot").className = "runtime-dot";
    showToast("Complete walkthrough rebuilt for the new setup.");
    try {
      await resetWorkerWorkspace(true);
      if (token !== workspaceToken) return;
      $("#runtimeDot").className = "runtime-dot ready";
      setRuntimeReady(true, "Pyodide 0.26.4 ready · modelling workspace reset");
    } catch (error) {
      if (token !== workspaceToken) return;
      $("#runtimeDot").className = "runtime-dot error";
      setRuntimeReady(false, "Python workspace unavailable · reload to retry");
      showToast(`Python workspace reset failed: ${error.message}`, true);
    }
  }

  async function loadDataset(id) {
    const token = ++workspaceToken;
    currentDatasetId = id;
    populateScenarios(); populateModels(); staticSetup(); buildRoute(); clearNotebook("");
    setRuntimeReady(false, `Reading ${selectedConfig().name}…`);
    $("#preview").innerHTML = "<div style='padding:9px;color:#697084;font-size:.6rem'>Loading clean preview…</div>";
    $("#runtimeDot").className = "runtime-dot";
    let csv;
    try {
      csv = await getDatasetText(selectedConfig());
      if (token !== workspaceToken) return;
      tablePayload($("#preview"), parsePreview(csv, selectedConfig().sep), true);
      $("#runtimeStatus").textContent = "Dataset ready · starting Python runtime…";
    } catch (error) {
      if (token !== workspaceToken) return;
      $("#runtimeStatus").textContent = "Dataset unavailable · see message";
      $("#runtimeDot").className = "runtime-dot error";
      showToast(error.message, true); return;
    }
    try {
      await resetWorkerWorkspace(false);
      if (token !== workspaceToken) return;
      const response = await sendWorker("init", {csv, sep:selectedConfig().sep, prepare:selectedConfig().prepare});
      if (token !== workspaceToken) return;
      $("#rowMetric").textContent = response.profile.rows.toLocaleString();
      tablePayload($("#preview"), response.profile.preview, true);
      $("#runtimeStatus").textContent = `Pyodide 0.26.4 ready · ${response.profile.missing} missing values in selected data`;
      $("#runtimeDot").className = "runtime-dot ready";
      $("#outputStatus").textContent = "No cell run yet";
      setRuntimeReady(true);
    } catch (error) {
      if (token !== workspaceToken) return;
      $("#runtimeStatus").textContent = "Python runtime unavailable · reload to retry";
      $("#runtimeDot").className = "runtime-dot error";
      setRuntimeReady(false);
      showToast(`Python runtime failed: ${error.message}`, true);
    }
  }

  function showToast(message, error = false) {
    const toast = $("#toast"); toast.textContent = message; toast.classList.toggle("error", error); toast.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function toggleTheme() {
    const light = document.body.dataset.theme === "light";
    document.body.dataset.theme = light ? "dark" : "light";
    $("#themeButton").setAttribute("aria-label", `Switch to ${light ? "light" : "dark"} theme`);
    $("#themeIcon").innerHTML = light
      ? '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>'
      : '<path d="M20 15.3A8.5 8.5 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3z"></path>';
  }

  function updateWorkflowProgress() {
    const body = $("#guideBody"), steps = $$(".workflow-step", body);
    if (!steps.length) return;
    const guideTop = body.getBoundingClientRect().top + 118;
    let activeIndex = 0;
    steps.forEach((step, index) => { if (step.getBoundingClientRect().top <= guideTop) activeIndex = index; });
    steps.forEach((step, index) => step.classList.toggle("is-active", index === activeIndex));
    $("#workflowProgressLabel").textContent = `Step ${activeIndex + 1} of ${steps.length}`;
    $("#workflowProgressBar").style.width = `${((activeIndex + 1) / steps.length) * 100}%`;
  }

  function renderWorkflow() {
    const body = $("#guideBody"), config = selectedConfig(), value = selectedScenario(), model = selectedModel();
    body.replaceChildren();
    $("#guideSubtitle").textContent = `${config.name} · ${value.name} · ${model.name}${model.task === "unsupervised" ? "" : ` · ${$("#foldSelect").value} folds`}`;
    $("#guideDeckCount").textContent = `${routeTasks.length} steps · same code as the route`;

    const intro = document.createElement("p"); intro.className = "workflow-intro";
    intro.innerHTML = "Each step answers one beginner question. <strong>Every title, explanation, and code block below comes directly from the current Suggested Route.</strong> Type the cell, run it, and inspect the output before continuing.";
    const progress = document.createElement("div"); progress.className = "workflow-progress";
    progress.innerHTML = `<b>Manual walkthrough</b><span id="workflowProgressLabel">Step 1 of ${routeTasks.length}</span><span class="workflow-meter"><span id="workflowProgressBar"></span></span>`;
    const story = document.createElement("div"); story.className = "workflow-story";

    routeTasks.forEach((item, index) => {
      const step = document.createElement("article"); step.className = "workflow-step"; step.dataset.taskId = item.id; step.style.setProperty("--step-color", colorFor(index));
      const number = document.createElement("span"); number.className = "workflow-step-number"; number.textContent = String(index + 1).padStart(2,"0");
      const head = document.createElement("div"); head.className = "workflow-step-head";
      const copy = document.createElement("div");
      const kicker = document.createElement("span"); kicker.className = "workflow-step-kicker"; kicker.textContent = `Step ${String(index + 1).padStart(2,"0")} of ${routeTasks.length}`;
      const title = document.createElement("strong"); title.className = "workflow-step-title"; title.textContent = item.title;
      const caption = document.createElement("span"); caption.className = "workflow-step-caption"; caption.textContent = item.caption;
      copy.append(kicker, title); head.append(copy, caption);
      const note = document.createElement("p"); note.className = "workflow-step-note"; note.textContent = item.question;
      const typeNote = document.createElement("p"); typeNote.className = "workflow-type-note"; typeNote.textContent = "Type, run, and inspect this cell";
      const code = document.createElement("pre"); code.className = "workflow-code"; code.dataset.taskId = item.id; code.innerHTML = highlightPython(item.code); code.setAttribute("aria-label", `Exact Python for ${item.title}`);
      step.append(number, head, note, typeNote, code); story.append(step);
    });
    const foot = document.createElement("p"); foot.className = "workflow-foot";
    foot.textContent = "Changing the dataset, feature scenario, model, or fold count rebuilds this workflow from the same source as the route above. The final test is used once per walkthrough/setup; changing the model or using editable cells can reuse the deterministic holdout. Custom cells are unrestricted. Reset starts a new teaching run.";
    body.append(intro, progress, story, foot);
    body.scrollTop = 0; body.onscroll = updateWorkflowProgress;
    requestAnimationFrame(updateWorkflowProgress);
  }

  function closeWorkflow() {
    $("#guideWindow").hidden = true;
    $("#guideButton").setAttribute("aria-expanded", "false");
    $("#guideButton").focus();
  }

  function openWorkflow() {
    renderWorkflow();
    $("#guideWindow").hidden = false;
    clampGuideToViewport();
    $("#guideButton").setAttribute("aria-expanded", "true");
    $("#guideClose").focus();
  }

  function moveGuide(event) {
    if (!guideDragState) return;
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    const left = Math.max(8, Math.min(innerWidth - rect.width - 8, event.clientX - guideDragState.offsetX));
    const top = Math.max(8, Math.min(innerHeight - rect.height - 8, event.clientY - guideDragState.offsetY));
    Object.assign(windowElement.style, {left:`${left}px`, top:`${top}px`, right:"auto", bottom:"auto"});
  }

  function stopGuideDrag() {
    guideDragState = null; $("#guideWindow").classList.remove("is-dragging");
    window.removeEventListener("pointermove", moveGuide);
  }

  function startGuideDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button")) return;
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    guideDragState = {offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top};
    windowElement.classList.add("is-dragging");
    window.addEventListener("pointermove", moveGuide); window.addEventListener("pointerup", stopGuideDrag, {once:true}); window.addEventListener("pointercancel", stopGuideDrag, {once:true});
    event.preventDefault();
  }

  function startGuideResize(event) {
    const handle = event.target.closest(".guide-resize-handle");
    if (!handle) return;
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    guideViewportSized = false;
    guideResizeState = {direction:handle.dataset.resize,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top,width:rect.width,height:rect.height};
    windowElement.classList.add("is-resizing");
    window.addEventListener("pointermove", moveGuideResize); window.addEventListener("pointerup", stopGuideResize, {once:true}); window.addEventListener("pointercancel", stopGuideResize, {once:true});
    event.preventDefault(); event.stopPropagation();
  }

  function moveGuideResize(event) {
    if (!guideResizeState) return;
    const windowElement = $("#guideWindow"), state = guideResizeState, direction = state.direction;
    const minWidth = Math.min(parseFloat(getComputedStyle(windowElement).minWidth) || 320, innerWidth - 16);
    const minHeight = Math.min(parseFloat(getComputedStyle(windowElement).minHeight) || 300, innerHeight - 16);
    const right = state.left + state.width, bottom = state.top + state.height;
    let {left,top,width,height} = state;
    if (direction.includes("e")) width = Math.max(minWidth, Math.min(innerWidth - 8 - left, state.width + event.clientX - state.startX));
    if (direction.includes("s")) height = Math.max(minHeight, Math.min(innerHeight - 8 - top, state.height + event.clientY - state.startY));
    if (direction.includes("w")) { left = Math.max(8, Math.min(right - minWidth, state.left + event.clientX - state.startX)); width = right - left; }
    if (direction.includes("n")) { top = Math.max(8, Math.min(bottom - minHeight, state.top + event.clientY - state.startY)); height = bottom - top; }
    Object.assign(windowElement.style, {left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,right:"auto",bottom:"auto"});
  }

  function stopGuideResize() {
    guideResizeState = null; $("#guideWindow").classList.remove("is-resizing");
    window.removeEventListener("pointermove", moveGuideResize);
  }

  function clampGuideToViewport() {
    const windowElement = $("#guideWindow"); if (windowElement.hidden) return;
    const maxWidth = Math.max(0, innerWidth - 16), maxHeight = Math.max(0, innerHeight - 16);
    if (!mobileLayoutQuery.matches && guideViewportSized) {
      windowElement.style.removeProperty("width");
      windowElement.style.removeProperty("height");
      guideViewportSized = false;
    }
    const rect = windowElement.getBoundingClientRect(), width = Math.min(rect.width, maxWidth), height = Math.min(rect.height, maxHeight);
    if (rect.width > maxWidth || rect.height > maxHeight) guideViewportSized = true;
    const left = Math.max(8, Math.min(innerWidth - width - 8, rect.left)), top = Math.max(8, Math.min(innerHeight - height - 8, rect.top));
    const styles = {left:`${left}px`,top:`${top}px`,right:"auto",bottom:"auto"};
    if (rect.width > maxWidth) styles.width = `${width}px`;
    if (rect.height > maxHeight) styles.height = `${height}px`;
    Object.assign(windowElement.style, styles);
  }

  function downloadChart() {
    if (!latestChart) return;
    const link = document.createElement("a"); link.href = latestChart; link.download = `${currentDatasetId}-${selectedModelId()}-chart.png`; link.click(); showToast("Latest chart downloaded.");
  }

  if (TEST_MODE) {
    window.__ML_ROUTE_TEST_API__ = Object.freeze({DATASETS, MODELS, compatible, routeForSelection, modelSpec, ONE_R_HELPER_SOURCE, DATAFRAME_SERIALIZER_SOURCE, RESET_WORKSPACE_SOURCE, WORKER_SOURCE, invalidateCellsFrom, firstIncompleteRouteIndex, routeButtonState});
  } else {
  $("#datasetSelect").addEventListener("change", event => loadDataset(event.target.value));
  $("#scenarioSelect").addEventListener("change", () => { void rebuildSetup({scenarioChanged:true}); });
  $("#modelSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#foldSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#exploreButton").addEventListener("click", addExplorationCell);
  $("#addCellButton").addEventListener("click", () => addCell());
  $("#runAllButton").addEventListener("click", runAll);
  $("#resetButton").addEventListener("click", () => { void resetNotebook(); });
  $("#downloadChartButton").addEventListener("click", downloadChart);
  $("#themeButton").addEventListener("click", toggleTheme);
  $("#guideButton").addEventListener("click", openWorkflow);
  $("#guideClose").addEventListener("click", closeWorkflow);
  $("#guideDragHandle").addEventListener("pointerdown", startGuideDrag);
  $("#guideWindow").addEventListener("pointerdown", startGuideResize);
  window.addEventListener("resize", clampGuideToViewport);
  mobileLayoutQuery.addEventListener("change", () => renderOutputs());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("#guideWindow").hidden) closeWorkflow();
  });

  populateDatasets(); populateScenarios(); populateModels(); staticSetup(); buildRoute(); renderNotebookView(); updateSeal(); loadDataset("breast");

  }
})();
