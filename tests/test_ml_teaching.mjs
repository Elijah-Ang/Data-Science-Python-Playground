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
const richDiagnosticCode = step => [step?.code, step?.setupCode, step?.evidenceCode, step?.advancedCode]
  .filter(value => typeof value === "string" && value.trim())
  .join("\n");

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
const phase2bFixtures = {
  svm_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  lda:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  qda:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  naive_bayes:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]]
};
const phase2bTokens = {
  svm_cls:["boundary", "margin", "support vectors", "C", "gamma"],
  lda:["class", "shared spread/shape", "straight decision boundaries"],
  qda:["separate spread/shape", "curve", "more data"],
  naive_bayes:["prior", "class-conditional density", "posterior", "independent"]
};
for (const [modelId, [config, scenario]] of Object.entries(phase2bFixtures)) {
  const route = api.routeForSelection(config, scenario, modelId, 5);
  const diagnose = route.find(step => step.id === "diagnose");
  if (!diagnose.modelTeaching || diagnose.modelTeaching.modelId !== modelId) {
    throw new Error(`Missing Phase 2B-1 model-specific teaching for ${modelId}.`);
  }
  const modelTeachingText = Object.values(diagnose.modelTeaching).join(" ");
  for (const token of phase2bTokens[modelId]) {
    if (!modelTeachingText.toLowerCase().includes(token.toLowerCase())) {
      throw new Error(`Phase 2B-1 ${modelId} teaching is missing ${token}.`);
    }
  }
  if (modelId === "qda") {
    const qdaCode = richDiagnosticCode(diagnose);
    for (const token of ["per-feature spread", "vary together within each class", "covariance/shape", "boundary can curve"]) {
      if (!qdaCode.toLowerCase().includes(token)) {
        throw new Error(`QDA precision wording is missing ${token}.`);
      }
    }
  }
  if (modelId === "naive_bayes") {
    for (const token of ["Class-conditional density", "quantity_value", "not the probability of one exact continuous value"]) {
      if (!richDiagnosticCode(diagnose).includes(token)) {
        throw new Error(`Gaussian Naive Bayes precision wording is missing ${token}.`);
      }
    }
    for (const token of ["estimated_probability", "probability_label", "Likelihood P(feature ≈ value | class)"]) {
      if (richDiagnosticCode(diagnose).includes(token)) {
        throw new Error(`Gaussian Naive Bayes still exposes ambiguous density terminology: ${token}.`);
      }
    }
  }
}
const neuralFixtures = {
  mlp_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  mlp_reg:[api.DATASETS.wine, api.DATASETS.wine.scenarios[0]]
};
const neuralCodeTokens = {
  mlp_cls:["mlp_architecture", "mlp_loss_curve", "mlp_fit_indices", "mlp_prediction_story", "predict_proba", "loss_curve_", "early_stopping", "Training loss during optimization", "Predicted probabilities by class"],
  mlp_reg:["mlp_architecture", "mlp_loss_curve", "mlp_fit_indices", "mlp_prediction_story", "loss_curve_", "regressor_", "scaled target", "transformed target space", "original target units", "absolute_error_original_units"]
};
const neuralBuildKeys = ["hidden-layer", "hidden-layer-sizes", "weights", "loss", "backpropagation", "alpha", "early-stopping", "max-iter"];
for (const [modelId, [config, scenario]] of Object.entries(neuralFixtures)) {
  const neuralRoute = api.routeForSelection(config, scenario, modelId, 5);
  const modelStep = neuralRoute.find(step => step.id === "model");
  const diagnoseStep = neuralRoute.find(step => step.id === "diagnose");
  if (!diagnoseStep.modelTeaching || diagnoseStep.modelTeaching.modelId !== modelId) {
    throw new Error(`Missing Phase 2B-2 model-specific teaching for ${modelId}.`);
  }
  for (const key of ["learned", "see", "read", "watchOut"]) {
    if (!diagnoseStep.modelTeaching[key].trim()) throw new Error(`Neural-network ${modelId} teaching is missing ${key}.`);
  }
  const buildKeys = new Set(modelStep.conceptKeys || []);
  for (const key of neuralBuildKeys) {
    if (!buildKeys.has(key)) throw new Error(`Neural-network ${modelId} build teaching is missing ${key}.`);
  }
  if (modelId === "mlp_reg" && !buildKeys.has("tol")) throw new Error("Neural-network regression build teaching is missing tol.");
  const buildText = modelStep.concepts.map(item => `${item.label} ${item.text}`).join(" ");
  for (const token of ["hidden_layer_sizes", "backpropagation", "alpha", "early_stopping", "max_iter"]) {
    if (!buildText.toLowerCase().includes(token.toLowerCase())) throw new Error(`Neural-network ${modelId} build copy is missing ${token}.`);
  }
  if (modelId === "mlp_reg" && !buildText.toLowerCase().includes("tol")) throw new Error("Neural-network regression build copy is missing tol.");
  if (modelId === "mlp_reg" && (!buildKeys.has("target-scaling") || !buildKeys.has("TransformedTargetRegressor") || !buildKeys.has("nested-parameter-routing") || !buildText.includes("TransformedTargetRegressor"))) {
    throw new Error("Neural-network regression build teaching is missing target-wrapper guidance.");
  }
  if (!modelStep.code.includes("early_stopping=True")) {
    throw new Error(`Ordinary ${modelId} route should retain built-in early stopping.`);
  }
  for (const token of neuralCodeTokens[modelId]) {
    if (!richDiagnosticCode(diagnoseStep).includes(token)) throw new Error(`Neural-network ${modelId} Step 8 is missing ${token}.`);
  }
  for (const token of ["X_test", "y_test", "test_prediction", "test_result", "coefs_", "intercept_", "np.matmul", "np.dot", "mlp_fit_indices", "mlp_oof_model", "named_steps"]) {
    if (diagnoseStep.code.includes(token)) throw new Error(`Neural-network ${modelId} exposes forbidden Step 8 plumbing: ${token}.`);
  }
  if (modelId === "mlp_reg") {
    for (const token of ["transformer_", "inverse_transform", "hasattr"]) {
      if (diagnoseStep.code.includes(token)) throw new Error(`Neural-network regression exposes wrapper internals: ${token}.`);
    }
  }
}

