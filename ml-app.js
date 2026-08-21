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

  const scenario = (id, name, continuous = [], binary = [], categorical = []) => ({id, name, continuous, binary, categorical});
  const DATASETS = {
    breast: {
      name:"Breast Cancer Wisconsin (Diagnostic)", file:"data/breast-cancer.csv", embedded:"breast", sep:",", rows:569, task:"classification", target:"diagnosis", split:"stratified",
      description:"Clean cell-nucleus measurements with a malignant/benign target.", question:"Can continuous measurements separate the two diagnoses?",
      source:"https://archive.ics.uci.edu/dataset/17/breast-cancer-wisconsin-diagnostic", sourceLabel:"UCI Breast Cancer Wisconsin", sourceNote:"569 rows · 30 continuous predictors · no missing values", prepare:"df.copy()",
      scenarios:[
        scenario("continuous5","All features continuous · 5 less-redundant measures",["radius_mean","texture_mean","smoothness_mean","concavity_mean","symmetry_mean"]),
        scenario("continuous30","All features continuous · all 30",ALL_BREAST)
      ]
    },
    penguins: {
      name:"Palmer Penguins · cleaned", file:"data/palmer-penguins.csv", embedded:"penguins", sep:",", rows:333, task:"classification", target:"species", split:"stratified",
      description:"Complete measurements and context for three penguin species.", question:"How does preprocessing change as feature types are combined?",
      source:"https://allisonhorst.github.io/palmerpenguins/", sourceLabel:"Palmer Penguins", sourceNote:"333 official complete cases · island can be a strong geography shortcut", prepare:"df.copy()",
      scenarios:[
        scenario("continuous","All features continuous",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"]),
        scenario("continuous_binary","Continuous + binary",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],["sex"]),
        scenario("continuous_category","Continuous + categorical geography",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],[],["island"]),
        scenario("all_types","Continuous + binary + categorical context",["bill_length_mm","bill_depth_mm","flipper_length_mm","body_mass_g"],["sex"],["island","year"])
      ]
    },
    car: {
      name:"Car Evaluation", file:"data/car-evaluation.csv", embedded:"car", sep:",", rows:1728, task:"classification", target:"acceptability", split:"stratified",
      description:"Six fully categorical car attributes with four acceptability classes.", question:"What changes when every predictor is categorical?",
      source:"https://archive.ics.uci.edu/dataset/19/car+evaluation", sourceLabel:"UCI Car Evaluation", sourceNote:"1,728 rows · all categorical · no missing values", prepare:"df.copy()",
      scenarios:[scenario("categorical","All features categorical",[],[],["buying","maintenance","doors","persons","luggage_boot","safety"])]
    },
    candy_class: {
      name:"Candy Popularity · binary target", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"classification", target:"popular", split:"stratified", theme:"candy",
      description:"Ingredient flags and dataset-relative percentiles with a fixed majority-win target.", question:"Can binary ingredients classify a candy as winning at least half its matchups?",
      source:"https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking", sourceLabel:"FiveThirtyEight Candy Power Ranking", sourceNote:"85 rows · clean · target fixed at a 50% win rate", prepare:"df.assign(popular=np.where(df['winpercent'] >= 50, '50% or above', 'below 50%'))",
      scenarios:[
        scenario("binary","All features binary",[],CANDY_BINARY),
        scenario("continuous_binary","Continuous + binary",["sugarpercent","pricepercent"],CANDY_BINARY)
      ]
    },
    wine: {
      name:"Wine Quality", file:"data/wine-quality.csv", embedded:"wine", sep:";", rows:5320, task:"regression", target:"quality", split:"random",
      description:"Wine chemistry and type with an ordered 0–10 sensory score treated as regression.", question:"Can chemistry estimate quality, and does the relationship curve?",
      source:"https://archive.ics.uci.edu/dataset/186/wine+quality", sourceLabel:"UCI Wine Quality", sourceNote:"5,320 distinct rows · exact duplicates removed before splitting", prepare:"df.drop_duplicates().reset_index(drop=True)",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["alcohol"]),
        scenario("continuous","Multiple continuous features",CHEMISTRY),
        scenario("continuous_binary","Continuous + binary",CHEMISTRY,["wine_type"])
      ]
    },
    seoul: {
      name:"Seoul Bike Sharing Demand", file:"data/seoul-bike.csv", embedded:"seoul", sep:",", rows:8760, task:"regression", target:"Rented Bike Count", split:"time",
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
      name:"Gapminder · 2007 snapshot", file:"data/gapminder.csv", embedded:"gapminder", sep:",", rows:142, task:"regression", target:"lifeExp", split:"random",
      description:"A 2007 snapshot from the archived five-year Gapminder teaching extract.", question:"Is the wealth–longevity relationship straight or curved?",
      source:"https://raw.githubusercontent.com/plotly/datasets/master/gapminderDataFiveYear.csv", sourceLabel:"Plotly Gapminder CSV", sourceNote:"142 countries in 2007 · one leakage-safe snapshot", prepare:"df[df['year'].eq(2007)].copy()",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["gdpPercap"]),
        scenario("continuous","Multiple continuous features",["gdpPercap","pop"])
      ]
    },
    candy: {
      name:"Candy Power Ranking", file:"data/candy-power-ranking.csv", embedded:"candy", sep:",", rows:85, task:"regression", target:"winpercent", split:"random",
      description:"Ingredient flags, dataset-relative sugar/price percentiles and head-to-head win rate.", question:"How do percentile measures and binary ingredients relate to popularity?",
      source:"https://github.com/fivethirtyeight/data/tree/master/candy-power-ranking", sourceLabel:"FiveThirtyEight Candy Power Ranking", sourceNote:"85 rows · clean numeric and binary predictors", prepare:"df.copy()",
      scenarios:[
        scenario("simple","1 continuous feature · simple regression",["sugarpercent"]),
        scenario("continuous","Multiple continuous features",["sugarpercent","pricepercent"]),
        scenario("binary","All features binary",[],CANDY_BINARY),
        scenario("continuous_binary","Continuous + binary",["sugarpercent","pricepercent"],CANDY_BINARY)
      ]
    }
  };

  const MODELS = {
    simple_linear:{name:"Simple Linear Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"single"},
    multiple_linear:{name:"Multiple Linear Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"multiple"},
    polynomial:{name:"Polynomial Regression", family:"Regression", task:"regression", metric:"RMSE · R²", requires:"continuous"},
    regression_tree:{name:"Regression Tree", family:"Regression", task:"regression", metric:"RMSE · R²"},
    logistic:{name:"Logistic Regression", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    svm_cls:{name:"Support Vector Machine", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    one_r:{name:"One-R", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    classification_tree:{name:"Classification Tree", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    knn_cls:{name:"K-Nearest Neighbours (KNN)", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    qda:{name:"Quadratic Discriminant Analysis", family:"Classification", task:"classification", metric:"macro F1 · accuracy", requires:"continuous", maxFeatures:10},
    lda:{name:"Linear Discriminant Analysis", family:"Classification", task:"classification", metric:"macro F1 · accuracy", requires:"continuous"},
    naive_bayes:{name:"Naive Bayes", family:"Classification", task:"classification", metric:"macro F1 · accuracy"},
    mlp_cls:{name:"Neural Network · classification", family:"Neural Networks", task:"classification", metric:"macro F1 · accuracy", minRows:150},
    mlp_reg:{name:"Neural Network · regression", family:"Neural Networks", task:"regression", metric:"RMSE · R²", minRows:150},
    kmeans:{name:"K-Means Clustering", family:"Unsupervised", task:"unsupervised", metric:"silhouette", requires:"continuous", minFeatures:2},
    hierarchical:{name:"Hierarchical Clustering", family:"Unsupervised", task:"unsupervised", metric:"silhouette", requires:"continuous", minFeatures:2},
    pca:{name:"Principal Component Analysis (PCA)", family:"Dimensionality reduction", task:"unsupervised", metric:"variance explained", requires:"continuous", minFeatures:2}
  };

  const WORKER_SOURCE = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
let pyodide, ready = false, bootPromise = null;
let queue = Promise.resolve();
async function boot() {
  if (ready) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    pyodide = await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"});
    await pyodide.loadPackage(["pandas","numpy","matplotlib","scipy","scikit-learn","micropip"]);
    await pyodide.runPythonAsync("import micropip; await micropip.install('seaborn==0.13.2')");
    await pyodide.runPythonAsync(\`
import io, json, base64, contextlib, ast, traceback
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
      const resetNames = [
        "model_df","continuous_features","binary_features","categorical_features","feature_names","target_name","X","y",
        "X_train","X_test","y_train","y_test","cv","fold_plan","preprocessor","estimator","model","pipeline","scoring",
        "baseline","cv_scores","parameter_grid","search","best_pipeline","best_params","tuning_results","diagnostic_prediction",
        "diagnostic_actual","diagnostic_model","residuals","final_model","test_prediction",
        "test_result","OneRClassifier","wrapped_model","fitted","interpretation","encoded_names","prepared_names","term_names",
        "coefficient_labels","coef","lda_coef","lda_rows","importance","candidate_rows","candidate_scores","kmeans","clusters",
        "sample_silhouette","cluster_quality","profile_df","cluster_profile","projection","plot_df","full_pca","variance_table",
        "n_components_90","pca","loadings","loading_view","reference_label","analysis_Z","analysis_rows",
        "linkage_matrix","best_k","hierarchical","sample_size","sample_index","correlation"
      ];
      if (!data.keepData) resetNames.push("df");
      pyodide.globals.set("__reset_names_json", JSON.stringify(resetNames));
      await pyodide.runPythonAsync(\`
__reset_names = json.loads(__reset_names_json)
for __name in __reset_names:
    globals().pop(__name, None)
globals().pop("__reset_names", None)
globals().pop("__reset_names_json", None)
\`);
      post(id, {ok:true});
      return;
    }
    if (type === "init") {
      pyodide.globals.set("__csv_text", data.csv);
      pyodide.globals.set("__csv_sep", data.sep);
      pyodide.globals.set("__profile_prepare", data.prepare);
      const raw = await pyodide.runPythonAsync(\`
df = pd.read_csv(io.StringIO(__csv_text), sep=__csv_sep)
profile_df = eval(__profile_prepare, globals())
preview = profile_df.head(5).copy()
json.dumps({
  "rows": int(len(profile_df)), "columns": [str(c) for c in profile_df.columns],
  "preview": {"columns":[str(c) for c in preview.columns], "rows":[[None if pd.isna(v) else v.item() if hasattr(v, "item") else v for v in row] for row in preview.to_numpy().tolist()]},
  "missing": int(profile_df.isna().sum().sum())
}, default=str)
\`);
      post(id, {ok:true, profile:JSON.parse(raw)});
      return;
    }
    if (type === "run") {
      pyodide.globals.set("__cell_code", data.code);
      const raw = await pyodide.runPythonAsync(\`
__stdout, __stderr = io.StringIO(), io.StringIO()
__result, __error, __last_display = None, None, None
plt.close("all")
try:
    __tree = ast.parse(__cell_code, mode="exec")
    with contextlib.redirect_stdout(__stdout), contextlib.redirect_stderr(__stderr):
        if __tree.body and isinstance(__tree.body[-1], ast.Expr):
            __last = __tree.body.pop()
            exec(compile(__tree, "<cell>", "exec"), globals())
            __result = eval(compile(ast.Expression(__last.value), "<cell>", "eval"), globals())
        else:
            exec(compile(__tree, "<cell>", "exec"), globals())
            __result = __last_display
except Exception:
    __error = traceback.format_exc()
__table = None
if __error is None and isinstance(__result, pd.Series):
    __result = __result.to_frame()
if __error is None and isinstance(__result, pd.DataFrame):
    __shown = __result.head(50).iloc[:, :20]
    __table = {"columns":[str(c) for c in __shown.columns], "rows":[[None if pd.isna(v) else v.item() if hasattr(v, "item") else v for v in row] for row in __shown.to_numpy().tolist()], "rowCount":int(len(__result)), "columnCount":int(len(__result.columns))}
__charts = []
for __number in plt.get_fignums():
    __fig = plt.figure(__number)
    __buffer = io.BytesIO()
    __fig.savefig(__buffer, format="png", dpi=125, bbox_inches="tight", facecolor="#fffaf0")
    __charts.append("data:image/png;base64," + base64.b64encode(__buffer.getvalue()).decode("ascii"))
plt.close("all")
__value = None
if __error is None and __table is None and __result is not None and not hasattr(__result, "figure"):
    try: __value = str(__result)
    except Exception: pass
json.dumps({"status":"error" if __error else "ok", "error":__error, "stdout":__stdout.getvalue(), "stderr":__stderr.getvalue(), "table":__table, "charts":__charts, "value":__value}, default=str)
\`);
      post(id, {ok:true, output:JSON.parse(raw)});
      return;
    }
    throw new Error("Unknown worker message");
  } catch (error) { post(id, {ok:false, error:error?.message || String(error)}); }
}
self.onmessage = event => { queue = queue.then(() => handle(event.data)); };
`;

  const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SOURCE], {type:"text/javascript"})));
  const pending = new Map();
  let messageId = 0;
  worker.onmessage = ({data}) => {
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

  function frameCode(config, value, unsupervised = false) {
    return `# 1 · Frame the ${unsupervised ? "unsupervised question" : "prediction problem"}
continuous_features = ${py(value.continuous)}
binary_features = ${py(value.binary)}
categorical_features = ${py(value.categorical)}
feature_names = continuous_features + binary_features + categorical_features
target_name = ${py(config.target)}

model_df = ${config.prepare}
X = model_df[feature_names].copy()
${unsupervised ? "" : "y = model_df[target_name].copy()"}

pd.DataFrame({
    "role": ["rows", "predictors", "target", "task"],
    "value": [len(model_df), len(feature_names), ${py(unsupervised ? "not used for fitting" : config.target)}, ${py(unsupervised ? "discover structure without target labels" : config.task)}]
})`;
  }

  function exploreCode(value, unsupervised = false) {
    if (featureNames(value).length === 1) {
      const only = featureNames(value)[0];
      return `# 2 · Explore the selected predictor
summary = model_df[feature_names].describe(include="all").T
print("Missing values in selected inputs:", int(model_df[feature_names].isna().sum().sum()))

fig, ax = plt.subplots(figsize=(6.2, 3.6))
${value.continuous.includes(only) ? `sns.histplot(data=model_df, x=${py(only)}, kde=True, ax=ax, color="#137c9c")` : `model_df[${py(only)}].value_counts().head(10).plot.bar(ax=ax, color="#137c9c")`}
ax.set_title(${py(only)})
fig.tight_layout()

summary`;
    }
    if (unsupervised) {
      const first = featureNames(value)[0], second = featureNames(value)[1] || featureNames(value)[0];
      return `# 2 · Explore inputs without consulting the reference target
summary = model_df[feature_names].describe(include="all").T
print("Missing values in selected inputs:", int(model_df[feature_names].isna().sum().sum()))
fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
${value.continuous.includes(first) ? `sns.histplot(data=model_df, x=${py(first)}, kde=True, ax=axes[0], color="#137c9c")` : `model_df[${py(first)}].value_counts().head(10).plot.bar(ax=axes[0], color="#137c9c")`}
axes[0].set_title(${py(first)})
${value.continuous.includes(second) ? `sns.histplot(data=model_df, x=${py(second)}, kde=True, ax=axes[1], color="#7651a6")` : `model_df[${py(second)}].value_counts().head(10).plot.bar(ax=axes[1], color="#7651a6")`}
axes[1].set_title(${py(second)})
fig.tight_layout()
summary`;
    }
    const first = value.continuous[0];
    const second = value.continuous[1];
    return `# 2 · Explore the selected inputs; the test target is not used here
summary = model_df[feature_names].describe(include="all").T
print("Missing values in selected inputs:", int(model_df[feature_names].isna().sum().sum()))

fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
${first ? `sns.histplot(data=model_df, x=${py(first)}, kde=True, ax=axes[0], color="#137c9c")
axes[0].set_title(${py(first)})` : `model_df[feature_names[0]].value_counts().head(10).plot.bar(ax=axes[0], color="#137c9c")
axes[0].set_title(feature_names[0])`}
${second ? `sns.histplot(data=model_df, x=${py(second)}, kde=True, ax=axes[1], color="#7651a6")
axes[1].set_title(${py(second)})` : `model_df[feature_names[-1]].value_counts().head(10).plot.bar(ax=axes[1], color="#7651a6")
axes[1].set_title(feature_names[-1])`}
fig.tight_layout()
summary`;
  }

  function splitCode(config) {
    if (config.split === "time") return `# 3 · Split the data and save the latest 20% for the final test
split_at = int(len(X) * 0.80)
X_train, X_test = X.iloc[:split_at].copy(), X.iloc[split_at:].copy()
y_train, y_test = y.iloc[:split_at].copy(), y.iloc[split_at:].copy()
pd.DataFrame({"partition":["training + CV", "saved final test"], "rows":[len(X_train), len(X_test)], "order":["earlier", "later"]})`;
    return `# 3 · Split the data and save 20% for the final test
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
    const scoreBlock = config.task === "classification" ? `scoring = {"macro_f1":"f1_macro", "accuracy":"accuracy"}
baseline = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, return_train_score=True, n_jobs=1, error_score="raise")
cv_scores = pd.DataFrame({
    "fold":np.arange(1, len(baseline["test_macro_f1"]) + 1),
    "train_macro_f1":baseline["train_macro_f1"],
    "validation_macro_f1":baseline["test_macro_f1"],
    "validation_accuracy":baseline["test_accuracy"]
})` : `scoring = {"rmse":"neg_root_mean_squared_error", "r2":"r2"}
baseline = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, return_train_score=True, n_jobs=1, error_score="raise")
cv_scores = pd.DataFrame({
    "fold":np.arange(1, len(baseline["test_rmse"]) + 1),
    "train_rmse":-baseline["train_rmse"],
    "validation_rmse":-baseline["test_rmse"],
    "validation_r2":baseline["test_r2"]
})`;
    return `# 6 · Check whether the baseline model works consistently
from sklearn.model_selection import ${splitterName}, cross_validate

# Each fold fits on its fit rows and checks different validation rows.
cv = ${splitter}
fold_plan = []
for fold, (fit_index, validation_index) in enumerate(cv.split(X_train, y_train), start=1):
    fold_plan.append({"fold":fold, "fit_rows":len(fit_index), "validation_rows":len(validation_index)})
print("Fold plan:")
print(pd.DataFrame(fold_plan))

${scoreBlock}
cv_scores.round(3)`;
  }

  function preprocessingCode(value, modelId) {
    const noScale = ["regression_tree","classification_tree","one_r","naive_bayes"].includes(modelId);
    const keepOriginalUnits = ["simple_linear","multiple_linear"].includes(modelId);
    const ordinalCategories = modelId === "one_r";
    const scaleContinuous = !noScale && !keepOriginalUnits;
    const imports = [
      "from sklearn.compose import ColumnTransformer",
      "from sklearn.pipeline import Pipeline",
      "from sklearn.impute import SimpleImputer"
    ];
    if (scaleContinuous) imports.push("from sklearn.preprocessing import StandardScaler");
    if (value.binary.length || (value.categorical.length && ordinalCategories)) imports.push("from sklearn.preprocessing import OrdinalEncoder");
    if (value.categorical.length && !ordinalCategories) imports.push("from sklearn.preprocessing import OneHotEncoder");

    const branches = [];
    const featureTypes = [];
    const columnCounts = [];
    const treatments = [];
    if (value.continuous.length) {
      const steps = ["(\"impute\", SimpleImputer(strategy=\"median\"))"];
      if (scaleContinuous) steps.push("(\"scale\", StandardScaler())");
      branches.push(`    ("continuous", Pipeline([\n        ${steps.join(",\n        ")}\n    ]), continuous_features)`);
      featureTypes.push("continuous"); columnCounts.push("len(continuous_features)");
      treatments.push(scaleContinuous ? "median imputation + standardisation" : keepOriginalUnits ? "median imputation; original units retained" : "median imputation; scaling not needed for this model");
    }
    if (value.binary.length) {
      branches.push(`    ("binary", Pipeline([\n        ("impute", SimpleImputer(strategy="most_frequent")),\n        ("encode", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1))\n    ]), binary_features)`);
      featureTypes.push("binary"); columnCounts.push("len(binary_features)"); treatments.push("mode imputation + numeric 0/1-style encoding");
    }
    if (value.categorical.length) {
      const encoder = ordinalCategories
        ? "(\"ordinal\", OrdinalEncoder(handle_unknown=\"use_encoded_value\", unknown_value=-1))"
        : `("one_hot", OneHotEncoder(handle_unknown="ignore", sparse_output=False, drop=${keepOriginalUnits ? "'first'" : "None"}))`;
      branches.push(`    ("categorical", Pipeline([\n        ("impute", SimpleImputer(strategy="most_frequent")),\n        ${encoder}\n    ]), categorical_features)`);
      featureTypes.push("categorical"); columnCounts.push("len(categorical_features)");
      treatments.push(ordinalCategories ? "mode imputation + one code per original feature" : "mode imputation + one-hot encoding");
    }

    const comments = [
      "# Keep preprocessing inside the pipeline so every CV training fold learns it from its own rows.",
      "# This prevents imputation, scaling, and category information from leaking across folds."
    ];
    if (scaleContinuous) comments.push("# Scaling helps when distance or optimisation is affected by feature magnitude.");
    else if (noScale) comments.push("# This model uses thresholds, simple rules, or probabilities rather than feature distances, so scaling is not needed.");
    else if (keepOriginalUnits) comments.push("# Original numeric units stay visible so linear coefficients are easier to interpret.");
    if (value.binary.length || value.categorical.length) comments.push("# Categorical values are encoded because sklearn estimators require numeric inputs.");

    return `# 4 · Prepare the selected data
${comments.join("\n")}
${imports.join("\n")}

preprocessor = ColumnTransformer([
${branches.join(",\n")}
], verbose_feature_names_out=False)

pd.DataFrame({
    "feature_type": ${py(featureTypes)},
    "columns": [${columnCounts.join(", ")}],
    "treatment": ${py(treatments)}
})`;
  }

  function modelSpec(modelId, value) {
    const allBinary = value.continuous.length === 0 && value.categorical.length === 0 && value.binary.length > 0;
    const allCategorical = value.continuous.length === 0 && value.binary.length === 0 && value.categorical.length > 0;
    const specs = {
      simple_linear:{concept:"Fit one straight-line relationship", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      multiple_linear:{concept:"Estimate one adjusted linear effect per encoded predictor", imports:"from sklearn.linear_model import LinearRegression", estimator:"LinearRegression()", grid:"{}"},
      polynomial:{concept:"Expand continuous inputs into curved terms, then regularise", imports:"from sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import Ridge", estimator:`Pipeline([
    ("poly", PolynomialFeatures(include_bias=False)),
    ("regression", Ridge())
])`, grid:"{'model__poly__degree':[2, 3], 'model__regression__alpha':[0.1, 1.0, 10.0]}"},
      regression_tree:{concept:"Learn if/then splits for nonlinear numeric predictions", imports:"from sklearn.tree import DecisionTreeRegressor", estimator:"DecisionTreeRegressor(random_state=42)", grid:"{'model__max_depth':[3, 5, None], 'model__min_samples_leaf':[1, 5, 15]}"},
      logistic:{concept:"Model class log-odds with a regularised linear boundary", imports:"from sklearn.linear_model import LogisticRegression", estimator:"LogisticRegression(max_iter=2000, random_state=42)", grid:"{'model__C':[0.1, 1.0, 10.0], 'model__class_weight':[None, 'balanced']}"},
      svm_cls:{concept:"Find a maximum-margin boundary; RBF allows curvature", imports:"from sklearn.svm import SVC", estimator:"SVC(random_state=42)", grid:"{'model__C':[0.5, 2, 10], 'model__gamma':['scale', 0.1]}"},
      one_r:{concept:"Use the single feature whose simple rules make the fewest errors", imports:`# One-R is wrapped as a sklearn estimator so it can use the same pipeline and CV.
from sklearn.base import BaseEstimator, ClassifierMixin
class OneRClassifier(ClassifierMixin, BaseEstimator):
    def __init__(self, bins=5, discrete_features=None):
        self.bins = bins
        self.discrete_features = discrete_features
    def fit(self, X, y):
        X, y = np.asarray(X), np.asarray(y)
        self.classes_, counts = np.unique(y, return_counts=True)
        self.default_ = self.classes_[np.argmax(counts)]
        discrete = set(self.discrete_features or [])
        best = None
        for column_index in range(X.shape[1]):
            values = X[:, column_index]
            is_discrete = column_index in discrete or len(np.unique(values)) <= self.bins
            edges = None if is_discrete else np.unique(np.quantile(values, np.linspace(0, 1, self.bins + 1))[1:-1])
            encoded = values if is_discrete else np.digitize(values, edges)
            rules = {}
            for value in np.unique(encoded):
                labels, label_counts = np.unique(y[encoded == value], return_counts=True)
                rules[value] = labels[np.argmax(label_counts)]
            prediction = np.array([rules.get(value, self.default_) for value in encoded])
            errors = int(np.sum(prediction != y))
            if best is None or errors < best[0]: best = (errors, column_index, edges, rules)
        self.errors_, self.best_feature_, self.edges_, self.rules_ = best
        return self
    def predict(self, X):
        values = np.asarray(X)[:, self.best_feature_]
        encoded = values if self.edges_ is None else np.digitize(values, self.edges_)
        return np.array([self.rules_.get(value, self.default_) for value in encoded])`, estimator:`OneRClassifier(discrete_features=${py(Array.from({length:value.binary.length + value.categorical.length}, (_, index) => value.continuous.length + index))})`, grid:"{'model__bins':[3, 5, 8]}"},
      classification_tree:{concept:"Learn interpretable if/then splits for class labels", imports:"from sklearn.tree import DecisionTreeClassifier", estimator:"DecisionTreeClassifier(random_state=42)", grid:"{'model__max_depth':[3, 5, None], 'model__min_samples_leaf':[1, 5, 15], 'model__criterion':['gini','entropy']}"},
      knn_cls:{concept:"Vote using nearby training examples; distance makes scaling essential", imports:"from sklearn.neighbors import KNeighborsClassifier", estimator:"KNeighborsClassifier()", grid:"{'model__n_neighbors':[3, 5, 9, 15], 'model__weights':['uniform','distance']}"},
      qda:{concept:"Give each class its own covariance shape and curved boundary", imports:"from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis", estimator:"QuadraticDiscriminantAnalysis()", grid:"{'model__reg_param':[0.0, 0.05, 0.2, 0.5]}"},
      lda:{concept:"Share one covariance shape and learn linear class boundaries", imports:"from sklearn.discriminant_analysis import LinearDiscriminantAnalysis", estimator:"LinearDiscriminantAnalysis(solver='lsqr')", grid:"{'model__shrinkage':[None, 'auto']}"},
      naive_bayes: allBinary
        ? {concept:"Estimate independent Bernoulli probabilities for binary inputs", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:"{'model__alpha':[0.1, 1.0, 5.0]}"}
        : allCategorical
          ? {concept:"Estimate independent Bernoulli probabilities from one-hot categories", imports:"from sklearn.naive_bayes import BernoulliNB", estimator:"BernoulliNB()", grid:"{'model__alpha':[0.1, 1.0, 5.0]}"}
          : {concept:"Use a simple Gaussian baseline on the encoded features", imports:"from sklearn.naive_bayes import GaussianNB", estimator:"GaussianNB()  # a pragmatic baseline; encoded columns are treated as Gaussian", grid:"{'model__var_smoothing':[1e-11, 1e-9, 1e-7]}"},
      mlp_cls:{concept:"Learn nonlinear layers of weighted features with backpropagation", imports:"from sklearn.neural_network import MLPClassifier", estimator:`MLPClassifier(
    max_iter=500,
    early_stopping=True,
    random_state=42
)`, grid:"{'model__hidden_layer_sizes':[(24,), (32, 16)], 'model__alpha':[0.0001, 0.01]}"},
      mlp_reg:{concept:"Learn nonlinear layers while scaling the target inside the model", imports:"from sklearn.neural_network import MLPRegressor\nfrom sklearn.compose import TransformedTargetRegressor\nfrom sklearn.preprocessing import StandardScaler", estimator:`TransformedTargetRegressor(
    regressor=MLPRegressor(
        max_iter=800,
        early_stopping=True,
        tol=1e-3,
        random_state=42
    ),
    transformer=StandardScaler()
)`, grid:"{'model__regressor__hidden_layer_sizes':[(24,), (32, 16)], 'model__regressor__alpha':[0.0001, 0.01]}"}
    };
    return specs[modelId];
  }

  function modelCode(modelId, value) {
    const spec = modelSpec(modelId, value);
    return `# 5 · Build the model pipeline
# ${spec.concept}
from sklearn.pipeline import Pipeline
${spec.imports}

model = ${spec.estimator}
pipeline = Pipeline([
    ("prepare", preprocessor),
    ("model", model)
])
pd.DataFrame({"component":["preprocessing","model"], "object":[type(preprocessor).__name__, type(model).__name__]})`;
  }

  function tuningCode(config, modelId, value) {
    const spec = modelSpec(modelId, value);
    const hasHyperparameters = spec.grid !== "{}";
    const scoring = config.task === "classification"
      ? `{"macro_f1":"f1_macro", "accuracy":"accuracy"}`
      : `{"rmse":"neg_root_mean_squared_error", "r2":"r2"}`;
    const primaryMetric = config.task === "classification" ? "macro_f1" : "rmse";
    if (!hasHyperparameters) return `# 7 · Keep the model defaults
best_pipeline = pipeline
best_params = {}
print("No meaningful hyperparameters to tune; using the model defaults.")
pd.DataFrame({"selection":["model defaults"], "value":["used"]})`;
    return `# 7 · Tune the model inside the same training folds
from sklearn.model_selection import GridSearchCV
parameter_grid = ${spec.grid}
search = GridSearchCV(
    pipeline,
    parameter_grid,
    cv=cv,
    scoring=${scoring},
    refit=${py(primaryMetric)},
    return_train_score=True,
    n_jobs=1,
    error_score="raise"
)
search.fit(X_train, y_train)
best_pipeline = search.best_estimator_
best_params = search.best_params_
tuning_results = pd.DataFrame(search.cv_results_).sort_values("rank_test_${primaryMetric}")
${config.task === "regression" ? `tuning_results["mean_train_rmse"] *= -1
tuning_results["mean_test_rmse"] *= -1` : ""}
print("Best settings:", best_params)
tuning_results[["params", "mean_train_${primaryMetric}", "mean_test_${primaryMetric}", "rank_test_${primaryMetric}"]].head(10).round(3)`;
  }

  function interpretationCode(modelId) {
    if (["simple_linear","multiple_linear"].includes(modelId)) return `
encoded_names = diagnostic_model.named_steps["prepare"].get_feature_names_out()
fitted = diagnostic_model.named_steps["model"]
interpretation = pd.DataFrame({"feature":encoded_names, "coefficient":np.ravel(fitted.coef_)})
interpretation.reindex(interpretation.coefficient.abs().sort_values(ascending=False).index).head(15)`;
    if (modelId === "polynomial") return `
prepared_names = diagnostic_model.named_steps["prepare"].get_feature_names_out()
fitted = diagnostic_model.named_steps["model"]
term_names = fitted.named_steps["poly"].get_feature_names_out(prepared_names)
interpretation = pd.DataFrame({"term":term_names, "coefficient":np.ravel(fitted.named_steps["regression"].coef_)})
interpretation.reindex(interpretation.coefficient.abs().sort_values(ascending=False).index).head(15)`;
    if (["regression_tree","classification_tree"].includes(modelId)) return `
from sklearn.tree import plot_tree
encoded_names = diagnostic_model.named_steps["prepare"].get_feature_names_out()
fitted = diagnostic_model.named_steps["model"]
importance = pd.DataFrame({"feature":encoded_names, "importance":fitted.feature_importances_}).sort_values("importance", ascending=False)
fig, ax = plt.subplots(figsize=(12, 5))
plot_tree(fitted, max_depth=3, feature_names=encoded_names, filled=True, rounded=True, fontsize=6, ax=ax)
ax.set_title("Top of the fitted tree (training data only)")
fig.tight_layout()
importance.head(15)`;
    if (modelId === "logistic") return `
encoded_names = diagnostic_model.named_steps["prepare"].get_feature_names_out()
fitted = diagnostic_model.named_steps["model"]
coef = np.atleast_2d(fitted.coef_)
coefficient_labels = [fitted.classes_[1]] if coef.shape[0] == 1 else fitted.classes_
interpretation = pd.DataFrame(coef.T, index=encoded_names, columns=[f"weight_{label}" for label in coefficient_labels]).reset_index(names="feature")
interpretation.head(15)`;
    if (modelId === "svm_cls") return `
fitted = diagnostic_model.named_steps["model"]
pd.DataFrame({"class":fitted.classes_, "support_vectors":fitted.n_support_})`;
    if (modelId === "one_r") return `
fitted = diagnostic_model.named_steps["model"]
encoded_names = diagnostic_model.named_steps["prepare"].get_feature_names_out()
pd.DataFrame({"best_feature":[encoded_names[fitted.best_feature_]], "training_errors":[fitted.errors_], "rules":[str(fitted.rules_)]})`;
    if (modelId === "knn_cls") return `
pd.DataFrame(search.cv_results_)[["param_model__n_neighbors","param_model__weights","mean_test_macro_f1"]].sort_values("mean_test_macro_f1", ascending=False)`;
    if (modelId === "qda") return `
fitted = diagnostic_model.named_steps["model"]
pd.DataFrame(fitted.means_, index=fitted.classes_, columns=diagnostic_model.named_steps["prepare"].get_feature_names_out()).reset_index(names="class")`;
    if (modelId === "lda") return `
fitted = diagnostic_model.named_steps["model"]
lda_coef = np.atleast_2d(fitted.coef_)
lda_rows = fitted.classes_ if len(fitted.classes_) == lda_coef.shape[0] else [f"boundary_{i+1}" for i in range(lda_coef.shape[0])]
pd.DataFrame(lda_coef, index=lda_rows, columns=diagnostic_model.named_steps["prepare"].get_feature_names_out()).reset_index(names="class_or_boundary")`;
    if (modelId === "naive_bayes") return `
fitted = diagnostic_model.named_steps["model"]
pd.DataFrame({"class":fitted.classes_, "prior":np.exp(fitted.class_log_prior_) if hasattr(fitted, "class_log_prior_") else fitted.class_prior_})`;
    if (["mlp_cls","mlp_reg"].includes(modelId)) return `
wrapped_model = diagnostic_model.named_steps["model"]
fitted = wrapped_model.regressor_ if hasattr(wrapped_model, "regressor_") else wrapped_model
fig, ax = plt.subplots(figsize=(6.2, 3.4))
ax.plot(fitted.loss_curve_, color="#7651a6")
ax.set(title="Neural-network training loss", xlabel="iteration", ylabel="loss")
fig.tight_layout()
pd.DataFrame({"layers":[fitted.hidden_layer_sizes], "iterations":[fitted.n_iter_], "final_loss":[fitted.loss_]})`;
    return "";
  }

  function diagnosticsCode(config, modelId) {
    const interpretation = interpretationCode(modelId);
    if (config.task === "classification") return `# 8 · Diagnose and understand the chosen model
# These are training-data diagnostics, not another unbiased final score.
from sklearn.base import clone
from sklearn.model_selection import cross_val_predict
from sklearn.metrics import confusion_matrix, classification_report
diagnostic_prediction = cross_val_predict(best_pipeline, X_train, y_train, cv=cv, method="predict", n_jobs=1)
diagnostic_model = clone(best_pipeline).fit(X_train, y_train)

fig, ax = plt.subplots(figsize=(5.4, 4.2))
sns.heatmap(confusion_matrix(y_train, diagnostic_prediction), annot=True, fmt="d", cmap="Purples", ax=ax,
            xticklabels=np.unique(y_train), yticklabels=np.unique(y_train))
ax.set(title="Training-only diagnostic confusion matrix", xlabel="Predicted", ylabel="Actual")
fig.tight_layout()
diagnostic_report = pd.DataFrame(classification_report(y_train, diagnostic_prediction, output_dict=True, zero_division=0)).T
print("Diagnostic report — use the final test for the final score:")
print(diagnostic_report.round(3))
${interpretation}
`;
    const diagnosticSetup = config.split === "time"
      ? `last_fit, last_validation = list(cv.split(X_train, y_train))[-1]
diagnostic_model = clone(best_pipeline).fit(X_train.iloc[last_fit], y_train.iloc[last_fit])
diagnostic_actual = y_train.iloc[last_validation]
diagnostic_prediction = diagnostic_model.predict(X_train.iloc[last_validation])`
      : `diagnostic_prediction = cross_val_predict(best_pipeline, X_train, y_train, cv=cv, method="predict", n_jobs=1)
diagnostic_actual = y_train
diagnostic_model = clone(best_pipeline).fit(X_train, y_train)`;
    const predictionImport = config.split === "time" ? "" : "from sklearn.model_selection import cross_val_predict\n";
    const diagnosticLabel = config.split === "time" ? "training-only diagnostic residuals from the last validation window" : "training-only diagnostic residuals";
    return `# 8 · Diagnose and understand the chosen model
# These residuals describe model behaviour; the final test remains the only final evaluation.
from sklearn.base import clone
${predictionImport}from sklearn.metrics import root_mean_squared_error, r2_score
${diagnosticSetup}
residuals = diagnostic_actual.to_numpy() - diagnostic_prediction
fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
sns.scatterplot(x=diagnostic_prediction, y=residuals, ax=axes[0], color="#7651a6")
axes[0].axhline(0, color="#c75b20", linestyle="--")
axes[0].set(title=${py(diagnosticLabel)}, xlabel="prediction", ylabel="actual − prediction")
sns.histplot(residuals, kde=True, ax=axes[1], color="#137c9c")
axes[1].set_title("Residual distribution")
fig.tight_layout()
diagnostic_rmse = root_mean_squared_error(diagnostic_actual, diagnostic_prediction)
diagnostic_r2 = r2_score(diagnostic_actual, diagnostic_prediction)
print("Diagnostic RMSE:", round(diagnostic_rmse, 3))
print("Diagnostic R²:", round(diagnostic_r2, 3))
${interpretation}`;
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
      task("explore","Explore the data","inputs + plots",exploreCode(value),"What does my data look like?"),
      task("split","Split data and save the test set",config.split === "time" ? "latest 20%" : "stratified / random 20%",splitCode(config),"What will I train on, and what will I save until the end?"),
      task("prepare","Prepare the data","only selected feature types",preprocessingCode(value, modelId),"What needs to be cleaned or transformed?"),
      task("model","Build the model pipeline",modelSpec(modelId, value).concept,modelCode(modelId, value),"What algorithm am I using?"),
      task("baseline","Check the baseline with cross-validation",`${folds}-fold training-only CV`,baselineCode(config, folds),"Does the baseline model work consistently?"),
      task("tune",hasHyperparameters ? "Tune the model" : "Keep the model defaults",hasHyperparameters ? `GridSearchCV · ${folds} folds` : "no meaningful settings to search",tuningCode(config, modelId, value),"Can better settings improve it?"),
      task("diagnose","Diagnose and understand the chosen model","training-only diagnostics",diagnosticsCode(config, modelId),"What does the chosen model get right, get wrong, and how does it behave?"),
      task("final","Final test","saved test set · one use",finalCode(config),"How well does it perform on genuinely unseen data?")
    ];
  }

  function unsupervisedFrameCode(config, value) {
    return frameCode(config, value, true);
  }

  function clusterPreprocessing() {
    return `# 3 · Scale the numeric inputs
# Scaling makes feature magnitudes comparable for distance-based methods and PCA.
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

preprocessor = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler())
])
Z = preprocessor.fit_transform(X)

pd.DataFrame({"rows":[Z.shape[0]], "scaled_dimensions":[Z.shape[1]]})`;
  }

  function kmeansRoute(config, value) {
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","inputs + plots",exploreCode(value, true),"What does my data look like?"),
      task("prepare","Prepare the data","scaled numeric inputs",clusterPreprocessing(),"What needs to be cleaned or transformed?"),
      task("compare","Compare possible group counts","exploratory inertia + silhouette",`# 4 · Compare possible group counts; this is exploratory, not a test score
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
candidate_rows = []
max_k = min(8, len(Z) - 1)
for k in range(2, max_k + 1):
    candidate = KMeans(n_clusters=k, n_init=20, random_state=42).fit(Z)
    candidate_rows.append({"k":k, "inertia":candidate.inertia_, "silhouette":silhouette_score(Z, candidate.labels_)})
candidate_scores = pd.DataFrame(candidate_rows)
fig, axes = plt.subplots(1, 2, figsize=(9, 3.4))
sns.lineplot(data=candidate_scores, x="k", y="inertia", marker="o", ax=axes[0])
sns.lineplot(data=candidate_scores, x="k", y="silhouette", marker="o", ax=axes[1], color="#7651a6")
axes[0].set_title("Elbow: within-cluster inertia")
axes[1].set_title("Higher silhouette is better")
fig.tight_layout()
candidate_scores.round(3)`,"Which group count looks most useful?"),
      task("fit","Fit K-means","best silhouette k",`# 5 · Fit the selected K-means solution
best_k = int(candidate_scores.loc[candidate_scores["silhouette"].idxmax(), "k"])
kmeans = KMeans(n_clusters=best_k, n_init=30, random_state=42).fit(Z)
clusters = kmeans.labels_
pd.DataFrame({"selected_k":[best_k], "silhouette":[silhouette_score(Z, clusters)], "inertia":[kmeans.inertia_]}).round(3)`,"What does the selected solution look like?"),
      task("diagnose","Check the clusters","size + separation",`# 6 · Check whether the solution is balanced and separated
from sklearn.metrics import silhouette_samples
sample_silhouette = silhouette_samples(Z, clusters)
cluster_quality = pd.DataFrame({"cluster":clusters, "silhouette":sample_silhouette}).groupby("cluster").agg(rows=("silhouette","size"), mean_silhouette=("silhouette","mean"), weakest=("silhouette","min")).reset_index()
cluster_quality.round(3)`,"Are the groups balanced and well separated?"),
      task("profile","Explain the clusters","original feature units",`# 7 · Translate cluster IDs back into the original features
profile_df = model_df[feature_names].copy()
profile_df["cluster"] = clusters
cluster_profile = profile_df.groupby("cluster")[feature_names].mean().round(2)
cluster_profile.reset_index()`,"What does each group mean in the original features?"),
      task("visualise","Map the clusters","PCA view only",`# 8 · Project to two dimensions for a visual map (the model used all dimensions)
from sklearn.decomposition import PCA
projection = PCA(n_components=2).fit_transform(Z)
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "cluster":clusters.astype(str)})
fig, ax = plt.subplots(figsize=(6.5, 4.5))
sns.scatterplot(data=plot_df, x="PC1", y="PC2", hue="cluster", palette="tab10", alpha=.75, ax=ax)
ax.set_title(f"K-means clusters (k={best_k}) in a PCA view")
fig.tight_layout()
plot_df.head(12)`,"Can I see the discovered groups clearly in two dimensions?")
    ];
  }

  function hierarchicalRoute(config, value) {
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","inputs + plots",exploreCode(value, true),"What does my data look like?"),
      task("prepare","Prepare the data","scaled numeric sample",clusterPreprocessing() + `
