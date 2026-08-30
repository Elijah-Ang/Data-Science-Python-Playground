import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "ml-app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "ml.html"), "utf8");
const window = {__ML_TEST_MODE__:true, matchMedia:() => ({matches:false, addEventListener(){}})};
const context = {
  console: {log(){}, warn(){}, error(){}}, window, document:{}, setTimeout, clearTimeout,
  URL, Blob, Worker: class {}, globalThis:null
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, {filename:path.join(root, "ml-app.js")});
const api = window.__ML_ROUTE_TEST_API__;
if (!api) throw new Error("ML route test API was not exposed.");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const forbiddenHoldout = code => /\b(?:X_test|y_test|test_prediction|test_result)\b/.test(String(code || ""));

for (const id of ["guidedModeButton", "practiceModeButton", "runAllButton", "practiceModeNote"]) {
  assert(html.includes(`id="${id}"`), `Missing Practice control: ${id}`);
}
assert(source.includes("runAllButton.disabled = !runtimeReady || isPractice"), "Practice mode must disable Run Complete.");
assert(source.includes("Reference solution") && source.includes("clean-workflow reference"), "Reference reveal controls are missing.");
assert(source.includes("practiceStates.clear()") && source.includes("independentCheckpointState = null"), "Reset must clear Practice session state.");
for (const kind of ["model", "cv", "kmeans", "hierarchical", "pca_selection", "checkpoint_supervised", "checkpoint_kmeans", "checkpoint_hierarchical", "checkpoint_pca"]) {
  assert(api.PRACTICE_VALIDATOR_SOURCE.includes(`kind == "${kind}"`), `Missing semantic validator: ${kind}`);
}
assert(!forbiddenHoldout(api.PRACTICE_VALIDATOR_SOURCE), "Semantic validator source must not contain holdout names.");

const expectedExercises = {
  supervised:["model", "baseline"],
  kmeans:["fit"], hierarchical:["fit"], pca:["select"]
};
let routeCount = 0, exerciseCount = 0;
for (const config of Object.values(api.DATASETS)) for (const value of config.scenarios) for (const [modelId, model] of Object.entries(api.MODELS)) {
  if (!api.compatible(modelId, config, value)) continue;
  routeCount += 1;
  const route = api.routeForSelection(config, value, modelId, 5);
  const family = model.task === "unsupervised" ? modelId : "supervised";
  for (const taskId of expectedExercises[family]) {
    const task = route.find(item => item.id === taskId);
    const exercise = task?.practice?.exercise;
    assert(exercise, `Missing ${family}/${taskId} scaffold on ${config.name}/${value.name}/${modelId}`);
    for (const field of ["id", "type", "title", "prompt", "goal", "hint", "expectedOutput", "solution", "validation", "modelId", "taskId"]) {
      assert(String(exercise[field] || "").trim(), `Exercise ${modelId}/${taskId} is missing ${field}`);
    }
    assert(exercise.modelId === modelId && exercise.taskId === taskId, `Exercise identity drifted for ${modelId}/${taskId}`);
    assert(Array.isArray(exercise.required) && exercise.required.length, `Exercise ${modelId}/${taskId} lacks requirements`);
    assert(api.applyPracticeScaffold(task.code, exercise).changed, `Scaffold no longer matches ${modelId}/${taskId}`);
    const scaffold = api.applyPracticeScaffold(task.code, exercise);
    assert(scaffold.code.includes("TODO"), `Scaffold ${modelId}/${taskId} does not leave a visible task`);
    assert(!api.applyPracticeScaffold(scaffold.code, exercise).changed, `Scaffold ${modelId}/${taskId} can be applied twice`);
    assert(!forbiddenHoldout(exercise.solution), `Exercise solution exposes holdout code: ${modelId}/${taskId}`);
    exerciseCount += 1;
  }
  const practiceText = JSON.stringify(route.map(item => item.practice));
  if (model.task === "unsupervised") {
    assert(!practiceText.includes(config.target), `Unsupervised Practice metadata exposes ${config.target}`);
    assert(!route.some(item => /\b(?:y_train|y_test|X_test|test_prediction)\b/.test(item.code)), `Unsupervised route uses target/test variables`);
  }
  const experiments = route.flatMap(item => item.practice?.experiment ? [item.practice.experiment] : []);
  const positions = Object.fromEntries(route.map((item, index) => [item.id, index]));
  for (const experiment of experiments) {
    assert(positions[experiment.evidenceTaskId] >= positions[experiment.targetTaskId], `Experiment evidence points backward: ${modelId}`);
    assert(route[positions[experiment.targetTaskId]].code.includes(experiment.find), `Experiment no longer matches its target cell: ${modelId}`);
  }
  const checkpoint = api.independentCheckpointForRoute(config, value, modelId, 5);
  assert(checkpoint && checkpoint.id === "independent-checkpoint", `Missing independent checkpoint for ${modelId}`);
  for (const field of ["goal", "checklist", "availableVariables", "hint", "starterCode", "referenceSolution", "cleanReference", "validation"]) assert(checkpoint[field], `Checkpoint ${modelId} missing ${field}`);
  assert(!forbiddenHoldout(checkpoint.starterCode) && !forbiddenHoldout(checkpoint.referenceSolution) && !forbiddenHoldout(checkpoint.cleanReference), `Checkpoint ${modelId} exposes holdout code`);
  if (model.task === "unsupervised") assert(!checkpoint.referenceSolution.includes(config.target), `Checkpoint ${modelId} uses hidden target`);
}

const supervisedReference = api.cleanWorkflowReference(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "logistic", 5);
for (const token of ["X_train", "y_train", "Pipeline", "cross_validate", "best_pipeline"]) {
  assert(supervisedReference.includes(token), `Clean supervised reference is missing ${token}`);
}
assert(!forbiddenHoldout(supervisedReference), "Training-only clean reference must not open the holdout.");
const pcaReference = api.cleanWorkflowReference(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "pca", 5);
for (const token of ["PCA", "variance_target", "checkpoint_projection", "checkpoint_loadings"]) {
  assert(pcaReference.includes(token), `Clean PCA reference is missing ${token}`);
}

assert(routeCount === 127, `Expected 127 compatible setups, saw ${routeCount}`);
assert(exerciseCount > 0, "No scaffold exercises were generated.");
assert(JSON.stringify(api.independentCheckpointForRoute(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "logistic", 5)) === JSON.stringify(api.independentCheckpointForRoute(api.DATASETS.breast, api.DATASETS.breast.scenarios[0], "logistic", 5)), "Checkpoint metadata is not deterministic.");
console.log(JSON.stringify({compatibleSetups:routeCount, scaffoldExercises:exerciseCount, semanticValidators:"model · CV · clustering · PCA · checkpoint", holdoutSafe:true}));
