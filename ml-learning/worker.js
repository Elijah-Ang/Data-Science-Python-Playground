/* A receipt is JSON only. No PyProxy, fitted model, or learner namespace survives Run. */
let runtimePromise;
const loadedFiles = new Set();
async function runtime(config) {
  if (!runtimePromise) runtimePromise = (async () => {
    postMessage({type:'status',message:'Loading Python and machine-learning tools…'});
    importScripts(config.indexURL+'pyodide.js');
    const py = await loadPyodide({indexURL:config.indexURL});
    await py.loadPackage(['numpy','pandas','scikit-learn','scipy','matplotlib']);
    py.FS.writeFile('/ml_helpers.py', config.oneR);
    await py.runPythonAsync(config.source);
    await py.runPythonAsync('import os, sys\nsys.path.insert(0, "/")\nimport ml_helpers\nos.chdir("/")');
    return py;
  })().catch(error=>{runtimePromise=null;loadedFiles.clear();throw error;});
  return runtimePromise;
}
onmessage = async ({data}) => {
  try {
    const py = await runtime(data.config);
    for (const [name,text] of Object.entries(data.files || {})) {
      if (loadedFiles.has(name)) continue;
      py.FS.mkdirTree('/'+name.split('/').slice(0,-1).join('/'));
      py.FS.writeFile('/'+name,text);loadedFiles.add(name);
    }
    if(data.type==='init'){postMessage({id:data.id,ok:true,packages:Object.keys(py.loadedPackages)});return;}
    py.globals.set('_learning_request_json',JSON.stringify(data.request));
    let result;
    try {
      // Python returns a string, never a model/dataframe proxy.
      const serialized=await py.runPythonAsync('json.dumps(run_learning(json.loads(_learning_request_json)), allow_nan=False)');
      result=JSON.parse(serialized);
    } finally {
      py.globals.delete('_learning_request_json');
      // User-generated files are transient; bundled inputs are retained once.
      await py.runPythonAsync('import gc\ngc.collect()\nNone');
    }
    postMessage({id:data.id,ok:true,result});
  } catch(error){postMessage({id:data.id,ok:false,error:String(error)});}
};
