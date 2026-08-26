import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "ml-app.js"), "utf8");
const window = {__ML_TEST_MODE__:true, matchMedia:() => ({matches:false, addEventListener(){}})};
const context = {
  console: {log(){}, warn(){}, error(){}},
  window,
  document: {},
  setTimeout,
  clearTimeout,
  URL,
  Blob,
  Worker: class {},
  globalThis: null
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, {filename:path.join(root, "ml-app.js")});

const api = window.__ML_ROUTE_TEST_API__;
if (!api) throw new Error("ML route test API was not exposed.");
const closeEnough = (actual, expected, label) => {
  if (Math.abs(actual - expected) > 1e-10) throw new Error(`${label}: expected ${expected}, received ${actual}`);
};

const classificationRoute = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "logistic", 5);
if (classificationRoute.length !== 9) throw new Error("Classification teaching route does not contain nine guided steps.");
for (const step of classificationRoute) {
  if (!step.question || !step.readingCue) throw new Error(`Missing question/cue for supervised step ${step.id}.`);
}
const baseline = classificationRoute.find(step => step.id === "baseline");
const finalStep = classificationRoute.find(step => step.id === "final");
if (!baseline.metricMeta || baseline.metricMeta.direction !== "higher" || baseline.metricMeta.key !== "macro_f1") {
  throw new Error("Classification baseline metric metadata is incomplete.");
}
if (baseline.metricHelp.length !== 2 || !baseline.metricHelp.some(metric => metric.key === "accuracy")) {
  throw new Error("Classification metric teaching does not cover Macro F1 and accuracy.");
}
if (!finalStep.comparison || !finalStep.question.includes("cross-validation")) {
  throw new Error("Classification final step is not connected to prior CV evidence.");
}

const classificationTable = {
  columns:["fold", "train_macro_f1", "validation_macro_f1", "validation_accuracy"],
  rows:[[1, 0.96, 0.92, 0.94], [2, 0.95, 0.91, 0.93], [3, 0.97, 0.94, 0.95]]
};
const classificationSummary = api.cvSummaryFromTable(classificationTable, "classification", "random", "diagnosis");
closeEnough(classificationSummary.validationMean, (0.92 + 0.91 + 0.94) / 3, "classification validation mean");
closeEnough(classificationSummary.validationMin, 0.91, "classification validation minimum");
closeEnough(classificationSummary.validationMax, 0.94, "classification validation maximum");
closeEnough(classificationSummary.trainingMean, (0.96 + 0.95 + 0.97) / 3, "classification training mean");
closeEnough(classificationSummary.gap, classificationSummary.trainingMean - classificationSummary.validationMean, "classification gap");
if (classificationSummary.metric.direction !== "higher") throw new Error("Classification metric direction is wrong.");
const classificationFinal = api.finalComparisonFromTable(classificationSummary, {
  columns:["metric", "value"],
  rows:[["macro F1", 0.916], ["accuracy", 0.93], ["test rows", 114]]
});
if (!classificationFinal.insideRange || classificationFinal.finalTest !== 0.916) {
  throw new Error("Classification final-test comparison did not use the CV range correctly.");
}

const regressionRoute = api.routeForSelection(api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0], "simple_linear", 5);
const regressionBaseline = regressionRoute.find(step => step.id === "baseline");
if (regressionBaseline.metricMeta.direction !== "lower" || regressionBaseline.metricMeta.key !== "rmse") {
  throw new Error("Regression baseline metric metadata is incomplete.");
}
if (!regressionBaseline.metricHelp.some(metric => metric.key === "r2" && metric.text.includes("can be negative"))) {
  throw new Error("Regression R² teaching is incomplete.");
}
const regressionTable = {
  columns:["fold", "train_rmse", "validation_rmse", "validation_r2"],
  rows:[[1, 400, 450, 0.70], [2, 420, 500, 0.61], [3, 380, 430, 0.75]]
};
const regressionSummary = api.cvSummaryFromTable(regressionTable, "regression", "random", "Rented Bike Count");
closeEnough(regressionSummary.validationMean, (450 + 500 + 430) / 3, "regression validation mean");
closeEnough(regressionSummary.validationMin, 430, "regression validation minimum");
closeEnough(regressionSummary.validationMax, 500, "regression validation maximum");
closeEnough(regressionSummary.trainingMean, (400 + 420 + 380) / 3, "regression training mean");
closeEnough(regressionSummary.gap, regressionSummary.validationMean - regressionSummary.trainingMean, "regression gap");
if (regressionSummary.metric.direction !== "lower") throw new Error("Regression metric direction is wrong.");
const worseRegressionFinal = api.finalComparisonFromTable(regressionSummary, {
  columns:["metric", "value"],
  rows:[["RMSE", 520], ["MAE", 405], ["R²", 0.58], ["test rows", 10]]
});
if (worseRegressionFinal.insideRange || !worseRegressionFinal.interpretation.includes("worse")) {
  throw new Error("Regression final-test comparison did not identify a worse result.");
}
if (api.formatTeachingNumber(regressionSummary.validationMean) !== "460") {
  throw new Error("Teaching number formatting is not deterministic.");
}