# Hierarchical clustering is quadratic in memory, so every later step uses one reproducible sample.
sample_size = min(500, len(Z))
sample_index = np.random.default_rng(42).choice(len(Z), size=sample_size, replace=False)
analysis_Z = Z[sample_index]
analysis_rows = model_df.iloc[sample_index].copy()`,"What needs to be cleaned or transformed before measuring distances?"),
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
for k in range(2, max_k + 1):
    labels = AgglomerativeClustering(n_clusters=k, linkage="ward").fit_predict(analysis_Z)
    candidate_rows.append({"clusters":k, "silhouette":silhouette_score(analysis_Z, labels)})
candidate_scores = pd.DataFrame(candidate_rows)
fig, ax = plt.subplots(figsize=(6, 3.4))
sns.lineplot(data=candidate_scores, x="clusters", y="silhouette", marker="o", color="#7651a6", ax=ax)
ax.set_title("Choose a defensible dendrogram cut")
fig.tight_layout()
candidate_scores.round(3)`,"Which cut looks most useful for describing the sample?"),
      task("fit","Fit the hierarchy","Ward agglomeration",`# 6 · Fit the selected hierarchy
best_k = int(candidate_scores.loc[candidate_scores["silhouette"].idxmax(), "clusters"])
hierarchical = AgglomerativeClustering(n_clusters=best_k, linkage="ward")
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
ax.set_title(f"Hierarchical groups (k={best_k})")
fig.tight_layout()
plot_df.head(12)`,"Can I see the sampled groups clearly in two dimensions?")
    ];
  }

  function pcaRoute(config, value) {
    return [
      task("frame","Choose what to discover","target stays hidden",unsupervisedFrameCode(config, value),"What structure am I trying to discover without a target?"),
      task("explore","Explore the data","correlation + scale",`# 2 · Inspect redundancy before PCA
correlation = model_df[feature_names].corr()
fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(correlation, cmap="vlag", center=0, ax=ax)
ax.set_title("Correlation among continuous inputs")
fig.tight_layout()
model_df[feature_names].describe().T`,"What does my data look like, and which inputs overlap?"),
      task("prepare","Prepare the data","scaled numeric inputs",clusterPreprocessing(),"What needs to be cleaned or transformed?"),
      task("variance","Fit PCA and inspect explained variance","scree + cumulative variance",`# 4 · Fit PCA and inspect how much variance each component explains
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
pca = PCA(n_components=n_components_90).fit(Z)
pd.DataFrame({"original_dimensions":[Z.shape[1]], "selected_components":[n_components_90], "variance_retained":[pca.explained_variance_ratio_.sum()]}).round(4)`,"How many components should I keep while retaining at least 90% of the variance?"),
      task("loadings","Understand the component loadings","which inputs shape each axis",`# 6 · Connect the components back to the original inputs
loadings = pd.DataFrame(full_pca.components_.T, index=feature_names, columns=[f"PC{i}" for i in range(1, len(full_pca.components_) + 1)])
loading_view = loadings[["PC1", "PC2"]].copy()
loading_view["largest_absolute_loading"] = loading_view.abs().max(axis=1)
loading_view.sort_values("largest_absolute_loading", ascending=False).head(20).round(3)`,"Which original inputs contribute most to each principal component?"),
      task("project","Project the rows","labels only for interpretation",`# 7 · Project rows, then add labels only for interpretation
projection = full_pca.transform(Z)[:, :2]
reference_label = model_df[target_name].copy()
plot_df = pd.DataFrame({"PC1":projection[:,0], "PC2":projection[:,1], "reference":reference_label.to_numpy()})
fig, ax = plt.subplots(figsize=(6.6, 4.5), layout="constrained")
${config.task === "classification" ? `plot_df["reference"] = plot_df["reference"].astype(str)
sns.scatterplot(data=plot_df, x="PC1", y="PC2", hue="reference", alpha=.7, ax=ax)` : `points = ax.scatter(plot_df["PC1"], plot_df["PC2"], c=plot_df["reference"], cmap="viridis", alpha=.7)
fig.colorbar(points, ax=ax, label=target_name)`}
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
      const existing = cells.find(cell => cell.taskId === item.id);
      const previousIncomplete = routeTasks.slice(0, index).some(previous => cells.find(cell => cell.taskId === previous.id)?.status !== "done");
      const finalAlreadyUsed = item.id === "final" && testSetOpened;
      const blocked = !runtimeReady || previousIncomplete || finalAlreadyUsed;
      const button = document.createElement("button"); button.type = "button"; button.className = "route-card";
      button.style.setProperty("--stage-color", colorFor(index));
      button.dataset.state = existing?.status || "ready";
      button.disabled = blocked;
      button.title = !runtimeReady
        ? "Wait for the Python workspace to finish loading."
        : previousIncomplete
          ? "Run the earlier route steps first."
          : finalAlreadyUsed
            ? "The final test has already been used. Select Reset to start a new teaching run."
            : `${item.title} — ${item.caption}`;
      button.innerHTML = `<span class="route-number">${String(index + 1).padStart(2,"0")}</span><span><span class="route-title"></span><span class="route-caption"></span></span><span class="route-arrow">${existing?.status === "done" ? "✓" : "→"}</span>`;
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
    const cell = {id:`cell-${++cellSequence}`, number:cellSequence, taskId, label, stage:taskId || "custom", code, status:"ready", output:null};
    cells.push(cell);
    if (render) { renderNotebookView(); renderRoute(); }
    return cell;
  }

  function addRouteCell(item, render = true) {
    return addCell(item.code, item.title, item.id, render);
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
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "cell-action delete"; remove.textContent = "delete"; remove.addEventListener("click", () => { cells = cells.filter(value => value.id !== cell.id); renderNotebookView(); renderRoute(); updateSeal(); });
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
      input.addEventListener("input", () => { cell.code = input.value; updateLines(); });
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
    if (cell.stage === "final" && testSetOpened) { showToast("The final test has already been used. Select Reset to start again.", true); return; }
    if (!cell.code.trim() || cell.status === "running") return;
    const token = workspaceToken;
    cell.status = "running"; renderNotebookView(); renderRoute();
    $("#outputStatus").textContent = `${cell.label} · running`;
    try {
      const response = await sendWorker("run", {code:cell.code});
      if (token !== workspaceToken) return;
      cell.output = response.output; cell.status = response.output.status === "ok" ? "done" : "error";
      if (cell.stage === "final" && cell.status === "done") testSetOpened = true;
      if (response.output.charts?.length) latestChart = response.output.charts.at(-1);
      $("#outputStatus").textContent = `${cell.label} · ${cell.status === "done" ? "ready" : "Python error"}`;
    } catch (error) {
      if (token !== workspaceToken) return;
      cell.status = "error"; cell.output = {status:"error", error:error.message, charts:[]};
      $("#outputStatus").textContent = `${cell.label} · Python error`;
      showToast(error.message, true);
    }
    renderNotebookView(); renderRoute(); updateSeal();
  }

  async function runAll() {
    if (!runtimeReady) { showToast("Wait for the Python workspace to finish loading.", true); return; }
    const token = workspaceToken;
    for (const item of routeTasks) {
      if (token !== workspaceToken) return;
      let cell = cells.find(value => value.taskId === item.id);
      if (!cell) cell = addRouteCell(item, false);
      if (cell.status !== "done") await runCell(cell);
      if (token !== workspaceToken) return;
      if (cell.status === "error") break;
    }
  }

  function outputTitle(label, meta) {
    const row = document.createElement("div"); row.className = "output-title"; row.innerHTML = "<span></span><span></span>";
    row.children[0].textContent = label; row.children[1].textContent = meta; return row;
  }

  function renderOutputItem(cell) {
    const result = cell.output, item = document.createElement("article"); item.className = "output-item"; item.dataset.status = result.status;
    item.innerHTML = `<span class="output-number">${String(cell.number).padStart(2,"0")}</span><div class="output-item-head"><strong></strong><span>${result.status === "ok" ? "OK" : "ERROR"}</span></div>`;
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
    if (result.value) { item.append(outputTitle("Value", "Python expression")); const pre = document.createElement("pre"); pre.className = "console-output"; pre.textContent = result.value; item.append(pre); }
    if (result.stdout || result.stderr) { item.append(outputTitle("Console", result.stderr ? "stderr included" : "stdout")); const pre = document.createElement("pre"); pre.className = `console-output${result.stderr ? " error" : ""}`; pre.textContent = (result.stdout || "") + (result.stderr ? `\n${result.stderr}` : ""); item.append(pre); }
    if (!result.table && !result.charts?.length && !result.value && !result.stdout && !result.stderr) { const note = document.createElement("p"); note.className = "result-note"; note.textContent = "Cell ran successfully and updated the shared Python workspace."; item.append(note); }
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
      : "The saved 20% test set stays untouched until the final step. The one-use rule is a teaching safeguard: repeatedly checking it while changing a model turns it into another validation set.";
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
      setRuntimeReady(true, "Python ready · modelling workspace reset");
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
      $("#runtimeStatus").textContent = `Python ready · ${response.profile.missing} missing values in selected data`;
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
    foot.textContent = "Changing the dataset, feature scenario, model, or fold count rebuilds this workflow from the same source as the route above. The final test is intentionally one-use per setup: repeatedly checking it while changing a model turns it into another validation set. Reset starts a new teaching run.";
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

  $("#datasetSelect").addEventListener("change", event => loadDataset(event.target.value));
  $("#scenarioSelect").addEventListener("change", () => { void rebuildSetup({scenarioChanged:true}); });
  $("#modelSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#foldSelect").addEventListener("change", () => { void rebuildSetup(); });
  $("#exploreButton").addEventListener("click", addExplorationCell);
  $("#addCellButton").addEventListener("click", () => addCell());
  $("#runAllButton").addEventListener("click", runAll);
  $("#resetButton").addEventListener("click", () => clearNotebook());
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
})();
