import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
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
const primaryCodeFor = task => String(task?.primaryCode ?? task?.code ?? "");
const advancedCodeFor = task => String(task?.advancedCode || [task?.setupCode, task?.evidenceCode].filter(Boolean).join("\n\n") || "");
const lineCount = code => String(code || "").split("\n").length;

// Step 8 is the learner's ordinary sklearn workflow.  These names belong to
// the optional evidence builder/worker and must not creep back onto that
// surface when a route is regenerated.
const step8Plumbing = {
  simple_linear:["named_steps", "diagnostic_actual.index", "np.atleast_1d", "np.ravel"],
  multiple_linear:["named_steps", "get_feature_names_out"],
  polynomial:["named_steps", "get_feature_names_out"],
  regression_tree:["children_left", "children_right", "tree_.feature", "tree_.threshold", "tree_transformed"],
  logistic:["named_steps", "get_feature_names_out"],
  classification_tree:["children_left", "children_right", "tree_.feature", "tree_.threshold", "tree_transformed"],
  knn_cls:["knn_fit_indices", "knn_self_neighbour_check", "knn_row_values", "knn_preparer"],
  one_r:["named_steps"],
  svm_cls:["svm_fit_indices", "svm_grid_x", "svm_grid_y", "svm_region_codes"],
  lda:["lda_fit_indices", "lda_fold_fitted", "lda_grid_x", "lda_grid_y", "lda_region_codes"],
  qda:["qda_fit_indices", "qda_grid_x", "qda_grid_y", "qda_region_codes"],
  naive_bayes:["nb_fit_indices", "nb_row_values", "nb_quantity_rows", "nb_encoder", "named_steps"],
  mlp_cls:["mlp_fit_indices", "mlp_oof_model", "named_steps", "coefs_", "np.matmul", "np.dot"],
  mlp_reg:["mlp_fit_indices", "mlp_oof_model", "named_steps", "coefs_", "np.matmul", "np.dot", "transformer_", "inverse_transform"]
};

// Execute the validator's source-only guard without importing pandas or
// scikit-learn.  This keeps the AST regression in the fast Node suite while
// exercising the same Python function used by the browser worker.
const validatorProbe = String.raw`
import ast
import json
import sys

payload = json.load(sys.stdin)
namespace = {"ast": ast}
exec(payload["source"], namespace, namespace)

def check(code):
    namespace["__cell_code"] = code
    return namespace["_practice_forbidden_source"]({"target": "quality"})

print(json.dumps({label: check(code) for label, code in payload["cases"].items()}))
`;
const validatorCases = {
  harmless_comment: `# inspect cluster quality
cluster_quality = silhouette_score(...)`,
  harmless_name: "cluster_quality = 0.8",
  harmless_prose: "print('cluster quality')",
  direct_target: 'df["quality"]',
  target_list_selection: 'model_df[["feature", "quality"]]',
  target_loc_selection: 'analysis_rows.loc[:, "quality"]'
};
assert(/ast\.(?:parse|walk|NodeVisitor)/.test(api.PRACTICE_VALIDATOR_SOURCE), "Target-free validator must inspect Python syntax with AST primitives.");
assert(!/\btarget\s+in\s+source\b/.test(api.PRACTICE_VALIDATOR_SOURCE), "Target-free validator must not reject raw target substrings.");
const validatorResult = spawnSync(process.env.PYTHON || "python3", ["-c", validatorProbe], {
  input:JSON.stringify({source:api.PRACTICE_VALIDATOR_SOURCE, cases:validatorCases}),
  encoding:"utf8"
});
assert(validatorResult.status === 0, `Target-free validator probe failed: ${validatorResult.stderr || validatorResult.error || validatorResult.stdout}`);
let validatorOut;
try { validatorOut = JSON.parse(validatorResult.stdout); } catch (error) { throw new Error(`Target-free validator probe returned invalid JSON: ${error.message}`); }
for (const label of ["harmless_comment", "harmless_name", "harmless_prose"]) {
  assert(validatorOut[label] === null, `Target-free validator rejected harmless ${label}: ${JSON.stringify(validatorOut[label])}`);
}
for (const label of ["direct_target", "target_list_selection", "target_loc_selection"]) {
  assert(validatorOut[label]?.ok === false, `Target-free validator accepted genuine target access ${label}: ${JSON.stringify(validatorOut[label])}`);
}

