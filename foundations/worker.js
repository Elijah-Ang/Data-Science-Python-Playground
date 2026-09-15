/* Runs inside the site's shared createPythonBridge worker transport. */
let runtimePromise;
const loaded = new Set();
async function packages(py, config, code='') {
  const plotting=config.plotting || /\b(?:matplotlib|seaborn|plt|sns)\b/.test(code);
  const scaling=config.scaling || /\bsklearn\b/.test(code);
  if(plotting && !loaded.has('plotting')) {
    postMessage({type:'status',message:'Adding plotting tools…'});
    await py.loadPackage(['matplotlib','scipy','micropip']);
    py.globals.set('_seaborn_requirement',config.seaborn);
    await py.runPythonAsync('import micropip\nawait micropip.install(_seaborn_requirement)');
    await py.runPythonAsync('_ensure_plotting()');
    loaded.add('plotting');
  }
  if(scaling && !loaded.has('scaling')) {
    postMessage({type:'status',message:'Adding scaling tools…'});
    await py.loadPackage('scikit-learn');
    loaded.add('scaling');
  }
}
async function runtime(config) {
  if (!runtimePromise) runtimePromise = (async () => {
    postMessage({type:'status', message:'Loading Python and pandas…'});
    importScripts(config.indexURL + 'pyodide.js');
    const py = await loadPyodide({indexURL:config.indexURL});
    await py.loadPackage('pandas');
    await py.runPythonAsync(config.source);
    return py;
  })().catch(error => {runtimePromise=null;loaded.clear();throw error;});
  return runtimePromise;
}
onmessage = async ({data}) => {
  try {
    const py = await runtime(data.config);
    await packages(py,{...data.config,plotting:data.config.plotting||data.request?.exercise.target==='plot'},(data.request?.code||'')+'\n'+(data.request?.exercise.solution||''));
    postMessage({type:'status',message:'Python ready · runs on your device'});
    if (data.type === 'init') {postMessage({id:data.id,ok:true,packages:Object.keys(py.loadedPackages)});return;}
    py.globals.set('_foundation_request',JSON.stringify(data.request));
    const response = await py.runPythonAsync('json.dumps(run_foundation(json.loads(_foundation_request)))');
    postMessage({id:data.id,ok:true,result:JSON.parse(response)});
  } catch (error) {postMessage({id:data.id,ok:false,error:String(error)});}
};
