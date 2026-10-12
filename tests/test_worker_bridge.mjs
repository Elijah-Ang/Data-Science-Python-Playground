import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const workers=[],sources=new Map(),revoked=[];
let nextURL=0;
class Worker {constructor(url){this.url=url;workers.push(this);this.messages=[];this.started=Promise.resolve().then(()=>{if(this.terminated)return;assert(sources.has(url),'Worker source must survive asynchronous startup');});}postMessage(message){this.messages.push(message);}terminate(){this.terminated=true;}}
const context={window:{},Worker,URL:{createObjectURL:blob=>{const url='blob:worker-'+ ++nextURL;sources.set(url,blob);return url;},revokeObjectURL:url=>{assert(sources.has(url),'Revoke each source exactly once');sources.delete(url);revoked.push(url);}},Blob:class{},console};vm.createContext(context);vm.runInContext(fs.readFileSync('worker-bridge.js','utf8'),context);
const bridge=context.window.createPythonBridge('');
await workers[0].started;assert(sources.has(workers[0].url));
workers[0].onmessage({data:{type:'status',message:'Worker started'}});assert(!sources.has(workers[0].url));
const first=bridge.send('run',{code:'1'}),second=bridge.send('run',{code:'2'});await Promise.resolve();assert.equal(workers[0].messages.length,1);
workers[0].onmessage({data:{id:1,ok:true,output:1}});await first;await Promise.resolve();assert.equal(workers[0].messages.length,2);workers[0].onmessage({data:{id:2,ok:true,output:2}});await second;
const active=bridge.send('run'),queued=bridge.send('run');const settled=Promise.allSettled([active,queued]);await Promise.resolve();bridge.restart();const states=await settled;assert(states.every(s=>s.status==='rejected'));assert(workers[0].terminated);
const recovered=bridge.send('run');await Promise.resolve();const message=workers[1].messages[0];workers[1].onmessage({data:{id:message.id,ok:true}});await recovered;
const failed=bridge.send('run');const check=assert.rejects(failed);await Promise.resolve();workers[1].onerror({message:'startup failure'});await check;
const stopped=context.window.createPythonBridge('');const before=workers.at(-1);stopped.restart();assert(before.terminated);assert(!sources.has(before.url));
const after=workers.at(-1);await after.started;assert(sources.has(after.url));
const startupRequest=stopped.send('run');const startupFailure=assert.rejects(startupRequest);await Promise.resolve();after.onerror({message:'Cannot load worker source'});await startupFailure;assert(!sources.has(after.url));
assert.equal(new Set(revoked).size,revoked.length);assert.equal(sources.size,0);
console.log('Shared worker transport: asynchronous source lifetime, exactly-once cleanup, serial requests, queued cancellation, restart recovery and startup failure passed.');
