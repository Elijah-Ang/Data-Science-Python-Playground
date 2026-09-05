import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "ml-app.js"), "utf8");

const window = {
  DataframeSerializerSource:fs.readFileSync(path.join(root,"table-serialization.py"),"utf8"), ScientificValidatorSource:fs.readFileSync(path.join(root,"scientific-validators.py"),"utf8"), __ML_TEST_MODE__: true,
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

// These deterministic two-feature fixtures exercise the optional, model-faithful
// decision-region branches without changing the compatible production route set.
const phase2bBoundaryScenario = {
  id: "phase2b-two-feature",
  name: "Two continuous features · boundary test fixture",
  continuous: ["radius_mean", "texture_mean"],
  binary: [],
  categorical: []
};
const phase2bFixtures = {};
for (const modelId of ["svm_cls", "lda", "qda"]) {
  const config = api.DATASETS.breast;
  const model = api.MODELS[modelId];
  phase2bFixtures[modelId] = {
    datasetId: "breast",
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
    scenarioId: phase2bBoundaryScenario.id,
    scenarioName: phase2bBoundaryScenario.name,
    scenario: phase2bBoundaryScenario,
    modelId,
    modelName: model.name,
    modelTask: model.task,
    cells: api.routeForSelection(config, phase2bBoundaryScenario, modelId, 5)
  };
}

// A deterministic PDF-only fixture protects the distinction between a
// continuous density and a probability.  At a narrow bell-curve centre the
// density is intentionally greater than 1, which is mathematically valid.
const phase2bGaussianDensityFixture = {
  observed: 0,
  mean: 0,
  variance: 0.001,
  expected_density: 1 / Math.sqrt(2 * Math.PI * 0.001)
};

const hiddenCodeFields = {
  setup:["setupCode", "hiddenSetupCode", "evidenceSetupCode", "teachingSetupCode"],
  evidence:["evidenceCode", "hiddenEvidenceCode", "teachingEvidenceCode", "diagnosticEvidenceCode"],
  advanced:["advancedCode", "advancedEvidenceCode", "diagnosticAdvancedCode"]
};
const fieldText = (cell, group) => {
  for (const field of hiddenCodeFields[group]) {
    if (typeof cell?.[field] === "string" && cell[field].trim()) return cell[field];
  }
  return "";
};
const lineCount = value => value ? String(value).split("\n").length : 0;
const codeSurface = cell => {
  const primary = String(cell?.code || "");
  const setup = fieldText(cell, "setup");
  const evidence = fieldText(cell, "evidence");
  const advanced = fieldText(cell, "advanced");
  const advancedBundle = advanced || [setup, evidence].filter(Boolean).join("\n\n");
  return {
    primaryLineCount:lineCount(primary),
    setupLineCount:lineCount(setup),
    evidenceLineCount:lineCount(evidence),
    advancedLineCount:lineCount(advancedBundle),
    applicationLineCount:lineCount([setup, evidence].filter(Boolean).join("\n\n")),
    hasSeparateEvidence:Boolean(evidence.trim()),
    primaryCode:primary,
    setupCode:setup,
    evidenceCode:evidence,
    advancedCode:advancedBundle
  };
};

const complexityReport = Object.fromEntries(
  Object.entries(routes).map(([folds, routeList]) => [folds, routeList.map(route => {
    const generatedSteps = api.routeComplexityReport(route.cells);
    return {
      datasetId: route.datasetId,
      scenarioId: route.scenarioId,
      modelId: route.modelId,
      steps: route.cells.map((cell, index) => {
        const surface = codeSurface(cell);
        return {
          ...(generatedSteps[index] || {}),
          taskId:cell.id,
          ...surface,
          lineCount:surface.primaryLineCount
        };
      })
    };
  })])
);

const complexitySummary = {};
for (const [folds, report] of Object.entries(complexityReport)) {
  for (const route of report) {
    const key = route.modelId;
    const summary = complexitySummary[key] || {
      modelId:key,
      routeCount:0,
      totalLines:0,
      maxLines:0,
      minLines:null,
      totalPrimaryLines:0,
      maxPrimaryLines:0,
      minPrimaryLines:null,
      totalAdvancedLines:0,
      maxAdvancedLines:0,
      minAdvancedLines:null,
      steps:{}
    };
    summary.routeCount += 1;
    for (const step of route.steps) {
      summary.totalLines += step.lineCount;
      summary.maxLines = Math.max(summary.maxLines, step.lineCount);
      summary.minLines = summary.minLines === null ? step.lineCount : Math.min(summary.minLines, step.lineCount);
      summary.totalPrimaryLines += step.primaryLineCount;
      summary.maxPrimaryLines = Math.max(summary.maxPrimaryLines, step.primaryLineCount);
      summary.minPrimaryLines = summary.minPrimaryLines === null ? step.primaryLineCount : Math.min(summary.minPrimaryLines, step.primaryLineCount);
      const advancedLines = step.advancedLineCount;
      summary.totalAdvancedLines += advancedLines;
      summary.maxAdvancedLines = Math.max(summary.maxAdvancedLines, advancedLines);
      summary.minAdvancedLines = summary.minAdvancedLines === null ? advancedLines : Math.min(summary.minAdvancedLines, advancedLines);
      const stepSummary = summary.steps[step.taskId] || {
        count:0,
        totalLines:0,
        maxLines:0,
        minLines:null,
        totalPrimaryLines:0,
        maxPrimaryLines:0,
        minPrimaryLines:null,
        totalAdvancedLines:0,
        maxAdvancedLines:0,
        minAdvancedLines:null
      };
      stepSummary.count += 1;
      stepSummary.totalLines += step.lineCount;
      stepSummary.maxLines = Math.max(stepSummary.maxLines, step.lineCount);
      stepSummary.minLines = stepSummary.minLines === null ? step.lineCount : Math.min(stepSummary.minLines, step.lineCount);
      stepSummary.totalPrimaryLines += step.primaryLineCount;
      stepSummary.maxPrimaryLines = Math.max(stepSummary.maxPrimaryLines, step.primaryLineCount);
      stepSummary.minPrimaryLines = stepSummary.minPrimaryLines === null ? step.primaryLineCount : Math.min(stepSummary.minPrimaryLines, step.primaryLineCount);
      stepSummary.totalAdvancedLines += advancedLines;
      stepSummary.maxAdvancedLines = Math.max(stepSummary.maxAdvancedLines, advancedLines);
      stepSummary.minAdvancedLines = stepSummary.minAdvancedLines === null ? advancedLines : Math.min(stepSummary.minAdvancedLines, advancedLines);
      summary.steps[step.taskId] = stepSummary;
    }
    complexitySummary[key] = summary;
  }
}
Object.values(complexitySummary).forEach(summary => {
  summary.averageLines = summary.routeCount ? Number((summary.totalLines / summary.routeCount).toFixed(2)) : 0;
  summary.averagePrimaryLines = summary.routeCount ? Number((summary.totalPrimaryLines / summary.routeCount).toFixed(2)) : 0;
  summary.averageAdvancedLines = summary.routeCount ? Number((summary.totalAdvancedLines / summary.routeCount).toFixed(2)) : 0;
  Object.values(summary.steps).forEach(step => {
    step.averageLines = step.count ? Number((step.totalLines / step.count).toFixed(2)) : 0;
    step.averagePrimaryLines = step.count ? Number((step.totalPrimaryLines / step.count).toFixed(2)) : 0;
    step.averageAdvancedLines = step.count ? Number((step.totalAdvancedLines / step.count).toFixed(2)) : 0;
  });
});
const primaryLineReport = Object.entries(complexityReport).flatMap(([folds, report]) =>
  report.flatMap(route => route.steps.map(step => ({
    folds:Number(folds),
    datasetId:route.datasetId,
    scenarioId:route.scenarioId,
    modelId:route.modelId,
    step:step.taskId,
    primaryLineCount:step.primaryLineCount,
    setupLineCount:step.setupLineCount,
    evidenceLineCount:step.evidenceLineCount,
    advancedLineCount:step.advancedLineCount,
    hasSeparateEvidence:step.hasSeparateEvidence
  })))
);

process.stdout.write(JSON.stringify({
  datasets: api.DATASETS,
  models: api.MODELS,
  oneRHelperSource: api.ONE_R_HELPER_SOURCE,
  dataFrameSerializerSource: api.DATAFRAME_SERIALIZER_SOURCE,
  practiceValidatorSource: api.PRACTICE_VALIDATOR_SOURCE,
  resetWorkspaceSource: api.RESET_WORKSPACE_SOURCE,
  workerSource: api.WORKER_SOURCE,
  phase2bFixtures,
  phase2bGaussianDensityFixture,
  complexityReport,
  complexitySummary,
  primaryLineReport,
  routes
}));
