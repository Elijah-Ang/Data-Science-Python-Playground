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
assert.equal(routes.url('data','inspect/challenges/DC-I01'),'data-foundations.html#inspect/challenges/DC-I01');
assert.equal(routes.route('data',{hash:'#chapter-1',search:''},{dataset:{learningRoute:'inspect'}}),'inspect/chapter/1');
const require=createRequire(import.meta.url),data=require('../foundations/curriculum.js');
const ml=JSON.parse(await fs.readFile(path.join(dist,'ml-learning/curriculum.json'),'utf8'));
const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
const worker=await fs.readFile(path.join(dist,'service-worker.js'),'utf8');
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
console.log(`Static learning: ${count} substantive lessons, all decks, legacy routes, canonical URLs, sitemap, offline inventory, checkpoint fixes and privacy disclosures passed.`);
