import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../ad-mode.js', import.meta.url), 'utf8');
function run(search = '', saved, blocked = false, protocol = 'https:', hostname = 'dataplayground.science') {
  const values = new Map(saved ? [['dspp-ad-free', saved]] : []);
  const links = ['playground.html', 'ml.html#workflow', 'privacy.html?ads=on', '#section', 'data/bikes.csv', 'https://example.com/'];
  const elements = links.map(href => ({href, getAttribute(){return this.href;}, hasAttribute(){return false;}, setAttribute(_,value){this.href=value;}}));
  const slot = {hidden:true};
  const footer = {dataset:{},querySelector:()=>slot,getBoundingClientRect:()=>({height:106})};
  const context = {
    URL, URLSearchParams, window:{},
    location:{search, protocol, hostname, origin:'https://dataplayground.science', href:'https://dataplayground.science/'+search},
    sessionStorage:{getItem:key=>{if(blocked)throw Error();return values.get(key);},setItem:(key,value)=>{if(blocked)throw Error();values.set(key,value);},removeItem:key=>{if(blocked)throw Error();values.delete(key);}},
    document:{readyState:'complete',documentElement:{dataset:{}},body:{style:{setProperty(){}}},querySelectorAll:()=>elements,querySelector:()=>footer},
    MutationObserver:class{observe(){}},
    ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback();}},
  };
  vm.runInNewContext(source,context);
  return {policy:context.window.DataPlaygroundAds,links:elements.map(item=>item.href),values,slot};
}
for (const blocked of [false,true]) {
  const result=run('?ads=off',undefined,blocked);
  assert.equal(result.policy.adFree,false);
  assert.equal(result.policy.canLoadAdvertising(),false);
  assert.equal(result.links[0],'playground.html');
  assert.equal(result.links[1],'ml.html#workflow');
  assert.equal(result.links[2],'privacy.html?ads=on');
  assert.equal(result.links[3],'#section');
  assert.equal(result.links[4],'data/bikes.csv');
  assert.equal(result.links[5],'https://example.com/');
}
assert.equal(run('', '1').policy.adFree,false);
assert.equal(run('?ads=on','1').policy.adFree,false);
assert.equal(run('?ads=on','1').values.has('dspp-ad-free'),false);
assert.equal(run().policy.canLoadAdvertising(),false);
assert.equal(run('',undefined,false,'capacitor:').policy.native,true);
assert.equal(run('?ads=on&adpreview=footer').slot.hidden,false);
assert.equal(run('?ads=off&adpreview=footer').slot.hidden,false);
assert.equal(run('?adpreview=footer',undefined,false,'https:','private.dataplayground.science').slot.hidden,true);
assert.equal(run('',undefined,false,'https:','private.dataplayground.science').policy.adFree,true);
assert.equal(run('?adpreview=footer',undefined,false,'capacitor:').slot.hidden,true);
assert.equal(run().slot.hidden,true);
assert.equal(fs.readFileSync(new URL('../ads.txt',import.meta.url),'utf8').trim(),'google.com, pub-8878519828847261, DIRECT, f08c47fec0942fa0');
assert.match(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),/<meta name="google-adsense-account" content="ca-pub-8878519828847261">/);
for(const name of ['index','playground','ml','tutorial','about','help','privacy','acknowledgements','offline']) {
  assert.match(fs.readFileSync(new URL(`../${name}.html`,import.meta.url),'utf8'),/<script src="ad-mode.js"><\/script>/);
}
console.log('Ad policy: legacy bypass removed, private/native exclusion, blocked storage, preview and page coverage passed.');
