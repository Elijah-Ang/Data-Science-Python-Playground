/* A receipt is JSON only. No PyProxy, fitted model, or learner namespace survives Run. */
let runtimePromise;
const loadedFiles = new Set();
async function runtime(config) {
  if (!runtimePromise) runtimePromise = (async () => {
    postMessage({type:'status',message:'Loading Python and machine-learning tools…'});
    importScripts(config.indexURL+'pyodide.js');
    const py = await loadPyodide({indexURL:config.indexURL});
    await py.loadPackage(['numpy','pandas']);
    py.FS.writeFile('/ml_helpers.py', config.oneR);
    await py.runPythonAsync(config.source);
    await py.runPythonAsync('import os, sys\nsys.path.insert(0, "/")\nos.chdir("/")');
    return py;
  })().catch(error=>{runtimePromise=null;loadedFiles.clear();throw error;});
  return runtimePromise;
}
onmessage = async ({data}) => {
  try {
    const started=performance.now();
    const py = await runtime(data.config);
    const baseReady=performance.now();
    if(data.type!=='init'){
      // Metadata covers setup and the reference. Learner imports may ask for more.
      await py.loadPackage(data.request.exercise.packages || ['scikit-learn','matplotlib']);
      try { await py.loadPackagesFromImports(data.request.code || ''); }
      catch(error){if(!String(error).includes('SyntaxError'))throw error;}
      if(py.loadedPackages['scikit-learn'])await py.runPythonAsync('import ml_helpers');
      if(py.loadedPackages.matplotlib)await py.runPythonAsync('import matplotlib\nmatplotlib.use("Agg")');
    }
    const packagesReady=performance.now();
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
    postMessage({id:data.id,ok:true,result,timings:{baseMs:baseReady-started,activityPackagesMs:packagesReady-baseReady,executionMs:performance.now()-packagesReady}});
  } catch(error){postMessage({id:data.id,ok:false,error:String(error)});}
};
