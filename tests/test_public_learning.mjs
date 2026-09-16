import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist');
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const files=(await fs.readdir(root)).filter(f=>f.endsWith('.html'));
assert.equal(await fs.stat(path.join(root,'lessons')).then(()=>true,()=>false),false,'Removed lesson library must not ship');
for(const file of files){
 const html=await fs.readFile(path.join(root,file),'utf8');
 assert.ok(!html.includes('lessons/index.html'),file+' must not link to removed library');
 assert.ok(!html.includes('OPTIONAL PATHWAYS · YOUR PACE'),file+' removed tagline');
 if(file!=='offline.html'){
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file);
  assert.ok(sitemap.includes('https://dataplayground.science/'+(file==='index.html'?'':file)),file);
 }
 for(const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
  const url=match[1].replaceAll('&amp;','&');
  if(/^(?:https?:|mailto:|tel:|data:|#)/.test(url))continue;
  const target=path.resolve(root,path.dirname(file),url.split(/[?#]/)[0]);
  assert.ok(target.startsWith(root+'/'),file+' path escape');
  await fs.access(target).catch(()=>assert.fail(file+' broken reference: '+url));
 }
}
assert.match(await fs.readFile(path.join(root,'robots.txt'),'utf8'),/Sitemap:/);
assert.ok(!sitemap.includes('/lessons/'));
console.log('Public pages: canonical URLs, sitemap, link/asset targets and removed-library exclusion passed.');
