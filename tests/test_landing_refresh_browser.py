"""Reference garden: responsive reading, refresh, sprite motion and native routes."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--engine', default='chromium')
parser.add_argument('--base-url', default='http://127.0.0.1:8001')
args = parser.parse_args()
base = args.base_url.rstrip('/')
out = Path('tests/evidence/learn-discovery')
out.mkdir(parents=True, exist_ok=True)
report = {'engine': args.engine, 'viewports': []}

with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    page = browser.new_page(reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width, height in [(1920, 1200), (1448, 1086), (1280, 900), (1024, 1366), (834, 1112), (390, 844), (320, 740)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.goto(base + '/index.html')
        page.evaluate('document.fonts.ready')
        page.wait_for_function("[...document.images].every(i=>i.complete && i.naturalWidth>0)")
        for _ in range(2):
            page.reload()
            page.evaluate('document.fonts.ready')
            page.wait_for_function("[...document.images].every(i=>i.complete && i.naturalWidth>0)")
            assert page.locator('.scene-art').is_visible()
            assert page.locator('.garden-cat').is_visible()
            assert page.locator('.garden-slider').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), width
        plate = page.locator('.scene-art').evaluate('(e)=>e.currentSrc')
        assert ('garden-desktop-clean-v2' in plate) == (width >= 1100), (width, plate)
        assert page.locator('.garden-tire').is_visible() == (width >= 1100)
        assert page.locator('.welcome-subtitle').is_visible() == (width < 1100)
        assert page.locator('.welcome-value-grid li').count() == 9
        assert 'a visible association' not in page.locator('body').inner_text().lower()
        assert page.locator('.landing-header a').evaluate_all('(a)=>a.map(e=>e.getAttribute("href"))') == ['about.html', 'tutorial.html']
        assert page.locator('.landing-footer a').evaluate_all('(a)=>a.map(e=>e.getAttribute("href"))') == ['help.html', 'privacy.html', 'acknowledgements.html']
        # Read the final bullet's real box, so text cannot quietly paint over wood.
        for card in page.locator('.welcome-value-grid article').all():
            rect = card.bounding_box()
            last = card.locator('li').last.bounding_box()
            assert last['y'] + last['height'] <= rect['y'] + rect['height'] - 4, (width, rect, last)
            assert card.evaluate('(e)=>e.scrollWidth <= e.clientWidth + 1'), width
        # Measure opaque sprite pixels rather than comparing PNG canvas padding.
        sizes = page.locator('.mascot-layer:first-child,.garden-cat,.garden-slider').evaluate_all('''images=>images.map(image=>{
            const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
            const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
            const data=ctx.getImageData(0,0,c.width,c.height).data;let top=c.height,bottom=0;
            for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>200){top=Math.min(top,y);bottom=Math.max(bottom,y);}
            return (bottom-top+1)/c.height*image.getBoundingClientRect().height;
        })''')
        if width >= 1100:
            guide, slider, cat = sizes
            assert .78 * guide < slider < .95 * guide, (width, sizes)
            assert max(guide, cat) / min(guide, cat) < 1.2, (width, sizes)
            # The cat's opaque feet must touch sand inside the pit, below its
            # rear wooden rim. PNG padding must not determine ground contact.
            feet = page.locator('.garden-cat').evaluate('''image=>{
                const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
                const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
                const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let bottom=0;
                for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>200)bottom=Math.max(bottom,y);
                const r=image.getBoundingClientRect(),scene=document.querySelector('.scene-actors').getBoundingClientRect();
                return (r.top+(bottom+1)/canvas.height*r.height-scene.top)/scene.height;
            }''')
            assert .87 < feet < .94, (width, feet, 'Cat must sit inside the sandpit')
            # All phrases use equal type and centre in the plaque's usable
            # area, allowing the same left-hand space for each number badge.
            headings = page.locator('.column-label').evaluate_all('''nodes=>nodes.map(e=>{
                const r=e.getBoundingClientRect(),h=e.closest('h3'),p=h.getBoundingClientRect(),s=getComputedStyle(h);
                const left=p.left+parseFloat(s.paddingLeft),right=p.right-parseFloat(s.paddingRight);
                return {font:getComputedStyle(e).fontSize,center:(r.left+r.right-left-right)/2,
                    vertical:(r.top+r.bottom-p.top-p.bottom)/2,inset:p.right-r.right,
                    fits:e.scrollWidth<=e.clientWidth+1};
            })''')
            assert len(headings) == 3 and len({h['font'] for h in headings}) == 1, (width, headings)
            assert all(abs(h['center'])<1 and abs(h['vertical'])<1 and h['fits'] for h in headings), (width, headings)
            assert all(h['inset'] >= width * .003 for h in headings), (width, headings)
            # Each panel's curved lower edge must still have opaque light cloth
            # or its gold stitching below it; text fit alone misses overspill.
            cloth_below = page.evaluate('''()=>{
                const img=document.querySelector('.banner-art'),bounds=img.getBoundingClientRect();
                const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
                const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
                return [...document.querySelectorAll('.welcome-value-grid article')].flatMap(article=>{
                    const r=article.getBoundingClientRect(),y=r.bottom+6;
                    return [r.left+24,(r.left+r.right)/2,r.right-24].map(x=>{
                        const sx=Math.round((x-bounds.left)/bounds.width*canvas.width);
                        const sy=Math.round((y-bounds.top)/bounds.height*canvas.height);
                        return [...ctx.getImageData(sx,sy,1,1).data];
                    });
                });
            }''')
            assert all(r > 235 and a > 240 for r,g,b,a in cloth_below), (width, cloth_below)
        else:
            assert max(sizes) / min(sizes) < 1.2, (width, sizes)
        for target in ['#learning-robot', '#playground-gate']:
            link = page.locator(target)
            link.scroll_into_view_if_needed()
            rect = link.bounding_box()
            assert rect['width'] >= 44 and rect['height'] >= 44, (width, target, rect)
            assert link.evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'), (width, target)
        page.screenshot(path=str(out / f'{args.engine}-reference-{width}.png'), full_page=True)
        report['viewports'].append({'width': width, 'robot_heights': sizes})

    page.set_viewport_size({'width': 1448, 'height': 1086})
    page.emulate_media(reduced_motion='no-preference')
    page.reload()
    page.wait_for_function("document.querySelector('[data-scene]').dataset.motion==='ready'")
    # Observe real frames without taking ownership of CSS animations via WAAPI;
    # programmatically replaying them can detach them from media-query changes.
    moving = ['.garden-cat', '.garden-slider', '.garden-tire', '.garden-balloons', '.garden-flag', '.airship-rig']
    def motion_frame():
        return [page.locator(s).evaluate('(e)=>getComputedStyle(e).transform') for s in moving]
    first_motion = motion_frame()
    first_pulse = page.locator('.gate-glow').evaluate('(e)=>getComputedStyle(e).opacity')
    page.wait_for_timeout(1350)  # Includes the slide's short resting interval.
    for selector, first, next_frame in zip(moving, first_motion, motion_frame()):
        assert first != next_frame, (selector, first, next_frame)
    assert first_pulse != page.locator('.gate-glow').evaluate('(e)=>getComputedStyle(e).opacity')
    # Observe the whole ride in real time. A tiny bob at the slide's middle
    # must not pass as sliding down the chute.
    for width in [1448, 390]:
        page.set_viewport_size({'width': width, 'height': 1086})
        positions = []
        for _ in range(15):
            positions.append(page.locator('.garden-slider').evaluate('''e=>{
                const matrix=new DOMMatrix(getComputedStyle(e).transform);
                return {y:matrix.m42,height:e.clientHeight};
            }'''))
            page.wait_for_timeout(450)
        travel = max(p['y'] for p in positions) - min(p['y'] for p in positions)
        assert travel > positions[0]['height'] * .3, (width, positions, 'Slide must have substantial travel')
    page.set_viewport_size({'width': 1448, 'height': 1086})
    page.wait_for_function("document.querySelector('[data-scene]').dataset.water==='ready'")
    def water_frame():
        return page.locator('.garden-water').evaluate('(c)=>c.toDataURL()')
    first_water = water_frame()
    page.wait_for_timeout(250)
    assert water_frame() != first_water, 'Pond canvas must actually change between frames'
    # The overlay must not animate the bridge, duck or lily pad.
    foreground = page.locator('.garden-water').evaluate('''c=>{
        const ctx=c.getContext('2d');return [[170,126],[346,134],[245,169]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);
    }''')
    assert foreground == [0, 0, 0], foreground
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
    assert page.locator('.garden-cat').evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
    assert page.locator('.garden-slider').evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
    for selector in ['.garden-tire', '.garden-balloons', '.garden-flag']:
        assert page.locator(selector).evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
    paused_water = water_frame()
    page.wait_for_timeout(150)
    assert water_frame() == paused_water, 'Hidden pages must stop drawing water'
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
    page.evaluate('dispatchEvent(new PageTransitionEvent("pagehide"))')
    assert page.locator('[data-scene]').get_attribute('data-paused') == 'true'
    page.evaluate('dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
    assert page.locator('[data-scene]').get_attribute('data-paused') == 'false'
    page.emulate_media(reduced_motion='reduce')
    for selector in ['.garden-cat', '.garden-slider', '.welcome-blimp', '.airship-rig', '.mascot-idle', '.garden-tire', '.garden-balloons', '.garden-flag']:
        assert page.locator(selector).evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
    assert not page.locator('.garden-water').is_visible()
    for fragment in ['#learning-robot', '#playground-gate']:
        page.locator(f'.blimp-choice[href="{fragment}"]').click()
        assert page.locator(fragment).evaluate('(e)=>e===document.activeElement'), fragment
    page.locator('#playground-gate').click()
    page.wait_for_url('**/playground.html')
    page.go_back()
    assert not page.locator('#playground-gate').get_attribute('aria-busy')
    assert page.locator('.scene-art').is_visible()
    assert not errors, errors

    # Optional pose decoding can fail without blanking the scene or its routes.
    failure = browser.new_page()
    failure.add_init_script("HTMLImageElement.prototype.decode=async function(){throw Error('decode failed');}")
    failure.goto(base + '/index.html')
    failure.wait_for_function("document.querySelector('.scene-art').naturalWidth>0")
    assert failure.locator('.scene-art').is_visible()
    assert failure.locator('.mascot-layer').first.evaluate('(e)=>getComputedStyle(e).opacity') == '1'
    failure.close()
    static = browser.new_context(java_script_enabled=False, reduced_motion='reduce', viewport={'width': 390, 'height': 844})
    nojs = static.new_page()
    nojs.goto(base + '/index.html')
    assert nojs.locator('.scene-art').is_visible()
    assert nojs.locator('.welcome-value').is_visible()
    nojs.locator('#learning-robot').click()
    nojs.wait_for_url('**/learn.html')
    nojs.go_back()
    nojs.locator('#playground-gate').click()
    nojs.wait_for_url('**/playground.html')
    static.close()
    browser.close()

report['checks'] = ['seven responsive widths', 'desktop-only art and layers', 'smaller desktop slide robot', 'refresh', 'all bullets and panels fit within cloth', 'robot, tire, balloon, flag and suspended airship motion', 'golden gate pulse', 'flowing water with stationary foreground', 'visibility and bfcache lifecycle', 'reduced motion', 'wayfinding focus', 'native routes without scripts', 'decode failure keeps art visible']
(out / f'{args.engine}-garden-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