const phase2aFixtures = {
  simple_linear:[api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0]],
  multiple_linear:[api.DATASETS.wine, api.DATASETS.wine.scenarios[1]],
  polynomial:[api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0]],
  regression_tree:[api.DATASETS.seoul, api.DATASETS.seoul.scenarios[1]],
  logistic:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  classification_tree:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  knn_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  one_r:[api.DATASETS.car, api.DATASETS.car.scenarios[0]]
};
const phase2aTokens = {
  simple_linear:["straight-line", "fitted line", "intercept"],
  multiple_linear:["additive", "other included features are kept fixed", "own unit"],
  polynomial:["bend", "fitted curve", "noise"],
  regression_tree:["if/then", "leaf", "Feature usage"],
  logistic:["score", "probabilities", "prepared feature scales"],
  classification_tree:["if/then", "actual and predicted class", "generalize"],
  knn_cls:["nearby prepared training examples", "out-of-fold", "cannot vote for itself"],
  one_r:["individual features", "exact fitted values", "majority baseline"]
};
for (const [modelId, [config, scenario]] of Object.entries(phase2aFixtures)) {
  const route = api.routeForSelection(config, scenario, modelId, 5);
  const diagnose = route.find(step => step.id === "diagnose");
  if (!diagnose.modelTeaching || diagnose.modelTeaching.modelId !== modelId) {
    throw new Error(`Missing Phase 2A model-specific teaching for ${modelId}.`);
  }
  const modelTeachingText = Object.values(diagnose.modelTeaching).join(" ");
  for (const token of phase2aTokens[modelId]) {
    if (!modelTeachingText.toLowerCase().includes(token.toLowerCase())) {
      throw new Error(`Phase 2A ${modelId} teaching is missing ${token}.`);
    }
  }
}
const outOfScopeRoute = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "svm_cls", 5);
if (outOfScopeRoute.find(step => step.id === "diagnose").modelTeaching !== null) {
  throw new Error("Phase 2A model-specific teaching leaked into an out-of-scope model.");
}

const seoulRoute = api.routeForSelection(api.DATASETS.seoul, api.DATASETS.seoul.scenarios[0], "simple_linear", 5);
const seoulBaseline = seoulRoute.find(step => step.id === "baseline");
if (!seoulBaseline.readingCue.includes("later time windows")) throw new Error("Seoul baseline cue does not describe ordered validation windows.");
const seoulSummary = api.cvSummaryFromTable(regressionTable, "regression", "time", "Rented Bike Count");
const seoulInterpretation = api.cvStabilityText(seoulSummary);
if (!seoulInterpretation.includes("ordered windows") || seoulInterpretation.includes("random folds")) {
  throw new Error("Seoul CV interpretation incorrectly treats time windows as random folds.");
}

const classificationHelp = api.metricHelpFor(api.DATASETS.breast, "baseline");
if (!classificationHelp.find(metric => metric.key === "accuracy").text.includes("fraction of predictions that were correct")) {
  throw new Error("Accuracy definition is missing its meaning.");
}
const finalRegressionHelp = api.metricHelpFor(api.DATASETS.gapminder, "final");
if (!finalRegressionHelp.find(metric => metric.key === "mae").text.includes("average absolute prediction error")) {
  throw new Error("MAE definition is missing at its first use.");
}

const conceptKeys = (route, step) => new Set(route.find(cell => cell.id === step).conceptKeys || []);
const conceptText = (route, step) => route.find(cell => cell.id === step).concepts.map(item => item.text).join(" ");
const requireConcepts = (route, step, expected) => {
  const actual = conceptKeys(route, step);
  for (const key of expected) if (!actual.has(key)) throw new Error(`Missing ${key} concept on ${step}.`);
};

const gapminderRoute = api.routeForSelection(api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0], "simple_linear", 5);
requireConcepts(gapminderRoute, "frame", ["feature", "target", "X", "y", "row"]);
if (!conceptText(gapminderRoute, "frame").includes("GDP per person") || !conceptText(gapminderRoute, "frame").includes("one country in 2007")) {
  throw new Error("Gapminder feature/target/row grounding is incomplete.");
}
requireConcepts(gapminderRoute, "split", ["training-data", "final-test-set", "80-20-split", "random-split", "random-state"]);
if (!conceptText(gapminderRoute, "split").includes("42 itself is not special")) throw new Error("random_state teaching is incomplete.");
requireConcepts(gapminderRoute, "prepare", ["preprocessing", "passthrough"]);

