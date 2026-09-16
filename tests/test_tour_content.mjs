import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync('tour-content.js','utf8'),sandbox);
const {scenes,chapters} = sandbox.window.TOUR_CONTENT;
assert.equal(chapters.length,24);
for (const group of ['Data','Stats','ML','Learn']) assert.ok(chapters.filter(c=>c.group===group).length>=5,group);
for (const c of chapters) {
  assert.ok(c.title && c.description && c.context);
  for (const profile of ['wide','mobile']) {
    const scene=scenes[c.scene][profile], r=scene.targets[c.focus];
    assert.ok(r && r.w>0 && r.h>0,`${profile}/${c.scene}/${c.focus}`);
    assert.ok(r.x>=0 && r.y>=0 && r.x+r.w<=scene.width+1 && r.y+r.h<=scene.height+1);
    const jpg=fs.readFileSync(`assets/tour-captures/v2-${profile}-${c.scene}.jpg`);
    assert.equal(jpg.readUInt16BE(0),0xffd8);
    let offset=2, size;
    while (offset<jpg.length) {
      const marker=jpg.readUInt16BE(offset), length=jpg.readUInt16BE(offset+2);
      if ([0xffc0,0xffc1,0xffc2].includes(marker)) { size={height:jpg.readUInt16BE(offset+5),width:jpg.readUInt16BE(offset+7)}; break; }
      offset+=length+2;
    }
    assert.equal(size?.width,scene.width,`${profile}/${c.scene} width`);
    assert.equal(size?.height,scene.height,`${profile}/${c.scene} height`);
  }
}
assert.match(chapters[0].description,/STATS/);
assert.ok(chapters.some(c=>c.description.includes('Coming soon')));
assert.ok(chapters.some(c=>c.description.includes('Check answer')));
assert.ok(chapters.some(c=>c.description.includes('0.916')));
console.log('Tour: 24 stops, four sections, paired screenshots and valid focus rectangles.');
