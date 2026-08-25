import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "ml-app.js"), "utf8");

const window = {
  __ML_TEST_MODE__: true,
  matchMedia: () => ({matches:false, addEventListener(){}})
};
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

const routes = {};
for (const folds of [5, 10]) {
  routes[String(folds)] = [];
  for (const [datasetId, config] of Object.entries(api.DATASETS)) {
    for (const scenario of config.scenarios) {
      for (const [modelId, model] of Object.entries(api.MODELS)) {
        if (!api.compatible(modelId, config, scenario)) continue;
        const cells = api.routeForSelection(config, scenario, modelId, folds);
        routes[String(folds)].push({
          datasetId,
          datasetName: config.name,
          dataset: {
            file: config.file,
            sep: config.sep,
            prepare: config.prepare,
            target: config.target,
            task: config.task,
            split: config.split,
            missing: config.missing,
            binaryNumeric: config.binaryNumeric || []
          },
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          scenario: {
            continuous: scenario.continuous,
            binary: scenario.binary,
            categorical: scenario.categorical
          },
          modelId,
          modelName: model.name,
          modelTask: model.task,
          cells
        });
      }
    }
  }
}

process.stdout.write(JSON.stringify({
  datasets: api.DATASETS,
  models: api.MODELS,
  oneRHelperSource: api.ONE_R_HELPER_SOURCE,
  dataFrameSerializerSource: api.DATAFRAME_SERIALIZER_SOURCE,
  resetWorkspaceSource: api.RESET_WORKSPACE_SOURCE,
  routes
}));
