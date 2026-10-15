"""Verify the scoped operation-table header fix in every affected lesson.

Compare the prior asset manifest/CSS, then exercise all 44 real Follow pages at
three widths in both themes. JavaScript and JSON must remain byte-identical.
"""
import argparse
import difflib
import hashlib
import json
import re
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--base-url',default='http://127.0.0.1:8015')
p.add_argument('--before-manifest',default='/tmp/stage-css-before-manifest.json')
p.add_argument('--before-css',default='/tmp/stage-css-before-foundations.css')
p.add_argument('--output',default='docs/curriculum-evidence/stage-visuals')
a=p.parse_args()
out=ROOT/a.output
out.mkdir(parents=True,exist_ok=True)
before=json.loads(Path(a.before_manifest).read_text())
old_css=Path(a.before_css).read_text()
records,states,errors,issues=[],[],[],[]
CHECK=r'''()=>{
  const content=document.querySelector('.foundation-content');
  const panel=content.querySelector('[data-operation-explorer]');
  const headers=[...panel.querySelectorAll('.operation-table thead code')]
    .map(n=>({text:n.textContent,rects:n.getClientRects().length,
      whiteSpace:getComputedStyle(n).whiteSpace,
      overflowWrap:getComputedStyle(n).overflowWrap}));
  const tables=[...panel.querySelectorAll('.operation-table-scroll')].map(n=>{
    const overflow=n.scrollWidth>n.clientWidth+1;
    n.scrollLeft=n.scrollWidth;const canPan=!overflow||n.scrollLeft>0;n.scrollLeft=0;
    return {overflow,canPan,width:n.clientWidth,scrollWidth:n.scrollWidth};
  });
  return {stage:content.dataset.learningStage,headers,tables,
    overflow:Math.max(document.documentElement.scrollWidth,
      document.body.scrollWidth)>innerWidth+1};
}'''

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'))
    page=browser.new_page(service_workers='block',reduced_motion='reduce')
    page.on('pageerror',lambda e:errors.append(str(e)))
    manifest=page.request.get(a.base_url+'/asset-manifest.json').json()
    bm={x['path']:x['sha256'] for x in before['files']}
    am={x['path']:x['sha256'] for x in manifest['files']}
    changed=[name for name in sorted(set(bm)|set(am)) if bm.get(name)!=am.get(name)]
    assert changed==['foundations/foundations.css'],changed
    new_css=page.request.get(a.base_url+'/foundations/foundations.css').text()
    selector='.foundation-content .operation-table thead code.code-identifier'
    rule=re.compile(re.escape(selector)+r'\s*\{\s*white-space\s*:\s*nowrap\s*;\s*overflow-wrap\s*:\s*normal\s*;?\s*\}')
    assert len(rule.findall(new_css))==1,'One scoped rule expected'
    squash=lambda s:re.sub(r'\s+','',re.sub(r'/\*[\s\S]*?\*/','',s))
    assert squash(rule.sub('',new_css))==squash(old_css),'Only the scoped declaration may change'
    page.goto(a.base_url+'/data-foundations.html')
    page.wait_for_function('!!window.FoundationOperationVisuals')
    inventory=page.evaluate('''FoundationOperationVisuals.ids.map(id=>{
      const l=FoundationsCurriculum.lessons.find(l=>l.id===id);
      return {lesson:id,id:l.rounds[0].id,title:l.title,deck:l.deck};
    })''')
    assert len(inventory)==44,len(inventory)
    for width in [1440,390,320]:
      page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
      for theme in ['light','dark']:
        page.evaluate('(t)=>AppAppearance.apply(t)',theme)
        for item in inventory:
          page.evaluate('(x)=>location.hash=`#${x.deck}/${x.lesson}/0`',item)
          page.wait_for_selector('[data-operation-explorer="'+item['lesson']+'"]')
          page.evaluate('document.fonts.ready')
          control=page.locator('[data-operation-choice]')
          options=control.locator('option').evaluate_all('ns=>ns.map(n=>n.value)')
          original=control.input_value()
          for choice in options:
            control.select_option(choice)
            state=page.evaluate(CHECK)
            bad=[h for h in state['headers'] if h['rects']!=1 or
                 h['whiteSpace']!='nowrap' or h['overflowWrap']!='normal']
            if bad or state['overflow'] or state['stage']!='follow' or any(not t['canPan'] for t in state['tables']):
                issues.append({'id':item['id'],'width':width,'theme':theme,'choice':choice,**state})
            states.append({'id':item['id'],'width':width,'theme':theme,'choice':choice,
                           'headers':len(state['headers']),
                           'panningTables':sum(t['overflow'] for t in state['tables'])})
          control.select_option(original)
          records.append({'id':item['id'],'width':width,'theme':theme,'choices':len(options)})
        print(f'{width}px {theme}: all44operationFollowcontexts andallheaderstates',flush=True)
    end=page.request.get(a.base_url+'/asset-manifest.json').json()
    assert end['contentId']==manifest['contentId']
    current_css=page.request.get(a.base_url+'/foundations/foundations.css').body()
    assert hashlib.sha256(current_css).hexdigest()==am['foundations/foundations.css']
    browser.close()

receipt={'buildContentId':manifest['contentId'],'beforeBuildContentId':before['contentId'],
         'changedAssets':changed,'changedRule':selector,
         'declarations':{'white-space':'nowrap','overflow-wrap':'normal'},
         'scriptAndDataAssetsUnchanged':True,'activities':len(inventory),
         'renders':len(records),'interactiveStates':len(states),'records':records,
         'states':states,'issues':issues,'pageErrors':errors,
         'cssBefore':bm['foundations/foundations.css'],
         'cssAfter':am['foundations/foundations.css'],
         'servedAssetsUnchangedAtCompletion':True}
(out/'css-followup.json').write_text(json.dumps(receipt,separators=(',',':'))+'\n')
(out/'css-followup.diff').write_text(''.join(difflib.unified_diff(
    old_css.splitlines(True),new_css.splitlines(True),
    fromfile='534512 foundations.css',tofile=manifest['contentId'][:12]+' foundations.css')))
assert not issues and not errors,json.dumps({'issues':issues[:10],'errors':errors},indent=2)
print(f'{len(records)} actual operation lesson contexts, {len(states)} option states; '
      'all coded headers stay on one line, with local table panning and no page overflow.')
