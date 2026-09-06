import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "ml-app.js"), "utf8");
const window = {DataframeSerializerSource:fs.readFileSync(path.join(root,"table-serialization.py"),"utf8"), ScientificValidatorSource:fs.readFileSync(path.join(root,"scientific-validators.py"),"utf8"), __ML_TEST_MODE__:true, matchMedia:() => ({matches:false, addEventListener(){}})};
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
try {
  new Function(api.WORKER_SOURCE);
} catch (error) {
  throw new Error(`Worker JavaScript is not valid: ${error.message}`);
}
for (const marker of [
  "baselineValues",
  "rawDataSnapshot",
  "__baseline_values_from_worker",
  "__raw_df_snapshot_from_worker",
  "__pd_from_worker",
  "__plt_from_worker",
  "__warnings_from_worker",
]) {
  if (!api.WORKER_SOURCE.includes(marker)) {
    throw new Error(`Worker does not protect ${marker} from learner mutations.`);
  }
}
if (!api.RESET_WORKSPACE_SOURCE.includes("globals().pop(\"__name\", None)")) {
  throw new Error("Reset does not remove its temporary __name helper.");
}
if (!api.RESET_WORKSPACE_SOURCE.includes("copy(deep=True)")) {
  throw new Error("Reset does not restore a deep copy of the pristine raw dataframe.");
}

const config = api.DATASETS.breast;
const scenario = config.scenarios[0];
const route = api.routeForSelection(config, scenario, "logistic", 5);
const makeCells = () => route.map(item => ({
  taskId:item.id,
  status:"done",
  output:{value:item.id},
  lastRunCode:`${item.id}-original`
}));

const editedCells = makeCells();
const invalidation = api.invalidateCellsFrom(route, editedCells, "prepare");
if (!invalidation.changed || invalidation.start !== 3) throw new Error("Editing a route cell did not identify its route position.");
if (editedCells.slice(0, 3).some(cell => cell.status !== "done" || !cell.output)) {
  throw new Error("Editing a route cell invalidated an earlier completed step.");
}
if (editedCells.slice(3).some(cell => cell.status !== "stale" || cell.output !== null)) {
  throw new Error("Editing a completed route cell did not stale and clear every downstream cell.");
}
if (api.routeButtonState(route, editedCells, 3).blocked) {
  throw new Error("The edited route step should remain runnable after it is marked stale.");
}
if (!api.routeButtonState(route, editedCells, 4).blocked) {
  throw new Error("A downstream route button remained enabled after an earlier edit.");
}

editedCells[3].status = "done";
editedCells[3].output = {value:"rerun"};
editedCells[3].lastRunCode = "prepare-edited";
if (editedCells.slice(4).some(cell => cell.status !== "stale" || cell.output !== null)) {
  throw new Error("Rerunning the changed step incorrectly marked downstream steps complete.");
}
if (api.firstIncompleteRouteIndex(route, editedCells) !== 4) {
  throw new Error("Run complete walkthrough did not start at the earliest stale step.");
}

const deletedCells = makeCells().filter(cell => cell.taskId !== "prepare");
api.invalidateCellsFrom(route, deletedCells, "prepare");
if (deletedCells.slice(3).some(cell => cell.status !== "stale" || cell.output !== null)) {
  throw new Error("Deleting an earlier route cell did not invalidate downstream state.");
}
if (!api.routeButtonState(route, deletedCells, 4).blocked) {
  throw new Error("A route button remained enabled after an earlier route cell was deleted.");
}

const customCells = [{taskId:null, status:"done", output:{value:"custom"}}];
if (api.invalidateCellsFrom(route, customCells, null).changed || customCells[0].status !== "done") {
  throw new Error("A custom cell unexpectedly invalidated the Suggested Route.");
}
const pristineOptional = {optionalEvidence:true, routeReferenceCode:"generated evidence", code:"generated evidence"};
if (!api.isTrustedOptionalCell(pristineOptional)) {
  throw new Error("Generated optional evidence was not recognised as trusted.");
}
if (api.isTrustedOptionalCell({...pristineOptional, code:"generated evidence\n# learner edit"})) {
  throw new Error("Edited optional evidence was still treated as trusted.");
}
if (api.isTrustedOptionalCell({optionalEvidence:false, routeReferenceCode:"generated evidence", code:"generated evidence"})) {
  throw new Error("A non-optional cell was treated as trusted evidence.");
}
if (!source.includes("!isTrustedOptionalCell(cell)")) {
  throw new Error("The direct cell runner does not invalidate edited optional evidence.");
}
if (!source.includes("cell.optionalEvidence && routeTasks.length")) {
  throw new Error("The editor shortcut does not invalidate edited optional evidence.");
}
if (!source.includes("testSetOpened = true")) {
  throw new Error("The final-test latch is missing from the shared run path.");
}