const gaussianRoute = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "naive_bayes", 5);
const gaussianPreparationAndModel = gaussianRoute
  .filter(step => step.id === "prepare" || step.id === "model")
  .map(step => step.code)
  .join("\n");
if (gaussianPreparationAndModel.includes("feature probabilities") || !gaussianPreparationAndModel.includes("class-conditional feature evidence/distributions")) {
  throw new Error("Gaussian Naive Bayes still has probability-only preprocessing/model copy.");
}

const seoulMlpRoute = api.routeForSelection(api.DATASETS.seoul, api.DATASETS.seoul.scenarios[0], "mlp_reg", 5);
const seoulMlpModel = seoulMlpRoute.find(step => step.id === "model");
const seoulMlpBuildText = seoulMlpModel.concepts.map(item => `${item.label} ${item.text}`).join(" ");
if (!seoulMlpModel.code.includes("early_stopping=False")) {
  throw new Error("Seoul MLP regression model construction must disable built-in early stopping.");
}
for (const token of ["disabled", "not time-aware", "outer TimeSeriesSplit", "normal convergence criterion"]) {
  if (!seoulMlpBuildText.toLowerCase().includes(token.toLowerCase())) {
    throw new Error(`Seoul MLP regression build teaching is missing ${token}.`);
  }
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

const previewPayload = {
  columns:["radius_mean", "texture_mean", "diagnosis"],
  rows:[[10.1, 12.2, "B"], [11.4, 15.8, "M"]]
};
const hiddenPreview = api.filterPreviewPayload(previewPayload, "diagnosis", true);
if (hiddenPreview.columns.includes("diagnosis") || hiddenPreview.rows.some(row => row.length !== 2) || hiddenPreview.rows[0][0] !== 10.1) {
  throw new Error("Unsupervised preview filtering did not remove only the reference target column.");
}
const restoredPreview = api.filterPreviewPayload(hiddenPreview, "diagnosis", false);
if (restoredPreview !== hiddenPreview || previewPayload.columns.length !== 3) {
  throw new Error("Preview filtering mutated cached data or failed its supervised no-filter path.");
}

const unsupervisedFixtures = {
  kmeans:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  hierarchical:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]]
};
const unsupervisedConceptRequirements = {
  kmeans:{
    frame:["cluster", "no_target_score", "cluster_label"],
    prepare:["distance", "scaling"],
    compare:["k", "inertia", "silhouette", "choice_not_truth"],
    fit:["centroid", "k", "choice_not_truth"],
    diagnose:["silhouette"],
    profile:["profile", "centroid"],
    visualise:["pca_projection"]
  },
  hierarchical:{
    frame:["cluster", "no_target_score", "cluster_label"],
    prepare:["distance", "scaling", "sampling"],
    dendrogram:["agglomerative", "ward", "leaves", "join", "merge_height", "horizontal_cut"],
    compare:["silhouette", "horizontal_cut", "choice_not_truth"],
    fit:["agglomerative", "horizontal_cut", "choice_not_truth"],
    profile:["profile", "sampling"],
    visualise:["pca_projection", "sampling"]
  }
};
for (const [modelId, [config, scenario]] of Object.entries(unsupervisedFixtures)) {
  const route = api.routeForSelection(config, scenario, modelId, 5);
  for (const step of route) {
    if (!step.question || !step.readingCue) throw new Error(`Missing Phase 3A question/cue for ${modelId}/${step.id}.`);
    for (const key of unsupervisedConceptRequirements[modelId][step.id] || []) {
      if (!step.conceptKeys.includes(key)) throw new Error(`Missing ${modelId} ${step.id} concept ${key}.`);
    }
  }
  const interpretationStep = route.find(step => step.id === (modelId === "kmeans" ? "diagnose" : "profile"));
  if (!interpretationStep.modelTeaching || interpretationStep.modelTeaching.modelId !== modelId) {
    throw new Error(`Missing model-specific teaching for ${modelId}.`);
  }
  const routeCode = route.map(step => step.code).join("\n");
  if (routeCode.includes(`"${config.target}"`) || routeCode.includes(`'${config.target}'`)) {
    throw new Error(`${modelId} route code references the hidden reference target.`);
  }
  if (!routeCode.includes("silhouette_suggestion") || routeCode.includes("selected_k = suggested_k") || !routeCode.includes("selected_k = min(3, max_k)")) {
    throw new Error(`${modelId} still makes silhouette argmax the automatic cluster-count decision.`);
  }
}
const hierarchicalRouteForText = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "hierarchical", 5);
const hierarchicalText = hierarchicalRouteForText.map(step => `${step.question} ${step.readingCue} ${step.concepts.map(item => item.text).join(" ")} ${Object.values(step.modelTeaching || {}).join(" ")}`).join(" ");
for (const token of ["Ward", "dissimilar", "horizontal", "sample", "PCA"]) {
  if (!hierarchicalText.toLowerCase().includes(token.toLowerCase())) throw new Error(`Hierarchical teaching is missing ${token}.`);
}

