"""Render all 37 Visualise Follow introductions and exercise each aligned control."""
import argparse,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
from inline_code_browser import controls as code_controls, choose
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base-url',default='http://127.0.0.1:8015');parser.add_argument('--evidence-dir',default='docs/curriculum-evidence/stage-visuals');args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=root/args.evidence_dir;out.mkdir(parents=True,exist_ok=True);raw=root/'tests/evidence/stage-visuals/visualise';raw.mkdir(parents=True,exist_ok=True)
records=[];states=[];images=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium');p=b.new_page(service_workers='block',reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(args.base_url+'/data-foundations.html');p.wait_for_function('!!window.FoundationsCurriculum');items=p.evaluate('FoundationsCurriculum.lessons.filter(l=>/^V\\d+$/.test(l.id)).map(l=>({id:l.id,title:l.title,round:l.rounds[0].id,visual:l.rounds[0].visual}))');assert len(items)==37
 for width in [1440,320]:
  p.set_viewport_size({'width':width,'height':1100})
  for theme in ['light','dark']:
   p.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
   for item in items:
    p.evaluate('(id)=>location.hash="#visualise/"+id+"/0"',item['id']);p.wait_for_function('(title)=>document.querySelector(".foundation-lesson-heading h2")?.textContent===title',arg=item['title']);p.evaluate('document.fonts.ready')
    overflow=p.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not overflow,(item['id'],width,theme)
    controls=p.locator('.foundation-content [data-foundation-explorer]');control_records=[]
    for section in controls.all():
     assert not section.locator('table').count()
     fixed=p.evaluate('JSON.stringify(FoundationVisuals.exampleRows)')
     for control in code_controls(section):
      key=control['key'];initial=control['value'];options=[o['value'] for o in control['options']]
      for value in options:
       choose(p,section,key,value);assert p.evaluate('JSON.stringify(FoundationVisuals.exampleRows)')==fixed,(item['id'],'data changed')
       r=section.evaluate("""section=>{const variant=section.dataset.foundationExplorer,expected=FoundationVisuals.plotArgumentModel(variant,JSON.parse(section.dataset.visualState),JSON.parse(section.dataset.visualSettings));return {variant,expectedCode:expected.code,shownCode:section.querySelector('.inline-code-source')?.textContent||'',live:section.querySelector('.teaching-visual-result').getAttribute('aria-live'),clipped:[...section.querySelectorAll('svg text')].filter(n=>{const z=n.ownerSVGElement.viewBox.baseVal,b=n.getBBox();return b.x<-.5||b.y<-.5||b.x+b.width>z.width+.5||b.y+b.height>z.height+.5}).map(n=>n.textContent)}}""")
       assert r['shownCode']==r['expectedCode'],(item['id'],value,r);assert not r['clipped'],(item['id'],value,r);assert r['live']=='polite';states.append({'id':item['id'],'width':width,'theme':theme,'key':key,'value':value,'variant':r['variant']})
      choose(p,section,key,initial);control_records.append({'variant':r['variant'],'key':key,'values':options,'initial':initial})
    records.append({'id':item['id'],'title':item['title'],'width':width,'theme':theme,'controls':control_records,'passed':True})
    figure=p.locator('.foundation-content .teaching-overview').first
    if theme=='light' and figure.count() and item['id'] in ['V03','V05','V08','V13','V14','V17','V18','V10','V12','V19','V30','V16','V26','V29']:
     size=figure.bounding_box();p.set_viewport_size({'width':width,'height':max(1100,round(size['height']+300))});figure.scroll_into_view_if_needed();name=f'{item["id"]}-{width}.png';figure.screenshot(path=str(raw/name));images.append({'id':item['id'],'width':width,'path':str(raw/name)});p.set_viewport_size({'width':width,'height':1100})
 b.close()
assert not errors,errors
for width in [1440,320]:
 entries=[i for i in images if i['width']==width];thumbs=[]
 for entry in entries:
  im=Image.open(entry['path']).convert('RGB');im.thumbnail((440,740));tile=Image.new('RGB',(460,780),'#ededed');tile.paste(im,((460-im.width)//2,30));ImageDraw.Draw(tile).text((12,10),entry['id'],fill='black');thumbs.append(tile)
 columns=3;sheet=Image.new('RGB',(460*columns,780*((len(thumbs)+columns-1)//columns)),'white')
 for n,tile in enumerate(thumbs):sheet.paste(tile,((n%columns)*460,(n//columns)*780))
 sheet.save(out/f'visualise-follow-{width}.jpg',quality=90)
(out/'visualise-rendered.json').write_text(json.dumps({'lessons':len(items),'actual_follow_views':len(records),'interactive_states':len(states),'errors':errors,'records':records,'states':states,'screenshots':images,'contentId':json.loads((root/'dist/asset-manifest.json').read_text())['contentId'],'mobile_presentation':'Charts retain labelled local horizontal panning for readable text; phones do not initially show every plot in full.','source_sha256':hashlib.sha256((root/'foundations/visuals.js').read_bytes()).hexdigest()},indent=2)+'\n')
print(json.dumps({'lessons':len(items),'actual_follow_views':len(records),'interactive_states':len(states),'errors':errors}))
