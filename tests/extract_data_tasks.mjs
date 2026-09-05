import fs from 'node:fs'; import vm from 'node:vm';
const source=fs.readFileSync('playground.html','utf8');
const constants=source.slice(source.indexOf('    const DATASET_ICONS'),source.indexOf('    const PYODIDE_INDEX_URL'));
const funcs=source.slice(source.indexOf('    function formatTaskCode'),source.indexOf('    function renderDatasetMeta'));
const profiles=JSON.parse(fs.readFileSync('tests/data-profiles.json','utf8'));
const sandbox={profiles, window:{DataRuntimeSource:fs.readFileSync("table-serialization.py","utf8")+"\n"+fs.readFileSync("data-runtime.py","utf8")}}; vm.createContext(sandbox);
vm.runInContext(constants+'\n'+funcs+'\nglobalThis.result={setup:PYTHON_SETUP_SOURCE,datasets:Object.fromEntries(Object.entries(DATASETS).map(([id,config])=>[id,{config,tasks:buildTasks(profiles[id],id)}]))};',sandbox);
fs.writeFileSync('/tmp/dspp-data-tasks.json',JSON.stringify(sandbox.result));
