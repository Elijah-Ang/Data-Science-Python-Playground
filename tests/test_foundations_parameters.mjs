import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const curriculum=require('../foundations/curriculum.js');
const parameters=require('../foundations/parameter-guide.js');
const visualise=curriculum.lessons.filter(lesson=>lesson.deck==='visualise');
const inventory=parameters.inventory(curriculum);
assert.equal(visualise.length,43,'Audit includes all Visualise cards and reviews');
assert.equal(visualise.filter(l=>l.review).length,7);
assert(inventory.length>1500,'Audit the complete final assembled material');
assert.deepEqual(inventory.filter(item=>!item.entry),[],'Every introduced keyword has an explanation');

// An independent Python AST checks real code against the browser lexer. An
// assignment, a string containing "jitter=", and an equality are not keywords.
const inputs=visualise.flatMap(lesson=>lesson.rounds.flatMap(round=>parameters.authoredFields(lesson,round,curriculum)));
const python=spawnSync('python3',['-c',String.raw`
import ast,json,sys
result=[]
for field in json.load(sys.stdin):
    try: tree=ast.parse(field['text'])
    except SyntaxError: continue
    keys=sorted({kw.arg for node in ast.walk(tree) if isinstance(node,ast.Call) for kw in node.keywords if kw.arg})
    result.append({'field':field['field'],'keywords':keys})
json.dump(result,sys.stdout)
`],{input:JSON.stringify(inputs),encoding:'utf8',timeout:30000});
assert.equal(python.status,0,python.stderr);
for(const item of JSON.parse(python.stdout)){
 const input=inputs.find(field=>field.field===item.field);
 const detected=new Set(parameters.keywords(input.text,{prose:input.prose,strictStandalone:input.strictStandalone}).map(x=>x.keyword));
 for(const keyword of item.keywords)assert(detected.has(keyword),item.field+': AST keyword '+keyword+' missing from inventory');
}
assert.deepEqual(parameters.keywords('note = "jitter=2"\n# alpha=0\nassert x == 3\nsns.stripplot(data=df, jitter=0.2)'),[{function:'sns.stripplot',keyword:'data'},{function:'sns.stripplot',keyword:'jitter'}]);
assert(parameters.keywords('unexplained_option=True',{prose:true,strictStandalone:true}).some(x=>x.keyword==='unexplained_option'),'New standalone option snippets cannot silently disappear');
assert.equal(parameters.lookup('sns.barplot','unexplained_option'),undefined);
for(const entry of Object.values(parameters.registry))for(const item of parameters.keywords(entry.example))assert(parameters.lookup(item.function,item.keyword),entry.id+' example introduces '+item.function+'.'+item.keyword+' and must explain it too');

