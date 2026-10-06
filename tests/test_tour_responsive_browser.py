"""Tour targets, latest-request cancellation and normal-speed regression.

All embedded tour pages must be inert script-free captures; no Python loads.
"""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8132');p.add_argument('--engine',choices=['chromium','webkit'],default='chromium');p.add_argument('--evidence-dir',default='../evidence');a=p.parse_args();out=Path(a.evidence_dir);out.mkdir(parents=True,exist_ok=True)
records=[]
def wait_step(page,index,timeout=12000):
 page.wait_for_function("i=>document.querySelector('.viewport')?.dataset.index===String(i) && document.querySelector('.viewport').dataset.state==='ready'",arg=index,timeout=timeout)
 assert page.locator('#camera iframe').count()==1
 assert page.frame_locator('#siteFrame').locator('script').count()==0
 assert page.locator('#tourStatus').is_hidden()
 assert page.locator('#siteFrame').get_attribute('sandbox')=='allow-same-origin'
 assert page.locator('.steps [aria-current="step"]').inner_text()==str(index+1).zfill(2)
 title=page.evaluate('(i)=>TOUR_CONTENT.chapters[i].title',index);expect(page.locator('#headline')).to_have_text(title)
 spot=page.locator('#spotlight').bounding_box();vp=page.locator('.viewport').bounding_box()
 assert spot['width']>10 and spot['height']>10
 assert spot['x']>=vp['x']-2 and spot['y']>=vp['y']-2 and spot['x']+spot['width']<=vp['x']+vp['width']+2 and spot['y']+spot['height']<=vp['y']+vp['height']+2
with sync_playwright() as pw:
 browser=getattr(pw,a.engine).launch();ctx=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block');page=ctx.new_page();errors=[];python=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:python.append(r.url) if '/pyodide/' in r.url or '/runtime-source.js' in r.url or '/worker.js' in r.url else None)
 page.goto(a.base_url+'/index.html');page.get_by_role('link',name='Take a short tour',exact=False).click();wait_step(page,0)
 # A settled single click keeps the original gentle camera duration.
 page.wait_for_timeout(700);start=time.monotonic();page.locator('#next').click();wait_step(page,1);duration=time.monotonic()-start
 assert duration>=2.2,(duration,'single-click animation was accelerated');assert page.locator('.viewport').get_attribute('data-motion')=='normal'
 records.append(['settled single click',round(duration,3),'normal camera speed retained'])
 # Rapid requests use current requested index; there is no queued animation replay.
 page.locator('#next').click();page.locator('#next').dispatch_event('click');page.locator('#next').dispatch_event('click');page.locator('#next').dispatch_event('click');start=time.monotonic();wait_step(page,5);latency=time.monotonic()-start;assert latency<2.0,latency
 page.locator('#back').click();page.locator('#back').dispatch_event('click');page.locator('#next').dispatch_event('click');page.locator('#back').dispatch_event('click');wait_step(page,3)
 for _ in range(12):page.locator('#next').dispatch_event('click');page.locator('#back').dispatch_event('click')
 wait_step(page,3);page.wait_for_timeout(500);wait_step(page,3)
 records.append(['rapid Next/Back and alternating',round(latency,3),'latest chapter, copy, frame, highlight and stop agree; one frame remains'])
 # Keyboard endpoints clamp; the final Next never loops to the beginning.
 page.keyboard.press('Home');wait_step(page,0);expect(page.locator('#back')).to_be_disabled();page.keyboard.press('ArrowLeft');wait_step(page,0)
 page.keyboard.press('End');wait_step(page,24);expect(page.locator('#next')).to_be_disabled();page.keyboard.press('ArrowRight');wait_step(page,24)
 page.locator('#next').dispatch_event('click');wait_step(page,24);page.locator('#replayTour').click();wait_step(page,0)
 records.append(['bounds and keyboard','Home/End/arrows, disabled first Back/final Next, explicit Replay'])
 # Cancel during movement and reopen through the ordinary homepage link.
 for close in ['#skipTour','.home-link']:
  page.locator('#next').click();assert page.locator('.viewport').get_attribute('data-state')=='moving';page.locator(close).click();page.wait_for_url('**/index.html');page.get_by_role('link',name='Take a short tour',exact=False).click();wait_step(page,0)
 records.append(['Skip and Close during movement','return home, reopen fresh at first stop without stale transitions'])
 page.locator('#next').click();page.set_viewport_size({'width':320,'height':844});wait_step(page,1);assert page.locator('body').get_attribute('data-layout')=='mobile';assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.set_viewport_size({'width':1440,'height':1000});page.wait_for_function("document.body.dataset.layout==='wide'");wait_step(page,1);assert page.locator('body').get_attribute('data-layout')=='wide'
 records.append(['resize during movement','same requested chapter, updated profile, correct highlight and one frame'])
 # Reduced motion: every stop, both profiles; target presence and visibility audited.
 page.emulate_media(reduced_motion='reduce')
 for width,height in [(390,844),(1440,1000)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_function("p=>document.body.dataset.layout===p",arg='mobile' if width<1000 else 'wide');page.keyboard.press('Home');wait_step(page,0)
  chapters=page.evaluate('TOUR_CONTENT.chapters')
  for i,c in enumerate(chapters):
   if i:page.locator('#next').click()
   wait_step(page,i)
   assert page.locator('.viewport').get_attribute('data-motion')=='immediate'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   if c['scene'] in ['data','ml','stats'] and c['focus']=='route':
    frame=page.frame_locator('#siteFrame');assert frame.locator('.step-route-range').count()==1;assert frame.locator('.step-route-stop').count()==int(frame.locator('.step-route-range').get_attribute('max'))+1
    copy=' '.join(page.locator('#description,#context').all_inner_texts()).lower();assert 'editable cell' in copy and ('runs automatically' in copy or 'runs when' in copy) and (('dragging previews' in copy and 'release runs only the chosen step' in copy) or 'dragging runs no intermediate steps' in copy)
   if c['scene']=='learn':assert page.frame_locator('#siteFrame').get_by_role('link',name='Machine Learning',exact=False).count()>0
   if c['scene'] in ['home','ml-validate','ml-tune']:
    page.locator('#enlargePreview').click();expect(page.locator('#previewDialog')).to_be_visible();assert page.locator('#previewDetail iframe').count()==1;page.locator('#closePreview').click()
  page.screenshot(path=str(out/f'tour-{width}-last.png'))
 records.append(['reduced motion','all 25 stops in both desktop/mobile profiles, actual targets, enlargement, endpoint and reflow'])
 assert not python,python;assert not errors,errors
 (out/f'tour-browser-{a.engine}.json').write_text(json.dumps({'browser':browser.version,'engine':a.engine,'records':records,'python_requests':python,'page_errors':errors,'scope':'Normal speed sampled; target visibility all 50 profile/stops; no assignment submission.'},indent=2)+'\n');browser.close()
 print(json.dumps(records))
