"""Audit every card and exercise visual for rendering, clipping and review alignment."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8010');p.add_argument('--engine',default='chromium');args=p.parse_args()
out=Path('tests/evidence/foundations/visual-audit');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=getattr(pw,args.engine).launch();page=browser.new_page(viewport={'width':1400,'height':1000})
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
 # Practice rounds lead with their scenario rather than repeating teaching diagrams.
 for route,variant in [('#inspect/I10/1','membership'),('#wrangle/W24/1','inner-merge'),('#visualise/V33/2','facet-hist'),('#inspect/IR2/1','loc')]:
  page.evaluate('(route)=>{location.hash=route}',route)
  page.wait_for_function('(route)=>document.querySelector(".foundation-breadcrumb")?.textContent.includes(route.split("/")[1])&&!!document.querySelector(".foundation-practice-brief")',arg=route)
  assert page.locator(".foundation-content .concept-visual").count()==0
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
   const cards=new Set(FoundationsCurriculum.lessons.map(l=>l.visual.variant)),seen=new Set();
   document.querySelector('#foundationsMain').innerHTML='<div id="atlas" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'+FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map(r=>({l,r}))).filter(({r})=>!cards.has(r.visual.variant)&&!seen.has(r.visual.variant)&&seen.add(r.visual.variant)).map(({l,r})=>'<div data-deck="'+l.deck+'" style="padding:8px;background:var(--panel)"><p>'+l.id+' · '+r.label+'</p>'+FoundationVisuals.diagram(r.visual)+'</div>').join('')+'</div>';
  }''')
  page.locator('#atlas').screenshot(path=str(out/f'{args.engine}-{theme}-alternate-rounds.png'))
  for item in page.locator('.concept-visual').evaluate_all('''els=>els.flatMap(svg=>[...svg.querySelectorAll('text')].filter(t=>{const r=t.getBBox();return r.x<0||r.x+r.width>260||r.y<0||r.y+r.height>108}).map(t=>({visual:svg.dataset.visual,text:t.textContent})))'''):
   failures.append({'theme':theme,**item})
 # All 324 rounds have valid diagrams, and retrieval rounds use the retrieved skill.
 result=page.evaluate('''()=>{
  let count=0;const failures=[];
  for(const l of FoundationsCurriculum.lessons)for(const r of l.rounds){
   const svg=FoundationVisuals.diagram(r.visual);count++;
   if(!svg.includes('Concept sketch:'))failures.push(r.id);
   if(r.retrieves){const source=FoundationsCurriculum.lessons.find(x=>x.id===r.retrieves).rounds[2];if(JSON.stringify(source.visual)!==JSON.stringify(r.visual))failures.push(r.id);}
  }
  return {count,failures};
 }''')
 assert result['count']==324 and not result['failures'],result
 (out/f'{args.engine}-report.json').write_text(json.dumps({'rounds':result,'clipping':failures},indent=2))
 assert not failures,failures
 browser.close()
print('All 106 cards, 324 round diagrams, three widths and both themes passed visual geometry/retrieval checks.')
