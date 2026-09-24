import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {productionInventory} from './ml-production.mjs';

// Export the manual walkthrough's real preparation, estimator and stage sequence.
// Python authoring reads this snapshot; build/check rejects a stale snapshot.
export function learningWorkflowRecipes(){
  const api=productionInventory();
  const routes={gapminder:['gapminder','simple'],candy_simple:['candy','simple'],candy:['candy','continuous_binary'],seoul:['seoul','all_types'],penguins_mixed:['penguins','all_types'],penguins:['penguins','continuous'],car:['car','categorical'],breast:['breast','continuous5'],candy_binary:['candy_class','binary'],candy_mixed:['candy_class','continuous_binary'],Wine600:['wine','continuous']};
  const recipes={};
  for(const [key,[dataset,scenario]] of Object.entries(routes)){
    const config=api.DATASETS[dataset],value=config.scenarios.find(s=>s.id===scenario);
    recipes[key]={};
    for(const [model,info] of Object.entries(api.MODELS)){
      if(info.task==='unsupervised'||!api.compatible(model,config,value))continue;
      const route=api.routeForSelection(config,value,model,5),plan=api.preprocessingPlan(config,value,model);
      const assignments={numeric_features:value.continuous,binary_features:value.binary,categorical_features:value.categorical,numeric_binary_features:plan.numericBinary,encoded_binary_features:value.binary.filter(n=>!plan.numericBinary.includes(n))};
      recipes[key][model]={dataset,scenario,preparation:plan.groups,
        code:Object.entries(assignments).map(([name,columns])=>`${name} = ${JSON.stringify(columns)}`).join('\n')+'\n'+route.find(s=>s.id==='prepare').code+'\n'+route.find(s=>s.id==='model').code+'\nmodel = pipeline\n',
        grid:api.modelSpec(model,value,config).grid,
        steps:route.map(({id,title,question,readingCue})=>({id,title,question,readingCue}))};
    }
  }
  const discovery={};
  for(const [model,dataset,scenario] of [['kmeans','penguins','continuous'],['hierarchical','breast','continuous5'],['pca','breast','continuous30']]){
    const config=api.DATASETS[dataset],value=config.scenarios.find(s=>s.id===scenario);
    discovery[model]={dataset,scenario,steps:api.routeForSelection(config,value,model,5).map(({id,title,question,readingCue})=>({id,title,question,readingCue}))};
  }
  return {source:'ml-app.js · routeForSelection (the ML > Workflow manual walkthrough)',recipes,discovery};
}
export function checkLearningWorkflows(){
  const expected=JSON.stringify(learningWorkflowRecipes(),null,2)+'\n';
  const file=new URL('../ml-learning/playground-workflows.json',import.meta.url);
  if(fs.readFileSync(file,'utf8')!==expected)throw Error('ML walkthrough changed. Run node scripts/sync-ml-workflows.mjs, review the learning recipes, and rerun the curriculum checks.');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--check'))checkLearningWorkflows();
  else fs.writeFileSync(new URL('../ml-learning/playground-workflows.json',import.meta.url),JSON.stringify(learningWorkflowRecipes(),null,2)+'\n');
  console.log('Learning recipes match the playground manual walkthrough.');
}
