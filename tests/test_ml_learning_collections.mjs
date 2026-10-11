import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const curriculum=JSON.parse(process.env.ML_COLLECTION_CURRICULUM?await fs.readFile(process.env.ML_COLLECTION_CURRICULUM,'utf8'):execFileSync(process.env.PYTHON||'python3',[path.join(root,'ml-learning/authoring.py')],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024}));
const original=JSON.stringify(curriculum);
const context=vm.createContext({URLSearchParams,URL,console,DataPlaygroundPrerender:true,
  location:{hash:'',search:'',pathname:'/'},document:{body:{dataset:{}},getElementById:()=>({innerHTML:''})},
  fetch:async file=>({ok:true,json:async()=>file.endsWith('curriculum.json')?{...curriculum,models:[]}:JSON.parse(await fs.readFile(path.join(root,file),'utf8'))})});
context.window=context;
for(const file of ['code-identifiers.js','learning-routes.js','dataset-dictionary.js','foundations/learning-ui.js','challenges/experience.js','ml-learning/receipts.js','ml-learning/visuals.js','ml-learning/collections.js','ml-learning/app.js'])
  await vm.runInContext(await fs.readFile(path.join(root,file),'utf8'),context,{filename:file});
const api=context.DataPlaygroundPrerender, registry=context.MLLearningCollections, routes=context.LearningRoutes;
assert.equal(curriculum.cards.length,110);
assert.equal(curriculum.challenges.length,19);
assert.deepEqual(curriculum.decks.map(d=>d.id),['foundations','workflow','regression','classification','networks','clustering','pca','comparison']);
assert.equal(JSON.stringify(curriculum),original,'Collections must not rewrite authored lessons or prerequisites');
const byId=new Map(curriculum.cards.map(c=>[c.id,c]));
const referenced=[];
for(const collection of registry.collections){
  assert.equal(new Set(collection.ids).size,collection.ids.length,collection.id+' duplicate reference');
  for(const id of [...collection.ids,...collection.prior])assert(byId.has(id),collection.id+' missing card '+id);
  for(const id of collection.ids){assert.equal(byId.get(id).deck,collection.deck);referenced.push(id);}
}
assert.equal(new Set(referenced).size,referenced.length,'Each model card has one primary collection');
assert.deepEqual(referenced.slice().sort(),curriculum.cards.filter(c=>!['foundations','workflow'].includes(c.deck)).map(c=>c.id).sort(),'Every model/review/checkpoint remains reachable');
const expected={
  'simple-linear':['ML-R01','ML-R02','ML-R03'],
  'multiple-linear':['ML-R04','ML-R05','ML-R06'],polynomial:['ML-R07','ML-R08'],'regression-tree':['ML-R09','ML-R10'],
  'classification-evidence':['ML-C01','ML-C02','ML-C03','ML-C04'],logistic:['ML-C05','ML-C06','ML-C07'],knn:['ML-C08','ML-C09'],svm:['ML-C10','ML-C11'],'one-r':['ML-C12','ML-C13'],'classification-tree':['ML-C14'],'naive-bayes':['ML-C15','ML-C16'],'lda-qda':['ML-C17','ML-C18','ML-C19'],
  'neural-classification':['ML-N03','ML-N-K2'],'neural-quantity':['ML-N04','ML-N-K1'],
  'discovery-foundations':['ML-U01','ML-U02'],hierarchical:['ML-U07','ML-U08','ML-U09']
};
for(const [id,ids] of Object.entries(expected))assert.deepEqual(Array.from(registry.get(id).ids),ids,id+' requested model grouping');
assert.deepEqual(Array.from(registry.get('neural-foundations').ids).slice(0,4),['ML-N01','ML-N02','ML-N05','ML-N-R1']);
assert.deepEqual(Array.from(registry.get('k-means').ids).filter(id=>byId.get(id).kind==='teaching'),['ML-U03','ML-U04','ML-U05','ML-U06']);
assert.equal(registry.primary('ML-U10').id,'discovery-interpretation');
assert.equal(registry.primary('ML-P01').id,'pca');
assert.equal(registry.primary('ML-M03').id,'model-comparison');
assert.equal(registry.selected(byId.get('ML-N03'),'?collection=neural-quantity'),null,'Reject nonmember context');
assert.equal(registry.selected(byId.get('ML-N03'),'?collection=missing'),null,'Reject unknown context');
assert.equal(registry.selected(byId.get('ML-N03'),'?collection=neural-classification').id,'neural-classification');
assert.equal(routes.url('ml','collections/simple-linear','learn'),'ml-learn-collection-simple-linear.html?from=learn');
assert.equal(routes.route('ml',{hash:'',search:'?practice=2'},{dataset:{learningRoute:'collections/simple-linear'}}),'collections/simple-linear');
assert.equal(routes.route('ml',{hash:'#collections/simple-linear',search:''},{dataset:{}}),'collections/simple-linear');
assert.equal(routes.url('ml','networks/ML-N03/2','learn','neural-classification'),'ml-learn-ML-N03.html?from=learn&practice=2&collection=neural-classification');
assert.equal(routes.route('ml',{hash:'',search:'?from=learn&practice=2&collection=neural-classification'},{dataset:{learningRoute:'networks/ML-N03/0'}}),'networks/ML-N03/2');
assert.equal(routes.route('ml',{hash:'#classification/ML-C14/2',search:''},{dataset:{}}),'classification/ML-C14/2','Original deck/card aliases remain valid');
const landing=routes.rewriteHTML('ml',api.landing());
assert(landing.indexOf('data-deck="foundations"')<landing.indexOf('data-collection="simple-linear"'),'Foundations first');
const collectionFiles=new Set();
for(const collection of registry.collections){
  const file=routes.url('ml',registry.route(collection));assert(!collectionFiles.has(file));collectionFiles.add(file);
  assert(landing.includes('href="'+file+'"'),file+' landing link');
  const html=routes.rewriteHTML('ml',api.collectionPage(collection));
  assert(html.includes('guidance, not locks'));
  for(const id of collection.ids)assert(html.includes('href="'+routes.url('ml',byId.get(id).deck+'/'+id+'/0','',collection.id)+'"'),id+' existing lesson URL');
}
function last(id){const card=byId.get(id);return routes.rewriteHTML('ml',api.lessonPage(card,card.exercises.length-1));}
function nav(id){return last(id).match(/<nav class="foundation-navigation"[\s\S]*?<\/nav>/)[0];}
for(const [id,next,collection] of [['ML-N03','ML-N-K2','neural-classification'],['ML-N04','ML-N-K1','neural-quantity'],['ML-U07','ML-U08','hierarchical'],['ML-C15','ML-C16','naive-bayes']])
  assert(nav(id).includes('href="'+routes.url('ml',byId.get(next).deck+'/'+next+'/0','',collection)+'"'),id+' stays in task/model branch');
for(const [id,collection] of [['ML-R03','simple-linear'],['ML-C14','classification-tree'],['ML-N-R1','neural-foundations'],['ML-N-K1','neural-quantity'],['ML-N-K2','neural-classification'],['ML-U02','discovery-foundations'],['ML-P-K1','pca']])
  assert(nav(id).includes('href="'+routes.url('ml','collections/'+collection)+'"'),id+' explicit model boundary');
assert(!nav('ML-N03').includes('ML-N04')&&!nav('ML-N04').includes('ML-N03'));
assert(!nav('ML-C14').includes('ML-C15')&&!nav('ML-R03').includes('ML-R04'));
assert(last('ML-N-R1').includes('ml-learn-collection-neural-classification.html')&&last('ML-N-R1').includes('ml-learn-collection-neural-quantity.html'));
assert(!last('ML-U02').match(/<p class="teaching-note">[\s\S]*?<\/p>/)[0].includes('ml-learn-workflow.html'));
for(const id of ['ML-C10','ML-C15','ML-N03'])assert(!api.lessonPage(byId.get(id),0).includes('First practise complete regression and classification'));
console.log('23 reference collections: unchanged 110 cards/19 workflows; exact model groups, independent rendered branches, legacy URLs and practice/context routing passed.');
