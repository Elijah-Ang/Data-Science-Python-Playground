"""Run against a built app served at --base-url."""
import argparse
from playwright.sync_api import sync_playwright
parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://127.0.0.1:8001/dist")
base_url = parser.parse_args().base_url.rstrip("/")
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':1440,'height':1000})
 page.goto(base_url + '/index.html')
 page.goto(base_url + '/playground.html')
 page.wait_for_function("document.querySelector('#runtimeStatus').textContent.includes('Python ready')", timeout=120000)
 dialogs=[]
 def stay(dialog):
  dialogs.append(dialog.type)
  dialog.dismiss()
 page.on('dialog',stay)
 try: page.go_back(timeout=3000)
 except Exception: pass
 assert dialogs==['beforeunload'],dialogs
 assert 'playground.html' in page.url
 assert page.locator('article.cell').count()==0
 dialogs.clear()
 page.locator('#addCellButton').click()
 assert page.locator('.dataframe-note').is_visible()
 page.evaluate("insertTask(currentTasks.find(task => task.id === 'types'))")
 page.wait_for_function("['done', 'error'].includes(cells.find(cell => cell.taskId === 'types')?.status)", timeout=30000)
 assert page.evaluate("cells.find(cell => cell.taskId === 'types').status") == 'done', page.evaluate("cells.find(cell => cell.taskId === 'types').output")
 assert page.evaluate("cells.find(cell => cell.taskId === 'types').code") == 'df.dtypes'
 assert 'Rented Bike Count' in str(page.evaluate("cells.find(cell => cell.taskId === 'types').output.table"))
 page.screenshot(path='/tmp/data-inspector-desktop.png')
 try: page.go_back(timeout=3000)
 except Exception: pass
 assert dialogs==['beforeunload'],dialogs
 assert 'playground.html' in page.url
 assert page.locator('article.cell').count()==2
 page.remove_listener('dialog',stay)
 for width in [390,834]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
 page.screenshot(path='/tmp/data-inspector-mobile.png')
 page.on('dialog',lambda d:d.accept())
 page.go_back()
 assert 'index.html' in page.url
 browser.close()
 print('Leave/Stay navigation, retained cell, inspector and responsive widths passed.')