const breastKnnRoute = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "knn_cls", 5);
requireConcepts(breastKnnRoute, "prepare", ["scaling"]);
if (!conceptText(breastKnnRoute, "prepare").includes("compares distances")) throw new Error("KNN scaling reason is missing.");
requireConcepts(breastKnnRoute, "baseline", ["cross-validation", "fold", "cv-purpose", "final-test-exclusion", "shuffle", "stratified-folds"]);
if (!conceptText(breastKnnRoute, "baseline").includes("trains on 4 parts") || !conceptText(breastKnnRoute, "baseline").includes("final test set is not involved")) {
  throw new Error("Classification fold mechanics are incomplete.");
}
requireConcepts(breastKnnRoute, "model", ["pipeline", "fit", "predict"]);
if (!conceptText(breastKnnRoute, "model").includes("validation rows do not leak")) throw new Error("Pipeline leakage-prevention teaching is missing.");
requireConcepts(breastKnnRoute, "tune", ["hyperparameter", "learned-parameter", "model-hyperparameter", "GridSearchCV", "tuning", "final-test-exclusion"]);
if (!conceptText(breastKnnRoute, "tune").includes("n_neighbors (k)")) throw new Error("KNN hyperparameter teaching is missing.");

const penguinsMixedRoute = api.routeForSelection(api.DATASETS.penguins, api.DATASETS.penguins.scenarios.at(-1), "logistic", 5);
requireConcepts(penguinsMixedRoute, "prepare", ["column-transformer", "scaling", "categorical-encoding"]);
if (!conceptText(penguinsMixedRoute, "prepare").includes("ColumnTransformer applies") || !conceptText(penguinsMixedRoute, "prepare").includes("one-hot encode")) {
  throw new Error("Mixed ColumnTransformer teaching is incomplete.");
}

const candyBinaryRoute = api.routeForSelection(api.DATASETS.candy_class, api.DATASETS.candy_class.scenarios[0], "logistic", 5);
requireConcepts(candyBinaryRoute, "prepare", ["binary-features", "passthrough"]);
if (!conceptText(candyBinaryRoute, "prepare").includes("0/1 indicators")) throw new Error("Binary-feature handling teaching is missing.");

const carRoute = api.routeForSelection(api.DATASETS.car, api.DATASETS.car.scenarios[0], "naive_bayes", 5);
requireConcepts(carRoute, "prepare", ["categorical-encoding", "unknown-categories"]);
if (!conceptText(carRoute, "prepare").includes("one-hot encoding")) throw new Error("Categorical encoding teaching is missing.");
requireConcepts(carRoute, "tune", ["hyperparameter", "learned-parameter", "GridSearchCV", "tuning"]);

const categoricalOneRRoute = api.routeForSelection(api.DATASETS.car, api.DATASETS.car.scenarios[0], "one_r", 5);
requireConcepts(categoricalOneRRoute, "tune", ["hyperparameter", "learned-parameter", "keep-defaults"]);
if (conceptKeys(categoricalOneRRoute, "tune").has("GridSearchCV") || !conceptText(categoricalOneRRoute, "tune").includes("keeps the model's current/default settings")) {
  throw new Error("Pure-categorical One-R defaults teaching is incorrect.");
}

const seoulConceptRoute = api.routeForSelection(api.DATASETS.seoul, api.DATASETS.seoul.scenarios[0], "simple_linear", 10);
requireConcepts(seoulConceptRoute, "split", ["training-data", "final-test-set", "80-20-split", "chronological-split"]);
if (conceptKeys(seoulConceptRoute, "split").has("random-split") || conceptKeys(seoulConceptRoute, "split").has("random-state")) {
  throw new Error("Seoul split teaching incorrectly claims random splitting.");
}
requireConcepts(seoulConceptRoute, "baseline", ["cross-validation", "fold", "time-series-split", "ordered-validation"]);
if (conceptKeys(seoulConceptRoute, "baseline").has("shuffle") || conceptText(seoulConceptRoute, "baseline").includes("random folds")) {
  throw new Error("Seoul fold teaching incorrectly claims random folds.");
}
if (!conceptText(seoulConceptRoute, "baseline").includes("training window grows")) throw new Error("TimeSeriesSplit mechanics are incomplete.");

console.log(JSON.stringify({
  supervised_steps_checked:9,
  classification_summary:true,
  regression_summary:true,
  final_comparisons:true,
  seoul_time_series_wording:true,
  metric_definitions:true,
  feature_target_X_y:true,
  split_concepts:true,
  preprocessing_concepts:true,
  pipeline_fit_predict:true,
  cross_validation_mechanics:true,
  hyperparameter_tuning:true,
  phase2a_model_specific:true,
  preferred_vocabulary:true
}, null, 2));
