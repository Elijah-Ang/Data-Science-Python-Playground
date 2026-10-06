import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../ml-learning/worker.js',import.meta.url),'utf8');
const packageCalls=[],pythonCalls=[],messages=[],values=new Map();
let installs=0,failInstall=false;
const py={loadedPackages:{},FS:{writeFile(){},mkdirTree(){}},globals:{set:(key,value)=>values.set(key,value),delete:key=>values.delete(key)},
  async loadPackage(packages){assert(!packages.includes('seaborn'));packageCalls.push(packages);for(const name of packages)this.loadedPackages[name]=true;},
  async loadPackagesFromImports(){},
  async runPythonAsync(code){pythonCalls.push(code);if(code.includes('micropip.install')){installs++;if(failInstall){failInstall=false;throw Error('temporary wheel error');}}if(code.includes('json.dumps(run_learning'))return JSON.stringify({checks:[],retainedPythonObjects:0});return undefined;}
};
const context={postMessage:message=>messages.push(message),performance:{now:()=>0},importScripts(){},loadPyodide:async()=>py};
vm.createContext(context);vm.runInContext(source,context);
const config={indexURL:'https://example.test/pyodide/',oneR:'',source:'import json',seaborn:'https://example.test/wheels/seaborn.whl'};
const run=async(id,packages,code)=>{await context.onmessage({data:{id,type:'run',config,files:{},request:{exercise:{packages},code}}});return messages.findLast(message=>message.id===id);};
assert((await run('plain',['numpy'],'answer=1')).ok);assert.equal(installs,0);
failInstall=true;assert(!(await run('first-plot',['matplotlib','seaborn'],'import seaborn as sns')).ok);assert(!values.has('_learning_seaborn_requirement'));
assert((await run('retry-plot',['matplotlib','seaborn'],'import seaborn as sns')).ok);assert.equal(installs,2);
assert((await run('another-plot',['matplotlib','seaborn'],'from seaborn import scatterplot')).ok);assert.equal(installs,2);assert(!values.has('_learning_request_json'));
// A fresh worker learns about an additional learner import even when the
// authored exercise's metadata only needs a numerical package.
const learnerMessages=[];const learner={...context,postMessage:message=>learnerMessages.push(message)};
vm.createContext(learner);vm.runInContext(source,learner);
await learner.onmessage({data:{id:'learner-import',type:'run',config,files:{},request:{exercise:{packages:['numpy']},code:'from seaborn.axisgrid import FacetGrid'}}});
assert(learnerMessages.findLast(message=>message.id==='learner-import').ok);assert.equal(installs,3);
assert(!values.has('_learning_seaborn_requirement'));assert(!values.has('_learning_request_json'));
console.log('ML worker: lazy wheel installation, metadata/import detection, retry, one install per worker, transient globals and receipt-only output passed.');
