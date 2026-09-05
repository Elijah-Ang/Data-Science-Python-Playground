/* Shared serial transport; restarting invalidates queued work and late messages. */
window.createPythonBridge = function(source, {field='type', onStatus=()=>{}, onError=()=>{}}={}) {
  let worker, sequence=0, generation=0, queue=Promise.resolve(), count=0;
  const pending=new Map();
  function fail(message) {
    const error=new Error(message || 'Python stopped. Select Stop / restart Python.');
    for (const request of pending.values()) request.reject(error);
    pending.clear(); onError(error);
  }
  function spawn() {
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    worker=new Worker(url); URL.revokeObjectURL(url);
    worker.onmessage=({data}) => {
      if (data.type==='status') {onStatus(data); return;}
      const request=pending.get(data.id); if (!request) return;
      pending.delete(data.id);
      data.ok===false ? request.reject(new Error(data.error || 'Python request failed')) : request.resolve(data);
    };
    worker.onerror=worker.onmessageerror=event=>fail(event.message);
  }
  spawn();
  return {
    get busy() {return count>0;},
    send(type,payload={}) {
      const token=generation; count++;
      const request=queue.then(()=> {
        if (token!==generation) throw new Error('Cancelled by Python restart.');
        return new Promise((resolve,reject)=> {
          const id=++sequence; pending.set(id,{resolve,reject});
          try {worker.postMessage({id,[field]:type,...payload});} catch(error) {pending.delete(id);reject(error);}
        });
      });
      queue=request.catch(()=>{});
      return request.finally(()=>{count--;});
    },
    restart() {
      generation++; worker.terminate();
      for (const request of pending.values()) request.reject(new Error('Execution cancelled; Python variables reset.'));
      pending.clear(); queue=Promise.resolve(); spawn();
    }
  };
};
