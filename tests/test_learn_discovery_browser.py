"""Discovery routing, real overlapping pose animation, lifecycle and visual evidence."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--base-url',default='http://127.0.0.1:8010');args=p.parse_args()
out=Path('tests/evidence/learn-discovery');out.mkdir(parents=True,exist_ok=True)
report={'engine':args.engine,'checks':[],'screenshots':[]};base=args.base_url
with sync_playwright() as pw:
 browser=getattr(pw,args.engine).launch();context=browser.new_context();page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/index.html');page.wait_for_function('document.querySelector(".mascot-layer").complete')
 cta=page.get_by_role('link',name='Open Learn and Refresh');assert cta.count()==1
 assert 'Optional' in cta.inner_text();assert page.locator('.mascot-layer').count()==2
 page.wait_for_function('document.querySelector("[data-scene]").dataset.motion==="ready"',timeout=60000)
 assert page.locator('.scene-motion').is_visible()
 bounds=page.locator('.mascot-viewport').bounding_box()
 # Sample the browser's real animation timeline: both images must be visible together.
 page.evaluate("""()=>{
  window.blendEvidence=new Promise(resolve=>{
   const sample=()=>{
    const layers=[...document.querySelectorAll('.mascot-layer')];
    const opacity=layers.map(e=>+getComputedStyle(e).opacity);
    if(opacity.every(x=>x>.15&&x<.85)){
     resolve({opacity,keys:layers.flatMap(e=>e.getAnimations().flatMap(a=>a.effect.getKeyframes().map(k=>Object.keys(k))))});
    }else requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
 }""")
 cta.focus()
 evidence=page.evaluate('()=>Promise.race([blendEvidence,new Promise((_,reject)=>setTimeout(()=>reject(new Error("No overlapping pose transition observed")),10000))])')
 assert all(.15<x<.85 for x in evidence['opacity']),evidence
 assert page.locator('.mascot-viewport').bounding_box()==bounds
 assert evidence['keys'] and all(not any(k in ['top','left','width','height'] for k in keys) for keys in evidence['keys'])
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.transition==="idle"')
 assert page.locator('[data-mascot]').get_attribute('data-pose')=='teach'
 assert 'none' != cta.evaluate('(e)=>getComputedStyle(e).outlineStyle')
 # A leave during a blend queues the return instead of snapping an active image.
 page.locator('.tour-button').focus();page.mouse.move(0,0)
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.pose==="book" && document.querySelector("[data-mascot]").dataset.transition==="idle"')
 cta.hover();page.wait_for_function('document.querySelector("[data-mascot]").dataset.transition==="blending"');page.mouse.move(0,0)
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.pose==="book" && document.querySelector("[data-mascot]").dataset.transition==="idle"')
 report['checks'].append('Real overlapping layers, transform/opacity-only motion, fixed viewport, focus and queued hover reactions')
 # Accelerate dwell timers, while retaining browser animation assertions above.
 page.clock.install();seen=set();assets=set()
 page.evaluate('''()=>{window.observedPoses=new Set(['book']);window.observedAssets=new Set();new MutationObserver(()=>{observedPoses.add(document.querySelector('[data-mascot]').dataset.pose);document.querySelectorAll('.mascot-layer').forEach(e=>observedAssets.add(e.src));}).observe(document.querySelector('[data-mascot]'),{attributes:true,subtree:true});}''')
 for _ in range(21):
  page.clock.run_for(5200);page.wait_for_timeout(30)
  seen.add(page.locator('[data-mascot]').get_attribute('data-pose'))
  assets.update(page.locator('.mascot-layer').evaluate_all('els=>els.map(e=>e.src)'))
 seen.update(page.evaluate('[...observedPoses]'));assets.update(page.evaluate('[...observedAssets]'))
 assert {'book','wave','think','teach','code','celebrate'}<=seen,seen
 assert len(set(assets))==6,assets
 for url in set(assets):assert page.request.get(url).status==200
 # Simulate the browser lifecycle event and hidden state, then inspect stopped timers/motion.
 page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
 old=page.locator('[data-mascot]').get_attribute('data-pose');page.clock.run_for(15000)
 assert page.locator('[data-mascot]').get_attribute('data-pose')==old
 assert page.locator('.mascot-idle').evaluate('(e)=>getComputedStyle(e).animationPlayState')=='paused'
 page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
 assert page.locator('[data-mascot]').get_attribute('data-paused')=='false'
 page.evaluate('dispatchEvent(new PageTransitionEvent("pagehide"))');page.clock.run_for(10000)
 assert page.locator('[data-mascot]').get_attribute('data-paused')=='true'
 page.evaluate('dispatchEvent(new PageTransitionEvent("pageshow"))')
 page.emulate_media(reduced_motion='reduce');page.clock.run_for(30000)
 assert page.locator('[data-mascot]').get_attribute('data-pose')=='book'
 assert page.locator('.mascot-idle').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
 cta.focus();page.clock.run_for(6000);assert page.locator('[data-mascot]').get_attribute('data-pose')=='book'
 report['checks'].append('Six assets and choreographed poses; hidden/pagehide pause; reduced-motion static book including focus')
 # Navigation stays native for the new CTA; the original gate remains intact.
 cta.click();page.wait_for_url('**/learn.html')
 assert page.locator('.learn-path.is-available').get_attribute('href')=='data-foundations.html'
 for subject in ['Statistics','Machine Learning']:
  url=page.url;button=page.locator(f'[data-coming-soon="{subject}"]');assert 'coming soon' in button.inner_text().lower()
  button.click();assert page.url==url;assert page.locator('#pathAnnouncement').inner_text()==subject+' lessons are coming soon.'
 page.locator('.is-available').click();page.wait_for_url('**/data-foundations.html')
 assert page.locator('.foundation-deck').count()==3
 page.goto(base+'/learn.html');page.locator('.back-playground').click();page.wait_for_url('**/index.html')
 # Use a fresh page, with real time for the existing gate's transition.
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/index.html');page.locator('.gate-hitbox').click();page.wait_for_url('**/playground.html')
 shortcut=page.locator('.learn-refresh');assert shortcut.get_attribute('href')=='data-foundations.html'
 shortcut.click();page.wait_for_url('**/data-foundations.html')
 report['checks'].append('Robot → hub → existing Foundations; planned cards stay put; hub Back; unchanged gate and direct Data shortcut')
 # Screenshot both appearance settings. Landing intentionally retains production beige.
 for width,height in [(1600,1000),(1280,800),(834,1112),(390,844),(320,740)]:
  page.set_viewport_size({'width':width,'height':height})
  for theme in ['light','dark']:
   page.goto(base+'/learn.html');page.evaluate('(t)=>AppAppearance.apply(t)',theme)
   for route in ['index','learn']:
    page.goto(base+'/'+route+'.html');page.wait_for_timeout(250)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,theme,route)
    if route=='index':
     assert page.locator('.mascot-bubble').is_visible()
     for part in ['.mascot-bubble','.mascot-viewport']:
      box=page.locator(part).bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1,(width,part,box)
     a=page.locator('.welcome-title-copy').bounding_box();b=page.locator('.mascot-cta').bounding_box();assert b['x']>=a['x']+a['width']-1 or b['y']>=a['y']+a['height']-1,(a,b)
     assert page.locator('.mascot-viewport').bounding_box()['height'] in [110,150,180]
    else:
     assert page.locator('body').get_attribute('data-theme')==theme
     assert page.locator('.learn-path').count()==3
    f=out/f'{args.engine}-{route}-{width}-{theme}.png';page.screenshot(path=str(f),full_page=True);report['screenshots'].append(str(f))
 # No script dependency for the two available routes and planned status labels.
 nojs=browser.new_context(java_script_enabled=False);p2=nojs.new_page();p2.goto(base+'/index.html');assert p2.locator('.mascot-cta').is_visible();p2.locator('.mascot-cta').click();assert p2.locator('.is-available').is_visible();nojs.close()
 assert not errors,errors
 report['checks'].append('Five viewports, both appearance settings, no overlap/overflow, static no-JavaScript fallback, no page errors')
 browser.close()
(out/f'{args.engine}-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
