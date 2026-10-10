import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const context=vm.createContext({URLSearchParams,URL});context.window=context;
vm.runInContext(await fs.readFile(path.join(root,'learning-routes.js'),'utf8'),context);
const routes=context.LearningRoutes;
const legacy={hash:'#inspect/I17/2',search:'?from=learn'};
assert.equal(routes.route('data',legacy,{dataset:{}}),'inspect/I17/2');
assert.equal(routes.url('data','inspect/I17/2','learn'),'data-foundations-I17.html?from=learn&practice=2');
assert.equal(routes.route('ml',{hash:'',search:'?practice=1'},{dataset:{learningRoute:'workflow/ML-W-K1/0'}}),'workflow/ML-W-K1/1');
assert.equal(routes.url('ml','workflow/chapter/2'),'ml-learn-workflow.html#chapter-2');
assert.equal(routes.url('data','inspect/challenges/IC01'),'data-foundations-IC01.html');
assert.equal(routes.url('ml','workflows/challenges/ML-X01','learn'),'ml-learn-ML-X01.html?from=learn');
assert.equal(routes.url('ml','workflows/challenges'),'ml-learn-workflows-challenges.html');
assert.equal(routes.route('ml',{hash:'',search:'?practice=2'},{dataset:{learningRoute:'workflows/challenges/ML-X01'}}),'workflows/challenges/ML-X01');
assert.equal(routes.route('ml',{hash:'',search:''},{dataset:{learningRoute:'workflows/challenges'}}),'workflows/challenges');
assert.equal(routes.route('ml',{hash:'#workflows/challenges/ML-X01',search:''},{dataset:{}}),'workflows/challenges/ML-X01');
assert.equal(routes.route('data',{hash:'#chapter-1',search:''},{dataset:{learningRoute:'inspect'}}),'inspect/chapter/1');
const require=createRequire(import.meta.url),data=require('../foundations/curriculum.js');
const ml=JSON.parse(await fs.readFile(path.join(dist,'ml-learning/curriculum.json'),'utf8'));
const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
const worker=await fs.readFile(path.join(dist,'service-worker.js'),'utf8');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const challengeContext=vm.createContext({});challengeContext.window=challengeContext;
vm.runInContext(await fs.readFile(path.join(root,'challenges/registry.js'),'utf8'),challengeContext);
let briefCount=0;
const briefFiles=new Set();
for(const [family,challenges] of [['data',challengeContext.DataWorkflowChallenges.challenges],['ml',ml.challenges]]){
  for(const deck of new Set(challenges.map(c=>c.deck))){
    const collectionFile=routes.url(family,deck+'/challenges');
    const collection=await fs.readFile(path.join(dist,collectionFile),'utf8');
    for(const challenge of challenges.filter(c=>c.deck===deck))assert.ok(collection.includes('href="'+routes.url(family,deck+'/challenges/'+challenge.id)+'"'),collectionFile+' crawlable brief link');
  }
  for(const challenge of challenges){
    const file=routes.url(family,challenge.deck+'/challenges/'+challenge.id);
    assert.ok(!briefFiles.has(file),'One stable page per brief: '+file);briefFiles.add(file);
    const html=await fs.readFile(path.join(dist,file),'utf8'),main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
    assert.ok(main.includes('aria-label="Challenge brief"'),file+' actual independent brief');
    assert.ok(main.includes(escape(challenge.question)),file+' authored question');
    for(const text of [...Object.values(challenge.hints),...challenge.explanationSteps,...challenge.policies])assert.ok(main.includes(escape(text)),file+' authored help and policy: '+text);
    assert.ok(main.includes(escape(family==='ml'?challenge.reference||challenge.exercise.solution:challenge.solution)),file+' complete explained solution');
    const requirements=family==='ml'?challenge.deliverableGroups.map(g=>g.summary):challenge.deliverables.map(d=>d.requirement);
    for(const requirement of requirements)assert.ok(main.includes(escape(requirement)),file+' authored deliverable');
    const starter=challenge.exercise?.starter||challenge.starter;
    assert.ok(main.includes(escape(starter)),file+' actual editor starter');
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file+' single canonical');
    assert.ok(html.includes('href="https://dataplayground.science/'+file+'"'),file+' stable canonical');
    assert.equal(sitemap.split('<loc>https://dataplayground.science/'+file+'</loc>').length-1,1,file+' single sitemap identity');
    assert.ok(worker.includes('./'+file),file+' offline inventory');
    assert.ok(html.includes('href="'+routes.url(family,challenge.deck+'/challenges')+'" class="back-playground">'),file+' collection back link');
    assert.ok(!main.includes('href="#'+challenge.deck+'/'),file+' static prerequisite/navigation links');
    briefCount++;
  }
}
let count=0;
for(const [family,curriculum,lessons] of [['data',data,data.lessons],['ml',ml,ml.cards]]){
  for(const deck of curriculum.decks){
    const file=routes.url(family,deck.id),html=await fs.readFile(path.join(dist,file),'utf8');
    assert.ok(html.includes('lesson-library')&&html.includes('class="lesson-card'),'Deck must contain ordinary lesson links: '+file);
    assert.ok(!html.includes('href="#'+deck.id+'/'),'Deck links must use static pages: '+file);
  }
  for(const lesson of lessons){
    const file=routes.url(family,lesson.deck+'/'+lesson.id+'/0'),html=await fs.readFile(path.join(dist,file),'utf8');
    const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
    assert.ok(main.includes('aria-label="Lesson content"'),file+' must render the real article');
    assert.ok(main.replace(/<[^>]+>/g,'').length>700,file+' must contain substantive teaching and practice');
    assert.ok(main.includes('Hint')&&main.includes('solution'),file+' must retain authored help');
    if(family==='data'){
      const breadcrumb=main.match(/<nav class="foundation-breadcrumb"[\s\S]*?<\/nav>/)?.[0]||'';
      const sequence=lesson.review?(lesson.rounds.some(r=>r.retrieves)?'Spaced practice':'Checkpoint'):'Lesson '+String(lessons.filter(l=>l.deck===lesson.deck&&!l.review).indexOf(lesson)+1).padStart(2,'0');
      assert.ok(breadcrumb.endsWith('<span>'+sequence+'</span></nav>'),file+' must show its displayed lesson sequence');
      assert.ok(!main.includes('Reference '+lesson.id),file+' must not display the internal progress ID');
    }

    assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file);
    assert.ok(html.includes('href="https://dataplayground.science/'+file+'"'),file+' canonical');
    assert.ok(sitemap.includes('https://dataplayground.science/'+file),file+' sitemap');
    assert.ok(worker.includes('./'+file),file+' offline shell');
    assert.ok(!main.includes('href="#'+lesson.deck+'/'),file+' ordinary navigation');
    count++;
  }
}
const checkpoint=await fs.readFile(path.join(dist,'ml-learn-ML-W-K1.html'),'utf8');
assert.ok(checkpoint.includes('Final RMSE')&&!checkpoint.includes('Final MAE'));
assert.ok(checkpoint.includes('ml-learn-ML-W06.html')&&checkpoint.includes('ml-learn-ML-W09.html')&&checkpoint.includes('ml-learn-ML-W13.html'));
assert.ok(!checkpoint.includes('Revisit the concept lesson'));
for(const name of ['distance','weight','duration'])assert.ok(checkpoint.includes('Synthetic '+name+' units; physical unit unspecified'));
assert.ok(!checkpoint.includes('.. &lt;strong')&&!checkpoint.includes('RMSE..'));
const learn=await fs.readFile(path.join(dist,'learn.html'),'utf8');
assert.ok(learn.includes('class="learn-path is-planned" data-coming-soon="Statistics" data-path="statistics"'));
assert.ok(learn.includes('id="statsComing"')&&learn.includes('Coming soon'));
assert.ok(!learn.includes('href="statistics.html" class="learn-path'));
assert.ok(learn.includes('href="statistics.html" aria-label="Statistics Playground"'));
const privacy=await fs.readFile(path.join(dist,'privacy.html'),'utf8');
assert.ok(privacy.includes('Advertising is disabled in the current website and native build.'));
assert.ok(!privacy.includes('consent message is configured'));
assert.ok(privacy.includes('no application-set expiry period'));
console.log(`Static learning: ${count} substantive lessons, ${briefCount} complete independent briefs, collections, legacy routes, canonical URLs, sitemap, offline inventory, checkpoint fixes and privacy disclosures passed.`);
