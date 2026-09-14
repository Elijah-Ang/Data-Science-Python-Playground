/* Runs inside the site's shared createPythonBridge worker transport. */
let runtimePromise;
async function runtime(config) {
  if (!runtimePromise) runtimePromise = (async () => {
    postMessage({type:'status', message:'Loading Python…'});
    importScripts(config.indexURL + 'pyodide.js');
    const py = await loadPyodide({indexURL:config.indexURL});
    postMessage({type:'status', message:'Loading pandas and plotting tools…'});
    await py.loadPackage(['pandas','matplotlib','scipy','scikit-learn','micropip']);
    py.globals.set('_seaborn_requirement',config.seaborn);
    await py.runPythonAsync('import micropip\nawait micropip.install(_seaborn_requirement)');
    await py.runPythonAsync(config.source);
    postMessage({type:'status', message:'Python ready · runs on your device'});
    return py;
  })().catch(error => {runtimePromise=null; throw error;});
  return runtimePromise;
}
onmessage = async ({data}) => {
  try {
    const py = await runtime(data.config);
    if (data.type === 'init') {postMessage({id:data.id,ok:true});return;}
    py.globals.set('_foundation_request',JSON.stringify(data.request));
    const response = await py.runPythonAsync('json.dumps(run_foundation(json.loads(_foundation_request)))');
    postMessage({id:data.id,ok:true,result:JSON.parse(response)});
  } catch (error) {postMessage({id:data.id,ok:false,error:String(error)});}
};
