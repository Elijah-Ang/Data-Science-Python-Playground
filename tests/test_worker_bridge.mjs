import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const workers=[];
class Worker {constructor(){workers.push(this);this.messages=[];}postMessage(message){this.messages.push(message);}terminate(){this.terminated=true;}}
const context={window:{},Worker,URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:class{},console};vm.createContext(context);vm.runInContext(fs.readFileSync('worker-bridge.js','utf8'),context);
const bridge=context.window.createPythonBridge('');
const first=bridge.send('run',{code:'1'}),second=bridge.send('run',{code:'2'});await Promise.resolve();assert.equal(workers[0].messages.length,1);
workers[0].onmessage({data:{id:1,ok:true,output:1}});await first;await Promise.resolve();assert.equal(workers[0].messages.length,2);workers[0].onmessage({data:{id:2,ok:true,output:2}});await second;
const active=bridge.send('run'),queued=bridge.send('run');const settled=Promise.allSettled([active,queued]);await Promise.resolve();bridge.restart();const states=await settled;assert(states.every(s=>s.status==='rejected'));assert(workers[0].terminated);
const recovered=bridge.send('run');await Promise.resolve();const message=workers[1].messages[0];workers[1].onmessage({data:{id:message.id,ok:true}});await recovered;
const failed=bridge.send('run');const check=assert.rejects(failed);await Promise.resolve();workers[1].onerror({message:'startup failure'});await check;
console.log('Shared worker transport: serial requests, queued cancellation, restart recovery and startup failure passed.');
