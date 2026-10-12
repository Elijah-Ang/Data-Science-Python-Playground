"""Real worker startup with a controlled asynchronous loader and restart recovery."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:8000')
parser.add_argument('--engine',choices=['chromium','webkit'],default='chromium')
args=parser.parse_args()
out=Path('tests/evidence/ml-learning/worker-startup')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=getattr(pw,args.engine).launch()
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(args.base_url+'/learn.html')
    page.add_script_tag(url=args.base_url+'/worker-bridge.js')
    result=page.evaluate('''async()=>{
      const NativeWorker=Worker,create=URL.createObjectURL,revoke=URL.revokeObjectURL;
      const live=new Set(),revoked=new Set(),events=[],cases=[];
      URL.createObjectURL=blob=>{const url=create.call(URL,blob);live.add(url);events.push({event:'create',url});return url;};
      URL.revokeObjectURL=url=>{if(!live.has(url)||revoked.has(url))throw new Error('Invalid or repeated source cleanup');live.delete(url);revoked.add(url);events.push({event:'revoke',url});return revoke.call(URL,url);};
      const waitFor=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('Worker did not start');};
      const source=`onmessage=({data})=>{const reply=()=>postMessage({id:data.id,ok:true,value:data.value});data.type==='wait'?setTimeout(reply,1000):reply();};postMessage({type:'status',message:'Worker script loaded'});`;
      for(const delay of [0,25,100]){
        // Delay native script loading, not its execution or returned answers.
        window.Worker=class{
          constructor(url){this.queue=[];this.timer=setTimeout(()=>{
            events.push({event:'native-construction',url,delay});
            try{this.native=new NativeWorker(url);this.native.onmessage=e=>this.onmessage?.(e);this.native.onerror=e=>this.onerror?.(e);this.native.onmessageerror=e=>this.onmessageerror?.(e);this.queue.forEach(m=>this.native.postMessage(m));}
            catch(error){this.onerror?.({message:String(error)});}
          },delay);}
          postMessage(message){this.native?this.native.postMessage(message):this.queue.push(message);}
          terminate(){clearTimeout(this.timer);this.native?.terminate();}
        };
        let started=0;
        const bridge=createPythonBridge(source,{onStatus:()=>started++});
        const replies=await Promise.all([bridge.send('run',{value:1}),bridge.send('run',{value:2})]);
        if(replies.map(r=>r.value).join(',')!=='1,2')throw new Error('Serial answers changed');
        await waitFor(()=>started===1);
        if(live.size!==0)throw new Error('Loaded worker retained source URL');
        const active=bridge.send('wait',{value:3}),queued=bridge.send('run',{value:4});
        const cancellation=Promise.allSettled([active,queued]);
        await Promise.resolve();bridge.restart();
        if((await cancellation).some(r=>r.status!=='rejected'))throw new Error('Restart did not cancel both requests');
        const recovered=await bridge.send('run',{value:5});
        if(recovered.value!==5)throw new Error('Restart recovery changed answer');
        await waitFor(()=>started===2);
        bridge.restart();bridge.restart();
        await waitFor(()=>started===3);
        if(live.size!==0)throw new Error('Idle or stopped startup leaked a source URL');
        cases.push({delay,serial:true,activeAndQueuedCancelled:true,recovered:true,idleAndStoppedCleanup:true});
      }
      return {cases,events,liveSourceURLs:live.size};
    }''')
    assert len(result['cases'])==3 and result['liveSourceURLs']==0,result
    assert not errors,errors
    (out/(args.engine+'.json')).write_text(json.dumps(result,indent=2)+'\n')
    browser.close()
print(args.engine,'real workers: delayed startup, serial replies, cancellation, recovery and idle/stopped URL cleanup passed.')
