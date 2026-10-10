import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

// Render the real lesson components into static HTML. Authored teaching remains
// in the existing curricula; browser enhancement replaces the same main region.
async function renderer(root,output,family){
  const main={innerHTML:''};
  const context=vm.createContext({
    URLSearchParams,console,
    document:{body:{dataset:{}},getElementById:()=>main},
    location:{hash:'',search:'',pathname:'/'},localStorage:{removeItem(){}},
    DataPlaygroundPrerender:true,
    fetch:async file=>({ok:true,json:async()=>JSON.parse(await fs.readFile(path.join(output,file),'utf8'))})
  });
  context.window=context;
  const dataFiles=['foundations/refinements.js','foundations/code-style.js','foundations/practical.js','foundations/progression.js','foundations/visuals.js','foundations/clarity.js','foundations/curriculum.js','challenges/registry.js','challenges/experience.js','foundations/workspace.js','foundations/teaching.js','foundations/learning-ui.js'];
  const mlFiles=['dataset-dictionary.js','foundations/learning-ui.js','challenges/experience.js','ml-learning/receipts.js','ml-learning/visuals.js'];
  for(const file of ['code-identifiers.js','learning-routes.js',...(family==='data'?dataFiles:mlFiles),family==='data'?'foundations/app.js':'ml-learning/app.js']){
    await vm.runInContext(await fs.readFile(path.join(root,file),'utf8'),context,{filename:file});
  }
  return context;
}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function withStarter(html,starter,context){
  if(!starter)return html;
  html=html.replace(/(<textarea\b[^>]*id="(?:foundationEditor|mlEditor)"[^>]*>)[\s\S]*?(<\/textarea>)/,(_,open,close)=>open+escape(starter)+close);
  html=html.replace(/(<pre id="(?:foundationHighlight|mlHighlight)"[^>]*>)[\s\S]*?(<\/pre>)/,(_,open,close)=>open+context.FoundationLearning.highlightPython(starter)+close);
  return html.replace('<div class="foundation-line-numbers" aria-hidden="true"></div>','<div class="foundation-line-numbers" aria-hidden="true">'+starter.split('\n').map((_,i)=>i+1).join('\n')+'</div>');
}
export async function buildLearningPages(root,output){
  const routes=[];
  for(const family of ['data','ml']){
    const context=await renderer(root,output,family), api=context.DataPlaygroundPrerender;
    const prefix=family==='data'?'data-foundations':'ml-learn';
    const template=await fs.readFile(path.join(root,prefix+'.html'),'utf8');
    const lessons=family==='data'?api.curriculum.lessons:api.curriculum.cards;
    const challengeDecks=[...new Set(api.challenges.map(c=>c.deck))].map(id=>api.curriculum.decks.find(deck=>deck.id===id)||{id,title:'Machine Learning'});
    const pages=[{route:'',title:family==='data'?'Data Foundations':'Machine Learning',description:family==='data'?'Inspect, clean, transform and visualise data with Python.':'Learn machine learning with visual explanations and Python practice.',html:api.landing()},
      ...api.curriculum.decks.map(deck=>({route:deck.id,title:deck.title,description:deck.description,html:api.deckPage(deck)})),
      ...lessons.map(lesson=>{
        const exercise=family==='data'?lesson.rounds[0]:lesson.exercises[0];
        const starter=family==='data'?context.FoundationWorkspace.code(api.curriculum,exercise):exercise.starter;
        return {route:lesson.deck+'/'+lesson.id+'/0',title:lesson.title,description:lesson.goal,html:withStarter(api.lessonPage(lesson,0),starter,context)};
      }),
      ...challengeDecks.map(deck=>({route:deck.id+'/challenges',title:deck.title+' Workflow Challenges',description:'Independent workflow briefs with inputs, deliverables and explained solutions.',html:api.challengeCollection(deck)})),
      ...api.challenges.map(challenge=>{
        if(!challenge.question||!challenge.inputs?.length||!challenge.deliverables?.length||!(challenge.solution||challenge.reference||challenge.exercise?.solution))throw new Error('Incomplete independent brief: '+challenge.id);
        const deck=challengeDecks.find(deck=>deck.id===challenge.deck);
        return {route:challenge.deck+'/challenges/'+challenge.id,title:challenge.title,description:challenge.question,html:withStarter(api.challengePage(challenge,deck),challenge.exercise?.starter||challenge.starter,context)};
      })];
    for(const page of pages){
      const file=context.LearningRoutes.url(family,page.route);
      let html=template.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escape(page.title)+' · Data Playground</title>')
        .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escape(page.description)+'">')
        .replace('<body ','<body data-learning-route="'+page.route+'" ')
        .replace(/(<main\b[^>]*id="foundationsMain"[^>]*>)[\s\S]*?(<\/main>)/,(_,open,close)=>open+context.LearningRoutes.rewriteHTML(family,page.html)+close)
        .replace(/<noscript>[\s\S]*?<\/noscript>/,'<noscript><p class="foundation-run-note">You can read this lesson and follow its links without JavaScript. Enable JavaScript to run Python and use the interactive practice controls.</p><style>.foundation-actions,.foundation-editor-jump,.ml-choice button{display:none}</style></noscript>');
      // Static back links must match the same navigation as the enhanced page.
      const [parent,kind,id]=page.route.split('/');
      const isBrief=kind==='challenges'&&id, isCollection=kind==='challenges'&&!id;
      const exit=isBrief?context.LearningRoutes.url(family,parent+'/challenges'):isCollection?context.LearningRoutes.url(family,''):page.route?context.LearningRoutes.url(family,page.route.includes('/')?parent:''):family==='ml'?'learn.html':'playground.html';
      const exitLabel=isBrief?'← All challenges':isCollection?'← Choose a deck':page.route.includes('/')?'← '+api.curriculum.decks.find(d=>d.id===parent).title+' lessons':page.route?'← Choose a deck':family==='ml'?'← Learn / Refresh':'← Data Playground';
      html=html.replace(/(<a href=")[^"]+(" class="back-playground">)[^<]+/,(_,open,rest)=>open+exit+rest+escape(exitLabel));
      await fs.writeFile(path.join(output,file),html);
      routes.push(file);
    }
  }
  console.log(`Rendered ${routes.length} learning pages from the existing lesson components.`);
  return routes;
}
