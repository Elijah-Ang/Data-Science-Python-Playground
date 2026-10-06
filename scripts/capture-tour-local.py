"""Local Playwright authoring of exact script-free tour DOM snapshots.

Uses the built site and local Pyodide. This tool is never included in dist.
No live tour executes Python. Only bundled demonstration cells are run here.
"""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8132');p.add_argument('--evidence',default='../evidence/tour-target-audit.json');a=p.parse_args()
freeze='''() => {
 const d=document,clone=d.documentElement.cloneNode(true),originals=[...d.querySelectorAll('input,textarea,select')];
 clone.querySelectorAll('input,textarea,select').forEach((n,i)=>{const s=originals[i];if(n.tagName==='SELECT')[...n.options].forEach((o,j)=>o.toggleAttribute('selected',s.options[j].selected));else if(n.tagName==='TEXTAREA')n.textContent=s.value;else{n.setAttribute('value',s.value);n.toggleAttribute('checked',s.checked);}});
 const canvases=[...d.querySelectorAll('canvas')];clone.querySelectorAll('canvas').forEach((n,i)=>{const img=d.createElement('img');for(const a of [...n.attributes])img.setAttribute(a.name,a.value);img.src=canvases[i].toDataURL();img.width=canvases[i].width;img.height=canvases[i].height;n.replaceWith(img);});
 clone.querySelectorAll('[src],[href]').forEach(n=>{for(const key of ['src','href']){const value=n.getAttribute(key);if(value?.startsWith(location.origin+'/'))n.setAttribute(key,value.slice(location.origin.length+1));}});
 clone.querySelectorAll('script,base,link[rel="modulepreload"],link[rel="preload"][as="script"]').forEach(n=>n.remove());
 clone.querySelectorAll('*').forEach(n=>{for(const attr of [...n.attributes])if(/^on/i.test(attr.name)||/^javascript:/i.test(attr.value))n.removeAttribute(attr.name);});
 const base=d.createElement('base');base.href='../../';clone.querySelector('head').prepend(base);
 const robots=d.createElement('meta');robots.name='robots';robots.content='noindex';clone.querySelector('head').append(robots);
 clone.querySelectorAll('a,button,input,textarea,select,form').forEach(n=>n.setAttribute('inert',''));
 return '<!doctype html>'+clone.outerHTML;
}'''
receipts=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch()
 for profile,width,height in [('wide',1440,960),('mobile',390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce',service_workers='block');loaded=''
  chapters=None
  page.goto(a.base_url+'/index.html');page.add_script_tag(content=(ROOT/'tour-content.js').read_text());chapters=page.evaluate('TOUR_CONTENT.chapters')
  for i,chapter in enumerate(chapters):
   # The location map is authored once and is shared with the published tour.
   if i==0:
    page.add_script_tag(content=(ROOT/'tour-pages.js').read_text());locations=page.evaluate('TOUR_PAGES.locations')
   filename=locations[chapter['scene']]['page']
   if loaded!=filename:
    page.goto(a.base_url+'/'+filename+'?tour=1&runtime=local');page.add_script_tag(content=(ROOT/'scripts/tour-capture-pages.js').read_text());loaded=filename
   print(profile,i+1,chapter['scene'],chapter['focus'],flush=True)
   bounds=page.evaluate('''async chapter=>{
     const node=await TOUR_PAGES.prepare({contentDocument:document,contentWindow:window},chapter,()=>true,()=>{});
     const r=node.getBoundingClientRect(),s=getComputedStyle(node);
     return {tag:node.tagName,width:r.width,height:r.height,display:s.display,visibility:s.visibility};
   }''',chapter)
   assert bounds['width']>1 and bounds['height']>1 and bounds['display']!='none' and bounds['visibility']!='hidden',(profile,chapter,bounds)
   snapshot=page.evaluate(freeze);assert '<script' not in snapshot.lower();assert a.base_url not in snapshot
   name=profile+'-'+chapter['scene']+'-'+chapter['focus']+'.html';(ROOT/'assets/tour-snapshots'/name).write_text(snapshot)
   receipts.append({'profile':profile,'chapter':i+1,'scene':chapter['scene'],'focus':chapter['focus'],'page':filename,'selector':locations[chapter['scene']]['targets'][chapter['focus']],'bounds':bounds,'snapshot':name})
  page.close()
 browser.close()
Path(a.evidence).write_text(json.dumps({'actual_targets':receipts,'count':len(receipts),'source':'Current isolated preview DOM, bundled synthetic/demo runs in authoring only.'},indent=2)+'\n')
print('50 current actual-interface script-free snapshots and target receipts saved.')
