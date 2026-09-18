"""Real Pyodide challenge workflows and case-file UI across widths/themes."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8040');parser.add_argument('--engine',default='chromium');args=parser.parse_args()
start=time.time();out=Path('tests/evidence/workflow-challenges');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=getattr(p,args.engine).launch();page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base=args.base_url+'/data-foundations.html'
 page.goto(base+'#inspect/challenges');page.wait_for_selector('.case-file');assert page.locator('.case-file').count()==10
 assert page.locator('.lesson-card').count()==0
 data=page.evaluate('DataWorkflowChallenges.challenges')
 def open_challenge(c):
  page.evaluate('(c)=>location.hash=`#${c.deck}/challenges/${c.id}`',c)
  page.wait_for_function('(id)=>document.querySelector(".foundation-breadcrumb")?.textContent.endsWith(id)',arg=c['id'])
  page.wait_for_function('!document.querySelector("#runExercise").disabled')
 def run(code,check=True):
  page.locator('#foundationEditor').fill(code);page.locator('#checkExercise' if check else '#runExercise').click()
  page.wait_for_function('!document.querySelector("#runExercise").disabled',timeout=180000)
 def get(id):return next(c for c in data if c['id']==id)
 for c in data:
  open_challenge(c)
  assert page.locator('#foundationEditor').input_value()==c['starter']
  assert page.locator('.teaching-overview,.foundation-syntax,.foundation-practices').count()==0
  assert page.locator('.case-help[open],.case-help details[open]').count()==0
  assert page.locator('.case-brief>section>h3').all_text_contents()==['The question','Your inputs','Deliverables']
  run(c['reference'])
  assert page.locator('.check-needs-attention,.check-unavailable').count()==0,(c['id'],page.locator('#challengeResults').inner_text(),page.locator('#foundationOutput').inner_text())
  assert page.locator('.check-correct').count()>=len(c['deliverables']),c['id']
  print(c['id'],'passed',flush=True)
 c=get('IC08');open_challenge(c);run(c['reference']+'\nmeans = means * 2')
 assert page.locator('.check-correct').count()==3 and page.locator('.check-needs-attention').count()==1
 page.locator('#challengeResults').screenshot(path=str(out/(args.engine+'-mixed-feedback.png')))
 page.locator('#foundationEditor').fill(c['reference']);assert page.locator('.case-stale').count()==1
 run(c['reference']);assert page.locator('.case-stale').count()==0
 run(c['reference'].replace("means = eligible.groupby('group').score.mean()","raise ValueError('test stop')"))
 assert page.locator('.check-unavailable').count()==1 and page.locator('.check-correct').count()==3
 assert 'test stop' in page.locator('#foundationOutput').inner_text()
 run(c['reference']);assert page.locator('.check-unavailable').count()==0
 page.locator('#resetExercise').click();assert page.locator('#foundationEditor').input_value()==c['starter'];assert not page.locator('#challengeResults').inner_text()
 page.locator('#jumpToWork').click();assert page.locator('#foundationEditor').evaluate('(e)=>e.selectionStart')==c['starter'].index('# Your work\n')+len('# Your work\n')
 editor=page.locator('#foundationEditor');editor.fill('x\n');editor.press('End');editor.press('Tab');assert editor.input_value().endswith('    ');editor.press('Escape');editor.press('Tab');assert page.locator('#runExercise').evaluate('(e)=>document.activeElement===e')
 open_challenge(get('IC01'));run('preview = df.head()');assert 'NameError' in page.locator('#foundationOutput').inner_text()
 run(get('IC01')['reference']);assert page.locator('.check-unavailable').count()==0
 editor.fill('while True:\n    pass');page.locator('#runExercise').click();page.locator('#stopPython').click();assert editor.input_value().startswith('while True')
 page.locator('#resetExercise').click()
 # Source edits are real, not overwritten by an implicit setup.
 open_challenge(get('WC04'));run(get('WC04')['reference']+'\ndf.iloc[0,0]="changed"');assert 'Source inputs · Needs attention' in page.locator('#challengeResults').inner_text()
 # Alternative chart library/orientation in the actual worker.
 c=get('VC01');open_challenge(c);run(c['reference'].replace('ax.bar(','ax.barh(').replace("xlabel='Drink', ylabel='Orders'","xlabel='Orders', ylabel='Drink'"));assert page.locator('.check-needs-attention,.check-unavailable').count()==0
 page.locator('.case-help>summary').click();assert page.locator('.case-help details[open]').count()==0
 page.get_by_text('Hint 1 — Think',exact=True).click();assert page.locator('.case-help details[open]').count()==1
 assert page.locator('.case-help pre').is_hidden()
 page.get_by_text('Explained solution',exact=True).click();assert page.locator('.case-help pre').is_visible()
 # Audit regressions must also hold in the browser's actual Matplotlib/Pyodide versions.
 c=get('VC01');open_challenge(c)
 run(c['reference'].replace('ax.bar(counts.index, counts.values)','ax.scatter(counts.index, counts.values)'))
 assert page.locator('.check-needs-attention,.check-unavailable').count()==0
 c=get('VC07');open_challenge(c)
 run(c['reference'].replace('fig.tight_layout()', '[p.remove() for p in list(ax.patches)]\nfig.tight_layout()'))
 assert page.locator('.check-needs-attention').count()==1
 c=get('VC04');open_challenge(c)
 run(c['reference'].replace('fig.tight_layout()', "ax.lines[0].set_linestyle('None')\nfig.tight_layout()"))
 assert page.locator('.check-needs-attention').count()==1
 c=get('VC10');open_challenge(c)
 run(c['reference']+"\nwith open('challenge.png', 'w') as file:\n    file.write('invalid image')")
 assert page.locator('.check-needs-attention').count()==1 and page.locator('.check-correct').count()==3
 assert page.locator('a[download="challenge.png"]').count()==0
 c=get('IC08');open_challenge(c)
 scroll=page.evaluate('scrollY')
 page.locator('.case-read-brief').click()
 assert page.evaluate('scrollY')==scroll
 assert page.locator('#case-deliverables').evaluate('(e)=>document.activeElement===e')
 assert page.locator('.case-help[open]').count()==0
 assert page.locator('.case-brief .foundation-table-scroll[tabindex="0"]').count()>=1
 run(c['reference']+"\nraise ValueError('after evidence')")
 assert 'Python stopped' in page.locator('#challengeResults').inner_text()
 assert 'Python stopped' in page.locator('#foundationFeedback').inner_text()
 # New runs clear old check states immediately; stopping does not leave a checking indicator.
 editor.fill('while True:\n    pass');page.locator('#checkExercise').click()
 assert page.locator('.check-correct,.check-needs-attention').count()==0
 page.locator('#stopPython').click()
 assert not page.locator('#challengeResults').inner_text()
 # No activity state is written to storage.
 assert not page.evaluate('Object.keys(localStorage).some(k=>/challenge|progress|completion/i.test(k))')
 for width in (1440,834,320):
  page.set_viewport_size({'width':width,'height':1000 if width>400 else 740})
  for theme in ('light','dark'):
   page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for deck in ('inspect','wrangle','visualise'):
    page.evaluate('(deck)=>location.hash=`#${deck}/challenges`',deck);page.wait_for_selector('.case-file')
    assert page.locator('.case-file').count()==10
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    if width in (1440,320):page.screenshot(path=str(out/f'{args.engine}-{deck}-{width}-{theme}-shelf.png'))
   for c in data:
    open_challenge(c)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(c['id'],width,theme)
    assert page.locator('.case-help[open]').count()==0
   if width in (1440,320):page.screenshot(path=str(out/f'{args.engine}-{width}-{theme}-brief.png'))
 # Reopening a challenge restores its starter; no resume or saved work.
 open_challenge(get('IC02'));assert editor.input_value()==get('IC02')['starter']
 page.reload();page.wait_for_selector('#foundationEditor');assert editor.input_value()==get('IC02')['starter']
 assert not errors,errors
 browser.close()
print(json.dumps({'engine':args.engine,'challenges':len(data),'realPyodide':True,'widths':[1440,834,320],'themes':['light','dark'],'seconds':round(time.time()-start,1)},indent=2))