let roundCount=0;
for(const lesson of visualise)for(const round of lesson.rounds){
 const entries=parameters.entriesFor(curriculum,lesson,round),html=parameters.render(curriculum,lesson,round);
 for(const item of inventory.filter(item=>item.round===round.id))assert(entries.some(entry=>entry.id===item.entry),round.id+' visibly explains '+item.function+'.'+item.keyword);
 for(const item of entries){
  for(const field of ['purpose','forms','range','default','effect','example','caveat','source'])assert.equal(typeof item[field],'string',round.id+' '+item.id+' '+field);
  assert(Object.values(item).every(value=>value!==''),round.id+' complete entry '+item.id);
  assert(html.includes('data-parameter="'+item.id+'"'),round.id+' renders '+item.id);
  assert(/https:\/\/github\.com\/(?:mwaskom\/seaborn\/blob\/v0\.13\.2|matplotlib\/matplotlib\/blob\/v3\.5\.2|pandas-dev\/pandas\/blob\/v2\.2\.0)\//.test(item.source),item.id+' pins a primary source');
 }
 assert(!html.includes('<details'),'Essential option explanations remain visible');
 assert(!html.includes('undefined'),round.id+' contains no missing copy');
 roundCount++;
}

// These options have different contracts despite sharing the same spelling.
const aggregation=parameters.lookup('sns.barplot','estimator');
assert(aggregation.forms.includes('string')&&aggregation.forms.includes('callable')&&aggregation.forms.includes('scalar'));
assert(!aggregation.forms.includes('None'),'barplot does not generically accept estimator=None');
assert(parameters.lookup('sns.lineplot','estimator').forms.includes('None'));
assert(parameters.lookup('sns.pointplot','estimator').range.includes('quantile'));
const lineLesson=curriculum.lessons.find(l=>l.id==='V18');
assert(parameters.entriesFor(curriculum,lineLesson,lineLesson.rounds[0]).filter(item=>item.keyword==='estimator').every(item=>item.id==='lineplot.estimator'),'Standalone lineplot examples inherit the lineplot contract');
const swarmLesson=curriculum.lessons.find(l=>l.id==='V14');
assert(parameters.entriesFor(curriculum,swarmLesson,swarmLesson.rounds[0]).filter(item=>item.keyword==='size').every(item=>item.id==='swarmplot.size'),'Blank starters and standalone size snippets retain a fixed-radius contract');
assert(parameters.lookup('sns.scatterplot','size').forms.includes('column'));
assert(parameters.lookup('sns.stripplot','size').forms.includes('points'));
assert(parameters.lookup('sns.stripplot','jitter').default.startsWith('True'));
assert(parameters.lookup('sns.stripplot','jitter').caveat.includes('True/1'));
assert(parameters.lookup('sns.stripplot','jitter').caveat.includes('numeric 1 uses a half-width of 1'));
assert(parameters.lookup('sns.stripplot','jitter').effect.includes('measured coordinate unchanged'));
assert(parameters.lookup('sns.regplot','ci').forms.includes('None'));
const intervals=parameters.lookup('sns.pointplot','errorbar');
for(const form of ['"ci"','"pi"','"se"','"sd"','callable','None'])assert(intervals.forms.includes(form),form);
assert(intervals.range.includes('multipliers')&&intervals.range.includes('percentile widths'));
assert(parameters.lookup('ax.bar','bottom').id==='bar.bottom');
assert(parameters.lookup('ax.set_ylim','bottom').id==='set_ylim.bottom');
assert(parameters.lookup('fig.subplots_adjust','bottom').id==='subplots_adjust.bottom');
assert(parameters.lookup('ax.tick_params','axis').id==='tick_params.axis');
assert(parameters.lookup('counts.div','axis').id==='axis');
assert(parameters.lookup('pd.DataFrame','index').id==='DataFrame.index');
assert(parameters.lookup('df.pivot_table','index').id==='pivot_table.index');
assert(parameters.lookup('ax.legend','title').id==='legend.title');
assert.equal(parameters.render(curriculum,curriculum.lessons.find(l=>l.id==='I01'),curriculum.lessons.find(l=>l.id==='I01').rounds[0]),'');

// Build and enhancement call the same renderer. This optional check is run
// after the normal serial build; it does not regenerate while authors edit.
if(process.argv.includes('--built'))for(const lesson of visualise){
 require('../learning-routes.js');
 const routes=globalThis.LearningRoutes;
 const page=fs.readFileSync(new URL('../dist/'+routes.url('data',lesson.deck+'/'+lesson.id+'/0'),import.meta.url),'utf8');
 const expected=parameters.render(curriculum,lesson,lesson.rounds[0]);
 const unstyled=html=>html.replace(/<\/?code\b[^>]*>/g,'');
 assert(unstyled(page).includes(unstyled(expected)),lesson.id+' static page contains the exact shared parameter content, allowing inline identifier decoration');
 for(const block of expected.match(/<pre\b[\s\S]*?<\/pre>/g)||[])assert(page.includes(block),lesson.id+' retains each exact pre/code example, not only its text');
}
const unique=[...new Set(inventory.map(item=>item.entry))];
console.log(`Parameter guide: ${visualise.length} cards, ${roundCount} rounds, ${inventory.length} introduced option occurrences, ${unique.length} reusable entries; independent AST coverage and function-specific contracts verified.`);
