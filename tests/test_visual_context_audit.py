"""Audit actual lesson, review, deck and interactive renderings in both themes.

Uses the production renderer and its real CSS. Does not substitute copied helpers.
Numeric correctness is independently checked in test_visual_scientific_scenes.py
and test_teaching_visual_models.py; this suite verifies their visible integration.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--base-url',default='http://127.0.0.1:8015')
p.add_argument('--output',default='docs/curriculum-evidence/review-refinement')
p.add_argument('--focused',action='store_true')
p.add_argument('--catalog-only',action='store_true')
a=p.parse_args();root=Path(__file__).resolve().parents[1];out=root/a.output;out.mkdir(parents=True,exist_ok=True)
raw=root/'tests/evidence/review-refinement/visuals';raw.mkdir(parents=True,exist_ok=True)
records=[];states=[];errors=[];captures=[];captured=set();issues=[];catalog=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'))
    context=browser.new_context(service_workers='block',reduced_motion='reduce')
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append({'url':page.url,'error':str(e)}))
    page.goto(a.base_url+'/data-foundations.html');page.wait_for_function('!!window.FoundationsCurriculum')
    data=page.evaluate('FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map((r,i)=>({id:r.id,lesson:l.id,deck:l.deck,index:i,title:l.title,objective:r.question||l.goal,code:r.solution,visual:r.visual,family:"data"})))')
    page.goto(a.base_url+'/ml-learn.html');page.wait_for_function('!!window.MLLearning')
    ml=page.evaluate('MLLearning.curriculum.cards.flatMap(c=>c.exercises.map((e,i)=>({id:e.id,lesson:c.id,deck:c.deck,index:i,title:c.title,objective:e.task,code:e.solution,visual:e.visual||c.visual,family:"ml"})))')
    manifest=context.request.get(a.base_url+'/asset-manifest.json').json()
    served_hashes={name:hashlib.sha256(context.request.get(a.base_url+'/'+name).body()).hexdigest() for name in ['foundations/app.js','foundations/visuals.js','foundations/teaching.js','foundations/content-guidance.js','ml-learning/visuals.js','ml-learning/app.js','ml-learning/curriculum.json','foundations/foundations.css','ml-learning/learning.css']}
    inventory=[] if a.catalog_only else data+ml
    if a.focused: inventory=[x for x in inventory if x['lesson'] in ['V05','V09','V11','V12','V19','V21','V23','V30','V31','ML-F11','ML-F12','ML-C08','ML-C10','ML-C11','ML-C14','ML-R07','ML-R08','ML-R10','ML-P01','ML-W15','ML-W-K2']]
    for width in [1440,390,320]:
      page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
      for theme in ['light','dark']:
       for family in ['data','ml']:
        prefix='data-foundations' if family=='data' else 'ml-learn'
        page.goto(a.base_url+'/'+prefix+'.html');page.wait_for_function('!!window.FoundationsCurriculum' if family=='data' else '!!window.MLLearning')
        page.evaluate('(theme)=>AppAppearance.apply(theme)',theme)
        items=[x for x in inventory if x['family']==family]
        for item in items:
            page.evaluate('(x)=>location.hash=`#${x.deck}/${x.lesson}/${x.index}`',item)
            if family=='ml':page.wait_for_function('(x)=>MLLearning.activity?.id===x.id&&[...document.querySelectorAll(".foundation-practices li")].findIndex(e=>e.hasAttribute("aria-current"))===x.index',arg=item)
            else:page.wait_for_function('(x)=>document.querySelector(".foundation-lesson-heading h2")?.textContent===x.title&&[...document.querySelectorAll(".foundation-practices li")].findIndex(e=>e.hasAttribute("aria-current"))===x.index',arg=item)
            page.evaluate('document.fonts.ready')
            result=page.evaluate('''()=>{
              const content=document.querySelector('.foundation-content'),preview=content.querySelector('.foundation-data-preview'),task=content.querySelector('.foundation-task-reminder');
              const clipped=[...content.querySelectorAll('svg text')].filter(e=>{const b=e.getBBox(),v=e.ownerSVGElement.viewBox.baseVal;return b.width&&v.width&&(b.x<-.5||b.y<-.5||b.x+b.width>v.width+.5||b.y+b.height>v.height+.5)}).map(e=>e.textContent);
              const controls=[...content.querySelectorAll('[data-visual-choice],[data-ml-visual-choice]')].map(e=>({value:e.value,options:[...e.options].map(o=>o.value)}));
              return {overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1,clipped,controls,previewNextToTask:!preview||preview.nextElementSibling===task,reference:!!content.querySelector('.foundation-reference-body,.ml-reference'),openHelp:content.querySelectorAll('details[open]').length,editor:!!document.querySelector('#foundationEditor,#mlEditor'),words:content.innerText.split(/\\s+/).length};
            }''')
            if result['overflow'] or result['clipped'] or not result['previewNextToTask'] or result['reference'] or not result['editor']:
                issues.append({'id':item['id'],'width':width,'theme':theme,**result})
            records.append({'id':item['id'],'width':width,'theme':theme,**result})
            for n,control in enumerate(page.locator('[data-visual-choice],[data-ml-visual-choice]').all()):
                section=control.locator('xpath=ancestor::section[contains(@class,"teaching-explorer")]')
                original=control.input_value();fixed=section.locator('.teaching-example-output').first.text_content() if section.locator('.teaching-example-output').count() else ''
                for value in result['controls'][n]['options']:
                    control.select_option(value)
                    valid=section.evaluate('''section=>{
                       const select=section.querySelector('select'),key=section.dataset.foundationExplorer||section.dataset.mlExplorer,api=section.dataset.foundationExplorer?FoundationVisuals:MLLearningVisuals;
                       const expected=api.exploration(key,select.value,{statistic:section.dataset.visualStatistic});
                       const code=section.querySelector('.teaching-visual-result pre code');
                       const svg=section.querySelector('.teaching-visual-result svg');
                       return {code:(!code&&!expected.code)||code?.textContent===expected.code,title:svg.getAttribute('aria-label')===expected.summary,live:section.querySelector('.teaching-visual-result').getAttribute('aria-live'),clipped:[...svg.querySelectorAll('text')].filter(e=>{const b=e.getBBox(),v=svg.viewBox.baseVal;return b.x<-.5||b.y<-.5||b.x+b.width>v.width+.5||b.y+b.height>v.height+.5}).map(e=>e.textContent)};
                    }''')
                    after=section.locator('.teaching-example-output').first.text_content() if section.locator('.teaching-example-output').count() else ''
                    assert valid['code'] and valid['title'] and valid['live']=='polite' and after==fixed,(item['id'],width,theme,value,valid)
                    if valid['clipped']:issues.append({'id':item['id'],'width':width,'theme':theme,'state':value,'clipped':valid['clipped']})
                    states.append([item['id'],width,theme,value])
                control.select_option(original)
            # Contact sheets capture each distinct visual in a real lesson.
            key=family+json.dumps(item['visual'],sort_keys=True)
            figure=page.locator('.foundation-content .teaching-overview .teaching-explorer,.foundation-content .teaching-overview .teaching-illustration,.foundation-content .teaching-overview .ml-concept,.foundation-content .teaching-transition .teaching-example').first
            if not figure.count():figure=page.locator('.foundation-content .foundation-data-preview').first
            if theme=='light' and width in [1440,320] and figure.count() and (key,width) not in captured:
                captured.add((key,width));capture_height=max(page.viewport_size['height'],round(figure.bounding_box()['height']+400));page.set_viewport_size({'width':width,'height':capture_height});figure.scroll_into_view_if_needed();name=hashlib.sha256((key+str(width)).encode()).hexdigest()[:14]+'.png';figure.screenshot(path=str(raw/name));page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844});captures.append({'id':item['id'],'width':width,'path':name,'visual':item['visual']})
        print(f'{width}px {theme} {family}: {len(items)} actual lesson contexts',flush=True)
    routes=[('data-foundations','inspect'),('data-foundations','wrangle'),('data-foundations','visualise')]
    routes += [('ml-learn',deck) for deck in page.evaluate('MLLearning.curriculum.decks.map(d=>d.id)')]
    routes += [('ml-learn','collections/'+c) for c in page.evaluate('MLLearning.curriculum.collections.map(c=>c.id)')]
    routes += [('ml-learn','workflows/challenges')]+[('ml-learn','workflows/challenges/'+c) for c in page.evaluate('MLLearning.curriculum.challenges.map(c=>c.id)')]
    for width in [1440,390,320]:
      page.set_viewport_size({'width':width,'height':1000})
      for theme in ['light','dark']:
       for prefix,route in routes:
        page.goto(a.base_url+'/'+prefix+'.html#'+route);page.wait_for_function('!!window.FoundationsCurriculum' if prefix=='data-foundations' else '!!window.MLLearning');page.evaluate('(t)=>AppAppearance.apply(t)',theme);page.evaluate('document.fonts.ready')
        detail=page.evaluate('''()=>{
          const labels=[...document.querySelectorAll('.lesson-card svg text')],canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
          const lowContrast=labels.flatMap(n=>{
            const backgrounds=[];for(let e=n.ownerSVGElement;e;e=e.parentElement)backgrounds.unshift(getComputedStyle(e).backgroundColor);
            ctx.clearRect(0,0,1,1);ctx.fillStyle='#fff';ctx.fillRect(0,0,1,1);for(const color of backgrounds){ctx.fillStyle=color;ctx.fillRect(0,0,1,1)}
            const lum=()=>[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
            const bg=lum();ctx.fillStyle=getComputedStyle(n).fill;ctx.fillRect(0,0,1,1);const fg=lum(),ratio=(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);return ratio<4.5?[{label:n.textContent,ratio}]:[];
          });
          return {overflow:document.documentElement.scrollWidth>innerWidth+1,lowContrast,clipped:labels.filter(n=>{const b=n.getBBox(),svg=n.ownerSVGElement,v=svg.viewBox.baseVal,m=svg.getScreenCTM().inverse().multiply(n.getScreenCTM()),points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return points.some(p=>p.x<-.5||p.y<-.5||p.x>v.width+.5||p.y>v.height+.5)}).map(n=>n.textContent)};
        }''')
        if detail['overflow'] or detail['clipped'] or detail['lowContrast']:issues.append({'catalog':route,'width':width,'theme':theme,**detail})
        catalog.append([prefix,route,width,theme])
    browser.close()

font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for width in [1440,320]:
    batch=[r for r in captures if r['width']==width]
    for start in range(0,len(batch),12):
        sheet=Image.new('RGB',(1600,1400),'#eee');draw=ImageDraw.Draw(sheet)
        for index,r in enumerate(batch[start:start+12]):
            x=(index%4)*400;y=(index//4)*466
            draw.text((x+8,y+6),r['id']+' · '+str(r['visual'].get('variant',r['visual'].get('id','')))[:20],font=font,fill='#111')
            im=Image.open(raw/r['path']).convert('RGB');im.thumbnail((384,425));sheet.paste(im,(x+8,y+32))
        sheet.save(out/f'visuals-{width}-{start//12+1:02}.jpg',quality=85)
receipt={'engine':'Chromium','activities':len(inventory),'renders':len(records),'interactiveStates':len(states),'records':records,'states':states,'captures':captures,'issues':issues,'pageErrors':errors,'catalogViews':catalog,'buildContentId':manifest.get('contentId'),'servedHashes':served_hashes}
(out/('catalog-rendering.json' if a.catalog_only else 'focused-rendering.json' if a.focused else 'all-rendering.json')).write_text(json.dumps(receipt,separators=(',',':'))+'\n')
(out/('catalog-inventory.json' if a.catalog_only else 'visual-inventory.json')).write_text(json.dumps(inventory,separators=(',',':'))+'\n')
assert not errors and not issues,json.dumps({'errors':errors,'issues':issues[:30]},indent=2)
print(len(records),'rendered contexts;',len(states),'interactive states;',len(captures),'visual captures; no errors or discrepancies.')
