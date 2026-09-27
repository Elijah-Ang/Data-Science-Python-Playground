import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=require('../challenges/registry.js').challenges;
const ml=JSON.parse(fs.readFileSync(path.join(root,'ml-learning/manifest.json'),'utf8')).challenges.map(challenge=>({id:'ML-'+challenge.id}));
const prompts=JSON.parse(fs.readFileSync(path.join(root,'challenges/icon-prompts.json'),'utf8'));
const challenges=[...data,...ml],folder=path.join(root,'assets/workflow-icons-generated');
assert.equal(data.length,30);
assert.equal(ml.length,19);
assert.deepEqual(new Set(Object.keys(prompts.icons)),new Set(challenges.map(c=>c.id)));
assert.deepEqual(new Set(fs.readdirSync(folder)),new Set(challenges.map(c=>c.id+'.png')));
const hashes=new Set();
for(const challenge of challenges){
  const image=fs.readFileSync(path.join(folder,challenge.id+'.png'));
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a',challenge.id);
  assert.equal(image.readUInt32BE(16),image.readUInt32BE(20),challenge.id+' should be square');
  assert(image.readUInt32BE(16)>=256,challenge.id+' has insufficient image resolution');
  assert.equal(image[25],6,challenge.id+' needs RGBA transparency');
  const hash=createHash('sha256').update(image).digest('hex');
  assert(!hashes.has(hash),challenge.id+' needs its own generated image');
  hashes.add(hash);
}
console.log(challenges.length+' distinct transparent generated workflow icons are present.');
