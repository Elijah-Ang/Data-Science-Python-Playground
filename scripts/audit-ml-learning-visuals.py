"""Render all teaching concepts and every primitive/variant in alternate layouts.

Screenshots retain actual app CSS. Contact sheets are review evidence, not a substitute
for reviewing lesson meaning against the registry. Requires Playwright and Pillow.
"""
import argparse,hashlib,json,math,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8128');p.add_argument('--runtime',choices=['remote','local'],default='remote');p.add_argument('--reuse-captures',action='store_true',help='Reuse existing concept captures while rerunning fitted evidence');a=p.parse_args()
if a.reuse_captures:
 subprocess.run([sys.executable,str(ROOT/'tests/test_ml_learning_visual_audit.py')],check=True)
out=ROOT/'tests/evidence/ml-learning/visual-audit';out.mkdir(parents=True,exist_ok=True)
contact=ROOT/'docs/ml-learning-visuals';contact.mkdir(exist_ok=True)
records=[];groups={}
with sync_playwright() as pw:
 browser=pw.chromium.launch();page=browser.new_page(viewport={'width':1440,'height':1000});page.goto(a.base_url+'/ml-learn.html?runtime='+a.runtime);page.wait_for_function('!!window.MLLearning')
 cards=page.evaluate("MLLearning.curriculum.cards.filter(c=>c.kind==='teaching')")
 for c in cards:
  key=page.evaluate('(v)=>MLLearningVisuals.family(v)',c['visual']);groups.setdefault(key,c)
 def capture(c,theme,width,group):
  name=f'{c["id"]}-{theme}-{width}.png'
  if a.reuse_captures and (out/name).exists():
   records.append(dict(id=c['id'],family=group,theme=theme,width=width,file=name,title=c['title']));return
  page.set_viewport_size({'width':width,'height':1000});page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
  page.evaluate('(hash)=>location.hash=hash','#'+c['deck']+'/'+c['id']+'/0');page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=c['exercises'][0]['id'])
  page.evaluate('document.fonts.ready');figure=page.locator('.ml-concept');figure.scroll_into_view_if_needed();figure.locator('.ml-concept-scroll').evaluate('(e)=>e.scrollLeft=0')
  assert not page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1'),(c['id'],width)
  clipped=figure.locator('svg text').evaluate_all('(nodes)=>nodes.filter(n=>{const b=n.getBBox();return b.x<0||b.y<0||b.x+b.width>560.5||b.y+b.height>235.5}).map(n=>n.textContent)')
  assert not clipped,(c['id'],clipped)
  assert figure.locator('svg').get_attribute('aria-label')==c['exercises'][0].get('visual',c['visual'])['caption']
  name=f'{c["id"]}-{theme}-{width}.png';figure.screenshot(path=str(out/name))
  # Inspect both ends of scrollable diagrams at phone widths.
  if width<500:
   figure.locator('.ml-concept-scroll').evaluate('(e)=>e.scrollLeft=e.scrollWidth');figure.screenshot(path=str(out/('right-'+name)))
  records.append(dict(id=c['id'],family=group,theme=theme,width=width,file=name,title=c['title']))
 for c in cards:capture(c,'light',1440,c['visual']['type'])
 for key,c in groups.items():
  for theme,width in [('dark',1440),('light',320),('light',390)]:capture(c,theme,width,key)
 # The deck cards have their own small diagrams. Review every one at its real
 # card size, rather than assuming the large concept figures cover them.
 thumbnail_signatures={}
 for deck in page.evaluate('MLLearning.curriculum.decks.map(d=>d.id)'):
  page.set_viewport_size({'width':1440,'height':1000});page.evaluate("AppAppearance.apply('light')")
  page.evaluate('(deck)=>location.hash="#"+deck',deck);page.wait_for_selector('.lesson-card')
  tiles=page.locator('.lesson-card');sheet=Image.new('RGB',(1480,195*math.ceil(tiles.count()/4)),'#f7f2e5')
  draw=ImageDraw.Draw(sheet);label_font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',16) if Path('/System/Library/Fonts/Supplemental/Arial.ttf').exists() else ImageFont.load_default()
  for i in range(tiles.count()):
   tile=tiles.nth(i);card_id='ML-'+tile.locator('.card-id').inner_text();svg=tile.locator('svg.ml-thumbnail')
   title=tile.locator('h4').inner_text();labels=svg.locator('text').all_text_contents()
   assert labels,(card_id,'unlabelled thumbnail')
   assert card_id not in thumbnail_signatures,card_id
   clipped=svg.evaluate('e=>Array.from(e.querySelectorAll("text")).filter(n=>{const b=n.getBBox();return b.x<0||b.y<0||b.x+b.width>560||b.y+b.height>200}).map(n=>n.textContent)')
   assert not clipped,(card_id,clipped)
   thumbnail_signatures[card_id]=hashlib.sha256('|'.join(labels).encode()).hexdigest()
   path=out/('thumbnail-'+card_id+'.png');svg.screenshot(path=str(path))
   x=(i%4)*370;y=(i//4)*195;draw.text((x+5,y+3),card_id[3:]+' · '+title[:38],fill='#12243b',font=label_font)
   pic=Image.open(path).convert('RGB');pic.thumbnail((360,145));sheet.paste(pic,(x+5,y+28))
  sheet.save(contact/('cards-'+deck+'.jpg'),quality=90)
 assert len(thumbnail_signatures)==len(page.evaluate('MLLearning.curriculum.cards'))
 assert len(set(thumbnail_signatures.values()))==len(thumbnail_signatures),'Two card diagrams have identical visible labels'
 for deck in page.evaluate('MLLearning.curriculum.decks.map(d=>d.id)'):
  page.set_viewport_size({'width':390,'height':900});page.evaluate("AppAppearance.apply('dark')")
  page.evaluate('(deck)=>location.hash="#"+deck',deck);page.wait_for_selector('.lesson-card')
  assert not page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1'),deck
  page.locator('.lesson-card').first.screenshot(path=str(out/('thumbnail-dark-390-'+deck+'.png')))
 page.set_viewport_size({'width':1440,'height':1000});page.evaluate("AppAppearance.apply('light');location.hash='#workflows/challenges'");page.wait_for_selector('.case-file')
 assert page.locator('.case-file').count()==19
 assert len(set(page.locator('.case-illustration').evaluate_all('(nodes)=>nodes.map(n=>n.innerHTML)')))==6
 page.screenshot(path=str(contact/'challenge-collection.png'),full_page=True)
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':960});page.screenshot(path=str(out/f'challenges-{width}.png'),full_page=True)
  assert not page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1')
 for width in [1440,390,320]:
  page.set_viewport_size({'width':width,'height':1000})
  for id in ['ML-X01','ML-X15','ML-X18','ML-X19']:
   page.evaluate('(hash)=>location.hash=hash','#workflows/challenges/'+id);page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=id)
   assert page.locator('.ml-deliverable-groups > li').count()==4
   page.locator('[data-brief-target="case-deliverables"]').click()
   assert not page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1')
   page.locator('#case-deliverables').screenshot(path=str(contact/f'groups-{width}-{id}.png'))
 # Real learner-rendered fitted evidence, not illustrative placeholders.
 page.set_viewport_size({'width':1440,'height':1000})
 for deck,id,index in [('regression','ML-R03',0),('regression','ML-R09',0),('clustering','ML-U05',1),('pca','ML-P03',1)]:
  page.evaluate('(hash)=>location.hash=hash',f'#{deck}/{id}/{index}');page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=f'{id}-{index+1}')
  page.locator('#mlEditor').fill(page.evaluate('MLLearning.activity.solution'));page.locator('#mlRun').click();page.wait_for_function("!document.getElementById('mlRun').disabled",timeout=180000)
  assert page.locator('#mlStatus').inner_text().startswith('Run finished'),page.locator('#mlStatus').inner_text()
  page.locator('#mlCheck').click();assert page.locator('#mlResults .needs-attention,#mlResults .unavailable').count()==0
  page.locator('#mlOutput .chart-wrap img').first.screenshot(path=str(contact/f'fitted-{id}.png'))
 browser.close()
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19) if Path('/System/Library/Fonts/Supplemental/Arial.ttf').exists() else ImageFont.load_default()
for label,selected in [('teaching',[r for r in records if r['theme']=='light' and r['width']==1440]),('dark',[r for r in records if r['theme']=='dark']),('mobile-320',[r for r in records if r['width']==320]),('mobile-390',[r for r in records if r['width']==390])]:
 for start in range(0,len(selected),9):
  batch=selected[start:start+9];sheet=Image.new('RGB',(1800,1170),'#e7e7e7');draw=ImageDraw.Draw(sheet)
  for i,r in enumerate(batch):
   x=(i%3)*600;y=(i//3)*390;draw.text((x+12,y+8),r['id']+' · '+r['title'][:51]+('…' if len(r['title'])>51 else ''),fill='black',font=font)
   pic=Image.open(out/r['file']).convert('RGB');pic.thumbnail((280 if r['width']<500 else 580,335));sheet.paste(pic,(x+10,y+42))
   if r['width']<500:
    right=Image.open(out/('right-'+r['file'])).convert('RGB');right.thumbnail((280,335));sheet.paste(right,(x+305,y+42))
  sheet.save(contact/f'{label}-{start//9+1:02}.jpg',quality=88)
record=dict(teachingCount=len(cards),primitiveVariantCount=len(groups),thumbnailCount=len(thumbnail_signatures),thumbnailSignatures=thumbnail_signatures,captures=records,cardHashes={c['id']:hashlib.sha256(json.dumps({k:c[k] for k in ['title','goal','explanation','visual']},sort_keys=True).encode()).hexdigest() for c in cards},sourceHashes={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['ml-learning/visuals.js','ml-learning/learning.css','ml-learning/app.js','foundations/foundations.css','foundations/learning-ui.js']})
(ROOT/'docs/ml-learning-visual-review.json').write_text(json.dumps(record,indent=2)+'\n')
print(len(cards),'teaching concepts;',len(groups),'primitive/variant families in dark, 320 and 390;',len(thumbnail_signatures),'unique card thumbnails;',len(records),'captures; four real fitted figures; all 19 collection tiles.')
