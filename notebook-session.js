/* On-device code drafts. Runtime evidence is never restored as current. */
window.NotebookSession = (() => {
  let adapter, activeKey, timer, deleted, savingFailed = false;
  const prefix = 'dspp-notebook-v1:';
  const clone = value => JSON.parse(JSON.stringify(value));
  function save() {
    if (!adapter || adapter.persist === false || !activeKey) return true;
    try {
      const snapshot = adapter.get();
      const draft = {...snapshot, cells:snapshot.cells.map(({output, ...cell}) => ({...cell, output:null, status:'ready', lastRunCode:null})), savedAt:new Date().toISOString()};
      localStorage.setItem(prefix + activeKey, JSON.stringify(draft));
      savingFailed = false;
      return true;
    } catch {
      savingFailed = true;
      const note=document.querySelector('.draft-policy');
      if(note) {note.textContent='This device could not save the draft. Changes may be lost if you leave this page.'; note.setAttribute('role','alert');}
      return false;
    }
  }
  function beginTransition() {save(); activeKey=null;}
  function restore() {
    if (adapter.persist === false) return;
    activeKey = adapter.key();
    try {localStorage.setItem("dspp-last-setup:"+activeKey.split(":")[0],activeKey);} catch {}
    try {
      const draft = JSON.parse(localStorage.getItem(prefix + activeKey) || 'null');
      if (draft?.cells?.length) adapter.set(draft);
    } catch { savingFailed = true; }
    document.querySelectorAll('#datasetSelect,#scenarioSelect,#modelSelect,#foldSelect').forEach(select=>{select.dataset.savedSelection=select.value;});
  }
  function remember(cell, index) { deleted = {cell:clone(cell), index}; }
  async function download(executed=false) {
    const snapshot = adapter.get();
    const header = `import io, json, base64, contextlib, ast, traceback, warnings
import pandas as pd, numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n${snapshot.pythonHelpers || ''}\noriginal_df = pd.read_csv(io.StringIO(${JSON.stringify(snapshot.csv)}), sep=${JSON.stringify(snapshot.sep || ',')})\ndf = original_df.copy(deep=True)\n`;
    const codeCell = (source, cell=null) => {
      const result=cell?.output;
      const output=[];
      if (executed && result) {
        if (result.events?.length) {
          for (const event of result.events) {
            if (event.stdout || event.stderr) output.push({output_type:'stream',name:event.stderr?'stderr':'stdout',text:event.stderr || event.stdout});
            if (event.table || event.value) output.push({output_type:'display_data',metadata:{},data:{'text/plain':event.table ? JSON.stringify(event.table,null,2) : String(event.value)}});
            if (event.chart) output.push({output_type:'display_data',metadata:{},data:{'image/png':event.chart.split(',')[1]}});
          }
        } else {
          if (result.stdout) output.push({output_type:'stream',name:'stdout',text:result.stdout});
          if (result.stderr) output.push({output_type:'stream',name:'stderr',text:result.stderr});
          if (result.table || result.value) output.push({output_type:'display_data',metadata:{},data:{'text/plain':result.table ? JSON.stringify(result.table,null,2) : String(result.value)}});
          for (const chart of result.charts || []) output.push({output_type:'display_data',metadata:{},data:{'image/png':chart.split(',')[1]}});
        }
        if (result.error) output.push({output_type:'error',ename:'PythonError',evalue:result.error.trim().split('\n').at(-1),traceback:result.error.split('\n')});
      }
      return {cell_type:'code', metadata:{dspp:{executedAt:result?.executedAt,workspaceRevision:result?.workspaceRevision,executionId:result?.executionId,state:cell?.status}}, source:source.split(/(?<=\n)/), execution_count:null, outputs:output};
    };
    const exportedCells=[];
    for (const cell of snapshot.cells) {
      const source=(executed && cell.output ? '# Result from last execution; inspect metadata for stale state.\n' + (cell.output.executedCode || cell.code) : cell.code) + '\n';
      // Keep every exported code cell runnable in the order shown. Optional
      // evidence is a separate cell instead of hidden setup around the main result.
      exportedCells.push(codeCell(source, cell));
      const optionalSource=cell.optionalEvidence ? '' : (cell.optionalCode || cell.advancedCode || '');
      if (optionalSource.trim()) exportedCells.push(codeCell('# Optional evidence; run after the primary cell above.\n' + optionalSource + '\n'));
    }
    const notebook = {nbformat:4, nbformat_minor:5, metadata:{kernelspec:{display_name:'Python 3', language:'python', name:'python3'}, dspp:{...snapshot, cells:undefined, notebookCells:snapshot.cells.map(cell=>({...cell,output:null,status:'ready',lastRunCode:null})), csv:undefined, key:activeKey, runtime:'Pyodide 0.26.4', packages:{python:'3.12.1',numpy:'1.26.4',pandas:'2.2.0',scipy:'1.12.0','scikit-learn':'1.4.2',matplotlib:'3.5.2',seaborn:'0.13.2'}, exportedAt:new Date().toISOString(), evidencePolicy:executed ? 'Last executed code and results. Stale states are recorded per cell; this may combine historical workspace revisions.' : 'Editable code; outputs omitted. Run all cells in order to reproduce.'}}, cells:[{cell_type:'markdown', metadata:{}, source:[`# Data Science Playground\nDataset and setup: ${activeKey}\nRuntime: Pyodide 0.26.4. Seed and split recipe appear in the code.\n${executed ? 'This report contains last-executed code and results. Per-cell metadata identifies stale or historical state.' : 'Export contains editable code; rerun to regenerate evidence.'}\n`]}, codeCell(header), ...exportedCells]};
    const blob = new Blob([JSON.stringify(notebook,null,2)], {type:'application/x-ipynb+json'});
    if (await window.AppPlatform?.shareBlob?.(blob, 'data-science-playground.ipynb', 'Notebook with dataset and code')) return;
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href=url; link.download='data-science-playground.ipynb'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function install(value) {
    adapter=value;
    const actions = document.querySelector('.notebook-actions');
    if (actions) {
      const undo=document.createElement('button'); undo.type='button'; undo.className='toolbar-button'; undo.textContent='Undo delete'; undo.addEventListener('click',()=>{if (deleted) {adapter.insert(deleted.cell, deleted.index); deleted=null; save();}}); actions.append(undo);
      const note=document.createElement('p'); note.className='draft-policy'; note.textContent=adapter.persist === false ? 'Start with an empty notebook. Copy any code you want to keep before leaving this page.' : 'Code drafts save automatically on this device per setup. Python variables and results reset when reopening.'; actions.after(note);
    }
    setInterval(() => {
      const running=adapter.get().cells.find(cell=>cell.status==='running');
      const status=document.querySelector('#outputStatus');
      if (running?.startedAt && status) status.textContent=`${running.label} · running ${Math.floor((Date.now()-running.startedAt)/1000)}s · Stop / restart cancels`;
    },1000);
    document.addEventListener('input', () => {clearTimeout(timer); timer=setTimeout(save,250);});
    document.addEventListener('change',event=> {
      const select=event.target;
      if (!select.matches('#datasetSelect,#scenarioSelect,#modelSelect,#foldSelect')) return;
      if (!save() && !confirm('This device could not save your edits. Continue and discard unsaved edits?')) {
        select.value=select.dataset.savedSelection || select.value;
        event.stopImmediatePropagation();event.preventDefault();
      }
    },true);
    window.addEventListener('pagehide',save);
    document.addEventListener('visibilitychange', () => {if (document.hidden) save();});
    window.addEventListener('beforeunload',event => {save(); if (savingFailed && adapter.get().cells.length) {event.preventDefault(); event.returnValue='';}});
  }
  return {install,save,restore,remember,beginTransition,
    last:workspace => {try {return localStorage.getItem('dspp-last-setup:'+workspace)?.split(':').slice(1) || [];} catch {return [];}}
  };
})();
