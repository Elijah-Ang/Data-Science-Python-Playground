"""Audit every card and exercise visual for rendering, clipping and review alignment."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8010');p.add_argument('--engine',default='chromium');p.add_argument('--executable-path',help='Use an installed browser executable.');args=p.parse_args()
out=Path('tests/evidence/foundations/visual-audit');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 launch={'executable_path':args.executable_path} if args.executable_path else {}
 browser=getattr(pw,args.engine).launch(**launch);page=browser.new_page(viewport={'width':1400,'height':1000},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(args.base_url+'/data-foundations.html')
 page.wait_for_function('window.FoundationsCurriculum && window.FoundationVisuals')
 # Inspect geometry of each SVG at the actual card width and narrow mobile width.
 failures=[]
 for width in [1400,834,320]:
  page.set_viewport_size({'width':width,'height':1000})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for deck in ['inspect','wrangle','visualise']:
    page.evaluate('(deck)=>{location.hash="#"+deck}',deck)
    page.wait_for_function('(deck)=>document.body.dataset.deck===deck',arg=deck)
    bad=page.locator('.concept-visual').evaluate_all('''els=>els.flatMap(svg=>{
     const b=svg.viewBox.baseVal;
     return [...svg.querySelectorAll('text')].flatMap(t=>{
      const r=t.getBBox();
      // Review thumbnails carry their own transform; their group is checked visually.
      return !t.closest('g[transform]')&&(r.x<0||r.x+r.width>b.width||r.y<0||r.y+r.height>b.height)?[{visual:svg.dataset.visual,text:t.textContent,box:[r.x,r.y,r.width,r.height]}]:[];
     });
    })''')
    failures.extend([{'width':width,'theme':theme,'deck':deck,**b} for b in bad])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 # Essential stage teaching remains visible and the Reference panel stays absent.
 for route,variant in [('#inspect/I10/1','membership'),('#wrangle/W24/1','inner-merge'),('#visualise/V33/2','facets'),('#inspect/IR2/1','loc-list')]:
  page.evaluate('(route)=>{location.hash=route}',route)
  page.wait_for_function('''(route)=>LearningRoutes.route('data',location,document.body)===route.replace(/^#/,'')
   && document.querySelector('.foundation-practices [aria-current=step] strong')?.textContent===FoundationsCurriculum.lessons.find(l=>l.id===route.split('/')[1]).rounds[Number(route.split('/')[2])].label
   && !!document.querySelector('.foundation-task-reminder')''',arg=route)
  round_data=page.evaluate('''route=>{const r=FoundationsCurriculum.lessons.find(l=>l.id===route.split('/')[1]).rounds[Number(route.split('/')[2])];return {variant:r.visual.variant,teaching:r.teaching||null}}''',route)
  assert round_data['variant']==variant
  reference=page.locator('.foundation-reference-content .teaching-reference')
  assert reference.count()==0
  if round_data['teaching']:
   transition=page.locator('.foundation-content:not(.foundation-reference-content) .teaching-transition')
   assert transition.is_visible()
   assert transition.locator('pre').first.inner_text()==round_data['teaching']['code']
   assert transition.locator('.teaching-example-output' if round_data['teaching'].get('output') else '.teaching-example-result').is_visible()
  else:
   visual=page.locator('.foundation-content:not(.foundation-reference-content) .concept-visual')
   assert visual.is_visible() and visual.get_attribute('data-visual')==variant
 # The same source-backed example replaces a miniature on these primary views.
 # Check every native option through the mounted app at all existing audit widths
 # and themes, including exact data-linked results and readable SVG text.
 explorer_checks=[]
 cases=[('#inspect/I19S/0','summary-order','means move together'),
        ('#visualise/V04/0','histogram','8 bins'),
        ('#visualise/V08/0','count-bars','Count rows'),
        ('#visualise/V09/0','mean-bars','middle value after sorting'),
        ('#visualise/V11/0','boxplot','Q1=2, median=3, Q3=6'),
        ('#visualise/V16/0','scatter','x=6, value=18'),
        ('#visualise/V27/0','references','x median is 3'),
        ('#visualise/V33/0','facets','Each of 9 rows')]
 for width in [1400,834,320]:
  page.set_viewport_size({'width':width,'height':1000})
  for theme in ['light','dark']:
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for route,variant,expected in cases:
    page.evaluate('(route)=>location.hash=route',route)
    page.wait_for_function('''([route,variant])=>LearningRoutes.route('data',location,document.body)===route.replace(/^#/,'')&&!!document.querySelector('[data-foundation-explorer="'+variant+'"]')''',arg=[route,variant])
    explorer=page.locator('[data-foundation-explorer="'+variant+'"]')
    assert explorer.is_visible()
    control=explorer.locator('[data-visual-choice]')
    assert control.evaluate('e=>e.labels.length')==1
    height=control.evaluate('e=>e.getBoundingClientRect().height')
    if height<44:failures.append({'route':route,'width':width,'theme':theme,'touchTargetHeight':height})
    options=control.locator('option').evaluate_all('(items)=>items.map(e=>e.value)')
    baseline=explorer.locator(':scope > p').nth(1).inner_text()
    summaries=[]
    for option in options:
     control.select_option(option)
     summaries.append(explorer.locator('.teaching-visual-result').inner_text())
     assert explorer.locator(':scope > p').nth(1).inner_text()==baseline
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     bad=explorer.locator('svg').evaluate('''svg=>{const b=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].filter(t=>{const r=t.getBBox();return r.x<0||r.x+r.width>b.width+.5||r.y<0||r.y+r.height>b.height+.5}).map(t=>t.textContent)}''')
     assert not bad,(route,width,theme,bad)
    assert len(set(summaries))==len(options),(route,'every option has a distinct result')
    assert expected in summaries[-1],(route,summaries[-1])
    assert explorer.locator('.teaching-visual-result').get_attribute('aria-live')=='polite'
    # Canvas resolves CSS color-mix and named colors to actual RGB pixels.
    contrast=explorer.locator('svg').evaluate('''svg=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');
      const backing=getComputedStyle(svg.closest('.teaching-explorer')).backgroundColor;
      const rgb=color=>{c.clearRect(0,0,1,1);c.fillStyle=backing;c.fillRect(0,0,1,1);c.fillStyle=color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3)};
      const lum=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const bg=lum(getComputedStyle(svg).backgroundColor);
      return Math.min(...[...svg.querySelectorAll('text')].map(t=>{const fg=lum(getComputedStyle(t).fill);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}));
    }''')
    assert contrast>=4.5,(route,theme,'SVG text contrast',contrast)
    if route.startswith('#visualise/'):
     workflow=page.locator('.foundation-reference-content .teaching-full-workflow')
     assert workflow.count()==0
    explorer_checks.append({'route':route,'width':width,'theme':theme,'options':len(options),'contrast':round(contrast,2)})
 # Contact sheets contain every card at a consistent readable size in both themes.
 page.set_viewport_size({'width':1280,'height':1000})
 for theme in ['light','dark']:
  page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
  for deck in ['inspect','wrangle','visualise']:
   page.evaluate('''deck=>{
    document.body.dataset.deck=deck;
    document.querySelector('#foundationsMain').innerHTML='<div id="atlas" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'+FoundationsCurriculum.lessons.filter(l=>l.deck===deck).map(l=>'<div style="min-width:0;padding:8px;background:var(--panel);border:1px solid var(--border)"><p style="font:12px var(--mono);margin:0 0 8px">'+l.id+' · '+l.title+'</p>'+FoundationVisuals.diagram(l.visual)+'</div>').join('')+'</div>';
   }''',deck)
   page.locator('#atlas').screenshot(path=str(out/f'{args.engine}-{theme}-{deck}.png'))
 # Render every alternate-round scene too; these can differ from their library card.
 for theme in ['light','dark']:
  page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
  page.evaluate('''()=>{
   const cards=new Set(FoundationsCurriculum.lessons.map(l=>JSON.stringify(l.visual))),seen=new Set();
   document.querySelector('#foundationsMain').innerHTML='<div id="atlas" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'+FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map(r=>({l,r}))).filter(({r})=>{const key=JSON.stringify(r.visual);return !cards.has(key)&&!seen.has(key)&&seen.add(key)}).map(({l,r})=>'<div data-deck="'+l.deck+'" style="padding:8px;background:var(--panel)"><p>'+l.id+' · '+r.label+'</p>'+FoundationVisuals.diagram(r.visual)+'</div>').join('')+'</div>';
  }''')
  page.locator('#atlas').screenshot(path=str(out/f'{args.engine}-{theme}-alternate-rounds.png'))
  for item in page.locator('.concept-visual').evaluate_all('''els=>els.flatMap(svg=>[...svg.querySelectorAll('text')].filter(t=>{const r=t.getBBox();return r.x<0||r.x+r.width>260||r.y<0||r.y+r.height>108}).map(t=>({visual:svg.dataset.visual,text:t.textContent})))'''):
   failures.append({'theme':theme,**item})
 # Every authored round has a valid diagram, including restored review skills.
 inventory=page.evaluate('FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map(r=>({id:r.id,retrieves:r.retrieves})))')
 ids=[r['id'] for r in inventory]
 assert len(ids)==len(set(ids)), 'Authored exercise IDs must be unique'
 retrieves={r['id']:r.get('retrieves') for r in inventory}
 assert retrieves.get('VR1-4')=='V08' and retrieves.get('VR2-4')=='V17',retrieves
 result=page.evaluate('''()=>{
  let count=0;const failures=[];
  for(const l of FoundationsCurriculum.lessons)for(const r of l.rounds){
   const svg=FoundationVisuals.diagram(r.visual);count++;
   if(!svg.includes('Concept sketch:'))failures.push(r.id);
   if(r.retrieves){
    const source=FoundationsCurriculum.lessons.find(x=>x.id===r.retrieves).rounds[2];
    const expected=({"VR6-2":"stacked"})[r.id]||FoundationVisuals.activityVariants[r.id]||source.visual.variant;
    if(r.visual.variant!==expected)failures.push(r.id+' operation');
    // Retrieval asks a fresh question: V09's mean review and median Transfer
    // share a summary-bar concept but legitimately use different statistics.
    if(r.visual.statistic&&!(r.visual.statistic==='count'&&r.solution.includes('sns.countplot'))&&!r.solution.includes('estimator="'+r.visual.statistic+'"')&&!r.solution.includes('.'+r.visual.statistic+'('))failures.push(r.id+' statistic');
   }
  }
  return {count,failures};
 }''')
 assert result['count']==len(inventory) and not result['failures'],result
 # A queued editor scroll can arrive after route navigation removes its nodes.
 page.goto(args.base_url+'/data-foundations.html#inspect/I01/0')
 page.wait_for_selector('#foundationEditor')
 page.evaluate('window.retiredAuditEditor=document.getElementById("foundationEditor");location.hash="#inspect"')
 page.wait_for_selector('#foundationEditor',state='detached')
 page.evaluate('retiredAuditEditor.dispatchEvent(new Event("scroll"));delete window.retiredAuditEditor')
 (out/f'{args.engine}-report.json').write_text(json.dumps({'rounds':result,'clipping':failures,'explorers':explorer_checks,'pageErrors':errors},indent=2))
 assert not failures,failures
 assert not errors,errors
 browser.close()
print(f'All {len(inventory)} authored round diagrams, including VR1-4/V08 and VR2-4/V17, plus {len(explorer_checks)} primary explorer views passed three-width, two-theme geometry, contrast, interaction and retrieval checks.')