const pcaFixtures = {
  breast5:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  breast30:[api.DATASETS.breast, api.DATASETS.breast.scenarios[1]],
  penguins:[api.DATASETS.penguins, api.DATASETS.penguins.scenarios[0]],
  wine:[api.DATASETS.wine, api.DATASETS.wine.scenarios[1]]
};
const pcaConceptRequirements = {
  frame:["principal_component", "pc1", "pc2", "not_clustering", "reference_after_fit"],
  explore:["redundancy", "principal_component"],
  prepare:["pca_scaling"],
  variance:["explained_variance", "cumulative_variance", "scree", "ninety_rule"],
  select:["ninety_rule", "reduced_representation", "cumulative_variance"],
  loadings:["loading", "loading_magnitude", "loading_sign", "loading_sign_arbitrary", "score", "loading_vs_score"],
  project:["score", "loading_vs_score", "projection", "reference_after_fit", "pca_limitations"]
};
for (const [fixtureId, [config, scenario]] of Object.entries(pcaFixtures)) {
  const route = api.routeForSelection(config, scenario, "pca", 5);
  if (route.length !== 7 || route.map(step => step.id).join(",") !== "frame,explore,prepare,variance,select,loadings,project") {
    throw new Error(`PCA route structure is incomplete for ${fixtureId}.`);
  }
  for (const step of route) {
    if (!step.question || !step.readingCue) throw new Error(`Missing PCA question/cue for ${fixtureId}/${step.id}.`);
    for (const key of pcaConceptRequirements[step.id] || []) {
      if (!step.conceptKeys.includes(key)) throw new Error(`Missing PCA ${step.id} concept ${key} for ${fixtureId}.`);
    }
  }
  const project = route.find(step => step.id === "project");
  if (!project.modelTeaching || project.modelTeaching.modelId !== "pca") throw new Error(`Missing PCA model teaching for ${fixtureId}.`);
  for (const key of ["learned", "see", "read", "watchOut"]) {
    if (!project.modelTeaching[key]?.trim()) throw new Error(`PCA model teaching is missing ${key}.`);
  }
  const routeCode = route.map(step => step.code).join("\n");
  if (routeCode.toLowerCase().includes("information concentrate") || routeCode.includes("X_test") || routeCode.includes("y_test")) {
    throw new Error(`PCA route contains stale wording or supervised holdout concepts for ${fixtureId}.`);
  }
  const preProjectCode = route.filter(step => step.id !== "project").map(step => step.code).join("\n");
  if (preProjectCode.includes(`"${config.target}"`) || preProjectCode.includes(`'${config.target}'`)) {
    throw new Error(`PCA ${fixtureId} accesses the reference target before interpretation.`);
  }
  if (!project.code.includes(`"${config.target}"`) && !project.code.includes(`'${config.target}'`)) {
    throw new Error(`PCA ${fixtureId} does not include the post-fit reference-label interpretation.`);
  }
  if (!project.code.includes("component_scores = full_pca.transform(Z)") || !project.code.includes("PC1 (")) {
    throw new Error(`PCA ${fixtureId} does not teach row scores and actual projection variance.`);
  }
}
const pca30Route = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[1], "pca", 5);
const pca30Explore = pca30Route.find(step => step.id === "explore").code;
if (pca30Explore.includes("sns.heatmap") || !pca30Explore.includes("strongest_pairs") || !pca30Explore.includes("absolute_correlation") || !pca30Explore.includes("not the full correlation matrix")) {
  throw new Error("High-dimensional PCA does not use the compact unique-pair redundancy summary.");
}
const pcaVarianceCode = pca30Route.find(step => step.id === "variance").code;
if (!pcaVarianceCode.includes("Scree plot: variance explained by each component") || !pcaVarianceCode.includes("Cumulative variance retained") || !pcaVarianceCode.includes("PercentFormatter")) {
  throw new Error("PCA variance plots are missing precise variance labels or percentage formatting.");
}
if (pcaVarianceCode.includes("90% criterion") || pcaVarianceCode.includes("axhline(.90")) {
  throw new Error("PCA variance evidence still hard-codes the old 90% criterion.");
}
const pcaSelectCode = pca30Route.find(step => step.id === "select").code;
if (!pcaSelectCode.includes("variance_target = 0.90") || !pcaSelectCode.includes("components_for_target") || !pcaSelectCode.includes("variance_retained")) {
  throw new Error("PCA selection does not expose one active variance-target variable.");
}
if (pcaSelectCode.includes("components_for_90pct") || pcaSelectCode.includes("variance_retained_at_90pct")) {
  throw new Error("PCA selection still exposes fixed 90%-specific variable names.");
}
const pcaProjectCode = pca30Route.find(step => step.id === "project").code;
if (!pcaProjectCode.includes("{variance_target:.0%}") || pcaProjectCode.includes("selected by the 90% criterion")) {
  throw new Error("PCA projection does not use the active variance target in its narration.");
}
const pcaLoadingText = pca30Route
  .filter(step => ["frame", "loadings"].includes(step.id))
  .flatMap(step => step.concepts.map(item => item.text))
  .join(" ");
