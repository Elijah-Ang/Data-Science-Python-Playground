"""Focused real-browser regression for the shared Data/ML interaction contract."""
import argparse
from pathlib import Path
from test_browser import ready, run_all, verify_layout, workflow_regressions, ARTIFACTS


def main():
    from playwright.sync_api import sync_playwright
    parser=argparse.ArgumentParser();parser.add_argument('--engine',default='chromium',choices=['chromium','webkit']);args=parser.parse_args()
    with sync_playwright() as pw:
        browser=getattr(pw,args.engine).launch();page=browser.new_page(viewport={'width':1512,'height':1050},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:8012/statistics.html?runtime=local');ready(page)
        workflow_regressions(page);run_all(page)
        # Clicking an already inserted route card reruns the actual edited code.
        editor=page.locator('[data-cell-index="0"] .code-input');editor.fill(editor.input_value()+'\nprint("route-click rerun")')
        count=page.locator('article.cell').count();page.locator('.route-card').first.click()
        page.wait_for_function('StatisticsPlayground.cells[0].status==="done"',timeout=60000)
        assert page.locator('article.cell').count()==count
        assert 'route-click rerun' in page.locator('[data-output-for="frame"]').inner_text()
        run_all(page)
        original=page.evaluate('StatisticsPlayground.cells.map(c=>c.output.scalars)')
        for theme in ['light','dark']:
            page.evaluate('t=>AppAppearance.apply(t)',theme)
            for width in [1512,1121,1120,980,820,560,390]:
                page.set_viewport_size({'width':width,'height':1050 if width>1120 else 844})
                verify_layout(page,width)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                assert page.evaluate('StatisticsPlayground.cells.map(c=>c.output.scalars)')==original
                page.screenshot(path=str(ARTIFACTS/f'layout-{args.engine}-{width}-{theme}.png'))
        with page.expect_download() as event:page.locator('#downloadChartButton').click()
        assert Path(event.value.path()).read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
        assert not errors,errors
        print(f'PASS {args.engine}: auto-run and rerun, independent scrolling, 7 responsive widths in both themes, confidence fit, resize preserves results, PNG export',flush=True)
        browser.close()

if __name__=='__main__':main()
