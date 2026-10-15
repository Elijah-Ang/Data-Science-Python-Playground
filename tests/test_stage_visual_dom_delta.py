"""Prove a small final teaching correction leaves other rendered activities intact.

The before snapshot contains actual article DOM for all 676 lesson activities.
The after run compares the same routes, normalising only generated SVG marker
IDs, then renders every changed activity at three widths in both themes.
"""
import argparse
import difflib
import hashlib
import json
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('mode', choices=['before','after'])
parser.add_argument('--base-url', default='http://127.0.0.1:8015')
parser.add_argument('--snapshot', default='/tmp/stage-visual-dom-before.json')
parser.add_argument('--output', default='docs/curriculum-evidence/stage-visuals')
parser.add_argument('--expected-changed', nargs='+', default=['I01CSV-1','I17-1','W13-1'])
args = parser.parse_args()
out = ROOT / args.output
snapshot = Path(args.snapshot)
records, errors, targeted = [], [], []

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'))
    page = browser.new_page(viewport={'width':1440,'height':1000},
                            service_workers='block',reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    manifest = page.request.get(args.base_url+'/asset-manifest.json').json()
    inventory = []
    for family in ['data','ml']:
        prefix = 'data-foundations' if family=='data' else 'ml-learn'
        page.goto(args.base_url+'/'+prefix+'.html')
        page.wait_for_function('!!window.FoundationsCurriculum' if family=='data'
                               else '!!window.MLLearning')
        page.evaluate('AppAppearance.apply("light")')
        items = page.evaluate('''family=>family==='data'?
          FoundationsCurriculum.lessons.flatMap(l=>l.rounds.map((r,index)=>({
            id:r.id,lesson:l.id,title:l.title,deck:l.deck,index,family,
            follow:!l.review&&index===0}))):
          MLLearning.curriculum.cards.flatMap(c=>c.exercises.map((e,index)=>({
            id:e.id,lesson:c.id,title:c.title,deck:c.deck,index,family,
            follow:c.kind==='teaching'&&index===0,visualTeaching:e.visualTeaching||null})))''',family)
        inventory.extend(items)
        for item in items:
            page.evaluate('(x)=>location.hash=`#${x.deck}/${x.lesson}/${x.index}`', item)
            if family=='ml':
                page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=item['id'])
            else:
                page.wait_for_function('''x=>document.querySelector(
                  '.foundation-lesson-heading h2')?.textContent===x.title&&
                  [...document.querySelectorAll('.foundation-practices li')]
                    .findIndex(n=>n.hasAttribute('aria-current'))===x.index''',arg=item)
            html = page.evaluate(r'''()=>document.querySelector('.foundation-content')
              .innerHTML.replace(/ml-arrow-\d+/g,'ml-arrow-GENERATED')''')
            records.append({'id':item['id'],'html':html,
                            'sha256':hashlib.sha256(html.encode()).hexdigest()})
        print(f'{args.mode}: {family}, {len(items)} actual article DOM snapshots',flush=True)

    result = {'buildContentId':manifest.get('contentId'),'assetManifest':manifest,'records':records,
              'pageErrors':errors,'normalisation':'Only generated ml-arrow numeric SVG marker IDs.'}
    if args.mode=='before':
        assert not errors,errors
        snapshot.write_text(json.dumps(result,separators=(',',':'))+'\n')
    else:
        previous = json.loads(snapshot.read_text())
        old = {r['id']:r for r in previous['records']}
        before_assets={r['path']:r['sha256'] for r in previous['assetManifest']['files']}
        after_assets={r['path']:r['sha256'] for r in manifest['files']}
        changed_assets=[name for name in sorted(set(before_assets)|set(after_assets))
                        if before_assets.get(name)!=after_assets.get(name)]
        assert not any(name.endswith('.css') for name in changed_assets), changed_assets
        changed = [r['id'] for r in records if r['sha256']!=old[r['id']]['sha256']]
        assert set(changed)==set(args.expected_changed),changed
        for width in [1440,390,320]:
            page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
            for theme in ['light','dark']:
                for family in ['data','ml']:
                    prefix='data-foundations' if family=='data' else 'ml-learn'
                    page.goto(args.base_url+'/'+prefix+'.html')
                    page.wait_for_function('!!window.FoundationsCurriculum' if family=='data'
                                           else '!!window.MLLearning')
                    page.evaluate('(t)=>AppAppearance.apply(t)',theme)
                    for item in inventory:
                        if item['id'] not in changed or item['family']!=family:
                            continue
                        page.evaluate('(x)=>location.hash=`#${x.deck}/${x.lesson}/${x.index}`',item)
                        if family=='ml':
                            page.wait_for_function('(id)=>MLLearning.activity?.id===id',arg=item['id'])
                        else:
                            page.wait_for_function('(t)=>document.querySelector(".foundation-lesson-heading h2")?.textContent===t',arg=item['title'])
                        state = page.evaluate('''()=>{
                          const content=document.querySelector('.foundation-content');
                          const visual=content.querySelector('.teaching-overview');
                          const preview=content.querySelector('.foundation-data-preview');
                          const task=content.querySelector('.foundation-task-reminder');
                          return {stage:content.dataset.learningStage,
                            overview:!!visual,defaultPolicyOnly:!visual?.querySelector('.teaching-flags'),
                            taskOrder:!preview||preview.nextElementSibling===task,
                            overflow:document.documentElement.scrollWidth>innerWidth+1,
                            clipped:[...content.querySelectorAll('svg text')].filter(n=>{
                              const b=n.getBBox(),svg=n.ownerSVGElement,v=svg.viewBox.baseVal;
                              if(!v.width||!b.width)return false;
                              const m=svg.getScreenCTM().inverse().multiply(n.getScreenCTM());
                              return [[b.x,b.y],[b.x+b.width,b.y],
                                [b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]
                                .map(([x,y])=>new DOMPoint(x,y).matrixTransform(m))
                                .some(p=>p.x<-.75||p.y<-.75||p.x>v.width+.75||p.y>v.height+.75);
                            }).map(n=>n.textContent),
                            example:visual?.querySelector('.teaching-example')?.innerText};
                        }''')
                        assert state['overview']==item['follow'] and state['taskOrder'] and not state['overflow'] and not state['clipped'],(item,width,theme,state)
                        if item['id']=='I17-1':assert state['defaultPolicyOnly'],state
                        targeted.append({'id':item['id'],'width':width,'theme':theme,**state})
        result['beforeBuildContentId']=previous['buildContentId']
        result['changedAssets']=changed_assets
        result['stylesheetsUnchanged']=True
        result.pop('assetManifest')
        result['changed']=changed
        result['unchanged']=len(records)-len(changed)
        result['targetedRenders']=targeted
        result['records']=[{'id':r['id'],'before':old[r['id']]['sha256'],
                            'after':r['sha256']} for r in records]
        out.mkdir(parents=True,exist_ok=True)
        (out/'final-delta.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
        diffs=[]
        for record in records:
            if record['id'] in changed:
                diffs.extend(difflib.unified_diff(
                    old[record['id']]['html'].replace('><','>\n<').splitlines(True),
                    record['html'].replace('><','>\n<').splitlines(True),
                    fromfile=record['id']+' before',tofile=record['id']+' after'))
        (out/'final-delta.diff').write_text(''.join(diffs))
        assert not errors,errors
        print(f'{len(changed)} changed activities, {result["unchanged"]} exact unchanged article DOMs; '
              f'{len(targeted)} changed-page renders passed.')
    browser.close()