for (const token of ["weighted combination", "absolute loading", "opposite directions", "arbitrary as a whole"]) {
  if (!pcaLoadingText.toLowerCase().includes(token.toLowerCase())) throw new Error(`PCA loading teaching is missing ${token}.`);
}
const pcaProjectText = Object.values(pca30Route.find(step => step.id === "project").modelTeaching).join(" ");
for (const token of ["linear", "variance", "prediction usefulness", "later components"]) {
  if (!pcaProjectText.toLowerCase().includes(token.toLowerCase())) throw new Error(`PCA limitation teaching is missing ${token}.`);
}

const practiceFixtures = {
  logistic:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "logistic"],
  knn:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "knn_cls"],
  tree:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "classification_tree"],
  mlpClassification:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "mlp_cls"],
  mlpRegression:[api.DATASETS.wine, api.DATASETS.wine.scenarios[1], "mlp_reg"],
  seoulMlpRegression:[api.DATASETS.seoul, api.DATASETS.seoul.scenarios[1], "mlp_reg"],
  kmeans:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "kmeans"],
  hierarchical:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "hierarchical"],
  pca:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "pca"]
};
const requiredPracticeSteps = {
  logistic:["split", "model", "baseline", "tune", "diagnose", "final"],
  knn_cls:["split", "prepare", "model", "baseline", "tune", "diagnose", "final"],
  classification_tree:["split", "prepare", "model", "baseline", "tune", "diagnose", "final"],
  mlp_cls:["split", "prepare", "model", "baseline", "tune", "diagnose", "final"],
  mlp_reg:["split", "prepare", "model", "baseline", "tune", "diagnose", "final"],
  kmeans:["compare", "fit", "profile"],
  hierarchical:["compare", "fit", "profile"],
  pca:["variance", "select", "loadings", "project"]
};
for (const [fixtureName, [fixtureConfig, fixtureScenario, fixtureModel]] of Object.entries(practiceFixtures)) {
  const practiceRoute = api.routeForSelection(fixtureConfig, fixtureScenario, fixtureModel, 5);
  const practiceRouteAgain = api.routeForSelection(fixtureConfig, fixtureScenario, fixtureModel, 5);
  if (JSON.stringify(practiceRoute) !== JSON.stringify(practiceRouteAgain)) throw new Error(`Practice metadata is not deterministic for ${fixtureName}.`);
  for (const stepId of requiredPracticeSteps[fixtureModel]) {
    const step = practiceRoute.find(item => item.id === stepId);
    if (!step?.practice) throw new Error(`Missing Practice metadata for ${fixtureName}/${stepId}.`);
    for (const interaction of [step.practice.beforeRun, step.practice.decision]) {
      if (!interaction) continue;
      if (!interaction.prompt || !Array.isArray(interaction.options) || !interaction.options.some(option => option.value === "not_sure")) {
        throw new Error(`Practice interaction is not safely answerable for ${fixtureName}/${stepId}.`);
      }
    }
    const practiceText = JSON.stringify(step.practice);
    for (const forbidden of ["X_test", "y_test", "test_prediction", "test_result"]) {
      if (practiceText.includes(forbidden)) throw new Error(`Practice metadata exposes holdout plumbing for ${fixtureName}/${stepId}.`);
    }
    if (fixtureConfig.task === "classification" && fixtureModel === "pca" && practiceText.includes(fixtureConfig.target)) {
      throw new Error("PCA Practice metadata uses the hidden reference label.");
    }
    if (fixtureConfig.task === "regression" && fixtureModel === "pca" && practiceText.includes(fixtureConfig.target)) {
      throw new Error("Regression PCA Practice metadata uses the hidden reference target.");
    }
  }
  const codes = practiceRoute.map(step => step.code);
  const secondCodes = practiceRouteAgain.map(step => step.code);
  if (JSON.stringify(codes) !== JSON.stringify(secondCodes)) throw new Error(`Practice mode would change route Python for ${fixtureName}.`);
}
for (const modelId of ["kmeans", "hierarchical"]) {
  const comparePractice = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], modelId, 5).find(step => step.id === "compare").practice;
  if (comparePractice.decision.answer !== undefined || comparePractice.decision.options.length < 3) {
    throw new Error(`${modelId} candidate decision is incorrectly graded as one answer.`);
  }
}
const pcaPractice = pca30Route.find(step => step.id === "select").practice;
if (!pcaPractice.experiment || pcaPractice.experiment.find !== "variance_target = 0.90" || pcaPractice.experiment.replace !== "variance_target = 0.80" || pcaPractice.experiment.evidenceTaskId !== "select") {
  throw new Error("PCA Practice mode is missing its safe variance-criterion experiment.");
}
const pcaVariancePractice = pca30Route.find(step => step.id === "variance").practice;
if (!pcaVariancePractice.decision || !pcaVariancePractice.decision.prompt.includes("retained variance")) {
  throw new Error("PCA retention decision is not attached to the explained-variance evidence.");
}

