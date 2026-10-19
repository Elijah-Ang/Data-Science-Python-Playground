"""Inspect the actual SVG geometry of every offered plot/model combination."""

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument("--base-url", default="http://127.0.0.1:8015")
p.add_argument(
    "--output", type=Path, default=ROOT / "tests/evidence/plot-polish/bounds.json"
)
p.add_argument("--widths", nargs="+", type=int, default=[1440, 390, 320])
args = p.parse_args()
records, failures = [], []
SCRIPT = r"""family => {
 const api=family==='data'?FoundationVisuals:MLLearningVisuals;
 const fields=family==='data'?api.plotArguments:api.modelArguments;
 const model=family==='data'?api.plotArgumentModel:api.modelArgumentModel;
 const expand=(fs,s={},i=0)=>i===fs.length?[s]:fs[i].options.flatMap(([v])=>expand(fs,{...s,[fs[i].key]:String(v)},i+1));
 const target=document.querySelector('.teaching-visual-result');
 const records=[],failures=[];
 const absolute=(node,svg)=>{
  const b=node.getBBox(),m=svg.getScreenCTM().inverse().multiply(node.getScreenCTM());
  const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
  return {left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
 };
 for(const id of Object.keys(api.explorerSpecs)){
 const settings=family==='data'&&id==='histogram'?{choices:api.explorerSpecs.histogram.options.map(o=>o[0])}:{};
 for(const state of expand(fields(id,{},settings))) {
  const added=fields(id,state,settings).filter(f=>!(f.key in state));
  for(const actual of expand(added,state)){
   const result=family==='ml'&&api.explorerSpecs[id].static?api.exploration(id,api.explorerSpecs[id].options[0][0]):model(id,actual,settings);target.innerHTML=result.svg;
   const svg=target.querySelector('svg'),v=svg?.viewBox.baseVal;
   const problem=[];
   if(svg)for(const n of svg.querySelectorAll('text,rect,circle,ellipse,path,line,polygon,polyline')){
    if(n.closest('defs,clipPath'))continue;
    const b=absolute(n,svg);if(!Object.values(b).every(Number.isFinite))problem.push({reason:'nonfinite',node:n.outerHTML});
    else if(b.left<-.75||b.top<-.75||b.right>v.width+.75||b.bottom>v.height+.75)problem.push({reason:'outside SVG',bounds:b,node:n.outerHTML});
   }
   if(family==='data'&&['histogram','count-bars','mean-bars','exact-bars','stacked'].includes(id)){
    const axis=[...svg.querySelectorAll('path')].find(n=>/^M[\d. -]+v[\d.]+h[\d.]+$/.test(n.getAttribute('d')));
    if(axis){const a=absolute(axis,svg);for(const bar of svg.querySelectorAll('rect.visual-fill,rect.visual-hatch')){
     const b=absolute(bar,svg);
     if(id==='stacked'&&b.bottom<a.top)continue; // Legend swatches are not bars.
     if(id==='stacked'&&b.top<a.top)problem.push({reason:'stack exceeds axis',bounds:b,axis:a});
     if(b.bottom>a.bottom+.01||b.left<a.left-.01||b.right>a.right+.01)problem.push({reason:'bar exceeds axis',bounds:b,axis:a});
     if(id!=='stacked'&&Math.abs(b.bottom-a.bottom)>.01)problem.push({reason:'bar baseline differs from axis',bounds:b,axis:a});
    }}
   }
   const record={family,id,state:actual,marks:svg?.querySelectorAll('path,rect,circle,line,polygon,polyline').length||0};
   records.push(record);if(problem.length)failures.push({...record,problems:problem});
  }
 }
 }
 return {records,failures};
}"""
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path="/usr/bin/chromium")
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    for family, route in [
        ("data", "data-foundations.html#visualise/V04/0"),
        ("ml", "ml-learn.html#classification/ML-C11/0"),
    ]:
        page.goto(args.base_url + "/" + route)
        page.wait_for_selector(".teaching-visual-result")
        page.evaluate("document.fonts.ready")
        for width in args.widths:
            page.set_viewport_size({"width": width, "height": 1000})
            for theme in ["light", "dark"]:
                page.evaluate("(t)=>AppAppearance.apply(t)", theme)
                result = page.evaluate(SCRIPT, family)
                records.extend(
                    dict(row, width=width, theme=theme) for row in result["records"]
                )
                failures.extend(
                    dict(row, width=width, theme=theme) for row in result["failures"]
                )
    browser.close()
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(
    json.dumps(dict(records=records, failures=failures), separators=(",", ":")) + "\n"
)
print(
    json.dumps(
        dict(states=len(records), failures=len(failures), examples=failures[:3]),
        indent=2,
    )
)
assert not failures, str(args.output)
