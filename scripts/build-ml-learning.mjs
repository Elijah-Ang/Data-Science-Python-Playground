import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {productionInventory} from './ml-production.mjs';
import {checkLearningWorkflows} from './sync-ml-workflows.mjs';

export async function buildMLLearning(root,output){
  checkLearningWorkflows();
  const executable=process.env.PYTHON || (process.platform==='win32'?'python':'python3');
  let authored;
  try{authored=execFileSync(executable,[path.join(root,'ml-learning/authoring.py')],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});}
  catch(error){throw new Error('ML content authoring requires Python 3. Set PYTHON to its executable path. '+error.message);}
  const registry=JSON.parse(authored);
  const api=productionInventory();
  registry.models=Object.entries(api.MODELS).map(([id,m])=>({
    id,name:m.name,family:m.family,task:m.task,
    teaching:registry.cards.filter(c=>c.kind==='teaching'&&c.tier==='core'&&c.models.includes(id)).map(c=>c.id),
    challenges:registry.challenges.filter(c=>c.models.includes(id)).map(c=>c.id)
  }));
  registry.counts={
    cards:registry.cards.length,
    teaching:registry.cards.filter(c=>c.kind==='teaching').length,
    core:registry.cards.filter(c=>c.kind==='teaching'&&c.tier==='core').length,
    exercises:registry.cards.reduce((n,c)=>n+c.exercises.length,0),
    challenges:registry.challenges.length,
    models:registry.models.length
  };
  const folder=path.join(output,'ml-learning');await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'curriculum.json'),JSON.stringify(registry));
  const oneR='import numpy as np\n'+api.ONE_R_HELPER_SOURCE;
  const source=(await fs.readFile(path.join(root,'ml-learning/fixtures.py'),'utf8'))+'\n'+(await fs.readFile(path.join(root,'ml-learning/runtime.py'),'utf8'));
  await fs.writeFile(path.join(folder,'runtime-source.js'),'window.MLLearningRuntime='+JSON.stringify({source,oneR,oneRHash:createHash('sha256').update(oneR).digest('hex')})+';\n');
  await fs.writeFile(path.join(folder,'ml_helpers.py'),oneR);
}