// Warning capture is deliberately broad (so learner warnings remain visible)
// and the expected fold-local unknown-category warning remains explainable.
assert(api.WORKER_SOURCE.includes("catch_warnings(record=True)"), "Worker warning capture was removed.");
assert(api.WORKER_SOURCE.includes('simplefilter("always")'), "Worker warning capture no longer keeps warnings visible.");
assert(!/filterwarnings\s*\(\s*["']ignore|simplefilter\s*\(\s*["']ignore/i.test(api.WORKER_SOURCE), "Worker must not globally suppress warnings.");
assert(/handle_unknown=\\?"ignore\\?"/.test(source), "Fold-local OneHotEncoder unknown-category handling disappeared.");
assert(api.warningExplanation({category:"UserWarning", message:"OneHotEncoder found unknown category during transform"}).toLowerCase().includes("unknown-category"), "Unknown-category warning explanation disappeared.");
for (const deprecatedCall of [/\.get_cmap\s*\(/, /register_cmap\s*\(/, /matplotlib\.cm\.get_cmap\s*\(/]) {
  assert(!deprecatedCall.test(source), `Known Matplotlib deprecated call remains: ${deprecatedCall}`);
}

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

// Audit both fold settings and every compatible route.  This is deliberately
// separate from the scaffold loop above: a Practice solution must stay on the
// same concise primary cell even when evidence construction is retained in a
// hidden/advanced bundle.
let primaryAuditRoutes = 0;
for (const folds of [5, 10]) for (const config of Object.values(api.DATASETS)) for (const value of config.scenarios) for (const [modelId, model] of Object.entries(api.MODELS)) {
  if (!api.compatible(modelId, config, value)) continue;
  primaryAuditRoutes += 1;
  if (model.task === "unsupervised") continue;
  const route = api.routeForSelection(config, value, modelId, folds);
  const diagnose = route.find(item => item.id === "diagnose");
  assert(diagnose, `Missing Step 8 diagnostic on ${config.name}/${value.name}/${modelId}/${folds}`);
  const primary = primaryCodeFor(diagnose);
  assert(primary.trim(), `Empty primary Step 8 code on ${config.name}/${value.name}/${modelId}/${folds}`);
  assert(lineCount(primary) <= 35, `Primary Step 8 remains over the 35-line hard maximum on ${config.name}/${value.name}/${modelId}/${folds}: ${lineCount(primary)} lines`);
  for (const token of step8Plumbing[modelId] || []) {
    assert(!primary.includes(token), `Primary ${modelId} Step 8 exposes diagnostic-only plumbing ${token} on ${config.name}/${value.name}/${folds}`);
  }
  const advanced = advancedCodeFor(diagnose);
  if (advanced) {
    assert(advanced !== primary, `Advanced diagnostic bundle duplicates the primary Step 8 cell on ${config.name}/${value.name}/${modelId}/${folds}`);
    const exercise = diagnose.practice?.exercise;
    const visiblePractice = JSON.stringify({practice:diagnose.practice, solution:exercise?.solution || ""});
    for (const token of step8Plumbing[modelId] || []) {
      assert(!visiblePractice.includes(token), `Practice scaffold/reference exposes advanced ${modelId} plumbing ${token}`);
    }
    assert(!visiblePractice.includes(advanced), `Practice scaffold/reference copied the advanced diagnostic bundle for ${modelId}`);
  }
}
assert(primaryAuditRoutes === 254, `Primary Step 8 audit covered ${primaryAuditRoutes} routes instead of 254.`);

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
