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
try {
  new Function(api.WORKER_SOURCE);
} catch (error) {
  throw new Error(`Worker JavaScript is not valid: ${error.message}`);
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

console.log(JSON.stringify({
  edited_step:"prepare",
  invalidated_downstream:route.slice(3).map(item => item.id),
  rerun_starts_at:route[api.firstIncompleteRouteIndex(route, editedCells)].id,
  deletion_checked:true,
  custom_cell_unrestricted:true
}, null, 2));
