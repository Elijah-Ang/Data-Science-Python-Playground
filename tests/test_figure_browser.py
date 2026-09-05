from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.webkit.launch();page=b.new_page(viewport={'width':390,'height':844});page.goto('http://127.0.0.1:8001/playground.html');page.wait_for_function("document.querySelector('#runtimeStatus').textContent==='Python ready'",timeout=120000)
 page.locator('#runAllButton').click();page.wait_for_function("document.querySelectorAll('article.cell').length===6 && [...document.querySelectorAll('article.cell')].every(c=>c.dataset.status==='done')",timeout=120000)
 link=page.locator('.chart-wrap a',has_text='Open larger').first;link.click();assert page.locator('dialog[open]').count()==1
 image=page.locator('.figure-pan img');width=image.bounding_box()['width'];page.locator('input[aria-label="Figure zoom"]').fill('2');assert image.bounding_box()['width']==width*2
 page.keyboard.press('Escape');assert page.locator('dialog').count()==0
 page.evaluate("window.AppPlatform={...AppPlatform,native:true,shareDataUrl:async(data,name)=>{window.sharedFigure={data,name}}}")
 download=page.locator('.chart-wrap a[download]').first;expected=download.get_attribute('href');download.click();assert page.evaluate('window.sharedFigure.data')==expected
 print('WebKit phone: in-page figure enlargement, zoom, Escape/focus and selected-image share routing passed. Native share completion remains a device check.');b.close()
