/* Loaded through the existing serial Python bridge. Runtime URLs are supplied by app.js. */
let pyodide;
async function boot() {
  if (pyodide) return;
  self.postMessage({type:'status', message:'Loading pinned Python runtime…'});
  importScripts(RUNTIME + 'pyodide.js');
  const runtime = await loadPyodide({indexURL:RUNTIME});
  self.postMessage({type:'status', message:'Loading statistics packages…'});
  await runtime.loadPackage(['numpy', 'pandas', 'scipy', 'matplotlib']);
  await runtime.loadPackage(['patsy','statsmodels']);
  // Every chart runs in a worker without a DOM, including the first selected route.
  await runtime.runPythonAsync("import matplotlib\nmatplotlib.use('Agg')");
  await runtime.runPythonAsync(ENGINE);
  await runtime.runPythonAsync(PROPORTIONS);
  await runtime.runPythonAsync(NOTEBOOK);
  pyodide = runtime;
  self.postMessage({type:'status', message:'Pyodide 0.26.4 ready'});
}
self.onmessage = async ({data}) => {
  try {
    await boot();
    if (data.type === 'init') {
      const metadata = pyodide.runPython('json.dumps({"families": FAMILIES, "numeric": NUMERIC, "categorical": CATEGORICAL, "sources": SOURCES})');
      self.postMessage({id:data.id, ok:true, metadata:JSON.parse(metadata)});
      return;
    }
    if(data.type==='configure' || data.type==='cell') {
      pyodide.globals.set('_notebook_request',JSON.stringify(data));
      const payload=await pyodide.runPythonAsync("_r=json.loads(_notebook_request)\nnotebook_request(_r['type'], _r.get('csv',''), _r.get('config',{}), _r.get('index',0), _r.get('code',''), _r.get('advanced',''))");
      self.postMessage({id:data.id,ok:true,...JSON.parse(payload)});return;
    }
    pyodide.globals.set('_request_csv', data.csv);
    pyodide.globals.set('_request_config', JSON.stringify(data.config));
    pyodide.globals.set('_request_run', data.type === 'run');
    const payload = await pyodide.runPythonAsync('handle(_request_csv, json.loads(_request_config), _request_run)');
    self.postMessage({id:data.id, ok:true, ...JSON.parse(payload)});
  } catch (error) {
    self.postMessage({id:data.id, ok:false, error:String(error)});
  }
};