// The route object has one learner-facing Python surface.  Evidence-builder
// code may travel alongside it, but it must not become the Guided code block
// or a Practice scaffold/reference solution.
const primaryCode = step => String(step.primaryCode ?? step.code ?? "");
const advancedCode = step => String(step.advancedCode || [step.setupCode, step.evidenceCode].filter(Boolean).join("\n\n") || "");
const primaryLineCount = code => String(code || "").split("\n").length;
const diagnosticRequirements = {
  simple_linear:["predict(", "coef_", "intercept_"],
  multiple_linear:["coef_"],
  polynomial:["predict(", "degree"],
  regression_tree:["plot_tree", "feature_importances_"],
  logistic:["coef_"],
  classification_tree:["plot_tree", "feature_importances_"],
  knn_cls:["kneighbors("],
  one_r:["OneRClassifier"],
  svm_cls:["decision_function(", "support_vectors_"],
  lda:["predict_proba(", "means_"],
  qda:["predict_proba(", "means_"],
  naive_bayes:["predict_proba(", ["class_prior_", "class_log_prior_"], ["theta_", "feature_log_prob_"]],
  mlp_cls:["predict_proba(", "hidden_layer_sizes", "loss_curve_", "n_iter_"],
  mlp_reg:["predict(", "hidden_layer_sizes", "loss_curve_", "n_iter_"]
};
const diagnosticFixtures = {
  simple_linear:[api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0]],
  multiple_linear:[api.DATASETS.wine, api.DATASETS.wine.scenarios[1]],
  polynomial:[api.DATASETS.gapminder, api.DATASETS.gapminder.scenarios[0]],
  regression_tree:[api.DATASETS.wine, api.DATASETS.wine.scenarios[0]],
  logistic:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  classification_tree:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  knn_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  one_r:[api.DATASETS.car, api.DATASETS.car.scenarios[0]],
  svm_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  lda:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  qda:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  naive_bayes:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  mlp_cls:[api.DATASETS.breast, api.DATASETS.breast.scenarios[0]],
  mlp_reg:[api.DATASETS.wine, api.DATASETS.wine.scenarios[1]]
};
for (const [modelId, [fixtureConfig, fixtureScenario]] of Object.entries(diagnosticFixtures)) {
  const route = api.routeForSelection(fixtureConfig, fixtureScenario, modelId, 5);
  const diagnose = route.find(step => step.id === "diagnose");
  if (!diagnose) throw new Error(`Missing Guided diagnostic task for ${modelId}.`);
  const learner = primaryCode(diagnose);
  if (primaryLineCount(learner) > 35) throw new Error(`${modelId} primary diagnostic exceeds 35 lines.`);
  for (const requirement of diagnosticRequirements[modelId]) {
    const found = Array.isArray(requirement) ? requirement.some(token => learner.includes(token)) : learner.includes(requirement);
    if (!found) throw new Error(`${modelId} primary diagnostic lost learner operation ${Array.isArray(requirement) ? requirement.join(" or ") : requirement}.`);
  }
  const evidenceBuilder = advancedCode(diagnose);
  if (evidenceBuilder) {
    if (evidenceBuilder === learner) throw new Error(`${modelId} advanced diagnostic code duplicates the learner surface.`);
    const practice = JSON.stringify({practice:diagnose.practice, solution:diagnose.practice?.exercise?.solution || ""});
    if (practice.includes(evidenceBuilder)) throw new Error(`${modelId} Practice metadata copied the advanced evidence builder.`);
    for (const token of ["fit_indices", "validation_indices", "named_steps", "meshgrid", "region_codes", "quantity_rows", "oof_model", "tree_transformed"]) {
      if (practice.includes(token)) throw new Error(`${modelId} Practice metadata exposes advanced diagnostic plumbing ${token}.`);
    }
  }
}
if (!source.includes("highlightPython(item.code)")) throw new Error("Guided workflow no longer renders the route's primary learner code.");
if (!source.includes("applyPracticeScaffold(item.code, exercise)")) throw new Error("Practice scaffolding no longer starts from the primary learner code.");
if (source.includes("advancedCode") && !/createElement\(["']details["']\)/.test(source)) {
  throw new Error("Optional advanced evidence code must have a collapsed disclosure when rendered.");
}

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
  phase2b1_model_specific:true,
  phase2b2_neural_networks:true,
  gaussian_nb_copy_precision:true,
  unsupervised_phase3a:true,
  target_isolation_preview:true,
  kmeans_choice_teaching:true,
  hierarchical_dendrogram_teaching:true,
  pca_teaching:true,
  pca_target_isolation:true,
  pca_large_feature_summary:true,
  pca_variance_and_loading_vocabulary:true,
  preferred_vocabulary:true,
  practice_metadata:true,
  practice_state_helpers:true,
  practice_holdout_safeguards:true,
  primary_vs_advanced_surface:true,
  diagnostic_operations_retained:true
}, null, 2));
