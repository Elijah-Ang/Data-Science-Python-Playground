"""Homepage wayfinding and latest-request exclusive pose regression."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--engine',choices=['chromium','webkit'],default='chromium')
parser.add_argument('--base-url',default='http://127.0.0.1:8000')
args=parser.parse_args()
base=args.base_url.rstrip('/')
out=Path('tests/evidence/learn-discovery');out.mkdir(parents=True,exist_ok=True)
report={'engine':args.engine,'wayfinding':[],'poses':[]}
def ready(page):
    page.wait_for_function("document.querySelector('.mascot-layer').complete && document.querySelector('.mascot-layer').naturalWidth>0")
    page.evaluate('document.fonts.ready')
def pointer_click(page,locator):
    bounds=locator.bounding_box()
    assert bounds
    page.mouse.click(bounds['x']+bounds['width']/2,bounds['y']+bounds['height']/2)
def keyboard_focus(page,locator):
    # Real Tab traversal establishes keyboard modality in WebKit. Programmatic
    # focus after a pointer click can retain its pointer :focus-visible policy.
    for _ in range(20):
        page.keyboard.press('Tab')
        if locator.evaluate('e=>e===document.activeElement'):
            assert locator.evaluate("e=>e.matches(':focus-visible')")
            assert locator.evaluate("e=>getComputedStyle(e).outlineStyle!=='none'")
            return
    raise AssertionError('Keyboard traversal did not reach the blimp choice')
def pose(page,name):
    try:
        page.wait_for_function("name=>document.querySelector('[data-mascot]').dataset.pose===name && document.querySelector('[data-mascot]').dataset.transition==='idle'",arg=name)
    except Exception:
        diagnostic={'expected':name,'width':width,'mode':mode}
        try:
            diagnostic.update(page.evaluate("""() => {
              const host=document.querySelector('[data-mascot]'),target=host.closest('a');
              return {host:{...host.dataset},focused:document.activeElement?.id,documentFocused:document.hasFocus(),hidden:document.hidden,
                focusedTarget:target.matches(':focus-within'),hoveredTarget:target.matches(':hover'),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
                layers:[...host.querySelectorAll('.mascot-layer')].map(i=>({pose:i.dataset.pose,complete:i.complete,width:i.naturalWidth,opacity:getComputedStyle(i).opacity,animations:i.getAnimations().map(a=>a.playState)})),
                events:window.poseEvents,frames:window.poseFrames?.slice(-5)};
            }"""))
        except Exception as error:
            diagnostic['observationError']=str(error)
        print('Pose failure: '+json.dumps(diagnostic),flush=True)
        try:
            (out/f'{args.engine}-pose-failure.json').write_text(json.dumps(diagnostic,indent=2)+'\n')
        except Exception as error:
            print('Could not save pose diagnostics: '+str(error),flush=True)
        raise
def monitor(page):
    page.evaluate("""() => {
      window.poseFrames=[];window.poseEvents=[];
      for(const type of ['focusin','focusout'])document.addEventListener(type,e=>poseEvents.push({type,target:e.target.id}));
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>poseEvents.push({type:'motion',reduced:e.matches,focused:document.activeElement?.id}));
      function sample(){
        const host=document.querySelector('[data-mascot]');
        const visible=[...host.querySelectorAll('.mascot-layer')].filter(i=>i.complete&&i.naturalWidth>0&&Number(getComputedStyle(i).opacity)>.001);
        poseFrames.push({count:visible.length,current:visible[0]?.dataset.pose,declared:host.dataset.pose});
        window.poseFrame=requestAnimationFrame(sample);
      } sample();
    }""")
def assert_frames(page):
    frames=page.evaluate('cancelAnimationFrame(poseFrame);poseFrames')
    assert len(frames)>30
    assert all(f['count']==1 and f['current']==f['declared'] for f in frames),[f for f in frames if f['count']!=1 or f['current']!=f['declared']][:8]
    return len(frames)

with sync_playwright() as p:
    browser=getattr(p,args.engine).launch()
    for width,height in [(1440,1000),(390,844)]:
        for motion in ['no-preference','reduce']:
            context=browser.new_context(viewport={'width':width,'height':height},reduced_motion=motion)
            page=context.new_page()
            page.add_init_script("""{
              const scroll=Element.prototype.scrollIntoView;
              window.scrollRequests=[];
              Element.prototype.scrollIntoView=function(options){scrollRequests.push({id:this.id,...options});return scroll.call(this,options)};
            }""")
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base+'/index.html');ready(page)
            navigation=[]
            page.on('framenavigated',lambda frame:navigation.append(frame.url) if frame==page.main_frame else None)
            home=page.url
            assert page.locator('.blimp-choice').evaluate_all("els=>els.map(e=>e.getAttribute('href'))")==['#learning-robot','#playground-gate']
            for index,target in [(0,'learning-robot'),(1,'playground-gate')]:
                link=page.locator('.blimp-choice').nth(index)
                link.evaluate("e=>e.scrollIntoView({behavior:'instant',block:'center'})")
                pointer_click(page,link)
                page.wait_for_timeout(350)
                assert page.url==home and not navigation
                assert page.evaluate('id=>document.activeElement.id===id',target)
                request=page.evaluate('scrollRequests.at(-1)')
                assert request=={'id':target,'behavior':'instant' if motion=='reduce' else 'smooth','block':'center'},request
                keyboard_focus(page,link);link.press('Enter');page.wait_for_timeout(350)
                assert page.url==home and not navigation
                assert page.evaluate('id=>document.activeElement.id===id',target)
                assert page.locator('#'+target).evaluate("(e)=>getComputedStyle(e).outlineStyle!=='none'"),{'target':target,'width':width,'motion':motion}
            for index in [0,1,0,1,0,1]:
                link=page.locator('.blimp-choice').nth(index);keyboard_focus(page,link);link.press('Enter')
            assert page.evaluate("document.activeElement.id==='playground-gate'")
            assert page.locator('.is-wayfinding').evaluate_all('els=>els.map(e=>e.id)')==['playground-gate']
            page.wait_for_timeout(600);assert page.url==home and not navigation
            assert not errors,errors
            page.screenshot(path=str(out/f'{args.engine}-wayfinding-{width}-{motion}.png'),full_page=True)
            page.locator('#learning-robot').click();page.wait_for_url('**/learn.html')
            page.goto(base+'/index.html');ready(page)
            page.locator('#playground-gate').click();page.wait_for_url('**/playground.html*')
            context.close()
            report['wayfinding'].append({'width':width,'motion':motion,'menu':'scroll/focus without navigation','targets':'actual clicks navigate','repeated':'latest focus/cue retained'})
        # Native anchors still locate the same page when scripts are unavailable.
        context=browser.new_context(java_script_enabled=False,reduced_motion='reduce',viewport={'width':width,'height':height})
        page=context.new_page();page.goto(base+'/index.html')
        for index,target in [(0,'learning-robot'),(1,'playground-gate')]:
            link=page.locator('.blimp-choice').nth(index);keyboard_focus(page,link);link.press('Enter')
            page.wait_for_timeout(150)
            assert page.url==base+'/index.html#'+target
            assert page.evaluate('id=>document.activeElement.id===id',target)
        page.locator('#learning-robot').click();page.wait_for_url('**/learn.html')
        page.goto(base+'/index.html');page.locator('#playground-gate').click();page.wait_for_url('**/playground.html*')
        context.close()

    for width,height in [(1440,1000),(390,844)]:
        for mode in ['normal','slow','failed']:
            context=browser.new_context(viewport={'width':width,'height':height})
            page=context.new_page()
            page.add_init_script("""{
              const mode=MODE;
              const decode=HTMLImageElement.prototype.decode;
              HTMLImageElement.prototype.decode=async function(){
                if(this.matches('.mascot-layer')&&this.dataset.pose==='teach'){
                  if(mode==='slow')await new Promise(r=>setTimeout(r,700));
                  if(mode==='failed')throw Error('optional teach decode failed');
                }
                return decode.call(this);
              };
            }""".replace('MODE',json.dumps(mode)))
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base+'/index.html');ready(page);monitor(page)
            robot=page.locator('#learning-robot');other=page.locator('.tour-button')
            robot.focus()
            if mode=='slow':
                page.wait_for_timeout(200)
                assert page.locator('[data-mascot]').get_attribute('data-pose')=='book'
            page.wait_for_timeout(1000)
            pose(page,'book' if mode=='failed' else 'teach')
            for _ in range(8):
                other.focus();page.wait_for_timeout(30)
                robot.focus();page.wait_for_timeout(30)
            other.focus();page.wait_for_timeout(1000);pose(page,'book')
            # Cancel a decode/motion request with page lifecycle interruption.
            robot.focus();page.wait_for_timeout(30)
            page.evaluate("dispatchEvent(new PageTransitionEvent('pagehide'))")
            current=page.locator('[data-mascot]').get_attribute('data-pose')
            page.wait_for_timeout(800)
            assert page.locator('[data-mascot]').get_attribute('data-pose')==current
            assert page.locator('[data-mascot]').get_attribute('data-paused')=='true'
            page.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
            page.wait_for_timeout(1000);pose(page,'book' if mode=='failed' else 'teach')
            # Reduced motion cancels pending requests, returns to decoded book,
            # and resumes the current interaction when motion is enabled again.
            page.emulate_media(reduced_motion='reduce')
            page.wait_for_timeout(1000);pose(page,'book')
            assert page.locator('.mascot-idle').evaluate("(e)=>getComputedStyle(e).animationName==='none'")
            assert page.locator('.mascot-layer').evaluate_all("els=>els.every(e=>e.getAnimations().every(a=>a.playState!=='running'))")
            page.wait_for_timeout(300);pose(page,'book')
            page.emulate_media(reduced_motion='no-preference')
            page.wait_for_timeout(1000);pose(page,'book' if mode=='failed' else 'teach')
            other.focus();page.wait_for_timeout(1000);pose(page,'book')
            assert not errors,errors
            count=assert_frames(page)
            context.close()
            report['poses'].append({'width':width,'mode':mode,'frames':count,'visible':'exactly one decoded current pose','interruptions':'latest request, pagehide/pageshow and reduced-motion switch'})

    browser.close()
(out/f'{args.engine}-homepage-interactions.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
