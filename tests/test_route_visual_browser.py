"""Rendered gradient, focus and reduced-motion regression in the real routes."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
p=argparse.ArgumentParser();p.add_argument('--engine',required=True);p.add_argument('--base-url',default='http://127.0.0.1:8152');p.add_argument('--evidence-dir',default='../evidence');a=p.parse_args();out=Path(a.evidence_dir);out.mkdir(parents=True,exist_ok=True);records=[]
with sync_playwright() as pw:
 b=getattr(pw,a.engine).launch()
 for name in ['playground','statistics','ml']:
  ctx=b.new_context(viewport={'width':1440,'height':1000},service_workers='block',reduced_motion='reduce');pg=ctx.new_page();pg.goto(a.base_url+'/'+name+'.html?runtime=local');pg.wait_for_function("document.querySelector('#runtimeDot').classList.contains('ready') && Number(document.querySelector('.step-route-range').max)>0",timeout=180000)
  for theme in ['light','dark']:
   pg.evaluate('(t)=>AppAppearance.apply(t)',theme);slider=pg.locator('.step-route-range');slider.press('Home');rail=pg.locator('.step-route-rail');pg.evaluate('document.fonts.ready');pg.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   assert slider.evaluate('(n)=>getComputedStyle(n).outlineWidth')=='0px'
   assert slider.evaluate('(n)=>getComputedStyle(n).transitionDuration.split(",").every(s=>parseFloat(s)<=.0001)')
   first=out/f'{a.engine}-{name}-{theme}-gradient-start.png';rail.screenshot(path=str(first))
   slider.evaluate('(n)=>n.blur()');unfocused=out/f'{a.engine}-{name}-{theme}-gradient-unfocused.png';rail.screenshot(path=str(unfocused))
   focus_diff=ImageChops.difference(Image.open(first).convert('RGB'),Image.open(unfocused).convert('RGB'))
   # Ignore tiny compositor rounding; a visible focus mark must exceed this noise.
   focus_box=focus_diff.point(lambda v:255 if v>2 else 0).getbbox()
   assert focus_box and focus_box[2]-focus_box[0]<=36,(name,theme,'Keyboard focus must paint visibly around the thumb only',focus_box)
   slider.press('End');last=out/f'{a.engine}-{name}-{theme}-gradient-end.png';rail.screenshot(path=str(last))
   im=Image.open(first).convert('RGB');end=Image.open(last).convert('RGB');w,h=im.size;y=16;n=int(slider.get_attribute('max'))
   dots=[9.5+(w-19)*i/n for i in range(n+1)];safe=[i for i in range(28,w-28) if min(abs(i-x) for x in dots)>7]
   assert len(safe)>30
   maximum=max(max(abs(x-z) for x,z in zip(im.getpixel((i,y)),im.getpixel((i+1,y)))) for i in safe if i+1 in safe)
   assert maximum<=4,(name,theme,'gradient discontinuity',maximum)
   positions=[safe[round((len(safe)-1)*q)] for q in [.1,.3,.5,.7,.9]];palette=[im.getpixel((x,y)) for x in positions]
   end_palette=[end.getpixel((x,y)) for x in positions]
   retention_delta=max(abs(a-b) for start,finish in zip(palette,end_palette) for a,b in zip(start,finish))
   assert len(set(palette))>=4 and retention_delta<=2,(name,theme,palette,end_palette,retention_delta)
   records.append({'page':name,'theme':theme,'smooth_full_gradient':True,'past_colours_retained':True,'maximum_neighbour_channel_change':maximum,'palette':palette,'end_palette':end_palette,'maximum_retention_channel_change':retention_delta,'reduced_motion':True,'visible_thumb_focus_pixels':focus_box,'compositor_noise_threshold':2,'no_bulky_rail_outline':True,'rail_height':h,'rail_width':w})
  ctx.close()
 b.close()
(out/f'rail-visual-{a.engine}.json').write_text(json.dumps(records,indent=2)+'\n');print(a.engine,'PASS permanent smooth gradient, contrast-backed focus and reduced motion all3 themes',flush=True)
