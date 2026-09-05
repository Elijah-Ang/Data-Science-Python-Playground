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
  const mobileLayoutQuery = window.matchMedia("(max-width:1120px)");
  const TEST_MODE = Boolean(window.__ML_TEST_MODE__);

  const scenario = (id, name, continuous = [], binary = [], categorical = []) => ({id, name, continuous, binary, categorical});
  const DATASETS = {
    breast: {
      name:"Breast Cancer Wisconsin (Diagnostic)", file:"data/breast-cancer.csv", embedded:"breast", sep:",", rows:569, task:"classification", target:"diagnosis", split:"stratified", missing:false, binaryNumeric:[],
      description:"Clean cell-nucleus measurements with a malignant/benign target.", question:"Can continuous measurements separate the two diagnoses?", rowMeaning:"one tumour sample",
      source:"https://archive.ics.uci.edu/dataset/17/breast-cancer-wisconsin-diagnostic", sourceLabel:"UCI Breast Cancer Wisconsin", sourceNote:"569 rows · 30 continuous predictors · no missing values", prepare:"df",
      scenarios:[
        scenario("continuous5","All features continuous · 5 less-redundant measures",["radius_mean","texture_mean","smoothness_mean","concavity_mean","symmetry_mean"]),
        scenario("continuous30","All features continuous · all 30",ALL_BREAST)
      ]
    },
    penguins: {
      name:"Palmer Penguins · cleaned", file:"data/palmer-penguins.csv", embedded:"penguins", sep:",", rows:333, task:"classification", target:"species", split:"stratified", missing:false, binaryNumeric:[],
      description:"Complete measurements and context for three penguin species.", question:"How does preprocessing change as feature types are combined?", rowMeaning:"one penguin",
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
      description:"Six fully categorical car attributes with four acceptability classes.", question:"What changes when every predictor is categorical?", rowMeaning:"one car",
      source:"https://archive.ics.uci.edu/dataset/19/car+evaluation", sourceLabel:"UCI Car Evaluation", sourceNote:"1,728 rows · all categorical · no missing values", prepare:"df",
      scenarios:[scenario("categorical","All features categorical",[],[],["buying","maintenance","doors","persons","luggage_boot","safety"])]
    },
    candy_class: {
      name:"Candy Popularity · binary target", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"classification", target:"popular", split:"stratified", missing:false, binaryNumeric:CANDY_BINARY, theme:"candy",
      description:"Ingredient flags and dataset-relative percentiles with a fixed majority-win target.", question:"Can binary ingredients classify a candy as winning at least half its matchups?", rowMeaning:"one candy",
      source:"https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking", sourceLabel:"FiveThirtyEight Candy Power Ranking", sourceNote:"85 rows · clean · target fixed at a 50% win rate", prepare:"df.assign(popular=np.where(df['winpercent'] >= 50, '50% or above', 'below 50%'))",
      scenarios:[
        scenario("binary","All features binary",[],CANDY_BINARY),
        scenario("continuous_binary","Continuous + binary",["sugarpercent","pricepercent"],CANDY_BINARY)
      ]
    },
    wine: {
      name:"Wine Quality", file:"data/wine-quality.csv", embedded:"wine", sep:";", rows:5320, task:"regression", target:"quality", split:"random", missing:false, binaryNumeric:[],
      description:"Wine chemistry and type with an ordered 0–10 sensory score treated as regression.", question:"Can chemistry estimate quality, and does the relationship curve?", rowMeaning:"one wine sample",
      source:"https://archive.ics.uci.edu/dataset/186/wine+quality", sourceLabel:"UCI Wine Quality", sourceNote:"5,320 distinct rows · exact duplicates removed before splitting", prepare:"df.drop_duplicates().reset_index(drop=True)",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["alcohol"]),
        scenario("continuous","Multiple continuous features",CHEMISTRY),
        scenario("continuous_binary","Continuous + binary",CHEMISTRY,["wine_type"])
      ]
    },
    seoul: {
      name:"Seoul Bike Sharing Demand", file:"data/seoul-bike.csv", embedded:"seoul", sep:",", rows:8760, task:"regression", target:"Rented Bike Count", split:"time", missing:false, binaryNumeric:[],
      description:"Hourly demand, weather and calendar context in chronological order.", question:"Can we predict later demand without leaking future rows backward?", rowMeaning:"one hourly rental observation",
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
      description:"A 2007 snapshot from the archived five-year Gapminder teaching extract.", question:"Is the wealth–longevity relationship straight or curved?", rowMeaning:"one country in 2007",
      source:"https://www.gapminder.org/free-material/", sourceLabel:"Gapminder free material · CC BY 4.0", sourceNote:"Adapted local copy · 142 countries in 2007 · one leakage-safe snapshot", prepare:"df[df['year'].eq(2007)].copy()",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["gdpPercap"]),
        scenario("continuous","Multiple continuous features",["gdpPercap","pop"])
      ]
    },
    candy: {
      name:"Candy Power Ranking", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"regression", target:"winpercent", split:"random", missing:false, binaryNumeric:CANDY_BINARY,
      description:"Ingredient flags, dataset-relative sugar/price percentiles and head-to-head win rate.", question:"How do percentile measures and binary ingredients relate to popularity?", rowMeaning:"one candy",
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
    naive_bayes:{name:"Naive Bayes", family:"Classification", task:"classification", metric:"macro F1 · accuracy", pureInput:true, scale:false, preprocessNote:"Scaling is not required because the selected Naive Bayes family models class-conditional feature evidence/distributions directly."},
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


class OneRPreprocessor(BaseEstimator, TransformerMixin):
    """Public adapter that carries feature types through One-R preparation.

    When no base transformer is supplied, the adapter creates a fold-local
    passthrough/ordinal recipe from the named numeric and categorical columns.
    """
    def __init__(self, base_preprocessor=None, numeric_features=None, categorical_features=None):
        # Read notebooks from the first implementation without exposing its
        # positional mask in new route code.
        if categorical_features is None and numeric_features is not None:
            try:
                legacy_mask = np.asarray(numeric_features, dtype=bool)
                if legacy_mask.ndim == 1 and all(isinstance(value, (bool, np.bool_)) for value in numeric_features):
                    self._legacy_categorical_mask = legacy_mask
                    numeric_features = None
            except (TypeError, ValueError):
                pass
        self.base_preprocessor = base_preprocessor
        self.numeric_features = numeric_features
        self.categorical_features = categorical_features

    def fit(self, X, y=None):
        base = self.base_preprocessor
        if base is None:
            from sklearn.compose import ColumnTransformer
            from sklearn.preprocessing import OrdinalEncoder
            numeric = list(self.numeric_features or [])
            categorical = list(self.categorical_features or [])
            if numeric and categorical:
                base = ColumnTransformer([
                    ("numeric", "passthrough", numeric),
                    ("categorical", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical)
                ], verbose_feature_names_out=False)
            elif categorical:
                base = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
            else:
                base = "passthrough"
        if isinstance(base, str) and base == "passthrough":
            self.transformer_ = "passthrough"
        else:
            self.transformer_ = clone(base)
            self.transformer_.fit(X, y)
        input_names = np.asarray(list(X.columns) if hasattr(X, "columns") else np.arange(X.shape[1]), dtype=object)
        if self.transformer_ == "passthrough":
            self.feature_names_out_ = input_names
        elif hasattr(self.transformer_, "get_feature_names_out"):
            self.feature_names_out_ = np.asarray(self.transformer_.get_feature_names_out(input_names), dtype=object)
        else:
            self.feature_names_out_ = input_names
        categorical = {str(name) for name in (self.categorical_features or [])}
        self.categorical_mask_ = getattr(self, "_legacy_categorical_mask", np.asarray([
            str(name) in categorical or any(str(name).startswith(str(source) + "_") for source in categorical)
            for name in self.feature_names_out_
        ], dtype=bool))
        if self.categorical_mask_.shape != (len(self.feature_names_out_),):
            raise ValueError("One-R feature-type metadata does not match the transformed features.")
        self.categorical_mask = self.categorical_mask_.copy()
        return self

    def transform(self, X):
        values = X if isinstance(self.transformer_, str) and self.transformer_ == "passthrough" else self.transformer_.transform(X)
        return _OneRFeatureMatrix(values, self.categorical_mask_)

    def get_feature_names_out(self, input_features=None):
        if hasattr(self, "feature_names_out_"):
            return self.feature_names_out_
        if input_features is None:
            return np.arange(len(self.categorical_features or self.numeric_features or []), dtype=object)
        return np.asarray(input_features, dtype=object)


# Kept as a compatibility alias for saved notebooks created before the public
# adapter was introduced. New route code uses OneRPreprocessor directly.
_OneRFeaturePreprocessor = OneRPreprocessor


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

  const DATAFRAME_SERIALIZER_SOURCE = window.DataframeSerializerSource;

  const PRACTICE_VALIDATOR_SOURCE = window.ScientificValidatorSource;

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

  const PYODIDE_INDEX_URL = window.AppPlatform?.pyodideIndexUrl || "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const SEABORN_REQUIREMENT = window.AppPlatform?.seabornRequirement || "seaborn==0.13.2";
  const WORKER_SOURCE = `
importScripts(${JSON.stringify(PYODIDE_INDEX_URL + "pyodide.js")});
let pyodide, ready = false, bootPromise = null;
let baselineValues = null;
let rawDataSnapshot = null;
let queue = Promise.resolve();
async function boot() {
  if (ready) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    pyodide = await loadPyodide({indexURL:${JSON.stringify(PYODIDE_INDEX_URL)}});
    await pyodide.loadPackage(["pandas","numpy","matplotlib","scipy","scikit-learn","micropip"]);
    await pyodide.runPythonAsync(${JSON.stringify(`import micropip; await micropip.install(${JSON.stringify(SEABORN_REQUIREMENT)})`)});
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
    await pyodide.runPythonAsync(${py(PRACTICE_VALIDATOR_SOURCE)});
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
      pyodide.globals.set("__practice_validation_json", null);
      pyodide.globals.set("__practice_validation_spec", null);
      if (data.validation) pyodide.globals.set("__practice_validation_spec", JSON.stringify(data.validation));
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
__stdout, __stderr = BoundedOutputStream(), BoundedOutputStream()
__result, __error, __last_display = None, None, None
__primary_result = None
__caught_warnings = []
if __plt_from_worker is not None:
    __plt_from_worker.close("all")
try:
    with __warnings_from_worker.catch_warnings(record=True) as __warning_records:
        __caught_warnings = __warning_records
        __warnings_from_worker.simplefilter("always")
        with __contextlib_from_worker.redirect_stdout(__stdout), __contextlib_from_worker.redirect_stderr(__stderr):
            def __run_segment(__source, __label):
                if not __source or not __source.strip():
                    return None
                __tree = __ast_from_worker.parse(__source, mode="exec")
                if __tree.body and isinstance(__tree.body[-1], __ast_from_worker.Expr):
                    __last = __tree.body.pop()
                    exec(compile(__tree, "<" + __label + ">", "exec"), globals())
                    return eval(compile(__ast_from_worker.Expression(__last.value), "<" + __label + ">", "eval"), globals())
                exec(compile(__tree, "<" + __label + ">", "exec"), globals())
                return __last_display
            __primary_result = __run_segment(__cell_code, "cell")
            # A cell's visible source owns its result. Optional diagnostic
            # evidence is inserted as a separate editable cell, so hidden
            # setup/evidence cannot replace the learner's last expression.
            __result = __primary_result
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
    try:
        __value = str(__result)
        if len(__value) > 20000: __value = __value[:20000] + " [Output truncated at 20,000 characters]"
    except Exception: pass
if __error is None and "__practice_validation_spec" in globals():
    try:
        __practice_validation_json = __json_from_worker.dumps(validate_practice_exercise(__json_from_worker.loads(__practice_validation_spec)))
    except Exception as __validation_error:
        __practice_validation_json = __json_from_worker.dumps({"ok":False, "message":"Semantic check could not run: " + str(__validation_error)})
    globals().pop("__practice_validation_spec", None)
__validation = __json_from_worker.loads(__practice_validation_json) if globals().get("__practice_validation_json") else None
__json_from_worker.dumps({"status":"error" if __error else "ok", "error":__error, "warnings":__warnings, "stdout":__stdout.getvalue(), "stderr":__stderr.getvalue(), "table":__table, "charts":__charts, "value":__value, "validation":__validation}, default=str)
\`);
      post(id, {ok:true, output:JSON.parse(raw)});
      return;
    }
    throw new Error("Unknown worker message");
  } catch (error) { post(id, {ok:false, error:error?.message || String(error)}); }
}
self.onmessage = event => { queue = queue.then(() => handle(event.data)); };
`;

  const bridge = TEST_MODE ? {busy:false,send:()=>Promise.resolve({})} : window.createPythonBridge(WORKER_SOURCE, {
    onError:error => {setRuntimeReady(false, 'Python stopped — select Stop / restart Python'); showToast(error.message,true);}
  });
  let messageId = 0;
  const sendWorker = (type,payload={}) => {messageId++; return bridge.send(type,payload);};

  let currentDatasetId = "breast";
  let cachedPreviewPayload = null;
  let notebookCsv = "";
  let cells = [];
  let routeTasks = [];
  let cellSequence = 0;
  let workspaceToken = 0;
  let runtimeReady = false;
  let testSetOpened = false;
  let latestChart = null;
  const playgroundMode = "guided"; // One current workflow; no selectable mode state.
  let practiceSetupIdentity = "";
  const practiceStates = new Map();
  let independentCheckpointState = null;
  let guideDragState = null;
  let guideResizeState = null;
  let guideViewportSized = false;
  let guideMinimized = false;
  let guideRestoreSize = null;

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

  function practiceRouteIdentity(datasetId, scenarioId, modelId, folds) {
    return [datasetId, scenarioId, modelId, folds].map(value => String(value)).join("::");
  }

  function practiceStateKey(identity, taskId) {
    return `${String(identity)}::${String(taskId)}`;
  }

  function normalizePracticeAnswer(value, practice = null) {
    const answer = value == null ? "" : String(value).trim();
    if (!answer) return null;
    if (!practice?.options?.length) return answer;
    return practice.options.some(option => String(option.value) === answer) ? answer : null;
  }

  function practiceOption(value, label) {
    return {value, label};
  }

  function practicePrediction(id, prompt, options, answer = null, evidence = "generic") {
    return {
      id,
      prompt,
      options:[...options, practiceOption("not_sure", "Not sure yet")],
      answer,
      evidence
    };
  }

  function practiceDecision(id, prompt, options, evidence = "decision") {
    return {
      id,
      prompt,
      options:[...options, practiceOption("not_sure", "Not sure yet")],
      evidence
    };
  }

  function practiceExerciseForTask(config, value, modelId, taskId, folds = 5) {
    const model = MODELS[modelId];
    if (!model) return null;
    if (taskId === "baseline" && model.task !== "unsupervised") {
      const splitterName = config.split === "time" ? "TimeSeriesSplit" : config.task === "classification" ? "StratifiedKFold" : "KFold";
      const splitter = config.split === "time"
        ? `${splitterName}(n_splits=${folds})`
        : `${splitterName}(n_splits=${folds}, shuffle=True, random_state=42)`;
      return {
        id:"cv-splitter-line",
        type:"complete_line",
        title:"Complete the cross-validation line",
        prompt:"Complete the validation-splitter line used by this route.",
        goal:`Create the ${folds}-fold ${config.split === "time" ? "time-aware" : "training-only"} validation splitter used by the evidence table.`,
        hint:`Use ${splitterName} with the route's ${folds} folds${config.split === "time" ? " and keep the chronological default" : ", shuffle=True, and random_state=42"}.`,
        expectedOutput:"A cv object and a fold table with validation scores.",
        required:["cv", `${folds}-fold validation splitter`, "training-only validation"],
        modelId,
        taskId,
        find:`cv = ${splitter}`,
        replacement:"# TODO: create the cross-validation splitter described above",
        solution:`cv = ${splitter}`,
        validation:{kind:"cv", task:config.task, split:config.split, folds}
      };
    }
    if (taskId === "model" && model.task !== "unsupervised") {
      const pipeline = modelId === "polynomial"
        ? "pipeline = Pipeline([\n    (\"polynomial\", polynomial),\n    (\"scale\", scale),\n    (\"model\", model)\n])"
        : "pipeline = Pipeline([\n    (\"prepare\", preprocessor),\n    (\"model\", model)\n])";
      const pipelineHint = modelId === "polynomial"
        ? "Keep the expansion, scaling, and estimator as the three named Pipeline steps."
        : "Keep the fitted estimator in a \"model\" step and the existing preprocessor in a \"prepare\" step.";
      return {
        id:"model-estimator-lines",
        type:"partial_code",
        title:"Connect the model pipeline",
        prompt:"Complete the real sklearn Pipeline that connects preparation to the estimator.",
        goal:"Connect the prepared inputs and the selected estimator into one Pipeline so validation can repeat the same workflow on each fold.",
        hint:pipelineHint,
        expectedOutput:"A pipeline with preparation and a fitted-model step.",
        required:modelId === "polynomial" ? ["model", "Pipeline", "polynomial → scale → model"] : ["model", "Pipeline", "prepare → model"],
        modelId,
        taskId,
        find:pipeline,
        replacement:"# TODO: connect preprocessor and model in a Pipeline",
        solution:pipeline,
        validation:{kind:"model", modelId}
      };
    }
    if (taskId === "fit" && modelId === "kmeans") {
      const fitLine = "kmeans = KMeans(n_clusters=selected_k, n_init=20, random_state=42)\nclusters = kmeans.fit_predict(X_scaled)";
      return {
        id:"kmeans-fit-line",
        type:"partial_code",
        title:"Complete the K-Means fit",
        prompt:"Complete the K-Means fit on the prepared feature matrix.",
        goal:"Fit K-Means on the prepared feature matrix using the selected number of clusters.",
        hint:"The number of groups is already stored in selected_k. Fit the KMeans estimator on X_scaled, then keep its labels for the profile step.",
        expectedOutput:"A fitted kmeans object and one cluster label for every row.",
        required:["KMeans", "selected_k", "clusters"],
        modelId,
        taskId,
        find:fitLine,
        replacement:"# TODO: fit KMeans on X_scaled using selected_k",
        solution:fitLine,
        validation:{kind:"kmeans", maxK:8}
      };
    }
    if (taskId === "fit" && modelId === "hierarchical") {
      const fitLine = "clusters = cut_tree(hierarchy, n_clusters=selected_k).ravel()";
      return {
        id:"hierarchical-fit-line",
        type:"partial_code",
        title:"Complete the hierarchy fit",
        prompt:"Complete the cut line for the selected hierarchy.",
        goal:"Cut the displayed Ward hierarchy at the selected number of groups so the sampled rows can receive cluster labels.",
        hint:"Use cut_tree on the existing hierarchy with n_clusters=selected_k, then call .ravel() to make one label per sampled row.",
        expectedOutput:"One cluster label for every sampled row from the displayed hierarchy.",
        required:["cut_tree", "hierarchy", "selected_k", "clusters"],
        modelId,
        taskId,
        find:fitLine,
        replacement:"# TODO: cut hierarchy using selected_k",
        solution:fitLine,
        validation:{kind:"hierarchical", maxK:8}
      };
    }
    if (taskId === "select" && modelId === "pca") {
      const selectLine = "components_for_target = int(target_row[\"component\"])";
      return {
        id:"pca-component-selection-line",
        type:"complete_line",
        title:"Complete the component-count line",
        prompt:"Complete the line that selects components from the active variance target.",
        goal:"Find the first component count whose cumulative explained variance reaches the active variance_target.",
        hint:"Use the first row of variance_table whose cumulative explained variance reaches variance_target, then read its component number.",
        expectedOutput:"components_for_target, variance_retained, and a matching X_reduced representation.",
        required:["components_for_target", "variance_target", "cumulative explained variance"],
        modelId,
        taskId,
        find:selectLine,
        replacement:"# TODO: read the first variance-table row that reaches variance_target",
        solution:selectLine,
        validation:{kind:"pca_selection"}
      };
    }
    return null;
  }

  function applyPracticeScaffold(code, exercise) {
    const source = String(code || "");
    if (!exercise?.find || !exercise?.replacement) return {changed:false, code:source, reason:"This exercise has no scaffolded line."};
    const first = source.indexOf(exercise.find);
    if (first < 0) return {changed:false, code:source, reason:"The reference line is not present in this route cell."};
    if (source.indexOf(exercise.find, first + exercise.find.length) >= 0) {
      return {changed:false, code:source, reason:"The scaffold line was not unique in this route cell."};
    }
    return {changed:true, code:source.slice(0, first) + exercise.replacement + source.slice(first + exercise.find.length)};
  }

  function supervisedCheckpointCode(config, value, modelId, folds, compact = false) {
    const classification = config.task === "classification";
    const scoreLine = classification
      ? 'checkpoint_raw = cross_validate(checkpoint_pipeline, X_train, y_train, cv=cv, scoring="f1_macro")\ncheckpoint_scores = pd.DataFrame({"fold":np.arange(1, len(checkpoint_raw["test_score"]) + 1), "validation_score":checkpoint_raw["test_score"]})'
      : 'checkpoint_raw = cross_validate(checkpoint_pipeline, X_train, y_train, cv=cv, scoring="neg_root_mean_squared_error")\ncheckpoint_scores = pd.DataFrame({"fold":np.arange(1, len(checkpoint_raw["test_score"]) + 1), "validation_score":-checkpoint_raw["test_score"]})';
    const lines = [
      compact ? "from sklearn.model_selection import cross_validate" : "# Use training rows only: build a compact workflow and inspect validation evidence.",
      compact ? "" : "from sklearn.model_selection import cross_validate",
      "checkpoint_pipeline = Pipeline([",
      '    ("prepare", preprocessor),',
      '    ("model", model)',
      "])" ,
      `# ${classification ? "Macro F1 is higher when better" : "RMSE is shown as a positive error in original target units; lower is better"}`,
      scoreLine,
      "checkpoint_scores.round(3)"
    ];
    return lines.filter((line, index) => line || index !== 1).join("\n");
  }

  function cleanSupervisedWorkflowReference(config, value, modelId, folds, includeFinal = false) {
    const classification = config.task === "classification";
    const splitterName = config.split === "time" ? "TimeSeriesSplit" : classification ? "StratifiedKFold" : "KFold";
    const splitter = config.split === "time"
      ? `${splitterName}(n_splits=${folds})`
      : `${splitterName}(n_splits=${folds}, shuffle=True, random_state=42)`;
    const scoring = classification ? "f1_macro" : "neg_root_mean_squared_error";
    const scoreExpression = classification ? 'validation_raw["test_score"]' : '-validation_raw["test_score"]';
    const lines = [
      "# Core supervised workflow: the split cell created the training variables; the final holdout stays sealed until the final step.",
      "from sklearn.model_selection import cross_validate",
      `cv = ${splitter}`,
      "pipeline = Pipeline([",
      '    ("prepare", preprocessor),',
      '    ("model", model)',
      "])" ,
      `validation_raw = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=${py(scoring)})`,
      `validation_scores = pd.DataFrame({"validation_score":${scoreExpression}})`,
      "validation_scores.round(3)",
      "# Step 7 keeps the chosen pipeline or the default pipeline.",
      "chosen_pipeline = pipeline"
    ];
    if (includeFinal) {
      lines.push(
        "# After validation/model selection, fit once on training rows and evaluate the sealed holdout.",
        "final_model = chosen_pipeline.fit(X_train, y_train)",
        "final_prediction = final_model.predict(X_test)",
        classification
          ? 'from sklearn.metrics import f1_score\nf1_score(y_test, final_prediction, average="macro")'
          : "from sklearn.metrics import root_mean_squared_error\nroot_mean_squared_error(y_test, final_prediction)"
      );
    }
    return lines.join("\n");
  }

  function cleanWorkflowReference(config, value, modelId, folds = 5) {
    const model = MODELS[modelId];
    if (!model) return "";
    if (model.task !== "unsupervised") return cleanSupervisedWorkflowReference(config, value, modelId, folds, false);
    if (modelId === "kmeans") return `from sklearn.cluster import KMeans
checkpoint_k = min(3, len(X_scaled) - 1)
checkpoint_model = KMeans(n_clusters=checkpoint_k, n_init=20, random_state=42).fit(X_scaled)
checkpoint_labels = checkpoint_model.labels_
checkpoint_profile = X.copy()
checkpoint_profile["cluster"] = checkpoint_labels
checkpoint_profile.groupby("cluster")[feature_names].mean().round(2)`;
    if (modelId === "hierarchical") return `from scipy.cluster.hierarchy import linkage, cut_tree
checkpoint_k = min(3, len(X_sample_scaled) - 1)
checkpoint_hierarchy = linkage(X_sample_scaled, method="ward")
checkpoint_labels = cut_tree(checkpoint_hierarchy, n_clusters=checkpoint_k).ravel()
checkpoint_profile = X_sample.copy()
checkpoint_profile["cluster"] = checkpoint_labels
checkpoint_profile.groupby("cluster")[feature_names].mean().round(2)`;
    return `from sklearn.decomposition import PCA
checkpoint_pca = PCA().fit(X_scaled)
checkpoint_variance_target = 0.90
checkpoint_components = int(np.flatnonzero(np.cumsum(checkpoint_pca.explained_variance_ratio_) >= checkpoint_variance_target)[0] + 1)
checkpoint_projection = checkpoint_pca.transform(X_scaled)[:, :checkpoint_components]
checkpoint_loadings = pd.DataFrame(checkpoint_pca.components_.T, index=feature_names)
checkpoint_loadings.index.name = "feature"
checkpoint_loadings.head(12)`;
  }

  function independentCheckpointForRoute(config, value, modelId, folds = 5) {
    const model = MODELS[modelId];
    if (!model) return null;
    const unsupervised = model.task === "unsupervised";
    const classification = config.task === "classification";
    const common = {
      id:"independent-checkpoint",
      title:"Independent Checkpoint",
      availableVariables:unsupervised
        ? modelId === "hierarchical" ? ["X_sample_scaled", "X_sample", "feature_names", "selected_k"] : ["X_scaled", "X", "feature_names", "selected_k"]
        : ["X_train", "y_train", "preprocessor", "model", "pipeline", "cv"],
      hint:unsupervised
        ? "Use only the prepared feature matrix and the selected cut. Keep the profile in original feature units; the reference target is not part of discovery."
        : `Use X_train and y_train only. Connect preparation and model in a Pipeline, then use ${folds}-fold CV; keep the final holdout out of this checkpoint.`,
      starterCode:unsupervised
        ? "# Independent checkpoint\n# TODO: fit the selected unsupervised method and create a compact profile.\n"
        : "# Independent checkpoint · training rows only\n# TODO: build a compact preparation + model workflow, run CV, and inspect validation_score.\n",
      referenceSolution:unsupervised ? "" : supervisedCheckpointCode(config, value, modelId, folds),
      cleanReference:cleanWorkflowReference(config, value, modelId, folds)
    };
    if (!unsupervised) {
      common.goal = classification
        ? "Build a compact training-only classification workflow and produce fold validation scores without opening the holdout."
        : "Build a compact training-only regression workflow and produce positive RMSE validation scores in the target's original units without opening the holdout.";
      common.checklist = ["Use X_train and y_train only", "Keep preparation and model in one Pipeline", "Produce one validation_score per fold", "Explain what the validation evidence suggests"];
      common.referenceSolution = supervisedCheckpointCode(config, value, modelId, folds);
      common.validation = {kind:"checkpoint_supervised", task:config.task, folds};
      return common;
    }
    if (modelId === "kmeans") {
      common.goal = "Fit a target-free K-Means solution and describe its discovered groups in original feature units.";
      common.checklist = ["Fit K-Means on X_scaled", "Give each row one cluster label", "Compare original-unit profiles", "Do not use the hidden reference target"];
      common.referenceSolution = cleanWorkflowReference(config, value, modelId, folds);
      common.validation = {kind:"checkpoint_kmeans", target:config.target};
    } else if (modelId === "hierarchical") {
      common.goal = "Fit a target-free Ward hierarchy on the prepared sample and describe its cut in original feature units.";
      common.checklist = ["Use X_sample_scaled and X_sample", "Keep sampled rows and labels aligned", "Compare original-unit profiles", "Do not use the hidden reference target"];
      common.referenceSolution = cleanWorkflowReference(config, value, modelId, folds);
      common.validation = {kind:"checkpoint_hierarchical", target:config.target};
    } else {
      common.goal = "Fit PCA on the prepared inputs, choose a variance criterion, and inspect row coordinates and feature loadings without using the reference target.";
      common.checklist = ["Fit PCA on X_scaled", "Choose a visible variance target", "Create projected row coordinates", "Label feature loadings"];
      common.referenceSolution = cleanWorkflowReference(config, value, modelId, folds);
      common.validation = {kind:"checkpoint_pca", target:config.target};
    }
    return common;
  }

  function safeExperimentForTask(config, value, modelId, taskId) {
    const modelChanges = {
      knn_cls: {
        id:"knn-nearby-k",
        title:"Try one nearby KNN setting",
        instruction:"In the model cell, try another supported neighbour count before rerunning this step.",
        find:"model = KNeighborsClassifier()",
        replace:"model = KNeighborsClassifier(n_neighbors=9)",
        change:"KNeighborsClassifier() → KNeighborsClassifier(n_neighbors=9)"
      },
      svm_cls: {
        id:"svm-c",
        title:"Try one supported SVM setting",
        instruction:"In the model cell, try a different supported C value before rerunning this step.",
        find:"model = SVC(random_state=42)",
        replace:"model = SVC(C=2, random_state=42)",
        change:"SVC(random_state=42) → SVC(C=2, random_state=42)"
      },
      regression_tree: {
        id:"regression-tree-depth",
        title:"Try a bounded tree depth",
        instruction:"In the model cell, allow a supported depth of 5 and compare the later evidence.",
        find:"model = DecisionTreeRegressor(random_state=42)",
        replace:"model = DecisionTreeRegressor(max_depth=5, random_state=42)",
        change:"DecisionTreeRegressor(random_state=42) → DecisionTreeRegressor(max_depth=5, random_state=42)"
      },
      classification_tree: {
        id:"classification-tree-depth",
        title:"Try a bounded tree depth",
        instruction:"In the model cell, allow a supported depth of 5 and compare the later evidence.",
        find:"model = DecisionTreeClassifier(random_state=42)",
        replace:"model = DecisionTreeClassifier(max_depth=5, random_state=42)",
        change:"DecisionTreeClassifier(random_state=42) → DecisionTreeClassifier(max_depth=5, random_state=42)"
      },
      polynomial: {
        id:"polynomial-degree",
        title:"Try one polynomial degree",
        instruction:"In the model cell, use the supported degree-3 expansion and compare the later evidence.",
        find:"polynomial = PolynomialFeatures(degree=2, include_bias=False)",
        replace:"polynomial = PolynomialFeatures(degree=3, include_bias=False)",
        change:"PolynomialFeatures(degree=2) → PolynomialFeatures(degree=3)"
      }
    };
    if (taskId === "model" && modelChanges[modelId]) return {
      ...modelChanges[modelId],
      targetTaskId:"model",
      evidenceTaskId:"baseline"
    };
    if (taskId === "tune" && ["mlp_cls", "mlp_reg"].includes(modelId)) {
      const parameterName = modelId === "mlp_reg" ? "model__regressor__hidden_layer_sizes" : "model__hidden_layer_sizes";
      const originalGrid = modelId === "mlp_reg" ? "'model__regressor__hidden_layer_sizes': [(16,), (24,)]" : "'model__hidden_layer_sizes': [(16,), (24,)]";
      return {
        id:"mlp-supported-architecture",
        title:"Try one smaller supported MLP search",
        instruction:"In the tuning cell, keep the existing 16/24-unit architecture comparison so the search stays small and valid.",
        find:originalGrid,
        replace:`'${parameterName}': [(24,)]`,
        change:"search (16,) and (24,) → use the starting (24,) architecture",
        targetTaskId:"tune",
        evidenceTaskId:"tune"
      };
    }
    if (taskId === "fit" && modelId === "kmeans") {
      return {
        id:"kmeans-nearby-k",
        title:"Try another candidate k",
        instruction:"Change the runnable starting k from 3 to 2, then rerun this step and compare the profiles.",
        find:"selected_k = min(3, max_k)",
        replace:"selected_k = min(2, max_k)",
        change:"selected_k = min(3, max_k) → selected_k = min(2, max_k)",
        targetTaskId:"fit",
        evidenceTaskId:"profile"
      };
    }
    if (taskId === "fit" && modelId === "hierarchical") {
      return {
        id:"hierarchical-nearby-cut",
        title:"Try another candidate cut",
        instruction:"Change the runnable starting cut from 3 to 2, then rerun this step and compare the profiles.",
        find:"selected_k = min(3, max_k)",
        replace:"selected_k = min(2, max_k)",
        change:"selected_k = min(3, max_k) → selected_k = min(2, max_k)",
        targetTaskId:"fit",
        evidenceTaskId:"profile"
      };
    }
    if (taskId === "select" && modelId === "pca") {
      return {
        id:"pca-variance-criterion",
        title:"Try a different variance trade-off",
        instruction:"Change variance_target from 0.90 to 0.80, then rerun this step and compare the retained representation.",
        find:"variance_target = 0.90",
        replace:"variance_target = 0.80",
        change:"variance_target = 0.90 → variance_target = 0.80",
        targetTaskId:"select",
        evidenceTaskId:"select"
      };
    }
    return null;
  }

  function applyPracticeMutation(code, experiment) {
    const source = String(code || "");
    if (!experiment?.find || !experiment?.replace) return {changed:false, code:source, reason:"This experiment has no safe text change."};
    const first = source.indexOf(experiment.find);
    if (first < 0) return {changed:false, code:source, reason:"The original line is no longer present in this editable cell."};
    if (source.indexOf(experiment.find, first + experiment.find.length) >= 0) {
      return {changed:false, code:source, reason:"The safe change was not unique in this editable cell."};
    }
    return {changed:true, code:source.slice(0, first) + experiment.replace + source.slice(first + experiment.find.length)};
  }

  function practiceForTask(config, value, modelId, taskId, folds = 5) {
    const model = MODELS[modelId];
    if (!model) return null;
    const practice = {beforeRun:null, decision:null, experiment:safeExperimentForTask(config, value, modelId, taskId), exercise:practiceExerciseForTask(config, value, modelId, taskId, folds)};
    if (modelId === "pca") {
      if (taskId === "variance") {
        practice.beforeRun = practicePrediction(
          "pca-two-variance",
          "Do you expect the first two components to retain most of the prepared-data variance?",
          [practiceOption("most", "Most of it"), practiceOption("some", "Some, but not most")],
          null,
          "pca-variance"
        );
      } else if (taskId === "loadings") {
        practice.beforeRun = practicePrediction(
          "pca-loading-reading",
          "Which part of a loading should you compare to judge contribution strength?",
          [practiceOption("absolute", "Its absolute size"), practiceOption("sign", "Its positive or negative sign")],
          "absolute",
          "pca-loading"
        );
      } else if (taskId === "project") {
        practice.beforeRun = practicePrediction(
          "pca-projection-representation",
          "Does a chart showing PC1 and PC2 necessarily equal the selected reduced representation?",
          [practiceOption("no", "No; the selected representation may keep more components"), practiceOption("yes", "Yes; two plotted axes are always the representation")],
          "no",
          "pca-projection"
        );
      }
      if (taskId === "variance") {
        practice.decision = practiceDecision(
          "pca-retention-tradeoff",
          "For this hypothetical goal, would you prefer a smaller representation or more retained variance?",
          [practiceOption("smaller", "Smaller representation"), practiceOption("variance", "More retained variance")],
          "pca-criterion"
        );
      }
      return practice.beforeRun || practice.decision || practice.experiment || practice.exercise ? practice : null;
    }
    if (model.task === "unsupervised") {
      if (["kmeans", "hierarchical"].includes(modelId) && taskId === "compare") {
        const maxK = Math.min(8, Math.min(modelId === "hierarchical" ? 500 : config.rows, config.rows) - 1);
        const options = Array.from({length:Math.max(0, maxK - 1)}, (_, index) => practiceOption(String(index + 2), `Investigate k=${index + 2}`));
        practice.beforeRun = practicePrediction(
          `${modelId}-silhouette-choice`,
          "Will the silhouette-best candidate automatically become the final answer?",
          [practiceOption("no", "No; it is supporting evidence"), practiceOption("yes", "Yes; it decides k")],
          "no",
          "cluster-suggestion"
        );
        practice.decision = practiceDecision(
          `${modelId}-candidate-choice`,
          "Which candidate would you investigate next?",
          options,
          "cluster-choice"
        );
      }
      if (["kmeans", "hierarchical"].includes(modelId) && taskId === "profile") {
        practice.decision = practiceDecision(
          `${modelId}-profile-reading`,
          "How should a discovered cluster become meaningful?",
          [practiceOption("compare_profiles", "Compare its original-unit profile"), practiceOption("read_id", "Read meaning from the cluster number")],
          "cluster-profile"
        );
      }
      return practice.beforeRun || practice.decision || practice.experiment || practice.exercise ? practice : null;
    }
    if (taskId === "split") {
      if (config.split === "time") {
        practice.beforeRun = practicePrediction(
          "chronological-split",
          "Will each validation window come after the rows used to fit that fold?",
          [practiceOption("yes", "Yes; later rows validate later"), practiceOption("no", "No; rows can be mixed")],
          "yes",
          "chronology"
        );
      } else if (config.task === "classification") {
        practice.beforeRun = practicePrediction(
          "stratified-split",
          "Will stratification try to keep class proportions similar across the two parts?",
          [practiceOption("yes", "Yes"), practiceOption("no", "No")],
          "yes",
          "split"
        );
      } else {
        practice.beforeRun = practicePrediction(
          "holdout-split",
          "Will the saved final-test rows be used for fitting before the final step?",
          [practiceOption("yes", "Yes"), practiceOption("no", "No")],
          "no",
          "split"
        );
      }
    } else if (taskId === "prepare") {
      if (["knn_cls", "svm_cls"].includes(modelId)) {
        practice.beforeRun = practicePrediction(
          `${modelId}-scale`,
          "If scaling were skipped, which kind of feature could dominate distance or boundary calculations?",
          [practiceOption("larger_scale", "A feature measured with larger numbers"), practiceOption("smaller_scale", "A feature measured with smaller numbers")],
          "larger_scale",
          "scaling"
        );
      } else if (["mlp_cls", "mlp_reg"].includes(modelId)) {
        practice.beforeRun = practicePrediction(
          `${modelId}-scale`,
          "Why are comparable numeric input scales useful for this neural network?",
          [practiceOption("smoother", "They can make optimisation smoother"), practiceOption("irrelevant", "They make no difference")],
          "smoother",
          "scaling"
        );
      } else if (["regression_tree", "classification_tree", "one_r"].includes(modelId)) {
        practice.beforeRun = practicePrediction(
          `${modelId}-scale`,
          "Does this model need feature scaling for its core learning operation?",
          [practiceOption("no", "No"), practiceOption("yes", "Yes")],
          "no",
          "scaling"
        );
      } else {
        practice.beforeRun = practicePrediction(
          `${modelId}-preparation-workflow`,
          "Will this route keep its preparation inside the model workflow so each training fold learns it from its own rows?",
          [practiceOption("yes", "Yes; preparation stays inside the workflow"), practiceOption("no", "No; prepare once using every row")],
          "yes",
          "preparation-workflow"
        );
      }
    } else if (taskId === "model") {
      if (modelId === "knn_cls") {
        practice.beforeRun = practicePrediction(
          "knn-k-influence",
          "If k becomes much larger, will each nearby row have more or less influence?",
          [practiceOption("less", "Less influence individually"), practiceOption("more", "More influence individually")],
          "less",
          "model"
        );
      } else if (["regression_tree", "classification_tree"].includes(modelId)) {
        practice.beforeRun = practicePrediction(
          `${modelId}-depth`,
          "If maximum depth increases, is the tree's training fit more or less flexible?",
          [practiceOption("more", "More flexible"), practiceOption("less", "Less flexible")],
          "more",
          "model"
        );
      } else if (["mlp_cls", "mlp_reg"].includes(modelId)) {
        practice.beforeRun = practicePrediction(
          `${modelId}-capacity`,
          "Does choosing a larger or deeper network automatically guarantee better new-data performance?",
          [practiceOption("no", "No; capacity can also overfit"), practiceOption("yes", "Yes")],
          "no",
          "model"
        );
      } else if (modelId === "logistic") {
        practice.beforeRun = practicePrediction(
          "logistic-boundary",
          "Should a logistic model's core boundary be expected to curve around every class?",
          [practiceOption("no", "No; its boundary is linear in prepared feature space"), practiceOption("yes", "Yes")],
          "no",
          "model"
        );
      }
    } else if (taskId === "baseline") {
      practice.beforeRun = practicePrediction(
        "cv-folds",
        "Will validation scores be identical across folds, or similar but not identical?",
        [practiceOption("similar", "Similar but not identical"), practiceOption("identical", "Exactly identical"), practiceOption("vary", "They may vary substantially")],
        null,
        "cv"
      );
    } else if (taskId === "reference") {
      practice.beforeRun = practicePrediction(
        "reference-comparison",
        config.task === "classification"
          ? "Should a feature-based model beat the most-common-class guess on the same folds?"
          : "Should a feature-based model have lower RMSE than the mean-target guess on the same folds?",
        [practiceOption("yes", "Yes; features add signal"), practiceOption("no", "No; the guess is as good")],
        null,
        "reference"
      );
    } else if (taskId === "tune") {
      const hasGrid = modelSpec(modelId, value)?.grid !== "{}";
      practice.decision = practiceDecision(
        "tuning-choice",
        hasGrid
          ? "After seeing the validation evidence, would you keep the current/default setting or use the selected tuned setting?"
          : "This route keeps the model defaults. Would you keep them rather than inventing an untested setting?",
        hasGrid
          ? [practiceOption("use_tuned", "Use the selected tuned setting"), practiceOption("keep_default", "Keep the current/default setting"), practiceOption("more_evidence", "Gather more evidence")]
          : [practiceOption("keep_default", "Keep the model defaults"), practiceOption("more_evidence", "Gather more evidence before changing them")],
        hasGrid ? "tuning" : "defaults"
      );
    } else if (taskId === "diagnose") {
      practice.beforeRun = ["mlp_cls", "mlp_reg"].includes(modelId)
        ? practicePrediction(
          `${modelId}-loss`,
          "If training loss falls, does that by itself prove new-data performance improved?",
          [practiceOption("no", "No; use CV and the final test"), practiceOption("yes", "Yes")],
          "no",
          "loss"
        )
        : practicePrediction(
          "diagnostic-scope",
          "Will this training-only diagnostic, by itself, tell us final new-data performance?",
          [practiceOption("no", "No; it shows behaviour, not the final estimate"), practiceOption("yes", "Yes")],
          "no",
          "diagnostic"
        );
    } else if (taskId === "final") {
      practice.beforeRun = practicePrediction(
        "final-vs-cv",
        "Do you expect final-test performance to fall inside the range seen across CV folds?",
        [practiceOption("inside", "Inside the CV range"), practiceOption("outside", "Outside the CV range")],
        null,
        "final"
      );
    }
    return practice.beforeRun || practice.decision || practice.experiment || practice.exercise ? practice : null;
  }

  function practiceStateFor(taskId) {
    const key = practiceStateKey(practiceSetupIdentity, taskId);
    if (!practiceStates.has(key)) practiceStates.set(key, {
      prediction:null,
      decision:null,
      experimentAttempted:false,
      experimentApplied:false,
      experimentBaseline:null,
      experimentAfter:null,
      experimentEvidenceReady:false,
      reflection:false,
      referenceRevealed:false,
      exerciseAttempts:0,
      exerciseHintRevealed:false,
      exerciseReferenceRevealed:false,
      exerciseComplete:false,
      exerciseFeedback:null
    });
    return practiceStates.get(key);
  }

  function independentCheckpointStateFor() {
    if (!independentCheckpointState || independentCheckpointState.identity !== practiceSetupIdentity) {
      independentCheckpointState = {
        identity:practiceSetupIdentity,
        hintRevealed:false,
        referenceRevealed:false,
        cleanReferenceRevealed:false,
        attempts:0,
        complete:false,
        feedback:null
      };
    }
    return independentCheckpointState;
  }

  function clearPracticeSession() {
    practiceStates.clear();
    independentCheckpointState = null;
  }

  function clearPracticeStatesFrom(taskId, preserveTaskIds = []) {
    const start = routeTasks.findIndex(item => item.id === taskId);
    if (start < 0) return;
    const preserved = new Set(preserveTaskIds);
    routeTasks.slice(start).forEach(item => {
      if (!preserved.has(item.id)) practiceStates.delete(practiceStateKey(practiceSetupIdentity, item.id));
    });
  }

  function clearLinkedPracticeExperimentStates(taskId, preserveTaskIds = []) {
    const preserved = new Set(preserveTaskIds);
    routeTasks.forEach(item => {
      const experiment = item.practice?.experiment;
      if (!experiment || preserved.has(item.id)) return;
      if (experiment.targetTaskId === taskId || experiment.evidenceTaskId === taskId) {
        practiceStates.delete(practiceStateKey(practiceSetupIdentity, item.id));
      }
    });
  }

  function practiceCounts() {
    const prefix = `${practiceSetupIdentity}::`;
    const counts = {predictions:0, decisions:0, experiments:0, references:0};
    practiceStates.forEach((state, key) => {
      if (!key.startsWith(prefix)) return;
      if (state.prediction !== null) counts.predictions += 1;
      if (state.decision !== null) counts.decisions += 1;
      if (state.experimentAttempted) counts.experiments += 1;
      if (state.referenceRevealed) counts.references += 1;
    });
    return counts;
  }

  function renderBatchControls() {
    const button = $('#runAllButton');
    if (button) {button.disabled=!runtimeReady; button.textContent='▶ Run suggested route';}
  }

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

  function isTrustedOptionalCell(cell) {
    // Optional evidence may reuse the current route workspace only while its
    // visible source is exactly the generated source that was offered. Once a
    // learner edits it, it has the same workspace-risk as any custom cell.
    return Boolean(cell?.optionalEvidence && typeof cell.routeReferenceCode === "string" && cell.code === cell.routeReferenceCode);
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
    const encoded = window.EMBEDDED_DATASETS?.[config.embedded];
    // Native builds already carry the compressed teaching data. Prefer it on
    // WKWebView, where fetch() against the capacitor:// asset handler can fail.
    if (window.AppPlatform?.native && encoded) {
      try { return await decodeEmbedded(encoded); }
      catch {
        // Keep the direct CSV request as a fallback for older WebKit builds.
      }
    }
    try {
      const response = await fetch(config.file, {cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (fetchError) {
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

  function filterPreviewPayload(payload, target, hideTarget) {
    if (!payload || !hideTarget) return payload;
    target = String(target);
    const visiblePositions = payload.columns
      .map((column, index) => String(column) === target ? -1 : index)
      .filter(index => index >= 0);
    return {
      columns: visiblePositions.map(index => payload.columns[index]),
      rows: payload.rows.map(row => visiblePositions.map(index => row?.[index] ?? null))
    };
  }

  function previewPayloadForSelection(payload = cachedPreviewPayload) {
    return filterPreviewPayload(payload, selectedConfig().target, selectedModel()?.task === "unsupervised");
  }

  function renderDatasetPreview() {
    const payload = previewPayloadForSelection();
    if (payload) tablePayload($("#preview"), payload, true);
  }

  function staticSetup() {
    const config = selectedConfig(), value = selectedScenario(), model = selectedModel();
    const unsupervised = model?.task === "unsupervised";
    document.body.dataset.dataset = config.theme || currentDatasetId;
    $("#datasetName").textContent = config.name;
    $("#datasetDescription").textContent = unsupervised
      ? "Explore similarity among rows using the selected inputs; the reference label is reserved for later interpretation."
      : config.description;
    $("#datasetQuestion").textContent = unsupervised
      ? "Which rows look similar when we compare the selected inputs?"
      : config.question;
    $("#sourceLink").href = window.DatasetDictionary?.[config.file]?.source || config.source;
    window.renderDatasetDictionary?.(config.file, $(".source-block"));
    $("#sourceLink").textContent = config.sourceLabel;
    $("#sourceNote").textContent = unsupervised
      ? `${config.sourceNote.split(" · ")[0]} · reference label hidden during discovery`
      : config.sourceNote;
    $("#rowMetric").textContent = config.rows.toLocaleString();
    $("#featureMetric").textContent = featureCount(value);
    $("#featureMix").textContent = typeMix(value);
    $("#metricLabel").textContent = model?.metric || "—";
    const tags = $("#problemTags");
    tags.replaceChildren();
    const tagLabels = unsupervised
      ? ["unsupervised", value.name, "reference label not used for fitting"]
      : [config.task, config.target, value.name, config.split === "time" ? "chronological saved 80 / 20" : "saved 80 / 20"];
    tagLabels.forEach(label => {
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
    $(".route-tools-label").textContent = "SUGGESTED ROUTE";
    $("#routeDescription").textContent = unsupervised
      ? "Discovery workflow · run in order; reference labels stay out of fitting and appear only for interpretation."
      : "Prediction workflow · each step answers one question; the saved test set is used only at the end.";
    $("#foldSelect").disabled = unsupervised;
    $("#foldLabel").textContent = unsupervised ? "Cross-validation · not used" : "Cross-validation";
    renderDatasetPreview();
    renderBatchControls();
  }

  function tablePayload(container, payload, compact = false) {
    container.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = compact ? "" : "result-table-wrap";
    const table = document.createElement("table"); table.className = compact ? "mini-table" : "result-table";
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
    if (preferred && select.value !== preferred) {
      let note = document.querySelector('#compatibilityNotice');
      if (!note) {note=document.createElement('p'); note.id='compatibilityNotice'; note.setAttribute('role','status'); select.closest('.control').after(note);}
      note.textContent = `${MODELS[preferred]?.name || preferred} is incompatible with these preset features. Selected ${MODELS[select.value]?.name || select.value}.`;
    }
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
  function primaryMetricMetadata(config) {
    return config.task === "classification"
      ? {key:"macro_f1", label:"Macro F1", direction:"higher", directionSymbol:"↑", trainColumn:"train_macro_f1", validationColumn:"validation_macro_f1"}
      : {key:"rmse", label:"RMSE", direction:"lower", directionSymbol:"↓", trainColumn:"train_rmse", validationColumn:"validation_rmse"};
  }

  function metricHelpFor(config, stage = "baseline") {
    if (config.task === "classification") {
      const full = [
        {key:"macro_f1", label:"Macro F1", direction:"higher", text:"Macro F1: measures classification quality for each class and then gives every class equal weight. Higher is better, which makes it useful when smaller classes should matter too."},
        {key:"accuracy", label:"Accuracy", direction:"higher", text:"Accuracy: the fraction of predictions that were correct. Higher is better, but it can look good when one class is much more common than the others."}
      ];
      return stage === "baseline" ? [full[0]] : full.map(metric => ({
        ...metric,
        text:`${metric.direction === "higher" ? "Higher is better" : "Lower is better"}.`
      }));
    }
    const full = [
      {key:"rmse", label:"RMSE", direction:"lower", text:`RMSE: measures prediction error in the target's units, but larger mistakes count more heavily. Lower is better.`},
      {key:"r2", label:"R²", direction:"higher", text:"R² = 1 − squared prediction error / squared deviations from the evaluation-set mean. Higher is better; 1 is perfect and scores can be negative. A separately fitted training-mean predictor need not score zero. For a constant target, scikit-learn uses finite 1/0 defaults for perfect/imperfect predictions."}
    ];
    if (stage === "baseline") return [full[0]];
    if (stage === "final") return [
      {key:"mae", label:"MAE", direction:"lower", text:`MAE: the average absolute prediction error, in the original units of ${config.target}. Lower is better.`},
      ...full.map(metric => ({
        ...metric,
        text:`${metric.direction === "higher" ? "Higher is better" : "Lower is better"}.`
      }))
    ];
    return full.map(metric => ({
      ...metric,
      text:`${metric.direction === "higher" ? "Higher is better" : "Lower is better"}.`
    }));
  }

  function exploreReadingCue(config, value) {
    if (config.task === "classification") {
      return value.continuous.length
        ? "Look for how much the class distributions overlap."
        : "Look for groups whose class mixes differ, while remembering that overlap can remain.";
    }
    return value.continuous.length
      ? "Look for direction, curvature, unusual points, and how widely the target varies."
      : "Look for target differences between groups and whether those groups overlap.";
  }

  function preprocessingReadingCue(config, value, modelId) {
    const model = MODELS[modelId];
    const hasCategorical = Boolean(value.binary.length || value.categorical.length);
    if (modelId === "one_r" && hasCategorical) {
      return "Look for categorical features being encoded while each original category stays a separate One-R value.";
    }
    if (hasCategorical && model?.scale) {
      return "Look for categorical features being encoded and numeric features scaled inside the pipeline.";
    }
    if (hasCategorical) {
      return "Look for categorical features being encoded while continuous features keep their numeric role inside the pipeline.";
    }
    if (model?.scale) return "Look for the numeric features being scaled before this model fits.";
    return "Look for a pass-through or model-appropriate numeric preparation without unnecessary transformation.";
  }

  function concept(key, label, text, keys = [key]) {
    return {key, label, text, keys};
  }

  const FRIENDLY_COLUMN_NAMES = Object.freeze({
    gdpPercap:"GDP per person",
    lifeExp:"life expectancy",
    diagnosis:"diagnosis class",
    species:"penguin species",
    acceptability:"car acceptability",
    popular:"popularity class",
    quality:"wine quality",
    winpercent:"candy win rate",
    "Rented Bike Count":"bike-rental demand",
    "Temperature(°C)":"temperature",
    "Humidity(%)":"humidity",
    "Wind speed (m/s)":"wind speed",
    "Visibility (10m)":"visibility",
    "Solar Radiation (MJ/m2)":"solar radiation",
    "Rainfall(mm)":"rainfall",
    "Snowfall (cm)":"snowfall"
  });

  const FRIENDLY_CLASS_LABELS = Object.freeze({
    diagnosis:Object.freeze({B:"benign", M:"malignant"}),
    acceptability:Object.freeze({unacc:"unacceptable", acc:"acceptable", good:"good", vgood:"very good"}),
    popular:Object.freeze({"50% or above":"50% or above", "below 50%":"below 50%"})
  });

  const FEATURE_UNIT_INFO = Object.freeze({
    gdpPercap:Object.freeze({factor:1000, phrase:"per $1,000 of GDP per person", unit:"$1,000 of GDP per person"}),
    sugarpercent:Object.freeze({factor:0.1, phrase:"per 10 percentile points", unit:"percentile points"}),
    pricepercent:Object.freeze({factor:0.1, phrase:"per 10 percentile points", unit:"percentile points"}),
    "Temperature(°C)":Object.freeze({factor:1, phrase:"per 1 °C", unit:"°C"}),
    "Humidity(%)":Object.freeze({factor:1, phrase:"per 1 percentage point of humidity", unit:"percentage points"}),
    "Wind speed (m/s)":Object.freeze({factor:1, phrase:"per 1 m/s of wind speed", unit:"m/s"}),
    "Visibility (10m)":Object.freeze({factor:1, phrase:"per 1 visibility unit (10 m)", unit:"visibility units"}),
    "Solar Radiation (MJ/m2)":Object.freeze({factor:1, phrase:"per 1 MJ/m² of solar radiation", unit:"MJ/m²"}),
    "Rainfall(mm)":Object.freeze({factor:1, phrase:"per 1 mm of rainfall", unit:"mm"}),
    "Snowfall (cm)":Object.freeze({factor:1, phrase:"per 1 cm of snowfall", unit:"cm"})
  });

  function friendlyColumnName(name) {
    return FRIENDLY_COLUMN_NAMES[name] || name;
  }

  function friendlyClassLabel(target, label) {
    return FRIENDLY_CLASS_LABELS[target]?.[String(label)] || String(label);
  }

  function featureUnitInfo(name) {
    return FEATURE_UNIT_INFO[name] || {factor:1, phrase:`per 1 unit of ${friendlyColumnName(name)}`, unit:"original data units"};
  }

  function classLabelMap(config) {
    return FRIENDLY_CLASS_LABELS[config.target] || {};
  }

  function featureGrounding(config, value) {
    const names = [...value.continuous, ...value.binary, ...value.categorical];
    const labels = names.map(name => {
      const friendly = friendlyColumnName(name);
      return friendly === name ? friendly : `${friendly} (${name})`;
    });
    const featureText = labels.length === 1
      ? `Feature: ${labels[0]}`
      : labels.length <= 3
        ? `Features: ${labels.join(", ")}`
        : `Features: ${labels.length} selected inputs, including ${labels.slice(0, 3).map(friendlyColumnName).join(", ")}`;
    const targetText = friendlyColumnName(config.target);
    const derived = config.target === "popular" ? " It is derived from winpercent at the 50% cutoff before modelling." : "";
    return {featureText, targetText:targetText + derived, rowText:config.rowMeaning || "one row in the selected modelling frame"};
  }

  function frameConcepts(config, value) {
    const grounding = featureGrounding(config, value);
    const frameText = config.prepare === "df"
      ? "X is the selected feature table and y is the target vector. The letters are a common convention, not mandatory names."
      : "X is the selected feature table and y is the target vector from the modelling frame created for this route. The letters are a common convention, not mandatory names.";
    return [
      concept("feature-target", "FEATURE / TARGET", `A feature is information the model can use; the target is what we want it to predict. ${grounding.featureText}; target: ${grounding.targetText}.`, ["feature", "target"]),
      concept("X-y", "X / y", frameText, ["X", "y"]),
      concept("row", "ROW", `Here, one row represents ${grounding.rowText}.`)
    ];
  }

  function splitConcepts(config) {
    const concepts = [
      concept("training-final", "TRAINING / FINAL TEST", "Training data are the rows used while fitting, validating, tuning, and diagnosing. The final test set is saved until the end and is not used for fitting, tuning, or model selection.", ["training-data", "final-test-set"]),
      concept("eighty-twenty", "80 / 20", "This walkthrough uses 80% for training plus cross-validation and saves 20% for the final test. That is a practical teaching choice, not a universal rule.", ["80-20-split"])
    ];
    if (config.split === "time") {
      concepts.push(concept("chronological", "CHRONOLOGICAL SPLIT", "For time-based prediction, earlier rows stay in training and the latest rows form the final test. Random splitting could let later observations influence evaluation of earlier periods.", ["chronological-split"]));
    } else {
      const stratified = config.task === "classification" ? " For classification, stratify=y keeps class proportions roughly similar in both parts; it does not make them identical." : "";
      concepts.push(concept("random-reproducible", "RANDOM / REPRODUCIBLE", `Ordinary routes divide rows randomly rather than by original order. random_state=42 makes the same split reproducible; 42 itself is not special.${stratified}`, ["random-split", "random-state", ...(config.task === "classification" ? ["stratification"] : [])]));
    }
    return concepts;
  }

  function scalingReason(modelId) {
    if (modelId === "knn_cls") return "KNN compares distances. Without scaling, a feature with larger numbers could dominate the distance.";
    if (modelId === "svm_cls") return "SVM uses distances and boundaries, so similar numeric scales help prevent one measurement scale from dominating.";
    if (modelId === "logistic") return "Scaling helps optimisation and lets regularisation treat coefficients more comparably when measurement scales differ.";
    if (["mlp_cls", "mlp_reg"].includes(modelId)) return "Neural networks usually train more smoothly when numeric inputs are on similar scales.";
    if (modelId === "polynomial") return "The model scales its expanded terms before Ridge regularisation so terms with different sizes are treated more comparably.";
    return MODELS[modelId]?.preprocessNote || "Scaling puts numeric inputs on more comparable scales.";
  }

  function preprocessingPlan(config, value, modelId) {
    const model = MODELS[modelId];
    const numericBinary = value.binary.filter(name => (config.binaryNumeric || []).includes(name));
    const encodedBinary = value.binary.filter(name => !numericBinary.includes(name));
    const encodedFeatures = [...encodedBinary, ...value.categorical];
    const allNumeric = value.continuous.length + numericBinary.length === featureCount(value) && !encodedFeatures.length;
    const allEncoded = !value.continuous.length && !numericBinary.length && encodedFeatures.length > 0;
    const allContinuous = value.continuous.length > 0 && !numericBinary.length && !encodedFeatures.length;
    const useOrdinal = modelId === "one_r";
    const needsScale = Boolean(model.scale);
    const hasMissing = Boolean(config.missing);
    const needsSeparateNumericBinary = value.continuous.length && numericBinary.length && (needsScale || hasMissing);
    let structure;
    if (allNumeric && !needsSeparateNumericBinary) {
      if (hasMissing) structure = "simple_pipeline";
      else if (needsScale && allContinuous) structure = "direct_scaler";
      else structure = "direct_passthrough";
    } else if (allEncoded) {
      structure = hasMissing ? "simple_pipeline" : "direct_encoder";
    } else {
      structure = "column_transformer";
    }
    const operation = (kind, encode = false) => {
      const parts = [];
      if (hasMissing) parts.push("fill missing values");
      if (kind === "continuous" && needsScale) parts.push("scale");
      if (encode) parts.push(useOrdinal ? "use one stable category code" : "one-hot encode");
      return parts.length ? parts.join(" → ") : "passthrough";
    };
    const groups = [];
    if (value.continuous.length) groups.push({label:"Numeric measurements", columns:value.continuous, operation:operation("continuous")});
    if (numericBinary.length) groups.push({label:"Binary indicators", columns:numericBinary, operation:operation("binary")});
    if (encodedFeatures.length) groups.push({label:"Categorical features", columns:encodedFeatures, operation:operation("categorical", true)});
    return {
      structure,
      numericBinary,
      encodedFeatures,
      allNumeric,
      allEncoded,
      allContinuous,
      useOrdinal,
      needsScale,
      hasMissing,
      groups,
      scaleApplied:needsScale && Boolean(value.continuous.length),
      encodingApplied:Boolean(encodedFeatures.length),
      handleUnknown:Boolean(encodedFeatures.length)
    };
  }

  function preprocessingConcepts(config, value, modelId) {
    const plan = preprocessingPlan(config, value, modelId);
    const concepts = [concept("preprocessing", "PREPARATION", "Preprocessing is model-specific preparation: we change only what this selected model needs before it uses the features.")];
    const planText = plan.structure === "column_transformer"
      ? `Different columns need different preparation, so ColumnTransformer applies the appropriate job to each group: ${plan.groups.map(group => `${group.label} → ${group.operation}`).join("; ")}.`
      : plan.structure === "direct_passthrough"
        ? "These features are already in a form this model can use, so they pass through unchanged."
        : plan.structure === "direct_scaler"
          ? "The numeric features are scaled before this model fits."
          : plan.structure === "direct_encoder"
            ? `Category values are represented numerically with ${plan.useOrdinal ? "one stable code per original feature" : "one-hot encoding"}.`
            : plan.groups.length
              ? `The preparation step applies ${plan.groups.map(group => `${group.operation} to ${group.label.toLowerCase()}`).join(" and ")}.`
              : "The selected preparation step handles the model's input requirements.";
    concepts.push(concept("preparation-plan", "PLAN", planText, [plan.structure === "column_transformer" ? "column-transformer" : plan.structure === "direct_passthrough" ? "passthrough" : plan.structure === "direct_scaler" ? "scaling" : plan.encodingApplied ? "categorical-encoding" : "preprocessing"]));
    if (plan.scaleApplied) concepts.push(concept("scaling-reason", "WHY SCALE", scalingReason(modelId), ["scaling"]));
    if (plan.numericBinary.length) concepts.push(concept("binary", "BINARY", "Binary 0/1 indicators are already numeric yes/no signals, so they do not need categorical encoding.", ["binary-features", "passthrough"]));
    if (plan.encodingApplied) {
      const encodingText = plan.useOrdinal
        ? "This beginner One-R route uses one stable numeric code for each original category; category values are not quantile-binned."
        : "Models work with numbers, so one-hot encoding creates a separate yes/no column for each category.";
      concepts.push(concept("categorical", "CATEGORIES", encodingText, ["categorical-encoding"]));
      if (plan.handleUnknown) concepts.push(concept("unknown-categories", "SAFE PREDICTION", "The unknown-category setting lets a later category be handled safely instead of crashing prediction.", ["unknown-categories"]));
    }
    return concepts;
  }

  function pipelineConcepts(config) {
    return [
      concept("pipeline", "PIPELINE", "A Pipeline connects data preparation and the model into one workflow. During cross-validation, each training fold learns its own preparation before fitting, so validation rows do not leak into preparation."),
      concept("fit", "FIT", "fit() means the model learns from the training data; different estimators learn different kinds of values."),
      concept("predict", "PREDICT", `predict() asks the fitted model for outputs for new rows: ${config.task === "classification" ? "class labels" : "numeric values"}.`)
    ];
  }

  function cvConcepts(config, folds) {
    if (config.split === "time") return [
      concept("time-folds", "TIME FOLDS", `We run ${folds} checks in time order. Each check learns from earlier rows and predicts the next block; the training window grows at the next check. The final test remains sealed.`, ["time-series-split", "ordered-validation", "final-test-exclusion"]),
      concept("cv-purpose", "WHY CV", "Several training-only checks show whether one time window was unusually easy or difficult.", ["cv-purpose"])
    ];
    const concepts = [
      concept("fold", "FOLD", `A fold is one part of the training data temporarily held out for validation. With ${folds}-fold CV, each round trains on ${folds - 1} parts and validates on 1; each part gets one turn.`, ["cross-validation", "fold"]),
      concept("cv-purpose", "WHY CV", "Cross-validation gives several training-only validation results instead of relying on one lucky or unlucky split. The final test set is not involved in any of these rounds.", ["cv-purpose", "final-test-exclusion"])
    ];
    if (config.split !== "time") {
      const classification = config.task === "classification" ? " Stratified folds try to keep class proportions similar in each fold." : "";
      concepts.push(concept("fold-order", "FOLD SETUP", `Before standard folds are made, shuffle=True mixes the row order so folds are not based on the dataset's original order.${classification}`, ["shuffle", ...(config.task === "classification" ? ["stratified-folds"] : [])]));
    }
    return concepts;
  }

  function routeFrameQuestion(config, value) {
    const names = featureNames(value);
    const featureText = names.length === 1
      ? friendlyColumnName(names[0])
      : `${names.length} selected inputs`;
    const target = friendlyColumnName(config.target);
    if (config.target === "species") return `Predict penguin species from ${featureText}; each row is one penguin.`;
    if (config.target === "popular") return `Classify whether a candy reaches at least 50% wins using ${featureText}; each row is one candy.`;
    if (config.target === "quality") return `Estimate wine quality from ${featureText}; duplicate chemistry rows are removed before the split.`;
    if (config.target === "Rented Bike Count") return `Predict later ${target} from ${featureText}; rows stay in chronological order.`;
    if (config.target === "lifeExp") return `Estimate ${target} for the 2007 country snapshot from ${featureText}.`;
    if (config.target === "winpercent") return `Estimate candy win rate from ${featureText}; each row is one candy.`;
    if (config.target === "diagnosis") return `Predict diagnosis class from ${featureText}; each row is one tumour sample.`;
    return `${config.question} Use ${featureText} to estimate ${target}.`;
  }

  function routeDatasetLabel(config, value) {
    const dataset = String(config.name || "this dataset").split(" · ")[0];
    const scenario = String(value?.name || "selected scenario").split(" · ")[0];
    return `${dataset} · ${scenario}`;
  }

  function routeInputSummary(value) {
    const names = featureNames(value).map(friendlyColumnName);
    if (!names.length) return "the selected inputs";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]}, and ${names.length - 2} more selected inputs`;
  }

  function supervisedClosingTeaching(config, value) {
    const routeLabel = routeDatasetLabel(config, value);
    const target = friendlyColumnName(config.target);
    if (config.task === "classification") {
      return {
        question:`How does the selected model's saved final ${target} result compare with the initial-model CV and any selected-setting CV for ${routeLabel}? Use the training-only diagnostic or optional final confusion view to identify a class pattern, then name one limitation.`,
        readingCue:`Read the aggregate final ${target} metric, compare it with the initial-model CV and selected-setting CV when tuning was used, then use the training-only diagnostic or optional final confusion view for class-level patterns. The saved final test is a one-time held-out check, not a tuning result.`
      };
    }
    if (config.split === "time") {
      return {
        question:`How does the saved final ${target} error compare with the initial-model CV and any selected-setting CV across later time windows for ${routeLabel}, and which inputs would actually be available for a future prediction?`,
        readingCue:`Compare the saved final test error with initial-model CV and selected-setting CV when tuning was used, then check that any proposed future input would be known before the prediction time.`
      };
    }
    return {
      question:`How does the saved final ${target} error compare with the initial-model CV and any selected-setting CV for ${routeLabel}, and what pattern did the model miss?`,
      readingCue:`Read the saved final test error in ${target} units, compare it with initial-model CV and selected-setting CV when tuning was used, then name one pattern from the training-only residuals that the model did not capture.`
    };
  }

  function unsupervisedStory(config, value, modelId) {
    const routeLabel = routeDatasetLabel(config, value);
    const inputs = routeInputSummary(value);
    if (modelId === "kmeans") {
      return {
        frameQuestion:`What groups can I describe in ${routeLabel} rows using ${inputs}?`,
        frameCue:`Confirm that X contains these selected inputs and that the reference target stays out of the grouping decision.`,
        exploreQuestion:`What ranges and overlaps among ${inputs} might shape groups in ${routeLabel}?`,
        exploreCue:`Use the input ranges and overlap to form a first description of possible groups before fitting K-Means.`,
        prepareQuestion:`How should ${inputs} be scaled so distance comparisons treat ${routeLabel} rows fairly?`,
        prepareCue:`Check that the named scaling recipe puts the selected inputs on comparable scales before distances are calculated.`,
        compareQuestion:`Which candidate group count gives a useful balance for ${routeLabel}?`,
        compareCue:`Use inertia, silhouette, cluster sizes, and original-unit profiles together; choose a useful explanation rather than the smallest score alone.`,
        fitQuestion:`What does the selected starting group count produce for ${routeLabel}?`,
        fitCue:`Compare the starting group count with the candidate evidence, then edit selected_k if another grouping answers this route's question better.`,
        diagnoseQuestion:`Are the discovered ${routeLabel} groups separated enough and large enough to describe?`,
        diagnoseCue:`Read the global silhouette beside the full group counts, then decide whether a small group is meaningful, rare, or fragmented.`,
        profileQuestion:`What do these groups look like in the original units of ${inputs} for ${routeLabel}?`,
        profileCue:`Use the original-unit means to describe at least two groups; cluster IDs are labels and do not supply the meaning.`,
        closingQuestion:`Describe two groups in the original units of ${inputs} for ${routeLabel}; why is this grouping useful for the selected scenario?`,
        closingCue:`Use the profile and map together, state two concrete group descriptions, and name what the two-dimensional view leaves out.`
      };
    }
    if (modelId === "hierarchical") {
      return {
        frameQuestion:`How do ${routeLabel} rows join into a hierarchy when compared on ${inputs}?`,
        frameCue:`Confirm that X contains these selected inputs and that the reference target stays out of the hierarchy.`,
        exploreQuestion:`What ranges and overlaps among ${inputs} might shape the ${routeLabel} hierarchy?`,
        exploreCue:`Use the input ranges and overlap to describe possible similarity before building the hierarchy.`,
        prepareQuestion:`How should ${inputs} be scaled, and why does ${routeLabel} use a reproducible sample?`,
        prepareCue:`Check the comparable scales, the named X_sample frame, and the displayed sample size before pairwise linkage is built.`,
        dendrogramQuestion:`Where do ${routeLabel} rows join at noticeably different heights before a cut is chosen?`,
        dendrogramCue:`Read leaves as sampled rows or small groups, joins as merges, and large height gaps as candidate cut evidence.`,
        compareQuestion:`Which dendrogram cut gives a useful description of ${routeLabel}?`,
        compareCue:`Use merge heights, silhouette, sampled group sizes, and original-unit profiles together; silhouette supports the cut but does not decide it.`,
        fitQuestion:`What does the selected starting cut produce for ${routeLabel}?`,
        fitCue:`Compare the starting cut with the dendrogram and candidate evidence, then edit selected_k if another cut answers this route's question better.`,
        profileQuestion:`What do the sampled groups look like in the original units of ${inputs} for ${routeLabel}?`,
        profileCue:`Use the sampled original-unit means to describe at least two groups and keep the sample scope in your interpretation.`,
        closingQuestion:`Describe two sampled groups in the original units of ${inputs} for ${routeLabel}; why is this hierarchy useful for the selected scenario?`,
        closingCue:`Use the profile and map together, state two concrete group descriptions, and remember that the hierarchy represents the reproducible sample.`
      };
    }
    return {
      frameQuestion:`How can I summarise variation in ${routeLabel} rows with fewer coordinates from ${inputs}?`,
      frameCue:`Confirm that the selected inputs define X and that no reference target is used to learn the PCA axes.`,
      exploreQuestion:`Which selected inputs may overlap in ${routeLabel} before they are replaced by principal-component coordinates?`,
      exploreCue:`Use the named pair to describe possible redundancy before PCA searches for directions of high variance.`,
      prepareQuestion:`Why should ${inputs} share a common scale before PCA compares their variation?`,
      prepareCue:`Check that the named scaling recipe prepares each selected input before PCA learns the axes.`,
      varianceQuestion:`How much variation does each component represent for ${routeLabel}, and where does adding another component become less useful?`,
      varianceCue:`Read the per-component and cumulative variance for this selected scenario; the next step makes the retention trade-off explicit.`,
      selectQuestion:`How many coordinates should represent ${routeLabel} under the chosen variance-retention rule?`,
      selectCue:`Check the first component count reaching the active target and record both the count and the retained variation.`,
      loadingsQuestion:`Which original inputs shape the first axes for ${routeLabel}, and how should their signs be read?`,
      loadingsCue:`Compare absolute loading sizes for contribution and signs for direction; the full table keeps every selected input available for interpretation.`,
      closingQuestion:`How many coordinates did you keep for ${routeLabel}, how much variation do they preserve, and what do the first two axes describe?`,
      closingCue:`Use components_for_target and variance_retained, connect the largest absolute loadings to PC1 and PC2, and name what later components may hide.`
    };
  }

  function modelPurposeQuestion(modelId, config) {
    const purposes = {
      simple_linear:"How much does one selected input move the numeric target along a straight line?",
      multiple_linear:"What additive contribution does each selected input make while the others are held in the model?",
      polynomial:"Does adding curved terms improve the numeric prediction relationship?",
      regression_tree:"Which if/then splits form useful numeric prediction groups?",
      logistic:"Can a regularised linear score separate the classes?",
      svm_cls:"How does a margin based boundary separate the classes?",
      one_r:"Which single feature gives the simplest useful class rules?",
      classification_tree:"Which if/then splits form useful class decisions?",
      knn_cls:"Do nearby prepared training rows vote for the same class?",
      qda:"Do class specific shapes produce a useful curved boundary?",
      lda:"Can one shared class shape support a useful linear boundary?",
      naive_bayes:"How do class priors and feature evidence combine under the independence assumption?",
      mlp_cls:"Can one small hidden layer learn nonlinear class patterns?",
      mlp_reg:"Can one small hidden layer learn nonlinear numeric patterns?"
    };
    return purposes[modelId] || `What pattern can this ${config.task} model learn?`;
  }

  function tuningQuestion(modelId, config) {
    const questions = {
      logistic:"Does regularisation strength help the class boundary?",
      svm_cls:"How strongly should classification mistakes be penalised?",
      regression_tree:"How deep should the tree grow?",
      classification_tree:"How deep should the tree grow?",
      knn_cls:"How many neighbours should vote?",
      one_r:"How many numeric intervals are useful for the one-feature rule?",
      qda:"How much should class-shape estimates be stabilised?",
      lda:"Does stabilising the shared class shape help?",
      naive_bayes:"How much smoothing should class evidence use?",
      polynomial:"Is degree 2 or degree 3 more useful?",
      mlp_cls:"Does a different small hidden-layer size help?",
      mlp_reg:"Does a different small hidden-layer size help?"
    };
    return questions[modelId] || "Does one supported setting improve the training-fold result?";
  }

  function hyperparameterExample(modelId, value) {
    const examples = {
      knn_cls:"For KNN, n_neighbors (k) controls how many nearby rows vote.",
      regression_tree:"For a tree, max_depth limits how deep the learned if/then structure may grow.",
      classification_tree:"For a tree, max_depth limits how deep the learned if/then structure may grow.",
      logistic:"For logistic regression, C controls the strength of regularisation.",
      svm_cls:"For an SVM, C controls the margin/error trade-off; this first search changes C only.",
      polynomial:"For polynomial regression, degree controls the allowed curvature; this first search changes degree only.",
      qda:"For QDA, reg_param controls how much covariance estimates are regularised.",
      lda:"For LDA, shrinkage controls whether covariance estimates are regularised.",
      mlp_cls:"For a neural network, hidden_layer_sizes chooses the hidden layers; this first search changes the width from 16 to 24.",
      mlp_reg:"For a neural network, hidden_layer_sizes chooses the hidden layers; this first search changes the width from 16 to 24 through model__regressor__ inside the target-scaling wrapper.",
      one_r:"For continuous One-R, bins controls candidate numeric intervals; it does not group categorical values."
    };
    return examples[modelId] || "The allowed settings control how the model learns.";
  }

  function tuningConcepts(config, modelId, value) {
    const spec = modelSpec(modelId, value);
    const hasHyperparameters = spec.grid !== "{}";
    const concepts = [concept("hyperparameter", "SETTING / LEARNING", "A hyperparameter is chosen before fitting and controls how a model learns. A learned parameter is estimated from the training rows during fit().", ["hyperparameter", "learned-parameter"] )];
    if (!hasHyperparameters) {
      concepts.push(concept("keep-defaults", "THIS WALKTHROUGH", "This route keeps the model's current/default settings rather than searching alternatives. The fitted model still learns from training data, and the final test remains untouched.", ["keep-defaults"]));
      return concepts;
    }
    const routing = spec.grid.includes("model__") ? " The model__ prefix tells Pipeline that a setting belongs to the model step; additional prefixes identify inner steps when needed." : "";
    concepts.push(concept("model-setting", "EXAMPLE", `${hyperparameterExample(modelId, value)}${routing}`, ["model-hyperparameter", ...(routing ? ["pipeline-parameter-routing"] : [])]));
    concepts.push(concept("grid-search", "GRIDSEARCHCV", "GridSearchCV tries the allowed settings with cross-validation and selects the strongest validation result. The final test set stays untouched during this search.", ["GridSearchCV", "tuning", "final-test-exclusion"]));
    return concepts;
  }

  function modelSpecificTeaching(config, modelId, value) {
    const names = featureNames(value);
    const feature = names[0] || "the selected feature";
    const featureLabel = names.length === 1
      ? `${friendlyColumnName(feature)} (${feature})`
      : `${names.length} selected features`;
    const targetLabel = `${friendlyColumnName(config.target)} (${config.target})`;
    const targetName = friendlyColumnName(config.target);
    const templates = {
      simple_linear:{
        learned:`The model learned a straight-line relationship between ${featureLabel} and ${targetLabel}.`,
        see:`See the training points and fitted line. The slope table translates the line into a change in predicted ${targetName} for a useful change in ${friendlyColumnName(feature)}.`,
        read:"Use the slope sign to read the direction of this model's association; the intercept is the mathematical line value when the feature is 0.",
        watchOut:`Association is not causation, and a straight line cannot represent strong curvature. If 0 is outside the observed ${friendlyColumnName(feature)} range, the intercept is mainly mathematical.`
      },
      multiple_linear:{
        learned:`The model learned an additive straight-line contribution for each of the ${names.length} selected features.`,
        see:"Each row describes a change in one feature while the other included features are kept fixed in the fitted model.",
        read:"Read each coefficient in that feature's own unit. The table stays in selected-feature order instead of ranking raw coefficient magnitudes.",
        watchOut:"These are model associations, not causal effects. Additive straight-line relationships can miss interactions or curvature."
      },
      polynomial:{
        learned:names.length === 1
          ? `The model learned a relationship that can bend between ${featureLabel} and ${targetLabel} by using powers such as x² and x³.`
          : `The model learned curved terms from the ${names.length} selected inputs, so the relationship need not stay straight.`,
        see:names.length === 1
          ? "See the original training points and fitted curve across the observed feature range."
          : "This route has multiple inputs, so no single 2D curve would be faithful; use the term summary and residuals instead.",
        read:"Look for broad curvature versus a curve that follows individual points, then use the validation evidence to judge whether extra flexibility helped.",
        watchOut:"A flexible curve can follow real structure or noise. A higher polynomial degree is not automatically better."
      },
      regression_tree:{
        learned:`The tree learned if/then splits that group training rows with similar ${targetName} values.`,
        see:"Read the top of the fitted tree and the feature-usage table to see which if/then splits the model used.",
        read:"Each condition narrows a group; a leaf reports the fitted prediction for rows that reach it. Feature usage is not causation.",
        watchOut:"Small changes in training data can change the exact tree rules."
      },
      logistic:{
        learned:"The model combines prepared features into a score, converts that score into class probabilities, and uses those probabilities to classify a row.",
        see:"Read each weight as pushing the model's score toward one class or another after this route's preparation; the confusion matrix shows where predictions fail.",
        read:"For binary routes, the positive/referenced class is named in the table. For multiclass routes, each weight column names its class.",
        watchOut:"Weights are relative to the prepared feature scales. Logistic regression uses a linear boundary, and its weights describe association within this fitted model rather than causal effects."
      },
      classification_tree:{
        learned:"The tree learned if/then questions that end at a leaf predicting a class.",
        see:"Read the top of the fitted tree and the feature-usage table to see which if/then questions lead to class leaves.",
        read:"Each condition selects a smaller group; the leaf predicts the class most common there. Feature usage measures split improvement, not causal influence.",
        watchOut:"A tree can learn very specific rules, so deeper trees may fit training details that do not generalize as well."
      },
      knn_cls:{
        learned:"KNN does not learn a global equation; it uses nearby prepared training examples to vote.",
        see:"The displayed out-of-fold row is compared with training neighbours only; the table shows their classes and post-preprocessing distances.",
        read:"Count the neighbour classes, or compare their weighted contributions, to see why the prediction was made. The explained row cannot vote for itself.",
        watchOut:"Nearby rows are not always similar in useful ways; many irrelevant features can distort distance."
      },
      svm_cls:{
        learned:"The model learned a class-separating boundary and tries to leave a wide margin around it. The closest important training rows are support vectors.",
        see:"See support vectors per class and a deterministic out-of-fold row's decision evidence. With several classes, the classifier combines multiple class-separation decisions; there is no single universal boundary.",
        read:"The margin is the gap around the boundary; support vectors most directly constrain where it sits. For binary SVM, the decision-score sign identifies the class side. C penalises training mistakes more strongly when larger, while RBF gamma makes influence more local when larger.",
        watchOut:"A detailed boundary can fit training details that do not generalize. RBF boundaries depend strongly on scaling, C, and gamma, and support vectors are not causal feature importance."
      },
      lda:{
        learned:"LDA learned a centre for each class plus one shared spread/shape structure, which leads to straight decision boundaries.",
        see:"See the fitted class-centre table, class-aligned posterior probabilities, and one out-of-fold prediction row.",
        read:"Compare the example's discriminant evidence with the available class centres. The shared spread/shape assumption is the link to a straight boundary.",
        watchOut:"If different classes have very different spreads or shapes, LDA's shared-spread assumption may be too simple. LDA is motivated by an approximately Gaussian model, not an absolute normality requirement."
      },
      qda:{
        learned:"QDA learned a centre and a separate spread/shape structure for each class, allowing the decision boundary to curve.",
        see:"See the fitted class centres, class-aligned posterior probabilities, and one out-of-fold prediction row; internally, QDA also models how the features vary together within each class.",
        read:"Compare the example's class probabilities and predicted class with the class-specific centres and per-feature spreads. The extra class-specific covariance/shape freedom is the contrast with LDA.",
        watchOut:"QDA estimates more class-specific information than LDA, so it can be more flexible but needs more data to estimate those class shapes reliably. Regularisation can stabilise estimates; a curved boundary is not automatically better."
      },
      naive_bayes:{
        learned:"The model learned class priors and class-specific feature evidence, then combines that evidence as if the features were independent once the class is known.",
        see:pureNaiveBayesInput(value) === "continuous"
          ? "See explicit prior probability, Gaussian class-conditional density at each observed continuous value, and posterior probability evidence, plus fitted class means and spreads."
          : pureNaiveBayesInput(value) === "categorical"
            ? "See explicit prior P(class), one-hot category likelihood P(category | class), and predicted P(class | features) evidence using the original category labels."
            : "See explicit prior P(class), binary likelihood P(feature = 1 | class), and predicted P(class | features) evidence.",
        read:pureNaiveBayesInput(value) === "continuous"
          ? "Follow the order: how common the class is before the row (prior), how typical each observed value is under that class's fitted bell-shaped distribution (class-conditional density), then the resulting class probability (posterior)."
          : "Follow the order: how common the class is before the row (prior), how compatible each feature is with that class (likelihood), then the resulting class probability after combining the evidence (posterior).",
        watchOut:"Feature independence is a simplifying assumption, not a fact. Related measurements can make the model count similar evidence more than once, and probabilities may be overconfident when its assumptions are poor."
      },
      mlp_cls:{
        learned:"The network learned weights connecting layers of simple units. Hidden units combine prepared inputs in different ways, allowing the model to represent nonlinear patterns; an individual hidden unit does not automatically represent a human concept.",
        see:"See the fitted network structure, training loss during optimization, one honest out-of-fold probability prediction, and the training-only confusion matrix.",
        read:"A falling training loss means the optimizer is fitting its training objective better. It is optimization evidence, not final model performance; use cross-validation and the final test to judge generalization.",
        watchOut:"A larger or deeper network is not automatically better. Neural networks can overfit, learned weights are hard to interpret directly, and initialization or data can affect training; this walkthrough fixes random_state=42 for reproducibility."
      },
      mlp_reg:{
        learned:"The network learned weights connecting layers of simple units. Hidden units combine prepared inputs in different ways, allowing the model to represent nonlinear patterns; an individual hidden unit does not automatically represent a human concept.",
        see:"See the fitted network structure, training loss during optimization, one honest out-of-fold prediction in the target's original units, and the training-only residual evidence.",
        read:"A falling training loss means the optimizer is fitting its objective better in the internally scaled target space. It is not final model performance; use cross-validation and the final test to judge generalization in the target's original units.",
        watchOut:"A larger or deeper network is not automatically better. Neural networks can overfit, learned weights are hard to interpret directly, and initialization or data can affect training; this walkthrough fixes random_state=42 for reproducibility."
      },
      one_r:{
        learned:"One-R tests individual features and chooses the one whose simple rules make the fewest training errors.",
        see:"The table shows the selected feature, its exact fitted values or intervals, predicted classes, and training-row counts. The baseline compares against always choosing the majority class.",
        read:"Compare One-R with the majority baseline, then read each rule as the class the fitted rule predicts.",
        watchOut:"One-R deliberately uses one feature, so it is a simple baseline rather than a flexible final model. Its purpose is simplicity."
      },
      kmeans:{
        learned:"K-Means starts with k centres, assigns each row to its nearest centroid, moves each centroid to the average of its assigned rows, and repeats until the assignments or centres settle.",
        see:names.length === 2
          ? "See cluster sizes, silhouette values, original-unit profiles, and a direct map of the two selected inputs. The fit still uses both prepared dimensions."
          : "See cluster sizes, silhouette values, original-unit profiles, and an optional PCA map. The fit uses all selected prepared dimensions; each map is only a two-dimensional view.",
        read:"Compare inertia and silhouette with cluster sizes and original-unit profiles. Cluster IDs are arbitrary, and a small cluster may be meaningful, rare, an outlier pattern, or a fragmented solution.",
        watchOut:"Inertia usually decreases as k increases, so the smallest inertia is not a valid choice. K-Means works best for compact, roughly spherical groups and can be pulled by outliers or unlucky initial centres; multiple n_init starts reduce dependence on one starting set."
      },
      hierarchical:{
        learned:"Agglomerative clustering starts with each row as its own group and repeatedly merges groups. Ward linkage chooses merges that add the least within-group variation.",
        see:names.length === 2
          ? "See the reproducible sample's dendrogram, merge heights, silhouette evidence, original-unit profiles, and a direct map of the two selected inputs."
          : "See the reproducible sample's dendrogram, merge heights, silhouette evidence, original-unit profiles, and an optional PCA map.",
        read:"Read leaves as observations or small groups, joins as merges, and height as Ward merge dissimilarity. A horizontal cut represents a cluster count; silhouette supports the choice but does not decide it.",
        watchOut:"The hierarchy is fitted on a sample of at most 500 rows, so a different sample can produce somewhat different branches. Cluster IDs are arbitrary, and the PCA map is only a two-dimensional projection."
      },
      pca:{
        learned:"PCA learned new weighted axes that capture decreasing amounts of variance in the scaled inputs.",
        see:"See the explained-variance plots, the full labelled loading table, and row coordinates on the first two principal components.",
        read:"Use explained variance to judge how much variation each component represents, and loadings to understand which original features shape each axis. A loading describes a feature's contribution; a score describes a row's position.",
        watchOut:"PCA is a linear projection that prioritises variance, not prediction usefulness. A two-dimensional map can hide variation in later components, and component directions are not causal effects or supervised feature importance."
      }
    };
    const selected = templates[modelId];
    return selected ? {modelId, ...selected} : null;
  }

  function neuralNetworkBuildConcepts(config, modelId) {
    const earlyStopping = modelId === "mlp_reg" && config.split === "time"
      ? concept("early-stopping", "EARLY STOPPING ON THIS ROUTE", "Built-in early stopping is disabled on this chronological route because sklearn's internal early-stopping split is not time-aware. The outer TimeSeriesSplit remains the validation evidence, while optimization stops using the model's normal convergence criterion.", ["early-stopping", "time-aware-validation"])
      : concept("early-stopping", "EARLY STOPPING", "With early_stopping=True, the network can hold aside a small internal part of the current training fold and stop when that internal validation performance stops improving. This is not outer CV or the final test, and it does not replace either.", ["early-stopping", "internal-validation"]);
    const concepts = [
      concept("hidden-layer", "HIDDEN LAYER", "A layer between the inputs and final output. Its units learn weighted combinations of earlier signals.", ["hidden-layer", "hidden-layers"]),
      concept("hidden-layer-sizes", "hidden_layer_sizes", "The starting network has one hidden layer with 24 units. The first search compares that with a smaller (16,) layer; the tuple is compact configuration syntax.", ["hidden-layer-sizes"]),
      earlyStopping
    ];
    if (modelId === "mlp_reg") concepts.push(concept("target-scaling", "TARGET SCALING", "TransformedTargetRegressor scales y while the inner MLP trains and automatically converts predictions back to the target's original units. In the tuning grid, model__regressor__... routes settings to that inner MLP.", ["TransformedTargetRegressor", "target-scaling", "nested-parameter-routing"]));
    return concepts;
  }

  function supervisedTeaching(config, value, modelId, folds = 5) {
    const metricMeta = primaryMetricMetadata(config);
    const closing = supervisedClosingTeaching(config, value);
    return {
      frame: {
        question:routeFrameQuestion(config, value),
        readingCue:"Check that X contains the selected features and y contains the target.",
        concepts:frameConcepts(config, value),
        practice:practiceForTask(config, value, modelId, "frame")
      },
      split: {
        question:"Which rows are available for learning, and which are being saved for the final check?",
        readingCue:config.split === "time"
          ? "Check the earlier training count and later saved-test count."
          : "Check the development count and saved-test count; the saved outcomes stay sealed.",
        concepts:splitConcepts(config),
        practice:practiceForTask(config, value, modelId, "split")
      },
      explore: {
        question:`Does ${friendlyColumnName(featureNames(value)[0])} show a training pattern related to ${friendlyColumnName(config.target)}?`,
        readingCue:exploreReadingCue(config, value)
      },
      prepare: {
        question:"What preparation does this particular model need?",
        readingCue:preprocessingReadingCue(config, value, modelId),
        concepts:preprocessingConcepts(config, value, modelId),
        practice:practiceForTask(config, value, modelId, "prepare")
      },
      model: {
        question:modelPurposeQuestion(modelId, config),
        readingCue:"Read the model recipe, then connect its named operation to the selected inputs.",
        concepts:[...pipelineConcepts(config), ...(["mlp_cls", "mlp_reg"].includes(modelId) ? neuralNetworkBuildConcepts(config, modelId) : [])],
        practice:practiceForTask(config, value, modelId, "model")
      },
      baseline: {
        question:"Do validation results stay reasonably similar across folds?",
        readingCue:config.split === "time"
          ? "Look for whether validation scores change across later time windows; these folds are ordered rather than random."
          : "Read the one primary validation metric across folds; the next step compares it with a simple guess.",
        metricMeta,
        metricHelp:metricHelpFor(config, "baseline"),
        concepts:cvConcepts(config, folds),
        practice:practiceForTask(config, value, modelId, "baseline", folds)
      },
      reference: {
        question:"Do the selected features beat a simple guess on the same training folds?",
        readingCue:config.task === "classification"
          ? "Compare the initial model's mean macro F1 with the most-common-class reference; higher is better."
          : "Compare the initial model's mean RMSE with the mean-target reference; lower is better.",
        metricMeta,
        metricHelp:metricHelpFor(config, "reminder"),
        concepts:[concept("reference-predictor", "REFERENCE PREDICTOR", config.task === "classification"
          ? "A most-common-class reference predicts the class seen most often in the training rows. It gives the feature-based model a simple same-fold comparison point."
          : "A mean-target reference predicts the training mean for every row. It gives the feature-based model a simple same-fold comparison point.", ["reference-predictor", "baseline-comparison"])],
        practice:practiceForTask(config, value, modelId, "reference", folds)
      },
      tune: {
        question:modelSpec(modelId, value).grid === "{}" ? "This route keeps its current settings. What should we inspect next?" : tuningQuestion(modelId, config),
        readingCue:modelSpec(modelId, value).grid === "{}" ? "No settings were searched; continue to the validation errors." : "Compare the supported setting using training folds only; the final test remains untouched.",
        metricMeta,
        metricHelp:metricHelpFor(config, "reminder"),
        concepts:tuningConcepts(config, modelId, value),
        practice:practiceForTask(config, value, modelId, "tune")
      },
      diagnose: {
        question:config.task === "classification" ? "Which classes are most often confused in training-only validation?" : "Do training-only residuals form a roughly random cloud around zero?",
        readingCue:config.task === "classification"
          ? "Look for which actual classes are most often confused and whether errors cluster by class."
          : "Look for whether residuals form a roughly random cloud around zero or show a pattern.",
        modelTeaching:modelSpecificTeaching(config, modelId, value),
        practice:practiceForTask(config, value, modelId, "diagnose")
      },
      final: {
        question:closing.question,
        readingCue:closing.readingCue,
        metricMeta,
        metricHelp:metricHelpFor(config, "final"),
        comparison:true,
        practice:practiceForTask(config, value, modelId, "final")
      }
    };
  }

  function normalizeTeachingNumber(value) {
    if (value === null || value === undefined || value === "" || value === "—") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function meanTeachingValues(values) {
    return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
  }

  function cvSummaryFromTable(table, taskType, split = "random", target = null) {
    const metric = taskType === "classification"
      ? {key:"macro_f1", label:"Macro F1", direction:"higher", directionSymbol:"↑", trainColumn:"train_macro_f1", validationColumn:"validation_macro_f1"}
      : {key:"rmse", label:"RMSE", direction:"lower", directionSymbol:"↓", trainColumn:"train_rmse", validationColumn:"validation_rmse"};
    const columns = Array.isArray(table?.columns) ? table.columns : [];
    const rows = Array.isArray(table?.rows) ? table.rows : [];
    const columnIndex = name => columns.indexOf(name);
    const valuesFor = name => {
      const index = columnIndex(name);
      if (index < 0) return [];
      return rows.map(row => normalizeTeachingNumber(row?.[index])).filter(value => value !== null);
    };
    const validation = valuesFor(metric.validationColumn);
    const training = valuesFor(metric.trainColumn);
    if (!validation.length || validation.length !== training.length) return null;
    const validationMean = meanTeachingValues(validation);
    const trainingMean = meanTeachingValues(training);
    const gap = metric.direction === "higher" ? trainingMean - validationMean : validationMean - trainingMean;
    return {
      task:taskType,
      target,
      split,
      timeSeries:split === "time",
      metric,
      foldCount:validation.length,
      validationMean,
      validationMin:Math.min(...validation),
      validationMax:Math.max(...validation),
      trainingMean,
      gap
    };
  }

  function formatTeachingNumber(value) {
    const number = normalizeTeachingNumber(value);
    if (number === null) return "—";
    return Number(number.toFixed(3)).toString();
  }

  function cvStabilityText(summary) {
    const range = summary.validationMax - summary.validationMin;
    const scale = summary.task === "classification" ? 1 : Math.max(Math.abs(summary.validationMean), 1);
    const relativeRange = range / scale;
    const fairlySimilar = summary.task === "classification" ? range <= 0.05 : relativeRange <= 0.15;
    const noticeable = summary.task === "classification" ? range <= 0.10 : relativeRange <= 0.30;
    if (summary.timeSeries) {
      if (fairlySimilar) return "Validation scores are fairly similar across the later time windows, but these folds are ordered windows rather than interchangeable random samples.";
      if (noticeable) return "Validation scores move somewhat across the later time windows, suggesting that some periods are harder than others; these are ordered windows rather than interchangeable random samples.";
      return "Validation scores vary substantially across the later time windows, suggesting that the prediction problem is harder in some periods than others; these are ordered windows rather than interchangeable random samples.";
    }
    if (fairlySimilar) return "The validation scores are fairly similar across folds, so performance does not appear to depend on one unusually easy split.";
    if (noticeable) return "Validation results show some variation across folds, so performance is not identical across different subsets.";
    return "Validation results vary substantially across folds, so performance is less stable across different subsets.";
  }

  function cvGapText(summary) {
    const gap = summary.gap;
    if (gap <= 0) {
      return summary.metric.direction === "higher"
        ? "Training performance is not higher than validation performance in this run."
        : "Training error is not lower than validation error in this run.";
    }
    const scale = summary.task === "classification" ? 1 : Math.max(Math.abs(summary.validationMean), 1);
    const relativeGap = gap / scale;
    const small = summary.task === "classification" ? gap <= 0.03 : relativeGap <= 0.10;
    const moderate = summary.task === "classification" ? gap <= 0.08 : relativeGap <= 0.25;
    if (small) {
      return summary.metric.direction === "higher"
        ? "Training performance is only slightly higher than validation performance."
        : "Training error is only slightly lower than validation error.";
    }
    if (moderate) {
      return "Training performance is moderately stronger than validation performance, which may indicate that the model is fitting the training rows more closely than it generalizes.";
    }
    return "Training performance is much stronger than validation performance, which may indicate overfitting.";
  }

  function finalComparisonFromTable(summary, table) {
    if (!summary || !Array.isArray(table?.columns) || !Array.isArray(table?.rows)) return null;
    const metricIndex = table.columns.indexOf("metric");
    const valueIndex = table.columns.indexOf("value");
    if (metricIndex < 0 || valueIndex < 0) return null;
    const wanted = summary.metric.label.toLowerCase().replace("²", "2").replace(/\s+/g, "_");
    const row = table.rows.find(values => String(values?.[metricIndex] || "").toLowerCase().replace("²", "2").replace(/\s+/g, "_") === wanted);
    const finalTest = normalizeTeachingNumber(row?.[valueIndex]);
    if (finalTest === null) return null;
    const insideRange = finalTest >= summary.validationMin && finalTest <= summary.validationMax;
    let interpretation;
    if (insideRange) {
      interpretation = "The selected-model final score falls inside the initial-model fold range. This is a descriptive comparison between potentially different configurations, not a performance guarantee.";
    } else {
      const worse = summary.metric.direction === "higher" ? finalTest < summary.validationMin : finalTest > summary.validationMax;
      interpretation = worse
        ? "The selected-model final score is worse than the initial-model fold scores. These describe different samples and potentially different configurations; the fold range is not a confidence interval."
        : "The selected-model final score is stronger than the initial-model fold scores. One split can be easier by chance, and tuning may have changed the configuration; this does not prove an improvement.";
    }
    return {
      metric:summary.metric,
      meanCV:summary.validationMean,
      cvMin:summary.validationMin,
      cvMax:summary.validationMax,
      finalTest,
      insideRange,
      interpretation
    };
  }

  const task = (id, title, caption, code, teaching = {}) => {
    const details = typeof teaching === "string" ? {question:teaching} : (teaching || {});
    const concepts = Array.isArray(details.concepts) ? details.concepts : [];
    const bundle = code && typeof code === "object" && !Array.isArray(code) ? code : {primaryCode:code};
    const primaryCode = bundle.primaryCode ?? bundle.code ?? bundle.primary ?? "";
    const setupCode = bundle.setupCode ?? bundle.setup ?? "";
    const evidenceCode = bundle.evidenceCode ?? bundle.evidence ?? "";
    const advancedCode = bundle.advancedCode ?? ([setupCode, evidenceCode].filter(Boolean).join("\n\n") || "");
    const optionalCode = bundle.optionalCode ?? bundle.referenceCode ?? "";
    return {
      id,
      title,
      caption,
      question:details.question || "",
      action:details.action || teachingActionForTask({id, title, caption, question:details.question || ""}),
      readingCue:details.readingCue || "",
      concepts,
      conceptKeys:[...new Set(details.conceptKeys || concepts.flatMap(item => Array.isArray(item.keys) ? item.keys : [item.key]).filter(Boolean))],
      modelTeaching:details.modelTeaching || null,
      metricHelp:Array.isArray(details.metricHelp) ? details.metricHelp : [],
      metricMeta:details.metricMeta || null,
      comparison:Boolean(details.comparison),
      practice:details.practice || null,
      code:formatRouteCode(primaryCode),
      primaryCode:formatRouteCode(primaryCode),
      setupCode:formatRouteCode(setupCode),
      evidenceCode:formatRouteCode(evidenceCode),
      advancedCode:formatRouteCode(advancedCode),
      optionalCode:formatRouteCode(optionalCode)
    };
  };
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
    if (config.prepare === "df") return "";
    if (config.target === "popular") return [
      "model_df = df.copy()",
      "model_df[\"popular\"] = np.where(model_df[\"winpercent\"] >= 50, \"50% or above\", \"below 50%\")"
    ].join("\n");
    if (config.target === "quality") return "model_df = df.drop_duplicates().reset_index(drop=True)";
    if (config.target === "Rented Bike Count") return [
      "model_df = df.copy()",
      "model_df[\"date\"] = pd.to_datetime(model_df[\"Date\"], dayfirst=True)",
      "model_df = model_df.sort_values([\"date\", \"Hour\"]).reset_index(drop=True)"
    ].join("\n");
    if (config.target === "lifeExp") return "model_df = df[df[\"year\"].eq(2007)].copy()";
    return `model_df = ${config.prepare}`;
  }

  function pythonList(values) {
    if (!values.length) return "[]";
    return `[\n${values.map(value => `    ${py(value)}`).join(",\n")}\n]`;
  }

  function frameCode(config, value, unsupervised = false) {
    const frameName = modelFrameName(config);
    const targetLine = unsupervised ? "" : `y = ${frameName}[${py(config.target)}].copy()`;
    const featureGroups = [];
    if (value.continuous.length) featureGroups.push(["numeric_features", value.continuous]);
    if (value.binary.length) featureGroups.push(["binary_features", value.binary]);
    if (value.categorical.length) featureGroups.push(["categorical_features", value.categorical]);
    const typedGroups = [
      ...featureGroups.map(([name, values]) => `${name} = ${pythonList(values)}`),
      `feature_names = ${featureGroups.map(([name]) => name).join(" + ") || "[]"}`
    ];
    if (!unsupervised && value.binary.length) {
      // Keep the raw typed groups above as the single source of column names.
      // Derived groups let later preparation refer to them without copying a
      // second list of feature literals into a later cell.
      typedGroups.push(
        `numeric_binary_features = [name for name in binary_features if name in ${pythonList(config.binaryNumeric || [])}]`,
        "encoded_binary_features = [name for name in binary_features if name not in numeric_binary_features]"
      );
    }
    const featureBlock = typedGroups.join("\n");
    return `# 1 · Frame the ${unsupervised ? "unsupervised question" : "prediction problem"}
${featureBlock}

${modelFrameSetup(config)}
# X is the selected input table; y is the answer paired with the same rows.
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
    const primary = featureNames(value)[0];
    const primaryIsContinuous = value.continuous.includes(primary);
    const plot = config.task === "regression"
      ? primaryIsContinuous
        ? `sns.scatterplot(data=training_view, x=${py(primary)}, y="target", ax=ax, color="#137c9c")`
        : `sns.boxplot(data=training_view, x=${py(primary)}, y="target", ax=ax, color="#7651a6")`
      : primaryIsContinuous
        ? `sns.histplot(data=training_view, x=${py(primary)}, hue="target", kde=True, element="step", ax=ax)`
        : `sns.countplot(data=training_view, x=${py(primary)}, hue="target", ax=ax)`;
    const summary = config.task === "classification"
      ? `summary = y_train.value_counts().rename_axis("target").reset_index(name="rows")`
      : (value.binary.length || value.categorical.length)
        ? `summary = X_train.describe(include="all").T`
        : `summary = X_train.describe().T`;
    return `# 3 · Explore one training-data view
training_view = X_train.copy()
training_view["target"] = y_train
${summary}

fig, ax = plt.subplots(figsize=(7, 3.8))
${plot}
ax.set_title(${py(`Training-only view: ${friendlyColumnName(primary)}`)})
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
    return `# 6 · Validate the initial model with training-only cross-validation
from sklearn.model_selection import ${splitterName}, cross_validate

# ${config.split === "time" ? "Each validation block comes after the rows used to fit that fold; the windows are ordered." : "Each fold fits on its training rows and checks different validation rows."}
cv = ${splitter}
${config.task === "classification" ? `cv_results = cross_validate(
    pipeline, X_train, y_train, cv=cv, scoring="f1_macro", return_train_score=True,
)
fold_scores = pd.DataFrame({
    "fold":np.arange(1, len(cv_results["test_score"]) + 1),
    "train_macro_f1":cv_results["train_score"],
    "validation_macro_f1":cv_results["test_score"],
})
# scikit-learn names each fold's validation column test_score. These are inner-CV validation rows, not the saved final test.
print("Here, test_score means the validation score for each training-only fold; it is not the saved final test score.")` : `cv_results = cross_validate(
    pipeline, X_train, y_train, cv=cv, scoring="neg_root_mean_squared_error", return_train_score=True,
)
fold_scores = pd.DataFrame({
    "fold":np.arange(1, len(cv_results["test_score"]) + 1),
    "train_rmse":-cv_results["train_score"],
    "validation_rmse":-cv_results["test_score"],
})
# neg_root_mean_squared_error is negative because model-selection tools maximise scores. Negate test_score to show ordinary positive RMSE, where lower is better.
print("The RMSE scorer is negative for model selection; this table shows positive RMSE after negating test_score, so lower is better.")`}
fold_scores.round(3)`;
  }

  function referenceCode(config) {
    const classification = config.task === "classification";
    return `# 7 · Compare one simple reference predictor
from sklearn.model_selection import cross_val_score
from sklearn.dummy import ${classification ? "DummyClassifier" : "DummyRegressor"}
reference = ${classification ? 'DummyClassifier(strategy="most_frequent")' : 'DummyRegressor(strategy="mean")'}
reference_scores = cross_val_score(
    reference, X_train, y_train, cv=cv, scoring=${py(classification ? "f1_macro" : "neg_root_mean_squared_error")},
)
reference_comparison = pd.Series({${classification ? '"Initial model":cv_results["test_score"].mean(), "Most-common-class reference":reference_scores.mean()' : '"Initial model RMSE":-cv_results["test_score"].mean(), "Mean-target reference RMSE":-reference_scores.mean()'}})
chosen_pipeline = pipeline
reference_comparison.round(3)`;
  }

  function preprocessingCode(config, value, modelId) {
    const model = MODELS[modelId];
    const plan = preprocessingPlan(config, value, modelId);
    const {numericBinary, encodedFeatures, allNumeric, allEncoded, allContinuous, useOrdinal, needsScale, hasMissing} = plan;
    if (modelId === "one_r") {
      const oneRNumeric = value.continuous.length ? "numeric_features" : "[]";
      const oneRCategorical = [value.binary.length ? "binary_features" : "", value.categorical.length ? "categorical_features" : ""].filter(Boolean).join(" + ") || "[]";
      return [
      "# 4 · Define the One-R preparation recipe",
      "# The public adapter keeps feature types and fits category codes inside each CV fold.",
      "preprocessor = OneRPreprocessor(",
      `    numeric_features=${oneRNumeric},`,
      `    categorical_features=${oneRCategorical},`,
      ")",
      "preprocessor"
      ].join("\n");
    }
    const categoricalNB = modelId === "naive_bayes" && allEncoded && !value.binary.length;
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
    if (encodedFeatures.length) declarations.push("category_encoder = " + encoder);
    const branches = [];
    const encodedColumnsExpression = value.binary.length
      ? (value.categorical.length ? "encoded_binary_features + categorical_features" : "encoded_binary_features")
      : "categorical_features";
    const addGroup = (name, columnsExpression, kind, encode = null) => {
      if (!columnsExpression) return;
      branches.push("    (\"" + name + "\", " + transformerFor(kind, encode) + ", " + columnsExpression + ")");
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
      expression = transformerFor("categorical", "category_encoder");
      if (hasMissing && !imports.includes("from sklearn.pipeline import Pipeline")) addImport("from sklearn.pipeline import Pipeline");
    } else {
      addImport("from sklearn.compose import ColumnTransformer");
      if (value.continuous.length) addGroup("continuous", "numeric_features", "continuous");
      if (numericBinary.length) addGroup("numeric_binary", "numeric_binary_features", "binary");
      if (encodedFeatures.length) addGroup("encoded", encodedColumnsExpression, "categorical", "category_encoder");
      expression = "preprocessor = ColumnTransformer([\n" + branches.join(",\n") + "\n], verbose_feature_names_out=False)";
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
      else if (modelId === "naive_bayes") comments.push("# This Naive Bayes family models class-conditional feature evidence/distributions directly, so scaling is unnecessary.");
      else if (keepOriginalUnits) comments.push("# Original numeric units stay visible so linear coefficients are easier to interpret.");
      else if (model.preprocessNote) comments.push("# " + model.preprocessNote);
    }

    const declarationPrefix = declarations.length ? declarations.join("\n") + "\n" : "";
    const assignment = expression.includes("preprocessor =") ? declarationPrefix + expression : declarationPrefix + "preprocessor = " + expression;
    const wrappedAssignment = modelId === "one_r"
      ? "preprocessor = OneRPreprocessor(\n    numeric_features=numeric_features,\n    categorical_features=binary_features + categorical_features,\n)"
      : assignment;
    return "# 4 · Prepare the selected data\n" + comments.join("\n") + "\n" + imports.join("\n") + "\n\n" + wrappedAssignment + "\n\npreprocessor";
  }

  function modelSpec(modelId, value, config = null) {
    const allBinary = value.continuous.length === 0 && value.categorical.length === 0 && value.binary.length > 0;
    const allCategorical = value.continuous.length === 0 && value.binary.length === 0 && value.categorical.length > 0;
    const allContinuous = value.continuous.length > 0 && value.binary.length === 0 && value.categorical.length === 0;
    const readable = (text) => text;
    const specs = {
      simple_linear:{concept:"Fit one straight-line relationship", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      multiple_linear:{concept:"Estimate one adjusted linear effect per encoded predictor", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      polynomial:{concept:"Expand continuous inputs into curved terms, then scale and regularise", imports:"from sklearn.preprocessing import PolynomialFeatures, StandardScaler\nfrom sklearn.linear_model import Ridge", estimator:"Ridge()", grid:readable("{\n    'polynomial__degree': [2, 3]\n}")},
      regression_tree:{concept:"Learn if/then splits for nonlinear numeric predictions", imports:"from sklearn.tree import DecisionTreeRegressor", estimator:"DecisionTreeRegressor(random_state=42)", grid:readable("{\n    'model__max_depth': [3, 5, None]\n}")},
      logistic:{concept:"Model class log-odds with a regularised linear boundary", imports:"from sklearn.linear_model import LogisticRegression", estimator:"LogisticRegression(max_iter=2000, random_state=42)", grid:readable("{\n    'model__C': [0.1, 1.0, 10.0]\n}")},
      svm_cls:{concept:"Find a maximum-margin boundary; RBF allows curvature", imports:"from sklearn.svm import SVC", estimator:"SVC(random_state=42)", grid:readable("{\n    'model__C': [0.5, 2, 10]\n}")},
      one_r: !value.continuous.length
        ? {concept:"Use the single feature whose simple rules make the fewest errors", imports:"# One-R and its public feature-type adapter are preloaded helpers.", estimator:"OneRClassifier(bins=5)", grid:"{}"}
        : {concept:"Use the single feature whose simple rules make the fewest errors", imports:"# One-R and its public feature-type adapter are preloaded helpers.", estimator:"OneRClassifier(bins=5)", grid:readable("{\n    'model__bins': [3, 5, 8]\n}")},
      classification_tree:{concept:"Learn interpretable if/then splits for class labels", imports:"from sklearn.tree import DecisionTreeClassifier", estimator:"DecisionTreeClassifier(random_state=42)", grid:readable("{\n    'model__max_depth': [3, 5, None]\n}")},
      knn_cls:{concept:"Vote using nearby training examples; distance makes scaling essential", imports:"from sklearn.neighbors import KNeighborsClassifier", estimator:"KNeighborsClassifier()", grid:readable("{\n    'model__n_neighbors': [3, 5, 9]\n}")},
      qda:{concept:"Give each class its own covariance shape and curved boundary", note:"A small amount of regularisation keeps class covariance estimates stable.", imports:"from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis", estimator:"QuadraticDiscriminantAnalysis(reg_param=0.1)", grid:readable("{\n    'model__reg_param': [0.1, 0.2, 0.5, 0.9]\n}")},
      lda:{concept:"Share one covariance shape and learn linear class boundaries", imports:"from sklearn.discriminant_analysis import LinearDiscriminantAnalysis", estimator:"LinearDiscriminantAnalysis(solver='lsqr')", grid:readable("{\n    'model__shrinkage': [None, 'auto']\n}")},
      naive_bayes: allBinary
        ? {concept:"Estimate independent Bernoulli probabilities for binary inputs", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:readable("{\n    'model__alpha': [0.1, 1.0, 5.0]\n}")}
        : allCategorical
          ? {concept:"Turn categories into yes/no features and estimate their likelihood within each class", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:readable("{\n    'model__alpha': [0.1, 1.0, 5.0]\n}")}
          : allContinuous
            ? {concept:"Estimate class-conditional feature densities and class probabilities with a Gaussian distribution per feature", imports:"from sklearn.naive_bayes import GaussianNB", estimator:"GaussianNB()", grid:readable("{\n    'model__var_smoothing': [1e-11, 1e-9, 1e-7]\n}")}
            : null,
      mlp_cls:{concept:"Learn nonlinear layers of weighted features with backpropagation", imports:"from sklearn.neural_network import MLPClassifier", estimator:"MLPClassifier(\n    hidden_layer_sizes=(24,),\n    max_iter=500,\n    early_stopping=True,\n    random_state=42\n)", grid:readable("{\n    'model__hidden_layer_sizes': [(16,), (24,)]\n}")},
      mlp_reg:{concept:"Learn nonlinear layers while scaling the target inside the model", imports:"from sklearn.neural_network import MLPRegressor\nfrom sklearn.compose import TransformedTargetRegressor\nfrom sklearn.preprocessing import StandardScaler", estimator:"TransformedTargetRegressor(\n    regressor=MLPRegressor(\n        hidden_layer_sizes=(24,),\n        max_iter=800,\n        early_stopping=" + (config && config.split === "time" ? "False" : "True") + ",\n        tol=1e-3,\n        random_state=42\n    ),\n    transformer=StandardScaler()\n)", grid:readable("{\n    'model__regressor__hidden_layer_sizes': [(16,), (24,)]\n}")}
    };
    return specs[modelId];
  }

  function modelCode(modelId, value, config = null) {
    const spec = modelSpec(modelId, value, config);
    if (modelId === "mlp_reg") return [
      "# 5 · Build the model pipeline",
      "# " + spec.concept,
      "from sklearn.pipeline import Pipeline",
      spec.imports,
      "",
      "network = MLPRegressor(",
      "    hidden_layer_sizes=(24,),",
      "    max_iter=800,",
      `    early_stopping=${config && config.split === "time" ? "False" : "True"},`,
      "    tol=1e-3,",
      "    random_state=42,",
      ")",
      "model = TransformedTargetRegressor(",
      "    regressor=network,",
      "    transformer=StandardScaler(),",
      ")",
      "pipeline = Pipeline([",
      "    (\"prepare\", preprocessor),",
      "    (\"model\", model)",
      "])",
      "pipeline"
    ].join("\n");
    if (modelId === "polynomial") return [
      "# 5 · Build the model pipeline",
      "# " + spec.concept,
      "from sklearn.pipeline import Pipeline",
      spec.imports,
      "",
      "polynomial = PolynomialFeatures(degree=2, include_bias=False)",
      "scale = StandardScaler()",
      "model = Ridge()",
      "pipeline = Pipeline([",
      "    (\"polynomial\", polynomial),",
      "    (\"scale\", scale),",
      "    (\"model\", model)",
      "])",
      "pipeline"
    ].join("\n");
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
      "# 8 · Keep the model defaults",
      "chosen_pipeline = pipeline",
      "print(\"This walkthrough does not use a tuning grid for this model, so we keep its defaults.\")",
      "chosen_pipeline"
    ].join("\n");
    const displayedScore = config.task === "classification" ? "search.best_score_" : "-search.best_score_";
    return [
      "# 8 · Tune the model inside the same training folds",
      "from sklearn.model_selection import GridSearchCV",
      "parameter_grid = " + spec.grid,
      "search = GridSearchCV(",
      "    pipeline,",
      "    parameter_grid,",
      "    cv=cv,",
      "    scoring=" + py(scoring),
      ")",
      "search.fit(X_train, y_train)",
      "chosen_pipeline = search.best_estimator_",
      "print(\"Chosen setting:\", search.best_params_)",
      "print(\"Search CV " + displayedMetric + ":\", round(" + displayedScore + ", 3))",
      "print(\"The score describes validation folds used for selection; the final test remains untouched.\")",
      "chosen_pipeline"
    ].join("\n");
  }
  function interpretationCode(config, modelId, value) {
    const targetLabel = `${friendlyColumnName(config.target)} (${config.target})`;
    const selectedFeatures = featureNames(value);
    const classLabels = py(classLabelMap(config));
    const unitLabels = py(Object.fromEntries(selectedFeatures.map(name => [name, featureUnitInfo(name).unit])));
    const twoFeatureContinuous = selectedFeatures.length === 2 && value.continuous.length === 2 && !value.binary.length && !value.categorical.length;
    const preparedNames = [
      "prepare = diagnostic_model.named_steps[\"prepare\"]",
      "encoded_names = prepare.get_feature_names_out() if hasattr(prepare, \"get_feature_names_out\") else np.array(feature_names)"
    ].join("\n");
    if (modelId === "simple_linear") {
      const feature = selectedFeatures[0];
      const unitInfo = featureUnitInfo(feature);
      return [
        "fitted = diagnostic_model.named_steps[\"model\"]",
        `simple_feature = ${py(feature)}`,
        `simple_target = ${py(config.target)}`,
        "simple_x = X_train[simple_feature].astype(float).to_numpy()",
        "simple_grid = np.linspace(float(simple_x.min()), float(simple_x.max()), 160)",
        "simple_grid_frame = pd.DataFrame({simple_feature:simple_grid})",
        "simple_curve = diagnostic_model.predict(simple_grid_frame)",
        "fig, ax = plt.subplots(figsize=(7.2, 4.2))",
        "ax.scatter(simple_x, y_train.to_numpy(), alpha=.55, color=\"#137c9c\", label=\"training rows\")",
        "simple_oof_x = X_train.loc[diagnostic_actual.index, simple_feature].astype(float).to_numpy()",
        "ax.scatter(simple_oof_x, diagnostic_prediction, alpha=.7, facecolors=\"none\", edgecolors=\"#7651a6\", label=\"OOF predictions\")",
        "ax.plot(simple_grid, simple_curve, color=\"#c75b20\", linewidth=2.4, label=\"fitted line\")",
        `ax.set(title=${py(`Fitted line: ${friendlyColumnName(feature)} → ${friendlyColumnName(config.target)}`)}, xlabel=${py(`${friendlyColumnName(feature)} (${feature})`)}, ylabel=${py(targetLabel)})`,
        "ax.legend()",
        "fig.tight_layout()",
        "simple_slope = float(fitted.coef_[0])",
        "simple_intercept = float(fitted.intercept_)",
        `simple_unit_factor = ${unitInfo.factor}`,
        `simple_unit_phrase = ${py(unitInfo.phrase)}`,
        "simple_interpretation = pd.DataFrame({",
        "    \"feature\":[simple_feature],",
        "    \"target\":[simple_target],",
        "    \"slope_per_original_unit\":[simple_slope],",
        "    \"meaningful_change\":[simple_unit_phrase],",
        "    \"predicted_change_for_meaningful_change\":[simple_slope * simple_unit_factor],",
        "    \"intercept_at_feature_0\":[simple_intercept]",
        "})",
        "simple_interpretation.round(3)"
      ].join("\n");
    }
    if (modelId === "multiple_linear") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "linear_coefficients = fitted.coef_",
      `linear_unit_map = ${unitLabels}`,
      "linear_feature_units = [linear_unit_map.get(str(name), \"prepared/encoded feature units\") for name in encoded_names]",
      "linear_directions = np.where(linear_coefficients >= 0, \"higher predicted target\", \"lower predicted target\")",
      "linear_interpretation = pd.DataFrame({",
      "    \"feature\":encoded_names,",
      "    \"coefficient\":linear_coefficients,",
      "    \"meaningful_unit\":linear_feature_units,",
      "    \"direction\":linear_directions,",
      "    \"plain_english\":[f\"Within this fitted model, a change in {name} is associated with a {direction.lower()}.\" for name, direction in zip(encoded_names, linear_directions)]",
      "})",
      "linear_interpretation.head(50)"
    ].join("\n");
    if (modelId === "polynomial") return [
      ...(selectedFeatures.length === 1 ? [] : [preparedNames]),
      "fitted = diagnostic_model.named_steps[\"model\"]",
      ...(selectedFeatures.length === 1 ? [
        "poly_feature = feature_names[0]",
        "poly_x = X_train[poly_feature].astype(float).to_numpy()",
        "poly_grid = np.linspace(float(poly_x.min()), float(poly_x.max()), 160)",
        "poly_grid_frame = pd.DataFrame({poly_feature:poly_grid})",
        "poly_curve = diagnostic_model.predict(poly_grid_frame)",
        "fig, ax = plt.subplots(figsize=(7.2, 4.2))",
        "ax.scatter(poly_x, y_train.to_numpy(), alpha=.55, color=\"#137c9c\", label=\"training rows\")",
        "ax.plot(poly_grid, poly_curve, color=\"#7651a6\", linewidth=2.4, label=\"fitted curve\")",
        `ax.set(title=${py(`Fitted curve: ${friendlyColumnName(selectedFeatures[0])} → ${friendlyColumnName(config.target)}`)}, xlabel=${py(`${friendlyColumnName(selectedFeatures[0])} (${selectedFeatures[0]})`)}, ylabel=${py(targetLabel)})`,
        "ax.legend()",
        "fig.tight_layout()",
        "polynomial_degree = int(fitted.named_steps[\"poly\"].degree)",
        "polynomial_summary = pd.DataFrame({\"feature\":[poly_feature], \"target\":[" + py(config.target) + "], \"degree\":[polynomial_degree], \"curve_points\":[len(poly_grid)]})",
        "polynomial_summary"
      ] : [
        "term_names = fitted.named_steps[\"poly\"].get_feature_names_out(encoded_names)",
        "polynomial_terms = pd.DataFrame({\"term\":term_names, \"regularized_weight\":np.ravel(fitted.named_steps[\"regression\"].coef_)})",
        "print(\"This route uses multiple inputs, so no single 2D fitted curve is shown.\")",
        "polynomial_terms.head(20)"
      ])
    ].join("\n");
    if (["regression_tree","classification_tree"].includes(modelId)) {
      const classificationTree = modelId === "classification_tree";
      return [
        "from sklearn.tree import plot_tree",
        preparedNames,
        "fitted = diagnostic_model.named_steps[\"model\"]",
        "tree_example_position = 0",
        "tree_preparer = diagnostic_model.named_steps[\"prepare\"]",
        "tree_row = X_train.iloc[[tree_example_position]]",
        "tree_transformed = tree_row.to_numpy() if isinstance(tree_preparer, str) else tree_preparer.transform(tree_row)",
        "if hasattr(tree_transformed, \"toarray\"): tree_transformed = tree_transformed.toarray()",
        "tree_node = 0",
        "tree_path_rows = []",
        "while fitted.tree_.children_left[tree_node] != fitted.tree_.children_right[tree_node]:",
        "    tree_feature_index = int(fitted.tree_.feature[tree_node])",
        "    tree_threshold = float(fitted.tree_.threshold[tree_node])",
        "    tree_value = float(tree_transformed[0, tree_feature_index])",
        "    tree_go_left = tree_value <= tree_threshold",
        "    tree_path_rows.append({\"step\":len(tree_path_rows) + 1, \"condition\":f\"{encoded_names[tree_feature_index]} <= {tree_threshold:.3g}\" if tree_go_left else f\"{encoded_names[tree_feature_index]} > {tree_threshold:.3g}\", \"observed_value\":tree_value, \"next_branch\":\"left\" if tree_go_left else \"right\"})",
        "    tree_node = int(fitted.tree_.children_left[tree_node] if tree_go_left else fitted.tree_.children_right[tree_node])",
        "tree_path = pd.DataFrame(tree_path_rows, columns=[\"step\", \"condition\", \"observed_value\", \"next_branch\"])",
        "tree_actual = y_train.iloc[tree_example_position]",
        "tree_prediction = diagnostic_model.predict(tree_row)[0]",
        `tree_class_labels = ${classLabels}`,
        "tree_importance = pd.DataFrame({\"feature\":encoded_names, \"importance\":fitted.feature_importances_}).sort_values(\"importance\", ascending=False)",
        "fig, ax = plt.subplots(figsize=(9, 4.6))",
        "plot_tree(fitted, max_depth=2, feature_names=encoded_names, filled=True, rounded=True, fontsize=7, ax=ax)",
        "ax.set_title(\"Top of the fitted tree (training data only)\")",
        "fig.tight_layout()",
        "print(\"Training-only example row:\", tree_example_position)",
        ...(classificationTree ? [
          "print(\"Actual class:\", tree_class_labels.get(str(tree_actual), str(tree_actual)))",
          "print(\"Predicted class:\", tree_class_labels.get(str(tree_prediction), str(tree_prediction)))",
          "print(\"The leaf predicts the class most common among rows reaching it.\")"
        ] : [
          `print(\"Actual ${friendlyColumnName(config.target)}:\", tree_actual)`,
          `print(\"Leaf prediction for ${friendlyColumnName(config.target)}:\", tree_prediction)`,
          "print(\"The leaf prediction is the average target among rows reaching it.\")"
        ]),
        "print(\"Feature usage is split improvement within this fitted tree, not causation.\")",
        "print(\"Feature usage:\")",
        "print(tree_importance.head(15).round(3).to_string(index=False))",
        "tree_path"
      ].join("\n");
    }
    if (modelId === "logistic") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "logistic_coefficients = fitted.coef_",
      `logistic_class_labels = ${classLabels}`,
      "if logistic_coefficients.shape[0] == 1:",
      "    logistic_positive_class = fitted.classes_[1]",
      "    logistic_negative_class = fitted.classes_[0]",
      "    logistic_interpretation = pd.DataFrame({",
      "        \"feature\":encoded_names,",
      "        \"pushes_model_toward\":[logistic_class_labels.get(str(logistic_positive_class), str(logistic_positive_class)) if weight >= 0 else logistic_class_labels.get(str(logistic_negative_class), str(logistic_negative_class)) for weight in logistic_coefficients[0]],",
      "        \"relative_model_weight\":logistic_coefficients[0]",
      "    })",
      "    print(\"Positive/referenced class:\", logistic_class_labels.get(str(logistic_positive_class), str(logistic_positive_class)))",
      "else:",
      "    logistic_interpretation = pd.DataFrame(logistic_coefficients.T, index=encoded_names, columns=[f\"weight_toward_{logistic_class_labels.get(str(label), str(label))}\" for label in fitted.classes_]).reset_index(names=\"feature\")",
      "logistic_interpretation.head(50)"
    ].join("\n");
    if (modelId === "svm_cls") return [
      "svm_fit_indices, svm_validation_indices = next(cv.split(X_train, y_train))",
      "svm_example_position = int(svm_validation_indices[0])",
      "svm_fold_model = clone(chosen_pipeline).fit(X_train.iloc[svm_fit_indices], y_train.iloc[svm_fit_indices])",
      "svm_fitted = svm_fold_model.named_steps[\"model\"]",
      "svm_row = X_train.iloc[[svm_example_position]]",
      "svm_actual = y_train.iloc[svm_example_position]",
      "svm_prediction = svm_fold_model.predict(svm_row)[0]",
      `svm_class_labels = ${classLabels}`,
      "svm_support_positions = np.asarray(svm_fit_indices)[svm_fitted.support_]",
      "svm_support_labels = y_train.iloc[svm_support_positions].to_numpy()",
      "svm_support_counts = pd.DataFrame({\"class\":[svm_class_labels.get(str(label), str(label)) for label in svm_fitted.classes_], \"support_vectors\":svm_fitted.n_support_})",
      "svm_support_examples = pd.DataFrame({\"training_row\":svm_support_positions, \"class\":[svm_class_labels.get(str(label), str(label)) for label in svm_support_labels]})",
      "svm_decision_values = np.asarray(svm_fold_model.decision_function(svm_row)).reshape(-1)",
      "svm_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[svm_example_position], \"actual_class\":[svm_class_labels.get(str(svm_actual), str(svm_actual))], \"predicted_class\":[svm_class_labels.get(str(svm_prediction), str(svm_prediction))]})",
      "print(\"Support vectors per class:\")",
      "print(svm_support_counts.to_string(index=False))",
      "print(\"Selected out-of-fold row:\", svm_example_position)",
      "print(\"Actual class:\", svm_class_labels.get(str(svm_actual), str(svm_actual)))",
      "print(\"Predicted class:\", svm_class_labels.get(str(svm_prediction), str(svm_prediction)))",
      "if len(svm_fitted.classes_) == 2:",
      "    svm_decision_score = float(svm_decision_values[0])",
      "    svm_score_class = svm_fitted.classes_[1] if svm_decision_score >= 0 else svm_fitted.classes_[0]",
      "    print(\"Decision score (positive means\", svm_class_labels.get(str(svm_fitted.classes_[1]), str(svm_fitted.classes_[1])) + \"):\", round(svm_decision_score, 3))",
      "else:",
      "    svm_decision_score = None",
      "    svm_score_class = None",
      "    svm_multiclass_scores = pd.DataFrame({\"class\":[svm_class_labels.get(str(label), str(label)) for label in svm_fitted.classes_], \"decision_score\":svm_decision_values})",
      "    print(\"Multiclass SVM combines multiple class-separation decisions; there is no single universal boundary.\")",
      "    print(svm_multiclass_scores.to_string(index=False))",
      ...(twoFeatureContinuous ? [
        `svm_feature_x, svm_feature_y = ${py(selectedFeatures)}`,
        "svm_grid_x, svm_grid_y = np.meshgrid(np.linspace(float(X_train[svm_feature_x].min()), float(X_train[svm_feature_x].max()), 120), np.linspace(float(X_train[svm_feature_y].min()), float(X_train[svm_feature_y].max()), 120))",
        "svm_grid_points = pd.DataFrame({svm_feature_x:svm_grid_x.ravel(), svm_feature_y:svm_grid_y.ravel()})",
        "svm_grid_predictions = diagnostic_model.predict(svm_grid_points)",
        "svm_grid_label_codes = {str(label):index for index, label in enumerate(diagnostic_model.named_steps[\"model\"].classes_)}",
        "svm_region_codes = np.asarray([svm_grid_label_codes[str(label)] for label in svm_grid_predictions]).reshape(svm_grid_x.shape)",
        "svm_support_original = X_train.iloc[diagnostic_model.named_steps[\"model\"].support_]",
        "svm_plot = X_train[[svm_feature_x, svm_feature_y]].copy()",
        "svm_plot[\"class\"] = [svm_class_labels.get(str(label), str(label)) for label in y_train]",
        "fig, ax = plt.subplots(figsize=(7.2, 4.8))",
        "ax.contourf(svm_grid_x, svm_grid_y, svm_region_codes, levels=np.arange(-0.5, len(diagnostic_model.named_steps[\"model\"].classes_) + 0.5, 1), cmap=\"Pastel1\", alpha=.32)",
        "sns.scatterplot(data=svm_plot, x=svm_feature_x, y=svm_feature_y, hue=\"class\", alpha=.72, ax=ax)",
        "ax.scatter(svm_support_original[svm_feature_x], svm_support_original[svm_feature_y], s=105, facecolors=\"none\", edgecolors=\"#c75b20\", linewidths=1.4, label=\"support vectors\")",
        "if len(diagnostic_model.named_steps[\"model\"].classes_) == 2: ax.contour(svm_grid_x, svm_grid_y, svm_region_codes, levels=[0.5], colors=\"#c75b20\", linewidths=1.8)",
        `ax.set(title=${py(`Fitted SVM decision regions: ${friendlyColumnName(selectedFeatures[0])} and ${friendlyColumnName(selectedFeatures[1])}`)}, xlabel=${py(`${friendlyColumnName(selectedFeatures[0])} (${selectedFeatures[0]})`)}, ylabel=${py(`${friendlyColumnName(selectedFeatures[1])} (${selectedFeatures[1]})`)})`,
        "ax.legend()",
        "fig.tight_layout()"
      ] : []),
      "svm_support_examples.head(20)"
    ].join("\n");
    if (modelId === "one_r") return [
      "from sklearn.metrics import accuracy_score, f1_score",
      "fitted = diagnostic_model.named_steps[\"model\"]",
      "one_r_rules = one_r_rule_table(fitted, diagnostic_model.named_steps[\"prepare\"], feature_names)",
      "one_r_prediction = diagnostic_model.predict(X_train)",
      "one_r_majority_prediction = np.repeat(fitted.default_, len(y_train))",
      "one_r_comparison = pd.DataFrame({",
      "    \"baseline\":[\"Majority class\", \"One-R\"],",
      "    \"accuracy\":[accuracy_score(y_train, one_r_majority_prediction), accuracy_score(y_train, one_r_prediction)],",
      "    \"macro_f1\":[f1_score(y_train, one_r_majority_prediction, average=\"macro\", zero_division=0), f1_score(y_train, one_r_prediction, average=\"macro\", zero_division=0)]",
      "})",
      "print(\"Chosen feature:\", one_r_rules[\"feature\"].iloc[0])",
      "print(\"Training-only comparison:\")",
      "print(one_r_comparison.round(3).to_string(index=False))",
      "one_r_rules"
    ].join("\n");
    if (modelId === "knn_cls") return [
      "knn_fit_indices, knn_validation_indices = next(cv.split(X_train, y_train))",
      "knn_example_position = int(knn_validation_indices[0])",
      "knn_fold_model = clone(chosen_pipeline).fit(X_train.iloc[knn_fit_indices], y_train.iloc[knn_fit_indices])",
      "knn_fitted = knn_fold_model.named_steps[\"model\"]",
      "knn_row = X_train.iloc[[knn_example_position]]",
      "knn_distances, knn_local_positions = knn_fitted.kneighbors(knn_fold_model[:-1].transform(knn_row), n_neighbors=int(knn_fitted.n_neighbors), return_distance=True)",
      "knn_neighbor_positions = np.asarray(knn_fit_indices)[knn_local_positions[0]]; knn_neighbor_labels = y_train.iloc[knn_neighbor_positions].to_numpy()",
      "knn_neighbor_distances = knn_distances[0]",
      "knn_prediction = knn_fold_model.predict(knn_row)[0]",
      `knn_class_labels = ${classLabels}`,
      "knn_self_neighbour_check = int(knn_example_position) not in set(int(index) for index in np.asarray(knn_neighbor_positions).tolist())",
      "if not knn_self_neighbour_check:",
      "    raise ValueError(\"The KNN diagnostic row leaked into its own neighbour set.\")",
      "knn_is_distance_weighted = knn_fitted.weights == \"distance\"",
      "knn_vote_weights = (1 / np.maximum(knn_neighbor_distances, np.finfo(float).eps)) if knn_is_distance_weighted else np.ones(len(knn_neighbor_labels))",
      "knn_vote_scores = {}",
      "for label, weight in zip(knn_neighbor_labels, knn_vote_weights):",
      "    key = str(label)",
      "    knn_vote_scores[key] = knn_vote_scores.get(key, 0.0) + float(weight)",
      "knn_neighbor_table = pd.DataFrame({",
      "    \"selected_row\":[knn_example_position] * len(knn_neighbor_labels),",
      "    \"actual_class\":[knn_class_labels.get(str(y_train.iloc[knn_example_position]), str(y_train.iloc[knn_example_position]))] * len(knn_neighbor_labels),",
      "    \"neighbor\":np.arange(1, len(knn_neighbor_labels) + 1),",
      "    \"training_row\":knn_neighbor_positions,",
      "    \"neighbor_class\":[knn_class_labels.get(str(label), str(label)) for label in knn_neighbor_labels],",
      "    \"distance_after_preprocessing\":knn_neighbor_distances,",
      "    \"vote_weight\":knn_vote_weights,",
      "    \"prediction\":[knn_class_labels.get(str(knn_prediction), str(knn_prediction))] * len(knn_neighbor_labels),",
      "})",
      "print(\"Selected out-of-fold row:\", knn_example_position)",
      "print(\"Actual class:\", knn_class_labels.get(str(y_train.iloc[knn_example_position]), str(y_train.iloc[knn_example_position])))",
      "print(\"Prediction:\", knn_class_labels.get(str(knn_prediction), str(knn_prediction)))",
      "print(\"Selected k:\", knn_fitted.n_neighbors, \"· weights:\", knn_fitted.weights)",
      "print(\"Closer neighbours contribute more strongly.\" if knn_is_distance_weighted else \"Each neighbour contributes one vote.\")",
      "print(\"Weighted vote:\" if knn_is_distance_weighted else \"Vote counts:\", {key:round(knn_vote_scores[key], 3) for key in sorted(knn_vote_scores)})",
      "knn_neighbor_table"
    ].join("\n");
    if (modelId === "lda") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      `lda_class_labels = ${classLabels}`,
      "lda_class_centres = pd.DataFrame(fitted.means_, columns=encoded_names)",
      "lda_class_centres.insert(0, \"class\", [lda_class_labels.get(str(label), str(label)) for label in fitted.classes_])",
      "lda_fit_indices, lda_validation_indices = next(cv.split(X_train, y_train))",
      "lda_example_position = int(lda_validation_indices[0])",
      "lda_fold_model = clone(chosen_pipeline).fit(X_train.iloc[lda_fit_indices], y_train.iloc[lda_fit_indices])",
      "lda_fold_fitted = lda_fold_model.named_steps[\"model\"]",
      "lda_actual = y_train.iloc[lda_example_position]",
      "lda_prediction = lda_fold_model.predict(X_train.iloc[[lda_example_position]])[0]",
      "lda_decision_values = np.asarray(lda_fold_model.decision_function(X_train.iloc[[lda_example_position]])).reshape(-1)",
      "lda_probability_values = np.asarray(lda_fold_model.predict_proba(X_train.iloc[[lda_example_position]])[0])",
      "lda_probability_table = pd.DataFrame({\"class\":[lda_class_labels.get(str(label), str(label)) for label in lda_fold_fitted.classes_], \"predicted_probability\":lda_probability_values})",
      "if len(lda_fold_fitted.classes_) == 2:",
      "    lda_decision_score = float(lda_decision_values[0]); lda_score_class = lda_fold_fitted.classes_[1] if lda_decision_score >= 0 else lda_fold_fitted.classes_[0]",
      "    print(\"Decision score toward\", lda_class_labels.get(str(lda_fold_fitted.classes_[1]), str(lda_fold_fitted.classes_[1])) + \":\", round(lda_decision_score, 3))",
      "else:",
      "    lda_score_class = lda_fold_fitted.classes_[int(np.argmax(lda_decision_values))]",
      "    lda_discriminant_scores = pd.DataFrame({\"class\":[lda_class_labels.get(str(label), str(label)) for label in lda_fold_fitted.classes_], \"discriminant_score\":lda_decision_values})",
      "    print(\"Discriminant evidence by class:\")",
      "    print(lda_discriminant_scores.to_string(index=False))",
      "lda_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[lda_example_position], \"actual_class\":[lda_class_labels.get(str(lda_actual), str(lda_actual))], \"predicted_class\":[lda_class_labels.get(str(lda_prediction), str(lda_prediction))], \"closest_discriminant_class\":[lda_class_labels.get(str(lda_score_class), str(lda_score_class))]})",
      "print(\"Class centres (fitted means in prepared feature units):\")",
      "print(lda_class_centres.round(3).to_string(index=False))",
      "print(\"LDA uses one shared spread/shape structure, so its fitted class boundaries are straight.\")",
      "print(\"Selected out-of-fold row:\", lda_example_position)",
      "print(\"Actual class:\", lda_class_labels.get(str(lda_actual), str(lda_actual)))",
      "print(\"Predicted class:\", lda_class_labels.get(str(lda_prediction), str(lda_prediction)))",
      "print(\"Predicted class probabilities:\")",
      "print(lda_probability_table.round(3).to_string(index=False))",
      ...(twoFeatureContinuous ? [
        `lda_feature_x, lda_feature_y = ${py(selectedFeatures)}`,
        "lda_grid_x, lda_grid_y = np.meshgrid(np.linspace(float(X_train[lda_feature_x].min()), float(X_train[lda_feature_x].max()), 120), np.linspace(float(X_train[lda_feature_y].min()), float(X_train[lda_feature_y].max()), 120))",
        "lda_grid_points = pd.DataFrame({lda_feature_x:lda_grid_x.ravel(), lda_feature_y:lda_grid_y.ravel()})",
        "lda_grid_predictions = diagnostic_model.predict(lda_grid_points)",
        "lda_grid_label_codes = {str(label):index for index, label in enumerate(diagnostic_model.named_steps[\"model\"].classes_)}",
        "lda_region_codes = np.asarray([lda_grid_label_codes[str(label)] for label in lda_grid_predictions]).reshape(lda_grid_x.shape)",
        "lda_plot = X_train[[lda_feature_x, lda_feature_y]].copy()",
        "lda_plot[\"class\"] = [lda_class_labels.get(str(label), str(label)) for label in y_train]",
        "lda_centre_plot = pd.DataFrame({lda_feature_x:fitted.means_[:, 0], lda_feature_y:fitted.means_[:, 1], \"class\":[lda_class_labels.get(str(label), str(label)) for label in fitted.classes_]})",
        "fig, ax = plt.subplots(figsize=(7.2, 4.8))",
        "ax.contourf(lda_grid_x, lda_grid_y, lda_region_codes, levels=np.arange(-0.5, len(fitted.classes_) + 0.5, 1), cmap=\"Pastel1\", alpha=.32)",
        "sns.scatterplot(data=lda_plot, x=lda_feature_x, y=lda_feature_y, hue=\"class\", alpha=.72, ax=ax)",
        "ax.scatter(lda_centre_plot[lda_feature_x], lda_centre_plot[lda_feature_y], marker=\"X\", s=125, color=\"#c75b20\", label=\"class centres\")",
        "if len(fitted.classes_) == 2: ax.contour(lda_grid_x, lda_grid_y, lda_region_codes, levels=[0.5], colors=\"#c75b20\", linewidths=1.8)",
        `ax.set(title=${py(`Fitted LDA decision regions: ${friendlyColumnName(selectedFeatures[0])} and ${friendlyColumnName(selectedFeatures[1])}`)}, xlabel=${py(`${friendlyColumnName(selectedFeatures[0])} (${selectedFeatures[0]})`)}, ylabel=${py(`${friendlyColumnName(selectedFeatures[1])} (${selectedFeatures[1]})`)})`,
        "ax.legend()",
        "fig.tight_layout()"
      ] : []),
      "lda_class_centres"
    ].join("\n");
    if (modelId === "qda") return [
      preparedNames,
      "fitted = diagnostic_model.named_steps[\"model\"]",
      `qda_class_labels = ${classLabels}`,
      "qda_class_centres = pd.DataFrame(fitted.means_, columns=encoded_names)",
      "qda_class_centres.insert(0, \"class\", [qda_class_labels.get(str(label), str(label)) for label in fitted.classes_])",
      "qda_spread_frame = X_train[feature_names].copy()",
      "qda_spread_frame[\"__class\"] = y_train.to_numpy()",
      "qda_spread_values = qda_spread_frame.groupby(\"__class\")[feature_names].std().reindex(fitted.classes_)",
      "qda_spread_summary = qda_spread_values.reset_index().rename(columns={\"__class\":\"class\"})",
      "qda_spread_summary[\"class\"] = [qda_class_labels.get(str(label), str(label)) for label in fitted.classes_]",
      "qda_fit_indices, qda_validation_indices = next(cv.split(X_train, y_train))",
      "qda_example_position = int(qda_validation_indices[0])",
      "qda_fold_model = clone(chosen_pipeline).fit(X_train.iloc[qda_fit_indices], y_train.iloc[qda_fit_indices])",
      "qda_row = X_train.iloc[[qda_example_position]]",
      "qda_actual = y_train.iloc[qda_example_position]",
      "qda_prediction = qda_fold_model.predict(qda_row)[0]",
      "qda_probability_values = np.asarray(qda_fold_model.predict_proba(qda_row)[0])",
      "qda_probability_table = pd.DataFrame({\"class\":[qda_class_labels.get(str(label), str(label)) for label in qda_fold_model.named_steps[\"model\"].classes_], \"predicted_probability\":qda_probability_values})",
      "qda_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[qda_example_position], \"actual_class\":[qda_class_labels.get(str(qda_actual), str(qda_actual))], \"predicted_class\":[qda_class_labels.get(str(qda_prediction), str(qda_prediction))]})",
      "qda_regularization = float(fitted.reg_param)",
      "print(\"Class centres (fitted means in prepared feature units):\")",
      "print(qda_class_centres.round(3).to_string(index=False))",
      "print(\"Per-feature spread by class (training-data standard deviations):\")",
      "print(qda_spread_summary.round(3).to_string(index=False))",
      "print(\"The table shows each class's centre and per-feature spread.\")",
      "print(\"Internally, QDA also models how the features vary together within each class, giving each class its own covariance/shape.\")",
      "print(\"Separate class covariance structures → more flexible decision boundary → boundary can curve.\")",
      "print(\"QDA regularisation parameter:\", qda_regularization)",
      "print(\"Selected out-of-fold row:\", qda_example_position)",
      "print(\"Actual class:\", qda_class_labels.get(str(qda_actual), str(qda_actual)))",
      "print(\"Predicted class:\", qda_class_labels.get(str(qda_prediction), str(qda_prediction)))",
      "print(\"Predicted class probabilities:\")",
      "print(qda_probability_table.round(3).to_string(index=False))",
      ...(twoFeatureContinuous ? [
        `qda_feature_x, qda_feature_y = ${py(selectedFeatures)}`,
        "qda_grid_x, qda_grid_y = np.meshgrid(np.linspace(float(X_train[qda_feature_x].min()), float(X_train[qda_feature_x].max()), 120), np.linspace(float(X_train[qda_feature_y].min()), float(X_train[qda_feature_y].max()), 120))",
        "qda_grid_points = pd.DataFrame({qda_feature_x:qda_grid_x.ravel(), qda_feature_y:qda_grid_y.ravel()})",
        "qda_grid_predictions = diagnostic_model.predict(qda_grid_points)",
        "qda_grid_label_codes = {str(label):index for index, label in enumerate(diagnostic_model.named_steps[\"model\"].classes_)}",
        "qda_region_codes = np.asarray([qda_grid_label_codes[str(label)] for label in qda_grid_predictions]).reshape(qda_grid_x.shape)",
        "qda_plot = X_train[[qda_feature_x, qda_feature_y]].copy()",
        "qda_plot[\"class\"] = [qda_class_labels.get(str(label), str(label)) for label in y_train]",
        "qda_centre_plot = pd.DataFrame({qda_feature_x:fitted.means_[:, 0], qda_feature_y:fitted.means_[:, 1], \"class\":[qda_class_labels.get(str(label), str(label)) for label in fitted.classes_]})",
        "fig, ax = plt.subplots(figsize=(7.2, 4.8))",
        "ax.contourf(qda_grid_x, qda_grid_y, qda_region_codes, levels=np.arange(-0.5, len(fitted.classes_) + 0.5, 1), cmap=\"Pastel1\", alpha=.32)",
        "sns.scatterplot(data=qda_plot, x=qda_feature_x, y=qda_feature_y, hue=\"class\", alpha=.72, ax=ax)",
        "ax.scatter(qda_centre_plot[qda_feature_x], qda_centre_plot[qda_feature_y], marker=\"X\", s=125, color=\"#c75b20\", label=\"class centres\")",
        "if len(fitted.classes_) == 2: ax.contour(qda_grid_x, qda_grid_y, qda_region_codes, levels=[0.5], colors=\"#c75b20\", linewidths=1.8)",
        `ax.set(title=${py(`Fitted QDA decision regions: ${friendlyColumnName(selectedFeatures[0])} and ${friendlyColumnName(selectedFeatures[1])}`)}, xlabel=${py(`${friendlyColumnName(selectedFeatures[0])} (${selectedFeatures[0]})`)}, ylabel=${py(`${friendlyColumnName(selectedFeatures[1])} (${selectedFeatures[1]})`)})`,
        "ax.legend()",
        "fig.tight_layout()"
      ] : []),
      "qda_class_centres"
    ].join("\n");
    if (modelId === "naive_bayes") {
      const kind = pureNaiveBayesInput(value);
      const gaussian = kind === "continuous";
      return [
        preparedNames,
        `nb_class_labels = ${classLabels}`,
        "nb_fit_indices, nb_validation_indices = next(cv.split(X_train, y_train))",
        "nb_example_position = int(nb_validation_indices[0])",
        "nb_fold_model = clone(chosen_pipeline).fit(X_train.iloc[nb_fit_indices], y_train.iloc[nb_fit_indices])",
        "nb_fitted = nb_fold_model.named_steps[\"model\"]",
        "nb_encoder = nb_fold_model.named_steps[\"prepare\"]",
        "nb_row = X_train.iloc[[nb_example_position]]",
        "nb_actual = y_train.iloc[nb_example_position]",
        "nb_prediction = nb_fold_model.predict(nb_row)[0]",
        "nb_posterior_values = np.asarray(nb_fold_model.predict_proba(nb_row)[0])",
        "nb_prior_values = np.exp(np.asarray(nb_fitted.class_log_prior_)) if hasattr(nb_fitted, \"class_log_prior_\") else np.asarray(nb_fitted.class_prior_)",
        "nb_quantity_rows = []",
        "for class_index, class_value in enumerate(nb_fitted.classes_):",
        "    class_label = nb_class_labels.get(str(class_value), str(class_value))",
        "    nb_quantity_rows.append({\"quantity_type\":\"Prior probability\", \"class\":class_label, \"feature\":\"—\", \"quantity_label\":f\"P(class={class_label})\", \"quantity_value\":float(nb_prior_values[class_index])})",
        ...(gaussian ? [
          "nb_row_values = nb_row.to_numpy() if isinstance(nb_encoder, str) else nb_encoder.transform(nb_row)",
          "if hasattr(nb_row_values, \"toarray\"): nb_row_values = nb_row_values.toarray()",
          "nb_row_values = np.asarray(nb_row_values, dtype=float)",
          "nb_gaussian_means = np.asarray(nb_fitted.theta_, dtype=float)",
          "nb_gaussian_stds = np.sqrt(np.maximum(np.asarray(nb_fitted.var_, dtype=float), np.finfo(float).eps))",
          "nb_gaussian_summary_rows = []",
          "for class_index, class_value in enumerate(nb_fitted.classes_):",
          "    for feature_index, feature_name in enumerate(encoded_names):",
          "        nb_gaussian_summary_rows.append({\"class\":nb_class_labels.get(str(class_value), str(class_value)), \"feature\":str(feature_name), \"fitted_mean\":nb_gaussian_means[class_index, feature_index], \"fitted_standard_deviation\":nb_gaussian_stds[class_index, feature_index]})",
          "nb_gaussian_feature_summary = pd.DataFrame(nb_gaussian_summary_rows)",
          "nb_evidence_indices = np.arange(min(3, len(encoded_names)))",
          "for class_index, class_value in enumerate(nb_fitted.classes_):",
          "    class_label = nb_class_labels.get(str(class_value), str(class_value))",
          "    for feature_index in nb_evidence_indices:",
          "        observed = float(nb_row_values[0, feature_index])",
          "        variance = max(float(nb_fitted.var_[class_index, feature_index]), np.finfo(float).eps)",
          "        density = float(np.exp(-0.5 * ((observed - nb_fitted.theta_[class_index, feature_index]) ** 2) / variance) / np.sqrt(2 * np.pi * variance))",
          "        feature_name = str(encoded_names[feature_index])",
          "        nb_quantity_rows.append({\"quantity_type\":\"Class-conditional density\", \"class\":class_label, \"feature\":feature_name, \"quantity_label\":f\"p({feature_name}={observed:.3g} | class={class_label})\", \"quantity_value\":density})",
          "print(\"Gaussian Naive Bayes: each continuous feature uses a class-specific bell-shaped distribution.\")",
          "print(\"The Gaussian PDF gives a class-conditional density at each observed value: how typical that value is under the class's fitted bell-shaped distribution.\")",
          "print(\"This is not the probability of one exact continuous value, and a density can be greater than 1.\")",
          "print(\"Class means and spreads for the selected features:\")",
          "print(nb_gaussian_feature_summary.head(30).round(3).to_string(index=False))"
        ] : [
          "if hasattr(nb_encoder, \"named_steps\"):",
          "    nb_encoder = next((step for step in nb_encoder.named_steps.values() if hasattr(step, \"categories_\")), nb_encoder)",
          "nb_feature_labels = [f\"{name}=1\" for name in feature_names]",
          "if hasattr(nb_encoder, \"categories_\"):",
          "    nb_feature_labels = []",
          "    for original_name, categories in zip(feature_names, nb_encoder.categories_):",
          "        nb_feature_labels.extend([f\"{original_name}={category}\" for category in categories])",
          "nb_one_probabilities = np.exp(np.asarray(nb_fitted.feature_log_prob_, dtype=float))",
          "nb_evidence_indices = np.arange(min(6, len(nb_feature_labels)))",
          "for class_index, class_value in enumerate(nb_fitted.classes_):",
          "    class_label = nb_class_labels.get(str(class_value), str(class_value))",
          "    for feature_index in nb_evidence_indices:",
          "        feature_label = str(nb_feature_labels[feature_index])",
          "        nb_quantity_rows.append({\"quantity_type\":\"Class-conditional probability\", \"class\":class_label, \"feature\":feature_label, \"quantity_label\":f\"P({feature_label} | class={class_label})\", \"quantity_value\":float(nb_one_probabilities[class_index, feature_index])})",
          `print(${py(kind === "categorical" ? "Bernoulli Naive Bayes: each original category is represented by a labelled yes/no feature." : "Bernoulli Naive Bayes: each binary feature is a labelled yes/no signal.")})`,
          "print(\"The likelihood rows show the probability of the indicated feature being 1 within each class.\")"
        ]),
        "for class_index, class_value in enumerate(nb_fitted.classes_):",
        "    class_label = nb_class_labels.get(str(class_value), str(class_value))",
        "    nb_quantity_rows.append({\"quantity_type\":\"Posterior probability\", \"class\":class_label, \"feature\":\"all selected features\", \"quantity_label\":f\"P(class={class_label} | observed features)\", \"quantity_value\":float(nb_posterior_values[class_index])})",
        "nb_quantity_evidence = pd.DataFrame(nb_quantity_rows, columns=[\"quantity_type\", \"class\", \"feature\", \"quantity_label\", \"quantity_value\"])",
        "nb_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[nb_example_position], \"actual_class\":[nb_class_labels.get(str(nb_actual), str(nb_actual))], \"predicted_class\":[nb_class_labels.get(str(nb_prediction), str(nb_prediction))]})",
        "print(\"Selected out-of-fold row:\", nb_example_position)",
        "print(\"Actual class:\", nb_class_labels.get(str(nb_actual), str(nb_actual)))",
        "print(\"Predicted class:\", nb_class_labels.get(str(nb_prediction), str(nb_prediction)))",
        `print(${py(gaussian ? "Prior → class-conditional density → posterior: the model combines all selected features under an independence assumption." : "Prior → likelihood → posterior: the model combines all selected features under an independence assumption.")})`,
        "nb_quantity_evidence.round(4)"
      ].join("\n");
    }
    if (["mlp_cls","mlp_reg"].includes(modelId)) {
      const classification = modelId === "mlp_cls";
      const fittedSetup = classification
        ? [
            "mlp_fitted = mlp_oof_model.named_steps[\"model\"]",
            `mlp_class_labels = ${classLabels}`,
            "mlp_output_labels = [mlp_class_labels.get(str(label), str(label)) for label in mlp_fitted.classes_]",
            "mlp_output_text = \"class probabilities for \" + \" / \".join(mlp_output_labels)"
          ]
        : [
            "mlp_wrapper = mlp_oof_model.named_steps[\"model\"]",
            "mlp_fitted = mlp_wrapper.regressor_",
            `mlp_output_text = ${py(`numeric ${friendlyColumnName(config.target)} prediction in original target units`)}`
          ];
      const predictionEvidence = classification
        ? [
            "mlp_row = X_train.iloc[[mlp_example_position]]",
            "mlp_actual = y_train.iloc[mlp_example_position]",
            "mlp_prediction = mlp_oof_model.predict(mlp_row)[0]",
            "mlp_probability_values = mlp_oof_model.predict_proba(mlp_row)[0]",
            "mlp_probability_table = pd.DataFrame({\"class\":[mlp_class_labels.get(str(label), str(label)) for label in mlp_oof_model.classes_], \"predicted_probability\":mlp_probability_values})",
            "mlp_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[mlp_example_position], \"actual_class\":[mlp_class_labels.get(str(mlp_actual), str(mlp_actual))], \"predicted_class\":[mlp_class_labels.get(str(mlp_prediction), str(mlp_prediction))]})",
            "for label, probability in zip(mlp_output_labels, mlp_probability_values): mlp_prediction_story[f\"probability_{label}\"] = float(probability)",
            "print(\"Selected out-of-fold row:\", mlp_example_position)",
            "print(\"Predicted probabilities by class:\")",
            "print(mlp_probability_table.round(3).to_string(index=False))",
            "mlp_prediction_story"
        ]
        : [
            "mlp_row = X_train.iloc[[mlp_example_position]]",
            "mlp_actual = float(y_train.iloc[mlp_example_position])",
            "mlp_prediction = float(mlp_oof_model.predict(mlp_row)[0])",
            "mlp_absolute_error = abs(mlp_actual - mlp_prediction)",
            "mlp_prediction_story = pd.DataFrame({\"selected_out_of_fold_row\":[mlp_example_position], \"actual_target_original_units\":[mlp_actual], \"predicted_target_original_units\":[mlp_prediction], \"absolute_error_original_units\":[mlp_absolute_error]})",
            "print(\"Selected out-of-fold row:\", mlp_example_position)",
            `print(${py(`Actual ${friendlyColumnName(config.target)} (original units):`)}, mlp_actual)`,
            `print(${py(`Predicted ${friendlyColumnName(config.target)} (original units):`)}, mlp_prediction)`,
            "mlp_prediction_story"
          ];
      return [
        ...fittedSetup,
        "mlp_hidden_layers = (mlp_fitted.hidden_layer_sizes,) if isinstance(mlp_fitted.hidden_layer_sizes, int) else tuple(mlp_fitted.hidden_layer_sizes)",
        "mlp_hidden_text = \" → \".join(str(width) for width in mlp_hidden_layers)",
        "mlp_architecture = pd.DataFrame({\"prepared_inputs\":[int(mlp_fitted.n_features_in_)], \"hidden_layers\":[mlp_hidden_text], \"output\":[mlp_output_text], \"training_iterations\":[int(mlp_fitted.n_iter_)], \"early_stopping\":[\"on\" if mlp_fitted.early_stopping else \"off\"]})",
        "print(\"Fitted network structure:\")",
        "print(f\"{int(mlp_fitted.n_features_in_)} prepared inputs → {mlp_hidden_text} → {mlp_output_text}\")",
        "print(mlp_architecture.to_string(index=False))",
        "mlp_loss_curve = mlp_fitted.loss_curve_",
        "print(\"Training loss during optimization:\")",
        "fig, ax = plt.subplots(figsize=(6.2, 3.4))",
        "ax.plot(mlp_loss_curve, color=\"#7651a6\")",
        "ax.set(title=\"Training loss during optimization\", xlabel=\"iteration\", ylabel=\"loss\")",
        "fig.tight_layout()",
        "print(\"A falling training loss means the optimizer is fitting its training objective better. It does not show generalization by itself; use CV and the final test for new-data evidence.\")",
        ...(classification ? [] : [
          "print(\"The inner MLP trained on a scaled target, so this loss is in transformed target space. Predictions and RMSE/MAE are converted back automatically to original target units.\")"
        ]),
        ...(config.split === "time" ? [
          "print(\"The out-of-fold example uses the last validation window; all fitting rows precede it in time.\")"
        ] : []),
        "mlp_example_position = int(mlp_validation_indices[0])",
        ...predictionEvidence
      ].join("\n");
    }
    return "";
  }
  function legacyDiagnosticsCode(config, modelId, value) {
    const interpretation = interpretationCode(config, modelId, value);
    const isMlp = ["mlp_cls", "mlp_reg"].includes(modelId);
    const mlpFoldSetup = isMlp ? [
      config.split === "time"
        ? "mlp_fit_indices, mlp_validation_indices = list(cv.split(X_train, y_train))[-1]"
        : "mlp_fit_indices, mlp_validation_indices = next(cv.split(X_train, y_train))",
      "mlp_oof_model = clone(chosen_pipeline).fit(X_train.iloc[mlp_fit_indices], y_train.iloc[mlp_fit_indices])",
      "diagnostic_model = mlp_oof_model"
    ] : ["diagnostic_model = clone(chosen_pipeline).fit(X_train, y_train)"];
    const mlpRegressionSetup = isMlp ? [
      ...mlpFoldSetup,
      ...(config.split === "time"
        ? [
            "diagnostic_actual = y_train.iloc[mlp_validation_indices]",
            "diagnostic_prediction = diagnostic_model.predict(X_train.iloc[mlp_validation_indices])"
          ]
        : [
            "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
            "diagnostic_actual = y_train"
          ])
    ] : null;
    if (config.task === "classification") return [
      "# 9 · Diagnose and understand the chosen model",
      "# These diagnostics explain behaviour; they are not another headline performance score.",
      "from sklearn.base import clone",
      "from sklearn.model_selection import cross_val_predict",
      "from sklearn.metrics import confusion_matrix",
      "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
      ...mlpFoldSetup,
      `diagnostic_class_labels = ${py(classLabelMap(config))}`,
      "diagnostic_labels = np.unique(y_train)",
      "diagnostic_friendly_labels = [diagnostic_class_labels.get(str(label), str(label)) for label in diagnostic_labels]",
      "",
      "fig, ax = plt.subplots(figsize=(5.4, 4.2))",
      "sns.heatmap(confusion_matrix(y_train, diagnostic_prediction), annot=True, fmt=\"d\", cmap=\"Purples\", ax=ax,",
      "            xticklabels=diagnostic_friendly_labels, yticklabels=diagnostic_friendly_labels)",
      `ax.set(title=${py(`Training-only diagnostic confusion matrix for ${friendlyColumnName(config.target)}`)}, xlabel=${py(`Predicted ${friendlyColumnName(config.target)}`)}, ylabel=${py(`Actual ${friendlyColumnName(config.target)}`)})`,
      "fig.tight_layout()",
      interpretation
    ].join("\n");
    const diagnosticSetup = isMlp ? mlpRegressionSetup.join("\n") : config.split === "time"
      ? [
          "last_fit, last_validation = list(cv.split(X_train, y_train))[-1]",
          "diagnostic_model = clone(chosen_pipeline).fit(X_train.iloc[last_fit], y_train.iloc[last_fit])",
          "diagnostic_actual = y_train.iloc[last_validation]",
          "diagnostic_prediction = diagnostic_model.predict(X_train.iloc[last_validation])"
        ].join("\n")
      : [
          "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
          "diagnostic_actual = y_train",
          "diagnostic_model = clone(chosen_pipeline).fit(X_train, y_train)"
        ].join("\n");
    const predictionImport = config.split === "time" ? "" : "from sklearn.model_selection import cross_val_predict";
    const diagnosticLabel = config.split === "time" ? "training-only diagnostic residuals from the last validation window" : "training-only diagnostic residuals";
    return [
      "# 9 · Diagnose and understand the chosen model",
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
  function diagnosticSetupCode(config, modelId) {
    const isMlp = ["mlp_cls", "mlp_reg"].includes(modelId);
    const needsOutOfFoldExample = ["knn_cls", "svm_cls", "lda", "qda", "naive_bayes"].includes(modelId);
    const lines = [
      "# Optional diagnostic construction: fit the current route objects before the learner view.",
      "from sklearn.base import clone"
    ];
    if (config.task === "classification") {
      lines.push(
        "from sklearn.model_selection import cross_val_predict",
        "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")"
      );
      if (isMlp) {
        lines.push(
          config.split === "time"
            ? "mlp_fit_indices, mlp_validation_indices = list(cv.split(X_train, y_train))[-1]"
            : "mlp_fit_indices, mlp_validation_indices = next(cv.split(X_train, y_train))",
          "mlp_oof_model = clone(chosen_pipeline).fit(X_train.iloc[mlp_fit_indices], y_train.iloc[mlp_fit_indices])",
          "diagnostic_model = mlp_oof_model",
          "mlp_example_position = int(mlp_validation_indices[0])",
          "mlp_row = X_train.iloc[[mlp_example_position]]"
        );
      } else if (needsOutOfFoldExample) {
        lines.push(
          "diagnostic_fit_indices, diagnostic_validation_indices = next(cv.split(X_train, y_train))",
          "diagnostic_example_position = int(diagnostic_validation_indices[0])",
          "diagnostic_model = clone(chosen_pipeline).fit(X_train.iloc[diagnostic_fit_indices], y_train.iloc[diagnostic_fit_indices])",
          "diagnostic_row = X_train.iloc[[diagnostic_example_position]]"
        );
        if (modelId === "knn_cls") lines.push(
          "diagnostic_training_labels = y_train.iloc[diagnostic_fit_indices]",
          "diagnostic_prepared_row = diagnostic_model[:-1].transform(diagnostic_row)"
        );
      } else {
        lines.push("diagnostic_model = clone(chosen_pipeline).fit(X_train, y_train)");
      }
      lines.push(
        `diagnostic_class_labels = ${py(classLabelMap(config))}`,
        "diagnostic_labels = np.unique(y_train)",
        "diagnostic_friendly_labels = [diagnostic_class_labels.get(str(label), str(label)) for label in diagnostic_labels]"
      );
      if (isMlp) lines.push(
        "mlp_fitted = diagnostic_model.named_steps[\"model\"]",
        "diagnostic_fitted = mlp_fitted"
      );
      else lines.push("diagnostic_fitted = diagnostic_model.named_steps[\"model\"]");
      return lines.join("\n");
    }
    if (isMlp) {
      lines.push(
        config.split === "time"
          ? "mlp_fit_indices, mlp_validation_indices = list(cv.split(X_train, y_train))[-1]"
          : "mlp_fit_indices, mlp_validation_indices = next(cv.split(X_train, y_train))",
        "mlp_oof_model = clone(chosen_pipeline).fit(X_train.iloc[mlp_fit_indices], y_train.iloc[mlp_fit_indices])",
        "diagnostic_model = mlp_oof_model",
        "mlp_example_position = int(mlp_validation_indices[0])",
        "mlp_row = X_train.iloc[[mlp_example_position]]"
      );
      if (config.split === "time") lines.push(
        "diagnostic_actual = y_train.iloc[mlp_validation_indices]",
        "diagnostic_prediction = diagnostic_model.predict(X_train.iloc[mlp_validation_indices])"
      );
      else lines.push(
        "from sklearn.model_selection import cross_val_predict",
        "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
        "diagnostic_actual = y_train"
      );
      lines.push(
        "mlp_fitted = diagnostic_model.named_steps[\"model\"].regressor_",
        "diagnostic_fitted = mlp_fitted"
      );
      return lines.join("\n");
    }
    if (config.split === "time") lines.push(
      "last_fit, last_validation = list(cv.split(X_train, y_train))[-1]",
      "diagnostic_model = clone(chosen_pipeline).fit(X_train.iloc[last_fit], y_train.iloc[last_fit])",
      "diagnostic_actual = y_train.iloc[last_validation]",
      "diagnostic_prediction = diagnostic_model.predict(X_train.iloc[last_validation])"
    );
    else lines.push(
      "from sklearn.model_selection import cross_val_predict",
      "diagnostic_prediction = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")",
      "diagnostic_actual = y_train",
      "diagnostic_model = clone(chosen_pipeline).fit(X_train, y_train)"
    );
    lines.push("diagnostic_fitted = diagnostic_model.named_steps[\"model\"]");
    if (modelId === "polynomial") lines.push(
      "polynomial_transformer = diagnostic_model.named_steps[\"polynomial\"]",
      "polynomial_model = diagnostic_model.named_steps[\"model\"]",
      "polynomial_degree = int(polynomial_transformer.degree)",
      "polynomial_feature_names = polynomial_transformer.get_feature_names_out()"
    );
    return lines.join("\n");
  }

  function diagnosticPrimaryCode(config, modelId, value, includeModelEvidence = false, includeCommon = true) {
    const selectedFeatures = featureNames(value);
    const targetLabel = `${friendlyColumnName(config.target)} (${config.target})`;
    const preparedNames = modelId === "polynomial"
      ? [
          "prepared_names = np.asarray(feature_names, dtype=object)"
        ]
      : [
          "prepare = fitted_pipeline.named_steps[\"prepare\"]",
          "prepared_names = np.asarray(prepare.get_feature_names_out(feature_names) if hasattr(prepare, \"get_feature_names_out\") else feature_names, dtype=object)"
        ];
    const validationSetup = config.split === "time"
      ? [
          "fit_rows, validation_rows = list(cv.split(X_train, y_train))[-1]",
          "validation_pipeline = clone(chosen_pipeline).fit(X_train.iloc[fit_rows], y_train.iloc[fit_rows])",
          "validation_actual = y_train.iloc[validation_rows]",
          "validation_predictions = validation_pipeline.predict(X_train.iloc[validation_rows])"
        ]
      : [
          "from sklearn.model_selection import cross_val_predict",
          "validation_actual = y_train",
          "validation_predictions = cross_val_predict(chosen_pipeline, X_train, y_train, cv=cv, method=\"predict\")"
        ];
    const common = config.task === "classification" ? [
      "# 9 · Inspect training-only behaviour of the chosen model",
      "# CV and the final test answer performance; this cell explains one fitted route.",
      "from sklearn.base import clone",
      ...validationSetup,
      `class_labels = ${py(classLabelMap(config))}`,
      "labels = np.unique(y_train)",
      "friendly_labels = [class_labels.get(str(label), str(label)) for label in labels]",
      "from sklearn.metrics import confusion_matrix",
      "fig, ax = plt.subplots(figsize=(5.4, 4.2))",
      "sns.heatmap(confusion_matrix(validation_actual, validation_predictions, labels=labels), annot=True, fmt=\"d\", cmap=\"Purples\", ax=ax, xticklabels=friendly_labels, yticklabels=friendly_labels)",
      `ax.set(title=${py(`Training-only diagnostic confusion matrix for ${friendlyColumnName(config.target)}`)}, xlabel=${py(`Predicted ${friendlyColumnName(config.target)}`)}, ylabel=${py(`Actual ${friendlyColumnName(config.target)}`)})`,
      "fig.tight_layout()"
    ] : [
      "# 9 · Inspect training-only behaviour of the chosen model",
      "# Residuals describe model behaviour; the final test remains the only final evaluation.",
      "from sklearn.base import clone",
      ...validationSetup,
      "residuals = validation_actual.to_numpy() - validation_predictions",
      "fig, ax = plt.subplots(figsize=(6.8, 3.8))",
      "sns.scatterplot(x=validation_predictions, y=residuals, ax=ax, color=\"#7651a6\")",
      "ax.axhline(0, color=\"#c75b20\", linestyle=\"--\")",
      `ax.set(title=${py(config.split === "time" ? "Training-only residuals from the last validation window" : "Training-only residuals")}, xlabel="prediction", ylabel="actual − prediction")`,
      "fig.tight_layout()"
    ];
    const usesExcludedInterpretationRow = ["svm_cls", "lda", "qda", "naive_bayes", "mlp_cls", "mlp_reg"].includes(modelId);
    const fitLines = usesExcludedInterpretationRow ? [
      "interpret_fit_rows, interpret_validation_rows = next(cv.split(X_train, y_train))",
      "interpret_validation_position = int(interpret_validation_rows[0])",
      "fitted_pipeline = clone(chosen_pipeline).fit(X_train.iloc[interpret_fit_rows], y_train.iloc[interpret_fit_rows])",
      "fitted_model = fitted_pipeline.named_steps[\"model\"]",
      "interpret_row = X_train.iloc[[interpret_validation_position]]",
      "interpret_actual = y_train.iloc[interpret_validation_position]",
      "interpret_prediction = fitted_pipeline.predict(interpret_row)[0]"
    ] : [
      "fitted_pipeline = clone(chosen_pipeline).fit(X_train, y_train)",
      "fitted_model = fitted_pipeline.named_steps[\"model\"]"
    ];
    let modelLines = [];
    if (modelId === "simple_linear") {
      const feature = selectedFeatures[0];
      modelLines = [
        `simple_feature = ${py(feature)}`,
        "simple_x = X_train[simple_feature].astype(float).to_numpy()",
        "simple_grid = np.linspace(simple_x.min(), simple_x.max(), 120)",
        "simple_curve = fitted_pipeline.predict(pd.DataFrame({simple_feature:simple_grid}))",
        "fig, ax = plt.subplots(figsize=(7.2, 4.2))",
        "ax.scatter(simple_x, y_train.to_numpy(), alpha=.55, color=\"#137c9c\", label=\"training rows\")",
        "ax.plot(simple_grid, simple_curve, color=\"#c75b20\", linewidth=2.4, label=\"fitted line\")",
        `ax.set(title=${py(`Fitted line: ${friendlyColumnName(feature)} → ${friendlyColumnName(config.target)}`)}, xlabel=${py(`${friendlyColumnName(feature)} (${feature})`)}, ylabel=${py(targetLabel)})`,
        "ax.legend(); fig.tight_layout()",
        "simple_interpretation = pd.DataFrame({\"feature\":[simple_feature], \"slope\":[float(np.ravel(fitted_model.coef_)[0])], \"intercept\":[float(np.ravel(fitted_model.intercept_)[0] if np.ndim(fitted_model.intercept_) else fitted_model.intercept_)]})",
        "simple_interpretation"
      ];
    } else if (modelId === "multiple_linear") {
      modelLines = [
        ...preparedNames,
        "linear_coefficients = np.ravel(fitted_model.coef_)",
        "if len(prepared_names) != len(linear_coefficients): prepared_names = np.asarray(feature_names, dtype=object)",
        "linear_interpretation = pd.DataFrame({\"feature\":prepared_names, \"coefficient\":linear_coefficients})",
        "linear_interpretation"
      ];
    } else if (modelId === "polynomial") {
      const feature = selectedFeatures[0];
      modelLines = [
        ...preparedNames,
        "polynomial = fitted_pipeline.named_steps[\"polynomial\"]",
        "polynomial_degree = int(polynomial.degree)",
        ...(selectedFeatures.length === 1 ? [
          `poly_feature = ${py(feature)}`,
          "poly_x = X_train[poly_feature].astype(float).to_numpy()",
          "poly_grid = np.linspace(poly_x.min(), poly_x.max(), 120)",
          "poly_curve = fitted_pipeline.predict(pd.DataFrame({poly_feature:poly_grid}))",
          "fig, ax = plt.subplots(figsize=(7.2, 4.2))",
          "ax.scatter(poly_x, y_train.to_numpy(), alpha=.55, color=\"#137c9c\", label=\"training rows\")",
          "ax.plot(poly_grid, poly_curve, color=\"#7651a6\", linewidth=2.4, label=\"fitted curve\")",
          `ax.set(title=${py(`Fitted curve: ${friendlyColumnName(feature)} → ${friendlyColumnName(config.target)}`)}, xlabel=${py(`${friendlyColumnName(feature)} (${feature})`)}, ylabel=${py(targetLabel)})`,
          "ax.legend(); fig.tight_layout()",
          "polynomial_summary = pd.DataFrame({\"degree\":[polynomial_degree], \"curve_points\":[len(poly_grid)]})"
        ] : [
          "polynomial_names = polynomial.get_feature_names_out(prepared_names)",
          "polynomial_model = fitted_pipeline.named_steps[\"model\"]",
          "polynomial_summary = pd.DataFrame({\"term\":polynomial_names, \"weight\":np.ravel(polynomial_model.coef_)})",
          "print(\"This route uses multiple inputs, so no single 2D fitted curve is shown; read the term table and validation residuals instead.\")"
        ]),
        "polynomial_summary"
      ];
    } else if (["regression_tree", "classification_tree"].includes(modelId)) {
      modelLines = [
        "from sklearn.tree import plot_tree",
        ...preparedNames,
        "tree_importance = fitted_model.feature_importances_",
        "fig, ax = plt.subplots(figsize=(8, 4.2))",
        "plot_tree(fitted_model, max_depth=2, feature_names=prepared_names, filled=True, rounded=True, fontsize=7, ax=ax)",
        "ax.set_title(\"Top of the fitted tree (training data only)\"); fig.tight_layout()",
        "tree_summary = pd.DataFrame({\"feature\":prepared_names, \"importance\":tree_importance}).sort_values(\"importance\", ascending=False).head(15)",
        "tree_summary"
      ];
    } else if (modelId === "logistic") {
      modelLines = [
        ...preparedNames,
        "logistic_coefficients = np.ravel(fitted_model.coef_[0]) if fitted_model.coef_.ndim == 2 else np.ravel(fitted_model.coef_)",
        "if len(prepared_names) != len(logistic_coefficients): prepared_names = np.asarray(feature_names, dtype=object)",
        "logistic_interpretation = pd.DataFrame({\"feature\":prepared_names, \"relative_weight\":logistic_coefficients})",
        "logistic_interpretation"
      ];
    } else if (modelId === "svm_cls") {
      modelLines = [
        "support_vectors = fitted_model.support_vectors_",
        "svm_decision_values = fitted_pipeline.decision_function(interpret_row)",
        "svm_summary = pd.DataFrame({\"actual\":[interpret_actual], \"prediction\":[interpret_prediction], \"support_vectors\":[len(support_vectors)], \"support_vectors_by_class\":[fitted_model.n_support_.tolist()], \"held_out_row_decision\":[str(np.asarray(svm_decision_values).ravel().tolist())]})",
        "svm_summary"
      ];
    } else if (modelId === "one_r") {
      modelLines = [
        "one_r_rules = one_r_rule_table(fitted_model, fitted_pipeline.named_steps[\"prepare\"], feature_names)",
        "print(\"OneRClassifier uses one feature at a time; these are the fitted rules.\")",
        "one_r_rules"
      ];
    } else if (modelId === "knn_cls") {
      modelLines = [
        "knn_fit_rows, knn_validation_rows = next(cv.split(X_train, y_train))",
        "knn_pipeline = clone(chosen_pipeline).fit(X_train.iloc[knn_fit_rows], y_train.iloc[knn_fit_rows])",
        "knn_row = X_train.iloc[[int(knn_validation_rows[0])]]",
        "knn_model = knn_pipeline.named_steps[\"model\"]",
        "knn_transformed_row = knn_pipeline[:-1].transform(knn_row)",
        "knn_distances, knn_positions = knn_model.kneighbors(knn_transformed_row)",
        "knn_training_rows = np.asarray(knn_fit_rows)[knn_positions[0]]",
        "knn_neighbor_table = pd.DataFrame({\"training_row\":knn_training_rows, \"distance_after_preparation\":knn_distances[0], \"neighbor_class\":y_train.iloc[knn_training_rows].to_numpy(), \"prediction\":knn_pipeline.predict(knn_row)[0]})",
        "knn_neighbor_table"
      ];
    } else if (["lda", "qda"].includes(modelId)) {
      modelLines = [
        ...preparedNames,
        "class_centres = pd.DataFrame(fitted_model.means_, columns=prepared_names)",
        "class_centres.insert(0, \"class\", fitted_model.classes_)",
        "class_probabilities = fitted_pipeline.predict_proba(interpret_row)[0]",
        "probability_table = pd.DataFrame({\"class\":fitted_model.classes_, \"posterior_probability\":class_probabilities})",
        "probability_table.insert(0, \"held_out_actual\", interpret_actual)",
        "probability_table.insert(1, \"held_out_prediction\", interpret_prediction)",
        ...(modelId === "qda" ? ["print(\"Regularisation:\", fitted_model.reg_param)"] : []),
        "print(\"Posterior probabilities for the excluded validation row:\")",
        "print(probability_table.to_string(index=False))",
        "print(\"Class centres describe the fitted class means in the prepared feature space.\")",
        "class_centres"
      ];
    } else if (modelId === "naive_bayes") {
      const gaussian = pureNaiveBayesInput(value) === "continuous";
      modelLines = [
        ...preparedNames,
        "prior_values = fitted_model.class_prior_ if hasattr(fitted_model, \"class_prior_\") else np.exp(fitted_model.class_log_prior_)",
        "first_row = interpret_row",
        "first_row_prepared = fitted_pipeline.named_steps[\"prepare\"].transform(first_row) if not isinstance(fitted_pipeline.named_steps[\"prepare\"], str) else first_row.to_numpy()",
        "first_row_prepared = first_row_prepared.toarray() if hasattr(first_row_prepared, \"toarray\") else np.asarray(first_row_prepared)",
        "first_row_values = first_row_prepared[0].astype(float)",
        gaussian ? "nb_feature_labels = [str(name) for name in prepared_names]" : pureNaiveBayesInput(value) === "binary" ? "nb_feature_labels = [f\"{name}=1\" for name in prepared_names]" : "nb_feature_labels = [str(name) for name in prepared_names]",
        "nb_class_labels = [str(label) for label in fitted_model.classes_]",
        "nb_prediction = fitted_pipeline.predict(first_row)[0]",
        "nb_posterior_values = fitted_pipeline.predict_proba(first_row)[0]",
        "nb_posterior = pd.DataFrame({\"class\":fitted_model.classes_, \"posterior_probability\":nb_posterior_values, \"prior_probability\":prior_values})",
        "nb_posterior.insert(0, \"held_out_actual\", interpret_actual)",
        "nb_posterior.insert(1, \"held_out_prediction\", nb_prediction)",
        "print(\"Prior probability: class frequency learned from the training rows.\")",
        "print(\"Posterior probability: prior combined with the class-conditional feature evidence for the displayed row.\")",
        ...(gaussian ? [
          "nb_gaussian_means = pd.DataFrame(fitted_model.theta_, columns=prepared_names)",
          "nb_gaussian_means.insert(0, \"class\", fitted_model.classes_)",
          "nb_gaussian_stds = pd.DataFrame(np.sqrt(fitted_model.var_), columns=prepared_names)",
          "nb_gaussian_stds.insert(0, \"class\", fitted_model.classes_)",
          "nb_safe_stds = np.maximum(np.sqrt(fitted_model.var_), np.finfo(float).eps)",
          "nb_density_values = np.exp(-0.5 * ((first_row_values[None, :] - fitted_model.theta_) / nb_safe_stds) ** 2) / (nb_safe_stds * np.sqrt(2 * np.pi))",
          `nb_quantity_evidence = pd.DataFrame([{
    "class":fitted_model.classes_[class_index],
    "feature":nb_feature_labels[feature_index],
    "observed_value":first_row_values[feature_index],
    "quantity":"Class-conditional density",
    "density":nb_density_values[class_index, feature_index]
} for class_index in range(len(fitted_model.classes_)) for feature_index in range(len(nb_feature_labels))])`,
          "class_evidence = nb_gaussian_means",
          "nb_prediction_story = nb_posterior",
          "print(\"Class-conditional density: the Gaussian evidence for each observed feature value under each class.\")",
          "nb_prediction_story"
        ] : [
          "nb_probability_values = np.exp(fitted_model.feature_log_prob_)",
          `nb_one_probabilities = pd.DataFrame([{
    "class":fitted_model.classes_[class_index],
    "feature":nb_feature_labels[feature_index],
    "class_conditional_probability":nb_probability_values[class_index, feature_index]
} for class_index in range(len(fitted_model.classes_)) for feature_index in range(len(nb_feature_labels))])`,
          "class_evidence = pd.DataFrame(nb_probability_values, columns=prepared_names)",
          "class_evidence.insert(0, \"class\", fitted_model.classes_)",
          "nb_quantity_evidence = nb_one_probabilities",
          "nb_prediction_story = nb_posterior",
          "print(\"Class-conditional probability: the likelihood of each prepared yes/no feature under each class.\")",
          "nb_prediction_story"
        ])
      ];
    } else if (modelId === "mlp_cls") {
      modelLines = [
        "mlp_model = fitted_model",
        "mlp_loss_curve = mlp_model.loss_curve_",
        "fig, ax = plt.subplots(figsize=(6.2, 3.4))",
        "ax.plot(mlp_loss_curve, color=\"#7651a6\"); ax.set(title=\"Training loss during optimisation\", xlabel=\"iteration\", ylabel=\"loss\"); fig.tight_layout()",
        "print(\"Loss is optimisation evidence from the fitted fold; it does not measure generalisation. Alpha is reserved for a future regularisation experiment, while this route's search compares hidden-layer width.\")",
        "mlp_summary = pd.DataFrame({\"held_out_actual\":[interpret_actual], \"held_out_prediction\":[interpret_prediction], \"hidden_layer_sizes\":[str(mlp_model.hidden_layer_sizes)], \"iterations\":[mlp_model.n_iter_], \"held_out_probabilities\":[str(fitted_pipeline.predict_proba(interpret_row)[0].tolist())]})",
        "mlp_summary"
      ];
    } else if (modelId === "mlp_reg") {
      modelLines = [
        "mlp_model = fitted_model.regressor_",
        "mlp_loss_curve = mlp_model.loss_curve_",
        "fig, ax = plt.subplots(figsize=(6.2, 3.4))",
        "ax.plot(mlp_loss_curve, color=\"#7651a6\"); ax.set(title=\"Training loss during optimisation\", xlabel=\"iteration\", ylabel=\"loss\"); fig.tight_layout()",
        "print(\"Loss is optimisation evidence from the fitted fold; it does not measure generalisation. Alpha is reserved for a future regularisation experiment, while this route's search compares hidden-layer width.\")",
        "mlp_summary = pd.DataFrame({\"held_out_actual\":[interpret_actual], \"held_out_prediction_original_units\":[float(interpret_prediction)], \"hidden_layer_sizes\":[str(mlp_model.hidden_layer_sizes)], \"iterations\":[mlp_model.n_iter_], \"absolute_error_original_units\":[float(abs(interpret_actual - interpret_prediction))]})",
        "mlp_summary"
      ];
    }
    return [...(includeCommon ? common : []), ...(includeModelEvidence ? [...fitLines, ...modelLines] : [])].join("\n");
  }

  function diagnosticEvidenceCode(config, modelId, value) {
    return [
      "# Optional · Understand the fitted model (training rows only)",
      "# This cell is separate from the short Diagnose step and can be edited or skipped.",
      diagnosticPrimaryCode(config, modelId, value, true, false)
    ].join("\n");
  }

  function diagnosticsCode(config, modelId, value) {
    const primaryCode = diagnosticPrimaryCode(config, modelId, value);
    const evidenceCode = diagnosticEvidenceCode(config, modelId, value);
    const advancedCode = evidenceCode;
    // The worker runs only primaryCode. Keep the optional interpretation as a
    // separate source so an injected setup block can never replace its result.
    return {primaryCode, evidenceCode, advancedCode};
  }

  function finalCode(config) {
    if (config.task === "classification") return `# 10 · Refit on all training rows, then run the final test once
from sklearn.base import clone
from sklearn.metrics import accuracy_score, f1_score
final_model = clone(chosen_pipeline).fit(X_train, y_train)
test_predictions = final_model.predict(X_test)
macro_f1 = f1_score(y_test, test_predictions, average="macro")
accuracy = accuracy_score(y_test, test_predictions)
print("Final test rows:", len(y_test))
test_result = pd.DataFrame({
    "metric":["macro F1", "accuracy"],
    "value":[macro_f1, accuracy]
})
test_result.round(3)`;
    return `# 10 · Refit on all training rows, then run the final test once
from sklearn.base import clone
from sklearn.metrics import root_mean_squared_error
final_model = clone(chosen_pipeline).fit(X_train, y_train)
test_predictions = final_model.predict(X_test)
rmse = root_mean_squared_error(y_test, test_predictions)
print("Final test rows:", len(y_test))
test_result = pd.DataFrame({
    "metric":["RMSE"],
    "value":[rmse]
})
test_result.round(3)`;
  }

  function finalOptionalCode(config) {
    if (config.task === "classification") return `# Optional · Display the final confusion matrix from saved predictions
from sklearn.metrics import ConfusionMatrixDisplay
class_labels = ${py(classLabelMap(config))}
display_classes = np.unique(y_train)
display_labels = [class_labels.get(str(label), str(label)) for label in display_classes]
ConfusionMatrixDisplay.from_predictions(y_test, test_predictions, labels=display_classes, display_labels=display_labels, cmap="Blues")
plt.title(${py(`Final sealed-test confusion matrix for ${friendlyColumnName(config.target)}`)})
plt.tight_layout()`;
    return `# Optional · Display actual and predicted final-test values
fig, ax = plt.subplots(figsize=(6.2, 4))
sns.scatterplot(x=y_test, y=test_predictions, ax=ax, color="#137c9c")
limits = [min(y_test.min(), test_predictions.min()), max(y_test.max(), test_predictions.max())]
ax.plot(limits, limits, "--", color="#c75b20")
ax.set(title="Final sealed test: actual vs predicted", xlabel=${py(`Actual ${friendlyColumnName(config.target)}`)}, ylabel=${py(`Predicted ${friendlyColumnName(config.target)}`)})
fig.tight_layout()`;
  }

  function supervisedRoute(config, value, modelId, folds) {
    const hasHyperparameters = modelSpec(modelId, value, config).grid !== "{}";
    const teaching = supervisedTeaching(config, value, modelId, folds);
    const reference = referenceCode(config);
    const splitCaption = config.split === "time"
      ? "chronological 80/20 split"
      : config.task === "classification"
        ? "stratified 80/20 split"
        : "random 80/20 split";
    return [
      task("frame","Choose what to predict","define X and y",frameCode(config, value),teaching.frame),
      task("split","Split data and save the test set",splitCaption,splitCode(config),teaching.split),
      task("explore","Explore training data","training inputs + plots",exploreCode(config, value),teaching.explore),
      task("prepare","Define the preparation recipe","only selected feature types",preprocessingCode(config, value, modelId),teaching.prepare),
      task("model","Build the model pipeline",modelSpec(modelId, value, config).concept,modelCode(modelId, value, config),teaching.model),
      task("baseline","Validate the initial model",`${folds}-fold training-only CV`,baselineCode(config, folds),teaching.baseline),
      task("reference","Compare with a simple reference",`${folds}-fold reference on training rows`,reference,teaching.reference),
      ...(hasHyperparameters ? [task("tune","Tune the model",`GridSearchCV · ${folds} folds`,tuningCode(config, modelId, value),teaching.tune)] : []),
      task("diagnose","Inspect validation errors","training-only diagnostics",diagnosticsCode(config, modelId, value),teaching.diagnose),
      task("final","Final test","saved test set · one walkthrough",{primaryCode:finalCode(config), optionalCode:finalOptionalCode(config)},teaching.final)
    ];
  }

  function unsupervisedFrameCode(config, value) {
    return frameCode(config, value, true);
  }

  const UNSUPERVISED_CONCEPT_LIBRARY = Object.freeze({
    cluster: {
      label:"CLUSTER",
      text:"A cluster is a group of rows that are similar according to the selected features and clustering method."
    },
    cluster_label: {
      label:"CLUSTER LABEL",
      text:"Numbers such as 0, 1, and 2 are arbitrary names. Cluster 2 is not automatically better or larger than cluster 1."
    },
    distance: {
      label:"DISTANCE",
      text:"Clustering often depends on how close rows are in feature space."
    },
    scaling: {
      label:"SCALING",
      text:"If one feature uses much larger numbers than another, it can dominate distance calculations. The numeric clustering routes scale the features so magnitudes are comparable."
    },
    no_target_score: {
      label:"NO TARGET SCORE",
      text:"There is no known correct target or class label being predicted here. Silhouette describes properties of the discovered grouping; it is not supervised accuracy."
    },
    choice_not_truth: {
      label:"CHOICE, NOT TRUTH",
      text:"Different defensible clusterings may answer different descriptive questions; the data does not contain one guaranteed correct grouping."
    },
    centroid: {
      label:"CENTROID",
      text:"A centroid is the centre or average position of one K-Means cluster in the prepared feature space."
    },
    k: {
      label:"k",
      text:"k is the number of clusters we ask K-Means to form. The analyst chooses it rather than reading a guaranteed answer from the data."
    },
    inertia: {
      label:"INERTIA",
      text:"Inertia adds the squared distances from rows to their assigned centres. Lower means a tighter fit, but inertia almost always falls as k increases."
    },
    silhouette: {
      label:"SILHOUETTE",
      text:"Silhouette asks whether a row is closer to its own cluster than to the nearest competing cluster. Near +1 is comfortably inside, around 0 is between or overlapping, and below 0 may fit another cluster better. A higher average usually indicates stronger separation, but silhouette is evidence, not an oracle."
    },
    profile: {
      label:"CLUSTER PROFILE",
      text:"Cluster IDs become meaningful only after comparing original feature values, such as a group with higher temperature and lower humidity."
    },
    pca_projection: {
      label:"PCA MAP",
      text:"The clustering used all selected prepared dimensions; this PCA chart is only a two-dimensional visual projection, so it is not a complete quality test."
    },
    agglomerative: {
      label:"AGGLOMERATIVE",
      text:"Agglomerative clustering starts with each row as its own group and repeatedly merges the closest groups, building a hierarchy."
    },
    ward: {
      label:"WARD LINKAGE",
      text:"Ward chooses merges that cause the smallest increase in within-group variation, or spread."
    },
    leaves: {
      label:"LEAVES",
      text:"Leaves at the bottom of a dendrogram represent observations or small groups before later merges."
    },
    join: {
      label:"JOIN",
      text:"A join is where two branches combine into one larger group."
    },
    merge_height: {
      label:"MERGE HEIGHT",
      text:"Height shows how dissimilar the groups were when Ward merged them; a large vertical gap suggests a larger jump in dissimilarity."
    },
    horizontal_cut: {
      label:"HORIZONTAL CUT",
      text:"Imagine drawing a horizontal line through the dendrogram: the separated branches below that line correspond to the clustering at that cut. The line is evidence for a choice, not an objectively correct answer."
    },
    sampling: {
      label:"REPRODUCIBLE SAMPLE",
      text:"The hierarchy uses a reproducible sample of at most 500 rows because storing and comparing all pairwise relationships becomes expensive; another sample can produce somewhat different branches."
    },
    principal_component: {
      label:"PRINCIPAL COMPONENT",
      text:"A principal component is a new axis made from a weighted combination of the original features."
    },
    pc1: {
      label:"PC1",
      text:"PC1 points in the direction where the prepared rows vary the most."
    },
    pc2: {
      label:"PC2",
      text:"PC2 captures as much remaining variation as possible while pointing in a different, perpendicular direction."
    },
    not_clustering: {
      label:"PCA IS NOT CLUSTERING",
      text:"PCA creates new axes and row coordinates; it does not assign cluster labels. Any apparent groups come from where rows fall in the new coordinate system."
    },
    pca_scaling: {
      label:"WHY SCALE FOR PCA",
      text:"PCA looks for directions with large variance. A feature with a larger numerical scale can dominate that direction, so this walkthrough scales selected features so different units are compared on a common scale."
    },
    redundancy: {
      label:"REDUNDANCY",
      text:"Correlated features may contain overlapping variation, which can make a smaller set of component axes useful; PCA does not require strong correlation."
    },
    explained_variance: {
      label:"EXPLAINED VARIANCE RATIO",
      text:"Explained variance ratio is the fraction of total variance represented by one principal component. For example, 0.42 means that component represents 42% of the variance in the prepared data."
    },
    cumulative_variance: {
      label:"CUMULATIVE VARIANCE",
      text:"Cumulative explained variance adds the component ratios from the beginning, so PC1 plus PC2 tells how much the first two components represent together."
    },
    scree: {
      label:"SCREE PLOT",
      text:"A scree plot shows the variance explained by each component. Look for components whose added variance becomes relatively small; an elbow is not always obvious."
    },
    ninety_rule: {
      label:"CHOSEN VARIANCE CRITERION",
      text:"A variance-retention percentage is a criterion chosen for this walkthrough, not a universal PCA law or an objectively correct component count."
    },
    reduced_representation: {
      label:"REDUCED REPRESENTATION",
      text:"A reduced representation keeps fewer component coordinates as a chosen trade-off between compactness and variance retained."
    },
    loading: {
      label:"LOADING",
      text:"A loading is the weight of an original feature in a principal component. It tells how that feature contributes to the component direction."
    },
    loading_magnitude: {
      label:"LOADING MAGNITUDE",
      text:"A larger absolute loading means the feature contributes more strongly to that component's direction."
    },
    loading_sign: {
      label:"LOADING SIGN",
      text:"Positive and negative loadings point in opposite directions along a component; positive is not automatically good and negative is not automatically bad."
    },
    loading_sign_arbitrary: {
      label:"ARBITRARY COMPONENT SIGN",
      text:"PCA component signs are arbitrary as a whole. Flipping every loading and every row score for one component describes the same axis."
    },
    score: {
      label:"COMPONENT SCORE",
      text:"Once the axes are learned, a component score is the coordinate showing where one row lies on a component."
    },
    loading_vs_score: {
      label:"LOADING VS SCORE",
      text:"A loading describes how an original feature contributes to an axis; a score describes where a row lies on that axis."
    },
    projection: {
      label:"2D PROJECTION",
      text:"A two-dimensional PCA projection shows only PC1 and PC2. It is a teaching view, not automatically the same as the selected reduced representation."
    },
    reference_after_fit: {
      label:"REFERENCE LABEL AFTER FIT",
      text:"Reference labels can be added after PCA is fitted for descriptive colouring only. They do not choose the axes, component count, or quality of the projection."
    },
    pca_limitations: {
      label:"PCA LIMITATIONS",
      text:"PCA is linear and prioritises variance rather than prediction usefulness. High variance is not automatically scientifically important, and later components may contain structure hidden by a 2D view."
    }
  });

  function unsupervisedConcepts(keys) {
    return [...new Set(keys)].map(key => {
      const item = UNSUPERVISED_CONCEPT_LIBRARY[key];
      if (!item) throw new Error(`Unknown unsupervised teaching concept: ${key}`);
      return concept(key, item.label, item.text);
    });
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
      + imports.join("\n") + "\n\npreprocessor = " + expression + "\nX_scaled = preprocessor.fit_transform(X)\n\nX_scaled[:5]";
  }

  function pcaExploreCode(config, value) {
    const frameName = modelFrameName(config);
    const names = featureNames(value);
    if (names.length <= 12) {
      return `# 2 · Inspect redundancy before PCA\ncorrelation = ${frameName}[feature_names].corr()\nfig, ax = plt.subplots(figsize=(7, 5))\nsns.heatmap(correlation, cmap="vlag", center=0, ax=ax)\nax.set_title("Correlation among selected inputs")\nfig.tight_layout()\nprint("Correlated features may contain overlapping variation, but PCA does not require strong correlation.")\ncorrelation.round(2)`;
    }
    return pcaExploreCodeForRoute(config, value);
  }

  function pcaExploreCodeForRoute(config, value) {
    const frameName = modelFrameName(config);
    const names = featureNames(value);
    if (names.length <= 12) return pcaExploreCode(config, value);
    const [leftName, rightName] = names;
    return {
      primaryCode:`# 2 · Inspect one named redundancy pair before PCA
left_feature = ${py(leftName)}
right_feature = ${py(rightName)}
correlation = X[[left_feature, right_feature]].corr()
pair_correlation = correlation.loc[left_feature, right_feature]
fig, ax = plt.subplots(figsize=(6.5, 4.2))
sns.scatterplot(data=X, x=left_feature, y=right_feature, alpha=.65, ax=ax)
ax.set_title(f"One selected pair: {left_feature} and {right_feature}")
fig.tight_layout()
pair_summary = pd.DataFrame({"feature_a":[left_feature], "feature_b":[right_feature], "correlation":[pair_correlation], "absolute_correlation":[abs(pair_correlation)]})
print("This named pair shows how two original inputs may repeat some variation before PCA creates new axes.")
pair_summary.round(3)`,
      optionalCode:`# Optional · Explore all unique feature pairs
from itertools import combinations
pairs_correlation = X[feature_names].corr()
pairs = []
for first, second in combinations(feature_names, 2):
    value = pairs_correlation.loc[first, second]
    pairs.append([first, second, value, abs(value)])
pair_table = pd.DataFrame(pairs, columns=["First feature", "Second feature", "Correlation", "Magnitude"])
print("combinations(..., 2) visits each pair once.")
pair_table.nlargest(12, "Magnitude")`
    };
  }

  function kmeansRoute(config, value) {
    const story = unsupervisedStory(config, value, "kmeans");
    const directMap = featureCount(value) === 2
      ? `# 8 · Map the fitted labels in the selected inputs
plot_df = X[feature_names].copy()
plot_df["cluster"] = clusters.astype(str)
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x=feature_names[0], y=feature_names[1], hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"K-means clusters (k={selected_k}) in the selected inputs")
ax.set_xlabel(feature_names[0])
ax.set_ylabel(feature_names[1])
print("With two selected inputs, this map keeps the original feature axes so the discovered groups can be read directly.")
fig.tight_layout()
plot_df.head(12)`
      : {
        primaryCode:`# 8 · Map a named pair of the fitted inputs
plot_df = X[feature_names[:2]].copy()
plot_df["cluster"] = clusters.astype(str)
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x=feature_names[0], y=feature_names[1], hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"K-means clusters (k={selected_k}) in two selected inputs")
ax.set_xlabel(feature_names[0])
ax.set_ylabel(feature_names[1])
print(f"This named pair shows two of the {len(feature_names)} inputs used for clustering; original axes do not reproduce the scaled distance calculation.")
fig.tight_layout()
plot_df.head(12)`,
        optionalCode:`# Optional · Map all prepared inputs into two PCA coordinates
from sklearn.decomposition import PCA
projection = PCA(n_components=2).fit_transform(X_scaled)
pca_map = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "cluster":clusters.astype(str)})
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=pca_map, x="PC1", y="PC2", hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"K-means clusters (k={selected_k}) in a PCA view")
print("This optional PCA view compresses all prepared inputs into two axes; overlap here does not settle cluster quality.")
fig.tight_layout()
pca_map.head(12)`
      };
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),{
        question:story.frameQuestion,
        readingCue:story.frameCue,
        concepts:unsupervisedConcepts(["cluster", "no_target_score", "cluster_label"])
      }),
      task("explore","Explore the data","inputs + plots",exploreCode(config, value, true),{
        question:story.exploreQuestion,
        readingCue:story.exploreCue,
        concepts:unsupervisedConcepts(["cluster"])
      }),
      task("prepare","Prepare the data","scaled numeric inputs",clusterPreprocessing(config),{
        question:story.prepareQuestion,
        readingCue:story.prepareCue,
        concepts:unsupervisedConcepts(["distance", "scaling"])
      }),
      task("compare","Compare possible group counts","compact inertia + silhouette table",{
        primaryCode:`# 4 · Compare possible group counts; this is exploratory, not a test score
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
candidate_rows = []
max_k = min(8, len(X_scaled) - 1)
sample_size = min(2000, len(X_scaled))
for k in range(2, max_k + 1):
    candidate = KMeans(n_clusters=k, n_init=20, random_state=42).fit(X_scaled)
    candidate_rows.append({"k":k, "inertia":candidate.inertia_, "silhouette":silhouette_score(X_scaled, candidate.labels_, sample_size=sample_size, random_state=42)})
candidate_scores = pd.DataFrame(candidate_rows, columns=["k", "inertia", "silhouette"])
print("Use the elbow, silhouette values, cluster sizes, and original-unit profiles to choose k for your question; no single score makes that decision automatically.")
candidate_scores.round(3)`,
        optionalCode:`# Optional · Plot the candidate evidence after reading the compact table
fig, axes = plt.subplots(1, 2, figsize=(9, 3.4))
sns.lineplot(data=candidate_scores, x="k", y="inertia", marker="o", ax=axes[0])
sns.lineplot(data=candidate_scores, x="k", y="silhouette", marker="o", ax=axes[1], color="#7651a6")
axes[0].set_title("Elbow: within-cluster inertia")
axes[1].set_title("Higher silhouette is better")
fig.tight_layout()
candidate_scores.round(3)`
      },{
        question:story.compareQuestion,
        readingCue:story.compareCue,
        concepts:unsupervisedConcepts(["k", "inertia", "silhouette", "choice_not_truth"]),
        practice:practiceForTask(config, value, "kmeans", "compare")
      }),
      task("fit","Fit K-means","neutral runnable starting k",`# 5 · Fit a runnable starting K-means solution
selected_k = min(3, max_k)  # Edit this after comparing the evidence if another k is more useful.
kmeans = KMeans(n_clusters=selected_k, n_init=20, random_state=42)
clusters = kmeans.fit_predict(X_scaled)
print(f"This walkthrough starts at k={selected_k} so it can run. Compare the elbow, silhouette, cluster sizes, and profiles, then edit selected_k if another solution is more useful.")
pd.Series(clusters, name="cluster").head(12)`,{
        question:story.fitQuestion,
        readingCue:story.fitCue,
        concepts:unsupervisedConcepts(["centroid", "k", "choice_not_truth", "cluster_label"]),
        practice:practiceForTask(config, value, "kmeans", "fit")
      }),
      task("diagnose","Check the clusters","size + separation",`# 6 · Check whether the solution is balanced and separated
from sklearn.metrics import silhouette_score
silhouette_size = min(2000, len(X_scaled))
global_silhouette = silhouette_score(X_scaled, clusters, sample_size=silhouette_size, random_state=42)
cluster_sizes = pd.Series(clusters, name="cluster").value_counts().sort_index().rename("rows").reset_index()
cluster_quality = pd.DataFrame({"rows":[len(X_scaled)], "clusters":[len(cluster_sizes)], "global_silhouette":[global_silhouette], "silhouette_sample_size":[silhouette_size]})
print("Very tiny clusters may represent a genuine rare pattern, outliers, or an overly fragmented solution; do not label them bad from size alone.")
print("Cluster counts:")
print(cluster_sizes.to_string(index=False))
cluster_quality.round(3)`,{
        question:story.diagnoseQuestion,
        readingCue:story.diagnoseCue,
        concepts:unsupervisedConcepts(["silhouette", "cluster_label"]),
        modelTeaching:modelSpecificTeaching(config, "kmeans", value)
      }),
      task("profile","Explain the clusters","original feature units",`# 7 · Translate cluster IDs back into the original features
clustered_data = X.copy()
clustered_data["cluster"] = clusters
cluster_means = clustered_data.groupby("cluster")[feature_names].mean().round(2).reset_index()
print("Cluster IDs are arbitrary. These original-unit row means describe each group; compare them with the candidate evidence before assigning a meaning.")
cluster_means`,{
        question:story.profileQuestion,
        readingCue:story.profileCue,
        concepts:unsupervisedConcepts(["profile", "centroid", "cluster_label"]),
        practice:practiceForTask(config, value, "kmeans", "profile")
      }),
      task("visualise","Map the clusters","two inputs or optional PCA view",directMap,{
        question:story.closingQuestion,
        readingCue:story.closingCue,
        concepts:unsupervisedConcepts(["pca_projection"])
      })
    ];
  }

  function hierarchicalRoute(config, value) {
    const story = unsupervisedStory(config, value, "hierarchical");
    const directMap = featureCount(value) === 2
      ? `# 8 · Map the sampled labels in the selected inputs
plot_df = X_sample[feature_names].copy()
plot_df["cluster"] = clusters.astype(str)
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x=feature_names[0], y=feature_names[1], hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"Hierarchical groups (k={selected_k}) in the selected inputs")
ax.set_xlabel(feature_names[0])
ax.set_ylabel(feature_names[1])
print("With two selected inputs, this map keeps the original feature axes so the discovered groups can be read directly.")
fig.tight_layout()
plot_df.head(12)`
      : {
        primaryCode:`# 8 · Map a named pair of the sampled inputs
plot_df = X_sample[feature_names[:2]].copy()
plot_df["cluster"] = clusters.astype(str)
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x=feature_names[0], y=feature_names[1], hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"Hierarchical groups (k={selected_k}) in two selected inputs")
ax.set_xlabel(feature_names[0])
ax.set_ylabel(feature_names[1])
print(f"This named pair shows two of the {len(feature_names)} inputs used for the hierarchy; original axes do not reproduce the scaled distance calculation.")
fig.tight_layout()
plot_df.head(12)`,
        optionalCode:`# Optional · Map all sampled inputs into two PCA coordinates
from sklearn.decomposition import PCA
projection = PCA(n_components=2).fit_transform(X_sample_scaled)
pca_map = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "cluster":clusters.astype(str)})
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=pca_map, x="PC1", y="PC2", hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"Hierarchical groups (k={selected_k}) in a PCA view")
print("This optional PCA view compresses all sampled inputs into two axes; overlap here does not settle the hierarchy.")
fig.tight_layout()
pca_map.head(12)`
      };
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),{
        question:story.frameQuestion,
        readingCue:story.frameCue,
        concepts:unsupervisedConcepts(["cluster", "no_target_score", "cluster_label", "choice_not_truth"])
      }),
      task("explore","Explore the data","inputs + plots",exploreCode(config, value, true),{
        question:story.exploreQuestion,
        readingCue:story.exploreCue,
        concepts:unsupervisedConcepts(["cluster", "distance"])
      }),
      task("prepare","Prepare the data","scaled numeric sample",clusterPreprocessing(config) + `
# Hierarchical clustering is quadratic in memory, so every later step uses one reproducible sample.
sample_size = min(500, len(X_scaled))
X_sample = X.sample(n=sample_size, random_state=42)
X_sample_scaled = preprocessor.transform(X_sample)
print(f"This hierarchy uses a reproducible sample of {sample_size} rows out of {len(X_scaled)} because pairwise comparisons become expensive as the dataset grows.")
pd.DataFrame({"dataset_rows":[len(X_scaled)], "sampled_rows":[sample_size]})`,{
        question:story.prepareQuestion,
        readingCue:story.prepareCue,
        concepts:unsupervisedConcepts(["distance", "scaling", "sampling"])
      }),
      task("dendrogram","Build the dendrogram","Ward linkage sample",`# 4 · Inspect the hierarchy before choosing a cut
from scipy.cluster.hierarchy import linkage, dendrogram
hierarchy = linkage(X_sample_scaled, method="ward")
fig, ax = plt.subplots(figsize=(10, 4))
dendrogram(hierarchy, truncate_mode="level", p=5, no_labels=True, color_threshold=None, ax=ax)
ax.set(title="Ward-linkage dendrogram", xlabel="merged groups", ylabel="Ward merge height")
fig.tight_layout()
print("Leaves represent observations or small groups; joins are merges; Ward merge height is the dissimilarity when groups combine. A large vertical gap suggests a larger jump in dissimilarity.")
merge_view = pd.DataFrame({
    "merge_number":np.arange(1, len(hierarchy) + 1)[-10:],
    "merge_height":hierarchy[-10:, 2],
    "members_after_merge":hierarchy[-10:, 3].astype(int)
})
merge_view.round(2)`,{
        question:story.dendrogramQuestion,
        readingCue:story.dendrogramCue,
        concepts:unsupervisedConcepts(["agglomerative", "ward", "leaves", "join", "merge_height", "horizontal_cut"])
      }),
      task("compare","Compare possible cuts","exploratory silhouette",`# 5 · Compare cuts on the same sample; this is exploratory, not a test score
from scipy.cluster.hierarchy import cut_tree
from sklearn.metrics import silhouette_score
candidate_rows = []
max_k = min(8, len(X_sample_scaled) - 1)
silhouette_size = min(2000, len(X_sample_scaled))
for k in range(2, max_k + 1):
    labels = cut_tree(hierarchy, n_clusters=k).ravel()
    candidate_rows.append({"clusters":k, "silhouette":silhouette_score(X_sample_scaled, labels, sample_size=silhouette_size, random_state=42)})
candidate_scores = pd.DataFrame(candidate_rows)
fig, ax = plt.subplots(figsize=(6, 3.4))
sns.lineplot(data=candidate_scores, x="clusters", y="silhouette", marker="o", color="#7651a6", ax=ax)
ax.set_title("Choose a defensible dendrogram cut")
fig.tight_layout()
print("Use dendrogram gaps, silhouette, resulting cluster sizes, and original-unit profiles to choose a cut for your question; no single score makes that decision automatically.")
candidate_scores.round(3)`,{
        question:story.compareQuestion,
        readingCue:story.compareCue,
        concepts:unsupervisedConcepts(["silhouette", "horizontal_cut", "choice_not_truth"]),
        practice:practiceForTask(config, value, "hierarchical", "compare")
      }),
      task("fit","Fit the hierarchy","neutral runnable starting cut",`# 6 · Fit a runnable starting hierarchy
selected_k = min(3, max_k)  # Edit this after comparing the dendrogram and evidence if another cut is more useful.
from scipy.cluster.hierarchy import cut_tree
clusters = cut_tree(hierarchy, n_clusters=selected_k).ravel()
print(f"This walkthrough starts at {selected_k} clusters so it can run. A horizontal cut through the dendrogram represents this choice; edit selected_k if another cut answers your question better.")
pd.Series(clusters).value_counts().sort_index().rename_axis("cluster").reset_index(name="rows")`,{
        question:story.fitQuestion,
        readingCue:story.fitCue,
        concepts:unsupervisedConcepts(["agglomerative", "horizontal_cut", "choice_not_truth", "cluster_label"]),
        practice:practiceForTask(config, value, "hierarchical", "fit")
      }),
      task("profile","Explain the groups","original feature units",`# 7 · Describe the discovered groups in original units
profile_df = X_sample.copy()
profile_df["cluster"] = clusters
cluster_profile = profile_df.groupby("cluster")[feature_names].mean().round(2)
print("Cluster IDs are arbitrary. These original-unit means describe the sampled rows assigned to each group; the hierarchy was fitted on the displayed reproducible sample.")
cluster_profile.reset_index()`,{
        question:story.profileQuestion,
        readingCue:story.profileCue,
        concepts:unsupervisedConcepts(["profile", "cluster_label", "sampling"]),
        modelTeaching:modelSpecificTeaching(config, "hierarchical", value),
        practice:practiceForTask(config, value, "hierarchical", "profile")
      }),
      task("visualise","Map the hierarchy","two inputs or optional PCA view",directMap,{
        question:story.closingQuestion,
        readingCue:story.closingCue,
        concepts:unsupervisedConcepts(["pca_projection", "sampling"])
      })
    ];
  }

  function pcaRoute(config, value) {
    const frameName = modelFrameName(config);
    const story = unsupervisedStory(config, value, "pca");
    return [
      task("frame","Choose what to discover","new axes · target stays hidden",unsupervisedFrameCode(config, value),{
        question:story.frameQuestion,
        readingCue:story.frameCue,
        concepts:unsupervisedConcepts(["principal_component", "pc1", "pc2", "not_clustering"])
      }),
      task("explore","Explore redundancy","one named pair · optional all pairs",pcaExploreCodeForRoute(config, value),{
        question:story.exploreQuestion,
        readingCue:story.exploreCue,
        concepts:unsupervisedConcepts(["redundancy", "principal_component"])
      }),
      task("prepare","Scale the inputs","common numeric scale",clusterPreprocessing(config),{
        question:story.prepareQuestion,
        readingCue:story.prepareCue,
        concepts:unsupervisedConcepts(["pca_scaling"])
      }),
      task("variance","Fit PCA and inspect explained variance","scree + cumulative variance",`# 4 · Fit PCA and inspect variance explained by each component
from matplotlib.ticker import PercentFormatter
from sklearn.decomposition import PCA
pca = PCA()
component_scores = pca.fit_transform(X_scaled)
explained_variance_ratio = pca.explained_variance_ratio_
cumulative_explained_variance = np.cumsum(explained_variance_ratio)
variance_table = pd.DataFrame({
    "component":np.arange(1, len(explained_variance_ratio) + 1),
    "explained_variance_ratio":explained_variance_ratio,
    "cumulative_explained_variance":cumulative_explained_variance
})
fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
sns.lineplot(data=variance_table, x="component", y="explained_variance_ratio", marker="o", ax=axes[0])
sns.lineplot(data=variance_table, x="component", y="cumulative_explained_variance", marker="o", color="#7651a6", ax=axes[1])
axes[0].set(title="Scree plot: variance explained by each component", ylabel="Variance explained")
axes[1].set(title="Cumulative variance retained", ylabel="Cumulative variance")
axes[0].yaxis.set_major_formatter(PercentFormatter(1.0))
axes[1].yaxis.set_major_formatter(PercentFormatter(1.0))
fig.tight_layout()
print("Scree plot: variance explained by each component. Cumulative variance retained: see how the ratios add from the beginning. A variance-retention target is chosen explicitly in the next step. Explained variance is variance evidence, not prediction accuracy.")
variance_table.round(4)`,{
        question:story.varianceQuestion,
        readingCue:story.varianceCue,
        concepts:unsupervisedConcepts(["explained_variance", "cumulative_variance", "scree", "ninety_rule"]),
        practice:practiceForTask(config, value, "pca", "variance")
      }),
      task("select","Select components","chosen variance criterion",`# 5 · Select the smallest representation reaching the chosen variance target
variance_target = 0.90
target_row = variance_table.loc[variance_table["cumulative_explained_variance"] >= variance_target].iloc[0]
components_for_target = int(target_row["component"])
variance_retained = float(target_row["cumulative_explained_variance"])
X_reduced = component_scores[:, :components_for_target]
print(f"For this walkthrough we keep the first {components_for_target} components because they reach {variance_retained:.1%} cumulative variance. The {variance_target:.0%} target is a chosen rule of thumb; another project could choose a different trade-off.")
pd.DataFrame({"original_dimensions":[X_scaled.shape[1]], "variance_target":[variance_target], "components_for_target":[components_for_target], "cumulative_variance_retained":[variance_retained]}).round(4)`,{
        question:story.selectQuestion,
        readingCue:story.selectCue,
        concepts:unsupervisedConcepts(["ninety_rule", "reduced_representation", "cumulative_variance"]),
        practice:practiceForTask(config, value, "pca", "select")
      }),
      task("loadings","Understand the component loadings","which features shape each axis",`# 6 · Connect the component axes back to the original inputs
loadings = pd.DataFrame(pca.components_[:2].T, index=feature_names, columns=["PC1", "PC2"])
loadings.index.name = "feature"
loading_view = loadings[["PC1", "PC2"]].copy()
print("A loading is the weight of an original feature in a component. Larger absolute values mean a stronger contribution; the sign gives direction, not good or bad. This table keeps every selected feature visible for the PC1/PC2 interpretation.")
loading_view.round(3)`,{
        question:story.loadingsQuestion,
        readingCue:story.loadingsCue,
        concepts:unsupervisedConcepts(["loading", "loading_magnitude", "loading_sign", "loading_sign_arbitrary", "score", "loading_vs_score"]),
        practice:practiceForTask(config, value, "pca", "loadings")
      }),
      task("project","Project the rows","PC1 + PC2 coordinates",{
        primaryCode:`# 7 · Give each row coordinates on the learned axes
projection = component_scores[:, :2]
pc1_variance = float(pca.explained_variance_ratio_[0])
pc2_variance = float(pca.explained_variance_ratio_[1])
two_dimensional_variance = pc1_variance + pc2_variance
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1]})
fig, ax = plt.subplots(figsize=(6.6, 4.5), layout="constrained")
sns.scatterplot(data=plot_df, x="PC1", y="PC2", alpha=.7, ax=ax)
ax.set_xlabel(f"PC1 ({pc1_variance:.1%} variance)")
ax.set_ylabel(f"PC2 ({pc2_variance:.1%} variance)")
ax.set_title("2D PCA projection (PC1 + PC2)")
print(f"2D PCA projection: PC1 and PC2 show {two_dimensional_variance:.1%} of total prepared-data variance; the remaining variation lies in later components. This 2D teaching view is separate from the {components_for_target}-component reduced representation selected by the {variance_target:.0%} criterion.")
plot_df.head(12)`,
        optionalCode:`# Optional · Colour the learned coordinates with a reference label
reference_label = ${frameName}[${py(config.target)}].copy()
plot_df_with_reference = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "reference":reference_label.to_numpy()})
fig, ax = plt.subplots(figsize=(6.6, 4.5))
${config.task === "classification" ? `plot_df_with_reference["reference"] = plot_df_with_reference["reference"].astype(str)
sns.scatterplot(data=plot_df_with_reference, x="PC1", y="PC2", hue="reference", alpha=.7, ax=ax)` : `points = ax.scatter(plot_df_with_reference["PC1"], plot_df_with_reference["PC2"], c=plot_df_with_reference["reference"], cmap="viridis", alpha=.7)
fig.colorbar(points, ax=ax, label=${py(config.target)})`}
ax.set_xlabel(f"PC1 ({pc1_variance:.1%} variance)")
ax.set_ylabel(f"PC2 ({pc2_variance:.1%} variance)")
ax.set_title("Optional reference-coloured PCA view")
fig.tight_layout()
print("The reference label is added only after PCA is fitted; it colours the view and does not change the learned axes.")
plot_df_with_reference.head(12)`
      },{
        question:story.closingQuestion,
        readingCue:story.closingCue,
        concepts:unsupervisedConcepts(["score", "loading_vs_score", "projection", "pca_limitations"]),
        modelTeaching:modelSpecificTeaching(config, "pca", value),
        practice:practiceForTask(config, value, "pca", "project")
      })
    ];
  }

  function routeForSelection(config, value, modelId, folds) {
    if (modelId === "kmeans") return kmeansRoute(config, value);
    if (modelId === "hierarchical") return hierarchicalRoute(config, value);
    if (modelId === "pca") return pcaRoute(config, value);
    return supervisedRoute(config, value, modelId, folds);
  }

  function codeSurfaceMetrics(code) {
    const lines = clean(String(code || "")).split("\n");
    const nonEmpty = lines.filter(line => line.trim());
    const comments = nonEmpty.filter(line => line.trim().startsWith("#"));
    return {
      lineCount:lines.length,
      nonEmptyLineCount:nonEmpty.length,
      executableLineCount:nonEmpty.length - comments.length,
      commentLineCount:comments.length
    };
  }

  function routeComplexityReport(tasks) {
    return (Array.isArray(tasks) ? tasks : []).map(item => ({
      taskId:item.id,
      title:item.title,
      caption:item.caption,
      purpose:item.question || "",
      ...codeSurfaceMetrics(item.code),
      hasQuestion:Boolean(item.question),
      hasReadingCue:Boolean(item.readingCue),
      hasConcepts:Boolean(item.concepts?.length),
      hasPractice:Boolean(item.practice)
    }));
  }

  function buildRoute() {
    const config = selectedConfig(), value = selectedScenario(), modelId = selectedModelId(), folds = Number($("#foldSelect").value);
    practiceSetupIdentity = practiceRouteIdentity(currentDatasetId, value.id, modelId, folds);
    routeTasks = Object.freeze(routeForSelection(config, value, modelId, folds).map(Object.freeze));
    renderRoute();
    renderBatchControls();
    if (!$("#guideWindow").hidden) renderWorkflow();
  }

  function setRuntimeReady(value, status = null) {
    runtimeReady = value;
    if (status) $("#runtimeStatus").textContent = status;
    renderBatchControls();
    renderRoute();
  }

  function renderRoute() {
    const strip = $("#routeStrip"); strip.replaceChildren();
    routeTasks.forEach((item, index) => {
      const state = routeButtonState(routeTasks, cells, index, {runtimeReady, testSetOpened});
      const button = document.createElement("button"); button.type = "button"; button.className = "route-card";
      button.dataset.taskId = item.id;
      button.style.setProperty("--stage-color", colorFor(index));
      button.dataset.state = state.status;
      button.disabled = state.blocked;
      button.title = state.message;
      button.innerHTML = `<span class="route-number">${String(index + 1).padStart(2,"0")}</span><span><span class="route-title"></span><span class="route-caption"></span></span><span class="route-arrow">${state.status === "done" ? "✓" : state.status === "stale" ? "↻" : "→"}</span>`;
      $(".route-title", button).textContent = item.title;
      $(".route-caption", button).textContent = item.caption;
      button.addEventListener("click", async () => {
        let cell = cells.find(value => value.taskId === item.id);
        let inserted = false;
        if (!cell) {
          cell = addRouteCell(item, false);
          inserted = true;
          renderNotebookView();
          renderRoute();
        }
        // A route tap should insert/run the cell in place.  In particular,
        // do not restore focus into a newly rendered editor on iOS: focusing
        // this compact textarea can zoom the viewport before the run begins.
        await runCell(cell, {preserveFocus: !inserted});
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

  function routePracticeComplete() {
    return playgroundMode === "practice" && routeTasks.length > 0 && routeTasks.every(task => {
      const cell = cells.find(value => value.taskId === task.id);
      return cell?.status === "done" && (!cell.exercise || practiceStateFor(task.id).exerciseComplete);
    });
  }

  function ensureIndependentCheckpointCell() {
    if (!routePracticeComplete() || cells.some(cell => cell.checkpoint)) return;
    const config = selectedConfig(), value = selectedScenario(), modelId = selectedModelId();
    const metadata = independentCheckpointForRoute(config, value, modelId, Number($("#foldSelect").value));
    if (!metadata) return;
    const cell = addCell(metadata.starterCode, metadata.title, null, false);
    cell.checkpoint = true;
    cell.checkpointMeta = metadata;
    cell.referenceCode = metadata.referenceSolution;
    cell.cleanReferenceCode = metadata.cleanReference;
  }

  function addRouteCell(item, render = true) {
    const exercise = playgroundMode === "practice" ? item.practice?.exercise : null;
    const scaffold = exercise ? applyPracticeScaffold(item.code, exercise) : {code:item.code};
    const cell = addCell(scaffold.code, item.title, item.id, false);
    cell.routeReferenceCode = item.code;
    cell.setupCode = item.setupCode || "";
    cell.evidenceCode = item.evidenceCode || "";
    cell.advancedCode = item.advancedCode || "";
    cell.optionalCode = item.optionalCode || "";
    cell.exercise = exercise || null;
    cell.scaffolded = Boolean(exercise);
    if (render) { renderNotebookView(); renderRoute(); }
    return cell;
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

  function invalidateRouteFrom(taskId, {renderNotebook = false, message = "Workflow changed — rerun from this step.", preservePracticeTaskIds = []} = {}) {
    const result = invalidateCellsFrom(routeTasks, cells, taskId);
    if (!result.changed) return false;
    cells = cells.filter(cell => !cell.checkpoint);
    independentCheckpointState = null;
    clearPracticeStatesFrom(taskId, preservePracticeTaskIds);
    clearLinkedPracticeExperimentStates(taskId, preservePracticeTaskIds);
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
    window.NotebookSession?.remember(cell, cells.indexOf(cell));
    const routeTaskId = cell.taskId;
    cells = cells.filter(value => value.id !== cell.id);
    if (routeTaskId) invalidateRouteFrom(routeTaskId);
    renderNotebookView(); renderRoute(); updateSeal();
  }

  // Notebook renders replace the editable DOM, so retain the invoking
  // editor/control and put focus back on its new equivalent afterwards.
  function captureFocusTarget() {
    const active = document.activeElement;
    if (!active || active === document.body) return null;
    const cellElement = active.closest("article.cell[data-cell-id]");
    if (cellElement) {
      const target = {
        kind: active.matches(".code-input") ? "editor" : "control",
        cellId: cellElement.dataset.cellId
      };
      if (active.matches(".code-input")) {
        target.selectionStart = active.selectionStart;
        target.selectionEnd = active.selectionEnd;
        target.selectionDirection = active.selectionDirection;
      }
      if (active.matches("button")) target.controlClass = active.className;
      return target;
    }
    if (active.matches(".route-card[data-task-id]")) return {kind:"route", taskId:active.dataset.taskId};
    if (active.id) return {kind:"id", id:active.id};
    return null;
  }

  function restoreFocusTarget(target) {
    if (!target) return;
    let element = null;
    if (target.kind === "editor" || target.kind === "control") {
      const article = $$("article.cell[data-cell-id]", $("#notebookPanel")).find(item => item.dataset.cellId === target.cellId);
      if (article) {
        if (target.kind === "editor") element = $(".code-input", article);
        else element = $$("button", article).find(button => button.className === target.controlClass) || $(".code-input", article);
      }
    } else if (target.kind === "route") {
      element = $$(".route-card[data-task-id]").find(item => item.dataset.taskId === target.taskId);
    } else if (target.kind === "id") {
      element = document.getElementById(target.id);
    }
    if (!element || element.disabled) {
      if (target.cellId) {
        const article = $$("article.cell[data-cell-id]", $("#notebookPanel")).find(item => item.dataset.cellId === target.cellId);
        element = $(".code-input", article || $("#notebookPanel"));
      }
    }
    if (!element || typeof element.focus !== "function") return;
    element.focus({preventScroll:true});
    if (target.kind === "editor" && typeof target.selectionStart === "number") {
      try { element.setSelectionRange(target.selectionStart, target.selectionEnd, target.selectionDirection); } catch { /* not a text control */ }
    }
  }

  function routeTaskForCell(cell) {
    return cell?.taskId ? routeTasks.find(item => item.id === cell.taskId) || null : null;
  }

  function teachingLine(label, text, className = "teaching-line", role = "") {
    const line = document.createElement("p");
    line.className = className;
    if (role) line.dataset.teachingRole = role;
    const marker = document.createElement("span");
    marker.className = "teaching-label";
    marker.textContent = `${label}:`;
    const copy = document.createElement("span");
    copy.textContent = text;
    line.append(marker, copy);
    return line;
  }

  function metricHelpBlock(metricHelp, className = "teaching-metric-help") {
    if (!Array.isArray(metricHelp) || !metricHelp.length) return null;
    const block = document.createElement("div");
    block.className = className;
    block.dataset.teachingRole = "metric";
    const heading = document.createElement("div");
    heading.className = "teaching-label teaching-metric-heading";
    heading.textContent = "METRIC MEANING";
    block.append(heading);
    metricHelp.forEach(metric => {
      const line = document.createElement("p");
      line.className = "teaching-metric-line";
      const label = document.createElement("strong");
      label.textContent = `${metric.label} ${metric.direction === "higher" ? "↑" : "↓"}`;
      const copy = document.createElement("span");
      const prefix = `${metric.label}:`;
      copy.textContent = metric.text.startsWith(prefix) ? metric.text.slice(prefix.length).trim() : metric.text;
      line.append(label, copy);
      block.append(line);
    });
    return block;
  }

  function conceptBlock(concepts, className = "teaching-concepts") {
    if (!Array.isArray(concepts) || !concepts.length) return null;
    const block = document.createElement("div");
    block.className = className;
    block.dataset.teachingRole = "concept";
    const heading = document.createElement("div");
    heading.className = "teaching-label teaching-concept-heading";
    heading.textContent = "CONCEPT";
    block.append(heading);
    concepts.forEach(item => {
      const line = document.createElement("p");
      line.className = "teaching-concept-line";
      line.dataset.conceptKey = item.key;
      const label = document.createElement("strong");
      label.textContent = item.label;
      const copy = document.createElement("span");
      copy.textContent = item.text;
      line.append(label, copy);
      block.append(line);
    });
    return block;
  }

  function modelTeachingBlock(teaching, className = "model-teaching") {
    if (!teaching) return null;
    const block = document.createElement("section");
    block.className = className;
    block.dataset.teachingRole = "model-specific";
    block.dataset.modelId = teaching.modelId || "";
    const heading = document.createElement("div");
    heading.className = "teaching-label model-teaching-heading";
    heading.textContent = "MODEL INTERPRETATION";
    block.append(heading);
    [["WHAT IT LEARNED", "learned"], ["SEE IT", "see"], ["READ IT", "read"], ["WATCH OUT", "watchOut"]].forEach(([label, key]) => {
      if (!teaching[key]) return;
      const line = document.createElement("p");
      line.className = "model-teaching-line";
      line.dataset.teachingRole = `model-${key}`;
      const marker = document.createElement("strong");
      marker.textContent = label;
      const copy = document.createElement("span");
      copy.textContent = teaching[key];
      line.append(marker, copy);
      block.append(line);
    });
    return block;
  }

  function teachingActionForTask(task) {
    const routeText = `${task?.title || ""} ${task?.caption || ""} ${task?.question || ""}`;
    const discovery = /target stays hidden|without using a reference target|no target|cluster|hierarchy|dendrogram|component|coordinates|pca/i.test(routeText);
    const actions = {
      frame:discovery
        ? "Define X from the selected inputs and keep the reference target out of discovery."
        : "Define the selected inputs and target so every later step shares one modelling frame.",
      split:"Create the training rows and save the final test rows before fitting anything.",
      explore:discovery
        ? "Inspect the selected rows for structure that can guide the next discovery step."
        : "Inspect the available training data for a pattern that can guide the next step.",
      prepare:discovery
        ? "Define the named preparation object that the discovery method will use."
        : "Define the preparation recipe that later fitting will learn inside each fold.",
      model:"Connect the preparation recipe and estimator into the model pipeline.",
      baseline:"Measure the initial workflow across training folds and inspect the primary metric.",
      reference:"Compare the feature based workflow with a simple reference on the same training folds.",
      tune:"Search the supported settings while the saved final test remains sealed.",
      diagnose:discovery
        ? "Check the discovered structure against its separation, size, or retained-variation evidence."
        : "Inspect training only errors or model evidence after the selection step.",
      final:"Refit the selected workflow on training rows and evaluate the saved test once.",
      compare:"Compare candidate structures before choosing a useful starting value.",
      fit:"Fit the chosen starting structure using the prepared inputs.",
      dendrogram:"Build the named hierarchy so its merge evidence can guide a cut.",
      profile:"Summarise the discovered groups in original feature units.",
      visualise:"Map the discovered structure in a readable view and state what the projection leaves out.",
      variance:"Fit PCA once and measure how much variation each component captures.",
      select:"Choose the first component count that reaches the stated variance target.",
      loadings:"Connect each learned axis back to the original feature names.",
      project:"Place rows on the learned axes and read the variance represented by the view."
    };
    return task?.action || actions[task?.id] || `Run the editable ${String(task?.title || "step").toLowerCase()} cell and inspect its result.`;
  }

  function renderTeachingBlock(cell) {
    const task = routeTaskForCell(cell);
    if (!task || (!task.question && !task.readingCue && !task.concepts?.length && !task.modelTeaching && !task.metricHelp?.length)) return null;
    const block = document.createElement("section");
    block.className = "teaching-block";
    block.dataset.teachingStep = task.id;
    block.setAttribute("aria-label", `Teaching guidance for ${task.title}`);
    if (task.question) block.append(teachingLine("WHY", task.question, "teaching-line teaching-question", "question"));
    block.append(teachingLine("DO", teachingActionForTask(task), "teaching-line teaching-action", "action"));
    const details = document.createElement("details");
    details.className = "teaching-details";
    const summary = document.createElement("summary");
    summary.textContent = "Terms and model notes";
    details.append(summary);
    const concepts = conceptBlock(task.concepts);
    if (concepts) details.append(concepts);
    const modelTeaching = modelTeachingBlock(task.modelTeaching);
    if (modelTeaching) details.append(modelTeaching);
    const metrics = metricHelpBlock(task.metricHelp);
    if (metrics) details.append(metrics);
    if (concepts || modelTeaching || metrics) block.append(details);
    return block;
  }

  function renderAdvancedDiagnosticCode(item) {
    const taskId = item?.taskId || item?.id;
    if (playgroundMode === "practice" || taskId !== "diagnose" || !item.advancedCode) return null;
    const disclosure = document.createElement("details");
    disclosure.className = "advanced-diagnostic-code";
    disclosure.dataset.teachingRole = "advanced-diagnostic-construction";
    const summary = document.createElement("summary");
    summary.textContent = "Advanced: how this teaching evidence was constructed";
    const note = document.createElement("p");
    note.className = "advanced-diagnostic-note";
    note.textContent = "Optional diagnostic construction only. The primary cell above is the core learner workflow; this real Python keeps the richer evidence tied to the current fitted route.";
    const runEvidence = document.createElement("button");
    runEvidence.type = "button";
    runEvidence.className = "toolbar-button advanced-diagnostic-run";
    runEvidence.textContent = "Add optional evidence cell";
    runEvidence.addEventListener("click", async () => {
      const cell = addCell(item.advancedCode, `Optional evidence · ${item.title || "diagnosis"}`, null, true);
      cell.optionalEvidence = true;
      cell.routeReferenceCode = item.advancedCode;
      await runCell(cell, {preserveFocus:false});
    });
    const code = document.createElement("pre");
    code.className = "workflow-code advanced-diagnostic-python";
    code.innerHTML = highlightPython(item.advancedCode);
    code.setAttribute("aria-label", "Optional diagnostic construction Python");
    disclosure.append(summary, note, runEvidence, code);
    return disclosure;
  }

  function renderOptionalCode(item) {
    if (playgroundMode === "practice" || !item?.optionalCode) return null;
    const disclosure = document.createElement("details");
    disclosure.className = "optional-route-code";
    disclosure.dataset.teachingRole = "optional-route-evidence";
    const summary = document.createElement("summary");
    summary.textContent = item.taskId === "baseline" ? "Optional: compare a simple reference" : "Optional route evidence";
    const note = document.createElement("p");
    note.className = "advanced-diagnostic-note";
    note.textContent = "This is a separate, editable evidence cell. The route step above remains the primary result.";
    const add = document.createElement("button");
    add.type = "button";
    add.className = "toolbar-button optional-route-run";
    add.textContent = "Add optional evidence cell";
    add.addEventListener("click", async () => {
      const cell = addCell(item.optionalCode, `Optional evidence · ${item.title || "route"}`, null, true);
      cell.optionalEvidence = true;
      cell.routeReferenceCode = item.optionalCode;
      await runCell(cell, {preserveFocus:false});
    });
    const code = document.createElement("pre");
    code.className = "workflow-code optional-route-python";
    code.innerHTML = highlightPython(item.optionalCode);
    code.setAttribute("aria-label", "Optional route evidence Python");
    disclosure.append(summary, note, add, code);
    return disclosure;
  }

  function practiceOptionLabel(practice, value) {
    const option = practice?.options?.find(item => String(item.value) === String(value));
    return option?.label || String(value);
  }

  function practiceChoiceField(cell, practice, state, property, buttonLabel, onCommit) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "practice-options";
    const legend = document.createElement("legend");
    legend.className = "sr-only";
    legend.textContent = practice.prompt;
    fieldset.append(legend);
    const name = `practice-${cell.id}-${practice.id}-${property}`;
    practice.options.forEach(option => {
      const label = document.createElement("label");
      label.className = "practice-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = String(option.value);
      input.checked = String(state[property] ?? "") === String(option.value);
      const copy = document.createElement("span");
      copy.textContent = option.label;
      label.append(input, copy);
      fieldset.append(label);
    });
    const actions = document.createElement("div");
    actions.className = "practice-actions";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "practice-button";
    submit.textContent = buttonLabel;
    submit.disabled = !practice.options.some(option => String(option.value) === String(state[property] ?? ""));
    fieldset.addEventListener("change", event => {
      if (event.target?.matches("input[type=radio]")) submit.disabled = false;
    });
    submit.addEventListener("click", () => {
      const selected = fieldset.querySelector("input[type=radio]:checked")?.value;
      const normalized = normalizePracticeAnswer(selected, practice);
      if (normalized === null) return;
      onCommit(normalized);
    });
    actions.append(submit);
    return [fieldset, actions];
  }

  function practiceCommittedAnswer(practice, state, property, noun) {
    const answer = document.createElement("p");
    answer.className = "practice-answer";
    const strong = document.createElement("strong");
    strong.textContent = noun;
    answer.append(strong, document.createTextNode(` ${practiceOptionLabel(practice, state[property])}`));
    return answer;
  }

  function practicePanelHeading(text) {
    const heading = document.createElement("h4");
    heading.textContent = text;
    return heading;
  }

  function renderPracticeBeforeRun(cell) { return null; }

  function practiceTableNumber(table, columnName, rowIndex = 0) {
    if (!Array.isArray(table?.columns) || !Array.isArray(table?.rows)) return null;
    const column = table.columns.indexOf(columnName);
    if (column < 0) return null;
    return normalizeTeachingNumber(table.rows[rowIndex]?.[column]);
  }

  function practiceTableColumn(table, columnName) {
    if (!Array.isArray(table?.columns) || !Array.isArray(table?.rows)) return [];
    const column = table.columns.indexOf(columnName);
    if (column < 0) return [];
    return table.rows.map(row => row?.[column]);
  }

  function practiceClusterSizes() {
    const diagnostic = cells.find(cell => cell.taskId === "diagnose" && cell.output?.status === "ok" && cell.output.table);
    const fit = cells.find(cell => cell.taskId === "fit" && cell.output?.status === "ok" && cell.output.table);
    const candidates = [diagnostic?.output?.table, fit?.output?.table];
    for (const table of candidates) {
      const clusters = practiceTableColumn(table, "cluster");
      const rows = practiceTableColumn(table, "rows");
      if (!clusters.length || clusters.length !== rows.length) continue;
      const sizes = clusters.map((cluster, index) => {
        const count = normalizeTeachingNumber(rows[index]);
        return count === null ? null : {cluster:String(cluster), rows:count};
      }).filter(Boolean);
      if (sizes.length) return sizes;
    }
    return [];
  }

  function practiceEvidenceSnapshot(taskId) {
    const cell = cells.find(item => item.taskId === taskId && item.output?.status === "ok");
    if (!cell) return null;
    const config = selectedConfig();
    if (taskId === "baseline" && cell.output.table) {
      const summary = cvSummaryFromTable(cell.output.table, config.task, config.split, config.target);
      if (!summary) return null;
      return {
        kind:"cv",
        metricLabel:summaryMetricLabel(summary),
        validationMean:summary.validationMean,
        validationMin:summary.validationMin,
        validationMax:summary.validationMax,
        trainingMean:summary.trainingMean,
        gap:summary.gap,
        timeSeries:summary.timeSeries
      };
    }
    if (taskId === "tune") {
      const stdout = String(cell.output.stdout || "");
      const value = String(cell.output.value || "");
      const settings = stdout.split("\n").find(line => line.includes("Best settings:")) || value || "Model defaults";
      const score = stdout.split("\n").find(line => line.includes("Search CV ")) || "";
      return {kind:"tuning", settings:settings.trim().slice(0, 220), score:score.trim().slice(0, 120)};
    }
    if (taskId === "select" && selectedModelId() === "pca" && cell.output.table) {
      const target = practiceTableNumber(cell.output.table, "variance_target");
      const components = practiceTableNumber(cell.output.table, "components_for_target");
      const retained = practiceTableNumber(cell.output.table, "cumulative_variance_retained");
      if ([target, components, retained].some(value => value === null)) return null;
      return {kind:"pca", target, components, retained};
    }
    if (taskId === "profile" && ["kmeans", "hierarchical"].includes(selectedModelId())) {
      const fit = cells.find(item => item.taskId === "fit" && item.output?.status === "ok");
      const selectedK = practiceTableNumber(fit?.output?.table, "selected_k") || practiceClusterSizes().length;
      const sizes = practiceClusterSizes();
      const profileClusters = practiceTableColumn(cell.output.table, "cluster").map(value => String(value));
      return {
        kind:"clusters",
        selectedK,
        sizes,
        profileClusters:[...new Set(profileClusters)]
      };
    }
    return null;
  }

  function practiceSnapshotRows(snapshot) {
    if (!snapshot) return [];
    if (snapshot.kind === "cv") return [
      [snapshot.metricLabel, formatTeachingNumber(snapshot.validationMean)],
      ["Validation range", `${formatTeachingNumber(snapshot.validationMin)}–${formatTeachingNumber(snapshot.validationMax)}`],
      [`Training ${snapshot.metricLabel.replace(/\s+[↑↓]$/, "")}`, formatTeachingNumber(snapshot.trainingMean)],
      ["Train–validation gap", formatTeachingNumber(snapshot.gap)]
    ];
    if (snapshot.kind === "pca") return [
      ["Variance target", `${formatTeachingNumber(snapshot.target * 100)}%`],
      ["Components retained", formatTeachingNumber(snapshot.components)],
      ["Cumulative variance retained", `${formatTeachingNumber(snapshot.retained * 100)}%`]
    ];
    if (snapshot.kind === "clusters") return [
      ["Selected k", formatTeachingNumber(snapshot.selectedK)],
      ["Cluster sizes", snapshot.sizes.length ? snapshot.sizes.map(item => `${item.cluster}: ${formatTeachingNumber(item.rows)}`).join(" · ") : "See profile output"]
    ];
    if (snapshot.kind === "tuning") return [
      ["Selected setting", snapshot.settings || "See tuning output"],
      ...(snapshot.score ? [["Search CV evidence", snapshot.score]] : [])
    ];
    return [];
  }

  function practiceSnapshotCard(label, snapshot) {
    const card = document.createElement("div");
    card.className = "practice-evidence-snapshot";
    card.dataset.practiceEvidence = label.toLowerCase();
    const heading = document.createElement("h5");
    heading.textContent = label;
    card.append(heading);
    const rows = practiceSnapshotRows(snapshot);
    if (!rows.length) {
      const note = document.createElement("p");
      note.className = "practice-experiment-note";
      note.textContent = "No compact baseline snapshot was available; compare the current evidence with the original run after Reset.";
      card.append(note);
      return card;
    }
    const list = document.createElement("dl");
    rows.forEach(([key, value]) => {
      const term = document.createElement("dt"); term.textContent = key;
      const description = document.createElement("dd"); description.textContent = value;
      list.append(term, description);
    });
    card.append(list);
    return card;
  }

  function renderPracticeExperimentComparison(state) { return null; }

  function markPracticeExperimentEvidenceReady(cell) {
    if (cell?.output?.status !== "ok" || !cell.taskId) return;
    routeTasks.forEach(sourceTask => {
      const experiment = sourceTask.practice?.experiment;
      if (!experiment || experiment.evidenceTaskId !== cell.taskId) return;
      const state = practiceStateFor(sourceTask.id);
      if (!state.experimentApplied || state.experimentEvidenceReady) return;
      state.experimentAfter = practiceEvidenceSnapshot(experiment.evidenceTaskId);
      state.experimentEvidenceReady = true;
    });
  }

  function practiceEvidenceText(task, cell) {
    const config = selectedConfig();
    const practice = task?.practice?.beforeRun;
    if (!practice) return "Compare the generated evidence with the idea in the question.";
    if (practice.evidence === "chronology") return "The route keeps later validation windows after the rows used to fit each fold; the order is part of the evidence for this time-based task.";
    if (practice.evidence === "split") return "The split uses stratification to keep class proportions roughly similar; it protects the comparison without making the proportions identical.";
    if (practice.evidence === "scaling") return "The preparation places the selected numeric inputs on comparable scales before this model uses distances, boundaries, or optimization.";
    if (practice.evidence === "model") return task.id === "model" && selectedModelId() === "knn_cls"
      ? "With a larger k, each individual neighbour contributes a smaller share of the vote."
      : task.id === "model" && ["classification_tree", "regression_tree"].includes(selectedModelId())
        ? "A larger maximum depth gives the tree more opportunity to make detailed training splits."
        : selectedModelId() === "logistic"
          ? "The fitted logistic model uses a linear boundary in prepared feature space."
          : "Read the fitted model output to connect the model's structure with its evidence.";
    if (practice.evidence === "loss") return "The loss curve is optimization evidence: falling loss means the training objective is being fitted better, not that new-data performance has been proved.";
    if (practice.evidence === "cv") {
      const summary = cvSummaryFromTable(cell.output?.table, config.task, config.split, config.target);
      return summary
        ? `${summaryMetricLabel(summary)} values across the folds have a ${formatTeachingNumber(summary.validationMin)}–${formatTeachingNumber(summary.validationMax)} validation range. Compare that spread rather than expecting identical folds.`
        : "The fold table is the evidence to use when judging whether validation results are similar or variable.";
    }
    if (practice.evidence === "diagnostic") return "This diagnostic describes mistakes or residual patterns in the training-only evidence; cross-validation and the final test remain the generalization evidence.";
    if (practice.evidence === "final") {
      const summary = currentCVSummary(), comparison = summary ? finalComparisonFromTable(summary, cell.output?.table) : null;
      return comparison?.interpretation || "Compare the final-test value with the earlier CV range; this is an informal comparison, not a formal prediction interval.";
    }
    if (practice.evidence === "pca-variance") {
      const first = practiceTableNumber(cell.output?.table, "cumulative_explained_variance", 1);
      return first === null
        ? "Compare the cumulative-variance column to see how much the first components retain together."
        : `The first two components retain about ${formatTeachingNumber(first * 100)}% cumulatively in this run; compare that with your prediction.`;
    }
    if (practice.evidence === "pca-loading") return "Compare absolute loading sizes to judge contribution strength; the sign indicates direction and is not a good/bad score.";
    if (practice.evidence === "pca-projection") return "The chart shows only PC1 and PC2, while the selected reduced representation may keep more components for the chosen variance criterion.";
    return "Compare the generated evidence with the idea in the question.";
  }

  function renderPracticePredictionFeedback(cell) { return null; }

  function renderPracticeDecision(cell) { return null; }

  function applyPracticeExperiment(cell, experiment) {
    const task = routeTaskForCell(cell), targetTaskId = experiment?.targetTaskId || task?.id;
    const targetCell = cells.find(item => item.taskId === targetTaskId);
    if (!task || !targetCell) return;
    const currentState = practiceStateFor(task.id);
    currentState.experimentAttempted = true;
    const baseline = practiceEvidenceSnapshot(experiment.evidenceTaskId || targetTaskId);
    const mutation = applyPracticeMutation(targetCell.code, experiment);
    if (!mutation.changed) {
      renderNotebookView();
      renderBatchControls();
      showToast(mutation.reason, true);
      return;
    }
    targetCell.code = mutation.code;
    invalidateRouteFrom(targetTaskId, {
      renderNotebook:true,
      message:"Safe experiment applied; rerun this step and the downstream evidence.",
      preservePracticeTaskIds:[task.id]
    });
    const resetState = practiceStateFor(task.id);
    resetState.experimentAttempted = true;
    resetState.experimentApplied = true;
    resetState.experimentBaseline = baseline;
    resetState.experimentAfter = null;
    resetState.experimentEvidenceReady = false;
    resetState.reflection = false;
    renderNotebookView();
    renderBatchControls();
  }

  function renderPracticeExperiment(cell) { return null; }

  function renderPracticeResult(cell) { return []; }

  function renderCleanWorkflowReferenceCard() {
    if (playgroundMode === "practice" || !routeTasks.length) return null;
    if (!routeTasks.every(task => cells.find(cell => cell.taskId === task.id)?.status === "done")) return null;
    const reference = selectedModel()?.task === "unsupervised"
      ? cleanWorkflowReference(selectedConfig(), selectedScenario(), selectedModelId(), Number($("#foldSelect").value))
      : cleanSupervisedWorkflowReference(selectedConfig(), selectedScenario(), selectedModelId(), Number($("#foldSelect").value), true);
    if (!reference) return null;
    const section = document.createElement("section");
    section.className = "clean-workflow-reference";
    section.dataset.teachingResult = "clean-workflow-reference";
    section.setAttribute("aria-label", "Clean workflow reference");
    const heading = document.createElement("h3");
    heading.textContent = "CLEAN WORKFLOW TO REMEMBER";
    const copy = document.createElement("p");
    copy.textContent = "This compact reference keeps the core Python worth carrying into your next analysis. The detailed editable route remains above.";
    const code = document.createElement("pre");
    code.className = "workflow-code";
    code.textContent = reference;
    code.setAttribute("aria-label", "Copyable clean workflow reference Python");
    section.append(heading, copy, code);
    return section;
  }

  function pendingPracticeDecisionBefore(taskId) {
    const index = routeTasks.findIndex(item => item.id === taskId);
    if (index < 0) return null;
    for (const task of routeTasks.slice(0, index)) {
      if (!task.practice?.decision) continue;
      const cell = cells.find(item => item.taskId === task.id);
      if (cell?.output?.status !== "ok") continue;
      if (practiceStateFor(task.id).decision === null) return task;
    }
    return null;
  }

  function pendingPracticeExerciseBefore(taskId) {
    const index = routeTasks.findIndex(item => item.id === taskId);
    if (index < 0) return null;
    for (const task of routeTasks.slice(0, index)) {
      const exercise = task.practice?.exercise;
      if (!exercise) continue;
      const cell = cells.find(item => item.taskId === task.id);
      if (cell?.status !== "done") continue;
      if (!practiceStateFor(task.id).exerciseComplete) return task;
    }
    return null;
  }

  function focusPracticePrompt(taskId, role) {
    const panel = $$("[data-practice-task]", document).find(item => item.dataset.practiceTask === taskId && (!role || item.dataset.practiceRole === role));
    if (!panel) return;
    panel.scrollIntoView({block:"center", behavior:"smooth"});
    panel.querySelector("input,button")?.focus();
  }

  function ensurePracticeCanRun(cell) { return true; }

  function summaryMetricLabel(summary, includeDirection = true) {
    const target = summary.task === "regression" && summary.target ? ` (${summary.target})` : "";
    return `${summary.metric.label}${target}${includeDirection ? ` ${summary.metric.directionSymbol}` : ""}`;
  }

  function currentCVSummary() {
    const baseline = cells.find(cell => cell.stage === "baseline" && cell.output?.status === "ok" && cell.output.table);
    const config = selectedConfig();
    return baseline ? cvSummaryFromTable(baseline.output.table, config.task, config.split, config.target) : null;
  }

  function renderCVSummaryTeaching(cell) {
    const task = routeTaskForCell(cell), config = selectedConfig();
    if (!task || !cell.output?.table || config.task === "unsupervised") return null;
    const summary = cvSummaryFromTable(cell.output.table, config.task, config.split, config.target);
    if (!summary) return null;
    const section = document.createElement("section");
    section.className = "teaching-result cv-summary";
    section.dataset.teachingResult = "cv-summary";
    section.dataset.summaryTask = summary.task;
    section.dataset.summaryTimeSeries = String(summary.timeSeries);
    section.dataset.primaryMetric = summary.metric.key;
    const heading = document.createElement("h4");
    heading.textContent = "What this suggests from cross-validation";
    section.append(heading);
    const stats = document.createElement("div");
    stats.className = "teaching-stats";
    const statValues = [
      ["validation-mean", `Typical validation ${summaryMetricLabel(summary)}`, formatTeachingNumber(summary.validationMean)],
      ["validation-range", "Fold range", `${formatTeachingNumber(summary.validationMin)}–${formatTeachingNumber(summary.validationMax)}`],
      ["training-mean", `Typical training ${summaryMetricLabel(summary, false)}`, formatTeachingNumber(summary.trainingMean)],
      ["train-validation-gap", "Typical train–validation gap", formatTeachingNumber(summary.gap)]
    ];
    statValues.forEach(([key, label, value]) => {
      const stat = document.createElement("div");
      stat.className = "teaching-stat";
      stat.dataset.summaryKey = key;
      const statLabel = document.createElement("span"); statLabel.textContent = label;
      const statValue = document.createElement("strong"); statValue.textContent = value;
      stat.append(statLabel, statValue); stats.append(stat);
    });
    section.append(stats);
    const stability = document.createElement("p");
    stability.className = "teaching-interpretation";
    stability.dataset.teachingRole = "validation-stability";
    stability.textContent = cvStabilityText(summary);
    const gap = document.createElement("p");
    gap.className = "teaching-interpretation";
    gap.dataset.teachingRole = "train-validation-gap";
    gap.textContent = cvGapText(summary);
    section.append(stability, gap);
    const referenceKey=config.task==='classification' ? 'reference_macro_f1' : 'reference_rmse';
    const referenceIndex=cell.output.table.columns.indexOf(referenceKey);
    if (referenceIndex>=0) {
      const values=cell.output.table.rows.map(row=>Number(row[referenceIndex])).filter(Number.isFinite);
      const mean=values.reduce((sum,value)=>sum+value,0)/values.length;
      const comparison=document.createElement('p'); comparison.className='teaching-interpretation';
      comparison.textContent=`Reference predictor on the same folds: ${formatTeachingNumber(mean)} ${summaryMetricLabel(summary)}. Initial model: ${formatTeachingNumber(summary.validationMean)}. Difference (initial − reference): ${formatTeachingNumber(summary.validationMean-mean)}; ${summary.metric.direction==='lower' ? 'lower' : 'higher'} is better. This descriptive difference is not a significance test.`;
      section.append(comparison);
    }
    return section;
  }

  function renderReferenceTeaching(cell) {
    const task = routeTaskForCell(cell), config = selectedConfig();
    if (!task || task.id !== "reference" || !cell.output?.table) return null;
    const table = cell.output.table;
    const valueIndex = table.columns.indexOf("value");
    const labelIndex = table.columns.indexOf("index");
    if (valueIndex < 0 || labelIndex < 0) return null;
    const values = table.rows
      .map(row => ({label:String(row[labelIndex]), value:normalizeTeachingNumber(row[valueIndex])}))
      .filter(row => row.value !== null);
    if (!values.length) return null;
    const section = document.createElement("section");
    section.className = "teaching-result reference-comparison";
    section.dataset.teachingResult = "reference-comparison";
    const heading = document.createElement("h4");
    heading.textContent = "What the reference comparison says";
    section.append(heading);
    const copy = document.createElement("p");
    const direction = config.task === "classification" ? "Higher is better." : "Lower is better.";
    copy.textContent = `${values.map(row => `${row.label}: ${formatTeachingNumber(row.value)}`).join(" · ")} ${direction} Both values use the same training folds.`;
    section.append(copy);
    return section;
  }

  function renderFinalComparisonTeaching(cell) {
    const task = routeTaskForCell(cell), summary = currentCVSummary();
    if (!task || !summary || !cell.output?.table) return null;
    const comparison = finalComparisonFromTable(summary, cell.output.table);
    if (!comparison) return null;
    const section = document.createElement("section");
    section.className = "teaching-result final-comparison";
    section.dataset.teachingResult = "final-comparison";
    section.dataset.finalMetric = comparison.metric.key;
    section.dataset.finalInsideRange = String(comparison.insideRange);
    section.dataset.finalCvMean = String(comparison.meanCV);
    section.dataset.finalCvMin = String(comparison.cvMin);
    section.dataset.finalCvMax = String(comparison.cvMax);
    section.dataset.finalTest = String(comparison.finalTest);
    const heading = document.createElement("h4");
    heading.textContent = "Compare the final test with cross-validation";
    section.append(heading);
    const table = document.createElement("table");
    table.className = "teaching-comparison";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Evidence", summaryMetricLabel(summary)].forEach(label => { const cell = document.createElement("th"); cell.textContent = label; headRow.append(cell); });
    head.append(headRow);
    const body = document.createElement("tbody");
    const tuningOutput = cells.find(candidate => candidate.taskId === "tune")?.output;
    const selectedScore = tuningOutput?.stdout?.match(/Search CV [^:]+:\s*([-+\d.eE]+)/)?.[1];
    [["Initial-model mean CV", formatTeachingNumber(comparison.meanCV)], ["Initial-model fold range", `${formatTeachingNumber(comparison.cvMin)}–${formatTeachingNumber(comparison.cvMax)}`], ["Selected configuration search CV (selection-influenced)", selectedScore || "No search; initial settings retained"], ["Selected-model final test", formatTeachingNumber(comparison.finalTest)]].forEach(([label, value]) => {
      const row = document.createElement("tr");
      const labelCell = document.createElement("th"); labelCell.scope = "row"; labelCell.textContent = label;
      const valueCell = document.createElement("td"); valueCell.textContent = value;
      row.append(labelCell, valueCell); body.append(row);
    });
    table.append(head, body); section.append(table);
    const interpretation = document.createElement("p");
    interpretation.className = "teaching-interpretation";
    interpretation.dataset.teachingRole = "final-interpretation";
    interpretation.textContent = "The initial-model fold range is descriptive, not a confidence interval for the selected model. Search CV is influenced by selecting the best candidate. " + comparison.interpretation;
    const independence = document.createElement("p");
    independence.className = "teaching-independence";
    independence.textContent = "The final test used data that was not used for fitting, tuning, or model selection.";
    section.append(interpretation, independence);
    return section;
  }

  function renderTimeSeriesTeaching(cell) {
    const config = selectedConfig();
    if (config.split !== "time" || routeTaskForCell(cell)?.id !== "baseline") return null;
    const section = document.createElement("section");
    section.className = "teaching-result time-series-timeline";
    section.dataset.teachingResult = "time-series-timeline";
    const heading = document.createElement("h4");
    heading.textContent = "Why the order matters";
    const copy = document.createElement("p");
    copy.className = "teaching-interpretation";
    copy.textContent = "For this chronological route, earlier rows provide the training history, later windows provide forward validation, and the latest saved rows remain the final test.";
    const timeline = document.createElement("div");
    timeline.className = "time-series-timeline-bar";
    [
      ["Earlier rows", "training history", "earlier"],
      ["Later windows", "forward CV validation", "validation"],
      ["Latest rows", "final test · used once", "final"]
    ].forEach(([title, detail, kind]) => {
      const segment = document.createElement("div");
      segment.className = `time-series-segment ${kind}`;
      segment.innerHTML = "<strong></strong><span></span>";
      $("strong", segment).textContent = title;
      $("span", segment).textContent = detail;
      timeline.append(segment);
    });
    section.append(heading, copy, timeline);
    return section;
  }

  function renderTeachingResult(cell) {
    if (cell.stage === "baseline") return renderCVSummaryTeaching(cell);
    if (cell.stage === "reference") return renderReferenceTeaching(cell);
    if (cell.stage === "final") return renderFinalComparisonTeaching(cell);
    return null;
  }

  function practiceReferenceBlock(label, code, className = "practice-reference") {
    const block = document.createElement("section");
    block.className = className;
    const heading = document.createElement("h5");
    heading.textContent = label;
    const pre = document.createElement("pre");
    pre.className = "workflow-code";
    pre.textContent = code;
    block.append(heading, pre);
    return block;
  }

  function renderPracticeExercise(cell) { return null; }

  function renderIndependentCheckpointCell(cell) { return null; }

  function renderEditableCodeEditor(cell) {
    const editor = document.createElement("div"); editor.className = "code-editor";
    const rail = document.createElement("div"); rail.className = "line-rail";
    const highlight = document.createElement("pre"); highlight.className = "code-highlight"; highlight.setAttribute("aria-hidden", "true");
    const input = document.createElement("textarea"); input.className = "code-input"; input.spellcheck = false; input.value = cell.code;
    input.setAttribute("aria-label", `Editable Python code for ${cell.checkpoint ? "Independent Checkpoint" : cell.label}`);
    const syncHighlight = () => {
      try {
        highlight.innerHTML = highlightPython(cell.code);
        // Keep the native textarea text visible while editing. This prevents
        // two text layers from competing for caret and character positioning;
        // highlighting returns on blur without changing stored code.
        const editing = document.activeElement === input;
        editor.classList.toggle("has-highlight", !editing && Boolean(cell.code && highlight.textContent));
      }
      catch { highlight.replaceChildren(); editor.classList.remove("has-highlight"); }
      highlight.style.height = input.style.height;
      highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
      rail.style.transform = `translateY(${-input.scrollTop}px)`;
    };
    input.addEventListener("focus", () => {
      editor.classList.remove("has-highlight");
    });
    input.addEventListener("blur", syncHighlight);
    const updateLines = () => {
      rail.textContent = input.value.split("\n").map((_, index) => index + 1).join("\n");
      input.style.height = "auto"; input.style.height = `${Math.min(430, Math.max(76, input.scrollHeight))}px`; rail.style.height = input.style.height; syncHighlight();
    };
    input.addEventListener("input", () => {
      const changedAfterRun = cell.lastRunCode !== null && cell.lastRunCode !== input.value;
      cell.code = input.value;
      if (cell.checkpoint && changedAfterRun) {
        const state = independentCheckpointStateFor(); state.complete = false; state.feedback = null; cell.output = null; cell.status = "ready"; cell.lastRunCode = null;
      } else if (changedAfterRun && cell.taskId) {
        const refreshPractice = playgroundMode === "practice" && cell.status !== "stale";
        invalidateRouteFrom(cell.taskId);
        if (refreshPractice) {
          clearTimeout(cell.practiceRefreshTimer);
          cell.practiceRefreshTimer = setTimeout(() => renderNotebookView(), 0);
        }
      } else if (changedAfterRun && cell.optionalEvidence && routeTasks.length) {
        // Edited optional evidence can mutate shared Python names just like a
        // custom cell, so invalidate the suggested route before it is run.
        invalidateRouteFrom(routeTasks[0].id, {message:"Optional evidence changed — rerun the suggested route before relying on its results."});
      }
      if (changedAfterRun && !cell.taskId && cell.output) { cell.status = "stale"; renderOutputs(); syncNotebookStatusLabels(); }
      updateLines();
    });
    input.addEventListener("scroll", syncHighlight);
    input.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); runCell(cell); } });
    editor.append(rail, highlight, input);
    updateLines();
    // The editor is created before its cell is mounted. Re-measure once it is
    // connected so scrollHeight reflects the responsive font and line height.
    requestAnimationFrame(() => {
      if (editor.isConnected) updateLines();
    });
    return editor;
  }

  function renderNotebook() {
    ensureIndependentCheckpointCell();
    const panel = $("#notebookPanel"); panel.replaceChildren();
    if (!cells.length) {
      const empty = document.createElement("div"); empty.className = "empty-notebook";
      empty.innerHTML = "<div><strong>CLICK STEP 01 TO BEGIN</strong><p>Each route block inserts an editable Python cell and immediately runs it. Follow the single route in step order, then delete cells and take over.</p></div>";
      panel.append(empty); return;
    }
    cells.forEach(cell => {
      if (cell.checkpoint && playgroundMode !== "practice") return;
      const stack = document.createElement("div");
      stack.className = "cell-stack";
      stack.dataset.cellId = cell.id;
        stack.cellModel = cell;
      const article = document.createElement("article"); article.className = "cell"; article.dataset.status = cell.status;
      article.dataset.cellId = cell.id;
      const head = document.createElement("div"); head.className = "cell-head";
      head.innerHTML = `<span class="cell-number">In [${cell.number}]</span><span class="cell-label"></span><span class="cell-stage"></span><span class="cell-spacer"></span>`;
      $(".cell-label", head).textContent = cell.label; $(".cell-stage", head).textContent = cell.stage;
      const finalLocked = cell.stage === "final" && testSetOpened;
      const run = document.createElement("button"); run.type = "button"; run.className = "cell-action run"; run.textContent = cell.status === "running" ? "running…" : finalLocked ? "used once" : "▶ run"; run.disabled = cell.status === "running" || finalLocked || (routeTasks.some(task=>task.id===cell.taskId) && routeButtonState(routeTasks,cells,routeTasks.findIndex(task=>task.id===cell.taskId),{runtimeReady,testSetOpened}).blocked); run.addEventListener("click", () => runCell(cell));
      if (!cell.checkpoint) { const remove = document.createElement("button"); remove.type = "button"; remove.className = "cell-action delete"; remove.textContent = "delete"; remove.addEventListener("click", () => removeCell(cell)); head.append(run, remove); }
      else head.append(run);
      const editor = renderEditableCodeEditor(cell);
      const foot = document.createElement("div"); foot.className = "cell-footer"; foot.innerHTML = `<span>editable Python · ⌘/Ctrl + Enter</span><span>${cell.status}</span>`;
      const inlineOutput = document.createElement("div");
      inlineOutput.className = "cell-inline-output";
      inlineOutput.dataset.outputFor = cell.id;
      const teaching = cell.checkpoint ? renderIndependentCheckpointCell(cell) : renderTeachingBlock(cell);
      const advanced = cell.checkpoint ? null : renderAdvancedDiagnosticCode(cell);
      const optional = cell.checkpoint ? null : renderOptionalCode(cell);
      const practicePanels = cell.checkpoint
        ? []
        : [renderPracticeBeforeRun(cell), renderPracticeExercise(cell), renderPracticeExperiment(cell)].filter(Boolean);
      article.append(head);
      if (teaching) article.append(teaching);
      if (practicePanels.length) article.append(...practicePanels);
      article.append(editor, foot);
      if (cell.taskId==='tune' && cell.code.includes('chosen_pipeline = search.best_estimator_')) {
        const retain=document.createElement('button');retain.type='button';retain.className='toolbar-button';retain.textContent='Retain initial settings instead';
        retain.addEventListener('click',()=> {cell.code=cell.code.replace('chosen_pipeline = search.best_estimator_','chosen_pipeline = pipeline').replace('Search CV ', 'Search candidate CV ');invalidateRouteFrom(cell.taskId,{renderNotebook:true,message:'Initial settings selected; rerun tuning and later steps. Search evidence still describes the search candidate.'});});article.append(retain);
      }
      if (advanced) article.append(advanced);
      if (optional) article.append(optional);
      stack.append(article, inlineOutput);
      panel.append(stack);
    });
  }

  async function runCell(cell, {preserveFocus = true} = {}) {
    if (!runtimeReady) { showToast("The Python workspace is still loading.", true); return; }
    const routeIndex = routeTasks.findIndex(item => item.id === cell.taskId);
    if (routeIndex >= 0) {
      const policy = routeButtonState(routeTasks, cells, routeIndex, {runtimeReady, testSetOpened});
      if (policy.blocked) { showToast(policy.message, true); return; }
    }
    if (bridge.busy) { showToast("Wait for the current cell or select Stop / restart Python."); return; }
    if (!cell.taskId && !cell.checkpoint && !isTrustedOptionalCell(cell) && routeTasks.length) invalidateRouteFrom(routeTasks[0].id, {message:"Exploratory Python can change shared state. Rerun the route to obtain current evidence."});
    if (cell.stage === "final" && testSetOpened) { showToast("The final test has already been used in this walkthrough. Select Reset to start again.", true); return; }
    if (!ensurePracticeCanRun(cell)) return;
    if (!cell.code.trim() || cell.status === "running") return;
    const focusTarget = preserveFocus ? captureFocusTarget() : null;
    if (routeIndex >= 0 && routeIndex + 1 < routeTasks.length && cells.some(other => routeTasks.findIndex(item => item.id === other.taskId) > routeIndex && other.output)) invalidateCellsFrom(routeTasks, cells, routeTasks[routeIndex + 1].id);
    const token = workspaceToken;
    const executedCode = cell.code;
    const executedAt = new Date().toISOString();
    cell.startedAt=Date.now();
    if (cell.stage === "final") testSetOpened = true;
    cell.status = "running"; renderNotebookView(focusTarget); renderRoute(); restoreFocusTarget(focusTarget);
    $("#outputStatus").textContent = `${cell.label} · running`;
    try {
      const rawValidation = cell.exercise?.validation || cell.checkpointMeta?.validation || null;
      const validation = rawValidation && ["kmeans", "hierarchical", "pca_selection", "checkpoint_kmeans", "checkpoint_hierarchical", "checkpoint_pca"].includes(rawValidation.kind)
        ? {...rawValidation, target:selectedConfig().target}
        : rawValidation;
      const response = await sendWorker("run", {
        code:executedCode,
        validation
      });
      if (token !== workspaceToken) return;
      cell.output = {...response.output, executedCode, executedAt, workspaceRevision: token, executionId: messageId}; cell.status = cell.code !== executedCode ? "stale" : response.output.status === "ok" ? "done" : "error"; cell.lastRunCode = executedCode;
      if (cell.exercise) {
        const state = practiceStateFor(cell.taskId);
        state.exerciseAttempts += 1;
        state.exerciseComplete = Boolean(cell.output.status === "ok" && cell.output.validation?.ok);
        state.exerciseFeedback = cell.output.validation?.message || (cell.output.status === "ok" ? "The semantic check did not pass yet." : "Python error.");
      }
      if (cell.checkpoint) {
        const state = independentCheckpointStateFor();
        state.attempts += 1;
        state.complete = Boolean(cell.output.status === "ok" && cell.output.validation?.ok);
        state.feedback = cell.output.validation?.message || (cell.output.status === "ok" ? "The semantic checklist did not pass yet." : "Python error.");
      }
      if (cell.status === "done") markPracticeExperimentEvidenceReady(cell);
      if (cell.stage === "final" && response.output.status === "ok") testSetOpened = true;
      if (response.output.charts?.length) latestChart = response.output.charts.at(-1);
      $("#outputStatus").textContent = `${cell.label} · ${cell.status === "done" ? "ready" : "Python error"}`;
    } catch (error) {
      if (token !== workspaceToken) return;
      cell.status = "error"; cell.output = {status:"error", error:error.message, charts:[], executedCode, executedAt, workspaceRevision:token, executionId:messageId}; cell.lastRunCode = executedCode;
      $("#outputStatus").textContent = `${cell.label} · Python error`;
      showToast(error.message, true);
    }
    renderNotebookView(focusTarget); renderRoute(); updateSeal(); restoreFocusTarget(focusTarget);
  }

  async function runAll() {
    if (!runtimeReady) { showToast("Wait for the Python workspace to finish loading.", true); return; }
    if (playgroundMode === "practice") { showToast("Run Complete is unavailable in Practice mode. Work through the route one step at a time."); return; }
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

  function pythonErrorDetails(errorText) {
    const source = String(errorText || "Unknown Python error");
    const match = source.match(/(?:^|\n)([A-Za-z_][\w.]*(?:Error|Exception)):\s*(.*?)(?:\n|$)/);
    const type = match?.[1] || (source.includes("SyntaxError") ? "SyntaxError" : "Python error");
    const message = (match?.[2] || source.split("\n").filter(Boolean).at(-1) || "Unknown Python error").trim();
    const guidance = {
      SyntaxError: "Check punctuation, indentation, brackets, and whether a statement is complete before running the cell again.",
      NameError: "Check the spelling of the name and rerun the earlier cell that should create it.",
      KeyError: "Check that the column or dictionary key exists and matches its spelling exactly.",
      TypeError: "Check that the operation is receiving the kind of value it expects, such as text, numbers, or a table.",
      ValueError: "Check the value's shape, category, or allowed range and compare it with the earlier route outputs."
    };
    const category = guidance[type] ? type : "Python error";
    return {category, message, guidance:guidance[type] || "Read the final traceback line, then repair the smallest relevant part of the cell."};
  }

  function warningDetails(warnings) {
    const grouped = new Map();
    warnings.forEach(warning => {
      const category = String(warning?.category || "Warning");
      const message = String(warning?.message || warning || "");
      const key = `${category}\n${message}`;
      const item = grouped.get(key) || {category, message, count:0};
      item.count += 1;
      grouped.set(key, item);
    });
    return [...grouped.values()];
  }

  function warningExplanation(warning) {
    const category = String(warning?.category || "Warning");
    const message = String(warning?.message || "");
    if (/OneHotEncoder|unknown category/i.test(`${category} ${message}`)) {
      return "The encoder encountered a category that was not present when it was fitted; the route's unknown-category setting keeps prediction from failing.";
    }
    if (/ConvergenceWarning/i.test(category)) {
      return "The optimizer stopped before meeting its convergence target. The cell succeeded, but treat the fitted result with caution and compare the validation evidence.";
    }
    return "A warning is a caution from Python; the cell still completed successfully. Read it alongside the output before deciding whether a change is needed.";
  }

  function chartDescriptionFor(cell, index) {
    const task = routeTaskForCell(cell), model = selectedModel(), config = selectedConfig();
    const modelName = model?.name || "the selected model";
    if (modelIdForChart(cell) === "pca" && cell.taskId === "project") return "Two-dimensional PCA projection showing row scores on PC1 and PC2; the axis labels report the variance represented by each plotted component.";
    if (cell.taskId === "baseline") return `Cross-validation evidence for ${modelName}; chart ${index + 1} shows training and validation results across the training-only folds.`;
    if (cell.taskId === "final") return `Final-test evidence for ${modelName}; chart ${index + 1} shows the one held-out result after fitting and model selection.`;
    if (cell.taskId === "diagnose") return config.task === "classification"
      ? `Training-only classification diagnostic for ${modelName}; chart ${index + 1} compares actual and predicted ${friendlyColumnName(config.target)} classes.`
      : `Training-only regression diagnostic for ${modelName}; chart ${index + 1} shows prediction errors and whether residuals form a pattern around zero.`;
    if (model?.task === "unsupervised") {
      if (cell.taskId === "compare") return `Candidate cluster-count evidence for ${modelName}; chart ${index + 1} compares silhouette or compactness as the candidate count changes.`;
      if (cell.taskId === "visualise") return `Two-dimensional PCA projection of the discovered ${modelName.toLowerCase()} structure; point labels identify groups, while the fit used the prepared dimensions.`;
      if (cell.taskId === "dendrogram") return "Ward-linkage dendrogram for the reproducible sample; branch joins show merges and vertical height shows merge dissimilarity.";
      if (modelIdForChart(cell) === "pca") return "PCA explained-variance evidence; compare variance represented by each component and the cumulative variance retained.";
    }
    if (modelIdForChart(cell) === "pca") return cell.taskId === "project"
      ? "Two-dimensional PCA projection showing row scores on PC1 and PC2; the axis labels report the variance represented by each plotted component."
      : "PCA explained-variance evidence; compare the variance represented by each component and the cumulative variance retained.";
    if (cell.taskId === "explore") return `Training-data exploration for ${modelName}; chart ${index + 1} shows selected feature values and their relationship with the target where applicable.`;
    return `${modelName} evidence from the ${task?.title || "current"} step; use the chart title and axes to interpret the result.`;
  }

  function modelIdForChart(cell) {
    return selectedModelId();
  }

  function renderOutputItem(cell) {
    const result = cell.output, warnings = Array.isArray(result.warnings) ? result.warnings : [], item = document.createElement("article"); item.className = "output-item"; item.dataset.status = result.status; item.dataset.warnings = warnings.length ? "true" : "false";
    const statusLabel = cell.status === "stale" ? "PREVIOUS RESULT" : result.status === "ok" ? warnings.length ? "WARNING" : "OK" : "ERROR";
    item.innerHTML = `<span class="output-number">${String(cell.number).padStart(2,"0")}</span><div class="output-item-head"><strong></strong><span>${statusLabel}</span></div>`;
    $("strong", item).textContent = cell.label;

    if (cell.status === "stale") { const note = document.createElement("p"); note.className = "result-note"; note.textContent = "Previous result — code or workspace changed; rerun to update."; item.append(note); }
    if (["diagnose", "interpret"].includes(cell.taskId) || cell.stage === "diagnostics") { const note = document.createElement("p"); note.className = "result-note"; note.textContent = "Exploratory training diagnostics after tuning. Model selection has already used these folds; this is not independent performance evidence."; item.append(note); }
    if (result.status !== "ok") {
      const details = pythonErrorDetails(result.error || result.stderr);
      item.dataset.errorCategory = details.category;
      item.append(outputTitle("PYTHON NEEDS A REPAIR", details.category));
      const summary = document.createElement("p"); summary.className = "result-note error-summary";
      summary.innerHTML = "<strong></strong> <span></span>";
      $("strong", summary).textContent = `${details.category}:`;
      $("span", summary).textContent = details.message;
      item.append(summary);
      const action = document.createElement("p"); action.className = "result-note error-action"; action.textContent = `Next step: ${details.guidance}`; item.append(action);
      const disclosure = document.createElement("details"); disclosure.className = "technical-details";
      const summaryNode = document.createElement("summary"); summaryNode.textContent = "Show technical traceback";
      const pre = document.createElement("pre"); pre.className = "console-output error"; pre.textContent = result.error || result.stderr || "Unknown Python error";
      disclosure.append(summaryNode, pre); item.append(disclosure); return item;
    }
    if (result.table) { item.append(outputTitle("Table result", `${result.table.rowCount} rows · ${result.table.columnCount} cols`)); const table = document.createElement("div"); tablePayload(table, result.table); item.append(table); }
    result.charts?.forEach((chart, index) => {
      item.append(outputTitle(`Chart ${index + 1}`, "PNG preview"));
      const description = chartDescriptionFor(cell, index);
      const wrap = document.createElement("figure"); wrap.className = "chart-wrap"; wrap.tabIndex = 0; wrap.setAttribute("aria-label", description);
      const image = document.createElement("img"); image.src = chart; window.sizeChartImage?.(image,chart); image.alt = description; image.loading='lazy'; wrap.append(image);
      const larger=document.createElement('a'); larger.href=chart; larger.target='_blank'; larger.textContent='Open larger';
      const download=document.createElement('a'); download.href=chart; download.download=`figure-${cell.number}-${index+1}.png`; download.textContent='Download this figure (last executed code)'; wrap.append(larger,download);
      const caption = document.createElement("figcaption"); caption.className = "chart-description"; caption.textContent = description; wrap.append(caption); item.append(wrap);
    });
    const routeTask = routeTaskForCell(cell);
    if (routeTask?.readingCue) item.append(teachingLine("READ", routeTask.readingCue, "teaching-line teaching-cue", "reading-cue"));
    const teachingResult = renderTeachingResult(cell);
    if (teachingResult) item.append(teachingResult);
    const timeSeriesTeaching = renderTimeSeriesTeaching(cell);
    if (timeSeriesTeaching) item.append(timeSeriesTeaching);
    const practiceResults = renderPracticeResult(cell);
    if (practiceResults?.length) item.append(...practiceResults);
    if (warnings.length) {
      const grouped = warningDetails(warnings);
      item.append(outputTitle("PYTHON WARNING · CELL SUCCEEDED", `${warnings.length} captured · ${grouped.length} unique`));
      const summary = document.createElement("p"); summary.className = "result-note warning-summary"; summary.textContent = grouped.map(warning => `${warning.category}: ${warning.message}${warning.count > 1 ? ` (${warning.count}×)` : ""}`).join(" · "); item.append(summary);
      const explanations = document.createElement("div"); explanations.className = "warning-explanations";
      grouped.forEach(warning => {
        const line = document.createElement("p"); line.className = "result-note"; line.textContent = warningExplanation(warning); explanations.append(line);
      });
      item.append(explanations);
      const disclosure = document.createElement("details"); disclosure.className = "technical-details";
      const summaryNode = document.createElement("summary"); summaryNode.textContent = "Show technical warning details";
      const pre = document.createElement("pre"); pre.className = "console-output warning"; pre.textContent = warnings.map(warning => `${warning.category || "Warning"}: ${warning.message || warning}`).join("\n");
      disclosure.append(summaryNode, pre); item.append(disclosure);
    }
    if (result.value) { item.append(outputTitle("Value", "Python expression")); const pre = document.createElement("pre"); pre.className = "console-output"; pre.textContent = result.value; item.append(pre); }
    if (result.stdout || result.stderr) { item.append(outputTitle("Console", result.stdout && result.stderr ? "stdout + stderr" : result.stderr ? "stderr" : "stdout")); const pre = document.createElement("pre"); pre.className = "console-output"; pre.textContent = [result.stdout, result.stderr].filter(Boolean).join("\n"); item.append(pre); }
    if (!result.table && !result.charts?.length && !result.value && !warnings.length && !result.stdout && !result.stderr) { const note = document.createElement("p"); note.className = "result-note"; note.textContent = "Cell ran successfully and updated the shared Python workspace."; item.append(note); }
    const next=routeTasks[routeTasks.findIndex(task=>task.id===cell.taskId)+1];
    if (cell.status==='done' && cell.taskId && next) {
      const button=document.createElement('button');button.className='toolbar-button';button.type='button';button.textContent=`Next step: ${next.title}`;
      button.addEventListener('click',()=> {const candidate=cells.find(candidate=>candidate.taskId===next.id) || addRouteCell(next,false);runCell(candidate);});item.append(button);
    }
    return item;
  }

  function renderOutputs() {
    const list = $("#outputList"), complete = cells.filter(cell => cell.output && (playgroundMode === "practice" || !cell.checkpoint));
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
    } else {
      complete.forEach(cell => list.append(renderOutputItem(cell)));
    }
    const cleanReference = renderCleanWorkflowReferenceCard();
    if (cleanReference) list.append(cleanReference);
    $("#downloadChartButton").disabled = !latestChart;
    $("#outputBody").scrollTop = $("#outputBody").scrollHeight;
  }

  function renderNotebookView(focusTarget = null) {
    const retained = new Map($$(".cell-stack", $("#notebookPanel")).map(stack => [stack.dataset.cellId, stack]));
    renderNotebook();
    $$(".cell-stack", $("#notebookPanel")).forEach(stack => {
        const old = retained.get(stack.dataset.cellId);
        const cell = cells.find(cell => cell.id === stack.dataset.cellId);
        if (!old || old.cellModel !== cell || old.querySelector('textarea')?.value !== cell?.code) return;
        const freshArticle=stack.querySelector('article.cell'), oldArticle=old.querySelector('article.cell');
        oldArticle.dataset.status=freshArticle.dataset.status;
        oldArticle.querySelector('.cell-footer')?.replaceWith(freshArticle.querySelector('.cell-footer'));
        const oldRun=oldArticle.querySelector('.cell-action.run'), newRun=freshArticle.querySelector('.cell-action.run');
        if (oldRun && newRun) {oldRun.disabled=newRun.disabled; oldRun.textContent=newRun.textContent;}
        stack.replaceWith(old);
      });
    renderOutputs();
    restoreFocusTarget(focusTarget);
  }

  function updateSeal() {
    const unsupervised = selectedModel()?.task === "unsupervised", used = testSetOpened;
    const badge = $("#sealBadge");
    badge.textContent = unsupervised ? "TARGET NOT USED" : used ? "TEST SET USED ONCE" : "TEST SET SEALED";
    badge.classList.toggle("used", used);
    $("#holdoutState").textContent = unsupervised ? "not applicable" : used ? "opened once" : "sealed";

  }

  function clearNotebook(message = "Notebook cleared; the test set is sealed again.") {
    window.NotebookSession?.beginTransition();
    cells = []; cellSequence = 0; latestChart = null; testSetOpened = false;
    clearPracticeSession();
    $("#outputStatus").textContent = "No cell run yet";
    renderNotebookView(); renderRoute(); renderBatchControls(); updateSeal();
    if (message) showToast(message);
  }

  async function resetWorkerWorkspace(keepData = true) {
    await sendWorker("reset", {keepData});
  }

  async function restartPython() {
    const token=++workspaceToken;
    const config=selectedConfig();
    bridge.restart();
    cells.forEach(cell => {cell.output = null; cell.status = "ready"; cell.lastRunCode = null;});
    testSetOpened = false; latestChart = null;
    setRuntimeReady(false, "Restarting Python — code retained…"); renderNotebookView(); renderRoute();
    try {
      const csv = await getDatasetText(config);
      if (token!==workspaceToken) return;
      await sendWorker("init", {csv, sep:config.sep, prepare:config.prepare});
      if (token!==workspaceToken) return;
      setRuntimeReady(true, "Python ready — variables reset; code retained");
      renderRoute(); updateSeal();
    } catch (error) { showToast(error.message, true); }
  }

  async function resetNotebook() {
    const token = ++workspaceToken;
    cells.forEach(cell => {cell.output = null; cell.status = "ready"; cell.lastRunCode = null;});
    latestChart = null; testSetOpened = false; renderNotebookView(); renderRoute(); updateSeal();
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
      window.NotebookSession?.restore();
    } catch (error) {
      if (token !== workspaceToken) return;
      $("#runtimeDot").className = "runtime-dot error";
      setRuntimeReady(false, "Python workspace unavailable · reload to retry");
      showToast(`Python workspace reset failed: ${error.message}`, true);
    }
  }

  async function loadDataset(id, restoredSetup = null) {
    const token = ++workspaceToken;
    currentDatasetId = id;
    cachedPreviewPayload = null;
    populateScenarios();
    if (restoredSetup) $('#scenarioSelect').value=restoredSetup[1];
    populateModels(restoredSetup?.[2]);
    if (restoredSetup && ['5','10'].includes(restoredSetup[3])) $('#foldSelect').value=restoredSetup[3];
    staticSetup(); buildRoute(); clearNotebook("");
    setRuntimeReady(false, `Reading ${selectedConfig().name}…`);
    $("#preview").innerHTML = "<div style='padding:9px;color:#697084;font-size:.6rem'>Loading clean preview…</div>";
    $("#runtimeDot").className = "runtime-dot";
    let csv;
    try {
      csv = await getDatasetText(selectedConfig());
      notebookCsv = csv;
      if (token !== workspaceToken) return;
      cachedPreviewPayload = parsePreview(csv, selectedConfig().sep);
      renderDatasetPreview();
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
      cachedPreviewPayload = response.profile.preview;
      renderDatasetPreview();
      $("#runtimeStatus").textContent = `Pyodide 0.26.4 ready · ${response.profile.missing} missing values in selected data`;
      $("#runtimeDot").className = "runtime-dot ready";
      $("#outputStatus").textContent = "No cell run yet";
      setRuntimeReady(true);
      window.NotebookSession?.restore();
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
    window.AppAppearance?.apply(document.body.dataset.theme);
    $("#themeButton").setAttribute("aria-label", `Switch to ${light ? "light" : "dark"} theme`);
    $("#themeButton").setAttribute("aria-pressed", String(!light));
    $("#themeButton").title = `Switch to ${light ? "light" : "dark"} theme`;
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

  function togglePracticeReference(taskId) {
    const focusTarget = captureFocusTarget();
    const state = practiceStateFor(taskId);
    state.referenceRevealed = !state.referenceRevealed;
    renderWorkflow();
    renderBatchControls();
    restoreFocusTarget(focusTarget);
  }

  function renderWorkflow() {
    const body = $("#guideBody"), config = selectedConfig(), value = selectedScenario(), model = selectedModel();
    body.replaceChildren();
    $("#guideSubtitle").textContent = `${config.name} · ${value.name} · ${model.name}${model.task === "unsupervised" ? "" : ` · ${$("#foldSelect").value} folds`}`;
    $("#guideDeckCount").textContent = `${routeTasks.length} steps · same code as the route`;

    const intro = document.createElement("p"); intro.className = "workflow-intro";
    intro.innerHTML = playgroundMode === "practice"
      ? "Each step answers one beginner question. <strong>Keep the question and reading cue in view, then reveal the reference solution only when you need it.</strong>"
      : "Each step answers one beginner question. <strong>Every title, explanation, and code block below comes directly from the current Suggested Route.</strong> Type the cell, run it, and inspect the output before continuing.";
    const progress = document.createElement("div"); progress.className = "workflow-progress";
    progress.innerHTML = `<b>Manual walkthrough</b><span id="workflowProgressLabel">Step 1 of ${routeTasks.length}</span><span class="workflow-meter"><span id="workflowProgressBar"></span></span>`;
    const story = document.createElement("div"); story.className = "workflow-story";

    routeTasks.forEach((item, index) => {
      const step = document.createElement("article"); step.className = "workflow-step"; step.dataset.taskId = item.id; step.style.setProperty("--step-color", colorFor(index));
      step.id = `workflow-step-${index}`;
      const number = document.createElement("span"); number.className = "workflow-step-number"; number.textContent = String(index + 1).padStart(2,"0");
      const head = document.createElement("div"); head.className = "workflow-step-head";
      const copy = document.createElement("div");
      const kicker = document.createElement("span"); kicker.className = "workflow-step-kicker"; kicker.textContent = `Step ${String(index + 1).padStart(2,"0")} of ${routeTasks.length}`;
      const title = document.createElement("strong"); title.className = "workflow-step-title"; title.textContent = item.title;
      const caption = document.createElement("span"); caption.className = "workflow-step-caption"; caption.textContent = item.caption;
      copy.append(kicker, title); head.append(copy, caption);
      const note = item.question ? teachingLine("QUESTION", item.question, "workflow-step-note", "question") : null;
      const concepts = conceptBlock(item.concepts, "workflow-step-concepts");
      const modelTeaching = modelTeachingBlock(item.modelTeaching, "workflow-step-model-teaching");
      const cue = item.readingCue ? teachingLine("LOOK FOR", item.readingCue, "workflow-step-cue", "reading-cue") : null;
      const metric = metricHelpBlock(item.metricHelp, "workflow-step-metric");
      const typeNote = document.createElement("p"); typeNote.className = "workflow-type-note"; typeNote.textContent = playgroundMode === "practice" ? "Reference Python available on demand" : "Type, run, and inspect this cell";
      step.append(number, head);
      if (note) step.append(note);
      if (concepts) step.append(concepts);
      if (modelTeaching) step.append(modelTeaching);
      if (cue) step.append(cue);
      if (metric) step.append(metric);
      step.append(typeNote);
      if (playgroundMode === "practice") {
        const reveal = document.createElement("div");
        reveal.className = "workflow-code-reveal";
        reveal.id = `${step.id}-code`;
        reveal.dataset.practiceRole = "reference-code";
        reveal.dataset.practiceTask = item.id;
        const state = practiceStateFor(item.id);
        if (state.referenceRevealed) {
          const label = document.createElement("p");
          label.className = "workflow-reference-label";
          label.textContent = "Reference solution";
          const code = document.createElement("pre");
          code.className = "workflow-code";
          code.dataset.taskId = item.id;
          code.innerHTML = highlightPython(item.code);
          code.setAttribute("aria-label", `Reference solution Python for ${item.title}`);
          const hide = document.createElement("button");
          hide.type = "button";
          hide.className = "workflow-reveal-button";
          hide.id = `${reveal.id}-toggle`;
          hide.textContent = "Hide reference solution";
          hide.setAttribute("aria-expanded", "true");
          hide.setAttribute("aria-controls", reveal.id);
          hide.addEventListener("click", () => togglePracticeReference(item.id));
          reveal.append(label, code, hide);
        } else {
          const message = document.createElement("p");
          message.textContent = "The question and cue stay visible while the exact Python remains collapsed.";
          const show = document.createElement("button");
          show.type = "button";
          show.className = "workflow-reveal-button";
          show.id = `${reveal.id}-toggle`;
          show.textContent = "Reveal code";
          show.setAttribute("aria-expanded", "false");
          show.setAttribute("aria-controls", reveal.id);
          show.addEventListener("click", () => togglePracticeReference(item.id));
          reveal.append(message, show);
        }
        step.append(reveal);
      } else {
        const code = document.createElement("pre");
        code.className = "workflow-code";
        code.dataset.taskId = item.id;
        code.innerHTML = highlightPython(item.code);
        code.setAttribute("aria-label", `Exact Python for ${item.title}`);
        step.append(code);
        const advanced = renderAdvancedDiagnosticCode(item);
        if (advanced) step.append(advanced);
      }
      story.append(step);
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
    $("#guideButton").focus({preventScroll:true});
  }

  function setGuideMinimized(next) {
    const guideWindow = $("#guideWindow"), guideBody = $("#guideBody"), button = $("#guideMinimize");
    const handles = $$(".guide-resize-handle", guideWindow);
    if (guideMinimized === next && guideBody.hidden === next) return;
    if (next) {
      guideRestoreSize = {width:guideWindow.style.width, height:guideWindow.style.height};
      guideMinimized = true;
      guideWindow.classList.add("is-minimized");
      guideWindow.dataset.minimized = "true";
      guideBody.hidden = true;
      handles.forEach(handle => { handle.hidden = true; });
      guideWindow.style.height = "auto";
      button.textContent = "+";
      button.setAttribute("aria-label", "Restore workflow");
      button.setAttribute("title", "Restore workflow");
      button.setAttribute("aria-expanded", "false");
    } else {
      guideMinimized = false;
      guideWindow.classList.remove("is-minimized");
      delete guideWindow.dataset.minimized;
      guideBody.hidden = false;
      handles.forEach(handle => { handle.hidden = false; });
      if (guideRestoreSize?.width) guideWindow.style.width = guideRestoreSize.width;
      else guideWindow.style.removeProperty("width");
      if (guideRestoreSize?.height) guideWindow.style.height = guideRestoreSize.height;
      else guideWindow.style.removeProperty("height");
      guideRestoreSize = null;
      button.textContent = "−";
      button.setAttribute("aria-label", "Minimize workflow");
      button.setAttribute("title", "Minimize workflow");
      button.setAttribute("aria-expanded", "true");
      clampGuideToViewport();
    }
  }

  function openWorkflow() {
    renderWorkflow();
    $("#guideWindow").hidden = false;
    clampGuideToViewport();
    $("#guideButton").setAttribute("aria-expanded", "true");
    $("#guideClose").focus({preventScroll:true});
  }

  function guideViewportSize() {
    const visualViewport = window.visualViewport;
    return {
      width: innerWidth,
      height: Math.min(innerHeight, visualViewport?.height || innerHeight)
    };
  }

  function guidePointerMatches(state, event) {
    return state && (state.pointerId == null || event.pointerId == null || state.pointerId === event.pointerId);
  }

  function releaseGuidePointer(state) {
    if (!state?.captureTarget || state.pointerId == null) return;
    try { state.captureTarget.releasePointerCapture?.(state.pointerId); } catch (_) { /* pointer already released */ }
  }

  function moveGuide(event) {
    if (!guidePointerMatches(guideDragState, event)) return;
    event.preventDefault();
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    const viewport = guideViewportSize();
    const left = Math.max(8, Math.min(viewport.width - rect.width - 8, event.clientX - guideDragState.offsetX));
    const top = Math.max(8, Math.min(viewport.height - rect.height - 8, event.clientY - guideDragState.offsetY));
    Object.assign(windowElement.style, {left:`${left}px`, top:`${top}px`, right:"auto", bottom:"auto"});
  }

  function stopGuideDrag(event) {
    if (!guidePointerMatches(guideDragState, event || {})) return;
    const state = guideDragState;
    if (event?.cancelable) event.preventDefault();
    guideDragState = null; $("#guideWindow").classList.remove("is-dragging");
    window.removeEventListener("pointermove", moveGuide);
    window.removeEventListener("pointerup", stopGuideDrag);
    window.removeEventListener("pointercancel", stopGuideDrag);
    window.removeEventListener("lostpointercapture", stopGuideDrag);
    releaseGuidePointer(state);
  }

  function startGuideDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.isPrimary === false) return;
    if (event.target.closest("button")) return;
    if (guideDragState) stopGuideDrag();
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    guideDragState = {pointerId:event.pointerId, captureTarget:event.currentTarget, offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top};
    windowElement.classList.add("is-dragging");
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch (_) { /* capture is optional */ }
    window.addEventListener("pointermove", moveGuide, {passive:false});
    window.addEventListener("pointerup", stopGuideDrag, {passive:false});
    window.addEventListener("pointercancel", stopGuideDrag, {passive:false});
    window.addEventListener("lostpointercapture", stopGuideDrag, {passive:false});
    event.preventDefault();
  }

  function startGuideResize(event) {
    const handle = event.target.closest(".guide-resize-handle");
    if (!handle || handle.hidden || event.isPrimary === false) return;
    if (guideResizeState) stopGuideResize();
    const windowElement = $("#guideWindow"), rect = windowElement.getBoundingClientRect();
    guideViewportSized = false;
    guideResizeState = {pointerId:event.pointerId,captureTarget:handle,direction:handle.dataset.resize,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top,width:rect.width,height:rect.height};
    windowElement.classList.add("is-resizing");
    try { handle.setPointerCapture?.(event.pointerId); } catch (_) { /* capture is optional */ }
    window.addEventListener("pointermove", moveGuideResize, {passive:false});
    window.addEventListener("pointerup", stopGuideResize, {passive:false});
    window.addEventListener("pointercancel", stopGuideResize, {passive:false});
    window.addEventListener("lostpointercapture", stopGuideResize, {passive:false});
    event.preventDefault(); event.stopPropagation();
  }

  function moveGuideResize(event) {
    if (!guidePointerMatches(guideResizeState, event)) return;
    event.preventDefault();
    const windowElement = $("#guideWindow"), state = guideResizeState, direction = state.direction;
    const viewport = guideViewportSize();
    const minWidth = Math.min(parseFloat(getComputedStyle(windowElement).minWidth) || (mobileLayoutQuery.matches ? 280 : 320), Math.max(0, viewport.width - 16));
    const minHeight = Math.min(parseFloat(getComputedStyle(windowElement).minHeight) || (mobileLayoutQuery.matches ? 240 : 300), Math.max(0, viewport.height - 16));
    const right = state.left + state.width, bottom = state.top + state.height;
    let {left,top,width,height} = state;
    if (direction.includes("e")) width = Math.max(minWidth, Math.min(viewport.width - 8 - left, state.width + event.clientX - state.startX));
    if (direction.includes("s")) height = Math.max(minHeight, Math.min(viewport.height - 8 - top, state.height + event.clientY - state.startY));
    if (direction.includes("w")) { left = Math.max(8, Math.min(right - minWidth, state.left + event.clientX - state.startX)); width = right - left; }
    if (direction.includes("n")) { top = Math.max(8, Math.min(bottom - minHeight, state.top + event.clientY - state.startY)); height = bottom - top; }
    Object.assign(windowElement.style, {left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,right:"auto",bottom:"auto"});
  }

  function stopGuideResize(event) {
    if (!guidePointerMatches(guideResizeState, event || {})) return;
    const state = guideResizeState;
    if (event?.cancelable) event.preventDefault();
    guideResizeState = null; $("#guideWindow").classList.remove("is-resizing");
    window.removeEventListener("pointermove", moveGuideResize);
    window.removeEventListener("pointerup", stopGuideResize);
    window.removeEventListener("pointercancel", stopGuideResize);
    window.removeEventListener("lostpointercapture", stopGuideResize);
    releaseGuidePointer(state);
  }

  function clampGuideToViewport() {
    const windowElement = $("#guideWindow"); if (windowElement.hidden) return;
    const viewport = guideViewportSize();
    const maxWidth = Math.max(0, viewport.width - 16), maxHeight = Math.max(0, viewport.height - 16);
    if (!mobileLayoutQuery.matches && guideViewportSized) {
      windowElement.style.removeProperty("width");
      windowElement.style.removeProperty("height");
      guideViewportSized = false;
    }
    const rect = windowElement.getBoundingClientRect(), width = Math.min(rect.width, maxWidth), height = Math.min(rect.height, maxHeight);
    if (rect.width > maxWidth || rect.height > maxHeight) guideViewportSized = true;
    const left = Math.max(8, Math.min(viewport.width - width - 8, rect.left)), top = Math.max(8, Math.min(viewport.height - height - 8, rect.top));
    const styles = {left:`${left}px`,top:`${top}px`,right:"auto",bottom:"auto"};
    if (!guideMinimized && rect.width > maxWidth) styles.width = `${width}px`;
    if (!guideMinimized && rect.height > maxHeight) styles.height = `${height}px`;
    Object.assign(windowElement.style, styles);
  }

  function prepareGuideInteractions() {
    const guideWindow = $("#guideWindow"), dragHandle = $("#guideDragHandle"), guideBody = $("#guideBody");
    dragHandle.style.touchAction = "none";
    guideWindow.style.overscrollBehavior = "contain";
    guideBody.style.touchAction = "pan-x pan-y";
    guideBody.style.overscrollBehavior = "contain";
    guideBody.style.webkitOverflowScrolling = "touch";
    $$(".guide-resize-handle", guideWindow).forEach(handle => { handle.style.touchAction = "none"; handle.style.userSelect = "none"; });
  }

  async function downloadChart() {
    if (!latestChart) return;
    const filename = `${currentDatasetId}-${selectedModelId()}-chart.png`;
    if (await window.AppPlatform?.shareDataUrl?.(latestChart, filename, "Machine-learning chart")) {
      showToast("Chart ready to save or share.");
      return;
    }
    const link = document.createElement("a"); link.href = latestChart; link.download = filename; link.click(); showToast("Latest chart downloaded.");
  }

  if (TEST_MODE) {
    window.__ML_ROUTE_TEST_API__ = Object.freeze({DATASETS, MODELS, compatible, routeForSelection, modelSpec, preprocessingPlan, preprocessingConcepts, modelSpecificTeaching, filterPreviewPayload, ONE_R_HELPER_SOURCE, DATAFRAME_SERIALIZER_SOURCE, PRACTICE_VALIDATOR_SOURCE, RESET_WORKSPACE_SOURCE, WORKER_SOURCE, invalidateCellsFrom, isTrustedOptionalCell, firstIncompleteRouteIndex, routeButtonState, primaryMetricMetadata, metricHelpFor, cvSummaryFromTable, cvStabilityText, cvGapText, finalComparisonFromTable, formatTeachingNumber, practiceForTask, practiceRouteIdentity, practiceStateKey, normalizePracticeAnswer, safeExperimentForTask, applyPracticeMutation, practicePrediction, practiceDecision, practiceExerciseForTask, applyPracticeScaffold, cleanWorkflowReference, independentCheckpointForRoute, codeSurfaceMetrics, routeComplexityReport, pythonErrorDetails, warningDetails, warningExplanation, chartDescriptionFor});
  } else {
  $("#datasetSelect").addEventListener("change", event => loadDataset(event.target.value));
  $("#scenarioSelect").addEventListener("change", () => { void rebuildSetup({scenarioChanged:true}); });
  $("#modelSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#foldSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#addCellButton").addEventListener("click", () => addCell());
  $("#runAllButton").addEventListener("click", runAll);
  $("#resetButton").addEventListener("click", () => { void resetNotebook(); });
  $("#downloadChartButton").addEventListener("click", downloadChart);
  $("#restartPythonButton").addEventListener("click", restartPython);
  $("#themeButton").addEventListener("click", toggleTheme);
  $("#guideButton").addEventListener("click", openWorkflow);
  $("#guideClose").addEventListener("click", closeWorkflow);
  $("#guideMinimize").addEventListener("click", () => setGuideMinimized(!guideMinimized));
  $("#guideDragHandle").addEventListener("pointerdown", startGuideDrag);
  $("#guideWindow").addEventListener("pointerdown", startGuideResize);
  window.addEventListener("resize", clampGuideToViewport);
  window.visualViewport?.addEventListener("resize", clampGuideToViewport);
  window.visualViewport?.addEventListener("scroll", clampGuideToViewport);
  mobileLayoutQuery.addEventListener("change", () => renderOutputs());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("#guideWindow").hidden) closeWorkflow();
  });

  prepareGuideInteractions();
  window.NotebookSession?.install({
    key:() => ['ml',currentDatasetId,$('#scenarioSelect').value,selectedModelId(), $('#foldSelect').value].join(':'),
    get:() => ({cells, csv: notebookCsv, sep:selectedConfig().sep, pythonHelpers:selectedModelId()==="one_r" ? ONE_R_HELPER_SOURCE : "", dictionary:window.DatasetDictionary?.[selectedConfig().file]}),
    set:draft => {cells=draft.cells; cellSequence=Math.max(0,...cells.map(cell => cell.number)); renderNotebookView(); renderRoute();},
    insert:(cell,index) => {cell.output=null; cell.status='ready'; cells.splice(index,0,cell); renderNotebookView(); renderRoute();}
  });
  populateDatasets(); populateScenarios(); populateModels(); staticSetup(); buildRoute(); renderNotebookView(); updateSeal();
  const restoredSetup=window.NotebookSession?.last('ml');
  const initialDataset=DATASETS[restoredSetup?.[0]] ? restoredSetup[0] : 'breast';
  $('#datasetSelect').value=initialDataset;
  loadDataset(initialDataset,initialDataset===restoredSetup?.[0] ? restoredSetup : null);

  }
})();