const identity = api.practiceRouteIdentity("breast", "continuous5", "knn_cls", 5);
if (identity !== "breast::continuous5::knn_cls::5") throw new Error("Practice route identity is not deterministic.");
if (identity === api.practiceRouteIdentity("breast", "continuous5", "knn_cls", 10)) throw new Error("Practice state identity ignores fold count.");
if (api.practiceStateKey(identity, "model") !== "breast::continuous5::knn_cls::5::model") {
  throw new Error("Practice state key does not include the route identity and step.");
}
const practiceModel = api.routeForSelection(config, scenario, "knn_cls", 5).find(item => item.id === "model").practice;
if (!practiceModel?.beforeRun || !practiceModel?.experiment) throw new Error("KNN practice metadata is incomplete.");
if (practiceModel.experiment.targetTaskId !== "model" || practiceModel.experiment.evidenceTaskId !== "baseline") {
  throw new Error("KNN experiment does not point from the model mutation to later CV evidence.");
}
if (api.normalizePracticeAnswer("less", practiceModel.beforeRun) !== "less" || api.normalizePracticeAnswer("not-a-choice", practiceModel.beforeRun) !== null) {
  throw new Error("Practice answer normalization accepted an invalid choice.");
}
const mutation = api.applyPracticeMutation(
  api.routeForSelection(config, scenario, "knn_cls", 5).find(item => item.id === "model").code,
  practiceModel.experiment
);
if (!mutation.changed || !mutation.code.includes("n_neighbors=9")) throw new Error("The KNN safe experiment did not produce its intended one-variable edit.");
if (api.applyPracticeMutation("model = KNeighborsClassifier()\nmodel = KNeighborsClassifier()", practiceModel.experiment).changed) {
  throw new Error("The safe experiment applied a non-unique edit.");
}
const experimentFixtures = [
  [api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "svm_cls", "model"],
  [api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "classification_tree", "model"],
  [api.DATASETS.wine, api.DATASETS.wine.scenarios[1], "mlp_reg", "tune"],
  [api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "kmeans", "fit"],
  [api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "hierarchical", "fit"],
  [api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "pca", "select"]
];
for (const [fixtureConfig, fixtureScenario, modelId, taskId] of experimentFixtures) {
  const route = api.routeForSelection(fixtureConfig, fixtureScenario, modelId, 5);
  const task = route.find(item => item.id === taskId);
  const experiment = api.safeExperimentForTask(fixtureConfig, fixtureScenario, modelId, taskId);
  const result = api.applyPracticeMutation(task.code, experiment);
  if (!result.changed) throw new Error(`Safe ${modelId}/${taskId} experiment does not match its route cell.`);
  if (!experiment.evidenceTaskId) throw new Error(`Safe ${modelId}/${taskId} experiment is missing its evidence target.`);
  const targetIndex = route.findIndex(item => item.id === (experiment.targetTaskId || taskId));
  const evidenceIndex = route.findIndex(item => item.id === experiment.evidenceTaskId);
  if (targetIndex < 0 || evidenceIndex < targetIndex) {
    throw new Error(`Safe ${modelId}/${taskId} experiment points to an invalid evidence step.`);
  }
}
const pcaRoute = api.routeForSelection(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "pca", 5);
const pcaSelect = pcaRoute.find(item => item.id === "select");
const pcaExperiment = pcaSelect.practice.experiment;
const pcaMutation = api.applyPracticeMutation(pcaSelect.code, pcaExperiment);
if (!pcaMutation.changed || !pcaMutation.code.includes("variance_target = 0.80") || pcaMutation.code.includes(">= .80")) {
  throw new Error("PCA experiment did not mutate the single active variance_target variable.");
}
if (pcaExperiment.targetTaskId !== "select" || pcaExperiment.evidenceTaskId !== "select") {
  throw new Error("PCA experiment does not target its edited select evidence step.");
}
if (api.practicePrediction("prediction", "Question", [{value:"yes", label:"Yes"}]).options.filter(option => option.value === "not_sure").length !== 1) {
  throw new Error("Practice predictions did not provide exactly one Not sure option.");
}

console.log(JSON.stringify({
  edited_step:"prepare",
  invalidated_downstream:route.slice(3).map(item => item.id),
  rerun_starts_at:route[api.firstIncompleteRouteIndex(route, editedCells)].id,
  deletion_checked:true,
  custom_cell_unrestricted:true,
  optional_evidence_pristine_guard:true,
  practice_identity:true,
  safe_experiment:true
}, null, 2));
