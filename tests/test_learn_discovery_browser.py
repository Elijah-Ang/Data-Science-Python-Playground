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
 assert 'Learn / Refresh' in cta.inner_text();assert page.locator('.mascot-layer').count()==2
 page.wait_for_function('document.querySelector("[data-scene]").dataset.motion==="ready"',timeout=60000)
 assert page.locator('.scene-motion').is_visible()
 page.evaluate('document.fonts.ready')
 def document_bounds():
  return page.locator('.mascot-viewport').evaluate('(e)=>{const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
 bounds=document_bounds()
 # Hold the real WAAPI effects at their midpoint so software-rendered CI frames
 # cannot skip the brief overlap. Do not substitute the controller or its effects.
 page.evaluate("""()=>{
  const animate=Element.prototype.animate;
  window.heldPoseAnimations=[];
  window.holdPoseAnimations=()=>{window.heldPoseAnimations=[];Element.prototype.animate=function(...args){
   const animation=animate.apply(this,args);
   if(this.matches('.mascot-layer')){
    animation.pause();animation.currentTime=150;heldPoseAnimations.push(animation);
   }
   return animation;
  };};
  holdPoseAnimations();
  window.restorePoseAnimation=()=>{Element.prototype.animate=animate;heldPoseAnimations.forEach(a=>a.play());};
 }""")
 cta.focus()
 page.wait_for_function('heldPoseAnimations.length===2')
 evidence=page.locator('.mascot-layer').evaluate_all("""layers=>({
  opacity:layers.map(e=>+getComputedStyle(e).opacity),
  keys:layers.flatMap(e=>e.getAnimations().flatMap(a=>a.effect.getKeyframes().map(k=>Object.keys(k))))
 })""")
 assert all(.15<x<.85 for x in evidence['opacity']),evidence
 actual_bounds=document_bounds()
 assert all(abs(actual_bounds[k]-bounds[k])<1 for k in bounds),(bounds,actual_bounds)
 assert evidence['keys'] and all(not any(k in ['top','left','width','height'] for k in keys) for keys in evidence['keys'])
 page.evaluate('restorePoseAnimation()')
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.transition==="idle"')
 assert page.locator('[data-mascot]').get_attribute('data-pose')=='teach'
 assert 'none' != cta.evaluate('(e)=>getComputedStyle(e).outlineStyle')
 # A leave during a blend queues the return instead of snapping an active image.
 page.locator('.tour-button').focus();page.mouse.move(0,0)
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.pose==="book" && document.querySelector("[data-mascot]").dataset.transition==="idle"')
 page.evaluate('holdPoseAnimations()')
 cta.hover();page.wait_for_function('document.querySelector("[data-mascot]").dataset.transition==="blending"');page.mouse.move(0,0)
 page.evaluate('restorePoseAnimation()')
 page.wait_for_function('document.querySelector("[data-mascot]").dataset.pose==="book" && document.querySelector("[data-mascot]").dataset.transition==="idle"')
 report['checks'].append('Real overlapping layers, transform/opacity-only motion, fixed viewport, focus and queued hover reactions')
 # The original WebGL scene is already verified above and by its own regression.
 # Use its supported static fallback during the accelerated mascot-only sequence,
 # avoiding thousands of unrelated software-rendered GPU frames on CI.
 page.evaluate("document.querySelector('.scene-motion').getContext('webgl').getExtension('WEBGL_lose_context').loseContext()")
 page.wait_for_function('document.querySelector("[data-scene]").dataset.motion==="fallback"')
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
 assert page.locator('.learn-path.is-available[data-path="data"]').get_attribute('href')=='data-foundations.html?from=learn'
 assert page.locator('.learn-path.is-available[data-path="ml"]').get_attribute('href')=='ml-learn.html?from=learn'
 assert page.locator('.path-status').count()==0
 assert page.locator('.path-lock').count()==1
 for card in page.locator('.is-planned').all():
  outer=card.bounding_box();lock=card.locator('.path-lock').bounding_box()
  assert abs(outer['x']+outer['width']/2-lock['x']-lock['width']/2)<2
  assert abs(outer['y']+outer['height']/2-lock['y']-lock['height']/2)<4
  assert card.evaluate('(e)=>getComputedStyle(e,"::before").backgroundColor')!='rgba(0, 0, 0, 0)'

 for subject in ['Statistics']:
  url=page.url;button=page.locator(f'[data-coming-soon="{subject}"]');assert 'coming soon' in button.inner_text().lower()
  button.click();assert page.url==url;assert page.locator('#pathAnnouncement').inner_text()==subject+' lessons are coming soon.'
 page.locator('.is-available[data-path="data"]').click();page.wait_for_url('**/data-foundations.html?from=learn')
 assert page.locator('.back-playground').get_attribute('href')=='learn.html'
 assert page.locator('.hero-note,.foundation-note,.foundation-guidance').count()==0
 page.reload();assert page.locator('.back-playground').get_attribute('href')=='learn.html'
 page.locator('.foundation-deck').first.click()
 assert page.locator('.back-playground').inner_text()=='← Choose a deck'
 page.locator('.back-playground').click()
 assert page.locator('.back-playground').get_attribute('href')=='learn.html'
 page.locator('.back-playground').click();page.wait_for_url('**/learn.html')
 assert page.locator('.back-playground').inner_text()=='← Home'
 page.locator('.is-available[data-path="data"]').click();page.wait_for_url('**/data-foundations.html?from=learn')
 assert page.locator('.foundation-deck').count()==3
 page.goto(base+'/learn.html');page.locator('.back-playground').click();page.wait_for_url('**/index.html')
 # Use a fresh page, with real time for the existing gate's transition.
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/index.html');page.locator('.gate-hitbox').click();page.wait_for_url('**/playground.html')
 shortcut=page.locator('.learn-refresh');assert shortcut.get_attribute('href')=='data-foundations.html'
 shortcut.click();page.wait_for_url('**/data-foundations.html')
 assert page.locator('.back-playground').get_attribute('href')=='playground.html'
 assert page.locator('.back-playground').inner_text()=='← Data Playground'
 report['checks'].append('Robot → hub → existing Foundations; planned cards stay put; hub Back; unchanged gate and direct Data shortcut')
 # Freeze motion for reproducible responsive captures. Real motion was tested above
 # and remains covered by the dedicated landing regression.
 page.emulate_media(reduced_motion='reduce')
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
     a=page.locator('.welcome-title-copy').bounding_box();b=page.locator('.mascot-cta').bounding_box()
     # The current garden landing places desktop copy beside the scene;
     # test readable separation, not the superseded centred-title coordinates.
     assert a['x']>=0 and a['x']+a['width']<=width+1,(width,a)
     separated=(a['x']+a['width']<=b['x']+1 or b['x']+b['width']<=a['x']+1 or a['y']+a['height']<=b['y']+1 or b['y']+b['height']<=a['y']+1)
     assert separated,(width,a,b)
     assert b['width']>=44 and b['height']>=44
    else:
     assert page.locator('body').get_attribute('data-theme')==theme
     assert page.locator('.learn-path').count()==3
     assert page.locator('.learn-robot').count()==0
    f=out/f'{args.engine}-{route}-{width}-{theme}.png';page.screenshot(path=str(f),full_page=True);report['screenshots'].append(str(f))
 # No script dependency for the two available routes and planned status labels.
 nojs=browser.new_context(java_script_enabled=False);p2=nojs.new_page();p2.goto(base+'/index.html');assert p2.locator('.mascot-cta').is_visible();p2.locator('.mascot-cta').click();assert p2.locator('.is-available[data-path="data"]').is_visible();nojs.close()
 assert not errors,errors
 report['checks'].append('Five viewports, both appearance settings, no overlap/overflow, static no-JavaScript fallback, no page errors')
 browser.close()
(out/f'{args.engine}-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
