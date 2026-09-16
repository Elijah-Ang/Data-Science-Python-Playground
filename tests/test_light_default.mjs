import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../appearance.js',import.meta.url),'utf8');
for(const saved of [null,'system','light','dark','invalid']){
 const values=new Map(saved?[['dspp-appearance',saved]]:[]);
 const document={documentElement:{dataset:{},style:{setProperty(){}}},body:{dataset:{}},getElementById(){return null;},querySelector(){return null;},addEventListener(){}};
 vm.runInNewContext(source,{document,matchMedia:()=>({matches:true,addEventListener(){}}),localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},window:{dispatchEvent(){}},CustomEvent:class{}});
 assert.equal(document.documentElement.dataset.theme,saved==='dark'?'dark':'light');
}
console.log('Light defaults, legacy-system migration and explicit theme preferences passed.');
