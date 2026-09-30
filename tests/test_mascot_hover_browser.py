"""A decoded robot stays visible during hover, focus and failed pose handoffs."""
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'webkit'])
args = parser.parse_args()

with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    for mode in ['normal', 'slow', 'failed']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.add_init_script('''mode=>{
            const decode=HTMLImageElement.prototype.decode;
            HTMLImageElement.prototype.decode=async function(){
                if(this.matches('.mascot-layer') && this.dataset.pose==='teach'){
                    if(mode==='slow')await new Promise(resolve=>setTimeout(resolve,700));
                    if(mode==='failed')throw Error('Optional pose failed to decode');
                }
                return decode.call(this);
            };
        }'''.replace('mode=>{', '{ const mode=' + repr(mode) + ';', 1))
        page.goto(args.base_url.rstrip('/') + '/index.html')
        page.wait_for_function("document.querySelector('.mascot-layer').complete && document.querySelector('.mascot-layer').naturalWidth>0")
        page.evaluate('''()=>{
            window.visibleRobotFrames=[];
            function sample(){
                visibleRobotFrames.push([...document.querySelectorAll('.mascot-layer')].some(image=>
                    image.complete && image.naturalWidth>0 && Number(getComputedStyle(image).opacity)>.98));
                window.robotFrame=requestAnimationFrame(sample);
            }
            sample();
        }''')
        robot = page.locator('#learning-robot')
        robot.hover()
        if mode == 'slow':
            page.wait_for_timeout(250)
            assert page.locator('[data-mascot]').get_attribute('data-pose') == 'book'
        page.wait_for_timeout(1100)
        assert page.locator('[data-mascot]').get_attribute('data-pose') == ('book' if mode == 'failed' else 'teach')
        for _ in range(3):
            page.mouse.move(0, 0)
            robot.focus()
            page.wait_for_timeout(80)
            page.locator('.tour-button').focus()
            robot.hover()
            page.wait_for_timeout(80)
        page.wait_for_timeout(1100)
        frames = page.evaluate('cancelAnimationFrame(robotFrame);visibleRobotFrames')
        assert len(frames) > 30 and all(frames), (mode, len(frames), 'Robot disappeared during handoff')
        print(args.engine, mode, len(frames), 'visible frames passed')
        page.close()
    browser.close()
