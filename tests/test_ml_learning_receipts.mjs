import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createReceiptStore}=require('../ml-learning/receipts.js');
const store=createReceiptStore();
store.enter('ML-W-K1-1');
const receipt={exerciseId:'ML-W-K1-1',provenance:{testExposed:true},checks:[{status:'correct'}]};
let token=store.begin('first');
assert(store.accept(token,'first',receipt));
for(let i=0;i<100;i++)assert.equal(store.check('first'),receipt);
assert.equal(store.retainedReceipts,1);
store.edit();
assert.equal(store.check('first'),null);
assert.equal(store.retainedReceipts,0);
assert(store.exposed);
assert(!store.accept(token,'first',receipt),'late results cannot replace edited code');
token=store.begin('second');
store.enter('ML-P01-1');
assert(!store.accept(token,'second',receipt),'navigation invalidates in-flight runs');
assert(!store.exposed);
for(let i=0;i<100;i++){
  const t=store.begin(String(i));
  assert(store.accept(t,String(i),{exerciseId:'ML-P01-1'}));
  assert.equal(store.retainedReceipts,1);
}
console.log('Receipt reuse, stale results, navigation and bounded retention passed.');
