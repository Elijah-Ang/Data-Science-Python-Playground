"""Landing refresh and failed animation initialization regressions."""
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--engine', default='chromium')
parser.add_argument('--base-url', default='http://127.0.0.1:8001')
args = parser.parse_args()

with sync_playwright() as p:
    browser = getattr(p, args.engine).launch()
    for width, height in [(1440, 900), (390, 844)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        for attempt in range(3):
            page.goto(args.base_url) if attempt == 0 else page.reload()
            page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'ready'")
            assert page.locator('.scene-motion').is_visible()
        # GPU context loss must restore the full image without reloading.
        page.evaluate("""() => {
            const gl=document.querySelector('.scene-motion').getContext('webgl');
            gl.getExtension('WEBGL_lose_context').loseContext();
        }""")
        page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'fallback'")
        assert page.locator('.scene-art').is_visible()
        assert not errors, errors
        page.close()

    for failure in ['blank-image', 'gpu-error', 'decode-error']:
        page = browser.new_page()
        if failure == 'blank-image':
            page.add_init_script("""const draw=CanvasRenderingContext2D.prototype.drawImage;
                CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
                    if(image instanceof HTMLImageElement)return;
                    return draw.call(this,image,...args);
                };""")
        elif failure == 'gpu-error':
            page.add_init_script("WebGLRenderingContext.prototype.getError=function(){return this.INVALID_OPERATION;};")
        else:
            page.add_init_script("HTMLImageElement.prototype.decode=async function(){throw Error('decode failed');};")
        page.goto(args.base_url)
        page.wait_for_function("document.querySelector('[data-scene]').dataset.motion === 'fallback'")
        assert page.locator('.scene-art').is_visible(), failure
        assert page.locator('.scene-actors').evaluate("(el)=>getComputedStyle(el).opacity") == '0'
        assert page.locator('.scene-motion').evaluate("(el)=>getComputedStyle(el).opacity") == '0'
        page.close()
    browser.close()
print(f'{args.engine}: refresh, portrait, context loss, and setup failure checks passed')
