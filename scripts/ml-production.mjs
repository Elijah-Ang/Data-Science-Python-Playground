import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Read the same supported test interface used by the production route audits.
export function productionInventory() {
  const window = {__ML_TEST_MODE__:true, matchMedia:()=>({matches:false, addEventListener(){}})};
  const context = {window, document:{}, console:{log(){},warn(){},error(){}}, setTimeout, clearTimeout, URL, Blob, Worker:class {}};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'ml-app.js'),'utf8'),context);
  return window.__ML_ROUTE_TEST_API__;
}
